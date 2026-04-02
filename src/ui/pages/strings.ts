import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RACQUETS, STRINGS } from '../../data/loader.js';
import {
  GAUGE_LABELS,
  applyGaugeModifier,
  buildTensionContext,
  calcFrameBase,
  computeCompositeScore,
  getGaugeOptions,
  predictSetup,
} from '../../engine/index.js';
import type { Racquet, SetupStats, StringConfig, StringData } from '../../engine/types.js';
import { createLoadout, saveLoadout } from '../../state/loadout.js';
import { syncStringCompendiumWithActiveLoadout } from '../../state/setup-sync.js';
import { createSearchableSelect, disposeSearchableSelectContainer, ssInstances } from '../components/searchable-select.js';
import { activateLoadout, switchMode } from './shell.js';
import { StringCompendiumDetail } from '../../components/strings/StringCompendiumDetail.js';
import { StringFrameInjectionModulator } from '../../components/strings/StringFrameInjectionModulator.js';
import { StringCompendiumRoster } from '../../components/strings/StringCompendiumRoster.js';
import { getCompBaseObs, setCompBaseObs } from './comp-base-obs.js';
import { buildStringCompendiumDetailVm } from './string-compendium-detail-vm.js';
import {
  filterStringsForHud,
  readStringHudFiltersFromDom,
  type StringHudFilters,
} from './string-hud-filters-vm.js';

const RACQUET_DATA = RACQUETS as unknown as Racquet[];
const STRING_DATA = STRINGS as unknown as StringData[];
const PREVIEW_STAT_KEYS = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability'] as const;

type StringMode = 'fullbed' | 'hybrid';

interface SimilarFrameResult {
  racquet: Racquet;
  stats: SetupStats;
  obs: number;
}

interface StringPills {
  bestFor: string[];
  watchOut: string[];
}

interface StringModState {
  stringId: string | null;
  frameId: string | null;
  mode: StringMode;
  gauge: string;
  crossesGauge: string;
  crossesId: string | null;
  mainsTension: number;
  crossesTension: number;
  baseStats: SetupStats | null;
  previewStats: SetupStats | null;
}

let _stringSelectedId: string | null = null;
let _stringsInitialized = false;
let _stringFiltersBound = false;
let _stringPreviewFrame: number | null = null;
let _stringRosterTimer: number | null = null;
let _stringModulatorHydrationFrame: number | null = null;
let _stringLastRosterKey = '';

let _stringHudFilters: StringHudFilters = {
  search: '',
  material: '',
  shape: '',
  stiffness: '',
};

type StringReactMount = { root: Root | null; host: HTMLElement | null };
type SearchableSelectHandle = (typeof ssInstances)[string];

function _ensureStringReactRoot(mount: StringReactMount, container: HTMLElement | null): Root | null {
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

function _unmountStringReactMount(mount: StringReactMount): void {
  if (mount.root) {
    mount.root.unmount();
    mount.root = null;
    mount.host = null;
  }
}

const _stringRosterMount: StringReactMount = { root: null, host: null };
const _stringDetailMount: StringReactMount = { root: null, host: null };
const _stringFrameModulatorMount: StringReactMount = { root: null, host: null };

export function cleanupStringsPage(): void {
  if (_stringPreviewFrame != null) {
    cancelAnimationFrame(_stringPreviewFrame);
    _stringPreviewFrame = null;
  }
  if (_stringModulatorHydrationFrame != null) {
    cancelAnimationFrame(_stringModulatorHydrationFrame);
    _stringModulatorHydrationFrame = null;
  }
  if (_stringRosterTimer != null) {
    window.clearTimeout(_stringRosterTimer);
    _stringRosterTimer = null;
  }
  _unmountStringReactMount(_stringRosterMount);
  _unmountStringReactMount(_stringDetailMount);
  _unmountStringReactMount(_stringFrameModulatorMount);
  disposeSearchableSelectContainer(ssInstances['string-mod-frame']?._container || null);
  disposeSearchableSelectContainer(ssInstances['string-mod-crosses-string']?._container || null);
  delete ssInstances['string-mod-frame'];
  delete ssInstances['string-mod-crosses-string'];
  _stringLastRosterKey = '';
}

let _stringModState: StringModState = {
  stringId: null,
  frameId: null,
  mode: 'fullbed',
  gauge: '',
  crossesGauge: '',
  crossesId: null,
  mainsTension: 52,
  crossesTension: 50,
  baseStats: null,
  previewStats: null,
};

function getInputValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value || '';
}

