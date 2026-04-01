// Find My Build — rank all catalog frames by quiz profile (heavy; run in worker).

import { RACQUETS } from '../data/loader.js';
import type { Racquet } from '../engine/types.js';
import { generateTopBuilds } from './top-builds.js';
import type { Build } from './top-builds.js';

export type FmbRankProfile = {
  statPriorities: Record<string, number>;
  minThresholds: Record<string, number>;
  sortBy: string;
  notes: string[];
};

export type FmbRankedFrame = {
  racquet: Racquet;
  score: number;
  topBuilds: Build[];
};

/**
 * Rank frames for FMB results — O(frames × topBuilds work).
 */
export function rankFramesForFmb(profile: FmbRankProfile): FmbRankedFrame[] {
  const ranked = (RACQUETS as unknown as Racquet[]).map(racquet => {
    const topBuilds = generateTopBuilds(racquet, 3);

    let score = 0;
    if (topBuilds.length > 0) {
      const bestBuild = topBuilds[0];
      const stats = bestBuild.stats as unknown as Record<string, number>;

      Object.entries(profile.statPriorities).forEach(([stat, weight]) => {
        score += (stats[stat] || 0) * weight;
      });

      Object.entries(profile.minThresholds).forEach(([stat, min]) => {
        const val = stats[stat] || 0;
        if (val < min) score -= (min - val) * 2;
      });

      score += bestBuild.score * 0.5;
    }

    return { racquet, score, topBuilds };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, 5);
}
