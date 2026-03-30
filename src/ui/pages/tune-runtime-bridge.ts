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

export function registerTuneRuntimeCallbacks(callbacks: Partial<TuneRuntimeCallbacks>): void {
  _callbacks = { ..._callbacks, ...callbacks };
}

export function initTuneModeViaBridge(setup: TuneSetup): void {
  _callbacks.initTuneMode?.(setup);
}

export function refreshTuneIfActiveViaBridge(): void {
  _callbacks.refreshTuneIfActive?.();
}

export function onTuneSliderInputViaBridge(event: Event): void {
  _callbacks.onTuneSliderInput?.(event);
}

export function resetTunePreviewStateViaBridge(): void {
  _callbacks.resetPreviewState?.();
}

export function refreshTuneSweepChartViaBridge(setup: TuneSetup): void {
  _callbacks.refreshSweepChart?.(setup);
}
