import { RACQUETS, STRINGS } from '../../data/loader.js';
import {
  predictSetup,
  computeCompositeScore,
  generateIdentity,
  buildTensionContext,
} from '../../engine/index.js';
import type { Loadout, Racquet, StringData, StringConfig } from '../../engine/types.js';
import { createLoadout as createStateLoadout, loadSavedLoadouts, saveLoadout as stateSaveLoadout, saveLoadout, removeLoadout as stateRemoveLoadout, switchToLoadout as getSwitchedLoadout } from '../../state/loadout.js';
import { getCurrentSetup, getSetupFromLoadout } from '../../state/setup-sync.js';
import { getActiveLoadout, getSavedLoadouts, setActiveLoadout, setSavedLoadouts, subscribe as subscribeStore } from '../../state/store.js';
import {
  getComparisonSlots,
  getCurrentMode,
  getDockEditorContext,
  hasWindowAppStateBridgeInstalled,
  installWindowAppStateBridge,
  setDockEditorContext,
  setCurrentMode,
  setSlotColors,
} from '../../state/app-state.js';
import * as Overview from './overview.js';
import * as Tune from './tune.js';
import * as ComparePage from './compare/index.js';
import { SLOT_COLORS } from './compare/types.js';
import {
  populateGaugeDropdown,
  populateRacquetDropdown,
  populateStringDropdown,
  showFrameSpecs,
  setHybridMode,
} from '../shared/helpers.js';
import { renderDockContextPanel, renderDockPanel, hydrateDock } from '../components/dock-renderers.js';
import { renderComparisonPresets } from '../shared/presets.js';
import { ssInstances } from '../components/searchable-select.js';
import { showShareToast, copyToClipboard, exportLoadoutsToFile, importLoadoutsFromJSON, parseSharedBuildFromURL, generateShareURL } from '../../utils/share.js';
import { toggleAppTheme } from '../theme.js';
import { getScoredSetup } from '../../utils/performance.js';
import { syncViews } from '../../runtime/coordinator.js';
import { validateRuntimeContracts } from '../../runtime/contracts.js';
import { reportRuntimeIssue } from '../../runtime/diagnostics.js';
import { getRouterNavigate } from '../../routing/routerNavigate.js';
import { modeToPath } from '../../routing/modePaths.js';

type CompareSlot = {
  id: number;
  racquetId: string;
  stringId: string;
  isHybrid: boolean;
  mainsId: string;
  crossesId: string;
  mainsTension: number;
  crossesTension: number;
  stats: ReturnType<typeof predictSetup> | null;
  identity: ReturnType<typeof generateIdentity> | null;
  sourceLoadoutId?: string | null;
  snapshotObs?: number;
};

type WindowExt = Window & {
  initCompendium?: () => void;
  _compSyncWithActiveLoadout?: () => void;
};

const win = window as WindowExt;
const $ = <T extends HTMLElement = HTMLElement>(sel: string): T | null =>
  document.querySelector(sel) as T | null;
const _store = (() => {
  try {
    return window['local' + 'Storage' as keyof Window] as Storage;
  } catch (_err) {
    return null;
  }
})();

const scrollPositions: Record<string, number> = {
  overview: 0,
  tune: 0,
  compare: 0,
  optimize: 0,
  compendium: 0,
  howitworks: 0,
};

let _initCalled = false;
let _optimizeInitialized = false;
let _compendiumInitialized = false;
let _compareEditorDirty = false;
let _pendingActiveRefreshFrame: number | null = null;
let _storeSubscriptionsInstalled = false;

async function ensureOptimizeModule() {
  return import('./optimize.js');
}

async function ensureCompendiumModule() {
  return import('./compendium.js');
}

export function _syncLegacyModeState(mode: string): void {
  const win = window as Window & {
    currentMode?: string;
    isTuneMode?: boolean;
    isComparisonMode?: boolean;
  };

  win.currentMode = mode;
  win.isTuneMode = mode === 'tune';
  win.isComparisonMode = mode === 'compare';
}

function getCompareSlots(): CompareSlot[] {
  return getComparisonSlots<CompareSlot>();
}

function renderCompareSurfaces(): void {
  ComparePage.renderComparisonSlots();
  ComparePage.renderCompareSummaries();
  ComparePage.renderCompareVerdict();
  ComparePage.renderCompareMatrix();
  try {
    ComparePage.updateComparisonRadar();
  } catch (_err) {
    // Preserve legacy tolerance for partial compare state.
  }
}

function syncRuntimeViews(reason: string, changed: Parameters<typeof syncViews>[1]): void {
  updateDockEditorTitle();
  updateDockEditorActionState();
  syncViews(reason, changed);
}

function initTuneModeCompat(setup: { racquet: Racquet; stringConfig: StringConfig }): void {
  const runtimeInitTuneMode = (window as WindowExt & { initTuneMode?: typeof Tune.initTuneMode }).initTuneMode;
  if (typeof runtimeInitTuneMode === 'function' && runtimeInitTuneMode !== Tune.initTuneMode) {
    runtimeInitTuneMode(setup);
    return;
  }
  Tune.initTuneMode(setup);
}

function refreshTuneIfActiveCompat(): void {
  const runtimeRefreshTune = (window as WindowExt & { refreshTuneIfActive?: typeof Tune.refreshTuneIfActive }).refreshTuneIfActive;
  if (typeof runtimeRefreshTune === 'function' && runtimeRefreshTune !== Tune.refreshTuneIfActive) {
    runtimeRefreshTune();
    return;
  }
  Tune.refreshTuneIfActive();
}

function onTuneSliderInputCompat(event: Event): void {
  const runtimeOnTuneSliderInput = (window as WindowExt & { onTuneSliderInput?: typeof Tune.onTuneSliderInput }).onTuneSliderInput;
  if (typeof runtimeOnTuneSliderInput === 'function' && runtimeOnTuneSliderInput !== Tune.onTuneSliderInput) {
    runtimeOnTuneSliderInput(event);
    return;
  }
  Tune.onTuneSliderInput(event);
}

