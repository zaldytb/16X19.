// src/engine/pairingAffinity.ts
// Pairing affinity model for poly×poly hybrid string interactions.
//
// Models five physical dimensions of the mains-cross interaction at the crossing point.
// Each dimension is grounded in a specific physical mechanism; they are not calibrated
// to reproduce expected outputs but derived from the mechanics of snapback.
//
// The five dimensions:
//   D1 — Sliding friction: kinetic friction at the mains-cross interface during snapback
//   D2 — Platform compliance: cross stiffness as a snapback platform (piecewise, not bell)
//   D3 — Pivot freedom: bidirectional — mains rotation tendency × cross pivot resistance
//   D4 — Tension maintenance: tension-loss rate compatibility over play duration
//   Db — Edge contact stress: mains edge acuity × cross susceptibility (durability only)
//
// D1 and D3 replace the old frictionInteraction and geometryInteraction with
// corrected, physically separated inputs. D2 replaces the gaussian bell curve
// with a piecewise linear function matching the true compliance-snapback relationship.
// D4 replaces spinCompatibility, which was a redundant second encoding of D1.
// Db is a new dimension excluded from the composite total; it drives durabilityMod directly.

import type { StringData } from './types.js';

// ============================================
// Exported types
// ============================================

export interface AffinityBreakdown {
  frictionInteraction: number;     // 0-1
  edgeContactStress: number;       // 0-1 — high = durability risk; excluded from total
  platformCompliance: number;      // 0-1
  geometryInteraction: number;     // 0-1 — bidirectional pivot freedom
  tensionMaintenanceDiff: number;  // 0-1
  total: number;                   // 0-1 weighted composite
}

// ============================================
// Platform compliance constants
// ============================================

// Piecewise linear breakpoints for cross compliance vs. snapback platform quality.
// Physical shape: monotonically better as cross softens, peaks at OPTIMAL_GAP,
// then degrades sharply once the cross is soft enough to wrap around the mains edge.
const STIFF_FLOOR = 20;      // lb/in — cross stiffer than mains by this much: hard wall
const OPTIMAL_GAP = 35;      // lb/in — cross this much softer than mains: peak compliance
const WRAP_THRESHOLD = 75;   // lb/in — beyond this gap: wrapping failure regime

// ============================================
// Tension maintenance constants
// ============================================

// Pool range of tensionLoss: approximately 10%–50% (per string-profile.ts L1 norms).
// MAX_TENSION_DELTA represents the range where divergence is physically severe.
const MAX_TENSION_DELTA = 28;

// ============================================
// Edge contact stress constants
// ============================================

const CROSS_MIN_STIFF = 115;  // lb/in — minimum stiffness in string pool
const CROSS_MAX_STIFF = 234;  // lb/in — maximum stiffness in string pool
const MAX_TENSION_LOSS = 50;  // % — maximum tensionLoss in pool

// ============================================
// Dimension weights (sum to 1.0, Db excluded)
// ============================================

const W_FRICTION    = 0.30;  // primary snapback efficiency driver
const W_COMPLIANCE  = 0.25;  // cross as platform
const W_PIVOT       = 0.25;  // mains rotation freedom
const W_TENSION     = 0.20;  // tension maintenance compatibility (acts over time, weighted lower)

// ============================================
// Helpers
// ============================================

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ============================================
// D1 helpers — Sliding friction derivation
// ============================================

/**
 * Derive a friction factor (0–1) from the string's cross-section shape descriptor.
 *
 * The `context` parameter separates two physically distinct roles:
 *
 * 'cross' context (the surface the mains slides against):
 *   Geometry is the primary driver — flat faces and edges increase mechanical
 *   resistance to the mains sliding across them. Cross surface features dominate.
 *
 * 'mains' context (the moving string sliding across the cross):
 *   Only surface treatment signals matter for sliding friction — slick coatings
 *   reduce kinetic friction regardless of geometry. Geometry drives edge contact
 *   stress (Db), which is a separate mechanism handled by deriveEdgeAcuity.
 *   Using geometry here would conflate two independent mechanisms.
 */
