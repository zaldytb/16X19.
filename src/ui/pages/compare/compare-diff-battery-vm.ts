/**
 * Pure view-model for Compare diff battery (stat comparison table).
 */

import { STAT_KEYS, STAT_LABELS } from '../../../engine/constants.js';
import type { SetupStats } from '../../../engine/types.js';
import type { CompareSlot, SlotColor, SlotId } from './types.js';

const TOTAL_SEGMENTS = 10;
const DIFF_STATS = [...STAT_KEYS] as Array<keyof SetupStats>;
const STAT_LABEL_BY_KEY = Object.fromEntries(
  STAT_KEYS.map((statKey, index) => [statKey, STAT_LABELS[index] || statKey]),
) as Record<keyof SetupStats, string>;

export interface DiffRow {
  stat: string;
  label: string;
  values: {
    slotId: SlotId;
    value: number;
  }[];
  baselineValue: number;
  winner: SlotId | null;
  diffPercent: number;
}

export interface DiffBatterySegment {
  slotId: SlotId;
  value: number;
  filledSegments: number;
  segmentStates: boolean[];
  offsetPx: number;
  borderColor: string;
}

export interface DiffBatteryRowVm {
  stat: string;
  label: string;
  diffPercentRounded: number;
  diffPercentDisplay: string;
  winner: SlotId | null;
  winnerBadge: 'tie' | 'winner';
  layers: DiffBatterySegment[];
  valueChips: { slotId: SlotId; value: number; color: string }[];
}

export interface CompareDiffBatteryViewModel {
  kind: 'empty' | 'data';
  emptyMessage?: string;
  rows?: DiffBatteryRowVm[];
  showMoreButton?: boolean;
  sortedDiffCount?: number;
}

function getStatValue(stats: SetupStats, stat: keyof SetupStats): number {
  const value = stats[stat];
  return typeof value === 'number' ? value : 0;
}

function calculateDiffs(slots: CompareSlot[]): DiffRow[] {
  if (slots.length === 0) return [];

  const baseline = slots[0];
  return DIFF_STATS.map((stat) => {
    const baselineValue = getStatValue(baseline.stats, stat);

    const values = slots.map((slot) => ({
      slotId: slot.id,
      value: getStatValue(slot.stats, stat),
    }));

    const maxValue = Math.max(...values.map((v) => v.value));
    const winner = values.find((v) => v.value === maxValue)?.slotId || null;

    const maxDiff = Math.max(...values.map((v) => Math.abs(v.value - baselineValue)));
    const diffPercent = (maxDiff / 100) * 100;

    return {
      stat,
      label: STAT_LABEL_BY_KEY[stat] || stat,
      values,
      baselineValue,
      winner,
      diffPercent,
    };
  });
}

function sortDiffsByImpact(diffs: DiffRow[]): DiffRow[] {
  return [...diffs].sort((a, b) => b.diffPercent - a.diffPercent);
}

function buildLayers(
  values: DiffRow['values'],
  slotColors: Map<SlotId, SlotColor>,
): DiffBatterySegment[] {
  const sorted = [...values].sort((a, b) => {
    if (a.slotId === 'A') return 1;
    if (b.slotId === 'A') return -1;
    return a.slotId.localeCompare(b.slotId);
  });

  return sorted.map((entry, index) => {
    const color = slotColors.get(entry.slotId);
    const filledSegments = Math.max(1, Math.min(TOTAL_SEGMENTS, Math.round(entry.value / 10)));
    const segmentStates = Array.from({ length: TOTAL_SEGMENTS }, (_, segIndex) => segIndex < filledSegments);
    return {
      slotId: entry.slotId,
      value: entry.value,
      filledSegments,
      segmentStates,
      offsetPx: index * 12,
      borderColor: color?.border || 'var(--dc-platinum)',
    };
  });
}

export function buildCompareDiffBatteryViewModel(
  slots: CompareSlot[],
  maxRows: number,
  showAll: boolean,
): CompareDiffBatteryViewModel {
  if (slots.length < 2) {
    return { kind: 'empty', emptyMessage: 'Add another build to compare' };
  }

  const slotColors = new Map(slots.map((s) => [s.id, s.color]));
  const diffs = calculateDiffs(slots);
  const sortedDiffs = sortDiffsByImpact(diffs);
  const displayDiffs = showAll ? sortedDiffs : sortedDiffs.slice(0, maxRows);

  const rows: DiffBatteryRowVm[] = displayDiffs.map((diff) => {
    const layers = buildLayers(diff.values, slotColors);
    const valueChips = diff.values.map((entry) => ({
      slotId: entry.slotId,
      value: entry.value,
      color: slotColors.get(entry.slotId)?.border || 'var(--dc-platinum-dim)',
    }));

    const rounded = Math.round(diff.diffPercent);
    return {
      stat: diff.stat,
      label: diff.label,
      diffPercentRounded: rounded,
      diffPercentDisplay: `${rounded > 0 ? '+' : ''}${rounded}%`,
      winner: diff.winner,
      winnerBadge: diff.winner ? 'winner' : 'tie',
      layers,
      valueChips,
    };
  });

  return {
    kind: 'data',
    rows,
    showMoreButton: !showAll && sortedDiffs.length > maxRows,
    sortedDiffCount: sortedDiffs.length,
  };
}

export function getTopDifferences(slots: CompareSlot[], count: number = 3): DiffRow[] {
  if (slots.length < 2) return [];
  const diffs = calculateDiffs(slots);
  return sortDiffsByImpact(diffs).slice(0, count);
}
