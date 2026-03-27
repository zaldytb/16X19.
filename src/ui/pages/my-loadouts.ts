// src/ui/pages/my-loadouts.ts
// My Loadouts panel rendering

import { RACQUETS, STRINGS } from '../../data/loader.js';
import type { Loadout } from '../../engine/types.js';
import { getObsScoreColor } from '../../engine/composite.js';
import { getActiveLoadout, getSavedLoadouts } from '../../state/store.js';

const sourceLabels: Record<string, string> = {
  quiz: 'Quiz',
  compendium: 'Bible',
  manual: '',
  preset: 'Preset',
  optimize: 'Opt',
  shared: 'Shared',
  import: 'Imp'
};

function getNumericObs(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

/**
 * Render the My Loadouts list in the dock
 */
export function renderMyLoadouts(): void {
  const listEl = document.getElementById('dock-myl-list');
  const countEl = document.getElementById('dock-myl-count');
  if (!listEl) return;

  const savedLoadouts = getSavedLoadouts();
  const activeLoadout = getActiveLoadout();

  if (countEl) countEl.textContent = String(savedLoadouts.length);

  if (savedLoadouts.length === 0) {
    listEl.innerHTML = '<div class="px-3 py-4 text-center font-mono text-[10px] text-dc-storm">No saved loadouts yet</div>';
    return;
  }

  listEl.innerHTML = savedLoadouts.map(lo => {
    const isActive = isLoadoutActive(lo, activeLoadout);
    const racquet = RACQUETS.find(r => r.id === lo.frameId);
    const frameName = racquet ? racquet.name : '\u2014';
    const stringName = getLoadoutStringName(lo);
    const srcLabel = sourceLabels[lo.source || ''] || '';
    const obsValue = getNumericObs(lo.obs);
    const obsColor = getObsScoreColor(obsValue);
    const activeBorderClass = isActive
      ? 'border-l-2 border-l-[var(--dc-accent)] bg-[var(--dc-void-lift)]'
      : 'border-l-2 border-l-transparent hover:bg-[var(--dc-void-lift)]';

    return (
      '<div class="group relative flex items-stretch border-b border-[var(--dc-border)] last:border-b-0 transition-colors ' + activeBorderClass + '" data-lo-id="' + lo.id + '">' +
        // Clickable main area
        '<div class="flex items-center gap-2.5 flex-1 min-w-0 px-3 py-2.5 cursor-pointer" onclick="switchToLoadout(\'' + lo.id + '\')">' +
          // OBS box
          '<div class="w-9 h-9 shrink-0 border border-[var(--dc-border)] flex items-center justify-center">' +
            '<span class="font-mono text-[11px] font-bold" style="color:' + obsColor + '">' + (obsValue > 0 ? obsValue.toFixed(1) : '\u2014') + '</span>' +
          '</div>' +
          // Info
          '<div class="flex-1 min-w-0">' +
            '<div class="font-sans text-[11px] font-semibold text-[var(--dc-platinum)] leading-tight truncate flex items-center gap-1">' +
              frameName +
              (isActive ? '<span class="font-mono text-[7px] uppercase tracking-wider text-[var(--dc-accent)]">Active</span>' : '') +
              (srcLabel ? '<span class="font-mono text-[7px] text-[var(--dc-storm)] border border-[var(--dc-border)] px-1">' + srcLabel + '</span>' : '') +
            '</div>' +
            '<div class="font-mono text-[9px] text-[var(--dc-storm)] truncate leading-tight mt-0.5">' + stringName + '</div>' +
            '<div class="font-mono text-[8px] text-[var(--dc-storm)]/60 mt-0.5">M' + lo.mainsTension + '/X' + lo.crossesTension + ' lbs</div>' +
          '</div>' +
        '</div>' +
        // Ghost action buttons (hover reveal)
        '<div class="flex items-stretch opacity-0 group-hover:opacity-100 transition-opacity border-l border-[var(--dc-border)]">' +
          '<button class="w-8 flex items-center justify-center text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] hover:bg-[var(--dc-void)] transition-colors" onclick="shareLoadout(\'' + lo.id + '\')" title="Share">' +
            '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7.5L8 4.5M8 4.5V7M8 4.5H5.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="1" y="1" width="10" height="10" rx="2"/></svg>' +
          '</button>' +
          '<button class="w-8 flex items-center justify-center text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] hover:bg-[var(--dc-void)] transition-colors border-l border-[var(--dc-border)]" onclick="addLoadoutToCompare(\'' + lo.id + '\')" title="Compare">' +
            '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="4" height="10" rx="0.5"/><rect x="7" y="1" width="4" height="10" rx="0.5"/></svg>' +
          '</button>' +
          '<button class="w-8 flex items-center justify-center text-[var(--dc-storm)] hover:text-[var(--dc-red)] hover:bg-[var(--dc-void)] transition-colors border-l border-[var(--dc-border)]" onclick="confirmRemoveLoadout(\'' + lo.id + '\')" title="Remove">' +
            '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

/**
 * Check if a loadout matches the active loadout
 */
function isLoadoutActive(lo: Loadout, activeLoadout: Loadout | null): boolean {
  if (!activeLoadout) return false;
  
  if (activeLoadout.id === lo.id) return true;
  
  // Deep comparison for unsaved active loadouts
  return activeLoadout.frameId === lo.frameId &&
    activeLoadout.mainsTension === lo.mainsTension &&
    activeLoadout.crossesTension === lo.crossesTension &&
    activeLoadout.isHybrid === (lo.isHybrid || false) &&
    (lo.isHybrid
      ? activeLoadout.mainsId === lo.mainsId && activeLoadout.crossesId === lo.crossesId
      : activeLoadout.stringId === lo.stringId);
}

/**
 * Get display name for a loadout's string configuration
 */
function getLoadoutStringName(lo: Loadout): string {
  if (lo.isHybrid) {
    const m = STRINGS.find(s => s.id === lo.mainsId);
    const x = STRINGS.find(s => s.id === lo.crossesId);
    return (m && x) ? (m.name + ' / ' + x.name) : '\u2014';
  } else {
    const str = STRINGS.find(s => s.id === lo.stringId);
    return str ? str.name : '\u2014';
  }
}

/**
 * Two-step remove confirmation (QA-028)
 */
export function confirmRemoveLoadout(loadoutId: string): void {
  const item = document.querySelector('[data-lo-id="' + loadoutId + '"]');
  if (!item) return;
  const actionBar = item.querySelector('div.flex.items-stretch.opacity-0, div.flex.items-stretch') as HTMLElement | null;
  if (!actionBar) return;
  actionBar.style.opacity = '1';
  actionBar.style.pointerEvents = 'auto';
  actionBar.innerHTML =
    '<span class="font-mono text-[8px] text-[var(--dc-storm)] px-2 flex items-center whitespace-nowrap">Delete?</span>' +
    '<button class="px-2 font-mono text-[9px] font-bold text-[var(--dc-red)] hover:bg-[var(--dc-void)] border-l border-[var(--dc-border)] h-full transition-colors" onclick="removeLoadout(\'' + loadoutId + '\')">Yes</button>' +
    '<button class="px-2 font-mono text-[9px] text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] border-l border-[var(--dc-border)] h-full transition-colors" onclick="renderMyLoadouts()">No</button>';
}