export function deriveFriction(s: StringData, context: 'mains' | 'cross'): number {
  const shape = (s.shape || '').toLowerCase();

  if (context === 'mains') {
    // Only surface treatment signals determine mains sliding friction.
    // Geometry is deliberately excluded — it belongs in deriveEdgeAcuity.
    let base: number;
    if (shape.includes('ultra-slick') || (shape.includes('slick') && shape.includes('silicone'))) {
      base = 0.12;
    } else if (shape.includes('slick') || shape.includes('silicone')) {
      base = 0.18;
    } else if (shape.includes('coated')) {
      base = 0.27;
    } else if (shape.includes('abrasive') || shape.includes('textured')) {
      base = 0.65;
    } else {
      // No surface treatment signal: neutral material-based sliding
      base = 0.38;
    }
    // spinPotential is a lab-measured surface grip signal; blend at 15%
    // (valid secondary proxy for string-to-string surface contact, not geometry)
    const spinFactor = clamp01((s.spinPotential - 4.5) / (9.4 - 4.5));
    return clamp01(base * 0.85 + spinFactor * 0.15);
  }

  // 'cross' context: geometry drives resistance to mains sliding across the surface.
  // Order matters — check specific modifiers before general geometry.
  let base: number;

  if (shape.includes('round')) {
    if (shape.includes('ultra-slick') || (shape.includes('slick') && shape.includes('silicone'))) {
      base = 0.15;
    } else if (shape.includes('slick') || shape.includes('silicone')) {
      base = 0.20;
    } else if (shape.includes('coated')) {
      base = 0.25;
    } else if (shape.includes('textured') || shape.includes('abrasive')) {
      base = 0.55;
    } else {
      base = 0.35;
    }
  } else if (shape.includes('square') || shape.includes('rectangular')) {
    if (shape.includes('textured') || shape.includes('abrasive') || shape.includes('sharp') || shape.includes('edge')) {
      base = 0.85;
    } else {
      base = 0.75;
    }
  } else if (shape.includes('star') || shape.includes('spiral')) {
    base = 0.80;
  } else if (shape.includes('decagonal') || shape.includes('10-sided')) {
    base = shape.includes('slick') || shape.includes('silicone') ? 0.35 : 0.45;
  } else if (shape.includes('octagon')) {
    if (shape.includes('slick') || shape.includes('silicone')) base = 0.35;
    else if (shape.includes('textured')) base = 0.55;
    else base = 0.45;
  } else if (shape.includes('heptagonal') || shape.includes('7-sided')) {
    base = 0.60;
  } else if (shape.includes('hex')) {
    base = shape.includes('textured') ? 0.70 : 0.60;
  } else if (shape.includes('pentagon') || shape.includes('pentagonal') || shape.includes('5-sided')) {
    base = 0.60;
  } else {
    base = 0.35; // fallback: round-like
  }

  const spinFactor = clamp01((s.spinPotential - 4.5) / (9.4 - 4.5));
  return clamp01(base * 0.75 + spinFactor * 0.25);
}

// ============================================
// D3 helper — Cross-section rotational resistance (cross)
// ============================================

/**
 * Derive the rotational resistance of a cross string's cross-section (0–1).
 * 0 = lowest resistance (mains pivot freely against this surface),
 * 1 = highest resistance (edges interfere with mains rotation).
 *
 * Physical basis: during snapback the mains rotates against the cross surface.
 * A round cross presents a continuous convex curve — free pivot.
 * Each additional flat face or sharp edge increases the detent probability.
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
  return 0.10; // fallback: round-like
}

// ============================================
// Db helper — Mains edge acuity
// ============================================

/**
 * Derive the edge acuity of a mains string's cross-section (0–1).
 * 0 = no edge contact stress (round), 1 = maximum (star/square).
 *
 * Physical basis: during snapback the mains edge slides across the cross surface
 * under tension load. Sharper edges concentrate stress (Hertzian contact) into a
 * smaller cross surface area. This is entirely geometry-driven — surface treatment
 * does not affect the mechanical stress concentration at the contact point.
 * Coatings wear off at the edge contact zone within the first few hours of play.
 */
