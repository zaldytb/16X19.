// ============================================
// TENNIS LOADOUT LAB — Engine + UI
// ============================================

// ============================================
// PREDICTION ENGINE
// ============================================

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

// ============================================
// GAUGE SYSTEM
// ============================================
// Available gauge options by material type.
// Each string's base data is measured at its refGauge (from the `gauge` field).
// When a different gauge is selected, applyGaugeModifier creates a virtual
// string object with adjusted properties.

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

// Returns a modified copy of stringData with gauge-adjusted properties.
// The base string data is the "reference" measurement (at its own gaugeNum).
// Moving to a different gauge shifts stiffness, spin, durability, etc.
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

/**
 * PREDICTION LAYER 0 — Frame base scores.
 * Normalizes raw racquet specs (stiffness, swingweight, beam, headSize, balance, pattern)
 * to [0, 1], then derives 9 attribute scores via weighted linear models.
 * Tradeoff ceilings (power+control, maneuverability+stability) are soft-enforced
 * before a final sigmoid-like compression targets the 50–85 output range.
 * @param {Object} racquet — entry from the RACQUETS array
 * @returns {Object} raw attribute scores (power, spin, control, …, maneuverability)
 */
function calcFrameBase(racquet) {
  const { stiffness, beamWidth, swingweight, pattern, headSize, strungWeight, balance, id } = racquet;
  const avgBeam = getAvgBeam(beamWidth);
  const maxBeam = getMaxBeam(beamWidth);
  const minBeam = getMinBeam(beamWidth);
  const [mains, crosses] = pattern.split('x').map(Number);
  const patternDensity = mains * crosses;
  const meta = FRAME_META[id] || { aeroBonus: 0, comfortTech: 0, spinTech: 0, genBonus: 0 };

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

// ============================================
// LAYER 1: BASE STRING PROFILE
// ============================================
// Derives a standalone string profile from twScore + physical properties.
// Score compression: 50-60 avg, 60-75 strong, 75-85 excellent, 85+ rare/exceptional.
// No string should casually hit 90+ without being a genuine outlier.

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

/**
 * PREDICTION LAYER 1 — Standalone string profile.
 * Derives attribute scores from TWU-measured physical properties:
 *   twScore    — lab-measured multi-axis ratings (power, spin, control, etc.)
 *   stiffness  — lb/in (115 softest → 234 stiffest)
 *   tensionLoss — % of initial tension lost after break-in (10% best → 50% worst)
 *   spinPotential — TWU friction-based scale (4.5 low → 9.4 high)
 * No frame or tension interaction yet — those are applied in later layers.
 * @param {Object} stringData — entry from the STRINGS array
 * @returns {Object} attribute scores (power, spin, control, comfort, feel, durability, playability)
 */
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

// ============================================
// LAYER 2: FRAME INTERACTION (string modifiers on frame)
// ============================================
// String properties create small modifiers on frame-driven stats.
// These are intentionally small (-3 to +5 range) — the frame is primary for
// spin/power/control/comfort/feel/launch; the string profile handles
// durability and playability directly.
// Magnitudes are scaled to ~60% of the Layer 1 stiffness adjustments to
// prevent over-amplification of stiffness through two additive paths.

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
function predictSetup(racquet, stringConfig) {
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
let activeLoadout = null;
// Shape: { id, name, frameId, stringId, isHybrid, mainsId, crossesId, mainsTension, crossesTension, stats, obs, identity, source }

let savedLoadouts = [];

function _loadSavedLoadouts() {
  try {
    const raw = _store ? _store.getItem('tll-loadouts') : null;
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function _persistSavedLoadouts() {
  try {
    if (_store) _store.setItem('tll-loadouts', JSON.stringify(savedLoadouts));
  } catch(e) {}
}

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
  if (activeLoadout && activeLoadout._dirty) {
    saveActiveLoadout();
  }

  activeLoadout = loadout;
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
  const existing = savedLoadouts.findIndex(l => l.id === copy.id);
  if (existing >= 0) {
    savedLoadouts[existing] = copy;
  } else {
    savedLoadouts.push(copy);
  }
  _persistSavedLoadouts();
  renderDockPanel();
}

function removeLoadout(loadoutId) {
  savedLoadouts = savedLoadouts.filter(l => l.id !== loadoutId);
  _persistSavedLoadouts();
  renderDockPanel();
}

function switchToLoadout(loadoutId) {
  const lo = savedLoadouts.find(l => l.id === loadoutId);
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

function getSetupFromLoadout(loadout) {
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
  if (!activeLoadout) return;

  const isHybrid = $('#btn-hybrid').classList.contains('active');
  const racquetId = ssInstances['select-racquet']?.getValue() || activeLoadout.frameId;

  if (isHybrid) {
    activeLoadout.isHybrid = true;
    activeLoadout.mainsId = ssInstances['select-string-mains']?.getValue() || activeLoadout.mainsId;
    activeLoadout.crossesId = ssInstances['select-string-crosses']?.getValue() || activeLoadout.crossesId;
    activeLoadout.mainsTension = parseInt($('#input-tension-mains').value) || activeLoadout.mainsTension;
    activeLoadout.crossesTension = parseInt($('#input-tension-crosses').value) || activeLoadout.crossesTension;
    const gm = document.getElementById('gauge-select-mains');
    const gx = document.getElementById('gauge-select-crosses');
    activeLoadout.mainsGauge = (gm && gm.value) ? parseFloat(gm.value) : null;
    activeLoadout.crossesGauge = (gx && gx.value) ? parseFloat(gx.value) : null;
    activeLoadout.stringId = null;
    activeLoadout.gauge = null;
  } else {
    activeLoadout.isHybrid = false;
    activeLoadout.stringId = ssInstances['select-string-full']?.getValue() || activeLoadout.stringId;
    activeLoadout.mainsTension = parseInt($('#input-tension-full-mains').value) || activeLoadout.mainsTension;
    activeLoadout.crossesTension = parseInt($('#input-tension-full-crosses').value) || activeLoadout.crossesTension;
    const gf = document.getElementById('gauge-select-full');
    activeLoadout.gauge = (gf && gf.value) ? parseFloat(gf.value) : null;
    activeLoadout.mainsId = null;
    activeLoadout.crossesId = null;
    activeLoadout.mainsGauge = null;
    activeLoadout.crossesGauge = null;
  }

  activeLoadout.frameId = racquetId;

  // Recompute derived fields from the loadout (not from DOM)
  const setup = getSetupFromLoadout(activeLoadout);
  if (setup) {
    const stats = predictSetup(setup.racquet, setup.stringConfig);
    if (stats) {
      const tCtx = buildTensionContext(setup.stringConfig, setup.racquet);
      activeLoadout.stats = stats;
      activeLoadout.obs = +(computeCompositeScore(stats, tCtx)).toFixed(1);
      activeLoadout.identity = (generateIdentity(stats, setup.racquet, setup.stringConfig)?.name) || '';
    }

    // Update name
    if (!activeLoadout.isHybrid && setup.stringConfig.string) {
      activeLoadout.name = setup.stringConfig.string.name + ' on ' + setup.racquet.name;
    } else if (activeLoadout.isHybrid && setup.stringConfig.mains && setup.stringConfig.crosses) {
      activeLoadout.name = setup.stringConfig.mains.name + ' / ' + setup.stringConfig.crosses.name + ' on ' + setup.racquet.name;
    }
  }

  // Mark dirty if this loadout has a saved counterpart
  activeLoadout._dirty = savedLoadouts.some(l => l.id === activeLoadout.id);

  renderDockPanel();
  renderDashboard();
}

function renderDockPanel() {
  const emptyEl = document.getElementById('dock-lo-empty');
  const activeEl = document.getElementById('dock-lo-active');

  if (!emptyEl || !activeEl) return;

  if (!activeLoadout) {
    emptyEl.classList.remove('hidden');
    activeEl.classList.add('hidden');
  } else {
    emptyEl.classList.add('hidden');
    activeEl.classList.remove('hidden');

    // Update OBS ring
    const obsVal = document.getElementById('dock-lo-obs-val');
    const obsRing = document.getElementById('dock-lo-obs-ring');
    const newDockObs = activeLoadout.obs || 0;
    if (obsVal) {
      if (newDockObs > 0 && _prevObsValues.dock != null && _prevObsValues.dock > 0) {
        animateOBS(obsVal, _prevObsValues.dock, newDockObs, 400);
      } else {
        obsVal.textContent = newDockObs > 0 ? newDockObs.toFixed(1) : '\u2014';
      }
    }
    _prevObsValues.dock = newDockObs;

    if (obsRing) {
      const obs = activeLoadout.obs || 0;
      const color = getObsScoreColor(obs);
      obsRing.style.borderColor = color;
      if (obsVal) obsVal.style.color = color;
    }

    // Update info
    const nameEl = document.getElementById('dock-lo-name');
    const identEl = document.getElementById('dock-lo-identity');
    const detailsEl = document.getElementById('dock-lo-details');
    const sourceEl = document.getElementById('dock-lo-source');

    const racquet = RACQUETS.find(r => r.id === activeLoadout.frameId);
    const stringData = activeLoadout.isHybrid ? null : STRINGS.find(s => s.id === activeLoadout.stringId);

    if (nameEl) nameEl.textContent = activeLoadout.name || '\u2014';
    if (identEl) identEl.textContent = activeLoadout.identity || '';
    if (detailsEl) {
      const frameName = racquet ? racquet.name : '\u2014';
      const strName = stringData ? stringData.name : (activeLoadout.isHybrid ? 'Hybrid' : '\u2014');
      const tension = 'M:' + activeLoadout.mainsTension + ' / X:' + activeLoadout.crossesTension;
      detailsEl.textContent = frameName + ' \u00B7 ' + strName + ' \u00B7 ' + tension;
    }
    if (sourceEl) {
      const src = activeLoadout.source;
      const labels = { quiz: 'Quiz', compendium: 'Racket Bible', manual: 'Manual', preset: 'Preset', optimize: 'Optimizer', shared: 'Shared' };
      const isDirty = activeLoadout._dirty;
      if (isDirty) {
        sourceEl.textContent = '\u270E Modified';
        sourceEl.style.display = '';
        sourceEl.classList.add('dock-lo-dirty');
      } else {
        sourceEl.textContent = labels[src] || '';
        sourceEl.style.display = src ? '' : 'none';
        sourceEl.classList.remove('dock-lo-dirty');
      }
    }

    // Update save button label based on dirty state
    const saveBtnEl = document.querySelector('#dock-lo-active .dock-lo-btn[onclick="saveActiveLoadout()"]');
    if (saveBtnEl) {
      const svgIcon = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 13H3a1 1 0 01-1-1V2a1 1 0 011-1h5.5L12 4.5V12a1 1 0 01-1 1z"/><polyline points="8.5 1 8.5 5 12 5"/></svg>';
      if (activeLoadout._dirty) {
        saveBtnEl.innerHTML = svgIcon + '\n                Save \u2022';
        saveBtnEl.classList.add('dock-lo-btn-dirty');
      } else {
        saveBtnEl.innerHTML = svgIcon + '\n                Save';
        saveBtnEl.classList.remove('dock-lo-btn-dirty');
      }
    }
  }

  renderMyLoadouts();
  renderDockCreateSection();
  _syncMobileDockBar();
  _syncDockRail();
  renderDockContextPanel();
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
    actions.map(a =>
      `<a class="dock-ctx-action" onclick="${a.onclick}">${a.label}</a>`
    ).join('') +
    '</div>';
}

// --- Guidance Message Helper ---
function _dockGuidance(icon, title, body) {
  return `<div class="dock-ctx-guidance">
    <div class="dock-ctx-guidance-icon">${icon}</div>
    <div class="dock-ctx-guidance-title">${title}</div>
    <div class="dock-ctx-guidance-body">${body}</div>
  </div>`;
}

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

  if (!activeLoadout) {
    // No loadout — onboarding guidance
    container.innerHTML = _dockGuidance(
      '🎾',
      'Getting started',
      'Browse frames on the right. Each one shows its top string pairings ranked by OBS (overall build score).<br><br>Tap <strong>Set Active</strong> on any build card to load it — then you can tune tension, compare builds, and explore alternatives.'
    );
  } else {
    // Has loadout — show current build summary + action links
    const racquet = RACQUETS.find(r => r.id === activeLoadout.frameId);
    const frameName = racquet ? racquet.name : '—';
    const obs = activeLoadout.obs ? activeLoadout.obs.toFixed(1) : '—';

    let stringName = '—';
    if (activeLoadout.isHybrid) {
      const m = STRINGS.find(s => s.id === activeLoadout.mainsId);
      const x = STRINGS.find(s => s.id === activeLoadout.crossesId);
      stringName = m && x ? m.name + ' / ' + x.name : '—';
    } else {
      const str = STRINGS.find(s => s.id === activeLoadout.stringId);
      stringName = str ? str.name : '—';
    }

    container.innerHTML = `
      <div class="dock-ctx-current">
        <div class="dock-ctx-label">Current build</div>
        <div class="dock-ctx-current-name">${activeLoadout.name || frameName}</div>
        <div class="dock-ctx-current-detail">${stringName} · M${activeLoadout.mainsTension}/X${activeLoadout.crossesTension}</div>
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
  if (!activeLoadout) {
    _dockReturnEditorHome();
    const editorSection = document.getElementById('dock-editor-section');
    if (editorSection) editorSection.style.display = 'none';
    container.innerHTML = _dockGuidance('🎸', 'No build loaded',
      'Load a build from Overview or the Racket Bible to start tuning.');
    return;
  }

  // Add tune-mode class for CSS overrides (hides frame section + tension rows)
  container.classList.add('dock-tune-mode');

  const racquet = RACQUETS.find(r => r.id === activeLoadout.frameId);
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
      const frameName = racquet ? racquet.name : 'Not set';

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
            <span class="dock-compare-slot-obs" style="color:${slot.stats ? getObsScoreColor(parseFloat(obs)) : 'var(--text-faint)'}">${obs}</span>
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
      html += `<button class="dock-compare-pill" onclick="_dockCompareQuickAdd('${lo.id}')" title="OBS ${lo.obs ? lo.obs.toFixed(1) : '—'}">
        ${lo.name || '—'}
      </button>`;
    });
    html += '</div>';
  }

  // Empty state
  if (comparisonSlots.length === 0 && savedLoadouts.length === 0 && !activeLoadout) {
    html = _dockGuidance('⚖️', 'Nothing to compare yet',
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

  if (!activeLoadout) {
    container.innerHTML = _dockGuidance(
      '📊',
      'No build to optimize from',
      'Load a build first — the optimizer finds better string pairings for your current frame.'
    ) + _dockContextActions([
      { label: '→ Browse the Racket Bible', onclick: "switchMode('compendium')" },
      { label: '→ Try the quiz', onclick: "openFindMyBuild()" }
    ]);
    return;
  }

  const racquet = RACQUETS.find(r => r.id === activeLoadout.frameId);
  const obs = activeLoadout.obs ? activeLoadout.obs.toFixed(1) : '—';

  // Current string info
  let stringName = '—';
  if (activeLoadout.isHybrid) {
    const m = STRINGS.find(s => s.id === activeLoadout.mainsId);
    const x = STRINGS.find(s => s.id === activeLoadout.crossesId);
    stringName = m && x ? m.name + ' / ' + x.name : '—';
  } else {
    const str = STRINGS.find(s => s.id === activeLoadout.stringId);
    stringName = str ? str.name : '—';
  }

  const tensionLabel = `M${activeLoadout.mainsTension} / X${activeLoadout.crossesTension}`;

  container.innerHTML = `
    <div class="dock-ctx-current">
      <div class="dock-ctx-label">Optimizing from</div>
      <div class="dock-ctx-current-name">${racquet ? racquet.name : '—'}</div>
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

  const actions = [];
  if (activeLoadout) {
    actions.push({ label: '→ Back to your build', onclick: "switchMode('overview')" });
    actions.push({ label: '→ Tune tension curves', onclick: "switchMode('tune')" });
  } else {
    actions.push({ label: '→ Browse the Racket Bible', onclick: "switchMode('compendium')" });
    actions.push({ label: '→ Try the quiz', onclick: "openFindMyBuild()" });
  }

  container.innerHTML = _dockGuidance(
    '📖',
    'Reference',
    "You're reading how the prediction engine works."
  ) + _dockContextActions(actions);
}

// === Mobile dock bar sync ===
function _syncMobileDockBar() {
  var obsEl = document.getElementById('dock-mob-obs');
  var labelEl = document.getElementById('dock-mob-label');
  if (!obsEl || !labelEl) return;
  
  if (activeLoadout) {
    var newMobObs = activeLoadout.obs || 0;
    if (newMobObs > 0 && _prevObsValues.mobile != null && _prevObsValues.mobile > 0) {
      animateOBS(obsEl, _prevObsValues.mobile, newMobObs, 400);
    } else {
      obsEl.textContent = newMobObs > 0 ? newMobObs.toFixed(1) : '';
    }
    _prevObsValues.mobile = newMobObs;
    labelEl.textContent = activeLoadout.name || 'Active loadout';
  } else {
    obsEl.textContent = '';
    labelEl.textContent = 'No active loadout';
  }
}

function toggleMobileDock() {
  var dock = document.getElementById('build-dock');
  if (dock) dock.classList.toggle('dock-expanded');
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
      obsEl.style.color = 'var(--text-faint)';
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

function _encodeLoadoutToURL(lo) {
  // Compact encoding: frameId|stringId|tension|crossesTension|isHybrid|mainsId|crossesId
  var parts = [
    lo.frameId || '',
    lo.stringId || '',
    lo.mainsTension || 53,
    lo.crossesTension || lo.mainsTension || 53,
    lo.isHybrid ? '1' : '0',
    lo.mainsId || '',
    lo.crossesId || ''
  ];
  return btoa(parts.join('|')).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function _decodeLoadoutFromURL(encoded) {
  try {
    // Re-add padding
    var padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (padded.length % 4) padded += '=';
    var decoded = atob(padded);
    var parts = decoded.split('|');
    if (parts.length < 3) return null;
    return {
      frameId: parts[0],
      stringId: parts[1] || null,
      mainsTension: parseInt(parts[2]) || 53,
      crossesTension: parseInt(parts[3]) || parseInt(parts[2]) || 53,
      isHybrid: parts[4] === '1',
      mainsId: parts[5] || null,
      crossesId: parts[6] || null
    };
  } catch(e) { return null; }
}

function shareLoadout(loadoutId) {
  var lo = savedLoadouts.find(function(l) { return l.id === loadoutId; });
  if (!lo && activeLoadout && activeLoadout.id === loadoutId) lo = activeLoadout;
  if (!lo) return;
  
  var encoded = _encodeLoadoutToURL(lo);
  var url = window.location.origin + window.location.pathname + '?build=' + encoded;
  
  // Copy to clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() {
      _showShareToast('Link copied to clipboard!');
    });
  } else {
    // Fallback
    var ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    _showShareToast('Link copied to clipboard!');
  }
}

function _showShareToast(msg) {
  var toast = document.getElementById('share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'share-toast';
    toast.className = 'share-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('share-toast-show');
  setTimeout(function() { toast.classList.remove('share-toast-show'); }, 2500);
}

function shareActiveLoadout() {
  if (!activeLoadout) return;
  // Temporarily set the ID so shareLoadout can find it
  shareLoadout(activeLoadout.id);
}

function exportLoadouts() {
  if (savedLoadouts.length === 0) {
    _showShareToast('No loadouts to export');
    return;
  }
  
  var exportData = {
    version: 1,
    exportDate: new Date().toISOString(),
    loadouts: savedLoadouts.map(function(lo) {
      return {
        name: lo.name,
        frameId: lo.frameId,
        stringId: lo.stringId,
        isHybrid: lo.isHybrid,
        mainsId: lo.mainsId,
        crossesId: lo.crossesId,
        mainsTension: lo.mainsTension,
        crossesTension: lo.crossesTension,
        source: lo.source
      };
    })
  };
  
  var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'tennis-loadout-lab-builds.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  _showShareToast('Loadouts exported!');
}

function importLoadouts(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      if (!data.loadouts || !Array.isArray(data.loadouts)) {
        _showShareToast('Invalid file format');
        return;
      }
      
      var imported = 0;
      data.loadouts.forEach(function(raw) {
        if (!raw.frameId) return;
        var opts = { source: raw.source || 'import', name: raw.name };
        if (raw.isHybrid) {
          opts.isHybrid = true;
          opts.mainsId = raw.mainsId;
          opts.crossesId = raw.crossesId;
          opts.crossesTension = raw.crossesTension;
        }
        var lo = createLoadout(raw.frameId, raw.isHybrid ? raw.mainsId : raw.stringId, raw.mainsTension, opts);
        if (lo) {
          // Check for duplicate — full identity match including hybrid and crosses tension
          var isDupe = savedLoadouts.some(function(existing) {
            if (existing.frameId !== lo.frameId) return false;
            if (existing.mainsTension !== lo.mainsTension) return false;
            if (existing.crossesTension !== lo.crossesTension) return false;
            if ((existing.isHybrid || false) !== (lo.isHybrid || false)) return false;
            if (lo.isHybrid) {
              return existing.mainsId === lo.mainsId && existing.crossesId === lo.crossesId;
            }
            return existing.stringId === lo.stringId;
          });
          if (!isDupe) {
            saveLoadout(lo);
            imported++;
          }
        }
      });
      
      _showShareToast(imported + ' loadout' + (imported !== 1 ? 's' : '') + ' imported!');
      renderDockPanel();
    } catch(err) {
      _showShareToast('Error reading file');
    }
  };
  reader.readAsText(file);
  // Reset input so same file can be imported again
  event.target.value = '';
}

function _handleSharedBuildURL() {
  var params = new URLSearchParams(window.location.search);
  var buildParam = params.get('build');
  if (!buildParam) return false;
  
  var decoded = _decodeLoadoutFromURL(buildParam);
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
    _showShareToast('Shared build loaded!');
    return true;
  }
  return false;
}

function renderMyLoadouts() {
  const listEl = document.getElementById('dock-myl-list');
  const countEl = document.getElementById('dock-myl-count');
  if (!listEl) return;

  if (countEl) countEl.textContent = savedLoadouts.length;

  if (savedLoadouts.length === 0) {
    listEl.innerHTML = '<div class="dock-myl-empty">No saved loadouts yet</div>';
    return;
  }

  var sourceLabels = { quiz: 'Quiz', compendium: 'Bible', manual: '', preset: 'Preset', optimize: 'Optimizer', shared: 'Shared', import: 'Import' };

  listEl.innerHTML = savedLoadouts.map(function(lo) {
    // Fix F: ID match first, then content-match fallback (QA-015)
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

    // Fix E: Source tag (QA-006)
    var srcLabel = sourceLabels[lo.source] || '';
    var sourceTag = srcLabel ? '<span class="dock-myl-source-tag dock-myl-src-' + lo.source + '">' + srcLabel + '</span>' : '';

    return '<div class="dock-myl-item ' + (isActive ? 'dock-myl-active' : '') + '" data-lo-id="' + lo.id + '">' +
      '<div class="dock-myl-item-main" onclick="switchToLoadout(\'' + lo.id + '\')">' +
        '<div class="dock-myl-obs">' + (lo.obs ? lo.obs.toFixed(1) : '\u2014') + '</div>' +
        '<div class="dock-myl-item-info">' +
          '<div class="dock-myl-item-name">' + lo.name + (isActive ? ' <span class="dock-myl-active-badge">Active</span>' : '') + sourceTag + '</div>' +
          '<div class="dock-myl-item-meta">' + (racquet ? racquet.name : '\u2014') + ' \u00B7 ' + lo.mainsTension + 'lbs</div>' +
        '</div>' +
      '</div>' +
      '<div class="dock-myl-item-actions">' +
        '<button class="dock-myl-btn" onclick="shareLoadout(\'' + lo.id + '\')" title="Share link">' +
          '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7.5L8 4.5M8 4.5V7M8 4.5H5.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="1" y="1" width="10" height="10" rx="2"/></svg>' +
        '</button>' +
        '<button class="dock-myl-btn" onclick="addLoadoutToCompare(\'' + lo.id + '\')" title="Compare">' +
          '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="4" height="10" rx="0.5"/><rect x="7" y="1" width="4" height="10" rx="0.5"/></svg>' +
        '</button>' +
        '<button class="dock-myl-btn dock-myl-btn-remove" onclick="confirmRemoveLoadout(\'' + lo.id + '\')" title="Remove">' +
          '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

// Fix J: Two-step remove confirmation (QA-028)
function confirmRemoveLoadout(loadoutId) {
  var item = document.querySelector('.dock-myl-item[data-lo-id="' + loadoutId + '"]');
  if (!item) return;
  var actions = item.querySelector('.dock-myl-item-actions');
  if (!actions) return;
  actions.innerHTML =
    '<span class="dock-myl-confirm-text">Delete?</span>' +
    '<button class="dock-myl-btn dock-myl-btn-confirm-yes" onclick="removeLoadout(\'' + loadoutId + '\')">Yes</button>' +
    '<button class="dock-myl-btn" onclick="renderMyLoadouts()">No</button>';
}

// Dock action handlers
function saveActiveLoadout() {
  if (!activeLoadout) return;
  activeLoadout._dirty = false;
  saveLoadout(activeLoadout);
}

function duplicateActiveLoadout() {
  if (!activeLoadout) return;
  var dupe = Object.assign({}, activeLoadout, {
    id: 'lo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name: activeLoadout.name + ' (copy)'
  });
  saveLoadout(dupe);
  activateLoadout(dupe);
}

function resetActiveLoadout() {
  activeLoadout = null;

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

  // Save scroll position of current mode's workspace
  const workspace = document.getElementById('workspace');
  if (workspace) scrollPositions[currentMode] = workspace.scrollTop;

  // Hide current mode section
  const currentSection = document.getElementById('mode-' + currentMode);
  if (currentSection) currentSection.classList.add('hidden');

  // Update mode switcher buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

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
  if (workspace) {
    requestAnimationFrame(() => {
      workspace.scrollTop = scrollPositions[mode] || 0;
    });
  }

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
    }
  }
  // howitworks mode needs no special init — it's static content

  // Update dock context panel for new mode
  renderDockContextPanel();
}

// ============================================
// DYNAMIC PRESET SYSTEM
// ============================================

const DEFAULT_PRESETS = [
  {
    id: 'confidential-sync-pa100',
    name: 'Confidential/Sync on PA100',
    racquetId: 'babolat-pure-aero-100-2023',
    isHybrid: true,
    mainsId: 'solinco-confidential-16',
    crossesId: 'restring-sync',
    mainsTension: 55,
    crossesTension: 53,
    stringId: null,
    tension: null
  },
  {
    id: 'gut-rpm-pa100',
    name: 'Gut/RPM on PA100',
    racquetId: 'babolat-pure-aero-100-2023',
    isHybrid: true,
    mainsId: 'babolat-vs-touch-16',
    crossesId: 'babolat-rpm-blast-17',
    mainsTension: 55,
    crossesTension: 53,
    stringId: null,
    tension: null
  },
  {
    id: 'confidential-speed-legend',
    name: 'Confidential Full on Speed Legend',
    racquetId: 'head-speed-mp-legend-2025',
    isHybrid: false,
    mainsId: null,
    crossesId: null,
    mainsTension: 55,
    crossesTension: 53,
    stringId: 'solinco-confidential-16'
  }
];

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

const STAT_KEYS = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability', 'durability', 'playability'];
const STAT_LABELS = ['Spin', 'Power', 'Control', 'Launch', 'Feel', 'Comfort', 'Stability', 'Forgiveness', 'Maneuverability', 'Durability', 'Playability'];
const STAT_LABELS_FULL = ['Spin', 'Power', 'Control', 'Launch', 'Feel', 'Comfort', 'Stability', 'Forgiveness', 'Maneuverability', 'Durability', 'Playability Duration'];
const STAT_CSS_CLASSES = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability', 'durability', 'playability'];

function getSlotColors() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  return [
    { border: isDark ? '#38BDF8' : '#0EA5E9', bg: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(14, 165, 233, 0.14)', bgFaint: isDark ? 'rgba(56, 189, 248, 0.06)' : 'rgba(14, 165, 233, 0.06)', label: 'A', cssClass: 'a', borderDash: [] },
    { border: isDark ? '#A78BFA' : '#8B5CF6', bg: isDark ? 'rgba(167, 139, 250, 0.16)' : 'rgba(139, 92, 246, 0.14)', bgFaint: isDark ? 'rgba(167, 139, 250, 0.06)' : 'rgba(139, 92, 246, 0.06)', label: 'B', cssClass: 'b', borderDash: [6, 3] },
    { border: isDark ? '#FB923C' : '#F97316', bg: isDark ? 'rgba(251, 146, 60, 0.16)' : 'rgba(249, 115, 22, 0.14)', bgFaint: isDark ? 'rgba(251, 146, 60, 0.06)' : 'rgba(249, 115, 22, 0.06)', label: 'C', cssClass: 'c', borderDash: [2, 3] }
  ];
}
let SLOT_COLORS = getSlotColors();

// ============================================
// SEARCHABLE DROPDOWN COMPONENT
// ============================================

// Parse brand from racquet name (first word)
function parseRacquetBrand(name) {
  return name.split(' ')[0];
}

// Parse family from racquet name (second word or group like "Pure Aero")
function parseRacquetFamily(name) {
  const parts = name.split(' ');
  if (parts.length < 2) return '';
  // Known two-word families
  const twoWord = ['Pure Aero', 'Pure Drive', 'Pure Strike', 'Pro Staff', 'Poly Tour'];
  const rest = parts.slice(1).join(' ');
  for (const tw of twoWord) {
    if (rest.startsWith(tw)) return tw;
  }
  return parts[1];
}

// Sort racquets: brand → family → model → year desc
function getSortedRacquets() {
  return [...RACQUETS].sort((a, b) => {
    const brandA = parseRacquetBrand(a.name);
    const brandB = parseRacquetBrand(b.name);
    if (brandA !== brandB) return brandA.localeCompare(brandB);
    const famA = parseRacquetFamily(a.name);
    const famB = parseRacquetFamily(b.name);
    if (famA !== famB) return famA.localeCompare(famB);
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return (b.year || 0) - (a.year || 0);
  });
}

// Sort strings: brand → name → gauge
function getSortedStrings() {
  return [...STRINGS].sort((a, b) => {
    const brandA = a.name.split(' ')[0];
    const brandB = b.name.split(' ')[0];
    if (brandA !== brandB) return brandA.localeCompare(brandB);
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return (a.gaugeNum || 0) - (b.gaugeNum || 0);
  });
}

function getStringMaterialBadge(material) {
  if (!material) return '';
  const m = material.toLowerCase();
  if (m.includes('multifilament') || m.includes('multi')) return '<span class="ss-opt-badge badge-multi">MULTI</span>';
  if (m.includes('synthetic')) return '<span class="ss-opt-badge badge-syngut">SYN GUT</span>';
  if (m.includes('natural gut') || (m.includes('gut') && !m.includes('synthetic'))) return '<span class="ss-opt-badge badge-gut">GUT</span>';
  if (m.includes('co-poly') || m.includes('copoly')) return '<span class="ss-opt-badge badge-copoly">CO-POLY</span>';
  if (m.includes('poly')) return '<span class="ss-opt-badge badge-poly">POLY</span>';
  return '';
}

// Registry of all searchable selects for cleanup
const _ssRegistry = new Map();

function createSearchableSelect(container, {
  type = 'racquet', // 'racquet' or 'string'
  placeholder = 'Select...',
  value = '',
  onChange = () => {},
  id = ''
}) {
  // Clean up previous instance if exists
  if (_ssRegistry.has(container)) {
    const old = _ssRegistry.get(container);
    if (old._cleanup) old._cleanup();
  }

  container.innerHTML = '';
  container.classList.add('searchable-select');

  const items = type === 'racquet' ? getSortedRacquets() : getSortedStrings();

  // Build trigger
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ss-trigger';
  if (id) trigger.id = id;

  // Build dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'ss-dropdown';

  const searchWrap = document.createElement('div');
  searchWrap.className = 'ss-search-wrap';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'ss-search';
  searchInput.placeholder = type === 'racquet' ? 'Search racquets...' : 'Search strings...';
  searchInput.autocomplete = 'off';
  searchWrap.appendChild(searchInput);
  dropdown.appendChild(searchWrap);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'ss-options';
  dropdown.appendChild(optionsContainer);

  container.appendChild(trigger);
  container.appendChild(dropdown);

  let selectedValue = value;
  let highlightIndex = -1;
  let flatOptions = []; // all visible option elements for keyboard nav

  function getDisplayText(val) {
    if (!val) return '';
    if (type === 'racquet') {
      const r = RACQUETS.find(x => x.id === val);
      return r ? r.name : '';
    } else {
      const s = STRINGS.find(x => x.id === val);
      return s ? s.name : '';  // gauge is now a separate selector
    }
  }

  function updateTrigger() {
    const text = getDisplayText(selectedValue);
    if (text) {
      trigger.textContent = text;
      trigger.classList.remove('ss-placeholder');
    } else {
      trigger.textContent = placeholder;
      trigger.classList.add('ss-placeholder');
    }
  }

  function renderOptions(filter = '') {
    optionsContainer.innerHTML = '';
    flatOptions = [];
    highlightIndex = -1;
    const q = filter.toLowerCase().trim();

    let lastGroup = '';
    let hasResults = false;

    items.forEach(item => {
      // Build search text
      let searchText, groupKey, primaryText, secondaryText, badgeHTML;

      if (type === 'racquet') {
        searchText = `${item.name} ${item.year || ''} ${item.pattern || ''}`.toLowerCase();
        groupKey = parseRacquetBrand(item.name);
        // Split name: everything before weight suffix becomes primary, weight goes to secondary
        const wtMatch = item.name.match(/^(.+?)\s+(\d+g)$/);
        primaryText = wtMatch ? wtMatch[1] : item.name;
        const wtBadge = wtMatch ? `<span class="ss-opt-badge badge-weight">${wtMatch[2]}</span>` : '';
        secondaryText = `${item.year || ''}`;
        badgeHTML = wtBadge;
      } else {
        searchText = `${item.name} ${item.gauge} ${item.material || ''} ${item.gaugeNum || ''} ${item.shape || ''}`.toLowerCase();
        groupKey = item.name.split(' ')[0];
        primaryText = item.name;
        secondaryText = `${item.shape || item.material || ''}`;
        badgeHTML = getStringMaterialBadge(item.material);
      }

      // Filter
      if (q) {
        const words = q.split(/\s+/);
        const match = words.every(w => searchText.includes(w));
        if (!match) return;
      }

      hasResults = true;

      // Group header
      if (groupKey !== lastGroup) {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'ss-group-label';
        groupLabel.textContent = groupKey;
        optionsContainer.appendChild(groupLabel);
        lastGroup = groupKey;
      }

      // Option
      const opt = document.createElement('div');
      opt.className = 'ss-option';
      if (item.id === selectedValue) opt.classList.add('ss-selected');
      opt.dataset.value = item.id;

      if (type === 'string') {
        // 2-line stacked layout for strings: name on line 1, type+gauge on line 2
        opt.classList.add('ss-option-stacked');
        opt.innerHTML = `
          <span class="ss-opt-primary">${primaryText}</span>
          <span class="ss-opt-meta">${badgeHTML}<span class="ss-opt-secondary">${secondaryText}</span></span>
        `;
      } else {
        // 2-line stacked layout for racquets: model on line 1, weight+year on line 2
        opt.classList.add('ss-option-stacked');
        opt.innerHTML = `
          <span class="ss-opt-primary">${primaryText}</span>
          <span class="ss-opt-meta">${badgeHTML}<span class="ss-opt-secondary">${secondaryText}</span></span>
        `;
      }

      opt.addEventListener('mouseenter', () => {
        flatOptions.forEach(o => o.classList.remove('ss-highlighted'));
        opt.classList.add('ss-highlighted');
        highlightIndex = flatOptions.indexOf(opt);
      });

      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        selectOption(item.id);
      });

      optionsContainer.appendChild(opt);
      flatOptions.push(opt);
    });

    if (!hasResults) {
      const noRes = document.createElement('div');
      noRes.className = 'ss-no-results';
      noRes.textContent = 'No matches found';
      optionsContainer.appendChild(noRes);
    }
  }

  function selectOption(val) {
    selectedValue = val;
    updateTrigger();
    closeDropdown();
    onChange(val);
  }

  function openDropdown() {
    container.classList.add('ss-open');
    searchInput.value = '';
    renderOptions();
    // Slight delay for DOM to settle before focus
    requestAnimationFrame(() => searchInput.focus());
    // Scroll selected into view
    requestAnimationFrame(() => {
      const sel = optionsContainer.querySelector('.ss-selected');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    });
  }

  function closeDropdown() {
    container.classList.remove('ss-open');
    searchInput.value = '';
    highlightIndex = -1;
  }

  function isOpen() {
    return container.classList.contains('ss-open');
  }

  // Event: trigger click
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen()) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Event: search input
  searchInput.addEventListener('input', () => {
    renderOptions(searchInput.value);
  });

  // Event: keyboard
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatOptions.length === 0) return;
      highlightIndex = Math.min(highlightIndex + 1, flatOptions.length - 1);
      flatOptions.forEach(o => o.classList.remove('ss-highlighted'));
      flatOptions[highlightIndex].classList.add('ss-highlighted');
      flatOptions[highlightIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatOptions.length === 0) return;
      highlightIndex = Math.max(highlightIndex - 1, 0);
      flatOptions.forEach(o => o.classList.remove('ss-highlighted'));
      flatOptions[highlightIndex].classList.add('ss-highlighted');
      flatOptions[highlightIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && flatOptions[highlightIndex]) {
        const val = flatOptions[highlightIndex].dataset.value;
        selectOption(val);
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
      trigger.focus();
    }
  });

  // Close on outside click
  function onDocClick(e) {
    if (!container.contains(e.target)) {
      closeDropdown();
    }
  }
  document.addEventListener('click', onDocClick);

  // Init
  updateTrigger();

  const instance = {
    getValue: () => selectedValue,
    setValue: (val) => {
      selectedValue = val;
      updateTrigger();
    },
    _cleanup: () => {
      document.removeEventListener('click', onDocClick);
    }
  };

  _ssRegistry.set(container, instance);
  return instance;
}