function _ensureStringMainShell(): {
  detail: HTMLElement;
  frameModulator: HTMLElement;
} | null {
  const main = document.getElementById('string-main');
  if (!main) return null;

  let detail = document.getElementById('string-react-detail-root') as HTMLElement | null;
  let frameModulator = document.getElementById('string-react-frame-modulator-root') as HTMLElement | null;

  if (!detail || !frameModulator) {
    main.replaceChildren();
    detail = document.createElement('div');
    detail.id = 'string-react-detail-root';
    frameModulator = document.createElement('div');
    frameModulator.id = 'string-react-frame-modulator-root';
    main.append(detail, frameModulator);
  }

  return { detail, frameModulator };
}

function _updateStringSelectHandle(
  key: 'string-mod-frame' | 'string-mod-crosses-string',
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

function findStringById(stringId: string | null | undefined): StringData | null {
  return stringId ? STRING_DATA.find((item) => item.id === stringId) || null : null;
}

function findRacquetById(frameId: string | null | undefined): Racquet | null {
  return frameId ? RACQUET_DATA.find((item) => item.id === frameId) || null : null;
}

function setButtonFeedback(id: string, text: string): void {
  const button = document.getElementById(id) as HTMLButtonElement | null;
  if (!button) return;
  const originalText = button.textContent || '';
  button.textContent = text;
  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 1500);
}

function computeBaseObs(stats: SetupStats): number {
  return Math.round(
    stats.spin * 0.15 +
      stats.power * 0.12 +
      stats.control * 0.18 +
      stats.comfort * 0.12 +
      stats.feel * 0.1 +
      stats.stability * 0.12 +
      stats.forgiveness * 0.08 +
      stats.maneuverability * 0.08
  );
}

function buildPreviewConfig(
  mainsString: StringData,
  crossesString: StringData,
  mode: StringMode,
  gauge: string,
  crossesGauge: string,
  mainsTension: number,
  crossesTension: number
): StringConfig {
  const mainsWithGauge = gauge ? applyGaugeModifier(mainsString, parseFloat(gauge)) : mainsString;
  const crossesWithGauge =
    mode === 'hybrid' && crossesGauge
      ? applyGaugeModifier(crossesString, parseFloat(crossesGauge))
      : crossesString === mainsString
        ? mainsWithGauge
        : crossesString;

  return mode === 'hybrid'
    ? {
        isHybrid: true,
        mains: mainsWithGauge,
        crosses: crossesWithGauge,
        mainsTension,
        crossesTension,
      }
    : {
        isHybrid: false,
        string: mainsWithGauge,
        mainsTension,
        crossesTension,
      };
}

function getFrameIdentityLabel(racquet: Racquet): string {
  const identity = typeof racquet.identity === 'string' ? racquet.identity : '';
  return identity || racquet.pattern;
}

function hydrateFrameSelection(frameId: string | null): void {
  const frameSelector = ssInstances['string-mod-frame'];
  if (frameSelector) frameSelector.setValue(frameId || '');
}

function hydrateCrossesSelection(stringId: string, crossesId: string | null): void {
  const selector = ssInstances['string-mod-crosses-string'];
  if (!selector) return;
  selector.setValue(crossesId && crossesId !== stringId ? crossesId : '');
}

function updateGaugeSelect(id: string, emptyLabel: string, gaugesHtml: string, selectedValue: string): void {
  const select = document.getElementById(id) as HTMLSelectElement | null;
  if (!select) return;
  select.innerHTML = `<option value="">${emptyLabel}</option>${gaugesHtml}`;
  select.value = selectedValue || '';
}

function ensureBaseStatsFromFrame(frameId: string | null): void {
  const racquet = findRacquetById(frameId);
  if (!racquet) {
    _stringModState.baseStats = null;
    setCompBaseObs(null);
    return;
  }

  _stringModState.baseStats = calcFrameBase(racquet);
  setCompBaseObs(_stringModState.baseStats ? computeBaseObs(_stringModState.baseStats) : null);
}

function scheduleStringRosterRender(): void {
  if (_stringRosterTimer != null) {
    window.clearTimeout(_stringRosterTimer);
  }
  _stringRosterTimer = window.setTimeout(() => {
    _stringRosterTimer = null;
    _stringRenderRoster();
  }, 80);
}

function scheduleStringPreviewUpdate(): void {
  if (_stringPreviewFrame != null) return;
  _stringPreviewFrame = window.requestAnimationFrame(() => {
    _stringPreviewFrame = null;
    _stringUpdatePreview();
  });
}

