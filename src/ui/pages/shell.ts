import { RACQUETS, STRINGS } from '../../data/loader.js';
import {
  predictSetup,
  computeCompositeScore,
  generateIdentity,
  buildTensionContext,
} from '../../engine/index.js';
import type { Loadout, Racquet, StringData, StringConfig } from '../../engine/types.js';
import { createLoadout as createStateLoadout, saveLoadout as stateSaveLoadout, saveLoadout, removeLoadout as stateRemoveLoadout, switchToLoadout as getSwitchedLoadout } from '../../state/loadout.js';
import { getCurrentSetup, getSetupFromLoadout } from '../../state/setup-sync.js';
import {
  getActiveLoadout,
  getSavedLoadouts,
  setActiveLoadout,
  subscribe as subscribeStore,
  getCurrentMode,
  getDockEditorContext,
  setDockEditorContext,
  setCurrentMode,
  setSlotColors,
} from '../../state/imperative.js';
import {
  addComparisonSlot,
  addSlot as addCompareSlot,
  editSlot as editCompareSlot,
  quickAddSaved as quickAddCompareSaved,
  registerCompareShellCallbacks,
  removeSlot as removeCompareSlot,
} from './compare/compare-actions.js';
import { clearSlot as clearCompareSlot, getState as getCompareState, setSlotLoadout as setCompareSlotLoadout } from './compare/hooks/useCompareState.js';
import type { SlotId as CompareSlotId } from './compare/types.js';
import { SLOT_COLORS } from './compare/types.js';
import { toggleMobileDock } from '../components/mobile-dock.js';
import {
  populateGaugeDropdown,
  populateRacquetDropdown,
  populateStringDropdown,
  showFrameSpecs,
  setHybridMode,
} from '../shared/helpers.js';
import { renderDockContextPanel, renderDockPanel, registerDockCallbacks } from '../components/dock-renderers.js';
import { renderComparisonPresets, registerPresetCallbacks } from '../shared/presets.js';
import { ssInstances } from '../components/searchable-select.js';
import { showShareToast, copyToClipboard, exportLoadoutsToFile, importLoadoutsFromJSON, parseSharedBuildFromURL, generateShareURL } from '../../utils/share.js';
import { getScoredSetup } from '../../utils/performance.js';
import { syncViews } from '../../runtime/coordinator.js';
import { validateRuntimeContracts } from '../../runtime/contracts.js';
import { reportRuntimeIssue } from '../../runtime/diagnostics.js';
import { getRouterNavigate } from '../../routing/routerNavigate.js';
import { modeToPath } from '../../routing/modePaths.js';
import { focusOptimizeFrame } from './optimize-route-state.js';

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T | null =>
  document.querySelector(sel) as T | null;
const scrollPositions: Record<string, number> = {
  overview: 0,
  tune: 0,
  compare: 0,
  optimize: 0,
  compendium: 0,
  howitworks: 0,
};

let _initCalled = false;
let _compareEditorDirty = false;
let _pendingActiveRefreshFrame: number | null = null;
let _storeSubscriptionsInstalled = false;
const _compareEditorDirtyListeners = new Set<() => void>();

function notifyCompareEditorDirtyListeners(): void {
  _compareEditorDirtyListeners.forEach((listener) => listener());
}

function setCompareEditorDirty(isDirty: boolean): void {
  if (_compareEditorDirty === isDirty) return;
  _compareEditorDirty = isDirty;
  notifyCompareEditorDirtyListeners();
}

export function getCompareEditorDirty(): boolean {
  return _compareEditorDirty;
}

export function subscribeCompareEditorDirty(listener: () => void): () => void {
  _compareEditorDirtyListeners.add(listener);
  return () => {
    _compareEditorDirtyListeners.delete(listener);
  };
}

function syncRuntimeViews(reason: string, changed: Parameters<typeof syncViews>[1]): void {
  syncViews(reason, changed);
}

function initTuneModeCompat(setup: { racquet: Racquet; stringConfig: StringConfig }): void {
  void import('./tune.js').then((mod) => {
    mod.initTuneModeIfMounted(setup);
  });
}

function buildLoadoutName(racquet: Racquet, stringConfig: StringConfig): string {
  if (stringConfig.isHybrid) {
    return `${stringConfig.mains.name} / ${stringConfig.crosses.name} on ${racquet.name}`;
  }
  return `${stringConfig.string.name} on ${racquet.name}`;
}

function getCompareStateSlot(slotId: string): any | null {
  const compareState = getCompareState();
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
  void loadout;
  const editor = document.getElementById('dock-editor-section') as HTMLDetailsElement | null;
  if (editor) editor.open = true;
}

export function activateLoadout(loadout: Loadout | null): void {
  if (!loadout) return;

  const current = getActiveLoadout();
  if (current && current._dirty) {
    saveActiveLoadout();
  }

  setDockEditorContext(getCurrentMode() === 'compare' ? { kind: 'compare-overview' } : { kind: 'active' });
  setCompareEditorDirty(false);
  setActiveLoadout(loadout);

  const racquet = RACQUETS.find((frame) => frame.id === loadout.frameId) as Racquet | undefined;
  if (racquet) {
    focusOptimizeFrame(racquet.name, racquet.id);
  }

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
  setCompareEditorDirty(false);
  setActiveLoadout(null);

  void import('./tune.js').then((mod) => {
    mod.resetTunePreviewState();
  });

  const editor = document.getElementById('dock-editor-section') as HTMLDetailsElement | null;
  if (editor) editor.open = false;
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
      setCompareSlotLoadout(context.slotId as CompareSlotId, baseLoadout, scored.stats);
      setCompareEditorDirty(false);
    } else {
      baseLoadout._dirty = getSavedLoadouts().some((loadout) => loadout.id === baseLoadout.id);
      setActiveLoadout(baseLoadout);
    }
  }

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
  setCompareEditorDirty(false);
  primeDockEditor(loadout);
  setDockEditorContext({ kind: 'compare-overview' });
  syncRuntimeViews('cancel-compare-slot-edit', { dockEditorContext: true });
}

