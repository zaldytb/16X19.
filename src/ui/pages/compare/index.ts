/**
 * Compare Page Main Module
 * Orchestrates the compare page functionality
 */

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Loadout, Racquet, StringData } from '../../../engine/types.js';
import { RACQUETS, STRINGS } from '../../../data/loader.js';
import { getActiveLoadout, getSavedLoadouts, getCurrentMode } from '../../../state/imperative.js';
import { getCurrentSetup } from '../../../state/setup-sync.js';
import { saveLoadout } from '../../../state/loadout.js';
import type { SlotId, Slot } from './types.js';
import { SLOT_COLORS } from './types.js';
import {
  getState,
  subscribe,
  setSlotLoadout,
  clearSlot,
  setEditingSlot,
  getConfiguredSlots,
  getFirstEmptySlot,
} from './hooks/useCompareState.js';
import { updateRadarChart } from './components/RadarChart.js';
import { getCachedValue, measurePerformance } from '../../../utils/performance-runtime.js';
import {
  registerCompareRuntimeCallbacks,
} from '../compare-runtime-bridge.js';
import {
  addLoadoutToSlot,
  toTrackedCompareLoadout,
  addLoadoutToNextAvailableSlot,
  addLoadoutToPreferredSlot,
} from './compare-slot-api.js';
import { buildCompareDiffBatteryViewModel } from './compare-diff-battery-vm.js';
import { buildCompareSlotGridViewModel } from './compare-slot-grid-vm.js';
import { CompareDiffBattery } from '../../../components/compare/CompareDiffBattery.js';
import { CompareRadarChart } from '../../../components/compare/CompareRadarChart.js';
import { CompareSlotGrid } from '../../../components/compare/CompareSlotGrid.js';
import { CompareSlotEditorModal } from '../../../components/compare/CompareSlotEditorModal.js';
import { CompareQuickAddPrompt } from '../../../components/compare/CompareQuickAddPrompt.js';

// ---------------------------------------------------------------------------
// Shell callbacks — registered by shell.ts to avoid circular static imports.
// ---------------------------------------------------------------------------
type CompareShellCallbacks = {
  activateLoadout?: (loadout: Loadout) => void;
  switchMode?: (mode: string) => void;
  renderDockContextPanel?: () => void;
};

let _shellCbs: CompareShellCallbacks = {};

export function registerCompareShellCallbacks(cbs: CompareShellCallbacks): void {
  _shellCbs = { ..._shellCbs, ...cbs };
}

// Container IDs
const CONTAINER_SLOTS = 'compare-slots-container';
const CONTAINER_RADAR = 'compare-radar-container';
const CONTAINER_DIFF = 'compare-diff-container';
const CONTAINER_EDITOR = 'compare-editor-container';
const CONTAINER_QA = 'compare-qa-host';

type CompareReactMount = { root: Root | null; host: HTMLElement | null };

function _ensureCompareReactRoot(mount: CompareReactMount, container: HTMLElement | null): Root | null {
  if (!container) return null;
  if (mount.root && mount.host) {
    if (mount.host !== container || !mount.host.isConnected) {
      mount.root.unmount();
      mount.root = null;
      mount.host = null;
    }
  }
  if (!mount.root) {
    mount.root = createRoot(container);
    mount.host = container;
  }
  return mount.root;
}

const _compareSlotsMount: CompareReactMount = { root: null, host: null };
const _compareRadarMount: CompareReactMount = { root: null, host: null };
const _compareDiffMount: CompareReactMount = { root: null, host: null };
const _compareEditorMount: CompareReactMount = { root: null, host: null };
const _compareQaMount: CompareReactMount = { root: null, host: null };

function _unmountCompareReactMount(mount: CompareReactMount): void {
  if (mount.root) {
    mount.root.unmount();
    mount.root = null;
    mount.host = null;
  }
}

// State tracking
let _unsubscribe: (() => void) | null = null;
let _currentState = getState();
let _showAllStats = false;
let _quickAddVisible = false;
let _qaTension = 53;
const compareRacquets = RACQUETS as unknown as Racquet[];
const compareStrings = STRINGS as unknown as StringData[];
let _lastSlotsRenderKey = '';
let _lastRadarRenderKey = '';
let _lastDiffRenderKey = '';
let _delegateBound = false;

