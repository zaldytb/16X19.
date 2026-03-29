// src/ui/components/dock-renderers.ts
// Dock panel renderers and context-aware panel system

import { RACQUETS, STRINGS } from '../../data/loader.js';
import { getObsScoreColor, computeCompositeScore, buildTensionContext } from '../../engine/composite.js';
import type { Loadout } from '../../engine/types.js';
import { getActiveLoadout, getSavedLoadouts } from '../../state/store.js';
import {
  getComparisonSlots as getAppComparisonSlots,
  getDockEditorContext as getAppDockEditorContext,
  getSlotColors as getAppSlotColors,
  getCurrentMode as getAppCurrentMode
} from '../../state/app-state.js';
import { _dockGuidance, _dockIcons, _dockContextActions, _dockReturnEditorHome, _dockClearNonEditor, _dockRelocateEditorToContext } from './dock-panel.js';
import { _prevObsValues, animateOBS } from './obs-animation.js';

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

function getComparisonSlots(): DockComparisonSlot[] {
  return getAppComparisonSlots<DockComparisonSlot>();
}

function getSlotColors(): DockSlotColor[] {
  return getAppSlotColors<DockSlotColor>();
}

function getDockEditorContext() {
  return getAppDockEditorContext();
}

/**
 * Render the dock panel with active loadout info
 */
export function renderDockPanel(): void {
  const emptyEl = document.getElementById('dock-lo-empty');
  const activeEl = document.getElementById('dock-lo-active');
  if (!emptyEl || !activeEl) return;

  const al = getActiveLoadout();
  if (!al) {
    emptyEl.classList.remove('hidden');
    activeEl.classList.add('hidden');
  } else {
    emptyEl.classList.add('hidden');
    activeEl.classList.remove('hidden');

    // OBS value + color
    const obsVal = document.getElementById('dock-lo-obs-val');
    const obsRing = document.getElementById('dock-lo-obs-ring');
    const newDockObs = getNumericObs(al.obs);
    if (obsVal) {
      if (newDockObs > 0 && _prevObsValues.dock != null && _prevObsValues.dock > 0) {
        animateOBS(obsVal, _prevObsValues.dock, newDockObs, 400);
      } else {
        obsVal.textContent = newDockObs > 0 ? newDockObs.toFixed(1) : '\u2014';
      }
    }
    _prevObsValues.dock = newDockObs;

    if (obsRing && obsVal) {
      const color = getObsScoreColor(newDockObs);
      obsRing.style.borderColor = color;
      obsVal.style.color = color;
    }

    // Info text
    const racquet = RACQUETS.find(r => r.id === al.frameId);
    const stringData = al.isHybrid ? null : STRINGS.find(s => s.id === al.stringId);
    const nameEl = document.getElementById('dock-lo-name');
    const identEl = document.getElementById('dock-lo-identity');
    const detailsEl = document.getElementById('dock-lo-details');
    const sourceEl = document.getElementById('dock-lo-source');

    if (nameEl) nameEl.textContent = al.name || '\u2014';
    if (identEl) identEl.textContent = al.identity || '';
    if (detailsEl) {
      const frameName = racquet ? racquet.name.replace(/\s+\d+g$/, '') : '\u2014';
      const strName = stringData ? stringData.name : (al.isHybrid ? 'Hybrid' : '\u2014');
      detailsEl.textContent = frameName + ' \u00B7 ' + strName + ' \u00B7 M' + al.mainsTension + '/X' + al.crossesTension;
    }
    if (sourceEl) {
      const labels: Record<string, string> = { quiz: 'Quiz', compendium: 'Racket Bible', manual: 'Manual', preset: 'Preset', optimize: 'Optimizer', shared: 'Shared' };
      if (al._dirty) {
        sourceEl.textContent = '\u270E Modified';
        sourceEl.className = sourceEl.className.replace('hidden', '');
        sourceEl.classList.remove('hidden');
        (sourceEl as HTMLElement).style.color = 'var(--dc-warn)';
      } else if (al.source && labels[al.source]) {
        sourceEl.textContent = labels[al.source];
        sourceEl.classList.remove('hidden');
        (sourceEl as HTMLElement).style.color = '';
      } else {
        sourceEl.classList.add('hidden');
      }
    }

    // Save button dirty tint
    const saveBtnEl = document.querySelector('#dock-lo-active button[onclick="saveActiveLoadout()"]') as HTMLElement | null;
    if (saveBtnEl) {
      const activeLoadout = getActiveLoadout();
      const editorContext = getDockEditorContext();
      if (editorContext.kind === 'compare-slot') {
        saveBtnEl.style.color = 'var(--dc-storm)';
        saveBtnEl.style.opacity = '0.45';
        saveBtnEl.style.pointerEvents = 'none';
        saveBtnEl.title = `Dock editor is updating compare slot ${editorContext.slotId}`;
      } else if (activeLoadout && activeLoadout._dirty) {
        saveBtnEl.style.color = 'var(--dc-warn)';
        saveBtnEl.style.opacity = '';
        saveBtnEl.style.pointerEvents = '';
        saveBtnEl.title = 'Unsaved changes';
      } else {
        saveBtnEl.style.color = '';
        saveBtnEl.style.opacity = '';
        saveBtnEl.style.pointerEvents = '';
        saveBtnEl.title = 'Save to My Loadouts';
      }
    }
  }

  // Call these via window since they may be from other modules
  (window as any).renderMyLoadouts?.();
  (window as any).renderDockCreateSection?.();
  _syncMobileDockBar();
  _syncDockRail();
  renderDockContextPanel();
  renderMobileLoadoutPills();
}

