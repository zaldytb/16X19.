// src/ui/pages/optimize.ts
// Optimizer page - find best string setups for a frame

import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { RACQUETS, STRINGS } from '../../data/loader.js';
import { predictSetup, buildTensionContext, computeCompositeScore } from '../../engine/index.js';
import type { Racquet, StringData, SetupAttributes, StringConfig } from '../../engine/types.js';
import {
  STRING_BRANDS,
  STRING_MATERIALS,
  getCachedValue,
  getScoredSetup,
  measurePerformance,
  scheduleRender,
} from '../../utils/performance.js';
import { createLoadout, saveLoadout } from '../../state/loadout.js';
import { getActiveLoadout } from '../../state/imperative.js';
import { getCurrentSetup } from '../../state/setup-sync.js';
import { activateLoadout, switchMode } from './shell.js';
import { getState as compareGetState, setSlotLoadout as compareSetSlotLoadout } from './compare/hooks/useCompareState.js';
import { OptimizeResultsTable } from '../../components/optimize/OptimizeResultsTable.js';
import { OptimizeMultiselectChecks } from '../../components/optimize/OptimizeMultiselectChecks.js';
import { OptimizeExcludeTags } from '../../components/optimize/OptimizeExcludeTags.js';
import { OptimizeUpgradePanel } from '../../components/optimize/OptimizeUpgradePanel.js';
import { buildOptimizeResultsViewModel, getOptimizeCandidateKey, type OptimizeCandidateVmSource } from './optimize-results-vm.js';
import {
  buildOptimizeBrandChecksVm,
  buildOptimizeExcludeTagsVm,
  buildOptimizeMaterialChecksVm,
  buildOptimizeMultiselectLabel,
} from './optimize-filters-vm.js';
import { OptimizeSearchDropdown } from '../../components/optimize/OptimizeSearchDropdown.js';

type OptimizerLoadoutLike = {
  id: string;
  frameId: string;
  stringId?: string | null;
  isHybrid?: boolean;
  mainsId?: string | null;
  crossesId?: string | null;
  mainsTension?: number;
  crossesTension?: number;
  stats?: SetupAttributes | null;
};

type OptimizeCandidate = {
  type: 'full' | 'hybrid';
  label: string;
  gauge?: string;
  tension: number;
  crossesTension?: number;
  score: number;
  stats: SetupAttributes;
  stringData?: StringData;
  mainsData?: StringData;
  crossesData?: StringData;
  racquet: Racquet;
};

// Module-level state
let _optExcludedStringIds = new Set<string>();
let _optAllowedMaterials = new Set<string>();
let _optAllowedBrands = new Set<string>();
let _optLastCandidates: OptimizeCandidate[] | null = null;
let _optLastCurrentOBS = 0;
let _optRunToken = 0;
let _optLastSortBy = 'obs';
let _optLastDisplayedCandidates: OptimizeCandidate[] = [];
let _optTargetTension = '';
let _optSavedCandidateKey: string | null = null;
let _optSavedCandidateTimeout: number | null = null;
let _optUpgradeMode = false;
let _optFrameQuery = '';
let _optFrameHiddenId = 'current';
let _optLockQuery = '';
let _optLockHiddenId = '';
let _optExcludeQuery = '';

type OptimizeResultsReactMount = { root: Root | null; host: HTMLElement | null };

const _optResultsMount: OptimizeResultsReactMount = { root: null, host: null };

type OptimizeFilterReactMount = { root: Root | null; host: HTMLElement | null };

const _optMaterialMount: OptimizeFilterReactMount = { root: null, host: null };
const _optBrandMount: OptimizeFilterReactMount = { root: null, host: null };
const _optExcludeMount: OptimizeFilterReactMount = { root: null, host: null };
const _optUpgradeMount: OptimizeFilterReactMount = { root: null, host: null };
const _optFrameSearchMount: OptimizeFilterReactMount = { root: null, host: null };
const _optLockSearchMount: OptimizeFilterReactMount = { root: null, host: null };
const _optExcludeSearchMount: OptimizeFilterReactMount = { root: null, host: null };

function _ensureOptimizeResultsReactRoot(container: HTMLElement | null): Root | null {
  if (!container) return null;
  if (_optResultsMount.root && _optResultsMount.host) {
    if (_optResultsMount.host !== container || !_optResultsMount.host.isConnected) {
      _optResultsMount.root.unmount();
      _optResultsMount.root = null;
      _optResultsMount.host = null;
    }
  }
  if (!_optResultsMount.root) {
    _optResultsMount.root = createRoot(container);
    _optResultsMount.host = container;
  }
  return _optResultsMount.root;
}

