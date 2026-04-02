// src/state/useAppStore.ts
// Zustand store combining loadout state and app state.

import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import type { Loadout, SetupStats } from '../engine/types.js';
import type { RadarDataset, Slot, SlotColor, SlotId } from '../ui/pages/compare/types.js';
import { createFreshCompareSlots, loadLegacyCompareSlots, normalizeCompareSlots, persistLegacyCompareSlots, reconcileSlotColors } from './compare-slots.js';
import {
  ACTIVE_LOADOUT_ID_KEY,
  ACTIVE_LOADOUT_KEY,
  SAVED_LOADOUTS_KEY,
  getBrowserStorage,
  loadLegacyActiveLoadout,
  loadLegacyActiveLoadoutId,
  loadLegacySavedLoadouts,
} from './legacy-storage.js';

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

type PersistedAppState = {
  activeLoadout: Loadout | null;
  savedLoadouts: Loadout[];
  comparisonSlots: Slot[];
  compareEditingSlotId: SlotId | null;
  compareActiveSlotId: SlotId | null;
};

function getInitialSavedLoadouts(): Loadout[] {
  return loadLegacySavedLoadouts();
}

function getInitialActiveLoadout(savedLoadouts: Loadout[]): Loadout | null {
  const activeLoadout = loadLegacyActiveLoadout();
  if (activeLoadout) return activeLoadout;

  const activeId = loadLegacyActiveLoadoutId();
  if (!activeId) return null;

  const matched = savedLoadouts.find((loadout) => loadout.id === activeId);
  return matched ? { ...matched, _dirty: false } : null;
}

function getInitialComparisonSlots(): Slot[] {
  return normalizeCompareSlots(loadLegacyCompareSlots() ?? createFreshCompareSlots());
}

function migrateLegacyState(): PersistedAppState {
  const savedLoadouts = getInitialSavedLoadouts();
  return {
    activeLoadout: getInitialActiveLoadout(savedLoadouts),
    savedLoadouts,
    comparisonSlots: getInitialComparisonSlots(),
    compareEditingSlotId: null,
    compareActiveSlotId: null,
  };
}

function normalizeSlotPayload(slots: Slot[]): Slot[] {
  return reconcileSlotColors(normalizeCompareSlots(slots));
}

export interface AppState {
  // Loadout state
  activeLoadout: Loadout | null;
  savedLoadouts: Loadout[];

  // App state
  currentMode: AppMode;
  comparisonSlots: Slot[];
  comparisonRadarChart: RadarDataset[] | null;
  currentRadarChart: RadarDataset[] | null;
  slotColors: SlotColor[];
  dockEditorContext: DockEditorContext;
  compareEditingSlotId: SlotId | null;
  compareActiveSlotId: SlotId | null;

  // Actions
  setActiveLoadout: (lo: Loadout | null) => void;
  setSavedLoadouts: (arr: Loadout[]) => void;
  addSavedLoadout: (lo: Loadout) => void;
  removeSavedLoadout: (id: string) => void;
  updateSavedLoadout: (id: string, updates: Partial<Loadout>) => void;

  setCurrentMode: (mode: AppMode) => void;
  setComparisonSlots: (slots: Slot[]) => void;
  setCompareSlotLoadout: (slotId: SlotId, loadout: Loadout, stats: SetupStats) => void;
  clearCompareSlot: (slotId: SlotId) => void;
  moveCompareSlot: (fromId: SlotId, toId: SlotId) => void;
  setCompareEditingSlot: (slotId: SlotId | null) => void;
  resetCompare: () => void;
  setComparisonRadarChart: (chart: RadarDataset[] | null) => void;
  setCurrentRadarChart: (chart: RadarDataset[] | null) => void;
  setSlotColors: (colors: SlotColor[]) => void;
  setDockEditorContext: (context: DockEditorContext) => void;
}

