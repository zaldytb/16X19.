'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname, '../..');
const DATA_DIR   = path.join(ROOT, 'pipeline', 'data');
const SCHEMA_DIR = path.join(ROOT, 'pipeline', 'schemas');

// Check a single numeric value against a range spec.
function checkRange(field, value, rangeSpec) {
  const issues = [];
  if (typeof value !== 'number') return issues;
  if (rangeSpec.error && (value < rangeSpec.error[0] || value > rangeSpec.error[1])) {
    issues.push({ level: 'ERROR', field, value, msg: `${value} outside error range [${rangeSpec.error}]` });
  } else if (rangeSpec.warn && (value < rangeSpec.warn[0] || value > rangeSpec.warn[1])) {
    issues.push({ level: 'WARN',  field, value, msg: `${value} outside warn range [${rangeSpec.warn}]` });
  }
  return issues;
}

function validateEntry(entry, schema) {
  const issues = [];
  const props  = schema.properties || {};
  const ranges = schema._validationRanges || {};

  // 1. Required fields
  for (const field of (schema.required || [])) {
    if (entry[field] === undefined || entry[field] === null) {
      issues.push({ level: 'ERROR', field, msg: 'required field missing' });
    }
  }

  // 2. Type checks for declared properties
  for (const [field, propSchema] of Object.entries(props)) {
    if (entry[field] === undefined) continue;
    const val = entry[field];
    if (propSchema.type === 'number'  && typeof val !== 'number')  issues.push({ level: 'ERROR', field, msg: `expected number, got ${typeof val}` });
    if (propSchema.type === 'string'  && typeof val !== 'string')  issues.push({ level: 'ERROR', field, msg: `expected string, got ${typeof val}` });
    if (propSchema.type === 'integer' && !Number.isInteger(val))   issues.push({ level: 'ERROR', field, msg: `expected integer, got ${val}` });
    if (propSchema.type === 'array'   && !Array.isArray(val))      issues.push({ level: 'ERROR', field, msg: `expected array, got ${typeof val}` });
  }

  // 3. Validation ranges
  for (const [rangeKey, rangeSpec] of Object.entries(ranges)) {
    if (rangeKey === '_comment') continue;

    if (rangeKey.endsWith('_element')) {
      // Array: check each element (e.g. beamWidth_element → beamWidth array)
      const field = rangeKey.replace('_element', '');
      if (Array.isArray(entry[field])) {
        entry[field].forEach((v, idx) => {
          issues.push(...checkRange(`${field}[${idx}]`, v, rangeSpec));
        });
      }
    } else if (rangeKey.endsWith('_field')) {
      // Object sub-fields (e.g. twScore_field → every value inside twScore)
      const field = rangeKey.replace('_field', '');
      if (entry[field] && typeof entry[field] === 'object') {
        for (const [k, v] of Object.entries(entry[field])) {
          issues.push(...checkRange(`${field}.${k}`, v, rangeSpec));
        }
      }
    } else {
      issues.push(...checkRange(rangeKey, entry[rangeKey], rangeSpec));
    }
  }

  return issues;
}

function runValidation(label, entries, schema) {
  let errTotal = 0, warnTotal = 0;
  console.log(`\nValidating ${entries.length} ${label}...`);

  for (const entry of entries) {
    const issues = validateEntry(entry, schema);
    const errors  = issues.filter(i => i.level === 'ERROR');
    const warns   = issues.filter(i => i.level === 'WARN');
    errTotal  += errors.length;
    warnTotal += warns.length;

    if (errors.length) {
      console.log(`  ERROR  ${entry.id}: ${errors.map(e => `${e.field}: ${e.msg}`).join(' | ')}`);
    } else if (warns.length) {
      console.log(`  WARN   ${entry.id}: ${warns.map(w => `${w.field}: ${w.msg}`).join(' | ')}`);
    }
  }

  const passCount = entries.length - entries.filter((e, i) => {
    const iss = validateEntry(e, schema);
    return iss.some(x => x.level === 'ERROR');
  }).length;

  console.log(`  → ${passCount} PASS, ${warnTotal} WARN, ${errTotal} ERROR`);
  return errTotal;
}

function main() {
  const frameSchema  = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, 'frame.schema.json'),  'utf8'));
  const stringSchema = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, 'string.schema.json'), 'utf8'));
  const frames       = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'frames.json'),          'utf8'));
  const strings      = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'strings.json'),         'utf8'));

  const frameErrors  = runValidation('frames',  frames,  frameSchema);
  const stringErrors = runValidation('strings', strings, stringSchema);
  const total        = frameErrors + stringErrors;

  if (total > 0) {
    console.log(`\n✗ ${total} error(s) found — fix before proceeding`);
    process.exit(1);
  } else {
    console.log('\n✓ All entries valid');
  }
}

main();
