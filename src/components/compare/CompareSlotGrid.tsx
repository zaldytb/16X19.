import { CompareSlotCard } from './CompareSlotCard.js';
import type { CompareSlotGridItemVm } from '../../ui/pages/compare/compare-slot-grid-vm.js';
import type { SlotId } from '../../ui/pages/compare/types.js';

type Props = {
  items: CompareSlotGridItemVm[];
  onAdd: (slotId: SlotId) => void;
  onEdit: (slotId: SlotId) => void;
  onRemove: (slotId: SlotId) => void;
  onTune: (slotId: SlotId) => void;
  onSetActive: (slotId: SlotId) => void;
  onSave: (slotId: SlotId, button: HTMLButtonElement | null) => void;
};

export function CompareSlotGrid({
  items,
  onAdd,
  onEdit,
  onRemove,
  onTune,
  onSetActive,
  onSave,
}: Props) {
  return (
    <div className="compare-slots-grid">
      {items.map(({ slot, animationDelay }) => (
        <CompareSlotCard
          key={slot.id}
          slot={slot}
          animationDelay={animationDelay}
          onAdd={onAdd}
          onEdit={onEdit}
          onRemove={onRemove}
          onTune={onTune}
          onSetActive={onSetActive}
          onSave={onSave}
        />
      ))}
    </div>
  );
}
