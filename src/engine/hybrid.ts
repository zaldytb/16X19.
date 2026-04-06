// src/engine/hybrid.ts
// Hybrid string interaction calculations

import type { StringData, HybridMod } from './types';
import { computePairingAffinity } from './pairingAffinity.js';

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
    // Converts four dimension scores into attribute deltas. Each dimension
    // is centered at 0.5 (neutral); above adds benefit, below adds penalty.
    // Multipliers reflect the physical sensitivity of each attribute to each
    // interaction dimension.
    const affinity = computePairingAffinity(mainsData, crossesData);

    // Friction interaction -> snapback quality -> spin efficiency and feel
    mods.spinMod += (affinity.frictionInteraction - 0.5) * 3;
    mods.feelMod += (affinity.frictionInteraction - 0.5) * 2;

    // Stiffness differential -> load absorption -> comfort and dwell time (power)
    mods.comfortMod += (affinity.stiffnessDifferential - 0.5) * 3;
    mods.powerMod += (affinity.stiffnessDifferential - 0.5) * 1.5;

    // Geometry interaction -> mains rotation freedom -> spin consistency, control
    mods.spinMod += (affinity.geometryInteraction - 0.5) * 2;
    mods.controlMod += (affinity.geometryInteraction - 0.5) * 1;

    // Spin compatibility -> response consistency -> feel, playability
    mods.feelMod += (affinity.spinCompatibility - 0.5) * 2;
    mods.playabilityMod += (affinity.spinCompatibility - 0.5) * 1.5;

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

  return mods;
}
