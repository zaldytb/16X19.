// src/ui/pages/overview.ts
// Overview page rendering - dashboard, hero, stat bars, radar chart

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { buildTensionContext, computeCompositeScore } from '../../engine/index.js';
import type { StringData, Racquet, SetupAttributes, StringConfig as EngineStringConfig } from '../../engine/types.js';
import { _prevObsValues, animateOBSInContainer } from '../components/obs-animation.js';
import { renderMobileLoadoutPills } from '../components/dock-renderers.js';
import { getScoredSetup, measurePerformance } from '../../utils/performance.js';

import { getCurrentSetup } from '../../state/setup-sync.js';
import { switchMode } from './shell.js';
import { registerOverviewRuntimeCallbacks } from './overview-runtime-bridge.js';
import { refreshTuneIfActiveViaBridge } from './tune-runtime-bridge.js';

import { OverviewWarnings } from '../../components/overview/OverviewWarnings.js';
import { buildOverviewWarningsViewModel } from './overview-warnings-vm.js';
import { OverviewBuildDnaHighlights } from '../../components/overview/OverviewBuildDnaHighlights.js';
import { buildOverviewBuildDnaViewModel } from './overview-build-dna-vm.js';
import { OverviewOCFoundation } from '../../components/overview/OverviewOCFoundation.js';
import { buildOverviewOCFoundationViewModel } from './overview-oc-foundation-vm.js';
import { OverviewFitProfileCard } from '../../components/overview/OverviewFitProfileCard.js';
import { buildOverviewFitProfileCardViewModel } from './overview-fit-profile-vm.js';
import { OverviewStatBars } from '../../components/overview/OverviewStatBars.js';
import { buildOverviewStatBarsViewModel } from './overview-stat-bars-vm.js';
import { OverviewHero } from '../../components/overview/OverviewHero.js';
import { buildOverviewHeroViewModel } from './overview-hero-vm.js';
import { OverviewRadarChart } from '../../components/overview/OverviewRadarChart.js';
import { statsToRadarData, type OverviewRadarChartHandle } from './overview-radar-chart.js';

export { radarTooltipHandler, statsToRadarData } from './overview-radar-chart.js';

type StringConfig = EngineStringConfig;

/** Tracks createRoot + host element; invalidates when route unmounts and DOM nodes are recreated. */
type OverviewReactMount = { root: Root | null; host: HTMLElement | null };

