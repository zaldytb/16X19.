// src/state/app-state.ts
// Shared app runtime state for shell/page coordination.
// (Now backed by Zustand store for React integration)

import { useAppStore, type AppMode, type DockEditorContext } from './useAppStore.js';
export type { AppMode, DockEditorContext };

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
