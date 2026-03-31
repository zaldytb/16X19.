// src/state/store.ts
// Centralized state store for active and saved loadouts
// (Now backed by Zustand store for React integration)

import type { Loadout } from '../engine/types.js';
import { persistActiveLoadout } from './active-loadout-storage.js';
import { useAppStore } from './useAppStore.js';

// ─── Getters ─────────────────────────────────────
export function getActiveLoadout(): Loadout | null {
  return useAppStore.getState().activeLoadout;
}

export function getSavedLoadouts(): Loadout[] {
  return useAppStore.getState().savedLoadouts;
}

// ─── Setters ─────────────────────────────────────
export function setActiveLoadout(lo: Loadout | null): void {
  useAppStore.getState().setActiveLoadout(lo);
  persistActiveLoadout(lo);
}

export function setSavedLoadouts(arr: Loadout[]): void {
  useAppStore.getState().setSavedLoadouts(arr);
}

// ─── Convenience mutators ────────────────────────
export function addSavedLoadout(lo: Loadout): void {
  useAppStore.getState().addSavedLoadout(lo);
}

export function removeSavedLoadout(id: string): void {
  useAppStore.getState().removeSavedLoadout(id);
}

export function updateSavedLoadout(id: string, updates: Partial<Loadout>): void {
  useAppStore.getState().updateSavedLoadout(id, updates);
}

// ─── Pub/Sub (Zustand subscription) ───────────────
export function subscribe(
  key: 'activeLoadout' | 'savedLoadouts',
  fn: () => void
): () => void {
  // Use a listener that calls fn whenever state changes
  return useAppStore.subscribe((state, prevState) => {
    const changed = key === 'activeLoadout'
      ? state.activeLoadout !== prevState.activeLoadout
      : state.savedLoadouts !== prevState.savedLoadouts;
    if (changed) fn();
  });
}
