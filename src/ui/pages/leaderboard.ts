// ============================================
// LEADERBOARD v2 — "What's the best racket for X?"
// ============================================
// Simple UX: pick a stat → see ranked frames at their best string pairing
// No archetypes, no weight vectors, no slider.
// The question is: "I want [spin/power/control/etc] — what frame?"
//
// Depends on: RACQUETS, STRINGS, predictSetup, computeCompositeScore,
//             buildTensionContext, generateIdentity, getObsScoreColor,
//             createLoadout, activateLoadout, switchMode

import { RACQUETS, STRINGS } from '../../data/loader.js';
import {
  predictSetup,
  computeCompositeScore,
  buildTensionContext,
  generateIdentity,
  getObsScoreColor,
  calcFrameBase,
  calcBaseStringProfile,
} from '../../engine/index.js';
import { createLoadout } from '../../state/loadout.js';
import { activateLoadout, switchMode } from '../pages/shell.js';
import { addLoadoutToNextAvailableSlot } from './compare/compare-slot-api.js';
import { initCompendium, _compSelectFrame, _compSwitchTab } from '../pages/compendium.js';
import { _stringSelectString } from '../pages/strings.js';
import { RACQUET_BRANDS, STRING_BRANDS } from '../../utils/performance-derived.js';
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