// ============================================
// POPULATE DROPDOWNS (Searchable)
// ============================================

// Store references to searchable select instances
const ssInstances = {};

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
    <div class="frame-spec-item"><span class="frame-spec-label">Weight</span><span class="frame-spec-value">${racquet.strungWeight}g</span></div>
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
  const pct = Math.min(score / 100, 1);
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference * (1 - pct);
  const tier = getObsTier(score);

  // String name for meta line
  let stringName;
  if (stringConfig.isHybrid) {
    stringName = `${stringConfig.mains.name} ${stringConfig.mains.gauge} / ${stringConfig.crosses.name} ${stringConfig.crosses.gauge}`;
  } else {
    stringName = `${stringConfig.string.name} ${stringConfig.string.gauge}`;
  }
  const tensionLabel = `M${stringConfig.mainsTension} / X${stringConfig.crossesTension}`;

  // Tags
  const tags = (identity.tags || []).map(t => `<span class="hero-tag">${t}</span>`).join('');

  el.innerHTML = `
    <div class="hero-score">
      <div class="hero-obs-ring">
        <svg viewBox="0 0 100 100">
          <circle class="ring-bg" cx="50" cy="50" r="42" />
          <circle class="ring-fill" cx="50" cy="50" r="42"
            stroke-dasharray="${circumference.toFixed(1)}"
            stroke-dashoffset="${dashOffset.toFixed(1)}"
            style="stroke:${getObsScoreColor(score)}" />
        </svg>
        <span class="hero-obs-value" style="color:${getObsScoreColor(score)}">${score.toFixed(1)}</span>
      </div>
      <div class="hero-obs-tier">${tier.label}</div>
    </div>
    <div class="hero-identity">
      <div class="hero-archetype">${identity.archetype}</div>
      <div class="hero-desc">${identity.description}</div>
      <div class="hero-tags">${tags}</div>
      <div class="hero-meta">
        ${racquet.name} <span class="hero-sep">·</span> ${stringName} <span class="hero-sep">·</span> ${tensionLabel}
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
function buildTensionContext(stringConfig, racquet) {
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
  const sep = '<span class="oc-sep">·</span>';

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
      <div class="oc-foundation-group-title">Frame</div>
      <div class="oc-foundation-group-values">${racquet.strungWeight}g ${sep} SW ${racquet.swingweight} ${sep} ${racquet.stiffness} RA ${sep} ${racquet.pattern}</div>
    </div>
    <div class="oc-foundation-group">
      <div class="oc-foundation-group-title">String</div>
      <div class="oc-foundation-group-values">Stiffness ${strStiff} ${sep} T-Loss ${strTensionLoss}% ${sep} Spin ${strSpinPot}</div>
    </div>
    <div class="oc-foundation-group">
      <div class="oc-foundation-group-title">Model</div>
      <div class="oc-foundation-group-values">Power ${stats.power} ${sep} Control ${stats.control} ${sep} Comfort ${stats.comfort}</div>
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
const STAT_GROUPS = [
  { label: 'Attack', keys: ['spin', 'power', 'launch'] },
  { label: 'Defense', keys: ['control', 'stability', 'forgiveness'] },
  { label: 'Touch', keys: ['feel', 'comfort', 'maneuverability'] },
  { label: 'Longevity', keys: ['durability', 'playability'] }
];

function _statBarColor(val) {
  if (val >= 70) return 'var(--fn)';
  if (val >= 60) return 'var(--text-primary)';
  return 'var(--text-muted)';
}

function renderStatBars(stats) {
  const container = $('#stat-bars');
  container.innerHTML = '';

  const keyToLabel = {};
  STAT_KEYS.forEach((k, i) => keyToLabel[k] = STAT_LABELS[i]);
  const keyToClass = {};
  STAT_KEYS.forEach((k, i) => keyToClass[k] = STAT_CSS_CLASSES[i]);

  let barIdx = 0;
  STAT_GROUPS.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'stat-group';
    groupDiv.innerHTML = '<div class="stat-group-label">' + group.label + '</div>';

    group.keys.forEach(key => {
      const value = stats[key];
      const color = _statBarColor(value);
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `
        <span class="stat-label">${keyToLabel[key]}</span>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" data-target="${value}" data-color="${color}"></div>
        </div>
        <span class="stat-value" style="color:${color}">${value}</span>
      `;
      groupDiv.appendChild(row);
      barIdx++;
    });

    container.appendChild(groupDiv);
  });

  // Animate bars
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.querySelectorAll('.stat-bar-fill').forEach((bar, idx) => {
        const val = parseFloat(bar.dataset.target);
        bar.style.width = val + '%';
        bar.style.background = bar.dataset.color;
        bar.style.opacity = (0.35 + (val / 100) * 0.65).toFixed(2);
        bar.style.transitionDelay = (idx * 40) + 'ms';
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

  const topChips = top3.map(s =>
    '<span class="dna-chip dna-chip-strong">' + s.label + ' <b>' + s.val + '</b></span>'
  ).join('');
  const botChips = bot2.map(s =>
    '<span class="dna-chip dna-chip-gap">' + s.label + ' <b>' + s.val + '</b></span>'
  ).join('');

  el.innerHTML = `
    <div class="dna-highlights-row">
      <span class="dna-highlights-label">Strongest</span>${topChips}
      <span class="dna-highlights-sep">·</span>
      <span class="dna-highlights-label">Gaps</span>${botChips}
    </div>
  `;
}

function renderRadarChart(stats) {
  const ctx = document.getElementById('radar-chart').getContext('2d');

  const data = STAT_KEYS.map(k => stats[k]);

  const isDark = document.documentElement.dataset.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const angleColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const labelColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.44)';
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--fn').trim() || '#0EA5E9';
  const fillColor = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 165, 233, 0.10)';

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
        borderWidth: 1.5,
        pointBackgroundColor: accentColor,
        pointBorderColor: 'transparent',
        pointRadius: 2.5,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 25,
            display: false
          },
          grid: {
            color: gridColor,
            circular: false,
            lineWidth: 0.5
          },
          angleLines: {
            color: angleColor,
            lineWidth: 0.5
          },
          pointLabels: {
            font: {
              family: "'General Sans', sans-serif",
              size: 10,
              weight: 500
            },
            color: labelColor,
            padding: 4
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
            font: { family: "'General Sans', sans-serif", size: 11, weight: 500 },
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
            font: { family: "'General Sans', sans-serif", size: 10, weight: 500 },
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
      div.innerHTML = `
        <div class="compare-summary-top">
          <div class="compare-summary-identity">
            <span class="compare-summary-label slot-label-${color.cssClass}">Setup ${color.label}</span>
            <div class="compare-summary-archetype" style="font-size:0.82rem;opacity:0.5;">Not configured</div>
          </div>
          <button class="compare-card-remove" onclick="removeComparisonSlot(${index})" title="Remove">✕</button>
        </div>
        <div class="compare-card-editor" data-slot="${index}">
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
  if (isHybrid) {
    $('#btn-full').classList.remove('active');
    $('#btn-hybrid').classList.add('active');
    $('#full-bed-config').classList.add('hidden');
    $('#hybrid-config').classList.remove('hidden');
  } else {
    $('#btn-full').classList.add('active');
    $('#btn-hybrid').classList.remove('active');
    $('#full-bed-config').classList.remove('hidden');
    $('#hybrid-config').classList.add('hidden');
  }
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

  // Configure slider range from racquet
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

  // Run full sweep
  runTensionSweep(setup);

  // Calculate optimal window
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

  // Use slider range as the scale (matches the tension explorer above)
  var scaleMin = sMin || w.low;
  var scaleMax = sMax || w.high;
  var scaleRange = scaleMax - scaleMin;
  if (scaleRange <= 0) scaleRange = 1;

  // Optimal window fill position within slider scale
  var fillLeft = ((w.low - scaleMin) / scaleRange) * 100;
  var fillRight = ((w.high - scaleMin) / scaleRange) * 100;
  var fillWidth = fillRight - fillLeft;

  // Anchor dot position within slider scale
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
        <span class="optimal-stat-value">${anchorStats.control}</span>
      </div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Comfort</span>
        <span class="optimal-stat-value">${anchorStats.comfort}</span>
      </div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Spin</span>
        <span class="optimal-stat-value">${anchorStats.spin}</span>
      </div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Power</span>
        <span class="optimal-stat-value">${anchorStats.power}</span>
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

  container.innerHTML = `
    <div class="delta-header-row">
      <span class="delta-baseline-label">${baseLabel}</span>
      <span class="delta-explored-label">${exploreLabel}</span>
    </div>
    <div class="delta-stats-grid">
      ${deltaKeys.map((key, i) => {
        const diff = Math.round(explored[key] - base[key]);
        const cls = diff > 0 ? 'delta-positive' : diff < 0 ? 'delta-negative' : 'delta-neutral';
        const sign = diff > 0 ? '+' : '';
        return `
          <div class="delta-stat-row">
            <span class="delta-stat-label">${deltaLabels[i]}</span>
            <div class="delta-stat-bar-track">
              <div class="delta-stat-bar-baseline" style="width:${base[key]}%"></div>
              ${!isAtBaseline ? `<div class="delta-stat-bar-explored ${cls}" style="width:${explored[key]}%"></div>` : ''}
            </div>
            <span class="delta-stat-diff ${cls}">${isAtBaseline ? '—' : `${sign}${diff}`}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
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

  const curveColors = {
    control: { border: isDark ? '#38BDF8' : '#0EA5E9', bg: isDark ? 'rgba(56,189,248,0.10)' : 'rgba(14,165,233,0.08)' },
    comfort: { border: isDark ? '#A78BFA' : '#8B5CF6', bg: isDark ? 'rgba(167,139,250,0.10)' : 'rgba(139,92,246,0.08)' },
    spin:    { border: isDark ? '#FB923C' : '#F97316', bg: isDark ? 'rgba(251,146,60,0.10)' : 'rgba(249,115,22,0.08)' },
    power:   { border: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.30)', bg: 'transparent' }
  };

  const datasets = [
    {
      label: 'Control',
      data: data.map(d => d.stats.control),
      borderColor: curveColors.control.border,
      backgroundColor: curveColors.control.bg,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      pointStyle: false,
      pointHitRadius: 8
    },
    {
      label: 'Comfort',
      data: data.map(d => d.stats.comfort),
      borderColor: curveColors.comfort.border,
      backgroundColor: curveColors.comfort.bg,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      pointStyle: false,
      pointHitRadius: 8
    },
    {
      label: 'Spin',
      data: data.map(d => d.stats.spin),
      borderColor: curveColors.spin.border,
      backgroundColor: curveColors.spin.bg,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      pointStyle: false,
      pointHitRadius: 8
    },
    {
      label: 'Power',
      data: data.map(d => d.stats.power),
      borderColor: curveColors.power.border,
      backgroundColor: curveColors.power.bg,
      fill: false,
      tension: 0.3,
      borderWidth: 1.5,
      borderDash: [4, 3],
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
        ctx.font = "500 10px 'General Sans', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('BASELINE', bx, chartArea.top - 6);
        ctx.restore();
      }

      // Explored marker
      if (tuneState.exploredTension !== tuneState.baselineTension) {
        const ex = xScale.getPixelForValue(tuneState.exploredTension);
        if (ex >= chartArea.left && ex <= chartArea.right) {
          ctx.save();
          ctx.strokeStyle = isDark ? '#38BDF8' : '#0EA5E9';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(ex, chartArea.top);
          ctx.lineTo(ex, chartArea.bottom);
          ctx.stroke();
          ctx.fillStyle = isDark ? '#38BDF8' : '#0EA5E9';
          ctx.font = "600 10px 'General Sans', sans-serif";
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
        ctx.fillStyle = isDark ? 'rgba(56,189,248,0.06)' : 'rgba(14,165,233,0.08)';
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
            font: { family: "'General Sans', sans-serif", size: 11, weight: 500 },
            color: legendColor,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)',
          titleColor: isDark ? '#fff' : '#1a1a1a',
          bodyColor: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          borderWidth: 1,
          titleFont: { family: "'JetBrains Mono', monospace", size: 12, weight: 600 },
          bodyFont: { family: "'General Sans', sans-serif", size: 11 },
          padding: 10,
          cornerRadius: 6,
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
            font: { family: "'General Sans', sans-serif", size: 11, weight: 500 },
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
            font: { family: "'General Sans', sans-serif", size: 11, weight: 500 },
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
    const arrowIcon = diff > 0 ? '↑' : '↓';
    container.innerHTML = `<div class="best-value-callout best-value-move">
      <span class="best-value-icon">${arrowIcon}</span>
      <span><strong>Best Value Move:</strong> ${direction} ${Math.abs(diff)} lbs to ${anchor} lbs for peak balanced performance.</span>
    </div>`;
  }
}