function _ensureOptimizeFilterReactRoot(mount: OptimizeFilterReactMount, container: HTMLElement | null): Root | null {
  if (!container) return null;
  if (mount.root && mount.host) {
    if (mount.host !== container || !mount.host.isConnected) {
      mount.root.unmount();
      mount.root = null;
      mount.host = null;
    }
  }
  if (!mount.root) {
    mount.root = createRoot(container);
    mount.host = container;
  }
  return mount.root;
}

function _syncOptimizeMultiselectLabels(): void {
  const matLabel = document.getElementById('opt-material-ms-label');
  const brandLabel = document.getElementById('opt-brand-ms-label');
  if (matLabel) {
    matLabel.textContent = buildOptimizeMultiselectLabel(
      'material',
      STRING_MATERIALS.length,
      _optAllowedMaterials,
      STRING_MATERIALS,
    );
  }
  if (brandLabel) {
    brandLabel.textContent = buildOptimizeMultiselectLabel(
      'brand',
      STRING_BRANDS.length,
      _optAllowedBrands,
      STRING_BRANDS,
    );
  }
}

function _renderOptimizeMaterialBrandFilters(): void {
  const matEl = document.getElementById('opt-material-checks');
  const brandEl = document.getElementById('opt-brand-checks');
  const matRoot = _ensureOptimizeFilterReactRoot(_optMaterialMount, matEl);
  const brandRoot = _ensureOptimizeFilterReactRoot(_optBrandMount, brandEl);
  if (!matRoot || !brandRoot) return;

  const matVm = buildOptimizeMaterialChecksVm(STRING_MATERIALS, _optAllowedMaterials);
  const brandVm = buildOptimizeBrandChecksVm(STRING_BRANDS, _optAllowedBrands);

  flushSync(() => {
    matRoot.render(
      createElement(OptimizeMultiselectChecks, {
        rows: matVm,
        onToggle: (value: string, checked: boolean) => {
          if (checked) {
            _optAllowedMaterials.add(value);
          } else {
            _optAllowedMaterials.delete(value);
          }
          _renderOptimizeMaterialBrandFilters();
        },
      }),
    );
    brandRoot.render(
      createElement(OptimizeMultiselectChecks, {
        rows: brandVm,
        onToggle: (value: string, checked: boolean) => {
          if (checked) {
            _optAllowedBrands.add(value);
          } else {
            _optAllowedBrands.delete(value);
          }
          _renderOptimizeMaterialBrandFilters();
        },
      }),
    );
  });
  _syncOptimizeMultiselectLabels();
}

function _renderOptimizeExcludeTags(): void {
  const el = document.getElementById('opt-exclude-tags');
  const root = _ensureOptimizeFilterReactRoot(_optExcludeMount, el);
  if (!root) return;
  const vm = buildOptimizeExcludeTagsVm(_optExcludedStringIds, STRINGS);
  root.render(
    createElement(OptimizeExcludeTags, {
      tags: vm,
      onRemove: (id: string) => {
        _optExcludedStringIds.delete(id);
        _renderOptimizeExcludeTags();
      },
    }),
  );
}

function _renderOptimizeUpgradePanel(): void {
  const el = document.getElementById('opt-react-upgrade-checkbox-root');
  const root = _ensureOptimizeFilterReactRoot(_optUpgradeMount, el);
  if (!root) return;
  root.render(
    createElement(OptimizeUpgradePanel, {
      upgradeMode: _optUpgradeMode,
      onUpgradeModeChange: (checked: boolean) => {
        _optUpgradeMode = checked;
        document.getElementById('opt-upgrade-fields')?.classList.toggle('hidden', !checked);
        _renderOptimizeUpgradePanel();
      },
    }),
  );
}

function _setOptTargetTension(value: string, rerender = true): void {
  _optTargetTension = value;

  if (!rerender || !_optLastCandidates || _optLastCandidates.length === 0) {
    return;
  }

  const sortBy = document.querySelector('.opt-th-active')?.textContent?.toLowerCase() || 'obs';
  renderOptimizerResults(_optLastCandidates, sortBy, _optLastCurrentOBS || 0);
}

function _syncOptimizeFrameState(): void {
  const activeLoadout = getActiveLoadout();
  const currentSetup = getCurrentSetup();

  if (activeLoadout?.frameId) {
    const activeFrame = RACQUETS.find((r) => r.id === activeLoadout.frameId);
    if (activeFrame) {
      _optFrameQuery = activeFrame.name;
      _optFrameHiddenId = activeFrame.id;
      return;
    }
  }

  if (currentSetup?.racquet) {
    _optFrameQuery = currentSetup.racquet.name;
    _optFrameHiddenId = currentSetup.racquet.id;
    return;
  }

  if (!_optFrameHiddenId) {
    _optFrameHiddenId = 'current';
  }
}

