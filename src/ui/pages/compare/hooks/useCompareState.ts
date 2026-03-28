/**
 * Compare State Management
 * Centralized state store for compare functionality
 */

import type { Loadout, SetupStats } from '../../../../engine/types.js';
import type { SlotId, Slot, CompareSlot, EmptySlot, CompareState } from '../types.js';
import { getSlotColor, SLOT_COLORS } from '../types.js';
import {
  getComparisonSlots as getAppComparisonSlots,
  setComparisonSlots as setAppComparisonSlots,
} from '../../../../state/app-state.js';

// Private state
let _state: CompareState = {
  slots: SLOT_COLORS.map(color => ({
    id: color.id,
    color,
    loadout: null,
    stats: null
  })),
  activeSlotId: null,
  editingSlotId: null
};

function syncLegacyMirror(): void {
  setAppComparisonSlots(_state.slots.map((slot) => ({
    id: slot.id,
    color: slot.color,
    loadout: slot.loadout,
    stats: slot.stats,
  })));
}

function hydrateFromAppState(): void {
  const mirrored = getAppComparisonSlots<Array<Partial<Slot>>>() as Array<Partial<Slot>>;
  if (!Array.isArray(mirrored) || mirrored.length === 0) return;
  if (_state.slots.some((slot) => slot.loadout !== null)) return;

  const nextSlots = SLOT_COLORS.map((color, index) => {
    const mirroredSlot = mirrored[index];
    const mirroredStats = mirroredSlot?.stats || (mirroredSlot?.loadout as Loadout | undefined)?.stats || null;
    if (mirroredSlot && 'loadout' in mirroredSlot && mirroredSlot.loadout && mirroredStats) {
      return {
        id: color.id,
        color: getSlotColor(color.id),
        loadout: mirroredSlot.loadout,
        stats: mirroredStats,
      };
    }

    return {
      id: color.id,
      color: getSlotColor(color.id),
      loadout: null,
      stats: null,
    };
  });

  _state = {
    ..._state,
    slots: nextSlots,
  };
}

// Subscribers for reactive updates
const _subscribers: Set<(state: CompareState) => void> = new Set();

function notify(): void {
  syncLegacyMirror();
  _subscribers.forEach(fn => fn(_state));
}

export function getState(): CompareState {
  hydrateFromAppState();
  return { ..._state, slots: [..._state.slots] };
}

export function subscribe(callback: (state: CompareState) => void): () => void {
  _subscribers.add(callback);
  return () => _subscribers.delete(callback);
}

export function setSlotLoadout(slotId: SlotId, loadout: Loadout, stats: SetupStats): void {
  const slotIndex = _state.slots.findIndex(s => s.id === slotId);
  if (slotIndex === -1) return;
  
  _state.slots[slotIndex] = {
    id: slotId,
    color: getSlotColor(slotId),
    loadout,
    stats
  };
  
  notify();
}

export function clearSlot(slotId: SlotId): void {
  const slotIndex = _state.slots.findIndex(s => s.id === slotId);
  if (slotIndex === -1) return;
  
  _state.slots[slotIndex] = {
    id: slotId,
    color: getSlotColor(slotId),
    loadout: null,
    stats: null
  };
  
  notify();
}

export function setEditingSlot(slotId: SlotId | null): void {
  _state.editingSlotId = slotId;
  notify();
}

export function getConfiguredSlots(): CompareSlot[] {
  return _state.slots.filter((s): s is CompareSlot => s.loadout !== null);
}

export function getEmptySlots(): EmptySlot[] {
  return _state.slots.filter((s): s is EmptySlot => s.loadout === null);
}

export function getFirstEmptySlot(): SlotId | null {
  const empty = _state.slots.find(s => s.loadout === null);
  return empty?.id || null;
}

export function canAddSlot(): boolean {
  return _state.slots.some(s => s.loadout === null);
}

export function addLoadout(loadout: Loadout): SlotId | null {
  const emptySlotId = getFirstEmptySlot();
  if (!emptySlotId) return null;
  
  // Need racquet/string data to predict stats
  // This will be handled by the caller which has access to data
  return emptySlotId;
}

export function moveSlot(fromId: SlotId, toId: SlotId): void {
  const fromIndex = _state.slots.findIndex(s => s.id === fromId);
  const toIndex = _state.slots.findIndex(s => s.id === toId);
  
  if (fromIndex === -1 || toIndex === -1) return;
  
  const temp = _state.slots[fromIndex];
  _state.slots[fromIndex] = {
    ..._state.slots[toIndex],
    id: fromId,
    color: getSlotColor(fromId)
  };
  _state.slots[toIndex] = {
    ...temp,
    id: toId,
    color: getSlotColor(toId)
  };
  
  notify();
}

export function reset(): void {
  _state = {
    slots: SLOT_COLORS.map(color => ({
      id: color.id,
      color,
      loadout: null,
      stats: null
    })),
    activeSlotId: null,
    editingSlotId: null
  };
  notify();
}

// Backward compatibility with old comparisonSlots array
export function getComparisonSlots(): { loadout: Loadout | null; stats: SetupStats | null }[] {
  return _state.slots.map(s => ({
    loadout: s.loadout,
    stats: s.stats
  }));
}
