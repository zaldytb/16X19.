import { STAT_KEYS, STAT_LABELS } from '../../engine/constants.js';
import type { SetupAttributes } from '../../engine/types.js';

export type OverviewBuildDnaViewModel = {
  topStrong: Array<{ label: string; val: number }>;
  bottomGap: Array<{ label: string; val: number }>;
};

export function buildOverviewBuildDnaViewModel(stats: SetupAttributes): OverviewBuildDnaViewModel {
  const entries = STAT_KEYS.map((k, i) => ({
    key: k,
    label: STAT_LABELS[i],
    val: stats[k as keyof SetupAttributes] as number,
  }));
  const sorted = [...entries].sort((a, b) => b.val - a.val);
  const top3 = sorted.slice(0, 3);
  const bot2 = sorted.slice(-2).reverse();

  return {
    topStrong: top3.map((s) => ({ label: s.label, val: s.val })),
    bottomGap: bot2.map((s) => ({ label: s.label, val: s.val })),
  };
}