/**
 * Sync mobile dock bar with current active loadout
 */
export function _syncMobileDockBar(): void {
  const obsEl = document.getElementById('dock-mob-obs');
  const labelEl = document.getElementById('dock-mob-label');
  if (!obsEl || !labelEl) return;

  const al = getActiveLoadout();
  if (al) {
    const newMobObs = getNumericObs(al.obs);
    if (newMobObs > 0 && _prevObsValues.mobile != null && _prevObsValues.mobile > 0) {
      animateOBS(obsEl, _prevObsValues.mobile, newMobObs, 400);
    } else {
      obsEl.textContent = newMobObs > 0 ? newMobObs.toFixed(1) : '';
    }
    _prevObsValues.mobile = newMobObs;
    labelEl.textContent = al.name || 'Active loadout';
  } else {
    obsEl.textContent = '';
    labelEl.textContent = 'No active loadout';
  }
}

/**
 * Sync dock rail OBS display
 */
export function _syncDockRail(): void {
  const obsEl = document.getElementById('dock-rail-obs');
  const countEl = document.getElementById('dock-rail-count');
  const al = getActiveLoadout();
  if (obsEl) {
    const activeObs = al ? getNumericObs(al.obs) : 0;
    if (activeObs > 0) {
      obsEl.textContent = activeObs.toFixed(1);
      obsEl.style.color = getObsScoreColor(activeObs);
    } else {
      obsEl.textContent = '\u2014';
      obsEl.style.color = 'var(--dc-storm)';
    }
  }
  if (countEl) {
    const saved = getSavedLoadouts();
    countEl.textContent = String(saved.length);
  }
}

/**
 * Render mobile loadout pills
 */
