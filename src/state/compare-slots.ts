import type { Loadout, SetupStats } from '../engine/types.js';
import type { Slot, SlotId } from '../ui/pages/compare/types.js';
import { SLOT_COLORS, getSlotColor } from '../ui/pages/compare/types.js';

export const COMPARE_SLOTS_KEY = 'tll-compare-slots';

type PersistedSlot = { id: SlotId; loadout: Loadout; stats: SetupStats } | null;

function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch (_error) {
    return null;
  }
}

export function createFreshCompareSlots(): Slot[] {
  return SLOT_COLORS.map((color) => ({
    id: color.id,
    color,
    loadout: null,
    stats: null,
  }));
}

export function normalizeCompareSlots<T extends { loadout: unknown | null; stats: unknown | null }>(
  slots: T[],
): T[] {
  return slots.map((slot) => {
    if (slot.loadout !== null && slot.stats == null) {
      return {
        ...slot,
        loadout: null,
        stats: null,
      };
    }
    return slot;
  });
}

export function loadLegacyCompareSlots(): Slot[] | null {
  const storage = getBrowserStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(COMPARE_SLOTS_KEY);
    if (!raw) return null;

    const parsed: PersistedSlot[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    return SLOT_COLORS.map((color, index) => {
      const entry = parsed[index];
      if (entry && entry.loadout && entry.stats) {
        return { id: color.id, color, loadout: entry.loadout, stats: entry.stats };
      }
      return { id: color.id, color, loadout: null, stats: null };
    });
  } catch (_error) {
    return null;
  }
}

export function persistLegacyCompareSlots(slots: Slot[]): void {
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    const normalized = normalizeCompareSlots(slots);
    const payload: PersistedSlot[] = normalized.map((slot) =>
      slot.loadout && slot.stats ? { id: slot.id, loadout: slot.loadout, stats: slot.stats } : null,
    );

    if (payload.some(Boolean)) {
      storage.setItem(COMPARE_SLOTS_KEY, JSON.stringify(payload));
    } else {
      storage.removeItem(COMPARE_SLOTS_KEY);
    }
  } catch (_error) {
    // Ignore storage failures.
  }
}

export function reconcileSlotColors(slots: Slot[]): Slot[] {
  return slots.map((slot) => ({
    ...slot,
    id: slot.id,
    color: getSlotColor(slot.id),
  }));
}
