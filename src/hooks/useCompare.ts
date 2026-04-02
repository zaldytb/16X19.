import { useAppStore } from '../state/useAppStore.js';
import { useShallow } from 'zustand/react/shallow';
import type { CompareState } from '../ui/pages/compare/types.js';

export function useCompareState(): CompareState {
  return useAppStore(
    useShallow((state) => ({
      slots: state.comparisonSlots,
      activeSlotId: state.compareActiveSlotId,
      editingSlotId: state.compareEditingSlotId,
    })),
  );
}
