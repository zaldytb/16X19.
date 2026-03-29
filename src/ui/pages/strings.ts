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
import { createLoadout } from '../../state/loadout.js';
import { syncStringCompendiumWithActiveLoadout } from '../../state/setup-sync.js';
import { createSearchableSelect, ssInstances } from '../components/searchable-select.js';

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

interface SaveLikeWindow extends Window {
  _compBaseObs?: number | null;
  activateLoadout?: (loadout: unknown) => void;
  saveLoadout?: (loadout: unknown) => void;
  switchMode?: (mode: string) => void;
  _compSelectFrame?: (frameId: string) => void;
  _compSwitchTab?: (tab: string) => void;
}

let _stringSelectedId: string | null = null;
let _stringsInitialized = false;
let _stringFiltersBound = false;
let _stringPreviewFrame: number | null = null;
let _stringRosterTimer: number | null = null;
let _stringLastRosterKey = '';

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

function getAppWindow(): SaveLikeWindow {
  return window as SaveLikeWindow;
}

function getInputValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value || '';
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
    getAppWindow()._compBaseObs = null;
    return;
  }

  _stringModState.baseStats = calcFrameBase(racquet);
  getAppWindow()._compBaseObs = _stringModState.baseStats ? computeBaseObs(_stringModState.baseStats) : null;
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

    let bgClass = 'bg-black/10 dark:bg-white/10';
    if (index < baseFilled) bgClass = 'bg-dc-void dark:bg-dc-platinum';
    if (previewFilled != null && deltaDirection === 'up' && index < previewFilled) bgClass = 'bg-dc-red';
    if (previewFilled != null && deltaDirection === 'down' && index >= previewFilled && index < baseFilled) bgClass = 'bg-dc-red/40';

    el.classList.add(...bgClass.split(' '));
  });
}

