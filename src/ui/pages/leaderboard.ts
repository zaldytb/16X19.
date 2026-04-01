// ============================================
// LEADERBOARD v2 — "What's the best racket for X?"
// ============================================
// Simple UX: pick a stat → see ranked frames at their best string pairing
// No archetypes, no weight vectors, no slider.
// The question is: "I want [spin/power/control/etc] — what frame?"
//
// Depends on: RACQUETS, STRINGS, predictSetup, computeCompositeScore,
//             buildTensionContext, generateIdentity,
//             createLoadout, activateLoadout, switchMode

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RACQUETS, STRINGS } from '../../data/loader.js';
import {
  predictSetup,
  computeCompositeScore,
  buildTensionContext,
  generateIdentity,
  calcFrameBase,
  calcBaseStringProfile,
} from '../../engine/index.js';
import { LeaderboardBuildResults } from '../../components/leaderboard/LeaderboardBuildResults.js';
import { LeaderboardFrameResults } from '../../components/leaderboard/LeaderboardFrameResults.js';
import { LeaderboardStringResults } from '../../components/leaderboard/LeaderboardStringResults.js';
import type { LbBuildResultInput } from '../../components/leaderboard/leaderboard-results-vm.js';
import {
  buildLeaderboardBuildRows,
  buildLeaderboardFrameRows,
  buildLeaderboardStringRows,
} from '../../components/leaderboard/leaderboard-results-vm.js';
import { LeaderboardShell } from '../../components/leaderboard/LeaderboardShell.js';
import {
  buildLeaderboardShellVm,
  type LbShellStatOptionVm,
  type LeaderboardShellVm,
} from '../../components/leaderboard/leaderboard-shell-vm.js';
import { createLoadout } from '../../state/loadout.js';
import { activateLoadout, switchMode } from '../pages/shell.js';
import { addLoadoutToNextAvailableSlot } from './compare/compare-slot-api.js';
import { initCompendium, _compSelectFrame, _compSwitchTab } from '../pages/compendium.js';
import { _stringSelectString } from '../pages/strings.js';
import {
  getCachedValue,
  measurePerformance,
  scheduleRender,
} from '../../utils/performance-runtime.js';

import type {
  Racquet,
  StringData,
  StringConfig,
  SetupStats,
  FrameBaseScores,
  StringProfileScores,
  TensionContext,
  IdentityResult,
} from '../../engine/types.js';

interface Lbv2State {
  statKey: string;
  filterType: 'both' | 'full' | 'hybrid';
  viewMode: 'builds' | 'frames' | 'strings';
  frameFilters: {
    brand: string;
    pattern: string;
    headSize: string;
    weight: string;
    stiffness: string;
    year: string;
  };
  stringFilters: {
    brand: string;
    material: string;
    shape: string;
    gauge: string;
    stiffness: string;
  };
  results: unknown;
  loading: boolean;
  initialized: boolean;
}

// Local state for compendium tracking (avoids circular import issues)
let _lbv2CompendiumInitialized = false;

let _lbv2State: Lbv2State = {
  statKey:     'obs',     // which stat (or 'obs') to rank by
  filterType:  'both',    // 'both' | 'full' | 'hybrid'
  viewMode:    'builds',  // 'builds' | 'frames' | 'strings'
  // Frame-specific filters (applies to Frames tab only)
  frameFilters: {
    brand:     '',
    pattern:   '',
    headSize:  '',
    weight:    '',
    stiffness: '',
    year:      '',
  },
  // String-specific filters (applies to Strings tab only)
  stringFilters: {
    brand:     '',   // e.g. 'Babolat', 'Solinco', 'Luxilon'
    material:  '',   // e.g. 'Polyester', 'Natural Gut'
    shape:     '',   // e.g. 'Round', 'Pentagon', 'Hexagonal'
    gauge:     '',   // 'thin' | 'mid' | 'thick'
    stiffness: '',   // 'soft' | 'medium' | 'stiff'
  },
  results:     null,
  loading:     false,
  initialized: false,
};
let _lbv2ShellMounted = false;
let _lbv2RunToken = 0;

const LB_BUILD_RESULTS_HOST_ID = 'lb2-build-results-react';
const LB_FRAME_RESULTS_HOST_ID = 'lb2-frame-results-react';
const LB_STRING_RESULTS_HOST_ID = 'lb2-string-results-react';

type LbResultsReactMount = { root: Root | null; host: HTMLElement | null };

