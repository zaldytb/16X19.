import { RACQUETS, STRINGS } from '../../../data/loader.js';
import type { Loadout, Racquet, StringData } from '../../../engine/types.js';
import { getActiveLoadout, getSavedLoadouts } from '../../../state/imperative.js';
import { getCurrentSetup } from '../../../state/setup-sync.js';
import { saveLoadout } from '../../../state/loadout.js';
import type { Slot, SlotId } from './types.js';
import {
  clearSlot,
  getFirstEmptySlot,
  getState,
  setEditingSlot,
} from './hooks/useCompareState.js';
import {
  addLoadoutToNextAvailableSlot,
  addLoadoutToPreferredSlot,
  addLoadoutToSlot,
  toTrackedCompareLoadout,
} from './compare-slot-api.js';

type CompareShellCallbacks = {
  activateLoadout?: (loadout: Loadout) => void;
  switchMode?: (mode: string) => void;
  renderDockContextPanel?: () => void;
};

let _shellCbs: CompareShellCallbacks = {};

const compareRacquets = RACQUETS as unknown as Racquet[];
const compareStrings = STRINGS as unknown as StringData[];

export function registerCompareShellCallbacks(cbs: CompareShellCallbacks): void {
  _shellCbs = { ..._shellCbs, ...cbs };
}

function getSlotById(slotId: SlotId): Slot | null {
  return getState().slots.find((slot) => slot.id === slotId) || null;
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

export function buildQuickAddLoadout(frameId: string, stringId: string, tension: number): Loadout | null {
  const racquet = compareRacquets.find((item) => item.id === frameId);
  const string = compareStrings.find((item) => item.id === stringId);
  if (!racquet || !string) return null;

  return {
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
}

export function addSlot(slotId: SlotId): void {
  setEditingSlot(slotId);
}

export function editSlot(slotId: SlotId): void {
  setEditingSlot(slotId);
}

export function cancelEditor(): void {
  setEditingSlot(null);
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

export function quickAddSaved(loadoutId: string): void {
  const loadout = getSavedLoadouts().find((item) => item.id === loadoutId);
  if (!loadout) return;

  const emptySlotId = getFirstEmptySlot();
  if (emptySlotId) {
    addLoadoutToSlot(emptySlotId, toTrackedCompareLoadout(loadout));
    return;
  }

  const editingSlotId = getState().editingSlotId || getState().slots[0]?.id;
  if (editingSlotId) {
    addLoadoutToSlot(editingSlotId, toTrackedCompareLoadout(loadout));
  }
}

export { addLoadoutToNextAvailableSlot, addLoadoutToPreferredSlot };
