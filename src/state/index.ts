// src/state/index.ts
// State management public API

// Store functions (primary API)
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