/**
 * Sync frame search UI from shell / FMB after external DOM updates are no longer used.
 */
export function syncOptimizeFrameSelectionFromExternal(name: string, frameId: string): void {
  _optFrameQuery = name;
  _optFrameHiddenId = frameId;
  _renderOptimizeSearchDropdowns();
}

function _renderOptimizeSearchDropdowns(): void {
  const frameHost = document.getElementById('opt-react-frame-search-root');
  const lockHost = document.getElementById('opt-react-lock-search-root');
  const exHost = document.getElementById('opt-react-exclude-search-root');

  const frameRoot = _ensureOptimizeFilterReactRoot(_optFrameSearchMount, frameHost);
  const lockRoot = _ensureOptimizeFilterReactRoot(_optLockSearchMount, lockHost);
  const exRoot = _ensureOptimizeFilterReactRoot(_optExcludeSearchMount, exHost);

  const frameItems = RACQUETS.map((r) => ({ id: r.id, name: r.name }));
  const lockItems = STRINGS.map((s) => ({ id: s.id, name: s.name }));
  const exItems = STRINGS.filter((s) => !_optExcludedStringIds.has(s.id)).map((s) => ({ id: s.id, name: s.name }));

  flushSync(() => {
    frameRoot?.render(
      createElement(OptimizeSearchDropdown, {
        inputId: 'opt-frame-search',
        dropdownId: 'opt-frame-dropdown',
        hiddenId: 'opt-frame-value',
        placeholder: 'Search frames...',
        items: frameItems,
        query: _optFrameQuery,
        hiddenValue: _optFrameHiddenId,
        onQueryChange: (q: string) => {
          _optFrameQuery = q;
          _renderOptimizeSearchDropdowns();
        },
        onSelectItem: (id: string, name: string) => {
          _optFrameQuery = name;
          _optFrameHiddenId = id;
          _renderOptimizeSearchDropdowns();
        },
      }),
    );
    lockRoot?.render(
      createElement(OptimizeSearchDropdown, {
        inputId: 'opt-lock-string-search',
        dropdownId: 'opt-lock-string-dropdown',
        hiddenId: 'opt-lock-string-value',
        placeholder: 'Search strings...',
        items: lockItems,
        query: _optLockQuery,
        hiddenValue: _optLockHiddenId,
        onQueryChange: (q: string) => {
          _optLockQuery = q;
          _renderOptimizeSearchDropdowns();
        },
        onSelectItem: (id: string, name: string) => {
          _optLockQuery = name;
          _optLockHiddenId = id;
          _renderOptimizeSearchDropdowns();
        },
      }),
    );
    exRoot?.render(
      createElement(OptimizeSearchDropdown, {
        inputId: 'opt-exclude-search',
        dropdownId: 'opt-exclude-dropdown',
        hiddenId: null,
        placeholder: 'Search to exclude...',
        items: exItems,
        query: _optExcludeQuery,
        onQueryChange: (q: string) => {
          _optExcludeQuery = q;
          _renderOptimizeSearchDropdowns();
        },
        onSelectItem: (id: string) => {
          _optExcludedStringIds.add(id);
          _optExcludeQuery = '';
          _renderOptimizeSearchDropdowns();
          _renderOptimizeExcludeTags();
        },
      }),
    );
  });
}

function _restoreOptimizerResultsIfAvailable(): void {
  if (!_optLastCandidates) return;

  const sortEl = document.getElementById('opt-sort') as HTMLSelectElement | null;
  const countEl = document.getElementById('opt-results-count');
  const sortBy = sortEl?.value || _optLastSortBy || 'obs';
  _optLastSortBy = sortBy;

  if (sortEl) {
    sortEl.value = sortBy;
  }
  if (countEl) {
    countEl.textContent = `${_optLastCandidates.length} result${_optLastCandidates.length !== 1 ? 's' : ''}`;
  }

  renderOptimizerResults(_optLastCandidates, sortBy, _optLastCurrentOBS);
}

function _getOptimizerCandidateAt(idx: number) {
  return _optLastDisplayedCandidates[idx] || _optLastCandidates?.[idx] || null;
}

/**
 * Initialize the optimizer page
 */
