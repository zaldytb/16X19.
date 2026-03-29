// @ts-nocheck

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT         = path.resolve(__dirname, '../..');
const STRINGS_FILE = path.join(ROOT, 'pipeline', 'data', 'strings.json');

// ─── Material type normalization ──────────────────────────────────────────────

const MAT_MAP = {
  'Polyester':               'Poly',
  'Co-Polyester (elastic)':  'CoPoly',
  'Multifilament':           'Multi',
  'Natural Gut':             'Gut',
  'Synthetic Gut':           'SynGut'
};

// ─── Shape classification ─────────────────────────────────────────────────────
// Returns 'textured' | 'shaped' | 'round'

function classifyShape(shape) {
  if (!shape) return 'round';
  const s = shape.toLowerCase();
  // Textured/rough takes priority (many shaped strings also have texture)
  if (s.includes('textured') || s.includes('rough') || s.includes('abrasive')) return 'textured';
  // Round strings that start with 'round' (may have modifiers like 'braided', 'coated', 'slick')
  if (s.startsWith('round')) return 'round';
  // Everything else: pentagon, hex, square, star, octagon, spiral, heptagonal, decagonal, rectangular, etc.
  return 'shaped';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val, min, max) {
  return Math.round(Math.max(min, Math.min(max, val)));
}

function getMat(material) {
  return MAT_MAP[material] || 'Poly';
}

// ─── twScore estimation ───────────────────────────────────────────────────────
// Formulas per spec. Inputs: material, stiffness (lb/in), tensionLoss (%),
// spinPotential, shape (string), gaugeNum (mm).
// Returns: { power, spin, comfort, control, feel, playabilityDuration, durability }

function estimateTwScore({ material, stiffness, tensionLoss, spinPotential, shape, gaugeNum }) {
  const mat        = getMat(material);
  const shapeClass = classifyShape(shape);

  // power: OLS-fitted against 52 strings (MAE 4.0)
  // base: 75.0 + stiffness × -0.106  (Poly baseline)
  // material offsets vs Poly: CoPoly +20, Multi +29, Gut +23, SynGut +14
  const POWER_MOD = { Poly: 0, CoPoly: 20, Multi: 29, Gut: 23, SynGut: 14 };
  const power = clamp(
    75.0 + stiffness * -0.106 + (POWER_MOD[mat] ?? 0),
    30, 95
  );

  // spin: spinPotential * 10.5 + shapeMod   clamp [30, 98]
  const spinShapeMod = shapeClass === 'textured' ? 3 : shapeClass === 'shaped' ? 2 : 0;
  const spin = clamp(spinPotential * 10.5 + spinShapeMod, 30, 98);

  // comfort: 95 - (stiffness - 100) * 0.22 + materialMod   clamp [25, 98]
  const COMFORT_MOD = { Gut: 8, Multi: 5, SynGut: 2, CoPoly: 0, Poly: -2 };
  const comfort = clamp(
    95 - (stiffness - 100) * 0.22 + (COMFORT_MOD[mat] ?? 0),
    25, 98
  );

  // control: OLS-fitted against 52 strings (MAE 2.7)
  // base: 74.2 + stiffness × 0.076 + tensionLoss × -0.130  (Poly baseline)
  // material offsets vs Poly: CoPoly -17, Multi -20, Gut -18, SynGut -16
  const CONTROL_MOD = { Poly: 0, CoPoly: -17, Multi: -20, Gut: -18, SynGut: -16 };
  const control = clamp(
    74.2 + stiffness * 0.076 + tensionLoss * -0.130 + (CONTROL_MOD[mat] ?? 0),
    30, 98
  );

  // feel: 85 - (stiffness - 120) * 0.15 + materialMod + shapeMod   clamp [30, 98]
  const FEEL_MOD = { Gut: 10, Multi: 3, CoPoly: 0, Poly: -2, SynGut: 0 };
  const feelShapeMod = shapeClass === 'round' ? 2 : -1;
  const feel = clamp(
    85 - (stiffness - 120) * 0.15 + (FEEL_MOD[mat] ?? 0) + feelShapeMod,
    30, 98
  );

  // playabilityDuration: OLS-fitted against 52 strings (MAE 4.1)
  // base: 102.7 + tensionLoss × -0.835  (Poly baseline)
  // material offsets vs Poly: CoPoly -4, Multi -6, Gut +1, SynGut -14
  const PLAYD_MOD = { Poly: 0, CoPoly: -4, Multi: -6, Gut: 1, SynGut: -14 };
  const playabilityDuration = clamp(
    102.7 + tensionLoss * -0.835 + (PLAYD_MOD[mat] ?? 0),
    30, 98
  );

  // durability: materialBase + gaugeModifier   clamp [20, 98]
  // Gauge: per 0.05mm above 1.25 → +3, per 0.05mm below 1.25 → -4
  const DUR_BASE = { Poly: 82, CoPoly: 72, SynGut: 58, Multi: 50, Gut: 35 };
  let durability = DUR_BASE[mat] ?? 72;
  if (gaugeNum !== undefined && gaugeNum !== null) {
    const delta = gaugeNum - 1.25;
    if (delta > 0) {
      durability += Math.round((delta / 0.05) * 3);
    } else if (delta < 0) {
      durability += Math.round((delta / 0.05) * 4); // delta negative → result negative
    }
  }
  durability = clamp(durability, 20, 98);

  return { power, spin, comfort, control, feel, playabilityDuration, durability };
}

