import assert from 'node:assert/strict';

import {
  deriveFriction,
  deriveRotationalResistance,
  computePairingAffinity,
} from '../src/engine/pairingAffinity.js';
import { calcHybridInteraction } from '../src/engine/hybrid.js';
import type { StringData } from '../src/engine/types.js';

function test(name: string, run: () => void): void {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

// ── Helpers ──

/** Minimal StringData stub for testing. */
function makeString(overrides: Partial<StringData> & { id: string }): StringData {
  return {
    name: overrides.id,
    gauge: '16 (1.30mm)',
    gaugeNum: 1.30,
    material: 'Polyester',
    shape: 'Round',
    stiffness: 200,
    tensionLoss: 25,
    spinPotential: 7.0,
    twScore: { power: 60, spin: 70, comfort: 60, control: 70, feel: 65, playabilityDuration: 80, durability: 80 },
    ...overrides,
  };
}

// ============================================
// deriveFriction — physical ordering tests
// ============================================

test('friction: round-slick < round < round-textured < hexagonal < square < square-sharp', () => {
  const roundSlick = deriveFriction(makeString({ id: 'a', shape: 'Round (ultra-slick)', spinPotential: 6.0 }));
  const round = deriveFriction(makeString({ id: 'b', shape: 'Round', spinPotential: 6.0 }));
  const roundTextured = deriveFriction(makeString({ id: 'c', shape: 'Round (textured)', spinPotential: 6.0 }));
  const hex = deriveFriction(makeString({ id: 'd', shape: 'Hexagonal', spinPotential: 6.0 }));
  const square = deriveFriction(makeString({ id: 'e', shape: 'Square', spinPotential: 6.0 }));
  const squareSharp = deriveFriction(makeString({ id: 'f', shape: 'Square (4 ultra-sharp edges)', spinPotential: 6.0 }));

  assert.ok(roundSlick < round, `round-slick (${roundSlick}) should be < round (${round})`);
  assert.ok(round < roundTextured, `round (${round}) should be < round-textured (${roundTextured})`);
  assert.ok(roundTextured < hex, `round-textured (${roundTextured}) should be < hex (${hex})`);
  assert.ok(hex < square, `hex (${hex}) should be < square (${square})`);
  assert.ok(square < squareSharp, `square (${square}) should be < square-sharp (${squareSharp})`);
});

test('friction: round-coated is between round-slick and round-plain', () => {
  const slick = deriveFriction(makeString({ id: 'a', shape: 'Round (ultra-slick)', spinPotential: 6.0 }));
  const coated = deriveFriction(makeString({ id: 'b', shape: 'Round (coated)', spinPotential: 6.0 }));
  const plain = deriveFriction(makeString({ id: 'c', shape: 'Round', spinPotential: 6.0 }));

  assert.ok(slick < coated, `slick (${slick}) should be < coated (${coated})`);
  assert.ok(coated < plain, `coated (${coated}) should be < plain (${plain})`);
});

test('friction: higher spinPotential increases friction for same shape', () => {
  const lowSpin = deriveFriction(makeString({ id: 'a', shape: 'Hexagonal', spinPotential: 5.0 }));
  const highSpin = deriveFriction(makeString({ id: 'b', shape: 'Hexagonal', spinPotential: 9.0 }));

  assert.ok(highSpin > lowSpin, `high spin (${highSpin}) should be > low spin (${lowSpin})`);
});

test('friction: octagonal < pentagonal (more sides = less friction)', () => {
  const oct = deriveFriction(makeString({ id: 'a', shape: 'Octagonal', spinPotential: 7.0 }));
  const pent = deriveFriction(makeString({ id: 'b', shape: 'Pentagon/5-sided', spinPotential: 7.0 }));

  assert.ok(oct < pent, `octagonal (${oct}) should be < pentagonal (${pent})`);
});

// ============================================
// deriveRotationalResistance — physical ordering
// ============================================

test('rotational resistance: round < octagonal < hexagonal < pentagonal < square < star', () => {
  const round = deriveRotationalResistance('Round');
  const oct = deriveRotationalResistance('Octagonal');
  const hex = deriveRotationalResistance('Hexagonal');
  const pent = deriveRotationalResistance('Pentagonal (5-sided)');
  const square = deriveRotationalResistance('Square');
  const star = deriveRotationalResistance('Six-pointed Star');

  assert.ok(round < oct, `round (${round}) should be < oct (${oct})`);
  assert.ok(oct < hex, `oct (${oct}) should be < hex (${hex})`);
  assert.ok(hex < pent, `hex (${hex}) should be < pent (${pent})`);
  assert.ok(pent < square, `pent (${pent}) should be < square (${square})`);
  assert.ok(square < star, `square (${square}) should be < star (${star})`);
});

test('rotational resistance: empty/unknown shape falls back to round-like', () => {
  assert.equal(deriveRotationalResistance(''), 0.10);
  assert.equal(deriveRotationalResistance('Unknown Shape'), 0.10);
});

// ============================================
// computePairingAffinity — structural tests
// ============================================

test('affinity: all dimension scores are in [0, 1]', () => {
  const mains = makeString({ id: 'mains', shape: 'Square (4 ultra-sharp edges)', stiffness: 220, spinPotential: 8.5 });
  const crosses = makeString({ id: 'crosses', shape: 'Round (coated)', stiffness: 180, spinPotential: 5.5 });
  const a = computePairingAffinity(mains, crosses);

  for (const [key, val] of Object.entries(a)) {
    assert.ok(val >= 0 && val <= 1, `${key} = ${val} should be in [0, 1]`);
  }
});

test('affinity: identical strings produce a defined moderate score', () => {
  const s = makeString({ id: 'same', shape: 'Hexagonal', stiffness: 200, spinPotential: 7.0 });
  const a = computePairingAffinity(s, s);

  assert.ok(a.total >= 0.2 && a.total <= 0.7,
    `identical string affinity (${a.total.toFixed(3)}) should be moderate`);
  // Stiffness differential at gap=0 should be suboptimal but not zero
  assert.ok(a.stiffnessDifferential > 0 && a.stiffnessDifferential < 0.6,
    `stiffness diff at gap=0 (${a.stiffnessDifferential.toFixed(3)}) should be low-moderate`);
});

test('affinity: lower cross friction increases friction interaction score', () => {
  const mains = makeString({ id: 'mains', shape: 'Square', stiffness: 210, spinPotential: 8.0 });
  const slickCross = makeString({ id: 'slick', shape: 'Round (ultra-slick)', stiffness: 190, spinPotential: 6.0 });
  const grippyCross = makeString({ id: 'grippy', shape: 'Square', stiffness: 190, spinPotential: 6.0 });

  const aSlick = computePairingAffinity(mains, slickCross);
  const aGrippy = computePairingAffinity(mains, grippyCross);

  assert.ok(aSlick.frictionInteraction > aGrippy.frictionInteraction,
    `slick cross friction (${aSlick.frictionInteraction.toFixed(3)}) should be > grippy cross (${aGrippy.frictionInteraction.toFixed(3)})`);
});

test('affinity: optimal stiffness gap scores higher than zero gap', () => {
  const mains = makeString({ id: 'mains', stiffness: 224 }); // pool mean + 1 stddev
  const optimalCross = makeString({ id: 'opt', stiffness: 200 }); // ~24 gap
  const equalCross = makeString({ id: 'eq', stiffness: 224 });   // 0 gap

  const aOpt = computePairingAffinity(mains, optimalCross);
  const aEq = computePairingAffinity(mains, equalCross);

  assert.ok(aOpt.stiffnessDifferential > aEq.stiffnessDifferential,
    `optimal gap (${aOpt.stiffnessDifferential.toFixed(3)}) should be > zero gap (${aEq.stiffnessDifferential.toFixed(3)})`);
});

test('affinity: cross stiffer than mains scores lower than equal stiffness', () => {
  const mains = makeString({ id: 'mains', stiffness: 190 });
  const stifferCross = makeString({ id: 'stiff', stiffness: 220 }); // cross stiffer
  const equalCross = makeString({ id: 'eq', stiffness: 190 });

  const aStiff = computePairingAffinity(mains, stifferCross);
  const aEq = computePairingAffinity(mains, equalCross);

  assert.ok(aStiff.stiffnessDifferential < aEq.stiffnessDifferential,
    `stiffer cross (${aStiff.stiffnessDifferential.toFixed(3)}) should be < equal (${aEq.stiffnessDifferential.toFixed(3)})`);
});

test('affinity: round cross scores higher on geometry than square cross', () => {
  const mains = makeString({ id: 'mains', shape: 'Square', stiffness: 210 });
  const roundCross = makeString({ id: 'round', shape: 'Round', stiffness: 190 });
  const squareCross = makeString({ id: 'square', shape: 'Square', stiffness: 190 });

  const aRound = computePairingAffinity(mains, roundCross);
  const aSquare = computePairingAffinity(mains, squareCross);

  assert.ok(aRound.geometryInteraction > aSquare.geometryInteraction,
    `round cross geometry (${aRound.geometryInteraction.toFixed(3)}) should be > square cross (${aSquare.geometryInteraction.toFixed(3)})`);
});

// ============================================
// calcHybridInteraction integration
// ============================================

test('hybrid integration: poly+poly Case 2 includes _affinityBreakdown', () => {
  const mains = makeString({ id: 'mains', material: 'Polyester', shape: 'Square', stiffness: 210 });
  const crosses = makeString({ id: 'crosses', material: 'Polyester', shape: 'Round', stiffness: 185 });

  const mods = calcHybridInteraction(mains, crosses);
  assert.ok(mods._affinityBreakdown, 'poly+poly should populate _affinityBreakdown');
  assert.ok(mods._affinityBreakdown!.total > 0, 'affinity total should be > 0');
});

test('hybrid integration: gut+poly Case 1 has no _affinityBreakdown', () => {
  const gutMains = makeString({ id: 'gut', material: 'Natural Gut', shape: 'Round', stiffness: 130 });
  const polyCross = makeString({ id: 'poly', material: 'Polyester', shape: 'Round', stiffness: 200 });

  const mods = calcHybridInteraction(gutMains, polyCross);
  assert.equal(mods._affinityBreakdown, undefined,
    'gut+poly should not have _affinityBreakdown');
});

test('hybrid integration: different crosses produce different deltas for same mains', () => {
  const mains = makeString({ id: 'mains', material: 'Polyester', shape: 'Square (4 ultra-sharp edges)', stiffness: 210, spinPotential: 8.0 });
  const roundSoftCross = makeString({ id: 'soft', material: 'Polyester', shape: 'Round (coated)', stiffness: 180, spinPotential: 6.0 });
  const squareStiffCross = makeString({ id: 'stiff', material: 'Polyester', shape: 'Square', stiffness: 220, spinPotential: 8.5 });

  const modsA = calcHybridInteraction(mains, roundSoftCross);
  const modsB = calcHybridInteraction(mains, squareStiffCross);

  // The round soft cross should produce better affinity (lower friction, good stiffness gap, low resistance)
  assert.ok(modsA._affinityBreakdown!.total > modsB._affinityBreakdown!.total,
    `round-soft cross affinity (${modsA._affinityBreakdown!.total.toFixed(3)}) should be > square-stiff (${modsB._affinityBreakdown!.total.toFixed(3)})`);

  // Spin deltas should differ
  assert.notEqual(modsA.spinMod, modsB.spinMod,
    'spin mods should differ between crosses with different affinity');
});

test('hybrid integration: Co-Polyester (elastic) triggers Case 2 affinity', () => {
  const mains = makeString({ id: 'mains', material: 'Co-Polyester (elastic)', shape: 'Round', stiffness: 180 });
  const crosses = makeString({ id: 'crosses', material: 'Polyester', shape: 'Round', stiffness: 195 });

  const mods = calcHybridInteraction(mains, crosses);
  assert.ok(mods._affinityBreakdown, 'elastic poly + poly should populate _affinityBreakdown');
});

console.log('\nAll pairing affinity tests passed.');