export function initOptimize(): void {
  const frameHost = document.getElementById('opt-react-frame-search-root');
  if (!frameHost) return;

  _syncOptimizeFrameState();

  if (frameHost.dataset.optInitialized === 'true') {
    _renderOptimizeSearchDropdowns();
    return;
  }
  frameHost.dataset.optInitialized = 'true';

  _renderOptimizeSearchDropdowns();

  // Material + brand filters (React islands)
  const materials = STRING_MATERIALS;
  const brands = STRING_BRANDS;
  _optAllowedMaterials = new Set(materials);
  _optAllowedBrands = new Set(brands);
  _renderOptimizeMaterialBrandFilters();

  _renderOptimizeExcludeTags();

  // Hybrid lock
  const lockSection = document.getElementById('opt-hybrid-lock-section');
  const lockSide = document.getElementById('opt-lock-side') as HTMLSelectElement | null;
  const lockStringWrap = document.getElementById('opt-lock-string-wrap');

  if (lockSide && lockStringWrap) {
    lockSide.addEventListener('change', () => {
      lockStringWrap.classList.toggle('hidden', lockSide.value === 'none');
      if (lockSide.value === 'none') {
        _optLockQuery = '';
        _optLockHiddenId = '';
        _renderOptimizeSearchDropdowns();
      }
    });
  }

  // Show hybrid lock only when type is hybrid or both
  document.querySelectorAll('.opt-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.opt-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = (btn as HTMLElement).dataset.value;
      lockSection?.classList.toggle('hidden', type === 'full');
    });
  });

  // Wire run button
  document.getElementById('opt-run-btn')?.addEventListener('click', runOptimizer);

  _renderOptimizeUpgradePanel();

  // Wire sort change to re-sort existing results
  document.getElementById('opt-sort')?.addEventListener('change', () => {
    if (_optLastCandidates && _optLastCandidates.length > 0) {
      const sortBy = (document.getElementById('opt-sort') as HTMLSelectElement | null)?.value || 'obs';
      _optLastSortBy = sortBy;
      _optLastCandidates.sort((a, b) => {
        if (sortBy === 'obs') return b.score - a.score;
        return ((b.stats as unknown as Record<string, number>)[sortBy] || 0) - ((a.stats as unknown as Record<string, number>)[sortBy] || 0);
      });
      renderOptimizerResults(_optLastCandidates, sortBy, _optLastCurrentOBS);
    }
  });

  // Mobile: inject filter toggle button
  if (!document.getElementById('opt-filter-toggle')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'opt-filter-toggle';
    toggleBtn.className = 'opt-filter-toggle';
    toggleBtn.innerHTML = `<span>Filters</span><svg class="opt-filter-toggle-icon" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4.5h10M4 7h6M6 9.5h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    const optLayout = document.querySelector('.opt-layout');
    const optFilters = document.getElementById('opt-filters');
    if (optLayout && optFilters) {
      optLayout.insertBefore(toggleBtn, optFilters);
      toggleBtn.addEventListener('click', () => {
        const filters = document.getElementById('opt-filters');
        const isCollapsed = filters?.classList.toggle('opt-filters-collapsed');
        toggleBtn.classList.toggle('filters-open', !isCollapsed);
      });
      if (window.matchMedia('(max-width: 1024px)').matches) {
        optFilters.classList.add('opt-filters-collapsed');
      }
    }
  }

  _restoreOptimizerResultsIfAvailable();
  _bindOptDelegates();
}

let _optDelegateBound = false;

function _bindOptDelegates(): void {
  if (_optDelegateBound) return;
  _optDelegateBound = true;

  document.addEventListener('click', (e: Event) => {
    const el = (e.target as Element).closest('[data-opt-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.optAction!;
    const idx = parseInt(el.dataset.optIdx ?? '-1', 10);

    switch (action) {
      case 'view': optActionView(idx); break;
      case 'tune': optActionTune(idx); break;
      case 'compare': optActionCompare(idx); break;
      case 'save': optActionSave(idx); break;
      case 'clearTensionFilter': _optApplyTensionFilter(''); break;
    }
  });

  document.addEventListener('change', (e: Event) => {
    const el = e.target as HTMLElement;
    if (el.dataset.optAction === 'tensionFilterChange') {
      _optApplyTensionFilter((el as HTMLInputElement).value);
    }
  });

  document.addEventListener('keyup', (e: KeyboardEvent) => {
    const el = e.target as HTMLElement;
    if (el.dataset.optAction === 'tensionFilterChange' && e.key === 'Enter') {
      _optApplyTensionFilter((el as HTMLInputElement).value);
    }
  });
}

/**
 * Toggle multi-select dropdown
 */
export function _toggleOptMS(msId: string): void {
  const ms = document.getElementById(msId);
  if (!ms) return;
  const dd = ms.querySelector('.opt-ms-dropdown') as HTMLElement | null;
  if (dd) dd.classList.toggle('hidden');
  document.querySelectorAll('.opt-multiselect .opt-ms-dropdown').forEach(d => {
    if (d !== dd) d.classList.add('hidden');
  });
}

/**
 * Update multi-select label
 */
export function _updateOptMSLabel(containerId: string, labelId: string, noun: string, total: number): void {
  const checked = document.querySelectorAll(`#${containerId} input:checked`).length;
  const el = document.getElementById(labelId);
  if (!el) return;
  if (checked === total) {
    el.textContent = `All ${noun}s`;
  } else if (checked === 0) {
    el.textContent = `No ${noun}s`;
  } else {
    el.textContent = `${checked} of ${total} ${noun}s`;
  }
}