export function addLoadoutToCompare(loadoutId: string): void {
  const loadout = getSavedLoadouts().find((item) => item.id === loadoutId);
  if (!loadout) return;

  const compareState = getCompareState();
  const emptySlot = compareState.slots.find((slot) => slot.loadout === null);
  const targetSlotId = emptySlot?.id || compareState.slots[compareState.slots.length - 1]?.id;
  const setup = getSetupFromLoadout(loadout);
  if (targetSlotId && setup) {
    const stats = getScoredSetup(setup).stats;
    setCompareSlotLoadout(targetSlotId as CompareSlotId, { ...loadout }, stats);
    setDockEditorContext({ kind: 'compare-overview' });
    setCompareEditorDirty(false);
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

  const compareState = getCompareState();
  const setup = getSetupFromLoadout(activeLoadout);
  if (!setup) return;

  const emptySlot = compareState.slots.find((slot: any) => slot.loadout === null);
  const targetSlotId = emptySlot?.id || compareState.slots[compareState.slots.length - 1]?.id;
  if (!targetSlotId) return;

  const stats = getScoredSetup(setup).stats;
  setCompareSlotLoadout(targetSlotId as CompareSlotId, { ...activeLoadout }, stats);
  setDockEditorContext({ kind: 'compare-overview' });
  setCompareEditorDirty(false);

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
      if (dock?.classList.contains('dock-expanded')) {
        toggleMobileDock();
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
  if (mode === 'compare') {
    if (getDockEditorContext().kind !== 'compare-slot') {
      setDockEditorContext({ kind: 'compare-overview' });
    }
  } else {
    setDockEditorContext({ kind: 'active' });
    setCompareEditorDirty(false);
  }

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

/** Compare tab activation (DOM must exist). Used by route mount and direct mode activation. */
export function runCompareModeActivation(): void {
  renderComparisonPresets();
}

/** Optimize / Compendium first-time init when React route mounts (DOM ready). */
export function runOptimizeRouteActivation(): void {
  return;
}

export type CompendiumWorkspaceTab = 'rackets' | 'strings' | 'leaderboard';

/**
 * Initialize compendium (first visit) or sync active frame; then switch the visible tab.
 * Tab switching uses the loaded module directly so it is not lost to the async
 * activation path or missed on repeat visits.
 */
export function runCompendiumRouteActivation(options?: { tab?: CompendiumWorkspaceTab }): void {
  void options;
}

export function openTuneForSlot(slotIndex: number): void {
  const compareStateSlot = getCompareState()?.slots?.[slotIndex] || null;

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

}

export function _onEditorChange(): void {
  if (getDockEditorContext().kind === 'compare-slot') {
    setCompareEditorDirty(true);
    return;
  }

  if (_pendingActiveRefreshFrame != null) {
    cancelAnimationFrame(_pendingActiveRefreshFrame);
  }

  _pendingActiveRefreshFrame = requestAnimationFrame(() => {
    _pendingActiveRefreshFrame = null;
    if (getActiveLoadout()) {
      commitEditorToLoadout();
    }
  });
}

export function startCompareSlotEditing(slotId: string): void {
  setDockEditorContext({ kind: 'compare-slot', slotId: String(slotId) });
  setCompareEditorDirty(false);

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
/*
legacy landing search removed
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
*/
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

  setSlotColors(SLOT_COLORS);
  validateRuntimeContracts({
    requiredDomIds: [
      'build-dock',
      'builder-panel',
      'dock-context-panel',
      'dock-my-loadouts',
      'workspace',
    ],
    requiredWindowBindings: [],
    throwInDev: true,
  });

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

  // Register cross-module callbacks once so dock and compare flows stay decoupled.
  registerDockCallbacks({
    switchMode,
    switchToLoadout,
    openFindMyBuild: () => { import('./find-my-build.js').then(m => m.openFindMyBuild()); },
    addActiveLoadoutToCompare: addActiveLoadoutToCompare,
    compareAddSlot: (slotId) => addCompareSlot(slotId as CompareSlotId),
    compareEditSlot: (slotId) => editCompareSlot(slotId as CompareSlotId),
    compareRemoveSlot: (slotId) => removeCompareSlot(slotId as CompareSlotId),
    compareClearSlot: (slotId) => clearCompareSlot(slotId as CompareSlotId),
    compareGetState: () => getCompareState(),
    compareQuickAddSaved: (loadoutId) => quickAddCompareSaved(loadoutId),
    renderCompareAll: () => undefined,
  });
  registerCompareShellCallbacks({
    activateLoadout,
    switchMode,
    renderDockContextPanel,
  });
  registerPresetCallbacks({
    switchMode,
  });
  renderComparisonPresets();
  document.getElementById('btn-add-slot')?.addEventListener('click', () => addComparisonSlot());

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

  document.querySelectorAll('.mobile-tab-btn').forEach((button) => {
    button.classList.toggle('active', (button as HTMLElement).dataset.mode === getCurrentMode());
  });
}