function buildLoadoutName(racquet: Racquet, stringConfig: StringConfig): string {
  if (stringConfig.isHybrid) {
    return `${stringConfig.mains.name} / ${stringConfig.crosses.name} on ${racquet.name}`;
  }
  return `${stringConfig.string.name} on ${racquet.name}`;
}

function buildCompareSlotFromLoadout(loadout: Loadout): CompareSlot | null {
  const setup = getSetupFromLoadout(loadout);
  if (!setup) return null;

  const scored = getScoredSetup(setup);

  return {
    id: Date.now() + Math.random(),
    racquetId: loadout.frameId,
    stringId: loadout.stringId || '',
    isHybrid: loadout.isHybrid || false,
    mainsId: loadout.mainsId || '',
    crossesId: loadout.crossesId || '',
    mainsTension: loadout.mainsTension,
    crossesTension: loadout.crossesTension,
    stats: scored.stats,
    identity: scored.identity,
    sourceLoadoutId: loadout.id || null,
    snapshotObs: loadout.obs || scored.obs,
  };
}

function autoFillCompareFromSaved(): void {
  const runtimeWin = window as any;
  const compareState = runtimeWin.compareGetState?.();
  if (compareState?.slots && typeof runtimeWin.compareClearSlot === 'function' && typeof runtimeWin.compareSetSlotLoadout === 'function') {
    compareState.slots.forEach((slot: any) => {
      runtimeWin.compareClearSlot(slot.id);
    });

    const activeLoadout = getActiveLoadout();
    const savedLoadouts = getSavedLoadouts();
    const compareCandidates: Loadout[] = [];

    if (activeLoadout) compareCandidates.push({ ...activeLoadout });

    for (const loadout of savedLoadouts) {
      if (compareCandidates.length >= 3) break;
      if (activeLoadout && loadout.id === activeLoadout.id) continue;
      compareCandidates.push({ ...loadout });
    }

    if (compareCandidates.length < 2 && savedLoadouts.length > 0) {
      const first = savedLoadouts[0];
      const alreadyPresent = compareCandidates.some((candidate) => candidate.id === first.id);
      if (!alreadyPresent) compareCandidates.push({ ...first });
    }

    compareCandidates.slice(0, 3).forEach((candidate) => {
      const setup = getSetupFromLoadout(candidate);
      if (!setup) return;
      const stats = getScoredSetup(setup).stats;
      const latestState = runtimeWin.compareGetState?.();
      const emptySlot = latestState?.slots?.find((slot: any) => slot.loadout === null);
      if (emptySlot) runtimeWin.compareSetSlotLoadout(emptySlot.id, candidate, stats);
    });
    return;
  }

  const slots = getCompareSlots();
  slots.length = 0;
  let added = 0;
  const activeLoadout = getActiveLoadout();
  const savedLoadouts = getSavedLoadouts();

  if (activeLoadout) {
    const activeSlot = buildCompareSlotFromLoadout(activeLoadout);
    if (activeSlot) {
      slots.push(activeSlot);
      added++;
    }
  }

  for (const loadout of savedLoadouts) {
    if (added >= 2) break;
    if (activeLoadout && loadout.id === activeLoadout.id) continue;
    const slot = buildCompareSlotFromLoadout(loadout);
    if (!slot) continue;
    slots.push(slot);
    added++;
  }

  if (added < 2 && savedLoadouts.length > 0) {
    const first = savedLoadouts[0];
    const alreadyPresent = slots.some((slot) =>
      slot.racquetId === first.frameId &&
      slot.stringId === (first.stringId || '') &&
      slot.mainsTension === first.mainsTension &&
      slot.isHybrid === (first.isHybrid || false)
    );
    if (!alreadyPresent) {
      const slot = buildCompareSlotFromLoadout(first);
      if (slot) slots.push(slot);
    }
  }

  renderCompareSurfaces();
}

function updateDockEditorTitle(context = getDockEditorContext()): void {
  const title = document.getElementById('dock-editor-title');
  if (!title) return;
  if (context.kind === 'compare-slot') {
    title.textContent = `Edit Compare Slot ${context.slotId}`;
    return;
  }
  if (context.kind === 'compare-overview') {
    title.textContent = 'Compare Slot Editor';
    return;
  }
  title.textContent = 'Edit Active Loadout';
}

function updateDockEditorActionState(): void {
  const context = getDockEditorContext();
  const actions = document.getElementById('dock-editor-compare-actions');
  const copy = document.getElementById('dock-editor-compare-copy');
  const applyBtn = document.getElementById('dock-editor-compare-apply') as HTMLButtonElement | null;
  if (!actions || !copy || !applyBtn) return;

  if (context.kind !== 'compare-slot') {
    actions.classList.add('hidden');
    applyBtn.disabled = true;
    return;
  }

  actions.classList.remove('hidden');
  applyBtn.disabled = !_compareEditorDirty;
  copy.textContent = _compareEditorDirty
    ? `Draft changes are ready for compare slot ${context.slotId}.`
    : `Editing compare slot ${context.slotId}. Make changes, then apply them here.`;
}

function clearDockEditorFields(): void {
  ssInstances['select-racquet']?.setValue('');
  ssInstances['select-string-full']?.setValue('');
  ssInstances['select-string-mains']?.setValue('');
  ssInstances['select-string-crosses']?.setValue('');
  setHybridMode(false);

  const tensionIds = [
    ['input-tension-full-mains', '55'],
    ['input-tension-full-crosses', '53'],
    ['input-tension-mains', '55'],
    ['input-tension-crosses', '53'],
  ] as const;
  tensionIds.forEach(([id, value]) => {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (input) input.value = value;
  });

  ['gauge-select-full', 'gauge-select-mains', 'gauge-select-crosses'].forEach((id) => {
    const element = document.getElementById(id) as HTMLSelectElement | null;
    if (!element) return;
    element.innerHTML = '<option value="">—</option>';
    element.disabled = true;
  });

  const specs = document.getElementById('frame-specs');
  if (specs) specs.classList.add('hidden');
}