export function _stringEnsureInitialized(): void {
  if (!_stringFiltersBound) {
    document.getElementById('string-search')?.addEventListener('input', scheduleStringRosterRender);
    document.getElementById('string-filter-material')?.addEventListener('change', _stringRenderRoster);
    document.getElementById('string-filter-shape')?.addEventListener('change', _stringRenderRoster);
    document.getElementById('string-filter-stiffness')?.addEventListener('change', _stringRenderRoster);
    _stringFiltersBound = true;
  }

  _stringRenderRoster();

  if (!_stringsInitialized) {
    _stringsInitialized = true;
    const synced = syncStringCompendiumWithActiveLoadout();
    const initialId = synced?.isHybrid ? synced.mainsId : synced?.stringId;
    if (initialId && findStringById(initialId)) {
      _stringSyncWithActiveLoadout();
      return;
    }

    if (STRING_DATA.length > 0) {
      _stringSelectString(STRING_DATA[0].id);
      return;
    }

    const main = document.getElementById('string-main');
    if (main) {
      main.innerHTML =
        '<div class="flex flex-col items-center justify-center h-64 text-dc-red"><p class="font-mono text-sm">Error: String database not loaded</p></div>';
    }
  }
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
  const search = getInputValue('string-search').toLowerCase();
  const material = getInputValue('string-filter-material');
  const shape = getInputValue('string-filter-shape');
  const stiffness = getInputValue('string-filter-stiffness');

  return STRING_DATA.filter((stringItem) => {
    if (search && !stringItem.name.toLowerCase().includes(search)) return false;
    if (material && !stringItem.material.includes(material)) return false;
    if (shape && !stringItem.shape.toLowerCase().includes(shape.toLowerCase())) return false;
    if (stiffness === 'soft' && stringItem.stiffness >= 180) return false;
    if (stiffness === 'medium' && (stringItem.stiffness < 180 || stringItem.stiffness > 210)) return false;
    if (stiffness === 'stiff' && stringItem.stiffness <= 210) return false;
    return true;
  });
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
  const list = document.getElementById('string-list');
  if (!list) return;

  const strings = _stringGetFilteredStrings();
  const rosterKey = strings.map((item) => `${item.id}:${item.id === _stringSelectedId ? 1 : 0}`).join('|');
  if (rosterKey === _stringLastRosterKey) return;
  _stringLastRosterKey = rosterKey;
  list.innerHTML = strings
    .map((stringItem) => {
      const isActive = stringItem.id === _stringSelectedId;
      const baseClasses = 'bg-transparent border text-left flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer p-4';
      const borderClasses = isActive
        ? 'border-dc-accent'
        : 'border-dc-storm dark:border-dc-platinum-dim hover:border-dc-platinum';
      const archetype = _stringGetArchetype(stringItem);

      return `<button class="${baseClasses} ${borderClasses}" data-id="${stringItem.id}" onclick="_stringSelectString('${stringItem.id}')">
      <div class="flex justify-between items-start gap-2">
        <span class="text-base font-semibold leading-tight tracking-tight text-dc-platinum">${stringItem.name}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="font-mono text-[10px] uppercase tracking-[0.15em] text-dc-accent">${archetype}</span>
        <span class="font-mono text-[12px] text-dc-storm">${stringItem.material} // ${stringItem.shape}</span>
        <span class="font-mono text-[13px] font-semibold text-dc-platinum">${Math.round(stringItem.stiffness)} lb/in</span>
      </div>
    </button>`;
    })
    .join('');
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
        const bgClass = index < filledSegments ? 'bg-dc-void dark:bg-dc-platinum' : 'bg-black/10 dark:bg-white/10';
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
  const main = document.getElementById('string-main');
  if (!main) return;

  delete ssInstances['string-mod-frame'];
  delete ssInstances['string-mod-crosses-string'];

  const pills = _stringGeneratePills(stringItem);
  const consoleHtml: string[] = [];
  pills.bestFor.forEach((pill) =>
    consoleHtml.push(`<span class="font-mono text-[13px] font-bold tracking-[0.05em] uppercase text-dc-platinum">[+] ${pill}</span>`)
  );
  pills.watchOut.forEach((pill) =>
    consoleHtml.push(`<span class="font-mono text-[13px] font-bold tracking-[0.05em] uppercase text-dc-red">[-] ${pill}</span>`)
  );

  const batteryHtml = _stringRenderBatteryBars(stringItem);
  const similarStrings = _stringFindSimilarStrings(stringItem.id);
  const bestFrames = _stringFindBestFrames(stringItem.id);

  const similarHtml = similarStrings
    .map((similar) => {
      const archetype = _stringGetArchetype(similar);
      return `<div class="bg-transparent border border-dc-border hover:border-dc-storm p-4 flex flex-col cursor-pointer transition-colors group" onclick="_stringSelectString('${similar.id}')">
      <div class="flex justify-between items-start mb-2">
        <span class="font-mono text-[10px] text-dc-storm uppercase tracking-widest group-hover:text-dc-platinum transition-colors">${archetype}</span>
        <span class="font-mono text-lg font-bold text-dc-platinum">${similar.twScore.spin || 0}<span class="text-[13px] text-dc-storm ml-1">SPIN</span></span>
      </div>
      <div class="text-sm font-semibold text-dc-platinum mb-1">${similar.name}</div>
      <div class="font-mono text-[13px] text-dc-storm">${similar.material} // ${similar.shape}</div>
    </div>`;
    })
    .join('');

  const framesHtml = bestFrames
    .map((frameResult) => {
      return `<div class="bg-transparent border border-dc-border hover:border-dc-storm p-4 flex flex-col cursor-pointer transition-colors group" onclick="_compSelectFrame('${frameResult.racquet.id}'); _compSwitchTab('rackets');">
      <div class="flex justify-between items-start mb-2">
        <span class="font-mono text-[10px] text-dc-storm uppercase tracking-widest group-hover:text-dc-platinum transition-colors">${getFrameIdentityLabel(frameResult.racquet)}</span>
        <span class="font-mono text-lg font-bold text-dc-accent">${frameResult.obs.toFixed(1)}</span>
      </div>
      <div class="text-sm font-semibold text-dc-platinum mb-1">${frameResult.racquet.name.replace(/\s+\d+g$/, '')}</div>
      <div class="font-mono text-[13px] text-dc-storm">${frameResult.racquet.pattern} // ${frameResult.racquet.strungWeight}g strung</div>
    </div>`;
    })
    .join('');

  const twScores = stringItem.twScore || {};
  const twuComposite = Math.round(
    (twScores.control || 50) * 0.16 +
      (twScores.spin || 50) * 0.13 +
      (twScores.comfort || 50) * 0.13 +
      (twScores.power || 50) * 0.11 +
      (twScores.feel || 50) * 0.1 +
      (twScores.durability || 50) * 0.07 +
      (twScores.playabilityDuration || 50) * 0.06
  );

  const notes = typeof stringItem.notes === 'string' ? stringItem.notes : '';

  main.innerHTML = `
    <div class="relative flex flex-col items-start mb-8">
      <div class="absolute top-6 right-6 md:top-8 md:right-8 flex flex-col items-end">
        <span class="font-mono text-[13px] text-dc-storm tracking-[0.2em] mb-1">TWU SCORE</span>
        <span class="font-mono text-5xl font-semibold leading-[0.85] text-dc-platinum">
          ${twuComposite}
        </span>
      </div>

      <h2 class="text-5xl md:text-[4rem] font-semibold tracking-tight text-dc-platinum leading-none mb-0 pr-[120px] flex items-center gap-3 cursor-pointer group" onclick="_stringToggleHud()">
        ${stringItem.name}
        <span class="text-2xl text-dc-red opacity-50 group-hover:opacity-100 transition-opacity">&#9660;</span>
      </h2>

      <div class="flex items-center gap-2 mt-4 font-mono text-[13px] flex-wrap">
        <span class="text-dc-platinum">${stringItem.material.toUpperCase()}</span>
        <span class="text-dc-accent opacity-60 text-[13px]">//</span>
        <span class="text-dc-storm uppercase tracking-[0.15em]">${stringItem.shape}</span>
      </div>

      ${notes ? `<p class="max-w-[650px] mt-6 text-sm leading-relaxed text-dc-storm">${notes}</p>` : ''}

      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 w-full mt-12 pt-8 border-t border-dc-border">
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-platinum leading-none">${Math.round(stringItem.stiffness)}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">STIFFNESS (lb/in)</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-platinum leading-none">${stringItem.spinPotential || '&mdash;'}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">SPIN POTENTIAL</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-platinum leading-none">${stringItem.tensionLoss || '&mdash;'}%</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">TENSION LOSS</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-platinum leading-none">${stringItem.stiffness > 200 ? 'High' : stringItem.stiffness > 180 ? 'Med' : 'Low'}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">SNAPBACK</span>
        </div>
      </div>

      ${consoleHtml.length > 0 ? `<div class="flex flex-wrap gap-4 w-full mt-8 p-0">${consoleHtml.join('')}</div>` : ''}
    </div>

    <div class="mb-12">
      <h3 class="font-mono text-xs tracking-[0.15em] text-dc-platinum uppercase mb-1">// STRING TELEMETRY</h3>
      <p class="text-xs text-dc-storm mb-6 italic">Intrinsic characteristics from Tennis Warehouse testing</p>
      ${batteryHtml}
    </div>

    <div class="bg-transparent border border-dc-storm/30 p-5 md:p-6 mb-10 flex flex-col gap-5">
      <div class="flex justify-between items-center border-b border-dc-storm/30 pb-3 mb-1">
        <span class="font-mono text-[13px] text-dc-accent uppercase tracking-[0.2em]">//FRAME INJECTION</span>
        <div class="flex gap-4">
          <button class="string-mod-mode-btn text-dc-accent border-dc-accent border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors" data-mode="fullbed" onclick="_stringSetModMode('fullbed')">Full Bed</button>
          <button class="string-mod-mode-btn text-dc-storm border-transparent border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors" data-mode="hybrid" onclick="_stringSetModMode('hybrid')">Hybrid</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-3">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// SELECT FRAME</span>
          <div id="string-mod-frame" data-placeholder="Select Frame..."></div>
          <p class="text-[12px] text-dc-storm italic">Required: Choose a frame to inject this string into</p>
        </div>

        <div class="flex flex-col gap-3">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// PROJECTED OBS</span>
          <div id="string-mod-obs" class="flex items-center">
            <span class="font-mono text-4xl font-bold text-dc-storm">&mdash;</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-3">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// MAINS STRING</span>
          <div id="string-mod-mains-name" class="font-mono text-sm text-dc-platinum py-2 border-b border-dc-storm/30">
            Select a string first
          </div>
        </div>

        <div class="flex flex-col gap-3" id="string-mod-crosses-string-col" style="display:none;">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// CROSSES STRING</span>
          <div id="string-mod-crosses-string" data-placeholder="Same as mains..."></div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-3">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// MAINS GAUGE</span>
          <select id="string-mod-gauge" class="appearance-none bg-white dark:bg-dc-void border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 px-2 outline-none focus:border-dc-accent transition-colors cursor-pointer" onchange="_stringOnGaugeChange(this.value)">
            <option value="">Default</option>
          </select>
        </div>

        <div class="flex flex-col gap-3" id="string-mod-crosses-gauge-col" style="display:none;">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// CROSSES GAUGE</span>
          <select id="string-mod-crosses-gauge" class="appearance-none bg-white dark:bg-dc-void border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 px-2 outline-none focus:border-dc-accent transition-colors cursor-pointer" onchange="_stringOnCrossesGaugeChange(this.value)">
            <option value="">Same as mains</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div class="flex flex-col gap-3" id="string-mod-mains-col">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// MAINS TENSION</span>
          <input type="number" id="string-mod-mains-tension" class="bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors" value="52" min="30" max="70" step="1" oninput="_stringOnTensionChange('mains', this.value)">
        </div>

        <div class="flex flex-col gap-3" id="string-mod-crosses-col">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]" id="string-mod-crosses-label">// CROSSES TENSION</span>
          <input type="number" id="string-mod-crosses-tension" class="bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors" value="50" min="30" max="70" step="1" oninput="_stringOnTensionChange('crosses', this.value)">
        </div>
      </div>

      <div class="border-t border-dc-storm/30 pt-4 mt-2">
        <h4 class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em] mb-4">// LIVE PREVIEW</h4>
        <div class="flex flex-col gap-2.5">
          ${['spin', 'power', 'control', 'feel', 'comfort']
            .map(
              (stat) => `
            <div class="flex items-center gap-4 group" data-stat="${stat}">
              <span class="font-mono text-[13px] text-dc-storm group-hover:text-dc-platinum transition-colors uppercase tracking-[0.15em] w-20">${stat}</span>
              <div class="flex flex-1 gap-[2px] h-1.5 items-center" id="string-track-${stat}">
                ${Array(25)
                  .fill(0)
                  .map(() => `<div class="flex-1 h-full rounded-[1px] bg-black/10 dark:bg-white/10"></div>`)
                  .join('')}
              </div>
              <span class="font-mono text-[13px] font-bold text-dc-platinum w-16 text-right" id="string-val-${stat}">&mdash;</span>
            </div>`
            )
            .join('')}
        </div>
      </div>

      <div class="flex gap-2 mt-2">
        <button class="flex-1 font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed" id="string-mod-add" disabled onclick="_stringAddToLoadout()">Add to Loadout</button>
        <button class="flex-1 font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-platinum text-dc-platinum hover:bg-dc-platinum hover:text-dc-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed" id="string-mod-activate" disabled onclick="_stringSetActiveLoadout()">Set Active</button>
        <button class="font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-storm/50 text-dc-storm hover:bg-dc-storm/10 hover:text-dc-platinum hover:border-dc-storm transition-colors" onclick="_stringClearPreview()">Clear</button>
      </div>
    </div>

    <div class="mb-12">
      <h3 class="font-mono text-xs tracking-[0.15em] text-dc-platinum uppercase mb-1">// BEST PAIRED WITH</h3>
      <p class="text-xs text-dc-storm mb-6 italic">Top performing frames with this string (52 lbs)</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">${framesHtml}</div>
    </div>

    <div class="mb-12">
      <h3 class="font-mono text-xs tracking-[0.15em] text-dc-platinum uppercase mb-1">// SIMILAR STRINGS</h3>
      <p class="text-xs text-dc-storm mb-6 italic">Alternatives with similar performance profiles</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">${similarHtml}</div>
    </div>
  `;

  _stringInitModulator(stringItem);
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
  if (frameContainer && !ssInstances['string-mod-frame']) {
    ssInstances['string-mod-frame'] = createSearchableSelect(frameContainer, {
      type: 'racquet',
      placeholder: 'Select Frame...',
      value: selectedFrame || '',
      id: 'string-mod-frame-trigger',
      onChange: (value) => _stringOnFrameChange(value),
    });
  }

  const crossesContainer = document.getElementById('string-mod-crosses-string');
  const crossesOptions = STRING_DATA.filter((candidate) => candidate.id !== stringItem.id).map((candidate) => ({
    value: candidate.id,
    label: candidate.name,
  }));

  if (crossesContainer && !ssInstances['string-mod-crosses-string']) {
    ssInstances['string-mod-crosses-string'] = createSearchableSelect(crossesContainer, {
      type: 'custom',
      placeholder: 'Same as mains...',
      value: '',
      id: 'string-mod-crosses-string-trigger',
      options: crossesOptions,
      onChange: (value) => _stringOnCrossesStringChange(value),
    });
  } else if (ssInstances['string-mod-crosses-string']) {
    ssInstances['string-mod-crosses-string'].setOptions(crossesOptions);
  }

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
    getAppWindow()._compBaseObs = null;
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

  const baseObs = getAppWindow()._compBaseObs || computeBaseObs(baseStats);
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

  getAppWindow().saveLoadout?.(loadout);
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

  getAppWindow().saveLoadout?.(loadout);
  getAppWindow().activateLoadout?.(loadout);
  getAppWindow().switchMode?.('overview');
  setButtonFeedback('string-mod-activate', 'Active ✓');
}
