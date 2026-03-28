/**
 * Slot Card Component
 * Premium-styled comparison slot card
 */

import { STRINGS } from '../../../../data/loader.js';
import { getObsScoreColor } from '../../../../engine/index.js';
import type { CompareSlot, EmptySlot, Slot, SlotId } from '../types.js';

export interface SlotCardProps {
  slot: Slot;
  onEdit: (slotId: SlotId) => void;
  onRemove: (slotId: SlotId) => void;
  onAdd: (slotId: SlotId) => void;
  onTune: (slotId: SlotId) => void;
  onSetActive: (slotId: SlotId) => void;
  onSave: (slotId: SlotId) => void;
  animationDelay?: number;
}

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

export function renderSlotCard(props: SlotCardProps): string {
  const { slot, animationDelay = 0 } = props;
  const color = slot.color;
  const isEmpty = slot.loadout === null;

  const animationStyle = animationDelay > 0 ? `style="animation-delay: ${animationDelay}ms"` : '';

  if (isEmpty) {
    return renderEmptySlot(slot, animationStyle);
  }

  return renderConfiguredSlot(slot as CompareSlot, animationStyle);
}

function renderEmptySlot(slot: EmptySlot, animationStyle: string): string {
  const color = slot.color;

  return `
    <div class="compare-slot-card compare-slot-empty ${color.cssClass}"
         data-slot-id="${slot.id}"
         ${animationStyle}>
      <div class="compare-slot-empty-content">
        <div class="compare-slot-add-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 8v16M8 16h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="compare-slot-add-text">Add build</div>
        <div class="compare-slot-add-sub">to compare</div>
      </div>
      <button class="compare-slot-add-btn" data-slot-id="${slot.id}" onclick="window.compareAddSlot('${slot.id}')">
        + Add
      </button>
    </div>
  `;
}

function renderConfiguredSlot(slot: CompareSlot, animationStyle: string): string {
  const color = slot.color;
  const l = slot.loadout;
  const frameName = l.frameId ? l.frameId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown';
  const stringName = formatStringName(slot);
  const tension = formatTension(slot);
  const obs = l.obs?.toFixed(1) || '-';
  const obsColor = l.obs ? getObsScoreColor(l.obs) : 'var(--dc-storm)';

  const badge = color.isPrimary ? '<span class="compare-slot-badge">*</span>' : '';
  const label = color.isPrimary ? 'PRIMARY' : `SLOT ${color.label}`;

  return `
    <div class="compare-slot-card ${color.cssClass} ${color.isPrimary ? 'compare-slot-primary' : ''}"
         data-slot-id="${slot.id}"
         ${animationStyle}>
      <div class="compare-slot-header">
        ${badge}
        <span class="compare-slot-label" style="color: ${color.border}">${label}</span>
        <button class="compare-slot-remove" onclick="window.compareRemoveSlot('${slot.id}')" title="Remove"></button>
      </div>

      <div class="compare-slot-content">
        <div class="compare-slot-frame">${frameName}</div>
        <div class="compare-slot-string">${stringName}</div>
        <div class="compare-slot-tension">${tension}</div>

        <div class="compare-slot-score">
          <span class="compare-slot-obs" style="color: ${obsColor}">${obs}</span>
        </div>
      </div>

      <div class="compare-slot-actions">
        <button class="compare-slot-action compare-slot-action-primary" onclick="window.compareTuneSlot('${slot.id}')">
          Tune
        </button>
        <button class="compare-slot-action" onclick="window.compareSetActiveSlot('${slot.id}')">
          Set Active
        </button>
        <button class="compare-slot-action" onclick="window.compareSaveSlot('${slot.id}', this)">
          Save
        </button>
        <button class="compare-slot-edit" onclick="window.compareEditSlot('${slot.id}')">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Edit
        </button>
      </div>
    </div>
  `;
}

export function mountSlotCard(container: HTMLElement, props: SlotCardProps): void {
  container.innerHTML = renderSlotCard(props);
}

export function updateSlotScore(slotId: string, newObs: number): void {
  const card = document.querySelector(`.compare-slot-card[data-slot-id="${slotId}"]`);
  if (!card) return;

  const obsEl = card.querySelector('.compare-slot-obs');
  if (obsEl) {
    obsEl.textContent = newObs.toFixed(1);
    obsEl.setAttribute('style', `color: ${getObsScoreColor(newObs)}`);
  }
}
