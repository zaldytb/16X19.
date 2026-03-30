/**
 * Compare Page Main Module
 * Orchestrates the compare page functionality
 */

import type { Loadout, Racquet, StringData } from '../../../engine/types.js';
import { buildTensionContext, computeCompositeScore, generateIdentity, predictSetup } from '../../../engine/index.js';
import { RACQUETS, STRINGS } from '../../../data/loader.js';
import { getActiveLoadout, getSavedLoadouts } from '../../../state/store.js';
import { getCurrentSetup } from '../../../state/setup-sync.js';
import { getDockEditorContext, setDockEditorContext } from '../../../state/app-state.js';
import type { SlotId, Slot } from './types.js';
import { getSlotColor, SLOT_COLORS } from './types.js';
import { 
  getState, 
  subscribe, 
  setSlotLoadout, 
  clearSlot, 
  setEditingSlot,
  getConfiguredSlots,
  getFirstEmptySlot
} from './hooks/useCompareState.js';
import { renderSlotCard } from './components/SlotCard.js';
import { renderRadarChart, updateRadarChart } from './components/RadarChart.js';
import { renderDiffBattery } from './components/DiffBattery.js';
import { renderSlotEditor, getEditorFormData, mountSlotEditor } from './components/SlotEditor.js';
import { getCachedValue, measurePerformance } from '../../../utils/performance.js';
import { syncViews } from '../../../runtime/coordinator.js';

// Container IDs
const CONTAINER_SLOTS = 'compare-slots-container';
const CONTAINER_RADAR = 'compare-radar-container';
const CONTAINER_DIFF = 'compare-diff-container';
const CONTAINER_EDITOR = 'compare-editor-container';

// State tracking
let _unsubscribe: (() => void) | null = null;
let _currentState = getState();
let _showAllStats = false;
let _editorUnmount: (() => void) | null = null;
const compareRacquets = RACQUETS as unknown as Racquet[];
const compareStrings = STRINGS as unknown as StringData[];
let _lastSlotsRenderKey = '';
let _lastRadarRenderKey = '';
let _lastDiffRenderKey = '';
let _compareBridgeInstalled = false;

type CompareLoadout = Loadout & {
  sourceLoadoutId?: string | null;
  snapshotObs?: number;
};

/**
 * Initialize the compare page
 */
export function initComparePage(): void {
  // Subscribe to state changes
  if (_unsubscribe) _unsubscribe();
  _unsubscribe = subscribe(handleStateChange);
  
  // Initial render
  render();
  
  // Set up window handlers
  setupWindowHandlers();
}

/**
 * Cleanup when leaving compare page
 */
export function cleanupComparePage(): void {
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
  _editorUnmount?.();
  _editorUnmount = null;
}

/**
 * Handle state changes
 */
function handleStateChange(state: typeof _currentState): void {
  _currentState = state;
  syncViews('compare-state-change', { compareState: true });
}

/**
 * Main render function
 */
function render(): void {
  renderSlots();
  renderRadar();
  renderDiff();
}

function getStructuralSlotsKey(): string {
  return _currentState.slots
    .map((slot) => `${slot.id}:${slot.loadout?.id || 'empty'}`)
    .join('|') + `|editing:${_currentState.editingSlotId || 'none'}`;
}

function getConfiguredSlotsKey(): string {
  return getConfiguredSlots()
    .map((slot) => `${slot.id}:${slot.loadout?.id || 'empty'}:${slot.loadout?.obs || 0}`)
    .join('|');
}

/**
 * Render the slot cards
 */
function renderSlots(): void {
  const container = document.getElementById(CONTAINER_SLOTS);
  if (!container) return;
  
  const slots = _currentState.slots;
  const nextKey = getStructuralSlotsKey();
  const hasRenderedSlots = container.children.length > 0;
  if (_lastSlotsRenderKey === nextKey && hasRenderedSlots) return;
  _lastSlotsRenderKey = nextKey;
  
  container.innerHTML = `
    <div class="compare-slots-grid">
      ${slots.map((slot, index) => renderSlotCard({
        slot,
        onEdit: editSlot,
        onRemove: removeSlot,
        onAdd: addSlot,
        onTune: tuneSlot,
        onSetActive: setActiveSlot,
        onSave: saveSlot,
        animationDelay: index * 100
      })).join('')}
    </div>
  `;
}

export function renderComparisonSlots(): void {
  renderSlots();
}

/**
 * Render the radar chart
 */
