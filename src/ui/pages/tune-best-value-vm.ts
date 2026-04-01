// Pure view-model for Tune "best value" callout (#slider-best-value) — parity with renderBestValueMove.

import type { SetupAttributes } from '../../engine/types.js';

export type TuneBestValueViewModel =
  | { status: 'empty' }
  | { status: 'in-zone'; low: number; high: number }
  | {
      status: 'move';
      arrowSvg: string;
      directionWord: 'up' | 'down';
      diffAbs: number;
      anchor: number;
    };

const SVG_CHEV_UP =
  '<svg width="10" height="10" viewBox="0 0 10 10" style="display:inline-block;vertical-align:middle"><path d="M2 7L5 3L8 7" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="square"/></svg>';
const SVG_CHEV_DOWN =
  '<svg width="10" height="10" viewBox="0 0 10 10" style="display:inline-block;vertical-align:middle"><path d="M2 3L5 7L8 3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="square"/></svg>';

export function buildTuneBestValueViewModel(
  sweepData: Array<{ tension: number; stats: SetupAttributes }> | null,
  optimalWindow: { low: number; high: number; anchor: number } | null,
  exploredTension: number
): TuneBestValueViewModel {
  if (!sweepData || !optimalWindow) {
    return { status: 'empty' };
  }

  const w = optimalWindow;
  const current = exploredTension;
  const isInZone = current >= w.low && current <= w.high;

  if (isInZone) {
    return { status: 'in-zone', low: w.low, high: w.high };
  }

  const anchor = w.anchor;
  const diff = anchor - current;
  const directionWord = diff > 0 ? 'up' : 'down';
  const arrowSvg = diff > 0 ? SVG_CHEV_UP : SVG_CHEV_DOWN;

  return {
    status: 'move',
    arrowSvg,
    directionWord,
    diffAbs: Math.abs(diff),
    anchor,
  };
}
