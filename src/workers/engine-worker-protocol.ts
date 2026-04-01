// Typed postMessage protocol for engine Web Worker (main + worker share this module).

import type { FmbRankProfile, FmbRankedFrame } from '../compute/fmb-rank.js';
import type { OptimizerScanParams, OptimizerScanCandidateDTO } from '../compute/optimizer-scan.js';
import type { LeaderboardBuildComputeResult } from '../compute/leaderboard-builds.js';
import type { RecommendationPoolCandidate } from '../compute/recommendation-pool.js';

export type WorkerJob =
  | { kind: 'fmbRank'; profile: FmbRankProfile }
  | { kind: 'optimizerScan'; params: OptimizerScanParams }
  | { kind: 'leaderboardBuilds'; statKey: string; filterType: 'both' | 'full' | 'hybrid' }
  | { kind: 'recommendationPool'; racquetId: string };

export type WorkerResult =
  | { kind: 'fmbRank'; frames: FmbRankedFrame[] }
  | { kind: 'optimizerScan'; candidates: OptimizerScanCandidateDTO[] }
  | { kind: 'leaderboardBuilds'; results: LeaderboardBuildComputeResult[] }
  | {
      kind: 'recommendationPool';
      pool: {
        fullBed: RecommendationPoolCandidate[];
        hybrid: RecommendationPoolCandidate[];
        all: RecommendationPoolCandidate[];
      };
    };

export type MainToWorker =
  | { seq: number; action: 'run'; job: WorkerJob }
  | { action: 'abort' };

export type WorkerToMain =
  | { seq: number; ok: true; result: WorkerResult }
  | { seq: number; ok: false; error: string };