export function deriveEdgeAcuity(shape: string): number {
  const s = (shape || '').toLowerCase();

  if (s.includes('round')) return 0.00;
  if (s.includes('decagonal') || s.includes('10-sided')) return 0.15;
  if (s.includes('octagon')) return 0.25;
  if (s.includes('heptagonal') || s.includes('7-sided')) return 0.35;
  if (s.includes('hex')) return 0.40;
  if (s.includes('pentagon') || s.includes('pentagonal') || s.includes('5-sided')) return 0.55;
  if (s.includes('square') || s.includes('rectangular')) return 0.80;
  if (s.includes('star') || s.includes('spiral')) return 0.90;
  return 0.00; // fallback: no acuity data
}

// ============================================
// D3 helper — Mains rotation tendency
// ============================================

/**
 * Derive the rotation tendency of a mains string about its long axis (0–1).
 * 0 = no rotation (round), 1 = strong rotation (star/square).
 *
 * Physical basis: asymmetric cross-sections rotate to seek their minimum-energy
 * orientation during deflection. On return (snapback), the mains rotates back.
 * A round mains has no preferred orientation — it does not meaningfully rotate.
 * A shaped mains with distinct flat faces rotates to align them, creating the
 * rolling-edge snap that drives spin. This rotation tendency interacts with cross
 * pivot resistance to determine whether snapback is clean or impeded.
 */
export function deriveMainsRotationTendency(shape: string): number {
  const s = (shape || '').toLowerCase();

  if (s.includes('round')) return 0.05;
  if (s.includes('decagonal') || s.includes('10-sided')) return 0.15;
  if (s.includes('octagon')) return 0.25;
  if (s.includes('heptagonal') || s.includes('7-sided')) return 0.45;
  if (s.includes('hex')) return 0.40;
  if (s.includes('pentagon') || s.includes('pentagonal') || s.includes('5-sided')) return 0.55;
  if (s.includes('square') || s.includes('rectangular')) return 0.75;
  if (s.includes('star') || s.includes('spiral')) return 0.80;
  return 0.05; // fallback: no rotation
}

// ============================================
// D2 — Platform compliance (piecewise linear)
// ============================================

/**
 * Score the cross string's compliance as a snapback platform (0–1).
 *
 * Physical basis: the cross must resist lateral displacement during snapback
 * while absorbing the impulsive peak load. The relationship is monotonically
 * beneficial as the cross softens (up to a threshold), then degrades sharply
 * once the cross is soft enough for the mains edge to sink into it rather than
 * slide across it — the wrapping failure regime.
 *
 * This is NOT a bell curve. The gaussian in the prior model was an outcome-fitted
 * artifact. The piecewise function below is derived from the physical failure
 * modes: hard wall (stiffer cross), optimal compliance range, wrapping failure.
 *
 * gap = mains.stiffness − crosses.stiffness (positive = mains stiffer = softer cross)
 */
function calcPlatformCompliance(mainsStiff: number, crossStiff: number): number {
  const gap = mainsStiff - crossStiff;

  if (gap < -STIFF_FLOOR) {
    // Cross much stiffer than mains — hard wall, no compliance benefit
    return 0.10;
  } else if (gap < 0) {
    // Cross slightly stiffer approaching equal: linear 0.10 → 0.40
    return 0.10 + (gap + STIFF_FLOOR) / STIFF_FLOOR * 0.30;
  } else if (gap <= OPTIMAL_GAP) {
    // Mains progressively stiffer — cross becoming optimally compliant: linear 0.40 → 1.00
    return 0.40 + (gap / OPTIMAL_GAP) * 0.60;
  } else if (gap <= WRAP_THRESHOLD) {
    // Cross too soft, wrapping risk begins: linear 1.00 → 0.40
    return 1.00 - ((gap - OPTIMAL_GAP) / (WRAP_THRESHOLD - OPTIMAL_GAP)) * 0.60;
  } else {
    // Cross extremely soft — wrapping failure regime
    return 0.10;
  }
}

// ============================================
// Main affinity function
// ============================================

