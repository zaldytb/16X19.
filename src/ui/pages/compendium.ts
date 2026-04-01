import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RACQUETS, STRINGS } from '../../data/loader.js';
import {
  GAUGE_LABELS,
  applyGaugeModifier,
  buildTensionContext,
  calcFrameBase,
  computeCompositeScore,
  generateIdentity,
  getGaugeOptions,
  predictSetup,
} from '../../engine/index.js';
import type { Loadout, Racquet, SetupStats } from '../../engine/types.js';
import { createLoadout, saveLoadout } from '../../state/loadout.js';
import { generateBuildReason, generateTopBuilds, pickDiverseBuilds, type Build } from '../../state/presets.js';
import { getCurrentSetup } from '../../state/setup-sync.js';
import { CompendiumBaseProfile } from '../../components/compendium/CompendiumBaseProfile.js';
import { CompendiumFrameRoster } from '../../components/compendium/CompendiumFrameRoster.js';
import { CompendiumRacketHero } from '../../components/compendium/CompendiumRacketHero.js';
import { CompendiumStringModulator } from '../../components/compendium/CompendiumStringModulator.js';
import { CompendiumTopBuilds } from '../../components/compendium/CompendiumTopBuilds.js';
import { createSearchableSelect, disposeSearchableSelectContainer, ssInstances } from '../components/searchable-select.js';
import {
  filterRacquetsForHud,
  readCompFrameHudFiltersFromDom,
  type CompFrameHudFilters,
} from './comp-hud-filters-vm.js';
import { activateLoadout, switchMode } from './shell.js';
import { getState as compareGetState, setSlotLoadout as compareSetSlotLoadout } from './compare/hooks/useCompareState.js';
import { getCompBaseObs, setCompBaseObs } from './comp-base-obs.js';
import { buildCompBaseProfileVm } from './comp-base-profile-vm.js';
import { buildCompRacketHeroVm } from './comp-racket-hero-vm.js';
import { buildCompBuildCardsVm, buildCompSortTabsVm, type SortKeyVm } from './comp-top-builds-vm.js';

// ---------------------------------------------------------------------------
// Tab-activation callbacks — avoids circular import with strings.ts.
// Shell.ts registers these during init().
// ---------------------------------------------------------------------------
type CompendiumTabCallbacks = {
  onStringsTabActivate?: () => void;
};

let _compTabCbs: CompendiumTabCallbacks = {};

export function registerCompendiumTabCallbacks(cbs: CompendiumTabCallbacks): void {
  _compTabCbs = { ..._compTabCbs, ...cbs };
}

const RACQUET_DATA = (RACQUETS as unknown) as Racquet[];

type SortKey = 'score' | 'spin' | 'control' | 'power' | 'comfort' | 'durability';
type CompMode = 'fullbed' | 'hybrid';

interface HeroPills {
  bestFor: string[];
  watchOut: string[];
}

interface CompInjectState {
  racquet: Racquet | null;
  mainsId: string;
  crossesId: string;
  mode: CompMode;
  baseStats: SetupStats | null;
}

type BuildWithArchetype = Build & { archetype?: string };

let _compSelectedRacquetId: string | null = null;
let _compSortKey: SortKey = 'score';
let _compCurrentBuilds: BuildWithArchetype[] = [];
const _compendiumBuildCache: Record<string, BuildWithArchetype[]> = {};
let _compPreviewFrame: number | null = null;
let _compRosterTimer: number | null = null;
let _compSelectorHydrationFrame: number | null = null;
let _compLastRosterKey = '';
let _compLastPreviewStats: SetupStats | null = null;

let _compHudFilters: CompFrameHudFilters = {
  search: '',
  brand: '',
  pattern: '',
  stiffness: '',
  headsize: '',
  weight: '',
};

type CompendiumReactMount = { root: Root | null; host: HTMLElement | null };

type SearchableSelectHandle = (typeof ssInstances)[string];

const _compPerfEnabled =
  typeof location !== 'undefined' &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

function _measureCompPerf<T>(name: string, run: () => T): T {
  const start = performance.now();
  const result = run();
  if (_compPerfEnabled) {
    console.log(`[Perf][Compendium] ${name}: ${(performance.now() - start).toFixed(1)}ms`);
  }
  return result;
}

function _logCompPerf(name: string, start: number): void {
  if (_compPerfEnabled) {
    console.log(`[Perf][Compendium] ${name}: ${(performance.now() - start).toFixed(1)}ms`);
  }
}

