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
import { createSearchableSelect, ssInstances } from '../components/searchable-select.js';
import { activateLoadout, switchMode } from './shell.js';
import { getState as compareGetState, setSlotLoadout as compareSetSlotLoadout } from './compare/hooks/useCompareState.js';
import { getCompBaseObs, setCompBaseObs } from './comp-base-obs.js';

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
let _compLastRosterKey = '';

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

export function initCompendium(): void {
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

  _compRenderRoster();

  const setup = getCurrentSetup();
  if (setup?.racquet) {
    _compSelectFrame(setup.racquet.id);
  } else if (RACQUET_DATA.length > 0) {
    _compSelectFrame(RACQUET_DATA[0].id);
  }

  _bindCompendiumDelegates();
}

let _compDelegateBound = false;

function _bindCompendiumDelegates(): void {
  if (_compDelegateBound) return;
  _compDelegateBound = true;

  document.addEventListener('click', (e: Event) => {
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

function _updateSegmentTrack(
  track: HTMLElement,
  baseFilled: number,
  previewFilled?: number,
  deltaDirection?: 'up' | 'down' | null
): void {
  const existingSegments = Array.from(track.children) as HTMLElement[];
  if (existingSegments.length !== 25) {
    track.innerHTML = Array.from({ length: 25 }, (_, index) => `<div class="flex-1 h-full rounded-[1px] transition-colors duration-150" data-seg="${index}"></div>`).join('');
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

export function _compGetFilteredRacquets(): Racquet[] {
  const search = ((document.getElementById('comp-search') as HTMLInputElement | null)?.value || '').toLowerCase();
  const brand = (document.getElementById('comp-filter-brand') as HTMLSelectElement | null)?.value || '';
  const pattern = (document.getElementById('comp-filter-pattern') as HTMLSelectElement | null)?.value || '';
  const stiffness = (document.getElementById('comp-filter-stiffness') as HTMLSelectElement | null)?.value || '';
  const headsize = (document.getElementById('comp-filter-headsize') as HTMLSelectElement | null)?.value || '';
  const weight = (document.getElementById('comp-filter-weight') as HTMLSelectElement | null)?.value || '';

  return RACQUET_DATA.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search)) return false;
    if (brand && !r.name.startsWith(brand)) return false;
    if (pattern && r.pattern !== pattern) return false;
    if (stiffness === 'soft' && r.stiffness > 59) return false;
    if (stiffness === 'medium' && (r.stiffness < 60 || r.stiffness > 65)) return false;
    if (stiffness === 'stiff' && r.stiffness < 66) return false;
    if (headsize === '102' && r.headSize < 102) return false;
    if (headsize && headsize !== '102' && r.headSize !== parseInt(headsize, 10)) return false;
    if (weight === 'ultralight' && r.strungWeight >= 285) return false;
    if (weight === 'light' && (r.strungWeight < 285 || r.strungWeight > 305)) return false;
    if (weight === 'medium' && (r.strungWeight < 305 || r.strungWeight > 320)) return false;
    if (weight === 'heavy' && (r.strungWeight < 320 || r.strungWeight > 340)) return false;
    if (weight === 'tour' && r.strungWeight <= 340) return false;
    return true;
  });
}

export function _compRenderRoster(): void {
  const list = document.getElementById('comp-frame-list');
  if (!list) return;
  const racquets = _compGetFilteredRacquets();
  const rosterKey = racquets.map((r) => `${r.id}:${r.id === _compSelectedRacquetId ? 1 : 0}`).join('|');
  if (rosterKey === _compLastRosterKey && list.children.length > 0) return;
  _compLastRosterKey = rosterKey;

  list.innerHTML = racquets
    .map((r) => {
      const isActive = r.id === _compSelectedRacquetId;
      const specs = `${r.strungWeight}g strung &middot; ${r.stiffness} RA &middot; ${r.pattern}`;
      const baseClasses = 'bg-transparent border text-left flex flex-col justify-between gap-6 transition-all duration-200 cursor-pointer p-5';
      const borderClasses = isActive ? 'border-dc-accent' : 'border-dc-platinum-dim hover:border-dc-platinum';
      return `<button class="${baseClasses} ${borderClasses}" data-id="${r.id}" data-comp-action="selectFrame">
      <div class="flex justify-between items-start gap-2">
        <span class="text-lg font-semibold leading-tight tracking-tight text-dc-platinum">${r.name.replace(/\s+\d+g$/, '')}</span>
        <span class="font-mono text-[13px] tracking-[0.15em] text-dc-platinum-dim mt-1">${r.year}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="font-mono text-[13px] uppercase tracking-[0.15em] text-dc-accent">${r.identity || r.pattern}</span>
        <span class="font-mono text-[13px] font-semibold text-dc-platinum">${specs}</span>
      </div>
    </button>`;
    })
    .join('');
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
    main.style.opacity = '0.3';
    main.style.transition = 'opacity 150ms ease-out';
    window.setTimeout(() => {
      _compRenderMain(racquet);
      main.style.opacity = '1';
    }, 150);
  } else {
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
    _compInitStringInjector(setup.racquet);
  } else {
    _compSelectFrame(activeRacquetId);
  }
}