/**
 * Compute the pairing affinity between mains and cross strings.
 * Pure function — no side effects, no state, no framework imports.
 *
 * Returns a breakdown of five physical interaction dimensions.
 * A score of 0.5 represents neutral/average interaction for D1–D4.
 * `edgeContactStress` is a risk score: 0 = none, 1 = maximum abrasion risk.
 *
 * `total` is the weighted composite of D1, D2, D3, D4 only.
 * `edgeContactStress` is excluded from `total` — it routes to durabilityMod
 * separately and should not contaminate the performance composite.
 */
export function computePairingAffinity(mains: StringData, crosses: StringData): AffinityBreakdown {
  // ── D1: Sliding friction interaction ──
  // Mains surface friction × cross surface friction. High locking product =
  // mains drags, energy dissipated. High mains friction relative to cross =
  // mains grips and releases cleanly (beneficial for spin transfer).
  // `deriveFriction` is now context-aware: mains path strips geometry to
  // avoid conflating edge contact stress with surface sliding friction.
  const mainsFric = deriveFriction(mains, 'mains');
  const crossFric = deriveFriction(crosses, 'cross');
  const lockingProduct = mainsFric * crossFric;
  const frictionInteraction = clamp01(
    (1 - lockingProduct) * 0.7 + Math.max(0, mainsFric - crossFric) * 0.3
  );

  // ── D2: Platform compliance ──
  // Piecewise linear function replacing the gaussian bell curve.
  // Physically correct shape: monotonically beneficial until wrapping failure threshold.
  const platformCompliance = calcPlatformCompliance(mains.stiffness || 200, crosses.stiffness || 200);

  // ── D3: Pivot freedom (bidirectional) ──
  // Prior model: geometryInteraction = 1 − crossResistance (cross only).
  // Corrected: pivot interference requires both a mains that rotates AND a cross
  // that resists that rotation. A round mains generates no rotation and therefore
  // cross geometry is irrelevant to pivot freedom.
  const mainsRotation = deriveMainsRotationTendency(mains.shape);
  const crossResistance = deriveRotationalResistance(crosses.shape);
  const geometryInteraction = clamp01(1 - (mainsRotation * crossResistance));

  // ── D4: Tension maintenance compatibility ──
  // Replaces spinCompatibility, which was modeling "competing ball interactions"
  // — a mechanism that does not exist (the cross does not contact the ball).
  // Its actual behavior was a redundant second encoding of inter-string friction (D1).
  //
  // Tension maintenance divergence is the real mechanism D4 should capture:
  // when mains and cross lose tension at different rates, the bed becomes
  // geometrically asymmetric. Control consistency degrades proportionally.
  const tensionDelta = Math.abs((mains.tensionLoss || 20) - (crosses.tensionLoss || 20));
  const tensionMaintenanceDiff = clamp01(1 - tensionDelta / MAX_TENSION_DELTA);

  // ── Db: Edge contact stress ──
  // Not a "performance" dimension — it is a durability failure risk.
  // Excluded from total; consumed directly by durabilityMod in hybrid.ts.
  //
  // Mains edge acuity drives the Hertzian contact stress at the crossing point.
  // Cross susceptibility is a combination of cross stiffness (structural resistance
  // to notching) and cross tensionLoss (proxy for material softness — high-loss
  // strings have softer outer materials that notch more readily).
  const mainsAcuity = deriveEdgeAcuity(mains.shape);
  const crossSusceptibility = clamp01(
    1 - ((crosses.stiffness || 200) - CROSS_MIN_STIFF) / (CROSS_MAX_STIFF - CROSS_MIN_STIFF)
  );
  const crossLossFactor = clamp01((crosses.tensionLoss || 20) / MAX_TENSION_LOSS);
  const edgeContactStress = clamp01(
    mainsAcuity * (crossSusceptibility * 0.6 + crossLossFactor * 0.4)
  );

  // ── Weighted composite (D1 + D2 + D3 + D4 only) ──
  const total = clamp01(
    frictionInteraction  * W_FRICTION   +
    platformCompliance   * W_COMPLIANCE +
    geometryInteraction  * W_PIVOT      +
    tensionMaintenanceDiff * W_TENSION
  );

  return {
    frictionInteraction,
    edgeContactStress,
    platformCompliance,
    geometryInteraction,
    tensionMaintenanceDiff,
    total,
  };
}
