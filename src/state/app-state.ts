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

// Bridge installation - now just syncs initial state
let _windowAppStateBridgeInstalled = false;

export function installWindowAppStateBridge(): void {
  if (typeof window === 'undefined') return;
  if (_windowAppStateBridgeInstalled) return;

  const bridgeDefs: Array<[string, () => unknown, (value: unknown) => void]> = [
    ['currentMode', () => useAppStore.getState().currentMode, (value) => { useAppStore.getState().setCurrentMode(value as AppMode); }],
    ['comparisonSlots', () => useAppStore.getState().comparisonSlots, (value) => { useAppStore.getState().setComparisonSlots(Array.isArray(value) ? value : []); }],
    ['comparisonRadarChart', () => useAppStore.getState().comparisonRadarChart, (value) => { useAppStore.getState().setComparisonRadarChart(value); }],
    ['currentRadarChart', () => useAppStore.getState().currentRadarChart, (value) => { useAppStore.getState().setCurrentRadarChart(value); }],
    ['SLOT_COLORS', () => useAppStore.getState().slotColors, (value) => { useAppStore.getState().setSlotColors(Array.isArray(value) ? value : []); }],
    ['dockEditorContext', () => useAppStore.getState().dockEditorContext, (value) => {
      useAppStore.getState().setDockEditorContext(
        (value && typeof value === 'object' && 'kind' in (value as Record<string, unknown>))
          ? value as DockEditorContext
          : { kind: 'active' }
      );
    }]
  ];

  bridgeDefs.forEach(([key, getter, setter]) => {
    const windowRecord = window as unknown as Record<string, unknown>;
    try {
      delete windowRecord[key];
    } catch (_err) {
      // Ignore if the property is non-configurable in the current runtime.
    }

    Object.defineProperty(window, key, {
      get: getter,
      set: setter,
      configurable: true
    });
  });

  _windowAppStateBridgeInstalled = true;
}

export function hasWindowAppStateBridgeInstalled(): boolean {
  return _windowAppStateBridgeInstalled;
}