// ─── Physical property estimation ────────────────────────────────────────────
// Used when a new string entry is missing one or more physical inputs.
// Returns an object with only the fields that needed estimation,
// plus _<field>Confidence keys set to 'low'.

function estimatePhysical({ material, shape, stiffness, tensionLoss, spinPotential }) {
  const mat    = getMat(material);
  const result = {};

  if (stiffness == null) {
    const MEAN = { Poly: 210, CoPoly: 185, Multi: 165, Gut: 110, SynGut: 175 };
    result.stiffness = MEAN[mat] ?? 200;
    result._stiffnessConfidence = 'low';
  }

  if (tensionLoss == null) {
    const MEAN = { Poly: 33, CoPoly: 28, Multi: 20, Gut: 12, SynGut: 23 };
    result.tensionLoss = MEAN[mat] ?? 30;
    result._tensionLossConfidence = 'low';
  }

  if (spinPotential == null) {
    const shapeClass = classifyShape(shape);
    const BASE = { textured: 6.5, shaped: 7.0, round: 5.0 };
    let sp = BASE[shapeClass] ?? 5.0;
    if (mat === 'Poly')   sp += 0.5;
    if (mat === 'CoPoly') sp += 0.3;
    result.spinPotential = sp;
    result._spinPotentialConfidence = 'low';
  }

  return result;
}

// ─── Accuracy calibration ─────────────────────────────────────────────────────

function runAccuracyTest() {
  const strings = JSON.parse(fs.readFileSync(STRINGS_FILE, 'utf8'));
  const FIELDS  = ['power', 'spin', 'comfort', 'control', 'feel', 'playabilityDuration', 'durability'];
  const errors  = {};
  FIELDS.forEach(f => { errors[f] = []; });

  for (const s of strings) {
    if (!s.twScore || !s.material || s.stiffness == null || s.tensionLoss == null || s.spinPotential == null) continue;
    const est = estimateTwScore({
      material:       s.material,
      stiffness:      s.stiffness,
      tensionLoss:    s.tensionLoss,
      spinPotential:  s.spinPotential,
      shape:          s.shape,
      gaugeNum:       s.gaugeNum
    });
    for (const f of FIELDS) {
      if (s.twScore[f] !== undefined) {
        errors[f].push(Math.abs(est[f] - s.twScore[f]));
      }
    }
  }

  console.log(`\nEstimation accuracy vs ${strings.length} existing strings:`);
  console.log(`${'Field'.padEnd(24)} ${'N'.padStart(3)} ${'Mean Abs Error'.padStart(16)}   Status`);
  console.log('─'.repeat(62));

  let anyHigh = false;
  for (const f of FIELDS) {
    const errs = errors[f];
    const mean = errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : 0;
    const high = mean > 12;
    if (high) anyHigh = true;
    const status = high ? 'EXCEEDS THRESHOLD (>12)' : 'OK';
    console.log(`  ${f.padEnd(22)} ${String(errs.length).padStart(3)} ${mean.toFixed(1).padStart(16)}   ${status}`);
  }

  console.log('');
  if (anyHigh) {
    console.log('ONE OR MORE sub-fields exceed the 12-point threshold.');
    console.log('Formulas need tuning before ingest.js can be built.');
  } else {
    console.log('All sub-fields within acceptable error range (< 12 points).');
  }
  return anyHigh;
}

