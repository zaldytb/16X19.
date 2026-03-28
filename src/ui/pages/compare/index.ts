/**
 * Compare Page Main Module
 * Orchestrates the compare page functionality
 */

import type { Loadout, Racquet, StringData } from '../../../engine/types.js';
import { buildTensionContext, computeCompositeScore, generateIdentity, predictSetup } from '../../../engine/index.js';
import { RACQUETS, STRINGS } from '../../../data/loader.js';
import { getActiveLoadout, getSavedLoadouts } from '../../../state/store.js';
import type { SlotId, Slot } from './types.js';
import { getSlotColor } from './types.js';
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
  render();
}

/**
 * Main render function
 */
function render(): void {
  renderSlots();
  renderRadar();
  renderDiff();
}

/**
 * Render the slot cards
 */
function renderSlots(): void {
  const container = document.getElementById(CONTAINER_SLOTS);
  if (!container) return;
  
  const slots = _currentState.slots;
  
  container.innerHTML = `
    <div class="compare-slots-grid">
      ${slots.map((slot, index) => renderSlotCard({
        slot,
        onEdit: handleEditSlot,
        onRemove: handleRemoveSlot,
        onAdd: handleAddSlot,
        animationDelay: index * 100
      })).join('')}
    </div>
  `;
}

/**
 * Render the radar chart
 */
function renderRadar(): void {
  const container = document.getElementById(CONTAINER_RADAR);
  if (!container) return;
  
  const configured = getConfiguredSlots();
  
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
  
  renderRadarChart('compare-radar-chart', { slots: configured });
}

/**
 * Render the diff battery
 */
function renderDiff(): void {
  const container = document.getElementById(CONTAINER_DIFF);
  if (!container) return;
  
  const configured = getConfiguredSlots();
  
  if (configured.length < 2) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = renderDiffBattery({
    slots: configured,
    maxRows: 6,
    showAll: _showAllStats
  });
}

/**
 * Handle adding a slot
 */
function handleAddSlot(slotId: SlotId): void {
  setEditingSlot(slotId);
  openEditor(slotId);
}

/**
 * Handle editing a slot
 */
function handleEditSlot(slotId: SlotId): void {
  setEditingSlot(slotId);
  openEditor(slotId);
}

/**
 * Handle removing a slot
 */
function handleRemoveSlot(slotId: SlotId): void {
  if (confirm('Remove this build from comparison?')) {
    clearSlot(slotId);
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
  const nextLoadout: Loadout = {
    ...loadout,
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
      closeEditor();
    },
    onCancel: closeEditor
  });
}

/**
 * Close the editor modal
 */
function closeEditor(): void {
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

/**
 * Setup window handlers for inline onclick events
 */
function setupWindowHandlers(): void {
  const win = window as any;
  
  // Slot actions
  win.compareAddSlot = (slotId: string) => handleAddSlot(slotId as SlotId);
  win.compareEditSlot = (slotId: string) => handleEditSlot(slotId as SlotId);
  win.compareRemoveSlot = (slotId: string) => handleRemoveSlot(slotId as SlotId);
  win.compareQuickAddSaved = (loadoutId: string) => {
    const loadout = getSavedLoadouts().find((item) => item.id === loadoutId);
    if (!loadout) return;

    const emptySlotId = getFirstEmptySlot();
    if (emptySlotId) {
      addLoadoutToSlot(emptySlotId, { ...loadout });
      return;
    }

    const editingSlotId = _currentState.editingSlotId || _currentState.slots[0]?.id;
    if (editingSlotId) {
      addLoadoutToSlot(editingSlotId, { ...loadout });
    }
  };
  
  // Editor actions
  win.compareEditorCancel = closeEditor;
  win.compareEditorSave = () => {
    const formData = getEditorFormData();
    if (!formData || !formData.frameId) {
      alert('Please select a frame');
      return;
    }
    
    const slotId = _currentState.editingSlotId;
    if (!slotId) return;
    
    // Build a complete loadout from form data
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
    closeEditor();
  };
  
  win.compareEditorSetHybrid = (isHybrid: boolean) => {
    // Re-render editor with new hybrid state
    const slotId = _currentState.editingSlotId;
    if (slotId) {
      _editorUnmount?.();
      const slot = _currentState.slots.find(s => s.id === slotId);
      if (slot) {
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
            closeEditor();
          },
          onCancel: closeEditor
        });
      }
    }
  };
  
  win.compareEditorUpdateTension = (type: 'mains' | 'crosses', value: string) => {
    const display = document.getElementById(`editor-${type}-tension-display`);
    if (display) display.textContent = `${value} lbs`;
  };
  
  win.compareEditorLoadFromSaved = (loadoutId: string) => {
    if (!loadoutId) return;
    const slotId = _currentState.editingSlotId;
    if (!slotId) return;

    const saved = getSavedLoadouts().find((item) => item.id === loadoutId);
    if (!saved) return;

    _editorUnmount?.();
    _editorUnmount = mountSlotEditor(document.body, {
      slotId,
      currentLoadout: { ...saved },
      racquets: compareRacquets,
      strings: compareStrings,
      onSave: (id, loadout, stats) => {
        setSlotLoadout(id, loadout, stats);
        closeEditor();
      },
      onCancel: closeEditor
    });
  };
  
  // Diff actions
  win.compareToggleShowAll = toggleShowAll;
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
