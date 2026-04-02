// src/ui/components/dock-renderers.ts
// Dock panel renderers and context-aware panel system

import { RACQUETS, STRINGS } from '../../data/loader.js';
import { getObsScoreColor, computeCompositeScore, buildTensionContext } from '../../engine/index.js';
import type { Loadout } from '../../engine/types.js';
import { getActiveLoadout, getSavedLoadouts } from '../../state/imperative.js';
import {
  getComparisonSlots as getAppComparisonSlots,
  getDockEditorContext as getAppDockEditorContext,
  getSlotColors as getAppSlotColors,
  getCurrentMode as getAppCurrentMode
} from '../../state/imperative.js';
import { _dockGuidance, _dockIcons, _dockContextActions, _dockReturnEditorHome, _dockClearNonEditor, _dockRelocateEditorToContext } from './dock-panel.js';
import { _prevObsValues, animateOBS } from './obs-animation.js';
import { populateGaugeDropdown, setHybridMode, showFrameSpecs } from '../shared/helpers.js';
import { ssInstances } from './searchable-select.js';
import { renderDockCreateSection } from './dock-create.js';

// ---------------------------------------------------------------------------
// Callback registry — populated by shell.ts during init() to avoid circular
// imports. Cross-module dock actions are routed through these callbacks.
// ---------------------------------------------------------------------------

type DockCallbacks = {
  switchMode: (mode: string) => void;
  switchToLoadout: (loadoutId: string) => void;
  openFindMyBuild: () => void;
  addActiveLoadoutToCompare: () => void;
  compareAddSlot: (slotId: string) => void;
  compareEditSlot: (slotId: string) => void;
  compareRemoveSlot: (slotId: string) => void;
  compareClearSlot: (slotId: string) => void;
  compareGetState: () => { slots?: Array<{ id: string; loadout: unknown | null }> } | null;
  compareQuickAddSaved: (loadoutId: string) => void;
  renderCompareAll: () => void;
};

const _noop = () => {};
let _dockCallbacks: DockCallbacks = {
  switchMode: _noop,
  switchToLoadout: _noop,
  openFindMyBuild: _noop,
  addActiveLoadoutToCompare: _noop,
  compareAddSlot: _noop,
  compareEditSlot: _noop,
  compareRemoveSlot: _noop,
  compareClearSlot: _noop,
  compareGetState: () => null,
  compareQuickAddSaved: _noop,
  renderCompareAll: _noop,
};

export function registerDockCallbacks(cbs: Partial<DockCallbacks>): void {
  _dockCallbacks = { ..._dockCallbacks, ...cbs };
}

let _dockGlobalDelegateBound = false;

/**
 * Document-level delegated listener for dock actions outside the context panel.
 * Binds once globally to handle mobile pill buttons and other dock-level actions.
 */
