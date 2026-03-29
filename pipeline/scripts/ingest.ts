'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');
const estimate = require('./estimate');

const ROOT         = path.resolve(__dirname, '../..');
const FRAMES_FILE  = path.join(ROOT, 'pipeline', 'data', 'frames.json');
const STRINGS_FILE = path.join(ROOT, 'pipeline', 'data', 'strings.json');
const SCHEMA_DIR   = path.join(ROOT, 'pipeline', 'schemas');

const frameSchema  = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, 'frame.schema.json'),  'utf8'));
const stringSchema = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, 'string.schema.json'), 'utf8'));

const MATERIALS = ['Polyester', 'Co-Polyester (elastic)', 'Multifilament', 'Natural Gut', 'Synthetic Gut'];
const TW_FIELDS = ['power', 'spin', 'comfort', 'control', 'feel', 'playabilityDuration', 'durability'];
const TODAY     = new Date().toISOString().slice(0, 10);

// ─── Input layer ─────────────────────────────────────────────────────────────
// Interactive (TTY): uses readline question-by-question.
// Pipe/non-TTY: reads all stdin upfront, then serves lines from a buffer.
// This makes smoke-test piping reliable while keeping TTY mode unchanged.

let rl          = null;
let inputBuffer = null; // null = TTY mode; Array = piped mode
let inputIdx    = 0;

async function initInput() {
  if (process.stdin.isTTY) return; // TTY mode — readline handles it
  // Piped mode: slurp all stdin now
  const chunks = [];
  await new Promise(resolve => {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', resolve);
  });
  inputBuffer = chunks.join('').split('\n');
}

