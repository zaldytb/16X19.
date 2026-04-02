// Lightweight callback registry for Tune runtime entrypoints.
// Shared callers use this instead of importing the full page module.

import type { Racquet, StringConfig } from '../../engine/types.js';

type TuneSetup = {
  racquet: Racquet;
  stringConfig: StringConfig;
};

type TuneRuntimeCallbacks = {
  initTuneMode: (setup: TuneSetup) => void;
  refreshTuneIfActive: () => void;
  onTuneSliderInput: (event: Event) => void;
  resetPreviewState: () => void;
  refreshSweepChart: (setup: TuneSetup) => void;
};

let _callbacks: Partial<TuneRuntimeCallbacks> = {};
let _isTuneMounted = false;

export function registerTuneRuntimeCallbacks(callbacks: Partial<TuneRuntimeCallbacks>): void {
  _callbacks = { ..._callbacks, ...callbacks };
}

export function setTuneRuntimeMounted(isMounted: boolean): void {
  _isTuneMounted = isMounted;
}

export function initTuneModeViaBridge(setup: TuneSetup): void {
  if (!_isTuneMounted) return;
  _callbacks.initTuneMode?.(setup);
}

export function refreshTuneIfActiveViaBridge(): void {
  if (!_isTuneMounted) return;
  _callbacks.refreshTuneIfActive?.();
}

export function onTuneSliderInputViaBridge(event: Event): void {
  if (!_isTuneMounted) return;
  _callbacks.onTuneSliderInput?.(event);
}

export function resetTunePreviewStateViaBridge(): void {
  _callbacks.resetPreviewState?.();
}

export function refreshTuneSweepChartViaBridge(setup: TuneSetup): void {
  if (!_isTuneMounted) return;
  _callbacks.refreshSweepChart?.(setup);
}
