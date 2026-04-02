/**
 * Compare State Management
 * Thin compatibility facade over the app Zustand store.
 */

import type { Loadout, SetupStats } from '../../../../engine/types.js';
import { useAppStore } from '../../../../state/useAppStore.js';
import type { SlotId, CompareSlot, EmptySlot, CompareState } from '../types.js';

function getCompareStateFromStore(): CompareState {
  const state = useAppStore.getState();
  return {
    slots: state.comparisonSlots,
    activeSlotId: state.compareActiveSlotId,
    editingSlotId: state.compareEditingSlotId,
  };
}

export function getState(): CompareState {
  return getCompareStateFromStore();
}

export function subscribe(callback: (state: CompareState) => void): () => void {
  return useAppStore.subscribe(
    (state) => ({
      slots: state.comparisonSlots,
      activeSlotId: state.compareActiveSlotId,
      editingSlotId: state.compareEditingSlotId,
    }),
    () => callback(getCompareStateFromStore()),
  );
}

export function setSlotLoadout(slotId: SlotId, loadout: Loadout, stats: SetupStats): void {
  useAppStore.getState().setCompareSlotLoadout(slotId, loadout, stats);
}

export function clearSlot(slotId: SlotId): void {
  useAppStore.getState().clearCompareSlot(slotId);
}

export function setEditingSlot(slotId: SlotId | null): void {
  useAppStore.getState().setCompareEditingSlot(slotId);
}

export function getConfiguredSlots(): CompareSlot[] {
  return getCompareStateFromStore().slots.filter((slot): slot is CompareSlot => slot.loadout !== null);
}

export function getEmptySlots(): EmptySlot[] {
  return getCompareStateFromStore().slots.filter((slot): slot is EmptySlot => slot.loadout === null);
}

export function getFirstEmptySlot(): SlotId | null {
  const empty = getCompareStateFromStore().slots.find((slot) => slot.loadout === null);
  return empty?.id || null;
}

export function canAddSlot(): boolean {
  return getCompareStateFromStore().slots.some((slot) => slot.loadout === null);
}

export function addLoadout(loadout: Loadout): SlotId | null {
  void loadout;
  return getFirstEmptySlot();
}

export function moveSlot(fromId: SlotId, toId: SlotId): void {
  useAppStore.getState().moveCompareSlot(fromId, toId);
}

export function reset(): void {
  useAppStore.getState().resetCompare();
}