function _ensureOverviewReactRoot(mount: OverviewReactMount, container: HTMLElement | null): Root | null {
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

const _overviewHeroMount: OverviewReactMount = { root: null, host: null };
const _overviewStatBarsMount: OverviewReactMount = { root: null, host: null };
const _overviewDnaMount: OverviewReactMount = { root: null, host: null };
const _overviewRadarMount: OverviewReactMount = { root: null, host: null };
const _overviewOCMount: OverviewReactMount = { root: null, host: null };
const _overviewFitMount: OverviewReactMount = { root: null, host: null };
const _overviewWarningsMount: OverviewReactMount = { root: null, host: null };

function _onOverviewRadarReady(_chart: OverviewRadarChartHandle | null): void {
  void _chart;
  /* Chart instance owned by OverviewRadarChart; callback reserved for parity with Tune sweep pattern */
}

/**
 * Render the main dashboard
 */
export function renderDashboard(): void {
  _bindOverviewDelegates();
  renderMobileLoadoutPills();
  const setup = getCurrentSetup();

  const emptyState = document.getElementById('empty-state');
  const dashboardContent = document.getElementById('dashboard-content');

  if (!setup) {
    emptyState?.classList.remove('hidden');
    dashboardContent?.classList.add('hidden');
    return;
  }

  emptyState?.classList.add('hidden');
  dashboardContent?.classList.remove('hidden');

  const { racquet, stringConfig } = setup;
  const scored = measurePerformance('overview dashboard render', () => getScoredSetup(setup));
  const stats = scored.stats;
  const identity = scored.identity;
  const fitProfile = generateFitProfile(stats, racquet, stringConfig);
  const warnings = generateWarnings(racquet, stringConfig, stats);

  renderOverviewHero(racquet, stringConfig, stats, identity, scored.obs);

  renderStatBars(stats);
  renderRadarChart(stats);

  renderFitProfileCard(fitProfile);

  renderOCFoundation(racquet, stringConfig, stats);

  renderWarnings(warnings);

  refreshTuneIfActiveViaBridge();
}

let _overviewDelegateBound = false;

function _bindOverviewDelegates(): void {
  if (_overviewDelegateBound) return;
  _overviewDelegateBound = true;

  document.addEventListener('click', (e: Event) => {
    const el = (e.target as Element).closest('[data-overview-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.overviewAction!;
    const arg = el.dataset.overviewArg;
    if (action === 'switchMode' && arg) switchMode(arg);
  });
}

/**
 * Render the overview hero block with OBS score
 */
export function renderOverviewHero(
  racquet: Racquet,
  stringConfig: StringConfig,
  stats: SetupAttributes,
  identity: { archetype: string; description: string },
  precomputedObs?: number
): void {
  const el = document.getElementById('overview-hero');
  if (!el) return;

  const score =
    typeof precomputedObs === 'number'
      ? precomputedObs
      : computeCompositeScore(stats, buildTensionContext(stringConfig, racquet));

  const vm = buildOverviewHeroViewModel(racquet, stringConfig, stats, identity, precomputedObs);
  const root = _ensureOverviewReactRoot(_overviewHeroMount, el);
  if (!root) return;
  root.render(createElement(OverviewHero, { model: vm }));

  queueMicrotask(() => {
    const host = document.getElementById('overview-hero');
    if (host) {
      animateOBSInContainer(host, '.hero-obs-value', score, 500, _prevObsValues.hero);
      _prevObsValues.hero = score;
    }
  });
}

/**
 * Get rating descriptor text
 */
export function getRatingDescriptor(score: number, identity: { archetype: string }): string {
  const archLower = identity.archetype.toLowerCase();
  if (score >= 85) return `Elite ${archLower} configuration`;
  if (score >= 75) return `Strong ${archLower} configuration`;
  if (score >= 65) return `Solid ${archLower} configuration`;
  if (score >= 55) return `Moderate ${archLower} configuration`;
  return `Developing ${archLower} configuration`;
}

/**
 * Render the foundation stats (frame/string/model specs)
 */
export function renderOCFoundation(
  racquet: Racquet,
  stringConfig: StringConfig,
  stats: SetupAttributes
): void {
  const el = document.getElementById('oc-foundation');
  if (!el) return;

  const vm = buildOverviewOCFoundationViewModel(racquet, stringConfig, stats);
  const root = _ensureOverviewReactRoot(_overviewOCMount, el);
  if (!root) return;
  root.render(createElement(OverviewOCFoundation, { model: vm }));
}

/**
 * Render the snapshot section
 */
export function renderOCSnapshot(fitProfile: {
  bestFor: string[];
  watchOut: string[];
  tensionRec: string;
}): void {
  const el = document.getElementById('oc-snapshot');
  if (!el) return;

  const bestForText = fitProfile.bestFor.slice(0, 2).join(', ');
  const watchOutText = fitProfile.watchOut[0] || 'No major concerns';
  const sweetSpotMatch = fitProfile.tensionRec.match(/sweet spot: ([^)]+)/);
  const sweetSpot = sweetSpotMatch ? sweetSpotMatch[1] : fitProfile.tensionRec;

  el.innerHTML = `
    <div class="oc-snapshot-section">
      <div class="oc-snapshot-label best-for">Best For</div>
      <div class="oc-snapshot-value">${bestForText}</div>
    </div>
    <div class="oc-snapshot-section">
      <div class="oc-snapshot-label watch-out">Watch Out</div>
      <div class="oc-snapshot-value">${watchOutText}</div>
    </div>
    <div class="oc-snapshot-section">
      <div class="oc-snapshot-label sweet-spot">Sweet Spot</div>
      <div class="oc-snapshot-value">${sweetSpot}</div>
    </div>
  `;
}

/**
 * Get color for stat bar (Digicraft Brutalism - monochrome)
 */
export function _statBarColor(_val: number): string {
  return 'var(--dc-platinum)';
}

/**
 * Render stat bars with battery-style segments
 */
export function renderStatBars(stats: SetupAttributes): void {
  const container = document.getElementById('stat-bars');
  if (!container) return;

  const vm = buildOverviewStatBarsViewModel(stats);
  const root = _ensureOverviewReactRoot(_overviewStatBarsMount, container);
  if (!root) return;
  root.render(createElement(OverviewStatBars, { model: vm }));

  const dnaEl = document.getElementById('build-dna-highlights');
  if (dnaEl) {
    const dnaVm = buildOverviewBuildDnaViewModel(stats);
    const dnaRoot = _ensureOverviewReactRoot(_overviewDnaMount, dnaEl);
    if (dnaRoot) {
      dnaRoot.render(createElement(OverviewBuildDnaHighlights, { model: dnaVm }));
    }
  }
}

/**
 * Render Build DNA highlights (top 3 + bottom 2 stats)
 */
export function renderBuildDNAHighlights(stats: SetupAttributes): void {
  const el = document.getElementById('build-dna-highlights');
  if (!el) return;

  const vm = buildOverviewBuildDnaViewModel(stats);
  const root = _ensureOverviewReactRoot(_overviewDnaMount, el);
  if (!root) return;
  root.render(createElement(OverviewBuildDnaHighlights, { model: vm }));
}

/**
 * Render radar chart using Chart.js
 */
export function renderRadarChart(stats: SetupAttributes): void {
  const container = document.getElementById('radar-chart-root');
  if (!container) return;

  const chartTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const data = statsToRadarData(stats);
  const statsDataKey = data.join(',');

  const root = _ensureOverviewReactRoot(_overviewRadarMount, container);
  if (!root) return;

  root.render(
    createElement(OverviewRadarChart, {
      statsData: data,
      statsDataKey,
      chartTheme,
      onChartReady: _onOverviewRadarReady,
    })
  );
}

/**
 * Render fit profile section
 */
export function renderFitProfile(fitProfile: {
  bestFor: string[];
  watchOut: string[];
  tensionRec: string;
}): void {
  const grid = document.getElementById('fit-grid');
  if (!grid) return;

  const bestForList = Array.isArray(fitProfile.bestFor) ? fitProfile.bestFor : [];
  const watchOutList = Array.isArray(fitProfile.watchOut) ? fitProfile.watchOut : [];
  const bestFor = bestForList.join(', ');
  const watchOut = watchOutList.length > 0 && !watchOutList[0].toLowerCase().includes('no major')
    ? watchOutList.join(', ')
    : '';
  const tension = fitProfile.tensionRec || '';

  const parts: string[] = [];
  if (bestFor) parts.push('<span class="dna-fit-label dna-fit-best">Best for:</span> ' + bestFor);
  if (watchOut) parts.push('<span class="dna-fit-label dna-fit-warn">Watch:</span> ' + watchOut);
  if (tension) parts.push('<span class="dna-fit-label dna-fit-tension">Sweet spot:</span> ' + tension);

  grid.innerHTML = '<p class="dna-fit-line">' + parts.join(' <span class="dna-fit-sep">·</span> ') + '</p>';
}

export function renderFitProfileCard(fitProfile: {
  bestFor: string[];
  watchOut: string[];
  tensionRec: string;
}): void {
  const grid = document.getElementById('fit-grid');
  if (!grid) return;

  const vm = buildOverviewFitProfileCardViewModel(fitProfile);
  const root = _ensureOverviewReactRoot(_overviewFitMount, grid);
  if (!root) return;
  root.render(createElement(OverviewFitProfileCard, { model: vm }));
}

/**
 * Render warnings section
 */
export function renderWarnings(warnings: string[]): void {
  const card = document.getElementById('warnings-card');
  const list = document.getElementById('warnings-list');
  if (!card || !list) return;

  if (warnings.length === 0) {
    card.classList.add('hidden');
    const root = _ensureOverviewReactRoot(_overviewWarningsMount, list);
    if (root) root.render(createElement(OverviewWarnings, { model: { messages: [] } }));
    return;
  }

  card.classList.remove('hidden');
  const vm = buildOverviewWarningsViewModel(warnings);
  const root = _ensureOverviewReactRoot(_overviewWarningsMount, list);
  if (!root) return;
  root.render(createElement(OverviewWarnings, { model: vm }));
}

/**
 * Generate fit profile from stats
 */
export function generateFitProfile(
  stats: SetupAttributes,
  racquet: Racquet,
  _stringConfig: StringConfig
): { bestFor: string[]; watchOut: string[]; tensionRec: string } {
  const bestForCandidates: Array<{ label: string; score: number }> = [];
  const watchOut: string[] = [];
  if (stats.spin >= 70) bestForCandidates.push({ label: 'Baseline grinders who rely on topspin', score: stats.spin });
  if (stats.power >= 65) bestForCandidates.push({ label: 'Players who like to dictate with pace', score: stats.power });
  if (stats.control >= 70) bestForCandidates.push({ label: 'Touch players and all-courters', score: stats.control });
  if (stats.comfort >= 70) bestForCandidates.push({ label: 'Players with arm sensitivity', score: stats.comfort });
  if (stats.stability >= 70) bestForCandidates.push({ label: 'Aggressive returners and blockers', score: stats.stability });
  if (stats.feel >= 75) bestForCandidates.push({ label: 'Net players and volleyers', score: stats.feel });
  if (stats.maneuverability >= 70) bestForCandidates.push({ label: 'Quick-swing players and net rushers', score: stats.maneuverability });
  if (stats.forgiveness >= 65) bestForCandidates.push({ label: 'Developing players building consistency', score: stats.forgiveness });
  if (stats.playability >= 80) bestForCandidates.push({ label: 'Frequent players (3+ times/week)', score: stats.playability });

  const bestFor = bestForCandidates
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => entry.label);

  if (bestFor.length === 0) bestFor.push('Versatile all-court players');

  if (stats.power <= 40) watchOut.push('Players who need free power from the frame');
  if (stats.comfort <= 45) watchOut.push('Players with arm/elbow issues — too stiff');
  if (stats.control <= 50) watchOut.push('Players who need help keeping the ball in');
  if (stats.spin <= 50) watchOut.push('Heavy topspin players — limited spin access');
  if (stats.forgiveness <= 45) watchOut.push('Beginners — small effective sweet spot');
  if (stats.maneuverability <= 45) watchOut.push('Compact swingers — frame may feel sluggish');
  if (stats.durability <= 55) watchOut.push('String breakers — low durability');
  if (stats.playability <= 55) watchOut.push('Infrequent restringers — goes dead fast');

  if (watchOut.length === 0) watchOut.push('No major red flags — versatile setup');

  const [low, high] = racquet.tensionRange;
  const mid = Math.round((low + high) / 2);
  const tensionRec = `${low}–${high} lbs (sweet spot: ${mid - 1}–${mid + 1} lbs)`;

  return { bestFor, watchOut, tensionRec };
}

