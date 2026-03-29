'use strict';

// TWU Bulk Racquet Scraper
//
// How it works (discovered via compareracquets.js):
//   1. Main page has <select name="racquetA"> with option values like "racquetA-ABR"
//   2. Each option triggers getmatch(value) → POST compareracquetsdata.cgi?<value>
//   3. That endpoint returns JSON directly — no HTML table parsing needed
//
// JSON fields returned:
//   mfg, racquet           → name = mfg + ' ' + racquet
//   headsize               → sq in
//   weight                 → grams (strungWeight)
//   balance                → cm
//   length                 → inches
//   swingweight            → kg·cm²
//   flex                   → RA/RDC (stiffness)
//   twistweight, vibration, acor, sweet → notes only

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

const DRY_RUN  = args.includes('--dry-run');
const LIMIT    = getArg('--limit') != null ? parseInt(getArg('--limit'),  10) : null;
const START    = getArg('--start') != null ? parseInt(getArg('--start'),  10) : 0;
const DELAY_MS = getArg('--delay') != null ? parseInt(getArg('--delay'),  10) : 300;
const TODAY    = new Date().toISOString().slice(0, 10);
const OUT_FILE = getArg('--out') ||
  path.join(__dirname, '..', 'data', `twu-scrape-${TODAY}.csv`);

const MAIN_URL = 'https://twu.tennis-warehouse.com/cgi-bin/compareracquets.cgi';
const DATA_URL = 'https://twu.tennis-warehouse.com/cgi-bin/compareracquetsdata.cgi';

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LoadoutLab-scraper/1.0)',
        'Accept':     'text/html,application/xhtml+xml'
      }
    }, res => {
      const chunks = [];
      res.on('data',  c => chunks.push(c));
      res.on('error', reject);
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const ct  = res.headers['content-type'] || '';
        const enc = /charset=(utf-8|utf8)/i.test(ct) ? 'utf8' : 'latin1';
        resolve(buf.toString(enc));
      });
    });
    req.setTimeout(15000, () => req.destroy(new Error('Request timed out (15s)')));
    req.on('error', reject);
  });
}

// POST with no body — option code goes in the query string per compareracquets.js:
//   url = "compareracquetsdata.cgi" + "?" + id;
//   request.open("POST", url, true);
//   request.send(null);
function httpPost(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method:  'POST',
      headers: {
        'User-Agent':   'Mozilla/5.0 (compatible; LoadoutLab-scraper/1.0)',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer':      MAIN_URL
      }
    }, res => {
      const chunks = [];
      res.on('data',  c => chunks.push(c));
      res.on('error', reject);
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.setTimeout(15000, () => req.destroy(new Error('Request timed out (15s)')));
    req.on('error', reject);
    req.end();
  });
}

// ─── Parse racquet list from main page ───────────────────────────────────────
// Extracts option value codes + trimmed display text from <select name="racquetA">.

function parseRacquetList(html) {
  const m = html.match(/<select[^>]+name="racquetA"[^>]*>([\s\S]*?)<\/select>/i);
  if (!m) throw new Error('Could not find <select name="racquetA"> in main page');

  const racquets = [];
  const optRe    = /<option([^>]*)>([^<]*)/gi;
  let opt;
  while ((opt = optRe.exec(m[1])) !== null) {
    const valM = opt[1].match(/value="([^"]*)"/i);
    if (!valM) continue;
    const code = valM[1].trim();
    const text = opt[2].trim();
    if (!code || code === 'none') continue;
    racquets.push({ code, text });
  }
  return racquets;
}

// ─── Fetch and parse one racquet via the JSON data API ───────────────────────

async function fetchRacquet(code) {
  const url  = `${DATA_URL}?${encodeURIComponent(code)}`;
  const body = await httpPost(url);

  let json;
  try {
    json = JSON.parse(body);
  } catch (e) {
    throw new Error(`JSON parse failed: ${e.message} (body: ${body.slice(0, 80)})`);
  }

  if (!json.racquet && !json.mfg) {
    throw new Error('JSON response missing racquet/mfg fields');
  }

  return json;
}

// ─── Map JSON response to CSV row ────────────────────────────────────────────
// JSON units (confirmed from compareracquets.js):
//   headsize   → sq in (integer)
//   weight     → grams
//   balance    → cm
//   length     → inches
//   swingweight → kg·cm²
//   flex        → RA/RDC
//   sweet       → sq in

