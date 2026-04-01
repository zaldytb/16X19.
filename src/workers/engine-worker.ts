// Engine batch math — runs off the UI thread (Vite module worker).

import { rankFramesForFmb } from '../compute/fmb-rank.js';
import { runOptimizerScan } from '../compute/optimizer-scan.js';
import { computeLeaderboardBuildResults } from '../compute/leaderboard-builds.js';
import { buildRecommendationPoolForRacquet } from '../compute/recommendation-pool.js';
import { RACQUETS } from '../data/loader.js';
import type { Racquet } from '../engine/types.js';
import type { SetupStats } from '../engine/types.js';
import { toSetupAttributes } from '../compute/setup-attributes.js';
import type { Build } from '../compute/top-builds.js';
import type { MainToWorker, WorkerToMain, WorkerJob, WorkerResult } from './engine-worker-protocol.js';

function leanBuild(b: Build): Build {
  return {
    ...b,
    stats: { ...toSetupAttributes(b.stats) } as SetupStats,
  };
}

function runJob(job: WorkerJob): WorkerResult {
  switch (job.kind) {
    case 'fmbRank': {
      const frames = rankFramesForFmb(job.profile);
      return {
        kind: 'fmbRank',
        frames: frames.map((f) => ({
          racquet: f.racquet,
          score: f.score,
          topBuilds: f.topBuilds.map(leanBuild),
        })),
      };
    }
    case 'optimizerScan':
      return { kind: 'optimizerScan', candidates: runOptimizerScan(job.params) };
    case 'leaderboardBuilds':
      return {
        kind: 'leaderboardBuilds',
        results: computeLeaderboardBuildResults(job.statKey, job.filterType).map((r) => ({
          ...r,
          stats: { ...toSetupAttributes(r.stats) } as SetupStats,
        })),
      };
    case 'recommendationPool': {
      const racquet =
        (RACQUETS as unknown as Racquet[]).find((r) => r.id === job.racquetId) ||
        (RACQUETS[0] as unknown as Racquet);
      return { kind: 'recommendationPool', pool: buildRecommendationPoolForRacquet(racquet) };
    }
  }
}

self.onmessage = (ev: MessageEvent<MainToWorker>) => {
  const data = ev.data;
  if (data.action === 'abort') return;
  if (data.action !== 'run') return;
  const seq = data.seq;
  try {
    const result = runJob(data.job);
    const msg: WorkerToMain = { seq, ok: true, result };
    self.postMessage(msg);
  } catch (e) {
    const msg: WorkerToMain = { seq, ok: false, error: (e as Error).message || String(e) };
    self.postMessage(msg);
  }
};
