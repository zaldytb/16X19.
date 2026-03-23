#!/usr/bin/env node
/**
 * pipeline/scripts/validate.js
 *
 * Validates pipeline/data/frames.json and pipeline/data/strings.json against
 * the schemas in pipeline/schemas/, checking:
 *   - Required fields + types
 *   - Numeric range checks (_validationRanges in each schema)
 *   - _meta fields on every frame (merged from FRAME_META by extract.js)
 *   - Duplicate IDs
 *   - Cross-checks (e.g. tensionRange lo < hi)
 *
 * Usage:  node pipeline/scripts/validate.js
 *         node pipeline/scripts/validate.js --strict   (exit 1 on warnings too)
 *
 * Exit codes:  0 = pass (warnings OK unless --strict),  1 = errors found
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const STRICT   = process.argv.includes('--strict');
const DATA_DIR = path.join(__dirname, '..', 'data');
const SCH_DIR  = path.join(__dirname, '..', 'schemas');

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

const frames  = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'frames.json')));
const strings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'strings.json')));

const frameSch  = JSON.parse(fs.readFileSync(path.join(SCH_DIR, 'frame.schema.json')));
const stringSch = JSON.parse(fs.readFileSync(path.join(SCH_DIR, 'string.schema.json')));

// ---------------------------------------------------------------------------
// Issue collector
// ---------------------------------------------------------------------------

const issues = { errors: [], warnings: [] };

function error(ctx, msg)   { issues.errors.push(`  [ERROR] ${ctx}: ${msg}`); }
function warn(ctx, msg)    { issues.warnings.push(`  [WARN]  ${ctx}: ${msg}`); }

// ---------------------------------------------------------------------------
// Generic type / range checkers
// ---------------------------------------------------------------------------

function checkType(val, expected, field, ctx) {
  if (val === undefined || val === null) return; // caught by checkRequired
  const actual = Array.isArray(val) ? 'array' : typeof val;
  if (actual !== expected) {
    error(ctx, `'${field}' expected ${expected}, got ${actual}`);
  }
}

function checkRequired(item, schema, ctx) {
  for (const f of (schema.required || [])) {
    if (item[f] === undefined || item[f] === null) {
      error(ctx, `missing required field '${f}'`);
    }
  }
}

/**
 * rangeSpec: { warn: [lo, hi], error: [lo, hi] }
 * - outside error range → ERROR
 * - outside warn range but inside error range → WARN
 */
function checkRange(val, rangeSpec, field, ctx) {
  if (typeof val !== 'number') return;
  const [eLo, eHi] = rangeSpec.error || [-Infinity, Infinity];
  const [wLo, wHi] = rangeSpec.warn  || [-Infinity, Infinity];
  if (val < eLo || val > eHi) {
    error(ctx, `'${field}' = ${val} outside hard range [${eLo}, ${eHi}]`);
  } else if (val < wLo || val > wHi) {
    warn(ctx, `'${field}' = ${val} outside expected range [${wLo}, ${wHi}]`);
  }
}

// ---------------------------------------------------------------------------
// Frame validation
// ---------------------------------------------------------------------------