type CompareLoadout = Loadout & {
  sourceLoadoutId?: string | null;
  snapshotObs?: number;
};

/**
 * Initialize the compare page
 */
export function initComparePage(): void {
  if (_unsubscribe) _unsubscribe();
  _unsubscribe = subscribe(handleStateChange);

  render();

  _bindCompareDelegates();
}

/**
 * Cleanup when leaving compare page
 */
export function cleanupComparePage(): void {
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
  _unmountCompareReactMount(_compareSlotsMount);
  _unmountCompareReactMount(_compareRadarMount);
  _unmountCompareReactMount(_compareDiffMount);
  _unmountCompareReactMount(_compareEditorMount);
  _unmountCompareReactMount(_compareQaMount);
  _quickAddVisible = false;
  _lastSlotsRenderKey = '';
  _lastRadarRenderKey = '';
  _lastDiffRenderKey = '';
}

function handleStateChange(state: typeof _currentState): void {
  _currentState = state;
  render();
}

function render(): void {
  renderSlots();
  renderRadar();
  renderDiff();
  renderEditor();
}
function getStructuralSlotsKey(): string {
  return (
    _currentState.slots.map((slot) => `${slot.id}:${slot.loadout?.id || 'empty'}`).join('|') +
    `|editing:${_currentState.editingSlotId || 'none'}`
  );
}

function getConfiguredSlotsKey(): string {
  return getConfiguredSlots()
    .map((slot) => `${slot.id}:${slot.loadout?.id || 'empty'}:${slot.loadout?.obs || 0}`)
    .join('|');
}

function renderSlots(): void {
  const container = document.getElementById(CONTAINER_SLOTS);
  const root = _ensureCompareReactRoot(_compareSlotsMount, container);
  if (!root) return;

  const slots = _currentState.slots;
  const nextKey = getStructuralSlotsKey();
  const hasRenderedSlots = container!.children.length > 0;
  if (_lastSlotsRenderKey === nextKey && hasRenderedSlots) return;
  _lastSlotsRenderKey = nextKey;

  const items = buildCompareSlotGridViewModel(slots);
  root.render(
    createElement(CompareSlotGrid, {
      items,
      onAdd: addSlot,
      onEdit: editSlot,
      onRemove: removeSlot,
      onTune: tuneSlot,
      onSetActive: setActiveSlot,
      onSave: saveSlot,
    }),
  );
}

export function renderComparisonSlots(): void {
  renderSlots();
}

function renderRadar(): void {
  const container = document.getElementById(CONTAINER_RADAR);
  const root = _ensureCompareReactRoot(_compareRadarMount, container);
  if (!root) return;

  const configured = getConfiguredSlots();
  const radarKey = getConfiguredSlotsKey();

  if (configured.length === 0) {
    _lastRadarRenderKey = '';
    root.render(
      createElement(CompareRadarChart, {
        slots: [],
        radarKey: '',
      }),
    );
    return;
  }

  if (_lastRadarRenderKey !== radarKey) {
    measurePerformance('compare radar update', () => {
      root.render(
        createElement(CompareRadarChart, {
          slots: configured,
          radarKey,
        }),
      );
    });
    _lastRadarRenderKey = radarKey;
  } else {
    void updateRadarChart(configured);
  }
}

export function updateComparisonRadar(): void {
  renderRadar();
}

function toggleShowAll(): void {
  _showAllStats = !_showAllStats;
  renderDiff();
}

function renderDiff(): void {
  const container = document.getElementById(CONTAINER_DIFF);
  const root = _ensureCompareReactRoot(_compareDiffMount, container);
  if (!root) return;

  const configured = getConfiguredSlots();
  const diffKey = `${getConfiguredSlotsKey()}|showAll:${_showAllStats}`;

  if (configured.length < 2) {
    _lastDiffRenderKey = '';
    root.render(null);
    return;
  }

  const hasRenderedDiff = container!.children.length > 0;
  if (_lastDiffRenderKey === diffKey && hasRenderedDiff) return;

  const vm = measurePerformance('compare diff update', () =>
    buildCompareDiffBatteryViewModel(configured, 6, _showAllStats),
  );
  _lastDiffRenderKey = diffKey;

  root.render(
    createElement(CompareDiffBattery, {
      vm,
      onToggleShowAll: toggleShowAll,
    }),
  );
}