// ---- Overall Build Score — Rank Ladder Bar ----

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

function getObsTier(score) {
  for (let i = OBS_TIERS.length - 1; i >= 0; i--) {
    if (score >= OBS_TIERS[i].min) return OBS_TIERS[i];
  }
  return OBS_TIERS[0];
}

// Ice Court score color system — monochrome + fn blue at peak
function getObsScoreColor(score) {
  const isDark = document.documentElement.dataset.theme === 'dark';
  if (score >= 80) return isDark ? 'var(--fn, #38BDF8)' : 'var(--fn, #0EA5E9)';
  if (score >= 60) return 'var(--text-primary)';
  if (score >= 40) return 'var(--text-muted)';
  return 'var(--text-faint)';
}

function getObsBadgeStyle(score) {
  const isDark = document.documentElement.dataset.theme === 'dark';
  if (score >= 80) return isDark
    ? 'background: rgba(56, 189, 248, 0.12); color: #38BDF8;'
    : 'background: rgba(14, 165, 233, 0.10); color: #0369A1;';
  if (score >= 70) return isDark
    ? 'background: rgba(250, 250, 250, 0.08); color: #FAFAFA;'
    : 'background: rgba(24, 24, 27, 0.06); color: #18181B;';
  if (score >= 60) return isDark
    ? 'background: rgba(161, 161, 170, 0.10); color: #A1A1AA;'
    : 'background: rgba(63, 63, 70, 0.08); color: #3F3F46;';
  if (score >= 50) return isDark
    ? 'background: rgba(113, 113, 122, 0.10); color: #71717A;'
    : 'background: rgba(113, 113, 122, 0.08); color: #71717A;';
  if (score >= 40) return isDark
    ? 'background: rgba(251, 191, 36, 0.10); color: #FBBF24;'
    : 'background: rgba(217, 119, 6, 0.08); color: #B45309;';
  if (score >= 30) return isDark
    ? 'background: rgba(251, 146, 60, 0.10); color: #FB923C;'
    : 'background: rgba(234, 88, 12, 0.08); color: #C2410C;';
  return isDark
    ? 'background: rgba(248, 113, 113, 0.10); color: #F87171;'
    : 'background: rgba(220, 38, 38, 0.06); color: #DC2626;';
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

  // Zone divider lines on the bar
  const zoneLines = OBS_TIERS.slice(1).map(t => 
    `<div class="obs-zone-line" style="left: ${t.min}%"></div>`
  ).join('');

  const ladderLabels = OBS_TIERS.map((t, i) => {
    const centerPct = (t.min + t.max) / 2;
    const clampedPct = Math.max(8, Math.min(92, centerPct));
    const isActive = score >= t.min && (score < t.max || (t.max === 100 && score >= t.min));
    const row = i % 2 === 0 ? 'obs-ladder-row-top' : 'obs-ladder-row-bot';
    return `<span class="obs-ladder-label ${row} ${isActive ? 'obs-ladder-active' : ''}" style="left: ${clampedPct}%" data-tier="${t.label}">${t.label}</span>`;
  }).join('');

  container.innerHTML = `
    <div class="obs-top-row">
      <div class="obs-score-group">
        <span class="obs-score-value" style="color:${getObsScoreColor(score)}">${score.toFixed(1)}</span>
        ${deltaHTML}
        <span class="obs-score-label">Composite</span>
      </div>
      <span class="obs-rank-badge" style="${getObsBadgeStyle(score)}">${tier.label}</span>
    </div>
    <div class="obs-bar-wrapper">
      <div class="obs-bar-track">
        <div class="obs-marker" style="left: ${Math.max(1, Math.min(99, pct))}%"></div>
      </div>
      <div class="obs-bar-zones">${zoneLines}</div>
      <div class="obs-ladder">${ladderLabels}</div>
    </div>
    <p class="obs-subtitle">Composite score · rank ladder</p>
  `;

  // OBS counting animation (skip during slider drag)
  if (animate && _prevObsValues.tune != null) {
    var obsEl = container.querySelector('.obs-score-value');
    if (obsEl) animateOBS(obsEl, _prevObsValues.tune, score, 400);
  }
  _prevObsValues.tune = score;
}

