#!/usr/bin/env node
/**
 * pipeline/scripts/extract.js
 *
 * Extracts RACQUETS, STRINGS, and FRAME_META from app.js by:
 *   1. Bracket-walking the source to isolate each top-level const literal.
 *   2. Parsing the extracted text with json5.parse() (no eval, no vm, no new Function).
 *   3. Merging FRAME_META entries into each frame as an _meta field.
 *   4. Writing pipeline/data/frames.json (with _meta) and pipeline/data/strings.json.
 *
 * Usage:  node pipeline/scripts/extract.js
 *         node pipeline/scripts/extract.js --verbose
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const JSON5 = require('json5');

const VERBOSE = process.argv.includes('--verbose');
const APP_JS  = path.join(__dirname, '..', '..', 'app.js');
const OUT_DIR = path.join(__dirname, '..', 'data');

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(...a)    { console.log('[extract]', ...a); }
function detail(...a) { if (VERBOSE) console.log('[extract:verbose]', ...a); }

// ---------------------------------------------------------------------------
// Bracket-walker
// Finds the start of `const NAME = ` and walks forward to the matching
// bracket, returning the raw text of the literal (including the opener).
// Handles JS line comments, block comments, all three string delimiters,
// and escaped characters.  Does NOT eval anything.
// ---------------------------------------------------------------------------

function findLiteralText(src, constName) {
  const re = new RegExp(`(?:^|\\n)[ \\t]*const\\s+${constName}\\s*=\\s*`, 'm');
  const m  = re.exec(src);
  if (!m) throw new Error(`const ${constName} not found in app.js`);

  const openerIdx = m.index + m[0].length;
  const opener    = src[openerIdx];
  if (opener !== '[' && opener !== '{') {
    throw new Error(`const ${constName}: expected '[' or '{', got '${opener}'`);
  }

  let depth    = 0;
  let i        = openerIdx;
  let inString = false;
  let strChar  = '';
  let escaped  = false;
  let inLine   = false;
  let inBlock  = false;

  while (i < src.length) {
    const ch   = src[i];
    const next = src[i + 1];

    if (escaped)                              { escaped = false; i++; continue; }
    if (ch === '\\' && inString)              { escaped = true;  i++; continue; }
    if (inString) {
      if (ch === strChar)                       inString = false;
      i++; continue;
    }
    if (inLine)  { if (ch === '\n') inLine = false;                  i++; continue; }
    if (inBlock) { if (ch === '*' && next === '/') { inBlock = false; i += 2; } else i++; continue; }

    if (ch === '/' && next === '/')           { inLine  = true; i += 2; continue; }
    if (ch === '/' && next === '*')           { inBlock = true; i += 2; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inString = true; strChar = ch; i++; continue; }

    if (ch === '[' || ch === '{' || ch === '(') depth++;
    if (ch === ']' || ch === '}' || ch === ')') {
      depth--;
      if (depth === 0) { i++; break; }
    }
    i++;
  }

  if (depth !== 0) throw new Error(`Unbalanced brackets for const ${constName} (depth=${depth} at end)`);

  const text = src.slice(openerIdx, i);
  detail(`${constName}: literal is ${text.length} chars (char ${openerIdx}–${i})`);
  return text;
}

// ---------------------------------------------------------------------------
// Parse with json5 (no eval / vm / new Function)
// ---------------------------------------------------------------------------

function parseLiteral(text, name) {
  try {
    return JSON5.parse(text);
  } catch (err) {
    throw new Error(`json5.parse failed for ${name}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

log(`Reading ${APP_JS} …`);
const src = fs.readFileSync(APP_JS, 'utf8');
log(`Read ${(src.length / 1024).toFixed(0)} KB`);

// --- Extract and parse each const ---

const racquetsText  = findLiteralText(src, 'RACQUETS');
const stringsText   = findLiteralText(src, 'STRINGS');
const frameMetaText = findLiteralText(src, 'FRAME_META');

const RACQUETS  = parseLiteral(racquetsText,  'RACQUETS');
const STRINGS   = parseLiteral(stringsText,   'STRINGS');
const FRAME_META = parseLiteral(frameMetaText, 'FRAME_META');

log(`RACQUETS:   ${RACQUETS.length} entries`);
log(`STRINGS:    ${STRINGS.length} entries`);
log(`FRAME_META: ${Object.keys(FRAME_META).length} keys`);

// --- Merge FRAME_META into each frame as _meta ---
// Frames without a FRAME_META entry get the zero default.

const DEFAULT_META = { aeroBonus: 0, comfortTech: 0, spinTech: 0, genBonus: 0 };

const frames = RACQUETS.map(frame => {
  const meta = FRAME_META[frame.id];
  if (!meta && VERBOSE) {
    detail(`frame '${frame.id}' has no FRAME_META entry — using defaults`);
  }
  return { ...frame, _meta: meta ? { ...meta } : { ...DEFAULT_META } };
});

// Report any FRAME_META keys with no matching frame
const frameIds = new Set(RACQUETS.map(f => f.id));
for (const key of Object.keys(FRAME_META)) {
  if (!frameIds.has(key)) {
    log(`WARNING: FRAME_META key '${key}' has no matching RACQUETS entry`);
  }
}

// --- Write output ---

fs.mkdirSync(OUT_DIR, { recursive: true });

const outFrames  = path.join(OUT_DIR, 'frames.json');
const outStrings = path.join(OUT_DIR, 'strings.json');

fs.writeFileSync(outFrames,  JSON.stringify(frames,  null, 2));
fs.writeFileSync(outStrings, JSON.stringify(STRINGS, null, 2));

log(`Wrote ${outFrames}  (${frames.length} frames, each with _meta)`);
log(`Wrote ${outStrings} (${STRINGS.length} strings)`);

// Remove stale separate frame_meta.json if present
const oldFrameMeta = path.join(OUT_DIR, 'frame_meta.json');
if (fs.existsSync(oldFrameMeta)) {
  fs.unlinkSync(oldFrameMeta);
  log(`Removed stale ${oldFrameMeta}`);
}

log('Done.');
