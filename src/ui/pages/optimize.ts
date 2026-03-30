// src/ui/pages/optimize.ts
// Optimizer page - find best string setups for a frame

import { RACQUETS, STRINGS } from '../../data/loader.js';
import { predictSetup, buildTensionContext, computeCompositeScore, getObsScoreColor } from '../../engine/index.js';
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
import { getActiveLoadout } from '../../state/store.js';
import { getCurrentSetup } from '../../state/setup-sync.js';
import { activateLoadout, switchMode } from './shell.js';
import { getState as compareGetState, setSlotLoadout as compareSetSlotLoadout } from './compare/index.js';

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
let _optimizeInitialized = false;
let _optExcludedStringIds = new Set<string>();
let _optAllowedMaterials = new Set<string>();
let _optAllowedBrands = new Set<string>();
let _optLastCandidates: OptimizeCandidate[] | null = null;
let _optLastCurrentOBS = 0;
let _optRunToken = 0;
let _optLastSortBy = 'obs';
let _optLastDisplayedCandidates: OptimizeCandidate[] = [];

function _syncOptimizeFrameInput(frameSearch: HTMLInputElement, frameValue: HTMLInputElement): void {
  const activeLoadout = getActiveLoadout();
  const currentSetup = getCurrentSetup();

  if (activeLoadout?.frameId) {
    const activeFrame = RACQUETS.find((r) => r.id === activeLoadout.frameId);
    if (activeFrame) {
      frameSearch.value = activeFrame.name;
      frameValue.value = activeFrame.id;
      return;
    }
  }

  if (currentSetup?.racquet) {
    frameSearch.value = currentSetup.racquet.name;
    frameValue.value = currentSetup.racquet.id;
    return;
  }

  if (!frameValue.value) {
    frameValue.value = 'current';
  }
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
  const frameSearch = document.getElementById('opt-frame-search') as HTMLInputElement | null;
  const frameDropdown = document.getElementById('opt-frame-dropdown') as HTMLElement | null;
  const frameValue = document.getElementById('opt-frame-value') as HTMLInputElement | null;

  if (!frameSearch || !frameDropdown || !frameValue) return;

  _syncOptimizeFrameInput(frameSearch, frameValue);

  if (frameSearch.dataset.optInitialized === 'true') {
    return;
  }
  frameSearch.dataset.optInitialized = 'true';
  _optimizeInitialized = true;

  _initOptSearchable(
    frameSearch,
    frameDropdown,
    frameValue,
    () => RACQUETS.map(r => ({ id: r.id, name: r.name }))
  );

  // Material filter
  const materials = STRING_MATERIALS;
  _optAllowedMaterials = new Set(materials);
  const matContainer = document.getElementById('opt-material-checks');
  if (matContainer) {
    matContainer.innerHTML = '';
    materials.forEach(mat => {
      const item = document.createElement('label');
      item.className = 'opt-ms-item active';
      item.innerHTML = `<input type="checkbox" checked value="${mat}"><span>${mat}</span>`;
      item.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).tagName !== 'INPUT') return;
        const input = item.querySelector('input');
        item.classList.toggle('active', input?.checked ?? false);
        if (input?.checked) _optAllowedMaterials.add(mat);
        else _optAllowedMaterials.delete(mat);
        _updateOptMSLabel('opt-material-checks', 'opt-material-ms-label', 'material', materials.length);
      });
      matContainer.appendChild(item);
    });
    _updateOptMSLabel('opt-material-checks', 'opt-material-ms-label', 'material', materials.length);
  }

  // Brand filter
  const brands = STRING_BRANDS;
  _optAllowedBrands = new Set(brands);
  const brandContainer = document.getElementById('opt-brand-checks');
  if (brandContainer) {
    brandContainer.innerHTML = '';
    brands.forEach(brand => {
      const item = document.createElement('label');
      item.className = 'opt-ms-item active';
      item.innerHTML = `<input type="checkbox" checked value="${brand}"><span>${brand}</span>`;
      item.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).tagName !== 'INPUT') return;
        const input = item.querySelector('input');
        item.classList.toggle('active', input?.checked ?? false);
        if (input?.checked) _optAllowedBrands.add(brand);
        else _optAllowedBrands.delete(brand);
        _updateOptMSLabel('opt-brand-checks', 'opt-brand-ms-label', 'brand', brands.length);
      });
      brandContainer.appendChild(item);
    });
    _updateOptMSLabel('opt-brand-checks', 'opt-brand-ms-label', 'brand', brands.length);
  }

  // Exclude strings searchable
  const exSearch = document.getElementById('opt-exclude-search') as HTMLInputElement | null;
  const exDropdown = document.getElementById('opt-exclude-dropdown') as HTMLElement | null;
  if (exSearch && exDropdown) {
    _initOptSearchable(
      exSearch,
      exDropdown,
      null,
      () => STRINGS.filter(s => !_optExcludedStringIds.has(s.id)).map(s => ({ id: s.id, name: s.name })),
      (id: string) => {
        _optExcludedStringIds.add(id);
        _renderExcludeTags();
        exSearch.value = '';
      }
    );
  }

  // Hybrid lock
  const lockSection = document.getElementById('opt-hybrid-lock-section');
  const lockSide = document.getElementById('opt-lock-side') as HTMLSelectElement | null;
  const lockStringWrap = document.getElementById('opt-lock-string-wrap');
  const lockSearch = document.getElementById('opt-lock-string-search') as HTMLInputElement | null;
  const lockDropdown = document.getElementById('opt-lock-string-dropdown') as HTMLElement | null;
  const lockValue = document.getElementById('opt-lock-string-value') as HTMLInputElement | null;

  if (lockSearch && lockDropdown && lockValue) {
    _initOptSearchable(
      lockSearch,
      lockDropdown,
      lockValue,
      () => STRINGS.map(s => ({ id: s.id, name: s.name }))
    );
  }

  if (lockSide && lockStringWrap) {
    lockSide.addEventListener('change', () => {
      lockStringWrap.classList.toggle('hidden', lockSide.value === 'none');
      if (lockSide.value === 'none' && lockValue) lockValue.value = '';
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

  // Wire upgrade mode checkbox
  document.getElementById('opt-upgrade-mode')?.addEventListener('change', (e) => {
    document.getElementById('opt-upgrade-fields')?.classList.toggle('hidden', !(e.target as HTMLInputElement).checked);
  });

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
 * Initialize searchable dropdown for optimizer
 */
function _initOptSearchable(
  inputEl: HTMLInputElement,
  dropdownEl: HTMLElement,
  hiddenEl: HTMLInputElement | null,
  getItems: () => Array<{ id: string; name: string }>,
  onSelect?: (id: string, name: string) => void
): void {
  let isOpen = false;

  function render(q: string) {
    const items = getItems();
    const filtered = q ? items.filter(i => i.name.toLowerCase().includes(q.toLowerCase())) : items;
    if (filtered.length === 0) {
      dropdownEl.classList.add('hidden');
      return;
    }
    dropdownEl.innerHTML = filtered.slice(0, 30).map(i =>
      `<div class="opt-search-item" data-id="${i.id}">${i.name}</div>`
    ).join('');
    dropdownEl.classList.remove('hidden');
    isOpen = true;

    dropdownEl.querySelectorAll('.opt-search-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const id = (item as HTMLElement).dataset.id || '';
        const name = item.textContent || '';
        if (hiddenEl) hiddenEl.value = id;
        inputEl.value = name;
        dropdownEl.classList.add('hidden');
        isOpen = false;
        if (onSelect) onSelect(id, name);
      });
    });
  }

  inputEl.addEventListener('focus', () => render(inputEl.value));
  inputEl.addEventListener('input', () => render(inputEl.value));
  inputEl.addEventListener('blur', () => {
    setTimeout(() => { dropdownEl.classList.add('hidden'); isOpen = false; }, 150);
  });
}