function getCompareStateSlot(slotId: string): any | null {
  const compareState = (window as any).compareGetState?.();
  if (!compareState?.slots) return null;
  return compareState.slots.find((slot: any) => String(slot.id) === String(slotId)) || null;
}

function getDockEditorTargetLoadout(): Loadout | null {
  const context = getDockEditorContext();
  if (context.kind === 'compare-slot') {
    const compareSlot = getCompareStateSlot(context.slotId);
    return (compareSlot?.loadout as Loadout | null) || null;
  }
  return getActiveLoadout();
}

function primeDockEditor(loadout: Loadout | null): void {
  if (loadout) {
    hydrateDock(loadout);
  } else {
    clearDockEditorFields();
  }

  const editor = document.getElementById('dock-editor-section') as HTMLDetailsElement | null;
  if (editor) editor.open = true;
  updateDockEditorActionState();
}

export function activateLoadout(loadout: Loadout | null): void {
  if (!loadout) return;

  const current = getActiveLoadout();
  if (current && current._dirty) {
    saveActiveLoadout();
  }

  setDockEditorContext(getCurrentMode() === 'compare' ? { kind: 'compare-overview' } : { kind: 'active' });
  _compareEditorDirty = false;
  updateDockEditorTitle();
  updateDockEditorActionState();
  setActiveLoadout(loadout);

  try {
    _store?.setItem('tll-active-loadout-id', loadout.id);
  } catch (error) {
    reportRuntimeIssue('ACTIVE_LOADOUT_STORAGE', 'Failed to persist active loadout id.', {
      details: error,
    });
  }

  const optFrameSearch = document.getElementById('opt-frame-search') as HTMLInputElement | null;
  const optFrameValue = document.getElementById('opt-frame-value') as HTMLInputElement | null;
  const racquet = RACQUETS.find((frame) => frame.id === loadout.frameId) as Racquet | undefined;
  if (racquet && optFrameSearch) optFrameSearch.value = racquet.name;
  if (racquet && optFrameValue) optFrameValue.value = racquet.id;

  syncRuntimeViews('activate-loadout', { activeLoadout: true, dockEditorContext: true });
}

export function switchToLoadout(loadoutId: string): void {
  const loadout = getSwitchedLoadout(loadoutId);
  if (!loadout) return;
  activateLoadout(loadout);
}

export function saveActiveLoadout(): void {
  const active = getActiveLoadout();
  if (!active) return;
  active._dirty = false;
  stateSaveLoadout(active);
}

export function shareActiveLoadout(): void {
  const activeLoadout = getActiveLoadout();
  if (!activeLoadout) return;

  void copyToClipboard(generateShareURL(activeLoadout)).then((copied) => {
    showShareToast(copied ? 'Link copied to clipboard!' : 'Could not copy link');
  });
}

export function shareLoadout(loadoutId: string): void {
  let loadout = getSavedLoadouts().find((item) => item.id === loadoutId) || null;
  if (!loadout) {
    const activeLoadout = getActiveLoadout();
    if (activeLoadout?.id === loadoutId) {
      loadout = activeLoadout;
    }
  }
  if (!loadout) return;

  void copyToClipboard(generateShareURL(loadout)).then((copied) => {
    showShareToast(copied ? 'Link copied to clipboard!' : 'Could not copy link');
  });
}

export function exportLoadouts(): void {
  exportLoadoutsToFile(getSavedLoadouts(), showShareToast);
}

export function importLoadouts(event: Event): void {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    const jsonText = loadEvent.target?.result;
    if (typeof jsonText !== 'string') {
      showShareToast('Error reading file');
      return;
    }

    try {
      const imported = importLoadoutsFromJSON(jsonText, {
        createLoadout: createStateLoadout,
        saveLoadout,
        savedLoadouts: getSavedLoadouts(),
        renderDockPanel,
        showToast: showShareToast,
      });
      showShareToast(`${imported} loadout${imported !== 1 ? 's' : ''} imported!`);
    } catch (_error) {
      showShareToast('Error reading file');
    }
  };
  reader.readAsText(file);

  if (input) input.value = '';
}

export function removeLoadout(loadoutId: string): void {
  stateRemoveLoadout(loadoutId);
}

export function resetActiveLoadout(): void {
  setDockEditorContext(getCurrentMode() === 'compare' ? { kind: 'compare-overview' } : { kind: 'active' });
  _compareEditorDirty = false;
  updateDockEditorTitle();
  updateDockEditorActionState();
  setActiveLoadout(null);

  (Tune.tuneState as any).baseline = null;
  (Tune.tuneState as any).explored = null;

  ssInstances['select-racquet']?.setValue('');
  ssInstances['select-string-full']?.setValue('');
  ssInstances['select-string-mains']?.setValue('');
  ssInstances['select-string-crosses']?.setValue('');
  setHybridMode(false);

  const tfm = document.getElementById('input-tension-full-mains') as HTMLInputElement | null;
  const tfx = document.getElementById('input-tension-full-crosses') as HTMLInputElement | null;
  const thm = document.getElementById('input-tension-mains') as HTMLInputElement | null;
  const thx = document.getElementById('input-tension-crosses') as HTMLInputElement | null;
  if (tfm) tfm.value = '55';
  if (tfx) tfx.value = '53';
  if (thm) thm.value = '55';
  if (thx) thx.value = '53';

  ['gauge-select-full', 'gauge-select-mains', 'gauge-select-crosses'].forEach((id) => {
    const element = document.getElementById(id) as HTMLSelectElement | null;
    if (!element) return;
    element.innerHTML = '<option value="">—</option>';
    element.disabled = true;
  });

  const editor = document.getElementById('dock-editor-section') as HTMLDetailsElement | null;
  if (editor) editor.open = false;

  const specs = document.getElementById('frame-specs');
  if (specs) specs.classList.add('hidden');
  syncRuntimeViews('reset-active-loadout', { dockEditorContext: true });
}