export function renderComparisonDeltas(): void {
  renderDiff();
}

export function renderCompareSummaries(): void {
  renderSlots();
}

export function renderCompareVerdict(): void {
  // Compare currently renders slot cards, radar, and diff battery only.
}

export function renderCompareMatrix(): void {
  // Compare currently renders slot cards, radar, and diff battery only.
}

export function getSlotColors() {
  return SLOT_COLORS;
}

function renderQuickAdd(): void {
  const container = document.getElementById(CONTAINER_QA);
  const root = _ensureCompareReactRoot(_compareQaMount, container);
  if (!root) return;

  if (!_quickAddVisible) {
    root.render(null);
    return;
  }

  const options = getCachedValue('compare:quick-add-options', () => ({
    racquets: compareRacquets.map((racquet) => ({ id: racquet.id, name: racquet.name })),
    strings: compareStrings.map((string) => ({ id: string.id, label: `${string.name} (${string.gauge})` })),
  }));

  root.render(
    createElement(CompareQuickAddPrompt, {
      racquets: options.racquets,
      strings: options.strings,
      tension: _qaTension,
      onTensionChange: (v: number) => {
        _qaTension = v;
      },
      onQuickAdd: quickAddFromPrompt,
    }),
  );
}

export function showQuickAddPrompt(): void {
  _quickAddVisible = true;
  renderQuickAdd();
}

export function quickAddFromPrompt(): void {
  const frameId = (document.getElementById('compare-qa-frame') as HTMLSelectElement | null)?.value || '';
  const stringId = (document.getElementById('compare-qa-string') as HTMLSelectElement | null)?.value || '';
  const tensionValue = (document.getElementById('compare-qa-tension') as HTMLInputElement | null)?.value || '53';
  const tension = parseInt(tensionValue, 10) || 53;
  if (!frameId || !stringId) return;

  const racquet = compareRacquets.find((item) => item.id === frameId);
  const string = compareStrings.find((item) => item.id === stringId);
  if (!racquet || !string) return;

  const quickLoadout: Loadout = {
    id: `compare-quick-${Date.now()}`,
    name: `${string.name} on ${racquet.name}`,
    frameId,
    stringId,
    isHybrid: false,
    mainsId: null,
    crossesId: null,
    mainsTension: tension,
    crossesTension: tension,
    gauge: null,
    mainsGauge: null,
    crossesGauge: null,
    obs: 0,
    stats: undefined,
  };

  addLoadoutToPreferredSlot(quickLoadout);
  _quickAddVisible = false;
  renderQuickAdd();
}

export function toggleComparisonMode(): void {
  const mode = getCurrentMode();
  _shellCbs.switchMode?.(mode === 'compare' ? 'overview' : 'compare');
}

export function addSlot(slotId: SlotId): void {
  setEditingSlot(slotId);
  renderEditor();
}

export function editSlot(slotId: SlotId): void {
  setEditingSlot(slotId);
  renderEditor();
}

export function removeSlot(slotId: SlotId): void {
  if (confirm('Remove this build from comparison?')) {
    clearSlot(slotId);
  }
}

export function addComparisonSlot(): void {
  const emptySlotId = getFirstEmptySlot();
  if (!emptySlotId) return;
  addSlot(emptySlotId);
}

function buildLoadoutFromCurrentSetup(): Loadout | null {
  const setup = getCurrentSetup();
  if (!setup) return null;

  return {
    id: `compare-${Date.now()}`,
    name: setup.stringConfig.isHybrid
      ? `${setup.stringConfig.mains.name} / ${setup.stringConfig.crosses.name} on ${setup.racquet.name}`
      : `${setup.stringConfig.string.name} on ${setup.racquet.name}`,
    frameId: setup.racquet.id,
    stringId: setup.stringConfig.isHybrid ? null : setup.stringConfig.string.id,
    isHybrid: !!setup.stringConfig.isHybrid,
    mainsId: setup.stringConfig.isHybrid ? setup.stringConfig.mains.id : null,
    crossesId: setup.stringConfig.isHybrid ? setup.stringConfig.crosses.id : null,
    mainsTension: setup.stringConfig.mainsTension,
    crossesTension: setup.stringConfig.crossesTension,
    gauge: null,
    mainsGauge: null,
    crossesGauge: null,
    obs: 0,
    stats: undefined,
  };
}

