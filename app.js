// TENNIS LOADOUT LAB — Engine + UI
// ============================================
// EXTRACTION STATUS (Phase 2) - COMPLETE:
//   EXTRACTED: data imports → src/data/loader.js
//   EXTRACTED: engine constants → src/engine/constants.js
//   EXTRACTED: frame physics → src/engine/frame-physics.js
//   EXTRACTED: string profile → src/engine/string-profile.js
//   EXTRACTED: tension → src/engine/tension.js
//   EXTRACTED: hybrid → src/engine/hybrid.js
//   EXTRACTED: composite → src/engine/composite.js
//   EXTRACTED: engine index → src/engine/index.js
//   EXTRACTED: theme → src/ui/theme.js
//   EXTRACTED: leaderboard → src/ui/pages/leaderboard.js (MOVED + DEDUPLICATED)
//   CREATED: state modules → src/state/loadout.js, setup-sync.js
//   CREATED: utils → src/utils/helpers.js
//   CREATED: nav → src/ui/nav.js
//   REDUCED: app.js from ~12,548 to ~11,292 lines (-1,256 lines)
//   REDUCED: bundle size from ~104 KB to ~97 KB gzipped
// ============================================
// PREDICTION ENGINE
// ============================================

import { RACQUETS, STRINGS, FRAME_META } from './src/data/loader.js';
import {
  GAUGE_OPTIONS, GAUGE_LABELS, STAT_KEYS, STAT_LABELS, STAT_LABELS_FULL,
  STAT_CSS_CLASSES, STAT_GROUPS, OBS_TIERS, WTTN_ATTRS, WTTN_ATTR_LABELS,
  IDENTITY_FAMILIES, LB_STATS, DEFAULT_PRESETS
} from './src/engine/constants.js';
import {
  clamp, lerp, norm, getPatternOpenness, getAvgBeam, getMaxBeam, getMinBeam,
  isVariableBeam, calcFrameBase, normalizeRawSpecs
} from './src/engine/frame-physics.js';
import {
  calcBaseStringProfile, calcStringFrameMod, applyGaugeModifier, getGaugeOptions
} from './src/engine/string-profile.js';
import {
  calcTensionModifier, buildTensionContext
} from './src/engine/tension.js';
import {
  predictSetup, computeCompositeScore,
  getObsTier, getObsScoreColor, generateIdentity, classifySetup
} from './src/engine/composite.js';
import { calcHybridInteraction } from './src/engine/hybrid.js';
import { loadSavedLoadouts, persistSavedLoadouts, setActiveLoadout as _stateSetActiveLoadout, setSavedLoadouts as _stateSetSavedLoadouts, getSetupFromLoadout } from './src/state/loadout.js';
import { getActiveLoadout, setActiveLoadout, getSavedLoadouts, setSavedLoadouts, addSavedLoadout, removeSavedLoadout, updateSavedLoadout } from './src/state/store.js';
import { createSearchableSelect, ssInstances, _initQaSearchable } from './src/ui/components/searchable-select.js';
import { 
  encodeLoadoutToURL, 
  decodeLoadoutFromURL, 
  generateShareURL,
  showShareToast,
  copyToClipboard,
  exportLoadoutsToFile,
  importLoadoutsFromJSON,
  parseSharedBuildFromURL
} from './src/utils/share.js';
import { 
  generateTopBuilds, 
  pickDiverseBuilds, 
  generateBuildReason,
  ARCHETYPE_COLORS 
} from './src/state/presets.js';

// ============================================
// GAUGE SYSTEM (imported from string-profile.js)
// ============================================
// The base string data is the "reference" measurement (at its own gaugeNum).
// Moving to a different gauge shifts stiffness, spin, durability, etc.
function __applyGaugeModifier_OLD(stringData, selectedGauge) {
  if (!selectedGauge || selectedGauge === stringData.gaugeNum) {
    return stringData; // No change needed — using reference gauge
  }

  const refGauge = stringData.gaugeNum;  // e.g. 1.30
  const delta = selectedGauge - refGauge; // negative = thinner, positive = thicker
  // Steps of 0.05mm (each step = one standard gauge jump)
  const steps = delta / 0.05;

  // --- Stiffness: ~6% change per 0.05mm step ---
  // Thinner → softer, thicker → stiffer
  const stiffMult = 1 + steps * 0.06;
  const newStiffness = stringData.stiffness * stiffMult;

  // --- Tension loss: thicker strings lose tension slightly faster (more material creep) ---
  const newTensionLoss = stringData.tensionLoss * (1 + steps * 0.04);

  // --- Spin potential: thinner gauge slightly more spin (more bite, easier snapback) ---
  const newSpinPot = stringData.spinPotential - steps * 0.15;

  // --- twScore adjustments ---
  // Per gauge step: power ±2, comfort ±1.5, feel ±2, control ∓1.5, durability ∓3, spin ±1
  const tw = { ...stringData.twScore };
  tw.power = Math.max(30, Math.min(98, tw.power - steps * 2));        // thinner = more power
  tw.comfort = Math.max(30, Math.min(98, tw.comfort - steps * 1.5));  // thinner = more comfort
  tw.feel = Math.max(30, Math.min(98, tw.feel - steps * 2));          // thinner = better feel
  tw.control = Math.max(30, Math.min(98, tw.control + steps * 1.5));  // thinner = less control
  tw.durability = Math.max(20, Math.min(98, tw.durability + steps * 3)); // thinner = less durable
  tw.spin = Math.max(30, Math.min(98, tw.spin - steps * 1));          // thinner = more spin
  tw.playabilityDuration = Math.max(30, Math.min(98, tw.playabilityDuration - steps * 0.5)); // minor effect

  // Return a new object with all original properties + gauge adjustments
  return {
    ...stringData,
    gaugeNum: selectedGauge,
    gauge: GAUGE_LABELS[selectedGauge] || `${selectedGauge.toFixed(2)}mm`,
    stiffness: Math.max(80, newStiffness),
    tensionLoss: Math.max(5, Math.min(60, newTensionLoss)),
    spinPotential: Math.max(3, Math.min(10, newSpinPot)),
    twScore: tw,
    _gaugeModified: true,
    _refGauge: refGauge
  };
}

// ============================================
// LAYER 1: BASE STRING PROFILE (imported from string-profile.js)
// ============================================

// Stub: calcBaseStringProfile imported from string-profile.js
function _calcBaseStringProfileStub(stringData) {
  const tw = stringData.twScore;
  const stiff = stringData.stiffness; // lb/in: 115 (Truffle X elastic) to 234 (RPM Blast 17). All values TWU-measured or estimated in same unit.
  const tLoss = stringData.tensionLoss; // %: 10 (gut/Truffle X) to 48.3 (Hawk Power). Percentage of initial tension lost after break-in.
  const spinPot = stringData.spinPotential; // TWU lab scale: 4.5 (RPM Blast 16) to 9.4 (O-Toro). Measures friction-based spin generation.

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
  // Shaped strings get small bonus (already reflected in spinPotential mostly)

  // --- Comfort: twScore primary, stiffness confirms ---
  let comfort = compressScore(tw.comfort);
  comfort += stiffNorm * 4 - 1.5; // soft: up to +2.5, stiff: down to -1.5

  // --- Feel: twScore primary, stiffness + material secondary ---
  let feel = compressScore(tw.feel);
  if (stringData.material === 'Natural Gut') feel += 3; // gut has unmatched feel, but capped to avoid runaway
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
  // 86 cap prevents any single string from pushing a stat dimension
  // too far from the mean — even gut shouldn't produce a 89+ feel base.
  const capLow = 25, capHigh = 86;
  const profile = {
    power: Math.round(Math.max(capLow, Math.min(capHigh, power))),
    spin: Math.round(Math.max(capLow, Math.min(capHigh, spin))),
    control: Math.round(Math.max(capLow, Math.min(capHigh, control))),
    feel: Math.round(Math.max(capLow, Math.min(capHigh, feel))),
    comfort: Math.round(Math.max(capLow, Math.min(capHigh, comfort))),
    durability: Math.round(Math.max(capLow, Math.min(capHigh, durability))),
    playability: Math.round(Math.max(capLow, Math.min(capHigh, playability)))
  };

  return profile;
}

// ============================================
// LAYER 2: FRAME INTERACTION (imported from string-profile.js)
// ============================================

// Stub: calcStringFrameMod imported from string-profile.js
function _calcStringFrameModStub(stringData) {
  const stiff = stringData.stiffness;
  // Clamped normalization: 0 = stiffest (234), 1 = softest (115)
  const stiffNorm = Math.max(0, Math.min(1, lerp(stiff, 115, 234, 1, 0)));
  const spinPot = stringData.spinPotential;

  // Layer 2 mods: how string stiffness interacts with the frame.
  // Stiffness already shapes the string profile (L1); these capture the
  // frame-coupling effect only. Kept intentionally small to avoid
  // double-counting stiffness through two additive paths.
  return {
    powerMod: stiffNorm * 3 - 1,          // soft: up to +2, stiff: -1
    spinMod: (spinPot - 6.0) * 1.5,       // centered at 6.0, ±1.5 per point
    controlMod: (1 - stiffNorm) * 3 - 1,  // stiff: up to +2, soft: -1
    comfortMod: stiffNorm * 3 - 1,        // soft: up to +2, stiff: -1
    feelMod: stiffNorm * 2.5 - 0.5,       // soft: up to +2, stiff: -0.5 (gut bonus is in L1 profile only)
    launchMod: stiffNorm * 1.5 - 0.4      // soft strings add slight launch
  };
}

/**
 * PREDICTION LAYER 2 — Tension overlay.
 * Returns per-attribute deltas based on absolute tension level and the
 * mains/crosses differential. Pattern-aware: open beds (≤18 crosses) reward
 * mains-tighter differentials for spin/snapback, while dense beds (≥20 crosses)
 * prefer near-equal tension — reversing this degrades the score.
 * Every 2 lbs above frame midpoint: ~+2 control, ~−2 power (absolute level effect).
 * @param {number} mainsTension
 * @param {number} crossesTension
 * @param {number[]} tensionRange — [min, max] from racquet spec (used to find midpoint)
 * @param {string} pattern — e.g. "16x19"
 * @returns {Object} per-attribute modifier deltas
 */
function __calcTensionModifier_OLD(mainsTension, crossesTension, tensionRange, pattern) {
  const avgTension = (mainsTension + crossesTension) / 2;
  const mid = (tensionRange[0] + tensionRange[1]) / 2;
  const diff = avgTension - mid;
  // Every 2 lbs above midpoint: +2 control, -2 power
  const factor = diff / 2;

  // --- Pattern-aware mains/crosses differential ---
  // The interaction between mains and crosses changes fundamentally
  // with cross density. Dense 20-cross beds are already "locked" by geometry,
  // so the differential sweet spot shifts.
  const differential = mainsTension - crossesTension;
  const absDiff = Math.abs(differential);
  const [patMains, patCrosses] = (pattern || '16x19').split('x').map(Number);
  const isDense20 = patCrosses >= 20;  // 16x20, 18x20 etc.
  const isOpen = patCrosses <= 18;     // 16x18, 16x19

  let diffSpinBonus = 0;
  let diffControlMod = 0;
  let diffComfortMod = 0;
  let diffDurabilityMod = 0;
  let diffFeelMod = 0;
  let diffLaunchMod = 0;

  if (isDense20) {
    // ===== DENSE 20-CROSS PATTERNS =====
    // Short, numerous crosses are already effectively stiff.
    // "Mains tighter" can over-constrain the bed, killing snapback.
    // "Crosses equal or slightly tighter" can yield a more uniform, 
    // linear, predictable response — good for flat drives.
    //
    // Optimal zone: differential -2 to +2 (near equal)
    // Acceptable: crosses up to 3 lbs tighter (locks grid for control)
    // Bad: mains much tighter (>+4) — chokes snapback, feels dead

    if (absDiff <= 2) {
      // Sweet spot for dense beds: near-equal tension
      diffControlMod = 0.5;  // slight control bonus for uniform bed
      diffFeelMod = 0.5;     // consistent feel
    } else if (differential >= -3 && differential < -1) {
      // Crosses 1-3 lbs tighter — valid dense-pattern technique
      // Firms up the grid, lower launch, more linear response
      diffControlMod = 1.0;
      diffLaunchMod = differential * 0.4;  // lower launch (negative)
      diffFeelMod = 0.3;  // more uniform feel
      diffSpinBonus = -0.5; // small spin tradeoff (less snapback)
    } else if (differential > 2 && differential <= 4) {
      // Mains 3-4 lbs tighter on dense bed — diminishing returns
      // Cross matrix already stiff, extra main tension doesn't help much
      diffSpinBonus = 0.5;  // less benefit than on open patterns
      diffControlMod = -0.5;
    } else if (differential > 4) {
      // Mains way tighter on dense bed — BAD
      // Over-constrains mains, kills snapback, dead bed
      diffSpinBonus = -(differential - 4) * 0.5;
      diffControlMod = -(differential - 4) * 0.8;
      diffComfortMod = -(differential - 4) * 0.6;
      diffFeelMod = -(differential - 4) * 0.8;
      diffDurabilityMod = -(differential - 4) * 1.0;
    } else if (differential < -3) {
      // Crosses way too tight — excessive even for dense beds
      diffControlMod = -(absDiff - 3) * 0.6;
      diffComfortMod = -(absDiff - 3) * 0.5;
      diffFeelMod = -(absDiff - 3) * 0.4;
    }

  } else if (isOpen) {
    // ===== OPEN PATTERNS (16x18, 16x19) =====
    // Open beds start "loose" — designed for spin and snapback.
    // Mains tighter than crosses is the clear optimal.
    // Reversing kills exactly what the pattern is for.

    if (differential >= 1 && differential <= 4) {
      // Sweet spot: mains 1-4 lbs tighter
      diffSpinBonus = Math.min(differential, 3) * 1.0; // up to +3.0 spin
    } else if (differential > 4 && differential <= 6) {
      diffSpinBonus = 1.5;
      diffControlMod = -(differential - 4) * 0.5;
    } else if (differential > 6) {
      // Excessive even for open patterns
      diffSpinBonus = 0;
      diffControlMod = -(differential - 4) * 1.2;
      diffComfortMod = -(differential - 6) * 0.8;
      diffDurabilityMod = -(differential - 6) * 1.5;
      diffFeelMod = -(differential - 6) * 1.0;
    }

    if (differential < -1) {
      // Crosses tighter on open bed — BAD. Kills snapback.
      diffSpinBonus = differential * 0.8;  // stronger spin penalty on open
      diffControlMod = absDiff > 3 ? -(absDiff - 3) * 1.0 : 0;
      diffFeelMod = differential * 0.6;
      diffComfortMod = absDiff > 3 ? -(absDiff - 3) * 0.6 : 0;
    }

  } else {
    // ===== STANDARD PATTERNS (18x19, 18x20 with <20 crosses) =====
    // Middle ground between open and dense.
    // Mains slightly tighter is standard, but less critical than open.

    if (differential >= 1 && differential <= 4) {
      diffSpinBonus = Math.min(differential, 3) * 0.7;
    } else if (differential > 4 && differential <= 6) {
      diffSpinBonus = 0.8;
      diffControlMod = -(differential - 4) * 0.4;
    } else if (differential > 6) {
      diffSpinBonus = 0;
      diffControlMod = -(differential - 4) * 1.0;
      diffComfortMod = -(differential - 6) * 0.7;
      diffDurabilityMod = -(differential - 6) * 1.2;
      diffFeelMod = -(differential - 6) * 0.8;
    }

    if (differential < -1) {
      diffSpinBonus = differential * 0.5;
      diffControlMod = absDiff > 3 ? -(absDiff - 3) * 0.7 : 0;
      diffFeelMod = differential * 0.4;
      diffComfortMod = absDiff > 4 ? -(absDiff - 4) * 0.5 : 0;
    }
  }

  return {
    powerMod: -factor * 2,
    controlMod: factor * 2 + diffControlMod,
    launchMod: -factor * 1.5 + diffLaunchMod,
    comfortMod: -factor * 1.5 + diffComfortMod,
    spinMod: -Math.abs(factor) * 0.4 + diffSpinBonus,
    feelMod: factor * 1.0 + diffFeelMod,
    playabilityMod: -Math.abs(factor) * 0.6,
    durabilityMod: diffDurabilityMod,
    _differential: differential
  };
}

// ============================================
// COMBINED PREDICTION: Frame Base + String Modifier + Tension + String Profile
// ============================================
// Frame-driven stats (spin, power, control, feel, comfort) use FW/SW weighted blend
// + L2 string mod + tension mod.
// Launch uses frame base + L2 mod + tension mod (no string profile blend).
// Stability & forgiveness are frame-only (no string or tension influence).
// Durability is string-only. Playability is string + tension.

// ============================================
// LAYER 3: HYBRID INTERACTION MODEL
// ============================================
// When two different strings are paired as mains/crosses, their interaction
// changes which string dominates feel, spin, power, and how fast the bed dies.
// This layer models the pairing dynamics beyond simple weighted blending.
//
// Key principles:
// - Mains dominate power, feel, spin window (longer, deform more)
// - Crosses modulate: control, launch, snapback friction, comfort, durability
// - "Which hybrid is better" depends on what job the cross is doing
// - Same cross, different main → different job → different fitness

function __calcHybridInteraction_OLD(mainsData, crossesData) {
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
  const crossStiffNorm = Math.max(0, Math.min(1, (crossStiff - 115) / (234 - 115))); // 0=soft, 1=stiff
  const crossShape = (crossesData.shape || '').toLowerCase();
  const crossIsRound = crossShape.includes('round');
  const crossIsShaped = !crossIsRound && (crossShape.includes('pentagon') || crossShape.includes('hex') || crossShape.includes('square') || crossShape.includes('star') || crossShape.includes('octagon') || crossShape.includes('heptagonal'));
  const crossIsSlick = crossShape.includes('slick') || crossShape.includes('coated') || crossShape.includes('silicone');
  const crossSpinPot = crossesData.spinPotential || 6;
  const crossIsElastic = crossMat === 'Co-Polyester (elastic)';

  // Mains properties
  const mainsStiff = mainsData.stiffness || 200;
  const mainsShape = (mainsData.shape || '').toLowerCase();
  const mainsIsShaped = mainsShape.includes('pentagon') || mainsShape.includes('hex') || mainsShape.includes('square') || mainsShape.includes('star') || mainsShape.includes('octagon') || mainsShape.includes('heptagonal') || mainsShape.includes('textured');

  // --- Result object: modifiers applied AFTER the base hybrid blend ---
  const mods = {
    powerMod: 0,
    spinMod: 0,
    controlMod: 0,
    comfortMod: 0,
    feelMod: 0,
    durabilityMod: 0,
    playabilityMod: 0,
    launchMod: 0
  };

  // ========================================
  // CASE 1: GUT/MULTI MAINS + POLY CROSSES
  // ========================================
  // The classic "best of both worlds" hybrid. Cross job:
  // - Be slick enough that gut slides (prevent premature notching)
  // - Be soft enough not to kill gut feel
  // - Be firm enough to rein in launch and add control
  // - Not saw through gut too quickly
  if (isSoftMains && isPolyCross) {
    // Base synergy bonus: gut+poly is a proven, synergistic combo
    mods.comfortMod += 1;       // gut comfort preserved, poly adds structure
    mods.controlMod += 2;       // poly cross reins in gut's wild launch
    mods.launchMod -= 0.5;      // poly tames gut's high launch tendency

    // Cross fitness for gut: ideal cross is soft-ish, slick, round
    // A. Slickness / roundness — essential for gut preservation
    if (crossIsRound || crossIsSlick) {
      mods.durabilityMod += 3;  // round/slick cross preserves gut lifespan
      mods.feelMod += 1;        // doesn't interfere with gut's signature feel
    } else if (crossIsShaped) {
      // Shaped polys as crosses under gut: the nightmare scenario
      // Sharp edges saw through gut faster, friction kills snapback
      mods.durabilityMod -= 5;  // shaped crosses destroy gut
      mods.feelMod -= 2;        // gritty, fights gut's natural pocketing
      mods.comfortMod -= 2;     // harsh interaction at cross points
      mods.spinMod -= 1;        // friction locks rather than enables snapback
    }

    // B. Cross stiffness — softer is better under gut (preserves feel)
    if (crossStiffNorm < 0.4) {
      // Soft poly cross (like Irukandji): ideal for gut preservation
      mods.feelMod += 1;
      mods.comfortMod += 1;
    } else if (crossStiffNorm > 0.7) {
      // Very stiff poly cross: functional but kills gut's magic
      mods.feelMod -= 1;
      mods.comfortMod -= 1;
      mods.powerMod -= 1;       // boardy response under elastic mains
    }

    // C. Elastic co-polys: specifically designed for gut crosses
    if (crossIsElastic) {
      mods.feelMod += 1;        // complements gut elasticity
      mods.durabilityMod += 2;  // gentler on gut
      mods.comfortMod += 1;
    }

    // D. Gut durability baseline penalty in hybrid
    // Gut mains break faster than poly mains regardless of cross choice
    mods.durabilityMod -= 3;
  }

  // ========================================
  // CASE 2: POLY MAINS + POLY CROSSES
  // ========================================
  // Mains = primary performance layer (spin engine, power, feel)
  // Crosses = constraint system (friction control, launch, stability)
  // Rule: shaped/grippy poly belongs in mains, round/slick in crosses
  else if (isPolyMains && isPolyCross) {
    // --- MAINS ROLE FITNESS ---
    // Shaped/textured mains = correct: they're the spin engine
    if (mainsIsShaped) {
      mods.spinMod += 1.5;      // shaped mains bite the ball as intended
      mods.controlMod += 0.5;   // directional control from mains grip
    }
    // Round/slick mains = suboptimal for mains role in a hybrid
    // (round poly is a "cross string" — it's slick, neutral, gets out of the way)
    const mainsIsRound = mainsShape.includes('round');
    if (mainsIsRound && !mainsIsShaped) {
      mods.spinMod -= 0.5;      // round mains lack bite — why hybrid at all?
    }

    // --- CROSS ROLE FITNESS ---
    // Round/slick crosses = ideal: they let mains snap back freely
    if (crossIsRound || crossIsSlick) {
      mods.spinMod += 1.5;      // slick rail enables mains snapback
      mods.controlMod += 1;     // stable, predictable bed
    }

    // --- SYNERGY: shaped mains + round cross = optimal division of labor ---
    if (mainsIsShaped && (crossIsRound || crossIsSlick)) {
      mods.spinMod += 1;        // peak synergy: shaped bites, round slides
      mods.controlMod += 0.5;
      mods.feelMod += 0.5;      // clean, intentional feel
    }

    // --- ANTI-PATTERN: round mains + shaped crosses = reversed roles ---
    // The cross is doing the biting and the main is doing the sliding
    // — backwards. Spin suffers, feel is inconsistent, bed purpose is confused.
    if (mainsIsRound && crossIsShaped) {
      mods.spinMod -= 2.5;      // shaped cross grips ball but can't snap back
      mods.feelMod -= 1.5;      // confused bed response
      mods.controlMod -= 1;     // inconsistent directional behavior
      mods.comfortMod -= 0.5;   // cross-dominated bite feels harsh/unnatural
    }

    // --- Both shaped: friction overload, bed locks up ---
    if (mainsIsShaped && crossIsShaped) {
      mods.spinMod -= 2;        // too much friction, mains can't snap
      mods.feelMod -= 1;        // dead/boardy feel
      mods.comfortMod -= 1;     // harsh impact
    }

    // --- Stiffness role: stiffer mains + softer cross = correct ---
    // Mains should be the firmer, more assertive string; crosses softer/more neutral
    if (mainsStiff > crossStiff + 15) {
      mods.controlMod += 0.5;   // firm mains with forgiving crosses = clean
    } else if (crossStiff > mainsStiff + 15) {
      mods.feelMod -= 0.5;      // stiffer crosses than mains = odd feel
    }

    // --- Extreme stiffness mismatch ---
    const stiffGap = Math.abs(mainsStiff - crossStiff);
    if (stiffGap > 60) {
      mods.feelMod -= 1;        // inconsistent feel across string bed
      mods.controlMod -= 0.5;   // unpredictable response
    }
  }

  // ========================================
  // CASE 3: POLY MAINS + GUT/MULTI CROSSES
  // ========================================
  // This is the "reversed" gut hybrid. Some players prefer it for
  // more immediate spin/control from poly mains with softer feel
  // from gut/multi crosses. But it's inherently less optimal than
  // Case 1 (gut mains + poly crosses) because:
  // - Gut's best qualities (power, pocketing, tension hold) are
  //   mostly expressed in mains position (longer, more deflection)
  // - As crosses, gut's elasticity is partially wasted, and it
  //   notches fast against poly mains
  else if (isPolyMains && isSoftCross) {
    mods.feelMod += 1.5;        // soft cross adds some touch
    mods.comfortMod += 1;       // softer impact at crosses
    mods.powerMod += 0.5;       // elastic crosses add slight power

    // Role penalty: gut/multi is BETTER suited as mains in most hybrids
    // Using it as crosses wastes its best qualities and introduces durability risk
    if (isGutCross) {
      mods.powerMod -= 1;       // gut's elastic power is muted in crosses position
      mods.feelMod -= 0.5;      // gut's signature feel is reduced at only 30% blend weight
      mods.durabilityMod -= 5;  // gut crosses shred against poly mains
      mods.playabilityMod -= 2; // bed deteriorates as notches form
    } else {
      // Multi/syn gut crosses — less extreme but similar logic
      mods.durabilityMod -= 2;
      mods.playabilityMod -= 1;
    }

    // Shaped poly mains with gut crosses: particularly destructive
    if (mainsIsShaped && isGutCross) {
      mods.durabilityMod -= 3;  // shaped poly edges destroy gut crosses
      mods.comfortMod -= 1;     // harsh intersection at notch points
    }
  }

  // ========================================
  // CASE 4: GUT MAINS + GUT CROSSES (full gut)
  // ========================================
  else if (isGutMains && isGutCross) {
    mods.feelMod += 3;          // ultimate feel
    mods.comfortMod += 2;       // softest possible bed
    mods.powerMod += 1;         // elastic in all directions
    mods.durabilityMod -= 6;    // extremely fragile
    mods.controlMod -= 2;       // very hard to control trajectory
    mods.spinMod -= 2;          // no friction differential for snapback
  }

  // ========================================
  // CASE 5: SOFT MAINS + SOFT CROSSES (multi+multi, multi+synth, etc.)
  // ========================================
  else if (isSoftMains && isSoftCross && !isGutMains && !isGutCross) {
    mods.comfortMod += 1;
    mods.durabilityMod -= 1;
    mods.controlMod -= 1;
  }

  return mods;
}

/**
 * Top-level prediction entry point — combines all layers into a final stats object.
 *
 * Layer stack:
 *   0. calcFrameBase        — racquet physics → 9 raw frame scores
 *   1. calcBaseStringProfile — string physics → standalone string scores
 *      calcStringFrameMod   — string×frame interaction modifiers
 *   2. calcTensionModifier   — tension level + mains/crosses differential deltas
 *   3. calcHybridInteraction — (hybrid only) pairing-specific bonuses/penalties
 *
 * For hybrid setups, mains dominate power/comfort/feel/spin (70/30 weight);
 * crosses dominate control and durability (60/40 weight).
 *
 * @param {Object} racquet      — entry from RACQUETS
 * @param {Object} stringConfig — { isHybrid, string?, mains?, crosses?,
 *                                   mainsTension, crossesTension }
 * @returns {Object} final attribute scores + identity archetype + debug info
 */
function __predictSetup_OLD(racquet, stringConfig) {
  const frameBase = calcFrameBase(racquet);

  let stringMod, stringProfile;
  let avgTension;

  if (stringConfig.isHybrid) {
    const mainsMod = calcStringFrameMod(stringConfig.mains);
    const crossesMod = calcStringFrameMod(stringConfig.crosses);
    const mainsProfile = calcBaseStringProfile(stringConfig.mains);
    const crossesProfile = calcBaseStringProfile(stringConfig.crosses);

    // Layer 3: Hybrid interaction — pairing-specific adjustments
    const hybridMods = calcHybridInteraction(stringConfig.mains, stringConfig.crosses);

    // Mains-weighted for power/comfort/feel/spin, crosses-weighted for control
    stringMod = {
      powerMod: mainsMod.powerMod * 0.7 + crossesMod.powerMod * 0.3 + hybridMods.powerMod,
      spinMod: mainsMod.spinMod * 0.7 + crossesMod.spinMod * 0.3 + hybridMods.spinMod,
      controlMod: mainsMod.controlMod * 0.3 + crossesMod.controlMod * 0.7 + hybridMods.controlMod,
      comfortMod: mainsMod.comfortMod * 0.7 + crossesMod.comfortMod * 0.3 + hybridMods.comfortMod,
      feelMod: mainsMod.feelMod * 0.7 + crossesMod.feelMod * 0.3 + hybridMods.feelMod,
      launchMod: mainsMod.launchMod * 0.7 + crossesMod.launchMod * 0.3 + hybridMods.launchMod
    };

    // Blend string profiles: mains dominant for most, crosses for durability
    stringProfile = {
      power: mainsProfile.power * 0.7 + crossesProfile.power * 0.3,
      spin: mainsProfile.spin * 0.6 + crossesProfile.spin * 0.4,
      control: mainsProfile.control * 0.4 + crossesProfile.control * 0.6,
      feel: mainsProfile.feel * 0.7 + crossesProfile.feel * 0.3,
      comfort: mainsProfile.comfort * 0.7 + crossesProfile.comfort * 0.3,
      durability: mainsProfile.durability * 0.4 + crossesProfile.durability * 0.6 + hybridMods.durabilityMod,
      playability: mainsProfile.playability * 0.6 + crossesProfile.playability * 0.4 + (hybridMods.playabilityMod || 0)
    };

    avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  } else {
    stringMod = calcStringFrameMod(stringConfig.string);
    stringProfile = calcBaseStringProfile(stringConfig.string);
    stringMod.launchMod = stringMod.launchMod || 0;
    avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  }

  const tensionMod = calcTensionModifier(stringConfig.mainsTension, stringConfig.crossesTension, racquet.tensionRange, racquet.pattern);

  // --- Blend: frame base (primary) + string mod + tension mod ---
  // Frame-driven stats: frame is dominant, string profile secondary.
  // A string change should move individual stats by ~5-8 points, not 11-16.
  const FW = 0.72; // frame weight — frame determines the character
  const SW = 0.28; // string profile weight — string modulates, doesn't redefine

  const stats = {
    spin:    clamp(frameBase.spin * FW + stringProfile.spin * SW + stringMod.spinMod + tensionMod.spinMod),
    power:   clamp(frameBase.power * FW + stringProfile.power * SW + stringMod.powerMod + tensionMod.powerMod),
    control: clamp(frameBase.control * FW + stringProfile.control * SW + stringMod.controlMod + tensionMod.controlMod),
    launch:  clamp(frameBase.launch + stringMod.launchMod + tensionMod.launchMod),
    feel:    clamp(frameBase.feel * FW + stringProfile.feel * SW + stringMod.feelMod + tensionMod.feelMod),
    comfort: clamp(frameBase.comfort * FW + stringProfile.comfort * SW + stringMod.comfortMod + tensionMod.comfortMod),
    stability:   clamp(frameBase.stability),
    forgiveness: clamp(frameBase.forgiveness),
    maneuverability: clamp(frameBase.maneuverability),
    // String-only stats: from string profile, with tension + differential influence
    durability:  clamp(stringProfile.durability + (tensionMod.durabilityMod || 0)),
    playability: clamp(stringProfile.playability + tensionMod.playabilityMod)
  };

  // Attach debug info for inspection
  stats._debug = { frameBase, stringProfile, stringMod, tensionMod, _frameDebug: frameBase._frameDebug,
    hybridInteraction: stringConfig.isHybrid ? calcHybridInteraction(stringConfig.mains, stringConfig.crosses) : null
  };

  return stats;
}

// ============================================
// IDENTITY GENERATOR
// ============================================

function __generateIdentity_OLD(stats, racquet, stringConfig) {
  // Score each archetype — pick the one with the strongest signal
  const candidates = [
    { name: 'Precision Topspin Blade', score: (stats.spin >= 80 ? 20 : 0) + (stats.control >= 85 ? 20 : 0) + (stats.power < 55 ? 10 : 0), req: stats.spin >= 78 && stats.control >= 82 && stats.power < 60 },
    { name: 'Surgical Topspin Machine', score: (stats.spin - 70) * 2 + (stats.control - 65) * 1.5, req: stats.spin >= 75 && stats.control >= 65 && stats.control < 82 },
    { name: 'Topspin Howitzer', score: (stats.spin - 70) * 3 + (stats.power - 60) * 2, req: stats.spin >= 78 && stats.power >= 65 && stats.spin >= stats.power },
    { name: 'Power Spin Hybrid', score: (stats.power - 60) * 3 + (stats.spin - 70) * 2, req: stats.spin >= 75 && stats.power >= 70 && stats.power > stats.spin },
    { name: 'Spin Dominator', score: (stats.spin - 65) * 2.5, req: stats.spin >= 75 && stats.power < 65 && stats.control < 82 },
    { name: 'Power Brawler', score: (stats.power - 65) * 3 + (100 - stats.control) * 0.5, req: stats.power >= 75 && stats.control <= 65 },
    { name: 'Power Hybrid', score: (stats.power - 55) * 1.5 + (stats.spin - 50) * 0.5, req: stats.power >= 65 && stats.power < 80 && stats.spin < 78 && stats.control > 55 },
    { name: 'Precision Instrument', score: (stats.control - 75) * 3 + (stats.feel - 60) * 1.5, req: stats.control >= 82 && stats.spin < 78 },
    { name: 'Control Platform', score: (stats.control - 65) * 2, req: stats.control >= 70 && stats.control < 82 && stats.spin < 75 },
    { name: 'Comfort Cannon', score: (stats.comfort - 65) * 2 + (stats.power - 55) * 1.5, req: stats.comfort >= 72 && stats.power >= 65 },
    { name: 'Touch Artist', score: (stats.feel - 70) * 2.5 + (stats.comfort - 60), req: stats.feel >= 75 && stats.control >= 70 && stats.power < 65 },
    { name: 'Wall of Stability', score: (stats.stability - 65) * 3 + (stats.control - 60), req: stats.stability >= 70 && stats.control >= 70 },
    { name: 'Forgiving Weapon', score: (stats.forgiveness - 60) * 2 + (stats.power - 55) * 1.5, req: stats.forgiveness >= 68 && stats.power >= 60 },
    { name: 'Whip Master', score: (stats.maneuverability - 65) * 2.5 + (stats.spin - 60) * 1.5, req: stats.maneuverability >= 72 && stats.spin >= 68 },
    { name: 'Speed Demon', score: (stats.maneuverability - 70) * 3 + (stats.power - 55) * 1, req: stats.maneuverability >= 75 && stats.power >= 55 && stats.stability < 60 },
    { name: 'Endurance Build', score: (stats.playability - 80) * 3 + (stats.durability - 75) * 2, req: stats.playability >= 88 && stats.durability >= 80 },
    { name: 'Marathon Setup', score: (stats.durability - 80) * 2.5 + (stats.playability - 75) * 2, req: stats.durability >= 85 && stats.playability >= 82 },
  ];

  const valid = candidates.filter(c => c.req).sort((a, b) => b.score - a.score);
  const archetype = valid.length > 0 ? valid[0].name : 'Balanced Setup';

  // Description
  const descriptions = {
    'Precision Topspin Blade': `Elite spin combined with surgical control and low power assist — you generate all the pace, the setup generates all the placement. A scalpel for topspin artists who shape every ball.`,
    'Surgical Topspin Machine': `High spin potential meets solid control. Excels at constructing points with heavy topspin from the baseline, allowing you to hit with margin and still redirect at will.`,
    'Topspin Howitzer': `Massive topspin wrapped in a power platform. The ball launches with heavy rotation AND depth — opponents get pushed behind the baseline by a ball that kicks up and keeps coming.`,
    'Power Spin Hybrid': `Power-forward with spin enhancement. The gut mains provide natural power and feel while the frame and pattern add topspin capability. A dual-threat that hits deep with dip — opponents feel both the pace and the kick.`,
    'Spin Dominator': `Spin-first setup that generates heavy ball rotation. The string bed grips the ball aggressively, creating a high-bouncing, dipping trajectory that pushes opponents behind the baseline.`,
    'Power Brawler': `Maximum power with enough raw muscle to overpower opponents. Best for players who want to dictate with pace and don't need surgical precision on every shot.`,
    'Power Hybrid': `Balanced power delivery with enough control to keep balls in play. Good for intermediate to advanced players transitioning to more aggressive play.`,
    'Precision Instrument': `Control-first build for players who generate their own pace. Every swing gives clear feedback and directional precision. Rewards clean technique with surgical accuracy.`,
    'Control Platform': `Reliable control with enough assistance to stay competitive. A stable platform for developing players or all-courters who value consistency.`,
    'Comfort Cannon': `Arm-friendly power. High comfort rating means you can swing freely without worrying about elbow or shoulder strain, while still getting good power return.`,
    'Touch Artist': `Maximum feel and connection to the ball. Ideal for net players and all-courters who rely on touch, placement, and variety over raw power.`,
    'Wall of Stability': `Immovable on contact. High stability means the frame doesn't twist on off-center hits, giving you confidence even when you're not hitting the sweet spot.`,
    'Forgiving Weapon': `Large effective sweet spot with decent power. Mis-hits still go in, and centered hits carry real authority. Good for developing power hitters.`,
    'Whip Master': `Exceptional racquet-head speed potential meets high spin capability. The light, maneuverable frame lets you generate steep swing paths and aggressive topspin without fighting the racquet. Rewards athletic, wristy players who shape the ball with racquet acceleration rather than mass.`,
    'Speed Demon': `Lightning-fast swing speed from an ultra-maneuverable platform. The frame practically disappears in the hand, letting you rip through contact zones with minimal effort. Trade-off: less stability on off-center hits, but the speed makes up for it with aggressive shot-making.`,
    'Endurance Build': `Exceptional playability duration. This setup maintains its performance characteristics far longer than average, meaning fewer restrings and more consistent play.`,
    'Marathon Setup': `Built to last. Both durability and playability are elite — the string bed stays lively for weeks and resists breakage. Ideal for frequent players.`,
    'Balanced Setup': `Well-rounded profile with no glaring weaknesses. A versatile setup that adapts to different game styles and court conditions.`
  };

  // Generate descriptive tags from stats
  const tags = [];
  if (stats.spin >= 75) tags.push('High Spin');
  if (stats.power >= 70) tags.push('Power');
  if (stats.control >= 75) tags.push('Precision');
  if (stats.comfort >= 72) tags.push('Arm-Friendly');
  if (stats.feel >= 72) tags.push('Touch');
  if (stats.stability >= 70) tags.push('Stable');
  if (stats.maneuverability >= 72) tags.push('Fast Swing');
  if (stats.durability >= 78) tags.push('Durable');
  if (stats.playability >= 82) tags.push('Long-Lasting');
  if (stats.forgiveness >= 70) tags.push('Forgiving');

  return {
    archetype,
    description: descriptions[archetype] || descriptions['Balanced Setup'],
    tags: tags.slice(0, 4)
  };
}

// ============================================
// FIT PROFILE GENERATOR
// ============================================

function generateFitProfile(stats, racquet, stringConfig) {
  const bestFor = [];
  const watchOut = [];

  if (stats.spin >= 70) bestFor.push('Baseline grinders who rely on topspin');
  if (stats.power >= 65) bestFor.push('Players who like to dictate with pace');
  if (stats.control >= 70) bestFor.push('Touch players and all-courters');
  if (stats.comfort >= 70) bestFor.push('Players with arm sensitivity');
  if (stats.stability >= 70) bestFor.push('Aggressive returners and blockers');
  if (stats.feel >= 75) bestFor.push('Net players and volleyers');
  if (stats.maneuverability >= 70) bestFor.push('Quick-swing players and net rushers');
  if (stats.forgiveness >= 65) bestFor.push('Developing players building consistency');
  if (stats.playability >= 80) bestFor.push('Frequent players (3+ times/week)');

  if (bestFor.length === 0) bestFor.push('Versatile all-court players');

  if (stats.power <= 40) watchOut.push('Players who need free power from the frame');
  if (stats.comfort <= 45) watchOut.push('Players with arm/elbow issues — too stiff');
  if (stats.control <= 50) watchOut.push('Players who need help keeping the ball in');
  if (stats.spin <= 50) watchOut.push('Heavy topspin players — limited spin access');
  if (stats.forgiveness <= 45) watchOut.push('Beginners — small effective sweet spot');
  if (stats.maneuverability <= 45) watchOut.push('Compact swingers — frame may feel sluggish');
  if (stats.durability <= 55) watchOut.push('String breakers — low durability');
  if (stats.playability <= 55) watchOut.push('Infrequent restringers — goes dead fast');

  if (watchOut.length === 0) watchOut.push('No major red flags — versatile setup');

  // Recommended tension
  const [low, high] = racquet.tensionRange;
  const mid = Math.round((low + high) / 2);
  const tensionRec = `${low}–${high} lbs (sweet spot: ${mid - 1}–${mid + 1} lbs)`;

  return { bestFor, watchOut, tensionRec };
}

// ============================================
// WARNINGS GENERATOR
// ============================================

function generateWarnings(racquet, stringConfig, stats) {
  const warnings = [];

  const getMainString = () => stringConfig.isHybrid ? stringConfig.mains : stringConfig.string;
  const getCrossString = () => stringConfig.isHybrid ? stringConfig.crosses : stringConfig.string;
  const getAvgTension = () => (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  const getMainsTension = () => stringConfig.mainsTension;
  const getCrossesTension = () => stringConfig.crossesTension;

  // Tension outside range
  const mainsTension = getMainsTension();
  const crossesTension = getCrossesTension();

  if (mainsTension < racquet.tensionRange[0]) {
    warnings.push(`Mains tension (${mainsTension} lbs) is below the recommended range (${racquet.tensionRange[0]}–${racquet.tensionRange[1]} lbs). Risk of losing control and trampoline effect.`);
  }
  if (mainsTension > racquet.tensionRange[1]) {
    warnings.push(`Mains tension (${mainsTension} lbs) is above the recommended range (${racquet.tensionRange[0]}–${racquet.tensionRange[1]} lbs). Risk of reduced comfort and arm strain.`);
  }
  if (crossesTension < racquet.tensionRange[0]) {
    warnings.push(`Crosses tension (${crossesTension} lbs) is below the recommended range.`);
  }
  if (crossesTension > racquet.tensionRange[1]) {
    warnings.push(`Crosses tension (${crossesTension} lbs) is above the recommended range.`);
  }

  // Stiffness combo warning
  const mainString = getMainString();
  if (racquet.stiffness >= 68 && mainString.stiffness >= 220) {
    warnings.push(`High frame stiffness (${racquet.stiffness} RA) + stiff string (${mainString.stiffness} lb/in) = significant shock transmission. Consider monitoring for arm discomfort.`);
  }

  // Thin gauge durability
  const allStrings = stringConfig.isHybrid ? [stringConfig.mains, stringConfig.crosses] : [stringConfig.string];
  for (const s of allStrings) {
    if (s.gaugeNum <= 1.25 && s.material === 'Polyester') {
      warnings.push(`${s.name} ${s.gauge} is thin gauge — expect reduced durability vs 16g. Frequent string breakers should consider thicker gauge.`);
    }
  }

  // Gut rain warning
  for (const s of allStrings) {
    if (s.material === 'Natural Gut') {
      warnings.push(`${s.name} is natural gut — highly vulnerable to moisture. Avoid playing in rain or high humidity without a backup racquet.`);
    }
  }

  // High tension loss
  for (const s of allStrings) {
    if (s.tensionLoss >= 40) {
      warnings.push(`${s.name} has high tension loss (${s.tensionLoss}%). Setup will play noticeably different after a few sessions. Consider restringing every 10-15 hours of play.`);
    }
  }

  return warnings;
}

// ============================================
// DATA FOUNDATION
// ============================================

// getDataFoundation removed — replaced by renderOCFoundation in 4-card grid

// ============================================
// SETUP BADGE TEXT
// ============================================


// ============================================
// UI CONTROLLER
// ============================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let currentRadarChart = null;
let comparisonRadarChart = null;
let comparisonSlots = []; // array of { racquet, stringConfig, stats, identity }
let isComparisonMode = false;

// ============================================
// PERSISTENT SHELL — MODE SYSTEM
// ============================================
let currentMode = 'overview';
const scrollPositions = { overview: 0, tune: 0, compare: 0, optimize: 0, compendium: 0, howitworks: 0 };
let _compareInitialized = false;
let _tuneInitialized = false;
let _optimizeInitialized = false;
let _compendiumInitialized = false;

// === LOADOUT SYSTEM ===
// activeLoadout and savedLoadouts are local copies synced with src/state/loadout.js

// LEGACY: Local aliases to state store — these are kept for backward compat during migration
// All new code should use getActiveLoadout() / getSavedLoadouts() from './src/state/store.js'
const _getAl = () => getActiveLoadout();
const _getSls = () => getSavedLoadouts();

// TODO: Remove these after full migration to store
let activeLoadout = null;
let savedLoadouts = [];

// loadSavedLoadouts and persistSavedLoadouts imported from src/state/loadout.js

function createLoadout(frameId, stringId, tension, opts) {
  opts = opts || {};
  const racquet = RACQUETS.find(r => r.id === frameId);
  const rawStringData = STRINGS.find(s => s.id === stringId);
  if (!racquet || !rawStringData) return null;

  // Apply gauge modifiers to string data before prediction
  let stringData = rawStringData;
  if (!opts.isHybrid && opts.gauge) {
    stringData = applyGaugeModifier(rawStringData, opts.gauge);
  }

  let mainsData = opts.isHybrid ? STRINGS.find(s => s.id === opts.mainsId) : undefined;
  let crossesData = opts.isHybrid ? STRINGS.find(s => s.id === opts.crossesId) : undefined;
  if (mainsData && opts.mainsGauge) mainsData = applyGaugeModifier(mainsData, opts.mainsGauge);
  if (crossesData && opts.crossesGauge) crossesData = applyGaugeModifier(crossesData, opts.crossesGauge);

  const cfg = {
    isHybrid: opts.isHybrid || false,
    string: opts.isHybrid ? undefined : stringData,
    mains: mainsData,
    crosses: crossesData,
    mainsTension: tension,
    crossesTension: opts.crossesTension || tension
  };

  const stats = predictSetup(racquet, cfg);
  const tCtx = stats ? buildTensionContext(cfg, racquet) : null;
  const obs = stats ? computeCompositeScore(stats, tCtx) : 0;
  const identity = stats ? generateIdentity(stats, racquet, cfg) : null;

  // Build name
  let loName = opts.name;
  if (!loName) {
    if (opts.isHybrid && mainsData && crossesData) {
      loName = mainsData.name + ' / ' + crossesData.name + ' on ' + racquet.name;
    } else {
      loName = rawStringData.name + ' on ' + racquet.name;
    }
  }

  return {
    id: opts.id || 'lo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name: loName,
    frameId: frameId,
    stringId: opts.isHybrid ? null : stringId,
    isHybrid: opts.isHybrid || false,
    mainsId: opts.mainsId || null,
    crossesId: opts.crossesId || null,
    mainsTension: tension,
    crossesTension: opts.crossesTension || tension,
    gauge: opts.gauge || null,
    mainsGauge: opts.mainsGauge || null,
    crossesGauge: opts.crossesGauge || null,
    stats: stats,
    obs: +obs.toFixed(1),
    identity: identity ? identity.name : '',
    source: opts.source || 'manual',
    _dirty: false
  };
}

function activateLoadout(loadout) {
  if (!loadout) return;

  // Fix A: Auto-save dirty loadout before overwriting (QA-007, QA-012)
  const currentAl = getActiveLoadout();
  if (currentAl && currentAl._dirty) {
    saveActiveLoadout();
  }

  setActiveLoadout(loadout);
  
  // Also sync with legacy state module (for backward compat)
  _stateSetActiveLoadout(loadout);
  
  // Persist active loadout ID to localStorage
  try {
    if (_store) _store.setItem('tll-active-loadout-id', loadout.id);
  } catch(e) {}
  
  hydrateDock(loadout);
  renderDockPanel();

  if (currentMode === 'overview') renderDashboard();
  if (currentMode === 'tune') {
    const setup = getCurrentSetup();
    if (setup) initTuneMode(setup);
  }

  // Fix C: Keep optimizer frame in sync (QA-009)
  _syncOptimizeFrame(loadout);
}

function _syncOptimizeFrame(loadout) {
  if (!_optimizeInitialized || !loadout) return;
  var racquet = RACQUETS.find(function(r) { return r.id === loadout.frameId; });
  var el = document.getElementById('opt-frame-search');
  var val = document.getElementById('opt-frame-value');
  if (el && racquet) el.value = racquet.name;
  if (val && racquet) val.value = racquet.id;
}

function saveLoadout(loadout) {
  if (!loadout) return;
  const copy = Object.assign({}, loadout);
  delete copy._dirty; // runtime state, don't persist
  const sls = getSavedLoadouts();
  const existing = sls.findIndex(l => l.id === copy.id);
  if (existing >= 0) {
    updateSavedLoadout(copy.id, copy);
  } else {
    addSavedLoadout(copy);
  }
  // Also update legacy state module
  _stateSetSavedLoadouts(getSavedLoadouts());
  persistSavedLoadouts();
  renderDockPanel();
}

function removeLoadout(loadoutId) {
  removeSavedLoadout(loadoutId);
  // Also update legacy state module
  _stateSetSavedLoadouts(getSavedLoadouts());
  persistSavedLoadouts();
  renderDockPanel();
}

function switchToLoadout(loadoutId) {
  const sls = getSavedLoadouts();
  const lo = sls.find(l => l.id === loadoutId);
  if (lo) {
    const copy = Object.assign({}, lo);
    copy._dirty = false; // fresh switch, no unsaved changes
    activateLoadout(copy);
  }
}

function hydrateDock(loadout) {
  if (!loadout) return;
  const racquet = RACQUETS.find(r => r.id === loadout.frameId);
  if (!racquet) return;

  ssInstances['select-racquet']?.setValue(loadout.frameId);
  showFrameSpecs(racquet);

  if (loadout.isHybrid) {
    setHybridMode(true);
    ssInstances['select-string-mains']?.setValue(loadout.mainsId);
    populateGaugeDropdown(document.getElementById('gauge-select-mains'), loadout.mainsId);
    if (loadout.mainsGauge) {
      const gm = document.getElementById('gauge-select-mains');
      if (gm) gm.value = String(loadout.mainsGauge);
    }
    $('#input-tension-mains').value = loadout.mainsTension;
    ssInstances['select-string-crosses']?.setValue(loadout.crossesId);
    populateGaugeDropdown(document.getElementById('gauge-select-crosses'), loadout.crossesId);
    if (loadout.crossesGauge) {
      const gx = document.getElementById('gauge-select-crosses');
      if (gx) gx.value = String(loadout.crossesGauge);
    }
    $('#input-tension-crosses').value = loadout.crossesTension;
  } else {
    setHybridMode(false);
    ssInstances['select-string-full']?.setValue(loadout.stringId);
    populateGaugeDropdown(document.getElementById('gauge-select-full'), loadout.stringId);
    if (loadout.gauge) {
      const gf = document.getElementById('gauge-select-full');
      if (gf) gf.value = String(loadout.gauge);
    }
    $('#input-tension-full-mains').value = loadout.mainsTension;
    $('#input-tension-full-crosses').value = loadout.crossesTension;
  }
}

// ============================================
// PHASE 1: SINGLE SOURCE OF TRUTH
// getSetupFromLoadout reads FROM the loadout object (not DOM)
// commitEditorToLoadout writes FROM the dock editor INTO the loadout
// Data flow is always: loadout → DOM (via hydrateDock), never DOM → loadout silently
// ============================================

function __getSetupFromLoadout_OLD(loadout) {
  if (!loadout) return null;
  const racquet = RACQUETS.find(r => r.id === loadout.frameId);
  if (!racquet) return null;

  if (loadout.isHybrid) {
    let mainsData = STRINGS.find(s => s.id === loadout.mainsId);
    let crossesData = STRINGS.find(s => s.id === loadout.crossesId);
    if (!mainsData || !crossesData) return null;
    if (loadout.mainsGauge) mainsData = applyGaugeModifier(mainsData, loadout.mainsGauge);
    if (loadout.crossesGauge) crossesData = applyGaugeModifier(crossesData, loadout.crossesGauge);
    return {
      racquet,
      stringConfig: {
        isHybrid: true,
        mains: mainsData,
        crosses: crossesData,
        mainsId: loadout.mainsId,
        crossesId: loadout.crossesId,
        mainsTension: loadout.mainsTension,
        crossesTension: loadout.crossesTension
      }
    };
  } else {
    let stringData = STRINGS.find(s => s.id === loadout.stringId);
    if (!stringData) return null;
    if (loadout.gauge) stringData = applyGaugeModifier(stringData, loadout.gauge);
    return {
      racquet,
      stringConfig: {
        isHybrid: false,
        string: stringData,
        mainsTension: loadout.mainsTension,
        crossesTension: loadout.crossesTension
      }
    };
  }
}

function commitEditorToLoadout() {
  const al = getActiveLoadout();
  if (!al) return;

  const isHybrid = $('#btn-hybrid').classList.contains('active');
  const racquetId = ssInstances['select-racquet']?.getValue() || al.frameId;

  if (isHybrid) {
    al.isHybrid = true;
    al.mainsId = ssInstances['select-string-mains']?.getValue() || al.mainsId;
    al.crossesId = ssInstances['select-string-crosses']?.getValue() || al.crossesId;
    al.mainsTension = parseInt($('#input-tension-mains').value) || al.mainsTension;
    al.crossesTension = parseInt($('#input-tension-crosses').value) || al.crossesTension;
    const gm = document.getElementById('gauge-select-mains');
    const gx = document.getElementById('gauge-select-crosses');
    al.mainsGauge = (gm && gm.value) ? parseFloat(gm.value) : null;
    al.crossesGauge = (gx && gx.value) ? parseFloat(gx.value) : null;
    al.stringId = null;
    al.gauge = null;
  } else {
    al.isHybrid = false;
    al.stringId = ssInstances['select-string-full']?.getValue() || al.stringId;
    al.mainsTension = parseInt($('#input-tension-full-mains').value) || al.mainsTension;
    al.crossesTension = parseInt($('#input-tension-full-crosses').value) || al.crossesTension;
    const gf = document.getElementById('gauge-select-full');
    al.gauge = (gf && gf.value) ? parseFloat(gf.value) : null;
    al.mainsId = null;
    al.crossesId = null;
    al.mainsGauge = null;
    al.crossesGauge = null;
  }

  al.frameId = racquetId;

  // Recompute derived fields from the loadout (not from DOM)
  const setup = getSetupFromLoadout(al);
  if (setup) {
    const stats = predictSetup(setup.racquet, setup.stringConfig);
    if (stats) {
      const tCtx = buildTensionContext(setup.stringConfig, setup.racquet);
      al.stats = stats;
      al.obs = +(computeCompositeScore(stats, tCtx)).toFixed(1);
      al.identity = (generateIdentity(stats, setup.racquet, setup.stringConfig)?.name) || '';
    }

    // Update name
    if (!al.isHybrid && setup.stringConfig.string) {
      al.name = setup.stringConfig.string.name + ' on ' + setup.racquet.name;
    } else if (al.isHybrid && setup.stringConfig.mains && setup.stringConfig.crosses) {
      al.name = setup.stringConfig.mains.name + ' / ' + setup.stringConfig.crosses.name + ' on ' + setup.racquet.name;
    }
  }

  // Mark dirty if this loadout has a saved counterpart
  al._dirty = getSavedLoadouts().some(l => l.id === al.id);

  renderDockPanel();
  renderDashboard();
  refreshTuneIfActive();
}

function renderDockPanel() {
  var emptyEl = document.getElementById('dock-lo-empty');
  var activeEl = document.getElementById('dock-lo-active');
  if (!emptyEl || !activeEl) return;

  const al = getActiveLoadout();
  if (!al) {
    emptyEl.classList.remove('hidden');
    activeEl.classList.add('hidden');
  } else {
    emptyEl.classList.add('hidden');
    activeEl.classList.remove('hidden');

    // OBS value + color
    var obsVal = document.getElementById('dock-lo-obs-val');
    var obsRing = document.getElementById('dock-lo-obs-ring');
    var newDockObs = al.obs || 0;
    if (obsVal) {
      if (newDockObs > 0 && _prevObsValues.dock != null && _prevObsValues.dock > 0) {
        animateOBS(obsVal, _prevObsValues.dock, newDockObs, 400);
      } else {
        obsVal.textContent = newDockObs > 0 ? newDockObs.toFixed(1) : '\u2014';
      }
    }
    _prevObsValues.dock = newDockObs;

    if (obsRing && obsVal) {
      var color = getObsScoreColor(newDockObs);
      obsRing.style.borderColor = color;
      obsVal.style.color = color;
    }

    // Info text
    var racquet = RACQUETS.find(function(r) { return r.id === al.frameId; });
    var stringData = al.isHybrid ? null : STRINGS.find(function(s) { return s.id === al.stringId; });
    var nameEl = document.getElementById('dock-lo-name');
    var identEl = document.getElementById('dock-lo-identity');
    var detailsEl = document.getElementById('dock-lo-details');
    var sourceEl = document.getElementById('dock-lo-source');

    if (nameEl) nameEl.textContent = al.name || '\u2014';
    if (identEl) identEl.textContent = al.identity || '';
    if (detailsEl) {
      var frameName = racquet ? racquet.name.replace(/\s+\d+g$/, '') : '\u2014';
      var strName = stringData ? stringData.name : (al.isHybrid ? 'Hybrid' : '\u2014');
      detailsEl.textContent = frameName + ' \u00B7 ' + strName + ' \u00B7 M' + al.mainsTension + '/X' + al.crossesTension;
    }
    if (sourceEl) {
      var labels = { quiz: 'Quiz', compendium: 'Racket Bible', manual: 'Manual', preset: 'Preset', optimize: 'Optimizer', shared: 'Shared' };
      if (al._dirty) {
        sourceEl.textContent = '\u270E Modified';
        sourceEl.className = sourceEl.className.replace('hidden', '');
        sourceEl.classList.remove('hidden');
        sourceEl.style.color = 'var(--dc-warn)';
      } else if (al.source && labels[al.source]) {
        sourceEl.textContent = labels[al.source];
        sourceEl.classList.remove('hidden');
        sourceEl.style.color = '';
      } else {
        sourceEl.classList.add('hidden');
      }
    }

    // Save button dirty tint (using local al)
    var saveBtnEl = document.querySelector('#dock-lo-active button[onclick="saveActiveLoadout()"]');
    if (saveBtnEl) {
      if (activeLoadout._dirty) {
        saveBtnEl.style.color = 'var(--dc-warn)';
        saveBtnEl.title = 'Unsaved changes';
      } else {
        saveBtnEl.style.color = '';
        saveBtnEl.title = 'Save to My Loadouts';
      }
    }
  }

  renderMyLoadouts();
  renderDockCreateSection();
  _syncMobileDockBar();
  _syncDockRail();
  renderDockContextPanel();
  renderMobileLoadoutPills();
}

function renderMobileLoadoutPills() {
  var container = document.getElementById('mobile-loadout-pills');
  if (!container) return;
  if (window.innerWidth > 1024) { container.innerHTML = ''; return; }
  const sls = getSavedLoadouts();
  const al = getActiveLoadout();
  if (!sls || sls.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = sls.map(function(lo) {
    var isActive = al && al.id === lo.id;
    var name = (lo.name || 'Loadout').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var obs = lo.obs ? lo.obs.toFixed(1) : '\u2014';
    var cls = isActive
      ? 'bg-[var(--dc-platinum)] text-[var(--dc-void)] border-[var(--dc-platinum)]'
      : 'bg-transparent text-[var(--dc-storm)] border-[var(--dc-border)] hover:text-[var(--dc-platinum)] hover:border-[var(--dc-storm)]';
    return '<button class="shrink-0 flex items-center gap-2 px-3 py-1.5 border font-mono text-[10px] font-semibold transition-colors ' + cls + '" onclick="switchToLoadout(\'' + lo.id + '\')">' +
      name + '<span class="opacity-60">' + obs + '</span></button>';
  }).join('');
}

// ============================================
// CONTEXT-AWARE DOCK PANEL SYSTEM
// ============================================
// The dock renders mode-specific content in #dock-context-panel.
// Each mode gets its own render function that outputs HTML + wires events.
// Editor controls (searchable selects, tension inputs) are physically
// relocated via appendChild — instances survive the move.

function renderDockContextPanel() {
  const container = document.getElementById('dock-context-panel');
  if (!container) return;

  // Clear mode-specific classes from previous render
  container.classList.remove('dock-tune-mode');

  switch (currentMode) {
    case 'compendium': _renderDockPanelBible(container); break;
    case 'overview':   _renderDockPanelOverview(container); break;
    case 'tune':       _renderDockPanelTune(container); break;
    case 'compare':    _renderDockPanelCompare(container); break;
    case 'optimize':   _renderDockPanelOptimize(container); break;
    case 'howitworks': _renderDockPanelReference(container); break;
    default:           _renderDockPanelOverview(container); break;
  }
}

// --- Context Action Links Helper ---
function _dockContextActions(actions) {
  if (!actions || actions.length === 0) return '';
  return '<div class="dock-ctx-actions">' +
    actions.map(function(a) {
      return '<a class="dock-ctx-action" onclick="' + a.onclick + '">' + a.label + '</a>';
    }).join('') +
  '</div>';
}

// --- Guidance Message Helper ---
function _dockGuidance(iconSvg, title, body) {
  return (
    '<div class="border border-[var(--dc-border)] bg-[var(--dc-void-deep)] p-4 flex flex-col items-center text-center gap-2">' +
      '<div class="w-8 h-8 flex items-center justify-center text-dc-platinum">' + iconSvg + '</div>' +
      '<div class="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--dc-platinum)]">' + title + '</div>' +
      '<div class="font-sans text-[11px] text-[var(--dc-storm)] leading-relaxed">' + body + '</div>' +
    '</div>'
  );
}

// --- Icon SVGs for dock guidance ---
const _dockIcons = {
  racket: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="7" ry="4"/><path d="M12 10v10"/><path d="M9 20h6"/></svg>',
  tune: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m4.22-13.22l-4.24 4.24m-4.24 4.24l4.24 4.24M23 12h-6m-6 0H1m18.22 4.22l-4.24-4.24m-4.24-4.24l-4.24 4.24"/></svg>',
  compare: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="16" rx="1"/><rect x="13" y="4" width="7" height="16" rx="1"/></svg>',
  optimize: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  reference: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
};

// --- Editor Control Relocation ---
// Moves the .dock-editor-body div between the <details> wrapper and the context panel.
// Searchable select instances survive because we move DOM nodes, not rebuild.

function _dockReturnEditorHome() {
  const editorBody = document.querySelector('.dock-editor-body');
  const editorSection = document.getElementById('dock-editor-section');
  if (!editorBody || !editorSection) return;

  // Only return if it's currently outside its home
  if (editorBody.parentElement !== editorSection) {
    editorSection.appendChild(editorBody);
  }
  editorSection.style.display = '';
}

function _dockRelocateEditorToContext(container) {
  const editorBody = document.querySelector('.dock-editor-body');
  const editorSection = document.getElementById('dock-editor-section');
  if (!editorBody) return false;

  // Move editor body into context panel
  container.appendChild(editorBody);

  // Hide the empty <details> shell
  if (editorSection) editorSection.style.display = 'none';
  return true;
}

// Safely clear a container without destroying the editor body if it's inside
function _dockClearNonEditor(container) {
  const editorBody = container.querySelector('.dock-editor-body');
  // Remove all children except the editor body
  while (container.firstChild) {
    if (container.firstChild === editorBody) break;
    container.removeChild(container.firstChild);
  }
  // Remove children after the editor body too
  if (editorBody) {
    while (editorBody.nextSibling) {
      container.removeChild(editorBody.nextSibling);
    }
  }
}

// --- Mode Panel Implementations ---

function _renderDockPanelBible(container) {
  // Return editor controls home first
  _dockReturnEditorHome();

  // Hide editor in Bible mode — user is browsing, not editing
  const editorSection = document.getElementById('dock-editor-section');
  if (editorSection) editorSection.style.display = 'none';

  const al = getActiveLoadout();
  if (!al) {
    // No loadout — onboarding guidance
    container.innerHTML = _dockGuidance(
      _dockIcons.racket,
      'Getting started',
      'Browse frames on the right. Each one shows its top string pairings ranked by OBS (overall build score).<br><br>Tap <strong>Set Active</strong> on any build card to load it — then you can tune tension, compare builds, and explore alternatives.'
    );
  } else {
    // Has loadout — show current build summary + action links
    const racquet = RACQUETS.find(r => r.id === al.frameId);
    const frameName = racquet ? racquet.name.replace(/\\s+\\d+g$/, '') : '—';
    const obs = al.obs ? al.obs.toFixed(1) : '—';

    let stringName = '—';
    if (al.isHybrid) {
      const m = STRINGS.find(s => s.id === al.mainsId);
      const x = STRINGS.find(s => s.id === al.crossesId);
      stringName = m && x ? m.name + ' / ' + x.name : '—';
    } else {
      const str = STRINGS.find(s => s.id === al.stringId);
      stringName = str ? str.name : '—';
    }

    container.innerHTML = `
      <div class="dock-ctx-current">
        <div class="dock-ctx-label">Current build</div>
        <div class="dock-ctx-current-name">${al.name || frameName}</div>
        <div class="dock-ctx-current-detail">${stringName} · M${al.mainsTension}/X${al.crossesTension}</div>
        <div class="dock-ctx-current-obs">OBS ${obs}</div>
      </div>
    ` + _dockContextActions([
      { label: '→ View build overview', onclick: "switchMode('overview')" },
      { label: '→ Tune this build', onclick: "switchMode('tune')" },
      { label: '→ Compare with others', onclick: "switchMode('compare')" },
      { label: '→ Find a better string', onclick: "switchMode('optimize')" }
    ]);
  }
}

function _renderDockPanelOverview(container) {
  if (!activeLoadout) {
    // No loadout — return editor home, show it normally for creation flow
    _dockReturnEditorHome();
    // Clear only non-editor content from container
    _dockClearNonEditor(container);
    return;
  }

  // Loadout active — check if editor is already in place
  const editorBody = document.querySelector('.dock-editor-body');
  const editorAlreadyHere = editorBody && editorBody.parentElement === container;

  if (!editorAlreadyHere) {
    // Clear container safely, then relocate editor in
    _dockClearNonEditor(container);
    _dockRelocateEditorToContext(container);
  } else {
    // Editor already here — clean up elements from other modes
    const tuneLine = container.querySelector('.dock-tune-frame-line');
    if (tuneLine) tuneLine.remove();
    const existingActions = container.querySelector('.dock-ctx-actions');
    if (existingActions) existingActions.remove();
  }

  // Add/refresh action links below the editor
  container.insertAdjacentHTML('beforeend', _dockContextActions([
    { label: '→ Tune tension curves', onclick: "switchMode('tune')" },
    { label: '→ Compare with saved', onclick: "switchMode('compare')" },
    { label: '→ Find a better string', onclick: "switchMode('optimize')" }
  ]));
}

function _renderDockPanelTune(container) {
  const al = getActiveLoadout();
  if (!al) {
    _dockReturnEditorHome();
    const editorSection = document.getElementById('dock-editor-section');
    if (editorSection) editorSection.style.display = 'none';
    container.innerHTML = _dockGuidance(_dockIcons.tune, 'No build loaded',
      'Load a build from Overview or the Racket Bible to start tuning.');
    return;
  }

  // Add tune-mode class for CSS overrides (hides frame section + tension rows)
  container.classList.add('dock-tune-mode');

  const racquet = RACQUETS.find(r => r.id === al.frameId);
  const frameName = racquet ? racquet.name : '—';

  // Check if editor is already relocated here
  const editorBody = document.querySelector('.dock-editor-body');
  const editorAlreadyHere = editorBody && editorBody.parentElement === container;

  if (!editorAlreadyHere) {
    _dockReturnEditorHome();
    _dockClearNonEditor(container);

    // Compact frame info line above the editor
    container.insertAdjacentHTML('afterbegin', `
      <div class="dock-tune-frame-line">
        <span class="dock-ctx-label">Frame</span>
        <div class="dock-tune-frame-row">
          <span class="dock-tune-frame-name">${frameName}</span>
          <a class="dock-tune-change" onclick="switchMode('overview')">change</a>
        </div>
      </div>
    `);

    _dockRelocateEditorToContext(container);
  } else {
    // Editor already here — ensure frame line exists (may be missing if coming from Overview)
    let frameLine = container.querySelector('.dock-tune-frame-line');
    if (!frameLine) {
      const editorBody = container.querySelector('.dock-editor-body');
      const frameHTML = `
        <div class="dock-tune-frame-line">
          <span class="dock-ctx-label">Frame</span>
          <div class="dock-tune-frame-row">
            <span class="dock-tune-frame-name">${frameName}</span>
            <a class="dock-tune-change" onclick="switchMode('overview')">change</a>
          </div>
        </div>
      `;
      if (editorBody) {
        editorBody.insertAdjacentHTML('beforebegin', frameHTML);
      } else {
        container.insertAdjacentHTML('afterbegin', frameHTML);
      }
    } else {
      // Update existing frame name
      const nameEl = frameLine.querySelector('.dock-tune-frame-name');
      if (nameEl) nameEl.textContent = frameName;
    }
    // Clear old action links
    const existingActions = container.querySelector('.dock-ctx-actions');
    if (existingActions) existingActions.remove();
  }

  // Action links below editor
  container.insertAdjacentHTML('beforeend', _dockContextActions([
    { label: '→ Compare with saved', onclick: "switchMode('compare')" },
    { label: '→ Find a better string', onclick: "switchMode('optimize')" },
    { label: '→ Back to overview', onclick: "switchMode('overview')" }
  ]));
}

function _renderDockPanelCompare(container) {
  _dockReturnEditorHome();
  const editorSection = document.getElementById('dock-editor-section');
  if (editorSection) editorSection.style.display = 'none';

  let html = '';

  // Slot summaries
  if (comparisonSlots.length > 0) {
    html += '<div class="dock-ctx-label">Compare slots</div>';
    html += '<div class="dock-compare-slots">';
    comparisonSlots.forEach((slot, i) => {
      const color = SLOT_COLORS[i];
      const racquet = RACQUETS.find(r => r.id === slot.racquetId);
      const frameName = racquet ? racquet.name.replace(/\\s+\\d+g$/, '') : 'Not set';

      let stringName = '—';
      if (slot.isHybrid) {
        const m = STRINGS.find(s => s.id === slot.mainsId);
        const x = STRINGS.find(s => s.id === slot.crossesId);
        stringName = m && x ? m.name + ' / ' + x.name : '—';
      } else {
        const str = STRINGS.find(s => s.id === slot.stringId);
        stringName = str ? str.name : '—';
      }

      let obs = '—';
      if (slot.stats && racquet) {
        const tensionCtx = buildTensionContext({
          isHybrid: slot.isHybrid,
          mains: slot.isHybrid ? STRINGS.find(s => s.id === slot.mainsId) : null,
          crosses: slot.isHybrid ? STRINGS.find(s => s.id === slot.crossesId) : null,
          string: slot.isHybrid ? null : STRINGS.find(s => s.id === slot.stringId),
          mainsTension: slot.mainsTension,
          crossesTension: slot.crossesTension
        }, racquet);
        obs = computeCompositeScore(slot.stats, tensionCtx).toFixed(1);
      }

      html += `
        <div class="dock-compare-slot" style="border-left: 3px solid ${color.border}">
          <div class="dock-compare-slot-header">
            <span class="dock-compare-slot-label" style="color: ${color.border}">Slot ${color.label}</span>
            <span class="dock-compare-slot-obs" style="color:${slot.stats ? getObsScoreColor(parseFloat(obs)) : 'var(--dc-storm)'}">${obs}</span>
          </div>
          <div class="dock-compare-slot-meta">${frameName}</div>
          <div class="dock-compare-slot-meta">${stringName} · ${slot.mainsTension}/${slot.crossesTension}</div>
          <div class="dock-compare-slot-actions">
            <button class="dock-compare-slot-btn" onclick="_dockCompareEdit(${i})">Edit</button>
            <button class="dock-compare-slot-btn dock-compare-slot-remove" onclick="_dockCompareRemove(${i})">Remove</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  // Quick Add from saved loadouts not already in slots
  const slotKeys = comparisonSlots.map(s => s.racquetId + '-' + (s.stringId || s.mainsId));
  const available = savedLoadouts.filter(lo => {
    const key = lo.frameId + '-' + (lo.stringId || lo.mainsId);
    return !slotKeys.includes(key);
  });

  if (available.length > 0 && comparisonSlots.length < 3) {
    html += '<div class="dock-ctx-label">Quick add</div>';
    html += '<div class="dock-compare-quickadd">';
    available.slice(0, 5).forEach(lo => {
      // Fix 6: Show frame name + string name separately in quick add pills
      var racquet = RACQUETS.find(function(r) { return r.id === lo.frameId; });
      var frameName = racquet ? racquet.name.split(' ').slice(0, 2).join(' ') : 'Unknown';
      var stringName = '';
      if (lo.isHybrid) {
        var m = STRINGS.find(function(s) { return s.id === lo.mainsId; });
        var x = STRINGS.find(function(s) { return s.id === lo.crossesId; });
        stringName = m && x ? m.name.split(' ')[0] + '/' + x.name.split(' ')[0] : 'Hybrid';
      } else {
        var str = STRINGS.find(function(s) { return s.id === lo.stringId; });
        stringName = str ? str.name.split(' ')[0] : '—';
      }
      html += '<button class="dock-compare-pill" onclick="_dockCompareQuickAdd(\'' + lo.id + '\')" title="OBS ' + (lo.obs ? lo.obs.toFixed(1) : '—') + '">' +
        '<span class="dock-compare-pill-frame">' + frameName + '</span>' +
        '<span class="dock-compare-pill-string">' + stringName + '</span>' +
      '</button>';
    });
    html += '</div>';
  }

  // Empty state
  const al = getActiveLoadout();
  if (comparisonSlots.length === 0 && getSavedLoadouts().length === 0 && !al) {
    html = _dockGuidance(_dockIcons.compare, 'Nothing to compare yet',
      'Set a build active from the Racket Bible, then come back here.');
  }

  // Action links
  const validSlots = comparisonSlots.filter(s => s.stats);
  html += _dockContextActions([
    ...(validSlots.length >= 2 ? [{ label: '→ Tune active build', onclick: "switchMode('tune')" }] : []),
    { label: '→ Optimize from here', onclick: "switchMode('optimize')" },
    { label: '→ Back to overview', onclick: "switchMode('overview')" }
  ]);

  container.innerHTML = html;
}

// --- Dock Compare Helpers ---
function _dockCompareEdit(slotIndex) {
  // Open inline card editor
  _toggleCompareCardEditor(slotIndex);
  // Scroll card into view
  var card = document.querySelector('.compare-summary-card[data-slot-index="' + slotIndex + '"]');
  if (card) requestAnimationFrame(function() { card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
}

function _dockCompareRemove(slotIndex) {
  comparisonSlots.splice(slotIndex, 1);

  try {
    renderComparisonSlots();
    renderCompareSummaries();
    renderCompareVerdict();
    renderCompareMatrix();
    updateComparisonRadar();
  } catch (e) {
    console.warn('Compare workspace render error after remove:', e);
  }

  renderDockContextPanel();
}

function _dockCompareQuickAdd(loadoutId) {
  const lo = savedLoadouts.find(l => l.id === loadoutId);
  if (!lo || comparisonSlots.length >= 3) return;
  _addLoadoutAsSlot(lo);

  // Render workspace (errors here must not block dock update)
  try {
    renderComparisonSlots();
    renderCompareSummaries();
    renderCompareVerdict();
    renderCompareMatrix();
    updateComparisonRadar();
  } catch (e) {
    console.warn('Compare workspace render error after quick-add:', e);
  }

  // Always update dock panel
  renderDockContextPanel();
}

function _renderDockPanelOptimize(container) {
  _dockReturnEditorHome();
  const editorSection = document.getElementById('dock-editor-section');
  if (editorSection) editorSection.style.display = 'none';

  const al = getActiveLoadout();
  if (!al) {
    container.innerHTML = _dockGuidance(
      _dockIcons.optimize,
      'No build to optimize from',
      'Load a build first — the optimizer finds better string pairings for your current frame.'
    ) + _dockContextActions([
      { label: '→ Browse the Racket Bible', onclick: "switchMode('compendium')" },
      { label: '→ Try the quiz', onclick: "openFindMyBuild()" }
    ]);
    return;
  }

  const racquet = RACQUETS.find(r => r.id === al.frameId);
  const obs = al.obs ? al.obs.toFixed(1) : '—';

  // Current string info
  let stringName = '—';
  if (al.isHybrid) {
    const m = STRINGS.find(s => s.id === al.mainsId);
    const x = STRINGS.find(s => s.id === al.crossesId);
    stringName = m && x ? m.name + ' / ' + x.name : '—';
  } else {
    const str = STRINGS.find(s => s.id === al.stringId);
    stringName = str ? str.name : '—';
  }

  const tensionLabel = `M${al.mainsTension} / X${al.crossesTension}`;

  container.innerHTML = `
    <div class="dock-ctx-current">
      <div class="dock-ctx-label">Optimizing from</div>
      <div class="dock-ctx-current-name">${racquet ? racquet.name.replace(/\\s+\\d+g$/, '') : '—'}</div>
      <div class="dock-ctx-current-detail">${stringName} · ${tensionLabel}</div>
      <div class="dock-ctx-current-obs">OBS ${obs}</div>
    </div>
  ` + _dockContextActions([
    { label: '→ Back to overview', onclick: "switchMode('overview')" },
    { label: '→ Tune this build', onclick: "switchMode('tune')" },
    { label: '→ Compare top results', onclick: "switchMode('compare')" }
  ]);
}

function _renderDockPanelReference(container) {
  _dockReturnEditorHome();
  const editorSection = document.getElementById('dock-editor-section');
  if (editorSection) editorSection.style.display = 'none';

  const al = getActiveLoadout();
  const actions = [];
  if (al) {
    actions.push({ label: '→ Back to your build', onclick: "switchMode('overview')" });
    actions.push({ label: '→ Tune tension curves', onclick: "switchMode('tune')" });
  } else {
    actions.push({ label: '→ Browse the Racket Bible', onclick: "switchMode('compendium')" });
    actions.push({ label: '→ Try the quiz', onclick: "openFindMyBuild()" });
  }

  container.innerHTML = _dockGuidance(
    _dockIcons.reference,
    'Reference',
    "You're reading how the prediction engine works."
  ) + _dockContextActions(actions);
}

// === Mobile dock bar sync ===
function _syncMobileDockBar() {
  var obsEl = document.getElementById('dock-mob-obs');
  var labelEl = document.getElementById('dock-mob-label');
  if (!obsEl || !labelEl) return;
  
  const al = getActiveLoadout();
  if (al) {
    var newMobObs = al.obs || 0;
    if (newMobObs > 0 && _prevObsValues.mobile != null && _prevObsValues.mobile > 0) {
      animateOBS(obsEl, _prevObsValues.mobile, newMobObs, 400);
    } else {
      obsEl.textContent = newMobObs > 0 ? newMobObs.toFixed(1) : '';
    }
    _prevObsValues.mobile = newMobObs;
    labelEl.textContent = al.name || 'Active loadout';
  } else {
    obsEl.textContent = '';
    labelEl.textContent = 'No active loadout';
  }
}

function toggleMobileDock() {
  var dock = document.getElementById('build-dock');
  var backdrop = document.getElementById('dock-backdrop');
  var mobileBar = document.getElementById('dock-mobile-bar');
  if (!dock) return;

  var isExpanded = dock.classList.toggle('dock-expanded');

  // Toggle backdrop
  if (backdrop) {
    if (isExpanded) {
      backdrop.classList.add('active');
    } else {
      backdrop.classList.remove('active');
    }
  }

  // Chevron rotation via class
  if (mobileBar) {
    mobileBar.classList.toggle('bar-expanded', isExpanded);
  }
}

// ═══ DOCK COLLAPSE RAIL ═══

function toggleDockCollapse() {
  var dock = document.getElementById('build-dock');
  if (!dock) return;
  var isCollapsed = dock.classList.toggle('dock-collapsed');
  document.documentElement.style.setProperty('--dock-w', isCollapsed ? '64px' : '300px');
  try { localStorage.setItem('dockCollapsed', isCollapsed ? '1' : '0'); } catch(e) {}
  if (isCollapsed) _syncDockRail();
  // Dispatch resize after CSS transition for chart reflow
  setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 320);
}

function _syncDockRail() {
  var obsEl = document.getElementById('dock-rail-obs');
  var countEl = document.getElementById('dock-rail-count');
  if (obsEl) {
    if (activeLoadout && activeLoadout.obs) {
      obsEl.textContent = activeLoadout.obs.toFixed(1);
      obsEl.style.color = getObsScoreColor(activeLoadout.obs);
    } else {
      obsEl.textContent = '—';
      obsEl.style.color = 'var(--dc-storm)';
    }
  }
  if (countEl) {
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem('savedLoadouts') || '[]'); } catch(e) {}
    countEl.textContent = saved.length;
  }
}

function _initDockCollapse() {
  try {
    var collapsed = localStorage.getItem('dockCollapsed') === '1';
    if (collapsed && window.innerWidth > 1024) {
      var dock = document.getElementById('build-dock');
      if (dock) {
        dock.classList.add('dock-collapsed');
        document.documentElement.style.setProperty('--dock-w', '64px');
        _syncDockRail();
      }
    }
  } catch(e) {}
}


// ============================================
// SHAREABLE URLs + EXPORT/IMPORT
// ============================================
// Core functions imported from './src/utils/share.js'

function shareLoadout(loadoutId) {
  var lo = savedLoadouts.find(function(l) { return l.id === loadoutId; });
  if (!lo && activeLoadout && activeLoadout.id === loadoutId) lo = activeLoadout;
  if (!lo) return;
  
  var url = generateShareURL(lo);
  copyToClipboard(url).then(function() {
    showShareToast('Link copied to clipboard!');
  });
}

function shareActiveLoadout() {
  if (!activeLoadout) return;
  shareLoadout(activeLoadout.id);
}

function exportLoadouts() {
  exportLoadoutsToFile(savedLoadouts, showShareToast);
}

function importLoadouts(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var imported = importLoadoutsFromJSON(e.target.result, {
        createLoadout: createLoadout,
        saveLoadout: saveLoadout,
        savedLoadouts: savedLoadouts,
        renderDockPanel: renderDockPanel,
        showToast: showShareToast
      });
      showShareToast(imported + ' loadout' + (imported !== 1 ? 's' : '') + ' imported!');
      renderDockPanel();
    } catch(err) {
      showShareToast('Error reading file');
    }
  };
  reader.readAsText(file);
  // Reset input so same file can be imported again
  event.target.value = '';
}

function _handleSharedBuildURL() {
  var decoded = parseSharedBuildFromURL();
  if (!decoded || !decoded.frameId) return false;
  
  // Create the loadout
  var opts = { source: 'shared' };
  if (decoded.isHybrid) {
    opts.isHybrid = true;
    opts.mainsId = decoded.mainsId;
    opts.crossesId = decoded.crossesId;
    opts.crossesTension = decoded.crossesTension;
  }
  var lo = createLoadout(
    decoded.frameId,
    decoded.isHybrid ? decoded.mainsId : decoded.stringId,
    decoded.mainsTension,
    opts
  );
  
  if (lo) {
    activateLoadout(lo);
    saveLoadout(lo);
    // Clean URL without reload
    var cleanURL = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', cleanURL);
    showShareToast('Shared build loaded!');
    return true;
  }
  return false;
}

function renderMyLoadouts() {
  var listEl = document.getElementById('dock-myl-list');
  var countEl = document.getElementById('dock-myl-count');
  if (!listEl) return;

  if (countEl) countEl.textContent = savedLoadouts.length;

  if (savedLoadouts.length === 0) {
    listEl.innerHTML = '<div class="px-3 py-4 text-center font-mono text-[10px] text-dc-storm">No saved loadouts yet</div>';
    return;
  }

  var sourceLabels = { quiz: 'Quiz', compendium: 'Bible', manual: '', preset: 'Preset', optimize: 'Opt', shared: 'Shared', import: 'Imp' };

  listEl.innerHTML = savedLoadouts.map(function(lo) {
    var isActive = activeLoadout && activeLoadout.id === lo.id;
    if (!isActive && activeLoadout) {
      isActive = activeLoadout.frameId === lo.frameId &&
        activeLoadout.mainsTension === lo.mainsTension &&
        activeLoadout.crossesTension === lo.crossesTension &&
        activeLoadout.isHybrid === (lo.isHybrid || false) &&
        (lo.isHybrid
          ? activeLoadout.mainsId === lo.mainsId && activeLoadout.crossesId === lo.crossesId
          : activeLoadout.stringId === lo.stringId);
    }

    var racquet = RACQUETS.find(function(r) { return r.id === lo.frameId; });
    var frameName = racquet ? racquet.name : '\u2014';
    var stringName = '\u2014';
    if (lo.isHybrid) {
      var m = STRINGS.find(function(s) { return s.id === lo.mainsId; });
      var x = STRINGS.find(function(s) { return s.id === lo.crossesId; });
      stringName = (m && x) ? (m.name + ' / ' + x.name) : '\u2014';
    } else {
      var str = STRINGS.find(function(s) { return s.id === lo.stringId; });
      stringName = str ? str.name : '\u2014';
    }

    var srcLabel = sourceLabels[lo.source] || '';
    var obsColor = getObsScoreColor(lo.obs || 0);
    var activeBorderClass = isActive
      ? 'border-l-2 border-l-[var(--dc-accent)] bg-[var(--dc-void-lift)]'
      : 'border-l-2 border-l-transparent hover:bg-[var(--dc-void-lift)]';

    return (
      '<div class="group relative flex items-stretch border-b border-[var(--dc-border)] last:border-b-0 transition-colors ' + activeBorderClass + '" data-lo-id="' + lo.id + '">' +
        // Clickable main area
        '<div class="flex items-center gap-2.5 flex-1 min-w-0 px-3 py-2.5 cursor-pointer" onclick="switchToLoadout(\'' + lo.id + '\')">' +
          // OBS box
          '<div class="w-9 h-9 shrink-0 border border-[var(--dc-border)] flex items-center justify-center">' +
            '<span class="font-mono text-[11px] font-bold" style="color:' + obsColor + '">' + (lo.obs ? lo.obs.toFixed(1) : '\u2014') + '</span>' +
          '</div>' +
          // Info
          '<div class="flex-1 min-w-0">' +
            '<div class="font-sans text-[11px] font-semibold text-[var(--dc-platinum)] leading-tight truncate flex items-center gap-1">' +
              frameName +
              (isActive ? '<span class="font-mono text-[7px] uppercase tracking-wider text-[var(--dc-accent)]">Active</span>' : '') +
              (srcLabel ? '<span class="font-mono text-[7px] text-[var(--dc-storm)] border border-[var(--dc-border)] px-1">' + srcLabel + '</span>' : '') +
            '</div>' +
            '<div class="font-mono text-[9px] text-[var(--dc-storm)] truncate leading-tight mt-0.5">' + stringName + '</div>' +
            '<div class="font-mono text-[8px] text-[var(--dc-storm)]/60 mt-0.5">M' + lo.mainsTension + '/X' + lo.crossesTension + ' lbs</div>' +
          '</div>' +
        '</div>' +
        // Ghost action buttons (hover reveal)
        '<div class="flex items-stretch opacity-0 group-hover:opacity-100 transition-opacity border-l border-[var(--dc-border)]">' +
          '<button class="w-8 flex items-center justify-center text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] hover:bg-[var(--dc-void)] transition-colors" onclick="shareLoadout(\'' + lo.id + '\')" title="Share">' +
            '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7.5L8 4.5M8 4.5V7M8 4.5H5.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="1" y="1" width="10" height="10" rx="2"/></svg>' +
          '</button>' +
          '<button class="w-8 flex items-center justify-center text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] hover:bg-[var(--dc-void)] transition-colors border-l border-[var(--dc-border)]" onclick="addLoadoutToCompare(\'' + lo.id + '\')" title="Compare">' +
            '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="4" height="10" rx="0.5"/><rect x="7" y="1" width="4" height="10" rx="0.5"/></svg>' +
          '</button>' +
          '<button class="w-8 flex items-center justify-center text-[var(--dc-storm)] hover:text-[var(--dc-red)] hover:bg-[var(--dc-void)] transition-colors border-l border-[var(--dc-border)]" onclick="confirmRemoveLoadout(\'' + lo.id + '\')" title="Remove">' +
            '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

// Fix J: Two-step remove confirmation (QA-028)
function confirmRemoveLoadout(loadoutId) {
  var item = document.querySelector('[data-lo-id="' + loadoutId + '"]');
  if (!item) return;
  var actionBar = item.querySelector('div.flex.items-stretch.opacity-0, div.flex.items-stretch');
  if (!actionBar) return;
  actionBar.style.opacity = '1';
  actionBar.style.pointerEvents = 'auto';
  actionBar.innerHTML =
    '<span class="font-mono text-[8px] text-[var(--dc-storm)] px-2 flex items-center whitespace-nowrap">Delete?</span>' +
    '<button class="px-2 font-mono text-[9px] font-bold text-[var(--dc-red)] hover:bg-[var(--dc-void)] border-l border-[var(--dc-border)] h-full transition-colors" onclick="removeLoadout(\'' + loadoutId + '\')">Yes</button>' +
    '<button class="px-2 font-mono text-[9px] text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] border-l border-[var(--dc-border)] h-full transition-colors" onclick="renderMyLoadouts()">No</button>';
}

// Dock action handlers
function saveActiveLoadout() {
  const al = getActiveLoadout();
  if (!al) return;
  al._dirty = false;
  saveLoadout(al);
}

function duplicateActiveLoadout() {
  const al = getActiveLoadout();
  if (!al) return;
  var dupe = Object.assign({}, al, {
    id: 'lo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name: al.name + ' (copy)'
  });
  saveLoadout(dupe);
  activateLoadout(dupe);
}

function resetActiveLoadout() {
  setActiveLoadout(null);
  _stateSetActiveLoadout(null);

  // Clear tune sandbox state
  tuneState.baseline = null;
  tuneState.explored = null;

  // Full editor reset — clear all form elements
  ssInstances['select-racquet']?.setValue('');
  ssInstances['select-string-full']?.setValue('');
  ssInstances['select-string-mains']?.setValue('');
  ssInstances['select-string-crosses']?.setValue('');
  setHybridMode(false);

  // Reset tension inputs to defaults
  var tfm = document.getElementById('input-tension-full-mains');
  var tfx = document.getElementById('input-tension-full-crosses');
  var thm = document.getElementById('input-tension-mains');
  var thx = document.getElementById('input-tension-crosses');
  if (tfm) tfm.value = 55;
  if (tfx) tfx.value = 53;
  if (thm) thm.value = 55;
  if (thx) thx.value = 53;

  // Reset gauge dropdowns
  ['gauge-select-full', 'gauge-select-mains', 'gauge-select-crosses'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.innerHTML = '<option value="">\u2014</option>'; el.disabled = true; }
  });

  // Close editor details if open
  var editor = document.getElementById('dock-editor-section');
  if (editor) editor.open = false;

  // Hide frame specs
  var specs = document.getElementById('frame-specs');
  if (specs) specs.classList.add('hidden');

  renderDockPanel();
  if (currentMode === 'overview') renderDashboard();
  if (currentMode === 'tune') refreshTuneIfActive();
}

function addLoadoutToCompare(loadoutId) {
  var lo = savedLoadouts.find(function(l) { return l.id === loadoutId; });
  if (!lo) return;

  if (comparisonSlots.length >= 3) comparisonSlots.pop();

  _addLoadoutAsSlot(lo);

  if (currentMode === 'compare') {
    renderComparisonSlots();
    renderCompareSummaries();
    renderCompareVerdict();
    renderCompareMatrix();
    updateComparisonRadar();
  } else {
    switchMode('compare');
  }
}

// Legacy alias for backward compat
// Legacy alias for backward compat — routes through the canonical path
function setActiveLoadout(loadoutData) {
  activateLoadout(loadoutData);
}

function renderDockState() {
  renderDockPanel();
}

function switchMode(mode) {
  if (mode === currentMode) return;

  // On mobile the page itself scrolls (workspace has height:auto/overflow:visible)
  const workspace = document.getElementById('workspace');
  const _isMobileScroll = window.innerWidth <= 1024;

  // Save scroll position of current mode
  if (_isMobileScroll) {
    scrollPositions[currentMode] = window.scrollY;
  } else if (workspace) {
    scrollPositions[currentMode] = workspace.scrollTop;
  }

  // Hide current mode section
  const currentSection = document.getElementById('mode-' + currentMode);
  if (currentSection) currentSection.classList.add('hidden');

  // Update mode switcher buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // Sync mobile tab bar active state
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // On mobile, close the dock overlay when switching modes
  if (_isMobileScroll) {
    const dock = document.getElementById('build-dock');
    if (dock && dock.classList.contains('dock-expanded')) {
      toggleMobileDock();
    }
  }

  const prevMode = currentMode;
  currentMode = mode;

  // Update legacy flags for backward compat
  isTuneMode = (mode === 'tune');
  isComparisonMode = (mode === 'compare');

  // Show new mode section with animation replay
  const newSection = document.getElementById('mode-' + mode);
  if (newSection) {
    newSection.classList.remove('hidden');
    // Force animation replay by resetting
    newSection.style.animation = 'none';
    newSection.offsetHeight; // trigger reflow
    newSection.style.animation = '';
  }

  // Restore scroll position
  requestAnimationFrame(() => {
    if (_isMobileScroll) {
      window.scrollTo(0, scrollPositions[mode] || 0);
    } else if (workspace) {
      workspace.scrollTop = scrollPositions[mode] || 0;
    }
  });

  // Mode-specific initialization
  if (mode === 'overview') {
    renderDashboard();
  } else if (mode === 'tune') {
    const setup = getCurrentSetup();
    if (setup) {
      initTuneMode(setup);
    }
  } else if (mode === 'compare') {
    renderComparisonPresets();
    if (comparisonSlots.length === 0) {
      if (savedLoadouts.length >= 2) {
        _autoFillCompareFromSaved();
      } else if (savedLoadouts.length === 1 || activeLoadout) {
        addComparisonSlotFromHome();
        _showCompareQuickAddPrompt();
      } else {
        addComparisonSlotFromHome();
      }
    } else {
      renderComparisonSlots();
      renderCompareSummaries();
      renderCompareVerdict();
      renderCompareMatrix();
      updateComparisonRadar();
    }
    // Wire close-editors button
    const closeBtn = document.getElementById('compare-editors-close');
    if (closeBtn) closeBtn.onclick = closeCompareEditors;
  } else if (mode === 'optimize') {
    if (!_optimizeInitialized) {
      initOptimize();
      _optimizeInitialized = true;
    }
  } else if (mode === 'compendium') {
    if (!_compendiumInitialized) {
      initCompendium();
      _compendiumInitialized = true;
    } else {
      // Re-sync with active loadout to ensure consistency
      _compSyncWithActiveLoadout();
    }
  }
  // howitworks mode needs no special init — it's static content

  // Update dock context panel for new mode
  renderDockContextPanel();
}

// ============================================
// DYNAMIC PRESET SYSTEM
// ============================================

// Persistence helpers — try web storage, fall back to in-memory
const _store = (function() { try { return window['local' + 'Storage']; } catch(e) { return null; } })();

function loadPresetsFromStorage() {
  try {
    if (!_store) return null;
    const stored = _store.getItem('tll-presets');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* storage blocked or corrupt — ignore */ }
  return null;
}

function savePresetsToStorage() {
  try {
    if (!_store) return;
    _store.setItem('tll-presets', JSON.stringify(userPresets));
  } catch (e) { /* storage blocked — ignore */ }
}

let userPresets = loadPresetsFromStorage() || [...DEFAULT_PRESETS];

function getPresetDetail(preset) {
  const racquet = RACQUETS.find(r => r.id === preset.racquetId);
  const rName = racquet ? racquet.name : 'Unknown';
  if (preset.isHybrid) {
    const mains = STRINGS.find(s => s.id === preset.mainsId);
    const crosses = STRINGS.find(s => s.id === preset.crossesId);
    const mName = mains ? mains.name : '?';
    const xName = crosses ? crosses.name : '?';
    return `${mName} M:${preset.mainsTension} / ${xName} X:${preset.crossesTension} on ${rName}`;
  } else {
    const str = STRINGS.find(s => s.id === preset.stringId);
    const sName = str ? str.name : '?';
    const mt = preset.mainsTension ?? preset.tension ?? 55;
    const xt = preset.crossesTension ?? preset.tension ?? 53;
    return `${sName} ${mt === xt ? mt + ' lbs' : 'M:' + mt + ' / X:' + xt} on ${rName}`;
  }
}

function renderHomePresets() {
  const container = $('#preset-list');
  if (!container) return;
  container.innerHTML = '';

  userPresets.forEach((preset, idx) => {
    const div = document.createElement('div');
    div.className = 'preset-item';
    div.innerHTML = `
      <button class="preset-btn" data-preset-idx="${idx}">
        <span class="preset-name">${preset.name}</span>
        <span class="preset-detail">${getPresetDetail(preset)}</span>
      </button>
      <button class="preset-delete" data-preset-idx="${idx}" title="Remove preset">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    `;
    container.appendChild(div);
  });

  // Attach events
  container.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.presetIdx);
      loadPresetFromData(userPresets[idx]);
    });
  });
  container.querySelectorAll('.preset-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.presetIdx);
      userPresets.splice(idx, 1);
      savePresetsToStorage();
      renderHomePresets();
      renderComparisonPresets();
    });
  });
}

function saveCurrentAsPreset() {
  const setup = getCurrentSetup();
  if (!setup) return;

  const { racquet, stringConfig } = setup;
  let presetName = '';

  if (stringConfig.isHybrid) {
    presetName = `${stringConfig.mains.name}/${stringConfig.crosses.name} on ${racquet.name}`;
  } else {
    presetName = `${stringConfig.string.name} on ${racquet.name}`;
  }

  const preset = {
    id: 'user-' + Date.now(),
    name: presetName,
    racquetId: racquet.id,
    isHybrid: stringConfig.isHybrid,
    mainsId: stringConfig.isHybrid ? stringConfig.mains.id : null,
    crossesId: stringConfig.isHybrid ? stringConfig.crosses.id : null,
    mainsTension: stringConfig.mainsTension,
    crossesTension: stringConfig.crossesTension,
    stringId: stringConfig.isHybrid ? null : stringConfig.string.id
  };

  userPresets.push(preset);
  savePresetsToStorage();
  renderHomePresets();
  renderComparisonPresets();

  // Flash save button
  const btn = $('#btn-save-preset');
  if (btn) {
    btn.classList.add('saved');
    btn.textContent = '✓ Saved';
    setTimeout(() => {
      btn.classList.remove('saved');
      btn.textContent = '+ Save Current Setup';
    }, 1200);
  }
}

function loadPresetFromData(preset) {
  if (!preset) return;
  const racquet = RACQUETS.find(r => r.id === preset.racquetId);
  if (!racquet) return;

  const mt = preset.mainsTension ?? preset.tension ?? 55;
  const xt = preset.crossesTension ?? preset.tension ?? 53;

  const opts = {
    source: 'preset',
    crossesTension: xt,
  };
  if (preset.isHybrid) {
    opts.isHybrid = true;
    opts.mainsId = preset.mainsId;
    opts.crossesId = preset.crossesId;
  }

  const lo = createLoadout(
    preset.racquetId,
    preset.isHybrid ? preset.mainsId : preset.stringId,
    mt,
    opts
  );
  if (lo) {
    activateLoadout(lo);
    renderDashboard();
  }
}

function loadPresetIntoSlot(presetIdx, slotIdx) {
  const preset = userPresets[presetIdx];
  if (!preset) return;
  const slot = comparisonSlots[slotIdx];
  if (!slot) return;

  slot.racquetId = preset.racquetId;
  slot.isHybrid = preset.isHybrid;

  if (preset.isHybrid) {
    slot.mainsId = preset.mainsId;
    slot.crossesId = preset.crossesId;
    slot.mainsTension = preset.mainsTension;
    slot.crossesTension = preset.crossesTension;
    slot.stringId = '';
  } else {
    slot.stringId = preset.stringId;
    slot.mainsTension = preset.mainsTension ?? preset.tension ?? 55;
    slot.crossesTension = preset.crossesTension ?? preset.tension ?? 53;
    slot.mainsId = '';
    slot.crossesId = '';
  }

  recalcSlot(slotIdx);
}

function renderComparisonPresets() {
  const container = $('#comparison-presets');
  if (!container) return;

  // Build suggestions from: 1) saved loadouts, 2) tune recommendations
  const suggestions = [];
  const slotKeys = new Set(comparisonSlots.map(s => s.racquetId + '|' + s.stringId + '|' + s.mainsTension));
  
  // Add saved loadouts not already in comparison
  savedLoadouts.forEach(lo => {
    const key = lo.frameId + '|' + lo.stringId + '|' + lo.mainsTension;
    if (!slotKeys.has(key)) {
      const racquet = RACQUETS.find(r => r.id === lo.frameId);
      suggestions.push({
        label: lo.name.length > 28 ? lo.name.substring(0, 28) + '...' : lo.name,
        obs: lo.obs,
        frameId: lo.frameId,
        stringId: lo.stringId,
        tension: lo.mainsTension,
        source: 'saved',
        isHybrid: lo.isHybrid,
        mainsId: lo.mainsId,
        crossesId: lo.crossesId,
        crossesTension: lo.crossesTension
      });
    }
  });
  
  // If we have an active setup, add Tune-page recommended builds as suggestions
  if (activeLoadout) {
    const setup = getCurrentSetup();
    if (setup && typeof renderRecommendedBuilds === 'function') {
      // Quick-generate top 3 alternative builds for the current frame
      const racquet = setup.racquet;
      const midT = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
      const quickRecs = [];
      STRINGS.slice(0, 30).forEach(s => {
        if (activeLoadout.stringId === s.id) return;
        const cfg = { isHybrid: false, string: s, mainsTension: midT, crossesTension: midT };
        const stats = predictSetup(racquet, cfg);
        if (!stats) return;
        const tCtx = buildTensionContext(cfg, racquet);
        const score = computeCompositeScore(stats, tCtx);
        quickRecs.push({ label: s.name + ' on ' + racquet.name, obs: +score.toFixed(1), frameId: racquet.id, stringId: s.id, tension: midT, source: 'suggested' });
      });
      quickRecs.sort((a, b) => b.obs - a.obs);
      const seen = new Set(suggestions.map(s => s.frameId + '|' + s.stringId));
      quickRecs.slice(0, 4).forEach(r => {
        const key = r.frameId + '|' + r.stringId + '|' + r.tension;
        if (!slotKeys.has(key) && !seen.has(r.frameId + '|' + r.stringId)) {
          suggestions.push(r);
        }
      });
    }
  }
  
  if (suggestions.length === 0) {
    container.innerHTML = '<span class="comp-presets-empty">Save loadouts from Racket Bible to quick-add here</span>';
    return;
  }

  let html = '';
  suggestions.slice(0, 5).forEach((s, idx) => {
    html += `<button class="comp-preset-btn" data-sug-idx="${idx}" title="${s.label} · OBS ${s.obs || '—'}">
      <span class="comp-preset-name">${s.label}</span>
    </button>`;
  });
  container.innerHTML = html;

  // Store suggestions for click handler
  container._suggestions = suggestions;

  container.querySelectorAll('.comp-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.sugIdx);
      const s = container._suggestions[idx];
      if (!s) return;
      let targetSlot = comparisonSlots.findIndex(sl => !sl.racquetId);
      if (targetSlot === -1) {
        if (comparisonSlots.length < 3) {
          addComparisonSlot();
          targetSlot = comparisonSlots.length - 1;
        } else {
          targetSlot = comparisonSlots.length - 1;
        }
      }
      // Load suggestion into comparison slot
      const slot = comparisonSlots[targetSlot];
      if (slot) {
        slot.racquetId = s.frameId;
        slot.stringId = s.stringId || '';
        slot.isHybrid = s.isHybrid || false;
        slot.mainsId = s.mainsId || '';
        slot.crossesId = s.crossesId || '';
        slot.mainsTension = s.tension || 53;
        slot.crossesTension = s.crossesTension || s.tension || 53;
        recalcSlot(targetSlot);
      }

      // Re-render presets to remove the one just added
      renderComparisonPresets();

      // Flash feedback
      btn.classList.add('loaded');
      setTimeout(() => btn.classList.remove('loaded'), 600);
    });
  });
}

function getSlotColors() {
  // Digicraft Brutalism — Slot A is Artful Red (active), B and C are platinum ghosts
  return [
    { 
      // Slot A: Artful Red — the "active" read
      border: 'rgba(175, 0, 0, 0.8)', 
      bg: 'rgba(175, 0, 0, 0.06)', 
      bgFaint: 'rgba(175, 0, 0, 0.04)', 
      label: 'A', 
      cssClass: 'a', 
      borderDash: [] 
    },
    { 
      // Slot B: Platinum ghost
      border: 'rgba(220, 223, 226, 0.5)', 
      bg: 'rgba(220, 223, 226, 0.03)', 
      bgFaint: 'rgba(220, 223, 226, 0.02)', 
      label: 'B', 
      cssClass: 'b', 
      borderDash: [6, 3] 
    },
    { 
      // Slot C: Faintest platinum
      border: 'rgba(220, 223, 226, 0.25)', 
      bg: 'rgba(220, 223, 226, 0.02)', 
      bgFaint: 'rgba(220, 223, 226, 0.01)', 
      label: 'C', 
      cssClass: 'c', 
      borderDash: [2, 2] 
    }
  ];
}
let SLOT_COLORS = getSlotColors();

// ============================================
// POPULATE DROPDOWNS (Searchable)
// ============================================
// createSearchableSelect and ssInstances imported from './src/ui/components/searchable-select.js'

function populateRacquetDropdown(targetEl) {
  // targetEl was previously a <select>, now it's a container div
  // We replace it with the searchable component
  const wrapper = targetEl;
  const existingValue = '';
  ssInstances[wrapper.id] = createSearchableSelect(wrapper, {
    type: 'racquet',
    placeholder: 'Select Racquet...',
    value: existingValue,
    id: wrapper.id + '-trigger',
    onChange: (val) => {
      const r = RACQUETS.find(x => x.id === val);
      showFrameSpecs(r);
      if (activeLoadout) {
        commitEditorToLoadout();
      } else {
        renderDashboard();
      }
    }
  });
}

function populateStringDropdown(targetEl, initialValue) {
  const wrapper = targetEl;
  ssInstances[wrapper.id] = createSearchableSelect(wrapper, {
    type: 'string',
    placeholder: wrapper.dataset.placeholder || 'Select String...',
    value: initialValue || '',
    id: wrapper.id + '-trigger',
    onChange: (val) => {
      // Update gauge display
      const gaugeEl = wrapper.dataset.gaugeTarget ? document.getElementById(wrapper.dataset.gaugeTarget) : null;
      if (gaugeEl) populateGaugeDropdown(gaugeEl, val);
      if (activeLoadout) {
        commitEditorToLoadout();
      } else {
        renderDashboard();
      }
    }
  });
}

function populateGaugeDropdown(el, stringId) {
  if (!el) return;

  // Handle both old div-based and new select-based gauge elements
  const isSelect = el.tagName === 'SELECT';

  if (!stringId) {
    if (isSelect) {
      el.innerHTML = '<option value="">—</option>';
      el.disabled = true;
    } else {
      el.textContent = '—';
    }
    return;
  }

  const s = STRINGS.find(x => x.id === stringId);
  if (!s) {
    if (isSelect) {
      el.innerHTML = '<option value="">—</option>';
      el.disabled = true;
    } else {
      el.textContent = '—';
    }
    return;
  }

  if (isSelect) {
    const options = getGaugeOptions(s);
    const refGauge = s.gaugeNum;
    el.innerHTML = options.map(g => {
      const isRef = Math.abs(g - refGauge) < 0.005;
      let label = GAUGE_LABELS[g];
      if (!label) {
        // Build label for non-standard gauges
        const gNum = g >= 1.30 ? '16' : g >= 1.25 ? '16L' : g >= 1.20 ? '17' : '18';
        label = `${gNum} (${g.toFixed(2)}mm)`;
      }
      const tag = isRef ? ' •' : '';
      return `<option value="${g}" ${isRef ? 'selected' : ''}>${label}${tag}</option>`;
    }).join('');
    el.disabled = false;
    // Fire change handler to rebuild on gauge change
    el.onchange = () => { activeLoadout ? commitEditorToLoadout() : renderDashboard(); };
  } else {
    el.textContent = s.gauge;
  }
}

// ============================================
// FRAME SPECS DISPLAY
// ============================================

function showFrameSpecs(racquet) {
  const el = $('#frame-specs');
  if (!racquet) {
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="frame-spec-item"><span class="frame-spec-label">STRUNG WGHT</span><span class="frame-spec-value">${racquet.strungWeight}g</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">SW</span><span class="frame-spec-value">${racquet.swingweight}</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Stiffness</span><span class="frame-spec-value">${racquet.stiffness} RA</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Pattern</span><span class="frame-spec-value">${racquet.pattern}</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Head</span><span class="frame-spec-value">${racquet.headSize} sq in</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Balance</span><span class="frame-spec-value">${racquet.balancePts}</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Beam</span><span class="frame-spec-value">${racquet.beamWidth.join('/')}</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Tension</span><span class="frame-spec-value">${racquet.tensionRange[0]}-${racquet.tensionRange[1]} lbs</span></div>
  `;
}

// ============================================
// MAIN DASHBOARD RENDER
// ============================================

// _getSetupFromEditorDOM: reads build state directly from dock editor form elements.
// Used ONLY as fallback when no activeLoadout exists (e.g., creation form, first-time user).
// For all normal operation, getCurrentSetup() reads from the loadout model instead.
function _getSetupFromEditorDOM() {
  const racquetId = ssInstances['select-racquet']?.getValue() || '';
  const racquet = RACQUETS.find(r => r.id === racquetId);
  if (!racquet) return null;

  const isHybrid = $('#btn-hybrid').classList.contains('active');

  if (isHybrid) {
    const mainsId = ssInstances['select-string-mains']?.getValue() || '';
    const crossesId = ssInstances['select-string-crosses']?.getValue() || '';
    if (!mainsId || !crossesId) return null;

    // Read gauge selections
    const mainsGaugeEl = document.getElementById('gauge-select-mains');
    const crossesGaugeEl = document.getElementById('gauge-select-crosses');
    const mainsGauge = mainsGaugeEl && mainsGaugeEl.value ? parseFloat(mainsGaugeEl.value) : null;
    const crossesGauge = crossesGaugeEl && crossesGaugeEl.value ? parseFloat(crossesGaugeEl.value) : null;

    // Apply gauge modifiers to string data
    let mainsData = STRINGS.find(s => s.id === mainsId);
    let crossesData = STRINGS.find(s => s.id === crossesId);
    if (mainsData && mainsGauge) mainsData = applyGaugeModifier(mainsData, mainsGauge);
    if (crossesData && crossesGauge) crossesData = applyGaugeModifier(crossesData, crossesGauge);

    return {
      racquet,
      stringConfig: {
        isHybrid: true,
        mains: mainsData,
        crosses: crossesData,
        mainsId, crossesId,
        mainsTension: parseInt($('#input-tension-mains').value) || 55,
        crossesTension: parseInt($('#input-tension-crosses').value) || 53
      }
    };
  } else {
    const stringId = ssInstances['select-string-full']?.getValue() || '';
    if (!stringId) return null;

    // Read gauge selection
    const gaugeEl = document.getElementById('gauge-select-full');
    const selectedGauge = gaugeEl && gaugeEl.value ? parseFloat(gaugeEl.value) : null;

    // Apply gauge modifier to string data
    let stringData = STRINGS.find(s => s.id === stringId);
    if (stringData && selectedGauge) stringData = applyGaugeModifier(stringData, selectedGauge);

    return {
      racquet,
      stringConfig: {
        isHybrid: false,
        string: stringData,
        mainsTension: parseInt($('#input-tension-full-mains').value) || 55,
        crossesTension: parseInt($('#input-tension-full-crosses').value) || 53
      }
    };
  }
}

// getCurrentSetup: Smart wrapper — reads from activeLoadout model when available,
// falls back to DOM editor for creation form / no-loadout state.
// This is the ONLY function external code should call to get the current build.
function getCurrentSetup() {
  if (activeLoadout) {
    return getSetupFromLoadout(activeLoadout);
  }
  return _getSetupFromEditorDOM();
}

// Wave 2: Assign stagger animation indices to direct children of a container
function _assignStaggerIndices(containerSel) {
  const container = document.querySelector(containerSel);
  if (!container) return;
  const children = container.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    // Skip hidden elements
    if (child.classList.contains('hidden') || child.style.display === 'none') continue;
    child.classList.add('stagger-item');
    child.style.setProperty('--stagger-i', i);
    // Force animation replay
    child.style.animation = 'none';
    child.offsetHeight;
    child.style.animation = '';
  }
}

function renderDashboard() {
  renderMobileLoadoutPills();
  const setup = getCurrentSetup();

  if (!setup) {
    $('#empty-state').classList.remove('hidden');
    $('#dashboard-content').classList.add('hidden');
    return;
  }

  $('#empty-state').classList.add('hidden');
  $('#dashboard-content').classList.remove('hidden');

  const { racquet, stringConfig } = setup;
  const stats = predictSetup(racquet, stringConfig);
  const identity = generateIdentity(stats, racquet, stringConfig);
  const fitProfile = generateFitProfile(stats, racquet, stringConfig);
  const warnings = generateWarnings(racquet, stringConfig, stats);

  // Hero Band (replaces summary + identity + rating cards)
  renderOverviewHero(racquet, stringConfig, stats, identity);

  // Stats
  renderStatBars(stats);
  renderRadarChart(stats);

  // Fit
  renderFitProfile(fitProfile);

  // Progressive depth (foundation now inside Build DNA)
  renderOCFoundation(racquet, stringConfig, stats);

  // Warnings
  renderWarnings(warnings);

  // Wave 2: Assign stagger indices to top-level dashboard sections
  _assignStaggerIndices('#dashboard-content');

  // If Tune mode is open, refresh its panels with the updated setup
  refreshTuneIfActive();
}

function renderOverviewHero(racquet, stringConfig, stats, identity) {
  const el = $('#overview-hero');
  const tensionCtx = buildTensionContext(stringConfig, racquet);
  const score = computeCompositeScore(stats, tensionCtx);
  const tier = getObsTier(score);

  // String name for meta line
  let stringName;
  if (stringConfig.isHybrid) {
    stringName = `${stringConfig.mains.name} ${stringConfig.mains.gauge} / ${stringConfig.crosses.name} ${stringConfig.crosses.gauge}`;
  } else {
    stringName = `${stringConfig.string.name} ${stringConfig.string.gauge}`;
  }
  const tensionLabel = `M${stringConfig.mainsTension} / X${stringConfig.crossesTension}`;

  // Check if S-Rank for special styling
  const tierClass = tier.label === 'S Rank' ? 's-rank' : '';

  el.innerHTML = `
    <div class="flex flex-col gap-6">
      <!-- Score + Identity Row -->
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <!-- Score Block -->
        <div class="hero-score shrink-0">
          <span class="hero-obs-label">System Sync Rating</span>
          <span class="hero-obs-value">${score.toFixed(1)}</span>
          <span class="hero-obs-tier ${tierClass}">${tier.label}</span>
        </div>
        <!-- Identity Block -->
        <div class="hero-identity flex-1 min-w-0">
          <div class="hero-archetype">${identity.archetype}</div>
          <div class="hero-desc">${identity.description}</div>
          <div class="hero-terminal">
            <span class="hero-terminal-value">${racquet.name.replace(/\\s+\\d+g$/, '')}</span><span class="hero-terminal-sep">//</span><span class="hero-terminal-value">${stringName}</span><span class="hero-terminal-sep">//</span><span class="hero-terminal-value">${tensionLabel}</span>
          </div>
        </div>
      </div>
      <!-- CTA Actions -->
      <div class="mt-2 pt-6 border-t border-dc-storm/20">
        <div class="flex gap-3">
          <button 
            class="flex-1 bg-transparent border border-dc-storm/40 dark:border-dc-storm/40 text-dc-void dark:text-dc-platinum font-mono text-[12px] font-bold uppercase tracking-widest py-3 px-4 hover:border-dc-void dark:hover:border-dc-platinum hover:bg-dc-void/5 dark:hover:bg-dc-platinum/5 transition-colors flex items-center justify-center gap-2"
            onclick="switchMode('compendium')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            //BACK TO BIBLE
          </button>
          <button 
            class="flex-1 bg-dc-accent text-dc-void font-mono text-[12px] font-bold uppercase tracking-widest py-3 px-4 hover:bg-dc-accent/90 transition-colors flex items-center justify-center gap-2"
            onclick="switchMode('tune')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v10"/><path d="M21 12h-6m-6 0H1"/></svg>
            Tune This Build
          </button>
        </div>
      </div>
    </div>
  `;

  // OBS counting animation on hero value
  var heroObsEl = el.querySelector('.hero-obs-value');
  if (heroObsEl && _prevObsValues.hero != null) {
    animateOBS(heroObsEl, _prevObsValues.hero, score, 500);
  }
  _prevObsValues.hero = score;
}


// ============================================
// OVERVIEW 4-CARD GRID
// ============================================

// Build tension context for OBS sanity penalty
function __buildTensionContext_OLD(stringConfig, racquet) {
  if (!stringConfig || !racquet) return null;
  const avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  const differential = stringConfig.mainsTension - stringConfig.crossesTension;
  const [, patCrosses] = (racquet.pattern || '16x19').split('x').map(Number);
  return { avgTension, tensionRange: racquet.tensionRange, differential, patternCrosses: patCrosses };
}

// --- Novelty/Anomaly Bonus System ---
// Rewards frames that achieve a rare combination of high performance stats.
// A frame that's unusually high in power+spin+control for its head size band
// gets a ceiling boost — but only if the rare pattern is genuinely high-performing.
//
// This protects frames like PA 98 2026 (high spin+control in a 98, rare for that class)
// from being crushed by forgiveness weighting, while not boosting merely "weird" frames.
function __computeNoveltyBonus_OLD(stats) {
  const pwr = stats.power;
  const spn = stats.spin;
  const ctl = stats.control;
  const triad = (pwr + spn + ctl) / 3;

  // Determine if any two of the three performance dimensions are notably high
  const highCount = [pwr >= 55, spn >= 68, ctl >= 70].filter(Boolean).length;
  
  // Performance anomaly: at least 2 of 3 dimensions are elevated
  // AND the triad average is well above the database mean (~64)
  if (highCount >= 2 && triad >= 64) {
    // Dual-excellence: frame excels in two+ core areas simultaneously
    // This is the signature of a "rare but coherent" build
    
    // How far above the mean triad (64) is this frame?
    const triadExcess = Math.max(0, triad - 64);
    
    // Bonus scales with triad excess, capped at 5 display points
    // triad 66 → +1.2, triad 68 → +2.4, triad 70 → +3.6, triad 72+ → 5.0
    let bonus = Math.min(triadExcess * 0.6, 5);
    
    // Extra bump if ALL THREE are elevated (extremely rare)
    if (highCount === 3) {
      bonus = Math.min(bonus * 1.4, 6);
    }
    
    // Diminish bonus for frames with very high forgiveness
    // (those are "on-meta" — forgiving spin frames don't need novelty lift)
    if (stats.forgiveness >= 65) {
      bonus *= 0.5;
    } else if (stats.forgiveness >= 60) {
      bonus *= 0.75;
    }
    
    return bonus;
  }

  // Comfort anomaly: exceptional comfort (>= 62) paired with high control (>= 70)
  // Rewards frames like Clash, Gravity that sacrifice power for comfort+control
  if (stats.comfort >= 62 && ctl >= 70 && stats.feel >= 65) {
    const comfortExcess = Math.max(0, stats.comfort - 60);
    return Math.min(comfortExcess * 0.4, 3);
  }

  return 0;
}

function __computeCompositeScore_OLD(stats, tensionContext) {
  // Full 11-stat weighted composite — every modeled stat contributes.
  // Core performance: control, spin, power, comfort — 52%
  // Feel & playability: feel, playability — 16%
  // Frame dynamics: stability, forgiveness, maneuverability — 22%
  // Trajectory & longevity: launch, durability — 8% (unchanged)
  // Maneuverability shares weight previously held by stability/forgiveness
  // — reflects how swing dynamics shape the entire stringbed interaction
  const raw = stats.control * 0.16
            + stats.spin * 0.13
            + stats.comfort * 0.13
            + stats.power * 0.11
            + stats.feel * 0.10
            + stats.maneuverability * 0.09
            + stats.stability * 0.07
            + stats.forgiveness * 0.07
            + stats.playability * 0.06
            + stats.launch * 0.04
            + stats.durability * 0.04;
  // Rescale: the raw weighted average clusters in a narrow band (~59–67)
  // across all frame×string combos. Map to 0–100 display scale.
  // Slope 8.5 calibrated so:
  //   - gut-vs-poly delta ≈ +15 (was +30 at slope 11)
  //   - poly mean lands in mid-40s to low-50s
  //   - gut on premium frames reaches WTF/Max Aura appropriately
  // Anchor: raw 59 → ~30, raw 62 → ~55, raw 65 → ~80
  let scaled = 22 + (raw - 58) * 8.5;

  // --- Novelty bonus for rare high-performing combos ---
  scaled += computeNoveltyBonus(stats);

  // --- Tension sanity penalty ---
  // If tension is absurdly outside the playable range, the setup is garbage.
  // Penalty scales with how far outside the range the tension is.
  if (tensionContext) {
    const { avgTension, tensionRange } = tensionContext;
    const low = tensionRange[0];
    const high = tensionRange[1];
    const margin = 8; // lbs of grace outside range before penalty kicks in
    
    if (avgTension < low - margin) {
      // Way too loose — unplayable
      const deficit = (low - margin) - avgTension;
      // Exponential penalty: 10 lbs under = -30, 20 under = -60, 30+ = floor
      const penalty = Math.min(deficit * 3, 90);
      scaled -= penalty;
    } else if (avgTension < low) {
      // Slightly below range — mild penalty
      const deficit = low - avgTension;
      scaled -= deficit * 1.5;
    }
    
    if (avgTension > high + margin) {
      // Way too tight — harsh, boardy, arm-destroying
      const excess = avgTension - (high + margin);
      const penalty = Math.min(excess * 2.5, 80);
      scaled -= penalty;
    } else if (avgTension > high) {
      // Slightly above range — mild penalty
      const excess = avgTension - high;
      scaled -= excess * 1.2;
    }

    // --- Mains/Crosses differential penalty (pattern-aware) ---
    if (tensionContext.differential !== undefined) {
      const diff = tensionContext.differential;
      const absDiff = Math.abs(diff);
      const patCrosses = tensionContext.patternCrosses || 19;
      const isDense20 = patCrosses >= 20;
      
      // Threshold where penalty starts depends on pattern
      // Dense 20-cross: higher tolerance for reversed differential
      const fwdThreshold = isDense20 ? 4 : 6;    // mains-tighter threshold
      const revThreshold = isDense20 ? 4 : 4;     // crosses-tighter threshold
      const extremeThreshold = 10;

      if (absDiff > extremeThreshold) {
        // Extreme mismatch in any direction: unplayable, frame damage risk
        scaled -= 12 + (absDiff - extremeThreshold) * 5;
      } else if (diff > fwdThreshold) {
        // Mains too much tighter than crosses
        const excess = diff - fwdThreshold;
        scaled -= excess * (isDense20 ? 4 : 3); // harsher on dense (kills snapback)
      }

      // Reversed differential (crosses tighter) — pattern-dependent
      if (diff < -revThreshold && !isDense20) {
        // On open/standard: crosses tighter is bad
        scaled -= (absDiff - revThreshold) * 3;
      } else if (diff < -(revThreshold + 2) && isDense20) {
        // Even on dense beds, extreme reverse is bad
        scaled -= (absDiff - revThreshold - 2) * 2.5;
      }
    }
  }

  return Math.max(0, Math.min(100, scaled));
}

function getRatingDescriptor(score, identity) {
  const archLower = identity.archetype.toLowerCase();
  if (score >= 85) return `Elite ${archLower} configuration`;
  if (score >= 75) return `Strong ${archLower} configuration`;
  if (score >= 65) return `Solid ${archLower} configuration`;
  if (score >= 55) return `Moderate ${archLower} configuration`;
  return `Developing ${archLower} configuration`;
}


function renderOCFoundation(racquet, stringConfig, stats) {
  const el = $('#oc-foundation');
  const sep = '<span class="oc-sep">/</span>';

  // Get string data
  let strStiff, strTensionLoss, strSpinPot;
  if (stringConfig.isHybrid) {
    // Average mains/crosses for hybrid
    const m = stringConfig.mains, x = stringConfig.crosses;
    strStiff = Math.round((m.stiffness + x.stiffness) / 2);
    strTensionLoss = ((m.tensionLoss + x.tensionLoss) / 2).toFixed(0);
    strSpinPot = ((m.spinPotential + x.spinPotential) / 2).toFixed(1);
  } else {
    const s = stringConfig.string;
    strStiff = Math.round(s.stiffness);
    strTensionLoss = s.tensionLoss.toFixed(0);
    strSpinPot = s.spinPotential.toFixed(1);
  }

  el.innerHTML = `
    <div class="oc-foundation-group">
      <span class="oc-foundation-group-title">[FRAME]</span>
      <span class="oc-foundation-group-values">WGHT ${racquet.strungWeight}g strung ${sep} SW ${racquet.swingweight} ${sep} RA ${racquet.stiffness} ${sep} PAT ${racquet.pattern}</span>
    </div>
    <div class="oc-foundation-group">
      <span class="oc-foundation-group-title">[STRNG]</span>
      <span class="oc-foundation-group-values">STIF ${strStiff} ${sep} LOSS ${strTensionLoss}% ${sep} SPIN ${strSpinPot}</span>
    </div>
    <div class="oc-foundation-group">
      <span class="oc-foundation-group-title">[MODEL]</span>
      <span class="oc-foundation-group-values">POWR ${stats.power} ${sep} CTRL ${stats.control} ${sep} COMF ${stats.comfort}</span>
    </div>
  `;
}

function renderOCSnapshot(fitProfile) {
  const el = $('#oc-snapshot');
  // Take first 2 items from bestFor and first from watchOut
  const bestForText = fitProfile.bestFor.slice(0, 2).join(', ');
  const watchOutText = fitProfile.watchOut[0] || 'No major concerns';
  // Extract sweet spot from tensionRec
  const sweetSpotMatch = fitProfile.tensionRec.match(/sweet spot: ([^)]+)/);
  const sweetSpot = sweetSpotMatch ? sweetSpotMatch[1] : fitProfile.tensionRec;

  el.innerHTML = `
    <div class="oc-snapshot-section">
      <div class="oc-snapshot-label best-for">Best For</div>
      <div class="oc-snapshot-value">${bestForText}</div>
    </div>
    <div class="oc-snapshot-section">
      <div class="oc-snapshot-label watch-out">Watch Out</div>
      <div class="oc-snapshot-value">${watchOutText}</div>
    </div>
    <div class="oc-snapshot-section">
      <div class="oc-snapshot-label sweet-spot">Sweet Spot</div>
      <div class="oc-snapshot-value">${sweetSpot}</div>
    </div>
  `;
}

// Stat bar grouping for Build DNA
function _statBarColor(val) {
  // Digicraft Brutalism — monochrome stat bars, no color coding
  return 'var(--dc-platinum)';
}

function renderStatBars(stats) {
  const container = $('#stat-bars');
  container.innerHTML = '';

  const keyToLabel = {};
  STAT_KEYS.forEach((k, i) => keyToLabel[k] = STAT_LABELS[i]);

  let barIdx = 0;
  STAT_GROUPS.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'stat-group';
    groupDiv.innerHTML = '<div class="stat-group-label">' + group.label + '</div>';

    group.keys.forEach(key => {
      const value = stats[key];
      const isHigh = value > 70;
      const segments = 20;
      const filledSegments = Math.round((value / 100) * segments);
      
      // Generate battery-style segments
      let segmentsHtml = '';
      for (let i = 0; i < segments; i++) {
        let segClass = 'empty';
        if (i < filledSegments) {
          segClass = isHigh ? 'high' : 'filled';
        }
        segmentsHtml += `<div class="stat-bar-segment ${segClass}" data-seg="${i}"></div>`;
      }
      
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `
        <div class="stat-row-header">
          <span class="stat-label">${keyToLabel[key]}</span>
          <span class="stat-value">${value}</span>
        </div>
        <div class="stat-bar-track" data-value="${value}">
          ${segmentsHtml}
        </div>
      `;
      groupDiv.appendChild(row);
      barIdx++;
    });

    container.appendChild(groupDiv);
  });

  // Animate segments
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.querySelectorAll('.stat-bar-track').forEach((track, idx) => {
        const value = parseFloat(track.dataset.value);
        const segments = track.querySelectorAll('.stat-bar-segment');
        const filledCount = Math.round((value / 100) * segments.length);
        
        segments.forEach((seg, i) => {
          setTimeout(() => {
            if (i < filledCount) {
              seg.classList.add('active');
            }
          }, idx * 40 + i * 15);
        });
      });
    });
  });

  // Highlights: top 3 + bottom 2
  renderBuildDNAHighlights(stats);
}

function renderBuildDNAHighlights(stats) {
  const el = document.getElementById('build-dna-highlights');
  if (!el) return;

  const entries = STAT_KEYS.map((k, i) => ({ key: k, label: STAT_LABELS[i], val: stats[k] }));
  const sorted = [...entries].sort((a, b) => b.val - a.val);
  const top3 = sorted.slice(0, 3);
  const bot2 = sorted.slice(-2).reverse();

  // Hardware log format: [+] for strong, [-] for gaps
  const topLogs = top3.map(s =>
    '<span class="dna-log-strong">[+] ' + s.label.toUpperCase() + ' ' + s.val + '</span>'
  ).join('');
  const botLogs = bot2.map(s =>
    '<span class="dna-log-gap">[-] ' + s.label.toUpperCase() + ' ' + s.val + '</span>'
  ).join('');

  el.innerHTML = `
    <div class="dna-highlights-row">
      <span class="dna-highlights-label">STRONG</span>${topLogs}
      <span class="dna-highlights-label">GAP</span>${botLogs}
    </div>
  `;
}

// ---- Ballistic HUD Tooltip Handler ----
function radarTooltipHandler(context) {
  // Tooltip element creation
  let tooltipEl = document.getElementById('chartjs-tooltip');
  
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-tooltip';
    tooltipEl.className = 'chartjs-tooltip';
    document.body.appendChild(tooltipEl);
  }
  
  const tooltip = context.tooltip;
  
  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }
  
  // Get data
  const dataPoint = tooltip.dataPoints?.[0];
  if (!dataPoint) return;
  
  const label = dataPoint.label;
  const value = dataPoint.raw;
  
  // Build tooltip content
  tooltipEl.innerHTML = `
    <div class="tooltip-label">// ${label}</div>
    <div class="tooltip-value">
      <div class="tooltip-marker"></div>
      <span>${value}</span>
    </div>
  `;
  
  // Position
  const position = context.chart.canvas.getBoundingClientRect();
  tooltipEl.style.opacity = 1;
  tooltipEl.style.left = (position.left + window.scrollX + tooltip.caretX + 15) + 'px';
  tooltipEl.style.top = (position.top + window.scrollY + tooltip.caretY - 10) + 'px';
}

function renderRadarChart(stats) {
  const ctx = document.getElementById('radar-chart').getContext('2d');

  const data = STAT_KEYS.map(k => stats[k]);

  const isDark = document.documentElement.dataset.theme === 'dark';
  // Digicraft Brutalism — Artful Red accent
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const angleColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const labelColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.44)';
  const accentColor = '#AF0000'; // Artful Red
  const fillColor = 'rgba(175, 0, 0, 0.06)'; // Barely visible tinted fill

  if (currentRadarChart) {
    currentRadarChart.data.datasets[0].data = data;
    currentRadarChart.data.datasets[0].borderColor = accentColor;
    currentRadarChart.data.datasets[0].backgroundColor = fillColor;
    currentRadarChart.data.datasets[0].pointBackgroundColor = accentColor;
    currentRadarChart.data.datasets[0].pointBorderColor = 'transparent';
    currentRadarChart.options.scales.r.grid.color = gridColor;
    currentRadarChart.options.scales.r.angleLines.color = angleColor;
    currentRadarChart.options.scales.r.pointLabels.color = labelColor;
    currentRadarChart.update('active');
    return;
  }

  currentRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: STAT_LABELS_FULL,
      datasets: [{
        data,
        backgroundColor: fillColor,
        borderColor: accentColor,
        borderWidth: 2,
        pointBackgroundColor: accentColor,
        pointBorderColor: 'transparent',
        pointRadius: 3,
        pointHoverRadius: 6,
        hitRadius: 30
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: {
        padding: 0
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: radarTooltipHandler
        }
      },
      elements: {
        point: {
          hitRadius: 30,
          hoverRadius: 6
        }
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            display: false,
            stepSize: 20
          },
          grid: {
            color: gridColor,
            circular: true,
            lineWidth: 1
          },
          angleLines: {
            color: angleColor,
            lineWidth: 1
          },
          pointLabels: {
            display: false
          }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      }
    }
  });
}

function renderFitProfile(fitProfile) {
  const grid = $('#fit-grid');
  const bestFor = fitProfile.bestFor.join(', ');
  const watchOut = fitProfile.watchOut.length > 0 && fitProfile.watchOut[0].toLowerCase().indexOf('no major') === -1
    ? fitProfile.watchOut.join(', ')
    : '';
  const tension = fitProfile.tensionRec || '';

  let parts = [];
  if (bestFor) parts.push('<span class="dna-fit-label dna-fit-best">Best for:</span> ' + bestFor);
  if (watchOut) parts.push('<span class="dna-fit-label dna-fit-warn">Watch:</span> ' + watchOut);
  if (tension) parts.push('<span class="dna-fit-label dna-fit-tension">Sweet spot:</span> ' + tension);

  grid.innerHTML = '<p class="dna-fit-line">' + parts.join(' <span class="dna-fit-sep">·</span> ') + '</p>';
}

function renderWarnings(warnings) {
  const card = $('#warnings-card');
  const list = $('#warnings-list');

  if (warnings.length === 0) {
    card.classList.add('hidden');
    return;
  }

  card.classList.remove('hidden');
  list.innerHTML = warnings.map(w => `
    <div class="warning-item">
      <svg class="warning-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="8" cy="12" r="0.8" fill="currentColor"/>
      </svg>
      <span>${w}</span>
    </div>
  `).join('');
}

// ============================================
// COMPARISON MODE
// ============================================

function toggleComparisonMode() {
  // Legacy compat — now routes through switchMode
  if (currentMode === 'compare') {
    switchMode('overview');
  } else {
    switchMode('compare');
  }
}

function addComparisonSlotFromHome() {
  if (comparisonSlots.length >= 3) return;
  const setup = getCurrentSetup();
  const slotData = {
    id: Date.now(),
    racquetId: '',
    stringId: '',
    isHybrid: false,
    mainsId: '',
    crossesId: '',
    mainsTension: 55,
    crossesTension: 53,
    stats: null,
    identity: null
  };

  if (setup) {
    slotData.racquetId = setup.racquet.id;
    if (setup.stringConfig.isHybrid) {
      slotData.isHybrid = true;
      slotData.mainsId = setup.stringConfig.mains.id;
      slotData.crossesId = setup.stringConfig.crosses.id;
      slotData.mainsTension = setup.stringConfig.mainsTension;
      slotData.crossesTension = setup.stringConfig.crossesTension;
    } else {
      slotData.isHybrid = false;
      slotData.stringId = setup.stringConfig.string.id;
      slotData.mainsTension = setup.stringConfig.mainsTension;
      slotData.crossesTension = setup.stringConfig.crossesTension;
    }
  }

  comparisonSlots.push(slotData);
  // Render first, then recalc (DOM must exist before deltas render)
  renderComparisonSlots();
  if (slotData.racquetId && (slotData.stringId || slotData.mainsId)) {
    recalcSlot(comparisonSlots.length - 1);
  }
}

function addComparisonSlot() {
  if (comparisonSlots.length >= 3) return;

  const slotIndex = comparisonSlots.length;
  const slotColor = SLOT_COLORS[slotIndex];

  const slotData = {
    id: Date.now(),
    racquetId: '',
    stringId: '',
    isHybrid: false,
    mainsId: '',
    crossesId: '',
    mainsTension: 55,
    crossesTension: 53,
    stats: null,
    identity: null
  };

  comparisonSlots.push(slotData);
  renderComparisonSlots();
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  try { updateComparisonRadar(); } catch(e) {}
  // Unconfigured cards auto-open in edit mode — no toggle needed
  // Just scroll to the new card
  var newCard = document.querySelector('.compare-summary-card[data-slot-index="' + slotIndex + '"]');
  if (newCard) requestAnimationFrame(function() { newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
}

function removeComparisonSlot(index) {
  comparisonSlots.splice(index, 1);
  renderComparisonSlots();
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  try { updateComparisonRadar(); } catch(e) {}
  try { renderComparisonDeltas(); } catch(e) {}
  try { renderDockContextPanel(); } catch(e) {}
}

function renderComparisonSlots() {
  // Legacy: editors panel is hidden. Only update add button visibility.
  const addBtn = $('#btn-add-slot');
  if (addBtn) addBtn.style.display = comparisonSlots.length >= 3 ? 'none' : '';
}

function recalcSlot(index) {
  const slot = comparisonSlots[index];
  const racquet = RACQUETS.find(r => r.id === slot.racquetId);

  let stringConfig = null;

  if (slot.isHybrid) {
    const mainsData = STRINGS.find(s => s.id === slot.mainsId);
    const crossesData = STRINGS.find(s => s.id === slot.crossesId);
    if (racquet && mainsData && crossesData) {
      stringConfig = {
        isHybrid: true,
        mains: mainsData,
        crosses: crossesData,
        mainsTension: slot.mainsTension,
        crossesTension: slot.crossesTension
      };
    }
  } else {
    const stringData = STRINGS.find(s => s.id === slot.stringId);
    if (racquet && stringData) {
      stringConfig = {
        isHybrid: false,
        string: stringData,
        mainsTension: slot.mainsTension,
        crossesTension: slot.crossesTension
      };
    }
  }

  if (racquet && stringConfig) {
    slot.stats = predictSetup(racquet, stringConfig);
    slot.identity = generateIdentity(slot.stats, racquet, stringConfig);
  } else {
    slot.stats = null;
    slot.identity = null;
  }

  // Partial update: update card OBS/archetype/meta in-place if card exists
  var card = document.querySelector('.compare-summary-card[data-slot-index="' + index + '"]');
  if (card && slot.stats) {
    var scoreRq = RACQUETS.find(r => r.id === slot.racquetId);
    var scoreCtx = scoreRq ? { avgTension: (slot.mainsTension + slot.crossesTension) / 2, tensionRange: scoreRq.tensionRange } : null;
    var newObs = computeCompositeScore(slot.stats, scoreCtx).toFixed(1);
    var archEl = card.querySelector('.compare-summary-archetype');
    var obsEl = card.querySelector('.compare-summary-score-value');
    var metaEl = card.querySelector('.compare-summary-meta-compact');
    if (archEl) archEl.textContent = slot.identity?.archetype || 'Balanced Setup';
    if (obsEl) { obsEl.textContent = newObs; obsEl.style.color = getObsScoreColor(parseFloat(newObs)); }
    if (metaEl) {
      var mp = [];
      if (scoreRq) mp.push(scoreRq.name);
      if (slot.isHybrid) {
        var m2 = STRINGS.find(s => s.id === slot.mainsId);
        var x2 = STRINGS.find(s => s.id === slot.crossesId);
        if (m2 && x2) mp.push(m2.name + ' / ' + x2.name);
      } else {
        var str2 = STRINGS.find(s => s.id === slot.stringId);
        if (str2) mp.push(str2.name);
      }
      mp.push('M:' + slot.mainsTension + ' / X:' + slot.crossesTension);
      metaEl.textContent = mp.join(' · ');
    }
  } else {
    // Full re-render needed (e.g. slot became configured or lost stats)
    renderCompareSummaries();
  }

  renderComparisonSlots();
  renderCompareVerdict();
  renderCompareMatrix();
  try { updateComparisonRadar(); } catch(e) {}
  try { renderComparisonDeltas(); } catch(e) {}
  try { renderDockContextPanel(); } catch(e) {}
}

function updateComparisonRadar() {
  const ctx = document.getElementById('comparison-radar-chart').getContext('2d');
  const datasets = [];
  const colors = getSlotColors();

  const pointStyles = ['circle', 'rectRot', 'triangle'];

  comparisonSlots.forEach((slot, i) => {
    if (!slot.stats) return;
    const color = colors[i];
    datasets.push({
      label: `Setup ${color.label}`,
      data: STAT_KEYS.map(k => slot.stats[k]),
      backgroundColor: color.bgFaint,
      borderColor: color.border,
      borderWidth: 1.8,
      borderDash: color.borderDash,
      pointBackgroundColor: color.border,
      pointBorderColor: 'transparent',
      pointStyle: pointStyles[i] || 'circle',
      pointRadius: 3,
      pointHoverRadius: 5
    });
  });

  const isDark = document.documentElement.dataset.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const angleColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const labelColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.36)';
  const legendColor = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.48)';

  if (comparisonRadarChart) {
    comparisonRadarChart.data.datasets = datasets;
    comparisonRadarChart.options.scales.r.grid.color = gridColor;
    comparisonRadarChart.options.scales.r.angleLines.color = angleColor;
    comparisonRadarChart.options.scales.r.pointLabels.color = labelColor;
    comparisonRadarChart.options.plugins.legend.labels.color = legendColor;
    comparisonRadarChart.update('active');
    return;
  }

  comparisonRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: STAT_LABELS_FULL,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            font: { family: "'Inter', sans-serif", size: 11, weight: 500 },
            color: legendColor,
            usePointStyle: true,
            padding: 16
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 25, display: false },
          grid: { color: gridColor, circular: false, lineWidth: 0.5 },
          angleLines: { color: angleColor, lineWidth: 0.5 },
          pointLabels: {
            font: { family: "'Inter', sans-serif", size: 10, weight: 500 },
            color: labelColor
          }
        }
      },
      animation: { duration: 600, easing: 'easeOutQuart' }
    }
  });
}

function renderComparisonDeltas() {
  const container = $('#comparison-deltas');
  if (!container) return;
  const validSlots = comparisonSlots.filter(s => s.stats);
  if (validSlots.length < 2) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  for (let i = 1; i < validSlots.length; i++) {
    const base = validSlots[0];
    const comp = validSlots[i];
    const baseColor = SLOT_COLORS[comparisonSlots.indexOf(base)];
    const compColor = SLOT_COLORS[comparisonSlots.indexOf(comp)];

    html += `<div class="delta-group">
      <div class="delta-title">Setup ${compColor.label} vs Setup ${baseColor.label}</div>
      ${STAT_KEYS.map((key, j) => {
        const diff = comp.stats[key] - base.stats[key];
        const cls = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
        const sign = diff > 0 ? '+' : '';
        return `<div class="delta-item">
          <span class="delta-label">${STAT_LABELS[j]}</span>
          <span class="delta-value ${cls}">${sign}${diff}</span>
        </div>`;
      }).join('')}
    </div>`;
  }

  container.innerHTML = html;
}

// ============================================
// COMPARE REDESIGN — Summary Cards, Verdict, Matrix
// ============================================

function renderCompareSummaries() {
  const container = $('#compare-summaries');
  const emptyState = $('#compare-empty-state');
  const validSlots = comparisonSlots.filter(s => s.stats);

  if (comparisonSlots.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = '';
    $('#compare-verdict').style.display = 'none';
    $('#compare-matrix').style.display = 'none';
    $('#compare-proof').style.display = 'none';
    const rd = document.getElementById('compare-details-radar');
    if (rd) rd.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';

  if (validSlots.length < 2) {
    $('#compare-verdict').style.display = 'none';
    $('#compare-matrix').style.display = 'none';
    $('#compare-proof').style.display = 'none';
    const rd = document.getElementById('compare-details-radar');
    if (rd) rd.style.display = 'none';
  }

  // Track which slots are currently editing (preserve across re-render)
  var prevEditing = {};
  container.querySelectorAll('.compare-summary-card.compare-card-editing').forEach(function(el) {
    var idx = el.dataset.slotIndex;
    if (idx != null) prevEditing[idx] = true;
  });

  container.innerHTML = '';

  comparisonSlots.forEach((slot, index) => {
    const color = SLOT_COLORS[index];

    // Unconfigured placeholder
    if (!slot.stats) {
      const div = document.createElement('div');
      div.className = `compare-summary-card compare-card-editing slot-color-${color.cssClass}`;
      div.dataset.slotIndex = index;
      div.style.opacity = '0.85';
      const quickLoadHTML = _compareBuildLoadFromSavedDropdown(index);
      div.innerHTML = `
        <div class="compare-summary-top">
          <div class="compare-summary-identity">
            <span class="compare-summary-label slot-label-${color.cssClass}">Setup ${color.label}</span>
            <div class="compare-summary-archetype" style="font-size:0.82rem;opacity:0.5;">Not configured</div>
          </div>
          <button class="compare-card-remove" onclick="removeComparisonSlot(${index})" title="Remove">✕</button>
        </div>
        <div class="compare-card-editor" data-slot="${index}">
          ${quickLoadHTML}
          <div class="compare-ed-row">
            <div class="compare-ed-ss-racquet" data-slot="${index}" data-value="${slot.racquetId || ''}"></div>
          </div>
          <div class="compare-ed-toggle">
            <button class="compare-ed-toggle-btn ${slot.isHybrid ? '' : 'active'}" data-slot="${index}" data-mode="full">Full Bed</button>
            <button class="compare-ed-toggle-btn ${slot.isHybrid ? 'active' : ''}" data-slot="${index}" data-mode="hybrid">Hybrid</button>
          </div>
          ${_compareEditorStringHTML(slot, index)}
        </div>
      `;
      container.appendChild(div);
      _compareInitEditorSS(div, index, slot);
      return;
    }

    const racquet = RACQUETS.find(r => r.id === slot.racquetId);
    const slotTensionCtx = racquet ? { avgTension: (slot.mainsTension + slot.crossesTension) / 2, tensionRange: racquet.tensionRange } : null;
    const obsScore = computeCompositeScore(slot.stats, slotTensionCtx).toFixed(1);
    const pct = Math.min(100, Math.max(0, obsScore));
    const circumference = 2 * Math.PI * 22;
    const dashOffset = circumference * (1 - pct / 100);
    const archetype = slot.identity?.archetype || 'Balanced Setup';
    const isEditing = prevEditing[index];

    // Compact meta
    let metaParts = [];
    if (racquet) metaParts.push(racquet.name);
    if (slot.isHybrid) {
      const m = STRINGS.find(s => s.id === slot.mainsId);
      const x = STRINGS.find(s => s.id === slot.crossesId);
      if (m && x) metaParts.push(m.name + ' / ' + x.name);
    } else {
      const str = STRINGS.find(s => s.id === slot.stringId);
      if (str) metaParts.push(str.name);
    }
    metaParts.push('M:' + slot.mainsTension + ' / X:' + slot.crossesTension);

    const div = document.createElement('div');
    div.className = `compare-summary-card slot-color-${color.cssClass}${isEditing ? ' compare-card-editing' : ''}`;
    div.dataset.slotIndex = index;

    // Build "Load from My Loadouts" dropdown HTML
    const loadFromSavedHTML = _compareBuildLoadFromSavedDropdown(index);

    div.innerHTML = `
      <div class="compare-summary-top">
        <div class="compare-summary-identity">
          <span class="compare-summary-label slot-label-${color.cssClass}">Setup ${color.label}</span>
          <div class="compare-summary-archetype">${archetype}</div>
        </div>
        <div class="compare-summary-score">
          <div class="compare-summary-score-ring compare-ring-sm">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" stroke="var(--border-subtle)" stroke-width="2.5" fill="none" />
              <circle cx="24" cy="24" r="22" stroke="${color.border}" stroke-width="2.5" fill="none"
                stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
                stroke-linecap="round" transform="rotate(-90 24 24)" />
            </svg>
            <span class="compare-summary-score-value" style="color:${getObsScoreColor(parseFloat(obsScore))}">${obsScore}</span>
          </div>
        </div>
      </div>
      <div class="compare-summary-meta-compact">${metaParts.join(' · ')}</div>
      ${_isCompareSlotStale(slot) ? '<div class="compare-slot-stale"><span class="compare-stale-text">\u21BB Source loadout changed</span><button class="compare-stale-btn" onclick="_refreshCompareSlot(' + index + ')">Refresh</button></div>' : ''}
      <div class="compare-card-actions">
        <button class="compare-action-btn compare-action-edit" onclick="_toggleCompareCardEditor(${index})">
          <svg viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Edit
        </button>
        <button class="compare-action-btn" onclick="openTuneForSlot(${index})">
          <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>
          Tune
        </button>
        <button class="compare-action-btn compare-action-remove" onclick="removeComparisonSlot(${index})">✕</button>
      </div>
      <div class="compare-card-editor" data-slot="${index}">
        ${loadFromSavedHTML}
        <div class="compare-ed-row">
          <div class="compare-ed-ss-racquet" data-slot="${index}" data-value="${slot.racquetId || ''}"></div>
        </div>
        <div class="compare-ed-toggle">
          <button class="compare-ed-toggle-btn ${slot.isHybrid ? '' : 'active'}" data-slot="${index}" data-mode="full">Full Bed</button>
          <button class="compare-ed-toggle-btn ${slot.isHybrid ? 'active' : ''}" data-slot="${index}" data-mode="hybrid">Hybrid</button>
        </div>
        ${_compareEditorStringHTML(slot, index)}
        <button class="compare-ed-done" onclick="_toggleCompareCardEditor(${index})">Done</button>
      </div>
    `;

    container.appendChild(div);
    if (isEditing) _compareInitEditorSS(div, index, slot);
  });
}

// Fix 2: Build "Load from My Loadouts" dropdown for compare slot editor
function _compareBuildLoadFromSavedDropdown(slotIndex) {
  if (!savedLoadouts || savedLoadouts.length === 0) return '';

  const options = savedLoadouts.map(function(lo) {
    const racquet = RACQUETS.find(function(r) { return r.id === lo.frameId; });
    const frameName = racquet ? racquet.name.split(' ').slice(0, 2).join(' ') : 'Unknown';
    const label = (lo.name || 'Loadout').length > 30 ? (lo.name || 'Loadout').substring(0, 30) + '...' : (lo.name || 'Loadout');
    return '<option value="' + lo.id + '">' + label + ' (' + frameName + ')</option>';
  }).join('');

  return '<div class="compare-ed-quickload">' +
    '<label class="compare-ed-label">Quick Load</label>' +
    '<select class="compare-ed-quickload-select" onchange="_compareLoadFromSaved(' + slotIndex + ', this.value)">' +
      '<option value="">Load from My Loadouts...</option>' +
      options +
    '</select>' +
  '</div>';
}

// Fix 2: Load a saved loadout into a compare slot
function _compareLoadFromSaved(slotIndex, loadoutId) {
  if (!loadoutId) return;

  const lo = savedLoadouts.find(function(l) { return l.id === loadoutId; });
  if (!lo || !comparisonSlots[slotIndex]) return;

  const slot = comparisonSlots[slotIndex];
  slot.racquetId = lo.frameId;
  slot.isHybrid = lo.isHybrid || false;
  slot.mainsTension = lo.mainsTension;
  slot.crossesTension = lo.crossesTension;

  if (lo.isHybrid) {
    slot.mainsId = lo.mainsId || '';
    slot.crossesId = lo.crossesId || '';
    slot.stringId = '';
  } else {
    slot.stringId = lo.stringId || '';
    slot.mainsId = '';
    slot.crossesId = '';
  }

  // Recalculate and re-render
  recalcSlot(slotIndex);
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  try { updateComparisonRadar(); } catch(e) {}
}

function _compareEditorStringHTML(slot, index) {
  if (slot.isHybrid) {
    return `
      <div class="compare-ed-hybrid">
        <div class="compare-ed-hybrid-half">
          <label class="compare-ed-label">Mains</label>
          <div class="compare-ed-ss-mains" data-slot="${index}" data-value="${slot.mainsId || ''}"></div>
          <input type="number" class="text-input compare-ed-tension" data-slot="${index}" data-target="mainsTension" value="${slot.mainsTension}" min="30" max="70">
        </div>
        <div class="compare-ed-hybrid-half">
          <label class="compare-ed-label">Crosses</label>
          <div class="compare-ed-ss-crosses" data-slot="${index}" data-value="${slot.crossesId || ''}"></div>
          <input type="number" class="text-input compare-ed-tension" data-slot="${index}" data-target="crossesTension" value="${slot.crossesTension}" min="30" max="70">
        </div>
      </div>`;
  }
  return `
    <div class="compare-ed-fullbed">
      <div class="compare-ed-ss-string" data-slot="${index}" data-value="${slot.stringId || ''}"></div>
      <div class="compare-ed-tension-row">
        <div><label class="compare-ed-label">Mains</label><input type="number" class="text-input compare-ed-tension" data-slot="${index}" data-target="mainsTension" value="${slot.mainsTension}" min="30" max="70"></div>
        <div><label class="compare-ed-label">Crosses</label><input type="number" class="text-input compare-ed-tension" data-slot="${index}" data-target="crossesTension" value="${slot.crossesTension}" min="30" max="70"></div>
      </div>
    </div>`;
}

function _toggleCompareCardEditor(index) {
  var card = document.querySelector('.compare-summary-card[data-slot-index="' + index + '"]');
  if (!card) return;
  var wasEditing = card.classList.contains('compare-card-editing');
  card.classList.toggle('compare-card-editing');
  if (!wasEditing) {
    // Becoming editing — init searchable selects
    _compareInitEditorSS(card, index, comparisonSlots[index]);
  }
}

function _compareInitEditorSS(card, index, slot) {
  // Racquet
  var rEl = card.querySelector('.compare-ed-ss-racquet');
  if (rEl && !rEl._ssInit) {
    createSearchableSelect(rEl, {
      type: 'racquet',
      placeholder: 'Select Racquet...',
      value: rEl.dataset.value || '',
      onChange: function(val) { comparisonSlots[index].racquetId = val; recalcSlot(index); }
    });
    rEl._ssInit = true;
  }

  // Full bed string
  var sEl = card.querySelector('.compare-ed-ss-string');
  if (sEl && !sEl._ssInit) {
    createSearchableSelect(sEl, {
      type: 'string',
      placeholder: 'Select String...',
      value: sEl.dataset.value || '',
      onChange: function(val) { comparisonSlots[index].stringId = val; recalcSlot(index); }
    });
    sEl._ssInit = true;
  }

  // Hybrid mains
  var mEl = card.querySelector('.compare-ed-ss-mains');
  if (mEl && !mEl._ssInit) {
    createSearchableSelect(mEl, {
      type: 'string',
      placeholder: 'Mains...',
      value: mEl.dataset.value || '',
      onChange: function(val) { comparisonSlots[index].mainsId = val; recalcSlot(index); }
    });
    mEl._ssInit = true;
  }

  // Hybrid crosses
  var xEl = card.querySelector('.compare-ed-ss-crosses');
  if (xEl && !xEl._ssInit) {
    createSearchableSelect(xEl, {
      type: 'string',
      placeholder: 'Crosses...',
      value: xEl.dataset.value || '',
      onChange: function(val) { comparisonSlots[index].crossesId = val; recalcSlot(index); }
    });
    xEl._ssInit = true;
  }

  // Tension inputs
  card.querySelectorAll('.compare-ed-tension').forEach(function(inp) {
    if (inp._evtInit) return;
    inp.addEventListener('input', function(e) {
      var idx = parseInt(e.target.dataset.slot);
      var target = e.target.dataset.target;
      comparisonSlots[idx][target] = parseInt(e.target.value) || 55;
      recalcSlot(idx);
    });
    inp._evtInit = true;
  });

  // Toggle buttons
  card.querySelectorAll('.compare-ed-toggle-btn').forEach(function(btn) {
    if (btn._evtInit) return;
    btn.addEventListener('click', function(e) {
      var idx = parseInt(e.target.dataset.slot);
      var mode = e.target.dataset.mode;
      comparisonSlots[idx].isHybrid = (mode === 'hybrid');
      recalcSlot(idx);
    });
    btn._evtInit = true;
  });
}

// Legacy stubs (editors panel replaced by inline card editors)
function openCompareEditor(idx) { _toggleCompareCardEditor(idx); }
function closeCompareEditors() {}

function generateCompareVerdict(slotA, slotB) {
  const a = slotA.stats;
  const b = slotB.stats;
  const idA = slotA.identity?.archetype || 'Balanced Setup';
  const idB = slotB.identity?.archetype || 'Balanced Setup';
  const colorA = SLOT_COLORS[comparisonSlots.indexOf(slotA)];
  const colorB = SLOT_COLORS[comparisonSlots.indexOf(slotB)];

  // Compute category wins
  const categories = [
    { label: 'Spin', key: 'spin' },
    { label: 'Power', key: 'power' },
    { label: 'Control', key: 'control' },
    { label: 'Comfort', key: 'comfort' },
    { label: 'Feel', key: 'feel' },
    { label: 'Launch', key: 'launch' },
    { label: 'Stability', key: 'stability' },
    { label: 'Forgiveness', key: 'forgiveness' },
    { label: 'Durability', key: 'durability' },
    { label: 'Playability', key: 'playability' }
  ];

  const winsA = [];
  const winsB = [];
  let biggestDiffKey = '';
  let biggestDiff = 0;

  categories.forEach(cat => {
    const diff = a[cat.key] - b[cat.key];
    if (diff > 2) winsA.push(cat.label);
    else if (diff < -2) winsB.push(cat.label);
    if (Math.abs(diff) > biggestDiff) {
      biggestDiff = Math.abs(diff);
      biggestDiffKey = cat.label;
    }
  });

  // Build the main tradeoff sentence
  const scoreA = computeCompositeScore(a).toFixed(1);
  const scoreB = computeCompositeScore(b).toFixed(1);
  const scoreDiff = Math.abs(scoreA - scoreB).toFixed(1);

  let tradeoff = '';
  if (winsA.length > 0 && winsB.length > 0) {
    tradeoff = `Setup ${colorA.label} trades ${winsB.slice(0, 2).join(' and ').toLowerCase()} for stronger ${winsA.slice(0, 2).join(' and ').toLowerCase()}. The biggest gap is in ${biggestDiffKey} (${biggestDiff} pts).`;
  } else if (winsA.length > 0) {
    tradeoff = `Setup ${colorA.label} leads across most categories, especially in ${biggestDiffKey} (+${biggestDiff}). Setup ${colorB.label} doesn't strongly outperform in any area.`;
  } else if (winsB.length > 0) {
    tradeoff = `Setup ${colorB.label} leads across most categories, especially in ${biggestDiffKey} (+${biggestDiff}). Setup ${colorA.label} doesn't strongly outperform in any area.`;
  } else {
    tradeoff = `Both setups perform similarly across all categories. The biggest difference is in ${biggestDiffKey} (${biggestDiff} pts) — a marginal gap.`;
  }

  // Pick A if / Pick B if
  function buildPickReason(stats, identity) {
    const traits = [];
    if (stats.spin >= 70) traits.push('rely on heavy topspin');
    if (stats.power >= 65) traits.push('want to dictate with pace');
    if (stats.control >= 72) traits.push('value placement and accuracy');
    if (stats.comfort >= 70) traits.push('have arm sensitivity');
    if (stats.feel >= 72) traits.push('play a lot at the net');
    if (stats.durability >= 78) traits.push('break strings frequently');
    if (stats.stability >= 68) traits.push('need stability on off-center hits');
    if (traits.length === 0) traits.push('want a versatile all-court setup');
    return traits.slice(0, 3);
  }

  const pickA = buildPickReason(a, slotA.identity);
  const pickB = buildPickReason(b, slotB.identity);

  return { tradeoff, winsA, winsB, pickA, pickB, colorA, colorB, idA, idB };
}

function renderCompareVerdict() {
  const container = $('#compare-verdict');
  const validSlots = comparisonSlots.filter(s => s.stats);

  if (validSlots.length < 2) {
    container.style.display = 'none';
    return;
  }

  container.style.display = '';

  const categories = [
    { label: 'Spin', key: 'spin' }, { label: 'Power', key: 'power' },
    { label: 'Control', key: 'control' }, { label: 'Comfort', key: 'comfort' },
    { label: 'Feel', key: 'feel' }, { label: 'Launch', key: 'launch' },
    { label: 'Stability', key: 'stability' }, { label: 'Forgiveness', key: 'forgiveness' },
    { label: 'Durability', key: 'durability' }, { label: 'Playability', key: 'playability' }
  ];

  // Per-slot: compute OBS, wins (categories where this slot is highest by >2pts)
  const slotData = validSlots.map(function(slot) {
    const idx = comparisonSlots.indexOf(slot);
    const color = SLOT_COLORS[idx];
    const racquet = RACQUETS.find(r => r.id === slot.racquetId);
    const ctx = racquet ? { avgTension: (slot.mainsTension + slot.crossesTension) / 2, tensionRange: racquet.tensionRange } : null;
    const obs = computeCompositeScore(slot.stats, ctx);
    return { slot, idx, color, obs, wins: [], stats: slot.stats };
  });

  // Determine per-category winner (must lead all others by >2)
  categories.forEach(function(cat) {
    var vals = slotData.map(function(d) { return d.stats[cat.key]; });
    var maxVal = Math.max.apply(null, vals);
    var maxIdx = vals.indexOf(maxVal);
    var othersMax = Math.max.apply(null, vals.filter(function(v, i) { return i !== maxIdx; }));
    if (maxVal - othersMax > 2) {
      slotData[maxIdx].wins.push(cat.label);
    }
  });

  // Best OBS
  var bestObs = slotData.reduce(function(best, d) { return d.obs > best.obs ? d : best; }, slotData[0]);

  // Build tradeoff sentence
  var tradeoff = '';
  var slotsWithWins = slotData.filter(function(d) { return d.wins.length > 0; });
  if (slotsWithWins.length === 0) {
    tradeoff = 'All setups perform similarly across categories — differences are marginal.';
  } else {
    var parts = slotsWithWins.map(function(d) {
      return 'Setup ' + d.color.label + ' leads in ' + d.wins.slice(0, 3).join(', ').toLowerCase();
    });
    tradeoff = parts.join('. ') + '.';
    if (bestObs.obs > 0) tradeoff += ' Best OBS: Setup ' + bestObs.color.label + ' (' + bestObs.obs.toFixed(1) + ').';
  }

  // Pick reasons
  function buildPickReason(stats) {
    var traits = [];
    if (stats.spin >= 70) traits.push('rely on heavy topspin');
    if (stats.power >= 65) traits.push('want to dictate with pace');
    if (stats.control >= 72) traits.push('value placement and accuracy');
    if (stats.comfort >= 70) traits.push('have arm sensitivity');
    if (stats.feel >= 72) traits.push('play a lot at the net');
    if (stats.durability >= 78) traits.push('break strings frequently');
    if (stats.stability >= 68) traits.push('need stability on off-center hits');
    if (traits.length === 0) traits.push('want a versatile all-court setup');
    return traits.slice(0, 2);
  }

  var colsHtml = slotData.map(function(d) {
    var wins = d.wins.length > 0 ? d.wins.map(function(w) { return '<span class="verdict-win-tag">' + w + '</span>'; }).join('') : '<span class="verdict-win-tag" style="opacity:0.4;">No clear wins</span>';
    var pick = buildPickReason(d.stats);
    return '<div class="verdict-col">' +
      '<span class="verdict-col-header slot-label-' + d.color.cssClass + '">Setup ' + d.color.label + '</span>' +
      '<div class="verdict-wins">' + wins + '</div>' +
      '<div class="verdict-pick"><strong>Pick ' + d.color.label + '</strong> if you ' + pick.join(', ') + '</div>' +
      '</div>';
  }).join('');

  container.innerHTML = `
    <div class="verdict-header"><h3>Verdict</h3></div>
    <div class="verdict-tradeoff">${tradeoff}</div>
    <div class="verdict-columns verdict-cols-${validSlots.length}">${colsHtml}</div>
  `;
}

function renderCompareMatrix() {
  const container = $('#compare-matrix');
  const proof = $('#compare-proof');
  const radarDetails = document.getElementById('compare-details-radar');
  const validSlots = comparisonSlots.filter(s => s.stats);

  if (validSlots.length < 2) {
    container.style.display = 'none';
    if (radarDetails) radarDetails.style.display = 'none';
    proof.style.display = 'none';
    return;
  }

  container.style.display = '';
  proof.style.display = '';
  if (radarDetails) radarDetails.style.display = '';

  const slotData = validSlots.map(function(slot) {
    var idx = comparisonSlots.indexOf(slot);
    return { stats: slot.stats, color: SLOT_COLORS[idx] };
  });

  const groups = [
    { title: 'Performance', keys: ['spin', 'power', 'control', 'launch'] },
    { title: 'Feel & comfort', keys: ['comfort', 'feel', 'stability', 'forgiveness'] },
    { title: 'Frame dynamics', keys: ['maneuverability'] },
    { title: 'Longevity', keys: ['durability', 'playability'] }
  ];

  const keyToLabel = {};
  STAT_KEYS.forEach((k, i) => keyToLabel[k] = STAT_LABELS[i]);

  // Column headers
  var headerDots = slotData.map(function(d) {
    return '<span style="color:' + d.color.border + ';">● ' + d.color.label + '</span>';
  }).join('');

  let html = `
    <div class="matrix-header">
      <h3>Stat-by-stat</h3>
      <div style="display:flex;gap:12px;font-size:0.68rem;font-weight:600;letter-spacing:0.06em;">
        ${headerDots}
      </div>
    </div>
  `;

  groups.forEach(group => {
    html += `<div class="matrix-group"><div class="matrix-group-title">${group.title}</div>`;

    group.keys.forEach(key => {
      var vals = slotData.map(function(d) { return d.stats[key]; });
      var maxVal = Math.max.apply(null, vals);

      // Value cells
      var valCells = slotData.map(function(d) {
        var isMax = d.stats[key] === maxVal && slotData.length > 1;
        return '<span class="matrix-val' + (isMax ? ' matrix-val-best' : '') + '" style="color:' + d.color.border + ';">' + d.stats[key] + '</span>';
      }).join('');

      // Bar overlay (stacked, semi-transparent)
      var barLayers = slotData.map(function(d, i) {
        return '<div class="matrix-bar-layer" style="width:' + d.stats[key] + '%;background:' + d.color.border + ';opacity:' + (0.5 - i * 0.12) + ';"></div>';
      }).join('');

      html += `
        <div class="matrix-row matrix-row-${slotData.length}col">
          <span class="matrix-stat-label">${keyToLabel[key] || key}</span>
          <div class="matrix-bar-cell">${barLayers}</div>
          ${valCells}
        </div>`;
    });

    html += `</div>`;
  });

  container.innerHTML = html;
}


// ============================================
// PRESETS (dynamic system — see renderHomePresets / renderComparisonPresets)
// ============================================

function setHybridMode(isHybrid) {
  var btnFull = document.getElementById('btn-full');
  var btnHybrid = document.getElementById('btn-hybrid');
  var fullConfig = document.getElementById('full-bed-config');
  var hybridConfig = document.getElementById('hybrid-config');

  if (btnFull) {
    btnFull.classList.toggle('active', !isHybrid);
    btnFull.classList.toggle('bg-dc-platinum', !isHybrid);
    btnFull.classList.toggle('text-dc-void', !isHybrid);
    btnFull.classList.toggle('bg-transparent', isHybrid);
    btnFull.classList.toggle('text-dc-storm', isHybrid);
    btnFull.classList.toggle('hover:text-dc-platinum', isHybrid);
  }
  if (btnHybrid) {
    btnHybrid.classList.toggle('active', isHybrid);
    btnHybrid.classList.toggle('bg-dc-platinum', isHybrid);
    btnHybrid.classList.toggle('text-dc-void', isHybrid);
    btnHybrid.classList.toggle('bg-transparent', !isHybrid);
    btnHybrid.classList.toggle('text-dc-storm', !isHybrid);
    btnHybrid.classList.toggle('hover:text-dc-platinum', !isHybrid);
  }
  if (fullConfig) fullConfig.classList.toggle('hidden', isHybrid);
  if (hybridConfig) hybridConfig.classList.toggle('hidden', !isHybrid);
}

// Global editor change handler
function _onEditorChange() {
  if (activeLoadout) {
    commitEditorToLoadout();
  } else {
    renderDashboard();
  }
}

// Fix 3: Handle Full Bed <-> Hybrid toggle with confirmation and pre-populate
function _handleHybridToggle(toHybrid) {
  const currentlyHybrid = $('#btn-hybrid').classList.contains('active');
  if (toHybrid === currentlyHybrid) return;

  // Check if there's a string selection that would be lost
  let hasSelection = false;
  let currentStringId = '';

  if (currentlyHybrid) {
    // Currently hybrid - check if mains or crosses is selected
    const mainsId = ssInstances['select-string-mains']?.getValue();
    const crossesId = ssInstances['select-string-crosses']?.getValue();
    hasSelection = !!(mainsId || crossesId);
    currentStringId = mainsId || ''; // Use mains as the carry-over
  } else {
    // Currently full bed - check if string is selected
    currentStringId = ssInstances['select-string-full']?.getValue() || '';
    hasSelection = !!currentStringId;
  }

  // If no selection, switch silently
  if (!hasSelection) {
    setHybridMode(toHybrid);
    _onEditorChange();
    return;
  }

  // Has selection - show confirmation
  const message = toHybrid
    ? 'Switching to Hybrid will use your current string as the Mains. Continue?'
    : 'Switching to Full Bed will use your Mains string for the full bed. Continue?';

  if (!confirm(message)) {
    // User cancelled - toggle stays in current state
    return;
  }

  // User confirmed - perform the switch with pre-populate
  setHybridMode(toHybrid);

  if (toHybrid && currentStringId) {
    // Full Bed -> Hybrid: carry string to mains
    ssInstances['select-string-mains']?.setValue(currentStringId);
    populateGaugeDropdown(document.getElementById('gauge-select-mains'), currentStringId);
    // Copy gauge if set
    const fullGauge = document.getElementById('gauge-select-full');
    const mainsGauge = document.getElementById('gauge-select-mains');
    if (fullGauge && fullGauge.value && mainsGauge) {
      mainsGauge.value = fullGauge.value;
    }
  } else if (!toHybrid && currentStringId) {
    // Hybrid -> Full Bed: carry mains to full bed
    ssInstances['select-string-full']?.setValue(currentStringId);
    populateGaugeDropdown(document.getElementById('gauge-select-full'), currentStringId);
    // Copy gauge if set
    const mainsGauge = document.getElementById('gauge-select-mains');
    const fullGauge = document.getElementById('gauge-select-full');
    if (mainsGauge && mainsGauge.value && fullGauge) {
      fullGauge.value = mainsGauge.value;
    }
  }

  _onEditorChange();
}

// ============================================
// TUNE MODE — TENSION TUNING LAB
// ============================================

let isTuneMode = false;
let _tuneRefreshing = false;
let sweepChart = null;
let tuneState = {
  baselineTension: 55,       // The tension from baseline snapshot
  exploredTension: 55,       // The slider's current position
  hybridDimension: 'linked', // 'mains', 'crosses', or 'linked'
  sweepData: null,           // cached sweep results
  baselineStats: null,       // stats at baseline tension (for sweep ref)
  optimalWindow: null,       // { low, high, anchor, reason }

  // --- Sandbox state (frozen baseline vs live exploration) ---
  baseline: null,  // { frameId, stringId, isHybrid, mainsId, crossesId, mainsTension, crossesTension, gauge, mainsGauge, crossesGauge, stats, obs, identity }
  explored: null   // { stats, obs, identity } — recomputed on every slider/string/gauge change
};

function toggleTuneMode() {
  // Legacy compat — now routes through switchMode
  if (currentMode === 'tune') {
    switchMode('overview');
  } else {
    const setup = getCurrentSetup();
    if (!setup) return; // No setup configured — don't open
    switchMode('tune');
  }
}

function closeTuneMode() {
  // Legacy compat — now routes through switchMode
  switchMode('overview');
}

// dockBuilderPanel is no longer needed — builder stays permanently in build-dock
// Kept as no-op for any lingering calls
function dockBuilderPanel(inTune) {
  // No-op: builder panel is now permanently in the left build-dock
}

// Auto-refresh Tune panels when user changes setup while Tune is open
function refreshTuneIfActive() {
  if (currentMode !== 'tune' || _tuneRefreshing) return;
  _tuneRefreshing = true;
  try {
    const setup = getCurrentSetup();
    if (setup) {
      initTuneMode(setup);
    } else {
      // Setup became invalid — show empty state
      $('#tune-empty').classList.remove('hidden');
      $('#tune-panels').classList.add('hidden');
    }
  } finally {
    _tuneRefreshing = false;
  }
}

function getHybridBaselineTension(stringConfig, dimension) {
  if (dimension === 'mains') return stringConfig.mainsTension;
  if (dimension === 'crosses') return stringConfig.crossesTension;
  // linked: average
  return Math.round((stringConfig.mainsTension + stringConfig.crossesTension) / 2);
}

function updateSliderLabel() {
  const val = tuneState.exploredTension;
  const dim = tuneState.hybridDimension;
  const setup = getCurrentSetup();
  const isHybrid = setup && setup.stringConfig.isHybrid;
  const labelEl = document.querySelector('.slider-current-label');
  const valueEl = $('#slider-current-value');

  const hasSplitTensions = setup && (setup.stringConfig.mainsTension !== undefined && setup.stringConfig.crossesTension !== undefined);
  if (hasSplitTensions && dim === 'mains') {
    labelEl.textContent = 'Exploring Mains';
    valueEl.textContent = `${val} lbs`;
  } else if (hasSplitTensions && dim === 'crosses') {
    labelEl.textContent = 'Exploring Crosses';
    valueEl.textContent = `${val} lbs`;
  } else if (hasSplitTensions && dim === 'linked') {
    const diff = setup.stringConfig.mainsTension - setup.stringConfig.crossesTension;
    const mainsVal = val;
    const crossesVal = Math.max(0, val - diff);
    labelEl.textContent = 'Exploring Linked';
    valueEl.textContent = `M ${mainsVal} / X ${crossesVal} lbs`;
  } else {
    labelEl.textContent = 'Exploring';
    valueEl.textContent = `${val} lbs`;
  }
}

function updateDeltaTitle(stringConfig) {
  const titleEl = $('#tune-card-delta .tune-card-title');
  if (!titleEl) return;
  const dim = tuneState.hybridDimension;
  const hasSplitTensions = stringConfig && (stringConfig.mainsTension !== undefined && stringConfig.crossesTension !== undefined);
  if (hasSplitTensions) {
    if (dim === 'mains') {
      titleEl.textContent = 'DELTA VS BASELINE — MAINS ONLY';
    } else if (dim === 'crosses') {
      titleEl.textContent = 'DELTA VS BASELINE — CROSSES ONLY';
    } else {
      titleEl.textContent = 'DELTA VS BASELINE — LINKED';
    }
  } else {
    titleEl.textContent = 'DELTA VS BASELINE';
  }
}

function _tuneStringKey(lo) {
  return lo.isHybrid ? (lo.mainsId + '/' + lo.crossesId) : (lo.stringId || '');
}

function initTuneMode(setup) {
  const { racquet, stringConfig } = setup;

  // --- Snapshot baseline from activeLoadout (the committed state) ---
  if (activeLoadout && (!tuneState.baseline || tuneState.baseline._loadoutId !== activeLoadout.id || tuneState.baseline._frameId !== activeLoadout.frameId || tuneState.baseline._stringKey !== _tuneStringKey(activeLoadout))) {
    var tCtx = buildTensionContext(stringConfig, racquet);
    var bStats = predictSetup(racquet, stringConfig);
    var bObs = computeCompositeScore(bStats, tCtx);
    var bIdent = generateIdentity(bStats, racquet, stringConfig);
    tuneState.baseline = {
      _loadoutId: activeLoadout.id,
      _frameId: activeLoadout.frameId,
      _stringKey: _tuneStringKey(activeLoadout),
      frameId: activeLoadout.frameId,
      stringId: activeLoadout.stringId,
      isHybrid: activeLoadout.isHybrid,
      mainsId: activeLoadout.mainsId,
      crossesId: activeLoadout.crossesId,
      mainsTension: activeLoadout.mainsTension,
      crossesTension: activeLoadout.crossesTension,
      gauge: activeLoadout.gauge,
      mainsGauge: activeLoadout.mainsGauge,
      crossesGauge: activeLoadout.crossesGauge,
      stats: bStats,
      obs: +bObs.toFixed(1),
      identity: bIdent
    };
  }

  // Initialize explored to baseline
  if (tuneState.baseline) {
    tuneState.explored = {
      stats: tuneState.baseline.stats,
      obs: tuneState.baseline.obs,
      identity: tuneState.baseline.identity
    };
  }

  // Set subtitle
  let subtitle = racquet.name;
  if (stringConfig.isHybrid) {
    subtitle += ` — ${stringConfig.mains.name} / ${stringConfig.crosses.name}`;
  } else {
    subtitle += ` — ${stringConfig.string.name}`;
  }
  $('#tune-subtitle').textContent = subtitle;

  // Show/hide panels
  $('#tune-empty').classList.add('hidden');
  $('#tune-panels').classList.remove('hidden');

  // Set baseline tension from main page, respecting hybrid dimension
  if (stringConfig.isHybrid) {
    // Preserve dimension if already set, default to linked
    if (!['mains','crosses','linked'].includes(tuneState.hybridDimension)) {
      tuneState.hybridDimension = 'linked';
    }
    tuneState.baselineTension = getHybridBaselineTension(stringConfig, tuneState.hybridDimension);
  } else {
    // Full Bed now has independent tensions — treat like hybrid for tune purposes
    if (!['mains','crosses','linked'].includes(tuneState.hybridDimension)) {
      tuneState.hybridDimension = 'linked';
    }
    tuneState.baselineTension = getHybridBaselineTension(stringConfig, tuneState.hybridDimension);
  }
  tuneState.exploredTension = tuneState.baselineTension;
  tuneState.originalTension = tuneState.baselineTension;

  // Configure slider range from racquet (allows exploring beyond optimal window)
  const sliderMin = Math.max(racquet.tensionRange[0] - 5, 30);
  const sliderMax = Math.min(racquet.tensionRange[1] + 5, 75);
  const slider = $('#tune-slider');
  slider.min = sliderMin;
  slider.max = sliderMax;
  slider.value = tuneState.baselineTension;
  $('#slider-label-min').textContent = sliderMin;
  $('#slider-label-max').textContent = sliderMax;
  updateSliderLabel();
  updateDeltaTitle(stringConfig);

  // Hybrid toggle
  renderTuneHybridToggle(stringConfig);

  // Run full sweep (generates data for optimal window calculation)
  runTensionSweep(setup);

  // Calculate optimal window based on racket + string combo
  calculateOptimalWindow(setup);

  // Render all modules
  renderOptimalBuildWindow(sliderMin, sliderMax);
  renderDeltaVsBaseline();
  renderGaugeExplorer(setup);
  renderBaselineMarker(sliderMin, sliderMax);
  renderOptimalZone(sliderMin, sliderMax);
  renderSweepChart(setup);
  renderBestValueMove();
  renderOverallBuildScore(setup, true);
  renderRecommendedBuilds(setup);
  renderOriginalTensionMarker();

  // Reset Apply button (explored == baseline on entry)
  var applyBtn = document.getElementById('tune-apply-btn');
  if (applyBtn) applyBtn.classList.add('hidden');
}

function runTensionSweep(setup) {
  const { racquet, stringConfig } = setup;
  const sweepMin = Math.max(racquet.tensionRange[0] - 5, 30);
  const sweepMax = Math.min(racquet.tensionRange[1] + 5, 75);
  const results = [];

  for (let t = sweepMin; t <= sweepMax; t++) {
    let modifiedConfig;
    if (stringConfig.isHybrid) {
      const diff = stringConfig.mainsTension - stringConfig.crossesTension;
      if (tuneState.hybridDimension === 'mains') {
        modifiedConfig = { ...stringConfig, mainsTension: t };
      } else if (tuneState.hybridDimension === 'crosses') {
        modifiedConfig = { ...stringConfig, crossesTension: t };
      } else {
        // Linked: maintain the differential
        modifiedConfig = { ...stringConfig, mainsTension: t, crossesTension: t - diff };
      }
    } else {
      // Full Bed: independent tensions, same dimension logic as hybrid
      const diff = stringConfig.mainsTension - stringConfig.crossesTension;
      if (tuneState.hybridDimension === 'mains') {
        modifiedConfig = { ...stringConfig, mainsTension: t };
      } else if (tuneState.hybridDimension === 'crosses') {
        modifiedConfig = { ...stringConfig, crossesTension: t };
      } else {
        // Linked: maintain the differential
        modifiedConfig = { ...stringConfig, mainsTension: t, crossesTension: t - diff };
      }
    }
    const stats = predictSetup(racquet, modifiedConfig);
    results.push({ tension: t, stats });
  }

  tuneState.sweepData = results;

  // Also cache baseline stats
  tuneState.baselineStats = results.find(r => r.tension === tuneState.baselineTension)?.stats
    || predictSetup(racquet, stringConfig);
}

function calculateOptimalWindow(setup) {
  const { racquet } = setup;
  const data = tuneState.sweepData;
  if (!data || data.length === 0) return;

  // Score each tension using the full 10-stat composite + tension sanity penalty
  const scored = data.map(d => {
    const s = d.stats;
    // d.tension is the explored value; compute differential from the sweep's modifiedConfig
    // In linked mode both move together; in mains/crosses mode only one moves
    const tCtx = { avgTension: d.tension, tensionRange: racquet.tensionRange, differential: 0 };
    const score = computeCompositeScore(s, tCtx);
    return { tension: d.tension, score, stats: s };
  });

  // Find peak
  scored.sort((a, b) => b.score - a.score);
  const anchor = scored[0].tension;
  const peakScore = scored[0].score;

  // Window = all tensions within 2% of peak score
  const threshold = peakScore * 0.98;
  const inWindow = scored.filter(s => s.score >= threshold).map(s => s.tension);
  const low = Math.min(...inWindow);
  const high = Math.max(...inWindow);

  // Reason
  const anchorStats = scored[0].stats;
  let reason = 'Balanced performance';
  if (anchorStats.control >= 80) reason = 'Control Anchor — precision peaks here';
  else if (anchorStats.comfort >= 75) reason = 'Comfort Anchor — arm-friendly sweet spot';
  else if (anchorStats.spin >= 78) reason = 'Spin Anchor — maximum rotation';
  else reason = 'Balanced Anchor — best all-round performance';

  tuneState.optimalWindow = { low, high, anchor, reason };
}

function renderOptimalBuildWindow(sMin, sMax) {
  const container = $('#optimal-content');
  const w = tuneState.optimalWindow;
  if (!w) {
    container.innerHTML = '<p class="tune-muted">No data</p>';
    return;
  }

  const anchorStats = tuneState.sweepData.find(d => d.tension === w.anchor)?.stats;
  if (!anchorStats) return;

  // Use full slider range as scale (allows exploring deviations from optimal)
  var scaleMin = sMin || w.low - 10;
  var scaleMax = sMax || w.high + 10;
  var scaleRange = scaleMax - scaleMin;
  if (scaleRange <= 0) scaleRange = 1;

  // Optimal window fill position within full range
  var fillLeft = ((w.low - scaleMin) / scaleRange) * 100;
  var fillRight = ((w.high - scaleMin) / scaleRange) * 100;
  var fillWidth = fillRight - fillLeft;

  // Anchor dot position within full range
  var anchorPct = ((w.anchor - scaleMin) / scaleRange) * 100;
  anchorPct = Math.max(2, Math.min(98, anchorPct));

  container.innerHTML = `
    <div class="optimal-range">
      <div class="optimal-range-visual">
        <span class="optimal-range-low">${scaleMin}</span>
        <div class="optimal-range-bar">
          <div class="optimal-range-fill" style="left:${fillLeft}%;width:${fillWidth}%"></div>
          <div class="optimal-range-anchor" style="left:${anchorPct}%">
            <span class="optimal-anchor-label">${w.anchor} lbs</span>
          </div>
        </div>
        <span class="optimal-range-high">${scaleMax}</span>
      </div>
      <p class="optimal-reason">${w.reason}</p>
    </div>
    <div class="optimal-stats-grid">
      <div class="optimal-stat">
        <span class="optimal-stat-label">Control</span>
        <span class="optimal-stat-value${anchorStats.control > 70 ? ' high' : ''}">${anchorStats.control}</span>
      </div>
      <div class="optimal-stat-divider"></div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Comfort</span>
        <span class="optimal-stat-value${anchorStats.comfort > 70 ? ' high' : ''}">${anchorStats.comfort}</span>
      </div>
      <div class="optimal-stat-divider"></div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Spin</span>
        <span class="optimal-stat-value${anchorStats.spin > 70 ? ' high' : ''}">${anchorStats.spin}</span>
      </div>
      <div class="optimal-stat-divider"></div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Power</span>
        <span class="optimal-stat-value${anchorStats.power > 70 ? ' high' : ''}">${anchorStats.power}</span>
      </div>
    </div>
  `;
}

function renderDeltaVsBaseline() {
  const container = $('#delta-content');
  const data = tuneState.sweepData;
  if (!data) return;

  const baselineEntry = data.find(d => d.tension === tuneState.baselineTension);
  const exploredEntry = data.find(d => d.tension === tuneState.exploredTension);
  if (!baselineEntry || !exploredEntry) return;

  const base = baselineEntry.stats;
  const explored = exploredEntry.stats;
  const deltaKeys = ['control', 'power', 'comfort', 'spin', 'launch', 'feel', 'playability'];
  const deltaLabels = ['Control', 'Power', 'Comfort', 'Spin', 'Launch', 'Feel', 'Playability'];

  const isAtBaseline = tuneState.exploredTension === tuneState.baselineTension;
  const setup = getCurrentSetup();
  const isHybrid = setup && setup.stringConfig.isHybrid;
  const dim = tuneState.hybridDimension;

  // Build dimension-aware baseline label
  let baseLabel = `Baseline: ${tuneState.baselineTension} lbs`;
  let exploreLabel = isAtBaseline ? 'At baseline' : `Exploring: ${tuneState.exploredTension} lbs`;
  if (isHybrid) {
    if (dim === 'mains') {
      baseLabel = `Mains Baseline: ${tuneState.baselineTension} lbs`;
      exploreLabel = isAtBaseline ? 'At baseline' : `Mains: ${tuneState.exploredTension} lbs`;
    } else if (dim === 'crosses') {
      baseLabel = `Crosses Baseline: ${tuneState.baselineTension} lbs`;
      exploreLabel = isAtBaseline ? 'At baseline' : `Crosses: ${tuneState.exploredTension} lbs`;
    } else {
      const diff = setup.stringConfig.mainsTension - setup.stringConfig.crossesTension;
      baseLabel = `Linked Baseline: M ${tuneState.baselineTension} / X ${Math.max(0, tuneState.baselineTension - diff)} lbs`;
      if (!isAtBaseline) {
        exploreLabel = `Linked: M ${tuneState.exploredTension} / X ${Math.max(0, tuneState.exploredTension - diff)} lbs`;
      }
    }
  }

  // Check if this is first render or update
  const isFirstRender = !container.querySelector('.delta-stats-grid');
  
  if (isFirstRender) {
    // Initial render - create the DOM structure
    const renderBatteryBar = (value) => {
      const segments = 20;
      let segmentsHtml = '';
      const filledCount = Math.round((value / 100) * segments);
      
      for (let i = 0; i < segments; i++) {
        let segClass = '';
        if (i < filledCount) {
          const segValue = (i / segments) * 100;
          segClass = segValue >= 70 ? 'high' : 'filled';
        } else {
          segClass = 'empty';
        }
        segmentsHtml += `<div class="stat-bar-segment ${segClass}"></div>`;
      }
      
      return segmentsHtml;
    };

    container.innerHTML = `
      <div class="delta-header-row">
        <span class="delta-baseline-label">${baseLabel}</span>
        <span class="delta-explored-label" id="delta-explored-label">${exploreLabel}</span>
      </div>
      <div class="delta-stats-grid">
        ${deltaKeys.map((key, i) => {
          const diff = Math.round(explored[key] - base[key]);
          const cls = diff > 0 ? 'delta-positive' : diff < 0 ? 'delta-negative' : 'delta-neutral';
          const sign = diff > 0 ? '+' : '';
          return `
            <div class="delta-stat-row" data-stat="${key}">
              <span class="delta-stat-label">${deltaLabels[i]}</span>
              <div class="stat-bar-track" id="delta-track-${key}" data-baseline="${base[key]}" data-explored="${explored[key]}">
                ${renderBatteryBar(explored[key])}
              </div>
              <span class="delta-stat-diff ${cls}" id="delta-diff-${key}">${isAtBaseline ? '—' : `${sign}${diff}`}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    // Animate the battery bars on first render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.querySelectorAll('.stat-bar-track').forEach((track, idx) => {
          const exploredValue = parseFloat(track.dataset.explored);
          const segments = track.querySelectorAll('.stat-bar-segment');
          const filledCount = Math.round((exploredValue / 100) * segments.length);
          
          segments.forEach((seg, i) => {
            setTimeout(() => {
              if (i < filledCount) {
                seg.classList.add('active');
              }
            }, idx * 40 + i * 15);
          });
        });
      });
    });
  } else {
    // Update existing DOM - dynamic update like racket bible
    _updateDeltaBatteryBars(base, explored, isAtBaseline);
    
    // Update labels
    const exploreLabelEl = document.getElementById('delta-explored-label');
    if (exploreLabelEl) exploreLabelEl.textContent = exploreLabel;
  }
}

// Update delta battery bars dynamically (like racket bible comp-track)
function _updateDeltaBatteryBars(baseStats, exploredStats, isAtBaseline) {
  const deltaKeys = ['control', 'power', 'comfort', 'spin', 'launch', 'feel', 'playability'];
  const segments = 20;
  
  deltaKeys.forEach(key => {
    const baseVal = Math.round(baseStats[key]);
    const exploredVal = Math.round(exploredStats[key]);
    const diff = exploredVal - baseVal;
    
    const track = document.getElementById(`delta-track-${key}`);
    const diffEl = document.getElementById(`delta-diff-${key}`);
    if (!track) return;
    
    const baseFilled = Math.round((baseVal / 100) * segments);
    const exploredFilled = Math.round((exploredVal / 100) * segments);
    
    // Rebuild segments with before/after visualization
    let segmentsHtml = '';
    for (let i = 0; i < segments; i++) {
      let segClass = 'empty';
      
      if (isAtBaseline) {
        // At baseline - show base value only
        if (i < baseFilled) {
          const segValue = (i / segments) * 100;
          segClass = segValue >= 70 ? 'high active' : 'filled active';
        }
      } else {
        // Exploring - show comparison
        if (exploredVal > baseVal) {
          // Increased - base in normal, increase in accent
          if (i < baseFilled) {
            const segValue = (i / segments) * 100;
            segClass = segValue >= 70 ? 'high active' : 'filled active';
          } else if (i < exploredFilled) {
            segClass = 'high active'; // Increased portion in accent
          }
        } else if (exploredVal < baseVal) {
          // Decreased - explored in darker/reduced, base remainder
          if (i < exploredFilled) {
            const segValue = (i / segments) * 100;
            segClass = segValue >= 70 ? 'high active' : 'filled active';
          } else if (i < baseFilled) {
            segClass = 'empty'; // Lost portion
          }
        } else {
          // Same - show base
          if (i < baseFilled) {
            const segValue = (i / segments) * 100;
            segClass = segValue >= 70 ? 'high active' : 'filled active';
          }
        }
      }
      
      segmentsHtml += `<div class="stat-bar-segment ${segClass}"></div>`;
    }
    
    track.innerHTML = segmentsHtml;
    track.dataset.baseline = baseVal;
    track.dataset.explored = exploredVal;
    
    // Update diff label
    if (diffEl) {
      const cls = diff > 0 ? 'delta-positive' : diff < 0 ? 'delta-negative' : 'delta-neutral';
      const sign = diff > 0 ? '+' : '';
      diffEl.className = `delta-stat-diff ${cls}`;
      diffEl.textContent = isAtBaseline ? '—' : `${sign}${diff}`;
    }
  });
}

// ============================================
// GAUGE EXPLORER — shows how each available gauge shifts stats vs current
// ============================================
function renderGaugeExplorer(setup) {
  const container = $('#gauge-explore-content');
  if (!container) return;
  if (!setup) { container.innerHTML = ''; return; }

  const { racquet, stringConfig } = setup;

  // Determine which string(s) to explore gauge for
  // For full bed: explore the single string
  // For hybrid: explore both mains and crosses
  const sections = [];

  if (stringConfig.isHybrid) {
    if (stringConfig.mains) {
      sections.push({
        label: 'MAINS',
        string: stringConfig.mains,
        tensionKey: 'mainsTension',
        buildConfig: (gaugedStr) => ({
          isHybrid: true,
          mains: gaugedStr,
          crosses: stringConfig.crosses,
          mainsTension: stringConfig.mainsTension,
          crossesTension: stringConfig.crossesTension
        })
      });
    }
    if (stringConfig.crosses) {
      sections.push({
        label: 'CROSSES',
        string: stringConfig.crosses,
        tensionKey: 'crossesTension',
        buildConfig: (gaugedStr) => ({
          isHybrid: true,
          mains: stringConfig.mains,
          crosses: gaugedStr,
          mainsTension: stringConfig.mainsTension,
          crossesTension: stringConfig.crossesTension
        })
      });
    }
  } else {
    if (stringConfig.string) {
      sections.push({
        label: null, // no label needed for single string
        string: stringConfig.string,
        buildConfig: (gaugedStr) => ({
          isHybrid: false,
          string: gaugedStr,
          mainsTension: stringConfig.mainsTension,
          crossesTension: stringConfig.crossesTension
        })
      });
    }
  }

  if (sections.length === 0) { container.innerHTML = ''; return; }

  // Stats to show in the gauge explorer
  const gaugeKeys = ['spin', 'power', 'control', 'comfort', 'feel', 'durability', 'playability'];
  const gaugeLabels = ['Spin', 'Power', 'Control', 'Comfort', 'Feel', 'Durability', 'Playability'];

  let html = '';

  sections.forEach((section, _secIdx) => {
    const baseStr = section.string;
    const baseRefGauge = baseStr._gaugeModified ? baseStr._refGauge : baseStr.gaugeNum;
    // Use the original unmodified string for gauge exploration
    const originalStr = baseStr._gaugeModified
      ? STRINGS.find(s => s.id === baseStr.id) || baseStr
      : baseStr;
    const currentGauge = baseStr.gaugeNum;
    const gaugeOptions = getGaugeOptions(originalStr);

    // Compute stats at each gauge
    const gaugeResults = gaugeOptions.map(g => {
      const gaugedStr = applyGaugeModifier(originalStr, g);
      const config = section.buildConfig(gaugedStr);
      const stats = predictSetup(racquet, config);
      const tensionCtx = buildTensionContext(config, racquet);
      const obs = computeCompositeScore(stats, tensionCtx);
      return { gauge: g, stats, obs: +obs.toFixed(1), isCurrent: Math.abs(g - currentGauge) < 0.005 };
    });

    const currentResult = gaugeResults.find(r => r.isCurrent);
    if (!currentResult) return;

    if (section.label) {
      html += `<div class="gauge-explore-section-label">${section.label}: ${originalStr.name}</div>`;
    } else {
      html += `<div class="gauge-explore-section-label">${originalStr.name}</div>`;
    }

    html += `<div class="gauge-explore-grid" style="--gauge-cols: ${gaugeOptions.length}">`;

    // Header row
    html += `<div class="gauge-explore-header">`;
    html += `<span class="gauge-explore-stat-label"></span>`;
    gaugeResults.forEach(r => {
      const gaugeLabel = GAUGE_LABELS[r.gauge] || `${r.gauge.toFixed(2)}mm`;
      // Show short label: just the gauge number like "16" or "17"
      const shortLabel = r.gauge >= 1.30 ? '16' : r.gauge >= 1.25 ? '16L' : r.gauge >= 1.20 ? '17' : '18';
      const mmLabel = `${r.gauge.toFixed(2)}`;
      const currentCls = r.isCurrent ? ' gauge-current' : '';
      html += `<button class="gauge-explore-col-header${currentCls}" onclick="_applyGaugeSelection(${r.gauge},${_secIdx})" title="${r.isCurrent ? 'Current gauge' : 'Click to apply this gauge'}">
        <span class="gauge-col-short">${shortLabel}</span>
        <span class="gauge-col-mm">${mmLabel}</span>
        ${r.isCurrent ? '<span class="gauge-col-tag">current</span>' : '<span class="gauge-col-tag gauge-col-apply">apply</span>'}
      </button>`;
    });
    html += `</div>`;

    // Stat rows
    gaugeKeys.forEach((key, i) => {
      html += `<div class="gauge-explore-row">`;
      html += `<span class="gauge-explore-stat-label">${gaugeLabels[i]}</span>`;
      gaugeResults.forEach(r => {
        const val = r.stats[key];
        const baseVal = currentResult.stats[key];
        const diff = val - baseVal;
        const cls = r.isCurrent ? 'gauge-val-current' : diff > 0 ? 'gauge-val-positive' : diff < 0 ? 'gauge-val-negative' : 'gauge-val-neutral';
        const diffStr = r.isCurrent ? '' : (diff > 0 ? `+${diff}` : `${diff}`);
        html += `<span class="gauge-explore-cell ${cls}">
          <span class="gauge-cell-val">${val}</span>
          ${diffStr ? `<span class="gauge-cell-diff">${diffStr}</span>` : ''}
        </span>`;
      });
      html += `</div>`;
    });

    // OBS row
    html += `<div class="gauge-explore-row gauge-explore-obs-row">`;
    html += `<span class="gauge-explore-stat-label gauge-obs-label">OBS</span>`;
    gaugeResults.forEach(r => {
      const diff = r.obs - currentResult.obs;
      const cls = r.isCurrent ? 'gauge-val-current' : diff > 0.5 ? 'gauge-val-positive' : diff < -0.5 ? 'gauge-val-negative' : 'gauge-val-neutral';
      const diffStr = r.isCurrent ? '' : (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1));
      html += `<span class="gauge-explore-cell gauge-obs-cell ${cls}">
        <span class="gauge-cell-val">${r.obs}</span>
        ${diffStr ? `<span class="gauge-cell-diff">${diffStr}</span>` : ''}
      </span>`;
    });
    html += `</div>`;

    html += `</div>`; // close gauge-explore-grid
  });

  container.innerHTML = html;
}

function renderBaselineMarker(sliderMin, sliderMax) {
  const marker = $('#slider-baseline-marker');
  const pct = ((tuneState.baselineTension - sliderMin) / (sliderMax - sliderMin)) * 100;
  marker.style.left = `${pct}%`;
  marker.title = `Baseline: ${tuneState.baselineTension} lbs`;
}

function renderOptimalZone(sliderMin, sliderMax) {
  const zone = $('#slider-optimal-zone');
  const w = tuneState.optimalWindow;
  if (!w) { zone.style.display = 'none'; return; }
  const leftPct = ((w.low - sliderMin) / (sliderMax - sliderMin)) * 100;
  const rightPct = ((w.high - sliderMin) / (sliderMax - sliderMin)) * 100;
  zone.style.left = `${leftPct}%`;
  zone.style.width = `${rightPct - leftPct}%`;
  zone.style.display = '';
  zone.title = `Optimal: ${w.low}–${w.high} lbs`;
}

function renderSweepChart(setup) {
  const data = tuneState.sweepData;
  if (!data || data.length === 0) return;

  const ctx = document.getElementById('sweep-chart').getContext('2d');
  const tensions = data.map(d => d.tension);
  const isDark = document.documentElement.dataset.theme === 'dark';

  // Digicraft Brutalism — Four distinct colors for sweep chart data viz
  const curveColors = {
    control: { border: '#AF0000', fill: 'rgba(175, 0, 0, 0.06)' },    // Artful Red
    spin:    { border: '#CCFF00', fill: 'rgba(204, 255, 0, 0.04)' },  // Volt
    power:   { border: '#C8A87C', fill: 'rgba(200, 168, 124, 0.05)' },// Amber
    comfort: { border: '#A78BFA', fill: 'rgba(167, 139, 250, 0.05)' } // Lavender
  };

  const datasets = [
    {
      label: 'Control',
      data: data.map(d => d.stats.control),
      borderColor: curveColors.control.border,
      backgroundColor: curveColors.control.fill,
      fill: true,
      tension: 0.3,
      borderWidth: 2.5,
      borderDash: [],
      pointRadius: 0,
      pointHoverRadius: 0,
      pointStyle: false,
      pointHitRadius: 8
    },
    {
      label: 'Spin',
      data: data.map(d => d.stats.spin),
      borderColor: curveColors.spin.border,
      backgroundColor: curveColors.spin.fill,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      borderDash: [],
      pointRadius: 0,
      pointHoverRadius: 0,
      pointStyle: false,
      pointHitRadius: 8
    },
    {
      label: 'Power',
      data: data.map(d => d.stats.power),
      borderColor: curveColors.power.border,
      backgroundColor: curveColors.power.fill,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      borderDash: [],
      pointRadius: 0,
      pointHoverRadius: 0,
      pointStyle: false,
      pointHitRadius: 8
    },
    {
      label: 'Comfort',
      data: data.map(d => d.stats.comfort),
      borderColor: curveColors.comfort.border,
      backgroundColor: curveColors.comfort.fill,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      borderDash: [],
      pointRadius: 0,
      pointHoverRadius: 0,
      pointStyle: false,
      pointHitRadius: 8
    }
  ];

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.30)';
  const legendColor = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.48)';

  // Annotation lines for baseline and explored
  const baselinePlugin = {
    id: 'tuneAnnotations',
    afterDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const xScale = scales.x;
      const yScale = scales.y;

      // Baseline marker
      const bx = xScale.getPixelForValue(tuneState.baselineTension);
      if (bx >= chartArea.left && bx <= chartArea.right) {
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.20)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(bx, chartArea.top);
        ctx.lineTo(bx, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.40)';
        ctx.font = "500 10px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('BASELINE', bx, chartArea.top - 6);
        ctx.restore();
      }

      // Explored marker
      if (tuneState.exploredTension !== tuneState.baselineTension) {
        const ex = xScale.getPixelForValue(tuneState.exploredTension);
        if (ex >= chartArea.left && ex <= chartArea.right) {
          ctx.save();
          // Digicraft Brutalism — monochrome explored marker
          ctx.strokeStyle = isDark ? 'rgba(220, 223, 226, 0.8)' : 'rgba(26, 26, 26, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(ex, chartArea.top);
          ctx.lineTo(ex, chartArea.bottom);
          ctx.stroke();
          ctx.fillStyle = isDark ? 'rgba(220, 223, 226, 0.8)' : 'rgba(26, 26, 26, 0.7)';
          ctx.font = "600 10px 'Inter', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText(`${tuneState.exploredTension} lbs`, ex, chartArea.top - 6);
          ctx.restore();
        }
      }

      // Optimal window shading
      const w = tuneState.optimalWindow;
      if (w) {
        const lx = xScale.getPixelForValue(w.low);
        const rx = xScale.getPixelForValue(w.high);
        ctx.save();
        // Digicraft Brutalism — subtle red tint for optimal window
        ctx.fillStyle = 'rgba(175, 0, 0, 0.08)';
        ctx.fillRect(lx, chartArea.top, rx - lx, chartArea.bottom - chartArea.top);
        ctx.restore();
      }
    }
  };

  if (sweepChart) {
    sweepChart.data.labels = tensions;
    sweepChart.data.datasets = datasets;
    sweepChart.options.scales.x.grid.color = gridColor;
    sweepChart.options.scales.y.grid.color = gridColor;
    sweepChart.options.scales.x.ticks.color = tickColor;
    sweepChart.options.scales.y.ticks.color = tickColor;
    sweepChart.options.plugins.legend.labels.color = legendColor;
    sweepChart.update('active');
    return;
  }

  sweepChart = new Chart(ctx, {
    type: 'line',
    data: { labels: tensions, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: {
            font: { family: "'JetBrains Mono', monospace", size: 9, weight: 600 },
            color: legendColor,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            boxWidth: 6,
            boxHeight: 6,
            textTransform: 'uppercase'
          }
        },
        tooltip: {
          backgroundColor: '#1A1A1A',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 0.5,
          titleColor: '#F0F2F4',
          titleFont: { family: "'JetBrains Mono', monospace", size: 11, weight: 600 },
          bodyColor: '#DCDFE2',
          bodyFont: { family: "'JetBrains Mono', monospace", size: 10 },
          cornerRadius: 4,
          padding: 10,
          displayColors: true,
          callbacks: {
            title: (items) => `${items[0].label} lbs`,
            label: (item) => `  ${item.dataset.label}: ${item.raw}`
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Tension (lbs)',
            font: { family: "'Inter', sans-serif", size: 11, weight: 500 },
            color: tickColor
          },
          grid: { color: gridColor, lineWidth: 0.5 },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 10 },
            color: tickColor,
            stepSize: 2
          }
        },
        y: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Rating',
            font: { family: "'Inter', sans-serif", size: 11, weight: 500 },
            color: tickColor
          },
          grid: { color: gridColor, lineWidth: 0.5 },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 10 },
            color: tickColor,
            stepSize: 25
          }
        }
      },
      animation: { duration: 400, easing: 'easeOutQuart' }
    },
    plugins: [baselinePlugin]
  });
}

function renderBestValueMove() {
  const container = $('#slider-best-value');
  const data = tuneState.sweepData;
  const w = tuneState.optimalWindow;
  if (!data || !w) { container.innerHTML = ''; return; }

  const current = tuneState.exploredTension;
  const isInZone = current >= w.low && current <= w.high;

  if (isInZone) {
    container.innerHTML = `<div class="best-value-callout best-value-ok">
      <span class="best-value-icon">●</span>
      <span>You're in the optimal zone (${w.low}–${w.high} lbs). No adjustment needed.</span>
    </div>`;
  } else {
    const anchor = w.anchor;
    const diff = anchor - current;
    const direction = diff > 0 ? 'up' : 'down';
    const SVG_CHEV_UP = '<svg width="10" height="10" viewBox="0 0 10 10" style="display:inline-block;vertical-align:middle"><path d="M2 7L5 3L8 7" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="square"/></svg>';
    const SVG_CHEV_DOWN = '<svg width="10" height="10" viewBox="0 0 10 10" style="display:inline-block;vertical-align:middle"><path d="M2 3L5 7L8 3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="square"/></svg>';
    const arrowIcon = diff > 0 ? SVG_CHEV_UP : SVG_CHEV_DOWN;
    container.innerHTML = `<div class="best-value-callout best-value-move">
      <span class="best-value-icon">${arrowIcon}</span>
      <span><strong>Best Value Move:</strong> ${direction} ${Math.abs(diff)} lbs to ${anchor} lbs for peak balanced performance.</span>
    </div>`;
  }
}

// ---- Overall Build Score — Rank Ladder Bar ----

function __getObsTier_OLD(score) {
  for (let i = OBS_TIERS.length - 1; i >= 0; i--) {
    if (score >= OBS_TIERS[i].min) return OBS_TIERS[i];
  }
  return OBS_TIERS[0];
}

// Ice Court score color system — monochrome + fn blue at peak
function __getObsScoreColor_OLD(score) {
  // Digicraft Brutalism — monochrome OBS score display
  // All scores use the same color; differentiation is via the rank ladder position
  return 'var(--dc-white)';
}

function getObsRingColor() {
  // Digicraft Brutalism — Artful Red when exploring, platinum when static
  // Check if we're in tune mode and tension has been adjusted from baseline
  if (typeof tuneState !== 'undefined' && tuneState.exploredTension !== tuneState.baselineTension) {
    return '#AF0000'; // Artful Red when exploring
  }
  return 'var(--dc-border-active)'; // Platinum when static/saved
}

function getObsBadgeStyle(score) {
  // Digicraft Brutalism — monochrome badge styling
  // Differentiation via opacity, not color
  const isDark = document.documentElement.dataset.theme === 'dark';
  const bg = isDark ? '220, 223, 226' : '26, 26, 26';
  const text = isDark ? '240, 242, 244' : '10, 10, 10';
  
  if (score >= 80) return `background: rgba(${bg}, 0.12); color: rgba(${text}, 0.95);`;
  if (score >= 70) return `background: rgba(${bg}, 0.10); color: rgba(${text}, 0.85);`;
  if (score >= 60) return `background: rgba(${bg}, 0.08); color: rgba(${text}, 0.75);`;
  if (score >= 50) return `background: rgba(${bg}, 0.06); color: rgba(${text}, 0.65);`;
  if (score >= 40) return `background: rgba(${bg}, 0.05); color: rgba(${text}, 0.55);`;
  if (score >= 30) return `background: rgba(${bg}, 0.04); color: rgba(${text}, 0.50);`;
  return `background: rgba(${bg}, 0.03); color: rgba(${text}, 0.45);`;
}

// ---- OBS Counting Animation ----
let _prevObsValues = { tune: null, hero: null, dock: null, mobile: null };

function animateOBS(el, from, to, duration) {
  if (!el || isNaN(from) || isNaN(to)) return;
  if (Math.abs(from - to) < 0.05) { el.textContent = to.toFixed(1); return; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = to.toFixed(1);
    return;
  }
  if (el._obsAnim) cancelAnimationFrame(el._obsAnim);
  duration = duration || 350;
  var t0 = performance.now();
  el.textContent = from.toFixed(1);
  function tick(now) {
    var p = Math.min((now - t0) / duration, 1);
    var e = 1 - Math.pow(1 - p, 4); // easeOutQuart
    el.textContent = (from + (to - from) * e).toFixed(1);
    if (p < 1) { el._obsAnim = requestAnimationFrame(tick); }
    else { el._obsAnim = null; }
  }
  el._obsAnim = requestAnimationFrame(tick);
}

function renderOverallBuildScore(setup, animate) {
  const container = $('#obs-content');
  if (!container) return;
  const { racquet, stringConfig } = setup;

  // Use explored state if in Tune sandbox, else compute fresh
  var score, stats;
  if (currentMode === 'tune' && tuneState.explored && tuneState.explored.obs) {
    score = tuneState.explored.obs;
    stats = tuneState.explored.stats;
  } else {
    stats = predictSetup(racquet, stringConfig);
    score = computeCompositeScore(stats, buildTensionContext(stringConfig, racquet));
  }

  const tier = getObsTier(score);
  const pct = Math.min(Math.max(score / 100, 0), 1) * 100;

  // Delta vs baseline (only in Tune sandbox)
  var deltaHTML = '';
  if (currentMode === 'tune' && tuneState.baseline && tuneState.baseline.obs) {
    var delta = score - tuneState.baseline.obs;
    if (Math.abs(delta) > 0.05) {
      var sign = delta > 0 ? '+' : '';
      var deltaCls = delta > 0 ? 'obs-delta-pos' : 'obs-delta-neg';
      deltaHTML = `<span class="obs-delta-chip ${deltaCls}">${sign}${delta.toFixed(1)}</span>`;
    }
  }

  // 10-segment battery indicator
  const segments = 10;
  const filled = Math.min(segments, Math.max(0, Math.ceil(score / 10)));
  let batteryHTML = '<div class="obs-battery">';
  for (let i = 0; i < segments; i++) {
    const isFilled = i < filled;
    const isTopTier = i >= 8; // Top 2 segments (80-100) get red when filled
    const segClass = isFilled ? (isTopTier ? 'obs-battery-seg obs-battery-filled obs-battery-top' : 'obs-battery-seg obs-battery-filled') : 'obs-battery-seg';
    batteryHTML += `<div class="${segClass}"></div>`;
  }
  batteryHTML += '</div>';

  const isSRank = tier.label === 'S Rank';
  const rankClass = isSRank ? 'obs-rank-badge s-rank' : 'obs-rank-badge';
  
  container.innerHTML = `
    <div class="obs-top-row">
      <div class="obs-score-group">
        <span class="obs-score-value">${score.toFixed(1)}</span>
        ${deltaHTML}
      </div>
      <span class="${rankClass}">${tier.label}</span>
    </div>
    ${batteryHTML}
  `;

  // OBS counting animation (skip during slider drag)
  if (animate && _prevObsValues.tune != null) {
    var obsEl = container.querySelector('.obs-score-value');
    if (obsEl) animateOBS(obsEl, _prevObsValues.tune, score, 400);
  }
  _prevObsValues.tune = score;
}

// ---- What To Try Next — 3-bucket contextual recommendations ----

function __classifySetup_OLD(stats) {
  // Sort attrs by value descending
  const sorted = WTTN_ATTRS.map(a => ({ attr: a, val: stats[a] })).sort((a, b) => b.val - a.val);
  const strongest = sorted.slice(0, 3);
  const weakest = sorted.slice(-3).reverse();
  const family = IDENTITY_FAMILIES.find(f => f.test(stats))?.family || 'balanced';
  return { strongest, weakest, family };
}

function computeProfileSimilarity(statsA, statsB) {
  // Cosine-like similarity on the 10-attr profile
  let dotP = 0, magA = 0, magB = 0;
  for (const a of WTTN_ATTRS) {
    dotP += statsA[a] * statsB[a];
    magA += statsA[a] * statsA[a];
    magB += statsB[a] * statsB[a];
  }
  return dotP / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-9);
}

function computeDeltas(currentStats, candidateStats) {
  const deltas = {};
  for (const a of WTTN_ATTRS) {
    deltas[a] = Math.round(candidateStats[a] - currentStats[a]);
  }
  return deltas;
}

function topGains(deltas, n = 4) {
  return Object.entries(deltas)
    .filter(([, d]) => d > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([attr, d]) => ({ attr, delta: d }));
}

function topLosses(deltas, n = 3) {
  return Object.entries(deltas)
    .filter(([, d]) => d < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([attr, delta]) => ({ attr, delta }));
}

function generateNetDirection(gains, losses) {
  if (gains.length === 0) return 'Marginal tradeoff';
  const topGain = gains[0].attr;
  const topLoss = losses.length > 0 ? losses[0].attr : null;

  const phrases = {
    comfort:     { gain: 'Softer',    pair: { control: 'less surgical', power: 'less explosive', spin: 'less spin-heavy' } },
    spin:        { gain: 'Spinnier',  pair: { control: 'less precise', comfort: 'firmer', power: 'less raw pace' } },
    power:       { gain: 'More pace', pair: { control: 'less precise', comfort: 'firmer', spin: 'less topspin' } },
    control:     { gain: 'Sharper',   pair: { power: 'less free power', comfort: 'firmer', spin: 'less spin' } },
    feel:        { gain: 'More feel', pair: { power: 'less pace', durability: 'less durable', comfort: 'less padded' } },
    playability: { gain: 'More consistent over time', pair: { power: 'less pop', spin: 'less grip', control: 'less surgical' } },
    durability:  { gain: 'Longer lasting', pair: { feel: 'less feel', comfort: 'firmer', spin: 'less grip' } },
    forgiveness: { gain: 'More forgiving', pair: { control: 'less surgical', feel: 'less feedback', spin: 'less spin' } },
    stability:   { gain: 'More stable', pair: { comfort: 'firmer', feel: 'less delicate', power: 'less explosive' } },
    launch:      { gain: 'Higher launch', pair: { control: 'less flat', stability: 'less locked-in', feel: 'less connected' } },
  };

  const g = phrases[topGain];
  if (!g) return 'Different profile balance';
  let phrase = g.gain;
  if (topLoss && g.pair[topLoss]) phrase += ', ' + g.pair[topLoss];
  else if (topLoss) phrase += ', slightly less ' + WTTN_ATTR_LABELS[topLoss].toLowerCase();

  return phrase;
}

function scoreClosestBetter(currentStats, classification, candidateStats, deltas) {
  const similarity = computeProfileSimilarity(currentStats, candidateStats);
  let weaknessGain = 0;
  for (const w of classification.weakest) {
    weaknessGain += Math.max(0, deltas[w.attr]);
  }
  let strengthLoss = 0;
  for (const s of classification.strongest) {
    strengthLoss += Math.max(0, -deltas[s.attr]);
  }
  // Same family bonus
  const candClass = classifySetup(candidateStats);
  const familyBonus = candClass.family === classification.family ? 8 : 0;

  return (similarity * 30) + (weaknessGain * 3) - (strengthLoss * 4) + familyBonus;
}

function scoreMoreOfWhatYouWant(currentStats, classification, candidateStats, deltas) {
  // Find what the user already excels at / likes — push one strength harder
  // Or find the 2nd-weakest area and boost it meaningfully
  let bestTargetScore = -Infinity;

  // Try each attribute as a "target" — pick the one that scores best
  for (const attr of WTTN_ATTRS) {
    const targetGain = Math.max(0, deltas[attr]);
    if (targetGain < 2) continue; // must be a meaningful gain

    // Secondary gains
    let secondaryGains = 0;
    for (const a of WTTN_ATTRS) {
      if (a !== attr && deltas[a] > 0) secondaryGains += deltas[a] * 0.5;
    }

    // Total loss
    let totalLoss = 0;
    for (const a of WTTN_ATTRS) {
      if (deltas[a] < 0) totalLoss += Math.abs(deltas[a]);
    }

    const score = (targetGain * 5) + secondaryGains - (totalLoss * 1.5);
    if (score > bestTargetScore) bestTargetScore = score;
  }

  return bestTargetScore === -Infinity ? -100 : bestTargetScore;
}

function scoreCorrective(currentStats, classification, candidateStats, deltas) {
  // Biggest weakness fix
  const weakest = classification.weakest[0]; // most limiting
  const fix = Math.max(0, deltas[weakest.attr]);

  // Secondary weakness fixes
  let secondaryFix = 0;
  for (let i = 1; i < classification.weakest.length; i++) {
    secondaryFix += Math.max(0, deltas[classification.weakest[i].attr]) * 0.6;
  }

  // Total loss elsewhere
  let totalLoss = 0;
  for (const a of WTTN_ATTRS) {
    if (deltas[a] < 0) totalLoss += Math.abs(deltas[a]);
  }

  return (fix * 6) + secondaryFix - (totalLoss * 1.0);
}

function candidateSimilarity(statsA, statsB) {
  let sumSqDiff = 0;
  for (const a of WTTN_ATTRS) {
    const d = statsA[a] - statsB[a];
    sumSqDiff += d * d;
  }
  return Math.sqrt(sumSqDiff);
}

function generateWhySentence(bucket, gains, losses, classification) {
  const topG = gains.slice(0, 2).map(g => WTTN_ATTR_LABELS[g.attr].toLowerCase()).join(' and ');
  const topL = losses.length > 0 ? losses[0] : null;

  if (bucket === 'closest') {
    if (topL) return `Preserves the current ${classification.family.replace('-',' ')} identity while improving ${topG}, with minimal ${WTTN_ATTR_LABELS[topL.attr].toLowerCase()} tradeoff.`;
    return `Preserves the current ${classification.family.replace('-',' ')} identity while adding ${topG}.`;
  }
  if (bucket === 'more') {
    return `Pushes ${topG} meaningfully harder${topL ? ', accepting some ' + WTTN_ATTR_LABELS[topL.attr].toLowerCase() + ' loss' : ''}.`;
  }
  if (bucket === 'corrective') {
    const weakName = WTTN_ATTR_LABELS[classification.weakest[0].attr].toLowerCase();
    return `Directly addresses the current setup's ${weakName} weakness${topL ? ', trading some ' + WTTN_ATTR_LABELS[topL.attr].toLowerCase() : ''}.`;
  }
  return 'An alternative profile worth exploring.';
}

function renderWhatToTryNext(setup, allCandidates) {
  const container = $('#wttn-content');
  const { racquet, stringConfig } = setup;

  // Get current stats
  const currentStats = predictSetup(racquet, stringConfig);
  const classification = classifySetup(currentStats);

  // Build a key to identify the current build for exclusion
  let currentBuildKey = null;
  if (stringConfig.isHybrid) {
    const mId = stringConfig.mains?.id || stringConfig.mainsId || '';
    const xId = stringConfig.crosses?.id || stringConfig.crossesId || '';
    currentBuildKey = `hybrid:${mId}/${xId}`;
  } else if (stringConfig.string) {
    currentBuildKey = `full:${stringConfig.string.id}`;
  }

  function getCandidateKey(c) {
    if (c.type === 'hybrid') return `hybrid:${c.mainsId}/${c.crossesId}`;
    return `full:${c.stringId || (c.string && c.string.id) || ''}`;
  }

  // Filter out the current build and compute deltas for each candidate
  const scored = allCandidates
    .filter(c => getCandidateKey(c) !== currentBuildKey)
    .map(c => {
      const deltas = computeDeltas(currentStats, c.stats);
      return {
        ...c,
        deltas,
        closestScore: scoreClosestBetter(currentStats, classification, c.stats, deltas),
        moreScore: scoreMoreOfWhatYouWant(currentStats, classification, c.stats, deltas),
        correctiveScore: scoreCorrective(currentStats, classification, c.stats, deltas),
      };
    });

  if (scored.length < 3) {
    container.innerHTML = '<p class="wttn-empty">Not enough alternative builds to generate contextual recommendations.</p>';
    return;
  }

  // Step 1: Pick Closest Better Version
  scored.sort((a, b) => b.closestScore - a.closestScore);
  const closest = scored[0];

  // Step 2: Pick More of What You Want — penalize candidates similar to closest
  const DISTINCTNESS_PENALTY = 15;
  for (const c of scored) {
    const sim = candidateSimilarity(c.stats, closest.stats);
    if (sim < 6) c.moreScore -= DISTINCTNESS_PENALTY;
  }
  scored.sort((a, b) => b.moreScore - a.moreScore);
  const more = scored.find(c => getCandidateKey(c) !== getCandidateKey(closest)) || scored[0];

  // Step 3: Pick Corrective Move — penalize candidates similar to both previous picks
  for (const c of scored) {
    const simClosest = candidateSimilarity(c.stats, closest.stats);
    const simMore = candidateSimilarity(c.stats, more.stats);
    if (simClosest < 6) c.correctiveScore -= DISTINCTNESS_PENALTY;
    if (simMore < 6) c.correctiveScore -= DISTINCTNESS_PENALTY;
  }
  scored.sort((a, b) => b.correctiveScore - a.correctiveScore);
  const corrective = scored.find(c => getCandidateKey(c) !== getCandidateKey(closest) && getCandidateKey(c) !== getCandidateKey(more)) || scored[0];

  const buckets = [
    { key: 'closest', title: 'Closest Better Version', pick: closest,
      icon: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
    { key: 'more', title: 'More of What You Want', pick: more,
      icon: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 13L8 3l5 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    { key: 'corrective', title: 'Corrective Move', pick: corrective,
      icon: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8z" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
  ];

  container.innerHTML = buckets.map(b => {
    const { pick, key, title, icon } = b;
    const gains = topGains(pick.deltas, 4);
    const losses = topLosses(pick.deltas, 3);
    const netDir = generateNetDirection(gains, losses);
    const why = generateWhySentence(key, gains, losses, classification);

    // Limit to 2-4 gains and 1-3 losses as specified
    const displayGains = gains.slice(0, 4).filter(g => g.delta >= 1);
    const displayLosses = losses.slice(0, 3).filter(l => l.delta <= -1);

    return `
      <div class="wttn-card" data-bucket="${key}">
        <div class="wttn-bucket-header">
          <div class="wttn-bucket-icon">${icon}</div>
          <span class="wttn-bucket-label">${title}</span>
        </div>
        <div>
          <div class="wttn-build-name">${pick.label || (pick.string && pick.string.name) || 'Unknown'} ${pick.gauge ? `<span class="wttn-gauge">${pick.gauge}</span>` : (pick.string ? `<span class="wttn-gauge">${pick.string.gauge}</span>` : '')}</div>
          <div class="wttn-build-meta">
            ${pick.type === 'hybrid' ? '<span class="recs-type-badge recs-type-hybrid">HYBRID</span>' : '<span class="recs-type-badge recs-type-full">FULL BED</span>'}
            <span class="wttn-build-tension">${pick.type === 'hybrid' ? `M:${pick.tension} / X:${pick.tension - 2} lbs` : `${pick.tension} lbs`}</span>
          </div>
        </div>
        <p class="wttn-why">${why}</p>
        <div class="wttn-deltas">
          ${displayGains.length > 0 ? `<div class="wttn-delta-row">
            <span class="wttn-delta-label">Gain</span>
            <div class="wttn-delta-chips">
              ${displayGains.map(g => `<span class="wttn-chip wttn-chip-gain">${WTTN_ATTR_LABELS[g.attr]} +${g.delta}</span>`).join('')}
            </div>
          </div>` : ''}
          ${displayLosses.length > 0 ? `<div class="wttn-delta-row">
            <span class="wttn-delta-label">Give Up</span>
            <div class="wttn-delta-chips">
              ${displayLosses.map(l => `<span class="wttn-chip wttn-chip-loss">${WTTN_ATTR_LABELS[l.attr]} ${l.delta}</span>`).join('')}
            </div>
          </div>` : ''}
        </div>
        <div class="wttn-net">
          <span class="wttn-net-label">Net</span>
          <span class="wttn-net-phrase">${netDir}</span>
        </div>
        <div class="wttn-action-row">
          <button class="wttn-apply-btn" onclick="_applyWttnBuild(this)" data-string-id="${pick.stringId || (pick.string ? pick.string.id : '')}" data-tension="${pick.tension}" data-type="${pick.type}" data-mains-id="${pick.mainsId || ''}" data-crosses-id="${pick.crossesId || ''}">Apply</button>
          <button class="wttn-save-btn" onclick="_saveWttnBuild(this)" data-string-id="${pick.stringId || (pick.string ? pick.string.id : '')}" data-tension="${pick.tension}" data-type="${pick.type}" data-mains-id="${pick.mainsId || ''}" data-crosses-id="${pick.crossesId || ''}" data-frame-id="${setup.racquet.id}">Save</button>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Recommended Builds ----
function renderRecommendedBuilds(setup) {
  const container = $('#recs-content');
  const { racquet, stringConfig } = setup;

  // --- Compute current build OBS for delta display ---
  const currentStats = predictSetup(racquet, stringConfig);
  const currentTCtx = buildTensionContext(stringConfig, racquet);
  const currentOBS = computeCompositeScore(currentStats, currentTCtx);

  const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
  const sweepMin = Math.max(racquet.tensionRange[0] - 3, 30);
  const sweepMax = Math.min(racquet.tensionRange[1] + 3, 75);

  // Helper: find optimal tension for a config
  function findOptimalTension(buildConfig) {
    let bestScore = -1, bestTension = midTension, bestStats = null;
    for (let t = sweepMin; t <= sweepMax; t += 1) {
      const cfg = { ...buildConfig };
      cfg.mainsTension = t;
      cfg.crossesTension = t - (buildConfig.isHybrid ? 2 : 0); // hybrids: crosses 2 lbs lower
      const stats = predictSetup(racquet, cfg);
      if (!stats) continue;
      const tCtx = buildTensionContext(cfg, racquet);
      const score = computeCompositeScore(stats, tCtx);
      if (score > bestScore) {
        bestScore = score;
        bestTension = t;
        bestStats = stats;
      }
    }
    return { score: bestScore, tension: bestTension, stats: bestStats };
  }

  // --- FULL BED candidates ---
  const fullBedCandidates = [];
  STRINGS.forEach(s => {
    const result = findOptimalTension({ isHybrid: false, string: s });
    if (result.stats) {
      fullBedCandidates.push({
        type: 'full',
        label: s.name,
        gauge: (s.gauge || "").replace(/\s*\(.*\)/, ""),
        material: s.material,
        tension: result.tension,
        score: result.score,
        stats: result.stats,
        stringId: s.id,
        string: s
      });
    }
  });

  // --- HYBRID candidates ---
  // Smart pairing: pick top mains candidates × best cross candidates
  // Cross selection: round/slick polys for poly mains, soft polys for gut
  const hybridCandidates = [];

  // Select promising mains strings: top 12 full-bed + any gut/multi
  fullBedCandidates.sort((a, b) => b.score - a.score);
  const topMainsIds = new Set(fullBedCandidates.slice(0, 12).map(c => c.stringId));
  STRINGS.forEach(s => {
    if (s.material === 'Natural Gut' || s.material === 'Multifilament') topMainsIds.add(s.id);
  });

  // Select cross candidates: round/slick polys + elastic co-polys
  const crossCandidates = STRINGS.filter(s => {
    const shape = (s.shape || '').toLowerCase();
    const isRoundSlick = shape.includes('round') || shape.includes('slick') || shape.includes('coated');
    const isElastic = s.material === 'Co-Polyester (elastic)';
    const isSoftPoly = s.material === 'Polyester' && s.stiffness < 200;
    return isRoundSlick || isElastic || isSoftPoly;
  });

  // Sweep hybrids: each mains candidate × each cross candidate
  topMainsIds.forEach(mainsId => {
    const mains = STRINGS.find(s => s.id === mainsId);
    if (!mains) return;

    crossCandidates.forEach(cross => {
      if (cross.id === mains.id) return; // skip same string
      const result = findOptimalTension({
        isHybrid: true, mains, crosses: cross
      });
      if (result.stats && result.score > 0) {
        hybridCandidates.push({
          type: 'hybrid',
          label: `${mains.name} / ${cross.name}`,
          gauge: ((mains.gauge || '').replace(/\s*\(.*\)/, '') + '/' + (cross.gauge || '').replace(/\s*\(.*\)/, '')),
          material: `${mains.material} / ${cross.material}`,
          tension: result.tension,
          score: result.score,
          stats: result.stats,
          mainsId: mains.id,
          crossesId: cross.id,
          mains, crosses: cross
        });
      }
    });
  });

  // --- Merge all candidates for WTTN ---
  const allCandidates = [...fullBedCandidates, ...hybridCandidates];
  allCandidates.sort((a, b) => b.score - a.score);

  // Identify current setup
  let currentKey = null;
  if (stringConfig.isHybrid) {
    const mId = stringConfig.mains?.id || stringConfig.mainsId;
    const xId = stringConfig.crosses?.id || stringConfig.crossesId;
    currentKey = `hybrid:${mId}/${xId}`;
  } else if (stringConfig.string) {
    currentKey = `full:${stringConfig.string.id}`;
  }

  function getCandidateKey(c) {
    return c.type === 'hybrid' ? `hybrid:${c.mainsId}/${c.crossesId}` : `full:${c.stringId}`;
  }

  // Check after we compute topFull and topHybrid (moved below)
  let isCurrentInTop = false;

  // --- Split into top 5 full-bed and top 5 hybrid ---
  fullBedCandidates.sort((a, b) => b.score - a.score);
  hybridCandidates.sort((a, b) => b.score - a.score);
  const topFull = fullBedCandidates.slice(0, 5);
  const topHybrid = hybridCandidates.slice(0, 5);
  isCurrentInTop = currentKey && [...topFull, ...topHybrid].some(c => getCandidateKey(c) === currentKey);

  // Helper: render a single recommendation item
  function renderRecItem(c, rank) {
    const isCurrent = currentKey === getCandidateKey(c);
    const delta = c.score - currentOBS;
    const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
    const deltaCls = delta > 0.5 ? 'recs-delta-positive' : delta < -0.5 ? 'recs-delta-negative' : 'recs-delta-neutral';
    const tensionLabel = c.type === 'hybrid'
      ? `M:${c.tension} / X:${c.tension - 2} lbs`
      : `${c.tension} lbs`;

    return `
      <div class="recs-item ${isCurrent ? 'recs-item-current' : ''}">
        <div class="recs-rank">${rank}</div>
        <div class="recs-info">
          <div class="recs-name">${c.label} ${c.gauge ? `<span class="recs-gauge">${c.gauge}</span>` : ''}</div>
          <div class="recs-meta">
            <span class="recs-tension-rec">${tensionLabel}</span>
            ${isCurrent ? '<span class="recs-badge-current">CURRENT</span>' : ''}
          </div>
        </div>
        <div class="recs-composite">
          <span class="recs-composite-value">${c.score.toFixed(1)}</span>
          <span class="recs-composite-delta ${deltaCls}">${isCurrent ? 'YOU' : deltaStr}</span>
        </div>
        <div class="recs-action-row">
          <button class="recs-apply-btn" onclick="_applyRecBuild('${racquet.id}','${c.stringId || (c.string ? c.string.id : '')}',${c.tension},'${c.type}','${c.mainsId || ''}','${c.crossesId || ''}')">Apply</button>
          <button class="recs-save-btn" onclick="_saveRecBuild('${racquet.id}','${c.stringId || (c.string ? c.string.id : '')}',${c.tension},'${c.type}','${c.mainsId || ''}','${c.crossesId || ''}')">Save</button>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="recs-split">
      <div class="recs-panel">
        <div class="recs-panel-header">
          <span class="recs-panel-title">FULL BED</span>
          <span class="recs-panel-sub">Single string, both directions</span>
        </div>
        <div class="recs-list">
          ${topFull.map((c, i) => renderRecItem(c, i + 1)).join('')}
        </div>
      </div>
      <div class="recs-panel">
        <div class="recs-panel-header">
          <span class="recs-panel-title">HYBRID</span>
          <span class="recs-panel-sub">Mains / Crosses pairing</span>
        </div>
        <div class="recs-list">
          ${topHybrid.map((c, i) => renderRecItem(c, i + 1)).join('')}
        </div>
      </div>
    </div>
    <p class="recs-footnote">Composite score across all 11 stats at optimal tension for <strong>${racquet.name.replace(/\\s+\\d+g$/, '')}</strong>. Delta is vs your current build.</p>
  `;

  // Show "Try a Different String" section
  const topCombined = [...topFull, ...topHybrid];
  renderExplorePrompt(setup, isCurrentInTop, topCombined);

  // Render What To Try Next using the full candidates list
  renderWhatToTryNext(setup, allCandidates);
}

function renderExplorePrompt(setup, isCurrentInTop, topBuilds) {
  const row = $('#tune-row-explore');
  const container = $('#explore-content');
  const { stringConfig } = setup;

  // If hybrid, always show a subtle nudge to try full-bed top strings
  if (stringConfig.isHybrid) {
    row.classList.remove('hidden');
    container.innerHTML = `
      <div class="explore-prompt">
        <div class="explore-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14m-5-5l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="explore-text">
          <p class="explore-headline">Curious how a full-bed setup compares?</p>
          <p class="explore-body">Your hybrid is dialed in — but the top-rated strings above are scored as full-bed setups. Try swapping to one of them on the main page and re-enter Tune to see how the response curves shift.</p>
        </div>
      </div>
    `;
    return;
  }

  if (isCurrentInTop) {
    // Current string is already top-rated — hide this section
    row.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  // Current string isn't in top 5 — encourage exploration
  const topName = topBuilds[0]?.string?.name || 'a top-rated string';
  row.classList.remove('hidden');
  container.innerHTML = `
    <div class="explore-prompt">
      <div class="explore-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="explore-text">
        <p class="explore-headline">Try a different string?</p>
        <p class="explore-body">Your current string didn't make the top 5 for this frame. Consider switching to <strong>${topName}</strong> or another recommended build above — swap on the main page, then re-enter Tune to compare the tension response curves.</p>
      </div>
    </div>
  `;
}

function onTuneSliderInput(e) {
  const val = parseInt(e.target.value);
  tuneState.exploredTension = val;
  updateSliderLabel();

  // Wave 2: Pulse the displayed value
  const valueEl = $('#slider-current-value');
  if (valueEl) {
    valueEl.classList.remove('slider-value-pulse');
    valueEl.offsetHeight;
    valueEl.classList.add('slider-value-pulse');
  }

  // Recompute explored state from baseline config + new tension
  _recomputeExploredState();

  // Update delta display
  renderDeltaVsBaseline();

  // Update best value move message (reflects explored position)
  renderBestValueMove();

  // Update chart annotation
  if (sweepChart) sweepChart.update('none');

  // Re-render OBS card with explored state (shows delta vs baseline)
  var setup = getCurrentSetup();
  if (setup) renderOverallBuildScore(setup);
}

// Recompute tuneState.explored from baseline config + current slider tension
function _recomputeExploredState() {
  if (!tuneState.baseline) return;
  var bl = tuneState.baseline;
  var racquet = RACQUETS.find(function(r) { return r.id === bl.frameId; });
  if (!racquet) return;

  // Build a stringConfig from baseline config + explored tension
  var exploredMainsT = bl.mainsTension;
  var exploredCrossesT = bl.crossesTension;
  var dim = tuneState.hybridDimension || 'linked';
  var t = tuneState.exploredTension;

  if (dim === 'linked') {
    var diff = bl.mainsTension - bl.crossesTension;
    exploredMainsT = t;
    exploredCrossesT = Math.max(0, t - diff);
  } else if (dim === 'mains') {
    exploredMainsT = t;
  } else {
    exploredCrossesT = t;
  }

  var sc;
  if (bl.isHybrid) {
    var mainsStr = STRINGS.find(function(s) { return s.id === bl.mainsId; });
    var crossesStr = STRINGS.find(function(s) { return s.id === bl.crossesId; });
    if (!mainsStr || !crossesStr) return;
    sc = { isHybrid: true, mains: mainsStr, crosses: crossesStr, mainsTension: exploredMainsT, crossesTension: exploredCrossesT };
  } else {
    var str = STRINGS.find(function(s) { return s.id === bl.stringId; });
    if (!str) return;
    sc = { isHybrid: false, string: str, mainsTension: exploredMainsT, crossesTension: exploredCrossesT };
  }

  var stats = predictSetup(racquet, sc);
  var tCtx = buildTensionContext(sc, racquet);
  var obs = computeCompositeScore(stats, tCtx);
  var identity = generateIdentity(stats, racquet, sc);

  tuneState.explored = {
    stats: stats,
    obs: +obs.toFixed(1),
    identity: identity,
    mainsTension: exploredMainsT,
    crossesTension: exploredCrossesT
  };

  // Show/hide apply button
  _updateTuneApplyButton();
}

function _updateTuneApplyButton() {
  var btn = document.getElementById('tune-apply-btn');
  if (!btn) return;
  if (!tuneState.baseline || !tuneState.explored) { btn.classList.add('hidden'); return; }
  var bl = tuneState.baseline;
  var ex = tuneState.explored;
  var changed = Math.abs(ex.obs - bl.obs) > 0.05;
  if (changed) {
    btn.classList.remove('hidden');
    var delta = ex.obs - bl.obs;
    var sign = delta > 0 ? '+' : '';
    btn.textContent = 'Apply changes (' + sign + delta.toFixed(1) + ' OBS)';
  } else {
    btn.classList.add('hidden');
  }
}

function tuneSandboxCommit() {
  if (!tuneState.explored || !activeLoadout) return;

  // Write explored tension back to dock inputs
  var ex = tuneState.explored;
  var bl = tuneState.baseline;
  var dim = tuneState.hybridDimension || 'linked';

  if (activeLoadout.isHybrid || bl.isHybrid) {
    var mInput = document.getElementById('input-tension-mains');
    var xInput = document.getElementById('input-tension-crosses');
    if (mInput) mInput.value = ex.mainsTension;
    if (xInput) xInput.value = ex.crossesTension;
  } else {
    var fmInput = document.getElementById('input-tension-full-mains');
    var fxInput = document.getElementById('input-tension-full-crosses');
    if (fmInput) fmInput.value = ex.mainsTension;
    if (fxInput) fxInput.value = ex.crossesTension;
  }

  // Now commit to activeLoadout via canonical path
  commitEditorToLoadout();

  // Re-snapshot baseline from the now-committed loadout
  tuneState.baseline = null; // force re-snapshot
  var setup = getCurrentSetup();
  if (setup) initTuneMode(setup);

  // Hide apply button immediately
  var btn = document.getElementById('tune-apply-btn');
  if (btn) btn.classList.add('hidden');

  // Update dock + overview
  renderDockPanel();
  renderDashboard();
}

function renderTuneHybridToggle(stringConfig) {
  const container = $('#tune-hybrid-toggle');
  // Show toggle for both hybrid AND Full Bed (which now has independent tensions)
  const hasSplitTensions = stringConfig.isHybrid || (stringConfig.mainsTension !== undefined && stringConfig.crossesTension !== undefined);
  if (!hasSplitTensions) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  container.style.display = 'flex';
  container.innerHTML = `
    <button class="tune-dim-btn ${tuneState.hybridDimension === 'linked' ? 'active' : ''}" data-dim="linked">Linked</button>
    <button class="tune-dim-btn ${tuneState.hybridDimension === 'mains' ? 'active' : ''}" data-dim="mains">Mains</button>
    <button class="tune-dim-btn ${tuneState.hybridDimension === 'crosses' ? 'active' : ''}" data-dim="crosses">Crosses</button>
  `;
  container.querySelectorAll('.tune-dim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tuneState.hybridDimension = btn.dataset.dim;
      container.querySelectorAll('.tune-dim-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Re-run sweep with new dimension
      const setup = getCurrentSetup();
      if (setup) {
        // Recalculate baseline for the new dimension
        tuneState.baselineTension = getHybridBaselineTension(setup.stringConfig, tuneState.hybridDimension);
        tuneState.exploredTension = tuneState.baselineTension;
        const slider = $('#tune-slider');
        slider.value = tuneState.baselineTension;
        updateSliderLabel();
        updateDeltaTitle(setup.stringConfig);

        runTensionSweep(setup);
        calculateOptimalWindow(setup);
        renderOptimalBuildWindow();
        renderDeltaVsBaseline();
        renderBaselineMarker(parseInt(slider.min), parseInt(slider.max));
        renderOptimalZone(parseInt(slider.min), parseInt(slider.max));
        renderSweepChart(setup);
        renderBestValueMove();
      }
    });
  });
}

// Bi-directional sync: when Tune slider changes, update main tension inputs
function syncTuneToMain(tension) {
  const setup = getCurrentSetup();
  if (!setup) return;
  const { stringConfig } = setup;

  if (stringConfig.isHybrid) {
    const diff = stringConfig.mainsTension - stringConfig.crossesTension;
    if (tuneState.hybridDimension === 'mains') {
      $('#input-tension-mains').value = tension;
    } else if (tuneState.hybridDimension === 'crosses') {
      $('#input-tension-crosses').value = tension;
    } else {
      $('#input-tension-mains').value = tension;
      $('#input-tension-crosses').value = tension - diff;
    }
  } else {
    // Full Bed: independent tensions with dimension toggle
    const diff = stringConfig.mainsTension - stringConfig.crossesTension;
    if (tuneState.hybridDimension === 'mains') {
      $('#input-tension-full-mains').value = tension;
    } else if (tuneState.hybridDimension === 'crosses') {
      $('#input-tension-full-crosses').value = tension;
    } else {
      // Linked: maintain differential
      $('#input-tension-full-mains').value = tension;
      $('#input-tension-full-crosses').value = tension - diff;
    }
  }
  tuneState.baselineTension = tension;
  tuneState.exploredTension = tension;
  renderDashboard();
}

// Apply explored tension as new baseline
function applyExploredTension() {
  syncTuneToMain(tuneState.exploredTension);
  // Re-init with new baseline
  const setup = getCurrentSetup();
  if (setup) initTuneMode(setup);
}

// Compare page entry: open tune for a specific comparison slot
function openTuneForSlot(slotIndex) {
  const slot = comparisonSlots[slotIndex];
  if (!slot || !slot.stats) return;

  // Load slot config into main page first
  const racquet = RACQUETS.find(r => r.id === slot.racquetId);
  if (!racquet) return;

  ssInstances['select-racquet']?.setValue(slot.racquetId);
  showFrameSpecs(racquet);

  if (slot.isHybrid) {
    setHybridMode(true);
    ssInstances['select-string-mains']?.setValue(slot.mainsId);
    populateGaugeDropdown(document.getElementById('gauge-select-mains'), slot.mainsId);
    $('#input-tension-mains').value = slot.mainsTension;
    ssInstances['select-string-crosses']?.setValue(slot.crossesId);
    populateGaugeDropdown(document.getElementById('gauge-select-crosses'), slot.crossesId);
    $('#input-tension-crosses').value = slot.crossesTension;
  } else {
    setHybridMode(false);
    ssInstances['select-string-full']?.setValue(slot.stringId);
    populateGaugeDropdown(document.getElementById('gauge-select-full'), slot.stringId);
    $('#input-tension-full-mains').value = slot.mainsTension;
    $('#input-tension-full-crosses').value = slot.crossesTension;
  }
  renderDashboard();

  // Now switch to tune mode
  if (currentMode !== 'tune') {
    switchMode('tune');
  } else {
    // Already in tune mode, just re-init
    const setup = getCurrentSetup();
    if (setup) initTuneMode(setup);
  }
}

// ============================================
// THEME TOGGLE (imported from src/ui/theme.js)
// ============================================

import { toggleTheme as _toggleThemeBase, getTheme, setTheme, initTheme } from './src/ui/theme.js';

// Wrapper that provides app-specific callbacks to the theme module
function toggleTheme() {
  const callbacks = {
    refreshSlotColors: () => { SLOT_COLORS = getSlotColors(); },
    refreshRadarChart: () => {
      if (currentRadarChart) {
        const setup = getCurrentSetup();
        if (setup) {
          const stats = predictSetup(setup.racquet, setup.stringConfig);
          renderRadarChart(stats);
        }
      }
    },
    refreshComparison: () => {
      if (comparisonRadarChart) {
        updateComparisonRadar();
        renderComparisonSlots();
      }
    },
    refreshSweepChart: () => {
      if (sweepChart) {
        sweepChart.destroy();
        sweepChart = null;
        const setup = getCurrentSetup();
        if (setup) renderSweepChart(setup);
      }
    }
  };
  
  const state = {
    currentMode,
    hasSweepChart: !!sweepChart
  };
  
  _toggleThemeBase(callbacks, state);
}

// ============================================
// EVENT LISTENERS
// ============================================

let _initCalled = false;

function init() {
  // Prevent duplicate event listener attachment
  if (_initCalled) return;
  _initCalled = true;
  
  // Populate searchable dropdowns (onChange callbacks handle dashboard re-render)
  populateRacquetDropdown($('#select-racquet'));
  populateStringDropdown($('#select-string-full'));
  populateStringDropdown($('#select-string-mains'));
  populateStringDropdown($('#select-string-crosses'));

  // Tension inputs — route through commitEditorToLoadout when active loadout exists
  $('#input-tension-full-mains').addEventListener('input', _onEditorChange);
  $('#input-tension-full-crosses').addEventListener('input', _onEditorChange);
  $('#input-tension-mains').addEventListener('input', _onEditorChange);
  $('#input-tension-crosses').addEventListener('input', _onEditorChange);

  // String mode toggle (Fix 3: with confirmation and pre-populate)
  $('#btn-full').addEventListener('click', () => {
    _handleHybridToggle(false);
  });
  $('#btn-hybrid').addEventListener('click', () => {
    _handleHybridToggle(true);
  });

  // Presets (dynamic) — Quick Presets section removed from dock, but keep comparison presets
  renderComparisonPresets();
  var _btnSavePreset = document.getElementById('btn-save-preset');
  if (_btnSavePreset) _btnSavePreset.addEventListener('click', saveCurrentAsPreset);

  // Comparison
  $('#btn-add-slot').addEventListener('click', addComparisonSlot);

  // Mode switcher buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode) switchMode(mode);
    });
  });

  // Mobile tab bar buttons
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode) switchMode(mode);
    });
  });
  // Mobile header info button
  const mobileInfoBtn = document.getElementById('btn-mode-howitworks-mobile');
  if (mobileInfoBtn) mobileInfoBtn.addEventListener('click', () => switchMode('howitworks'));

  // Tune slider
  $('#tune-slider').addEventListener('input', onTuneSliderInput);

  // Theme
  $('#btn-theme').addEventListener('click', toggleTheme);

  // Set initial mode — hide all non-default sections
  document.getElementById('mode-tune')?.classList.add('hidden');
  document.getElementById('mode-compare')?.classList.add('hidden');
  document.getElementById('mode-optimize')?.classList.add('hidden');
  document.getElementById('mode-compendium')?.classList.add('hidden');
  document.getElementById('mode-howitworks')?.classList.add('hidden');
  // Overview stays visible as the default landing page

  // Load saved loadouts from storage
  savedLoadouts = loadSavedLoadouts();
  _stateSetSavedLoadouts(savedLoadouts);
  
  // Restore active loadout from storage (if exists and not a shared build)
  try {
    const activeId = _store ? _store.getItem('tll-active-loadout-id') : null;
    if (activeId && savedLoadouts.length > 0) {
      const saved = savedLoadouts.find(l => l.id === activeId);
      if (saved) {
        activeLoadout = Object.assign({}, saved);
        activeLoadout._dirty = false;
        _stateSetActiveLoadout(activeLoadout);
        hydrateDock(activeLoadout);
      }
    }
  } catch(e) {}

  // Check for shared build URL (must run after data + functions are ready)
  var hadSharedBuild = _handleSharedBuildURL();

  // Render the dashboard (shows search landing if no setup)
  renderDashboard();

  // If we loaded a shared build, switch to overview to show it
  if (hadSharedBuild) {
    switchMode('overview');
  }

  // Initialize dock panel
  renderDockPanel();

  // Initialize landing search
  _initLandingSearch();

  // Sync mobile tab bar to initial active mode (currentMode defaults to 'overview')
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === currentMode);
  });
}

// ============================================
// LANDING SEARCH
// ============================================

function _initLandingSearch() {
  var searchEl = document.getElementById('landing-search');
  var dropdownEl = document.getElementById('landing-search-dropdown');
  if (!searchEl || !dropdownEl) return;

  var selectedIdx = -1;

  function renderResults(query) {
    if (!query || query.length < 1) {
      dropdownEl.classList.add('hidden');
      selectedIdx = -1;
      return;
    }
    var q = query.toLowerCase();
    var matches = RACQUETS.filter(function(r) {
      return r.name.toLowerCase().indexOf(q) >= 0 ||
             (r.identity && r.identity.toLowerCase().indexOf(q) >= 0) ||
             r.id.toLowerCase().indexOf(q) >= 0;
    }).slice(0, 10);

    if (matches.length === 0) {
      dropdownEl.innerHTML = '<div class="landing-dd-empty">No frames found</div>';
      dropdownEl.classList.remove('hidden');
      selectedIdx = -1;
      return;
    }

    selectedIdx = -1;
    dropdownEl.innerHTML = matches.map(function(r, i) {
      return '<div class="landing-dd-item" data-id="' + r.id + '" data-idx="' + i + '">' +
        '<span class="landing-dd-name">' + r.name + '</span>' +
        '<span class="landing-dd-meta">' + r.year + ' \u00b7 ' + (r.identity || '') + '</span>' +
      '</div>';
    }).join('');
    dropdownEl.classList.remove('hidden');

    dropdownEl.querySelectorAll('.landing-dd-item').forEach(function(el) {
      el.addEventListener('mousedown', function(e) {
        e.preventDefault();
        _landingSelectFrame(el.dataset.id);
      });
    });
  }

  function highlightItem(idx) {
    var items = dropdownEl.querySelectorAll('.landing-dd-item');
    items.forEach(function(el, i) {
      el.classList.toggle('landing-dd-active', i === idx);
    });
    if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
  }

  searchEl.addEventListener('input', function() {
    renderResults(searchEl.value);
  });

  searchEl.addEventListener('focus', function() {
    if (searchEl.value.length > 0) renderResults(searchEl.value);
  });

  searchEl.addEventListener('blur', function() {
    setTimeout(function() { dropdownEl.classList.add('hidden'); }, 150);
  });

  searchEl.addEventListener('keydown', function(e) {
    var items = dropdownEl.querySelectorAll('.landing-dd-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
      highlightItem(selectedIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, 0);
      highlightItem(selectedIdx);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && items[selectedIdx]) {
        _landingSelectFrame(items[selectedIdx].dataset.id);
      } else if (items.length > 0) {
        _landingSelectFrame(items[0].dataset.id);
      }
    } else if (e.key === 'Escape') {
      dropdownEl.classList.add('hidden');
      searchEl.blur();
    }
  });
}

function _landingSelectFrame(racquetId) {
  // Switch to Racket Bible and select the frame
  if (!_compendiumInitialized) {
    initCompendium();
    _compendiumInitialized = true;
  }
  _compSelectFrame(racquetId);
  switchMode('compendium');

  // Also scroll the roster to highlight
  setTimeout(function() {
    var item = document.querySelector('#comp-frame-list > button[data-id="' + racquetId + '"]');
    if (item) item.scrollIntoView({ block: 'center' });
  }, 100);

  // Clear the search
  var searchEl = document.getElementById('landing-search');
  if (searchEl) searchEl.value = '';
  var dropdown = document.getElementById('landing-search-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
}

/* ============================================
   RESPONSIVE HEADER — move mode-switcher on ≤1024px
   ============================================ */
function handleResponsiveHeader() {
  const switcher = document.getElementById('mode-switcher');
  const dockRegion = document.querySelector('.header-dock-region');
  const workspaceRegion = document.querySelector('.header-workspace-region');
  if (!switcher || !dockRegion || !workspaceRegion) return;

  const mql = window.matchMedia('(max-width: 1024px)');

  function onBreakpoint(e) {
    if (e.matches) {
      // Mobile/tablet: move switcher into dock-region
      if (!dockRegion.contains(switcher)) {
        dockRegion.appendChild(switcher);
      }
    } else {
      // Desktop: move switcher back into workspace-region .header-actions
      const actions = workspaceRegion.querySelector('.header-actions');
      if (actions && !actions.contains(switcher)) {
        actions.insertBefore(switcher, actions.querySelector('#btn-theme'));
      }
    }
  }

  mql.addEventListener('change', onBreakpoint);
  onBreakpoint(mql); // run on load
}

// ============================================
// OPTIMIZE MODE — Build Optimizer / Workbench
// ============================================

// --- Optimizer state ---
let _optExcludedStringIds = new Set();

function initOptimize() {
  // --- Searchable frame selector ---
  const frameSearch = document.getElementById('opt-frame-search');
  const frameDropdown = document.getElementById('opt-frame-dropdown');
  const frameValue = document.getElementById('opt-frame-value');

  // Set default to active loadout frame, or current setup frame
  const currentSetup = getCurrentSetup();
  if (activeLoadout && activeLoadout.frameId) {
    const loFrame = RACQUETS.find(r => r.id === activeLoadout.frameId);
    if (loFrame) {
      frameSearch.value = loFrame.name;
      frameValue.value = loFrame.id;
    } else {
      frameSearch.value = '';
      frameValue.value = '';
    }
  } else if (currentSetup) {
    frameSearch.value = currentSetup.racquet.name;
    frameValue.value = currentSetup.racquet.id;
  } else {
    frameSearch.value = '';
    frameValue.value = '';
  }

  _initOptSearchable(frameSearch, frameDropdown, frameValue,
    () => RACQUETS.map(r => ({ id: r.id, name: r.name }))
  );

  // --- Material filter (multi-select dropdown) ---
  const materials = [...new Set(STRINGS.map(s => s.material))].sort();
  const matContainer = document.getElementById('opt-material-checks');
  materials.forEach(mat => {
    const item = document.createElement('label');
    item.className = 'opt-ms-item active';
    item.innerHTML = `<input type="checkbox" checked value="${mat}"><span>${mat}</span>`;
    item.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') return;
      item.classList.toggle('active', e.target.checked);
      _updateOptMSLabel('opt-material-checks', 'opt-material-ms-label', 'material', materials.length);
    });
    matContainer.appendChild(item);
  });
  _updateOptMSLabel('opt-material-checks', 'opt-material-ms-label', 'material', materials.length);

  // --- Brand filter (multi-select dropdown) ---
  const brands = [...new Set(STRINGS.map(s => s.name.split(' ')[0]))].sort();
  const brandContainer = document.getElementById('opt-brand-checks');
  brands.forEach(brand => {
    const item = document.createElement('label');
    item.className = 'opt-ms-item active';
    item.innerHTML = `<input type="checkbox" checked value="${brand}"><span>${brand}</span>`;
    item.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') return;
      item.classList.toggle('active', e.target.checked);
      _updateOptMSLabel('opt-brand-checks', 'opt-brand-ms-label', 'brand', brands.length);
    });
    brandContainer.appendChild(item);
  });
  _updateOptMSLabel('opt-brand-checks', 'opt-brand-ms-label', 'brand', brands.length);

  // --- Exclude strings searchable ---
  const exSearch = document.getElementById('opt-exclude-search');
  const exDropdown = document.getElementById('opt-exclude-dropdown');
  _initOptSearchable(exSearch, exDropdown, null,
    () => STRINGS.filter(s => !_optExcludedStringIds.has(s.id)).map(s => ({ id: s.id, name: s.name })),
    (id, name) => {
      _optExcludedStringIds.add(id);
      _renderExcludeTags();
      exSearch.value = '';
    }
  );

  // --- Hybrid lock: show/hide based on setup type ---
  const lockSection = document.getElementById('opt-hybrid-lock-section');
  const lockSide = document.getElementById('opt-lock-side');
  const lockStringWrap = document.getElementById('opt-lock-string-wrap');
  const lockSearch = document.getElementById('opt-lock-string-search');
  const lockDropdown = document.getElementById('opt-lock-string-dropdown');
  const lockValue = document.getElementById('opt-lock-string-value');

  _initOptSearchable(lockSearch, lockDropdown, lockValue,
    () => STRINGS.map(s => ({ id: s.id, name: s.name }))
  );

  lockSide.addEventListener('change', () => {
    lockStringWrap.classList.toggle('hidden', lockSide.value === 'none');
    if (lockSide.value === 'none') lockValue.value = '';
  });

  // Show hybrid lock only when type is hybrid or both
  document.querySelectorAll('.opt-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.opt-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.value;
      lockSection.classList.toggle('hidden', type === 'full');
    });
  });

  // Wire run button
  document.getElementById('opt-run-btn').addEventListener('click', runOptimizer);

  // Wire upgrade mode checkbox
  document.getElementById('opt-upgrade-mode').addEventListener('change', (e) => {
    document.getElementById('opt-upgrade-fields').classList.toggle('hidden', !e.target.checked);
  });

  // Wire sort change to re-sort existing results
  document.getElementById('opt-sort').addEventListener('change', () => {
    if (_optLastCandidates && _optLastCandidates.length > 0) {
      const sortBy = document.getElementById('opt-sort').value;
      _optLastCandidates.sort((a, b) => {
        if (sortBy === 'obs') return b.score - a.score;
        return (b.stats[sortBy] || 0) - (a.stats[sortBy] || 0);
      });
      renderOptimizerResults(_optLastCandidates, sortBy, _optLastCurrentOBS);
    }
  });

  // Mobile: inject filter toggle button (collapses filter panel on narrow screens)
  if (!document.getElementById('opt-filter-toggle')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'opt-filter-toggle';
    toggleBtn.className = 'opt-filter-toggle';
    toggleBtn.innerHTML = `<span>Filters</span><svg class="opt-filter-toggle-icon" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4.5h10M4 7h6M6 9.5h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    const optLayout = document.querySelector('.opt-layout');
    const optFilters = document.getElementById('opt-filters');
    if (optLayout && optFilters) {
      optLayout.insertBefore(toggleBtn, optFilters);
      toggleBtn.addEventListener('click', () => {
        const filters = document.getElementById('opt-filters');
        const isCollapsed = filters.classList.toggle('opt-filters-collapsed');
        toggleBtn.classList.toggle('filters-open', !isCollapsed);
      });
      // Start collapsed on mobile
      if (window.matchMedia('(max-width: 1024px)').matches) {
        optFilters.classList.add('opt-filters-collapsed');
      }
    }
  }
}

// --- Searchable dropdown helper ---
// --- Optimizer multi-select dropdown helpers ---
function _toggleOptMS(msId) {
  var ms = document.getElementById(msId);
  if (!ms) return;
  var dd = ms.querySelector('.opt-ms-dropdown');
  if (dd) dd.classList.toggle('hidden');
  // Close other open dropdowns
  document.querySelectorAll('.opt-multiselect .opt-ms-dropdown').forEach(function(d) {
    if (d !== dd) d.classList.add('hidden');
  });
}

function _updateOptMSLabel(containerId, labelId, noun, total) {
  var checked = document.querySelectorAll('#' + containerId + ' input:checked').length;
  var el = document.getElementById(labelId);
  if (!el) return;
  if (checked === total) {
    el.textContent = 'All ' + noun + 's';
  } else if (checked === 0) {
    el.textContent = 'No ' + noun + 's';
  } else {
    el.textContent = checked + ' of ' + total + ' ' + noun + 's';
  }
}

// Close opt dropdowns on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('.opt-multiselect')) {
    document.querySelectorAll('.opt-ms-dropdown').forEach(function(d) { d.classList.add('hidden'); });
  }
});

function _initOptSearchable(inputEl, dropdownEl, hiddenEl, getItems, onSelect) {
  let isOpen = false;

  function render(q) {
    const items = getItems();
    const filtered = q ? items.filter(i => i.name.toLowerCase().includes(q.toLowerCase())) : items;
    if (filtered.length === 0) {
      dropdownEl.classList.add('hidden');
      return;
    }
    dropdownEl.innerHTML = filtered.slice(0, 30).map(i =>
      `<div class="opt-search-item" data-id="${i.id}">${i.name}</div>`
    ).join('');
    dropdownEl.classList.remove('hidden');
    isOpen = true;

    dropdownEl.querySelectorAll('.opt-search-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const id = item.dataset.id;
        const name = item.textContent;
        if (hiddenEl) hiddenEl.value = id;
        inputEl.value = name;
        dropdownEl.classList.add('hidden');
        isOpen = false;
        if (onSelect) onSelect(id, name);
      });
    });
  }

  inputEl.addEventListener('focus', () => render(inputEl.value));
  inputEl.addEventListener('input', () => render(inputEl.value));
  inputEl.addEventListener('blur', () => {
    setTimeout(() => { dropdownEl.classList.add('hidden'); isOpen = false; }, 150);
  });
}

// --- Render exclude tags ---
function _renderExcludeTags() {
  const container = document.getElementById('opt-exclude-tags');
  container.innerHTML = Array.from(_optExcludedStringIds).map(id => {
    const s = STRINGS.find(x => x.id === id);
    return `<span class="opt-exclude-tag">${s ? s.name : id}<span class="opt-exclude-x" data-id="${id}">×</span></span>`;
  }).join('');
  container.querySelectorAll('.opt-exclude-x').forEach(x => {
    x.addEventListener('click', () => {
      _optExcludedStringIds.delete(x.dataset.id);
      _renderExcludeTags();
    });
  });
}

let _optLastCandidates = null;
let _optLastCurrentOBS = 0;

function runOptimizer() {
  const resultsEl = document.getElementById('opt-results');
  const countEl = document.getElementById('opt-results-count');

  // Fix 5: Clear tension filter when running new optimization
  _optClearTensionFilter();

  // Show loading
  resultsEl.innerHTML = '<div class="opt-loading">Computing builds…</div>';

  // Use requestAnimationFrame to allow the loading indicator to paint
  requestAnimationFrame(() => { setTimeout(() => { _runOptimizerCore(resultsEl, countEl); }, 16); });
}

function _runOptimizerCore(resultsEl, countEl) {
  // Read filters
  const frameSelVal = document.getElementById('opt-frame-value').value;
  const setupType = document.querySelector('.opt-toggle.active')?.dataset.value || 'both';

  // Material filter: get checked materials
  const allowedMaterials = new Set(
    Array.from(document.querySelectorAll('#opt-material-checks input:checked')).map(cb => cb.value)
  );

  // Brand filter: get checked brands
  const allowedBrands = new Set(
    Array.from(document.querySelectorAll('#opt-brand-checks input:checked')).map(cb => cb.value)
  );

  // Hybrid lock
  const lockSide = document.getElementById('opt-lock-side')?.value || 'none';
  const lockStringId = document.getElementById('opt-lock-string-value')?.value || '';
  const lockedString = lockStringId ? STRINGS.find(s => s.id === lockStringId) : null;

  // Filter strings by material, brand, and exclude list
  function isStringAllowed(s) {
    if (_optExcludedStringIds.has(s.id)) return false;
    if (!allowedMaterials.has(s.material)) return false;
    if (!allowedBrands.has(s.name.split(' ')[0])) return false;
    return true;
  }
  const filteredStrings = STRINGS.filter(isStringAllowed);
  const sortBy = document.getElementById('opt-sort').value;
  const tensionMin = parseInt(document.getElementById('opt-tension-min').value) || 40;
  const tensionMax = parseInt(document.getElementById('opt-tension-max').value) || 65;
  const upgradeMode = document.getElementById('opt-upgrade-mode').checked;

  // Stat minimums
  const mins = {
    spin: parseInt(document.getElementById('opt-min-spin').value) || 0,
    control: parseInt(document.getElementById('opt-min-control').value) || 0,
    power: parseInt(document.getElementById('opt-min-power').value) || 0,
    comfort: parseInt(document.getElementById('opt-min-comfort').value) || 0,
    feel: parseInt(document.getElementById('opt-min-feel').value) || 0,
    durability: parseInt(document.getElementById('opt-min-durability').value) || 0,
    playability: parseInt(document.getElementById('opt-min-playability').value) || 0,
    stability: parseInt(document.getElementById('opt-min-stability').value) || 0,
    maneuverability: parseInt(document.getElementById('opt-min-maneuverability').value) || 0
  };

  // Upgrade constraints
  const upgradeOBS = parseFloat(document.getElementById('opt-upgrade-obs').value) || 0;
  const upgradeCtlLoss = parseFloat(document.getElementById('opt-upgrade-ctl-loss').value) || 5;
  const upgradeDurLoss = parseFloat(document.getElementById('opt-upgrade-dur-loss').value) || 10;

  // Get selected frame
  let racquet;
  if (frameSelVal === 'current' || !frameSelVal) {
    // Use active loadout frame, or current setup frame, or first frame
    if (activeLoadout && activeLoadout.frameId) {
      racquet = RACQUETS.find(r => r.id === activeLoadout.frameId) || RACQUETS[0];
    } else {
      const setup = getCurrentSetup();
      racquet = setup ? setup.racquet : RACQUETS[0];
    }
  } else {
    racquet = RACQUETS.find(r => r.id === frameSelVal) || RACQUETS[0];
  }

  // Compute current build OBS for deltas
  let currentOBS = 0;
  let currentStats = null;
  const currentSetup = getCurrentSetup();
  if (currentSetup) {
    currentStats = predictSetup(currentSetup.racquet, currentSetup.stringConfig);
    if (currentStats) {
      const tCtx = buildTensionContext(currentSetup.stringConfig, currentSetup.racquet);
      currentOBS = computeCompositeScore(currentStats, tCtx);
    }
  }

  const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
  const sweepMin = Math.max(tensionMin, 30);
  const sweepMax = Math.min(tensionMax, 75);

  // Helper: find optimal tension for a config within range
  function findOptimalTension(buildConfig) {
    let bestScore = -1, bestTension = midTension, bestStats = null;
    for (let t = sweepMin; t <= sweepMax; t += 1) {
      const cfg = { ...buildConfig };
      cfg.mainsTension = t;
      cfg.crossesTension = t - (buildConfig.isHybrid ? 2 : 0);
      const stats = predictSetup(racquet, cfg);
      if (!stats) continue;
      const tCtx = buildTensionContext(cfg, racquet);
      const score = computeCompositeScore(stats, tCtx);
      if (score > bestScore) {
        bestScore = score;
        bestTension = t;
        bestStats = stats;
      }
    }
    return { score: bestScore, tension: bestTension, stats: bestStats };
  }

  let candidates = [];

  // --- FULL BED candidates ---
  if (setupType === 'full' || setupType === 'both') {
    filteredStrings.forEach(s => {
      const result = findOptimalTension({ isHybrid: false, string: s });
      if (result.stats) {
        candidates.push({
          type: 'full',
          label: s.name,
          gauge: (s.gauge || '').replace(/\s*\(.*\)/, ''),
          tension: result.tension,
          crossesTension: result.tension,
          score: result.score,
          stats: result.stats,
          stringData: s,
          racquet: racquet
        });
      }
    });
  }

  // --- HYBRID candidates ---
  if (setupType === 'hybrid' || setupType === 'both') {
    let hybridMainsPool, hybridCrossesPool;

    if (lockSide === 'mains' && lockedString) {
      // Locked mains: sweep all filtered crosses
      hybridMainsPool = [lockedString];
      hybridCrossesPool = filteredStrings.filter(s => s.id !== lockedString.id);
    } else if (lockSide === 'crosses' && lockedString) {
      // Locked crosses: sweep all filtered mains
      hybridMainsPool = filteredStrings;
      hybridCrossesPool = [lockedString];
    } else {
      // No lock: smart pairing — top 12 mains + gut/multi, suitable crosses
      const tempFullForRanking = [];
      filteredStrings.forEach(s => {
        const result = findOptimalTension({ isHybrid: false, string: s });
        if (result.stats) tempFullForRanking.push({ stringId: s.id, score: result.score });
      });
      tempFullForRanking.sort((a, b) => b.score - a.score);
      const topMainsIds = new Set(tempFullForRanking.slice(0, 12).map(c => c.stringId));
      filteredStrings.forEach(s => {
        if (s.material === 'Natural Gut' || s.material === 'Multifilament') topMainsIds.add(s.id);
      });
      hybridMainsPool = filteredStrings.filter(s => topMainsIds.has(s.id));

      // Cross candidates: round/slick/elastic/soft polys from filtered pool
      hybridCrossesPool = filteredStrings.filter(s => {
        const shape = (s.shape || '').toLowerCase();
        const isRoundSlick = shape.includes('round') || shape.includes('slick') || shape.includes('coated');
        const isElastic = s.material === 'Co-Polyester (elastic)';
        const isSoftPoly = s.material === 'Polyester' && s.stiffness < 200;
        return isRoundSlick || isElastic || isSoftPoly;
      });
    }

    hybridMainsPool.forEach(mains => {
      hybridCrossesPool.forEach(cross => {
        if (cross.id === mains.id) return;
        const result = findOptimalTension({ isHybrid: true, mains, crosses: cross });
        if (result.stats && result.score > 0) {
          candidates.push({
            type: 'hybrid',
            label: `${mains.name} / ${cross.name}`,
            gauge: ((mains.gauge || '').replace(/\s*\(.*\)/, '') + '/' + (cross.gauge || '').replace(/\s*\(.*\)/, '')),
            tension: result.tension,
            crossesTension: result.tension - 2,
            score: result.score,
            stats: result.stats,
            mainsData: mains,
            crossesData: cross,
            racquet: racquet
          });
        }
      });
    });
  }

  // --- Filter by stat minimums ---
  candidates = candidates.filter(c => {
    return c.stats.spin >= mins.spin &&
           c.stats.control >= mins.control &&
           c.stats.power >= mins.power &&
           c.stats.comfort >= mins.comfort &&
           c.stats.feel >= mins.feel &&
           c.stats.durability >= mins.durability &&
           c.stats.playability >= mins.playability &&
           c.stats.stability >= mins.stability &&
           c.stats.maneuverability >= mins.maneuverability;
  });

  // --- Upgrade mode filtering ---
  if (upgradeMode && currentStats) {
    candidates = candidates.filter(c => {
      if (c.score < currentOBS + upgradeOBS) return false;
      if (currentStats.control - c.stats.control > upgradeCtlLoss) return false;
      if (currentStats.durability - c.stats.durability > upgradeDurLoss) return false;
      return true;
    });
  }

  // --- Sort ---
  candidates.sort((a, b) => {
    if (sortBy === 'obs') return b.score - a.score;
    return (b.stats[sortBy] || 0) - (a.stats[sortBy] || 0);
  });

  // Store for re-sorting
  _optLastCandidates = candidates;
  _optLastCurrentOBS = currentOBS;

  countEl.textContent = `${candidates.length} result${candidates.length !== 1 ? 's' : ''}`;
  renderOptimizerResults(candidates, sortBy, currentOBS);
}

function renderOptimizerResults(candidates, sortBy, currentOBS) {
  const resultsEl = document.getElementById('opt-results');

  if (candidates.length === 0) {
    resultsEl.innerHTML = `
      <div class="opt-empty">
        <p class="opt-empty-title">No builds match your filters</p>
        <p class="opt-empty-sub">Try relaxing the stat minimums or expanding the tension range.</p>
      </div>`;
    return;
  }

  // Column highlight class
  const sortColClass = sortBy === 'obs' ? 'obs' : sortBy;

  // Fix 5: Target tension filter (client-side only)
  const targetTension = window._optTargetTension || '';

  // Filter candidates by target tension (±1 lb) if specified
  let displayCandidates = candidates;
  if (targetTension !== '' && !isNaN(parseInt(targetTension))) {
    const target = parseInt(targetTension);
    displayCandidates = candidates.filter(c => Math.abs(c.tension - target) <= 1);
  }

  const top = displayCandidates.slice(0, 200); // Cap at 200 rows for perf

  // Build tension filter UI
  let filterHTML = '<div class="opt-tension-filter">' +
    '<label class="opt-tension-label">Target Tension</label>' +
    '<input type="number" class="opt-tension-input" id="opt-tension-filter" ' +
      'value="' + (targetTension !== '' ? targetTension : '') + '" ' +
      'placeholder="All" min="30" max="70" ' +
      'onchange="_optApplyTensionFilter(this.value)" ' +
      'onkeyup="if(event.key===\'Enter\')_optApplyTensionFilter(this.value)">' +
    '<span class="opt-tension-hint">±1 lb</span>' +
    '<button class="opt-tension-clear" onclick="_optApplyTensionFilter(\'\')" ' +
      (targetTension === '' ? 'style="display:none"' : '') + '>Clear</button>' +
  '</div>';

  let html = filterHTML + '<div class="opt-table-wrap"><table class="opt-table">' +
    '<thead><tr>' +
      '<th class="opt-th opt-th-rank">#</th>' +
      '<th class="opt-th opt-th-type">Type</th>' +
      '<th class="opt-th opt-th-string">String(s)</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'obs' ? ' opt-th-active' : '') + '">OBS</th>' +
      '<th class="opt-th opt-th-num opt-th-delta">&Delta;</th>' +
      '<th class="opt-th opt-th-gauge">Ga.</th>' +
      '<th class="opt-th opt-th-tension">Tension</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'spin' ? ' opt-th-active' : '') + '">Spn</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'power' ? ' opt-th-active' : '') + '">Pwr</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'control' ? ' opt-th-active' : '') + '">Ctl</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'comfort' ? ' opt-th-active' : '') + '">Cmf</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'feel' ? ' opt-th-active' : '') + '">Fel</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'durability' ? ' opt-th-active' : '') + '">Dur</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'playability' ? ' opt-th-active' : '') + '">Ply</th>' +
      '<th class="opt-th opt-th-actions"></th>' +
    '</tr></thead><tbody>';

  top.forEach((c, i) => {
    const delta = c.score - currentOBS;
    const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
    const deltaCls = delta > 0.5 ? 'opt-delta-pos' : delta < -0.5 ? 'opt-delta-neg' : 'opt-delta-neutral';
    const tensionLabel = c.type === 'hybrid' ? `${c.tension}/${c.crossesTension}` : `${c.tension}`;
    const typeTag = c.type === 'hybrid' ? '<span class="opt-tag-hybrid">H</span>' : '<span class="opt-tag-full">F</span>';
    const idx = i;

    html += `<tr class="opt-row${i === 0 ? ' opt-row-top' : ''}" data-opt-idx="${idx}">
      <td class="opt-td opt-td-rank">${i + 1}</td>
      <td class="opt-td opt-td-type">${typeTag}</td>
      <td class="opt-td opt-td-string">${c.label}</td>
      <td class="opt-td opt-td-num opt-td-obs" style="color:${getObsScoreColor(c.score)};font-weight:700">${c.score.toFixed(1)}</td>
      <td class="opt-td opt-td-num ${deltaCls}">${deltaStr}</td>
      <td class="opt-td opt-td-gauge">${c.gauge || '—'}</td>
      <td class="opt-td opt-td-tension">${tensionLabel}</td>
      <td class="opt-td opt-td-num">${c.stats.spin?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.power?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.control?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.comfort?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.feel?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.durability?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.playability?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-actions">
        <button class="opt-act-btn" onclick="optActionView(${idx})">View</button>
        <button class="opt-act-btn" onclick="optActionTune(${idx})">Tune</button>
        <button class="opt-act-btn" onclick="optActionCompare(${idx})">Compare</button>
        <button class="opt-act-btn opt-act-save" onclick="optActionSave(${idx})">Save</button>
      </td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  resultsEl.innerHTML = html;
}

// Fix 5: Apply target tension filter to optimizer results (client-side only)
function _optApplyTensionFilter(value) {
  window._optTargetTension = value;
  // Re-render with existing candidates
  if (_optLastCandidates && _optLastCandidates.length > 0) {
    // Get current sort from active header
    const sortBy = document.querySelector('.opt-th-active')?.textContent?.toLowerCase() || 'obs';
    renderOptimizerResults(_optLastCandidates, sortBy, _optLastCurrentOBS || 0);
  }
}

// Clear tension filter when running new optimization
function _optClearTensionFilter() {
  window._optTargetTension = '';
}

// --- Row action handlers ---

function _optBuildPresetData(candidate) {
  const c = candidate;
  if (c.type === 'hybrid') {
    return {
      id: 'opt-' + Date.now(),
      name: c.label + ' on ' + c.racquet.name,
      racquetId: c.racquet.id,
      isHybrid: true,
      mainsId: c.mainsData.id,
      crossesId: c.crossesData.id,
      mainsTension: c.tension,
      crossesTension: c.crossesTension,
      stringId: null
    };
  } else {
    return {
      id: 'opt-' + Date.now(),
      name: c.label + ' on ' + c.racquet.name,
      racquetId: c.racquet.id,
      isHybrid: false,
      mainsId: null,
      crossesId: null,
      mainsTension: c.tension,
      crossesTension: c.tension,
      stringId: c.stringData.id
    };
  }
}

function optActionView(idx) {
  const c = _optLastCandidates[idx];
  if (!c) return;
  const preset = _optBuildPresetData(c);
  loadPresetFromData(preset);
  switchMode('overview');
}

function optActionTune(idx) {
  const c = _optLastCandidates[idx];
  if (!c) return;
  const preset = _optBuildPresetData(c);
  loadPresetFromData(preset);
  switchMode('tune');
}

function optActionCompare(idx) {
  const c = _optLastCandidates[idx];
  if (!c) return;
  const preset = _optBuildPresetData(c);

  // Build a comparison slot from this candidate
  if (comparisonSlots.length >= 3) {
    comparisonSlots.pop(); // remove last to make room
  }
  const slotData = {
    id: Date.now(),
    racquetId: preset.racquetId,
    stringId: preset.stringId || '',
    isHybrid: preset.isHybrid,
    mainsId: preset.mainsId || '',
    crossesId: preset.crossesId || '',
    mainsTension: preset.mainsTension,
    crossesTension: preset.crossesTension,
    stats: null,
    identity: null
  };
  comparisonSlots.push(slotData);
  recalcSlot(comparisonSlots.length - 1);
  switchMode('compare');
  renderComparisonSlots();
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  updateComparisonRadar();
}

function optActionSave(idx) {
  const c = _optLastCandidates[idx];
  if (!c) return;
  const preset = _optBuildPresetData(c);
  
  // Create a proper loadout and save it
  var opts = { source: 'optimize' };
  if (preset.isHybrid) {
    opts.isHybrid = true;
    opts.mainsId = preset.mainsId;
    opts.crossesId = preset.crossesId;
    opts.crossesTension = preset.crossesTension;
  }
  var lo = createLoadout(preset.racquetId, preset.isHybrid ? preset.mainsId : preset.stringId, preset.mainsTension, opts);
  if (lo) {
    saveLoadout(lo);
  }

  // Flash the save button in the row
  const btn = document.querySelector(`tr[data-opt-idx="${idx}"] .opt-act-btn:last-child`);
  if (btn) {
    btn.textContent = '✓';
    btn.classList.add('opt-act-saved');
    setTimeout(() => {
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M11.5 1H3.5A1.5 1.5 0 002 2.5v10A1.5 1.5 0 003.5 14h8a1.5 1.5 0 001.5-1.5v-10A1.5 1.5 0 0011.5 1z" stroke="currentColor" stroke-width="1.2"/><path d="M5 1v4h5V1" stroke="currentColor" stroke-width="1.2"/><path d="M5 10h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
      btn.classList.remove('opt-act-saved');
    }, 1200);
  }
}

// ============================================
// FIND MY BUILD — Guided Playstyle Wizard
// ============================================

let _fmbStep = 1;
const _fmbAnswers = { swing: null, ball: null, court: null, painPoints: [], priorities: [] };
let _fmbCurrentFrames = []; // stores ranked frame results for index-based action handlers

function openFindMyBuild() {
  _fmbStep = 1;
  _fmbAnswers.swing = null;
  _fmbAnswers.ball = null;
  _fmbAnswers.court = null;
  _fmbAnswers.painPoints = [];
  _fmbAnswers.priorities = [];

  // Reset all option selections
  document.querySelectorAll('.fmb-option').forEach(b => {
    b.classList.remove('selected');
    const badge = b.querySelector('.fmb-priority-badge');
    if (badge) badge.remove();
  });

  const wizard = document.getElementById('find-my-build');
  wizard.classList.remove('hidden');

  // Hide empty state content but keep wizard visible
  document.getElementById('empty-state').style.display = 'none';

  _fmbShowStep(1);
}

function closeFindMyBuild() {
  document.getElementById('find-my-build').classList.add('hidden');
  document.getElementById('empty-state').style.display = '';
}

function _fmbShowStep(step) {
  _fmbStep = step;
  const totalSteps = 5;

  // Update progress bar
  const pct = step === 'result' ? 100 : (step / totalSteps) * 100;
  document.getElementById('fmb-progress-fill').style.width = pct + '%';

  // Show/hide steps
  document.querySelectorAll('.fmb-step').forEach(el => {
    const s = el.dataset.step;
    el.classList.toggle('hidden', s !== String(step));
  });

  // Update nav buttons
  const backBtn = document.getElementById('fmb-back');
  const nextBtn = document.getElementById('fmb-next');

  if (step === 'result') {
    backBtn.style.display = '';
    nextBtn.style.display = 'none';
  } else {
    backBtn.style.display = step === 1 ? 'none' : '';
    nextBtn.style.display = '';
    nextBtn.textContent = step === 5 ? 'See Results' : 'Next';
    _fmbUpdateNextState();
  }
}

function _fmbUpdateNextState() {
  const nextBtn = document.getElementById('fmb-next');
  let canProceed = false;

  if (_fmbStep === 1) canProceed = _fmbAnswers.swing !== null;
  else if (_fmbStep === 2) canProceed = _fmbAnswers.ball !== null;
  else if (_fmbStep === 3) canProceed = _fmbAnswers.court !== null;
  else if (_fmbStep === 4) canProceed = _fmbAnswers.painPoints.length > 0;
  else if (_fmbStep === 5) canProceed = _fmbAnswers.priorities.length === 3;

  nextBtn.disabled = !canProceed;
}

function fmbBack() {
  if (_fmbStep === 'result') {
    _fmbShowStep(5);
  } else if (_fmbStep > 1) {
    _fmbShowStep(_fmbStep - 1);
  }
}

function fmbNext() {
  if (_fmbStep < 5) {
    _fmbShowStep(_fmbStep + 1);
  } else if (_fmbStep === 5) {
    // Generate profile and show results
    const profile = _fmbGenerateProfile(_fmbAnswers);
    _fmbShowResults(profile);
    _fmbShowStep('result');
  }
}

// Wire option click handlers (delegated)
document.addEventListener('click', (e) => {
  const option = e.target.closest('.fmb-option');
  if (!option) return;

  const container = option.closest('.fmb-options');
  if (!container) return;

  const key = container.dataset.key;
  const value = option.dataset.value;
  const isMulti = container.classList.contains('fmb-options-multi');
  const maxSel = parseInt(container.dataset.max) || 99;
  const isPriority = container.classList.contains('fmb-options-priority');

  if (isMulti) {
    if (isPriority) {
      // Priority: ordered selection with numbered badges
      const arr = _fmbAnswers[key];
      const idx = arr.indexOf(value);
      if (idx >= 0) {
        // Deselect: remove and renumber
        arr.splice(idx, 1);
        option.classList.remove('selected');
        const badge = option.querySelector('.fmb-priority-badge');
        if (badge) badge.remove();
        // Renumber remaining
        container.querySelectorAll('.fmb-option.selected').forEach(btn => {
          const bv = btn.dataset.value;
          const bi = arr.indexOf(bv);
          const bg = btn.querySelector('.fmb-priority-badge');
          if (bg) bg.textContent = bi + 1;
        });
      } else if (arr.length < maxSel) {
        arr.push(value);
        option.classList.add('selected');
        const badge = document.createElement('span');
        badge.className = 'fmb-priority-badge';
        badge.textContent = arr.length;
        option.appendChild(badge);
      }
      _fmbAnswers[key] = arr;
    } else {
      // Standard multi-select (pain points)
      const arr = _fmbAnswers[key];
      const idx = arr.indexOf(value);
      if (idx >= 0) {
        arr.splice(idx, 1);
        option.classList.remove('selected');
      } else if (arr.length < maxSel) {
        arr.push(value);
        option.classList.add('selected');
      }
      _fmbAnswers[key] = arr;
    }
  } else {
    // Single select
    container.querySelectorAll('.fmb-option').forEach(b => b.classList.remove('selected'));
    option.classList.add('selected');
    _fmbAnswers[key] = value;
  }

  _fmbUpdateNextState();
});

function _fmbGenerateProfile(answers) {
  const profile = {
    statPriorities: {},
    minThresholds: {},
    setupPreference: 'both',
    sortBy: 'obs',
    notes: []
  };

  // Q1: Swing style
  if (answers.swing === 'compact') {
    profile.minThresholds.maneuverability = 60;
    profile.notes.push('Compact swing \u2192 prioritizing maneuverable setups');
  } else if (answers.swing === 'heavy') {
    profile.minThresholds.stability = 58;
    profile.notes.push('Heavy swing \u2192 prioritizing stable, high-plow setups');
  }

  // Q2: Ball shape
  if (answers.ball === 'flat') {
    profile.statPriorities.control = 3;
    profile.statPriorities.power = 2;
    profile.minThresholds.control = 62;
  } else if (answers.ball === 'heavy') {
    profile.statPriorities.spin = 3;
    profile.minThresholds.spin = 65;
  } else {
    profile.statPriorities.spin = 2;
  }

  // Q3: Court identity
  if (answers.court === 'baseliner') {
    profile.statPriorities.durability = (profile.statPriorities.durability || 0) + 1;
    profile.statPriorities.playability = (profile.statPriorities.playability || 0) + 1;
  } else if (answers.court === 'touch') {
    profile.statPriorities.feel = 3;
    profile.minThresholds.feel = 62;
  } else if (answers.court === 'firststrike') {
    profile.statPriorities.power = (profile.statPriorities.power || 0) + 1;
    profile.statPriorities.control = (profile.statPriorities.control || 0) + 1;
  }

  // Q4: Pain points
  answers.painPoints.forEach(p => {
    if (p === 'arm') { profile.minThresholds.comfort = 60; profile.notes.push('Arm sensitivity \u2192 comfort floor 60'); }
    if (p === 'breaks') { profile.minThresholds.durability = 65; profile.notes.push('String breaker \u2192 durability floor 65'); }
    if (p === 'long') { profile.minThresholds.control = 62; profile.notes.push('Ball goes long \u2192 control floor 62'); }
    if (p === 'pace') { profile.statPriorities.power = 3; }
    if (p === 'spin') { profile.statPriorities.spin = 3; }
    if (p === 'dead') { profile.minThresholds.feel = 60; profile.minThresholds.playability = 65; }
  });

  // Q5: Priorities
  answers.priorities.forEach((stat, i) => {
    profile.statPriorities[stat] = Math.max(profile.statPriorities[stat] || 0, 3 - i);
  });

  // Determine sort key
  const topStat = Object.entries(profile.statPriorities).sort((a, b) => b[1] - a[1])[0];
  if (topStat && topStat[0] !== 'obs') profile.sortBy = topStat[0];

  return profile;
}

function _fmbShowResults(profile) {
  const summaryEl = document.getElementById('fmb-summary');
  const directionsEl = document.getElementById('fmb-directions');

  // Build playstyle summary sentence
  const swingLabels = { compact: 'compact-swing', smooth: 'balanced-swing', heavy: 'heavy-swing' };
  const ballLabels = { flat: 'flat-hitting', moderate: 'moderate-spin', heavy: 'heavy-topspin' };
  const courtLabels = { baseliner: 'baseliner', allcourt: 'all-court', firststrike: 'first-strike', touch: 'touch player' };

  const identity = `${courtLabels[_fmbAnswers.court] || 'all-court'} with a ${swingLabels[_fmbAnswers.swing] || 'balanced'}, ${ballLabels[_fmbAnswers.ball] || 'moderate-spin'} game`;

  // Top priorities display
  const prioLabels = _fmbAnswers.priorities.map(p => p.charAt(0).toUpperCase() + p.slice(1));

  // Thresholds display
  const threshLines = Object.entries(profile.minThresholds)
    .map(([k, v]) => `<span class="fmb-thresh-tag">${k.charAt(0).toUpperCase() + k.slice(1)} \u2265 ${v}</span>`)
    .join('');

  summaryEl.innerHTML = `
    <div class="fmb-profile-card">
      <div class="fmb-profile-label">YOUR PROFILE</div>
      <h3 class="fmb-profile-identity">${identity.charAt(0).toUpperCase() + identity.slice(1)}</h3>
      <div class="fmb-profile-priorities">
        <span class="fmb-prio-label">Optimizing for:</span>
        ${prioLabels.map((p, i) => `<span class="fmb-prio-tag">${i + 1}. ${p}</span>`).join('')}
      </div>
      ${threshLines ? `<div class="fmb-profile-thresholds">${threshLines}</div>` : ''}
      ${profile.notes.length ? `<div class="fmb-profile-notes">${profile.notes.map(n => `<div class="fmb-note">${n}</div>`).join('')}</div>` : ''}
    </div>
  `;

  // === Frame-first results: find top 5 matching frames ===
  const rankedFrames = _fmbRankFrames(profile);
  _fmbCurrentFrames = rankedFrames; // store for index-based action handlers

  directionsEl.innerHTML = `
    <div class="fmb-frame-results">
      <h4 class="fmb-frames-title">Recommended Frames</h4>
      <p class="fmb-frames-sub">Based on your playstyle profile. Each frame shows its best builds.</p>
      <div class="fmb-frame-list">
        ${rankedFrames.map((fr, idx) => _fmbRenderFrameCard(fr, idx)).join('')}
      </div>
      <div class="fmb-also-try">
        <p class="fmb-also-try-text">Want more options?</p>
        <button class="fmb-dir-btn" onclick="_fmbSearchDirection('closest')">Search All Strings in Optimizer</button>
      </div>
    </div>
  `;
}

let _fmbLastProfile = null;

function _fmbSearchDirection(direction) {
  const profile = _fmbGenerateProfile(_fmbAnswers);
  _fmbLastProfile = profile;

  // Ensure optimize mode is initialized
  if (!_optimizeInitialized) {
    initOptimize();
    _optimizeInitialized = true;
  }

  // Build filter values based on direction
  const mins = { spin: 0, control: 0, power: 0, comfort: 0, feel: 0, durability: 0, playability: 0, stability: 0, maneuverability: 0 };
  let sortBy = profile.sortBy;

  if (direction === 'closest') {
    // Strict thresholds, sort by OBS
    Object.entries(profile.minThresholds).forEach(([k, v]) => {
      if (mins.hasOwnProperty(k)) mins[k] = v;
    });
    sortBy = 'obs';
  } else if (direction === 'safer') {
    // Relax thresholds by 5, boost comfort/durability
    Object.entries(profile.minThresholds).forEach(([k, v]) => {
      if (mins.hasOwnProperty(k)) mins[k] = Math.max(0, v - 5);
    });
    mins.comfort = Math.max(mins.comfort, 55);
    mins.durability = Math.max(mins.durability, 55);
    sortBy = 'obs';
  } else if (direction === 'ceiling') {
    // Remove comfort/durability floors, sort by #1 priority
    Object.entries(profile.minThresholds).forEach(([k, v]) => {
      if (k === 'comfort' || k === 'durability') return;
      if (mins.hasOwnProperty(k)) mins[k] = v;
    });
    sortBy = _fmbAnswers.priorities[0] || profile.sortBy;
  }

  // Set optimizer filter values
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };

  setVal('opt-min-spin', mins.spin);
  setVal('opt-min-control', mins.control);
  setVal('opt-min-power', mins.power);
  setVal('opt-min-comfort', mins.comfort);
  setVal('opt-min-feel', mins.feel);
  setVal('opt-min-durability', mins.durability);
  setVal('opt-min-playability', mins.playability);
  setVal('opt-min-stability', mins.stability);
  setVal('opt-min-maneuverability', mins.maneuverability);
  setVal('opt-sort', sortBy);

  // Set setup type
  const typeBtn = document.querySelector(`.opt-toggle[data-value="${profile.setupPreference}"]`);
  if (typeBtn) {
    document.querySelectorAll('.opt-toggle').forEach(b => b.classList.remove('active'));
    typeBtn.classList.add('active');
  }

  // Fix H: Seed optimizer frame from quiz's top-ranked frame (QA-021)
  if (_fmbCurrentFrames && _fmbCurrentFrames.length > 0) {
    var topFrame = _fmbCurrentFrames[0].racquet;
    setVal('opt-frame-search', topFrame.name);
    var frameValEl = document.getElementById('opt-frame-value');
    if (frameValEl) frameValEl.value = topFrame.id;
  }

  // Close wizard
  closeFindMyBuild();

  // Switch to optimize mode and trigger search
  switchMode('optimize');

  // Small delay so DOM is ready, then trigger search
  requestAnimationFrame(() => {
    document.getElementById('opt-run-btn').click();
  });
}

// ============================================
// COMPENDIUM — Frame-Centric Exploration
// ============================================

const _compendiumBuildCache = {};
let _compSelectedRacquetId = null;
let _compSortKey = 'score';
let _compCurrentBuilds = []; // stores sorted builds for current frame (for index-based action handlers)

// ============================================
// COMPENDIUM V2 — RACKET SHOWROOM
// ============================================

// String compendium global state (declared before use)
let _stringSelectedId = null;
let _stringsInitialized = false;

// String Modulator State (for frame injection)
let _stringModState = {
  stringId: null,
  frameId: null,
  mode: 'fullbed',
  gauge: '',
  mainsTension: 52,
  crossesTension: 50,
  baseStats: null,
  previewStats: null
};

// Tab switching for pill bar
function _compSwitchTab(tab) {
  // Update Master Nav UI
  document.querySelectorAll('.comp-tab-btn').forEach(btn => {
    if (btn.dataset.compTab === tab) {
      // Active State
      btn.classList.add('bg-dc-platinum', 'text-dc-void', 'font-bold');
      btn.classList.remove('bg-transparent', 'text-dc-storm', 'hover:bg-dc-border/50', 'hover:text-dc-platinum');
    } else {
      // Inactive State
      btn.classList.remove('bg-dc-platinum', 'text-dc-void', 'font-bold');
      btn.classList.add('bg-transparent', 'text-dc-storm', 'hover:bg-dc-border/50', 'hover:text-dc-platinum');
    }
  });

  // Hide all panels
  document.querySelectorAll('.comp-tab-panel').forEach(panel => {
    panel.classList.add('hidden');
  });

  // Show target panel
  const activePanel = document.getElementById('comp-tab-' + tab);
  if (activePanel) {
    activePanel.classList.remove('hidden');
  }

  // Initialize string compendium on first visit
  if (tab === 'strings' && !_stringsInitialized) {
    _stringsInitialized = true;

    // Delay slightly to ensure DOM is ready
    setTimeout(() => {
      try {
        _stringRenderRoster();
        if (typeof STRINGS !== 'undefined' && STRINGS.length > 0) {
          _stringSelectedId = STRINGS[0].id;
          _stringRenderMain(STRINGS[0]);
        } else {
          console.error('STRINGS data not available');
          const main = document.getElementById('string-main');
          if (main) {
            main.innerHTML = '<div class="flex flex-col items-center justify-center h-64 text-dc-red"><p class="font-mono text-sm">Error: String database not loaded</p></div>';
          }
        }
        
        // Wire up string filter events
        const stringSearch = document.getElementById('string-search');
        const stringFilterMaterial = document.getElementById('string-filter-material');
        const stringFilterShape = document.getElementById('string-filter-shape');
        const stringFilterStiffness = document.getElementById('string-filter-stiffness');
        
        if (stringSearch) stringSearch.addEventListener('input', _stringRenderRoster);
        if (stringFilterMaterial) stringFilterMaterial.addEventListener('change', _stringRenderRoster);
        if (stringFilterShape) stringFilterShape.addEventListener('change', _stringRenderRoster);
        if (stringFilterStiffness) stringFilterStiffness.addEventListener('change', _stringRenderRoster);
      } catch (err) {
        console.error('String compendium init error:', err);
      }
    }, 100);
  }

  // Sync String Compendium with active loadout on tab switch
  if (tab === 'strings' && _stringsInitialized) {
    _stringSyncWithActiveLoadout();
  }

  // Initialize leaderboard on first visit
  // Note: _lbv2State is defined in leaderboard.js module
  if (tab === 'leaderboard' && typeof _lbv2State !== 'undefined' && !_lbv2State.initialized) {
    // Note: _lbv2State.initialized is set inside initLeaderboard()
    // Small race window if user clicks twice rapidly (<50ms) - acceptable
    setTimeout(function() { initLeaderboard(); }, 50);
  }
}

// Toggle Query HUD overlay with scroll-lock
function _compToggleHud() {
  const hud = document.getElementById('comp-hud');
  if (hud) {
    hud.classList.toggle('active');
    if (hud.classList.contains('active')) {
      document.getElementById('comp-search').focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}

// ============================================
// STRING COMPENDIUM
// ============================================

// Toggle String HUD overlay
function _stringToggleHud() {
  const hud = document.getElementById('string-hud');
  if (hud) {
    hud.classList.toggle('active');
    if (hud.classList.contains('active')) {
      document.getElementById('string-search').focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}

// Get filtered strings based on search and filters
function _stringGetFilteredStrings() {
  const search = (document.getElementById('string-search').value || '').toLowerCase();
  const material = document.getElementById('string-filter-material').value;
  const shape = document.getElementById('string-filter-shape').value;
  const stiffness = document.getElementById('string-filter-stiffness').value;

  return STRINGS.filter(s => {
    if (search && !s.name.toLowerCase().includes(search)) return false;
    if (material && !s.material.includes(material)) return false;
    if (shape && !s.shape.toLowerCase().includes(shape.toLowerCase())) return false;
    if (stiffness === 'soft' && s.stiffness >= 180) return false;
    if (stiffness === 'medium' && (s.stiffness < 180 || s.stiffness > 210)) return false;
    if (stiffness === 'stiff' && s.stiffness <= 210) return false;
    return true;
  });
}

// Sync String Compendium state with active loadout
function _stringSyncWithActiveLoadout() {
  const setup = getCurrentSetup();
  if (!setup) return;
  
  const { racquet, stringConfig } = setup;
  if (!racquet || !stringConfig) return;
  
  // Update mod state to match active loadout
  _stringModState.frameId = racquet.id;
  _stringModState.mode = stringConfig.isHybrid ? 'hybrid' : 'fullbed';
  _stringModState.mainsTension = stringConfig.mainsTension;
  _stringModState.crossesTension = stringConfig.crossesTension;
  
  if (stringConfig.isHybrid) {
    _stringModState.stringId = stringConfig.mains?.id || '';
    _stringModState.crossesId = stringConfig.crosses?.id || '';
  } else {
    _stringModState.stringId = stringConfig.string?.id || '';
    _stringModState.crossesId = stringConfig.string?.id || '';
  }
  
  // Update selected string and re-render main view
  const stringId = _stringModState.stringId;
  if (stringId) {
    const string = STRINGS.find(s => s.id === stringId);
    if (string) {
      _stringSelectedId = stringId;
      _stringRenderMain(string);
    }
  }
}

// Render string roster in HUD
function _stringRenderRoster() {
  const list = document.getElementById('string-list');
  const strings = _stringGetFilteredStrings();

  list.innerHTML = strings.map(s => {
    const isActive = s.id === _stringSelectedId;
    const baseClasses = "bg-transparent border text-left flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer p-4";
    const borderClasses = isActive 
      ? "border-dc-accent" 
      : "border-dc-storm dark:border-dc-platinum-dim hover:border-dc-platinum";
    const archetype = _stringGetArchetype(s);
    return `<button class="${baseClasses} ${borderClasses}" data-id="${s.id}" onclick="_stringSelectString('${s.id}')">
      <div class="flex justify-between items-start gap-2">
        <span class="text-base font-semibold leading-tight tracking-tight text-dc-void dark:text-dc-platinum">${s.name}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="font-mono text-[10px] uppercase tracking-[0.15em] text-dc-accent">${archetype}</span>
        <span class="font-mono text-[12px] text-dc-storm">${s.material} // ${s.shape}</span>
        <span class="font-mono text-[13px] font-semibold text-dc-void dark:text-dc-platinum">${Math.round(s.stiffness)} lb/in</span>
      </div>
    </button>`;
  }).join('');
}

// Get string archetype based on twScore
function _stringGetArchetype(s) {
  const scores = s.twScore || {};
  if (scores.spin >= 85 && scores.control >= 80) return 'Spin Control';
  if (scores.spin >= 85) return 'Spin Focus';
  if (scores.control >= 85) return 'Control';
  if (scores.power >= 75) return 'Power';
  if (scores.comfort >= 80) return 'Comfort';
  if (scores.durability >= 85) return 'Durability';
  return 'All-Rounder';
}

// Select string and render main content
function _stringSelectString(stringId) {
  // Auto-close HUD on selection
  const hud = document.getElementById('string-hud');
  if (hud) {
    hud.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  _stringSelectedId = stringId;
  const string = STRINGS.find(s => s.id === stringId);
  if (!string) return;

  // Highlight in roster
  document.querySelectorAll('#string-list > button').forEach(el => {
    const isActive = el.dataset.id === stringId;
    el.classList.remove('border-dc-accent', 'border-dc-platinum-dim');
    el.classList.add(isActive ? 'border-dc-accent' : 'border-dc-platinum-dim');
  });

  _stringRenderMain(string);
}

// Generate "Best for" and "Watch out" pills for strings
function _stringGeneratePills(string) {
  const scores = string.twScore || {};
  const bestFor = [];
  const watchOut = [];
  
  if (scores.spin >= 85) bestFor.push('SPIN GENERATION');
  if (scores.control >= 85) bestFor.push('PRECISION SHOTS');
  if (scores.power >= 75) bestFor.push('FREE POWER');
  if (scores.comfort >= 80) bestFor.push('ARM COMFORT');
  if (scores.durability >= 85) bestFor.push('LONGEVITY');
  if (scores.playabilityDuration >= 85) bestFor.push('TENSION MAINTENANCE');
  
  if (scores.comfort < 60) watchOut.push('STIFF FEEL');
  if (scores.durability < 60) watchOut.push('FAST BREAKAGE');
  if (string.tensionLoss > 30) watchOut.push('HIGH TENSION DROP');
  if (scores.power < 50) watchOut.push('LOW POWER OUTPUT');
  
  return { bestFor, watchOut };
}

// Render string battery bars from twScore
function _stringRenderBatteryBars(string) {
  const scores = string.twScore || {};
  const groups = [
    { title: 'Response', stats: [
      { id: 'power', label: 'Power', val: scores.power || 50 },
      { id: 'spin', label: 'Spin', val: scores.spin || 50 },
      { id: 'control', label: 'Control', val: scores.control || 50 }
    ]},
    { title: 'Feel', stats: [
      { id: 'feel', label: 'Feel', val: scores.feel || 50 },
      { id: 'comfort', label: 'Comfort', val: scores.comfort || 50 },
      { id: 'playability', label: 'Playability', val: scores.playabilityDuration || 50 }
    ]},
    { title: 'Longevity', stats: [
      { id: 'durability', label: 'Durability', val: scores.durability || 50 },
      { id: 'tension', label: 'Tension Loss', val: Math.max(0, 100 - (string.tensionLoss || 0) * 2) }
    ]}
  ];

  let html = '<div class="flex flex-col gap-6">';
  groups.forEach(g => {
    html += `<div class="flex flex-col">
      <h4 class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em] border-b border-dc-border pb-2 mb-3">${g.title}</h4>
      <div class="flex flex-col gap-2.5">`;
    
    g.stats.forEach(s => {
      const pct = Math.max(0, Math.min(100, s.val));
      const totalSegments = 25;
      const filledSegments = Math.round((pct / 100) * totalSegments);
      
      let batteryHtml = '<div class="flex flex-1 gap-[2px] h-1.5 items-center">';
      for(let i = 0; i < totalSegments; i++) {
        const bgClass = i < filledSegments 
          ? 'bg-dc-void dark:bg-dc-platinum'
          : 'bg-black/10 dark:bg-white/10';
        batteryHtml += `<div class="flex-1 h-full rounded-[1px] transition-colors duration-150 ${bgClass}"></div>`;
      }
      batteryHtml += '</div>';

      html += `
        <div class="flex items-center gap-4 group">
          <span class="font-mono text-[13px] text-dc-storm group-hover:text-dc-platinum transition-colors uppercase tracking-[0.15em] w-28">${s.label}</span>
          ${batteryHtml}
          <span class="font-mono text-[13px] font-bold text-dc-void dark:text-dc-platinum w-8 text-right">${Math.round(s.val)}</span>
        </div>`;
    });
    html += `</div></div>`;
  });
  html += '</div>';
  return html;
}

// Find similar strings based on twScore profile
function _stringFindSimilarStrings(sourceId, limit = 4) {
  const source = STRINGS.find(s => s.id === sourceId);
  if (!source) return [];
  
  const scores = ['power', 'spin', 'comfort', 'control', 'feel', 'durability'];
  
  return STRINGS
    .filter(s => s.id !== sourceId)
    .map(s => {
      const distance = scores.reduce((sum, key) => {
        const diff = (s.twScore[key] || 50) - (source.twScore[key] || 50);
        return sum + diff * diff;
      }, 0);
      return { string: s, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(r => r.string);
}

// Find best frames for this string
function _stringFindBestFrames(stringId, limit = 4) {
  const string = STRINGS.find(s => s.id === stringId);
  if (!string) return [];
  
  const stringConfig = {
    isHybrid: false,
    string: string,
    mains: string,
    crosses: string,
    mainsTension: 52,
    crossesTension: 50
  };
  
  return RACQUETS
    .map(r => {
      const stats = predictSetup(r, stringConfig);
      const tCtx = buildTensionContext(stringConfig, r);
      const obs = computeCompositeScore(stats, tCtx);
      return { racquet: r, stats, obs };
    })
    .sort((a, b) => b.obs - a.obs)
    .slice(0, limit);
}

// Render main string content
function _stringRenderMain(string) {
  const main = document.getElementById('string-main');
  if (!main) return;
  
  // Clear searchable select instances since DOM will be recreated
  delete ssInstances['string-mod-frame'];
  delete ssInstances['string-mod-crosses-string'];
  
  const pills = _stringGeneratePills(string);
  const consoleHtml = [];
  pills.bestFor.forEach(p => consoleHtml.push(`<span class="font-mono text-[13px] font-bold tracking-[0.05em] uppercase text-dc-void dark:text-dc-platinum">[+] ${p}</span>`));
  pills.watchOut.forEach(p => consoleHtml.push(`<span class="font-mono text-[13px] font-bold tracking-[0.05em] uppercase text-dc-red">[-] ${p}</span>`));
  
  const batteryHtml = _stringRenderBatteryBars(string);
  const similarStrings = _stringFindSimilarStrings(string.id);
  const bestFrames = _stringFindBestFrames(string.id);
  
  // Similar strings grid
  const similarHtml = similarStrings.map(s => {
    const archetype = _stringGetArchetype(s);
    return `<div class="bg-transparent border border-dc-border hover:border-dc-storm p-4 flex flex-col cursor-pointer transition-colors group" onclick="_stringSelectString('${s.id}')">
      <div class="flex justify-between items-start mb-2">
        <span class="font-mono text-[10px] text-dc-storm uppercase tracking-widest group-hover:text-dc-platinum transition-colors">${archetype}</span>
        <span class="font-mono text-lg font-bold text-dc-void dark:text-dc-platinum">${s.twScore.spin || 0}<span class="text-[13px] text-dc-storm ml-1">SPIN</span></span>
      </div>
      <div class="text-sm font-semibold text-dc-void dark:text-dc-platinum mb-1">${s.name}</div>
      <div class="font-mono text-[13px] text-dc-storm">${s.material} // ${s.shape}</div>
    </div>`;
  }).join('');
  
  // Best frames grid
  const framesHtml = bestFrames.map(f => {
    return `<div class="bg-transparent border border-dc-border hover:border-dc-storm p-4 flex flex-col cursor-pointer transition-colors group" onclick="_compSelectFrame('${f.racquet.id}'); _compSwitchTab('rackets');">
      <div class="flex justify-between items-start mb-2">
        <span class="font-mono text-[10px] text-dc-storm uppercase tracking-widest group-hover:text-dc-platinum transition-colors">${f.racquet.identity}</span>
        <span class="font-mono text-lg font-bold text-dc-accent">${f.obs.toFixed(1)}</span>
      </div>
      <div class="text-sm font-semibold text-dc-void dark:text-dc-platinum mb-1">${f.racquet.name.replace(/\\s+\\d+g$/, '')}</div>
      <div class="font-mono text-[13px] text-dc-storm">${f.racquet.pattern} // ${f.racquet.strungWeight}g strung</div>
    </div>`;
  }).join('');
  
  // Calculate TWU composite score (similar to OBS for racquets)
  const twScores = string.twScore || {};
  const twuComposite = Math.round(
    (twScores.control || 50) * 0.16 +
    (twScores.spin || 50) * 0.13 +
    (twScores.comfort || 50) * 0.13 +
    (twScores.power || 50) * 0.11 +
    (twScores.feel || 50) * 0.10 +
    (twScores.durability || 50) * 0.07 +
    (twScores.playabilityDuration || 50) * 0.06
  );

  main.innerHTML = `
    <!-- String Hero Block -->
    <div class="relative flex flex-col items-start mb-8">
      
      <div class="absolute top-6 right-6 md:top-8 md:right-8 flex flex-col items-end">
        <span class="font-mono text-[13px] text-dc-storm tracking-[0.2em] mb-1">TWU SCORE</span>
        <span class="font-mono text-5xl font-semibold leading-[0.85] text-dc-void dark:text-dc-platinum">
          ${twuComposite}
        </span>
      </div>
      
      <h2 class="text-5xl md:text-[4rem] font-semibold tracking-tight text-dc-void dark:text-dc-platinum leading-none mb-0 pr-[120px] flex items-center gap-3 cursor-pointer group" onclick="_stringToggleHud()">
        ${string.name}
        <span class="text-2xl text-dc-red opacity-50 group-hover:opacity-100 transition-opacity">▼</span>
      </h2>
      
      <div class="flex items-center gap-2 mt-4 font-mono text-[13px] flex-wrap">
        <span class="text-dc-void dark:text-dc-platinum">${string.material.toUpperCase()}</span>
        <span class="text-dc-accent opacity-60 text-[13px]">//</span>
        <span class="text-dc-storm uppercase tracking-[0.15em]">${string.shape}</span>
      </div>
      
      ${string.notes ? `<p class="max-w-[650px] mt-6 text-sm leading-relaxed text-dc-storm">${string.notes}</p>` : ''}
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 w-full mt-12 pt-8 border-t border-dc-border">
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-void dark:text-dc-platinum leading-none">${Math.round(string.stiffness)}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">STIFFNESS (lb/in)</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-void dark:text-dc-platinum leading-none">${string.spinPotential || '—'}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">SPIN POTENTIAL</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-void dark:text-dc-platinum leading-none">${string.tensionLoss || '—'}%</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">TENSION LOSS</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-void dark:text-dc-platinum leading-none">${string.stiffness > 200 ? 'High' : string.stiffness > 180 ? 'Med' : 'Low'}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">SNAPBACK</span>
        </div>
      </div>

      ${consoleHtml.length > 0 ? `<div class="flex flex-wrap gap-4 w-full mt-8 p-0">${consoleHtml.join('')}</div>` : ''}
    </div>

    <!-- String Telemetry -->
    <div class="mb-12">
      <h3 class="font-mono text-xs tracking-[0.15em] text-dc-void dark:text-dc-platinum uppercase mb-1">// STRING TELEMETRY</h3>
      <p class="text-xs text-dc-storm mb-6 italic">Intrinsic characteristics from Tennis Warehouse testing</p>
      ${batteryHtml}
    </div>

    <!-- String Modulator Panel (Frame Injection) -->
    <div class="bg-transparent border border-dc-storm/30 p-5 md:p-6 mb-10 flex flex-col gap-5">
      
      <div class="flex justify-between items-center border-b border-dc-storm/30 pb-3 mb-1">
        <span class="font-mono text-[13px] text-dc-accent uppercase tracking-[0.2em]">//FRAME INJECTION</span>
        <div class="flex gap-4">
          <button class="string-mod-mode-btn text-dc-accent border-dc-accent border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors" data-mode="fullbed" onclick="_stringSetModMode('fullbed')">Full Bed</button>
          <button class="string-mod-mode-btn text-dc-storm border-transparent border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors" data-mode="hybrid" onclick="_stringSetModMode('hybrid')">Hybrid</button>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Frame Selector -->
        <div class="flex flex-col gap-3">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// SELECT FRAME</span>
          <div id="string-mod-frame" data-placeholder="Select Frame..."></div>
          <p class="text-[12px] text-dc-storm italic">Required: Choose a frame to inject this string into</p>
        </div>
        
        <!-- OBS Preview -->
        <div class="flex flex-col gap-3">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// PROJECTED OBS</span>
          <div id="string-mod-obs" class="flex items-center">
            <span class="font-mono text-4xl font-bold text-dc-storm">—</span>
          </div>
        </div>
      </div>
      
      <!-- String Selectors Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Mains String -->
        <div class="flex flex-col gap-3">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// MAINS STRING</span>
          <div id="string-mod-mains-name" class="font-mono text-sm text-dc-void dark:text-dc-platinum py-2 border-b border-dc-storm/30">
            Select a string first
          </div>
        </div>
        
        <!-- Crosses String (only visible in hybrid mode) -->
        <div class="flex flex-col gap-3" id="string-mod-crosses-string-col" style="display:none;">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// CROSSES STRING</span>
          <div id="string-mod-crosses-string" data-placeholder="Same as mains..."></div>
        </div>
      </div>
      
      <!-- Gauge Selector (for mains, crosses uses default or mains gauge) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-3">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// MAINS GAUGE</span>
          <select id="string-mod-gauge" class="appearance-none bg-dc-white dark:bg-dc-void border-b border-dc-storm/50 text-dc-void dark:text-dc-platinum font-mono text-sm py-2 px-2 outline-none focus:border-dc-accent transition-colors cursor-pointer" onchange="_stringOnGaugeChange(this.value)">
            <option value="">Default</option>
          </select>
        </div>
        
        <div class="flex flex-col gap-3" id="string-mod-crosses-gauge-col" style="display:none;">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// CROSSES GAUGE</span>
          <select id="string-mod-crosses-gauge" class="appearance-none bg-dc-white dark:bg-dc-void border-b border-dc-storm/50 text-dc-void dark:text-dc-platinum font-mono text-sm py-2 px-2 outline-none focus:border-dc-accent transition-colors cursor-pointer" onchange="_stringOnCrossesGaugeChange(this.value)">
            <option value="">Same as mains</option>
          </select>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <!-- Mains Tension -->
        <div class="flex flex-col gap-3" id="string-mod-mains-col">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// MAINS TENSION</span>
          <input type="number" id="string-mod-mains-tension" class="bg-transparent border-b border-dc-storm/50 text-dc-void dark:text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors" value="52" min="30" max="70" step="1" oninput="_stringOnTensionChange('mains', this.value)">
        </div>
        
        <!-- Crosses Tension (always visible, but label changes) -->
        <div class="flex flex-col gap-3" id="string-mod-crosses-col">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]" id="string-mod-crosses-label">// CROSSES TENSION</span>
          <input type="number" id="string-mod-crosses-tension" class="bg-transparent border-b border-dc-storm/50 text-dc-void dark:text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors" value="50" min="30" max="70" step="1" oninput="_stringOnTensionChange('crosses', this.value)">
        </div>
      </div>
      
      <!-- Live Preview Stats -->
      <div class="border-t border-dc-storm/30 pt-4 mt-2">
        <h4 class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em] mb-4">// LIVE PREVIEW</h4>
        <div class="flex flex-col gap-2.5">
          ${['spin', 'power', 'control', 'feel', 'comfort'].map(stat => `
            <div class="flex items-center gap-4 group" data-stat="${stat}">
              <span class="font-mono text-[13px] text-dc-storm group-hover:text-dc-platinum transition-colors uppercase tracking-[0.15em] w-20">${stat}</span>
              <div class="flex flex-1 gap-[2px] h-1.5 items-center" id="string-track-${stat}">
                ${Array(25).fill(0).map((_, i) => `<div class="flex-1 h-full rounded-[1px] bg-black/10 dark:bg-white/10"></div>`).join('')}
              </div>
              <span class="font-mono text-[13px] font-bold text-dc-void dark:text-dc-platinum w-16 text-right" id="string-val-${stat}">—</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="flex gap-2 mt-2">
        <button class="flex-1 font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed" id="string-mod-add" disabled onclick="_stringAddToLoadout()">Add to Loadout</button>
        <button class="flex-1 font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-platinum text-dc-void dark:text-dc-platinum hover:bg-dc-platinum hover:text-dc-void dark:hover:text-dc-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed" id="string-mod-activate" disabled onclick="_stringSetActiveLoadout()">Set Active</button>
        <button class="font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-storm/50 text-dc-storm hover:bg-dc-storm/10 hover:text-dc-void dark:hover:text-dc-platinum hover:border-dc-storm transition-colors" onclick="_stringClearPreview()">Clear</button>
      </div>
    </div>

    <!-- Best Paired With (Frames) -->
    <div class="mb-12">
      <h3 class="font-mono text-xs tracking-[0.15em] text-dc-void dark:text-dc-platinum uppercase mb-1">// BEST PAIRED WITH</h3>
      <p class="text-xs text-dc-storm mb-6 italic">Top performing frames with this string (52 lbs)</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">${framesHtml}</div>
    </div>

    <!-- Similar Strings -->
    <div class="mb-12">
      <h3 class="font-mono text-xs tracking-[0.15em] text-dc-void dark:text-dc-platinum uppercase mb-1">// SIMILAR STRINGS</h3>
      <p class="text-xs text-dc-storm mb-6 italic">Alternatives with similar performance profiles</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">${similarHtml}</div>
    </div>
  `;
  
  // Initialize string modulator after rendering
  _stringInitModulator(string);
}

// ============================================
// STRING MODULATOR (Frame Injection)
// ============================================

function _stringInitModulator(string) {
  // Reset state with current string
  _stringModState.stringId = string.id;
  _stringModState.crossesId = string.id; // Default to same string
  _stringModState.gauge = '';
  _stringModState.crossesGauge = '';
  _stringModState.frameId = null;
  _stringModState.baseStats = null;
  _stringModState.previewStats = null;
  
  // Get available gauges for this string
  const gauges = getGaugeOptions(string);
  const gaugeOptions = gauges.map(g => `<option value="${g}" ${Math.abs(g - string.gaugeNum) < 0.01 ? 'selected' : ''}>${GAUGE_LABELS[g] || g + 'mm'}</option>`).join('');
  
  // Set mains string name display
  const mainsNameEl = document.getElementById('string-mod-mains-name');
  if (mainsNameEl) {
    mainsNameEl.textContent = string.name;
  }
  
  // Set default gauge selection for mains
  const gaugeSelect = document.getElementById('string-mod-gauge');
  if (gaugeSelect) {
    gaugeSelect.innerHTML = '<option value="">Default</option>' + gaugeOptions;
  }
  
  // Create searchable frame selector
  const frameContainer = document.getElementById('string-mod-frame');
  if (frameContainer && !ssInstances['string-mod-frame']) {
    ssInstances['string-mod-frame'] = createSearchableSelect(frameContainer, {
      type: 'racquet',
      placeholder: 'Select Frame...',
      value: '',
      id: 'string-mod-frame-trigger',
      onChange: (val) => {
        _stringOnFrameChange(val);
      }
    });
  } else if (frameContainer && ssInstances['string-mod-frame']) {
    ssInstances['string-mod-frame'].setValue('');
  }
  
  // Create searchable crosses string selector
  const crossesContainer = document.getElementById('string-mod-crosses-string');
  if (crossesContainer && !ssInstances['string-mod-crosses-string']) {
    // Build options array from strings (excluding current)
    const crossesOptions = STRINGS.filter(s => s.id !== string.id).map(s => ({
      value: s.id,
      label: s.name
    }));
    
    ssInstances['string-mod-crosses-string'] = createSearchableSelect(crossesContainer, {
      type: 'custom',
      placeholder: 'Same as mains...',
      value: '',
      id: 'string-mod-crosses-string-trigger',
      options: crossesOptions,
      onChange: (val) => {
        _stringOnCrossesStringChange(val);
      }
    });
  } else if (crossesContainer && ssInstances['string-mod-crosses-string']) {
    // Rebuild options with current string excluded
    const crossesOptions = STRINGS.filter(s => s.id !== string.id).map(s => ({
      value: s.id,
      label: s.name
    }));
    ssInstances['string-mod-crosses-string'].setOptions(crossesOptions);
    ssInstances['string-mod-crosses-string'].setValue('');
  }
  
  // Populate crosses gauge selector (same options)
  const crossesGaugeSelect = document.getElementById('string-mod-crosses-gauge');
  if (crossesGaugeSelect) {
    crossesGaugeSelect.innerHTML = '<option value="">Same as mains</option>' + gaugeOptions;
  }
  
  // Reset mode to fullbed
  _stringSetModMode('fullbed');
  
  // Reset preview
  _stringClearPreview();
  
  // Reset OBS display
  const obsEl = document.getElementById('string-mod-obs');
  if (obsEl) {
    obsEl.innerHTML = '<span class="font-mono text-4xl font-bold text-dc-storm">—</span>';
  }
}

function _stringSetModMode(mode) {
  _stringModState.mode = mode;
  
  // Update button states
  document.querySelectorAll('.string-mod-mode-btn').forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.remove('text-dc-accent', 'border-dc-accent', 'text-dc-storm', 'border-transparent');
    if (isActive) {
      btn.classList.add('text-dc-accent', 'border-dc-accent');
    } else {
      btn.classList.add('text-dc-storm', 'border-transparent');
    }
  });
  
  // Show/hide crosses string selector in hybrid mode
  const crossesStringCol = document.getElementById('string-mod-crosses-string-col');
  const crossesGaugeCol = document.getElementById('string-mod-crosses-gauge-col');
  if (crossesStringCol) {
    crossesStringCol.style.display = mode === 'hybrid' ? 'block' : 'none';
  }
  if (crossesGaugeCol) {
    crossesGaugeCol.style.display = mode === 'hybrid' ? 'block' : 'none';
  }
  
  // Update crosses label
  const crossesLabel = document.getElementById('string-mod-crosses-label');
  if (crossesLabel) {
    crossesLabel.textContent = mode === 'hybrid' ? '// CROSSES TENSION' : '// CROSSES TENSION';
  }
  
  _stringUpdatePreview();
}

function _stringOnCrossesStringChange(crossesId) {
  _stringModState.crossesId = crossesId || _stringModState.stringId;
  _stringUpdatePreview();
}

function _stringOnCrossesGaugeChange(gauge) {
  _stringModState.crossesGauge = gauge || _stringModState.gauge;
  _stringUpdatePreview();
}

function _stringOnFrameChange(frameId) {
  _stringModState.frameId = frameId;
  
  if (frameId) {
    const racquet = RACQUETS.find(r => r.id === frameId);
    if (racquet) {
      // Set default tensions based on frame's tension range
      const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
      _stringModState.mainsTension = midTension;
      _stringModState.crossesTension = midTension - 2;
      
      // Update tension inputs
      const mainsInput = document.getElementById('string-mod-mains-tension');
      const crossesInput = document.getElementById('string-mod-crosses-tension');
      if (mainsInput) mainsInput.value = midTension;
      if (crossesInput) crossesInput.value = midTension - 2;
      
      // Calculate base stats
      _stringModState.baseStats = calcFrameBase(racquet);
      
      // Store base OBS for delta calculation
      const fb = _stringModState.baseStats;
      window._compBaseObs = Math.round(
        fb.spin * 0.15 +
        fb.power * 0.12 +
        fb.control * 0.18 +
        fb.comfort * 0.12 +
        fb.feel * 0.10 +
        fb.stability * 0.12 +
        fb.forgiveness * 0.08 +
        fb.maneuverability * 0.08
      );
    }
  } else {
    _stringModState.baseStats = null;
    window._compBaseObs = null;
  }
  
  _stringUpdatePreview();
}

function _stringOnGaugeChange(gauge) {
  _stringModState.gauge = gauge;
  _stringUpdatePreview();
}

function _stringOnTensionChange(type, value) {
  if (type === 'mains') {
    _stringModState.mainsTension = parseInt(value) || 52;
  } else {
    _stringModState.crossesTension = parseInt(value) || 50;
  }
  _stringUpdatePreview();
}

function _stringUpdatePreview() {
  const { stringId, crossesId, frameId, mode, gauge, crossesGauge, mainsTension, crossesTension, baseStats } = _stringModState;
  
  // Need both string and frame selected
  if (!stringId || !frameId || !baseStats) {
    _stringClearPreview();
    return;
  }
  
  const mainsString = STRINGS.find(s => s.id === stringId);
  const racquet = RACQUETS.find(r => r.id === frameId);
  if (!mainsString || !racquet) {
    _stringClearPreview();
    return;
  }
  
  // Get crosses string (different in hybrid, same in fullbed)
  const crossesString = (mode === 'hybrid' && crossesId && crossesId !== stringId) 
    ? (STRINGS.find(s => s.id === crossesId) || mainsString)
    : mainsString;
  
  // Apply gauge modifiers
  const mainsWithGauge = gauge ? applyGaugeModifier(mainsString, parseFloat(gauge)) : mainsString;
  const crossesWithGauge = (mode === 'hybrid' && crossesGauge) 
    ? applyGaugeModifier(crossesString, parseFloat(crossesGauge))
    : (crossesString === mainsString ? mainsWithGauge : crossesString);
  
  // Build config
  const cfg = mode === 'hybrid' ? {
    isHybrid: true,
    mains: mainsWithGauge,
    crosses: crossesWithGauge,
    mainsTension,
    crossesTension
  } : {
    isHybrid: false,
    string: mainsWithGauge,
    mainsTension,
    crossesTension
  };
  
  // Run prediction
  const previewStats = predictSetup(racquet, cfg);
  if (!previewStats) return;
  
  _stringModState.previewStats = previewStats;
  
  // Update battery bars with before/after
  _stringRenderPreviewBars(baseStats, previewStats);
  
  // Enable buttons
  const addBtn = document.getElementById('string-mod-add');
  const activateBtn = document.getElementById('string-mod-activate');
  if (addBtn) addBtn.disabled = false;
  if (activateBtn) activateBtn.disabled = false;
  
  // Update OBS display
  const tCtx = buildTensionContext(cfg, racquet);
  const obs = computeCompositeScore(previewStats, tCtx);
  const obsEl = document.getElementById('string-mod-obs');
  if (obsEl) {
    obsEl.innerHTML = `<span class="font-mono text-4xl font-bold text-dc-accent">${obs.toFixed(1)}</span>`;
  }
  
  // Update delta display on racket page (if visible)
  const baseObs = window._compBaseObs || Math.round(
    baseStats.spin * 0.15 +
    baseStats.power * 0.12 +
    baseStats.control * 0.18 +
    baseStats.comfort * 0.12 +
    baseStats.feel * 0.10 +
    baseStats.stability * 0.12 +
    baseStats.forgiveness * 0.08 +
    baseStats.maneuverability * 0.08
  );
  const delta = Math.round((obs - baseObs) * 10) / 10;
  
  // Update delta on racket page (if visible)
  const main = document.getElementById('comp-main');
  let deltaEl = document.getElementById('comp-string-delta');
  let deltaValEl = document.getElementById('comp-string-delta-value');
  if (!deltaEl && main) {
    deltaEl = main.querySelector('#comp-string-delta');
    deltaValEl = main.querySelector('#comp-string-delta-value');
  }
  if (deltaEl && deltaValEl && delta > 0) {
    deltaValEl.textContent = delta;
    deltaEl.classList.remove('opacity-0');
  } else if (deltaEl) {
    deltaEl.classList.add('opacity-0');
  }
}

function _stringRenderPreviewBars(baseStats, previewStats) {
  const statKeys = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability'];
  const segments = 25;
  
  statKeys.forEach(k => {
    const baseVal = baseStats[k] != null ? Math.round(baseStats[k]) : 50;
    const previewVal = previewStats[k] != null ? Math.round(previewStats[k]) : 50;
    const baseFilled = Math.round((baseVal / 100) * segments);
    const previewFilled = Math.round((previewVal / 100) * segments);
    
    const track = document.getElementById(`string-track-${k}`);
    const valEl = document.getElementById(`string-val-${k}`);
    if (!track) return;
    
    // Rebuild segments with preview state
    let segmentsHtml = '';
    for (let i = 0; i < segments; i++) {
      let bgClass = 'bg-black/10 dark:bg-white/10';
      
      if (i < baseFilled) {
        bgClass = 'bg-dc-void dark:bg-dc-platinum';
      }
      if (i < previewFilled && previewVal > baseVal) {
        bgClass = 'bg-dc-red';
      } else if (i >= previewFilled && i < baseFilled && previewVal < baseVal) {
        bgClass = 'bg-dc-red/40';
      }
      
      segmentsHtml += `<div class="flex-1 h-full rounded-[1px] transition-colors duration-150 ${bgClass}"></div>`;
    }
    track.innerHTML = segmentsHtml;
    
    // Update value display
    if (valEl) {
      const diff = previewVal - baseVal;
      let diffColor = 'text-dc-storm';
      if (diff > 0) diffColor = 'text-dc-red';
      if (diff < 0) diffColor = 'text-dc-accent';
      
      valEl.innerHTML = `
        <span class="text-dc-storm">${baseVal}</span>
        <span class="text-dc-storm mx-1">→</span>
        <span class="${diffColor}">${previewVal}</span>
      `;
    }
  });
}

function _stringClearPreview() {
  const { baseStats } = _stringModState;
  const segments = 25;
  
  const statKeys = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability'];
  
  statKeys.forEach(k => {
    const baseVal = baseStats && baseStats[k] != null ? Math.round(baseStats[k]) : 50;
    const baseFilled = Math.round((baseVal / 100) * segments);
    
    const track = document.getElementById(`string-track-${k}`);
    const valEl = document.getElementById(`string-val-${k}`);
    if (!track) return;
    
    let segmentsHtml = '';
    for (let i = 0; i < segments; i++) {
      const bgClass = i < baseFilled ? 'bg-dc-void dark:bg-dc-platinum' : 'bg-black/10 dark:bg-white/10';
      segmentsHtml += `<div class="flex-1 h-full rounded-[1px] transition-colors duration-150 ${bgClass}"></div>`;
    }
    track.innerHTML = segmentsHtml;
    
    if (valEl) {
      valEl.innerHTML = `<span class="text-dc-void dark:text-dc-platinum">${baseVal}</span>`;
    }
  });
  
  // Disable add button
  const addBtn = document.getElementById('string-mod-add');
  if (addBtn) addBtn.disabled = true;
  
  // Clear OBS display
  const obsEl = document.getElementById('string-mod-obs');
  if (obsEl) obsEl.innerHTML = '<span class="font-mono text-4xl font-bold text-dc-storm">—</span>';
  
  // Hide delta display on racket page
  const deltaEl = document.getElementById('comp-string-delta');
  if (deltaEl) deltaEl.classList.add('opacity-0');
}

function _stringAddToLoadout() {
  const { stringId, crossesId, frameId, mode, mainsTension, crossesTension } = _stringModState;

  if (!stringId || !frameId) {
    alert('Please select both a string and a frame');
    return;
  }

  const isHybrid = mode === 'hybrid' && crossesId && crossesId !== stringId;

  const opts = {
    source: 'string-compendium',
    crossesTension: isHybrid ? crossesTension : mainsTension,
  };

  if (isHybrid) {
    opts.isHybrid   = true;
    opts.mainsId    = stringId;
    opts.crossesId  = crossesId;
  }

  const lo = createLoadout(frameId, stringId, mainsTension, opts);
  if (!lo) return;

  saveLoadout(lo);

  // Visual feedback
  const addBtn = document.getElementById('string-mod-add');
  if (addBtn) {
    const original = addBtn.textContent;
    addBtn.textContent = 'Saved ✓';
    addBtn.disabled = true;
    setTimeout(function() {
      addBtn.textContent = original;
      addBtn.disabled = false;
    }, 1500);
  }
}

function _stringSetActiveLoadout() {
  const { stringId, crossesId, frameId, mode, mainsTension, crossesTension } = _stringModState;

  if (!stringId || !frameId) {
    alert('Please select both a string and a frame');
    return;
  }

  const isHybrid = mode === 'hybrid' && crossesId && crossesId !== stringId;

  const opts = {
    source: 'string-compendium',
    crossesTension: isHybrid ? crossesTension : mainsTension,
  };

  if (isHybrid) {
    opts.isHybrid  = true;
    opts.mainsId   = stringId;
    opts.crossesId = crossesId;
  }

  // createLoadout computes stats, obs, identity — the full model
  const lo = createLoadout(frameId, stringId, mainsTension, opts);
  if (!lo) return;

  // Sync _stringModState so returning to Strings tab is consistent
  _stringModState.stringId      = stringId;
  _stringModState.crossesId     = isHybrid ? crossesId : stringId;
  _stringModState.frameId       = frameId;
  _stringModState.mode          = isHybrid ? 'hybrid' : 'fullbed';
  _stringModState.mainsTension  = mainsTension;
  _stringModState.crossesTension = isHybrid ? crossesTension : mainsTension;

  // Save + activate — activateLoadout calls hydrateDock which
  // syncs dock editor selects, then renderDashboard reads from
  // the now-complete loadout model via getSetupFromLoadout()
  saveLoadout(lo);
  activateLoadout(lo);
  
  // Switch to overview like Frame Compendium
  switchMode('overview');
  renderDashboard();
  
  // Visual feedback
  const activateBtn = document.getElementById('string-mod-activate');
  if (activateBtn) {
    const originalText = activateBtn.textContent;
    activateBtn.textContent = 'Active ✓';
    activateBtn.disabled = true;
    setTimeout(() => {
      activateBtn.textContent = originalText;
      activateBtn.disabled = false;
    }, 1500);
  }
}

// Generate "Best for" and "Watch out" pills based on frame stats
function _compGenerateHeroPills(frameStats, racquet) {
  const bestFor = [];
  const watchOut = [];
  
  // Console-style uppercase output for Digicraft bento aesthetic
  if (frameStats.spin >= 65) bestFor.push('TOPSPIN BASELINERS');
  if (frameStats.power >= 65) bestFor.push('FREE POWER SEEKERS');
  if (frameStats.control >= 65) bestFor.push('FLAT HIT PRECISION');
  if (frameStats.comfort >= 65) bestFor.push('ARM-FRIENDLY SESSIONS');
  if (frameStats.maneuverability >= 65) bestFor.push('FAST SWING STYLES');
  if (frameStats.stability >= 65) bestFor.push('HEAVY HITTERS');
  if (frameStats.feel >= 65) bestFor.push('TOUCH PLAYERS');
  
  if (frameStats.control < 55) watchOut.push('LOWER CONTROL CEILING');
  if (frameStats.comfort < 55) watchOut.push('HARSH ON ARM');
  if (frameStats.power < 55) watchOut.push('LESS FREE POWER');
  if (frameStats.stability < 55) watchOut.push('TWIST OFF-CENTER');
  if (frameStats.maneuverability < 55) watchOut.push('DEMANDS FAST PREP');
  if (racquet.strungWeight > 325) watchOut.push('HEAVY TECHNIQUE REQ');
  if (racquet.strungWeight < 290) watchOut.push('LIGHT PLOW-THROUGH');
  
  return { bestFor, watchOut };
}

// Generate reason text for featured build card
function _compGenerateBuildReason(build, frameStats) {
  return generateBuildReason(build, frameStats);
}

function initCompendium() {
  // Populate brand filter
  const brandSel = document.getElementById('comp-filter-brand');
  const brands = [...new Set(RACQUETS.map(r => _extractBrand(r.name)))].sort();
  brands.forEach(b => {
    const o = document.createElement('option');
    o.value = b;
    o.textContent = b;
    brandSel.appendChild(o);
  });

  // Populate frame list
  _compRenderRoster();

  // Wire search + filter events
  document.getElementById('comp-search').addEventListener('input', _compRenderRoster);
  document.getElementById('comp-filter-brand').addEventListener('change', _compRenderRoster);
  document.getElementById('comp-filter-pattern').addEventListener('change', _compRenderRoster);
  document.getElementById('comp-filter-stiffness').addEventListener('change', _compRenderRoster);
  document.getElementById('comp-filter-headsize').addEventListener('change', _compRenderRoster);
  document.getElementById('comp-filter-weight').addEventListener('change', _compRenderRoster);

  // Auto-select active racket from loadout, or first frame as fallback
  const setup = getCurrentSetup();
  if (setup && setup.racquet) {
    _compSelectFrame(setup.racquet.id);
  } else if (RACQUETS.length > 0) {
    _compSelectFrame(RACQUETS[0].id);
  }
}

function _extractBrand(name) {
  // Extract brand from racquet name (first word, or "Wilson" for "Wilson Pro Staff", etc.)
  const brandMap = {
    'Babolat': 'Babolat', 'Head': 'Head', 'Wilson': 'Wilson',
    'Yonex': 'Yonex', 'Tecnifibre': 'Tecnifibre', 'Prince': 'Prince',
    'Dunlop': 'Dunlop', 'Volkl': 'Volkl'
  };
  for (const [key, brand] of Object.entries(brandMap)) {
    if (name.startsWith(key)) return brand;
  }
  return name.split(' ')[0];
}

function _compGetFilteredRacquets() {
  const search = (document.getElementById('comp-search').value || '').toLowerCase();
  const brand = document.getElementById('comp-filter-brand').value;
  const pattern = document.getElementById('comp-filter-pattern').value;
  const stiffness = document.getElementById('comp-filter-stiffness').value;
  const headsize = document.getElementById('comp-filter-headsize').value;
  const weight = document.getElementById('comp-filter-weight').value;

  return RACQUETS.filter(r => {
    if (search && !r.name.toLowerCase().includes(search)) return false;
    if (brand && !r.name.startsWith(brand)) return false;
    if (pattern && r.pattern !== pattern) return false;
    if (stiffness === 'soft' && r.stiffness > 59) return false;
    if (stiffness === 'medium' && (r.stiffness < 60 || r.stiffness > 65)) return false;
    if (stiffness === 'stiff' && r.stiffness < 66) return false;
    if (headsize === '102' && r.headSize < 102) return false;
    if (headsize && headsize !== '102' && r.headSize !== parseInt(headsize)) return false;
    // Fix 4: Weight filter (strungWeight in grams)
    if (weight === 'ultralight' && r.strungWeight >= 285) return false;
    if (weight === 'light' && (r.strungWeight < 285 || r.strungWeight > 305)) return false;
    if (weight === 'medium' && (r.strungWeight < 305 || r.strungWeight > 320)) return false;
    if (weight === 'heavy' && (r.strungWeight < 320 || r.strungWeight > 340)) return false;
    if (weight === 'tour' && r.strungWeight <= 340) return false;
    return true;
  });
}

function _compRenderRoster() {
  const list = document.getElementById('comp-frame-list');
  const racquets = _compGetFilteredRacquets();

  list.innerHTML = racquets.map(r => {
    const isActive = r.id === _compSelectedRacquetId;
    const specs = `${r.strungWeight}g strung · ${r.stiffness} RA · ${r.pattern}`;
    const baseClasses = "bg-transparent border text-left flex flex-col justify-between gap-6 transition-all duration-200 cursor-pointer p-5";
    const borderClasses = isActive 
      ? "border-dc-accent" 
      : "border-dc-platinum-dim hover:border-dc-platinum";
    return `<button class="${baseClasses} ${borderClasses}" data-id="${r.id}" onclick="_compSelectFrame('${r.id}')">
      <div class="flex justify-between items-start gap-2">
        <span class="text-lg font-semibold leading-tight tracking-tight text-dc-void dark:text-dc-platinum">${r.name.replace(/\\s+\\d+g$/, '')}</span>
        <span class="font-mono text-[13px] tracking-[0.15em] text-dc-platinum-dim mt-1">${r.year}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="font-mono text-[13px] uppercase tracking-[0.15em] text-dc-accent">${r.identity || r.pattern}</span>
        <span class="font-mono text-[13px] font-semibold text-dc-void dark:text-dc-platinum">${specs}</span>
      </div>
    </button>`;
  }).join('');
}

function _compSelectFrame(racquetId) {
  // Auto-close HUD on selection
  const hud = document.getElementById('comp-hud');
  if (hud) {
    hud.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  _compSelectedRacquetId = racquetId;
  const racquet = RACQUETS.find(r => r.id === racquetId);
  if (!racquet) return;

  // Highlight in roster (Tailwind class injection)
  document.querySelectorAll('#comp-frame-list > button').forEach(el => {
    const isActive = el.dataset.id === racquetId;
    el.classList.remove('border-dc-accent', 'border-dc-platinum-dim');
    el.classList.add(isActive ? 'border-dc-accent' : 'border-dc-platinum-dim');
  });

  // Transition: fade out → render → fade in
  var main = document.getElementById('comp-main');
  if (main) {
    main.style.opacity = '0.3';
    main.style.transition = 'opacity 150ms ease-out';
    setTimeout(function() {
      _compRenderMain(racquet);
      main.style.opacity = '1';
    }, 150);
  } else {
    _compRenderMain(racquet);
  }
}

// Sync racket bible with active loadout (called when switching back to compendium mode)
function _compSyncWithActiveLoadout() {
  const setup = getCurrentSetup();
  if (!setup || !setup.racquet) return;
  
  const activeRacquetId = setup.racquet.id;
  
  // If already showing the active racket, just re-init the string injector
  if (_compSelectedRacquetId === activeRacquetId) {
    _compInitStringInjector(setup.racquet);
  } else {
    // Switch to the active racket
    _compSelectFrame(activeRacquetId);
  }
}

function _compRenderMain(racquet) {
  const main = document.getElementById('comp-main');
  const frameBase = calcFrameBase(racquet);
  const beamStr = Array.isArray(racquet.beamWidth) ? racquet.beamWidth.join('/') + 'mm' : racquet.beamWidth + 'mm';
  
  // Sync _stringModState so String Modulator has baseStats for delta calculation
  _stringModState.frameId = racquet.id;
  _stringModState.baseStats = frameBase;

  // Generate or cache top builds
  if (!_compendiumBuildCache[racquet.id]) {
    _compendiumBuildCache[racquet.id] = _compGenerateTopBuilds(racquet, 6);
  }
  const builds = _compendiumBuildCache[racquet.id];

  // Sort builds by current key
  const sorted = [...builds].sort((a, b) => {
    if (_compSortKey === 'score') return b.score - a.score;
    return (b.stats[_compSortKey] || 0) - (a.stats[_compSortKey] || 0);
  });
  _compCurrentBuilds = sorted; // store for index-based action handlers

  // Generate hero console output (Tailwind)
  const pills = _compGenerateHeroPills(frameBase, racquet);
  const consoleHtml = [];
  pills.bestFor.forEach(p => consoleHtml.push(`<span class="font-mono text-[13px] font-bold tracking-[0.05em] uppercase text-dc-void dark:text-dc-platinum">[+] ${p.toUpperCase()}</span>`));
  pills.watchOut.forEach(p => consoleHtml.push(`<span class="font-mono text-[13px] font-bold tracking-[0.05em] uppercase text-dc-red">[-] ${p.toUpperCase()}</span>`));

  // Generate Base Frame Profile Stats (Tailwind Battery UI with preview support)
  let statsHtml = '<div class="flex flex-col gap-6">';
  const statGroups = [
    { title: 'Attack', stats: [ {id: 'spin', label: 'Spin'}, {id: 'power', label: 'Power'}, {id: 'launch', label: 'Launch'} ] },
    { title: 'Defense', stats: [ {id: 'control', label: 'Control'}, {id: 'stability', label: 'Stability'}, {id: 'forgiveness', label: 'Forgiveness'} ] },
    { title: 'Touch', stats: [ {id: 'feel', label: 'Feel'}, {id: 'comfort', label: 'Comfort'}, {id: 'maneuverability', label: 'Maneuverability'} ] }
  ];

  statGroups.forEach(g => {
    statsHtml += `<div class="flex flex-col">
      <h4 class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em] border-b border-dc-border pb-2 mb-3">${g.title}</h4>
      <div class="flex flex-col gap-2.5">`;
    
    g.stats.forEach(s => {
      let val = Math.round(frameBase[s.id]);
      let pct = Math.max(0, Math.min(100, val));
      
      // Battery segment generator (25 segments for preview granularity)
      const totalSegments = 25;
      const filledSegments = Math.round((pct / 100) * totalSegments);
      
      let batteryHtml = `<div class="flex flex-1 gap-[2px] h-1.5 items-center" id="comp-track-${s.id}" data-base="${val}">`;
      for(let i = 0; i < totalSegments; i++) {
        const bgClass = i < filledSegments 
          ? 'bg-dc-void dark:bg-dc-platinum'
          : 'bg-black/10 dark:bg-white/10';
        
        batteryHtml += `<div class="flex-1 h-full rounded-[1px] transition-colors duration-150 ${bgClass}" data-seg="${i}"></div>`;
      }
      batteryHtml += '</div>';

      statsHtml += `
        <div class="flex items-center gap-4 group" data-stat="${s.id}">
          <span class="font-mono text-[13px] text-dc-storm group-hover:text-dc-platinum transition-colors uppercase tracking-[0.15em] w-28">${s.label}</span>
          ${batteryHtml}
          <span class="font-mono text-[13px] font-bold text-dc-void dark:text-dc-platinum w-8 text-right" id="comp-val-${s.id}">${val}</span>
        </div>`;
    });
    statsHtml += `</div></div>`;
  });
  statsHtml += '</div>';

  // Sort tabs
  const sortOptions = [
    { key: 'score', label: 'OBS' },
    { key: 'spin', label: 'Spin' },
    { key: 'control', label: 'Control' },
    { key: 'power', label: 'Power' },
    { key: 'comfort', label: 'Comfort' },
    { key: 'durability', label: 'Durability' }
  ];
  const sortTabsHtml = sortOptions.map(s => {
    const isActive = _compSortKey === s.key;
    const baseClasses = "font-mono text-[12px] uppercase tracking-[0.1em] pb-2 transition-colors";
    const activeClasses = isActive 
      ? "text-dc-accent border-b-2 border-dc-accent -mb-[9px] pb-[7px]" 
      : "text-dc-storm hover:text-dc-platinum";
    return `<button class="${baseClasses} ${activeClasses}" onclick="_compSetSort('${s.key}')">${s.label}</button>`;
  }).join('');

  // Build cards - pass frameBase for reason generation
  const cardsHtml = sorted.map((b, i) => _compRenderBuildCard(b, i, racquet, frameBase)).join('');

  main.innerHTML = `
    <!-- Hero Block -->
    <div class="relative flex flex-col items-start mb-8">
      
      <div class="absolute top-6 right-6 md:top-8 md:right-8 flex flex-col items-end">
        <span class="font-mono text-[13px] text-dc-storm tracking-[0.2em] mb-1">BASE SCORE</span>
        <span class="font-mono text-5xl font-semibold leading-[0.85] text-dc-void dark:text-dc-platinum">
          ${(function() {
            const fb = calcFrameBase(racquet);
            const baseObs = Math.round(
              fb.spin * 0.15 +
              fb.power * 0.12 +
              fb.control * 0.18 +
              fb.comfort * 0.12 +
              fb.feel * 0.10 +
              fb.stability * 0.12 +
              fb.forgiveness * 0.08 +
              fb.maneuverability * 0.08
            );
            // Store baseObs globally for delta calculation
            window._compBaseObs = baseObs;
            return baseObs;
          })()}<span class="text-xl text-dc-storm ml-1">OBS</span>
        </span>
        <!-- String injection delta - updated by string modulator -->
        <div id="comp-string-delta" class="flex items-center gap-1 mt-1 opacity-0 transition-opacity duration-200">
          <span class="font-mono text-lg font-bold text-dc-red">+</span>
          <span class="font-mono text-lg font-bold text-dc-red" id="comp-string-delta-value">0</span>
          <span class="font-mono text-xs text-dc-storm/60 ml-0.5">OBS</span>
        </div>
      </div>
      
      <h2 class="text-5xl md:text-[4rem] font-semibold tracking-tight text-dc-void dark:text-dc-platinum leading-none mb-0 pr-[120px] flex items-center gap-3 cursor-pointer group" onclick="_compToggleHud()">
        ${racquet.name.replace(/\s+\d+g$/, ' ' + (Math.round((racquet.strungWeight - 13) / 5) * 5) + 'g')}
        <span class="text-2xl text-dc-red opacity-50 group-hover:opacity-100 transition-opacity">▼</span>
      </h2>
      
      <div class="flex items-center gap-2 mt-4 font-mono text-[13px] flex-wrap">
        <span class="text-dc-void dark:text-dc-platinum">${racquet.year}</span>
        <span class="text-dc-accent opacity-60 text-[13px]">//</span>
        <span class="text-dc-storm uppercase tracking-[0.15em]">${racquet.identity || ''}</span>
      </div>
      
      ${racquet.notes ? `<p class="max-w-[650px] mt-6 text-sm leading-relaxed text-dc-storm">${racquet.notes}</p>` : ''}
      
      <div class="grid grid-cols-3 md:grid-cols-6 gap-8 w-full mt-12 pt-8 border-t border-dc-border">
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-void dark:text-dc-platinum leading-none">${racquet.swingweight}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">SWINGWEIGHT</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-void dark:text-dc-platinum leading-none">${racquet.stiffness}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">STIFFNESS</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-void dark:text-dc-platinum leading-none">${racquet.pattern}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">PATTERN</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-void dark:text-dc-platinum leading-none">${racquet.headSize}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">HEAD SIZE</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-void dark:text-dc-platinum leading-none">${racquet.balancePts}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">BALANCE</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-void dark:text-dc-platinum leading-none">${racquet.tensionRange[0]}–${racquet.tensionRange[1]}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">TENSION</span>
        </div>
      </div>

      ${consoleHtml.length > 0 ? `<div class="flex flex-wrap gap-4 w-full mt-8 p-0">${consoleHtml.join('')}</div>` : ''}
    </div>

    <!-- String Modulator Panel -->
    <div class="bg-transparent border border-dc-storm/30 p-5 md:p-6 mb-10 flex flex-col gap-5">
      
      <div class="flex justify-between items-center border-b border-dc-storm/30 pb-3 mb-1">
        <span class="font-mono text-[13px] text-dc-accent uppercase tracking-[0.2em]">//STRING MODULATOR</span>
        <div class="flex gap-4">
          <button class="comp-inject-mode-btn text-dc-accent border-dc-accent border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors" data-mode="fullbed" onclick="_compSetInjectMode('fullbed')">Full Bed</button>
          <button class="comp-inject-mode-btn text-dc-storm border-transparent border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors" data-mode="hybrid" onclick="_compSetInjectMode('hybrid')">Hybrid</button>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <!-- Mains Column -->
        <div class="flex flex-col gap-3" id="comp-mains-col">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]" id="comp-mains-label">// STRING</span>
          <div id="comp-mains-select" class="comp-string-select-container"></div>
          <div class="grid grid-cols-2 gap-4">
            <select class="appearance-none bg-transparent border-b border-dc-storm/50 text-dc-void dark:text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%235E666C%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpolyline%20points=%276%209%2012%2015%2018%209%27%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-right pr-5 cursor-pointer" id="comp-mains-gauge">
              <option value="">Gauge...</option>
            </select>
            <input type="number" class="bg-transparent border-b border-dc-storm/50 text-dc-void dark:text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors" id="comp-mains-tension" value="52" min="30" max="70" step="1">
          </div>
        </div>
        
        <!-- Crosses Column (hidden string selector in fullbed) -->
        <div class="flex flex-col gap-3" id="comp-crosses-col">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]" id="comp-crosses-label">// CROSSES</span>
          <div id="comp-crosses-select" class="comp-string-select-container" style="display:none;"></div>
          <div class="grid grid-cols-2 gap-4">
            <select class="appearance-none bg-transparent border-b border-dc-storm/50 text-dc-void dark:text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%235E666C%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpolyline%20points=%276%209%2012%2015%2018%209%27%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-right pr-5 cursor-pointer" id="comp-crosses-gauge">
              <option value="">Gauge...</option>
            </select>
            <input type="number" class="bg-transparent border-b border-dc-storm/50 text-dc-void dark:text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors" id="comp-crosses-tension" value="50" min="30" max="70" step="1">
          </div>
        </div>
      </div>

      <div class="flex gap-2 mt-2">
        <button class="flex-1 font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-storm/50 text-dc-void dark:text-dc-platinum hover:bg-dc-storm/20 hover:border-dc-storm transition-colors disabled:opacity-30 disabled:cursor-not-allowed" id="comp-inject-apply" disabled onclick="_compApplyInjection()">Apply</button>
        <button class="font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-storm/50 text-dc-storm hover:bg-dc-storm/10 hover:text-dc-void dark:hover:text-dc-platinum hover:border-dc-storm transition-colors" onclick="_compClearInjection()">Clear</button>
      </div>
    </div>

    <div class="mb-12">
      <h3 class="font-mono text-xs tracking-[0.15em] text-dc-void dark:text-dc-platinum uppercase mb-1">// BASE FRAME PROFILE</h3>
      <p class="text-xs text-dc-storm mb-6 italic">Frame-only characteristics before string influence</p>
      ${statsHtml}
    </div>

    <!-- Top Builds -->
    <div class="mb-12">
      <div class="flex items-center justify-between mb-4 pb-2 border-b border-dc-border/50">
        <h3 class="font-mono text-xs tracking-[0.15em] text-dc-void dark:text-dc-platinum uppercase">//TOP BUILDS</h3>
        <div class="flex gap-4 border-b border-transparent pb-0">${sortTabsHtml}</div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">${cardsHtml}</div>
    </div>
  `;
  
  // Initialize string matrix injector searchable selects
  _compInitStringInjector(racquet);
}

// Global state for string injection
let _compInjectState = {
  racquet: null,
  mainsId: '',
  crossesId: '',
  mode: 'fullbed',
  baseStats: null
};

// Update mode UI only (for initialization - doesn't modify state)
function _compUpdateInjectModeUI(mode) {
  // Update button states - Tailwind class injection
  document.querySelectorAll('.comp-inject-mode-btn').forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    
    // Strip old state
    btn.classList.remove('text-dc-accent', 'border-dc-accent', 'text-dc-storm', 'border-transparent');
    
    // Apply new state
    if (isActive) {
      btn.classList.add('text-dc-accent', 'border-dc-accent');
    } else {
      btn.classList.add('text-dc-storm', 'border-transparent');
    }
  });
  
  const crossesSelect = document.getElementById('comp-crosses-select');
  const mainsLabel = document.getElementById('comp-mains-label');
  const crossesLabel = document.getElementById('comp-crosses-label');
  
  if (mode === 'hybrid') {
    // Hybrid: Show crosses string selector, update labels
    if (crossesSelect) crossesSelect.style.display = 'block';
    if (mainsLabel) mainsLabel.textContent = '// MAINS';
    if (crossesLabel) crossesLabel.textContent = '// CROSSES';
  } else {
    // Fullbed: Hide crosses string selector, update labels
    if (crossesSelect) crossesSelect.style.display = 'none';
    if (mainsLabel) mainsLabel.textContent = '// STRING';
    if (crossesLabel) crossesLabel.textContent = '// CROSSES';
  }
}

// Set injection mode (fullbed/hybrid) - for user clicks, modifies state
function _compSetInjectMode(mode) {
  _compInjectState.mode = mode;
  
  // Update UI
  _compUpdateInjectModeUI(mode);
  
  if (mode === 'hybrid') {
    // If entering hybrid with no crosses selected, default to mains
    if (!_compInjectState.crossesId && _compInjectState.mainsId) {
      _compInjectState.crossesId = _compInjectState.mainsId;
      // Update the crosses selector UI using the stored instance
      const crossesInstance = ssInstances['comp-crosses-select'];
      if (crossesInstance) {
        crossesInstance.setValue(_compInjectState.mainsId);
      }
      // Sync crosses gauge dropdown too
      _compPopulateGaugeDropdown('comp-crosses-gauge', _compInjectState.mainsId);
    }
  } else {
    // Fullbed: Sync crosses string ID with mains for preview calculation
    if (_compInjectState.mainsId) {
      _compInjectState.crossesId = _compInjectState.mainsId;
      // Update crosses selector to match mains
      const crossesInstance = ssInstances['comp-crosses-select'];
      if (crossesInstance) {
        crossesInstance.setValue(_compInjectState.mainsId);
      }
      _compPopulateGaugeDropdown('comp-crosses-gauge', _compInjectState.mainsId);
    }
  }
  
  // Re-compute preview immediately
  _compPreviewStats();
}

// Initialize searchable selects for string matrix injector
function _compInitStringInjector(racquet) {
  _compInjectState.racquet = racquet;
  _compInjectState.baseStats = calcFrameBase(racquet);
  
  const mainsContainer = document.getElementById('comp-mains-select');
  const crossesContainer = document.getElementById('comp-crosses-select');
  if (!mainsContainer) return;
  
  // Clear containers to prevent duplicate initialization issues
  mainsContainer.innerHTML = '';
  if (crossesContainer) crossesContainer.innerHTML = '';
  
  // Get active loadout to check if we're viewing the same racket
  const setup = getCurrentSetup();
  const isViewingActiveRacket = setup?.racquet?.id === racquet.id;
  
  // Only load strings from loadout if viewing the active racket
  // Otherwise, start fresh (user is exploring a different racket)
  let isHybrid, mainsId, crossesId, mainsTension, crossesTension;
  
  if (isViewingActiveRacket && setup?.stringConfig) {
    isHybrid = setup.stringConfig.isHybrid || false;
    mainsId = isHybrid ? setup.stringConfig.mains?.id : setup.stringConfig.string?.id;
    crossesId = isHybrid ? setup.stringConfig.crosses?.id : setup.stringConfig.string?.id;
    mainsTension = setup.stringConfig.mainsTension;
    crossesTension = setup.stringConfig.crossesTension;
  } else {
    // Fresh start for new racket exploration
    isHybrid = false;
    mainsId = '';
    crossesId = '';
  }
  
  // Default tensions from racket range if not set
  const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
  if (!mainsTension) mainsTension = midTension;
  if (!crossesTension) crossesTension = midTension - 2;
  
  // Set initial mode
  _compInjectState.mode = isHybrid ? 'hybrid' : 'fullbed';
  _compInjectState.mainsId = mainsId || '';
  _compInjectState.crossesId = crossesId || mainsId || '';
  
  // Ensure crossesId defaults to mainsId in hybrid mode if not set
  const effectiveCrossesId = crossesId || mainsId || '';
  
  // Sync _stringModState for delta calculation consistency
  _stringModState.frameId = racquet.id;
  _stringModState.baseStats = calcFrameBase(racquet);
  _stringModState.mode = isHybrid ? 'hybrid' : 'fullbed';
  _stringModState.stringId = mainsId || '';
  _stringModState.crossesId = effectiveCrossesId;
  _stringModState.mainsTension = mainsTension;
  _stringModState.crossesTension = crossesTension;
  
  // Also ensure _compInjectState.crossesId matches the effective value
  _compInjectState.crossesId = effectiveCrossesId;
  
  // Set tensions from loadout or defaults
  document.getElementById('comp-mains-tension').value = mainsTension;
  document.getElementById('comp-crosses-tension').value = crossesTension;
  
  // Initialize mains selector with loadout value
  ssInstances['comp-mains-select'] = createSearchableSelect(mainsContainer, {
    type: 'string',
    placeholder: 'Select String...',
    value: mainsId || '',
    onChange: (val) => {
      _compInjectState.mainsId = val;
      _compPopulateGaugeDropdown('comp-mains-gauge', val);
      
      // In fullbed mode, also populate crosses gauge options (same string)
      if (_compInjectState.mode === 'fullbed' && val) {
        _compInjectState.crossesId = val;
        _compPopulateGaugeDropdown('comp-crosses-gauge', val);
      }
      
      _compPreviewStats();
    }
  });
  
  // Initialize crosses selector with loadout value
  if (crossesContainer) {
    ssInstances['comp-crosses-select'] = createSearchableSelect(crossesContainer, {
      type: 'string',
      placeholder: 'Select Cross String...',
      value: effectiveCrossesId,
      id: 'comp-crosses-select-trigger',
      onChange: (val) => {
        _compInjectState.crossesId = val;
        _compPopulateGaugeDropdown('comp-crosses-gauge', val);
        _compPreviewStats();
      }
    });
  }
  
  // Wire up tension and gauge inputs - all independent
  ['comp-mains-tension', 'comp-crosses-tension', 'comp-mains-gauge', 'comp-crosses-gauge'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', _compPreviewStats);
      el.addEventListener('input', _compPreviewStats);
    }
  });
  
  // Set initial mode UI but DON'T let it override our state
  _compUpdateInjectModeUI(isHybrid ? 'hybrid' : 'fullbed');
  
  // Trigger initial preview with loadout values (if any)
  if (mainsId) {
    _compPopulateGaugeDropdown('comp-mains-gauge', mainsId);
    if (isHybrid && effectiveCrossesId) {
      _compPopulateGaugeDropdown('comp-crosses-gauge', effectiveCrossesId);
    } else if (!isHybrid && mainsId) {
      _compPopulateGaugeDropdown('comp-crosses-gauge', mainsId);
    }
    _compPreviewStats();
  } else {
    // For fresh racket exploration, clear stat bars to base frame values
    _compClearPreview();
  }
}

// Populate gauge dropdown for a string
function _compPopulateGaugeDropdown(selectId, stringId) {
  const select = document.getElementById(selectId);
  if (!select || !stringId) return;
  
  const string = STRINGS.find(s => s.id === stringId);
  if (!string) return;
  
  const gauges = getGaugeOptions(string);
  select.innerHTML = '<option value="">Gauge...</option>' + 
    gauges.map(g => `<option value="${g}" ${Math.abs(g - string.gaugeNum) < 0.01 ? 'selected' : ''}>${GAUGE_LABELS[g] || g + 'mm'}</option>`).join('');
}

// Preview stats with string injection
function _compPreviewStats() {
  const { racquet, mainsId, crossesId, mode, baseStats } = _compInjectState;
  if (!racquet || !mainsId) return _compClearPreview();
  
  const mainsString = STRINGS.find(s => s.id === mainsId);
  if (!mainsString) return _compClearPreview();
  
  // Get effective crosses string
  let crossesString = mainsString;
  if (mode === 'hybrid' && crossesId) {
    crossesString = STRINGS.find(s => s.id === crossesId) || mainsString;
  }
  
  // Apply gauge modifiers
  const mainsGauge = document.getElementById('comp-mains-gauge').value;
  const crossesGauge = document.getElementById('comp-crosses-gauge').value;
  const mainsWithGauge = mainsGauge ? applyGaugeModifier(mainsString, parseFloat(mainsGauge)) : mainsString;
  const crossesWithGauge = crossesGauge ? applyGaugeModifier(crossesString, parseFloat(crossesGauge)) : crossesString;
  
  // Get tensions
  const mainsTension = parseInt(document.getElementById('comp-mains-tension').value) || 52;
  const crossesTension = parseInt(document.getElementById('comp-crosses-tension').value) || 50;
  
  const isHybrid = mode === 'hybrid';
  
  // Build config for predictSetup
  const cfg = isHybrid ? {
    isHybrid: true,
    mains: mainsWithGauge,
    crosses: crossesWithGauge,
    mainsTension,
    crossesTension
  } : {
    isHybrid: false,
    string: mainsWithGauge,  // Fullbed uses single string
    mainsTension,
    crossesTension
  };
  
  // Run prediction
  const previewStats = predictSetup(racquet, cfg);
  if (!previewStats) return;
  
  // Update stat bars with before/after
  _compRenderPreviewBars(baseStats, previewStats);
  
  // Calculate and update OBS delta display
  const tCtx = buildTensionContext(cfg, racquet);
  const obs = computeCompositeScore(previewStats, tCtx);
  const baseObs = window._compBaseObs || Math.round(
    baseStats.spin * 0.15 +
    baseStats.power * 0.12 +
    baseStats.control * 0.18 +
    baseStats.comfort * 0.12 +
    baseStats.feel * 0.10 +
    baseStats.stability * 0.12 +
    baseStats.forgiveness * 0.08 +
    baseStats.maneuverability * 0.08
  );
  const delta = Math.round((obs - baseObs) * 10) / 10;
  
  // Update delta on racket page
  const main = document.getElementById('comp-main');
  let deltaEl = document.getElementById('comp-string-delta');
  let deltaValEl = document.getElementById('comp-string-delta-value');
  if (!deltaEl && main) {
    deltaEl = main.querySelector('#comp-string-delta');
    deltaValEl = main.querySelector('#comp-string-delta-value');
  }
  if (deltaEl && deltaValEl && delta > 0) {
    deltaValEl.textContent = delta;
    deltaEl.classList.remove('opacity-0');
  } else if (deltaEl) {
    deltaEl.classList.add('opacity-0');
  }
  
  // Enable apply button
  const applyBtn = document.getElementById('comp-inject-apply');
  if (applyBtn) applyBtn.disabled = false;
}

// Render preview bars showing before/after (Tailwind battery style)
function _compRenderPreviewBars(baseStats, previewStats) {
  const statKeys = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability'];
  const segments = 25;
  
  statKeys.forEach(k => {
    const baseVal = baseStats[k] != null ? Math.round(baseStats[k]) : 50;
    const previewVal = previewStats[k] != null ? Math.round(previewStats[k]) : 50;
    const baseFilled = Math.round((baseVal / 100) * segments);
    const previewFilled = Math.round((previewVal / 100) * segments);
    
    const track = document.getElementById(`comp-track-${k}`);
    if (!track) return;
    
    // Rebuild segments with preview state (Tailwind classes)
    let segmentsHtml = '';
    for (let i = 0; i < segments; i++) {
      let bgClass = 'bg-black/10 dark:bg-white/10'; // empty
      
      if (i < baseFilled) {
        bgClass = 'bg-dc-void dark:bg-dc-platinum'; // base value
      }
      if (i < previewFilled && previewVal > baseVal) {
        bgClass = 'bg-dc-red'; // increased (red)
      } else if (i >= previewFilled && i < baseFilled && previewVal < baseVal) {
        bgClass = 'bg-dc-red/40'; // decreased (dark red)
      }
      
      segmentsHtml += `<div class="flex-1 h-full rounded-[1px] transition-colors duration-150 ${bgClass}" data-seg="${i}"></div>`;
    }
    track.innerHTML = segmentsHtml;
    track.dataset.hasPreview = 'true';
    
    // Update value display
    const valEl = document.getElementById(`comp-val-${k}`);
    if (valEl) {
      const diff = previewVal - baseVal;
      let diffColor = 'text-dc-storm';
      if (diff > 0) diffColor = 'text-dc-red';
      if (diff < 0) diffColor = 'text-dc-accent';
      
      valEl.innerHTML = `
        <span class="text-dc-storm">${baseVal}</span>
        <span class="text-dc-storm mx-1">→</span>
        <span class="${diffColor}">${previewVal}</span>
      `;
    }
  });
}

// Clear preview and reset to base stats (Tailwind)
function _compClearPreview() {
  const { baseStats } = _compInjectState;
  if (!baseStats) return;
  
  const statKeys = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability'];
  const segments = 25;
  
  statKeys.forEach(k => {
    const baseVal = baseStats[k] != null ? Math.round(baseStats[k]) : 50;
    const baseFilled = Math.round((baseVal / 100) * segments);
    
    const track = document.getElementById(`comp-track-${k}`);
    if (track) {
      // Reset to base segments only (Tailwind)
      let segmentsHtml = '';
      for (let i = 0; i < segments; i++) {
        const bgClass = i < baseFilled 
          ? 'bg-dc-void dark:bg-dc-platinum' 
          : 'bg-black/10 dark:bg-white/10';
        segmentsHtml += `<div class="flex-1 h-full rounded-[1px] transition-colors duration-150 ${bgClass}" data-seg="${i}"></div>`;
      }
      track.innerHTML = segmentsHtml;
      delete track.dataset.hasPreview;
    }
    
    const valEl = document.getElementById(`comp-val-${k}`);
    if (valEl) valEl.innerHTML = `<span class="text-dc-void dark:text-dc-platinum">${baseVal}</span>`;
  });
  
  // Disable apply button
  const applyBtn = document.getElementById('comp-inject-apply');
  if (applyBtn) applyBtn.disabled = true;
  
  // Hide delta display
  const deltaEl = document.getElementById('comp-string-delta');
  if (deltaEl) deltaEl.classList.add('opacity-0');
}

// Apply injection to create a new loadout
function _compApplyInjection() {
  const { racquet, mainsId, crossesId, mode } = _compInjectState;
  if (!racquet || !mainsId) return;
  
  const mainsGauge = document.getElementById('comp-mains-gauge').value;
  const crossesGauge = document.getElementById('comp-crosses-gauge').value;
  const mainsTension = parseInt(document.getElementById('comp-mains-tension').value);
  const crossesTension = parseInt(document.getElementById('comp-crosses-tension').value);
  
  const isHybrid = mode === 'hybrid';
  // In fullbed mode, crosses uses same string as mains but can have different gauge/tension
  const effectiveCrossesId = isHybrid && crossesId ? crossesId : mainsId;
  
  // Create loadout using the app's createLoadout function
  // Note: For hybrid, we pass mainsId as stringId (2nd param) because createLoadout 
  // validates that stringId exists even for hybrid. The hybrid logic uses opts.mainsId/crossesId.
  const lo = createLoadout(racquet.id, mainsId, mainsTension, {
    isHybrid,
    mainsId,
    crossesId: effectiveCrossesId,
    crossesTension: crossesTension,
    mainsGauge: mainsGauge || undefined,
    crossesGauge: crossesGauge || undefined,
    source: 'bible'
  });
  
  if (lo) {
    activateLoadout(lo);
    switchMode('overview');
  }
}

// Clear injection and reset all fields
function _compClearInjection() {
  _compInjectState.mainsId = '';
  _compInjectState.crossesId = '';
  
  // Clear stored selector instances
  delete ssInstances['comp-mains-select'];
  delete ssInstances['comp-crosses-select'];
  
  // Reset selectors
  const mainsContainer = document.getElementById('comp-mains-select');
  const crossesContainer = document.getElementById('comp-crosses-select');
  if (mainsContainer) mainsContainer.innerHTML = '';
  if (crossesContainer) crossesContainer.innerHTML = '';
  
  // Reset gauge dropdowns
  const mainsGauge = document.getElementById('comp-mains-gauge');
  const crossesGauge = document.getElementById('comp-crosses-gauge');
  if (mainsGauge) mainsGauge.innerHTML = '<option value="">Gauge...</option>';
  if (crossesGauge) crossesGauge.innerHTML = '<option value="">Gauge...</option>';
  
  // Reset tensions to frame midpoint
  const { racquet } = _compInjectState;
  if (racquet) {
    const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
    document.getElementById('comp-mains-tension').value = midTension;
    document.getElementById('comp-crosses-tension').value = midTension - 2;
  }
  
  // Clear preview
  _compClearPreview();
  
  // Re-initialize selectors
  if (racquet) _compInitStringInjector(racquet);
}

function _compGenerateTopBuilds(racquet, count) {
  return generateTopBuilds(racquet, count);
}

function _compPickDiverseBuilds(builds, count) {
  return pickDiverseBuilds(builds, count);
}

// Digicraft Brutalism — monochrome archetype colors imported from presets.js
const _compArchetypeColors = ARCHETYPE_COLORS;

function _compRenderBuildCard(build, index, racquet, frameStats) {
  const isFeatured = index === 0;
  
  // Tightened padding from p-6 to p-5
  const cardClasses = isFeatured 
    ? "relative bg-transparent border border-dc-accent shadow-[0_0_15px_rgba(255,69,0,0.05)] p-5 flex flex-col transition-colors duration-200 col-span-full"
    : "relative bg-transparent border border-dc-storm/30 hover:border-dc-storm p-5 flex flex-col transition-colors duration-200";

  // Scaled down badge
  const badgeHtml = isFeatured 
    ? `<div class="absolute -top-[1px] -left-[1px] bg-dc-accent text-dc-void font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">BEST OVERALL</div>` 
    : '';

  // Tighter margins for reason
  const reasonHtml = isFeatured && frameStats
    ? `<div class="text-xs text-dc-void/80 dark:text-dc-platinum/90 mb-4 pl-3 border-l-2 border-dc-storm italic">${_compGenerateBuildReason(build, frameStats)}</div>`
    : '';

  // Build string label and meta
  const isHybrid = build.type === 'hybrid';
  const stringLabel = isHybrid ? (build.label || build.string.name) : build.string.name;
  const metaLabel = isHybrid ? `Hybrid · M:${build.tension} / X:${build.crossesTension}` : `Full Bed · ${build.tension} lbs`;
  const s = build.stats;

  // Compressed terminal stats - top 3 only
  const statEntries = [
    { key: 'SPIN', val: Math.round(s.spin) },
    { key: 'PWR', val: Math.round(s.power) },
    { key: 'CTRL', val: Math.round(s.control) },
    { key: 'CMF', val: Math.round(s.comfort) },
    { key: 'FEEL', val: Math.round(s.feel) },
    { key: 'DUR', val: Math.round(s.durability) }
  ].sort((a, b) => b.val - a.val).slice(0, 3);

  const statsHtml = statEntries.map(st => 
    `<span class="font-mono text-[13px] text-dc-storm tracking-widest">[${st.key} <b class="text-xs text-dc-void dark:text-dc-platinum font-semibold ml-0.5">${st.val}</b>]</span>`
  ).join('');

  return `
    <div class="${cardClasses}">
      ${badgeHtml}
      
      <div class="flex justify-between items-start my-1.5">
        <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">${build.archetype}</span>
        <span class="font-mono text-4xl md:text-5xl font-semibold text-dc-void dark:text-dc-platinum leading-[0.8] tracking-tighter">${build.score.toFixed(1)}</span>
      </div>

      <div class="text-base font-semibold text-dc-void dark:text-dc-platinum tracking-tight mb-0.5 pr-12 leading-tight">${stringLabel}</div>
      <div class="font-mono text-[12px] text-dc-storm mb-4">${metaLabel}</div>

      ${reasonHtml}

      <div class="grid grid-cols-3 gap-2 mt-auto mb-4">
        <button class="bg-transparent border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-void font-mono text-[13px] uppercase tracking-widest py-1.5 transition-colors text-center" onclick="_compAction('setActive', ${index})">Set Active</button>
        <button class="bg-transparent border border-dc-storm/50 dark:border-dc-storm/30 text-dc-storm hover:border-dc-storm hover:bg-dc-storm/10 hover:text-dc-void dark:hover:text-dc-platinum font-mono text-[13px] uppercase tracking-widest py-1.5 transition-colors text-center" onclick="_compAction('tune', ${index})">Tune</button>
        <button class="bg-transparent border border-dc-storm/50 dark:border-dc-storm/30 text-dc-storm hover:border-dc-storm hover:bg-dc-storm/10 hover:text-dc-void dark:hover:text-dc-platinum font-mono text-[13px] uppercase tracking-widest py-1.5 transition-colors text-center" onclick="_compAction('save', ${index}, event)">Save</button>
      </div>

      <div class="flex flex-wrap gap-3 pt-3 border-t border-dc-storm/30 dark:border-dc-storm/20">
        ${statsHtml}
      </div>
    </div>
  `;
}

function _compSetSort(key) {
  _compSortKey = key;
  const racquet = RACQUETS.find(r => r.id === _compSelectedRacquetId);
  if (racquet) _compRenderMain(racquet);
}

// --- Build card action handlers ---
// Unified action handler — reads full build data from _compCurrentBuilds by index.
// Correctly handles both full-bed and hybrid builds.

function _compCreateLoadoutFromBuild(build) {
  var racquetId = _compSelectedRacquetId;
  var isHybrid = build.type === 'hybrid';
  var opts = {
    source: 'compendium',
    isHybrid: isHybrid,
    crossesTension: build.crossesTension || build.tension,
  };
  if (isHybrid) {
    opts.mainsId = build.mainsId;
    opts.crossesId = build.crossesId;
  }
  var stringId = isHybrid ? build.mainsId : build.string.id;
  return createLoadout(racquetId, stringId, build.tension, opts);
}

function _compAction(action, buildIndex, evt) {
  var build = _compCurrentBuilds[buildIndex];
  if (!build) return;

  if (action === 'save') {
    var lo = _compCreateLoadoutFromBuild(build);
    if (lo) {
      saveLoadout(lo);
      // Visual feedback
      var btn = evt && evt.target;
      if (btn) {
        btn.textContent = 'Saved \u2713';
        btn.disabled = true;
        setTimeout(function() { btn.textContent = 'Save'; btn.disabled = false; }, 1500);
      }
    }
  } else if (action === 'tune') {
    var lo = _compCreateLoadoutFromBuild(build);
    if (lo) {
      saveLoadout(lo); // QA-016: save before tuning so build isn't lost
      activateLoadout(lo);
      switchMode('tune');
    }
  } else if (action === 'setActive') {
    var lo = _compCreateLoadoutFromBuild(build);
    if (lo) {
      activateLoadout(lo);
      switchMode('overview');
      renderDashboard();
    }
  } else if (action === 'compare') {
    _compAddBuildToCompare(build);
  }
}

function _compAddBuildToCompare(build) {
  if (comparisonSlots.length >= 3) comparisonSlots.pop();

  var racquetId = _compSelectedRacquetId;
  var racquet = RACQUETS.find(function(r) { return r.id === racquetId; });
  if (!racquet) return;

  var isHybrid = build.type === 'hybrid';
  var stringId = isHybrid ? '' : build.string.id;
  var cfg;
  if (isHybrid) {
    cfg = { isHybrid: true, mains: build.mains, crosses: build.crosses, mainsTension: build.tension, crossesTension: build.crossesTension };
  } else {
    cfg = { isHybrid: false, string: build.string, mainsTension: build.tension, crossesTension: build.tension };
  }
  var stats = predictSetup(racquet, cfg);
  var identity = stats ? generateIdentity(stats, racquet, cfg) : null;

  comparisonSlots.push({
    id: Date.now(),
    racquetId: racquetId,
    stringId: stringId,
    isHybrid: isHybrid,
    mainsId: isHybrid ? build.mainsId : '',
    crossesId: isHybrid ? build.crossesId : '',
    mainsTension: build.tension,
    crossesTension: build.crossesTension || build.tension,
    stats: stats,
    identity: identity
  });
  switchMode('compare');
}

// Legacy scalar-param compare handler — used by _addSuggestionToCompare and _compareQuickAdd
// These flows only produce full-bed slots from dropdown selections.
function _compActionCompare(racquetId, stringId, tension) {
  if (comparisonSlots.length >= 3) {
    comparisonSlots.pop();
  }
  const racquet = RACQUETS.find(r => r.id === racquetId);
  const stringData = STRINGS.find(s => s.id === stringId);
  if (!racquet || !stringData) return;

  const cfg = { isHybrid: false, string: stringData, mainsTension: tension, crossesTension: tension };
  const stats = predictSetup(racquet, cfg);
  const identity = stats ? generateIdentity(stats, racquet, cfg) : null;

  const slotData = {
    id: Date.now(),
    racquetId: racquetId,
    stringId: stringId,
    isHybrid: false,
    mainsId: '',
    crossesId: '',
    mainsTension: tension,
    crossesTension: tension,
    stats: stats,
    identity: identity
  };
  comparisonSlots.push(slotData);
  switchMode('compare');
}

// ============================================
// FMB — Frame-First Result Helpers
// ============================================

function _fmbRankFrames(profile) {
  const scored = RACQUETS.map(r => {
    const frameStats = calcFrameBase(r);
    let score = 0;

    // Check minimum thresholds against frame base stats
    let meetsAll = true;
    for (const [stat, min] of Object.entries(profile.minThresholds)) {
      if (frameStats[stat] !== undefined && frameStats[stat] < min) {
        meetsAll = false;
        score -= (min - frameStats[stat]) * 2;
      }
    }
    if (meetsAll) score += 20;

    // Bonus for priority stats
    for (const [stat, weight] of Object.entries(profile.statPriorities)) {
      if (frameStats[stat] !== undefined) {
        score += frameStats[stat] * weight * 0.3;
      }
    }

    // Generate top 3 builds for this frame
    const builds = _compGenerateTopBuilds(r, 3);

    // Boost score by best build OBS
    if (builds.length > 0) {
      score += builds[0].score * 0.5;
    }

    return { racquet: r, frameStats, score, builds };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

function _fmbRenderFrameCard(fr, idx) {
  const r = fr.racquet;
  const builds = fr.builds || [];

  const archColors = {
    'Spin Focus': 'var(--lime-text)',
    'Control Focus': 'var(--blue-tag)',
    'Power Focus': 'var(--orange)',
    'Comfort Build': 'var(--green-tag)',
    'Feel Build': 'var(--purple)',
    'Durability Build': 'var(--dc-storm)',
    'Balanced': 'var(--text-secondary)'
  };

  const buildCards = builds.map((b, bIdx) => {
    const borderColor = archColors[b.archetype] || archColors['Balanced'];
    const isHybrid = b.type === 'hybrid';
    const stringLabel = isHybrid ? (b.label || b.string.name) : b.string.name;
    const metaLabel = isHybrid
      ? `Hybrid &middot; M:${b.tension} / X:${b.crossesTension} lbs`
      : `Full Bed &middot; ${b.tension} lbs`;

    return `<div class="fmb-build-mini" style="border-left: 3px solid ${borderColor}">
      <div class="fmb-build-mini-header">
        <span class="fmb-build-mini-label">${b.archetype || 'Build'}</span>
        <span class="fmb-build-mini-obs">${b.score.toFixed(1)}</span>
      </div>
      <div class="fmb-build-mini-string">${stringLabel}</div>
      <div class="fmb-build-mini-tension">${metaLabel}</div>
      <div class="fmb-build-btns">
        <button class="fmb-build-select" onclick="_fmbAction('activate',${idx},${bIdx})">Activate</button>
        <button class="fmb-build-save" onclick="_fmbAction('save',${idx},${bIdx},this)">Save</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="fmb-frame-card">
    <div class="fmb-frame-card-header">
      <div class="fmb-frame-rank">#${idx + 1}</div>
      <div class="fmb-frame-info">
        <div class="fmb-frame-name">${r.name.replace(/\\s+\\d+g$/, '')}</div>
        <div class="fmb-frame-meta">${r.year} &middot; ${r.identity || ''} &middot; ${r.stiffness} RA &middot; ${r.pattern}</div>
      </div>
    </div>
    <div class="fmb-frame-builds">${buildCards}</div>
  </div>`;
}

// Unified FMB action handler — reads full build data by frame+build index
function _fmbAction(action, frameIdx, buildIdx, btn) {
  var fr = _fmbCurrentFrames[frameIdx];
  if (!fr) return;
  var build = fr.builds[buildIdx];
  if (!build) return;

  var racquetId = fr.racquet.id;
  var isHybrid = build.type === 'hybrid';
  var opts = {
    source: 'quiz',
    isHybrid: isHybrid,
    crossesTension: build.crossesTension || build.tension,
  };
  if (isHybrid) {
    opts.mainsId = build.mainsId;
    opts.crossesId = build.crossesId;
  }
  var stringId = isHybrid ? build.mainsId : build.string.id;
  var lo = createLoadout(racquetId, stringId, build.tension, opts);
  if (!lo) return;

  if (action === 'activate') {
    closeFindMyBuild();
    activateLoadout(lo);
    switchMode('overview');
    renderDashboard();
  } else if (action === 'save') {
    saveLoadout(lo);
    if (btn) {
      btn.textContent = 'Saved \u2713';
      btn.disabled = true;
      setTimeout(function() { btn.textContent = 'Save'; btn.disabled = false; }, 1500);
    }
  }
}

// Legacy aliases for backward compat
function _fmbActivateBuild(racquetId, stringId, tension) {
  var lo = createLoadout(racquetId, stringId, tension, { source: 'quiz' });
  if (lo) { closeFindMyBuild(); activateLoadout(lo); switchMode('overview'); renderDashboard(); }
}
function _fmbSaveBuild(racquetId, stringId, tension, btn) {
  var lo = createLoadout(racquetId, stringId, tension, { source: 'quiz' });
  if (lo) { saveLoadout(lo); if (btn) { btn.textContent = 'Saved \u2713'; btn.disabled = true; setTimeout(function() { btn.textContent = 'Save'; btn.disabled = false; }, 1500); } }
}

// Legacy alias
function _fmbSelectBuild(racquetId, stringId, tension) {
  _fmbActivateBuild(racquetId, stringId, tension);
}

// ============================================
// FEATURE: Dock Creation Flow (unified state-based)
// ============================================

let _cfCreatingNew = false;

function renderDockCreateSection() {
  var container = document.getElementById('dock-create-area');
  var editorSection = document.getElementById('dock-editor-section');
  if (!container) return;

  if (!activeLoadout && !_cfCreatingNew) {
    container.innerHTML = _renderCreateFormTailwind('Create Loadout', false);
    _wireCreateForm(container);
    if (editorSection) editorSection.style.display = 'none';
  } else if (activeLoadout && !_cfCreatingNew) {
    container.innerHTML =
      '<button class="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[var(--dc-border)] font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] hover:border-[var(--dc-border-hover)] transition-colors" onclick="_showNewLoadoutForm()">' +
        '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>' +
        'Create New Loadout' +
      '</button>';
    if (editorSection) editorSection.style.display = '';
  } else if (_cfCreatingNew) {
    container.innerHTML = _renderCreateFormTailwind('New Loadout', true);
    _wireCreateForm(container);
    if (editorSection) editorSection.style.display = 'none';
  }
}

function _renderCreateForm(title, showCancel) {
  return '<div class="dock-cf-form">' +
    '<div class="dock-cf-header">' +
      '<span class="dock-cf-title">' + title + '</span>' +
      (showCancel ? '<a class="dock-cf-cancel" href="#" onclick="_hideNewLoadoutForm(); return false;">Cancel</a>' : '') +
    '</div>' +
    '<div class="dock-cf-toggle">' +
      '<button class="dock-cf-toggle-btn active" data-cf-mode="full" onclick="_cfToggleMode(this)">Full Bed</button>' +
      '<button class="dock-cf-toggle-btn" data-cf-mode="hybrid" onclick="_cfToggleMode(this)">Hybrid</button>' +
    '</div>' +
    '<div class="dock-cf-body" data-cf-hybrid="false">' +
      '<div class="dock-cf-section dock-cf-fullbed">' +
        '<div class="dock-qa-field">' +
          '<label class="dock-qa-label">Frame</label>' +
          '<div class="dock-qa-searchable">' +
            '<input type="text" class="dock-qa-search" id="dock-cf-frame-search" placeholder="Search frames..." autocomplete="off">' +
            '<input type="hidden" id="dock-cf-frame">' +
            '<div class="dock-qa-dropdown hidden" id="dock-cf-frame-dropdown"></div>' +
          '</div>' +
        '</div>' +
        '<div class="dock-qa-field">' +
          '<label class="dock-qa-label">String</label>' +
          '<div class="dock-qa-searchable">' +
            '<input type="text" class="dock-qa-search" id="dock-cf-string-search" placeholder="Search strings..." autocomplete="off">' +
            '<input type="hidden" id="dock-cf-string">' +
            '<div class="dock-qa-dropdown hidden" id="dock-cf-string-dropdown"></div>' +
          '</div>' +
        '</div>' +
        '<div class="dock-cf-row">' +
          '<div class="dock-qa-field dock-cf-half">' +
            '<label class="dock-qa-label">Mains (lbs)</label>' +
            '<input type="number" class="dock-qa-input" id="dock-cf-tension-m" value="55" min="30" max="70">' +
          '</div>' +
          '<div class="dock-qa-field dock-cf-half">' +
            '<label class="dock-qa-label">Crosses (lbs)</label>' +
            '<input type="number" class="dock-qa-input" id="dock-cf-tension-x" value="53" min="30" max="70">' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="dock-cf-section dock-cf-hybrid hidden">' +
        '<div class="dock-qa-field">' +
          '<label class="dock-qa-label">Frame</label>' +
          '<div class="dock-qa-searchable">' +
            '<input type="text" class="dock-qa-search" id="dock-cf-h-frame-search" placeholder="Search frames..." autocomplete="off">' +
            '<input type="hidden" id="dock-cf-h-frame">' +
            '<div class="dock-qa-dropdown hidden" id="dock-cf-h-frame-dropdown"></div>' +
          '</div>' +
        '</div>' +
        '<div class="dock-qa-field">' +
          '<label class="dock-qa-label dock-cf-accent-cyan">Mains String</label>' +
          '<div class="dock-qa-searchable">' +
            '<input type="text" class="dock-qa-search" id="dock-cf-mains-search" placeholder="Search mains..." autocomplete="off">' +
            '<input type="hidden" id="dock-cf-mains">' +
            '<div class="dock-qa-dropdown hidden" id="dock-cf-mains-dropdown"></div>' +
          '</div>' +
        '</div>' +
        '<div class="dock-qa-field">' +
          '<label class="dock-qa-label">Mains Tension</label>' +
          '<input type="number" class="dock-qa-input" id="dock-cf-mains-tension" value="55" min="30" max="70">' +
        '</div>' +
        '<div class="dock-qa-field">' +
          '<label class="dock-qa-label dock-cf-accent-green">Crosses String</label>' +
          '<div class="dock-qa-searchable">' +
            '<input type="text" class="dock-qa-search" id="dock-cf-crosses-search" placeholder="Search crosses..." autocomplete="off">' +
            '<input type="hidden" id="dock-cf-crosses">' +
            '<div class="dock-qa-dropdown hidden" id="dock-cf-crosses-dropdown"></div>' +
          '</div>' +
        '</div>' +
        '<div class="dock-qa-field">' +
          '<label class="dock-qa-label">Crosses Tension</label>' +
          '<input type="number" class="dock-qa-input" id="dock-cf-crosses-tension" value="53" min="30" max="70">' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="dock-qa-btns">' +
      '<button class="dock-qa-btn dock-qa-btn-primary" onclick="_cfActivate()">Set Active</button>' +
      '<button class="dock-qa-btn" onclick="_cfSave()">Save to Loadouts</button>' +
    '</div>' +
  '</div>';
}

function _cfToggleMode(btn) {
  var container = btn.closest('.dock-cf-form');
  if (!container) return;
  
  var mode = btn.dataset.cfMode;
  var isHybrid = mode === 'hybrid';
  
  var fullSection = container.querySelector('.dock-cf-fullbed');
  var hybridSection = container.querySelector('.dock-cf-hybrid');
  
  // Toggle visibility - no data transfer, no clearing
  if (fullSection) {
    if (isHybrid) fullSection.classList.add('hidden');
    else fullSection.classList.remove('hidden');
  }
  if (hybridSection) {
    if (isHybrid) hybridSection.classList.remove('hidden');
    else hybridSection.classList.add('hidden');
  }

  // Update button styles only
  container.querySelectorAll('.dock-cf-toggle-btn').forEach(function(b) {
    var isTarget = b.dataset.cfMode === mode;
    b.classList.toggle('active', isTarget);
    b.style.background = isTarget ? 'var(--dc-platinum)' : 'transparent';
    b.style.color = isTarget ? 'var(--dc-void)' : 'var(--dc-storm)';
  });
}

function _wireCreateForm(container) {
  var frameItems = RACQUETS.map(function(r) { return { id: r.id, label: r.name }; });
  var stringItems = STRINGS.map(function(s) { return { id: s.id, label: s.name + ' (' + s.gauge + ')' }; });

  // Full bed searchables
  _initQaSearchable('dock-cf-frame-search', 'dock-cf-frame', 'dock-cf-frame-dropdown', frameItems);
  _initQaSearchable('dock-cf-string-search', 'dock-cf-string', 'dock-cf-string-dropdown', stringItems);

  // Hybrid searchables
  _initQaSearchable('dock-cf-h-frame-search', 'dock-cf-h-frame', 'dock-cf-h-frame-dropdown', frameItems);
  _initQaSearchable('dock-cf-mains-search', 'dock-cf-mains', 'dock-cf-mains-dropdown', stringItems);
  _initQaSearchable('dock-cf-crosses-search', 'dock-cf-crosses', 'dock-cf-crosses-dropdown', stringItems);
}

function _cfBuildLoadout() {
  var form = document.querySelector('.dock-cf-form');
  if (!form) return null;

  // Check which section is currently visible
  var hybridSection = form.querySelector('.dock-cf-hybrid');
  var isHybrid = hybridSection && !hybridSection.classList.contains('hidden');

  if (isHybrid) {
    var frameId = document.getElementById('dock-cf-h-frame').value;
    var mainsId = document.getElementById('dock-cf-mains').value;
    var crossesId = document.getElementById('dock-cf-crosses').value;
    var mainsTension = parseInt(document.getElementById('dock-cf-mains-tension').value) || 55;
    var crossesTension = parseInt(document.getElementById('dock-cf-crosses-tension').value) || 53;
    if (!frameId || !mainsId || !crossesId) return null;

    return createLoadout(frameId, mainsId, mainsTension, {
      isHybrid: true,
      mainsId: mainsId,
      crossesId: crossesId,
      crossesTension: crossesTension,
      source: 'manual'
    });
  } else {
    var frameId = document.getElementById('dock-cf-frame').value;
    var stringId = document.getElementById('dock-cf-string').value;
    var mainsT = parseInt((document.getElementById('dock-cf-tension-m') || {}).value) || 55;
    var crossesT = parseInt((document.getElementById('dock-cf-tension-x') || {}).value) || 53;
    if (!frameId || !stringId) return null;

    return createLoadout(frameId, stringId, mainsT, { source: 'manual', crossesTension: crossesT });
  }
}

function _cfActivate() {
  var isFirstLoadout = !activeLoadout && savedLoadouts.length === 0;
  var lo = _cfBuildLoadout();
  if (!lo) {
    _cfHighlightMissingFields();
    return;
  }
  // Clear any previous error states on successful build
  _cfClearFieldErrors();

  _cfCreatingNew = false;
  activateLoadout(lo);

  if (isFirstLoadout) {
    saveLoadout(lo); // QA-014: auto-save first loadout so it isn't lost
    switchMode('tune');
  } else if (currentMode === 'overview') {
    renderDashboard();
  }
}

// Fix 1: Highlight missing fields in create form when Set Active fails
function _cfHighlightMissingFields() {
  var form = document.querySelector('.dock-cf-form');
  if (!form) return;

  // Check which section is currently visible
  var hybridSection = form.querySelector('.dock-cf-hybrid');
  var isHybrid = hybridSection && !hybridSection.classList.contains('hidden');

  // Clear previous errors first
  _cfClearFieldErrors();

  if (isHybrid) {
    // Hybrid mode: check frame, mains, crosses
    var hFrame = document.getElementById('dock-cf-h-frame');
    var mains = document.getElementById('dock-cf-mains');
    var crosses = document.getElementById('dock-cf-crosses');

    if (!hFrame || !hFrame.value) _cfShowFieldError('dock-cf-h-frame-search', 'Frame is required');
    if (!mains || !mains.value) _cfShowFieldError('dock-cf-mains-search', 'Select a string from the dropdown');
    if (!crosses || !crosses.value) _cfShowFieldError('dock-cf-crosses-search', 'Select a string from the dropdown');
  } else {
    // Full bed mode: check frame, string
    var frame = document.getElementById('dock-cf-frame');
    var string = document.getElementById('dock-cf-string');

    if (!frame || !frame.value) _cfShowFieldError('dock-cf-frame-search', 'Frame is required');
    if (!string || !string.value) {
      // Check if user typed something but didn't select
      var stringSearch = document.getElementById('dock-cf-string-search');
      if (stringSearch && stringSearch.value.trim()) {
        _cfShowFieldError('dock-cf-string-search', 'Select a string from the dropdown');
      } else {
        _cfShowFieldError('dock-cf-string-search', 'String is required');
      }
    }
  }
}

function _cfShowFieldError(inputId, message) {
  var input = document.getElementById(inputId);
  if (!input) return;

  // Add error class to the searchable wrapper
  var wrapper = input.closest('.dock-qa-searchable');
  if (wrapper) wrapper.classList.add('ss-invalid');

  // Add error class to input itself
  input.classList.add('ss-invalid');

  // Add or update error message
  var field = input.closest('.dock-qa-field');
  if (field) {
    var existingError = field.querySelector('.ss-field-error');
    if (!existingError) {
      var errorDiv = document.createElement('div');
      errorDiv.className = 'ss-field-error';
      errorDiv.textContent = message;
      field.appendChild(errorDiv);
    }
  }
}

function _cfClearFieldErrors() {
  // Remove error classes from all inputs and wrappers
  document.querySelectorAll('.dock-cf-form .ss-invalid').forEach(function(el) {
    el.classList.remove('ss-invalid');
  });
  // Remove error messages
  document.querySelectorAll('.dock-cf-form .ss-field-error').forEach(function(el) {
    el.remove();
  });
}

function _cfSave() {
  var lo = _cfBuildLoadout();
  if (!lo) {
    _cfHighlightMissingFields();
    return;
  }
  // Clear any previous error states on successful build
  _cfClearFieldErrors();

  _cfCreatingNew = false;
  saveLoadout(lo);
}

function _showNewLoadoutForm() {
  _cfCreatingNew = true;
  renderDockCreateSection();
}

function _hideNewLoadoutForm() {
  _cfCreatingNew = false;
  renderDockCreateSection();
}

// Legacy aliases for backward compat (WTTN/Compare inline pickers still use these)
function toggleQuickAdd() { _showNewLoadoutForm(); }
function quickAddActivate() { _cfActivate(); }
function quickAddSave() { _cfSave(); }

// ============================================
// FEATURE: Apply-to-Loadout for WTTN + Rec Builds
// ============================================

function _applyWttnBuild(btn) {
  var setup = getCurrentSetup();
  if (!setup) return;

  var stringId = btn.dataset.stringId;
  var tension = parseInt(btn.dataset.tension);
  var type = btn.dataset.type;
  var mainsId = btn.dataset.mainsId;
  var crossesId = btn.dataset.crossesId;

  var opts = { source: 'manual' };
  var lo;

  if (type === 'hybrid' && mainsId && crossesId) {
    opts.isHybrid = true;
    opts.mainsId = mainsId;
    opts.crossesId = crossesId;
    opts.crossesTension = tension - 2;
    lo = createLoadout(setup.racquet.id, mainsId, tension, opts);
  } else if (stringId) {
    lo = createLoadout(setup.racquet.id, stringId, tension, opts);
  }

  if (lo) {
    activateLoadout(lo);
    var newSetup = getCurrentSetup();
    if (newSetup && currentMode === 'tune') initTuneMode(newSetup);
  }

  btn.textContent = 'Applied \u2713';
  btn.disabled = true;
  setTimeout(function() { btn.textContent = 'Apply'; btn.disabled = false; }, 1500);
}

function _applyRecBuild(racquetId, stringId, tension, type, mainsId, crossesId) {
  var opts = { source: 'manual' };
  if (type === 'hybrid' && mainsId && crossesId) {
    opts.isHybrid = true;
    opts.mainsId = mainsId;
    opts.crossesId = crossesId;
    opts.crossesTension = tension - 2;
  }
  var lo = createLoadout(racquetId, type === 'hybrid' ? mainsId : stringId, tension, opts);
  if (lo) {
    activateLoadout(lo);
    var newSetup = getCurrentSetup();
    if (newSetup && currentMode === 'tune') initTuneMode(newSetup);
  }
}

function _saveWttnBuild(btn) {
  var frameId = btn.dataset.frameId;
  var stringId = btn.dataset.stringId;
  var tension = parseInt(btn.dataset.tension);
  var type = btn.dataset.type;
  var mainsId = btn.dataset.mainsId;
  var crossesId = btn.dataset.crossesId;

  var opts = { source: 'manual' };
  var lo;

  if (type === 'hybrid' && mainsId && crossesId) {
    opts.isHybrid = true;
    opts.mainsId = mainsId;
    opts.crossesId = crossesId;
    opts.crossesTension = tension - 2;
    lo = createLoadout(frameId, mainsId, tension, opts);
  } else if (stringId) {
    lo = createLoadout(frameId, stringId, tension, opts);
  }

  if (lo) {
    saveLoadout(lo);
    btn.textContent = 'Saved \u2713';
    btn.disabled = true;
    setTimeout(function() { btn.textContent = 'Save'; btn.disabled = false; }, 1500);
  }
}

function _saveRecBuild(racquetId, stringId, tension, type, mainsId, crossesId) {
  var opts = { source: 'manual' };
  if (type === 'hybrid' && mainsId && crossesId) {
    opts.isHybrid = true;
    opts.mainsId = mainsId;
    opts.crossesId = crossesId;
    opts.crossesTension = tension - 2;
  }
  var lo = createLoadout(racquetId, type === 'hybrid' ? mainsId : stringId, tension, opts);
  if (lo) saveLoadout(lo);
}

// ============================================
// FEATURE: Original Tension Marker
// ============================================

function renderOriginalTensionMarker() {
  var slider = document.getElementById('tune-slider');
  if (!slider) return;
  var container = slider.parentElement;

  var old = container.querySelector('.tune-original-marker');
  if (old) old.remove();

  if (!tuneState.originalTension) return;

  var min = parseInt(slider.min);
  var max = parseInt(slider.max);
  var pct = ((tuneState.originalTension - min) / (max - min)) * 100;

  var marker = document.createElement('div');
  marker.className = 'tune-original-marker';
  marker.style.left = 'calc(' + pct + '% - 1px)';
  marker.title = 'Original: ' + tuneState.originalTension + ' lbs';
  marker.innerHTML = '<span class="tune-original-label">Start: ' + tuneState.originalTension + '</span>';
  container.style.position = 'relative';
  container.appendChild(marker);
}

// ============================================
// FEATURE: Gauge Selection Apply
// ============================================

function _applyGaugeSelection(gauge, sectionIdx) {
  var setup = getCurrentSetup();
  if (!setup) return;

  var stringConfig = setup.stringConfig;

  if (stringConfig.isHybrid) {
    var gaugeSelectId = sectionIdx === 0 ? 'gauge-select-mains' : 'gauge-select-crosses';
    var gaugeEl = document.getElementById(gaugeSelectId);
    if (gaugeEl) {
      for (var i = 0; i < gaugeEl.options.length; i++) {
        if (Math.abs(parseFloat(gaugeEl.options[i].value) - gauge) < 0.005) {
          gaugeEl.value = gaugeEl.options[i].value;
          break;
        }
      }
    }
  } else {
    var gEl = document.getElementById('gauge-select-full');
    if (gEl) {
      for (var j = 0; j < gEl.options.length; j++) {
        if (Math.abs(parseFloat(gEl.options[j].value) - gauge) < 0.005) {
          gEl.value = gEl.options[j].value;
          break;
        }
      }
    }
  }

  // Commit gauge change to active loadout BEFORE re-rendering
  if (activeLoadout) {
    commitEditorToLoadout();
  }

  renderDashboard();

  var newSetup = getCurrentSetup();
  if (newSetup && currentMode === 'tune') {
    initTuneMode(newSetup);
  }
}

// ============================================
// FEATURE: Compare Preset Suggestions
// ============================================

function _renderCompareSuggestions() {
  var container = document.getElementById('compare-suggestions');
  if (!container) {
    var slotsContainer = document.getElementById('comparison-slots');
    if (!slotsContainer) return;
    container = document.createElement('div');
    container.id = 'compare-suggestions';
    container.className = 'compare-suggestions';
    slotsContainer.parentElement.insertBefore(container, slotsContainer.nextSibling);
  }

  var suggestions = [];
  var slotKeys = comparisonSlots.map(function(s) { return s.racquetId + '-' + s.stringId; });

  savedLoadouts.forEach(function(lo) {
    var key = lo.frameId + '-' + lo.stringId;
    if (slotKeys.indexOf(key) === -1) {
      suggestions.push({
        label: lo.name,
        obs: lo.obs,
        frameId: lo.frameId,
        stringId: lo.stringId,
        tension: lo.mainsTension,
        source: lo.source || 'saved'
      });
    }
  });

  if (suggestions.length === 0 && savedLoadouts.length === 0) {
    container.innerHTML = '<div class="compare-sug-empty">Save loadouts from Racket Bible or Quiz to see quick-add suggestions here</div>';
    return;
  }

  if (suggestions.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML =
    '<div class="compare-sug-header">Quick Add from My Loadouts</div>' +
    '<div class="compare-sug-list">' +
    suggestions.slice(0, 6).map(function(s) {
      return '<button class="compare-sug-chip" onclick="_addSuggestionToCompare(\'' + s.frameId + '\',\'' + s.stringId + '\',' + s.tension + ')">' +
        '<span class="compare-sug-obs">' + (s.obs ? s.obs.toFixed(1) : '\u2014') + '</span>' +
        '<span class="compare-sug-name">' + s.label + '</span>' +
        '<span class="compare-sug-source">' + s.source + '</span>' +
      '</button>';
    }).join('') +
    '</div>';
}

function _addSuggestionToCompare(frameId, stringId, tension) {
  _compActionCompare(frameId, stringId, tension);
}

// ============================================
// FEATURE: Compare Slot Loadout Tags
// ============================================

function _getCompareSlotTag(slot) {
  if (activeLoadout && slot.racquetId === activeLoadout.frameId &&
      slot.stringId === activeLoadout.stringId &&
      slot.mainsTension === activeLoadout.mainsTension) {
    return '<span class="slot-tag slot-tag-active">Current Loadout</span>';
  }

  var match = savedLoadouts.find(function(lo) {
    return lo.frameId === slot.racquetId &&
      lo.stringId === slot.stringId &&
      lo.mainsTension === slot.mainsTension;
  });
  if (match) {
    return '<span class="slot-tag slot-tag-saved">Saved</span>';
  }

  return '';
}

// ============================================
// FEATURE: Compare Auto-Fill + Quick Add Prompt
// ============================================

function _addLoadoutAsSlot(lo) {
  var racquet = RACQUETS.find(function(r) { return r.id === lo.frameId; });
  var stringData = lo.isHybrid ? null : STRINGS.find(function(s) { return s.id === lo.stringId; });

  var cfg = lo.isHybrid ? {
    isHybrid: true,
    mains: STRINGS.find(function(s) { return s.id === lo.mainsId; }),
    crosses: STRINGS.find(function(s) { return s.id === lo.crossesId; }),
    mainsTension: lo.mainsTension,
    crossesTension: lo.crossesTension
  } : {
    isHybrid: false,
    string: stringData,
    mainsTension: lo.mainsTension,
    crossesTension: lo.crossesTension
  };

  var stats = racquet ? predictSetup(racquet, cfg) : null;
  var identity = stats ? generateIdentity(stats, racquet, cfg) : null;

  comparisonSlots.push({
    id: Date.now() + Math.random(),
    racquetId: lo.frameId,
    stringId: lo.stringId || '',
    isHybrid: lo.isHybrid || false,
    mainsId: lo.mainsId || '',
    crossesId: lo.crossesId || '',
    mainsTension: lo.mainsTension,
    crossesTension: lo.crossesTension,
    stats: stats,
    identity: identity,
    sourceLoadoutId: lo.id || null,
    snapshotObs: lo.obs || 0
  });
}

function _isCompareSlotStale(slot) {
  if (!slot.sourceLoadoutId) return false;
  // Check active loadout
  if (activeLoadout && activeLoadout.id === slot.sourceLoadoutId) {
    return activeLoadout.mainsTension !== slot.mainsTension ||
      activeLoadout.crossesTension !== slot.crossesTension ||
      activeLoadout.stringId !== slot.stringId ||
      activeLoadout.isHybrid !== slot.isHybrid ||
      activeLoadout.mainsId !== (slot.mainsId || null) ||
      activeLoadout.crossesId !== (slot.crossesId || null);
  }
  // Check saved loadouts
  var src = savedLoadouts.find(function(l) { return l.id === slot.sourceLoadoutId; });
  if (!src) return false;
  return src.mainsTension !== slot.mainsTension ||
    src.crossesTension !== slot.crossesTension ||
    src.stringId !== slot.stringId ||
    src.isHybrid !== slot.isHybrid ||
    src.mainsId !== (slot.mainsId || null) ||
    src.crossesId !== (slot.crossesId || null);
}

function _refreshCompareSlot(slotIndex) {
  var slot = comparisonSlots[slotIndex];
  if (!slot || !slot.sourceLoadoutId) return;
  var src = null;
  if (activeLoadout && activeLoadout.id === slot.sourceLoadoutId) {
    src = activeLoadout;
  } else {
    src = savedLoadouts.find(function(l) { return l.id === slot.sourceLoadoutId; });
  }
  if (!src) return;

  // Re-snapshot from source
  slot.racquetId = src.frameId;
  slot.stringId = src.stringId || '';
  slot.isHybrid = src.isHybrid || false;
  slot.mainsId = src.mainsId || '';
  slot.crossesId = src.crossesId || '';
  slot.mainsTension = src.mainsTension;
  slot.crossesTension = src.crossesTension;
  slot.snapshotObs = src.obs || 0;

  // Recompute stats
  recalcSlot(slotIndex);

  // Re-render compare
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  updateComparisonRadar();
}

function _autoFillCompareFromSaved() {
  comparisonSlots = [];
  var added = 0;

  if (activeLoadout) {
    _addLoadoutAsSlot(activeLoadout);
    added++;
  }

  for (var i = 0; i < savedLoadouts.length && added < 2; i++) {
    var lo = savedLoadouts[i];
    if (activeLoadout && lo.id === activeLoadout.id) continue;
    _addLoadoutAsSlot(lo);
    added++;
  }

  if (added < 2 && savedLoadouts.length > 0) {
    // QA-018: Don't add a duplicate if the only saved loadout is already in a slot
    var first = savedLoadouts[0];
    var alreadyPresent = comparisonSlots.some(function(s) {
      return s.racquetId === first.frameId && s.stringId === (first.stringId || '') &&
        s.mainsTension === first.mainsTension && s.isHybrid === (first.isHybrid || false);
    });
    if (!alreadyPresent) _addLoadoutAsSlot(first);
  }

  renderComparisonSlots();
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  updateComparisonRadar();
}

function _showCompareQuickAddPrompt() {
  var promptEl = document.getElementById('compare-qa-prompt');
  if (!promptEl) {
    promptEl = document.createElement('div');
    promptEl.id = 'compare-qa-prompt';
    promptEl.className = 'compare-qa-prompt';
    var slotsEl = document.getElementById('comparison-slots');
    if (slotsEl && slotsEl.parentElement) {
      slotsEl.parentElement.insertBefore(promptEl, slotsEl.nextSibling);
    }
  }

  promptEl.innerHTML =
    '<div class="compare-qa-inner">' +
      '<p class="compare-qa-title">Add a second setup to compare</p>' +
      '<p class="compare-qa-sub">Pick a frame and string, or save more loadouts from Racket Bible</p>' +
      '<div class="compare-qa-fields">' +
        '<select class="dock-qa-select" id="compare-qa-frame"><option value="">Choose frame...</option></select>' +
        '<select class="dock-qa-select" id="compare-qa-string"><option value="">Choose string...</option></select>' +
        '<input type="number" class="dock-qa-input" id="compare-qa-tension" value="53" min="30" max="70" style="width:70px">' +
        '<button class="dock-qa-btn dock-qa-btn-primary" onclick="_compareQuickAdd()" style="flex:none;padding:7px 16px">Add to Compare</button>' +
      '</div>' +
    '</div>';

  var frameSelect = document.getElementById('compare-qa-frame');
  var stringSelect = document.getElementById('compare-qa-string');
  RACQUETS.forEach(function(r) {
    var opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    frameSelect.appendChild(opt);
  });
  STRINGS.forEach(function(s) {
    var opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name + ' (' + s.gauge + ')';
    stringSelect.appendChild(opt);
  });
}

function _compareQuickAdd() {
  var frameId = document.getElementById('compare-qa-frame').value;
  var stringId = document.getElementById('compare-qa-string').value;
  var tension = parseInt(document.getElementById('compare-qa-tension').value) || 53;
  if (!frameId || !stringId) return;

  _compActionCompare(frameId, stringId, tension);

  const prompt = document.getElementById('compare-qa-prompt');
  if (prompt) prompt.remove();
}

function _init16x19Favicon() {
  const favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) return;
  
  // Create SVG data URIs for blinking favicon
  const idleSvg = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" fill="none" stroke="%23FF4500" stroke-width="1.5"/><text x="8" y="11" font-family="monospace" font-size="7" fill="%23DCDFE2" text-anchor="middle">16</text></svg>`;
  const activeSvg = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" fill="none" stroke="%23FF4500" stroke-width="1.5"/><text x="8" y="11" font-family="monospace" font-size="7" fill="%23FF4500" text-anchor="middle">X</text></svg>`;
  
  let isTick = true;
  setInterval(() => {
    favicon.href = isTick ? activeSvg : idleSvg;
    isTick = !isTick;
  }, 1000);
}

function _runDigicraftBootSequence() {
  const loader = document.getElementById('dc-boot-loader');
  const batteryTrack = document.getElementById('dc-boot-battery');
  const pctText = document.getElementById('dc-boot-pct');
  const logsContainer = document.getElementById('dc-boot-logs');

  if (!loader) return;

  const totalSegments = 10;
  let segments = [];
  for (let i = 0; i < totalSegments; i++) {
    const seg = document.createElement('div');
    seg.className = "flex-1 bg-black/10 dark:bg-white/5 transition-colors duration-75";
    batteryTrack.appendChild(seg);
    segments.push(seg);
  }

  const logs = [
    "> Loading 16x19.core.js...",
    "> Fetching global frame database...",
    "> Booting String Modulator V2...",
    "> System ready. Diagnostics active."
  ];

  let currentLog = 0;
  let progress = 0;

  const bootInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5;
    if (progress >= 100) progress = 100;

    pctText.innerText = progress + "%";

    const segmentsToFill = Math.floor((progress / 100) * totalSegments);
    for (let i = 0; i < totalSegments; i++) {
      if (i < segmentsToFill) {
        segments[i].classList.remove('bg-black/10', 'dark:bg-white/5');
        segments[i].classList.add('bg-dc-accent', 'dark:bg-dc-platinum');
      }
    }

    if (progress > 20 && currentLog === 0) pushLog();
    if (progress > 50 && currentLog === 1) pushLog();
    if (progress > 80 && currentLog === 2) pushLog();
    if (progress === 100 && currentLog === 3) pushLog();

    if (progress === 100) {
      clearInterval(bootInterval);
      setTimeout(() => {
        loader.classList.add('opacity-0');
        setTimeout(() => loader.remove(), 700);
      }, 400);
    }
  }, 80);

  function pushLog() {
    const logSpan = document.createElement('span');
    logSpan.className = "text-dc-storm";
    logSpan.innerText = logs[currentLog];
    logsContainer.appendChild(logSpan);
    currentLog++;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  _init16x19Favicon();
  _runDigicraftBootSequence();
  init();
  handleResponsiveHeader();
  _initDockCollapse();

  // Dock scroll shadow
  const dock = document.getElementById('build-dock');
  if (dock) {
    dock.addEventListener('scroll', function() {
      dock.classList.toggle('dock-scrolled', dock.scrollTop > 0);
    }, { passive: true });
  }

  // Backdrop closes dock overlay
  var dockBackdrop = document.getElementById('dock-backdrop');
  if (dockBackdrop) {
    dockBackdrop.addEventListener('click', function() {
      var d = document.getElementById('build-dock');
      if (d && d.classList.contains('dock-expanded')) {
        toggleMobileDock();
      }
    });
  }
});


function _renderCreateFormTailwind(title, showCancel) {
  return (
    '<div class="dock-cf-form border border-[var(--dc-border)] bg-[var(--dc-void-deep)] p-4 flex flex-col gap-3">' +
      '<div class="flex items-center justify-between border-b border-[var(--dc-border)] pb-3">' +
        '<span class="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--dc-platinum)]">' + title + '</span>' +
        (showCancel ? '<a class="font-mono text-[9px] uppercase tracking-widest text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] cursor-pointer transition-colors" href="#" onclick="_hideNewLoadoutForm(); return false;">Cancel</a>' : '') +
      '</div>' +
      // Full/Hybrid toggle
      '<div class="flex border border-[var(--dc-border)]">' +
        '<button class="dock-cf-toggle-btn flex-1 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] bg-[var(--dc-platinum)] text-[var(--dc-void)] border-r border-[var(--dc-border)] transition-colors" data-cf-mode="full" onclick="_cfToggleMode(this)">Full Bed</button>' +
        '<button class="dock-cf-toggle-btn flex-1 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] bg-transparent text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] transition-colors" data-cf-mode="hybrid" onclick="_cfToggleMode(this)">Hybrid</button>' +
      '</div>' +
      // Body
      '<div class="dock-cf-body flex flex-col gap-3" data-cf-hybrid="false">' +
        // Full bed
        '<div class="dock-cf-fullbed flex flex-col gap-2">' +
          _cfFieldHtml('Frame', 'dock-cf-frame-search', 'dock-cf-frame', 'dock-cf-frame-dropdown', 'Search frames...') +
          _cfFieldHtml('String', 'dock-cf-string-search', 'dock-cf-string', 'dock-cf-string-dropdown', 'Search strings...') +
          '<div class="grid grid-cols-2 gap-2">' +
            _cfTensionHtml('Mains lbs', 'dock-cf-tension-m', '55') +
            _cfTensionHtml('Crosses lbs', 'dock-cf-tension-x', '53') +
          '</div>' +
        '</div>' +
        // Hybrid
        '<div class="dock-cf-hybrid hidden flex flex-col gap-2">' +
          _cfFieldHtml('Frame', 'dock-cf-h-frame-search', 'dock-cf-h-frame', 'dock-cf-h-frame-dropdown', 'Search frames...') +
          _cfFieldHtml('Mains String', 'dock-cf-mains-search', 'dock-cf-mains', 'dock-cf-mains-dropdown', 'Search mains...') +
          '<div class="grid grid-cols-2 gap-2">' +
            _cfTensionHtml('Mains lbs', 'dock-cf-mains-tension', '55') +
            _cfTensionHtml('Crosses lbs', 'dock-cf-crosses-tension', '53') +
          '</div>' +
          _cfFieldHtml('Crosses String', 'dock-cf-crosses-search', 'dock-cf-crosses', 'dock-cf-crosses-dropdown', 'Search crosses...') +
        '</div>' +
      '</div>' +
      // Actions
      '<div class="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--dc-border)]">' +
        '<button class="py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] bg-[var(--dc-platinum)] text-[var(--dc-void)] hover:bg-[var(--dc-white)] transition-colors" onclick="_cfActivate()">Set Active</button>' +
        '<button class="py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] border border-[var(--dc-border)] text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] hover:border-[var(--dc-border-hover)] bg-transparent transition-colors" onclick="_cfSave()">Save</button>' +
      '</div>' +
    '</div>'
  );
}

function _cfFieldHtml(label, searchId, hiddenId, dropdownId, placeholder) {
  return (
    '<div class="flex flex-col gap-1">' +
      '<span class="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--dc-storm)]">' + label + '</span>' +
      '<div class="relative">' +
        '<input type="text" class="w-full px-2 py-1.5 bg-[var(--dc-void)] border border-[var(--dc-border)] text-[var(--dc-platinum)] font-sans text-[12px] outline-none focus:border-[var(--dc-border-active)] transition-colors placeholder:text-[var(--dc-storm)]" id="' + searchId + '" placeholder="' + placeholder + '" autocomplete="off">' +
        '<input type="hidden" id="' + hiddenId + '">' +
        '<div class="absolute top-full left-0 right-0 z-50 bg-[var(--dc-void-deep)] border border-[var(--dc-border)] max-h-48 overflow-y-auto hidden" id="' + dropdownId + '"></div>' +
      '</div>' +
    '</div>'
  );
}

function _cfTensionHtml(label, inputId, defaultVal) {
  return (
    '<div class="flex flex-col gap-1">' +
      '<span class="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--dc-storm)]">' + label + '</span>' +
      '<input type="number" class="px-2 py-1.5 bg-[var(--dc-void)] border border-[var(--dc-border)] text-[var(--dc-platinum)] font-mono text-[12px] outline-none focus:border-[var(--dc-border-active)] transition-colors" id="' + inputId + '" value="' + defaultVal + '" min="30" max="70">' +
    '</div>'
  );
}

// ─────────────────────────────────────────────
// setHybridMode(isHybrid)
// ─────────────────────────────────────────────
// ES Module exports
export {
  // Re-export data for other modules
  RACQUETS,
  STRINGS,
  FRAME_META,
  
  // Core data and prediction
  predictSetup,
  generateIdentity,
  calcFrameBase,
  calcBaseStringProfile,
  calcStringFrameMod,
  calcTensionModifier,
  calcHybridInteraction,
  
  // Loadout management
  createLoadout,
  activateLoadout,
  getCurrentSetup,
  saveActiveLoadout,
  resetActiveLoadout,
  shareActiveLoadout,
  exportLoadouts,
  importLoadouts,
  confirmRemoveLoadout,
  removeLoadout,
  
  // UI Components
  createSearchableSelect,
  ssInstances,
  switchMode,
  switchToLoadout,
  toggleTheme,
  setHybridMode,
  toggleDockCollapse,
  toggleMobileDock,
  
  // Scoring and context
  computeCompositeScore,
  buildTensionContext,
  getObsScoreColor,
  
  // Initialization functions
  init,
  initTuneMode,
  initOptimize,
  initCompendium,
  
  // State variables accessed externally
  comparisonSlots,
  _compendiumInitialized,
  
  // Helper functions used by leaderboard
  _compSelectFrame,
  _compSwitchTab,
  
  // Landing search
  _initLandingSearch,
  
  // Racket Bible / Compendium functions
  _compToggleHud,
  _compAction,
  _compApplyInjection,
  _compSetInjectMode,
  _compClearInjection,
  _compSetSort,
  _stringToggleHud,
  _stringSelectString,
  _stringSetModMode,
  _stringAddToLoadout,
  _stringSetActiveLoadout,
  _stringClearPreview,
  
  // Create flow functions
  _cfToggleMode,
  _cfActivate,
  _cfSave,
  _showNewLoadoutForm,
  _hideNewLoadoutForm,
  _renderCreateFormTailwind,
  _cfFieldHtml,
  _cfTensionHtml,
  
  // Tune mode functions
  tuneSandboxCommit,
  onTuneSliderInput,
  _onEditorChange,
  
  // Compare functions
  addComparisonSlot,
  removeComparisonSlot,
  renderComparisonSlots,
  renderCompareSummaries,
  renderCompareVerdict,
  renderCompareMatrix,
  updateComparisonRadar,
  closeCompareEditors,
  _refreshCompareSlot,
  _toggleCompareCardEditor,
  
  // Optimize functions
  _toggleOptMS,
  runOptimizer,
  _optApplyTensionFilter,
  

  
  // Apply/Save functions
  _applyWttnBuild,
  _saveWttnBuild,
  _applyRecBuild,
  _saveRecBuild,
  
  // Quiz functions
  openFindMyBuild,
  closeFindMyBuild,
  fmbBack,
  fmbNext,
  _fmbSearchDirection,
  
  // Utility functions
  clamp,
  lerp,
  norm,
  getPatternOpenness,
  getAvgBeam,
  getMaxBeam,
  getMinBeam,
  isVariableBeam,
  applyGaugeModifier,
  getGaugeOptions,
  
  _applyGaugeSelection,
  
  // Theme and responsive
  handleResponsiveHeader,
  _initDockCollapse,
  
  // Dock functions
  _dockCompareEdit,
  _dockCompareRemove,
  _dockCompareQuickAdd,
};
