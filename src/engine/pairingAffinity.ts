// src/engine/pairingAffinity.ts
// Pairing affinity model for poly×poly hybrid string interactions.
//
// Models four physical interaction dimensions at the crossing points:
//   D1 — Inter-string friction: snapback efficiency from friction product
//   D2 — Stiffness differential: load absorption from cross softness
//   D3 — Geometry interaction: rotational resistance of the cross string
//   D4 — Spin compatibility: complementary vs competing spin potential
//
// All coefficients are derived from physical reasoning and pool statistics.
// Dimension weights are equal (0.25 each). Adjust only with physical
// justification after broad validation against known pairings.

import type { StringData } from './types.js';

// ============================================
// Exported types
// ============================================

export interface AffinityBreakdown {
  frictionInteraction: number;     // 0-1
  stiffnessDifferential: number;   // 0-1
  geometryInteraction: number;     // 0-1
  spinCompatibility: number;       // 0-1
  total: number;                   // 0-1 weighted sum
}

// ============================================
// Pool-derived constants
// ============================================

// Stiffness distribution of the poly string pool (48 strings):
//   mean = 200.6, stddev = 23.9, range [115, 259]
// Bell curve peak = 1 stddev gap, sigma = 0.75 stddev
const STIFFNESS_BELL_PEAK = 24;   // ~1 stddev of poly pool
const STIFFNESS_BELL_SIGMA = 18;  // 0.75 stddev — range of beneficial differential

// Spin potential normalization range (from string-profile.ts)
const SPIN_MIN = 4.5;
const SPIN_MAX = 9.4;

// Dimension weights — equal by default
const W_FRICTION = 0.25;
const W_STIFFNESS = 0.25;
const W_GEOMETRY = 0.25;
const W_SPIN = 0.25;

// ============================================
// Helpers
// ============================================

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function gaussian(x: number, peak: number, sigma: number): number {
  const d = (x - peak) / sigma;
  return Math.exp(-0.5 * d * d);
}

// ============================================
// D1 — Inter-string friction derivation
// ============================================

/**
 * Derive a friction factor (0–1) from the string's shape descriptor and
 * spin potential. 0 = minimal friction (slippery), 1 = maximum grip.
 *
 * Cross-section geometry determines inter-string contact friction: sharp
 * edges dig in, round profiles slide, coatings reduce friction, texturing
 * increases it. spinPotential (TWU friction-based measurement) serves as
 * a secondary signal blended at 25%.
 */
export function deriveFriction(s: StringData): number {
  const shape = (s.shape || '').toLowerCase();
  let base: number;

  // Order matters — check specific modifiers before general geometry.

  // Round variants (lowest friction family)
  if (shape.includes('round')) {
    if (shape.includes('slick') || shape.includes('silicone') || shape.includes('ultra-slick')) {
      base = 0.15;
    } else if (shape.includes('coated')) {
      base = 0.25;
    } else if (shape.includes('textured') || shape.includes('abrasive')) {
      base = 0.55;
    } else {
      // Plain round or braided
      base = 0.35;
    }
  }
  // Square / rectangular — sharp edges, high friction
  else if (shape.includes('square') || shape.includes('rectangular')) {
    if (shape.includes('textured') || shape.includes('abrasive') || shape.includes('sharp') || shape.includes('edge')) {
      base = 0.85;
    } else {
      base = 0.75;
    }
  }
  // Star / spiral — irregular geometry, high interference
  else if (shape.includes('star') || shape.includes('spiral')) {
    base = 0.80;
  }
  // Many-sided polygons (8+ sides) — approximate round
  else if (shape.includes('decagonal') || shape.includes('10-sided')) {
    if (shape.includes('slick') || shape.includes('silicone')) {
      base = 0.35;
    } else {
      base = 0.45;
    }
  }
  else if (shape.includes('octagon')) {
    if (shape.includes('slick') || shape.includes('silicone')) {
      base = 0.35;
    } else if (shape.includes('textured')) {
      base = 0.55;
    } else {
      base = 0.45;
    }
  }
  // Fewer-sided polygons — more edge contact per rotation
  else if (shape.includes('heptagonal') || shape.includes('7-sided')) {
    base = 0.60;
  }
  else if (shape.includes('hex')) {
    if (shape.includes('textured')) {
      base = 0.70;
    } else {
      base = 0.60;
    }
  }
  else if (shape.includes('pentagon') || shape.includes('pentagonal') || shape.includes('5-sided')) {
    base = 0.60;
  }
  // Fallback — assume round-like
  else {
    base = 0.35;
  }

  // Blend with spinPotential as secondary friction signal.
  // Geometry dominates (75%) because shape determines cross-section contact;
  // spinPotential adds lab-measured surface grip contribution (25%).
  const spinFactor = clamp01((s.spinPotential - SPIN_MIN) / (SPIN_MAX - SPIN_MIN));
  return clamp01(base * 0.75 + spinFactor * 0.25);
}

