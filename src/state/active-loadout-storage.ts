import type { Loadout } from '../engine/types.js';
import { loadLegacyActiveLoadout, loadLegacyActiveLoadoutId } from './legacy-storage.js';

export function persistActiveLoadout(loadout: Loadout | null): void {
  void loadout;
}

export function loadActiveLoadout(): Loadout | null {
  return loadLegacyActiveLoadout();
}

export function loadActiveLoadoutId(): string | null {
  return loadLegacyActiveLoadoutId();
}
