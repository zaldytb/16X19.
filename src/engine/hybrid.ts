// src/engine/hybrid.ts
// Hybrid string interaction calculations

import type { StringData, HybridMod } from './types';
import { computePairingAffinity, deriveEdgeAcuity } from './pairingAffinity.js';

/**
 * PREDICTION LAYER 3 — Hybrid interaction analysis.
 * Evaluates how mains and crosses work together in a hybrid setup.
 * Different material pairings have different optimal characteristics.
 * @param mainsData — string data for mains
 * @param crossesData — string data for crosses
 * @returns modifier deltas for hybrid pairing
 */
export function calcHybridInteraction(mainsData: StringData, crossesData: StringData): HybridMod {
  const mainsMat = mainsData.material;
  const crossMat = crossesData.material;
  const isGutMains = mainsMat === 'Natural Gut';
  const isMultiMains = mainsMat === 'Multifilament';
  const isSoftMains = isGutMains || isMultiMains;
  const isPolyMains = mainsMat === 'Polyester' || mainsMat === 'Co-Polyester (elastic)';
  const isPolyCross = crossMat === 'Polyester' || crossMat === 'Co-Polyester (elastic)';
  const isGutCross = crossMat === 'Natural Gut';
  const isSoftCross = crossMat === 'Natural Gut' || crossMat === 'Multifilament' || crossMat === 'Synthetic Gut';

  // Cross string properties
  const crossStiff = crossesData.stiffness || 200;
  const crossStiffNorm = Math.max(0, Math.min(1, (crossStiff - 115) / (234 - 115)));
  const crossShape = (crossesData.shape || '').toLowerCase();
  const crossIsRound = crossShape.includes('round');
  const crossIsShaped = !crossIsRound && (crossShape.includes('pentagon') || crossShape.includes('hex') || crossShape.includes('square') || crossShape.includes('star') || crossShape.includes('octagon') || crossShape.includes('heptagonal'));
  const crossIsSlick = crossShape.includes('slick') || crossShape.includes('coated') || crossShape.includes('silicone');
  const crossIsElastic = crossMat === 'Co-Polyester (elastic)';

  // Mains properties
  const mainsStiff = mainsData.stiffness || 200;
  const mainsShape = (mainsData.shape || '').toLowerCase();
  const mainsIsShaped = mainsShape.includes('pentagon') || mainsShape.includes('hex') || mainsShape.includes('square') || mainsShape.includes('star') || mainsShape.includes('octagon') || mainsShape.includes('heptagonal') || mainsShape.includes('textured');

  // Result object: modifiers applied AFTER the base hybrid blend
  const mods: HybridMod = {
    powerMod: 0,
    spinMod: 0,
    controlMod: 0,
    comfortMod: 0,
    feelMod: 0,
    durabilityMod: 0,
    playabilityMod: 0,
    launchMod: 0
  };

  // CASE 1: GUT/MULTI MAINS + POLY CROSSES
  if (isSoftMains && isPolyCross) {
    mods.comfortMod += 1;
    mods.controlMod += 2;
    mods.launchMod -= 0.5;

    if (crossIsRound || crossIsSlick) {
      mods.durabilityMod += 3;
      mods.feelMod += 1;
    } else if (crossIsShaped) {
      mods.durabilityMod -= 5;
      mods.feelMod -= 2;
      mods.comfortMod -= 2;
      mods.spinMod -= 1;
    }

    if (crossStiffNorm < 0.4) {
      mods.feelMod += 1;
      mods.comfortMod += 1;
    } else if (crossStiffNorm > 0.7) {
      mods.feelMod -= 1;
      mods.comfortMod -= 1;
      mods.powerMod -= 1;
    }

    if (crossIsElastic) {
      mods.feelMod += 1;
      mods.durabilityMod += 2;
      mods.comfortMod += 1;
    }

    mods.durabilityMod -= 3;
  }

  // CASE 2: POLY MAINS + POLY CROSSES
  else if (isPolyMains && isPolyCross) {
    if (mainsIsShaped) {
      mods.spinMod += 1.5;
      mods.controlMod += 0.5;
    }

    const mainsIsRound = mainsShape.includes('round');
    if (mainsIsRound && !mainsIsShaped) {
      mods.spinMod -= 0.5;
    }

    if (crossIsRound || crossIsSlick) {
      mods.spinMod += 1.5;
      mods.controlMod += 1;
    }

    if (mainsIsShaped && (crossIsRound || crossIsSlick)) {
      mods.spinMod += 1;
      mods.controlMod += 0.5;
      mods.feelMod += 0.5;
    }

    if (mainsIsRound && crossIsShaped) {
      mods.spinMod -= 2.5;
      mods.feelMod -= 1.5;
      mods.controlMod -= 1;
      mods.comfortMod -= 0.5;
    }

    if (mainsIsShaped && crossIsShaped) {
      mods.spinMod -= 2;
      mods.feelMod -= 1;
      mods.comfortMod -= 1;
    }

    if (mainsStiff > crossStiff + 15) {
      mods.controlMod += 0.5;
    } else if (crossStiff > mainsStiff + 15) {
      mods.feelMod -= 0.5;
    }

    const stiffGap = Math.abs(mainsStiff - crossStiff);
    if (stiffGap > 60) {
      mods.feelMod -= 1;
      mods.controlMod -= 0.5;
    }

    // ── Pairing affinity — physical interaction model ──
    // Five physically grounded dimensions, each centered at 0.5 (neutral).
    // edgeContactStress is a risk score (high = bad), routed to durabilityMod directly.
    const affinity = computePairingAffinity(mainsData, crossesData);

    // D1: Sliding friction → snapback efficiency → spin and feel
    mods.spinMod += (affinity.frictionInteraction - 0.5) * 3;
    mods.feelMod += (affinity.frictionInteraction - 0.5) * 2;

    // D2: Platform compliance → cross absorbs shock → comfort and power dwell
    mods.comfortMod += (affinity.platformCompliance - 0.5) * 3;
    mods.powerMod   += (affinity.platformCompliance - 0.5) * 1.5;

    // D3: Pivot freedom (bidirectional) → clean mains return → spin consistency and control
    mods.spinMod    += (affinity.geometryInteraction - 0.5) * 2;
    mods.controlMod += (affinity.geometryInteraction - 0.5) * 1;

    // D4: Tension maintenance compatibility → control consistency over play duration
    mods.controlMod     += (affinity.tensionMaintenanceDiff - 0.5) * 2.5;
    mods.playabilityMod += (affinity.tensionMaintenanceDiff - 0.5) * 1.5;

    // Db: Edge contact stress → durability notching risk (unidirectional — always negative)
    mods.durabilityMod -= affinity.edgeContactStress * 4;

    mods._affinityBreakdown = affinity;
  }

  // CASE 3: POLY MAINS + GUT/MULTI CROSSES
  else if (isPolyMains && isSoftCross) {
    mods.feelMod += 1.5;
    mods.comfortMod += 1;
    mods.powerMod += 0.5;

    if (isGutCross) {
      mods.powerMod -= 1;
      mods.feelMod -= 0.5;
      mods.durabilityMod -= 5;
      mods.playabilityMod -= 2;
    } else {
      mods.durabilityMod -= 2;
      mods.playabilityMod -= 1;
    }

    if (mainsIsShaped && isGutCross) {
      mods.durabilityMod -= 3;
      mods.comfortMod -= 1;
    }

    // Shaped poly mains on soft cross: Hertzian edge stress notching penalty.
    // Continuous function over acuity × tensionLoss so partial shapes get partial penalty.
    // Threshold at tensionLoss=20 below which cross material is firm enough to resist.
    {
      const mainsAcuity = deriveEdgeAcuity(mainsData.shape);
      const crossLoss = crossesData.tensionLoss || 0;
      if (mainsAcuity > 0 && crossLoss > 20) {
        const notchingRisk = mainsAcuity * ((crossLoss - 20) / 30);
        mods.durabilityMod -= notchingRisk * 5;
      }
    }
  }

  // CASE 4: GUT MAINS + GUT CROSSES (full gut)
  else if (isGutMains && isGutCross) {
    mods.feelMod += 3;
    mods.comfortMod += 2;
    mods.powerMod += 1;
    mods.durabilityMod -= 6;
    mods.controlMod -= 2;
    mods.spinMod -= 2;
  }

  // CASE 5: SOFT MAINS + SOFT CROSSES
  else if (isSoftMains && isSoftCross && !isGutMains && !isGutCross) {
    mods.comfortMod += 1;
    mods.durabilityMod -= 1;
    mods.controlMod -= 1;
  }

  // ── Tension maintenance divergence penalty (all non-poly×poly cases) ──
  // Case 2 (poly×poly) handles this through affinity D4 (tensionMaintenanceDiff).
  // For all other material pairings, apply a direct penalty when tension-loss rates
  // diverge significantly: the bed becomes geometrically asymmetric over play duration,
  // degrading control consistency and setup longevity.
  if (!(isPolyMains && isPolyCross)) {
    const tensionDelta = Math.abs((mainsData.tensionLoss || 20) - (crossesData.tensionLoss || 20));
    if (tensionDelta > 12) {
      const excess = tensionDelta - 12;
      mods.controlMod     -= excess * 0.15;
      mods.playabilityMod -= excess * 0.10;
    }
  }

  return mods;
}