// Close opt dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!(e.target as Element).closest('.opt-multiselect')) {
    document.querySelectorAll('.opt-ms-dropdown').forEach(d => d.classList.add('hidden'));
  }
});

/**
 * Render exclude tags (React); kept for external callers that trigger a refresh.
 */
export function _renderExcludeTags(): void {
  _renderOptimizeExcludeTags();
}

/**
 * Run the optimizer
 */
export function runOptimizer(): void {
  const resultsEl = document.getElementById('opt-results');
  const countEl = document.getElementById('opt-results-count');
  const runToken = ++_optRunToken;

  _optClearTensionFilter(false);
  _renderOptimizeResultsState(resultsEl, null, _optLastSortBy || 'obs', _optLastCurrentOBS);
  scheduleRender('optimizer:run', () => {
    void _runOptimizerCore(resultsEl, countEl, runToken);
  });
  return;

  _renderOptimizeResultsState(resultsEl, null, _optLastSortBy || 'obs', _optLastCurrentOBS);

  scheduleRender('optimizer:run', () => {
    void _runOptimizerCore(resultsEl, countEl, runToken);
  });
}

/**
 * Core optimizer logic
 */
async function _runOptimizerCore(resultsEl: HTMLElement | null, countEl: HTMLElement | null, runToken: number): Promise<void> {
  const frameSelVal = (document.getElementById('opt-frame-value') as HTMLInputElement | null)?.value || '';
  const setupType = (document.querySelector('.opt-toggle.active') as HTMLElement | null)?.dataset.value || 'both';

  const lockSide = (document.getElementById('opt-lock-side') as HTMLSelectElement | null)?.value || 'none';
  const lockStringId = (document.getElementById('opt-lock-string-value') as HTMLInputElement | null)?.value || '';
  const lockedString = lockStringId ? STRINGS.find(s => s.id === lockStringId) : null;

  function isStringAllowed(s: StringData): boolean {
    if (_optExcludedStringIds.has(s.id)) return false;
    if (!_optAllowedMaterials.has(s.material)) return false;
    if (!_optAllowedBrands.has(s.name.split(' ')[0])) return false;
    return true;
  }

  const filterSignature = [
    [..._optAllowedMaterials].sort().join(','),
    [..._optAllowedBrands].sort().join(','),
    [..._optExcludedStringIds].sort().join(','),
  ].join('|');
  const filteredStrings = getCachedValue(`opt:filtered:${filterSignature}`, () =>
    STRINGS.filter(isStringAllowed)
  );
  const sortBy = (document.getElementById('opt-sort') as HTMLSelectElement | null)?.value || 'obs';
  _optLastSortBy = sortBy;
  const tensionMin = parseInt((document.getElementById('opt-tension-min') as HTMLInputElement | null)?.value || '40') || 40;
  const tensionMax = parseInt((document.getElementById('opt-tension-max') as HTMLInputElement | null)?.value || '65') || 65;
  const upgradeMode = (document.getElementById('opt-upgrade-mode') as HTMLInputElement | null)?.checked ?? false;

  const mins = {
    spin: parseInt((document.getElementById('opt-min-spin') as HTMLInputElement | null)?.value || '0') || 0,
    control: parseInt((document.getElementById('opt-min-control') as HTMLInputElement | null)?.value || '0') || 0,
    power: parseInt((document.getElementById('opt-min-power') as HTMLInputElement | null)?.value || '0') || 0,
    comfort: parseInt((document.getElementById('opt-min-comfort') as HTMLInputElement | null)?.value || '0') || 0,
    feel: parseInt((document.getElementById('opt-min-feel') as HTMLInputElement | null)?.value || '0') || 0,
    durability: parseInt((document.getElementById('opt-min-durability') as HTMLInputElement | null)?.value || '0') || 0,
    playability: parseInt((document.getElementById('opt-min-playability') as HTMLInputElement | null)?.value || '0') || 0,
    stability: parseInt((document.getElementById('opt-min-stability') as HTMLInputElement | null)?.value || '0') || 0,
    maneuverability: parseInt((document.getElementById('opt-min-maneuverability') as HTMLInputElement | null)?.value || '0') || 0
  };

  const upgradeOBS = parseFloat((document.getElementById('opt-upgrade-obs') as HTMLInputElement | null)?.value || '0') || 0;
  const upgradeCtlLoss = parseFloat((document.getElementById('opt-upgrade-ctl-loss') as HTMLInputElement | null)?.value || '5') || 5;
  const upgradeDurLoss = parseFloat((document.getElementById('opt-upgrade-dur-loss') as HTMLInputElement | null)?.value || '10') || 10;

  const activeLoadout = getActiveLoadout();
  let racquet: Racquet;

  if (frameSelVal === 'current' || !frameSelVal) {
    if (activeLoadout && activeLoadout.frameId) {
      racquet = (RACQUETS as unknown as Racquet[]).find(r => r.id === activeLoadout.frameId) || (RACQUETS[0] as unknown as Racquet);
    } else {
      const setup = getCurrentSetup();
      racquet = setup ? setup.racquet : (RACQUETS[0] as unknown as Racquet);
    }
  } else {
    racquet = (RACQUETS as unknown as Racquet[]).find(r => r.id === frameSelVal) || (RACQUETS[0] as unknown as Racquet);
  }

  let currentOBS = 0;
  let currentStats: SetupAttributes | null = null;
  const currentSetup = getCurrentSetup();
  if (currentSetup) {
    const scored = getScoredSetup(currentSetup);
    currentStats = scored.stats;
    currentOBS = scored.obs;
  }

  const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
  const sweepMin = Math.max(tensionMin, 30);
  const sweepMax = Math.min(tensionMax, 75);

  function findOptimalTension(buildConfig: { isHybrid: boolean; string?: StringData; mains?: StringData; crosses?: StringData }) {
    let bestScore = -1, bestTension = midTension, bestStats: SetupAttributes | null = null;
    for (let t = sweepMin; t <= sweepMax; t += 1) {
      const cfg = { ...buildConfig, mainsTension: t, crossesTension: t - (buildConfig.isHybrid ? 2 : 0) };
      const scored = getScoredSetup({ racquet, stringConfig: cfg as StringConfig });
      const stats = scored.stats;
      if (!stats) continue;
      const score = scored.obs;
      if (score > bestScore) {
        bestScore = score;
        bestTension = t;
        bestStats = stats;
      }
    }
    return { score: bestScore, tension: bestTension, stats: bestStats };
  }

  const candidates: NonNullable<typeof _optLastCandidates> = [];
  const fullResults = new Map<string, ReturnType<typeof findOptimalTension>>();

  async function yieldBack(counter: number): Promise<boolean> {
    if (runToken !== _optRunToken) return true;
    if (counter % 24 !== 0) return false;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return runToken !== _optRunToken;
  }

  // Full bed candidates
  if (setupType === 'full' || setupType === 'both') {
    for (let index = 0; index < filteredStrings.length; index += 1) {
      const s = filteredStrings[index];
      const result = findOptimalTension({ isHybrid: false, string: s });
      fullResults.set(s.id, result);
      if (result.stats) {
        candidates.push({
          type: 'full',
          label: s.name,
          gauge: (s.gauge || '').replace(/\s*\(.*\)/, ''),
          tension: result.tension,
          crossesTension: result.tension,
          score: result.score,
          stats: result.stats,
          stringData: s,
          racquet
        });
      }
      if (await yieldBack(index + 1)) return;
    }
  }

  // Hybrid candidates
  if (setupType === 'hybrid' || setupType === 'both') {
    let hybridMainsPool: StringData[], hybridCrossesPool: StringData[];

    if (lockSide === 'mains' && lockedString) {
      hybridMainsPool = [lockedString];
      hybridCrossesPool = filteredStrings.filter(s => s.id !== lockedString.id);
    } else if (lockSide === 'crosses' && lockedString) {
      hybridMainsPool = filteredStrings;
      hybridCrossesPool = [lockedString];
    } else {
      const tempFullForRanking: Array<{ stringId: string; score: number }> = [];
      filteredStrings.forEach(s => {
        const result = fullResults.get(s.id) || findOptimalTension({ isHybrid: false, string: s });
        fullResults.set(s.id, result);
        if (result.stats) tempFullForRanking.push({ stringId: s.id, score: result.score });
      });
      tempFullForRanking.sort((a, b) => b.score - a.score);
      const topMainsIds = new Set(tempFullForRanking.slice(0, 12).map(c => c.stringId));
      filteredStrings.forEach(s => {
        if (s.material === 'Natural Gut' || s.material === 'Multifilament') topMainsIds.add(s.id);
      });
      hybridMainsPool = filteredStrings.filter(s => topMainsIds.has(s.id));

      hybridCrossesPool = filteredStrings.filter(s => {
        const shape = (s.shape || '').toLowerCase();
        const isRoundSlick = shape.includes('round') || shape.includes('slick') || shape.includes('coated');
        const isElastic = s.material === 'Co-Polyester (elastic)';
        const isSoftPoly = s.material === 'Polyester' && s.stiffness < 200;
        return isRoundSlick || isElastic || isSoftPoly;
      });
    }

    let hybridCounter = 0;
    for (const mains of hybridMainsPool) {
      for (const cross of hybridCrossesPool) {
        if (cross.id === mains.id) continue;
        const result = findOptimalTension({ isHybrid: true, mains, crosses: cross });
        if (result.stats && result.score > 0) {
          candidates.push({
            type: 'hybrid',
            label: `${mains.name} / ${cross.name}`,
            gauge: ((mains.gauge || '').replace(/\s*\(.*\)/, '') + '/' + (cross.gauge || '').replace(/\s*\(.*\)/, '')),
            tension: result.tension,
            crossesTension: result.tension - 2,
            score: result.score,
            stats: result.stats,
            mainsData: mains,
            crossesData: cross,
            racquet
          });
        }
        hybridCounter += 1;
        if (await yieldBack(hybridCounter)) return;
      }
    }
  }

  // Filter by stat minimums
  let filteredCandidates = candidates.filter(c => {
    return c.stats.spin >= mins.spin &&
           c.stats.control >= mins.control &&
           c.stats.power >= mins.power &&
           c.stats.comfort >= mins.comfort &&
           c.stats.feel >= mins.feel &&
           c.stats.durability >= mins.durability &&
           c.stats.playability >= mins.playability &&
           c.stats.stability >= mins.stability &&
           c.stats.maneuverability >= mins.maneuverability;
  });

  // Upgrade mode filtering
  if (upgradeMode && currentStats) {
    filteredCandidates = filteredCandidates.filter(c => {
      if (c.score < currentOBS + upgradeOBS) return false;
      if (currentStats.control - c.stats.control > upgradeCtlLoss) return false;
      if (currentStats.durability - c.stats.durability > upgradeDurLoss) return false;
      return true;
    });
  }

  // Sort
  const finalizedCandidates = measurePerformance('optimizer candidate generation', () => filteredCandidates.sort((a, b) => {
    if (sortBy === 'obs') return b.score - a.score;
    return ((b.stats as unknown as Record<string, number>)[sortBy] || 0) - ((a.stats as unknown as Record<string, number>)[sortBy] || 0);
  }));

  if (runToken !== _optRunToken) return;

  _optLastCandidates = finalizedCandidates;
  _optLastCurrentOBS = currentOBS;

  if (countEl) {
    countEl.textContent = `${finalizedCandidates.length} result${finalizedCandidates.length !== 1 ? 's' : ''}`;
  }
  renderOptimizerResults(finalizedCandidates, sortBy, currentOBS);
}