export function addComparisonSlotFromHome(): void {
  const activeLoadout = getActiveLoadout();
  if (activeLoadout) {
    const added = addLoadoutToNextAvailableSlot({ ...activeLoadout });
    if (added) return;
  }

  const currentSetupLoadout = buildLoadoutFromCurrentSetup();
  if (currentSetupLoadout) {
    const added = addLoadoutToNextAvailableSlot(currentSetupLoadout);
    if (added) return;
  }

  const emptySlotId = getFirstEmptySlot();
  if (emptySlotId) addSlot(emptySlotId);
}

export function removeComparisonSlot(slotIndex: number): void {
  const slot = getSlotByIndex(slotIndex);
  if (!slot) return;
  removeSlot(slot.id);
}

function getSlotById(slotId: SlotId): Slot | null {
  return _currentState.slots.find((slot) => slot.id === slotId) || null;
}

function getSlotByIndex(slotIndex: number): Slot | null {
  return _currentState.slots[slotIndex] || null;
}

export function tuneSlot(slotId: SlotId): void {
  const slot = getSlotById(slotId);
  if (!slot || slot.loadout === null) return;

  _shellCbs.activateLoadout?.({ ...slot.loadout, stats: slot.stats });
  _shellCbs.switchMode?.('tune');
}

export function setActiveSlot(slotId: SlotId): void {
  const slot = getSlotById(slotId);
  if (!slot || slot.loadout === null) return;

  _shellCbs.activateLoadout?.({ ...slot.loadout, stats: slot.stats });
  _shellCbs.switchMode?.('overview');
}

export function saveSlot(slotId: SlotId, button?: HTMLButtonElement | null): void {
  const slot = getSlotById(slotId);
  if (!slot || slot.loadout === null) return;

  saveLoadout({ ...slot.loadout, stats: slot.stats, _dirty: false });

  if (button) {
    const originalText = button.textContent || 'Save';
    button.textContent = 'Saved';
    button.classList.add('is-saved');
    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('is-saved');
    }, 1200);
  }
}

export { addLoadoutToNextAvailableSlot, addLoadoutToPreferredSlot };

export function recalcSlot(slotIndex: number): void {
  const slot = getSlotByIndex(slotIndex);
  if (!slot || slot.loadout === null) {
    render();
    return;
  }

  addLoadoutToSlot(slot.id, slot.loadout);
}

export function quickAddSaved(loadoutId: string): void {
  const loadout = getSavedLoadouts().find((item) => item.id === loadoutId);
  if (!loadout) return;

  const emptySlotId = getFirstEmptySlot();
  if (emptySlotId) {
    addLoadoutToSlot(emptySlotId, toTrackedCompareLoadout(loadout));
    return;
  }

  const editingSlotId = _currentState.editingSlotId || _currentState.slots[0]?.id;
  if (editingSlotId) {
    addLoadoutToSlot(editingSlotId, toTrackedCompareLoadout(loadout));
  }
}

export function autoFillFromSaved(): void {
  _currentState.slots.forEach((slot) => {
    clearSlot(slot.id);
  });

  const activeLoadout = getActiveLoadout();
  const savedLoadouts = getSavedLoadouts();
  const compareCandidates: Loadout[] = [];

  if (activeLoadout) compareCandidates.push({ ...activeLoadout });

  for (const loadout of savedLoadouts) {
    if (compareCandidates.length >= 3) break;
    if (activeLoadout && loadout.id === activeLoadout.id) continue;
    compareCandidates.push({ ...loadout });
  }

  if (compareCandidates.length < 2 && savedLoadouts.length > 0) {
    const first = savedLoadouts[0];
    const alreadyPresent = compareCandidates.some((candidate) => candidate.id === first.id);
    if (!alreadyPresent) compareCandidates.push({ ...first });
  }

  compareCandidates.slice(0, 3).forEach((candidate) => {
    addLoadoutToNextAvailableSlot(toTrackedCompareLoadout(candidate));
  });
}

