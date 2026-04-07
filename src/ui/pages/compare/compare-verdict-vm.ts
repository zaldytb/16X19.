/**
 * Pure view-model for Compare verdict section.
 * Generates a quick analysis of which slot excels at which category
 * and how it translates to on-court performance.
 */

import { STAT_KEYS, STAT_LABELS, STAT_GROUPS } from '../../../engine/constants.js';
import type { SetupAttributes } from '../../../engine/types.js';
import type { CompareSlot, SlotId } from './types.js';

const STAT_LABEL_BY_KEY = Object.fromEntries(
  STAT_KEYS.map((k, i) => [k, STAT_LABELS[i] || k]),
) as Record<string, string>;

// ============================================
// TYPES
// ============================================

export interface VerdictGroupVm {
  groupLabel: string;
  winner: SlotId | null;
  winnerLabel: string;
  margin: number;
  insight: string;
  stats: VerdictStatVm[];
}

export interface VerdictStatVm {
  key: string;
  label: string;
  values: { slotId: SlotId; value: number; isMax: boolean; color: string }[];
}

export interface VerdictSummaryVm {
  slotId: SlotId;
  label: string;
  color: string;
  identity: string;
  obs: number;
  groupsWon: string[];
}

export interface CompareVerdictViewModel {
  kind: 'empty' | 'data';
  emptyMessage?: string;
  groups?: VerdictGroupVm[];
  summaries?: VerdictSummaryVm[];
  overallVerdict?: string;
}

// ============================================
// PERFORMANCE INSIGHT GENERATION
// ============================================

const GROUP_INSIGHTS: Record<string, (winner: SlotId, margin: number) => string> = {
  Attack: (w, m) =>
    m >= 8
      ? `Slot ${w} is the clear offensive weapon — more raw pace and spin generation.`
      : m >= 3
        ? `Slot ${w} has an edge in offensive output, translating to heavier hitting.`
        : `Offensive output is closely matched — differences are marginal on court.`,
  Defense: (w, m) =>
    m >= 8
      ? `Slot ${w} dominates defensive solidity — tighter patterns and more predictable shot-making.`
      : m >= 3
        ? `Slot ${w} offers better defensive consistency, especially on returns and rallies.`
        : `Defensive profiles are similar — neither has a meaningful edge in rallies.`,
  Touch: (w, m) =>
    m >= 8
      ? `Slot ${w} is significantly more responsive at the net and in finesse play.`
      : m >= 3
        ? `Slot ${w} has a feel advantage — noticeable on drop shots and touch volleys.`
        : `Touch and feel are comparable — both handle finesse shots similarly.`,
  Longevity: (w, m) =>
    m >= 8
      ? `Slot ${w} will outlast the other setup(s) by a wide margin.`
      : m >= 3
        ? `Slot ${w} holds up better over time — fewer restrings and more consistent performance.`
        : `String longevity is comparable — expect similar restring intervals.`,
};

function generateOverallVerdict(summaries: VerdictSummaryVm[]): string {
  if (summaries.length < 2) return '';

  const sorted = [...summaries].sort((a, b) => b.obs - a.obs);
  const best = sorted[0];
  const gap = best.obs - sorted[1].obs;

  if (gap >= 8) {
    return `Slot ${best.slotId} (${best.identity || 'build'}) is the stronger overall setup by ${gap.toFixed(1)} OBS — a clear tier advantage.`;
  }
  if (gap >= 3) {
    return `Slot ${best.slotId} leads overall by ${gap.toFixed(1)} OBS, but both builds are competitive. The choice depends on play style priority.`;
  }
  return `These builds are within ${gap.toFixed(1)} OBS of each other — performance is close. Pick based on which stat category matters most to your game.`;
}

// ============================================
// BUILD
// ============================================

export function buildCompareVerdictViewModel(
  slots: CompareSlot[],
): CompareVerdictViewModel {
  if (slots.length < 2) {
    return { kind: 'empty', emptyMessage: 'Add another build to see the verdict' };
  }

  const slotColors = new Map(slots.map((s) => [s.id, s.color.border]));

  // Build group-level analysis
  const groups: VerdictGroupVm[] = STAT_GROUPS.map((group) => {
    const stats: VerdictStatVm[] = group.keys.map((key) => {
      const values = slots.map((s) => {
        const val = (s.stats as SetupAttributes)[key as keyof SetupAttributes];
        return {
          slotId: s.id,
          value: typeof val === 'number' ? val : 0,
          isMax: false,
          color: slotColors.get(s.id) || 'var(--dc-platinum)',
        };
      });
      const maxVal = Math.max(...values.map((v) => v.value));
      for (const v of values) v.isMax = v.value === maxVal;
      return { key, label: STAT_LABEL_BY_KEY[key] || key, values };
    });

    // Determine group winner by average stat advantage
    const slotAvgs = slots.map((s) => {
      const avg =
        group.keys.reduce((sum, key) => {
          const val = (s.stats as SetupAttributes)[key as keyof SetupAttributes];
          return sum + (typeof val === 'number' ? val : 0);
        }, 0) / group.keys.length;
      return { slotId: s.id, avg };
    });
    slotAvgs.sort((a, b) => b.avg - a.avg);
    const margin = Math.round(slotAvgs[0].avg - slotAvgs[1].avg);
    const winner = margin >= 1 ? slotAvgs[0].slotId : null;
    const winnerLabel = winner ? `Slot ${winner}` : 'Tie';

    const insightFn = GROUP_INSIGHTS[group.label];
    const insight = insightFn
      ? insightFn(winner || slotAvgs[0].slotId, margin)
      : `${group.label} performance is comparable.`;

    return { groupLabel: group.label, winner, winnerLabel, margin, insight, stats };
  });

  // Build per-slot summaries
  const summaries: VerdictSummaryVm[] = slots.map((s) => ({
    slotId: s.id,
    label: `Slot ${s.id}`,
    color: slotColors.get(s.id) || 'var(--dc-platinum)',
    identity: s.loadout.identity || '',
    obs: s.loadout.obs || 0,
    groupsWon: groups.filter((g) => g.winner === s.id).map((g) => g.groupLabel),
  }));

  const overallVerdict = generateOverallVerdict(summaries);

  return { kind: 'data', groups, summaries, overallVerdict };
}