/**
 * Render optimizer results table
 */
export function renderOptimizerResults(
  candidates: NonNullable<typeof _optLastCandidates>,
  sortBy: string,
  currentOBS: number
): void {
  const resultsEl = document.getElementById('opt-results');
  if (!resultsEl) return;
  _renderOptimizeResultsState(resultsEl, candidates as OptimizeCandidateVmSource[], sortBy, currentOBS);
}

function _renderOptimizeResultsState(
  resultsEl: HTMLElement | null,
  candidates: OptimizeCandidateVmSource[] | null,
  sortBy: string,
  currentOBS: number,
): void {
  if (!resultsEl) return;
  const root = _ensureOptimizeResultsReactRoot(resultsEl);
  if (!root) return;

  const vm = buildOptimizeResultsViewModel(candidates, currentOBS, _optTargetTension, _optSavedCandidateKey, sortBy);
  if (vm.state === 'results') {
    _optLastDisplayedCandidates = vm.rows.map((row) => candidates![row.rowIndex]);
  } else {
    _optLastDisplayedCandidates = [];
  }

  root.render(createElement(OptimizeResultsTable, { model: vm }));
}

/**
 * Apply target tension filter
 */
export function _optApplyTensionFilter(value: string): void {
  _setOptTargetTension(value);
}