export function renderMobileLoadoutPills(): void {
  const container = document.getElementById('mobile-loadout-pills');
  if (!container) return;
  if (window.innerWidth > 1024) { container.innerHTML = ''; return; }
  const sls = getSavedLoadouts();
  const al = getActiveLoadout();
  if (!sls || sls.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = sls.map(lo => {
    const isActive = al && al.id === lo.id;
    const name = (lo.name || 'Loadout').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const obsValue = getNumericObs(lo.obs);
    const obs = obsValue > 0 ? obsValue.toFixed(1) : '\u2014';
    const cls = isActive
      ? 'bg-[var(--dc-platinum)] text-[var(--dc-void)] border-[var(--dc-platinum)]'
      : 'bg-transparent text-[var(--dc-storm)] border-[var(--dc-border)] hover:text-[var(--dc-platinum)] hover:border-[var(--dc-storm)]';
    return '<button class="shrink-0 flex items-center gap-2 px-3 py-1.5 border font-mono text-[10px] font-semibold transition-colors ' + cls + '" onclick="switchToLoadout(\'' + lo.id + '\')">' +
      name + '<span class="opacity-60">' + obs + '</span></button>';
  }).join('');
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

    const customName = (al.name || '').trim();
    const titleLine = customName || frameName;
    const titleEsc = titleLine.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const frameRow = customName
      ? `<div class="dock-ctx-current-row">
          <span class="dock-ctx-k">Frame</span>
          <span class="dock-ctx-v">${frameName}</span>
        </div>`
      : '';

    container.innerHTML = `
      <div class="dock-ctx-current">
        <div class="dock-ctx-current-head">
          <span class="dock-ctx-label">Current build</span>
          <div class="dock-ctx-current-obs-block" aria-label="Overall build score">
            <span class="dock-ctx-current-obs-label">OBS</span>
            <span class="dock-ctx-current-obs-val">${obs}</span>
          </div>
        </div>
        <div class="dock-ctx-current-body">
          <div class="dock-ctx-current-name" title="${titleEsc}">${titleLine}</div>
          ${frameRow}
          <div class="dock-ctx-current-row">
            <span class="dock-ctx-k">Strings</span>
            <span class="dock-ctx-v">${stringName}</span>
          </div>
          <div class="dock-ctx-current-row">
            <span class="dock-ctx-k">Tension</span>
            <span class="dock-ctx-v dock-ctx-mono">M${al.mainsTension} / X${al.crossesTension}</span>
          </div>
        </div>
      </div>
    ` + _dockContextActions([
      { label: '\u2192 View build overview', onclick: "switchMode('overview')" },
      { label: '\u2192 Tune this build', onclick: "switchMode('tune')" },
      { label: '\u2192 Compare with others', onclick: "switchMode('compare')" },
      { label: '\u2192 Find a better string', onclick: "switchMode('optimize')" }
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
    { label: '\u2192 Tune tension curves', onclick: "switchMode('tune')" },
    { label: '\u2192 Compare with saved', onclick: "switchMode('compare')" },
    { label: '\u2192 Find a better string', onclick: "switchMode('optimize')" }
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
          <a class="dock-tune-change" onclick="switchMode('overview')">change</a>
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
            <a class="dock-tune-change" onclick="switchMode('overview')">change</a>
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
    { label: '\u2192 Compare with saved', onclick: "switchMode('compare')" },
    { label: '\u2192 Find a better string', onclick: "switchMode('optimize')" },
    { label: '\u2192 Back to overview', onclick: "switchMode('overview')" }
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

  // Use new compare system state if available, fallback to legacy
  const win = window as any;
  const newCompareState = win.compareGetState?.();
  
  if (newCompareState) {
    // New compare system
    html += _renderNewComparePanel(newCompareState);
  } else {
    // Legacy compare system
    html += _renderLegacyComparePanel();
  }

  const al = getActiveLoadout();
  const hasConfiguredSlots = newCompareState 
    ? newCompareState.slots.some((s: any) => s.loadout !== null)
    : getComparisonSlots().length > 0;
  const savedLoadouts = getSavedLoadouts();
  
  if (!hasConfiguredSlots && savedLoadouts.length === 0 && !al) {
    html = _dockGuidance(_dockIcons.compare, 'Nothing to compare yet',
      'Set a build active from the Racket Bible, then come back here.');
  }

  // Actions based on state
  const validSlots = newCompareState 
    ? newCompareState.slots.filter((s: any) => s.loadout !== null)
    : getComparisonSlots().filter(s => s.stats);
    
  html += _dockContextActions([
    ...(validSlots.length >= 2 ? [{ label: '\u2192 Tune active build', onclick: "switchMode('tune')" }] : []),
    { label: '\u2192 Optimize from here', onclick: "switchMode('optimize')" },
    { label: '\u2192 Back to overview', onclick: "switchMode('overview')" }
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
 * Render new compare panel with A/B/C slots
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
          <button class="dock-compare-slot-btn dock-compare-slot-btn-primary" onclick="window.addActiveLoadoutToCompare && window.addActiveLoadoutToCompare()">Use Active Loadout</button>
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
          <button class="dock-compare-slot-btn dock-compare-slot-btn-primary" onclick="window.compareAddSlot && window.compareAddSlot('${slot.id}')">+ Add Setup</button>
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
          <button class="dock-compare-slot-btn dock-compare-slot-btn-primary" onclick="window.compareEditSlot && window.compareEditSlot('${slot.id}')">Edit Setup</button>
          <button class="dock-compare-slot-btn dock-compare-slot-remove" onclick="window.compareRemoveSlot && window.compareRemoveSlot('${slot.id}')">Clear</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  return html;
}

/**
 * Render legacy compare panel (fallback)
 */
function _renderLegacyComparePanel(): string {
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
            <button class="dock-compare-slot-btn dock-compare-slot-btn-primary" onclick="_dockCompareEdit(${i})">Edit Setup</button>
            <button class="dock-compare-slot-btn dock-compare-slot-remove" onclick="_dockCompareRemove(${i})">Clear</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  return html;
}

/**
 * Edit a compare slot
 */
export function _dockCompareEdit(slotIndex: number | string): void {
  (window as any).compareEditSlot?.(String(slotIndex));
  const editor = document.getElementById('dock-editor-section');
  if (editor) {
    requestAnimationFrame(() => {
      editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}

/**
 * Remove a compare slot
 */
export function _dockCompareRemove(slotIndex: number): void {
  const win = window as any;
  const compareState = win.compareGetState?.();

  if (compareState?.slots && typeof win.compareClearSlot === 'function') {
    const targetSlot = compareState.slots[slotIndex];
    if (targetSlot?.id) {
      win.compareClearSlot(targetSlot.id);
      renderDockContextPanel();
      return;
    }
  }

  const comparisonSlots = getComparisonSlots();
  comparisonSlots.splice(slotIndex, 1);

  try {
    win.renderComparisonSlots?.();
    win.renderCompareSummaries?.();
    win.renderCompareVerdict?.();
    win.renderCompareMatrix?.();
    win.updateComparisonRadar?.();
  } catch (e) {
    console.warn('Compare workspace render error after remove:', e);
  }

  renderDockContextPanel();
}

/**
 * Quick add a loadout to compare
 */
export function _dockCompareQuickAdd(loadoutId: string): void {
  const savedLoadouts = getSavedLoadouts();
  const lo = savedLoadouts.find(l => l.id === loadoutId);
  if (!lo) return;

  const win = window as any;
  const compareState = win.compareGetState?.();
  if (compareState?.slots && typeof win.compareQuickAddSaved === 'function') {
    win.compareQuickAddSaved(loadoutId);
    renderDockContextPanel();
    return;
  }

  const comparisonSlots = getComparisonSlots();
  if (comparisonSlots.length >= 3) return;
  win._addLoadoutAsSlot?.(lo);

  try {
    win.renderComparisonSlots?.();
    win.renderCompareSummaries?.();
    win.renderCompareVerdict?.();
    win.renderCompareMatrix?.();
    win.updateComparisonRadar?.();
  } catch (e) {
    console.warn('Compare workspace render error after quick-add:', e);
  }

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
      { label: '\u2192 Browse the Racket Bible', onclick: "switchMode('compendium')" },
      { label: '\u2192 Try the quiz', onclick: "openFindMyBuild()" }
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

  const tensionLabel = `M${al.mainsTension} / X${al.crossesTension}`;

  const frameDisp = racquet ? racquet.name.replace(/\s+\d+g$/, '') : '\u2014';
  const frameDispEsc = frameDisp.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  container.innerHTML = `
    <div class="dock-ctx-current">
      <div class="dock-ctx-current-head">
        <span class="dock-ctx-label">Optimizing from</span>
        <div class="dock-ctx-current-obs-block" aria-label="Overall build score">
          <span class="dock-ctx-current-obs-label">OBS</span>
          <span class="dock-ctx-current-obs-val">${obs}</span>
        </div>
      </div>
      <div class="dock-ctx-current-body">
        <div class="dock-ctx-current-name" title="${frameDispEsc}">${frameDisp}</div>
        <div class="dock-ctx-current-row">
          <span class="dock-ctx-k">Strings</span>
          <span class="dock-ctx-v">${stringName}</span>
        </div>
        <div class="dock-ctx-current-row">
          <span class="dock-ctx-k">Tension</span>
          <span class="dock-ctx-v dock-ctx-mono">${tensionLabel}</span>
        </div>
      </div>
    </div>
  ` + _dockContextActions([
    { label: '\u2192 Back to overview', onclick: "switchMode('overview')" },
    { label: '\u2192 Tune this build', onclick: "switchMode('tune')" },
    { label: '\u2192 Compare top results', onclick: "switchMode('compare')" }
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
  const actions: Array<{ label: string; onclick: string }> = [];
  if (al) {
    actions.push({ label: '\u2192 Back to your build', onclick: "switchMode('overview')" });
    actions.push({ label: '\u2192 Tune tension curves', onclick: "switchMode('tune')" });
  } else {
    actions.push({ label: '\u2192 Browse the Racket Bible', onclick: "switchMode('compendium')" });
    actions.push({ label: '\u2192 Try the quiz', onclick: "openFindMyBuild()" });
  }

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