export function commitEditorToLoadout(): void {
  const context = getDockEditorContext();
  const existingTarget = getDockEditorTargetLoadout();
  if (!existingTarget && context.kind === 'active') return;

  const baseLoadout: Loadout = existingTarget
    ? { ...existingTarget }
    : {
        id: `compare-${context.kind === 'compare-slot' ? context.slotId : Date.now()}`,
        name: 'Untitled Setup',
        frameId: '',
        stringId: null,
        isHybrid: false,
        mainsId: null,
        crossesId: null,
        mainsTension: 55,
        crossesTension: 53,
        gauge: null,
        mainsGauge: null,
        crossesGauge: null,
        obs: 0,
        source: context.kind === 'compare-slot' ? 'compare' : 'manual',
        _dirty: false,
      };

  const isHybrid = document.getElementById('btn-hybrid')?.classList.contains('active') ?? false;
  const racquetId = ssInstances['select-racquet']?.getValue() || baseLoadout.frameId;
  if (!racquetId) return;

  if (isHybrid) {
    baseLoadout.isHybrid = true;
    baseLoadout.mainsId = ssInstances['select-string-mains']?.getValue() || baseLoadout.mainsId;
    baseLoadout.crossesId = ssInstances['select-string-crosses']?.getValue() || baseLoadout.crossesId;
    baseLoadout.mainsTension = parseInt(($<HTMLInputElement>('#input-tension-mains')?.value || ''), 10) || baseLoadout.mainsTension;
    baseLoadout.crossesTension = parseInt(($<HTMLInputElement>('#input-tension-crosses')?.value || ''), 10) || baseLoadout.crossesTension;
    const mainsGauge = document.getElementById('gauge-select-mains') as HTMLSelectElement | null;
    const crossesGauge = document.getElementById('gauge-select-crosses') as HTMLSelectElement | null;
    baseLoadout.mainsGauge = mainsGauge?.value ? String(parseFloat(mainsGauge.value)) : null;
    baseLoadout.crossesGauge = crossesGauge?.value ? String(parseFloat(crossesGauge.value)) : null;
    baseLoadout.stringId = null;
    baseLoadout.gauge = null;
  } else {
    baseLoadout.isHybrid = false;
    baseLoadout.stringId = ssInstances['select-string-full']?.getValue() || baseLoadout.stringId;
    baseLoadout.mainsTension = parseInt(($<HTMLInputElement>('#input-tension-full-mains')?.value || ''), 10) || baseLoadout.mainsTension;
    baseLoadout.crossesTension = parseInt(($<HTMLInputElement>('#input-tension-full-crosses')?.value || ''), 10) || baseLoadout.crossesTension;
    const gauge = document.getElementById('gauge-select-full') as HTMLSelectElement | null;
    baseLoadout.gauge = gauge?.value ? String(parseFloat(gauge.value)) : null;
    baseLoadout.mainsId = null;
    baseLoadout.crossesId = null;
    baseLoadout.mainsGauge = null;
    baseLoadout.crossesGauge = null;
  }

  baseLoadout.frameId = racquetId;

  const setup = getSetupFromLoadout(baseLoadout);
  if (setup) {
    const scored = getScoredSetup(setup);
    baseLoadout.stats = scored.stats;
    baseLoadout.obs = +scored.obs.toFixed(1);
    baseLoadout.identity = scored.identity?.name || '';
    baseLoadout.name = buildLoadoutName(setup.racquet, setup.stringConfig);

    if (context.kind === 'compare-slot') {
      (window as any).compareSetSlotLoadout?.(context.slotId, baseLoadout, scored.stats);
      _compareEditorDirty = false;
    } else {
      baseLoadout._dirty = getSavedLoadouts().some((loadout) => loadout.id === baseLoadout.id);
      setActiveLoadout(baseLoadout);
    }
  }

  updateDockEditorActionState();
  if (context.kind !== 'active') {
    syncRuntimeViews('commit-editor-compare-slot', { compareState: true });
  }
}

export function applyDockEditorChanges(): void {
  if (getDockEditorContext().kind !== 'compare-slot') return;
  commitEditorToLoadout();
}

export function cancelCompareSlotEditing(): void {
  const context = getDockEditorContext();
  if (context.kind !== 'compare-slot') return;

  const compareSlot = getCompareStateSlot(context.slotId);
  const loadout = (compareSlot?.loadout as Loadout | null) || getActiveLoadout() || null;
  _compareEditorDirty = false;
  primeDockEditor(loadout);
  setDockEditorContext({ kind: 'compare-overview' });
  syncRuntimeViews('cancel-compare-slot-edit', { dockEditorContext: true });
}

export function addLoadoutToCompare(loadoutId: string): void {
  const loadout = getSavedLoadouts().find((item) => item.id === loadoutId);
  if (!loadout) return;

  const win = window as any;
  const compareState = win.compareGetState?.();
  if (compareState?.slots && typeof win.compareSetSlotLoadout === 'function') {
    const emptySlot = compareState.slots.find((slot: any) => slot.loadout === null);
    const targetSlotId = emptySlot?.id || compareState.slots[compareState.slots.length - 1]?.id;
    const setup = getSetupFromLoadout(loadout);
    if (targetSlotId && setup) {
      const stats = getScoredSetup(setup).stats;
      win.compareSetSlotLoadout(targetSlotId, { ...loadout }, stats);
      setDockEditorContext({ kind: 'compare-overview' });
      _compareEditorDirty = false;
    }
  } else {
    const slots = getCompareSlots();
    if (slots.length >= 3) slots.pop();

    const slot = buildCompareSlotFromLoadout(loadout);
    if (!slot) return;
    slots.push(slot);
  }

  if (getCurrentMode() === 'compare') {
    syncRuntimeViews('add-loadout-to-compare', { compareState: true, dockEditorContext: true });
  } else {
    switchMode('compare');
  }
}