// ============================================
// D3 — Cross-section rotational resistance
// ============================================

/**
 * Derive the rotational resistance of a string's cross-section (0–1).
 * 0 = lowest resistance (mains pivot freely against this surface),
 * 1 = highest resistance (edges interfere with mains rotation).
 *
 * Physical basis: during snapback the mains rotate against the crosses.
 * A round cross presents a continuous curve — free pivot. Each additional
 * flat face or edge increases the chance of catching during rotation.
 */
export function deriveRotationalResistance(shape: string): number {
  const s = (shape || '').toLowerCase();

  if (s.includes('round')) return 0.10;
  if (s.includes('decagonal') || s.includes('10-sided')) return 0.20;
  if (s.includes('octagon')) return 0.30;
  if (s.includes('heptagonal') || s.includes('7-sided')) return 0.40;
  if (s.includes('hex')) return 0.45;
  if (s.includes('pentagon') || s.includes('pentagonal') || s.includes('5-sided')) return 0.55;
  if (s.includes('star') || s.includes('spiral')) return 0.85;
  if (s.includes('square') || s.includes('rectangular')) {
    if (s.includes('sharp') || s.includes('edge')) return 0.85;
    return 0.75;
  }
  // Fallback — assume round-like
  return 0.10;
}

// ============================================
// Main affinity function
// ============================================

/**
 * Compute the pairing affinity between mains and cross strings.
 * Pure function — no side effects, no state, no framework imports.
 *
 * Returns a breakdown of four physical interaction dimensions, each
 * scored 0–1, plus a weighted total. A score of 0.5 represents a
 * neutral/average interaction; above 0.5 is beneficial, below is
 * detrimental.
 */
export function computePairingAffinity(mains: StringData, crosses: StringData): AffinityBreakdown {
  // ── D1: Inter-string friction interaction ──
  // High mains friction + high cross friction = locked bed, poor snapback.
  // High mains friction + low cross friction = free mains return.
  const mainsFric = deriveFriction(mains);
  const crossFric = deriveFriction(crosses);
  const lockingProduct = mainsFric * crossFric;
  const frictionInteraction = clamp01(
    (1 - lockingProduct) * 0.7 + Math.max(0, mainsFric - crossFric) * 0.3
  );

  // ── D2: Stiffness differential ──
  // Softer cross absorbs load, adds dwell time and comfort. Optimal gap
  // derived from pool statistics: ~1 stddev (24 lb/in). Bell curve with
  // sigma = 0.75 stddev (18 lb/in). Cross stiffer than mains is detrimental.
  const gap = mains.stiffness - crosses.stiffness;
  let stiffnessDifferential: number;
  if (gap >= 0) {
    stiffnessDifferential = gaussian(gap, STIFFNESS_BELL_PEAK, STIFFNESS_BELL_SIGMA);
  } else {
    // Cross stiffer than mains — linear decay from the bell value at gap=0
    const valueAtZero = gaussian(0, STIFFNESS_BELL_PEAK, STIFFNESS_BELL_SIGMA);
    stiffnessDifferential = Math.max(0, valueAtZero * (1 + gap / STIFFNESS_BELL_PEAK));
  }

  // ── D3: Cross-section geometry interaction ──
  // The cross string's geometry determines how freely mains can rotate
  // against it. Only the cross geometry matters here — the mains are the
  // moving part; the cross provides the surface they rotate against.
  const crossResistance = deriveRotationalResistance(crosses.shape);
  const geometryInteraction = 1 - crossResistance;

  // ── D4: Spin potential compatibility ──
  // Mains should grab the ball; crosses should provide a stable platform.
  // A high-spin cross on a high-spin mains produces competing ball
  // interactions and inconsistent response.
  const mainsSpinNorm = clamp01((mains.spinPotential - SPIN_MIN) / (SPIN_MAX - SPIN_MIN));
  const crossSpinNorm = clamp01((crosses.spinPotential - SPIN_MIN) / (SPIN_MAX - SPIN_MIN));
  const crossDeviation = Math.abs(crossSpinNorm - 0.5);
  const competition = Math.max(0, crossSpinNorm - 0.5) * Math.max(0, mainsSpinNorm - 0.5);
  const spinCompatibility = clamp01(
    (1 - crossDeviation * 0.8) * (1 - competition * 1.5)
  );

  // ── Weighted composite ──
  const total =
    frictionInteraction * W_FRICTION +
    stiffnessDifferential * W_STIFFNESS +
    geometryInteraction * W_GEOMETRY +
    spinCompatibility * W_SPIN;

  return {
    frictionInteraction,
    stiffnessDifferential,
    geometryInteraction,
    spinCompatibility,
    total: clamp01(total),
  };
}
