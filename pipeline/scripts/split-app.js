// ⚠️  ONE-TIME MIGRATION SCRIPT — DO NOT RE-RUN
// This script removed RACQUETS, STRINGS, and FRAME_META data blocks from app.js
// during the initial pipeline setup, leaving only the engine + UI code.
// The data blocks have already been removed from app.js.
// Running this again will silently corrupt app.js (markers no longer exist).
// To regenerate data.js from JSON, use: npm run export

'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '../..');
const APP_JS = path.join(ROOT, 'app.js');

// Same bracket-matching state machine as extract.js.
// Returns the index of the matching closeChar.
function findClose(src, startIdx, openChar, closeChar) {
  let depth = 0, i = startIdx;
  let inString = false, stringChar = null;
  let inLineComment = false, inBlockComment = false;

  while (i < src.length) {
    const ch = src[i];
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
    } else if (inBlockComment) {
      if (ch === '*' && src[i + 1] === '/') { inBlockComment = false; i++; }
    } else if (inString) {
      if (ch === '\\') { i++; }
      else if (ch === stringChar) { inString = false; }
    } else {
      if      (ch === '/' && src[i + 1] === '/') { inLineComment = true; }
      else if (ch === '/' && src[i + 1] === '*') { inBlockComment = true; i++; }
      else if (ch === '"' || ch === "'" || ch === '`') { inString = true; stringChar = ch; }
      else if (ch === openChar)  { depth++; }
      else if (ch === closeChar) { depth--; if (depth === 0) return i; }
    }
    i++;
  }
  throw new Error(`No matching ${closeChar} found from index ${startIdx}`);
}

// Find [charStart, charEnd] for a data block.
// headerMarker: unique string that appears at the start of the comment header
// constMarker:  the "const X = " text
// openChar/closeChar: bracket pair
function findBlockRange(src, headerMarker, constMarker, openChar, closeChar) {
  const headerIdx = src.indexOf(headerMarker);
  if (headerIdx === -1) throw new Error(`Header marker not found: "${headerMarker}"`);

  const constIdx = src.indexOf(constMarker, headerIdx);
  if (constIdx === -1) throw new Error(`Const marker not found: "${constMarker}"`);

  const openIdx  = src.indexOf(openChar, constIdx + constMarker.length);
  const closeIdx = findClose(src, openIdx, openChar, closeChar);

  // End of block: after closeChar + ';' + '\n'
  let endIdx = closeIdx + 1; // past closeChar
  if (src[endIdx] === ';') endIdx++;
  if (src[endIdx] === '\n') endIdx++;

  return [headerIdx, endIdx];
}

function main() {
  let src = fs.readFileSync(APP_JS, 'utf8');

  // Block 3: FRAME_META — find via '\n// FRAME METADATA' prefix in src
  // The blank line before the header is part of the gap we want to consume too.
  const [fm_start, fm_end] = findBlockRange(
    src,
    '// ============================================\n// FRAME METADATA',
    'const FRAME_META = ',
    '{', '}'
  );
  // Include the preceding '\n' (blank line 3624) so we don't leave a stray blank.
  const fm_startAdj = fm_start > 0 && src[fm_start - 1] === '\n' ? fm_start - 1 : fm_start;

  // Block 2: STRINGS
  const [st_start, st_end] = findBlockRange(
    src,
    '// ============================================\n// DATA: STRINGS',
    'const STRINGS = ',
    '[', ']'
  );
  const st_startAdj = st_start > 0 && src[st_start - 1] === '\n' ? st_start - 1 : st_start;

  // Block 1: RACQUETS + the top-level lab header (always starts at position 0).
  const [, rq_end] = findBlockRange(
    src,
    '// TENNIS LOADOUT LAB',
    'const RACQUETS = ',
    '[', ']'
  );
  const rq_start = 0;

  console.log('Block ranges (character positions):');
  console.log(`  RACQUETS:   [0, ${rq_end})`);
  console.log(`  STRINGS:    [${st_startAdj}, ${st_end})`);
  console.log(`  FRAME_META: [${fm_startAdj}, ${fm_end})`);

  // Delete in reverse order (highest position first) to keep earlier offsets valid.
  src = src.slice(0, fm_startAdj) + src.slice(fm_end);
  src = src.slice(0, st_startAdj) + src.slice(st_end);
  src = src.slice(rq_end);            // remove block 1 (was at position 0)

  // Clean up any leading whitespace/blank lines, then prepend new header.
  src = src.trimStart();
  src = '// TENNIS LOADOUT LAB — Engine + UI\n' + src;

  fs.writeFileSync(APP_JS, src);

  const lineCount = src.split('\n').length;
  console.log(`\n✓ app.js rewritten — ${lineCount} lines (was 13004)`);
}

main();