export function addActiveLoadoutToCompare(): void {
  const activeLoadout = getActiveLoadout();
  if (!activeLoadout) return;

  const win = window as any;
  const compareState = win.compareGetState?.();
  const setup = getSetupFromLoadout(activeLoadout);
  if (!compareState?.slots || typeof win.compareSetSlotLoadout !== 'function' || !setup) return;

  const emptySlot = compareState.slots.find((slot: any) => slot.loadout === null);
  const targetSlotId = emptySlot?.id || compareState.slots[compareState.slots.length - 1]?.id;
  if (!targetSlotId) return;

  const stats = getScoredSetup(setup).stats;
  win.compareSetSlotLoadout(targetSlotId, { ...activeLoadout }, stats);
  setDockEditorContext({ kind: 'compare-overview' });
  _compareEditorDirty = false;

  if (getCurrentMode() === 'compare') {
    syncRuntimeViews('add-active-loadout-to-compare', { compareState: true, dockEditorContext: true });
  }
}

export function switchMode(mode: string): void {
  const currentMode = getCurrentMode();
  if (mode === currentMode) return;

  const useReactRouter = !!getRouterNavigate();
  const workspace = document.getElementById('workspace');
  const isMobileScroll = window.innerWidth <= 1024;

  if (!useReactRouter) {
    if (isMobileScroll) {
      scrollPositions[currentMode] = window.scrollY;
    } else if (workspace) {
      scrollPositions[currentMode] = workspace.scrollTop;
    }

    const currentSection = document.getElementById(`mode-${currentMode}`);
    if (currentSection) currentSection.classList.add('hidden');

    document.querySelectorAll('.mode-btn').forEach((button) => {
      button.classList.toggle('active', (button as HTMLElement).dataset.mode === mode);
    });
    document.querySelectorAll('.mobile-tab-btn').forEach((button) => {
      button.classList.toggle('active', (button as HTMLElement).dataset.mode === mode);
    });

    if (isMobileScroll) {
      const dock = document.getElementById('build-dock');
      if (dock?.classList.contains('dock-expanded') && typeof (window as any).toggleMobileDock === 'function') {
        (window as any).toggleMobileDock();
      }
    }
  } else {
    document.querySelectorAll('.mode-btn').forEach((button) => {
      button.classList.toggle('active', (button as HTMLElement).dataset.mode === mode);
    });
    document.querySelectorAll('.mobile-tab-btn').forEach((button) => {
      button.classList.toggle('active', (button as HTMLElement).dataset.mode === mode);
    });
  }

  setCurrentMode(mode);
  _syncLegacyModeState(mode);
  if (mode === 'compare') {
    if (getDockEditorContext().kind !== 'compare-slot') {
      setDockEditorContext({ kind: 'compare-overview' });
    }
  } else {
    setDockEditorContext({ kind: 'active' });
    _compareEditorDirty = false;
  }
  updateDockEditorTitle();
  updateDockEditorActionState();

  if (!useReactRouter) {
    const nextSection = document.getElementById(`mode-${mode}`);
    if (nextSection) {
      nextSection.classList.remove('hidden');
      nextSection.style.animation = 'none';
      void nextSection.offsetHeight;
      nextSection.style.animation = '';
    }

    requestAnimationFrame(() => {
      if (isMobileScroll) {
        window.scrollTo(0, scrollPositions[mode] || 0);
      } else if (workspace) {
        workspace.scrollTop = scrollPositions[mode] || 0;
      }
    });
  }

  if (!useReactRouter) {
    if (mode === 'compare') {
      runCompareModeActivation();
    } else if (mode === 'optimize') {
      void ensureOptimizeModule().then((Optimize) => {
        Optimize.initOptimize();
        _optimizeInitialized = true;
      });
    } else if (mode === 'compendium') {
      void ensureCompendiumModule().then((Compendium) => {
        if (!_compendiumInitialized) {
          if (win.initCompendium && win.initCompendium !== Compendium.initCompendium) {
            win.initCompendium();
          } else {
            Compendium.initCompendium();
          }
          _compendiumInitialized = true;
        } else if (win._compSyncWithActiveLoadout && win._compSyncWithActiveLoadout !== Compendium._compSyncWithActiveLoadout) {
          win._compSyncWithActiveLoadout();
        } else {
          Compendium._compSyncWithActiveLoadout();
        }
      });
    }
  }

  const nav = getRouterNavigate();
  if (nav) {
    nav(modeToPath(mode));
    requestAnimationFrame(() => {
      syncRuntimeViews('switch-mode', { mode: true, dockEditorContext: true });
    });
  } else {
    syncRuntimeViews('switch-mode', { mode: true, dockEditorContext: true });
  }
}

/** Compare tab activation (DOM must exist). Used by React route mount and legacy switchMode. */
export function runCompareModeActivation(): void {
  const win = window as any;
  if (win.initComparePage) {
    win.initComparePage();
    const compareState = win.compareGetState?.();
    const configuredSlots = compareState?.slots?.filter((slot: any) => slot.loadout !== null) || [];
    if (configuredSlots.length === 0) {
      if (getSavedLoadouts().length >= 2) {
        autoFillCompareFromSaved();
      } else if (getSavedLoadouts().length === 1 || getActiveLoadout()) {
        ComparePage.addComparisonSlotFromHome();
        ComparePage.showQuickAddPrompt();
      } else {
        ComparePage.addComparisonSlotFromHome();
      }
    }
  } else {
    renderComparisonPresets();
    if (getCompareSlots().length === 0) {
      if (getSavedLoadouts().length >= 2) {
        autoFillCompareFromSaved();
      } else if (getSavedLoadouts().length === 1 || getActiveLoadout()) {
        ComparePage.addComparisonSlotFromHome();
        ComparePage.showQuickAddPrompt();
      } else {
        ComparePage.addComparisonSlotFromHome();
      }
    } else {
      renderCompareSurfaces();
    }
  }
}