// ---- What To Try Next — 3-bucket contextual recommendations ----

const WTTN_ATTRS = ['spin','power','control','launch','feel','comfort','stability','forgiveness','durability','playability'];
const WTTN_ATTR_LABELS = { spin:'Spin', power:'Power', control:'Control', launch:'Launch', feel:'Feel', comfort:'Comfort', stability:'Stability', forgiveness:'Forgiveness', durability:'Durability', playability:'Playability' };

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

function classifySetup(stats) {
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
    <p class="recs-footnote">Composite score across all 11 stats at optimal tension for <strong>${racquet.name}</strong>. Delta is vs your current build.</p>
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
// THEME TOGGLE
// ============================================

function toggleTheme() {
  const html = document.documentElement;
  const current = html.dataset.theme;

  // Wave 2: Smooth color crossfade
  html.classList.add('theme-transitioning');
  html.dataset.theme = current === 'dark' ? 'light' : 'dark';
  setTimeout(() => html.classList.remove('theme-transitioning'), 450);

  // Refresh theme-dependent colors
  SLOT_COLORS = getSlotColors();

  // Update charts
  if (currentRadarChart) {
    const setup = getCurrentSetup();
    if (setup) {
      const stats = predictSetup(setup.racquet, setup.stringConfig);
      renderRadarChart(stats);
    }
  }
  if (comparisonRadarChart) {
    updateComparisonRadar();
    // Re-render comparison slots with updated colors
    renderComparisonSlots();
  }

  // Refresh sweep chart if tune mode is open
  if (currentMode === 'tune' && sweepChart) {
    sweepChart.destroy();
    sweepChart = null;
    const setup = getCurrentSetup();
    if (setup) renderSweepChart(setup);
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function init() {
  // Populate searchable dropdowns (onChange callbacks handle dashboard re-render)
  populateRacquetDropdown($('#select-racquet'));
  populateStringDropdown($('#select-string-full'));
  populateStringDropdown($('#select-string-mains'));
  populateStringDropdown($('#select-string-crosses'));

  // Tension inputs — route through commitEditorToLoadout when active loadout exists
  function _onEditorChange() {
    if (activeLoadout) {
      commitEditorToLoadout();
    } else {
      renderDashboard();
    }
  }
  $('#input-tension-full-mains').addEventListener('input', _onEditorChange);
  $('#input-tension-full-crosses').addEventListener('input', _onEditorChange);
  $('#input-tension-mains').addEventListener('input', _onEditorChange);
  $('#input-tension-crosses').addEventListener('input', _onEditorChange);

  // String mode toggle
  $('#btn-full').addEventListener('click', () => {
    setHybridMode(false);
    _onEditorChange();
  });
  $('#btn-hybrid').addEventListener('click', () => {
    setHybridMode(true);
    _onEditorChange();
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
  savedLoadouts = _loadSavedLoadouts();

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
    var item = document.querySelector('.comp-frame-item[data-id="' + racquetId + '"]');
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

  const top = candidates.slice(0, 200); // Cap at 200 rows for perf

  let html = `<div class="opt-table-wrap"><table class="opt-table">
    <thead><tr>
      <th class="opt-th opt-th-rank">#</th>
      <th class="opt-th opt-th-type">Type</th>
      <th class="opt-th opt-th-string">String(s)</th>
      <th class="opt-th opt-th-num${sortColClass === 'obs' ? ' opt-th-active' : ''}">OBS</th>
      <th class="opt-th opt-th-num opt-th-delta">&Delta;</th>
      <th class="opt-th opt-th-gauge">Ga.</th>
      <th class="opt-th opt-th-tension">Tension</th>
      <th class="opt-th opt-th-num${sortColClass === 'spin' ? ' opt-th-active' : ''}">Spn</th>
      <th class="opt-th opt-th-num${sortColClass === 'power' ? ' opt-th-active' : ''}">Pwr</th>
      <th class="opt-th opt-th-num${sortColClass === 'control' ? ' opt-th-active' : ''}">Ctl</th>
      <th class="opt-th opt-th-num${sortColClass === 'comfort' ? ' opt-th-active' : ''}">Cmf</th>
      <th class="opt-th opt-th-num${sortColClass === 'feel' ? ' opt-th-active' : ''}">Fel</th>
      <th class="opt-th opt-th-num${sortColClass === 'durability' ? ' opt-th-active' : ''}">Dur</th>
      <th class="opt-th opt-th-num${sortColClass === 'playability' ? ' opt-th-active' : ''}">Ply</th>
      <th class="opt-th opt-th-actions"></th>
    </tr></thead><tbody>`;

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

  // Auto-select first frame
  if (RACQUETS.length > 0) {
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

  return RACQUETS.filter(r => {
    if (search && !r.name.toLowerCase().includes(search)) return false;
    if (brand && !r.name.startsWith(brand)) return false;
    if (pattern && r.pattern !== pattern) return false;
    if (stiffness === 'soft' && r.stiffness > 59) return false;
    if (stiffness === 'medium' && (r.stiffness < 60 || r.stiffness > 65)) return false;
    if (stiffness === 'stiff' && r.stiffness < 66) return false;
    if (headsize === '102' && r.headSize < 102) return false;
    if (headsize && headsize !== '102' && r.headSize !== parseInt(headsize)) return false;
    return true;
  });
}

function _compRenderRoster() {
  const list = document.getElementById('comp-frame-list');
  const racquets = _compGetFilteredRacquets();

  list.innerHTML = racquets.map(r => {
    const brand = _extractBrand(r.name);
    const isActive = r.id === _compSelectedRacquetId;
    return `<button class="comp-frame-item${isActive ? ' active' : ''}" data-id="${r.id}" onclick="_compSelectFrame('${r.id}')">
      <span class="comp-frame-name">${r.name}</span>
      <span class="comp-frame-meta">${r.year} &middot; ${r.identity || r.pattern}</span>
    </button>`;
  }).join('');
}

function _compSelectFrame(racquetId) {
  _compSelectedRacquetId = racquetId;
  const racquet = RACQUETS.find(r => r.id === racquetId);
  if (!racquet) return;

  // Highlight in roster
  document.querySelectorAll('.comp-frame-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === racquetId);
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

function _compRenderMain(racquet) {
  const main = document.getElementById('comp-main');
  const frameBase = calcFrameBase(racquet);
  const beamStr = Array.isArray(racquet.beamWidth) ? racquet.beamWidth.join('/') + 'mm' : racquet.beamWidth + 'mm';

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

  // Frame stat bars (skip durability and playability — always 50 for frame-only)
  const frameStatKeys = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability'];
  const frameStatLabels = { spin: 'Spin', power: 'Power', control: 'Control', launch: 'Launch', feel: 'Feel', comfort: 'Comfort', stability: 'Stability', forgiveness: 'Forgiveness', maneuverability: 'Maneuverability' };

  const barsHtml = frameStatKeys.map(k => {
    const val = frameBase[k] != null ? Math.round(frameBase[k]) : 50;
    const pct = Math.max(0, Math.min(100, val));
    return `<div class="comp-stat-row">
      <span class="comp-stat-label">${frameStatLabels[k]}</span>
      <div class="comp-stat-track"><div class="comp-stat-fill" style="width:${pct}%;opacity:${0.4 + pct * 0.006}"></div></div>
      <span class="comp-stat-val">${val}</span>
    </div>`;
  }).join('');

  // Sort tabs
  const sortOptions = [
    { key: 'score', label: 'OBS' },
    { key: 'spin', label: 'Spin' },
    { key: 'control', label: 'Control' },
    { key: 'power', label: 'Power' },
    { key: 'comfort', label: 'Comfort' },
    { key: 'durability', label: 'Durability' }
  ];
  const sortTabsHtml = sortOptions.map(s =>
    `<button class="comp-sort-tab${_compSortKey === s.key ? ' active' : ''}" onclick="_compSetSort('${s.key}')">${s.label}</button>`
  ).join('');

  // Build cards
  const cardsHtml = sorted.map((b, i) => _compRenderBuildCard(b, i, racquet)).join('');

  main.innerHTML = `
    <div class="comp-identity">
      <h2 class="comp-id-name">${racquet.name}</h2>
      <div class="comp-id-meta">${racquet.year} &middot; <span class="comp-id-identity">${racquet.identity || ''}</span></div>
      <div class="comp-specs-grid">
        <div class="comp-spec"><span class="comp-spec-label">Weight</span><span class="comp-spec-val">${racquet.strungWeight}g</span></div>
        <div class="comp-spec"><span class="comp-spec-label">Swingweight</span><span class="comp-spec-val">${racquet.swingweight}</span></div>
        <div class="comp-spec"><span class="comp-spec-label">Stiffness</span><span class="comp-spec-val">${racquet.stiffness} RA</span></div>
        <div class="comp-spec"><span class="comp-spec-label">Pattern</span><span class="comp-spec-val">${racquet.pattern}</span></div>
        <div class="comp-spec"><span class="comp-spec-label">Balance</span><span class="comp-spec-val">${racquet.balancePts}</span></div>
        <div class="comp-spec"><span class="comp-spec-label">Beam</span><span class="comp-spec-val">${beamStr}</span></div>
        <div class="comp-spec"><span class="comp-spec-label">Head Size</span><span class="comp-spec-val">${racquet.headSize} sq in</span></div>
        <div class="comp-spec"><span class="comp-spec-label">Tension Range</span><span class="comp-spec-val">${racquet.tensionRange[0]}&ndash;${racquet.tensionRange[1]} lbs</span></div>
      </div>
      ${racquet.notes ? `<p class="comp-id-notes">${racquet.notes}</p>` : ''}
    </div>

    <div class="comp-section">
      <h3 class="comp-section-title">Base frame profile</h3>
      <p class="comp-section-sub">Frame-only characteristics before string influence</p>
      <div class="comp-stat-bars">${barsHtml}</div>
    </div>

    <div class="comp-section">
      <div class="comp-builds-header">
        <h3 class="comp-section-title">Top builds</h3>
        <div class="comp-sort-tabs">${sortTabsHtml}</div>
      </div>
      <div class="comp-build-grid">${cardsHtml}</div>
    </div>
  `;
}

function _compGenerateTopBuilds(racquet, count) {
  const halfCount = Math.ceil(count / 2);
  const midT = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);

  // --- Full bed candidates ---
  const fullBuilds = [];
  STRINGS.forEach(s => {
    [racquet.tensionRange[0], midT, racquet.tensionRange[1]].forEach(t => {
      const cfg = { isHybrid: false, string: s, mainsTension: t, crossesTension: t };
      const stats = predictSetup(racquet, cfg);
      if (!stats) return;
      const tCtx = buildTensionContext(cfg, racquet);
      const score = computeCompositeScore(stats, tCtx);
      fullBuilds.push({ type: 'full', string: s, tension: t, crossesTension: t, stats, score, cfg });
    });
  });
  fullBuilds.sort((a, b) => b.score - a.score);
  const seenFull = new Map();
  const uniqueFull = [];
  for (const b of fullBuilds) {
    if (!seenFull.has(b.string.id)) {
      seenFull.set(b.string.id, true);
      uniqueFull.push(b);
    }
    if (uniqueFull.length >= halfCount * 3) break;
  }

  // --- Hybrid candidates ---
  const hybridBuilds = [];
  const topMainsIds = [...seenFull.keys()].slice(0, 8);
  const crossCandidates = STRINGS.filter(s => 
    s.material === 'Polyester' || s.material === 'Co-Polyester (elastic)' || s.material === 'Multifilament' || s.material === 'Natural Gut'
  ).slice(0, 15);
  topMainsIds.forEach(mId => {
    const mains = STRINGS.find(s => s.id === mId);
    if (!mains) return;
    crossCandidates.forEach(cross => {
      if (cross.id === mains.id) return;
      const cfg = { isHybrid: true, mains, crosses: cross, mainsTension: midT, crossesTension: midT - 2 };
      const stats = predictSetup(racquet, cfg);
      if (!stats) return;
      const tCtx = buildTensionContext(cfg, racquet);
      const score = computeCompositeScore(stats, tCtx);
      hybridBuilds.push({
        type: 'hybrid', string: mains, mains, crosses: cross,
        label: mains.name + ' / ' + cross.name,
        tension: midT, crossesTension: midT - 2,
        stats, score, cfg,
        mainsId: mains.id, crossesId: cross.id
      });
    });
  });
  hybridBuilds.sort((a, b) => b.score - a.score);
  const seenHybrid = new Map();
  const uniqueHybrid = [];
  for (const b of hybridBuilds) {
    const key = b.mainsId + '|' + b.crossesId;
    if (!seenHybrid.has(key)) {
      seenHybrid.set(key, true);
      uniqueHybrid.push(b);
    }
    if (uniqueHybrid.length >= halfCount * 3) break;
  }

  // Pick diverse from each pool
  const topFull = _compPickDiverseBuilds(uniqueFull, halfCount);
  const topHybrid = _compPickDiverseBuilds(uniqueHybrid, count - halfCount);
  return [...topFull, ...topHybrid];
}

function _compPickDiverseBuilds(builds, count) {
  builds.forEach(b => {
    const s = b.stats;
    if (s.spin >= 72 && s.spin >= s.control && s.spin >= s.power) b.archetype = 'Spin Focus';
    else if (s.control >= 72 && s.control >= s.spin) b.archetype = 'Control Focus';
    else if (s.power >= 65 && s.power >= s.control) b.archetype = 'Power Focus';
    else if (s.comfort >= 68) b.archetype = 'Comfort Build';
    else if (s.feel >= 70) b.archetype = 'Feel Build';
    else if (s.durability >= 75) b.archetype = 'Durability Build';
    else b.archetype = 'Balanced';
  });

  const result = [];
  const archetypesSeen = new Set();
  for (const b of builds) {
    if (!archetypesSeen.has(b.archetype) && result.length < count) {
      archetypesSeen.add(b.archetype);
      result.push(b);
    }
  }
  for (const b of builds) {
    if (result.length >= count) break;
    if (!result.includes(b)) result.push(b);
  }
  return result.slice(0, count);
}

const _compArchetypeColors = {
  'Spin Focus': 'var(--fn)',
  'Control Focus': 'var(--blue-tag)',
  'Power Focus': 'var(--orange)',
  'Comfort Build': 'var(--green-tag)',
  'Feel Build': 'var(--purple)',
  'Durability Build': 'var(--amber-tag)',
  'Balanced': 'var(--text-muted)'
};

function _compRenderBuildCard(build, index, racquet) {
  const s = build.stats;
  const obsStyle = getObsBadgeStyle(build.score);
  const borderColor = _compArchetypeColors[build.archetype] || 'var(--text-muted)';
  const isHybrid = build.type === 'hybrid';
  const stringLabel = isHybrid ? (build.label || build.string.name) : build.string.name;
  const metaLabel = isHybrid ? `Hybrid · M:${build.tension} / X:${build.crossesTension}` : `Full Bed · ${build.tension} lbs`;

  // Top 3 differentiated stats for inline display
  const statEntries = [
    { key: 'spin', label: 'Spin', val: Math.round(s.spin) },
    { key: 'power', label: 'Pwr', val: Math.round(s.power) },
    { key: 'control', label: 'Ctrl', val: Math.round(s.control) },
    { key: 'comfort', label: 'Cmf', val: Math.round(s.comfort) },
    { key: 'feel', label: 'Feel', val: Math.round(s.feel) },
    { key: 'durability', label: 'Dur', val: Math.round(s.durability) }
  ].sort((a, b) => b.val - a.val);
  const topStats = statEntries.slice(0, 3);
  const statsInline = topStats.map(st =>
    `<span class="comp-card-stat-chip">${st.label} <b>${st.val}</b></span>`
  ).join('');

  return `<div class="comp-build-card" style="border-left-color:${borderColor}">
    <div class="comp-card-top">
      <span class="comp-card-archetype">${build.archetype}</span>
      <span class="comp-card-obs" style="${obsStyle}">${build.score.toFixed(1)}</span>
    </div>
    <div class="comp-card-string">${stringLabel}</div>
    <div class="comp-card-meta">${metaLabel}</div>
    <div class="comp-card-actions">
      <button class="comp-card-btn comp-card-btn-primary" onclick="_compAction('setActive',${index})">Set Active</button>
      <button class="comp-card-btn" onclick="_compAction('tune',${index})">Tune</button>
      <button class="comp-card-btn" onclick="_compAction('save',${index},event)">Save</button>
    </div>
    <div class="comp-card-stats-inline">${statsInline}</div>
  </div>`;
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
    'Durability Build': 'var(--text-muted)',
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
        <div class="fmb-frame-name">${r.name}</div>
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

function _initQaSearchable(searchId, hiddenId, dropdownId, items) {
  const searchEl = document.getElementById(searchId);
  const hiddenEl = document.getElementById(hiddenId);
  const dropdownEl = document.getElementById(dropdownId);
  if (!searchEl || !hiddenEl || !dropdownEl) return;

  function renderDropdown(filter) {
    const filtered = filter ? items.filter(function(item) {
      return item.label.toLowerCase().indexOf(filter.toLowerCase()) >= 0;
    }) : items;

    if (filtered.length === 0) {
      dropdownEl.innerHTML = '<div class="dock-qa-dd-empty">No results</div>';
    } else {
      dropdownEl.innerHTML = filtered.slice(0, 20).map(function(item) {
        return '<div class="dock-qa-dd-item" data-id="' + item.id + '">' + item.label + '</div>';
      }).join('');
    }
    dropdownEl.classList.remove('hidden');

    dropdownEl.querySelectorAll('.dock-qa-dd-item').forEach(function(el) {
      el.addEventListener('mousedown', function(e) {
        e.preventDefault();
        hiddenEl.value = el.dataset.id;
        searchEl.value = el.textContent;
        dropdownEl.classList.add('hidden');
      });
    });
  }

  searchEl.addEventListener('focus', function() { renderDropdown(searchEl.value); });
  searchEl.addEventListener('input', function() {
    hiddenEl.value = '';
    renderDropdown(searchEl.value);
  });
  searchEl.addEventListener('blur', function() {
    setTimeout(function() { dropdownEl.classList.add('hidden'); }, 150);
  });
}

function renderDockCreateSection() {
  var container = document.getElementById('dock-create-area');
  var editorSection = document.getElementById('dock-editor-section');
  if (!container) return;

  if (!activeLoadout && !_cfCreatingNew) {
    // Mode A: No loadout — show creation form
    container.innerHTML = _renderCreateForm('Create Loadout', false);
    _wireCreateForm(container);
    if (editorSection) editorSection.style.display = 'none';
  } else if (activeLoadout && !_cfCreatingNew) {
    // Mode B: Has active loadout — show Create New button, show editor
    container.innerHTML =
      '<div class="dock-create-new-wrap">' +
        '<button class="dock-create-new-btn" onclick="_showNewLoadoutForm()">' +
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>' +
          ' Create New Loadout' +
        '</button>' +
      '</div>';
    if (editorSection) editorSection.style.display = '';
  } else if (_cfCreatingNew) {
    // Mode C: Creating new while active exists — show form with Cancel
    container.innerHTML = _renderCreateForm('New Loadout', true);
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
  var form = btn.closest('.dock-cf-form');
  if (!form) return;
  var isHybrid = btn.dataset.cfMode === 'hybrid';
  var body = form.querySelector('.dock-cf-body');
  if (body) body.dataset.cfHybrid = isHybrid ? 'true' : 'false';

  // Toggle sections
  var fullSection = form.querySelector('.dock-cf-fullbed');
  var hybridSection = form.querySelector('.dock-cf-hybrid');
  if (fullSection) fullSection.classList.toggle('hidden', isHybrid);
  if (hybridSection) hybridSection.classList.toggle('hidden', !isHybrid);

  // Toggle active button
  form.querySelectorAll('.dock-cf-toggle-btn').forEach(function(b) {
    b.classList.toggle('active', b === btn);
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

  var body = form.querySelector('.dock-cf-body');
  var isHybrid = body && body.dataset.cfHybrid === 'true';

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
  if (!lo) return;

  _cfCreatingNew = false;
  activateLoadout(lo);

  if (isFirstLoadout) {
    saveLoadout(lo); // QA-014: auto-save first loadout so it isn't lost
    switchMode('tune');
  } else if (currentMode === 'overview') {
    renderDashboard();
  }
}

function _cfSave() {
  var lo = _cfBuildLoadout();
  if (!lo) return;

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

document.addEventListener('DOMContentLoaded', () => {
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
});
