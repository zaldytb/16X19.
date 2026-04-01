import { STAT_GROUPS, STAT_KEYS, STAT_LABELS } from '../../engine/constants.js';
import type { SetupAttributes } from '../../engine/types.js';

const SEGMENT_COUNT = 20;

export type OverviewStatRowViewModel = {
  statKey: string;
  label: string;
  value: number;
  filledCount: number;
  isHigh: boolean;
};

export type OverviewStatGroupViewModel = {
  label: string;
  rows: OverviewStatRowViewModel[];
};

export type OverviewStatBarsViewModel = {
  groups: OverviewStatGroupViewModel[];
};

export function buildOverviewStatBarsViewModel(stats: SetupAttributes): OverviewStatBarsViewModel {
  const keyToLabel: Record<string, string> = {};
  STAT_KEYS.forEach((k, i) => {
    keyToLabel[k] = STAT_LABELS[i];
  });

  const groups: OverviewStatGroupViewModel[] = STAT_GROUPS.map((group) => ({
    label: group.label,
    rows: group.keys.map((key) => {
      const value = stats[key as keyof SetupAttributes] as number;
      const filledCount = Math.round((value / 100) * SEGMENT_COUNT);
      return {
        statKey: key,
        label: keyToLabel[key],
        value,
        filledCount,
        isHigh: value > 70,
      };
    }),
  }));

  return { groups };
}

export { SEGMENT_COUNT };