function _bindDockGlobalDelegate(): void {
  if (_dockGlobalDelegateBound) return;
  _dockGlobalDelegateBound = true;
  document.addEventListener('click', (e: Event) => {
    const el = (e.target as Element).closest('[data-dock-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.dockAction;
    const slotId = el.dataset.slotId;
    if (action === 'switchToLoadout' && slotId) {
      _dockCallbacks.switchToLoadout(slotId);
    }
  });
}

/**
 * Set up a single delegated listener on the dock context panel container.
 * Called by renderDockContextPanel after setting innerHTML.
 */
function _bindDockContextPanel(container: HTMLElement): void {
  if ((container as HTMLElement & { _dockBound?: boolean })._dockBound) return;
  (container as HTMLElement & { _dockBound?: boolean })._dockBound = true;

  container.addEventListener('click', (e: Event) => {
    const el = (e.target as Element).closest('[data-dock-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.dockAction;
    const arg = el.dataset.dockArg;
    const slotId = el.dataset.slotId;
    const slotIndex = el.dataset.slotIndex;

    switch (action) {
      case 'switchMode':
        if (arg) _dockCallbacks.switchMode(arg);
        break;
      case 'switchToLoadout':
        if (slotId) _dockCallbacks.switchToLoadout(slotId);
        break;
      case 'openFindMyBuild':
        _dockCallbacks.openFindMyBuild();
        break;
      case 'addActiveLoadoutToCompare':
        _dockCallbacks.addActiveLoadoutToCompare();
        break;
      case 'compareAddSlot':
        if (slotId) _dockCallbacks.compareAddSlot(slotId);
        break;
      case 'compareEditSlot':
        if (slotId) _dockCallbacks.compareEditSlot(slotId);
        break;
      case 'compareRemoveSlot':
        if (slotId) _dockCallbacks.compareRemoveSlot(slotId);
        break;
      case 'compareEditLegacy':
        if (slotIndex != null) _dockCompareEdit(Number(slotIndex));
        break;
      case 'compareRemoveLegacy':
        if (slotIndex != null) _dockCompareRemove(Number(slotIndex));
        break;
    }
  });
}

type DockComparisonSlot = {
  racquetId: string;
  stringId?: string;
  mainsId?: string;
  crossesId?: string;
  mainsTension: number;
  crossesTension: number;
  isHybrid?: boolean;
  stats?: Record<string, number>;
  identity?: { archetype?: string };
};

type DockSlotColor = { border: string; label: string; cssClass: string };

function getNumericObs(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function _escapeDockHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Structured “current build” summary for Bible / Optimize dock panels */
function _dockCurrentBuildCardHtml(opts: {
  sectionLabel: string;
  headline: string;
  frameLine: string;
  stringsLine: string;
  tensionShort: string;
  obsNum: string;
}): string {
  const obsChip = opts.obsNum === '\u2014' || opts.obsNum === '—' ? '\u2014' : opts.obsNum;
  const frameRow =
    opts.frameLine.trim() === ''
      ? ''
      : `<div class="dock-ctx-meta-row">
          <dt>Frame</dt>
          <dd>${_escapeDockHtml(opts.frameLine)}</dd>
        </div>`;
  return `
    <div class="dock-ctx-current-card">
      <div class="dock-ctx-current-top">
        <span class="dock-ctx-label dock-ctx-label--card">${opts.sectionLabel}</span>
        <div class="dock-ctx-obs-block">
          <span class="dock-ctx-obs-cap">OBS</span>
          <span class="dock-ctx-obs-pill">${_escapeDockHtml(obsChip)}</span>
        </div>
      </div>
      <p class="dock-ctx-current-headline">${_escapeDockHtml(opts.headline)}</p>
      <dl class="dock-ctx-meta-grid">
        ${frameRow}
        <div class="dock-ctx-meta-row">
          <dt>Strings</dt>
          <dd>${_escapeDockHtml(opts.stringsLine)}</dd>
        </div>
        <div class="dock-ctx-meta-row">
          <dt>Tension</dt>
          <dd class="dock-ctx-meta-mono">${_escapeDockHtml(opts.tensionShort)}</dd>
        </div>
      </dl>
    </div>`;
}

function getComparisonSlots(): DockComparisonSlot[] {
  return getAppComparisonSlots()
    .filter((slot) => slot.loadout !== null && slot.stats !== null)
    .map((slot) => ({
      racquetId: slot.loadout.frameId,
      stringId: slot.loadout.stringId || undefined,
      mainsId: slot.loadout.mainsId || undefined,
      crossesId: slot.loadout.crossesId || undefined,
      mainsTension: slot.loadout.mainsTension,
      crossesTension: slot.loadout.crossesTension,
      isHybrid: slot.loadout.isHybrid || false,
      stats: slot.stats as unknown as Record<string, number>,
      identity: slot.loadout.identity ? { archetype: slot.loadout.identity } : undefined,
    }));
}

function getSlotColors(): DockSlotColor[] {
  return getAppSlotColors();
}

function getDockEditorContext() {
  return getAppDockEditorContext();
}

/**
 * Render the dock panel with active loadout info
 */
export function renderDockPanel(): void {
  renderDockCreateSection();
  renderDockContextPanel();
}

/**
 * Render dock context panel based on current mode
 */
export function renderDockContextPanel(): void {
  const container = document.getElementById('dock-context-panel');
  if (!container) return;

  // Clear mode-specific classes from previous render
  container.classList.remove('dock-tune-mode');

  switch (getAppCurrentMode()) {
    case 'compendium': _renderDockPanelBible(container); break;
    case 'overview':   _renderDockPanelOverview(container); break;
    case 'tune':       _renderDockPanelTune(container); break;
    case 'compare':    _renderDockPanelCompare(container); break;
    case 'optimize':   _renderDockPanelOptimize(container); break;
    case 'howitworks': _renderDockPanelReference(container); break;
    default:           _renderDockPanelOverview(container); break;
  }

  _bindDockContextPanel(container);
}

/**
 * Render Bible mode dock panel
 */
function _renderDockPanelBible(container: HTMLElement): void {
  _dockReturnEditorHome();

  const editorSection = document.getElementById('dock-editor-section');
  if (editorSection) editorSection.style.display = 'none';

  const al = getActiveLoadout();
  if (!al) {
    container.innerHTML = _dockGuidance(
      _dockIcons.racket,
      'Getting started',
      'Browse frames on the right. Each one shows its top string pairings ranked by OBS (overall build score).<br><br>Tap <strong>Set Active</strong> on any build card to load it — then you can tune tension, compare builds, and explore alternatives.'
    );
  } else {
    const racquet = RACQUETS.find(r => r.id === al.frameId);
    const frameName = racquet ? racquet.name.replace(/\s+\d+g$/, '') : '\u2014';
    const obsValue = getNumericObs(al.obs);
    const obs = obsValue > 0 ? obsValue.toFixed(1) : '\u2014';

    let stringName = '\u2014';
    if (al.isHybrid) {
      const m = STRINGS.find(s => s.id === al.mainsId);
      const x = STRINGS.find(s => s.id === al.crossesId);
      stringName = m && x ? m.name + ' / ' + x.name : '\u2014';
    } else {
      const str = STRINGS.find(s => s.id === al.stringId);
      stringName = str ? str.name : '\u2014';
    }

    const named = (al.name && al.name.trim()) ? al.name.trim() : '';
    const headline = named || frameName;
    const frameMeta = named && named !== frameName ? frameName : '';
    const tensionShort = `M${al.mainsTension} / X${al.crossesTension}`;

    container.innerHTML =
      _dockCurrentBuildCardHtml({
        sectionLabel: 'Current build',
        headline,
        frameLine: frameMeta,
        stringsLine: stringName,
        tensionShort,
        obsNum: obs,
      }) + _dockContextActions([
      { label: '\u2192 View build overview', action: 'switchMode', arg: 'overview' },
      { label: '\u2192 Tune this build', action: 'switchMode', arg: 'tune' },
      { label: '\u2192 Compare with others', action: 'switchMode', arg: 'compare' },
      { label: '\u2192 Find a better string', action: 'switchMode', arg: 'optimize' },
    ]);
  }
}

/**
 * Render Overview mode dock panel
 */
function _renderDockPanelOverview(container: HTMLElement): void {
  const al = getActiveLoadout();
  if (!al) {
    _dockReturnEditorHome();
    _dockClearNonEditor(container);
    return;
  }

  const editorBody = document.querySelector('.dock-editor-body');
  const editorAlreadyHere = editorBody && editorBody.parentElement === container;

  if (!editorAlreadyHere) {
    _dockClearNonEditor(container);
    _dockRelocateEditorToContext(container);
  } else {
    const tuneLine = container.querySelector('.dock-tune-frame-line');
    if (tuneLine) tuneLine.remove();
    const existingActions = container.querySelector('.dock-ctx-actions');
    if (existingActions) existingActions.remove();
  }

  container.insertAdjacentHTML('beforeend', _dockContextActions([
    { label: '\u2192 Tune tension curves', action: 'switchMode', arg: 'tune' },
    { label: '\u2192 Compare with saved', action: 'switchMode', arg: 'compare' },
    { label: '\u2192 Find a better string', action: 'switchMode', arg: 'optimize' },
  ]));
}

/**
 * Render Tune mode dock panel
 */
function _renderDockPanelTune(container: HTMLElement): void {
  const al = getActiveLoadout();
  if (!al) {
    _dockReturnEditorHome();
    const editorSection = document.getElementById('dock-editor-section');
    if (editorSection) editorSection.style.display = 'none';
    container.innerHTML = _dockGuidance(_dockIcons.tune, 'No build loaded',
      'Load a build from Overview or the Racket Bible to start tuning.');
    return;
  }

  container.classList.add('dock-tune-mode');

  const racquet = RACQUETS.find(r => r.id === al.frameId);
  const frameName = racquet ? racquet.name : '\u2014';

  const editorBody = document.querySelector('.dock-editor-body');
  const editorAlreadyHere = editorBody && editorBody.parentElement === container;

  if (!editorAlreadyHere) {
    _dockReturnEditorHome();
    _dockClearNonEditor(container);

    container.insertAdjacentHTML('afterbegin', `
      <div class="dock-tune-frame-line">
        <span class="dock-ctx-label">Frame</span>
        <div class="dock-tune-frame-row">
          <span class="dock-tune-frame-name">${frameName}</span>
          <a class="dock-tune-change" data-dock-action="switchMode" data-dock-arg="overview">change</a>
        </div>
      </div>
    `);

    _dockRelocateEditorToContext(container);
  } else {
    let frameLine = container.querySelector('.dock-tune-frame-line');
    if (!frameLine) {
      const editorBody = container.querySelector('.dock-editor-body');
      const frameHTML = `
        <div class="dock-tune-frame-line">
          <span class="dock-ctx-label">Frame</span>
          <div class="dock-tune-frame-row">
            <span class="dock-tune-frame-name">${frameName}</span>
            <a class="dock-tune-change" data-dock-action="switchMode" data-dock-arg="overview">change</a>
          </div>
        </div>
      `;
      if (editorBody) {
        editorBody.insertAdjacentHTML('beforebegin', frameHTML);
      } else {
        container.insertAdjacentHTML('afterbegin', frameHTML);
      }
    } else {
      const nameEl = frameLine.querySelector('.dock-tune-frame-name');
      if (nameEl) nameEl.textContent = frameName;
    }
    const existingActions = container.querySelector('.dock-ctx-actions');
    if (existingActions) existingActions.remove();
  }

  container.insertAdjacentHTML('beforeend', _dockContextActions([
    { label: '\u2192 Compare with saved', action: 'switchMode', arg: 'compare' },
    { label: '\u2192 Find a better string', action: 'switchMode', arg: 'optimize' },
    { label: '\u2192 Back to overview', action: 'switchMode', arg: 'overview' },
  ]));
}

/**
 * Render Compare mode dock panel
 * Updated for new compare system with A/B/C slots
 */
function _renderDockPanelCompare(container: HTMLElement): void {
  _dockReturnEditorHome();
  const editorSection = document.getElementById('dock-editor-section');

  let html = '';

  // Prefer compare module state; keep a fallback for older state shapes.
  const newCompareState = _dockCallbacks.compareGetState();
  
  if (newCompareState) {
    html += _renderNewComparePanel(newCompareState);
  } else {
    html += _renderComparePanelFallback();
  }

  const al = getActiveLoadout();
  const hasConfiguredSlots = newCompareState?.slots
    ? newCompareState.slots.some((s: any) => s.loadout !== null)
    : getComparisonSlots().length > 0;
  const savedLoadouts = getSavedLoadouts();
  
  if (!hasConfiguredSlots && savedLoadouts.length === 0 && !al) {
    html = _dockGuidance(_dockIcons.compare, 'Nothing to compare yet',
      'Set a build active from the Racket Bible, then come back here.');
  }

  // Actions based on state
  const validSlots = newCompareState?.slots
    ? newCompareState.slots.filter((s: any) => s.loadout !== null)
    : getComparisonSlots().filter(s => s.stats);
    
  html += _dockContextActions([
    ...(validSlots.length >= 2 ? [{ label: '\u2192 Tune active build', action: 'switchMode', arg: 'tune' }] : []),
    { label: '\u2192 Optimize from here', action: 'switchMode', arg: 'optimize' },
    { label: '\u2192 Back to overview', action: 'switchMode', arg: 'overview' },
  ]);

  container.innerHTML = html;

  const editorContext = getDockEditorContext();
  const shouldEmbedEditor = editorContext.kind === 'compare-slot';
  if (editorSection) {
    editorSection.style.display = shouldEmbedEditor ? '' : 'none';
  }
  if (shouldEmbedEditor && _dockRelocateEditorToContext(container)) {
    const intro = container.querySelector('.dock-compare-intro');
    const editorBody = container.querySelector('.dock-editor-body');
    if (intro && editorBody) {
      intro.insertAdjacentElement('afterend', editorBody as HTMLElement);
    }
  }
}

/**
 * Render compare panel with A/B/C slots from compare module state.
 */
function _renderNewComparePanel(state: any): string {
  const editorContext = getDockEditorContext();
  const activeLoadout = getActiveLoadout();
  const hasEmptySlot = state.slots.some((slot: any) => slot.loadout === null);
  let html = `
    <div class="dock-compare-intro">
      <div class="dock-ctx-label">Setup Controls</div>
      <div class="dock-compare-title">Use this dock to build and modify each compare setup</div>
      <div class="dock-compare-subtitle">${editorContext.kind === 'compare-slot'
        ? `Editing Slot ${editorContext.slotId} below. This is the only time the compare editor opens in the dock.`
        : 'This dock manages Slot A, B, and C. Import from your active setup or saved loadouts, then edit a slot when needed.'}</div>
    </div>
  `;
  if (editorContext.kind !== 'compare-slot') {
    html += '<div class="dock-compare-sources">';
    if (activeLoadout) {
      const racquet = RACQUETS.find(r => r.id === activeLoadout.frameId);
      const frameName = racquet ? racquet.name.replace(/\s+\d+g$/, '') : 'Active setup';
      html += `
        <div class="dock-compare-source-card">
          <div class="dock-ctx-label">Active Setup</div>
          <div class="dock-compare-source-title">${frameName}</div>
          <div class="dock-compare-source-copy">${hasEmptySlot ? 'Add your current active setup into the next open compare slot.' : 'All slots are filled. Adding will replace the last slot.'}</div>
          <button class="dock-compare-slot-btn dock-compare-slot-btn-primary" data-dock-action="addActiveLoadoutToCompare">Use Active Loadout</button>
        </div>
      `;
    } else {
      html += `
        <div class="dock-compare-source-card">
          <div class="dock-ctx-label">Saved Sources</div>
          <div class="dock-compare-source-copy">Use the Compare action in My Loadouts below to add a saved build into the next open slot.</div>
        </div>
      `;
    }
    html += '</div>';
  }
  html += '<div class="dock-compare-slots">';
  
  const slotColors = [
    { border: 'rgba(175, 0, 0, 0.8)', label: 'A' },
    { border: 'rgba(220, 223, 226, 0.5)', label: 'B' },
    { border: 'rgba(220, 223, 226, 0.25)', label: 'C' }
  ];
  
  state.slots.forEach((slot: any, i: number) => {
    const color = slotColors[i];
    
    if (!slot.loadout) {
      // Empty slot
      html += `
        <div class="dock-compare-slot dock-compare-slot-empty" style="border-left: 3px solid ${color.border}">
          <div class="dock-compare-slot-header">
            <span class="dock-compare-slot-label" style="color: ${color.border}">Slot ${color.label}</span>
            <span class="dock-compare-slot-obs">—</span>
          </div>
          <div class="dock-compare-slot-meta">Build this slot from scratch, or fill it from Active Setup / My Loadouts.</div>
          <button class="dock-compare-slot-btn dock-compare-slot-btn-primary" data-dock-action="compareAddSlot" data-slot-id="${slot.id}">+ Add Setup</button>
        </div>
      `;
      return;
    }
    
    // Configured slot
    const racquet = RACQUETS.find(r => r.id === slot.loadout.frameId);
    const frameName = racquet ? racquet.name.replace(/\s+\d+g$/, '') : 'Unknown';
    
    let stringName = '\u2014';
    if (slot.loadout.isHybrid) {
      const m = STRINGS.find(s => s.id === slot.loadout.mainsId);
      const x = STRINGS.find(s => s.id === slot.loadout.crossesId);
      stringName = m && x ? m.name.split(' ')[0] + '/' + x.name.split(' ')[0] : 'Hybrid';
    } else {
      const str = STRINGS.find(s => s.id === slot.loadout.stringId);
      stringName = str ? str.name.split(' ')[0] : '\u2014';
    }
    
    const obs = slot.loadout.obs?.toFixed(1) || '\u2014';
    const obsColor = slot.loadout.obs ? getObsScoreColor(slot.loadout.obs) : 'var(--dc-storm)';
    
    html += `
      <div class="dock-compare-slot" style="border-left: 3px solid ${color.border}">
        <div class="dock-compare-slot-header">
          <span class="dock-compare-slot-label" style="color: ${color.border}">${i === 0 ? '★ ' : ''}Slot ${color.label}</span>
          <span class="dock-compare-slot-obs" style="color:${obsColor}">${obs}</span>
        </div>
        <div class="dock-compare-slot-frame">${frameName}</div>
        <div class="dock-compare-slot-meta">${stringName} \u00B7 ${slot.loadout.mainsTension}/${slot.loadout.crossesTension}</div>
        <div class="dock-compare-slot-actions">
          <button class="dock-compare-slot-btn dock-compare-slot-btn-primary" data-dock-action="compareEditSlot" data-slot-id="${slot.id}">Edit Setup</button>
          <button class="dock-compare-slot-btn dock-compare-slot-remove" data-dock-action="compareRemoveSlot" data-slot-id="${slot.id}">Clear</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  return html;
}

/**
 * Render compare panel fallback for older slot state shapes.
 */
function _renderComparePanelFallback(): string {
  let html = `
    <div class="dock-compare-intro">
      <div class="dock-ctx-label">Setup Controls</div>
      <div class="dock-compare-title">Use this dock to adjust compare slots</div>
      <div class="dock-compare-subtitle">This panel is where you modify the setups feeding the compare view.</div>
    </div>
  `;
  const comparisonSlots = getComparisonSlots();
  const slotColors = getSlotColors();

  if (comparisonSlots.length > 0) {
    html += '<div class="dock-ctx-label">Compare Slots</div>';
    html += '<div class="dock-compare-slots">';
    comparisonSlots.forEach((slot, i) => {
      const color = slotColors[i];
      const racquet = RACQUETS.find(r => r.id === slot.racquetId);
      const frameName = racquet ? racquet.name.replace(/\s+\d+g$/, '') : 'Not set';

      let stringName = '\u2014';
      if (slot.isHybrid) {
        const m = STRINGS.find(s => s.id === slot.mainsId);
        const x = STRINGS.find(s => s.id === slot.crossesId);
        stringName = m && x ? m.name + ' / ' + x.name : '\u2014';
      } else {
        const str = STRINGS.find(s => s.id === slot.stringId);
        stringName = str ? str.name : '\u2014';
      }

      let obs = '\u2014';
      if (slot.stats && racquet) {
        const tensionCtx = buildTensionContext({
          mainsTension: slot.mainsTension,
          crossesTension: slot.crossesTension
        }, racquet as unknown as import('../../engine/types.js').Racquet);
        obs = computeCompositeScore(slot.stats as unknown as import('../../engine/types.js').SetupAttributes, tensionCtx).toFixed(1);
      }

      html += `
        <div class="dock-compare-slot" style="border-left: 3px solid ${color.border}">
          <div class="dock-compare-slot-header">
            <span class="dock-compare-slot-label" style="color: ${color.border}">Slot ${color.label}</span>
            <span class="dock-compare-slot-obs" style="color:${slot.stats ? getObsScoreColor(parseFloat(obs)) : 'var(--dc-storm)'}">${obs}</span>
          </div>
          <div class="dock-compare-slot-frame">${frameName}</div>
          <div class="dock-compare-slot-meta">${stringName} \u00B7 ${slot.mainsTension}/${slot.crossesTension}</div>
          <div class="dock-compare-slot-actions">
            <button class="dock-compare-slot-btn dock-compare-slot-btn-primary" data-dock-action="compareEditLegacy" data-slot-index="${i}">Edit Setup</button>
            <button class="dock-compare-slot-btn dock-compare-slot-remove" data-dock-action="compareRemoveLegacy" data-slot-index="${i}">Clear</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  return html;
}

/**
 * Edit a compare slot (legacy index-based fallback)
 */
export function _dockCompareEdit(slotIndex: number | string): void {
  const compareState = _dockCallbacks.compareGetState();
  const slot = compareState?.slots?.[Number(slotIndex)];
  if (slot?.id) {
    _dockCallbacks.compareEditSlot(slot.id);
  }
  const editor = document.getElementById('dock-editor-section');
  if (editor) {
    requestAnimationFrame(() => {
      editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}

/**
 * Remove a compare slot (legacy index-based fallback)
 */
export function _dockCompareRemove(slotIndex: number): void {
  const compareState = _dockCallbacks.compareGetState();
  if (compareState?.slots) {
    const targetSlot = compareState.slots[slotIndex];
    if (targetSlot?.id) {
      _dockCallbacks.compareClearSlot(String(targetSlot.id));
      _dockCallbacks.renderCompareAll();
      renderDockContextPanel();
      return;
    }
  }

  const comparisonSlots = getComparisonSlots();
  comparisonSlots.splice(slotIndex, 1);
  _dockCallbacks.renderCompareAll();
  renderDockContextPanel();
}

/**
 * Quick add a loadout to compare
 */
export function _dockCompareQuickAdd(loadoutId: string): void {
  const savedLoadouts = getSavedLoadouts();
  const lo = savedLoadouts.find(l => l.id === loadoutId);
  if (!lo) return;

  const compareState = _dockCallbacks.compareGetState();
  if (compareState?.slots) {
    _dockCallbacks.compareQuickAddSaved(loadoutId);
    renderDockContextPanel();
    return;
  }

  const comparisonSlots = getComparisonSlots();
  if (comparisonSlots.length >= 3) return;
  _dockCallbacks.renderCompareAll();
  renderDockContextPanel();
}

/**
 * Render Optimize mode dock panel
 */
function _renderDockPanelOptimize(container: HTMLElement): void {
  _dockReturnEditorHome();
  const editorSection = document.getElementById('dock-editor-section');
  if (editorSection) editorSection.style.display = 'none';

  const al = getActiveLoadout();
  if (!al) {
    container.innerHTML = _dockGuidance(
      _dockIcons.optimize,
      'No build to optimize from',
      'Load a build first — the optimizer finds better string pairings for your current frame.'
    ) + _dockContextActions([
      { label: '\u2192 Browse the Racket Bible', action: 'switchMode', arg: 'compendium' },
      { label: '\u2192 Try the quiz', action: 'openFindMyBuild' },
    ]);
    return;
  }

  const racquet = RACQUETS.find(r => r.id === al.frameId);
  const obsValue = getNumericObs(al.obs);
  const obs = obsValue > 0 ? obsValue.toFixed(1) : '\u2014';

  let stringName = '\u2014';
  if (al.isHybrid) {
    const m = STRINGS.find(s => s.id === al.mainsId);
    const x = STRINGS.find(s => s.id === al.crossesId);
    stringName = m && x ? m.name + ' / ' + x.name : '\u2014';
  } else {
    const str = STRINGS.find(s => s.id === al.stringId);
    stringName = str ? str.name : '\u2014';
  }

  const tensionShort = `M${al.mainsTension} / X${al.crossesTension}`;
  const frameLine = racquet ? racquet.name.replace(/\s+\d+g$/, '') : '\u2014';
  const named = (al.name && al.name.trim()) ? al.name.trim() : '';
  const headline = named || frameLine;
  const frameMeta = named && named !== frameLine ? frameLine : '';

  container.innerHTML =
    _dockCurrentBuildCardHtml({
      sectionLabel: 'Optimizing from',
      headline,
      frameLine: frameMeta,
      stringsLine: stringName,
      tensionShort,
      obsNum: obs,
    }) +     _dockContextActions([
    { label: '\u2192 Back to overview', action: 'switchMode', arg: 'overview' },
    { label: '\u2192 Tune this build', action: 'switchMode', arg: 'tune' },
    { label: '\u2192 Compare top results', action: 'switchMode', arg: 'compare' },
  ]);
}

/**
 * Render Reference/How It Works mode dock panel
 */
function _renderDockPanelReference(container: HTMLElement): void {
  _dockReturnEditorHome();
  const editorSection = document.getElementById('dock-editor-section');
  if (editorSection) editorSection.style.display = 'none';

  const al = getActiveLoadout();
  const actions = al
    ? [
        { label: '\u2192 Back to your build', action: 'switchMode', arg: 'overview' },
        { label: '\u2192 Tune tension curves', action: 'switchMode', arg: 'tune' },
      ]
    : [
        { label: '\u2192 Browse the Racket Bible', action: 'switchMode', arg: 'compendium' },
        { label: '\u2192 Try the quiz', action: 'openFindMyBuild' },
      ];

  container.innerHTML = _dockGuidance(
    _dockIcons.reference,
    'Reference',
    "You're reading how the prediction engine works."
  ) + _dockContextActions(actions);
}

/**
 * Update dock state (alias for renderDockPanel)
 */
export function renderDockState(): void {
  renderDockPanel();
}