const _lbBuildResultsMount: LbResultsReactMount = { root: null, host: null };
const _lbFrameResultsMount: LbResultsReactMount = { root: null, host: null };
const _lbStringResultsMount: LbResultsReactMount = { root: null, host: null };
const _lbShellMount: LbResultsReactMount = { root: null, host: null };

function _ensureLbResultsReactRoot(mount: LbResultsReactMount, container: HTMLElement | null): Root | null {
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

function _unmountLbResultsReactMount(mount: LbResultsReactMount): void {
  if (mount.root) {
    mount.root.unmount();
    mount.root = null;
    mount.host = null;
  }
}

function _lbUnmountAllResultsReact(): void {
  _unmountLbResultsReactMount(_lbBuildResultsMount);
  _unmountLbResultsReactMount(_lbFrameResultsMount);
  _unmountLbResultsReactMount(_lbStringResultsMount);
}

function _ensureLbShellReactRoot(container: HTMLElement | null): Root | null {
  return _ensureLbResultsReactRoot(_lbShellMount, container);
}

function _unmountLbShellReact(): void {
  _unmountLbResultsReactMount(_lbShellMount);
}

function _lbDefaultLeaderboardPanelHtml(): string {
  return `
    <div class="flex flex-col min-h-full">
      <div id="lb2-shell-react-root"></div>
      <div class="flex-1" id="lb2-results">
        <div class="flex flex-col items-center justify-center py-16 gap-4">
          <div class="w-7 h-7 border-2 border-dc-storm/30 border-t-dc-accent rounded-full animate-spin"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.15em] text-dc-storm">Computing…</span>
        </div>
      </div>
    </div>`;
}

function _lbShellVm(): LeaderboardShellVm {
  return buildLeaderboardShellVm(
    {
      statKey: _lbv2State.statKey,
      filterType: _lbv2State.filterType,
      viewMode: _lbv2State.viewMode,
      frameFilters: { ..._lbv2State.frameFilters },
      stringFilters: { ..._lbv2State.stringFilters },
    },
    LB_STATS as LbShellStatOptionVm[],
  );
}

function _lbRenderShellReact(): void {
  const host = document.getElementById('lb2-shell-react-root');
  const root = _ensureLbShellReactRoot(host);
  root?.render(createElement(LeaderboardShell, { vm: _lbShellVm() }));
}

// ── Stat options shown to the user ───────────────────────────────────────────

interface StatOption {
  key: string;
  label: string;
  icon: string;
  desc: string;
}

const LB_STATS: StatOption[] = [
  { key: 'obs',            label: 'Best Overall',  icon: '🏆', desc: 'Highest total build score' },
  { key: 'spin',           label: 'Most Spin',     icon: '🌀', desc: 'Maximum topspin potential' },
  { key: 'power',          label: 'Most Power',    icon: '💥', desc: 'Hardest hitting setups'    },
  { key: 'control',        label: 'Most Control',  icon: '🎯', desc: 'Precision & placement'     },
  { key: 'comfort',        label: 'Most Comfort',  icon: '🩹', desc: 'Arm-friendly, low vibration'},
  { key: 'feel',           label: 'Best Feel',     icon: '🤌', desc: 'Touch & ball connection'   },
  { key: 'maneuverability',label: 'Most Maneuverable', icon: '⚡', desc: 'Fast swing, reactive' },
  { key: 'stability',      label: 'Most Stable',   icon: '🪨', desc: 'Plow-through, twist resist'},
  { key: 'durability',     label: 'Most Durable',  icon: '🔩', desc: 'Long-lasting strings'      },
];

// ── Entry point ───────────────────────────────────────────────────────────────

const LEADERBOARD_ROOT_ID = 'comp-leaderboard-root';

function initLeaderboard(): void {
  _lbv2State.initialized = true;
  const panel = document.getElementById(LEADERBOARD_ROOT_ID);
  if (!panel) return;
  const shellMounted = !!panel.querySelector('#lb2-results');
  if (!_lbv2ShellMounted || !shellMounted) {
    panel.innerHTML = _lbDefaultLeaderboardPanelHtml();
    _lbv2ShellMounted = true;
  }
  _syncLbv2Shell();
  _runLbv2();
  _bindLeaderboardDelegates();
}

let _lbDelegateBound = false;

function _bindLeaderboardDelegates(): void {
  if (_lbDelegateBound) return;
  _lbDelegateBound = true;

  // Click delegation — stat pills, view-mode tabs, clear buttons, action btns
  document.addEventListener('click', (e: Event) => {
    const el = (e.target as Element).closest('[data-lb-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.lbAction!;
    const arg = el.dataset.lbArg;

    switch (action) {
      case 'setStat':
        if (arg) _lbv2SetStat(arg);
        break;
      case 'setFilter':
        if (arg === 'both' || arg === 'full' || arg === 'hybrid') _lbv2SetFilter(arg);
        break;
      case 'setView':
        if (arg === 'builds' || arg === 'frames' || arg === 'strings') _lbv2SetView(arg);
        break;
      case 'clearFrameFilters':
        _lbv2ClearFrameFilters();
        break;
      case 'clearStringFilters':
        _lbv2ClearStringFilters();
        break;
      case 'view':
        _lbv2View(
          el.dataset.racquetId ?? '',
          el.dataset.stringId ?? '',
          parseInt(el.dataset.tension ?? '0', 10),
          el.dataset.type ?? 'full',
          el.dataset.mainsId ?? '',
          el.dataset.crossesId ?? '',
          parseInt(el.dataset.crossesTension ?? '0', 10)
        );
        break;
      case 'compare':
        _lbv2Compare(
          el.dataset.racquetId ?? '',
          el.dataset.stringId ?? '',
          parseInt(el.dataset.tension ?? '0', 10),
          el.dataset.type ?? 'full',
          el.dataset.mainsId ?? '',
          el.dataset.crossesId ?? '',
          parseInt(el.dataset.crossesTension ?? '0', 10)
        );
        break;
      case 'viewFrame':
        if (el.dataset.racquetId) _lbv2ViewFrame(el.dataset.racquetId);
        break;
      case 'viewString':
        if (el.dataset.stringId) _lbv2ViewString(el.dataset.stringId);
        break;
    }
  });

  // Change delegation — frame/string filter selects
  document.addEventListener('change', (e: Event) => {
    const el = e.target as HTMLElement;
    const action = el.dataset.lbAction;
    const arg = el.dataset.lbArg;
    if (action === 'setFrameFilter' && arg) {
      _lbv2SetFrameFilter(arg);
    } else if (action === 'setStringFilter' && arg) {
      _lbv2SetStringFilter(arg);
    }
  });
}

// ── Shell (React: LeaderboardShell in #lb2-shell-react-root; results in #lb2-results) ──

function _syncLbv2Shell(): void {
  const panel = document.getElementById(LEADERBOARD_ROOT_ID);
  if (!panel) return;
  if (!panel.querySelector('#lb2-results') || !panel.querySelector('#lb2-shell-react-root')) {
    panel.innerHTML = _lbDefaultLeaderboardPanelHtml();
  }
  _lbRenderShellReact();
}

// ── State setters ─────────────────────────────────────────────────────────────

function _lbv2SetStat(key: string): void {
  if (_lbv2State.statKey === key) return;
  _lbv2State.statKey = key;
  _lbv2State.results = null;
  _syncLbv2Shell();
  _runLbv2();
}

function _lbv2SetFilter(filterType: 'both' | 'full' | 'hybrid'): void {
  if (_lbv2State.filterType === filterType) return;
  _lbv2State.filterType = filterType;
  _lbv2State.results = null;
  // Re-render shell to update type pills, then run
  _syncLbv2Shell();
  _runLbv2();
}

function _lbv2SetView(viewMode: 'builds' | 'frames' | 'strings'): void {
  if (_lbv2State.viewMode === viewMode) return;
  _lbv2State.viewMode = viewMode;
  _lbv2State.results = null;
  // Re-render shell (type filter visibility changes), then run
  _syncLbv2Shell();
  _runLbv2();
}

function _lbv2SetFrameFilter(key: string): void {
  const el = document.getElementById('lb2-ff-' + key);
  if (!el) return;
  ((_lbv2State.frameFilters as Record<string, string>)[key]) = (el as HTMLSelectElement).value;
  _lbv2State.results = null;
  // Re-render shell to update Clear button visibility, then run
  _syncLbv2Shell();
  _runLbv2();
}

function _lbv2ClearFrameFilters(): void {
  _lbv2State.frameFilters = { brand: '', pattern: '', headSize: '', weight: '', stiffness: '', year: '' };
  _lbv2State.results = null;
  _syncLbv2Shell();
  _runLbv2();
}

function _lbv2SetStringFilter(key: string): void {
  const el = document.getElementById('lb2-sf-' + key);
  if (!el) return;
  ((_lbv2State.stringFilters as Record<string, string>)[key]) = (el as HTMLSelectElement).value;
  _lbv2State.results = null;
  _syncLbv2Shell();
  _runLbv2();
}

function _lbv2ClearStringFilters(): void {
  _lbv2State.stringFilters = { brand: '', material: '', shape: '', gauge: '', stiffness: '' };
  _lbv2State.results = null;
  _syncLbv2Shell();
  _runLbv2();
}

// ── Main runner ───────────────────────────────────────────────────────────────

function _runLbv2(): void {
  const resultsEl = document.getElementById('lb2-results');
  if (!resultsEl) return;
  const runToken = ++_lbv2RunToken;

  _lbUnmountAllResultsReact();

  const statMeta = LB_STATS.find(s => s.key === _lbv2State.statKey);
  resultsEl.innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 gap-4">
      <div class="w-7 h-7 border-2 border-dc-storm/30 border-t-dc-accent rounded-full animate-spin"></div>
      <span class="font-mono text-[10px] uppercase tracking-[0.15em] text-dc-storm">
        Computing ${statMeta?.label || ''}…
      </span>
    </div>`;

  scheduleRender('leaderboard:run', () => setTimeout(() => {
    if (runToken !== _lbv2RunToken) return;
    try {
      let results: unknown[];
      if (_lbv2State.viewMode === 'frames') {
        results = measurePerformance('leaderboard ranking generation', () => _computeLbv2Frames());
      } else if (_lbv2State.viewMode === 'strings') {
        results = measurePerformance('leaderboard ranking generation', () => _computeLbv2Strings());
      } else {
        results = measurePerformance('leaderboard ranking generation', () => _computeLbv2Results());
      }
      _lbv2State.results = results;

      const countEl = document.getElementById('lb2-count');
      if (countEl) countEl.textContent = `${results.length} ${_lbv2State.viewMode}`;

      if (_lbv2State.viewMode === 'frames') {
        _renderLbv2Frames(results as FrameResult[]);
      } else if (_lbv2State.viewMode === 'strings') {
        _renderLbv2Strings(results as StringResult[]);
      } else {
        _renderLbv2Results(results as BuildResult[]);
      }
    } catch (err) {
      if (resultsEl) {
        _lbUnmountAllResultsReact();
        resultsEl.innerHTML = `
        <div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-red/70">
          Error: ${(err as Error).message}
        </div>`;
      }
      console.error('Leaderboard error:', err);
    }
  }, 16));
}

// ── Result types ──────────────────────────────────────────────────────────────

interface BuildConfig {
  isHybrid: boolean;
  string?: StringData;
  mains?: StringData;
  crosses?: StringData;
  mainsTension: number;
  crossesTension: number;
}

interface BestResult {
  score: number;
  statVal: number;
  obs: number;
  tension: number;
  stats: SetupStats | null;
  cfg: BuildConfig;
}

export interface BuildResult {
  type: 'full' | 'hybrid';
  racquet: Racquet;
  string: StringData | null;
  mains: StringData | null;
  crosses: StringData | null;
  tension: number;
  crossesTension: number;
  stats: SetupStats;
  obs: number;
  rankVal: number;
  statKey: string;
  identity: IdentityResult;
  frameLabel: string;
  stringLabel: string;
}

interface FrameResult {
  racquet: Racquet;
  frameBase: FrameBaseScores;
  rankVal: number;
  statKey: string;
  frameLabel: string;
}

interface StringResult {
  string: StringData;
  profile: StringProfileScores;
  rankVal: number;
  statKey: string;
}

// ── Computation ───────────────────────────────────────────────────────────────

function _computeLbv2Results(): BuildResult[] {
  const statKey    = _lbv2State.statKey;
  const filterType = _lbv2State.filterType;
  return getCachedValue(`lb:builds:${statKey}:${filterType}`, () => {
  const candidates: BuildResult[] = [];

  // Helper: find optimal tension for a config and return its stat value
  function scoreConfig(racquet: Racquet, cfg: Omit<BuildConfig, 'mainsTension' | 'crossesTension'>): BestResult {
    const sweepMin = Math.max(racquet.tensionRange[0] - 3, 30);
    const sweepMax = Math.min(racquet.tensionRange[1] + 3, 70);
    let best: BestResult = { score: -1, statVal: 0, obs: 0, tension: 53, stats: null, cfg: { ...cfg, mainsTension: 53, crossesTension: 51 } };

    for (let t = sweepMin; t <= sweepMax; t += 2) {
      const c: BuildConfig = Object.assign({}, cfg, {
        mainsTension: t,
        crossesTension: cfg.isHybrid ? t - 2 : t,
      });
      const stats = predictSetup(racquet, c as StringConfig);
      if (!stats) continue;
      const tCtx  = buildTensionContext(c as StringConfig, racquet);
      const obs   = computeCompositeScore(stats, tCtx);
      const rankVal = statKey === 'obs' ? obs : ((stats as unknown as Record<string, number>)[statKey] || 0);
      if (rankVal > best.score) {
        best = { score: rankVal, statVal: statKey === 'obs' ? obs : ((stats as unknown as Record<string, number>)[statKey] || 0), obs, tension: t, stats, cfg: c };
      }
    }
    return best;
  }

  // ── Full-bed candidates ───────────────────────────────────────────────────
  if (filterType !== 'hybrid') {
    (RACQUETS as unknown as Racquet[]).forEach((racquet: Racquet) => {
      (STRINGS as StringData[]).forEach((str: StringData) => {
        const cfg = { isHybrid: false, string: str };
        const best = scoreConfig(racquet, cfg);
        if (!best.stats) return;

        candidates.push({
          type:        'full',
          racquet,
          string:      str,
          mains:       null,
          crosses:     null,
          tension:     best.tension,
          crossesTension: best.tension,
          stats:       best.stats,
          obs:         +best.obs.toFixed(1),
          rankVal:     best.score,
          statKey,
          identity:    generateIdentity(best.stats, racquet, best.cfg as StringConfig),
          frameLabel:  racquet.name,
          stringLabel: str.name,
        });
      });
    });
  }

  // ── Hybrid candidates ─────────────────────────────────────────────────────
  if (filterType !== 'full') {
    // Top 12 full-bed strings per racquet + gut/multi as mains candidates
    // Cross pool: slick/round/elastic polys
    const crossPool = (STRINGS as StringData[]).filter((s: StringData) => {
      const shape = (s.shape || '').toLowerCase();
      return shape.includes('round') || shape.includes('slick') ||
             shape.includes('coated') || s.material === 'Co-Polyester (elastic)' ||
             (s.material === 'Polyester' && s.stiffness < 195);
    });

    // Smart mains set: top strings overall + always gut/multi
    const globalFull: Array<{id: string; score: number}> = [];
    (STRINGS as StringData[]).forEach((s: StringData) => {
      const cfg  = { isHybrid: false, string: s };
      const mid  = 53;
      const sc   = predictSetup((RACQUETS as unknown as Racquet[])[0], Object.assign({}, cfg, { mainsTension: mid, crossesTension: mid }) as StringConfig);
      if (sc) globalFull.push({ id: s.id, score: (sc as unknown as Record<string, number>)[statKey] || computeCompositeScore(sc, null as unknown as TensionContext) || 0 });
    });
    globalFull.sort((a, b) => b.score - a.score);
    const topMainsIds = new Set(globalFull.slice(0, 12).map(x => x.id));
    (STRINGS as StringData[]).forEach((s: StringData) => {
      if (s.material === 'Natural Gut' || s.material === 'Multifilament') {
        topMainsIds.add(s.id);
      }
    });

    (RACQUETS as unknown as Racquet[]).forEach((racquet: Racquet) => {
      topMainsIds.forEach(mainsId => {
        const mains = (STRINGS as StringData[]).find((s: StringData) => s.id === mainsId);
        if (!mains) return;
        crossPool.forEach((cross: StringData) => {
          if (cross.id === mains.id) return;
          const cfg = { isHybrid: true, mains, crosses: cross };
          const best = scoreConfig(racquet, cfg);
          if (!best.stats) return;

          candidates.push({
            type:          'hybrid',
            racquet,
            string:        mains,
            mains,
            crosses:       cross,
            tension:       best.tension,
            crossesTension: best.tension - 2,
            stats:         best.stats,
            obs:           +best.obs.toFixed(1),
            rankVal:       best.score,
            statKey,
            identity:      generateIdentity(best.stats, racquet, best.cfg as StringConfig),
            frameLabel:    racquet.name,
            stringLabel:   mains.name + ' / ' + cross.name,
          });
        });
      });
    });
  }

  // Sort by rankVal desc, then deduplicate (keep best per frame×string key)
  candidates.sort((a, b) => b.rankVal - a.rankVal);

  const seen = new Set<string>();
  const deduped: BuildResult[] = [];
  for (const c of candidates) {
    const key = c.racquet.id + '|' + (c.type === 'hybrid'
      ? c.mains!.id + '/' + c.crosses!.id
      : c.string!.id);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
    if (deduped.length >= 60) break;
  }

  return deduped;
  });
}

// ── Results renderer (pure Tailwind) ─────────────────────────────────────────

function _renderLbv2Results(results: BuildResult[]): void {
  const resultsEl = document.getElementById('lb2-results');
  if (!resultsEl) return;

  _lbUnmountAllResultsReact();

  if (!results || results.length === 0) {
    resultsEl.innerHTML = `
      <div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-storm">
        No results — try a different filter.
      </div>`;
    return;
  }

  const statMeta = LB_STATS.find(s => s.key === _lbv2State.statKey) || LB_STATS[0];
  const isObs = _lbv2State.statKey === 'obs';
  const statLabel = isObs ? 'OBS' : statMeta.label.replace('Most ', '').replace('Best ', '');

  resultsEl.innerHTML = `<div id="${LB_BUILD_RESULTS_HOST_ID}"></div>`;
  const host = document.getElementById(LB_BUILD_RESULTS_HOST_ID);
  const root = _ensureLbResultsReactRoot(_lbBuildResultsMount, host);
  if (!root) return;

  const rows = buildLeaderboardBuildRows(results as LbBuildResultInput[], _lbv2State.statKey);
  root.render(
    createElement(LeaderboardBuildResults, {
      rows,
      primaryStatColumnLabel: statLabel,
      isObs,
      footerLeft: `${results.length} builds scored · best setup per frame×string at optimal tension`,
      footerIcon: statMeta.icon,
      footerDesc: statMeta.desc,
    }),
  );
}

// ── Frames-only computation ───────────────────────────────────────────────────
// Ranks frames by their base physics stats — no string, no tension.
// Uses calcFrameBase() directly. Stable sort, all 263 frames.

function _computeLbv2Frames(): FrameResult[] {
  const statKey = _lbv2State.statKey;
  const ff      = _lbv2State.frameFilters;
  return getCachedValue(`lb:frames:${statKey}:${Object.values(ff).join('|')}`, () => {

  // Apply filters
  const filtered = (RACQUETS as unknown as Racquet[]).filter(function(r: Racquet) {
    if (ff.brand && !r.name.startsWith(ff.brand)) return false;
    if (ff.pattern && r.pattern !== ff.pattern) return false;
    if (ff.headSize) {
      if (ff.headSize === '102+' && r.headSize < 102) return false;
      if (ff.headSize !== '102+' && r.headSize !== parseInt(ff.headSize)) return false;
    }
    if (ff.weight) {
      const w = r.strungWeight;
      if (ff.weight === 'ultralight' && w >= 285) return false;
      if (ff.weight === 'light'      && (w < 285 || w >= 305)) return false;
      if (ff.weight === 'medium'     && (w < 305 || w >= 320)) return false;
      if (ff.weight === 'heavy'      && (w < 320 || w >= 340)) return false;
      if (ff.weight === 'tour'       && w < 340) return false;
    }
    if (ff.stiffness) {
      const ra = r.stiffness;
      if (ff.stiffness === 'soft'   && ra > 59) return false;
      if (ff.stiffness === 'medium' && (ra < 60 || ra > 65)) return false;
      if (ff.stiffness === 'stiff'  && ra < 66) return false;
    }
    if (ff.year) {
      const rYear = r.year as number;
      if (ff.year === 'older' && rYear > 2023) return false;
      if (ff.year !== 'older' && rYear !== parseInt(ff.year)) return false;
    }
    return true;
  });

  return filtered.map(function(racquet: Racquet): FrameResult {
    const frameBase = calcFrameBase(racquet);
    const fb = frameBase as unknown as Record<string, number>;
    const frameObs: number | null = statKey === 'obs'
      ? Math.round((
          (fb.spin || 0) * 0.15 +
          (fb.power || 0) * 0.12 +
          (fb.control || 0) * 0.18 +
          (fb.comfort || 0) * 0.12 +
          (fb.feel || 0) * 0.10 +
          (fb.stability || 0) * 0.12 +
          (fb.forgiveness || 0) * 0.08 +
          (fb.maneuverability || 0) * 0.08 +
          (fb.launch || 0) * 0.05
        ))
      : null;

    const rankVal = statKey === 'obs' ? frameObs! : Math.round(fb[statKey] || 0);

    return { racquet, frameBase, rankVal, statKey, frameLabel: racquet.name };
  })
  .filter(function(e: FrameResult) { return e.rankVal != null; })
  .sort(function(a: FrameResult, b: FrameResult) { return b.rankVal - a.rankVal; })
  .slice(0, 60);
  });
}

function _renderLbv2Frames(results: FrameResult[]): void {
  const resultsEl = document.getElementById('lb2-results');
  if (!resultsEl) return;

  _lbUnmountAllResultsReact();

  if (!results || results.length === 0) {
    resultsEl.innerHTML = `<div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-storm">No results.</div>`;
    return;
  }

  const statMeta = LB_STATS.find(s => s.key === _lbv2State.statKey) || LB_STATS[0];
  const statLabel = _lbv2State.statKey === 'obs' ? 'Score' : statMeta.label.replace('Most ', '').replace('Best ', '');

  const contextStats = ['spin', 'power', 'control', 'comfort', 'stability', 'maneuverability']
    .filter(k => k !== _lbv2State.statKey)
    .slice(0, 4);

  resultsEl.innerHTML = `<div id="${LB_FRAME_RESULTS_HOST_ID}"></div>`;
  const host = document.getElementById(LB_FRAME_RESULTS_HOST_ID);
  const root = _ensureLbResultsReactRoot(_lbFrameResultsMount, host);
  if (!root) return;

  const rows = buildLeaderboardFrameRows(results, contextStats);
  root.render(
    createElement(LeaderboardFrameResults, {
      rows,
      primaryStatColumnLabel: statLabel,
      footerLeft: `${results.length} frames · base physics, no string interaction`,
      footerIcon: statMeta.icon,
      footerDesc: statMeta.desc,
    }),
  );
}

// ── Strings-only computation ──────────────────────────────────────────────────
// Ranks strings by their intrinsic profile — no frame, no tension.
// Uses calcBaseStringProfile() which maps twScore + physical props to stats.

function _computeLbv2Strings(): StringResult[] {
  const statKey = _lbv2State.statKey;
  const sf      = _lbv2State.stringFilters;
  return getCachedValue(`lb:strings:${statKey}:${Object.values(sf).join('|')}`, () => {

  // Apply filters
  const filtered = (STRINGS as StringData[]).filter(function(s: StringData) {
    if (sf.brand && !s.name.startsWith(sf.brand)) return false;
    if (sf.material && s.material !== sf.material) return false;
    if (sf.shape) {
      const shape = (s.shape || '').toLowerCase();
      if (!shape.includes(sf.shape)) return false;
    }
    if (sf.gauge) {
      const g = (s as unknown as Record<string, number>).gaugeNum || 1.25;
      if (sf.gauge === 'thin'  && g > 1.20) return false;
      if (sf.gauge === 'mid'   && (g <= 1.20 || g >= 1.28)) return false;
      if (sf.gauge === 'thick' && g < 1.28) return false;
    }
    if (sf.stiffness) {
      const st = s.stiffness || 200;
      if (sf.stiffness === 'soft'   && st >= 180) return false;
      if (sf.stiffness === 'medium' && (st < 180 || st > 215)) return false;
      if (sf.stiffness === 'stiff'  && st <= 215) return false;
    }
    return true;
  });

  return filtered.map(function(str: StringData): StringResult {
    const profile = calcBaseStringProfile(str);
    const p = profile as unknown as Record<string, number>;
    const twScore = (str as unknown as Record<string, Record<string, number>>).twScore;

    const strObs: number | null = statKey === 'obs'
      ? Math.round(
          (p.spin || 0)        * 0.15 +
          (p.power || 0)       * 0.12 +
          (p.control || 0)     * 0.18 +
          (p.comfort || 0)     * 0.13 +
          (p.feel || 0)        * 0.12 +
          (p.durability || 0)  * 0.15 +
          (p.playability || 0) * 0.15
        )
      : null;

    const rankVal = statKey === 'obs' ? strObs! : Math.round(p[statKey] || (twScore?.[statKey] || 0));

    return { string: str, profile, rankVal, statKey };
  })
  .filter(function(e: StringResult) { return e.rankVal != null && e.rankVal > 0; })
  .sort(function(a: StringResult, b: StringResult) { return b.rankVal - a.rankVal; })
  .slice(0, 60);
  });
}

function _renderLbv2Strings(results: StringResult[]): void {
  const resultsEl = document.getElementById('lb2-results');
  if (!resultsEl) return;

  _lbUnmountAllResultsReact();

  if (!results || results.length === 0) {
    resultsEl.innerHTML = `<div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-storm">No results.</div>`;
    return;
  }

  const statMeta = LB_STATS.find(s => s.key === _lbv2State.statKey) || LB_STATS[0];
  const statLabel = _lbv2State.statKey === 'obs' ? 'Score' : statMeta.label.replace('Most ', '').replace('Best ', '');

  const contextStats = ['spin', 'power', 'control', 'comfort', 'feel', 'durability', 'playability']
    .filter(k => k !== _lbv2State.statKey)
    .slice(0, 4);

  resultsEl.innerHTML = `<div id="${LB_STRING_RESULTS_HOST_ID}"></div>`;
  const host = document.getElementById(LB_STRING_RESULTS_HOST_ID);
  const root = _ensureLbResultsReactRoot(_lbStringResultsMount, host);
  if (!root) return;

  const rows = buildLeaderboardStringRows(results, contextStats);
  root.render(
    createElement(LeaderboardStringResults, {
      rows,
      primaryStatColumnLabel: statLabel,
      footerLeft: `${results.length} strings · intrinsic profile, no frame interaction`,
      footerIcon: statMeta.icon,
      footerDesc: statMeta.desc,
    }),
  );
}


function _lbv2View(racquetId: string, stringId: string, tension: number, type: string, mainsId: string, crossesId: string, crossesTension: number): void {
  const opts: Record<string, unknown> = { source: 'leaderboard' };
  if (type === 'hybrid') {
    opts.isHybrid = true;
    opts.mainsId = mainsId;
    opts.crossesId = crossesId;
    opts.crossesTension = crossesTension;
  }
  const lo = createLoadout(racquetId, type === 'hybrid' ? mainsId : stringId, tension, opts);
  if (lo) { activateLoadout(lo); switchMode('overview'); }
}

function _lbv2ViewFrame(racquetId: string): void {
  // Navigate to Racket Bible and select the frame
  if (!_lbv2CompendiumInitialized) {
    initCompendium();
    _lbv2CompendiumInitialized = true;
  }
  _compSelectFrame(racquetId);
  _compSwitchTab('rackets');
}

function _lbv2ViewString(stringId: string): void {
  _compSwitchTab('strings');
  setTimeout(function() { _stringSelectString(stringId); }, 120);
}

function _lbv2ShowCompareWarning(message: string): void {
  const existing = document.getElementById('lbv2-compare-warning');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'lbv2-compare-warning';
  overlay.className = 'fixed inset-0 z-[1200] flex items-center justify-center bg-dc-void/75 px-4';
  overlay.innerHTML = `
    <div class="w-full max-w-md border border-dc-storm/40 bg-white dark:bg-dc-void-lift shadow-2xl">
      <div class="border-b border-dc-storm/20 px-5 py-4">
        <div class="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-dc-red">Compare Full</div>
      </div>
      <div class="px-5 py-4">
        <p class="text-[13px] leading-6 text-dc-platinum">${message}</p>
      </div>
      <div class="flex justify-end border-t border-dc-storm/20 px-5 py-4">
        <button
          type="button"
          class="border border-dc-storm/40 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-dc-storm hover:border-dc-storm hover:text-dc-platinum transition-colors"
          id="lbv2-compare-warning-close"
        >OK</button>
      </div>
    </div>
  `;

  function closeDialog(): void {
    overlay.remove();
    document.removeEventListener('keydown', onKeydown);
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Enter') {
      closeDialog();
    }
  }

  overlay.addEventListener('click', function(event: Event) {
    if (event.target === overlay) closeDialog();
  });
  overlay.querySelector('#lbv2-compare-warning-close')?.addEventListener('click', closeDialog);
  document.addEventListener('keydown', onKeydown);
  document.body.appendChild(overlay);
}

function _lbv2Compare(racquetId: string, stringId: string, tension: number, type: string, mainsId: string, crossesId: string, crossesTension: number): void {
  const opts: Record<string, unknown> = { source: 'leaderboard' };
  if (type === 'hybrid') {
    opts.isHybrid = true;
    opts.mainsId = mainsId;
    opts.crossesId = crossesId;
    opts.crossesTension = crossesTension;
  }

  const loadout = createLoadout(racquetId, type === 'hybrid' ? mainsId : stringId, tension, opts);
  if (!loadout) return;

  const slotId = addLoadoutToNextAvailableSlot(loadout);
  if (!slotId) {
    _lbv2ShowCompareWarning('All 3 compare slots are already filled. Remove one of the existing builds before adding a leaderboard result.');
    return;
  }

  switchMode('compare');
}

export function cleanupLeaderboardPage(): void {
  _lbUnmountAllResultsReact();
  _unmountLbShellReact();
  const root = document.getElementById(LEADERBOARD_ROOT_ID);
  if (root) root.innerHTML = '';
  _lbv2ShellMounted = false;
}

export { initLeaderboard };
