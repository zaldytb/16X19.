// Pure view-model for Tune OBS card (#obs-content) — parity with renderOverallBuildScore.

import { getObsTier } from '../../engine/index.js';
import type { Racquet, StringConfig, SetupAttributes } from '../../engine/types.js';
import { getScoredSetup } from '../../utils/performance.js';

export type TuneObsBuildScoreViewModel = {
  score: number;
  scoreText: string;
  tierLabel: string;
  rankClass: 'obs-rank-badge s-rank' | 'obs-rank-badge';
  deltaChip: null | {
    text: string;
    className: 'obs-delta-chip obs-delta-pos' | 'obs-delta-chip obs-delta-neg';
  };
  /** Length 10 — exact class strings per legacy battery loop */
  batterySegmentClasses: string[];
};

export function buildTuneObsBuildScoreViewModel(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  inTuneMode: boolean,
  explored: { stats: SetupAttributes; obs: number } | null,
  baselineObs: number | null
): TuneObsBuildScoreViewModel {
  const score =
    inTuneMode && explored && typeof explored.obs === 'number'
      ? explored.obs
      : getScoredSetup(setup).obs;

  const tier = getObsTier(score);
  const scoreText = score.toFixed(1);

  let deltaChip: TuneObsBuildScoreViewModel['deltaChip'] = null;
  if (inTuneMode && typeof baselineObs === 'number') {
    const delta = score - baselineObs;
    if (Math.abs(delta) > 0.05) {
      const sign = delta > 0 ? '+' : '';
      deltaChip = {
        text: `${sign}${delta.toFixed(1)}`,
        className:
          delta > 0 ? 'obs-delta-chip obs-delta-pos' : 'obs-delta-chip obs-delta-neg',
      };
    }
  }

  const segments = 10;
  const filled = Math.min(segments, Math.max(0, Math.ceil(score / 10)));
  const batterySegmentClasses: string[] = [];
  for (let i = 0; i < segments; i++) {
    const isFilled = i < filled;
    const isTopTier = i >= 8;
    batterySegmentClasses.push(
      isFilled
        ? isTopTier
          ? 'obs-battery-seg obs-battery-filled obs-battery-top'
          : 'obs-battery-seg obs-battery-filled'
        : 'obs-battery-seg'
    );
  }

  const rankClass: TuneObsBuildScoreViewModel['rankClass'] =
    tier.label === 'S Rank' ? 'obs-rank-badge s-rank' : 'obs-rank-badge';

  return {
    score,
    scoreText,
    tierLabel: tier.label,
    rankClass,
    deltaChip,
    batterySegmentClasses,
  };
}