function getRL() {
  if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return rl;
}
function closeRL() {
  if (rl) { rl.close(); rl = null; }
}
function question(prompt) {
  if (inputBuffer !== null) {
    // Piped mode: echo the prompt then serve the next buffered line
    process.stdout.write(prompt);
    const line = (inputBuffer[inputIdx++] ?? '').trim();
    process.stdout.write(line + '\n');
    return Promise.resolve(line);
  }
  return new Promise(resolve => getRL().question(prompt, ans => resolve(ans.trim())));
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function toKebab(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m + 1}, (_, i) =>
    Array.from({length: n + 1}, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
}

function parseBeamWidth(str) {
  const parts = str.split(',').map(s => {
    const v = parseFloat(s.trim());
    if (isNaN(v)) throw new Error(`Invalid beam width value: "${s.trim()}"`);
    return v;
  });
  if (!parts.length) throw new Error('beamWidth cannot be empty');
  return parts;
}

function parseTensionRange(str) {
  const parts = str.split(',').map(s => parseFloat(s.trim()));
  if (parts.length !== 2 || parts.some(isNaN))
    throw new Error('tensionRange must be two numbers separated by comma (e.g. 50,59)');
  return parts;
}

// ─── Validation (mirrors validate.js) ────────────────────────────────────────

function checkRange(field, value, rangeSpec) {
  if (typeof value !== 'number') return [];
  if (rangeSpec.error && (value < rangeSpec.error[0] || value > rangeSpec.error[1]))
    return [{ level: 'ERROR', field, msg: `${value} outside error range [${rangeSpec.error}]` }];
  if (rangeSpec.warn && (value < rangeSpec.warn[0] || value > rangeSpec.warn[1]))
    return [{ level: 'WARN',  field, msg: `${value} outside warn range [${rangeSpec.warn}]` }];
  return [];
}

function validateEntry(entry, schema) {
  const issues = [];
  const props  = schema.properties || {};
  const ranges = schema._validationRanges || {};

  for (const field of (schema.required || []))
    if (entry[field] == null)
      issues.push({ level: 'ERROR', field, msg: 'required field missing' });

  for (const [field, ps] of Object.entries(props)) {
    if (entry[field] == null) continue;
    const val = entry[field];
    if (ps.type === 'number'  && typeof val !== 'number')  issues.push({ level: 'ERROR', field, msg: `expected number, got ${typeof val}` });
    if (ps.type === 'string'  && typeof val !== 'string')  issues.push({ level: 'ERROR', field, msg: `expected string, got ${typeof val}` });
    if (ps.type === 'integer' && !Number.isInteger(val))   issues.push({ level: 'ERROR', field, msg: `expected integer, got ${val}` });
    if (ps.type === 'array'   && !Array.isArray(val))      issues.push({ level: 'ERROR', field, msg: `expected array, got ${typeof val}` });
    if (ps.enum && !ps.enum.includes(val))                 issues.push({ level: 'ERROR', field, msg: `"${val}" not in allowed enum` });
    if (ps.pattern && typeof val === 'string' && !new RegExp(ps.pattern).test(val))
      issues.push({ level: 'ERROR', field, msg: `"${val}" does not match pattern ${ps.pattern}` });
  }

  for (const [rangeKey, rangeSpec] of Object.entries(ranges)) {
    if (rangeKey === '_comment') continue;
    if (rangeKey.endsWith('_element')) {
      const field = rangeKey.replace('_element', '');
      if (Array.isArray(entry[field]))
        entry[field].forEach((v, i) => issues.push(...checkRange(`${field}[${i}]`, v, rangeSpec)));
    } else if (rangeKey.endsWith('_field')) {
      const field = rangeKey.replace('_field', '');
      if (entry[field] && typeof entry[field] === 'object')
        for (const [k, v] of Object.entries(entry[field]))
          issues.push(...checkRange(`${field}.${k}`, v, rangeSpec));
    } else {
      issues.push(...checkRange(rangeKey, entry[rangeKey], rangeSpec));
    }
  }

  return issues;
}

// ─── Duplicate detection ──────────────────────────────────────────────────────

function checkFrameDuplicates(entry, pool) {
  if (pool.some(f => f.id === entry.id))
    return { blocking: `Frame with id "${entry.id}" already exists`, warnings: [] };

  const warnings = [];

  if (pool.some(f => f.name === entry.name && f.brand === entry.brand && f.year === entry.year))
    warnings.push('Same name + brand + year as an existing frame');

  const pct2 = (a, b) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b)) <= 0.02;
  const rebadge = pool.filter(f =>
    f.year === entry.year &&
    pct2(f.stiffness, entry.stiffness) &&
    pct2(f.strungWeight, entry.strungWeight) &&
    pct2(f.headSize, entry.headSize)
  );
  if (rebadge.length)
    warnings.push(`Possible rebadge — stiffness/weight/headSize within ±2% (${rebadge.map(f => f.id).join(', ')})`);

  return { blocking: null, warnings };
}

function checkStringDuplicates(entry, pool) {
  if (pool.some(s => s.id === entry.id))
    return { blocking: `String with id "${entry.id}" already exists`, warnings: [] };

  const warnings = [];
  const similar  = pool.filter(s =>
    levenshtein(s.name.toLowerCase(), entry.name.toLowerCase()) < 3
  );
  if (similar.length)
    warnings.push(`Name very similar (Levenshtein < 3) to: ${similar.map(s => `"${s.name}"`).join(', ')}`);

  return { blocking: null, warnings };
}

// ─── Build entries from raw field maps ───────────────────────────────────────