/**
 * Generate warnings from racquet/string/stats
 */
export function generateWarnings(
  racquet: Racquet,
  stringConfig: StringConfig,
  _stats: SetupAttributes
): string[] {
  const warnings: string[] = [];

  const getMainString = () => stringConfig.isHybrid ? stringConfig.mains : (stringConfig as import('../../engine/types.js').FullbedStringConfig).string;
  const getCrossString = () => stringConfig.isHybrid ? stringConfig.crosses : (stringConfig as import('../../engine/types.js').FullbedStringConfig).string;

  const mainsTension = stringConfig.mainsTension;
  const crossesTension = stringConfig.crossesTension;

  if (mainsTension < racquet.tensionRange[0]) {
    warnings.push(`Mains tension (${mainsTension} lbs) is below the recommended range (${racquet.tensionRange[0]}–${racquet.tensionRange[1]} lbs). Risk of losing control and trampoline effect.`);
  }
  if (mainsTension > racquet.tensionRange[1]) {
    warnings.push(`Mains tension (${mainsTension} lbs) is above the recommended range (${racquet.tensionRange[0]}–${racquet.tensionRange[1]} lbs). Risk of reduced comfort and arm strain.`);
  }
  if (crossesTension < racquet.tensionRange[0]) {
    warnings.push(`Crosses tension (${crossesTension} lbs) is below the recommended range.`);
  }
  if (crossesTension > racquet.tensionRange[1]) {
    warnings.push(`Crosses tension (${crossesTension} lbs) is above the recommended range.`);
  }

  const mainString = getMainString();
  if (mainString && racquet.stiffness >= 68 && mainString.stiffness >= 220) {
    warnings.push(`High frame stiffness (${racquet.stiffness} RA) + stiff string (${mainString.stiffness} lb/in) = significant shock transmission. Consider monitoring for arm discomfort.`);
  }

  const allStrings = stringConfig.isHybrid
    ? [stringConfig.mains, stringConfig.crosses].filter(Boolean) as StringData[]
    : [stringConfig.string].filter(Boolean) as StringData[];

  for (const s of allStrings) {
    if (s.gaugeNum <= 1.25 && s.material === 'Polyester') {
      warnings.push(`${s.name} ${s.gauge} is thin gauge — expect reduced durability vs 16g. Frequent string breakers should consider thicker gauge.`);
    }
  }

  for (const s of allStrings) {
    if (s.material === 'Natural Gut') {
      warnings.push(`${s.name} is natural gut — avoid moisture/humidity. Not recommended for wet climates without protection.`);
    }
  }

  return warnings;
}

registerOverviewRuntimeCallbacks({
  renderDashboard,
  renderRadarChart,
});
