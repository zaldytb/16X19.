/**
 * Slot mutations + loadout scoring for compare without importing compare/index (heavy UI).
 * Used by leaderboard, presets, and re-exported from compare/index for shell.
 * Dock refresh flows through useCompareState.notify → compare-refresh-bridge → coordinator.
 */

import type { Loadout, Racquet, SetupStats, StringData } from '../../../engine/types.js';
import {
  buildTensionContext,
  computeCompositeScore,
  generateIdentity,
  predictSetup,
} from '../../../engine/index.js';
import { RACQUETS, STRINGS } from '../../../data/loader.js';
import {
  getFirstEmptySlot,
  getState,
  setSlotLoadout,
} from './hooks/useCompareState.js';
import type { SlotId } from './types.js';

type CompareLoadout = Loadout & {
  sourceLoadoutId?: string | null;
  snapshotObs?: number;
};

const compareRacquets = RACQUETS as unknown as Racquet[];
const compareStrings = STRINGS as unknown as StringData[];

export function toTrackedCompareLoadout(loadout: Loadout): CompareLoadout {
  const compareLoadout = { ...loadout } as CompareLoadout;
  if (compareLoadout.sourceLoadoutId == null) {
    compareLoadout.sourceLoadoutId = loadout.id || null;
  }
  if (compareLoadout.snapshotObs == null) {
    compareLoadout.snapshotObs = loadout.obs ?? 0;
  }
  return compareLoadout;
}

/**
 * Add a loadout to a specific slot (scores; `setSlotLoadout` triggers coordinator via bridge).
 */
export function addLoadoutToSlot(slotId: SlotId, loadout: Loadout): void {
  const racquet = compareRacquets.find((r) => r.id === loadout.frameId);
  if (!racquet) return;

  let stringConfig;
  if (loadout.isHybrid && loadout.mainsId && loadout.crossesId) {
    const mains = compareStrings.find((s) => s.id === loadout.mainsId);
    const crosses = compareStrings.find((s) => s.id === loadout.crossesId);
    if (!mains || !crosses) return;
    stringConfig = {
      isHybrid: true as const,
      mains,
      crosses,
      mainsTension: loadout.mainsTension,
      crossesTension: loadout.crossesTension,
    };
  } else {
    const string = compareStrings.find((s) => s.id === loadout.stringId);
    if (!string) return;
    stringConfig = {
      isHybrid: false as const,
      string,
      mainsTension: loadout.mainsTension,
      crossesTension: loadout.crossesTension,
    };
  }

  const stats = predictSetup(racquet, stringConfig);
  const tensionContext = buildTensionContext(
    {
      mainsTension: loadout.mainsTension,
      crossesTension: loadout.crossesTension,
    },
    racquet,
  );
  const nextLoadout: CompareLoadout = {
    ...toTrackedCompareLoadout(loadout),
    stats,
    obs: +computeCompositeScore(stats, tensionContext).toFixed(1),
    identity: generateIdentity(stats, racquet, stringConfig)?.name || loadout.identity,
  };

  setSlotLoadout(slotId, nextLoadout, stats as SetupStats);
}

export function addLoadoutToNextAvailableSlot(loadout: Loadout): SlotId | null {
  const emptySlotId = getFirstEmptySlot();
  if (!emptySlotId) return null;
  addLoadoutToSlot(emptySlotId, loadout);
  return emptySlotId;
}

export function addLoadoutToPreferredSlot(loadout: Loadout): SlotId | null {
  const emptySlotId = getFirstEmptySlot();
  if (emptySlotId) {
    addLoadoutToSlot(emptySlotId, loadout);
    return emptySlotId;
  }

  const slots = getState().slots;
  const fallbackSlotId = slots[slots.length - 1]?.id ?? null;
  if (!fallbackSlotId) return null;

  addLoadoutToSlot(fallbackSlotId, loadout);
  return fallbackSlotId;
}