function buildFrame(fields) {
  const name = fields.name;
  const entry = {
    id:           fields.id || toKebab(name),
    name,
    year:         parseInt(fields.year, 10),
    headSize:     parseFloat(fields.headSize),
    strungWeight: parseFloat(fields.strungWeight),
    swingweight:  parseFloat(fields.swingweight),
    stiffness:    parseFloat(fields.stiffness),
    beamWidth:    typeof fields.beamWidth === 'string' ? parseBeamWidth(fields.beamWidth) : fields.beamWidth,
    pattern:      fields.pattern,
    tensionRange: typeof fields.tensionRange === 'string' ? parseTensionRange(fields.tensionRange) : fields.tensionRange,
    balance:      parseFloat(fields.balance),
    brand:        name.split(' ')[0]
  };

  if (fields.balancePts)   entry.balancePts   = fields.balancePts;
  if (fields.length)       entry.length       = parseFloat(fields.length);
  if (fields.powerLevel)   entry.powerLevel   = fields.powerLevel;
  if (fields.strokeStyle)  entry.strokeStyle  = fields.strokeStyle;
  if (fields.swingSpeed)   entry.swingSpeed   = fields.swingSpeed;
  if (fields.frameProfile) entry.frameProfile = fields.frameProfile;
  if (fields.identity)     entry.identity     = fields.identity;
  if (fields.notes)        entry.notes        = fields.notes;

  entry._meta = {
    aeroBonus:   parseFloat(fields['_meta.aeroBonus']   ?? fields.aeroBonus   ?? 0) || 0,
    comfortTech: parseFloat(fields['_meta.comfortTech'] ?? fields.comfortTech ?? 0) || 0,
    spinTech:    parseFloat(fields['_meta.spinTech']    ?? fields.spinTech    ?? 0) || 0,
    genBonus:    parseFloat(fields['_meta.genBonus']    ?? fields.genBonus    ?? 0) || 0
  };

  entry._provenance = {
    source:          'manual',
    dateAdded:       TODAY,
    confidence:      'high',
    estimatedFields: []
  };

  return entry;
}

// ─── CSV → Frame mapping ──────────────────────────────────────────────────────
// Thin wrapper around buildFrame that sets the correct provenance for CSV imports.
// brand:   auto-derived from name (first word) — not a CSV column
// _meta:   all CSV imports default to { aeroBonus:0, comfortTech:0, spinTech:0, genBonus:0 }
//          (buildFrame already defaults missing _meta.* fields to 0)
// _provenance: source='csv' distinguishes batch imports from interactive 'manual' entry
function mapCsvRowToFrame(row) {
  const entry = buildFrame(row);
  entry._provenance = {
    source:          'csv',
    dateAdded:       TODAY,
    confidence:      'high',
    estimatedFields: []
  };
  return entry;
}

function buildString(fields, estimatedFields) {
  const entry = {
    id:            fields.id || toKebab(fields.name),
    name:          fields.name,
    gauge:         fields.gauge,
    gaugeNum:      parseFloat(fields.gaugeNum),
    material:      fields.material,
    stiffness:     parseFloat(fields.stiffness),
    tensionLoss:   parseFloat(fields.tensionLoss),
    spinPotential: parseFloat(fields.spinPotential),
    twScore: {
      power:               Math.round(parseFloat(fields['twScore.power'])),
      spin:                Math.round(parseFloat(fields['twScore.spin'])),
      comfort:             Math.round(parseFloat(fields['twScore.comfort'])),
      control:             Math.round(parseFloat(fields['twScore.control'])),
      feel:                Math.round(parseFloat(fields['twScore.feel'])),
      playabilityDuration: Math.round(parseFloat(fields['twScore.playabilityDuration'])),
      durability:          Math.round(parseFloat(fields['twScore.durability']))
    }
  };

  if (fields.shape)    entry.shape    = fields.shape;
  if (fields.identity) entry.identity = fields.identity;
  if (fields.notes)    entry.notes    = fields.notes;

  entry._provenance = {
    source:          'manual',
    dateAdded:       TODAY,
    confidence:      estimatedFields.length > 0 ? 'estimated' : 'high',
    estimatedFields: estimatedFields || []
  };

  return entry;
}

// ─── CSV parser ───────────────────────────────────────────────────────────────
// Handles quoted fields (RFC 4180: commas and newlines inside double-quotes).

