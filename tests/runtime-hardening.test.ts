import assert from 'node:assert/strict';

import {
  getRefreshPlan,
  type ViewChangeSet,
} from '../src/runtime/coordinator.js';
import {
  normalizeCompareSlots,
  reconcileDockEditorContext,
  validateDomContracts,
  validateWindowBindings,
} from '../src/runtime/contracts.js';

function test(name: string, run: () => void): void {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function plan(mode: string, changed: ViewChangeSet) {
  return getRefreshPlan(mode, changed);
}

test('active loadout change refreshes only dock surfaces when overview is React-owned', () => {
  assert.deepEqual(plan('overview', { activeLoadout: true }), {
    dockPanel: true,
    dockContext: true,
    overview: false,
    tune: false,
    compare: false,
    compendium: false,
  });
});

test('mode switch to compare refreshes compare and dock context only', () => {
  assert.deepEqual(plan('compare', { mode: true }), {
    dockPanel: false,
    dockContext: true,
    overview: false,
    tune: false,
    compare: true,
    compendium: false,
  });
});

test('saved loadout change avoids recomputing active mode surface', () => {
  assert.deepEqual(plan('compare', { savedLoadouts: true }), {
    dockPanel: true,
    dockContext: true,
    overview: false,
    tune: false,
    compare: false,
    compendium: false,
  });
});

test('active loadout change in compendium mode schedules compendium sync', () => {
  assert.deepEqual(plan('compendium', { activeLoadout: true }), {
    dockPanel: true,
    dockContext: true,
    overview: false,
    tune: false,
    compare: false,
    compendium: true,
  });
});

test('missing DOM ids are reported by contract validator', () => {
  const result = validateDomContracts(
    ['present', 'missing'],
    (id) => (id === 'present' ? ({} as HTMLElement) : null),
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['missing']);
});

test('missing window bindings are reported by binding validator', () => {
  const result = validateWindowBindings(['ok', 'missing'], {
    ok: () => undefined,
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['missing']);
});

test('invalid compare-slot dock context falls back to compare overview', () => {
  const context = reconcileDockEditorContext(
    { kind: 'compare-slot', slotId: 'b' },
    [{ id: 'a' }],
  );
  assert.deepEqual(context, { kind: 'compare-overview' });
});

test('compare slots without stats are normalized back to empty', () => {
  const normalized = normalizeCompareSlots([
    { id: 'a', loadout: { id: 'l1' }, stats: null },
    { id: 'b', loadout: null, stats: null },
  ]);
  assert.equal(normalized[0]?.loadout, null);
  assert.equal(normalized[0]?.stats, null);
  assert.equal(normalized[1]?.loadout, null);
});

console.log('Runtime hardening tests completed.');
