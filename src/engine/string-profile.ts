// src/engine/string-profile.ts
// String profile calculations — base profiles, gauge modifiers, frame interaction

import { GAUGE_OPTIONS, GAUGE_LABELS } from './constants.js';
import { lerp, clamp } from './frame-physics.js';
import type { StringData, StringProfileScores, StringFrameMod } from './types';

/**
 * Soft linear compression for TWU-derived raw scores.
 * Pulls extremes toward the midpoint (65): raw ~38–98 → compressed ~32–88.
 * spread < 1 compresses (narrows range), spread > 1 expands.
 */
function compressScore(raw: number, floor: number = 30, ceiling: number = 95): number {
  // Compress twScore (raw 0-100) into a more realistic range.
  // twScore ~38-98 → compressed ~32-88.
  // Formula: soft sigmoid-like compression that pulls extremes toward center.
  const mid = 65;
  const spread = 0.55; // <1 compresses, >1 expands
  const compressed = mid + (raw - mid) * spread;
  return Math.max(floor, Math.min(ceiling, compressed));
}

/**
 * PREDICTION LAYER 1 — Standalone string profile.
 * Derives attribute scores from TWU-measured physical properties:
 *   twScore    — lab-measured multi-axis ratings (power, spin, control, etc.)
 *   stiffness  — lb/in (115 softest → 234 stiffest)
 *   tensionLoss — % of initial tension lost after break-in (10% best → 50% worst)
 *   spinPotential — TWU friction-based scale (4.5 low → 9.4 high)
 * No frame or tension interaction yet — those are applied in later layers.
 * @param stringData — entry from the STRINGS array
 * @returns attribute scores (power, spin, control, comfort, feel, durability, playability)
 */
export function calcBaseStringProfile(stringData: StringData): StringProfileScores {
  const tw = stringData.twScore;
  const stiff = stringData.stiffness; // lb/in: 115 (Truffle X elastic) to 234 (RPM Blast 17)
  const tLoss = stringData.tensionLoss; // %: 10 (gut/Truffle X) to 48.3 (Hawk Power)
  const spinPot = stringData.spinPotential; // TWU lab scale: 4.5 (RPM Blast 16) to 9.4 (O-Toro)

  // Normalize stiffness: 0 = stiffest (234), 1 = softest (115)
  const stiffNorm = Math.max(0, Math.min(1, lerp(stiff, 115, 234, 1, 0)));

  // Normalize tension loss: 0 = best maintenance (10%), 1 = worst (50%)
  const tLossNorm = Math.max(0, Math.min(1, lerp(tLoss, 10, 50, 0, 1)));

  // Normalize spin potential: 0 = low (4.5), 1 = high (9.0)
  const spinNorm = Math.max(0, Math.min(1, lerp(spinPot, 4.5, 9.0, 0, 1)));

  // --- Power: twScore primary, stiffness secondary ---
  // Softer strings = more power (elastic return), but cap the bonus
  let power = compressScore(tw.power);
  power += stiffNorm * 5 - 2; // soft: up to +3, stiff: down to -2

  // --- Control: twScore primary, inverse of power tendency ---
  let control = compressScore(tw.control);
  control += (1 - stiffNorm) * 4 - 1.5; // stiff: up to +2.5, soft: down to -1.5

  // --- Spin: twScore + spinPotential blend ---
  let spin = compressScore(tw.spin) * 0.6 + compressScore(spinPot * 12) * 0.4;

  // --- Comfort: twScore primary, stiffness confirms ---
  let comfort = compressScore(tw.comfort);
  comfort += stiffNorm * 4 - 1.5; // soft: up to +2.5, stiff: down to -1.5

  // --- Feel: twScore primary, stiffness + material secondary ---
  let feel = compressScore(tw.feel);
  if (stringData.material === 'Natural Gut') feel += 3; // gut has unmatched feel
  feel += stiffNorm * 4 - 1; // soft: up to +3, stiff: down to -1
  // Shaped strings have slightly less clean ball feedback than round
  const isRound = stringData.shape && stringData.shape.toLowerCase().includes('round');
  if (!isRound && stringData.material !== 'Natural Gut') feel -= 1.5;

  // --- Durability: twScore directly, thin gauge penalty ---
  let durability = compressScore(tw.durability);
  if (stringData.gaugeNum <= 1.20) durability -= 3;
  if (stringData.gaugeNum >= 1.30) durability += 2;

  // --- Playability Duration: twScore + tension maintenance ---
  let playability = compressScore(tw.playabilityDuration);
  playability += (1 - tLossNorm) * 6 - 2; // good maintenance: up to +4, poor: down to -2

  // --- Tradeoff enforcement ---
  // If power + control sum is too high, tax the lesser one
  const pcSum = power + control;
  if (pcSum > 140) {
    const excess = (pcSum - 140) * 0.5;
    if (power > control) control -= excess;
    else power -= excess;
  }

  // If comfort + control sum is unrealistically high, apply small tax
  const ccSum = comfort + control;
  if (ccSum > 145) {
    const excess = (ccSum - 145) * 0.4;
    if (comfort > control) comfort -= excess;
    else control -= excess;
  }

  // --- Final clamp: nothing below 25, nothing above 86 for base string ---
  const capLow = 25, capHigh = 86;
  const profile: StringProfileScores = {
    power: Math.round(Math.max(capLow, Math.min(capHigh, power))),
    spin: Math.round(Math.max(capLow, Math.min(capHigh, spin))),
    control: Math.round(Math.max(capLow, Math.min(capHigh, control))),
    feel: Math.round(Math.max(capLow, Math.min(capHigh, feel))),
    comfort: Math.round(Math.max(capLow, Math.min(capHigh, comfort))),
    durability: Math.round(Math.max(capLow, Math.min(capHigh, durability))),
    playability: Math.round(Math.max(capLow, Math.min(capHigh, playability)))
  };

  // Suppress unused variable warning from TypeScript — spinNorm is computed for
  // documentation/future use but not currently applied to a stat.
  void spinNorm;

  return profile;
}