function renderRadar(): void {
  const container = document.getElementById(CONTAINER_RADAR);
  if (!container) return;
  
  const configured = getConfiguredSlots();
  const radarKey = getConfiguredSlotsKey();
  
  if (configured.length === 0) {
    container.innerHTML = `
      <div class="compare-radar-empty">
        <div class="compare-radar-placeholder">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.3">
            <path d="M32 4L58 20v24L32 60 6 44V20L32 4z" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="32" cy="32" r="8" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <p>Add builds to see comparison</p>
        </div>
      </div>
    `;
    _lastRadarRenderKey = '';
    return;
  }
  
  // Ensure canvas exists
  if (!container.querySelector('canvas')) {
    container.innerHTML = `
      <div class="compare-radar-wrapper">
        <canvas id="compare-radar-chart"></canvas>
      </div>
    `;
  }
  
  const hasCanvas = !!container.querySelector('#compare-radar-chart');
  if (_lastRadarRenderKey !== radarKey || !hasCanvas) {
    measurePerformance('compare radar update', () => renderRadarChart('compare-radar-chart', { slots: configured }));
    _lastRadarRenderKey = radarKey;
  }
}

export function updateComparisonRadar(): void {
  renderRadar();
}

/**
 * Render the diff battery
 */
function renderDiff(): void {
  const container = document.getElementById(CONTAINER_DIFF);
  if (!container) return;
  
  const configured = getConfiguredSlots();
  const diffKey = `${getConfiguredSlotsKey()}|showAll:${_showAllStats}`;
  
  if (configured.length < 2) {
    container.innerHTML = '';
    _lastDiffRenderKey = '';
    return;
  }
  
  const hasRenderedDiff = container.children.length > 0;
  if (_lastDiffRenderKey === diffKey && hasRenderedDiff) return;

  container.innerHTML = measurePerformance('compare diff update', () => renderDiffBattery({
    slots: configured,
    maxRows: 6,
    showAll: _showAllStats
  }));
  _lastDiffRenderKey = diffKey;
}

export function renderComparisonDeltas(): void {
  renderDiff();
}

export function renderCompareSummaries(): void {
  renderSlots();
}

export function renderCompareVerdict(): void {
  // The new compare page currently uses slot cards, radar, and diff battery.
  // Verdict content from the legacy compare surface is intentionally omitted.
}

export function renderCompareMatrix(): void {
  // The new compare page currently uses slot cards, radar, and diff battery.
  // Matrix content from the legacy compare surface is intentionally omitted.
}

export function getSlotColors() {
  return SLOT_COLORS;
}

export function showQuickAddPrompt(): void {
  let promptEl = document.getElementById('compare-qa-prompt');
  if (!promptEl) {
    promptEl = document.createElement('div');
    promptEl.id = 'compare-qa-prompt';
    promptEl.className = 'compare-qa-prompt';

    const slotsEl = document.getElementById(CONTAINER_SLOTS);
    if (slotsEl?.parentElement) {
      slotsEl.parentElement.insertBefore(promptEl, slotsEl.nextSibling);
    }
  }

  if (!promptEl) return;

  promptEl.innerHTML = `
    <div class="compare-qa-inner">
      <p class="compare-qa-title">Add a second setup to compare</p>
      <p class="compare-qa-sub">Pick a frame and string, or save more loadouts from Racket Bible</p>
      <div class="compare-qa-fields">
        <select class="dock-qa-select" id="compare-qa-frame">
          <option value="">Choose frame...</option>
        </select>
        <select class="dock-qa-select" id="compare-qa-string">
          <option value="">Choose string...</option>
        </select>
        <input type="number" class="dock-qa-input" id="compare-qa-tension" value="53" min="30" max="70" style="width:70px">
        <button class="dock-qa-btn dock-qa-btn-primary" onclick="_compareQuickAdd()" style="flex:none;padding:7px 16px">Add to Compare</button>
      </div>
    </div>
  `;

  const frameSelect = document.getElementById('compare-qa-frame') as HTMLSelectElement | null;
  const stringSelect = document.getElementById('compare-qa-string') as HTMLSelectElement | null;
  if (!frameSelect || !stringSelect) return;

  const options = getCachedValue('compare:quick-add-options', () => ({
    racquets: compareRacquets.map((racquet) => ({ id: racquet.id, name: racquet.name })),
    strings: compareStrings.map((string) => ({ id: string.id, label: `${string.name} (${string.gauge})` })),
  }));

  options.racquets.forEach((racquet) => {
    const option = document.createElement('option');
    option.value = racquet.id;
    option.textContent = racquet.name;
    frameSelect.appendChild(option);
  });

  options.strings.forEach((string) => {
    const option = document.createElement('option');
    option.value = string.id;
    option.textContent = string.label;
    stringSelect.appendChild(option);
  });
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
  document.getElementById('compare-qa-prompt')?.remove();
}

export function toggleComparisonMode(): void {
  const win = window as any;
  const currentMode = typeof win.currentMode === 'string' ? win.currentMode : null;
  win.switchMode?.(currentMode === 'compare' ? 'overview' : 'compare');
}

