// Main-thread facade: module worker + sync fallback when Workers are unavailable.

import { RACQUETS, STRINGS } from '../data/loader.js';
import type { Racquet } from '../engine/types.js';
import { rankFramesForFmb, type FmbRankProfile, type FmbRankedFrame } from '../compute/fmb-rank.js';
import { runOptimizerScan, type OptimizerScanParams, type OptimizerScanCandidateDTO } from '../compute/optimizer-scan.js';
import { computeLeaderboardBuildResults, type LeaderboardBuildComputeResult } from '../compute/leaderboard-builds.js';
import { buildRecommendationPoolForRacquet } from '../compute/recommendation-pool.js';
import type {
  WorkerJob,
  WorkerResult,
  MainToWorker,
  WorkerToMain,
} from './engine-worker-protocol.js';

let worker: Worker | null = null;
let seqCounter = 0;
const pending = new Map<number, { resolve: (r: WorkerResult) => void; reject: (e: Error) => void }>();

function resetWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('./engine-worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (ev: MessageEvent<WorkerToMain>) => {
      const data = ev.data;
      const entry = pending.get(data.seq);
      if (!entry) return;
      pending.delete(data.seq);
      if (data.ok) entry.resolve(data.result);
      else entry.reject(new Error(data.error));
    };
    worker.onerror = (err) => {
      pending.forEach((p) => p.reject(new Error(err.message || 'Worker error')));
      pending.clear();
      resetWorker();
    };
  }
  return worker;
}

function runSyncFallback(job: WorkerJob): WorkerResult {
  switch (job.kind) {
    case 'fmbRank':
      return { kind: 'fmbRank', frames: rankFramesForFmb(job.profile) };
    case 'optimizerScan':
      return { kind: 'optimizerScan', candidates: runOptimizerScan(job.params) };
    case 'leaderboardBuilds':
      return {
        kind: 'leaderboardBuilds',
        results: computeLeaderboardBuildResults(job.statKey, job.filterType),
      };
    case 'recommendationPool': {
      const racquet =
        (RACQUETS as unknown as Racquet[]).find((r) => r.id === job.racquetId) ||
        (RACQUETS[0] as unknown as Racquet);
      return { kind: 'recommendationPool', pool: buildRecommendationPoolForRacquet(racquet) };
    }
  }
}

function postEngineJob(job: WorkerJob): Promise<WorkerResult> {
  const w = getWorker();
  if (!w) {
    return Promise.resolve(runSyncFallback(job));
  }
  const seq = ++seqCounter;
  const workerJob = new Promise<WorkerResult>((resolve, reject) => {
    pending.set(seq, { resolve, reject });
    const msg: MainToWorker = { seq, action: 'run', job };
    w.postMessage(msg);
  });
  return workerJob.catch((error) => {
    pending.delete(seq);
    resetWorker();
    return runSyncFallback(job);
  });
}

export async function runFmbRankAsync(profile: FmbRankProfile): Promise<FmbRankedFrame[]> {
  const r = await postEngineJob({ kind: 'fmbRank', profile });
  if (r.kind !== 'fmbRank') throw new Error('Unexpected worker result');
  return r.frames;
}

export async function runOptimizerScanAsync(params: OptimizerScanParams): Promise<OptimizerScanCandidateDTO[]> {
  const r = await postEngineJob({ kind: 'optimizerScan', params });
  if (r.kind !== 'optimizerScan') throw new Error('Unexpected worker result');
  return r.candidates;
}

export async function runLeaderboardBuildsAsync(
  statKey: string,
  filterType: 'both' | 'full' | 'hybrid',
): Promise<LeaderboardBuildComputeResult[]> {
  const r = await postEngineJob({ kind: 'leaderboardBuilds', statKey, filterType });
  if (r.kind !== 'leaderboardBuilds') throw new Error('Unexpected worker result');
  return r.results;
}

export async function runRecommendationPoolAsync(racquetId: string): Promise<
  ReturnType<typeof buildRecommendationPoolForRacquet>
> {
  const r = await postEngineJob({ kind: 'recommendationPool', racquetId });
  if (r.kind !== 'recommendationPool') throw new Error('Unexpected worker result');
  return r.pool;
}

/** Map optimizer DTOs to UI candidates (rehydrate string objects from catalog). */
export function optimizerDtosToCandidates(
  dtos: OptimizerScanCandidateDTO[],
  racquet: Racquet,
): Array<{
  type: 'full' | 'hybrid';
  label: string;
  gauge?: string;
  tension: number;
  crossesTension?: number;
  score: number;
  stats: import('../engine/types.js').SetupAttributes;
  stringData?: import('../engine/types.js').StringData;
  mainsData?: import('../engine/types.js').StringData;
  crossesData?: import('../engine/types.js').StringData;
  racquet: Racquet;
}> {
  return dtos.map((d) => {
    if (d.type === 'full') {
      const stringData = STRINGS.find((s) => s.id === d.stringDataId);
      if (!stringData) {
        throw new Error(`Missing string ${d.stringDataId}`);
      }
      return {
        type: 'full' as const,
        label: d.label,
        gauge: d.gauge,
        tension: d.tension,
        crossesTension: d.crossesTension,
        score: d.score,
        stats: d.stats,
        stringData,
        racquet,
      };
    }
    const mainsData = STRINGS.find((s) => s.id === d.mainsDataId);
    const crossesData = STRINGS.find((s) => s.id === d.crossesDataId);
    if (!mainsData || !crossesData) {
      throw new Error('Missing hybrid string data');
    }
    return {
      type: 'hybrid' as const,
      label: d.label,
      gauge: d.gauge,
      tension: d.tension,
      crossesTension: d.crossesTension,
      score: d.score,
      stats: d.stats,
      mainsData,
      crossesData,
      racquet,
    };
  });
}
