/**
 * Diff Battery — legacy string API; view-model lives in compare-diff-battery-vm.ts.
 */

import type { CompareSlot } from '../types.js';
import {
  type DiffRow,
  getTopDifferences as getTopDifferencesVm,
} from '../compare-diff-battery-vm.js';

export type { DiffRow } from '../compare-diff-battery-vm.js';

export function getTopDifferences(slots: CompareSlot[], count: number = 3): DiffRow[] {
  return getTopDifferencesVm(slots, count);
}