/**
 * Handle adding a slot
 */
export function addSlot(slotId: SlotId): void {
  setEditingSlot(slotId);
  openEditor(slotId);
}

/**
 * Handle editing a slot
 */
export function editSlot(slotId: SlotId): void {
  setEditingSlot(slotId);
  openEditor(slotId);
}

/**
 * Handle removing a slot
 */
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

function toTrackedCompareLoadout(loadout: Loadout): CompareLoadout {
  const compareLoadout = { ...loadout } as CompareLoadout;
  if (compareLoadout.sourceLoadoutId == null) {
    compareLoadout.sourceLoadoutId = loadout.id || null;
  }
  if (compareLoadout.snapshotObs == null) {
    compareLoadout.snapshotObs = loadout.obs ?? 0;
  }
  return compareLoadout;
}

export function tuneSlot(slotId: SlotId): void {
  const slot = getSlotById(slotId);
  if (!slot || slot.loadout === null) return;

  const win = window as any;
  win.activateLoadout?.({ ...slot.loadout, stats: slot.stats });
  win.switchMode?.('tune');
}

export function setActiveSlot(slotId: SlotId): void {
  const slot = getSlotById(slotId);
  if (!slot || slot.loadout === null) return;

  const win = window as any;
  win.activateLoadout?.({ ...slot.loadout, stats: slot.stats });
  win.switchMode?.('overview');
}

