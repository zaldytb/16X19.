// Imperative accessors for vanilla TS / runtime (Zustand is the only source of truth).

import type { Loadout } from '../engine/types.js';
import type { RadarDataset, Slot, SlotColor, SlotId } from '../ui/pages/compare/types.js';
import {
  useAppStore,
  type AppMode,
  type DockEditorContext,
} from './useAppStore.js';

export type { AppMode, DockEditorContext };

export function getActiveLoadout(): Loadout | null {
  return useAppStore.getState().activeLoadout;
}

export function getSavedLoadouts(): Loadout[] {
  return useAppStore.getState().savedLoadouts;
}

export function setActiveLoadout(lo: Loadout | null): void {
  useAppStore.getState().setActiveLoadout(lo);
}

export function setSavedLoadouts(arr: Loadout[]): void {
  useAppStore.getState().setSavedLoadouts(arr);
}

export function addSavedLoadout(lo: Loadout): void {
  useAppStore.getState().addSavedLoadout(lo);
}

export function removeSavedLoadout(id: string): void {
  useAppStore.getState().removeSavedLoadout(id);
}

export function updateSavedLoadout(id: string, updates: Partial<Loadout>): void {
  useAppStore.getState().updateSavedLoadout(id, updates);
}

export function subscribe(
  key: 'activeLoadout' | 'savedLoadouts',
  fn: () => void
): () => void {
  return useAppStore.subscribe((state, prevState) => {
    const changed = key === 'activeLoadout'
      ? state.activeLoadout !== prevState.activeLoadout
      : state.savedLoadouts !== prevState.savedLoadouts;
    if (changed) fn();
  });
}

export function getCurrentMode(): AppMode {
  return useAppStore.getState().currentMode;
}

export function setCurrentMode(mode: AppMode): void {
  useAppStore.getState().setCurrentMode(mode);
}

export function getComparisonSlots(): Slot[] {
  return useAppStore.getState().comparisonSlots;
}

export function setComparisonSlots(slots: Slot[]): void {
  useAppStore.getState().setComparisonSlots(slots);
}

export function setCompareSlotLoadout(slotId: SlotId, loadout: Loadout, stats: NonNullable<Loadout['stats']>): void {
  useAppStore.getState().setCompareSlotLoadout(slotId, loadout, stats);
}

export function clearCompareSlot(slotId: SlotId): void {
  useAppStore.getState().clearCompareSlot(slotId);
}

export function moveCompareSlot(fromId: SlotId, toId: SlotId): void {
  useAppStore.getState().moveCompareSlot(fromId, toId);
}

export function setCompareEditingSlot(slotId: SlotId | null): void {
  useAppStore.getState().setCompareEditingSlot(slotId);
}

export function resetCompare(): void {
  useAppStore.getState().resetCompare();
}

export function getComparisonRadarChart(): RadarDataset[] | null {
  return useAppStore.getState().comparisonRadarChart;
}

export function setComparisonRadarChart(chart: RadarDataset[] | null): void {
  useAppStore.getState().setComparisonRadarChart(chart);
}

export function getCurrentRadarChart(): RadarDataset[] | null {
  return useAppStore.getState().currentRadarChart;
}

export function setCurrentRadarChart(chart: RadarDataset[] | null): void {
  useAppStore.getState().setCurrentRadarChart(chart);
}

export function getSlotColors(): SlotColor[] {
  return useAppStore.getState().slotColors;
}

export function setSlotColors(colors: SlotColor[]): void {
  useAppStore.getState().setSlotColors(colors);
}

export function getDockEditorContext(): DockEditorContext {
  return useAppStore.getState().dockEditorContext;
}

export function setDockEditorContext(context: DockEditorContext): void {
  useAppStore.getState().setDockEditorContext(context);
}