function validateFrame(frame, idx) {
  const ctx = `frames[${idx}] ${frame.id || '?'}`;

  checkRequired(frame, frameSch, ctx);

  checkType(frame.id,           'string', 'id',           ctx);
  checkType(frame.name,         'string', 'name',         ctx);
  checkType(frame.year,         'number', 'year',         ctx);
  checkType(frame.headSize,     'number', 'headSize',     ctx);
  checkType(frame.strungWeight, 'number', 'strungWeight', ctx);
  checkType(frame.swingweight,  'number', 'swingweight',  ctx);
  checkType(frame.stiffness,    'number', 'stiffness',    ctx);
  checkType(frame.pattern,      'string', 'pattern',      ctx);
  checkType(frame.balance,      'number', 'balance',      ctx);
  checkType(frame.beamWidth,    'array',  'beamWidth',    ctx);
  checkType(frame.tensionRange, 'array',  'tensionRange', ctx);

  if (frame.id && !/^[a-z0-9-]+$/.test(frame.id)) {
    error(ctx, `id '${frame.id}' is not kebab-case`);
  }
  if (frame.pattern && !/^\d+x\d+$/.test(frame.pattern)) {
    error(ctx, `pattern '${frame.pattern}' must match \\d+x\\d+`);
  }

  // beamWidth elements
  if (Array.isArray(frame.beamWidth)) {
    if (frame.beamWidth.length < 1) error(ctx, `beamWidth must have ≥1 element`);
    frame.beamWidth.forEach((bw, i) => {
      if (typeof bw !== 'number') {
        error(ctx, `beamWidth[${i}] is not a number`);
      } else {
        checkRange(bw, frameSch._validationRanges.beamWidth_element, `beamWidth[${i}]`, ctx);
      }
    });
  }

  // tensionRange
  if (Array.isArray(frame.tensionRange) && frame.tensionRange.length === 2) {
    const [lo, hi] = frame.tensionRange;
    if (typeof lo !== 'number' || typeof hi !== 'number') {
      error(ctx, `tensionRange elements must be numbers`);
    } else if (lo >= hi) {
      error(ctx, `tensionRange[0]=${lo} must be < tensionRange[1]=${hi}`);
    } else if (lo < 30 || hi > 75) {
      warn(ctx, `tensionRange [${lo}, ${hi}] outside typical lbs range [30, 75]`);
    }
  } else if (frame.tensionRange !== undefined) {
    error(ctx, `tensionRange must be a 2-element array`);
  }

  // Numeric range checks
  const vr = frameSch._validationRanges;
  checkRange(frame.stiffness,    vr.stiffness,    'stiffness',    ctx);
  checkRange(frame.swingweight,  vr.swingweight,  'swingweight',  ctx);
  checkRange(frame.strungWeight, vr.strungWeight, 'strungWeight', ctx);
  checkRange(frame.headSize,     vr.headSize,     'headSize',     ctx);

  if (frame.year && (frame.year < 1990 || frame.year > 2030)) {
    warn(ctx, `year ${frame.year} outside expected [1990, 2030]`);
  }
  if (frame.balance && (frame.balance < 25 || frame.balance > 42)) {
    warn(ctx, `balance ${frame.balance}cm is unusual`);
  }

  // _meta field (injected by extract.js from FRAME_META)
  if (!frame._meta || typeof frame._meta !== 'object') {
    error(ctx, `missing _meta field (should be injected by extract.js)`);
  } else {
    for (const f of ['aeroBonus', 'comfortTech', 'spinTech', 'genBonus']) {
      if (frame._meta[f] === undefined) {
        error(ctx, `_meta.${f} is missing`);
      } else if (typeof frame._meta[f] !== 'number') {
        error(ctx, `_meta.${f} must be a number`);
      } else if (frame._meta[f] < 0 || frame._meta[f] > 5) {
        warn(ctx, `_meta.${f} = ${frame._meta[f]} outside expected [0, 5]`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// String validation
// ---------------------------------------------------------------------------

const VALID_MATERIALS = [
  'Polyester', 'Co-Polyester (elastic)', 'Multifilament', 'Natural Gut', 'Synthetic Gut',
];
const TW_FIELDS = ['power', 'spin', 'comfort', 'control', 'feel', 'playabilityDuration', 'durability'];

function validateString(str, idx) {
  const ctx = `strings[${idx}] ${str.id || '?'}`;

  checkRequired(str, stringSch, ctx);

  checkType(str.id,            'string', 'id',            ctx);
  checkType(str.name,          'string', 'name',          ctx);
  checkType(str.gauge,         'string', 'gauge',         ctx);
  checkType(str.gaugeNum,      'number', 'gaugeNum',      ctx);
  checkType(str.material,      'string', 'material',      ctx);
  checkType(str.stiffness,     'number', 'stiffness',     ctx);
  checkType(str.tensionLoss,   'number', 'tensionLoss',   ctx);
  checkType(str.spinPotential, 'number', 'spinPotential', ctx);
  checkType(str.twScore,       'object', 'twScore',       ctx);

  if (str.id && !/^[a-z0-9-]+$/.test(str.id)) {
    error(ctx, `id '${str.id}' is not kebab-case`);
  }
  if (str.material && !VALID_MATERIALS.includes(str.material)) {
    error(ctx, `material '${str.material}' is not in the allowed enum`);
  }
  if (str.gaugeNum && (str.gaugeNum < 1.0 || str.gaugeNum > 1.6)) {
    warn(ctx, `gaugeNum ${str.gaugeNum}mm outside typical [1.0, 1.6]`);
  }

  if (str.twScore && typeof str.twScore === 'object') {
    for (const f of TW_FIELDS) {
      if (str.twScore[f] === undefined || str.twScore[f] === null) {
        error(ctx, `twScore.${f} is missing`);
      } else if (typeof str.twScore[f] !== 'number') {
        error(ctx, `twScore.${f} must be a number`);
      } else {
        checkRange(str.twScore[f], stringSch._validationRanges.twScore_field, `twScore.${f}`, ctx);
      }
    }
  }

  const vr = stringSch._validationRanges;
  checkRange(str.stiffness,     vr.stiffness,     'stiffness',     ctx);
  checkRange(str.tensionLoss,   vr.tensionLoss,   'tensionLoss',   ctx);
  checkRange(str.spinPotential, vr.spinPotential, 'spinPotential', ctx);
}

// ---------------------------------------------------------------------------
// Duplicate ID check
// ---------------------------------------------------------------------------

function checkDuplicates(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (!item.id) continue;
    if (seen.has(item.id)) error('duplicates', `${label} duplicate id '${item.id}'`);
    seen.add(item.id);
  }
}

// ---------------------------------------------------------------------------
// Run all checks
// ---------------------------------------------------------------------------

console.log(`[validate] Validating ${frames.length} frames …`);
frames.forEach(validateFrame);

console.log(`[validate] Validating ${strings.length} strings …`);
strings.forEach(validateString);

console.log(`[validate] Checking for duplicate IDs …`);
checkDuplicates(frames,  'frame');
checkDuplicates(strings, 'string');

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const totalIssues = issues.errors.length + issues.warnings.length;

console.log('');
console.log('='.repeat(60));
console.log('VALIDATION REPORT');
console.log(`  frames.json:  ${frames.length} frames`);
console.log(`  strings.json: ${strings.length} strings`);
console.log('='.repeat(60));

if (issues.warnings.length) {
  console.log(`\nWARNINGS (${issues.warnings.length}):`);
  issues.warnings.forEach(w => console.log(w));
}
if (issues.errors.length) {
  console.log(`\nERRORS (${issues.errors.length}):`);
  issues.errors.forEach(e => console.log(e));
}

if (totalIssues === 0) {
  console.log('\n  All checks passed.');
} else {
  console.log(`\n  Total: ${issues.errors.length} error(s), ${issues.warnings.length} warning(s)`);
}

console.log('='.repeat(60));

process.exit((issues.errors.length > 0 || (STRICT && issues.warnings.length > 0)) ? 1 : 0);