function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  function parseLine(line) {
    const fields = [];
    let i = 0;
    while (i <= line.length) {
      if (i === line.length) { fields.push(''); break; }
      if (line[i] === '"') {
        let j = i + 1, val = '';
        while (j < line.length) {
          if (line[j] === '"' && line[j + 1] === '"') { val += '"'; j += 2; }
          else if (line[j] === '"') { j++; break; }
          else { val += line[j++]; }
        }
        fields.push(val);
        i = j + 1; // skip comma
      } else {
        const j = line.indexOf(',', i);
        if (j === -1) { fields.push(line.slice(i).trim()); break; }
        fields.push(line.slice(i, j).trim());
        i = j + 1;
      }
    }
    return fields;
  }

  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const row  = {};
    headers.forEach((h, i) => { row[h.trim()] = (vals[i] ?? '').trim(); });
    return row;
  });
}

// ─── Interactive: Frame ───────────────────────────────────────────────────────

async function ingestFrameInteractive() {
  console.log('\n─── Add New Frame ─────────────────────────────────────────\n');
  const fields = {};
  const ranges = frameSchema._validationRanges || {};

  async function askNum(label, rangeHint) {
    const hint = rangeHint ? ` (warn ${rangeHint[0]}–${rangeHint[1]})` : '';
    for (;;) {
      const ans = await question(`  ${label}${hint}: `);
      const v   = parseFloat(ans);
      if (!isNaN(v)) return v;
      console.log('    ✗ Enter a number');
    }
  }

  // Name → ID suggestion
  for (;;) {
    fields.name = await question('  Name: ');
    if (fields.name) break;
    console.log('    ✗ Name is required');
  }
  const suggestedId = toKebab(fields.name);
  const idAns = await question(`  ID [${suggestedId}]: `);
  fields.id = idAns || suggestedId;

  // Required numeric fields
  fields.year         = await question('  Year: ');
  fields.headSize     = await askNum('Head size (sq in)',     ranges.headSize?.warn);
  fields.strungWeight = await askNum('Strung weight (g)',     ranges.strungWeight?.warn);
  fields.swingweight  = await askNum('Swingweight (kg·cm²)', ranges.swingweight?.warn);
  fields.stiffness    = await askNum('Stiffness (RA)',        ranges.stiffness?.warn);

  // beamWidth
  for (;;) {
    const ans = await question('  Beam width (mm, comma-separated e.g. 23,26,23): ');
    try { fields.beamWidth = parseBeamWidth(ans); break; }
    catch (e) { console.log(`    ✗ ${e.message}`); }
  }

  // pattern
  for (;;) {
    const ans = await question('  String pattern (e.g. 16x19): ');
    if (/^\d+x\d+$/.test(ans)) { fields.pattern = ans; break; }
    console.log('    ✗ Must match format NNxNN (e.g. 16x19)');
  }

  // tensionRange
  for (;;) {
    const ans = await question('  Tension range (low,high lbs e.g. 50,59): ');
    try { fields.tensionRange = parseTensionRange(ans); break; }
    catch (e) { console.log(`    ✗ ${e.message}`); }
  }

  fields.balance = await askNum('Balance (cm from butt)');

  // Optional fields
  console.log('\n  Optional — press Enter to skip:');
  fields.balancePts   = await question('    Balance description (e.g. "4 pts HL"): ');
  const lenStr        = await question('    Length (inches): ');
  if (lenStr) fields.length = lenStr;
  fields.powerLevel   = await question('    Power level: ');
  fields.strokeStyle  = await question('    Stroke style: ');
  fields.swingSpeed   = await question('    Swing speed: ');
  fields.frameProfile = await question('    Frame profile: ');
  fields.identity     = await question('    Identity tag: ');
  fields.notes        = await question('    Notes: ');

  // _meta
  console.log('\n  Frame technology (_meta) — press Enter for 0:');
  async function askMeta(label) {
    const ans = await question(`    ${label} [0]: `);
    return ans ? (parseFloat(ans) || 0) : 0;
  }
  fields['_meta.aeroBonus']   = await askMeta('Aero bonus   (0=none, 2+=exceptional)');
  fields['_meta.comfortTech'] = await askMeta('Comfort tech (vibration dampening)');
  fields['_meta.spinTech']    = await askMeta('Spin tech    (textured/open-throat)');
  fields['_meta.genBonus']    = await askMeta('Gen bonus    (generation improvement)');

  const entry  = buildFrame(fields);
  const issues = validateEntry(entry, frameSchema);
  const errors = issues.filter(i => i.level === 'ERROR');
  const warns  = issues.filter(i => i.level === 'WARN');

  if (warns.length) {
    console.log('\n  Validation warnings:');
    warns.forEach(w => console.log(`    WARN  ${w.field}: ${w.msg}`));
  }
  if (errors.length) {
    console.log('\n  Validation errors:');
    errors.forEach(e => console.log(`    ERROR ${e.field}: ${e.msg}`));
    const retry = await question('\n  Fix and retry? (y/n): ');
    closeRL();
    if (retry.toLowerCase() === 'y') return ingestFrameInteractive();
    console.log('Aborted.');
    return;
  }

  const existing = JSON.parse(fs.readFileSync(FRAMES_FILE, 'utf8'));
  const { blocking, warnings: dupWarns } = checkFrameDuplicates(entry, existing);

  if (blocking) {
    console.log(`\n  ✗ ${blocking}`);
    closeRL();
    return;
  }

  for (const w of dupWarns) {
    console.log(`\n  WARN: ${w}`);
    const cont = await question('  Proceed anyway? (y/n): ');
    if (cont.toLowerCase() !== 'y') { closeRL(); console.log('Aborted.'); return; }
  }

  existing.push(entry);
  fs.writeFileSync(FRAMES_FILE, JSON.stringify(existing, null, 2));
  console.log(`\n  ✓ Added "${entry.id}". Total frames: ${existing.length}`);
  closeRL();
}

