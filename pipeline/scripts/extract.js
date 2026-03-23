// ⚠️  ONE-TIME MIGRATION SCRIPT — DO NOT RE-RUN
// This script extracted RACQUETS, STRINGS, and FRAME_META from app.js
// into pipeline/data/*.json during the initial pipeline setup.
// The data blocks have since been removed from app.js.
// Running this again will produce empty/broken output.
// To regenerate data.js from JSON, use: npm run export

'use strict';
const path = require('path');
const fs   = require('fs');
const json5 = require('json5');

const ROOT    = path.resolve(__dirname, '../..');
const APP_JS  = path.join(ROOT, 'app.js');
const OUT_DIR = path.join(ROOT, 'pipeline', 'data');

// Bracket-match extraction. Handles strings, line comments, block comments.
// No vm / eval / new Function.
function extractBlock(src, startMarker, openChar, closeChar) {
  const markerIdx = src.indexOf(startMarker);
  if (markerIdx === -1) throw new Error(`Marker not found: "${startMarker}"`);

  const blockStart = src.indexOf(openChar, markerIdx);
  let i            = blockStart;
  let depth        = 0;
  let inString     = false;
  let stringChar   = null;
  let inLineComment  = false;
  let inBlockComment = false;

  while (i < src.length) {
    const ch = src[i];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
    } else if (inBlockComment) {
      if (ch === '*' && src[i + 1] === '/') { inBlockComment = false; i++; }
    } else if (inString) {
      if (ch === '\\') { i++; }                 // skip escaped char
      else if (ch === stringChar) { inString = false; }
    } else {
      if      (ch === '/' && src[i + 1] === '/') { inLineComment = true; }
      else if (ch === '/' && src[i + 1] === '*') { inBlockComment = true; i++; }
      else if (ch === '"' || ch === "'" || ch === '`') { inString = true; stringChar = ch; }
      else if (ch === openChar)  { depth++; }
      else if (ch === closeChar) { depth--; if (depth === 0) break; }
    }
    i++;
  }

  return src.slice(blockStart, i + 1);
}

function main() {
  const src   = fs.readFileSync(APP_JS, 'utf8');
  const today = new Date().toISOString().slice(0, 10);

  console.log('Extracting RACQUETS...');
  const racquetsText = extractBlock(src, 'const RACQUETS = [', '[', ']');
  const RACQUETS     = json5.parse(racquetsText);
  console.log(`  → ${RACQUETS.length} entries`);

  console.log('Extracting STRINGS...');
  const stringsText = extractBlock(src, 'const STRINGS = [', '[', ']');
  const STRINGS     = json5.parse(stringsText);
  console.log(`  → ${STRINGS.length} entries`);

  console.log('Extracting FRAME_META...');
  const frameMetaText = extractBlock(src, 'const FRAME_META = {', '{', '}');
  const FRAME_META    = json5.parse(frameMetaText);
  console.log(`  → ${Object.keys(FRAME_META).length} entries`);

  const defaultMeta = { aeroBonus: 0, comfortTech: 0, spinTech: 0, genBonus: 0 };

  const frames = RACQUETS.map(r => ({
    ...r,
    brand: r.name.split(' ')[0],
    _meta: FRAME_META[r.id]
      ? { ...FRAME_META[r.id] }
      : { ...defaultMeta },
    _provenance: { source: 'app.js', dateAdded: today, confidence: 'high' }
  }));

  const strings = STRINGS.map(s => ({
    ...s,
    _provenance: { source: 'app.js', dateAdded: today, confidence: 'high' }
  }));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  fs.writeFileSync(path.join(OUT_DIR, 'frames.json'),  JSON.stringify(frames,  null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'strings.json'), JSON.stringify(strings, null, 2));

  const withMeta    = frames.filter(f => FRAME_META[f.id]).length;
  const withDefault = frames.length - withMeta;

  console.log(`\n✓ frames.json  — ${frames.length} frames (${withMeta} with _meta, ${withDefault} defaulted to zeros)`);
  console.log(`✓ strings.json — ${strings.length} strings`);
}

main();