function _ensureCompendiumReactRoot(mount: CompendiumReactMount, container: HTMLElement | null): Root | null {
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

function _unmountCompendiumReactMount(mount: CompendiumReactMount): void {
  if (mount.root) {
    mount.root.unmount();
    mount.root = null;
    mount.host = null;
  }
}

const _compHeroMount: CompendiumReactMount = { root: null, host: null };
const _compStringModulatorMount: CompendiumReactMount = { root: null, host: null };
const _compBaseProfileMount: CompendiumReactMount = { root: null, host: null };
const _compTopBuildsMount: CompendiumReactMount = { root: null, host: null };
const _compRosterMount: CompendiumReactMount = { root: null, host: null };

/** Unmount Compendium React roots when leaving the workspace (lazy route remount safety). */
export function cleanupCompendiumPage(): void {
  if (_compPreviewFrame != null) {
    cancelAnimationFrame(_compPreviewFrame);
    _compPreviewFrame = null;
  }
  if (_compSelectorHydrationFrame != null) {
    cancelAnimationFrame(_compSelectorHydrationFrame);
    _compSelectorHydrationFrame = null;
  }
  if (_compRosterTimer != null) {
    window.clearTimeout(_compRosterTimer);
    _compRosterTimer = null;
  }
  _unmountCompendiumReactMount(_compHeroMount);
  _unmountCompendiumReactMount(_compStringModulatorMount);
  _unmountCompendiumReactMount(_compBaseProfileMount);
  _unmountCompendiumReactMount(_compTopBuildsMount);
  _unmountCompendiumReactMount(_compRosterMount);
  disposeSearchableSelectContainer(ssInstances['comp-mains-select']?._container || null);
  disposeSearchableSelectContainer(ssInstances['comp-crosses-select']?._container || null);
  delete ssInstances['comp-mains-select'];
  delete ssInstances['comp-crosses-select'];
  _compLastRosterKey = '';
}

let _compInjectState: CompInjectState = {
  racquet: null,
  mainsId: '',
  crossesId: '',
  mode: 'fullbed',
  baseStats: null,
};

function _extractBrand(name: string): string {
  const brandMap: Record<string, string> = {
    Babolat: 'Babolat',
    Head: 'Head',
    Wilson: 'Wilson',
    Yonex: 'Yonex',
    Tecnifibre: 'Tecnifibre',
    Prince: 'Prince',
    Dunlop: 'Dunlop',
    Volkl: 'Volkl',
  };
  for (const [key, brand] of Object.entries(brandMap)) {
    if (name.startsWith(key)) return brand;
  }
  return name.split(' ')[0] || name;
}

export function _compSwitchTab(tab: string): void {
  document.querySelectorAll<HTMLElement>('.comp-tab-btn').forEach((btn) => {
    if (btn.dataset.compTab === tab) {
      btn.classList.add('bg-dc-active-bg', 'text-dc-active-text', 'font-bold');
      btn.classList.remove('bg-transparent', 'text-dc-storm', 'hover:bg-dc-border/50', 'hover:text-dc-platinum');
    } else {
      btn.classList.remove('bg-dc-active-bg', 'text-dc-active-text', 'font-bold');
      btn.classList.add('bg-transparent', 'text-dc-storm', 'hover:bg-dc-border/50', 'hover:text-dc-platinum');
    }
  });

  document.querySelectorAll<HTMLElement>('.comp-tab-panel').forEach((panel) => {
    panel.classList.add('hidden');
  });

  const activePanel = document.getElementById('comp-tab-' + tab);
  if (activePanel) activePanel.classList.remove('hidden');

  if (tab === 'strings') {
    _compTabCbs.onStringsTabActivate?.();
  }

  if (tab === 'leaderboard') {
    const leaderboardPanel = document.getElementById('comp-tab-leaderboard');
    if (!leaderboardPanel?.querySelector('#lb2-results')) {
      import('./leaderboard.js').then((mod) => {
        if (typeof mod.initLeaderboard === 'function') {
          mod.initLeaderboard();
        }
      });
    }
  }
}

export function _compToggleHud(): void {
  const hud = document.getElementById('comp-hud');
  if (!hud) return;
  hud.classList.toggle('active');
  if (hud.classList.contains('active')) {
    (document.getElementById('comp-search') as HTMLInputElement | null)?.focus();
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function _compGenerateHeroPills(frameStats: SetupStats, racquet: Racquet): HeroPills {
  const bestFor: string[] = [];
  const watchOut: string[] = [];

  if (frameStats.spin >= 65) bestFor.push('TOPSPIN BASELINERS');
  if (frameStats.power >= 65) bestFor.push('FREE POWER SEEKERS');
  if (frameStats.control >= 65) bestFor.push('FLAT HIT PRECISION');
  if (frameStats.comfort >= 65) bestFor.push('ARM-FRIENDLY SESSIONS');
  if (frameStats.maneuverability >= 65) bestFor.push('FAST SWING STYLES');
  if (frameStats.stability >= 65) bestFor.push('HEAVY HITTERS');
  if (frameStats.feel >= 65) bestFor.push('TOUCH PLAYERS');

  if (frameStats.control < 55) watchOut.push('LOWER CONTROL CEILING');
  if (frameStats.comfort < 55) watchOut.push('HARSH ON ARM');
  if (frameStats.power < 55) watchOut.push('LESS FREE POWER');
  if (frameStats.stability < 55) watchOut.push('TWIST OFF-CENTER');
  if (frameStats.maneuverability < 55) watchOut.push('DEMANDS FAST PREP');
  if (racquet.strungWeight > 325) watchOut.push('HEAVY TECHNIQUE REQ');
  if (racquet.strungWeight < 290) watchOut.push('LIGHT PLOW-THROUGH');

  return { bestFor, watchOut };
}

function _compGenerateBuildReason(build: BuildWithArchetype, frameStats: SetupStats): string {
  return generateBuildReason(build, frameStats);
}

function _bindCompendiumControl(
  elementId: string,
  eventName: 'input' | 'change',
  handler: EventListener
): void {
  const element = document.getElementById(elementId) as HTMLElement | null;
  if (!element || element.dataset.compBound === 'true') return;
  element.addEventListener(eventName, handler);
  element.dataset.compBound = 'true';
}

function _ensureCompMainShell(): {
  hero: HTMLElement;
  modulator: HTMLElement;
  baseProfile: HTMLElement;
  topBuilds: HTMLElement;
} | null {
  const main = document.getElementById('comp-main');
  if (!main) return null;

  let hero = document.getElementById('comp-react-hero-root') as HTMLElement | null;
  let modulator = document.getElementById('comp-react-string-modulator-root') as HTMLElement | null;
  let baseProfile = document.getElementById('comp-react-base-profile-root') as HTMLElement | null;
  let topBuilds = document.getElementById('comp-react-top-builds-root') as HTMLElement | null;

  if (!hero || !modulator || !baseProfile || !topBuilds) {
    main.replaceChildren();
    hero = document.createElement('div');
    hero.id = 'comp-react-hero-root';
    modulator = document.createElement('div');
    modulator.id = 'comp-react-string-modulator-root';
    baseProfile = document.createElement('div');
    baseProfile.id = 'comp-react-base-profile-root';
    topBuilds = document.createElement('div');
    topBuilds.id = 'comp-react-top-builds-root';
    main.append(hero, modulator, baseProfile, topBuilds);
  }

  return { hero, modulator, baseProfile, topBuilds };
}

function _updateSelectHandle(
  key: 'comp-mains-select' | 'comp-crosses-select',
  container: HTMLElement | null,
  config: Parameters<typeof createSearchableSelect>[1],
): SearchableSelectHandle | null {
  if (!container) return null;

  const existing = ssInstances[key];
  if (existing && existing._container === container && existing._container.isConnected) {
    existing.updateConfig(config);
    return existing;
  }

  if (existing) {
    disposeSearchableSelectContainer(existing._container);
    delete ssInstances[key];
  }

  const instance = createSearchableSelect(container, config);
  ssInstances[key] = instance;
  return instance;
}

export function initCompendium(): void {
  _measureCompPerf('initCompendium', () => {
    const brandSel = document.getElementById('comp-filter-brand') as HTMLSelectElement | null;
    if (!brandSel) return;

    if (!brandSel.dataset.populated) {
      const brands = [...new Set(RACQUET_DATA.map((r) => _extractBrand(r.name)))].sort();
      brands.forEach((brand) => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandSel.appendChild(option);
      });
      brandSel.dataset.populated = 'true';
    }

    _bindCompendiumControl('comp-search', 'input', _compScheduleRosterRender);
    _bindCompendiumControl('comp-filter-brand', 'change', _compRenderRoster);
    _bindCompendiumControl('comp-filter-pattern', 'change', _compRenderRoster);
    _bindCompendiumControl('comp-filter-stiffness', 'change', _compRenderRoster);
    _bindCompendiumControl('comp-filter-headsize', 'change', _compRenderRoster);
    _bindCompendiumControl('comp-filter-weight', 'change', _compRenderRoster);

    _measureCompPerf('first roster render', () => _compRenderRoster());

    const setup = getCurrentSetup();
    if (setup?.racquet) {
      _compSelectFrame(setup.racquet.id);
    } else if (RACQUET_DATA.length > 0) {
      _compSelectFrame(RACQUET_DATA[0].id);
    }

    _bindCompendiumDelegates();
  });
}

let _compDelegateBound = false;

function _bindCompendiumDelegates(): void {
  if (_compDelegateBound) return;
  _compDelegateBound = true;

  document.addEventListener('click', (e: Event) => {
    const shell = document.getElementById('mode-compendium');
    if (shell && !shell.contains(e.target as Node)) return;
    const el = (e.target as Element).closest('[data-comp-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.compAction!;

    switch (action) {
      case 'selectFrame': {
        const id = el.dataset.id ?? (el.closest('[data-id]') as HTMLElement | null)?.dataset.id;
        if (id) _compSelectFrame(id);
        break;
      }
      case 'setSort': {
        const key = el.dataset.key;
        if (key) _compSetSort(key as SortKey);
        break;
      }
      case 'toggleHud':
        _compToggleHud();
        break;
      case 'setInjectMode': {
        const mode = el.dataset.mode;
        if (mode) _compSetInjectMode(mode as CompMode);
        break;
      }
      case 'applyInjection':
        _compApplyInjection();
        break;
      case 'clearInjection':
        _compClearInjection();
        break;
      case 'buildAction': {
        const actionName = el.dataset.actionName ?? '';
        const index = parseInt(el.dataset.index ?? '0', 10);
        _compAction(actionName, index, e);
        break;
      }
    }
  });
}

function _compScheduleRosterRender(): void {
  if (_compRosterTimer != null) {
    window.clearTimeout(_compRosterTimer);
  }
  _compRosterTimer = window.setTimeout(() => {
    _compRosterTimer = null;
    _compRenderRoster();
  }, 80);
}

function _compSchedulePreviewStats(): void {
  if (_compPreviewFrame != null) return;
  _compPreviewFrame = window.requestAnimationFrame(() => {
    _compPreviewFrame = null;
    _compPreviewStats();
  });
}

function _compRenderBaseProfileReact(): void {
  const base = _compInjectState.baseStats;
  if (!base) return;
  const root = _ensureCompendiumReactRoot(_compBaseProfileMount, document.getElementById('comp-react-base-profile-root'));
  root?.render(
    createElement(CompendiumBaseProfile, {
      groups: buildCompBaseProfileVm(base, _compLastPreviewStats),
    }),
  );
}

export function _compGetFilteredRacquets(): Racquet[] {
  return filterRacquetsForHud(RACQUET_DATA, _compHudFilters);
}

export function _compRenderRoster(): void {
  _compHudFilters = readCompFrameHudFiltersFromDom();
  const list = document.getElementById('comp-frame-list');
  if (!list) return;
  const racquets = _compGetFilteredRacquets();
  const rosterKey = racquets.map((r) => `${r.id}:${r.id === _compSelectedRacquetId ? 1 : 0}`).join('|');
  if (rosterKey === _compLastRosterKey && list.children.length > 0) return;
  _compLastRosterKey = rosterKey;

  const root = _ensureCompendiumReactRoot(_compRosterMount, list);
  root?.render(
    createElement(CompendiumFrameRoster, {
      racquets,
      selectedRacquetId: _compSelectedRacquetId,
    }),
  );
}

export function _compSelectFrame(racquetId: string): void {
  const hud = document.getElementById('comp-hud');
  if (hud) {
    hud.classList.remove('active');
    document.body.style.overflow = '';
  }

  _compSelectedRacquetId = racquetId;
  const racquet = RACQUET_DATA.find((r) => r.id === racquetId);
  if (!racquet) return;

  document.querySelectorAll<HTMLElement>('#comp-frame-list > button').forEach((el) => {
    const isActive = el.dataset.id === racquetId;
    el.classList.remove('border-dc-accent', 'border-dc-platinum-dim');
    el.classList.add(isActive ? 'border-dc-accent' : 'border-dc-platinum-dim');
  });

  const main = document.getElementById('comp-main');
  if (main) {
    _compRenderMain(racquet);
  }
}

export function _compSyncWithActiveLoadout(): void {
  const setup = getCurrentSetup();
  if (!setup?.racquet) return;
  const activeRacquetId = setup.racquet.id;
  _compRenderRoster();
  if (_compSelectedRacquetId === activeRacquetId) {
    _compRenderMain(setup.racquet);
  } else {
    _compSelectFrame(activeRacquetId);
  }
}

export function _compRenderMain(racquet: Racquet): void {
  _measureCompPerf('main render', () => {
    const shell = _ensureCompMainShell();
    if (!shell) return;

    const frameBase = calcFrameBase(racquet);
    if (!_compendiumBuildCache[racquet.id]) {
      _compendiumBuildCache[racquet.id] = _compGenerateTopBuilds(racquet, 6);
    }
    const builds = _compendiumBuildCache[racquet.id];
    const sorted = [...builds].sort((a, b) => {
      if (_compSortKey === 'score') return b.score - a.score;
      return (b.stats[_compSortKey] || 0) - (a.stats[_compSortKey] || 0);
    });
    _compCurrentBuilds = sorted;

    const pills = _compGenerateHeroPills(frameBase, racquet);
    const heroVm = buildCompRacketHeroVm(racquet, frameBase, pills);
    setCompBaseObs(heroVm.baseObs);

    _compLastPreviewStats = null;
    const baseProfileGroups = buildCompBaseProfileVm(frameBase, null);
    const sortTabsVm = buildCompSortTabsVm(_compSortKey as SortKeyVm);
    const cardsVm = buildCompBuildCardsVm(sorted, frameBase, _compGenerateBuildReason);

    const heroRoot = _ensureCompendiumReactRoot(_compHeroMount, shell.hero);
    const stringModRoot = _ensureCompendiumReactRoot(_compStringModulatorMount, shell.modulator);
    const baseRoot = _ensureCompendiumReactRoot(_compBaseProfileMount, shell.baseProfile);
    const buildsRoot = _ensureCompendiumReactRoot(_compTopBuildsMount, shell.topBuilds);

    heroRoot?.render(createElement(CompendiumRacketHero, { vm: heroVm }));
    stringModRoot?.render(createElement(CompendiumStringModulator));
    baseRoot?.render(createElement(CompendiumBaseProfile, { groups: baseProfileGroups }));
    buildsRoot?.render(createElement(CompendiumTopBuilds, { sortTabs: sortTabsVm, cards: cardsVm }));

    if (_compSelectorHydrationFrame != null) {
      cancelAnimationFrame(_compSelectorHydrationFrame);
    }
    const selectorHydrationStart = performance.now();
    _compSelectorHydrationFrame = requestAnimationFrame(() => {
      _compSelectorHydrationFrame = null;
      _compInitStringInjector(racquet);
      _logCompPerf('selector hydration', selectorHydrationStart);
    });
  });
}

export function _compUpdateInjectModeUI(mode: CompMode): void {
  document.querySelectorAll<HTMLElement>('.comp-inject-mode-btn').forEach((btn) => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.remove('text-dc-accent', 'border-dc-accent', 'text-dc-storm', 'border-transparent');
    if (isActive) {
      btn.classList.add('text-dc-accent', 'border-dc-accent');
    } else {
      btn.classList.add('text-dc-storm', 'border-transparent');
    }
  });

  const crossesSelect = document.getElementById('comp-crosses-select');
  const mainsLabel = document.getElementById('comp-mains-label');
  const crossesLabel = document.getElementById('comp-crosses-label');

  if (mode === 'hybrid') {
    if (crossesSelect) crossesSelect.style.display = 'block';
    if (mainsLabel) mainsLabel.textContent = '// MAINS';
    if (crossesLabel) crossesLabel.textContent = '// CROSSES';
  } else {
    if (crossesSelect) crossesSelect.style.display = 'none';
    if (mainsLabel) mainsLabel.textContent = '// STRING';
    if (crossesLabel) crossesLabel.textContent = '// CROSSES';
  }
}

export function _compSetInjectMode(mode: CompMode): void {
  _compInjectState.mode = mode;
  _compUpdateInjectModeUI(mode);

  if (mode === 'hybrid') {
    if (!_compInjectState.crossesId && _compInjectState.mainsId) {
      _compInjectState.crossesId = _compInjectState.mainsId;
      ssInstances['comp-crosses-select']?.setValue(_compInjectState.mainsId);
      _compPopulateGaugeDropdown('comp-crosses-gauge', _compInjectState.mainsId);
    }
  } else if (_compInjectState.mainsId) {
    _compInjectState.crossesId = _compInjectState.mainsId;
    ssInstances['comp-crosses-select']?.setValue(_compInjectState.mainsId);
    _compPopulateGaugeDropdown('comp-crosses-gauge', _compInjectState.mainsId);
  }

  _compPreviewStats();
}

export function _compInitStringInjector(racquet: Racquet): void {
  _compInjectState.racquet = racquet;
  _compInjectState.baseStats = calcFrameBase(racquet);

  const mainsContainer = document.getElementById('comp-mains-select');
  const crossesContainer = document.getElementById('comp-crosses-select');
  if (!mainsContainer) return;

  const setup = getCurrentSetup();
  const isViewingActiveRacket = setup?.racquet?.id === racquet.id;

  let isHybrid = false;
  let mainsId = '';
  let crossesId = '';
  let mainsTension: number | undefined;
  let crossesTension: number | undefined;

  if (isViewingActiveRacket && setup?.stringConfig) {
    isHybrid = setup.stringConfig.isHybrid || false;
    if (setup.stringConfig.isHybrid) {
      mainsId = setup.stringConfig.mains?.id || '';
      crossesId = setup.stringConfig.crosses?.id || '';
    } else {
      mainsId = setup.stringConfig.string?.id || '';
      crossesId = setup.stringConfig.string?.id || '';
    }
    mainsTension = setup.stringConfig.mainsTension;
    crossesTension = setup.stringConfig.crossesTension;
  }

  const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
  if (!mainsTension) mainsTension = midTension;
  if (!crossesTension) crossesTension = midTension - 2;

  _compInjectState.mode = isHybrid ? 'hybrid' : 'fullbed';
  _compInjectState.mainsId = mainsId || '';
  _compInjectState.crossesId = crossesId || mainsId || '';
  const effectiveCrossesId = crossesId || mainsId || '';
  _compInjectState.crossesId = effectiveCrossesId;

  const mainsTensionEl = document.getElementById('comp-mains-tension') as HTMLInputElement | null;
  const crossesTensionEl = document.getElementById('comp-crosses-tension') as HTMLInputElement | null;
  if (mainsTensionEl) mainsTensionEl.value = String(mainsTension);
  if (crossesTensionEl) crossesTensionEl.value = String(crossesTension);

  _updateSelectHandle('comp-mains-select', mainsContainer, {
    type: 'string',
    placeholder: 'Select String...',
    value: mainsId || '',
    onChange: (val: string) => {
      _compInjectState.mainsId = val;
      _compPopulateGaugeDropdown('comp-mains-gauge', val);
      if (_compInjectState.mode === 'fullbed' && val) {
        _compInjectState.crossesId = val;
        _compPopulateGaugeDropdown('comp-crosses-gauge', val);
      }
      _compSchedulePreviewStats();
    },
  });

  if (crossesContainer) {
    _updateSelectHandle('comp-crosses-select', crossesContainer, {
      type: 'string',
      placeholder: 'Select Cross String...',
      value: effectiveCrossesId,
      id: 'comp-crosses-select-trigger',
      onChange: (val: string) => {
        _compInjectState.crossesId = val;
        _compPopulateGaugeDropdown('comp-crosses-gauge', val);
        _compSchedulePreviewStats();
      },
    });
  }

  ['comp-mains-tension', 'comp-crosses-tension', 'comp-mains-gauge', 'comp-crosses-gauge'].forEach((id) => {
    const el = document.getElementById(id) as HTMLElement | null;
    if (el && !el.dataset.compPreviewBound) {
      el.addEventListener('change', _compSchedulePreviewStats);
      el.addEventListener('input', _compSchedulePreviewStats);
      el.dataset.compPreviewBound = 'true';
    }
  });

  _compUpdateInjectModeUI(isHybrid ? 'hybrid' : 'fullbed');

  if (mainsId) {
    _compPopulateGaugeDropdown('comp-mains-gauge', mainsId);
    if (isHybrid && effectiveCrossesId) {
      _compPopulateGaugeDropdown('comp-crosses-gauge', effectiveCrossesId);
    } else {
      _compPopulateGaugeDropdown('comp-crosses-gauge', mainsId);
    }
    _compSchedulePreviewStats();
  } else {
    _compClearPreview();
  }
}

export function _compPopulateGaugeDropdown(selectId: string, stringId: string): void {
  const select = document.getElementById(selectId) as HTMLSelectElement | null;
  if (!select || !stringId) return;
  const string = STRINGS.find((s) => s.id === stringId);
  if (!string) return;
  const gauges = getGaugeOptions(string);
  select.innerHTML =
    '<option value="">Gauge...</option>' +
    gauges
      .map((g) => `<option value="${g}" ${Math.abs(g - string.gaugeNum) < 0.01 ? 'selected' : ''}>${GAUGE_LABELS[g] || g + 'mm'}</option>`)
      .join('');
}

export function _compPreviewStats(): void {
  const { racquet, mainsId, crossesId, mode, baseStats } = _compInjectState;
  if (!racquet || !mainsId || !baseStats) return _compClearPreview();

  const mainsString = STRINGS.find((s) => s.id === mainsId);
  if (!mainsString) return _compClearPreview();

  let crossesString = mainsString;
  if (mode === 'hybrid' && crossesId) {
    crossesString = STRINGS.find((s) => s.id === crossesId) || mainsString;
  }

  const mainsGauge = (document.getElementById('comp-mains-gauge') as HTMLSelectElement | null)?.value || '';
  const crossesGauge = (document.getElementById('comp-crosses-gauge') as HTMLSelectElement | null)?.value || '';
  const mainsWithGauge = mainsGauge ? applyGaugeModifier(mainsString, parseFloat(mainsGauge)) : mainsString;
  const crossesWithGauge = crossesGauge ? applyGaugeModifier(crossesString, parseFloat(crossesGauge)) : crossesString;
  const mainsTension = parseInt((document.getElementById('comp-mains-tension') as HTMLInputElement | null)?.value || '52', 10) || 52;
  const crossesTension = parseInt((document.getElementById('comp-crosses-tension') as HTMLInputElement | null)?.value || '50', 10) || 50;

  const cfg = mode === 'hybrid'
    ? { isHybrid: true as const, mains: mainsWithGauge, crosses: crossesWithGauge, mainsTension, crossesTension }
    : { isHybrid: false as const, string: mainsWithGauge, mainsTension, crossesTension };

  const previewStats = predictSetup(racquet, cfg);
  if (!previewStats) return;

  _compRenderPreviewBars(baseStats, previewStats);

  const tCtx = buildTensionContext(cfg, racquet);
  const obs = computeCompositeScore(previewStats, tCtx);
  const baseObs =
    getCompBaseObs() ||
    Math.round(
      baseStats.spin * 0.15 +
        baseStats.power * 0.12 +
        baseStats.control * 0.18 +
        baseStats.comfort * 0.12 +
        baseStats.feel * 0.1 +
        baseStats.stability * 0.12 +
        baseStats.forgiveness * 0.08 +
        baseStats.maneuverability * 0.08
    );
  const delta = Math.round((obs - baseObs) * 10) / 10;

  const main = document.getElementById('comp-main');
  let deltaEl = document.getElementById('comp-string-delta');
  let deltaValEl = document.getElementById('comp-string-delta-value');
  if (!deltaEl && main) {
    deltaEl = main.querySelector('#comp-string-delta');
    deltaValEl = main.querySelector('#comp-string-delta-value');
  }
  if (deltaEl && deltaValEl && delta > 0) {
    deltaValEl.textContent = String(delta);
    deltaEl.classList.remove('opacity-0');
  } else if (deltaEl) {
    deltaEl.classList.add('opacity-0');
  }

  const applyBtn = document.getElementById('comp-inject-apply') as HTMLButtonElement | null;
  if (applyBtn) applyBtn.disabled = false;
}

export function _compRenderPreviewBars(_baseStats: SetupStats, previewStats: SetupStats): void {
  _compLastPreviewStats = previewStats;
  _compRenderBaseProfileReact();
}

export function _compClearPreview(): void {
  const { baseStats } = _compInjectState;
  if (!baseStats) return;
  _compLastPreviewStats = null;
  _compRenderBaseProfileReact();

  const applyBtn = document.getElementById('comp-inject-apply') as HTMLButtonElement | null;
  if (applyBtn) applyBtn.disabled = true;
  const deltaEl = document.getElementById('comp-string-delta');
  if (deltaEl) deltaEl.classList.add('opacity-0');
}

export function _compApplyInjection(): void {
  const { racquet, mainsId, crossesId, mode } = _compInjectState;
  if (!racquet || !mainsId) return;

  const mainsGauge = (document.getElementById('comp-mains-gauge') as HTMLSelectElement | null)?.value || '';
  const crossesGauge = (document.getElementById('comp-crosses-gauge') as HTMLSelectElement | null)?.value || '';
  const mainsTension = parseInt((document.getElementById('comp-mains-tension') as HTMLInputElement | null)?.value || '0', 10);
  const crossesTension = parseInt((document.getElementById('comp-crosses-tension') as HTMLInputElement | null)?.value || '0', 10);
  const isHybrid = mode === 'hybrid';
  const effectiveCrossesId = isHybrid && crossesId ? crossesId : mainsId;

  const lo = createLoadout(racquet.id, mainsId, mainsTension, {
    isHybrid,
    mainsId,
    crossesId: effectiveCrossesId,
    crossesTension,
    mainsGauge: mainsGauge || undefined,
    crossesGauge: crossesGauge || undefined,
    source: 'bible',
  });

  if (lo) {
    activateLoadout(lo);
    switchMode('overview');
  }
}

export function _compClearInjection(): void {
  _compInjectState.mainsId = '';
  _compInjectState.crossesId = '';

  const mainsContainer = document.getElementById('comp-mains-select');
  const crossesContainer = document.getElementById('comp-crosses-select');

  const mainsGauge = document.getElementById('comp-mains-gauge');
  const crossesGauge = document.getElementById('comp-crosses-gauge');
  if (mainsGauge) mainsGauge.innerHTML = '<option value="">Gauge...</option>';
  if (crossesGauge) crossesGauge.innerHTML = '<option value="">Gauge...</option>';

  const { racquet } = _compInjectState;
  if (racquet) {
    const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
    const mainsTensionEl = document.getElementById('comp-mains-tension') as HTMLInputElement | null;
    const crossesTensionEl = document.getElementById('comp-crosses-tension') as HTMLInputElement | null;
    if (mainsTensionEl) mainsTensionEl.value = String(midTension);
    if (crossesTensionEl) crossesTensionEl.value = String(midTension - 2);

    _updateSelectHandle('comp-mains-select', mainsContainer as HTMLElement, {
      type: 'string',
      placeholder: 'Select String...',
      value: '',
      onChange: (val: string) => {
        _compInjectState.mainsId = val;
        _compPopulateGaugeDropdown('comp-mains-gauge', val);
        if (_compInjectState.mode === 'fullbed' && val) {
          _compInjectState.crossesId = val;
          _compPopulateGaugeDropdown('comp-crosses-gauge', val);
        }
        _compSchedulePreviewStats();
      },
    });

    if (crossesContainer) {
      _updateSelectHandle('comp-crosses-select', crossesContainer, {
        type: 'string',
        placeholder: 'Select Cross String...',
        value: '',
        id: 'comp-crosses-select-trigger',
        onChange: (val: string) => {
          _compInjectState.crossesId = val;
          _compPopulateGaugeDropdown('comp-crosses-gauge', val);
          _compSchedulePreviewStats();
        },
      });
    }
  }

  _compClearPreview();
}

export function _compGenerateTopBuilds(racquet: Racquet, count: number): BuildWithArchetype[] {
  return generateTopBuilds(racquet, count) as BuildWithArchetype[];
}

export function _compPickDiverseBuilds(builds: BuildWithArchetype[], count: number): BuildWithArchetype[] {
  return pickDiverseBuilds(builds, count) as BuildWithArchetype[];
}

export function _compSetSort(key: SortKey): void {
  _compSortKey = key;
  const racquet = RACQUET_DATA.find((r) => r.id === _compSelectedRacquetId);
  if (racquet) _compRenderMain(racquet);
}

export function _compCreateLoadoutFromBuild(build: BuildWithArchetype): Loadout | null {
  const racquetId = _compSelectedRacquetId;
  if (!racquetId) return null;
  const isHybrid = build.type === 'hybrid';
  const opts: Record<string, unknown> = {
    source: 'compendium',
    isHybrid,
    crossesTension: build.crossesTension || build.tension,
  };
  if (isHybrid) {
    opts.mainsId = build.mainsId;
    opts.crossesId = build.crossesId;
  }
  const stringId = isHybrid ? build.mainsId : build.string.id;
  if (!stringId) return null;
  return createLoadout(racquetId, stringId, build.tension, opts as any);
}

export function _compAction(action: string, buildIndex: number, evt?: Event): void {
  const build = _compCurrentBuilds[buildIndex];
  if (!build) return;

  if (action === 'save') {
    const lo = _compCreateLoadoutFromBuild(build);
    if (lo) {
      saveLoadout(lo);
      const btn = evt?.target as HTMLButtonElement | null;
      if (btn) {
        btn.textContent = 'Saved \u2713';
        btn.disabled = true;
        window.setTimeout(() => {
          btn.textContent = 'Save';
          btn.disabled = false;
        }, 1500);
      }
    }
  } else if (action === 'tune') {
    const lo = _compCreateLoadoutFromBuild(build);
    if (lo) {
      saveLoadout(lo);
      activateLoadout(lo);
      switchMode('tune');
    }
  } else if (action === 'setActive') {
    const lo = _compCreateLoadoutFromBuild(build);
    if (lo) {
      activateLoadout(lo);
      switchMode('overview');
    }
  } else if (action === 'compare') {
    _compAddBuildToCompare(build);
  }
}

export function _compAddBuildToCompare(build: BuildWithArchetype): void {
  const compareLoadout = _compCreateLoadoutFromBuild(build);
  const compareState = compareGetState();
  if (compareLoadout?.stats && compareState?.slots) {
    const emptySlot = compareState.slots.find((slot) => slot.loadout === null);
    const targetSlot = emptySlot || compareState.slots[compareState.slots.length - 1];
    const targetSlotId = targetSlot?.id;
    if (targetSlotId) {
      compareSetSlotLoadout(targetSlotId as import('./compare/types.js').SlotId, compareLoadout, compareLoadout.stats);
      switchMode('compare');
    }
  }
}

export function _compActionCompare(racquetId: string, stringId: string, tension: number): void {
  const compareLoadout = createLoadout(racquetId, stringId, tension, { source: 'compare' });
  const compareState = compareGetState();
  if (compareLoadout?.stats && compareState?.slots) {
    const emptySlot = compareState.slots.find((slot) => slot.loadout === null);
    const targetSlot = emptySlot || compareState.slots[compareState.slots.length - 1];
    const targetSlotId = targetSlot?.id;
    if (targetSlotId) {
      compareSetSlotLoadout(targetSlotId as import('./compare/types.js').SlotId, compareLoadout, compareLoadout.stats);
      switchMode('compare');
    }
  }
}
