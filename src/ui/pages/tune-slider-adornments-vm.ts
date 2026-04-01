/**
 * Pure view-model for Tune slider track adornments (optimal zone, baseline marker, original marker).
 */

export type TuneSliderAdornmentsViewModel = {
  baselineLeftPct: number;
  optimalZone: { leftPct: number; widthPct: number } | null;
  original: { left: string; tension: number } | null;
};

export function buildTuneSliderAdornmentsViewModel(
  sliderMin: number,
  sliderMax: number,
  baselineTension: number,
  optimalWindow: { low: number; high: number } | null,
  originalTension: number | null | undefined
): TuneSliderAdornmentsViewModel {
  const range = sliderMax - sliderMin;
  const safeRange = range > 0 ? range : 1;

  const clampPct = (t: number) =>
    Math.max(0, Math.min(100, ((t - sliderMin) / safeRange) * 100));

  const baselineLeftPct = clampPct(baselineTension);

  let optimalZone: { leftPct: number; widthPct: number } | null = null;
  if (optimalWindow && range > 0) {
    const leftPct = Math.max(0, ((optimalWindow.low - sliderMin) / range) * 100);
    const widthPct = Math.min(100 - leftPct, ((optimalWindow.high - optimalWindow.low) / range) * 100);
    optimalZone = { leftPct, widthPct };
  }

  let original: { left: string; tension: number } | null = null;
  if (originalTension && range > 0) {
    const pct = ((originalTension - sliderMin) / range) * 100;
    original = { left: `calc(${pct}% - 1px)`, tension: originalTension };
  }

  return { baselineLeftPct, optimalZone, original };
}
