// src/state/useAppStore.ts
// Zustand store combining loadout state and app state

import { create } from 'zustand';
import type { Loadout } from '../engine/types.js';

export type AppMode =
  | 'overview'
  | 'tune'
  | 'compare'
  | 'optimize'
  | 'compendium'
  | 'howitworks'
  | string;

export type DockEditorContext =
  | { kind: 'active' }
  | { kind: 'compare-overview' }
  | { kind: 'compare-slot'; slotId: string };

interface AppState {
  // Loadout state
  activeLoadout: Loadout | null;
  savedLoadouts: Loadout[];

  // App state
  currentMode: AppMode;
  comparisonSlots: unknown[];
  comparisonRadarChart: unknown | null;
  currentRadarChart: unknown | null;
  slotColors: unknown[];
  dockEditorContext: DockEditorContext;

  // Actions
  setActiveLoadout: (lo: Loadout | null) => void;
  setSavedLoadouts: (arr: Loadout[]) => void;
  addSavedLoadout: (lo: Loadout) => void;
  removeSavedLoadout: (id: string) => void;
  updateSavedLoadout: (id: string, updates: Partial<Loadout>) => void;

  setCurrentMode: (mode: AppMode) => void;
  setComparisonSlots: (slots: unknown[]) => void;
  setComparisonRadarChart: (chart: unknown | null) => void;
  setCurrentRadarChart: (chart: unknown | null) => void;
  setSlotColors: (colors: unknown[]) => void;
  setDockEditorContext: (context: DockEditorContext) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  activeLoadout: null,
  savedLoadouts: [],
  currentMode: 'overview',
  comparisonSlots: [],
  comparisonRadarChart: null,
  currentRadarChart: null,
  slotColors: [],
  dockEditorContext: { kind: 'active' },

  // Loadout actions
  setActiveLoadout: (lo) => set({ activeLoadout: lo }),
  setSavedLoadouts: (arr) => set({ savedLoadouts: arr }),
  addSavedLoadout: (lo) => set({ savedLoadouts: [...get().savedLoadouts, lo] }),
  removeSavedLoadout: (id) => set({
    savedLoadouts: get().savedLoadouts.filter(lo => lo.id !== id)
  }),
  updateSavedLoadout: (id, updates) => set({
    savedLoadouts: get().savedLoadouts.map(lo =>
      lo.id === id ? { ...lo, ...updates } : lo
    )
  }),

  // App state actions
  setCurrentMode: (mode) => set({ currentMode: mode }),
  setComparisonSlots: (slots) => set({ comparisonSlots: slots }),
  setComparisonRadarChart: (chart) => set({ comparisonRadarChart: chart }),
  setCurrentRadarChart: (chart) => set({ currentRadarChart: chart }),
  setSlotColors: (colors) => set({ slotColors: colors }),
  setDockEditorContext: (context) => set({ dockEditorContext: context }),
}));

// Convenience selectors for useSyncExternalStore compatibility
export const getState = () => useAppStore.getState();
export const subscribe = useAppStore.subscribe;