const initialSavedLoadouts = getInitialSavedLoadouts();
const initialState = {
  activeLoadout: getInitialActiveLoadout(initialSavedLoadouts),
  savedLoadouts: initialSavedLoadouts,
  currentMode: 'overview' as AppMode,
  comparisonSlots: getInitialComparisonSlots(),
  comparisonRadarChart: null,
  currentRadarChart: null,
  slotColors: [],
  dockEditorContext: { kind: 'active' } as DockEditorContext,
  compareEditingSlotId: null as SlotId | null,
  compareActiveSlotId: null as SlotId | null,
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        setActiveLoadout: (lo) => set({ activeLoadout: lo }),
        setSavedLoadouts: (arr) => set({ savedLoadouts: arr }),
        addSavedLoadout: (lo) => set({ savedLoadouts: [...get().savedLoadouts, lo] }),
        removeSavedLoadout: (id) =>
          set({
            savedLoadouts: get().savedLoadouts.filter((loadout) => loadout.id !== id),
          }),
        updateSavedLoadout: (id, updates) =>
          set({
            savedLoadouts: get().savedLoadouts.map((loadout) =>
              loadout.id === id ? { ...loadout, ...updates } : loadout,
            ),
          }),

        setCurrentMode: (mode) => set({ currentMode: mode }),
        setComparisonSlots: (slots) => set({ comparisonSlots: normalizeSlotPayload(slots) }),
        setCompareSlotLoadout: (slotId, loadout, stats) =>
          set((state) => ({
            comparisonSlots: normalizeSlotPayload(
              state.comparisonSlots.map((slot) =>
                slot.id === slotId
                  ? {
                      id: slotId,
                      color: slot.color,
                      loadout,
                      stats,
                    }
                  : slot,
              ),
            ),
            compareActiveSlotId: slotId,
          })),
        clearCompareSlot: (slotId) =>
          set((state) => ({
            comparisonSlots: normalizeSlotPayload(
              state.comparisonSlots.map((slot) =>
                slot.id === slotId
                  ? {
                      id: slotId,
                      color: slot.color,
                      loadout: null,
                      stats: null,
                    }
                  : slot,
              ),
            ),
            compareActiveSlotId: state.compareActiveSlotId === slotId ? null : state.compareActiveSlotId,
            compareEditingSlotId: state.compareEditingSlotId === slotId ? null : state.compareEditingSlotId,
          })),
        moveCompareSlot: (fromId, toId) =>
          set((state) => {
            const fromSlot = state.comparisonSlots.find((slot) => slot.id === fromId);
            const toSlot = state.comparisonSlots.find((slot) => slot.id === toId);
            if (!fromSlot || !toSlot) return {};

            return {
              comparisonSlots: normalizeSlotPayload(
                state.comparisonSlots.map((slot) => {
                  if (slot.id === fromId) {
                    return {
                      ...toSlot,
                      id: fromId,
                    };
                  }
                  if (slot.id === toId) {
                    return {
                      ...fromSlot,
                      id: toId,
                    };
                  }
                  return slot;
                }),
              ),
            };
          }),
        setCompareEditingSlot: (slotId) => set({ compareEditingSlotId: slotId }),
        resetCompare: () =>
          set({
            comparisonSlots: createFreshCompareSlots(),
            compareActiveSlotId: null,
            compareEditingSlotId: null,
          }),
        setComparisonRadarChart: (chart) => set({ comparisonRadarChart: chart }),
        setCurrentRadarChart: (chart) => set({ currentRadarChart: chart }),
        setSlotColors: (colors) => set({ slotColors: colors }),
        setDockEditorContext: (context) => set({ dockEditorContext: context }),
      }),
      {
        name: 'tll-app-state',
        version: 1,
        partialize: (state) => ({
          activeLoadout: state.activeLoadout,
          savedLoadouts: state.savedLoadouts,
          comparisonSlots: state.comparisonSlots,
          compareEditingSlotId: state.compareEditingSlotId,
          compareActiveSlotId: state.compareActiveSlotId,
        }),
        migrate: (persistedState, version) => {
          if (version < 1) {
            const legacyState = migrateLegacyState();
            const state =
              persistedState && typeof persistedState === 'object'
                ? (persistedState as Partial<PersistedAppState>)
                : {};

            return {
              ...legacyState,
              ...state,
              comparisonSlots: normalizeSlotPayload(
                Array.isArray(state.comparisonSlots) ? state.comparisonSlots : legacyState.comparisonSlots,
              ),
              compareEditingSlotId: state.compareEditingSlotId ?? legacyState.compareEditingSlotId,
              compareActiveSlotId: state.compareActiveSlotId ?? legacyState.compareActiveSlotId,
            };
          }

          const state =
            persistedState && typeof persistedState === 'object'
              ? (persistedState as PersistedAppState)
              : migrateLegacyState();

          return {
            ...state,
            comparisonSlots: normalizeSlotPayload(state.comparisonSlots),
          };
        },
        merge: (persistedState, currentState) => {
          const state =
            persistedState && typeof persistedState === 'object'
              ? (persistedState as Partial<PersistedAppState>)
              : {};

          return {
            ...currentState,
            ...state,
            comparisonSlots: normalizeSlotPayload(
              Array.isArray(state.comparisonSlots)
                ? state.comparisonSlots
                : currentState.comparisonSlots,
            ),
            compareEditingSlotId: state.compareEditingSlotId ?? currentState.compareEditingSlotId,
            compareActiveSlotId: state.compareActiveSlotId ?? currentState.compareActiveSlotId,
          };
        },
        storage: createJSONStorage(() => ({
          getItem: (name) => {
            const storage = getBrowserStorage();
            if (!storage) return null;

            const raw = storage.getItem(name);
            if (raw) return raw;

            const legacyState = migrateLegacyState();
            return JSON.stringify({
              state: legacyState,
              version: 1,
            });
          },
          setItem: (name, value) => {
            const storage = getBrowserStorage();
            if (!storage) return;
            storage.setItem(name, value);
          },
          removeItem: (name) => {
            const storage = getBrowserStorage();
            if (!storage) return;
            storage.removeItem(name);
          },
        })),
      },
    ),
  ),
);

useAppStore.subscribe(
  (state) => state.comparisonSlots,
  (slots) => {
    persistLegacyCompareSlots(slots);
  },
);

useAppStore.subscribe(
  (state) => ({
    activeLoadout: state.activeLoadout,
    savedLoadouts: state.savedLoadouts,
  }),
  ({ activeLoadout, savedLoadouts }) => {
    const storage = getBrowserStorage();
    if (!storage) return;

    try {
      if (activeLoadout) {
        storage.setItem(ACTIVE_LOADOUT_KEY, JSON.stringify(activeLoadout));
        storage.setItem(ACTIVE_LOADOUT_ID_KEY, activeLoadout.id);
      } else {
        storage.removeItem(ACTIVE_LOADOUT_KEY);
        storage.removeItem(ACTIVE_LOADOUT_ID_KEY);
      }

      storage.setItem(SAVED_LOADOUTS_KEY, JSON.stringify(savedLoadouts));
    } catch (_error) {
      // Ignore storage failures.
    }
  },
);

// Convenience selectors for useSyncExternalStore compatibility.
export const getState = () => useAppStore.getState();
export const subscribe = useAppStore.subscribe;