/** Optimize / Compendium first-time init when React route mounts (DOM ready). */
export function runOptimizeRouteActivation(): void {
  void ensureOptimizeModule().then((Optimize) => {
    Optimize.initOptimize();
    _optimizeInitialized = true;
  });
}

export type CompendiumWorkspaceTab = 'rackets' | 'strings' | 'leaderboard';

/**
 * Initialize compendium (first visit) or sync active frame; then switch the visible tab.
 * Tab switching uses the loaded module directly so it is not lost to the async window bridge
 * or missed on repeat visits (previously only the first init path showed Rackets reliably).
 */
export function runCompendiumRouteActivation(options?: { tab?: CompendiumWorkspaceTab }): void {
  const tab = options?.tab ?? 'rackets';
  void ensureCompendiumModule().then((Compendium) => {
    if (!_compendiumInitialized) {
      if (win.initCompendium && win.initCompendium !== Compendium.initCompendium) {
        win.initCompendium();
      } else {
        Compendium.initCompendium();
      }
      _compendiumInitialized = true;
    } else if (win._compSyncWithActiveLoadout && win._compSyncWithActiveLoadout !== Compendium._compSyncWithActiveLoadout) {
      win._compSyncWithActiveLoadout();
    } else {
      Compendium._compSyncWithActiveLoadout();
    }
    Compendium._compSwitchTab(tab);
  });
}

/** Attach tune tension slider handler (call when #tune-slider enters DOM, e.g. React route mount). */
export function wireTuneSlider(): void {
  const tuneSlider = $('#tune-slider') as HTMLInputElement | null;
  if (tuneSlider) {
    tuneSlider.oninput = onTuneSliderInputCompat;
  }
}

export function openTuneForSlot(slotIndex: number): void {
  const win = window as any;
  const compareStateSlot = win.compareGetState?.()?.slots?.[slotIndex] || null;

  if (compareStateSlot?.loadout && compareStateSlot?.stats) {
    const compareLoadout = compareStateSlot.loadout as Loadout;
    const loadout: Loadout = {
      ...compareLoadout,
      stats: compareStateSlot.stats,
      source: compareLoadout.source || 'compare',
      _dirty: false,
    };

    activateLoadout(loadout);
    if (getCurrentMode() !== 'tune') {
      switchMode('tune');
    } else {
      const setup = getCurrentSetup();
      if (setup) initTuneModeCompat(setup);
    }
    return;
  }

  const slot = getCompareSlots()[slotIndex];
  if (!slot?.stats) return;

  const racquet = RACQUETS.find((frame) => frame.id === slot.racquetId) as Racquet | undefined;
  if (!racquet) return;

  let stringConfig: StringConfig | null = null;
  if (slot.isHybrid) {
    const mains = STRINGS.find((string) => string.id === slot.mainsId);
    const crosses = STRINGS.find((string) => string.id === slot.crossesId);
    if (mains && crosses) {
      stringConfig = {
        isHybrid: true,
        mains,
        crosses,
        mainsTension: slot.mainsTension,
        crossesTension: slot.crossesTension,
      };
    }
  } else {
    const string = STRINGS.find((entry) => entry.id === slot.stringId);
    if (string) {
      stringConfig = {
        isHybrid: false,
        string,
        mainsTension: slot.mainsTension,
        crossesTension: slot.crossesTension,
      };
    }
  }

  if (!stringConfig) return;

  const loadout: Loadout = {
    id: `compare-${slot.id}`,
    name: buildLoadoutName(racquet, stringConfig),
    frameId: racquet.id,
    stringId: slot.isHybrid ? null : slot.stringId,
    isHybrid: slot.isHybrid,
    mainsId: slot.isHybrid ? slot.mainsId : null,
    crossesId: slot.isHybrid ? slot.crossesId : null,
    mainsTension: slot.mainsTension,
    crossesTension: slot.crossesTension,
    gauge: null,
    mainsGauge: null,
    crossesGauge: null,
    stats: slot.stats,
    obs: slot.snapshotObs || 0,
    identity: slot.identity?.name || '',
    source: 'compare',
    _dirty: false,
  };

  activateLoadout(loadout);
  if (getCurrentMode() !== 'tune') {
    switchMode('tune');
  } else {
    const setup = getCurrentSetup();
    if (setup) initTuneModeCompat(setup);
  }
}

export function _onEditorChange(): void {
  if (getDockEditorContext().kind === 'compare-slot') {
    _compareEditorDirty = true;
    updateDockEditorActionState();
    return;
  }

  if (_pendingActiveRefreshFrame != null) {
    cancelAnimationFrame(_pendingActiveRefreshFrame);
  }

  _pendingActiveRefreshFrame = requestAnimationFrame(() => {
    _pendingActiveRefreshFrame = null;
    if (getActiveLoadout()) {
      commitEditorToLoadout();
    } else {
      Overview.renderDashboard();
    }
  });
}

export function startCompareSlotEditing(slotId: string): void {
  setDockEditorContext({ kind: 'compare-slot', slotId: String(slotId) });
  _compareEditorDirty = false;
  updateDockEditorTitle();

  const compareSlot = getCompareStateSlot(String(slotId));
  const loadout = (compareSlot?.loadout as Loadout | null) || getActiveLoadout() || null;
  primeDockEditor(loadout);
  syncRuntimeViews('start-compare-slot-edit', { dockEditorContext: true });
}