// ─── --check: list strings with estimated fields ──────────────────────────────

function runCheck() {
  const strings     = JSON.parse(fs.readFileSync(STRINGS_FILE, 'utf8'));
  const withEst     = strings.filter(s =>
    s._provenance && Array.isArray(s._provenance.estimatedFields) && s._provenance.estimatedFields.length > 0
  );
  if (withEst.length === 0) {
    console.log('No strings have estimated fields.');
    return;
  }
  console.log(`${withEst.length} string(s) with estimated fields:`);
  for (const s of withEst) {
    console.log(`  ${s.id}: [${s._provenance.estimatedFields.join(', ')}]  confidence=${s._provenance.confidence}`);
  }
}

// ─── --fill <id> [--dry-run] ──────────────────────────────────────────────────

function runFill(id, dryRun) {
  const strings = JSON.parse(fs.readFileSync(STRINGS_FILE, 'utf8'));
  const idx     = strings.findIndex(s => s.id === id);
  if (idx === -1) {
    console.error(`String not found: ${id}`);
    process.exit(1);
  }
  const entry = strings[idx];

  // Estimate any missing physical props first
  const physEst = estimatePhysical({
    material:      entry.material,
    shape:         entry.shape,
    stiffness:     entry.stiffness,
    tensionLoss:   entry.tensionLoss,
    spinPotential: entry.spinPotential
  });

  const effectivePhys = {
    stiffness:     entry.stiffness     ?? physEst.stiffness,
    tensionLoss:   entry.tensionLoss   ?? physEst.tensionLoss,
    spinPotential: entry.spinPotential ?? physEst.spinPotential
  };

  const est = estimateTwScore({
    material:     entry.material,
    shape:        entry.shape,
    gaugeNum:     entry.gaugeNum,
    ...effectivePhys
  });

  const FIELDS           = ['power', 'spin', 'comfort', 'control', 'feel', 'playabilityDuration', 'durability'];
  const estimatedFields  = [];
  const twScore          = { ...(entry.twScore || {}) };

  for (const f of FIELDS) {
    if (twScore[f] == null) {
      twScore[f] = est[f];
      estimatedFields.push(`twScore.${f}`);
    }
  }

  // Also record any physical props that were estimated
  const physEstFields = Object.keys(physEst).filter(k => !k.endsWith('Confidence'));
  estimatedFields.push(...physEstFields);

  if (dryRun) {
    console.log(`\n[dry-run] Estimated fields for "${id}":`);
    for (const f of estimatedFields) {
      if (f.startsWith('twScore.')) {
        const key = f.replace('twScore.', '');
        const actual = entry.twScore?.[key];
        const diff   = actual !== undefined ? ` (actual: ${actual}, diff: ${Math.abs(est[key] - actual)})` : '';
        console.log(`  ${f}: ${est[key]}${diff}`);
      } else {
        console.log(`  ${f}: ${effectivePhys[f] ?? physEst[f]}`);
      }
    }
    return;
  }

  if (estimatedFields.length === 0) {
    console.log(`Nothing to fill for "${id}" — all twScore fields already present.`);
    return;
  }

  // Merge lowest confidence
  const physConfs  = Object.keys(physEst).filter(k => k.endsWith('Confidence')).map(k => physEst[k]);
  const newConf    = physConfs.includes('low') ? 'low' : 'estimated';

  entry.twScore    = twScore;
  entry._provenance = {
    ...(entry._provenance || {}),
    estimatedFields: [...new Set([...(entry._provenance?.estimatedFields || []), ...estimatedFields])],
    confidence:      newConf
  };
  strings[idx] = entry;

  fs.writeFileSync(STRINGS_FILE, JSON.stringify(strings, null, 2));
  console.log(`Filled ${estimatedFields.length} field(s) for "${id}": ${estimatedFields.join(', ')}`);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--check')) {
    runCheck();
  } else if (args.includes('--fill')) {
    const fillIdx = args.indexOf('--fill');
    const id      = args[fillIdx + 1];
    if (!id) { console.error('Usage: estimate.js --fill <string-id> [--dry-run]'); process.exit(1); }
    runFill(id, args.includes('--dry-run'));
  } else {
    // Default: accuracy calibration test
    runAccuracyTest();
  }
}

if (require.main === module) {
  main();
}

module.exports = { estimateTwScore, estimatePhysical, classifyShape };
