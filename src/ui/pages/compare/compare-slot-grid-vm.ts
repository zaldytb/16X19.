import type { Slot } from './types.js';

export interface CompareSlotGridItemVm {
  slot: Slot;
  animationDelay: number;
}

export function buildCompareSlotGridViewModel(slots: Slot[]): CompareSlotGridItemVm[] {
  return slots.map((slot, index) => ({
    slot,
    animationDelay: index * 100,
  }));
}
