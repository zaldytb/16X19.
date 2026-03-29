// @ts-nocheck

'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { predictSetup, computeCompositeScore, buildTensionContext, generateIdentity } from '../../src/engine/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT        = path.resolve(__dirname, '../..');
const FRAMES_FILE = path.join(ROOT, 'pipeline', 'data', 'frames.json');
const STRINGS_FILE= path.join(ROOT, 'pipeline', 'data', 'strings.json');
const CANARY_FILE = path.join(ROOT, 'pipeline', 'data', 'canaries.json');

const OBS_TOLERANCE = 3;

function main() {
  const isBaseline = process.argv.includes('--baseline');

  // Engine functions imported from src/engine/index.ts
  const frames  = JSON.parse(fs.readFileSync(FRAMES_FILE,  'utf8'));
  const strings = JSON.parse(fs.readFileSync(STRINGS_FILE, 'utf8'));
  const canaries = JSON.parse(fs.readFileSync(CANARY_FILE, 'utf8'));

  // Build lookup maps
  const framesMap  = {};
  const stringsMap = {};
  const frameMeta  = {};
  for (const f of frames)  { framesMap[f.id]  = f; if (f._meta) frameMeta[f.id] = f._meta; }
  for (const s of strings) { stringsMap[s.id] = s; }

  let allPass = true;

  console.log(isBaseline ? '\nRecording canary baselines...' : '\nRunning canary checks...');

  for (const canary of canaries) {
    const racquet = framesMap[canary.frameId];
    if (!racquet) {
      console.log(`  ERROR  ${canary.name}: frame not found — ${canary.frameId}`);
      allPass = false;
      continue;
    }

    let config;
    if (canary.isHybrid) {
      const mains   = stringsMap[canary.mainsId];
      const crosses = stringsMap[canary.crossesId];
      if (!mains)   { console.log(`  ERROR  ${canary.name}: mains string not found — ${canary.mainsId}`);   allPass = false; continue; }
      if (!crosses) { console.log(`  ERROR  ${canary.name}: crosses string not found — ${canary.crossesId}`); allPass = false; continue; }
      config = { isHybrid: true, mains, crosses, mainsTension: canary.mainsTension, crossesTension: canary.crossesTension };
    } else {
      const string = stringsMap[canary.stringId];
      if (!string) { console.log(`  ERROR  ${canary.name}: string not found — ${canary.stringId}`); allPass = false; continue; }
      config = { isHybrid: false, string, mainsTension: canary.mainsTension, crossesTension: canary.crossesTension };
    }

    const stats    = predictSetup(racquet, config, frameMeta);
    const tensCtx  = buildTensionContext(config, racquet);
    const obs      = computeCompositeScore(stats, tensCtx);
    const identity = generateIdentity(stats, racquet, config);
    const archetype = identity.archetype;

    if (isBaseline) {
      canary.baseline = { obs: parseFloat(obs.toFixed(1)), archetype };
      console.log(`  RECORDED  ${canary.name}: OBS=${obs.toFixed(1)}, archetype="${archetype}"`);
    } else {
      if (!canary.baseline) {
        console.log(`  ERROR  ${canary.name}: no baseline recorded — run --baseline first`);
        allPass = false;
        continue;
      }
      const obsDiff = Math.abs(obs - canary.baseline.obs);
      const obsOk   = obsDiff <= OBS_TOLERANCE;
      const archOk  = archetype === canary.baseline.archetype;
      const pass    = obsOk && archOk;
      if (!pass) allPass = false;

      const status = pass ? 'PASS' : 'FAIL';
      let detail = `OBS=${obs.toFixed(1)} (baseline ${canary.baseline.obs}, diff ${obsDiff.toFixed(1)})`;
      if (!archOk) detail += ` | archetype="${archetype}" (expected "${canary.baseline.archetype}")`;
      console.log(`  ${status.padEnd(4)}  ${canary.name}: ${detail}`);
    }
  }

  if (isBaseline) {
    fs.writeFileSync(CANARY_FILE, JSON.stringify(canaries, null, 2));
    console.log(`\n✓ Baselines recorded for ${canaries.length} canaries`);
  } else {
    if (allPass) {
      console.log(`\n✓ All ${canaries.length} canaries PASS`);
    } else {
      console.log(`\n✗ One or more canaries FAILED`);
      process.exit(1);
    }
  }
}

main();