/**
 * PREDICTION LAYER 2 — Frame Interaction (string modifiers on frame)
 * String properties create small modifiers on frame-driven stats.
 * These are intentionally small (-3 to +5 range) — the frame is primary for
 * spin/power/control/comfort/feel/launch; the string profile handles
 * durability and playability directly.
 */
export function calcStringFrameMod(stringData: StringData): StringFrameMod {
  const stiff = stringData.stiffness;
  // Clamped normalization: 0 = stiffest (234), 1 = softest (115)
  const stiffNorm = Math.max(0, Math.min(1, lerp(stiff, 115, 234, 1, 0)));
  const spinPot = stringData.spinPotential;

  // Layer 2 mods: how string stiffness interacts with the frame.
  return {
    powerMod: stiffNorm * 3 - 1,          // soft: up to +2, stiff: -1
    spinMod: (spinPot - 6.0) * 1.5,       // centered at 6.0, ±1.5 per point
    controlMod: (1 - stiffNorm) * 3 - 1,  // stiff: up to +2, soft: -1
    comfortMod: stiffNorm * 3 - 1,        // soft: up to +2, stiff: -1
    feelMod: stiffNorm * 2.5 - 0.5,       // soft: up to +2, stiff: -0.5
    launchMod: stiffNorm * 1.5 - 0.4      // soft strings add slight launch
  };
}

// Returns a modified copy of stringData with gauge-adjusted properties.
// The base string data is the "reference" measurement (at its own gaugeNum).
// Moving to a different gauge shifts stiffness, spin, durability, etc.
export function applyGaugeModifier(stringData: StringData, selectedGauge: number): StringData {
  const numericGauge = typeof selectedGauge === 'number' ? selectedGauge : Number(selectedGauge);
  if (!Number.isFinite(numericGauge) || numericGauge === stringData.gaugeNum) {
    return stringData; // No change needed — using reference gauge
  }

  const refGauge = stringData.gaugeNum;  // e.g. 1.30
  const delta = numericGauge - refGauge; // negative = thinner, positive = thicker
  // Steps of 0.05mm (each step = one standard gauge jump)
  const steps = delta / 0.05;

  // --- Stiffness: ~6% change per 0.05mm step ---
  // Thinner → softer, thicker → stiffer
  const stiffMult = 1 + steps * 0.06;
  const newStiffness = stringData.stiffness * stiffMult;

  // --- Tension loss: thicker strings lose tension slightly faster ---
  const newTensionLoss = stringData.tensionLoss * (1 + steps * 0.04);

  // --- Spin potential: thinner gauge slightly more spin ---
  const newSpinPot = stringData.spinPotential - steps * 0.15;

  // --- twScore adjustments ---
  const tw = { ...stringData.twScore };
  tw.power = Math.max(30, Math.min(98, tw.power - steps * 2));
  tw.comfort = Math.max(30, Math.min(98, tw.comfort - steps * 1.5));
  tw.feel = Math.max(30, Math.min(98, tw.feel - steps * 2));
  tw.control = Math.max(30, Math.min(98, tw.control + steps * 1.5));
  tw.durability = Math.max(20, Math.min(98, tw.durability + steps * 3));
  tw.spin = Math.max(30, Math.min(98, tw.spin - steps * 1));
  tw.playabilityDuration = Math.max(30, Math.min(98, tw.playabilityDuration - steps * 0.5));

  // Return a new object with all original properties + gauge adjustments
  return {
    ...stringData,
    gaugeNum: numericGauge,
    gauge: (GAUGE_LABELS as Record<number, string>)[numericGauge] || `${numericGauge.toFixed(2)}mm`,
    stiffness: Math.max(80, newStiffness),
    tensionLoss: Math.max(5, Math.min(60, newTensionLoss)),
    spinPotential: Math.max(3, Math.min(10, newSpinPot)),
    twScore: tw,
    _gaugeModified: true,
    _refGauge: refGauge
  };
}

// Get available gauge options for a string.
// Always includes the string's reference gauge plus the standard gauge grid for its material.
export function getGaugeOptions(stringData: StringData): number[] {
  const standard: number[] = (GAUGE_OPTIONS as Record<string, number[]>)[stringData.material] || [1.25, 1.30];
  const ref = stringData.gaugeNum;
  // If ref gauge isn't in the standard list, add it and sort
  if (!standard.some(g => Math.abs(g - ref) < 0.005)) {
    const combined = [...standard, ref].sort((a, b) => a - b);
    return combined;
  }
  return standard;
}