/**
 * Render exclude tags
 */
export function _renderExcludeTags(): void {
  const container = document.getElementById('opt-exclude-tags');
  if (!container) return;
  container.innerHTML = Array.from(_optExcludedStringIds).map(id => {
    const s = STRINGS.find(x => x.id === id);
    return `<span class="opt-exclude-tag">${s ? s.name : id}<span class="opt-exclude-x" data-id="${id}">×</span></span>`;
  }).join('');
  container.querySelectorAll('.opt-exclude-x').forEach(x => {
    x.addEventListener('click', () => {
      _optExcludedStringIds.delete((x as HTMLElement).dataset.id || '');
      _renderExcludeTags();
    });
  });
}

/**
 * Run the optimizer
 */
export function runOptimizer(): void {
  const resultsEl = document.getElementById('opt-results');
  const countEl = document.getElementById('opt-results-count');
  const runToken = ++_optRunToken;

  _optClearTensionFilter();

  if (resultsEl) {
    resultsEl.innerHTML = '<div class="opt-loading">Computing builds…</div>';
  }

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

  if (candidates.length === 0) {
    resultsEl.innerHTML = `
      <div class="opt-empty">
        <p class="opt-empty-title">No builds match your filters</p>
        <p class="opt-empty-sub">Try relaxing the stat minimums or expanding the tension range.</p>
      </div>`;
    return;
  }

  const sortColClass = sortBy === 'obs' ? 'obs' : sortBy;
  const targetTension = (window as unknown as { _optTargetTension?: string })._optTargetTension || '';

  let displayCandidates = candidates;
  if (targetTension !== '' && !isNaN(parseInt(targetTension))) {
    const target = parseInt(targetTension);
    displayCandidates = candidates.filter(c => Math.abs(c.tension - target) <= 1);
  }

  const top = displayCandidates.slice(0, 200);
  _optLastDisplayedCandidates = top;

  const filterHTML = '<div class="opt-tension-filter">' +
    '<label class="opt-tension-label">Target Tension</label>' +
    '<input type="number" class="opt-tension-input" id="opt-tension-filter" ' +
      'value="' + (targetTension !== '' ? targetTension : '') + '" ' +
      'placeholder="All" min="30" max="70" ' +
      'data-opt-action="tensionFilterChange" ' +
      '>' +
    '<span class="opt-tension-hint">±1 lb</span>' +
    '<button class="opt-tension-clear" data-opt-action="clearTensionFilter" ' +
      (targetTension === '' ? 'style="display:none"' : '') + '>Clear</button>' +
  '</div>';

  let html = filterHTML + '<div class="opt-table-wrap"><table class="opt-table">' +
    '<thead><tr>' +
      '<th class="opt-th opt-th-rank">#</th>' +
      '<th class="opt-th opt-th-type">Type</th>' +
      '<th class="opt-th opt-th-string">String(s)</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'obs' ? ' opt-th-active' : '') + '">OBS</th>' +
      '<th class="opt-th opt-th-num opt-th-delta">&Delta;</th>' +
      '<th class="opt-th opt-th-gauge">Ga.</th>' +
      '<th class="opt-th opt-th-tension">Tension</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'spin' ? ' opt-th-active' : '') + '">Spn</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'power' ? ' opt-th-active' : '') + '">Pwr</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'control' ? ' opt-th-active' : '') + '">Ctl</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'comfort' ? ' opt-th-active' : '') + '">Cmf</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'feel' ? ' opt-th-active' : '') + '">Fel</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'durability' ? ' opt-th-active' : '') + '">Dur</th>' +
      '<th class="opt-th opt-th-num' + (sortColClass === 'playability' ? ' opt-th-active' : '') + '">Ply</th>' +
      '<th class="opt-th opt-th-actions"></th>' +
    '</tr></thead><tbody>';

  top.forEach((c, i) => {
    const delta = c.score - currentOBS;
    const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
    const deltaCls = delta > 0.5 ? 'opt-delta-pos' : delta < -0.5 ? 'opt-delta-neg' : 'opt-delta-neutral';
    const tensionLabel = c.type === 'hybrid' ? `${c.tension}/${c.crossesTension}` : `${c.tension}`;
    const typeTag = c.type === 'hybrid' ? '<span class="opt-tag-hybrid">H</span>' : '<span class="opt-tag-full">F</span>';

    html += `<tr class="opt-row${i === 0 ? ' opt-row-top' : ''}" data-opt-idx="${i}">
      <td class="opt-td opt-td-rank">${i + 1}</td>
      <td class="opt-td opt-td-type">${typeTag}</td>
      <td class="opt-td opt-td-string">${c.label}</td>
      <td class="opt-td opt-td-num opt-td-obs" style="color:${getObsScoreColor(c.score)};font-weight:700">${c.score.toFixed(1)}</td>
      <td class="opt-td opt-td-num ${deltaCls}">${deltaStr}</td>
      <td class="opt-td opt-td-gauge">${c.gauge || '—'}</td>
      <td class="opt-td opt-td-tension">${tensionLabel}</td>
      <td class="opt-td opt-td-num">${c.stats.spin?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.power?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.control?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.comfort?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.feel?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.durability?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.playability?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-actions">
        <button class="opt-act-btn" data-opt-action="view" data-opt-idx="${i}">View</button>
        <button class="opt-act-btn" data-opt-action="tune" data-opt-idx="${i}">Tune</button>
        <button class="opt-act-btn" data-opt-action="compare" data-opt-idx="${i}">Compare</button>
        <button class="opt-act-btn opt-act-save" data-opt-action="save" data-opt-idx="${i}">Save</button>
      </td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  resultsEl.innerHTML = html;
}

/**
 * Apply target tension filter
 */
export function _optApplyTensionFilter(value: string): void {
  (window as unknown as { _optTargetTension: string })._optTargetTension = value;
  if (_optLastCandidates && _optLastCandidates.length > 0) {
    const sortBy = document.querySelector('.opt-th-active')?.textContent?.toLowerCase() || 'obs';
    renderOptimizerResults(_optLastCandidates, sortBy, _optLastCurrentOBS || 0);
  }
}

/**
 * Clear tension filter
 */
export function _optClearTensionFilter(): void {
  (window as unknown as { _optTargetTension: string })._optTargetTension = '';
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

  const btn = document.querySelector(`tr[data-opt-idx="${idx}"] .opt-act-save`);
  if (btn) {
    btn.textContent = '✓';
    btn.classList.add('opt-act-saved');
    setTimeout(() => {
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M11.5 1H3.5A1.5 1.5 0 002 2.5v10A1.5 1.5 0 003.5 14h8a1.5 1.5 0 001.5-1.5v-10A1.5 1.5 0 0011.5 1z" stroke="currentColor" stroke-width="1.2"/><path d="M5 1v4h5V1" stroke="currentColor" stroke-width="1.2"/><path d="M5 10h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
      btn.classList.remove('opt-act-saved');
    }, 1200);
  }
}
