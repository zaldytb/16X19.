// src/state/index.ts
// State management public API

// Zustand store (primary for React)
export { useAppStore, type AppMode, type DockEditorContext } from './useAppStore.js';

// Store functions (backward compatibility)
export {
  getActiveLoadout,
  getSavedLoadouts,
  setActiveLoadout,
  setSavedLoadouts,
  addSavedLoadout,
  removeSavedLoadout,
  updateSavedLoadout,
  subscribe
} from './store.js';

// Legacy loadout functions (delegated to store)
export {
  createLoadout,
  saveLoadout,
  removeLoadout,
  switchToLoadout,
  getSetupFromLoadout,
  persistSavedLoadouts,
  loadSavedLoadouts,
  exportLoadouts,
  importLoadouts
} from './loadout.js';

// Setup sync functions
export {
  getCurrentSetup,
  syncCompendiumWithActiveLoadout,
  syncStringCompendiumWithActiveLoadout
} from './setup-sync.js';

// Shared app runtime state (backward compatibility)
export {
  getCurrentMode,
  setCurrentMode,
  getComparisonSlots,
  setComparisonSlots,
  getComparisonRadarChart,
  setComparisonRadarChart,
  getCurrentRadarChart,
  setCurrentRadarChart,
  getSlotColors,
  setSlotColors,
  installWindowAppStateBridge
} from './app-state.js';
