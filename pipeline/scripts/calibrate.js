'use strict';
// Estimation coefficient calibration script
// Fits linear models for twScore sub-fields (power, control, playabilityDuration)
// against the string database using OLS regression.
//
// Re-run this when:
// - You've added 20+ new strings with actual TWU data
// - estimate.js accuracy test shows any sub-field MAE > 12
//
// Usage: node pipeline/scripts/calibrate.js
// Output: fitted coefficients to paste into estimate.js

const fs   = require('fs');
const path = require('path');

const STRINGS_FILE = path.join(__dirname, '../data/strings.json');

const MAT_MAP = {
  'Polyester':              'Poly',
  'Co-Polyester (elastic)': 'CoPoly',
  'Multifilament':          'Multi',
  'Natural Gut':            'Gut',
  'Synthetic Gut':          'SynGut'
};

// ─── Gaussian elimination solver (Ax = b) ────────────────────────────────────

function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    if (Math.abs(M[col][col]) < 1e-12) throw new Error(`Singular matrix at col ${col}`);

    for (let row = col + 1; row < n; row++) {
      const f = M[row][col] / M[col][col];
      for (let k = col; k <= n; k++) M[row][k] -= f * M[col][k];
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i];
  }
  return x;
}

// ─── OLS (X is n×p, y is n) ──────────────────────────────────────────────────

function ols(X, y) {
  const n = X.length, p = X[0].length;
  const XtX = Array.from({length: p}, () => new Array(p).fill(0));
  const Xty = new Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      Xty[j] += X[i][j] * y[i];
      for (let k = 0; k < p; k++) XtX[j][k] += X[i][j] * X[i][k];
    }
  }
  return solve(XtX, Xty);
}

function mae(pred, actual) {
  const errs = pred.map((p, i) => Math.abs(p - actual[i]));
  return errs.reduce((a, b) => a + b, 0) / errs.length;
}

