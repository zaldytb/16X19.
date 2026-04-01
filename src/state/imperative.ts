// Imperative accessors for vanilla TS / runtime (Zustand is the only source of truth).

import type { Loadout } from '../engine/types.js';
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

export function getComparisonSlots<T = unknown>(): T[] {
  return useAppStore.getState().comparisonSlots as T[];
}

export function setComparisonSlots<T = unknown>(slots: T[]): void {
  useAppStore.getState().setComparisonSlots(slots as unknown[]);
}

export function getComparisonRadarChart<T = unknown>(): T | null {
  return (useAppStore.getState().comparisonRadarChart as T | null) ?? null;
}

export function setComparisonRadarChart<T = unknown>(chart: T | null): void {
  useAppStore.getState().setComparisonRadarChart(chart);
}

export function getCurrentRadarChart<T = unknown>(): T | null {
  return (useAppStore.getState().currentRadarChart as T | null) ?? null;
}

export function setCurrentRadarChart<T = unknown>(chart: T | null): void {
  useAppStore.getState().setCurrentRadarChart(chart);
}

export function getSlotColors<T = unknown>(): T[] {
  return useAppStore.getState().slotColors as T[];
}

export function setSlotColors<T = unknown>(colors: T[]): void {
  useAppStore.getState().setSlotColors(colors as unknown[]);
}

export function getDockEditorContext(): DockEditorContext {
  return useAppStore.getState().dockEditorContext;
}

export function setDockEditorContext(context: DockEditorContext): void {
  useAppStore.getState().setDockEditorContext(context);
}