/**
 * Clear tension filter
 */
export function _optClearTensionFilter(rerender = true): void {
  _setOptTargetTension('', rerender);
}

/**
 * Build preset data from candidate
 */
export function _optBuildPresetData(candidate: NonNullable<typeof _optLastCandidates>[0]): {
  id: string;
  name: string;
  racquetId: string;
  isHybrid: boolean;
  mainsId: string | null;
  crossesId: string | null;
  mainsTension: number;
  crossesTension: number;
  stringId: string | null;
} {
  const c = candidate;
  if (c.type === 'hybrid') {
    return {
      id: 'opt-' + Date.now(),
      name: c.label + ' on ' + c.racquet.name,
      racquetId: c.racquet.id,
      isHybrid: true,
      mainsId: c.mainsData!.id,
      crossesId: c.crossesData!.id,
      mainsTension: c.tension,
      crossesTension: c.crossesTension!,
      stringId: null
    };
  } else {
    return {
      id: 'opt-' + Date.now(),
      name: c.label + ' on ' + c.racquet.name,
      racquetId: c.racquet.id,
      isHybrid: false,
      mainsId: null,
      crossesId: null,
      mainsTension: c.tension,
      crossesTension: c.tension,
      stringId: c.stringData!.id
    };
  }
}

function _createOptimizerLoadout(candidate: NonNullable<typeof _optLastCandidates>[0]) {
  const preset = _optBuildPresetData(candidate);
  return createLoadout(
    preset.racquetId,
    preset.isHybrid ? preset.mainsId! : preset.stringId!,
    preset.mainsTension,
    {
      source: 'optimize',
      isHybrid: preset.isHybrid,
      mainsId: preset.mainsId,
      crossesId: preset.crossesId,
      crossesTension: preset.crossesTension,
    }
  ) || null;
}