function predict(beta, X) {
  return X.map(row => row.reduce((s, v, i) => s + v * beta[i], 0));
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const strings = JSON.parse(fs.readFileSync(STRINGS_FILE, 'utf8'));
  const valid   = strings.filter(s =>
    s.twScore && s.material && s.stiffness != null && s.tensionLoss != null && s.spinPotential != null
  );
  console.log(`\nCalibrating against ${valid.length} strings\n`);

  const data = valid.map(s => {
    const mat = MAT_MAP[s.material] || 'Poly';
    return {
      stiffness:           s.stiffness,
      tensionLoss:         s.tensionLoss,
      spinPotential:       s.spinPotential,
      gaugeNum:            s.gaugeNum ?? 1.25,
      isCoPoly:            mat === 'CoPoly' ? 1 : 0,
      isMulti:             mat === 'Multi'  ? 1 : 0,
      isGut:               mat === 'Gut'    ? 1 : 0,
      isSynGut:            mat === 'SynGut' ? 1 : 0,
      // targets
      power:               s.twScore.power,
      control:             s.twScore.control,
      playabilityDuration: s.twScore.playabilityDuration
    };
  });

  // ── POWER ─────────────────────────────────────────────────────────────────
  // Features: intercept, stiffness, isCoPoly, isMulti, isGut, isSynGut
  // (Poly is the baseline material, no dummy)
  const powX = data.map(d => [1, d.stiffness, d.isCoPoly, d.isMulti, d.isGut, d.isSynGut]);
  const powY = data.map(d => d.power);
  const powB = ols(powX, powY);
  const [pw_int, pw_stiff, pw_CoPoly, pw_Multi, pw_Gut, pw_SynGut] = powB;
  const powPred = predict(powB, powX).map(v => clamp(v, 30, 95));
  const powMAE  = mae(powPred, powY);

  console.log('═══ POWER ═══════════════════════════════════════════════');
  console.log(`  ${pw_int.toFixed(3)} + stiffness × ${pw_stiff.toFixed(4)}`);
  console.log(`  Material offsets (vs Poly=0):`);
  console.log(`    CoPoly: ${pw_CoPoly.toFixed(2)},  Multi: ${pw_Multi.toFixed(2)},  Gut: ${pw_Gut.toFixed(2)},  SynGut: ${pw_SynGut.toFixed(2)}`);
  console.log(`  MAE (clamped [30,95]): ${powMAE.toFixed(1)}`);
  console.log();

  // Also try power with tensionLoss as an additional feature (some strings
  // with high TL retain more power via trampoline)
  const powX2 = data.map(d => [1, d.stiffness, d.tensionLoss, d.isCoPoly, d.isMulti, d.isGut, d.isSynGut]);
  const powB2 = ols(powX2, powY);
  const [pw2_int, pw2_stiff, pw2_tl, pw2_CoPoly, pw2_Multi, pw2_Gut, pw2_SynGut] = powB2;
  const powPred2 = predict(powB2, powX2).map(v => clamp(v, 30, 95));
  const powMAE2  = mae(powPred2, powY);

  console.log('═══ POWER (+ tensionLoss) ════════════════════════════════');
  console.log(`  ${pw2_int.toFixed(3)} + stiffness × ${pw2_stiff.toFixed(4)} + tensionLoss × ${pw2_tl.toFixed(4)}`);
  console.log(`  Material offsets: CoPoly: ${pw2_CoPoly.toFixed(2)},  Multi: ${pw2_Multi.toFixed(2)},  Gut: ${pw2_Gut.toFixed(2)},  SynGut: ${pw2_SynGut.toFixed(2)}`);
  console.log(`  MAE (clamped [30,95]): ${powMAE2.toFixed(1)}`);
  console.log();

  // ── CONTROL ───────────────────────────────────────────────────────────────
  // Features: intercept, stiffness, tensionLoss, isCoPoly, isMulti, isGut, isSynGut
  const ctrlX = data.map(d => [1, d.stiffness, d.tensionLoss, d.isCoPoly, d.isMulti, d.isGut, d.isSynGut]);
  const ctrlY = data.map(d => d.control);
  const ctrlB = ols(ctrlX, ctrlY);
  const [ct_int, ct_stiff, ct_tl, ct_CoPoly, ct_Multi, ct_Gut, ct_SynGut] = ctrlB;
  const ctrlPred = predict(ctrlB, ctrlX).map(v => clamp(v, 30, 98));
  const ctrlMAE  = mae(ctrlPred, ctrlY);

  console.log('═══ CONTROL ═════════════════════════════════════════════');
  console.log(`  ${ct_int.toFixed(3)} + stiffness × ${ct_stiff.toFixed(4)} + tensionLoss × ${ct_tl.toFixed(4)}`);
  console.log(`  Material offsets (vs Poly=0):`);
  console.log(`    CoPoly: ${ct_CoPoly.toFixed(2)},  Multi: ${ct_Multi.toFixed(2)},  Gut: ${ct_Gut.toFixed(2)},  SynGut: ${ct_SynGut.toFixed(2)}`);
  console.log(`  MAE (clamped [30,98]): ${ctrlMAE.toFixed(1)}`);
  console.log();

  // ── PLAYABILITY DURATION ──────────────────────────────────────────────────
  // Features: intercept, tensionLoss, isCoPoly, isMulti, isGut, isSynGut
  const playdX = data.map(d => [1, d.tensionLoss, d.isCoPoly, d.isMulti, d.isGut, d.isSynGut]);
  const playdY = data.map(d => d.playabilityDuration);
  const playdB = ols(playdX, playdY);
  const [pl_int, pl_tl, pl_CoPoly, pl_Multi, pl_Gut, pl_SynGut] = playdB;
  const playdPred = predict(playdB, playdX).map(v => clamp(v, 30, 98));
  const playdMAE  = mae(playdPred, playdY);

  console.log('═══ PLAYABILITY DURATION ════════════════════════════════');
  console.log(`  ${pl_int.toFixed(3)} + tensionLoss × ${pl_tl.toFixed(4)}`);
  console.log(`  Material offsets (vs Poly=0):`);
  console.log(`    CoPoly: ${pl_CoPoly.toFixed(2)},  Multi: ${pl_Multi.toFixed(2)},  Gut: ${pl_Gut.toFixed(2)},  SynGut: ${pl_SynGut.toFixed(2)}`);
  console.log(`  MAE (clamped [30,98]): ${playdMAE.toFixed(1)}`);
  console.log();

  // Also try playd with stiffness as additional feature
  const playdX2 = data.map(d => [1, d.tensionLoss, d.stiffness, d.isCoPoly, d.isMulti, d.isGut, d.isSynGut]);
  const playdB2 = ols(playdX2, playdY);
  const [pl2_int, pl2_tl, pl2_stiff, pl2_CoPoly, pl2_Multi, pl2_Gut, pl2_SynGut] = playdB2;
  const playdPred2 = predict(playdB2, playdX2).map(v => clamp(v, 30, 98));
  const playdMAE2  = mae(playdPred2, playdY);

  console.log('═══ PLAYABILITY DURATION (+ stiffness) ═════════════════');
  console.log(`  ${pl2_int.toFixed(3)} + tensionLoss × ${pl2_tl.toFixed(4)} + stiffness × ${pl2_stiff.toFixed(4)}`);
  console.log(`  Material offsets: CoPoly: ${pl2_CoPoly.toFixed(2)},  Multi: ${pl2_Multi.toFixed(2)},  Gut: ${pl2_Gut.toFixed(2)},  SynGut: ${pl2_SynGut.toFixed(2)}`);
  console.log(`  MAE (clamped [30,98]): ${playdMAE2.toFixed(1)}`);
  console.log();

  // ── Per-string breakdown for worst-fitting fields ─────────────────────────
  console.log('\n── POWER per-string errors ──────────────────────────────');
  valid.forEach((s, i) => {
    const p = clamp(predict([powB2[0],powB2[1],powB2[2],powB2[3],powB2[4],powB2[5],powB2[6]], [powX2[i]])[0], 30, 95);
    const err = Math.abs(p - powY[i]);
    if (err > 8) console.log(`  ${s.id.padEnd(40)} pred=${p.toFixed(0).padStart(3)}, act=${powY[i]}, err=${err.toFixed(1)}`);
  });

  console.log('\n── CONTROL per-string errors ────────────────────────────');
  valid.forEach((s, i) => {
    const p = clamp(predict(ctrlB, [ctrlX[i]])[0], 30, 98);
    const err = Math.abs(p - ctrlY[i]);
    if (err > 8) console.log(`  ${s.id.padEnd(40)} pred=${p.toFixed(0).padStart(3)}, act=${ctrlY[i]}, err=${err.toFixed(1)}`);
  });

  console.log('\n── PLAYD per-string errors ──────────────────────────────');
  valid.forEach((s, i) => {
    const p = clamp(predict(playdB2, [playdX2[i]])[0], 30, 98);
    const err = Math.abs(p - playdY[i]);
    if (err > 8) console.log(`  ${s.id.padEnd(40)} pred=${p.toFixed(0).padStart(3)}, act=${playdY[i]}, err=${err.toFixed(1)}`);
  });
}

main();
