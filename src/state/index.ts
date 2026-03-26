// src/state/index.ts
// State management public API

export {
  getActiveLoadout,
  getSavedLoadouts,
  setActiveLoadout,
  setSavedLoadouts,
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

export {
  getCurrentSetup,
  syncCompendiumWithActiveLoadout,
  syncStringCompendiumWithActiveLoadout
} from './setup-sync.js';
