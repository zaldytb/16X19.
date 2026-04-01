// Pure selectors over AppState (for tests, hooks, and imperative getCurrentSetup).

import type { AppState } from './useAppStore.js';
import { getSetupFromLoadout } from './setup-from-loadout.js';

export function selectActiveLoadout(state: AppState) {
  return state.activeLoadout;
}

export function selectSavedLoadouts(state: AppState) {
  return state.savedLoadouts;
}

export function selectCurrentMode(state: AppState) {
  return state.currentMode;
}

export function selectComparisonSlots(state: AppState) {
  return state.comparisonSlots;
}

export function selectComparisonRadarChart(state: AppState) {
  return state.comparisonRadarChart;
}

export function selectCurrentRadarChart(state: AppState) {
  return state.currentRadarChart;
}

export function selectSlotColors(state: AppState) {
  return state.slotColors;
}

export function selectDockEditorContext(state: AppState) {
  return state.dockEditorContext;
}

export function selectCurrentSetup(state: AppState) {
  return getSetupFromLoadout(state.activeLoadout);
}
