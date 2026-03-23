'use strict';
const fs    = require('fs');
const path  = require('path');
const { spawnSync } = require('child_process');

const ROOT        = path.resolve(__dirname, '../..');
const DATA_DIR    = path.join(ROOT, 'pipeline', 'data');
const OUT_FILE    = path.join(ROOT, 'data.js');
const CANARY_SCRIPT = path.join(ROOT, 'pipeline', 'scripts', 'canary-test.js');

const PIPELINE_FIELDS = ['_provenance', '_meta', 'brand', '_staging'];

function stripPipelineFields(obj) {
  const result = { ...obj };
  for (const field of PIPELINE_FIELDS) delete result[field];
  return result;
}

function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const isVerify = process.argv.includes('--verify');

  const frames  = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'frames.json'),  'utf8'));
  const strings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'strings.json'), 'utf8'));

  const RACQUETS = frames.map(stripPipelineFields);
  const STRINGS  = strings.map(stripPipelineFields);

  const FRAME_META = {};
  for (const frame of frames) {
    if (frame._meta) FRAME_META[frame.id] = frame._meta;
  }

  const output = [
    `const RACQUETS = ${JSON.stringify(RACQUETS, null, 2)};`,
    '',
    `const STRINGS = ${JSON.stringify(STRINGS, null, 2)};`,
    '',
    `const FRAME_META = ${JSON.stringify(FRAME_META, null, 2)};`,
    ''
  ].join('\n');

  if (isDryRun) {
    process.stdout.write(output);
    console.error(`\n[dry-run] ${RACQUETS.length} frames, ${STRINGS.length} strings, ${Object.keys(FRAME_META).length} frame meta entries`);
    return;
  }

  fs.writeFileSync(OUT_FILE, output);
  console.log(`✓ data.js written — ${RACQUETS.length} frames, ${STRINGS.length} strings, ${Object.keys(FRAME_META).length} frame meta entries`);

  if (isVerify) {
    console.log('\nRunning canary verification...');
    const result = spawnSync('node', [CANARY_SCRIPT], { stdio: 'inherit' });
    if (result.status !== 0) {
      console.error('\n✗ Canary verification failed');
      process.exit(1);
    }
  }
}

main();
