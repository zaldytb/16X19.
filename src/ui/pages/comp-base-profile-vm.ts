import type { SetupStats } from '../../engine/types.js';

export type CompBaseStatRowVm = {
  id: keyof SetupStats;
  label: string;
  value: number;
  filledSegments: number;
  /** When set, battery shows preview overlay vs base (string modulator). */
  previewValue?: number;
  previewFilledSegments?: number;
  deltaDirection?: 'up' | 'down' | null;
};

export type CompBaseStatGroupVm = {
  title: string;
  rows: CompBaseStatRowVm[];
};

const GROUPS: Array<{ title: string; stats: Array<{ id: keyof SetupStats; label: string }> }> = [
  { title: 'Attack', stats: [
    { id: 'spin', label: 'Spin' },
    { id: 'power', label: 'Power' },
    { id: 'launch', label: 'Launch' },
  ]},
  { title: 'Defense', stats: [
    { id: 'control', label: 'Control' },
    { id: 'stability', label: 'Stability' },
    { id: 'forgiveness', label: 'Forgiveness' },
  ]},
  { title: 'Touch', stats: [
    { id: 'feel', label: 'Feel' },
    { id: 'comfort', label: 'Comfort' },
    { id: 'maneuverability', label: 'Maneuverability' },
  ]},
];

const SEGMENTS = 25;

export function buildCompBaseProfileVm(
  frameBase: SetupStats,
  previewStats?: SetupStats | null,
): CompBaseStatGroupVm[] {
  return GROUPS.map((group) => ({
    title: group.title,
    rows: group.stats.map((stat) => {
      const val = Math.round(frameBase[stat.id] as number);
      const pct = Math.max(0, Math.min(100, val));
      const filledSegments = Math.round((pct / 100) * SEGMENTS);
      let previewValue: number | undefined;
      let previewFilledSegments: number | undefined;
      let deltaDirection: 'up' | 'down' | null | undefined;
      if (previewStats) {
        previewValue = Math.round(previewStats[stat.id] as number);
        const pPct = Math.max(0, Math.min(100, previewValue));
        previewFilledSegments = Math.round((pPct / 100) * SEGMENTS);
        deltaDirection = previewValue > val ? 'up' : previewValue < val ? 'down' : null;
      }
      return {
        id: stat.id,
        label: stat.label,
        value: val,
        filledSegments,
        previewValue,
        previewFilledSegments,
        deltaDirection,
      };
    }),
  }));
}