function updateStringPreviewTrack(
  track: HTMLElement,
  baseFilled: number,
  previewFilled?: number,
  deltaDirection?: 'up' | 'down' | null
): void {
  if (track.children.length !== 25) {
    track.innerHTML = Array.from({ length: 25 }, () => '<div class="flex-1 h-full rounded-[1px] transition-colors duration-150"></div>').join('');
  }

  Array.from(track.children).forEach((segment, index) => {
    const el = segment as HTMLElement;
    el.className = 'flex-1 h-full rounded-[1px] transition-colors duration-150';

    let bgClass = 'bg-black/20 dark:bg-white/10';
    if (index < baseFilled) bgClass = 'bg-dc-void dark:bg-dc-platinum';
    if (previewFilled != null && deltaDirection === 'up' && index < previewFilled) bgClass = 'bg-dc-red';
    if (previewFilled != null && deltaDirection === 'down' && index >= previewFilled && index < baseFilled) bgClass = 'bg-dc-red/40';

    el.classList.add(...bgClass.split(' '));
  });
}

export function _stringEnsureInitialized(): void {
  _bindStringDelegates();

  const searchEl = document.getElementById('string-search');
  const materialEl = document.getElementById('string-filter-material');
  const shapeEl = document.getElementById('string-filter-shape');
  const stiffnessEl = document.getElementById('string-filter-stiffness');

  if (searchEl && searchEl.dataset.stringBound !== 'true') {
    searchEl.addEventListener('input', scheduleStringRosterRender);
    searchEl.dataset.stringBound = 'true';
    _stringFiltersBound = true;
  }
  if (materialEl && materialEl.dataset.stringBound !== 'true') {
    materialEl.addEventListener('change', _stringRenderRoster);
    materialEl.dataset.stringBound = 'true';
    _stringFiltersBound = true;
  }
  if (shapeEl && shapeEl.dataset.stringBound !== 'true') {
    shapeEl.addEventListener('change', _stringRenderRoster);
    shapeEl.dataset.stringBound = 'true';
    _stringFiltersBound = true;
  }
  if (stiffnessEl && stiffnessEl.dataset.stringBound !== 'true') {
    stiffnessEl.addEventListener('change', _stringRenderRoster);
    stiffnessEl.dataset.stringBound = 'true';
    _stringFiltersBound = true;
  }

  _stringRenderRoster();

  const synced = syncStringCompendiumWithActiveLoadout();
  const initialId = synced?.isHybrid ? synced.mainsId : synced?.stringId;
  if (initialId && findStringById(initialId)) {
    _stringsInitialized = true;
    _stringSyncWithActiveLoadout();
    return;
  }

  if (_stringSelectedId && findStringById(_stringSelectedId)) {
    _stringsInitialized = true;
    const selected = findStringById(_stringSelectedId);
    if (selected) {
      _stringRenderMain(selected);
      return;
    }
  }

  if (STRING_DATA.length > 0) {
    _stringsInitialized = true;
    _stringSelectString(STRING_DATA[0].id);
    return;
  }

  const main = document.getElementById('string-main');
  if (main) {
    main.innerHTML =
      '<div class="flex flex-col items-center justify-center h-64 text-dc-red"><p class="font-mono text-sm">Error: String database not loaded</p></div>';
  }
}

let _stringDelegateBound = false;