export function _handleHybridToggle(toHybrid: boolean): void {
  const currentlyHybrid = document.getElementById('btn-hybrid')?.classList.contains('active') ?? false;
  if (toHybrid === currentlyHybrid) return;

  let hasSelection = false;
  let currentStringId = '';

  if (currentlyHybrid) {
    const mainsId = ssInstances['select-string-mains']?.getValue();
    const crossesId = ssInstances['select-string-crosses']?.getValue();
    hasSelection = !!(mainsId || crossesId);
    currentStringId = mainsId || '';
  } else {
    currentStringId = ssInstances['select-string-full']?.getValue() || '';
    hasSelection = !!currentStringId;
  }

  if (!hasSelection) {
    setHybridMode(toHybrid);
    _onEditorChange();
    return;
  }

  const message = toHybrid
    ? 'Switching to Hybrid will use your current string as the Mains. Continue?'
    : 'Switching to Full Bed will use your Mains string for the full bed. Continue?';

  if (!confirm(message)) return;

  setHybridMode(toHybrid);

  if (toHybrid && currentStringId) {
    ssInstances['select-string-mains']?.setValue(currentStringId);
    const mainsGaugeSelect = document.getElementById('gauge-select-mains') as HTMLSelectElement | null;
    if (mainsGaugeSelect) populateGaugeDropdown(mainsGaugeSelect, currentStringId);
    const fullGauge = document.getElementById('gauge-select-full') as HTMLSelectElement | null;
    const mainsGauge = document.getElementById('gauge-select-mains') as HTMLSelectElement | null;
    if (fullGauge?.value && mainsGauge) mainsGauge.value = fullGauge.value;
  } else if (!toHybrid && currentStringId) {
    ssInstances['select-string-full']?.setValue(currentStringId);
    const fullGaugeSelect = document.getElementById('gauge-select-full') as HTMLSelectElement | null;
    if (fullGaugeSelect) populateGaugeDropdown(fullGaugeSelect, currentStringId);
    const mainsGauge = document.getElementById('gauge-select-mains') as HTMLSelectElement | null;
    const fullGauge = document.getElementById('gauge-select-full') as HTMLSelectElement | null;
    if (mainsGauge?.value && fullGauge) fullGauge.value = mainsGauge.value;
  }

  _onEditorChange();
}

function selectLandingFrame(racquetId: string): void {
  void ensureCompendiumModule().then((Compendium) => {
    if (!_compendiumInitialized) {
      Compendium.initCompendium();
      _compendiumInitialized = true;
    }

    Compendium._compSelectFrame(racquetId);
    switchMode('compendium');

    window.setTimeout(() => {
      const item = document.querySelector(`#comp-frame-list > button[data-id="${racquetId}"]`);
      if (item instanceof HTMLElement) {
        item.scrollIntoView({ block: 'center' });
      }
    }, 100);
  });

  const searchEl = document.getElementById('landing-search') as HTMLInputElement | null;
  const dropdown = document.getElementById('landing-search-dropdown');
  if (searchEl) searchEl.value = '';
  dropdown?.classList.add('hidden');
}

export function _initLandingSearch(): void {
  const searchEl = document.getElementById('landing-search') as HTMLInputElement | null;
  const dropdownEl = document.getElementById('landing-search-dropdown');
  if (!searchEl || !dropdownEl || searchEl.dataset.initialized === 'true') return;

  searchEl.dataset.initialized = 'true';
  let selectedIndex = -1;

  const renderResults = (query: string): void => {
    if (!query.trim()) {
      dropdownEl.classList.add('hidden');
      selectedIndex = -1;
      return;
    }

    const matches = RACQUETS.filter((racquet) => {
      const q = query.toLowerCase();
      return (
        racquet.name.toLowerCase().includes(q) ||
        racquet.id.toLowerCase().includes(q) ||
        String((racquet as unknown as Racquet & { identity?: string }).identity || '').toLowerCase().includes(q)
      );
    }).slice(0, 10);

    if (matches.length === 0) {
      dropdownEl.innerHTML = '<div class="landing-dd-empty">No frames found</div>';
      dropdownEl.classList.remove('hidden');
      selectedIndex = -1;
      return;
    }

    selectedIndex = -1;
    dropdownEl.innerHTML = matches
      .map(
        (racquet, index) => `
          <div class="landing-dd-item" data-id="${racquet.id}" data-idx="${index}">
            <span class="landing-dd-name">${racquet.name}</span>
            <span class="landing-dd-meta">${racquet.year} · ${(racquet as unknown as Racquet & { identity?: string }).identity || ''}</span>
          </div>
        `
      )
      .join('');
    dropdownEl.classList.remove('hidden');

    dropdownEl.querySelectorAll<HTMLElement>('.landing-dd-item').forEach((item) => {
      item.addEventListener('mousedown', (mouseEvent) => {
        mouseEvent.preventDefault();
        const itemId = item.dataset.id;
        if (itemId) selectLandingFrame(itemId);
      });
    });
  };

  const highlightItem = (index: number): void => {
    const items = Array.from(dropdownEl.querySelectorAll<HTMLElement>('.landing-dd-item'));
    items.forEach((item, itemIndex) => {
      item.classList.toggle('landing-dd-active', itemIndex === index);
    });
    items[index]?.scrollIntoView({ block: 'nearest' });
  };

  searchEl.addEventListener('input', () => renderResults(searchEl.value));
  searchEl.addEventListener('focus', () => {
    if (searchEl.value.length > 0) renderResults(searchEl.value);
  });
  searchEl.addEventListener('blur', () => {
    window.setTimeout(() => dropdownEl.classList.add('hidden'), 150);
  });
  searchEl.addEventListener('keydown', (keyboardEvent) => {
    const items = Array.from(dropdownEl.querySelectorAll<HTMLElement>('.landing-dd-item'));
    if (keyboardEvent.key === 'ArrowDown') {
      keyboardEvent.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      highlightItem(selectedIndex);
      return;
    }
    if (keyboardEvent.key === 'ArrowUp') {
      keyboardEvent.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      highlightItem(selectedIndex);
      return;
    }
    if (keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault();
      const target = items[selectedIndex] || items[0];
      const itemId = target?.dataset.id;
      if (itemId) selectLandingFrame(itemId);
      return;
    }
    if (keyboardEvent.key === 'Escape') {
      dropdownEl.classList.add('hidden');
      searchEl.blur();
    }
  });
}

