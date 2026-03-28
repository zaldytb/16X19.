// src/state/app-state.ts
// Shared app runtime state for shell/page coordination.

export type AppMode =
  | 'overview'
  | 'tune'
  | 'compare'
  | 'optimize'
  | 'compendium'
  | 'howitworks'
  | string;

let _currentMode: AppMode = 'overview';
let _comparisonSlots: unknown[] = [];
let _comparisonRadarChart: unknown = null;
let _currentRadarChart: unknown = null;
let _slotColors: unknown[] = [];

export function getCurrentMode(): AppMode {
  return _currentMode;
}

export function setCurrentMode(mode: AppMode): void {
  _currentMode = mode;
}

export function getComparisonSlots<T = unknown>(): T[] {
  return _comparisonSlots as T[];
}

export function setComparisonSlots<T = unknown>(slots: T[]): void {
  _comparisonSlots = slots as unknown[];
}

export function getComparisonRadarChart<T = unknown>(): T | null {
  return (_comparisonRadarChart as T | null) ?? null;
}

export function setComparisonRadarChart<T = unknown>(chart: T | null): void {
  _comparisonRadarChart = chart;
}

export function getCurrentRadarChart<T = unknown>(): T | null {
  return (_currentRadarChart as T | null) ?? null;
}

export function setCurrentRadarChart<T = unknown>(chart: T | null): void {
  _currentRadarChart = chart;
}

export function getSlotColors<T = unknown>(): T[] {
  return _slotColors as T[];
}

export function setSlotColors<T = unknown>(colors: T[]): void {
  _slotColors = colors as unknown[];
}

export function installWindowAppStateBridge(): void {
  if (typeof window === 'undefined') return;

  const bridgeDefs: Array<[string, () => unknown, (value: unknown) => void]> = [
    ['currentMode', () => _currentMode, (value) => { _currentMode = value as AppMode; }],
    ['comparisonSlots', () => _comparisonSlots, (value) => { _comparisonSlots = Array.isArray(value) ? value : []; }],
    ['comparisonRadarChart', () => _comparisonRadarChart, (value) => { _comparisonRadarChart = value; }],
    ['currentRadarChart', () => _currentRadarChart, (value) => { _currentRadarChart = value; }],
    ['SLOT_COLORS', () => _slotColors, (value) => { _slotColors = Array.isArray(value) ? value : []; }]
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
}