function _bindStringDelegates(): void {
  if (_stringDelegateBound) return;
  _stringDelegateBound = true;

  // Click delegation
  document.addEventListener('click', (e: Event) => {
    const shell = document.getElementById('mode-compendium');
    if (shell && !shell.contains(e.target as Node)) return;
    const el = (e.target as Element).closest('[data-string-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.stringAction!;
    const arg = el.dataset.stringArg;

    switch (action) {
      case 'selectString':
        if (arg) _stringSelectString(arg);
        break;
      case 'goToFrame':
        if (arg) _stringActivateBestFrameAndOverview(arg);
        break;
      case 'toggleHud':
        _stringToggleHud();
        break;
      case 'setModMode':
        if (arg === 'fullbed' || arg === 'hybrid') _stringSetModMode(arg);
        break;
      case 'addToLoadout':
        _stringAddToLoadout();
        break;
      case 'setActive':
        _stringSetActiveLoadout();
        break;
      case 'clearPreview':
        _stringClearPreview();
        break;
    }
  });

  // Input delegation — tension number inputs
  document.addEventListener('input', (e: Event) => {
    const shell = document.getElementById('mode-compendium');
    if (shell && !shell.contains(e.target as Node)) return;
    const el = e.target as HTMLElement;
    if (el.dataset.stringAction !== 'tensionChange' || !el.dataset.stringArg) return;
    const type = el.dataset.stringArg as 'mains' | 'crosses';
    _stringOnTensionChange(type, (el as HTMLInputElement).value);
  });

  // Change delegation — gauge selects
  document.addEventListener('change', (e: Event) => {
    const shell = document.getElementById('mode-compendium');
    if (shell && !shell.contains(e.target as Node)) return;
    const el = e.target as HTMLElement;
    const action = el.dataset.stringAction;
    if (action === 'gaugeChange') {
      _stringOnGaugeChange((el as HTMLSelectElement).value);
    } else if (action === 'crossesGaugeChange') {
      _stringOnCrossesGaugeChange((el as HTMLSelectElement).value);
    }
  });
}

export function _stringToggleHud(): void {
  const hud = document.getElementById('string-hud');
  if (!hud) return;
  hud.classList.toggle('active');
  if (hud.classList.contains('active')) {
    (document.getElementById('string-search') as HTMLInputElement | null)?.focus();
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

export function _stringGetFilteredStrings(): StringData[] {
  return filterStringsForHud(STRING_DATA, _stringHudFilters);
}

export function _stringSyncWithActiveLoadout(): void {
  const synced = syncStringCompendiumWithActiveLoadout();
  if (!synced) return;

  _stringModState.frameId = synced.frameId;
  _stringModState.mode = synced.isHybrid ? 'hybrid' : 'fullbed';
  _stringModState.mainsTension = synced.mainsTension;
  _stringModState.crossesTension = synced.crossesTension;
  _stringModState.stringId = synced.isHybrid ? synced.mainsId || '' : synced.stringId || '';
  _stringModState.crossesId = synced.isHybrid ? synced.crossesId || synced.mainsId || '' : synced.stringId || '';
  _stringModState.gauge = synced.isHybrid ? synced.mainsGauge || '' : synced.gauge || '';
  _stringModState.crossesGauge = synced.isHybrid ? synced.crossesGauge || synced.mainsGauge || '' : synced.gauge || '';

  const stringId = _stringModState.stringId;
  const stringItem = findStringById(stringId);
  if (!stringItem) return;

  _stringSelectedId = stringId;
  _stringRenderRoster();
  _stringRenderMain(stringItem);
}

export function _stringRenderRoster(): void {
  _stringHudFilters = readStringHudFiltersFromDom();
  const list = document.getElementById('string-list');
  if (!list) return;

  const strings = _stringGetFilteredStrings();
  const rosterKey = strings.map((item) => `${item.id}:${item.id === _stringSelectedId ? 1 : 0}`).join('|');
  if (rosterKey === _stringLastRosterKey && list.children.length > 0) return;
  _stringLastRosterKey = rosterKey;

  const root = _ensureStringReactRoot(_stringRosterMount, list);
  root?.render(
    createElement(StringCompendiumRoster, {
      strings,
      selectedStringId: _stringSelectedId,
      getArchetype: _stringGetArchetype,
    }),
  );
}

export function _stringGetArchetype(stringItem: StringData): string {
  const scores = stringItem.twScore || {};
  if ((scores.spin || 0) >= 85 && (scores.control || 0) >= 80) return 'Spin Control';
  if ((scores.spin || 0) >= 85) return 'Spin Focus';
  if ((scores.control || 0) >= 85) return 'Control';
  if ((scores.power || 0) >= 75) return 'Power';
  if ((scores.comfort || 0) >= 80) return 'Comfort';
  if ((scores.durability || 0) >= 85) return 'Durability';
  return 'All-Rounder';
}

export function _stringSelectString(stringId: string): void {
  const hud = document.getElementById('string-hud');
  if (hud) {
    hud.classList.remove('active');
    document.body.style.overflow = '';
  }

  _stringSelectedId = stringId;
  const stringItem = findStringById(stringId);
  if (!stringItem) return;

  document.querySelectorAll<HTMLElement>('#string-list > button').forEach((element) => {
    const isActive = element.dataset.id === stringId;
    element.classList.remove('border-dc-accent', 'border-dc-platinum-dim');
    element.classList.add(isActive ? 'border-dc-accent' : 'border-dc-platinum-dim');
  });

  _stringRenderMain(stringItem);
}

export function _stringGeneratePills(stringItem: StringData): StringPills {
  const scores = stringItem.twScore || {};
  const bestFor: string[] = [];
  const watchOut: string[] = [];

  if ((scores.spin || 0) >= 85) bestFor.push('SPIN GENERATION');
  if ((scores.control || 0) >= 85) bestFor.push('PRECISION SHOTS');
  if ((scores.power || 0) >= 75) bestFor.push('FREE POWER');
  if ((scores.comfort || 0) >= 80) bestFor.push('ARM COMFORT');
  if ((scores.durability || 0) >= 85) bestFor.push('LONGEVITY');
  if ((scores.playabilityDuration || 0) >= 85) bestFor.push('TENSION MAINTENANCE');

  if ((scores.comfort || 0) < 60) watchOut.push('STIFF FEEL');
  if ((scores.durability || 0) < 60) watchOut.push('FAST BREAKAGE');
  if ((stringItem.tensionLoss || 0) > 30) watchOut.push('HIGH TENSION DROP');
  if ((scores.power || 0) < 50) watchOut.push('LOW POWER OUTPUT');

  return { bestFor, watchOut };
}

export function _stringRenderBatteryBars(stringItem: StringData): string {
  const scores = stringItem.twScore || {};
  const groups = [
    {
      title: 'Response',
      stats: [
        { label: 'Power', val: scores.power || 50 },
        { label: 'Spin', val: scores.spin || 50 },
        { label: 'Control', val: scores.control || 50 },
      ],
    },
    {
      title: 'Feel',
      stats: [
        { label: 'Feel', val: scores.feel || 50 },
        { label: 'Comfort', val: scores.comfort || 50 },
        { label: 'Playability', val: scores.playabilityDuration || 50 },
      ],
    },
    {
      title: 'Longevity',
      stats: [
        { label: 'Durability', val: scores.durability || 50 },
        { label: 'Tension Loss', val: Math.max(0, 100 - (stringItem.tensionLoss || 0) * 2) },
      ],
    },
  ];

  let html = '<div class="flex flex-col gap-6">';
  groups.forEach((group) => {
    html += `<div class="flex flex-col">
      <h4 class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em] border-b border-dc-border pb-2 mb-3">${group.title}</h4>
      <div class="flex flex-col gap-2.5">`;

    group.stats.forEach((stat) => {
      const pct = Math.max(0, Math.min(100, stat.val));
      const totalSegments = 25;
      const filledSegments = Math.round((pct / 100) * totalSegments);
      let batteryHtml = '<div class="flex flex-1 gap-[2px] h-1.5 items-center">';
      for (let index = 0; index < totalSegments; index += 1) {
        const bgClass = index < filledSegments ? 'bg-dc-void dark:bg-dc-platinum' : 'bg-black/20 dark:bg-white/10';
        batteryHtml += `<div class="flex-1 h-full rounded-[1px] transition-colors duration-150 ${bgClass}"></div>`;
      }
      batteryHtml += '</div>';

      html += `
        <div class="flex items-center gap-4 group">
          <span class="font-mono text-[13px] text-dc-storm group-hover:text-dc-platinum transition-colors uppercase tracking-[0.15em] w-28">${stat.label}</span>
          ${batteryHtml}
          <span class="font-mono text-[13px] font-bold text-dc-platinum w-8 text-right">${Math.round(stat.val)}</span>
        </div>`;
    });

    html += '</div></div>';
  });
  html += '</div>';
  return html;
}

export function _stringFindSimilarStrings(sourceId: string, limit = 4): StringData[] {
  const source = findStringById(sourceId);
  if (!source) return [];

  const scoreKeys: Array<keyof StringData['twScore']> = ['power', 'spin', 'comfort', 'control', 'feel', 'durability'];

  return STRING_DATA.filter((stringItem) => stringItem.id !== sourceId)
    .map((stringItem) => {
      const distance = scoreKeys.reduce((sum, key) => {
        const diff = (stringItem.twScore[key] || 50) - (source.twScore[key] || 50);
        return sum + diff * diff;
      }, 0);
      return { string: stringItem, distance };
    })
    .sort((left, right) => left.distance - right.distance)
    .slice(0, limit)
    .map((result) => result.string);
}

export function _stringFindBestFrames(stringId: string, limit = 4): SimilarFrameResult[] {
  const stringItem = findStringById(stringId);
  if (!stringItem) return [];

  const stringConfig: StringConfig = {
    isHybrid: false,
    string: stringItem,
    mainsTension: 52,
    crossesTension: 50,
  };

  return RACQUET_DATA.map((racquet) => {
    const stats = predictSetup(racquet, stringConfig);
    const tCtx = buildTensionContext(stringConfig, racquet);
    const obs = computeCompositeScore(stats, tCtx);
    return { racquet, stats, obs };
  })
    .sort((left, right) => right.obs - left.obs)
    .slice(0, limit);
}

export function _stringRenderMain(stringItem: StringData): void {
  const shell = _ensureStringMainShell();
  if (!shell) return;

  const pills = _stringGeneratePills(stringItem);
  const similarStrings = _stringFindSimilarStrings(stringItem.id);
  const bestFrames = _stringFindBestFrames(stringItem.id);
  const detailVm = buildStringCompendiumDetailVm(
    stringItem,
    pills,
    similarStrings,
    bestFrames,
    _stringGetArchetype,
    getFrameIdentityLabel,
  );

  const detailRoot = _ensureStringReactRoot(_stringDetailMount, shell.detail);
  const frameModRoot = _ensureStringReactRoot(_stringFrameModulatorMount, shell.frameModulator);

  detailRoot?.render(createElement(StringCompendiumDetail, { vm: detailVm }));
  frameModRoot?.render(createElement(StringFrameInjectionModulator));

  if (_stringModulatorHydrationFrame != null) {
    cancelAnimationFrame(_stringModulatorHydrationFrame);
  }
  _stringModulatorHydrationFrame = requestAnimationFrame(() => {
    _stringModulatorHydrationFrame = null;
    _stringInitModulator(stringItem);
  });
}

export function _stringInitModulator(stringItem: StringData): void {
  const existingState = { ..._stringModState };
  const selectedFrame = existingState.frameId;
  const selectedRacquet = findRacquetById(selectedFrame);
  const sameSelectedString = existingState.stringId === stringItem.id;

  _stringModState.stringId = stringItem.id;
  _stringModState.crossesId =
    sameSelectedString && existingState.mode === 'hybrid' && existingState.crossesId
      ? existingState.crossesId
      : stringItem.id;
  _stringModState.gauge = sameSelectedString ? existingState.gauge : '';
  _stringModState.crossesGauge = sameSelectedString ? existingState.crossesGauge : '';
  _stringModState.frameId = selectedFrame;
  _stringModState.mode = sameSelectedString ? existingState.mode : 'fullbed';
  _stringModState.mainsTension = selectedRacquet ? existingState.mainsTension : 52;
  _stringModState.crossesTension = selectedRacquet ? existingState.crossesTension : 50;
  _stringModState.baseStats = null;
  _stringModState.previewStats = null;

  const gauges = getGaugeOptions(stringItem);
  const gaugesHtml = gauges
    .map((gaugeNum) => `<option value="${gaugeNum}">${GAUGE_LABELS[gaugeNum] || `${gaugeNum}mm`}</option>`)
    .join('');

  const mainsNameEl = document.getElementById('string-mod-mains-name');
  if (mainsNameEl) {
    mainsNameEl.textContent = stringItem.name;
  }

  updateGaugeSelect('string-mod-gauge', 'Default', gaugesHtml, _stringModState.gauge);

  const frameContainer = document.getElementById('string-mod-frame');
  _updateStringSelectHandle('string-mod-frame', frameContainer, {
    type: 'racquet',
    placeholder: 'Select Frame...',
    value: selectedFrame || '',
    id: 'string-mod-frame-trigger',
    onChange: (value) => _stringOnFrameChange(value),
  });

  const crossesContainer = document.getElementById('string-mod-crosses-string');
  const crossesOptions = STRING_DATA.filter((candidate) => candidate.id !== stringItem.id).map((candidate) => ({
    value: candidate.id,
    label: candidate.name,
  }));

  _updateStringSelectHandle('string-mod-crosses-string', crossesContainer, {
    type: 'custom',
    placeholder: 'Same as mains...',
    value: '',
    id: 'string-mod-crosses-string-trigger',
    options: crossesOptions,
    onChange: (value) => _stringOnCrossesStringChange(value),
  });

  updateGaugeSelect('string-mod-crosses-gauge', 'Same as mains', gaugesHtml, _stringModState.crossesGauge);
  hydrateFrameSelection(selectedFrame);
  hydrateCrossesSelection(stringItem.id, _stringModState.crossesId);

  const mainsInput = document.getElementById('string-mod-mains-tension') as HTMLInputElement | null;
  const crossesInput = document.getElementById('string-mod-crosses-tension') as HTMLInputElement | null;
  if (mainsInput) mainsInput.value = String(_stringModState.mainsTension);
  if (crossesInput) crossesInput.value = String(_stringModState.crossesTension);

  _stringSetModMode(_stringModState.mode);

  if (selectedRacquet) {
    ensureBaseStatsFromFrame(selectedFrame);
    scheduleStringPreviewUpdate();
  } else {
    _stringClearPreview();
  }
}

export function _stringSetModMode(mode: StringMode): void {
  _stringModState.mode = mode;

  document.querySelectorAll<HTMLElement>('.string-mod-mode-btn').forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.remove('text-dc-accent', 'border-dc-accent', 'text-dc-storm', 'border-transparent');
    if (isActive) {
      button.classList.add('text-dc-accent', 'border-dc-accent');
    } else {
      button.classList.add('text-dc-storm', 'border-transparent');
    }
  });

  const crossesStringCol = document.getElementById('string-mod-crosses-string-col');
  const crossesGaugeCol = document.getElementById('string-mod-crosses-gauge-col');
  if (crossesStringCol) crossesStringCol.style.display = mode === 'hybrid' ? 'block' : 'none';
  if (crossesGaugeCol) crossesGaugeCol.style.display = mode === 'hybrid' ? 'block' : 'none';

  const crossesLabel = document.getElementById('string-mod-crosses-label');
  if (crossesLabel) {
    crossesLabel.textContent = '// CROSSES TENSION';
  }

  scheduleStringPreviewUpdate();
}

export function _stringOnCrossesStringChange(crossesId: string): void {
  _stringModState.crossesId = crossesId || _stringModState.stringId;
  scheduleStringPreviewUpdate();
}

export function _stringOnCrossesGaugeChange(gauge: string): void {
  _stringModState.crossesGauge = gauge || _stringModState.gauge;
  scheduleStringPreviewUpdate();
}

export function _stringOnFrameChange(frameId: string): void {
  _stringModState.frameId = frameId || null;

  const racquet = findRacquetById(_stringModState.frameId);
  if (racquet) {
    const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
    if (!_stringModState.baseStats || !_stringModState.previewStats) {
      _stringModState.mainsTension = midTension;
      _stringModState.crossesTension = midTension - 2;
    }
    const mainsInput = document.getElementById('string-mod-mains-tension') as HTMLInputElement | null;
    const crossesInput = document.getElementById('string-mod-crosses-tension') as HTMLInputElement | null;
    if (mainsInput) mainsInput.value = String(_stringModState.mainsTension);
    if (crossesInput) crossesInput.value = String(_stringModState.crossesTension);
    ensureBaseStatsFromFrame(racquet.id);
  } else {
    _stringModState.baseStats = null;
    setCompBaseObs(null);
  }

  scheduleStringPreviewUpdate();
}

export function _stringOnGaugeChange(gauge: string): void {
  _stringModState.gauge = gauge;
  if (!_stringModState.crossesGauge && _stringModState.mode === 'hybrid') {
    _stringModState.crossesGauge = gauge;
    const crossesGaugeSelect = document.getElementById('string-mod-crosses-gauge') as HTMLSelectElement | null;
    if (crossesGaugeSelect) crossesGaugeSelect.value = gauge || '';
  }
  scheduleStringPreviewUpdate();
}

export function _stringOnTensionChange(type: 'mains' | 'crosses', value: string): void {
  if (type === 'mains') {
    _stringModState.mainsTension = parseInt(value, 10) || 52;
  } else {
    _stringModState.crossesTension = parseInt(value, 10) || 50;
  }
  scheduleStringPreviewUpdate();
}

export function _stringUpdatePreview(): void {
  const { stringId, crossesId, frameId, mode, gauge, crossesGauge, mainsTension, crossesTension, baseStats } = _stringModState;
  if (!stringId || !frameId || !baseStats) {
    _stringClearPreview();
    return;
  }

  const mainsString = findStringById(stringId);
  const racquet = findRacquetById(frameId);
  if (!mainsString || !racquet) {
    _stringClearPreview();
    return;
  }

  const crossesString =
    mode === 'hybrid' && crossesId && crossesId !== stringId ? findStringById(crossesId) || mainsString : mainsString;

  const cfg = buildPreviewConfig(mainsString, crossesString, mode, gauge, crossesGauge, mainsTension, crossesTension);
  const previewStats = predictSetup(racquet, cfg);
  _stringModState.previewStats = previewStats;

  _stringRenderPreviewBars(baseStats, previewStats);

  const addBtn = document.getElementById('string-mod-add') as HTMLButtonElement | null;
  const activateBtn = document.getElementById('string-mod-activate') as HTMLButtonElement | null;
  if (addBtn) addBtn.disabled = false;
  if (activateBtn) activateBtn.disabled = false;

  const obs = computeCompositeScore(previewStats, buildTensionContext(cfg, racquet));
  const obsEl = document.getElementById('string-mod-obs');
  if (obsEl) {
    obsEl.innerHTML = `<span class="font-mono text-4xl font-bold text-dc-accent">${obs.toFixed(1)}</span>`;
  }

  const baseObs = getCompBaseObs() || computeBaseObs(baseStats);
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
}

export function _stringRenderPreviewBars(baseStats: SetupStats, previewStats: SetupStats): void {
  const segments = 25;

  PREVIEW_STAT_KEYS.forEach((key) => {
    const baseVal = baseStats[key] != null ? Math.round(baseStats[key]) : 50;
    const previewVal = previewStats[key] != null ? Math.round(previewStats[key]) : 50;
    const baseFilled = Math.round((baseVal / 100) * segments);
    const previewFilled = Math.round((previewVal / 100) * segments);

    const track = document.getElementById(`string-track-${key}`);
    const valueEl = document.getElementById(`string-val-${key}`);
    if (!track) return;

    const deltaDirection = previewVal > baseVal ? 'up' : previewVal < baseVal ? 'down' : null;
    updateStringPreviewTrack(track, baseFilled, previewFilled, deltaDirection);

    if (valueEl) {
      let diffColor = 'text-dc-storm';
      if (previewVal > baseVal) diffColor = 'text-dc-red';
      if (previewVal < baseVal) diffColor = 'text-dc-accent';
      valueEl.innerHTML = `
        <span class="text-dc-storm">${baseVal}</span>
        <span class="text-dc-storm mx-1">&rarr;</span>
        <span class="${diffColor}">${previewVal}</span>
      `;
    }
  });
}

export function _stringClearPreview(): void {
  const baseStats = _stringModState.baseStats;
  const segments = 25;

  PREVIEW_STAT_KEYS.forEach((key) => {
    const baseVal = baseStats && baseStats[key] != null ? Math.round(baseStats[key]) : 50;
    const baseFilled = Math.round((baseVal / 100) * segments);

    const track = document.getElementById(`string-track-${key}`);
    const valueEl = document.getElementById(`string-val-${key}`);
    if (!track) return;

    updateStringPreviewTrack(track, baseFilled);

    if (valueEl) {
      valueEl.innerHTML = `<span class="text-dc-platinum">${baseVal}</span>`;
    }
  });

  const addBtn = document.getElementById('string-mod-add') as HTMLButtonElement | null;
  const activateBtn = document.getElementById('string-mod-activate') as HTMLButtonElement | null;
  if (addBtn) addBtn.disabled = true;
  if (activateBtn) activateBtn.disabled = true;

  const obsEl = document.getElementById('string-mod-obs');
  if (obsEl) {
    obsEl.innerHTML = '<span class="font-mono text-4xl font-bold text-dc-storm">&mdash;</span>';
  }

  const deltaEl = document.getElementById('comp-string-delta');
  if (deltaEl) deltaEl.classList.add('opacity-0');
}

/**
 * "Best paired with" card: apply that frame to the current string modulator state,
 * then set active loadout and go to Overview (same outcome as Set Active after picking the frame).
 */
function _stringActivateBestFrameAndOverview(frameId: string): void {
  if (!frameId) return;
  _stringOnFrameChange(frameId);
  hydrateFrameSelection(frameId);
  _stringSetActiveLoadout();
}

export function _stringAddToLoadout(): void {
  const { stringId, crossesId, frameId, mode, mainsTension, crossesTension, gauge, crossesGauge } = _stringModState;
  if (!stringId || !frameId) {
    alert('Please select both a string and a frame');
    return;
  }

  const isHybrid = mode === 'hybrid' && !!crossesId && crossesId !== stringId;
  const loadout = createLoadout(frameId, stringId, mainsTension, {
    source: 'string-compendium',
    crossesTension: isHybrid ? crossesTension : mainsTension,
    gauge: isHybrid ? null : gauge || null,
    mainsGauge: isHybrid ? gauge || null : null,
    crossesGauge: isHybrid ? (crossesGauge || gauge || null) : null,
    isHybrid,
    mainsId: isHybrid ? stringId : null,
    crossesId: isHybrid ? crossesId : null,
  });
  if (!loadout) return;

  saveLoadout(loadout);
  setButtonFeedback('string-mod-add', 'Saved ✓');
}

export function _stringSetActiveLoadout(): void {
  const { stringId, crossesId, frameId, mode, mainsTension, crossesTension, gauge, crossesGauge } = _stringModState;
  if (!stringId || !frameId) {
    alert('Please select both a string and a frame');
    return;
  }

  const isHybrid = mode === 'hybrid' && !!crossesId && crossesId !== stringId;
  const loadout = createLoadout(frameId, stringId, mainsTension, {
    source: 'string-compendium',
    crossesTension: isHybrid ? crossesTension : mainsTension,
    gauge: isHybrid ? null : gauge || null,
    mainsGauge: isHybrid ? gauge || null : null,
    crossesGauge: isHybrid ? (crossesGauge || gauge || null) : null,
    isHybrid,
    mainsId: isHybrid ? stringId : null,
    crossesId: isHybrid ? crossesId : null,
  });
  if (!loadout) return;

  saveLoadout(loadout);
  activateLoadout(loadout);
  switchMode('overview');
  setButtonFeedback('string-mod-activate', 'Active ✓');
}