export function compareLoadFromSaved(slotIndex: number, loadoutId: string): void {
  if (!loadoutId) return;
  const slot = getSlotByIndex(slotIndex);
  if (!slot) return;

  const saved = getSavedLoadouts().find((item) => item.id === loadoutId);
  if (!saved) return;

  addLoadoutToSlot(slot.id, toTrackedCompareLoadout(saved));
}

export function refreshCompareSlot(slotIndex: number): void {
  const slot = getSlotByIndex(slotIndex);
  if (!slot || slot.loadout === null) return;

  const trackedLoadout = slot.loadout as CompareLoadout;
  const sourceLoadoutId = trackedLoadout.sourceLoadoutId;
  if (!sourceLoadoutId) return;

  const activeLoadout = getActiveLoadout();
  if (activeLoadout?.id === sourceLoadoutId) {
    addLoadoutToSlot(slot.id, toTrackedCompareLoadout(activeLoadout));
    return;
  }

  const saved = getSavedLoadouts().find((item) => item.id === sourceLoadoutId);
  if (saved) {
    addLoadoutToSlot(slot.id, toTrackedCompareLoadout(saved));
  }
}

export function _toggleCompareCardEditor(slotIndex: number): void {
  const slot = getSlotByIndex(slotIndex);
  if (!slot) return;

  if (_currentState.editingSlotId === slot.id) {
    cancelEditor();
    return;
  }

  editSlot(slot.id);
}

function renderEditor(): void {
  const container = document.getElementById(CONTAINER_EDITOR);
  const root = _ensureCompareReactRoot(_compareEditorMount, container);
  if (!root) return;

  const editing = _currentState.editingSlotId;
  if (!editing) {
    root.render(null);
    return;
  }

  const slot = _currentState.slots.find((s) => s.id === editing);
  if (!slot) {
    root.render(null);
    return;
  }

  const activeLoadout = getActiveLoadout();
  const currentLoadout = slot.loadout || activeLoadout || null;

  root.render(
    createElement(CompareSlotEditorModal, {
      slotId: editing,
      currentLoadout,
      racquets: compareRacquets,
      strings: compareStrings,
      savedLoadouts: getSavedLoadouts(),
      onApply: (slotId: SlotId, loadout: Loadout) => {
        addLoadoutToSlot(slotId, loadout);
        cancelEditor();
      },
      onCancel: cancelEditor,
    }),
  );
}

export function cancelEditor(): void {
  setEditingSlot(null);
  renderEditor();
}

function _bindCompareDelegates(): void {
  if (_delegateBound) return;
  _delegateBound = true;

  document.addEventListener('click', (e: Event) => {
    const el = (e.target as Element).closest('[data-compare-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.compareAction!;
    const slotId = (el.dataset.slotId || '') as SlotId;
    const arg = el.dataset.compareArg;

    switch (action) {
      case 'add':
        addSlot(slotId);
        break;
      case 'edit':
        editSlot(slotId);
        break;
      case 'remove':
        removeSlot(slotId);
        break;
      case 'tune':
        tuneSlot(slotId);
        break;
      case 'setActive':
        setActiveSlot(slotId);
        break;
      case 'save': {
        const btn = el instanceof HTMLButtonElement ? el : null;
        saveSlot(slotId, btn);
        break;
      }
      case 'editorCancel':
        cancelEditor();
        break;
      case 'editorSave':
        break;
      case 'editorSetHybrid':
        void arg;
        break;
      case 'toggleShowAll':
        toggleShowAll();
        break;
      case 'quickAdd':
        quickAddFromPrompt();
        break;
    }
  });
}

registerCompareRuntimeCallbacks({
  initComparePage,
  renderComparisonSlots,
  renderCompareSummaries,
  renderCompareVerdict,
  renderCompareMatrix,
  updateComparisonRadar,
  renderComparisonDeltas,
  addComparisonSlotFromHome,
  showQuickAddPrompt,
  addSlot,
  editSlot,
  removeSlot,
  quickAddSaved,
  addComparisonSlot,
  registerCompareShellCallbacks,
});

// Export public API
export {
  getState,
  subscribe,
  setSlotLoadout,
  clearSlot,
  getConfiguredSlots,
};

// Re-export types
export type { SlotId, Slot, CompareSlot } from './types.js';