function jsonToRow(json) {
  const name = `${json.mfg} ${json.racquet}`.trim();
  const id   = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Year: last 4-digit year found in name ("Pure Drive 2015" → "2015").
  const yearMatches = name.match(/\b(19|20)\d{2}\b/g);
  const year = yearMatches ? yearMatches[yearMatches.length - 1] : '';

  // Balance points — corrected for non-standard length (e.g. 27.5" frames).
  // balance from API is cm; convert to inches first.
  const lengthIn  = parseFloat(json.length)  || 27.0;
  const balanceCm = parseFloat(json.balance);
  let balancePts  = '';
  if (!isNaN(balanceCm)) {
    const balanceIn = balanceCm / 2.54;
    const evenPoint = lengthIn / 2;
    const pts = Math.round((evenPoint - balanceIn) * 8);
    if      (pts > 0) balancePts = `${pts} pts HL`;
    else if (pts < 0) balancePts = `${Math.abs(pts)} pts HH`;
    else              balancePts = 'Even';
  }

  // Notes: extra TWU fields not in frame schema.
  const noteParts = [];
  if (json.twistweight != null) noteParts.push(`twistweight=${json.twistweight}`);
  if (json.vibration   != null) noteParts.push(`vibration=${json.vibration}Hz`);
  if (json.acor        != null) noteParts.push(`power=${json.acor}%`);
  if (json.sweet       != null) noteParts.push(`sweetzone=${json.sweet}sqin`);
  if (lengthIn !== 27.0)        noteParts.push(`length=${lengthIn}in`);
  const notes = noteParts.length ? `TWU: ${noteParts.join(' ')}` : '';

  return {
    id,
    name,
    year,
    headSize:     json.headsize != null ? String(json.headsize) : '',
    strungWeight: json.weight   != null ? String(json.weight)   : '',
    balance:      json.balance  != null ? String(json.balance)  : '',
    balancePts,
    swingweight:  json.swingweight != null ? String(json.swingweight) : '',
    stiffness:    json.flex        != null ? String(json.flex)        : '',
    beamWidth:    '',
    pattern:      '',
    tensionRange: '',
    powerLevel:   '',
    strokeStyle:  '',
    swingSpeed:   '',
    frameProfile: '',
    identity:     '',
    notes
  };
}

// ─── CSV output ───────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  'id', 'name', 'year', 'headSize', 'strungWeight', 'balance', 'balancePts',
  'swingweight', 'stiffness', 'beamWidth', 'pattern', 'tensionRange',
  'powerLevel', 'strokeStyle', 'swingSpeed', 'frameProfile', 'identity', 'notes'
];

function csvEscape(val) {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCSV(rows) {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    lines.push(CSV_HEADERS.map(h => csvEscape(row[h] ?? '')).join(','));
  }
  return lines.join('\n');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching racquet list from TWU...');

  let mainHtml;
  try {
    mainHtml = await httpGet(MAIN_URL);
  } catch (e) {
    console.error(`Failed to fetch main page: ${e.message}`);
    process.exit(1);
  }

  let allRacquets;
  try {
    allRacquets = parseRacquetList(mainHtml);
  } catch (e) {
    console.error(`Failed to parse racquet list: ${e.message}`);
    process.exit(1);
  }

  console.log(`Found ${allRacquets.length} racquets in TWU database.`);

  if (DRY_RUN) {
    console.log('\n-- DRY RUN: racquet list --');
    allRacquets.forEach(({ code, text }, i) => console.log(`  [${i + 1}] ${text}  (${code})`));
    return;
  }

  const slice = allRacquets.slice(START, LIMIT != null ? START + LIMIT : undefined);
  const total = slice.length;

  if (total === 0) {
    console.log('No racquets to scrape (check --start / --limit values).');
    return;
  }

  console.log(`Scraping ${total} racquet(s) (start=${START}, delay=${DELAY_MS}ms)`);
  console.log(`Output: ${OUT_FILE}\n`);

  const results  = [];
  const seen     = new Set();
  const failures = [];

  for (let i = 0; i < slice.length; i++) {
    const { code, text } = slice[i];
    const globalIdx = START + i + 1;
    const totalEnd  = START + total;
    process.stdout.write(`[${globalIdx}/${totalEnd}] ${text} ... `);

    let json;
    try {
      json = await fetchRacquet(code);
    } catch (e) {
      process.stdout.write(`FAIL (${e.message})\n`);
      failures.push({ name: text, reason: e.message });
      if (i < slice.length - 1) await sleep(DELAY_MS);
      continue;
    }

    const row = jsonToRow(json);

    if (seen.has(row.name)) {
      process.stdout.write('SKIP (duplicate)\n');
      if (i < slice.length - 1) await sleep(DELAY_MS);
      continue;
    }

    seen.add(row.name);
    results.push(row);
    process.stdout.write(`OK  (${row.name})\n`);

    if (i < slice.length - 1) await sleep(DELAY_MS);
  }

  // Write CSV
  const csv = toCSV(results);
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, csv, 'utf8');

  const successful = results.length;
  const failed     = failures.length;
  const dupes      = total - successful - failed;

  console.log(
    `\nScraped ${total} racquets, ${successful} successful, ${failed} failed` +
    (dupes > 0 ? `, ${dupes} duplicate(s) skipped` : '') + '.'
  );
  console.log(`Output written to: ${OUT_FILE}`);

  if (failures.length) {
    console.log('\nFailed racquets:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.reason}`);
  }

  console.log('\nNext steps:');
  console.log('  Open the CSV in tools/frame-editor.html or a spreadsheet');
  console.log('  Fill in missing required fields: beamWidth, pattern, tensionRange, year (where missing)');
  console.log('  Remove any racquets you don\'t want to import');
  console.log(`  Run: node pipeline/scripts/ingest.js --type frame --csv ${OUT_FILE}`);
  console.log('  Run: npm run pipeline');
}

main().catch(e => {
  console.error(`Fatal: ${e.message}`);
  process.exit(1);
});
