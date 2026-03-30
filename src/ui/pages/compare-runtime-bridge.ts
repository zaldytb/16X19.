// Lightweight callback registry for Compare runtime entrypoints.
// Shared callers use this instead of importing the full compare page module.

import type { Loadout } from '../../engine/types.js';
import type { SlotId } from './compare/types.js';

type CompareShellCallbacks = {
  activateLoadout?: (loadout: Loadout) => void;
  switchMode?: (mode: string) => void;
  renderDockContextPanel?: () => void;
};

type CompareRuntimeCallbacks = {
  initComparePage: () => void;
  renderComparisonSlots: () => void;
  renderCompareSummaries: () => void;
  renderCompareVerdict: () => void;
  renderCompareMatrix: () => void;
  updateComparisonRadar: () => void;
  renderComparisonDeltas: () => void;
  addComparisonSlotFromHome: () => void;
  showQuickAddPrompt: () => void;
  addSlot: (slotId: SlotId) => void;
  editSlot: (slotId: SlotId) => void;
  removeSlot: (slotId: SlotId) => void;
  quickAddSaved: (loadoutId: string) => void;
  addComparisonSlot: () => void;
  registerCompareShellCallbacks: (callbacks: CompareShellCallbacks) => void;
};

let _callbacks: Partial<CompareRuntimeCallbacks> = {};
let _pendingShellCallbacks: CompareShellCallbacks | null = null;
let _loadPromise: Promise<void> | null = null;

export function registerCompareRuntimeCallbacks(callbacks: Partial<CompareRuntimeCallbacks>): void {
  _callbacks = { ..._callbacks, ...callbacks };
  if (_pendingShellCallbacks && _callbacks.registerCompareShellCallbacks) {
    _callbacks.registerCompareShellCallbacks(_pendingShellCallbacks);
  }
}

async function ensureCompareRuntimeLoaded(): Promise<void> {
  if (_callbacks.initComparePage) return;
  if (!_loadPromise) {
    _loadPromise = import('./compare/index.js').then(() => undefined);
  }
  await _loadPromise;
}

function invokeCompareRuntime(action: (callbacks: Partial<CompareRuntimeCallbacks>) => void): void {
  if (_callbacks.initComparePage) {
    action(_callbacks);
    return;
  }
  void ensureCompareRuntimeLoaded().then(() => action(_callbacks));
}

export function registerCompareShellCallbacksViaBridge(callbacks: CompareShellCallbacks): void {
  _pendingShellCallbacks = callbacks;
  if (_callbacks.registerCompareShellCallbacks) {
    _callbacks.registerCompareShellCallbacks(callbacks);
  }
}

export function initComparePageViaBridge(): void {
  invokeCompareRuntime((callbacks) => callbacks.initComparePage?.());
}

export function renderCompareSurfacesViaBridge(): void {
  invokeCompareRuntime((callbacks) => {
    callbacks.renderComparisonSlots?.();
    callbacks.renderCompareSummaries?.();
    callbacks.renderCompareVerdict?.();
    callbacks.renderCompareMatrix?.();
    callbacks.updateComparisonRadar?.();
  });
}

export function renderCompareRefreshViaBridge(): void {
  invokeCompareRuntime((callbacks) => {
    callbacks.renderComparisonSlots?.();
    callbacks.updateComparisonRadar?.();
    callbacks.renderComparisonDeltas?.();
  });
}

export function renderCompareSummariesViaBridge(): void {
  invokeCompareRuntime((callbacks) => callbacks.renderCompareSummaries?.());
}

export function addComparisonSlotFromHomeViaBridge(): void {
  invokeCompareRuntime((callbacks) => callbacks.addComparisonSlotFromHome?.());
}

export function showCompareQuickAddPromptViaBridge(): void {
  invokeCompareRuntime((callbacks) => callbacks.showQuickAddPrompt?.());
}

export function addCompareSlotViaBridge(slotId: SlotId): void {
  invokeCompareRuntime((callbacks) => callbacks.addSlot?.(slotId));
}

export function editCompareSlotViaBridge(slotId: SlotId): void {
  invokeCompareRuntime((callbacks) => callbacks.editSlot?.(slotId));
}

export function removeCompareSlotViaBridge(slotId: SlotId): void {
  invokeCompareRuntime((callbacks) => callbacks.removeSlot?.(slotId));
}

export function quickAddCompareSavedViaBridge(loadoutId: string): void {
  invokeCompareRuntime((callbacks) => callbacks.quickAddSaved?.(loadoutId));
}

export function addComparisonSlotViaBridge(): void {
  invokeCompareRuntime((callbacks) => callbacks.addComparisonSlot?.());
}
