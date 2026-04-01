// Pure view-model for the Tune "optimal build window" widget (legacy renderOptimalBuildWindow parity).

import type { SetupAttributes } from '../../engine/types.js';

export type OptimalBuildWindowViewModel =
  | { status: 'skip' }
  | { status: 'no-data' }
  | {
      status: 'ok';
      scaleMin: number;
      scaleMax: number;
      fillLeft: number;
      fillWidth: number;
      anchorPct: number;
      anchor: number;
      reason: string;
      anchorStats: SetupAttributes;
    };

export function buildOptimalBuildWindowViewModel(
  sMin: number,
  sMax: number,
  optimalWindow: { low: number; high: number; anchor: number; reason: string } | null,
  sweepData: Array<{ tension: number; stats: SetupAttributes }> | null
): OptimalBuildWindowViewModel {
  const w = optimalWindow;
  if (!w) {
    return { status: 'no-data' };
  }

  const anchorStats = sweepData?.find((d) => d.tension === w.anchor)?.stats;
  if (!anchorStats) {
    return { status: 'skip' };
  }

  const scaleMin = sMin || w.low - 10;
  const scaleMax = sMax || w.high + 10;
  const scaleRange = scaleMax - scaleMin || 1;

  const fillLeft = ((w.low - scaleMin) / scaleRange) * 100;
  const fillRight = ((w.high - scaleMin) / scaleRange) * 100;
  const fillWidth = fillRight - fillLeft;

  let anchorPct = ((w.anchor - scaleMin) / scaleRange) * 100;
  anchorPct = Math.max(2, Math.min(98, anchorPct));

  return {
    status: 'ok',
    scaleMin,
    scaleMax,
    fillLeft,
    fillWidth,
    anchorPct,
    anchor: w.anchor,
    reason: w.reason,
    anchorStats,
  };
}