export function _compRenderMain(racquet: Racquet): void {
  const main = document.getElementById('comp-main');
  if (!main) return;

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
  const consoleHtml: string[] = [];
  pills.bestFor.forEach((p) =>
    consoleHtml.push(
      `<span class="font-mono text-[13px] font-bold tracking-[0.05em] uppercase text-dc-platinum">[+] ${p.toUpperCase()}</span>`
    )
  );
  pills.watchOut.forEach((p) =>
    consoleHtml.push(
      `<span class="font-mono text-[13px] font-bold tracking-[0.05em] uppercase text-dc-red">[-] ${p.toUpperCase()}</span>`
    )
  );

  let statsHtml = '<div class="flex flex-col gap-6">';
  const statGroups = [
    { title: 'Attack', stats: [{ id: 'spin', label: 'Spin' }, { id: 'power', label: 'Power' }, { id: 'launch', label: 'Launch' }] },
    {
      title: 'Defense',
      stats: [{ id: 'control', label: 'Control' }, { id: 'stability', label: 'Stability' }, { id: 'forgiveness', label: 'Forgiveness' }],
    },
    {
      title: 'Touch',
      stats: [{ id: 'feel', label: 'Feel' }, { id: 'comfort', label: 'Comfort' }, { id: 'maneuverability', label: 'Maneuverability' }],
    },
  ] as const;

  statGroups.forEach((group) => {
    statsHtml += `<div class="flex flex-col">
      <h4 class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em] border-b border-dc-border pb-2 mb-3">${group.title}</h4>
      <div class="flex flex-col gap-2.5">`;

    group.stats.forEach((stat) => {
      const val = Math.round((frameBase as any)[stat.id]);
      const pct = Math.max(0, Math.min(100, val));
      const totalSegments = 25;
      const filledSegments = Math.round((pct / 100) * totalSegments);
      let batteryHtml = `<div class="flex flex-1 gap-[2px] h-1.5 items-center" id="comp-track-${stat.id}" data-base="${val}">`;
      for (let i = 0; i < totalSegments; i++) {
        const bgClass = i < filledSegments ? 'bg-dc-void dark:bg-dc-platinum' : 'bg-black/10 dark:bg-white/10';
        batteryHtml += `<div class="flex-1 h-full rounded-[1px] transition-colors duration-150 ${bgClass}" data-seg="${i}"></div>`;
      }
      batteryHtml += '</div>';

      statsHtml += `
        <div class="flex items-center gap-4 group" data-stat="${stat.id}">
          <span class="font-mono text-[13px] text-dc-storm group-hover:text-dc-platinum transition-colors uppercase tracking-[0.15em] w-28">${stat.label}</span>
          ${batteryHtml}
          <span class="font-mono text-[13px] font-bold text-dc-platinum w-8 text-right" id="comp-val-${stat.id}">${val}</span>
        </div>`;
    });
    statsHtml += '</div></div>';
  });
  statsHtml += '</div>';

  const sortOptions: Array<{ key: SortKey; label: string }> = [
    { key: 'score', label: 'OBS' },
    { key: 'spin', label: 'Spin' },
    { key: 'control', label: 'Control' },
    { key: 'power', label: 'Power' },
    { key: 'comfort', label: 'Comfort' },
    { key: 'durability', label: 'Durability' },
  ];
  const sortTabsHtml = sortOptions
    .map((s) => {
      const isActive = _compSortKey === s.key;
      const baseClasses = 'font-mono text-[12px] uppercase tracking-[0.1em] pb-2 transition-colors';
      const activeClasses = isActive ? 'text-dc-accent border-b-2 border-dc-accent -mb-[9px] pb-[7px]' : 'text-dc-storm hover:text-dc-platinum';
      return `<button class="${baseClasses} ${activeClasses}" data-comp-action="setSort" data-key="${s.key}">${s.label}</button>`;
    })
    .join('');

  const cardsHtml = sorted.map((b, i) => _compRenderBuildCard(b, i, racquet, frameBase)).join('');

  main.innerHTML = `
    <div class="relative flex flex-col items-start mb-8">
      <div class="absolute top-6 right-6 md:top-8 md:right-8 flex flex-col items-end">
        <span class="font-mono text-[13px] text-dc-storm tracking-[0.2em] mb-1">BASE SCORE</span>
        <span class="font-mono text-5xl font-semibold leading-[0.85] text-dc-platinum">
          ${(() => {
            const fb = calcFrameBase(racquet);
            const baseObs = Math.round(
              fb.spin * 0.15 +
                fb.power * 0.12 +
                fb.control * 0.18 +
                fb.comfort * 0.12 +
                fb.feel * 0.1 +
                fb.stability * 0.12 +
                fb.forgiveness * 0.08 +
                fb.maneuverability * 0.08
            );
            setCompBaseObs(baseObs);
            return baseObs;
          })()}<span class="text-xl text-dc-storm ml-1">OBS</span>
        </span>
        <div id="comp-string-delta" class="flex items-center gap-1 mt-1 opacity-0 transition-opacity duration-200">
          <span class="font-mono text-lg font-bold text-dc-red">+</span>
          <span class="font-mono text-lg font-bold text-dc-red" id="comp-string-delta-value">0</span>
          <span class="font-mono text-xs text-dc-storm/60 ml-0.5">OBS</span>
        </div>
      </div>

      <h2 class="text-5xl md:text-[4rem] font-semibold tracking-tight text-dc-platinum leading-none mb-0 pr-[120px] flex items-center gap-3 cursor-pointer group" data-comp-action="toggleHud">
        ${racquet.name.replace(/\s+\d+g$/, ' ' + Math.round((racquet.strungWeight - 13) / 5) * 5 + 'g')}
        <span class="text-2xl text-dc-red opacity-50 group-hover:opacity-100 transition-opacity">&#9662;</span>
      </h2>

      <div class="flex items-center gap-2 mt-4 font-mono text-[13px] flex-wrap">
        <span class="text-dc-platinum">${racquet.year}</span>
        <span class="text-dc-accent opacity-60 text-[13px]">//</span>
        <span class="text-dc-storm uppercase tracking-[0.15em]">${racquet.identity || ''}</span>
      </div>

      ${racquet.notes ? `<p class="max-w-[650px] mt-6 text-sm leading-relaxed text-dc-storm">${racquet.notes}</p>` : ''}

      <div class="grid grid-cols-3 md:grid-cols-6 gap-8 w-full mt-12 pt-8 border-t border-dc-border">
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-platinum leading-none">${racquet.swingweight}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">SWINGWEIGHT</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-platinum leading-none">${racquet.stiffness}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">STIFFNESS</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-platinum leading-none">${racquet.pattern}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">PATTERN</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-platinum leading-none">${racquet.headSize}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">HEAD SIZE</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-platinum leading-none">${(racquet as any).balancePts}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">BALANCE</span>
        </div>
        <div class="flex flex-col-reverse gap-1.5">
          <span class="font-mono text-xl font-bold text-dc-platinum leading-none">${racquet.tensionRange[0]}-${racquet.tensionRange[1]}</span>
          <span class="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">TENSION</span>
        </div>
      </div>

      ${consoleHtml.length > 0 ? `<div class="flex flex-wrap gap-4 w-full mt-8 p-0">${consoleHtml.join('')}</div>` : ''}
    </div>

    <div class="bg-transparent border border-dc-storm/30 p-5 md:p-6 mb-10 flex flex-col gap-5">
      <div class="flex justify-between items-center border-b border-dc-storm/30 pb-3 mb-1">
        <span class="font-mono text-[13px] text-dc-accent uppercase tracking-[0.2em]">//STRING MODULATOR</span>
        <div class="flex gap-4">
          <button class="comp-inject-mode-btn text-dc-accent border-dc-accent border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors" data-mode="fullbed" data-comp-action="setInjectMode">Full Bed</button>
          <button class="comp-inject-mode-btn text-dc-storm border-transparent border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors" data-mode="hybrid" data-comp-action="setInjectMode">Hybrid</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div class="flex flex-col gap-3" id="comp-mains-col">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]" id="comp-mains-label">// STRING</span>
          <div id="comp-mains-select" class="comp-string-select-container"></div>
          <div class="grid grid-cols-2 gap-4">
            <select class="appearance-none bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%235E666C%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpolyline%20points=%276%209%2012%2015%2018%209%27%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-right pr-5 cursor-pointer" id="comp-mains-gauge">
              <option value="">Gauge...</option>
            </select>
            <input type="number" class="bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors" id="comp-mains-tension" value="52" min="30" max="70" step="1">
          </div>
        </div>

        <div class="flex flex-col gap-3" id="comp-crosses-col">
          <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]" id="comp-crosses-label">// CROSSES</span>
          <div id="comp-crosses-select" class="comp-string-select-container" style="display:none;"></div>
          <div class="grid grid-cols-2 gap-4">
            <select class="appearance-none bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%235E666C%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpolyline%20points=%276%209%2012%2015%2018%209%27%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-right pr-5 cursor-pointer" id="comp-crosses-gauge">
              <option value="">Gauge...</option>
            </select>
            <input type="number" class="bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors" id="comp-crosses-tension" value="50" min="30" max="70" step="1">
          </div>
        </div>
      </div>

      <div class="flex gap-2 mt-2">
        <button class="flex-1 font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-storm/50 text-dc-platinum hover:bg-dc-storm/20 hover:border-dc-storm transition-colors disabled:opacity-30 disabled:cursor-not-allowed" id="comp-inject-apply" disabled data-comp-action="applyInjection">Apply</button>
        <button class="font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-storm/50 text-dc-storm hover:bg-dc-storm/10 hover:text-dc-platinum hover:border-dc-storm transition-colors" data-comp-action="clearInjection">Clear</button>
      </div>
    </div>

    <div class="mb-12">
      <h3 class="font-mono text-xs tracking-[0.15em] text-dc-platinum uppercase mb-1">// BASE FRAME PROFILE</h3>
      <p class="text-xs text-dc-storm mb-6 italic">Frame-only characteristics before string influence</p>
      ${statsHtml}
    </div>

    <div class="mb-12">
      <div class="flex items-center justify-between mb-4 pb-2 border-b border-dc-border/50">
        <h3 class="font-mono text-xs tracking-[0.15em] text-dc-platinum uppercase">//TOP BUILDS</h3>
        <div class="flex gap-4 border-b border-transparent pb-0">${sortTabsHtml}</div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">${cardsHtml}</div>
    </div>
  `;

  _compInitStringInjector(racquet);
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
  mainsContainer.innerHTML = '';
  if (crossesContainer) crossesContainer.innerHTML = '';

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

  ssInstances['comp-mains-select'] = createSearchableSelect(mainsContainer, {
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
    ssInstances['comp-crosses-select'] = createSearchableSelect(crossesContainer, {
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

export function _compRenderPreviewBars(baseStats: SetupStats, previewStats: SetupStats): void {
  const statKeys = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability'] as const;
  const segments = 25;

  statKeys.forEach((k) => {
    const baseVal = baseStats[k] != null ? Math.round(baseStats[k]) : 50;
    const previewVal = previewStats[k] != null ? Math.round(previewStats[k]) : 50;
    const baseFilled = Math.round((baseVal / 100) * segments);
    const previewFilled = Math.round((previewVal / 100) * segments);
    const track = document.getElementById(`comp-track-${k}`);
    if (!track) return;
    const deltaDirection = previewVal > baseVal ? 'up' : previewVal < baseVal ? 'down' : null;
    _updateSegmentTrack(track, baseFilled, previewFilled, deltaDirection);
    (track as HTMLElement).dataset.hasPreview = 'true';

    const valEl = document.getElementById(`comp-val-${k}`);
    if (valEl) {
      const diff = previewVal - baseVal;
      let diffColor = 'text-dc-storm';
      if (diff > 0) diffColor = 'text-dc-red';
      if (diff < 0) diffColor = 'text-dc-accent';
      valEl.innerHTML = `<span class="text-dc-storm">${baseVal}</span><span class="text-dc-storm mx-1">&rarr;</span><span class="${diffColor}">${previewVal}</span>`;
    }
  });
}

export function _compClearPreview(): void {
  const { baseStats } = _compInjectState;
  if (!baseStats) return;
  const statKeys = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability'] as const;
  const segments = 25;

  statKeys.forEach((k) => {
    const baseVal = baseStats[k] != null ? Math.round(baseStats[k]) : 50;
    const baseFilled = Math.round((baseVal / 100) * segments);
    const track = document.getElementById(`comp-track-${k}`);
    if (track) {
      _updateSegmentTrack(track, baseFilled);
      delete (track as HTMLElement).dataset.hasPreview;
    }
    const valEl = document.getElementById(`comp-val-${k}`);
    if (valEl) valEl.innerHTML = `<span class="text-dc-platinum">${baseVal}</span>`;
  });

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
  delete ssInstances['comp-mains-select'];
  delete ssInstances['comp-crosses-select'];

  const mainsContainer = document.getElementById('comp-mains-select');
  const crossesContainer = document.getElementById('comp-crosses-select');
  if (mainsContainer) mainsContainer.innerHTML = '';
  if (crossesContainer) crossesContainer.innerHTML = '';

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

    ssInstances['comp-mains-select'] = createSearchableSelect(mainsContainer as HTMLElement, {
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
      ssInstances['comp-crosses-select'] = createSearchableSelect(crossesContainer, {
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

export function _compRenderBuildCard(build: BuildWithArchetype, index: number, _racquet: Racquet, frameStats: SetupStats): string {
  const isFeatured = index === 0;
  const cardClasses = isFeatured
    ? 'relative bg-transparent border border-dc-accent shadow-[0_0_15px_rgba(255,69,0,0.05)] p-5 flex flex-col transition-colors duration-200 col-span-full'
    : 'relative bg-transparent border border-dc-storm/30 hover:border-dc-storm p-5 flex flex-col transition-colors duration-200';
  const badgeHtml = isFeatured
    ? '<div class="absolute -top-[1px] -left-[1px] bg-dc-accent text-dc-ink font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">BEST OVERALL</div>'
    : '';
  const reasonHtml = isFeatured
    ? `<div class="text-xs text-dc-storm mb-4 pl-3 border-l-2 border-dc-storm italic">${_compGenerateBuildReason(build, frameStats)}</div>`
    : '';
  const isHybrid = build.type === 'hybrid';
  const stringLabel = isHybrid ? build.label || build.string.name : build.string.name;
  const metaLabel = isHybrid ? `Hybrid &middot; M:${build.tension} / X:${build.crossesTension}` : `Full Bed &middot; ${build.tension} lbs`;
  const s = build.stats;
  const statEntries = [
    { key: 'SPIN', val: Math.round(s.spin) },
    { key: 'PWR', val: Math.round(s.power) },
    { key: 'CTRL', val: Math.round(s.control) },
    { key: 'CMF', val: Math.round(s.comfort) },
    { key: 'FEEL', val: Math.round(s.feel) },
    { key: 'DUR', val: Math.round(s.durability) },
  ]
    .sort((a, b) => b.val - a.val)
    .slice(0, 3);
  const statsHtml = statEntries
    .map(
      (st) =>
        `<span class="font-mono text-[13px] text-dc-storm tracking-widest">[${st.key} <b class="text-xs text-dc-platinum font-semibold ml-0.5">${st.val}</b>]</span>`
    )
    .join('');

  return `
    <div class="${cardClasses}">
      ${badgeHtml}
      <div class="flex justify-between items-start my-1.5">
        <span class="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">${build.archetype}</span>
        <span class="font-mono text-4xl md:text-5xl font-semibold text-dc-platinum leading-[0.8] tracking-tighter">${build.score.toFixed(1)}</span>
      </div>
      <div class="text-base font-semibold text-dc-platinum tracking-tight mb-0.5 pr-12 leading-tight">${stringLabel}</div>
      <div class="font-mono text-[12px] text-dc-storm mb-4">${metaLabel}</div>
      ${reasonHtml}
      <div class="grid grid-cols-3 gap-2 mt-auto mb-4">
        <button class="bg-transparent border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink font-mono text-[13px] uppercase tracking-widest py-1.5 transition-colors text-center" data-comp-action="buildAction" data-action-name="setActive" data-index="${index}">Set Active</button>
        <button class="bg-transparent border border-dc-storm/50 dark:border-dc-storm/30 text-dc-storm hover:border-dc-storm hover:bg-dc-storm/10 hover:text-dc-platinum font-mono text-[13px] uppercase tracking-widest py-1.5 transition-colors text-center" data-comp-action="buildAction" data-action-name="tune" data-index="${index}">Tune</button>
        <button class="bg-transparent border border-dc-storm/50 dark:border-dc-storm/30 text-dc-storm hover:border-dc-storm hover:bg-dc-storm/10 hover:text-dc-platinum font-mono text-[13px] uppercase tracking-widest py-1.5 transition-colors text-center" data-comp-action="buildAction" data-action-name="save" data-index="${index}">Save</button>
      </div>
      <div class="flex flex-wrap gap-3 pt-3 border-t border-dc-storm/30 dark:border-dc-storm/20">${statsHtml}</div>
    </div>
  `;
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
