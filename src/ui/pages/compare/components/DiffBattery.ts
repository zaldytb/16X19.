/**
 * Diff Battery Component
 * 10-segment battery-style stat comparison
 */

import { STAT_LABELS } from '../../../../engine/constants.js';
import type { SetupStats } from '../../../../engine/types.js';
import type { CompareSlot, SlotColor, SlotId } from '../types.js';

const TOTAL_SEGMENTS = 10;
const MAX_DIFF_PERCENT = 30; // 30% max difference for ranking impact
const DIFF_STATS: Array<keyof SetupStats> = [
  'power',
  'control',
  'spin',
  'comfort',
  'feel',
  'stability',
  'forgiveness',
  'launch',
  'maneuverability',
  'durability',
  'playability',
];

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

export interface DiffBatteryProps {
  slots: CompareSlot[];
  maxRows?: number;
  showAll?: boolean;
}

function getStatValue(stats: SetupStats, stat: keyof SetupStats): number {
  const value = stats[stat];
  return typeof value === 'number' ? value : 0;
}

function calculateDiffs(slots: CompareSlot[]): DiffRow[] {
  if (slots.length === 0) return [];
  
  const baseline = slots[0]; // Slot A is always baseline
  const labels = STAT_LABELS;
  
  return DIFF_STATS.map((stat, index) => {
    const baselineValue = getStatValue(baseline.stats, stat);
    
    const values = slots.map(slot => ({
      slotId: slot.id,
      value: getStatValue(slot.stats, stat)
    }));
    
    // Find winner (highest value)
    const maxValue = Math.max(...values.map(v => v.value));
    const winner = values.find(v => v.value === maxValue)?.slotId || null;
    
    // Calculate max diff from baseline
    const maxDiff = Math.max(...values.map(v => Math.abs(v.value - baselineValue)));
    const diffPercent = (maxDiff / 100) * 100; // Normalize to percentage
    
    return {
      stat,
      label: labels[index] || stat,
      values,
      baselineValue,
      winner,
      diffPercent
    };
  });
}

function sortDiffsByImpact(diffs: DiffRow[]): DiffRow[] {
  return [...diffs].sort((a, b) => b.diffPercent - a.diffPercent);
}

function renderBattery(
  values: DiffRow['values'],
  slotColors: Map<SlotId, SlotColor>
): string {
  const layeredBars = [...values]
    .sort((a, b) => {
      if (a.slotId === 'A') return 1;
      if (b.slotId === 'A') return -1;
      return a.slotId.localeCompare(b.slotId);
    })
    .map((entry, index) => {
      const color = slotColors.get(entry.slotId);
      const filledSegments = Math.max(1, Math.min(TOTAL_SEGMENTS, Math.round(entry.value / 10)));
      const offset = index * 12;
      const segments = Array(TOTAL_SEGMENTS).fill(0).map((_, segIndex) => {
        const isFilled = segIndex < filledSegments;
        return `
          <span
            class="stat-bar-segment diff-bar-segment ${isFilled ? 'is-filled' : 'empty'} slot-${entry.slotId.toLowerCase()}"
            style="${isFilled ? `--segment-color:${color?.border || 'var(--dc-platinum)'};` : ''}"
          ></span>
        `;
      }).join('');
      return `
        <div
          class="diff-bar-layer slot-${entry.slotId.toLowerCase()}"
          style="top:${offset}px;"
        >
          <span class="stat-bar-track diff-bar-segments">${segments}</span>
          <span class="diff-bar-cap" style="background:${color?.border || 'var(--dc-platinum)'}; left:calc(${Math.min(100, entry.value)}% - 5px);"></span>
        </div>
      `;
    })
    .join('');

  const valueChips = values.map((entry) => {
    const color = slotColors.get(entry.slotId);
    return `
      <span class="diff-value-chip" style="color:${color?.border || 'var(--dc-platinum-dim)'}">
        ${entry.slotId} ${Math.round(entry.value)}
      </span>
    `;
  }).join('');

  return `
    <div class="diff-battery-stack">
      <div class="diff-battery">
        <div class="diff-battery-layers">${layeredBars}</div>
      </div>
      <div class="diff-value-chips">${valueChips}</div>
    </div>
  `;
}

function renderWinnerBadge(winner: SlotId | null, slotColors: Map<SlotId, SlotColor>): string {
  if (!winner) return '<span class="diff-winner-badge diff-winner-tie">—</span>';
  
  const color = slotColors.get(winner);
  return `
    <span class="diff-winner-badge" style="color: ${color?.border || 'var(--dc-platinum)'}">
      ${winner} <span class="diff-winner-dot" style="background: ${color?.border}"></span>
    </span>
  `;
}

export function renderDiffBattery(props: DiffBatteryProps): string {
  const { slots, maxRows = 6, showAll = false } = props;
  
  if (slots.length < 2) {
    return '<div class="diff-empty">Add another build to compare</div>';
  }
  
  const slotColors = new Map(slots.map(s => [s.id, s.color]));
  const diffs = calculateDiffs(slots);
  const sortedDiffs = sortDiffsByImpact(diffs);
  const displayDiffs = showAll ? sortedDiffs : sortedDiffs.slice(0, maxRows);
  
  const rows = displayDiffs.map(diff => {
    const battery = renderBattery(diff.values, slotColors);
    const winnerBadge = renderWinnerBadge(diff.winner, slotColors);
    
    return `
      <div class="diff-row" data-stat="${diff.stat}">
        <div class="diff-label">${diff.label}</div>
        <div class="diff-battery-wrap">${battery}</div>
        <div class="diff-value">${diff.diffPercent > 0 ? '+' : ''}${Math.round(diff.diffPercent)}%</div>
        <div class="diff-winner">${winnerBadge}</div>
      </div>
    `;
  }).join('');
  
  const showMoreButton = !showAll && sortedDiffs.length > maxRows 
    ? `<button class="diff-show-more" data-compare-action="toggleShowAll">
        Show all ${sortedDiffs.length} stats <span class="diff-show-more-icon">↓</span>
       </button>`
    : '';
  
  return `
    <div class="diff-battery-container">
      <div class="diff-header">
        <span class="diff-header-label">// STAT COMPARISON</span>
        <span class="diff-header-baseline">Baseline: Slot A</span>
      </div>
      <div class="diff-rows">${rows}</div>
      ${showMoreButton}
    </div>
  `;
}

export function getTopDifferences(slots: CompareSlot[], count: number = 3): DiffRow[] {
  if (slots.length < 2) return [];
  const diffs = calculateDiffs(slots);
  return sortDiffsByImpact(diffs).slice(0, count);
}
