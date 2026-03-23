'use strict';
// ============================================================
// pipeline/engine/core.js
// CommonJS copy of the prediction engine from app.js.
// Two signature changes only (see calcFrameBase, predictSetup).
// ============================================================

// ============================================================
// PART A — Utilities and Constants
// ============================================================

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function lerp(val, inMin, inMax, outMin, outMax) {
  const t = (val - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

function norm(val, min, max) {
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

function getPatternOpenness(pattern) {
  const [mains, crosses] = pattern.split('x').map(Number);
  // 16x18=288 (most open) to 18x20=360 (densest)
  const total = mains * crosses;
  return norm(total, 360, 288); // 0=densest, 1=most open
}

function getAvgBeam(beamWidth) {
  return beamWidth.reduce((a, b) => a + b, 0) / beamWidth.length;
}

function getMaxBeam(beamWidth) {
  return Math.max(...beamWidth);
}

function getMinBeam(beamWidth) {
  return Math.min(...beamWidth);
}

function isVariableBeam(beamWidth) {
  return Math.max(...beamWidth) - Math.min(...beamWidth) > 2;
}

/**
 * Soft linear compression for TWU-derived raw scores.
 * Pulls extremes toward the midpoint (65): raw ~38–98 → compressed ~32–88.
 * spread < 1 compresses (narrows range), spread > 1 expands.
 */
function compressScore(raw, floor = 30, ceiling = 95) {
  // Compress twScore (raw 0-100) into a more realistic range.
  // twScore ~38-98 → compressed ~32-88.
  // Formula: soft sigmoid-like compression that pulls extremes toward center.
  const mid = 65;
  const spread = 0.55; // <1 compresses, >1 expands
  const compressed = mid + (raw - mid) * spread;
  return Math.max(floor, Math.min(ceiling, compressed));
}

const GAUGE_OPTIONS = {
  // Polyester / Co-Polyester: wide range available
  'Polyester':             [1.15, 1.20, 1.25, 1.30, 1.35],
  'Co-Polyester (elastic)':[1.15, 1.20, 1.25, 1.30, 1.35],
  // Natural Gut: typically 15L-17
  'Natural Gut':           [1.25, 1.30, 1.35, 1.40],
  // Multifilament / Synthetic: 15L-17 common
  'Multifilament':         [1.25, 1.30, 1.35],
  'Synthetic Gut':         [1.25, 1.30, 1.35],
};

const GAUGE_LABELS = {
  1.15: '18 (1.15mm)',
  1.20: '17 (1.20mm)',
  1.25: '16L (1.25mm)',
  1.30: '16 (1.30mm)',
  1.35: '15L (1.35mm)',
  1.40: '15L (1.40mm)',
};

const STAT_KEYS = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability', 'durability', 'playability'];

const OBS_TIERS = [
  { min: 0,  max: 10,  label: 'Delete This' },
  { min: 10, max: 20,  label: 'Hospital Build' },
  { min: 20, max: 30,  label: 'Bruh' },
  { min: 30, max: 40,  label: 'Cooked' },
  { min: 40, max: 50,  label: "This Ain't It" },
  { min: 50, max: 60,  label: 'Mid' },
  { min: 60, max: 70,  label: 'Built Diff' },
  { min: 70, max: 80,  label: 'S Rank' },
  { min: 80, max: 90,  label: 'WTF' },
  { min: 90, max: 100, label: 'Max Aura' },
];

// Identity families: maps archetype keywords to broad families
const IDENTITY_FAMILIES = [
  { family: 'spin-control',   test: s => s.spin >= 75 && s.control >= 70 },
  { family: 'control-first',  test: s => s.control >= 72 && s.spin < 75 && s.power < 65 },
  { family: 'power-spin',     test: s => s.spin >= 72 && s.power >= 65 },
  { family: 'power-first',    test: s => s.power >= 70 && s.spin < 72 },
  { family: 'comfort-balanced',test: s => s.comfort >= 68 && s.power >= 55 && s.control >= 55 },
  { family: 'feel-control',   test: s => s.feel >= 70 && s.control >= 65 },
  { family: 'endurance',      test: s => s.playability >= 82 && s.durability >= 78 },
  { family: 'balanced',       test: () => true },
];

// ============================================================
// PART B — Engine Functions
// ============================================================

// B2: applyGaugeModifier
function applyGaugeModifier(stringData, selectedGauge) {
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

// Get available gauge options for a string.
// Always includes the string's reference gauge (the gauge it was measured at)
// plus the standard gauge grid for its material.
function getGaugeOptions(stringData) {
  const standard = GAUGE_OPTIONS[stringData.material] || [1.25, 1.30];
  const ref = stringData.gaugeNum;
  // If ref gauge isn't in the standard list, add it and sort
  if (!standard.some(g => Math.abs(g - ref) < 0.005)) {
    const combined = [...standard, ref].sort((a, b) => a - b);
    return combined;
  }
  return standard;
}

// B1: calcFrameBase — signature changed to accept frameMeta param
function calcFrameBase(racquet, frameMeta) {
  const { stiffness, beamWidth, swingweight, pattern, headSize, strungWeight, balance, id } = racquet;
  const avgBeam = getAvgBeam(beamWidth);
  const maxBeam = getMaxBeam(beamWidth);
  const minBeam = getMinBeam(beamWidth);
  const [mains, crosses] = pattern.split('x').map(Number);
  const patternDensity = mains * crosses;
  const meta = frameMeta[id] || { aeroBonus: 0, comfortTech: 0, spinTech: 0, genBonus: 0 };

  // Balance in pts HL: 34.29cm = 0 pts, each 0.3175cm toward handle = +1 pt
  const balancePtsHL = (34.29 - balance) / 0.3175;

  // ---- Normalized inputs [0, 1] ----
  const raNorm = norm(stiffness, 55, 72);         // 0=soft, 1=stiff
  const swNorm = norm(swingweight, 300, 340);      // 0=light, 1=heavy
  const wtNorm = norm(strungWeight, 290, 340);     // 0=light, 1=heavy
  const hsNorm = norm(headSize, 95, 102);          // 0=small, 1=large
  const avgBeamNorm = norm(avgBeam, 18, 27);       // 0=thin, 1=thick
  const maxBeamNorm = norm(maxBeam, 18, 27);       // 0=thin, 1=thick
  const hlNorm = norm(balancePtsHL, 0, 8);         // 0=even/HH, 1=very HL
  const densityNorm = norm(patternDensity, 288, 360); // 0=open, 1=dense
  const beamRange = maxBeam - minBeam;
  const beamVarNorm = norm(beamRange, 0, 8);       // 0=constant, 1=extreme variable
  const openness = 1 - densityNorm;

  // ===== POWER =====
  let power = 50;
  power += raNorm * 18 - 5;
  power += maxBeamNorm * 14 - 4;
  power += swNorm * 8 - 2;
  power += openness * 4 - 2;
  power += beamVarNorm * 4;
  power -= hlNorm * 3;
  power += meta.aeroBonus * 1.5;
  power += meta.genBonus * 1;

  // ===== SPIN =====
  let spin = 50;
  spin += openness * 18 - 6;
  spin += hsNorm * 8 - 2;
  spin += beamVarNorm * 4;
  spin += meta.spinTech * 3;
  spin += meta.aeroBonus * 2;
  spin += meta.genBonus * 0.5;

  // ===== CONTROL =====
  let control = 50;
  control += densityNorm * 14 - 4;
  control += (1 - hsNorm) * 8 - 2;
  control += swNorm * 6 - 1.5;
  control += (1 - maxBeamNorm) * 6 - 2;
  control += hlNorm * 3;
  control += meta.genBonus * 0.5;
  control += raNorm > 0.3 ? (raNorm - 0.3) * 4 : (raNorm - 0.3) * 6;

  // ===== LAUNCH =====
  let launch = 50;
  launch += beamVarNorm * 10;
  launch += (1 - raNorm) * 8 - 3;
  launch += openness * 5 - 2;
  launch += maxBeamNorm * 4 - 1.5;
  launch += meta.spinTech * 1.5;

  // ===== COMFORT =====
  let comfort = 50;
  comfort += (1 - raNorm) * 20 - 5;
  comfort += (1 - avgBeamNorm) * 5 - 1;
  comfort += meta.comfortTech * 3;
  comfort += meta.genBonus * 1;
  if (wtNorm > 0.7) comfort -= (wtNorm - 0.7) * 8;

  // ===== STABILITY =====
  let stability = 50;
  stability += swNorm * 20 - 6;
  stability += wtNorm * 10 - 3;
  stability += raNorm * 5 - 1.5;
  stability -= hlNorm * 4;
  stability += meta.genBonus * 0.5;

  // ===== FORGIVENESS =====
  let forgiveness = 48;
  forgiveness += hsNorm * 24 - 8;
  forgiveness += swNorm * 10 - 4;
  forgiveness += beamVarNorm * 5;
  forgiveness += avgBeamNorm * 7 - 2.5;
  forgiveness += meta.comfortTech * 1.5;
  forgiveness += (1 - raNorm) * 6 - 2;
  forgiveness += wtNorm * 5 - 2;

  // ===== FEEL =====
  let feel = 50;
  feel += (1 - raNorm) * 20 - 6;
  feel += (1 - avgBeamNorm) * 10 - 3;
  feel += hlNorm * 4;
  feel += wtNorm * 4 - 1;
  feel += meta.genBonus * 1.5;
  feel += densityNorm * 4 - 2;
  feel += meta.comfortTech > 1.5 ? -1 : meta.comfortTech * 0.5;

  // ===== MANEUVERABILITY =====
  // Inverse of swingweight: lower SW = more maneuverable, easier to accelerate
  // More head-light balance = whippier feel, faster racquet-head speed generation
  // Lower weight helps maneuverability but less than SW/balance
  // This creates a natural tradeoff axis: maneuverability ↔ stability/plow
  let maneuverability = 50;
  maneuverability += (1 - swNorm) * 22 - 6;     // SW: biggest factor — low SW = high score
  maneuverability += hlNorm * 10 - 3;            // HL balance: whippier = more maneuverable
  maneuverability += (1 - wtNorm) * 8 - 2;       // Lower static weight helps
  maneuverability += (1 - hsNorm) * 4 - 1;       // Smaller heads slightly more maneuverable
  // Interaction: very HL + low SW amplifies maneuverability
  if (hlNorm > 0.5 && swNorm < 0.4) {
    maneuverability += (hlNorm - 0.5) * (0.4 - swNorm) * 12;
  }
  // Very high SW crushes maneuverability regardless of other factors
  if (swNorm > 0.75) {
    maneuverability -= (swNorm - 0.75) * 16;
  }

  // ===== TRADEOFF ENFORCEMENT =====
  if (power + control > 145) {
    const excess = (power + control - 145) * 0.4;
    if (power > control) power -= excess;
    else control -= excess;
  }
  if (power + comfort > 140) {
    const excess = (power + comfort - 140) * 0.3;
    if (raNorm > 0.5) comfort -= excess;
    else power -= excess;
  }
  // Maneuverability ↔ Stability: naturally opposed, soft enforce ceiling
  if (maneuverability + stability > 140) {
    const excess = (maneuverability + stability - 140) * 0.3;
    if (maneuverability > stability) maneuverability -= excess;
    else stability -= excess;
  }

  // ===== SCORE COMPRESSION =====
  // Target: 50-60 avg, 60-75 strong, 75-85 excellent, 85+ rare
  const compress = (val, spread) => {
    const mid = 62;
    const s = spread || 0.85;
    return Math.max(30, Math.min(90, mid + (val - mid) * s));
  };

  return {
    power: clamp(compress(power)),
    spin: clamp(compress(spin)),
    control: clamp(compress(control)),
    launch: clamp(compress(launch)),
    comfort: clamp(compress(comfort)),
    stability: clamp(compress(stability)),
    forgiveness: clamp(compress(forgiveness, 0.92)),  // wider spread for narrower natural range
    feel: clamp(compress(feel)),
    maneuverability: clamp(compress(maneuverability)),
    durability: 50,
    playability: 50,
    _frameDebug: {
      raNorm: +raNorm.toFixed(3),
      swNorm: +swNorm.toFixed(3),
      wtNorm: +wtNorm.toFixed(3),
      hsNorm: +hsNorm.toFixed(3),
      avgBeamNorm: +avgBeamNorm.toFixed(3),
      maxBeamNorm: +maxBeamNorm.toFixed(3),
      hlNorm: +hlNorm.toFixed(3),
      densityNorm: +densityNorm.toFixed(3),
      beamVarNorm: +beamVarNorm.toFixed(3),
      openness: +openness.toFixed(3),
      variable: isVariableBeam(beamWidth),
      meta: id
    }
  };
}

// B3: calcBaseStringProfile
function calcBaseStringProfile(stringData) {
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

function calcStringFrameMod(stringData) {
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
function calcTensionModifier(mainsTension, crossesTension, tensionRange, pattern) {
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

function calcHybridInteraction(mainsData, crossesData) {
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

  // ========================================
  // CASE 2: POLY MAINS + POLY CROSSES
  // ========================================
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
  }

  // ========================================
  // CASE 3: POLY MAINS + GUT/MULTI CROSSES
  // ========================================
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

  // ========================================
  // CASE 4: GUT MAINS + GUT CROSSES (full gut)
  // ========================================
  else if (isGutMains && isGutCross) {
    mods.feelMod += 3;
    mods.comfortMod += 2;
    mods.powerMod += 1;
    mods.durabilityMod -= 6;
    mods.controlMod -= 2;
    mods.spinMod -= 2;
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

// ============================================================
// PART C — Scoring, Identity, Exports
// ============================================================

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
 * @param {Object} frameMeta    — FRAME_META lookup object
 * @returns {Object} final attribute scores + identity archetype + debug info
 */
function predictSetup(racquet, stringConfig, frameMeta) {
  const frameBase = calcFrameBase(racquet, frameMeta);

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

// --- Novelty/Anomaly Bonus System ---
// Rewards frames that achieve a rare combination of high performance stats.
// A frame that's unusually high in power+spin+control for its head size band
// gets a ceiling boost — but only if the rare pattern is genuinely high-performing.
//
// This protects frames like PA 98 2026 (high spin+control in a 98, rare for that class)
// from being crushed by forgiveness weighting, while not boosting merely "weird" frames.
function computeNoveltyBonus(stats) {
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

function computeCompositeScore(stats, tensionContext) {
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

function buildTensionContext(stringConfig, racquet) {
  if (!stringConfig || !racquet) return null;
  const avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  const differential = stringConfig.mainsTension - stringConfig.crossesTension;
  const [, patCrosses] = (racquet.pattern || '16x19').split('x').map(Number);
  return { avgTension, tensionRange: racquet.tensionRange, differential, patternCrosses: patCrosses };
}

function generateIdentity(stats, racquet, stringConfig) {
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

module.exports = {
  clamp, lerp, norm, getPatternOpenness, getAvgBeam, getMaxBeam, getMinBeam,
  isVariableBeam, compressScore,
  GAUGE_OPTIONS, GAUGE_LABELS, STAT_KEYS, OBS_TIERS, IDENTITY_FAMILIES,
  applyGaugeModifier, getGaugeOptions,
  calcFrameBase, calcBaseStringProfile, calcStringFrameMod,
  calcTensionModifier, calcHybridInteraction, predictSetup,
  computeNoveltyBonus, computeCompositeScore, buildTensionContext,
  generateIdentity, generateFitProfile
};
