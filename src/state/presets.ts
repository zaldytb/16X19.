// Preset / Top Builds Generation
// ===============================
// Generates recommended string setups for racquets

export type { Build } from '../compute/top-builds.js';
export { generateTopBuilds, pickDiverseBuilds } from '../compute/top-builds.js';

import type { Build } from '../compute/top-builds.js';

/** Archetype colors for build cards (Digicraft Brutalism palette) */
export const ARCHETYPE_COLORS: Record<string, string> = {
  'Spin Focus': 'rgba(220, 223, 226, 0.9)',
  'Control Focus': 'rgba(220, 223, 226, 0.8)',
  'Power Focus': 'rgba(220, 223, 226, 0.7)',
  'Comfort Build': 'rgba(220, 223, 226, 0.75)',
  'Feel Build': 'rgba(220, 223, 226, 0.85)',
  'Durability Build': 'rgba(220, 223, 226, 0.65)',
  'Balanced': 'rgba(220, 223, 226, 0.5)'
};

/**
 * Generate reason text for featured build card
 * @param build - Build object with stats, isHybrid, etc.
 * @param frameStats - Frame base stats
 * @returns Reason text explaining why this build is recommended
 */
export function generateBuildReason(
  build: Build,
  frameStats: { spin?: number; comfort?: number; control?: number; durability?: number; power?: number }
): string {
  if (build.isHybrid && frameStats.spin !== undefined && frameStats.spin >= 60) {
    return 'Ranks high because this frame rewards snapback hybrids with shaped mains.';
  }
  if (build.stats.comfort >= 70) return 'Safer choice for arm comfort without sacrificing too much spin.';
  if (build.stats.control >= 70) return 'Highest control ceiling for players who prioritize placement.';
  if (build.stats.durability >= 80) return 'Longest lasting setup — great value for frequent players.';
  if (build.stats.spin >= 75) return 'Maximum spin generation for heavy topspin game styles.';
  return 'Best overall balance of performance metrics for this frame.';
}
