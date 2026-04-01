import { STRINGS } from '../../data/loader.js';
import { getObsScoreColor } from '../../engine/index.js';
import type { CompareSlot, EmptySlot, Slot, SlotId } from '../../ui/pages/compare/types.js';

type Props = {
  slot: Slot;
  animationDelay: number;
  onAdd: (slotId: SlotId) => void;
  onEdit: (slotId: SlotId) => void;
  onRemove: (slotId: SlotId) => void;
  onTune: (slotId: SlotId) => void;
  onSetActive: (slotId: SlotId) => void;
  onSave: (slotId: SlotId, button: HTMLButtonElement | null) => void;
};

function formatStringName(slot: CompareSlot): string {
  const l = slot.loadout;
  if (l.isHybrid && l.mainsId && l.crossesId) {
    const mains = STRINGS.find((string) => string.id === l.mainsId);
    const crosses = STRINGS.find((string) => string.id === l.crossesId);
    return `${mains?.name || l.mainsId} / ${crosses?.name || l.crossesId}`;
  }
  if (!l.stringId) return '-';
  return STRINGS.find((string) => string.id === l.stringId)?.name || l.stringId;
}

function formatTension(slot: CompareSlot): string {
  const l = slot.loadout;
  return `M${l.mainsTension} / X${l.crossesTension}`;
}

function EmptyCard({
  slot,
  animationDelay,
  onAdd,
}: {
  slot: EmptySlot;
  animationDelay: number;
  onAdd: (slotId: SlotId) => void;
}) {
  const color = slot.color;
  return (
    <div
      className={`compare-slot-card compare-slot-empty ${color.cssClass}`}
      data-slot-id={slot.id}
      style={animationDelay > 0 ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      <div className="compare-slot-empty-content">
        <div className="compare-slot-add-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 8v16M8 16h16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="compare-slot-add-text">Add build</div>
        <div className="compare-slot-add-sub">to compare</div>
      </div>
      <button type="button" className="compare-slot-add-btn" onClick={() => onAdd(slot.id)}>
        + Add
      </button>
    </div>
  );
}

function ConfiguredCard({
  slot,
  animationDelay,
  onEdit,
  onRemove,
  onTune,
  onSetActive,
  onSave,
}: {
  slot: CompareSlot;
  animationDelay: number;
  onEdit: (slotId: SlotId) => void;
  onRemove: (slotId: SlotId) => void;
  onTune: (slotId: SlotId) => void;
  onSetActive: (slotId: SlotId) => void;
  onSave: (slotId: SlotId, button: HTMLButtonElement | null) => void;
}) {
  const color = slot.color;
  const l = slot.loadout;
  const frameName = l.frameId
    ? l.frameId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Unknown';
  const stringName = formatStringName(slot);
  const tension = formatTension(slot);
  const obs = l.obs?.toFixed(1) || '-';
  const obsColor = l.obs ? getObsScoreColor(l.obs) : 'var(--dc-storm)';

  const badge = color.isPrimary ? <span className="compare-slot-badge">*</span> : null;
  const label = color.isPrimary ? 'PRIMARY' : `SLOT ${color.label}`;

  return (
    <div
      className={`compare-slot-card ${color.cssClass} ${color.isPrimary ? 'compare-slot-primary' : ''}`}
      data-slot-id={slot.id}
      style={animationDelay > 0 ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      <div className="compare-slot-header">
        {badge}
        <span className="compare-slot-label" style={{ color: color.border }}>
          {label}
        </span>
        <button
          type="button"
          className="compare-slot-remove"
          title="Remove"
          onClick={() => onRemove(slot.id)}
        />
      </div>

      <div className="compare-slot-content">
        <div className="compare-slot-frame">{frameName}</div>
        <div className="compare-slot-string">{stringName}</div>
        <div className="compare-slot-tension">{tension}</div>

        <div className="compare-slot-score">
          <span className="compare-slot-obs" style={{ color: obsColor }}>
            {obs}
          </span>
        </div>
      </div>

      <div className="compare-slot-actions">
        <button
          type="button"
          className="compare-slot-action compare-slot-action-primary"
          onClick={() => onTune(slot.id)}
        >
          Tune
        </button>
        <button type="button" className="compare-slot-action" onClick={() => onSetActive(slot.id)}>
          Set Active
        </button>
        <button
          type="button"
          className="compare-slot-action"
          onClick={(e) => onSave(slot.id, e.currentTarget)}
        >
          Save
        </button>
        <button type="button" className="compare-slot-edit" onClick={() => onEdit(slot.id)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Edit
        </button>
      </div>
    </div>
  );
}

export function CompareSlotCard(props: Props) {
  const { slot, animationDelay, onAdd, onEdit, onRemove, onTune, onSetActive, onSave } = props;
  if (slot.loadout === null) {
    return <EmptyCard slot={slot} animationDelay={animationDelay} onAdd={onAdd} />;
  }
  return (
    <ConfiguredCard
      slot={slot}
      animationDelay={animationDelay}
      onEdit={onEdit}
      onRemove={onRemove}
      onTune={onTune}
      onSetActive={onSetActive}
      onSave={onSave}
    />
  );
}