export function _handleSharedBuildURL(): boolean {
  const decoded = parseSharedBuildFromURL();
  if (!decoded?.frameId) return false;

  const loadout = createStateLoadout(
    decoded.frameId,
    decoded.isHybrid ? decoded.mainsId : decoded.stringId,
    decoded.mainsTension,
    {
      source: 'shared',
      isHybrid: decoded.isHybrid,
      mainsId: decoded.mainsId,
      crossesId: decoded.crossesId,
      crossesTension: decoded.crossesTension,
    }
  );

  if (!loadout) return false;

  activateLoadout(loadout);
  stateSaveLoadout(loadout);
  window.history.replaceState({}, '', `${window.location.origin}${window.location.pathname}`);
  showShareToast('Shared build loaded!');
  return true;
}

export function init(): void {
  if (_initCalled) return;
  _initCalled = true;

  installWindowAppStateBridge();
  setSlotColors(SLOT_COLORS);
  _syncLegacyModeState(getCurrentMode());
  validateRuntimeContracts({
    requiredDomIds: [
      'build-dock',
      'builder-panel',
      'dock-context-panel',
      'dock-my-loadouts',
      'workspace',
    ],
    requiredWindowBindings: [
      'activateLoadout',
      'switchMode',
      'renderDockPanel',
      'renderDashboard',
      'compareGetState',
    ],
    throwInDev: true,
  });

  if (!hasWindowAppStateBridgeInstalled()) {
    reportRuntimeIssue('APP_STATE_BRIDGE', 'App-state bridge was not installed before init.', {
      throwInDev: true,
    });
  }

  const selectRacquet = $('#select-racquet');
  const selectStringFull = $('#select-string-full');
  const selectStringMains = $('#select-string-mains');
  const selectStringCrosses = $('#select-string-crosses');
  if (selectRacquet) {
    populateRacquetDropdown(selectRacquet, {
      onRacquetChange: (racquet) => {
        showFrameSpecs(racquet);
        _onEditorChange();
      },
    });
  }
  if (selectStringFull) {
    populateStringDropdown(selectStringFull, {
      gaugeTargetId: 'gauge-select-full',
      onChange: () => _onEditorChange(),
    });
  }
  if (selectStringMains) {
    populateStringDropdown(selectStringMains, {
      gaugeTargetId: 'gauge-select-mains',
      onChange: () => _onEditorChange(),
    });
  }
  if (selectStringCrosses) {
    populateStringDropdown(selectStringCrosses, {
      gaugeTargetId: 'gauge-select-crosses',
      onChange: () => _onEditorChange(),
    });
  }

  $('#input-tension-full-mains')?.addEventListener('input', _onEditorChange);
  $('#input-tension-full-crosses')?.addEventListener('input', _onEditorChange);
  $('#input-tension-mains')?.addEventListener('input', _onEditorChange);
  $('#input-tension-crosses')?.addEventListener('input', _onEditorChange);
  $('#gauge-select-full')?.addEventListener('change', _onEditorChange);
  $('#gauge-select-mains')?.addEventListener('change', _onEditorChange);
  $('#gauge-select-crosses')?.addEventListener('change', _onEditorChange);

  $('#btn-full')?.addEventListener('click', () => _handleHybridToggle(false));
  $('#btn-hybrid')?.addEventListener('click', () => _handleHybridToggle(true));

  renderComparisonPresets();
  document.getElementById('btn-add-slot')?.addEventListener('click', () => ComparePage.addComparisonSlot());

  document.querySelectorAll('.mode-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = (button as HTMLElement).dataset.mode;
      if (mode) switchMode(mode);
    });
  });
  document.querySelectorAll('.mobile-tab-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = (button as HTMLElement).dataset.mode;
      if (mode) switchMode(mode);
    });
  });
  document.getElementById('btn-mode-howitworks-mobile')?.addEventListener('click', () => switchMode('howitworks'));

  wireTuneSlider();
  $('#btn-theme')?.addEventListener('click', toggleAppTheme);

  // Legacy single-page DOM had every mode in #workspace; hide non-overview until switch.
  // React Router mounts one route at a time — only one [id^="mode-"] exists; skip or we hide the active view.
  const modeSections = document.querySelectorAll('#workspace [id^="mode-"]');
  if (modeSections.length > 1) {
    document.getElementById('mode-tune')?.classList.add('hidden');
    document.getElementById('mode-compare')?.classList.add('hidden');
    document.getElementById('mode-optimize')?.classList.add('hidden');
    document.getElementById('mode-compendium')?.classList.add('hidden');
    document.getElementById('mode-howitworks')?.classList.add('hidden');
  }

  const storedLoadouts = loadSavedLoadouts();
  setSavedLoadouts(storedLoadouts);

  try {
    const activeId = _store?.getItem('tll-active-loadout-id');
    if (activeId && storedLoadouts.length > 0) {
      const saved = storedLoadouts.find((loadout) => loadout.id === activeId);
      if (saved) {
        const active = { ...saved, _dirty: false };
        setActiveLoadout(active);
      }
    }
  } catch (error) {
    reportRuntimeIssue('LOAD_ACTIVE_FROM_STORAGE', 'Failed to restore active loadout from storage.', {
      details: error,
    });
  }

  if (!_storeSubscriptionsInstalled) {
    subscribeStore('activeLoadout', () => {
      syncRuntimeViews('store-active-loadout', { activeLoadout: true });
    });
    subscribeStore('savedLoadouts', () => {
      syncRuntimeViews('store-saved-loadouts', { savedLoadouts: true });
    });
    _storeSubscriptionsInstalled = true;
  }

  const hadSharedBuild = _handleSharedBuildURL();

  if (hadSharedBuild) {
    switchMode('overview');
  } else {
    syncRuntimeViews('shell-init', { activeLoadout: true, savedLoadouts: true, mode: true, dockEditorContext: true });
  }
  _initLandingSearch();

  document.querySelectorAll('.mobile-tab-btn').forEach((button) => {
    button.classList.toggle('active', (button as HTMLElement).dataset.mode === getCurrentMode());
  });
}