function _savePreviousActiveLoadout(nextLoadout: {
  frameId: string;
  stringId?: string | null;
  isHybrid?: boolean;
  mainsId?: string | null;
  crossesId?: string | null;
  mainsTension?: number;
  crossesTension?: number;
}): void {
  const activeLoadout = getActiveLoadout();
  if (!activeLoadout || !activeLoadout.id) return;

  const isSameBuild =
    activeLoadout.frameId === nextLoadout.frameId &&
    (activeLoadout.stringId || '') === (nextLoadout.stringId || '') &&
    !!activeLoadout.isHybrid === !!nextLoadout.isHybrid &&
    (activeLoadout.mainsId || '') === (nextLoadout.mainsId || '') &&
    (activeLoadout.crossesId || '') === (nextLoadout.crossesId || '') &&
    (activeLoadout.mainsTension || 0) === (nextLoadout.mainsTension || 0) &&
    (activeLoadout.crossesTension || 0) === (nextLoadout.crossesTension || 0);

  if (!isSameBuild) {
    saveLoadout(activeLoadout);
  }
}

/**
 * View optimizer result
 */
export function optActionView(idx: number): void {
  const c = _getOptimizerCandidateAt(idx);
  if (!c) return;
  const loadout = _createOptimizerLoadout(c);
  if (!loadout) return;
  _savePreviousActiveLoadout(loadout);
  activateLoadout(loadout);
  switchMode('overview');
}

/**
 * Tune optimizer result
 */
export function optActionTune(idx: number): void {
  const c = _getOptimizerCandidateAt(idx);
  if (!c) return;
  const loadout = _createOptimizerLoadout(c);
  if (!loadout) return;
  _savePreviousActiveLoadout(loadout);
  activateLoadout(loadout);
  switchMode('tune');
}

/**
 * Compare optimizer result
 */
export function optActionCompare(idx: number): void {
  const c = _getOptimizerCandidateAt(idx);
  if (!c) return;
  const lo = _createOptimizerLoadout(c);
  const compareState = compareGetState();
  if (lo?.stats && compareState?.slots) {
    const emptySlot = compareState.slots.find((slot) => slot.loadout === null);
    if (emptySlot?.id) {
      compareSetSlotLoadout(emptySlot.id, lo, lo.stats);
    }
    switchMode('compare');
  }
}

/**
 * Save optimizer result
 */
export function optActionSave(idx: number): void {
  const c = _getOptimizerCandidateAt(idx);
  if (!c) return;
  const lo = _createOptimizerLoadout(c);
  if (lo) {
    saveLoadout(lo);
  }
  _optSavedCandidateKey = getOptimizeCandidateKey(c);
  if (_optSavedCandidateTimeout != null) {
    window.clearTimeout(_optSavedCandidateTimeout);
  }
  _optSavedCandidateTimeout = window.setTimeout(() => {
    _optSavedCandidateKey = null;
    _optSavedCandidateTimeout = null;
    if (_optLastCandidates) {
      renderOptimizerResults(_optLastCandidates, _optLastSortBy || 'obs', _optLastCurrentOBS);
    }
  }, 1200);
  if (_optLastCandidates) {
    renderOptimizerResults(_optLastCandidates, _optLastSortBy || 'obs', _optLastCurrentOBS);
  }
  return;

}