// ─── Interactive: String ──────────────────────────────────────────────────────

async function ingestStringInteractive() {
  console.log('\n─── Add New String ────────────────────────────────────────\n');
  const fields          = {};
  const estimatedFields = [];
  const sRanges         = stringSchema._validationRanges || {};

  for (;;) {
    fields.name = await question('  Name: ');
    if (fields.name) break;
    console.log('    ✗ Name is required');
  }
  const suggestedId = toKebab(fields.name);
  const idAns = await question(`  ID [${suggestedId}]: `);
  fields.id = idAns || suggestedId;

  fields.gauge = await question('  Gauge (e.g. "17 (1.25mm)"): ');

  for (;;) {
    const ans = await question('  Gauge number (mm, e.g. 1.25): ');
    const v   = parseFloat(ans);
    if (!isNaN(v)) { fields.gaugeNum = v; break; }
    console.log('    ✗ Enter a number');
  }

  console.log('\n  Material:');
  MATERIALS.forEach((m, i) => console.log(`    [${i + 1}] ${m}`));
  for (;;) {
    const ans = await question('  Select [1–5]: ');
    const idx = parseInt(ans, 10) - 1;
    if (idx >= 0 && idx < MATERIALS.length) { fields.material = MATERIALS[idx]; break; }
    console.log('    ✗ Enter 1–5');
  }

  fields.shape = await question('\n  Shape (e.g. "Pentagon/5-sided") — Enter to skip: ');

  async function askNum(label, rangeHint) {
    const hint = rangeHint ? ` (warn ${rangeHint[0]}–${rangeHint[1]})` : '';
    for (;;) {
      const ans = await question(`  ${label}${hint}: `);
      const v   = parseFloat(ans);
      if (!isNaN(v)) return v;
      console.log('    ✗ Enter a number');
    }
  }

  fields.stiffness     = await askNum('Stiffness (lb/in)', sRanges.stiffness?.warn);
  fields.tensionLoss   = await askNum('Tension loss (%)',  sRanges.tensionLoss?.warn);
  fields.spinPotential = await askNum('Spin potential',    sRanges.spinPotential?.warn);

  // Pre-compute all 7 estimated values up front
  const estimatedAll = estimate.estimateTwScore({
    material:      fields.material,
    stiffness:     fields.stiffness,
    tensionLoss:   fields.tensionLoss,
    spinPotential: fields.spinPotential,
    shape:         fields.shape || undefined,
    gaugeNum:      fields.gaugeNum
  });

  console.log('\n  twScore (0-100) — press Enter or type "estimate" to auto-estimate:');
  for (const tf of TW_FIELDS) {
    const ans = await question(`    ${tf} [estimate]: `);
    if (!ans || ans.toLowerCase() === 'estimate') {
      fields[`twScore.${tf}`] = estimatedAll[tf];
      estimatedFields.push(`twScore.${tf}`);
      console.log(`      → estimated: ${estimatedAll[tf]}`);
    } else {
      const v = parseInt(ans, 10);
      if (isNaN(v)) {
        console.log(`      ✗ Not a number — using estimated: ${estimatedAll[tf]}`);
        fields[`twScore.${tf}`] = estimatedAll[tf];
        estimatedFields.push(`twScore.${tf}`);
      } else {
        fields[`twScore.${tf}`] = v;
      }
    }
  }

  console.log('\n  Optional — press Enter to skip:');
  fields.identity = await question('    Identity tag: ');
  fields.notes    = await question('    Notes: ');

  const entry  = buildString(fields, estimatedFields);
  const issues = validateEntry(entry, stringSchema);
  const errors = issues.filter(i => i.level === 'ERROR');
  const warns  = issues.filter(i => i.level === 'WARN');

  if (warns.length) {
    console.log('\n  Validation warnings:');
    warns.forEach(w => console.log(`    WARN  ${w.field}: ${w.msg}`));
  }
  if (errors.length) {
    console.log('\n  Validation errors:');
    errors.forEach(e => console.log(`    ERROR ${e.field}: ${e.msg}`));
    const retry = await question('\n  Fix and retry? (y/n): ');
    closeRL();
    if (retry.toLowerCase() === 'y') return ingestStringInteractive();
    console.log('Aborted.');
    return;
  }

  const existing = JSON.parse(fs.readFileSync(STRINGS_FILE, 'utf8'));
  const { blocking, warnings: dupWarns } = checkStringDuplicates(entry, existing);

  if (blocking) {
    console.log(`\n  ✗ ${blocking}`);
    closeRL();
    return;
  }

  for (const w of dupWarns) {
    console.log(`\n  WARN: ${w}`);
    const cont = await question('  Proceed anyway? (y/n): ');
    if (cont.toLowerCase() !== 'y') { closeRL(); console.log('Aborted.'); return; }
  }

  existing.push(entry);
  fs.writeFileSync(STRINGS_FILE, JSON.stringify(existing, null, 2));
  console.log(`\n  ✓ Added "${entry.id}". Total strings: ${existing.length}`);
  if (estimatedFields.length)
    console.log(`    Estimated fields: ${estimatedFields.join(', ')}`);
  closeRL();
}