export function saveSlot(slotId: SlotId, button?: HTMLButtonElement | null): void {
  const slot = getSlotById(slotId);
  if (!slot || slot.loadout === null) return;

  const win = window as any;
  win.saveLoadout?.({ ...slot.loadout, stats: slot.stats, _dirty: false });

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

/**
 * Add a loadout to a specific slot
 */
function addLoadoutToSlot(slotId: SlotId, loadout: Loadout): void {
  const racquet = compareRacquets.find(r => r.id === loadout.frameId);
  if (!racquet) return;
  
  let stringConfig;
  if (loadout.isHybrid && loadout.mainsId && loadout.crossesId) {
    const mains = compareStrings.find(s => s.id === loadout.mainsId);
    const crosses = compareStrings.find(s => s.id === loadout.crossesId);
    if (!mains || !crosses) return;
    stringConfig = {
      isHybrid: true as const,
      mains,
      crosses,
      mainsTension: loadout.mainsTension,
      crossesTension: loadout.crossesTension
    };
  } else {
    const string = compareStrings.find(s => s.id === loadout.stringId);
    if (!string) return;
    stringConfig = {
      isHybrid: false as const,
      string,
      mainsTension: loadout.mainsTension,
      crossesTension: loadout.crossesTension
    };
  }
  
  const stats = predictSetup(racquet, stringConfig);
  const tensionContext = buildTensionContext({
    mainsTension: loadout.mainsTension,
    crossesTension: loadout.crossesTension,
  }, racquet);
  const nextLoadout: CompareLoadout = {
    ...toTrackedCompareLoadout(loadout),
    stats,
    obs: +computeCompositeScore(stats, tensionContext).toFixed(1),
    identity: generateIdentity(stats, racquet, stringConfig)?.name || loadout.identity,
  };

  setSlotLoadout(slotId, nextLoadout, stats);
  (window as any).renderDockContextPanel?.();
}

export function addLoadoutToNextAvailableSlot(loadout: Loadout): SlotId | null {
  const emptySlotId = getFirstEmptySlot();
  if (!emptySlotId) return null;
  addLoadoutToSlot(emptySlotId, loadout);
  return emptySlotId;
}

export function addLoadoutToPreferredSlot(loadout: Loadout): SlotId | null {
  const emptySlotId = getFirstEmptySlot();
  if (emptySlotId) {
    addLoadoutToSlot(emptySlotId, loadout);
    return emptySlotId;
  }

  const fallbackSlotId = _currentState.slots[_currentState.slots.length - 1]?.id ?? null;
  if (!fallbackSlotId) return null;

  addLoadoutToSlot(fallbackSlotId, loadout);
  return fallbackSlotId;
}

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

/**
 * Open the slot editor modal
 */
function openEditor(slotId: SlotId): void {
  const slot = _currentState.slots.find(s => s.id === slotId);
  if (!slot) return;
  
  const container = document.body;
  const activeLoadout = getActiveLoadout();
  const currentLoadout = slot.loadout || activeLoadout || null;
  
  _editorUnmount = mountSlotEditor(container, {
    slotId,
    currentLoadout,
    racquets: compareRacquets,
    strings: compareStrings,
    onSave: (id, loadout, stats) => {
      setSlotLoadout(id, loadout, stats);
      cancelEditor();
    },
    onCancel: cancelEditor
  });
}

/**
 * Close the editor modal
 */
export function cancelEditor(): void {
  _editorUnmount?.();
  _editorUnmount = null;
  setEditingSlot(null);
}

/**
 * Toggle showing all stats
 */
function toggleShowAll(): void {
  _showAllStats = !_showAllStats;
  renderDiff();
}

export function saveEditor(): void {
  const formData = getEditorFormData();
  if (!formData || !formData.frameId) {
    alert('Please select a frame');
    return;
  }

  const slotId = _currentState.editingSlotId;
  if (!slotId) return;

  const loadout: Loadout = {
    id: `compare-${Date.now()}`,
    name: `Compare ${slotId}`,
    frameId: formData.frameId,
    isHybrid: formData.isHybrid || false,
    mainsId: formData.mainsId || null,
    crossesId: formData.crossesId || null,
    stringId: formData.stringId || null,
    mainsTension: formData.mainsTension || 53,
    crossesTension: formData.crossesTension || 51,
    gauge: null,
    mainsGauge: null,
    crossesGauge: null,
    obs: 0,
    stats: undefined
  };

  addLoadoutToSlot(slotId, loadout);
  cancelEditor();
}

export function setEditorHybrid(isHybrid: boolean): void {
  const slotId = _currentState.editingSlotId;
  if (!slotId) return;

  _editorUnmount?.();
  const slot = _currentState.slots.find(s => s.id === slotId);
  if (!slot) return;

  const currentLoadout = slot.loadout || {
    id: `compare-${Date.now()}`,
    name: `Compare ${slotId}`,
    frameId: '',
    isHybrid,
    mainsId: null,
    crossesId: null,
    stringId: null,
    mainsTension: 53,
    crossesTension: 51,
    gauge: null,
    mainsGauge: null,
    crossesGauge: null,
    obs: 0
  };
  currentLoadout.isHybrid = isHybrid;

  _editorUnmount = mountSlotEditor(document.body, {
    slotId,
    currentLoadout,
    racquets: compareRacquets,
    strings: compareStrings,
    onSave: (id, l, s) => {
      setSlotLoadout(id, l, s);
      cancelEditor();
    },
    onCancel: cancelEditor
  });
}

export function updateEditorTension(type: 'mains' | 'crosses', value: string): void {
  const display = document.getElementById(`editor-${type}-tension-display`);
  if (display) display.textContent = `${value} lbs`;
}

export function editorLoadFromSaved(loadoutId: string): void {
  if (!loadoutId) return;
  const slotId = _currentState.editingSlotId;
  if (!slotId) return;

  const saved = getSavedLoadouts().find((item) => item.id === loadoutId);
  if (!saved) return;

  _editorUnmount?.();
  _editorUnmount = mountSlotEditor(document.body, {
    slotId,
    currentLoadout: toTrackedCompareLoadout(saved),
    racquets: compareRacquets,
    strings: compareStrings,
    onSave: (id, loadout, stats) => {
      setSlotLoadout(id, loadout, stats);
      cancelEditor();
    },
    onCancel: cancelEditor
  });
}

/**
 * Setup window handlers for inline onclick events
 */
function setupWindowHandlers(): void {
  if (_compareBridgeInstalled) return;
  const win = window as any;
  
  // Slot actions
  win.compareAddSlot = (slotId: string) => addSlot(slotId as SlotId);
  win.compareEditSlot = (slotId: string) => editSlot(slotId as SlotId);
  win.compareRemoveSlot = (slotId: string) => removeSlot(slotId as SlotId);
  win.compareTuneSlot = (slotId: string) => tuneSlot(slotId as SlotId);
  win.compareSetActiveSlot = (slotId: string) => setActiveSlot(slotId as SlotId);
  win.compareSaveSlot = (slotId: string, button?: HTMLButtonElement) => saveSlot(slotId as SlotId, button);
  win.compareQuickAddSaved = quickAddSaved;
  
  // Editor actions
  win.compareEditorCancel = cancelEditor;
  win.compareEditorSave = saveEditor;
  win.compareEditorSetHybrid = setEditorHybrid;
  win.compareEditorUpdateTension = updateEditorTension;
  win.compareEditorLoadFromSaved = editorLoadFromSaved;
  
  // Diff actions
  win.compareToggleShowAll = toggleShowAll;
  _compareBridgeInstalled = true;
}

export function hasCompareBridgeInstalled(): boolean {
  return _compareBridgeInstalled;
}

// Export public API
export {
  getState,
  subscribe,
  setSlotLoadout,
  clearSlot,
  getConfiguredSlots
};

// Re-export types
export type { SlotId, Slot, CompareSlot } from './types.js';