function initLeaderboard(): void {
  _lbv2State.initialized = true;
  const panel = document.getElementById('comp-tab-leaderboard');
  if (!panel) return;
  const shellMounted = !!panel.querySelector('#lb2-results');
  if (!_lbv2ShellMounted || !shellMounted) {
    panel.innerHTML = _buildShellHTML();
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

// ── Shell HTML (pure Tailwind) ────────────────────────────────────────────────

function _buildShellHTML(): string {
  const statPills = LB_STATS.map(s => {
    const active = s.key === _lbv2State.statKey;
    return `<button
      class="lb2-stat-pill flex shrink-0 items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2.5 border font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-150 cursor-pointer whitespace-nowrap ${
        active
          ? 'border-dc-accent text-dc-accent bg-dc-accent/5'
          : 'border-dc-storm/40 text-dc-storm hover:border-dc-storm hover:text-dc-platinum'
      }"
      data-stat="${s.key}"
      data-lb-action="setStat" data-lb-arg="${s.key}"
      title="${s.desc}"
    >
      <span>${s.icon}</span>
      <span>${s.label}</span>
    </button>`;
  }).join('');

  const typePills = [
    { v: 'both',   l: 'All' },
    { v: 'full',   l: 'Full Bed' },
    { v: 'hybrid', l: 'Hybrid' },
  ].map(({ v, l }) => {
    const active = v === _lbv2State.filterType;
    return `<button
      class="px-3 py-1.5 border font-mono text-[9px] font-bold uppercase tracking-[0.1em] transition-all duration-150 cursor-pointer ${
        active
          ? 'border-dc-accent text-dc-accent bg-dc-accent/5'
          : 'border-dc-storm/40 text-dc-storm hover:border-dc-storm hover:text-dc-platinum'
      }"
      data-type-filter="${v}"
      data-lb-action="setFilter" data-lb-arg="${v}"
    >${l}</button>`;
  }).join('');

  // View mode tabs — Builds / Frames / Strings
  const viewTabs = [
    { v: 'builds',  l: 'Builds',  sub: 'frame + string' },
    { v: 'frames',  l: 'Frames',  sub: 'frame only'     },
    { v: 'strings', l: 'Strings', sub: 'string only'    },
  ].map(({ v, l, sub }) => {
    const active = v === _lbv2State.viewMode;
    return `<button
      class="flex shrink-0 flex-row md:flex-col items-center md:items-start gap-1.5 md:gap-0 px-3 py-1.5 md:px-4 md:py-2 border-b-2 font-mono transition-all duration-150 cursor-pointer ${
        active
          ? 'border-dc-accent text-dc-accent'
          : 'border-transparent text-dc-storm hover:text-dc-platinum hover:border-dc-storm/40'
      }"
      data-view-mode="${v}"
      data-lb-action="setView" data-lb-arg="${v}"
    >
      <span class="text-[10px] font-bold uppercase tracking-[0.12em]">${l}</span>
      <span class="hidden md:inline text-[8px] tracking-[0.08em] opacity-60">${sub}</span>
    </button>`;
  }).join('');

  // Type filter only relevant for builds tab
  const showTypeFilter = _lbv2State.viewMode === 'builds';

  // Frame filters — only shown on frames tab
  const showFrameFilters = _lbv2State.viewMode === 'frames';
  const ff = _lbv2State.frameFilters;

  // Derive brand list dynamically from RACQUETS
  const brands: string[] = RACQUET_BRANDS;

  const sel = (id: string, val: string, opts: Array<{v: string; l: string}>, placeholder: string): string =>
    `<select
      id="${id}"
      class="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
      data-lb-action="setFrameFilter" data-lb-arg="${id.replace('lb2-ff-','')}"
    >
      <option value="">${placeholder}</option>
      ${opts.map(o => `<option value="${o.v}" ${val === o.v ? 'selected' : ''}>${o.l}</option>`).join('')}
    </select>`;

  const frameFilterRow = `
    <div class="${showFrameFilters ? '' : 'hidden'}" id="lb2-frame-filters-row">
      <div class="lbv2-filter-scroll -mx-3 px-3 md:mx-0 md:px-0">
        <div class="flex items-center gap-2 flex-nowrap md:flex-wrap min-w-min pb-0.5">
      <span class="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Filter</span>
      ${sel('lb2-ff-brand', ff.brand, brands.map(b => ({ v: b, l: b })), 'All brands')}
      ${sel('lb2-ff-pattern', ff.pattern, [
        { v: '16x19', l: '16x19' },
        { v: '16x20', l: '16x20' },
        { v: '16x18', l: '16x18' },
        { v: '18x20', l: '18x20' },
        { v: '18x19', l: '18x19' },
      ], 'All patterns')}
      ${sel('lb2-ff-headSize', ff.headSize, [
        { v: '95',   l: '≤95 sq in' },
        { v: '97',   l: '97 sq in' },
        { v: '98',   l: '98 sq in' },
        { v: '99',   l: '99 sq in' },
        { v: '100',  l: '100 sq in' },
        { v: '102+', l: '102+ sq in' },
      ], 'All head sizes')}
      ${sel('lb2-ff-weight', ff.weight, [
        { v: 'ultralight', l: '< 285g' },
        { v: 'light',      l: '285–305g' },
        { v: 'medium',     l: '305–320g' },
        { v: 'heavy',      l: '320–340g' },
        { v: 'tour',       l: '> 340g' },
      ], 'All weights')}
      ${sel('lb2-ff-stiffness', ff.stiffness, [
        { v: 'soft',   l: 'Soft (≤59 RA)' },
        { v: 'medium', l: 'Medium (60–65)' },
        { v: 'stiff',  l: 'Stiff (66+)' },
      ], 'All stiffness')}
      ${sel('lb2-ff-year', ff.year, [
        { v: '2026',  l: '2026' },
        { v: '2025',  l: '2025' },
        { v: '2024',  l: '2024' },
        { v: 'older', l: '≤2023' },
      ], 'All years')}
      ${Object.values(ff).some(v => v !== '') ? `
        <button
          class="font-mono text-[9px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-storm/30 text-dc-storm/60 hover:border-dc-red hover:text-dc-red transition-colors shrink-0"
          data-lb-action="clearFrameFilters"
        >Clear</button>` : ''}
        </div>
      </div>
    </div>`;

  // String filters — only shown on strings tab
  const showStringFilters = _lbv2State.viewMode === 'strings';
  const sf = _lbv2State.stringFilters;

  const stringBrands: string[] = STRING_BRANDS;

  const ssel = (id: string, val: string, opts: Array<{v: string; l: string}>, placeholder: string): string =>
    `<select
      id="${id}"
      class="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
      data-lb-action="setStringFilter" data-lb-arg="${id.replace('lb2-sf-','')}"
    >
      <option value="">${placeholder}</option>
      ${opts.map(o => `<option value="${o.v}" ${val === o.v ? 'selected' : ''}>${o.l}</option>`).join('')}
    </select>`;

  const stringFilterRow = `
    <div class="${showStringFilters ? '' : 'hidden'}" id="lb2-string-filters-row">
      <div class="lbv2-filter-scroll -mx-3 px-3 md:mx-0 md:px-0">
        <div class="flex items-center gap-2 flex-nowrap md:flex-wrap min-w-min pb-0.5">
      <span class="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Filter</span>
      ${ssel('lb2-sf-brand', sf.brand, stringBrands.map(b => ({ v: b, l: b })), 'All brands')}
      ${ssel('lb2-sf-material', sf.material, [
        { v: 'Polyester',              l: 'Polyester' },
        { v: 'Co-Polyester (elastic)', l: 'Co-Poly (elastic)' },
        { v: 'Natural Gut',            l: 'Natural Gut' },
        { v: 'Multifilament',          l: 'Multifilament' },
        { v: 'Synthetic Gut',          l: 'Synthetic Gut' },
      ], 'All materials')}
      ${ssel('lb2-sf-shape', sf.shape, [
        { v: 'round',      l: 'Round' },
        { v: 'pentagon',   l: 'Pentagon' },
        { v: 'hexagonal',  l: 'Hexagonal' },
        { v: 'octagonal',  l: 'Octagonal' },
        { v: 'square',     l: 'Square' },
        { v: 'textured',   l: 'Textured / Rough' },
      ], 'All shapes')}
      ${ssel('lb2-sf-gauge', sf.gauge, [
        { v: 'thin',  l: 'Thin (≤1.20mm)' },
        { v: 'mid',   l: 'Mid (1.21–1.27mm)' },
        { v: 'thick', l: 'Thick (≥1.28mm)' },
      ], 'All gauges')}
      ${ssel('lb2-sf-stiffness', sf.stiffness, [
        { v: 'soft',   l: 'Soft (< 180 lb/in)' },
        { v: 'medium', l: 'Medium (180–215)' },
        { v: 'stiff',  l: 'Stiff (> 215)' },
      ], 'All stiffness')}
      ${Object.values(sf).some(v => v !== '') ? `
        <button
          class="font-mono text-[9px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-storm/30 text-dc-storm/60 hover:border-dc-red hover:text-dc-red transition-colors shrink-0"
          data-lb-action="clearStringFilters"
        >Clear</button>` : ''}
        </div>
      </div>
    </div>`;

  return `
    <div class="flex flex-col min-h-full">

      <!-- View mode tabs -->
      <div class="lbv2-view-tabs border-b border-dc-storm/20 px-3 pt-2 md:px-5 md:pt-3 overflow-x-auto">
        <div class="flex min-w-min">
        ${viewTabs}
        </div>
      </div>

      <!-- Sticky controls -->
      <div class="sticky top-0 z-10 bg-dc-void-deep border-b border-dc-storm/20 px-3 py-2 md:px-5 md:py-4 flex flex-col gap-2 md:gap-3">

        <!-- Primary question: horizontal scroll on narrow screens -->
        <div class="flex flex-col gap-1.5 md:flex-row md:items-baseline md:gap-3">
          <span class="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Show me</span>
          <div class="lbv2-stat-scroll -mx-3 px-3 md:mx-0 md:px-0">
            <div class="flex gap-2 flex-nowrap" id="lb2-stat-pills">
            ${statPills}
            </div>
          </div>
        </div>

        <!-- Secondary filter (builds tab only) -->
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 ${showTypeFilter ? '' : 'hidden'}" id="lb2-type-filter-row">
          <span class="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Setup type</span>
          <div class="flex gap-1.5 flex-wrap">
            ${typePills}
          </div>
        </div>

        <!-- Frame filters (frames tab only) -->
        ${frameFilterRow}

        <!-- String filters (strings tab only) -->
        ${stringFilterRow}

        <div class="flex justify-end pt-0.5 border-t border-dc-storm/10 md:border-0 md:pt-0">
          <span class="font-mono text-[9px] text-dc-storm/50 tabular-nums" id="lb2-count"></span>
        </div>

      </div>

      <!-- Results -->
      <div class="flex-1" id="lb2-results">
        <div class="flex flex-col items-center justify-center py-16 gap-4">
          <div class="w-7 h-7 border-2 border-dc-storm/30 border-t-dc-accent rounded-full animate-spin"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.15em] text-dc-storm">Computing…</span>
        </div>
      </div>

    </div>
  `;
}

function _syncLbv2Shell(): void {
  const panel = document.getElementById('comp-tab-leaderboard');
  if (!panel) return;
  if (!panel.querySelector('#lb2-results')) {
    panel.innerHTML = _buildShellHTML();
  }

  const showTypeFilter = _lbv2State.viewMode === 'builds';
  panel.querySelector('#lb2-type-filter-row')?.classList.toggle('hidden', !showTypeFilter);
  panel.querySelector('#lb2-frame-filters-row')?.classList.toggle('hidden', _lbv2State.viewMode !== 'frames');
  panel.querySelector('#lb2-string-filters-row')?.classList.toggle('hidden', _lbv2State.viewMode !== 'strings');

  panel.querySelectorAll<HTMLElement>('[data-type-filter]').forEach((button) => {
    const isActive = button.dataset.typeFilter === _lbv2State.filterType;
    button.classList.toggle('border-dc-accent', isActive);
    button.classList.toggle('text-dc-accent', isActive);
    button.classList.toggle('bg-dc-accent/5', isActive);
    button.classList.toggle('border-dc-storm/40', !isActive);
    button.classList.toggle('text-dc-storm', !isActive);
  });

  panel.querySelectorAll<HTMLElement>('[data-view-mode]').forEach((button) => {
    const isActive = button.dataset.viewMode === _lbv2State.viewMode;
    button.classList.toggle('border-dc-accent', isActive);
    button.classList.toggle('text-dc-accent', isActive);
    button.classList.toggle('border-transparent', !isActive);
    button.classList.toggle('text-dc-storm', !isActive);
  });

  const ffBrand = panel.querySelector('#lb2-ff-brand') as HTMLSelectElement | null;
  const ffPattern = panel.querySelector('#lb2-ff-pattern') as HTMLSelectElement | null;
  const ffHeadSize = panel.querySelector('#lb2-ff-headSize') as HTMLSelectElement | null;
  const ffWeight = panel.querySelector('#lb2-ff-weight') as HTMLSelectElement | null;
  const ffStiffness = panel.querySelector('#lb2-ff-stiffness') as HTMLSelectElement | null;
  const ffYear = panel.querySelector('#lb2-ff-year') as HTMLSelectElement | null;
  const sfBrand = panel.querySelector('#lb2-sf-brand') as HTMLSelectElement | null;
  const sfMaterial = panel.querySelector('#lb2-sf-material') as HTMLSelectElement | null;
  const sfShape = panel.querySelector('#lb2-sf-shape') as HTMLSelectElement | null;
  const sfGauge = panel.querySelector('#lb2-sf-gauge') as HTMLSelectElement | null;
  const sfStiffness = panel.querySelector('#lb2-sf-stiffness') as HTMLSelectElement | null;

  if (ffBrand) ffBrand.value = _lbv2State.frameFilters.brand;
  if (ffPattern) ffPattern.value = _lbv2State.frameFilters.pattern;
  if (ffHeadSize) ffHeadSize.value = _lbv2State.frameFilters.headSize;
  if (ffWeight) ffWeight.value = _lbv2State.frameFilters.weight;
  if (ffStiffness) ffStiffness.value = _lbv2State.frameFilters.stiffness;
  if (ffYear) ffYear.value = _lbv2State.frameFilters.year;
  if (sfBrand) sfBrand.value = _lbv2State.stringFilters.brand;
  if (sfMaterial) sfMaterial.value = _lbv2State.stringFilters.material;
  if (sfShape) sfShape.value = _lbv2State.stringFilters.shape;
  if (sfGauge) sfGauge.value = _lbv2State.stringFilters.gauge;
  if (sfStiffness) sfStiffness.value = _lbv2State.stringFilters.stiffness;
}

// ── State setters ─────────────────────────────────────────────────────────────

function _lbv2SetStat(key: string): void {
  if (_lbv2State.statKey === key) return;
  _lbv2State.statKey = key;
  _lbv2State.results = null;

  // Update pill active states
  document.querySelectorAll('.lb2-stat-pill').forEach(btn => {
    const el = btn as HTMLElement;
    const isActive = el.dataset.stat === key;
    el.className = el.className
      .replace(/border-dc-accent|text-dc-accent|bg-dc-accent\/5|border-dc-storm\/40|text-dc-storm|hover:border-dc-storm|hover:text-dc-platinum/g, '').trim();
    if (isActive) {
      el.classList.add('border-dc-accent', 'text-dc-accent', 'bg-dc-accent/5');
    } else {
      el.classList.add('border-dc-storm/40', 'text-dc-storm', 'hover:border-dc-storm', 'hover:text-dc-platinum');
    }
  });

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
      if (resultsEl) resultsEl.innerHTML = `
        <div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-red/70">
          Error: ${(err as Error).message}
        </div>`;
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

interface BuildResult {
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

  if (!results || results.length === 0) {
    resultsEl.innerHTML = `
      <div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-storm">
        No results — try a different filter.
      </div>`;
    return;
  }

  const statMeta = LB_STATS.find(s => s.key === _lbv2State.statKey) || LB_STATS[0];
  const isObs    = _lbv2State.statKey === 'obs';
  const statLabel = isObs ? 'OBS' : statMeta.label.replace('Most ', '').replace('Best ', '');

  const rows = results.slice(0, 50).map((entry, i) => {
    const rank       = i + 1;
    const isFeatured = rank === 1;
    const rankValDisplay = isObs
      ? entry.rankVal.toFixed(1)
      : Math.round(entry.rankVal);

    const tensionLabel = entry.type === 'hybrid'
      ? `M${entry.tension} / X${entry.crossesTension}`
      : `${entry.tension} lbs`;

    const typeTag = entry.type === 'hybrid'
      ? `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-emerald-500/30 text-emerald-400 bg-emerald-400/5">H</span>`
      : `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-dc-storm/30 text-dc-storm">F</span>`;

    // Top 3 stats for this entry
    const topStats = ['spin', 'power', 'control', 'comfort', 'feel', 'stability']
      .map(k => ({ k, v: (entry.stats as unknown as Record<string, number>)[k] }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 3)
      .map(({ k, v }) => {
        const high = v >= 70;
        return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border ${
          high
            ? 'border-emerald-500/25 text-emerald-400 bg-emerald-400/5'
            : 'border-dc-storm/20 text-dc-storm'
        }">${k.slice(0,3).toUpperCase()} ${v}</span>`;
      }).join('');

    // Frame name — truncate
    const frameName = entry.frameLabel.length > 30
      ? entry.frameLabel.slice(0, 30) + '…'
      : entry.frameLabel;
    const stringName = entry.stringLabel.length > 35
      ? entry.stringLabel.slice(0, 35) + '…'
      : entry.stringLabel;

    const archetype = entry.identity?.archetype || '—';

    // Action handler data attrs
    const mainsId   = entry.mains?.id   || '';
    const crossesId = entry.crosses?.id || '';
    const stringId  = entry.type === 'hybrid' ? mainsId : (entry.string?.id || '');

    return `
      <tr class="group border-b border-dc-storm/10 transition-colors hover:bg-dc-void-lift/50 ${
        isFeatured ? 'bg-dc-accent/[0.03]' : ''
      }">
        <!-- Rank -->
        <td class="px-4 py-3 w-10 text-center">
          <span class="font-mono text-[11px] font-bold ${isFeatured ? 'text-dc-accent' : 'text-dc-storm/60'}">${rank}</span>
        </td>

        <!-- Type -->
        <td class="px-2 py-3 w-8">${typeTag}</td>

        <!-- Frame + String -->
        <td class="px-3 py-3 min-w-[160px]">
          <div class="font-sans text-[12px] font-semibold text-dc-platinum leading-tight" title="${entry.frameLabel}">${frameName}</div>
          <div class="font-mono text-[9px] text-dc-storm mt-0.5" title="${entry.stringLabel}">${stringName}</div>
        </td>

        <!-- Tension -->
        <td class="px-3 py-3 w-24">
          <span class="font-mono text-[10px] text-dc-storm/70">${tensionLabel}</span>
        </td>

        <!-- Primary stat (the ranked one) -->
        <td class="px-3 py-3 w-20 text-right">
          <span class="font-mono text-[18px] font-bold leading-none ${isFeatured ? 'text-dc-accent' : 'text-dc-platinum'}">${rankValDisplay}</span>
          <div class="font-mono text-[7px] uppercase tracking-[0.15em] text-dc-storm mt-0.5 text-right">${statLabel}</div>
        </td>

        <!-- OBS (always shown) -->
        ${!isObs ? `
        <td class="px-3 py-3 w-16 text-right">
          <span class="font-mono text-[12px] font-semibold" style="color:${getObsScoreColor(entry.obs)}">${entry.obs}</span>
          <div class="font-mono text-[7px] uppercase tracking-[0.15em] text-dc-storm mt-0.5 text-right">OBS</div>
        </td>` : `<td class="w-4"></td>`}

        <!-- Archetype -->
        <td class="px-3 py-3 hidden md:table-cell">
          <span class="font-mono text-[9px] text-dc-storm/70 leading-tight">${archetype}</span>
        </td>

        <!-- Top stats -->
        <td class="px-3 py-3 hidden lg:table-cell">
          <div class="flex gap-1.5 flex-wrap">${topStats}</div>
        </td>

        <!-- Actions -->
        <td class="px-3 py-3 w-24">
          <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="font-mono text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink transition-colors"
              data-lb-action="view" data-racquet-id="${entry.racquet.id}" data-string-id="${stringId}" data-tension="${entry.tension}" data-type="${entry.type}" data-mains-id="${mainsId}" data-crosses-id="${crossesId}" data-crosses-tension="${entry.crossesTension}"
            >View</button>
            <button
              class="font-mono text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-storm/40 text-dc-storm hover:border-dc-storm hover:text-dc-platinum transition-colors"
              data-lb-action="compare" data-racquet-id="${entry.racquet.id}" data-string-id="${stringId}" data-tension="${entry.tension}" data-type="${entry.type}" data-mains-id="${mainsId}" data-crosses-id="${crossesId}" data-crosses-tension="${entry.crossesTension}"
            >Cmp</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  resultsEl.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-dc-storm/20">
            <th class="px-4 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 w-10">#</th>
            <th class="px-2 py-2.5 w-8"></th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">Frame / String</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">Tension</th>
            <th class="px-3 py-2.5 text-right font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-accent">${statLabel}</th>
            ${!isObs ? `<th class="px-3 py-2.5 text-right font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">OBS</th>` : `<th class="w-4"></th>`}
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 hidden md:table-cell">Identity</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 hidden lg:table-cell">Stats</th>
            <th class="w-24"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="px-5 py-3 border-t border-dc-storm/10 flex justify-between items-center">
      <span class="font-mono text-[9px] text-dc-storm/50">${results.length} builds scored · best setup per frame×string at optimal tension</span>
      <span class="font-mono text-[9px] text-dc-storm/50">${statMeta.icon} ${statMeta.desc}</span>
    </div>
  `;
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

  if (!results || results.length === 0) {
    resultsEl.innerHTML = `<div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-storm">No results.</div>`;
    return;
  }

  const statMeta  = LB_STATS.find(s => s.key === _lbv2State.statKey) || LB_STATS[0];
  const isObs     = _lbv2State.statKey === 'obs';
  const statLabel = isObs ? 'Score' : statMeta.label.replace('Most ', '').replace('Best ', '');

  // Secondary stats to always show for context
  const contextStats = ['spin', 'power', 'control', 'comfort', 'stability', 'maneuverability']
    .filter(k => k !== _lbv2State.statKey)
    .slice(0, 4);

  const rows = results.slice(0, 50).map(function(entry: FrameResult, i: number) {
    const rank       = i + 1;
    const isFeatured = rank === 1;
    const fb         = entry.frameBase as unknown as Record<string, number>;

    const specChips = contextStats.map(function(k) {
      const v    = Math.round(fb[k] || 0);
      const high = v >= 68;
      return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border ${
        high
          ? 'border-emerald-500/25 text-emerald-400 bg-emerald-400/5'
          : 'border-dc-storm/20 text-dc-storm'
      }">${k.slice(0,3).toUpperCase()} ${v}</span>`;
    }).join('');

    const frameName = entry.frameLabel.length > 36
      ? entry.frameLabel.slice(0, 36) + '…'
      : entry.frameLabel;

    const r = entry.racquet;
    const specLine = `${r.strungWeight}g · SW ${r.swingweight} · ${r.stiffness} RA · ${r.pattern} · ${r.headSize} sq in`;

    return `
      <tr class="group border-b border-dc-storm/10 transition-colors hover:bg-dc-void-lift/50 ${isFeatured ? 'bg-dc-accent/[0.03]' : ''}">
        <td class="px-4 py-3 w-10 text-center">
          <span class="font-mono text-[11px] font-bold ${isFeatured ? 'text-dc-accent' : 'text-dc-storm/60'}">${rank}</span>
        </td>
        <td class="px-3 py-3 min-w-[200px]">
          <div class="font-sans text-[12px] font-semibold text-dc-platinum leading-tight">${frameName}</div>
          <div class="font-mono text-[9px] text-dc-storm/60 mt-0.5">${specLine}</div>
        </td>
        <td class="px-3 py-3 w-20 text-right">
          <span class="font-mono text-[18px] font-bold leading-none ${isFeatured ? 'text-dc-accent' : 'text-dc-platinum'}">${entry.rankVal}</span>
          <div class="font-mono text-[7px] uppercase tracking-[0.15em] text-dc-storm mt-0.5 text-right">${statLabel}</div>
        </td>
        <td class="px-3 py-3 hidden md:table-cell">
          <div class="flex gap-1.5 flex-wrap">${specChips}</div>
        </td>
        <td class="px-3 py-3 w-20">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="font-mono text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink transition-colors"
              data-lb-action="viewFrame" data-racquet-id="${r.id}"
            >View</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  resultsEl.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-dc-storm/20">
            <th class="px-4 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 w-10">#</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">Frame</th>
            <th class="px-3 py-2.5 text-right font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-accent">${statLabel}</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 hidden md:table-cell">Stats</th>
            <th class="w-20"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="px-5 py-3 border-t border-dc-storm/10 flex justify-between items-center">
      <span class="font-mono text-[9px] text-dc-storm/50">${results.length} frames · base physics, no string interaction</span>
      <span class="font-mono text-[9px] text-dc-storm/50">${statMeta.icon} ${statMeta.desc}</span>
    </div>
  `;
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

  if (!results || results.length === 0) {
    resultsEl.innerHTML = `<div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-storm">No results.</div>`;
    return;
  }

  const statMeta  = LB_STATS.find(s => s.key === _lbv2State.statKey) || LB_STATS[0];
  const isObs     = _lbv2State.statKey === 'obs';
  const statLabel = isObs ? 'Score' : statMeta.label.replace('Most ', '').replace('Best ', '');

  const contextStats = ['spin', 'power', 'control', 'comfort', 'feel', 'durability', 'playability']
    .filter(k => k !== _lbv2State.statKey)
    .slice(0, 4);

  const rows = results.slice(0, 50).map(function(entry: StringResult, i: number) {
    const rank       = i + 1;
    const isFeatured = rank === 1;
    const s          = entry.string;
    const p          = entry.profile as unknown as Record<string, number>;

    const matTag = (function() {
      const m = (s.material || '').toLowerCase();
      if (m.includes('natural gut')) return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-amber-500/30 text-amber-400 bg-amber-400/5">GUT</span>`;
      if (m.includes('multifilament')) return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-sky-500/30 text-sky-400 bg-sky-400/5">MULTI</span>`;
      if (m.includes('co-polyester')) return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-purple-500/25 text-purple-400 bg-purple-400/5">CO-POLY</span>`;
      if (m.includes('synthetic')) return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-dc-storm/30 text-dc-storm">SYN GUT</span>`;
      return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-dc-storm/30 text-dc-storm">POLY</span>`;
    })();

    const statChips = contextStats.map(function(k) {
      const v    = Math.round(p[k] || 0);
      const high = v >= 68;
      return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border ${
        high
          ? 'border-emerald-500/25 text-emerald-400 bg-emerald-400/5'
          : 'border-dc-storm/20 text-dc-storm'
      }">${k.slice(0,3).toUpperCase()} ${v}</span>`;
    }).join('');

    const specLine = `${s.gauge} · ${s.shape} · ${Math.round(s.stiffness)} lb/in`;

    return `
      <tr class="group border-b border-dc-storm/10 transition-colors hover:bg-dc-void-lift/50 ${isFeatured ? 'bg-dc-accent/[0.03]' : ''}">
        <td class="px-4 py-3 w-10 text-center">
          <span class="font-mono text-[11px] font-bold ${isFeatured ? 'text-dc-accent' : 'text-dc-storm/60'}">${rank}</span>
        </td>
        <td class="px-3 py-3 min-w-[180px]">
          <div class="flex items-center gap-2">
            <span class="font-sans text-[12px] font-semibold text-dc-platinum leading-tight">${s.name}</span>
            ${matTag}
          </div>
          <div class="font-mono text-[9px] text-dc-storm/60 mt-0.5">${specLine}</div>
        </td>
        <td class="px-3 py-3 w-20 text-right">
          <span class="font-mono text-[18px] font-bold leading-none ${isFeatured ? 'text-dc-accent' : 'text-dc-platinum'}">${entry.rankVal}</span>
          <div class="font-mono text-[7px] uppercase tracking-[0.15em] text-dc-storm mt-0.5 text-right">${statLabel}</div>
        </td>
        <td class="px-3 py-3 hidden md:table-cell">
          <div class="flex gap-1.5 flex-wrap">${statChips}</div>
        </td>
        <td class="px-3 py-3 w-20">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="font-mono text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink transition-colors"
              data-lb-action="viewString" data-string-id="${s.id}"
            >View</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  resultsEl.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-dc-storm/20">
            <th class="px-4 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 w-10">#</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">String</th>
            <th class="px-3 py-2.5 text-right font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-accent">${statLabel}</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 hidden md:table-cell">Stats</th>
            <th class="w-20"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="px-5 py-3 border-t border-dc-storm/10 flex justify-between items-center">
      <span class="font-mono text-[9px] text-dc-storm/50">${results.length} strings · intrinsic profile, no frame interaction</span>
      <span class="font-mono text-[9px] text-dc-storm/50">${statMeta.icon} ${statMeta.desc}</span>
    </div>
  `;
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
export { initLeaderboard };