// ─── CSV mode ─────────────────────────────────────────────────────────────────

function runCSV(type, csvPath) {
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`); process.exit(1);
  }

  const rows     = parseCSV(fs.readFileSync(csvPath, 'utf8'));
  const dataFile = type === 'frame' ? FRAMES_FILE : STRINGS_FILE;
  const schema   = type === 'frame' ? frameSchema  : stringSchema;
  const existing = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  let added = 0, skipped = 0, warnCount = 0;
  const batch      = [];
  const skippedLog = [];

  for (const row of rows) {
    let entry, estimatedFields = [];
    try {
      if (type === 'frame') {
        entry = mapCsvRowToFrame(row);
      } else {
        const needEst = TW_FIELDS.filter(f => !row[`twScore.${f}`]);
        if (needEst.length) {
          const est = estimate.estimateTwScore({
            material:      row.material,
            stiffness:     parseFloat(row.stiffness),
            tensionLoss:   parseFloat(row.tensionLoss),
            spinPotential: parseFloat(row.spinPotential),
            shape:         row.shape,
            gaugeNum:      parseFloat(row.gaugeNum)
          });
          for (const f of needEst) {
            row[`twScore.${f}`] = est[f];
            estimatedFields.push(`twScore.${f}`);
          }
        }
        entry = buildString(row, estimatedFields);
      }
    } catch (e) {
      const label = row.name || row.id || '(unknown)';
      console.log(`  SKIP  "${label}": build error — ${e.message}`);
      skippedLog.push({ id: label, reason: e.message });
      skipped++;
      continue;
    }

    const issues = validateEntry(entry, schema);
    const errs   = issues.filter(i => i.level === 'ERROR');
    const warns  = issues.filter(i => i.level === 'WARN');

    if (errs.length) {
      const msg = errs.map(e => `${e.field}: ${e.msg}`).join('; ');
      console.log(`  SKIP  "${entry.id}": ${msg}`);
      skippedLog.push({ id: entry.id, reason: msg });
      skipped++;
      continue;
    }

    const pool = [...existing, ...batch];
    const { blocking, warnings: dupWarns } = type === 'frame'
      ? checkFrameDuplicates(entry, pool)
      : checkStringDuplicates(entry, pool);

    if (blocking) {
      console.log(`  SKIP  "${entry.id}": ${blocking}`);
      skippedLog.push({ id: entry.id, reason: blocking });
      skipped++;
      continue;
    }

    for (const w of [...warns.map(w => `${w.field}: ${w.msg}`), ...dupWarns]) {
      console.log(`  WARN  "${entry.id}": ${w}`);
      warnCount++;
    }

    batch.push(entry);
    added++;
  }

  if (batch.length) {
    fs.writeFileSync(dataFile, JSON.stringify([...existing, ...batch], null, 2));
    console.log(`\nRun 'npm run pipeline' to validate and regenerate data.js`);
  }

  console.log(`\nImport complete: ${added} added, ${skipped} skipped, ${warnCount} warnings`);
  if (skippedLog.length) {
    console.log('Skipped entries:');
    skippedLog.forEach(r => console.log(`  "${r.id}": ${r.reason}`));
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await initInput();
  const args    = process.argv.slice(2);
  const typeIdx = args.indexOf('--type');
  const csvIdx  = args.indexOf('--csv');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  node pipeline/scripts/ingest.js --type frame|string [--csv path]

Modes:
  --type frame                  Interactive frame entry
  --type string                 Interactive string entry (supports twScore estimation)
  --type frame  --csv <path>    Batch frame import from CSV
  --type string --csv <path>    Batch string import from CSV

CSV column format for frames:
  id,name,year,headSize,strungWeight,balance,balancePts,swingweight,
  stiffness,beamWidth,pattern,tensionRange,powerLevel,strokeStyle,
  swingSpeed,frameProfile,identity,notes

  beamWidth     comma-separated in quotes: "23,26,23" → [23, 26, 23]
  tensionRange  two numbers in quotes:     "50,59"    → [50, 59]
  brand         auto-derived from name (first word) — not a CSV column
  _meta         defaults to all zeros for CSV imports
  Optional columns may be omitted from the CSV entirely.
`);
    process.exit(0);
  }

  if (typeIdx === -1 || !args[typeIdx + 1]) {
    console.error('Usage: node ingest.js --type frame|string [--csv path/to/file.csv]');
    process.exit(1);
  }

  const type = args[typeIdx + 1];
  if (!['frame', 'string'].includes(type)) {
    console.error('--type must be "frame" or "string"');
    process.exit(1);
  }

  if (csvIdx !== -1) {
    const csvPath = args[csvIdx + 1];
    if (!csvPath) { console.error('--csv requires a file path'); process.exit(1); }
    runCSV(type, csvPath);
  } else {
    if (type === 'frame') await ingestFrameInteractive();
    else                  await ingestStringInteractive();
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
