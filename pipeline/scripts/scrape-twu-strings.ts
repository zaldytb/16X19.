'use strict';

/**
 * TWU String Database Scraper
 * 
 * Scrapes the TWU (Tennis Warehouse University) string performance database from:
 * https://twu.tennis-warehouse.com/learning_center/reporter2.php
 * 
 * LIMITATIONS:
 * - The default GET request returns only 8 columns (not the full 26):
 *   Item, String, Ref. Ten. (lbs), Swing Speed, Material, Stiffness (lb/in), 
 *   Tension Loss (%), Spin Potential
 * - The data is pre-filtered to: Polyester strings only, 51 lbs ref tension, Fast swing speed
 * - This gives us 473 rows covering 472 unique polyester strings
 * 
 * UNAVAILABLE COLUMNS (known to exist but inaccessible via GET):
 * - Gauge Nominal (mm), Gauge Acutal (mm) [TWU typo]
 * - Stretch at 40/51/62 lbs (%)
 * - Actual Pre-impact Tension (lbs), Dwell Time (ms), Deflection (mm)
 * - Tension Change (lbs), Peak Tension (lbs), Peak Perp. Force (lbs)
 * - Ave Perp. Force (lbs), Static Loss lbs., Stabilization Loss (lbs)
 * - Impact Loss (lbs), Total Loss (lbs), Energy Return (%)
 * - String/String COF, String/Ball COF
 * 
 * WHY POST DOESN'T WORK:
 * - The server accepts POST requests with display[] parameters to select columns
 * - However, POST requests return 0 data rows (likely session/CSRF protection)
 * - Various attempts made: different body formats, headers, cookies, etc.
 * - The server appears to require a valid browser session for POST to return data
 * 
 * This is sufficient for our current needs as the 8 available columns map directly
 * to our string schema: stiffness, tensionLoss, spinPotential, material
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────────────────

const TWU_URL = 'https://twu.tennis-warehouse.com/learning_center/reporter2.php';
const TODAY = new Date().toISOString().slice(0, 10);
const DEFAULT_OUT = path.join(__dirname, '..', 'data', `twu-strings-raw-${TODAY}.csv`);

// CSV columns we can extract from the default GET response
const CSV_HEADERS = [
  'id', 'name', 'refTension', 'swingSpeed', 'material', 
  'stiffness', 'tensionLoss', 'spinPotential'
];

// ─── CLI Arguments ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

const DEBUG_MODE = args.includes('--debug');
const LIMIT = getArg('--limit') != null ? parseInt(getArg('--limit'), 10) : null;
const OUT_FILE = getArg('--out') || DEFAULT_OUT;

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LoadoutLab-scraper/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('error', reject);
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const ct = res.headers['content-type'] || '';
        const enc = /charset=(utf-8|utf8)/i.test(ct) ? 'utf8' : 'latin1';
        resolve(buf.toString(enc));
      });
    });
    req.setTimeout(15000, () => req.destroy(new Error('Request timed out (15s)')));
    req.on('error', reject);
  });
}

// ─── HTML Parsing ────────────────────────────────────────────────────────────

function parseTable(html) {
  const tableMatch = html.match(/<table[^>]*id=["']?searchresults["']?[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) {
    throw new Error('Could not find table with id="searchresults"');
  }

  const tableContent = tableMatch[1];
  
  // Get all rows (the default view doesn't use tbody)
  const rowMatches = [...tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (rowMatches.length === 0) {
    throw new Error('No rows found in table');
  }

  // First row is headers
  const headerCells = [...rowMatches[0][1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)];
  const headers = headerCells.map(h => h[1].replace(/<[^>]+>/g, '').trim());

  // Parse data rows
  const dataRows = [];
  for (let i = 1; i < rowMatches.length; i++) {
    const cells = [...rowMatches[i][1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (cells.length > 0) {
      const rowData = cells.map(c => c[1].replace(/<[^>]+>/g, '').trim());
      dataRows.push(rowData);
    }
  }

  return { headers, rows: dataRows };
}

function toKebab(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Data Transformation ─────────────────────────────────────────────────────

function transformRow(rowData) {
  // rowData indices based on TWU table structure:
  // [0] Item (row number)
  // [1] String (name)
  // [2] Ref. Ten. (lbs)
  // [3] Swing Speed
  // [4] Material
  // [5] Stiffness (lb/in)
  // [6] Tension Loss (%)
  // [7] Spin Potential

  const name = rowData[1] || '';
  const id = toKebab(name);

  return {
    id,
    name,
    refTension: rowData[2] || '',
    swingSpeed: rowData[3] || '',
    material: rowData[4] || '',
    stiffness: rowData[5] || '',
    tensionLoss: rowData[6] || '',
    spinPotential: rowData[7] || ''
  };
}

// ─── CSV Output ──────────────────────────────────────────────────────────────

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

// ─── Debug Output ────────────────────────────────────────────────────────────

async function runDebug() {
  console.log('=== TWU String Database Scraper - Debug Mode ===\n');
  console.log('Fetching:', TWU_URL);
  
  let html;
  try {
    html = await httpGet(TWU_URL);
  } catch (e) {
    console.error('Failed to fetch:', e.message);
    process.exit(1);
  }

  console.log('\n--- Page Structure ---');
  console.log('HTML length:', html.length);
  
  // Check for table
  const tableMatch = html.match(/<table[^>]*id=["']?searchresults["']?[^>]*>/i);
  console.log('Table found:', !!tableMatch);

  // Parse table
  let tableData;
  try {
    tableData = parseTable(html);
  } catch (e) {
    console.error('Parse error:', e.message);
    process.exit(1);
  }

  console.log('\n--- Table Headers (' + tableData.headers.length + ') ---');
  tableData.headers.forEach((h, i) => console.log('  [' + i + '] ' + h));

  console.log('\n--- Data Rows ---');
  console.log('Total rows:', tableData.rows.length);

  // Count unique strings
  const stringNames = new Set(tableData.rows.map(r => r[1]));
  console.log('Unique strings:', stringNames.size);

  // Show first 10 rows
  console.log('\n--- First 10 Rows ---');
  tableData.rows.slice(0, 10).forEach((row, i) => {
    const transformed = transformRow(row);
    console.log(`\n[${i + 1}] ${transformed.name}`);
    console.log(`    Material: ${transformed.material}, Stiffness: ${transformed.stiffness}, Tension Loss: ${transformed.tensionLoss}, Spin: ${transformed.spinPotential}`);
  });

  // Show material distribution
  console.log('\n--- Material Distribution ---');
  const materialCounts = {};
  for (const row of tableData.rows) {
    const mat = row[4] || 'Unknown';
    materialCounts[mat] = (materialCounts[mat] || 0) + 1;
  }
  Object.entries(materialCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([mat, count]) => console.log('  ' + mat + ': ' + count));

  // Check for specific string
  console.log('\n--- Looking for "Ashaway" strings ---');
  const ashawayRows = tableData.rows.filter(r => r[1] && r[1].includes('Ashaway'));
  if (ashawayRows.length > 0) {
    ashawayRows.forEach(row => {
      console.log('  - ' + row[1] + ' (' + row[4] + ')');
    });
  } else {
    console.log('  No Ashaway strings found (expected - default view is Polyester only)');
  }

  console.log('\n--- Transformed Sample (first row) ---');
  if (tableData.rows.length > 0) {
    const transformed = transformRow(tableData.rows[0]);
    console.log(JSON.stringify(transformed, null, 2));
  }

  console.log('\n=== Debug Complete ===');
}

// ─── Full Scrape ─────────────────────────────────────────────────────────────

async function runScrape() {
  console.log('TWU String Database Scraper');
  console.log('===========================\n');
  console.log('Fetching:', TWU_URL);

  let html;
  try {
    html = await httpGet(TWU_URL);
  } catch (e) {
    console.error('Failed to fetch:', e.message);
    process.exit(1);
  }

  let tableData;
  try {
    tableData = parseTable(html);
  } catch (e) {
    console.error('Parse error:', e.message);
    process.exit(1);
  }

  console.log('Headers:', tableData.headers.join(', '));
  console.log('Total rows from TWU:', tableData.rows.length);

  // Transform and dedupe
  const seen = new Set();
  const results = [];
  
  for (const row of tableData.rows) {
    const transformed = transformRow(row);
    
    // Skip duplicates (same string name)
    if (seen.has(transformed.name)) {
      continue;
    }
    seen.add(transformed.name);
    
    results.push(transformed);
    
    if (LIMIT && results.length >= LIMIT) {
      console.log('Limit reached:', LIMIT);
      break;
    }
  }

  console.log('Unique strings after dedupe:', results.length);

  // Generate CSV
  const csv = toCSV(results);
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, csv, 'utf8');

  // Summary statistics
  const materialCounts = {};
  for (const row of results) {
    const mat = row.material || 'Unknown';
    materialCounts[mat] = (materialCounts[mat] || 0) + 1;
  }

  console.log('\n--- Summary ---');
  console.log('By material:');
  Object.entries(materialCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([mat, count]) => console.log('  ' + mat + ': ' + count));

  console.log('\nOutput:', OUT_FILE);
  console.log('\nNote: This scrape includes only the 8 columns available via GET.');
  console.log('The TWU database has 26 columns total, but POST requests (required');
  console.log('for column selection) return 0 rows due to server-side protection.');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (DEBUG_MODE) {
    await runDebug();
  } else {
    await runScrape();
  }
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
