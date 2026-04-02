// src/ui/pages/tune.ts
// Tune page - tension exploration and optimization

import {
  predictSetup,
  buildTensionContext,
  computeCompositeScore,
  generateIdentity,
} from '../../engine/index.js';
import type { Racquet, StringData, SetupAttributes, StringConfig, Loadout } from '../../engine/types.js';
import { GAUGE_LABELS } from '../../engine/constants.js';
import { STRINGS } from '../../data/loader.js';
import { createLoadout, saveLoadout } from '../../state/loadout.js';
import { persistActiveLoadout } from '../../state/active-loadout-storage.js';
import { getActiveLoadout, getSavedLoadouts, setActiveLoadout, getCurrentMode } from '../../state/imperative.js';
import { syncViews } from '../../runtime/coordinator.js';
import { getCurrentSetup, getSetupFromLoadout } from '../../state/setup-sync.js';
import { invalidateSetupFromLoadoutCache } from '../../state/setup-from-loadout.js';
import { activateLoadout } from './shell.js';
import { renderDockPanel } from '../components/dock-renderers.js';
import { _prevObsValues, animateOBSInContainer } from '../components/obs-animation.js';
import {
  generateRecommendedBuilds,
  buildWhatToTryNextViewModel,
  type RecommendedBuildsResult,
} from '../shared/recommendations.js';
import { getScoredSetup } from '../../utils/performance.js';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/** Tracks createRoot + host element; invalidates when the route unmounts and DOM nodes are recreated. */
type TuneReactMount = { root: Root | null; host: HTMLElement | null };

function _ensureTuneReactRoot(mount: TuneReactMount, container: HTMLElement | null): Root | null {
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
import { OptimalBuildWindow } from '../../components/tune/OptimalBuildWindow.js';
import { buildOptimalBuildWindowViewModel } from './tune-optimal-build-window-vm.js';
import { TuneBestValueCallout } from '../../components/tune/TuneBestValueCallout.js';
import { buildTuneBestValueViewModel } from './tune-best-value-vm.js';
import { TuneObsBuildScore } from '../../components/tune/TuneObsBuildScore.js';
import { buildTuneObsBuildScoreViewModel } from './tune-obs-build-score-vm.js';
import { TuneHybridDimToggle } from '../../components/tune/TuneHybridDimToggle.js';
import { buildTuneHybridDimToggleViewModel } from './tune-hybrid-dim-toggle-vm.js';
import type { HybridDim } from './tune-hybrid-dim-toggle-vm.js';
import { TuneDeltaVsBaseline } from '../../components/tune/TuneDeltaVsBaseline.js';
import { buildTuneDeltaVsBaselineViewModel } from './tune-delta-vs-baseline-vm.js';
import { TuneGaugeExplorer } from '../../components/tune/TuneGaugeExplorer.js';
import { buildTuneGaugeExplorerViewModel } from './tune-gauge-explorer-vm.js';
import { TuneWttn } from '../../components/tune/TuneWttn.js';
import { TuneRecommendedBuilds } from '../../components/tune/TuneRecommendedBuilds.js';
import { TuneExplorePrompt } from '../../components/tune/TuneExplorePrompt.js';
import { TuneSliderAdornments } from '../../components/tune/TuneSliderAdornments.js';
import { buildTuneRecsViewModel } from './tune-recommended-builds-vm.js';
import { buildExplorePromptViewModel } from './tune-explore-prompt-vm.js';
import { buildTuneSliderAdornmentsViewModel } from './tune-slider-adornments-vm.js';
import { TuneSweepChart } from '../../components/tune/TuneSweepChart.js';
import type { TuneSweepChartHandle } from '../../components/tune/TuneSweepChart.js';

// Window extensions for external dependencies
// Module-level state
export let sweepChart: Chart | null = null;
let _isTunePageMounted = false;
let _tuneRefreshing = false;
let _pendingTuneRefresh = false;
let _tuneRecRenderToken = 0;
let _pendingTuneRenderFrame: number | null = null;
const _optimalBuildWindowMount: TuneReactMount = { root: null, host: null };
const _tuneBestValueMount: TuneReactMount = { root: null, host: null };
const _tuneObsMount: TuneReactMount = { root: null, host: null };
const _tuneHybridToggleMount: TuneReactMount = { root: null, host: null };
const _tuneDeltaVsBaselineMount: TuneReactMount = { root: null, host: null };
const _tuneGaugeExplorerMount: TuneReactMount = { root: null, host: null };
const _tuneRecsMount: TuneReactMount = { root: null, host: null };
const _tuneWttnMount: TuneReactMount = { root: null, host: null };
const _tuneExploreMount: TuneReactMount = { root: null, host: null };
const _tuneSliderAdornmentsMount: TuneReactMount = { root: null, host: null };
const _tuneSweepChartMount: TuneReactMount = { root: null, host: null };

export const tuneState = {
  baselineTension: 55,
  exploredTension: 55,
  originalTension: 55,
  hybridDimension: 'linked' as 'mains' | 'crosses' | 'linked',
  sweepData: null as Array<{ tension: number; stats: SetupAttributes }> | null,
  baselineStats: null as SetupAttributes | null,
  optimalWindow: null as { low: number; high: number; anchor: number; reason: string } | null,
  baseline: null as {
    _loadoutId: string;
    _frameId: string;
    _signature: string;
    frameId: string;
    stringId?: string;
    isHybrid: boolean;
    mainsId?: string | null;
    crossesId?: string | null;
    mainsTension: number;
    crossesTension: number;
    gauge?: string | null;
    mainsGauge?: string | null;
    crossesGauge?: string | null;
    stats: SetupAttributes;
    obs: number;
    identity: { archetype: string; description: string };
  } | null,
  explored: null as { stats: SetupAttributes; obs: number; identity: { archetype: string; description: string } } | null
};

export interface TunePageChromeSnapshot {
  subtitle: string;
  hasSetup: boolean;
  deltaTitle: string;
  sliderMin: number;
  sliderMax: number;
  sliderValue: number;
  sliderCurrentLabel: string;
  sliderCurrentValue: string;
  sliderPulseToken: number;
  applyButtonVisible: boolean;
  applyButtonText: string;
}

const DEFAULT_TUNE_SUBTITLE = '\u2014 Select a setup to begin tuning';
const DEFAULT_TUNE_PAGE_CHROME: TunePageChromeSnapshot = {
  subtitle: DEFAULT_TUNE_SUBTITLE,
  hasSetup: false,
  deltaTitle: 'DELTA VS BASELINE',
  sliderMin: 40,
  sliderMax: 70,
  sliderValue: 55,
  sliderCurrentLabel: 'Exploring',
  sliderCurrentValue: '55 lbs',
  sliderPulseToken: 0,
  applyButtonVisible: false,
  applyButtonText: 'Apply changes',
};

let _tunePageChrome: TunePageChromeSnapshot = { ...DEFAULT_TUNE_PAGE_CHROME };
const _tunePageChromeListeners = new Set<() => void>();

type RecommendedCandidate = RecommendedBuildsResult['all'][number];

// Chart.js instance (global Chart from index.html CDN; owned by TuneSweepChart.tsx)
type Chart = TuneSweepChartHandle;

function _onTuneSweepChartReady(chart: Chart | null): void {
  sweepChart = chart;
}

function _resetPendingTuneRenderState(): void {
  _tuneRecRenderToken += 1;
  if (_pendingTuneRenderFrame != null) {
    cancelAnimationFrame(_pendingTuneRenderFrame);
    _pendingTuneRenderFrame = null;
  }
}

function _notifyTunePageChromeListeners(): void {
  _tunePageChromeListeners.forEach((listener) => listener());
}

function _setTunePageChrome(partial: Partial<TunePageChromeSnapshot>): void {
  _tunePageChrome = { ..._tunePageChrome, ...partial };
  _notifyTunePageChromeListeners();
}

function _resetTunePageChrome(overrides?: Partial<TunePageChromeSnapshot>): void {
  _tunePageChrome = { ...DEFAULT_TUNE_PAGE_CHROME, ...overrides };
  _notifyTunePageChromeListeners();
}

export function getTunePageChrome(): TunePageChromeSnapshot {
  return _tunePageChrome;
}

export function subscribeTunePageChrome(listener: () => void): () => void {
  _tunePageChromeListeners.add(listener);
  return () => {
    _tunePageChromeListeners.delete(listener);
  };
}

function _buildTuneSubtitle(setup: { racquet: Racquet; stringConfig: StringConfig }): string {
  const { racquet, stringConfig } = setup;
  if (stringConfig.isHybrid) {
    const hybridConfig = stringConfig as StringConfig & { mains: StringData; crosses: StringData };
    return `${racquet.name} \u2014 ${hybridConfig.mains.name} / ${hybridConfig.crosses.name}`;
  }

  const fullBedConfig = stringConfig as StringConfig & { string: StringData };
  return `${racquet.name} \u2014 ${fullBedConfig.string.name}`;
}

function _buildTuneSliderReadout(
  setup: { racquet: Racquet; stringConfig: StringConfig } | null,
  exploredTension: number,
  hybridDimension: HybridDim,
): Pick<TunePageChromeSnapshot, 'sliderCurrentLabel' | 'sliderCurrentValue'> {
  const hasSplitTensions = Boolean(
    setup && setup.stringConfig.mainsTension !== undefined && setup.stringConfig.crossesTension !== undefined,
  );

  if (setup && hasSplitTensions && hybridDimension === 'mains') {
    return {
      sliderCurrentLabel: 'Exploring Mains',
      sliderCurrentValue: `${exploredTension} lbs`,
    };
  }

  if (setup && hasSplitTensions && hybridDimension === 'crosses') {
    return {
      sliderCurrentLabel: 'Exploring Crosses',
      sliderCurrentValue: `${exploredTension} lbs`,
    };
  }

  if (setup && hasSplitTensions && hybridDimension === 'linked') {
    const diff = setup.stringConfig.mainsTension - setup.stringConfig.crossesTension;
    const mainsValue = exploredTension;
    const crossesValue = Math.max(0, exploredTension - diff);
    return {
      sliderCurrentLabel: 'Exploring Linked',
      sliderCurrentValue: `M ${mainsValue} / X ${crossesValue} lbs`,
    };
  }

  return {
    sliderCurrentLabel: 'Exploring',
    sliderCurrentValue: `${exploredTension} lbs`,
  };
}

function _buildTuneDeltaTitle(stringConfig: StringConfig, hybridDimension: HybridDim): string {
  const hasSplitTensions = stringConfig.mainsTension !== undefined && stringConfig.crossesTension !== undefined;

  if (!hasSplitTensions) {
    return 'DELTA VS BASELINE';
  }

  if (hybridDimension === 'mains') {
    return 'DELTA VS BASELINE \u2014 MAINS ONLY';
  }

  if (hybridDimension === 'crosses') {
    return 'DELTA VS BASELINE \u2014 CROSSES ONLY';
  }

  return 'DELTA VS BASELINE \u2014 LINKED';
}

export function setTunePageMounted(isMounted: boolean): void {
  _isTunePageMounted = isMounted;
}

export function initTuneModeIfMounted(setup: { racquet: Racquet; stringConfig: StringConfig }): void {
  if (!_isTunePageMounted) return;
  initTuneMode(setup);
}

export function refreshTuneIfMounted(): void {
  if (!_isTunePageMounted) return;
  refreshTuneIfActive();
}

export function resetTunePreviewState(): void {
  _resetPendingTuneRenderState();
  tuneState.baseline = null;
  tuneState.explored = null;
  _resetTunePageChrome();
}

export function refreshTuneSweepChartIfMounted(setup: { racquet: Racquet; stringConfig: StringConfig }): void {
  if (!_isTunePageMounted) return;
  renderSweepChart(setup);
}

function _applyTuneInteractionFrame(): void {
  _pendingTuneRenderFrame = null;
  _recomputeExploredState();
  renderDeltaVsBaseline();
  renderBestValueMove();

  const setup = getCurrentSetup();
  if (setup) {
    renderOverallBuildScore(setup, false);
  }
  sweepChart?.update?.('none');

  _updateTuneApplyButton();
}

/**
 * Refresh tune panels if tune mode is active
 */
export function refreshTuneIfActive(): void {
  if (getCurrentMode() !== 'tune') return;
  if (_tuneRefreshing) {
    _pendingTuneRefresh = true;
    return;
  }
  _tuneRefreshing = true;
  try {
    invalidateSetupFromLoadoutCache();
    const setup = getCurrentSetup();
    if (setup) {
      initTuneMode(setup);
    } else {
      _resetTunePageChrome();
    }
  } finally {
    _tuneRefreshing = false;
    if (_pendingTuneRefresh) {
      _pendingTuneRefresh = false;
      queueMicrotask(() => refreshTuneIfActive());
    }
  }
}

/**
 * Get hybrid baseline tension
 */
export function getHybridBaselineTension(stringConfig: StringConfig, dimension: string): number {
  if (dimension === 'mains') return stringConfig.mainsTension;
  if (dimension === 'crosses') return stringConfig.crossesTension;
  return Math.round((stringConfig.mainsTension + stringConfig.crossesTension) / 2);
}

/**
 * Update slider label
 */
export function updateSliderLabel(): void {
  const setup = getCurrentSetup();
  const readout = _buildTuneSliderReadout(setup, tuneState.exploredTension, tuneState.hybridDimension);
  _setTunePageChrome({
    sliderValue: tuneState.exploredTension,
    ...readout,
  });
}

/**
 * Update delta card title
 */
export function updateDeltaTitle(stringConfig: StringConfig): void {
  _setTunePageChrome({
    deltaTitle: _buildTuneDeltaTitle(stringConfig, tuneState.hybridDimension),
  });
  const titleEl = document.querySelector('#tune-card-delta .tune-card-title');
  if (!titleEl) return;
  const dim = tuneState.hybridDimension;
  const hasSplitTensions = stringConfig && (stringConfig.mainsTension !== undefined && stringConfig.crossesTension !== undefined);

  if (hasSplitTensions) {
    if (dim === 'mains') {
      titleEl.textContent = 'DELTA VS BASELINE — MAINS ONLY';
    } else if (dim === 'crosses') {
      titleEl.textContent = 'DELTA VS BASELINE — CROSSES ONLY';
    } else {
      titleEl.textContent = 'DELTA VS BASELINE — LINKED';
    }
  } else {
    titleEl.textContent = 'DELTA VS BASELINE';
  }
}

/**
 * Generate string key for tune state comparison
 */
export function _tuneStringKey(lo: Loadout): string {
  return lo.isHybrid ? (lo.mainsId + '/' + lo.crossesId) : (lo.stringId || '');
}

function _tuneLoadoutSignature(lo: Loadout): string {
  return [
    lo.id,
    lo.frameId,
    _tuneStringKey(lo),
    lo.mainsTension,
    lo.crossesTension,
    lo.gauge || '',
    lo.mainsGauge || '',
    lo.crossesGauge || ''
  ].join('|');
}

/**
 * Initialize tune mode
 */
export function initTuneMode(setup: { racquet: Racquet; stringConfig: StringConfig }): void {
  const { racquet, stringConfig } = setup;
  const activeLoadout = getActiveLoadout();

  _resetPendingTuneRenderState();

  // Snapshot baseline from activeLoadout
  if (activeLoadout && (!tuneState.baseline || tuneState.baseline._signature !== _tuneLoadoutSignature(activeLoadout))) {
    const baselineScored = getScoredSetup({ racquet, stringConfig });
    tuneState.baseline = {
      _loadoutId: activeLoadout.id,
      _frameId: activeLoadout.frameId,
      _signature: _tuneLoadoutSignature(activeLoadout),
      frameId: activeLoadout.frameId,
      stringId: activeLoadout.stringId ?? undefined,
      isHybrid: activeLoadout.isHybrid,
      mainsId: activeLoadout.mainsId ?? undefined,
      crossesId: activeLoadout.crossesId ?? undefined,
      mainsTension: activeLoadout.mainsTension,
      crossesTension: activeLoadout.crossesTension,
      gauge: activeLoadout.gauge ?? undefined,
      mainsGauge: activeLoadout.mainsGauge ?? undefined,
      crossesGauge: activeLoadout.crossesGauge ?? undefined,
      stats: baselineScored.stats,
      obs: +baselineScored.obs.toFixed(1),
      identity: baselineScored.identity
    };
  }

  // Initialize explored to baseline
  if (tuneState.baseline) {
    tuneState.explored = {
      stats: tuneState.baseline.stats,
      obs: tuneState.baseline.obs,
      identity: tuneState.baseline.identity
    };
  }

  /*
  // Set subtitle
  const subtitleEl = document.getElementById('tune-subtitle');
  if (subtitleEl) {
    let subtitle = racquet.name;
    if (stringConfig.isHybrid) {
      subtitle += ` — ${(stringConfig as { mains: StringData; crosses: StringData }).mains.name} / ${(stringConfig as { mains: StringData; crosses: StringData }).crosses.name}`;
    } else {
      subtitle += ` — ${(stringConfig as { string: StringData }).string.name}`;
    }
    subtitleEl.textContent = subtitle;
  }

  // Show/hide panels
  document.getElementById('tune-empty')?.classList.add('hidden');
  document.getElementById('tune-panels')?.classList.remove('hidden');
  */
  _setTunePageChrome({
    subtitle: _buildTuneSubtitle(setup),
    hasSetup: true,
  });

  // Set baseline tension
  if (!['mains', 'crosses', 'linked'].includes(tuneState.hybridDimension)) {
    tuneState.hybridDimension = 'linked';
  }
  tuneState.baselineTension = getHybridBaselineTension(stringConfig, tuneState.hybridDimension);
  tuneState.exploredTension = tuneState.baselineTension;
  tuneState.originalTension = tuneState.baselineTension;

  // Configure slider
  const sliderMin = Math.max(racquet.tensionRange[0] - 5, 30);
  const sliderMax = Math.min(racquet.tensionRange[1] + 5, 75);
  _setTunePageChrome({
    sliderMin,
    sliderMax,
    sliderValue: tuneState.baselineTension,
    sliderPulseToken: 0,
    applyButtonVisible: false,
    applyButtonText: 'Apply changes',
  });

  updateSliderLabel();
  updateDeltaTitle(stringConfig);

  // Hybrid toggle
  renderTuneHybridToggle(stringConfig);

  // Run sweep and calculate optimal window
  runTensionSweep(setup);
  calculateOptimalWindow(setup);

  // Render all modules
  renderOptimalBuildWindow(sliderMin, sliderMax);
  renderDeltaVsBaseline();
  renderGaugeExplorer(setup);
  renderTuneSliderAdornments(sliderMin, sliderMax);
  renderSweepChart(setup);
  renderBestValueMove();
  renderOverallBuildScore(setup, true);
  void renderRecommendedBuilds(setup);

  // Reset Apply button
  _setTunePageChrome({
    applyButtonVisible: false,
    applyButtonText: 'Apply changes',
  });
}

/**
 * Run tension sweep
 */
export function runTensionSweep(setup: { racquet: Racquet; stringConfig: StringConfig }): void {
  const { racquet, stringConfig } = setup;
  const rawMin = Math.max(racquet.tensionRange[0] - 5, 30);
  const rawMax = Math.min(racquet.tensionRange[1] + 5, 75);
  const sweepMin = Math.min(rawMin, rawMax);
  const sweepMax = Math.max(rawMin, rawMax);
  const results: Array<{ tension: number; stats: SetupAttributes }> = [];

  for (let t = sweepMin; t <= sweepMax; t++) {
    let modifiedConfig: StringConfig;
    const diff = stringConfig.mainsTension - stringConfig.crossesTension;

    if (tuneState.hybridDimension === 'mains') {
      modifiedConfig = { ...stringConfig, mainsTension: t } as StringConfig;
    } else if (tuneState.hybridDimension === 'crosses') {
      modifiedConfig = { ...stringConfig, crossesTension: t } as StringConfig;
    } else {
      modifiedConfig = { ...stringConfig, mainsTension: t, crossesTension: t - diff } as StringConfig;
    }

    const stats = predictSetup(racquet, modifiedConfig);
    results.push({ tension: t, stats });
  }

  tuneState.sweepData = results;
  tuneState.baselineStats = results.find(r => r.tension === tuneState.baselineTension)?.stats
    || predictSetup(racquet, stringConfig);
}

/**
 * Calculate optimal window
 */
export function calculateOptimalWindow(setup: { racquet: Racquet }): void {
  const { racquet } = setup;
  const data = tuneState.sweepData;
  if (!data || data.length === 0) return;

  const scored = data.map(d => {
    const tCtx = { avgTension: d.tension, tensionRange: racquet.tensionRange, differential: 0, patternCrosses: 19 };
    const score = computeCompositeScore(d.stats, tCtx);
    return { tension: d.tension, score, stats: d.stats };
  });

  scored.sort((a, b) => b.score - a.score);
  const anchor = scored[0].tension;
  const peakScore = scored[0].score;

  const threshold = peakScore * 0.98;
  const inWindow = scored.filter(s => s.score >= threshold).map(s => s.tension);
  const low = Math.min(...inWindow);
  const high = Math.max(...inWindow);

  const anchorStats = scored[0].stats;
  let reason = 'Balanced performance';
  if (anchorStats.control >= 80) reason = 'Control Anchor — precision peaks here';
  else if (anchorStats.comfort >= 75) reason = 'Comfort Anchor — arm-friendly sweet spot';
  else if (anchorStats.spin >= 78) reason = 'Spin Anchor — maximum rotation';
  else reason = 'Balanced Anchor — best all-round performance';

  tuneState.optimalWindow = { low, high, anchor, reason };
}

/**
 * Render optimal build window
 */
export function renderOptimalBuildWindow(sMin: number, sMax: number): void {
  const container = document.getElementById('optimal-content');
  if (!container) return;

  const vm = buildOptimalBuildWindowViewModel(sMin, sMax, tuneState.optimalWindow, tuneState.sweepData);
  if (vm.status === 'skip') return;

  const root = _ensureTuneReactRoot(_optimalBuildWindowMount, container);
  if (!root) return;
  root.render(createElement(OptimalBuildWindow, { model: vm }));
}

/**
 * Render delta vs baseline
 */
export function renderDeltaVsBaseline(): void {
  const container = document.getElementById('delta-content');
  const data = tuneState.sweepData;
  if (!container || !data) return;

  const baselineEntry = data.find((d) => d.tension === tuneState.baselineTension);
  const exploredEntry = data.find((d) => d.tension === tuneState.exploredTension);
  if (!baselineEntry || !exploredEntry) return;

  const base = baselineEntry.stats;
  const explored = exploredEntry.stats;
  const isAtBaseline = tuneState.exploredTension === tuneState.baselineTension;
  const setup = getCurrentSetup();
  const isFirstRender = !container.querySelector('.delta-stats-grid');

  const vm = buildTuneDeltaVsBaselineViewModel(
    base,
    explored,
    isAtBaseline,
    setup,
    tuneState.baselineTension,
    tuneState.exploredTension,
    tuneState.hybridDimension,
    isFirstRender
  );

  const root = _ensureTuneReactRoot(_tuneDeltaVsBaselineMount, container);
  if (!root) return;
  root.render(createElement(TuneDeltaVsBaseline, { model: vm }));

  if (isFirstRender) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const host = document.getElementById('delta-content');
        if (!host) return;
        host.querySelectorAll('.stat-bar-track').forEach((track, idx) => {
          const trackEl = track as HTMLElement;
          const exploredValue = parseFloat(trackEl.dataset.explored || '0');
          const segments = trackEl.querySelectorAll('.stat-bar-segment');
          const filledCount = Math.round((exploredValue / 100) * segments.length);

          segments.forEach((seg, i) => {
            setTimeout(() => {
              if (i < filledCount) {
                seg.classList.add('active');
              }
            }, idx * 40 + i * 15);
          });
        });
      });
    });
  }
}

/**
 * Render gauge explorer
 */
export function renderGaugeExplorer(setup: { racquet: Racquet; stringConfig: StringConfig }): void {
  const container = document.getElementById('gauge-explore-content');
  if (!container) return;
  if (!setup) {
    const gr = _ensureTuneReactRoot(_tuneGaugeExplorerMount, container);
    if (gr) gr.render(null);
    else container.innerHTML = '';
    return;
  }

  const vm = buildTuneGaugeExplorerViewModel(setup);
  if (vm.kind === 'empty') {
    const gr = _ensureTuneReactRoot(_tuneGaugeExplorerMount, container);
    if (gr) gr.render(null);
    else container.innerHTML = '';
    return;
  }

  const gr = _ensureTuneReactRoot(_tuneGaugeExplorerMount, container);
  if (!gr) return;
  gr.render(
    createElement(TuneGaugeExplorer, {
      model: vm,
      onApplyGauge: _applyGaugeSelection,
    }),
  );
}

function _setGaugeSelectByMm(select: HTMLSelectElement | null, mm: number): void {
  if (!select) return;
  for (let i = 0; i < select.options.length; i += 1) {
    const v = parseFloat(select.options[i].value);
    if (Number.isFinite(v) && Math.abs(v - mm) < 0.001) {
      select.selectedIndex = i;
      return;
    }
  }
}

function _loadoutNameFromSetup(racquet: Racquet, stringConfig: StringConfig): string {
  if (stringConfig.isHybrid) {
    return `${stringConfig.mains.name} / ${stringConfig.crosses.name} on ${racquet.name}`;
  }
  return `${stringConfig.string.name} on ${racquet.name}`;
}

/** Apply a gauge column from the explorer — updates the active loadout and dock. */
export function _applyGaugeSelection(gaugeMm: number, sectionIndex: number): void {
  const active = getActiveLoadout();
  if (!active) return;

  const setup = getCurrentSetup();
  if (!setup) return;

  const { stringConfig, racquet } = setup;
  const next: Loadout = { ...active };

  if (stringConfig.isHybrid) {
    if (sectionIndex === 0) {
      next.mainsGauge = String(gaugeMm);
    } else if (sectionIndex === 1) {
      next.crossesGauge = String(gaugeMm);
    } else {
      return;
    }
  } else if (sectionIndex === 0) {
    next.gauge = String(gaugeMm);
  } else {
    return;
  }

  const resolved = getSetupFromLoadout(next);
  if (!resolved) return;

  const scored = getScoredSetup(resolved);
  next.stats = scored.stats;
  next.obs = +scored.obs.toFixed(1);
  next.identity = scored.identity?.name || scored.identity?.archetype || '';
  next.name = _loadoutNameFromSetup(resolved.racquet, resolved.stringConfig);

  const inSaved = getSavedLoadouts().some((l) => l.id === next.id);
  next._dirty = inSaved;

  setActiveLoadout(next);
  if (inSaved) {
    saveLoadout(next);
  }

  if (!stringConfig.isHybrid) {
    _setGaugeSelectByMm(document.getElementById('gauge-select-full') as HTMLSelectElement | null, gaugeMm);
  } else if (sectionIndex === 0) {
    _setGaugeSelectByMm(document.getElementById('gauge-select-mains') as HTMLSelectElement | null, gaugeMm);
  } else {
    _setGaugeSelectByMm(document.getElementById('gauge-select-crosses') as HTMLSelectElement | null, gaugeMm);
  }

  syncViews('tune-gauge-apply', { activeLoadout: true, dockEditorContext: true });

  const fresh = getCurrentSetup();
  if (fresh) {
    initTuneMode(fresh);
  }
}

/**
 * Slider track adornments: optimal zone, baseline marker, original tension marker (React).
 */
export function renderTuneSliderAdornments(sliderMin: number, sliderMax: number): void {
  const container = document.getElementById('tune-slider-adornments-root');
  if (!container) return;

  const vm = buildTuneSliderAdornmentsViewModel(
    sliderMin,
    sliderMax,
    tuneState.baselineTension,
    tuneState.optimalWindow,
    tuneState.originalTension
  );
  const r = _ensureTuneReactRoot(_tuneSliderAdornmentsMount, container);
  if (!r) return;
  r.render(createElement(TuneSliderAdornments, { model: vm }));
}

/**
 * Render sweep chart (React TuneSweepChart → Chart.js; annotations read live tensions via getter).
 */
export function renderSweepChart(_setup: { racquet: Racquet }): void {
  const data = tuneState.sweepData;
  const container = document.getElementById('sweep-chart-root');
  if (!container) return;

  const r = _ensureTuneReactRoot(_tuneSweepChartMount, container);
  if (!r) return;

  if (!data || data.length === 0) {
    r.render(null);
    sweepChart = null;
    return;
  }

  const chartTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const loadout = getActiveLoadout();
  const sweepKey = `${loadout?.id ?? 'none'}|${data[0]?.tension}-${data[data.length - 1]?.tension}|${data.length}`;

  r.render(
    createElement(TuneSweepChart, {
      key: sweepKey,
      sweepData: data,
      getTensions: () => ({
        baselineTension: tuneState.baselineTension,
        exploredTension: tuneState.exploredTension,
      }),
      chartTheme,
      onChartReady: _onTuneSweepChartReady,
    })
  );
}

/**
 * Render best value move
 */
export function renderBestValueMove(): void {
  const container = document.getElementById('slider-best-value');
  if (!container) return;

  const vm = buildTuneBestValueViewModel(tuneState.sweepData, tuneState.optimalWindow, tuneState.exploredTension);
  if (vm.status === 'empty') {
    const br = _ensureTuneReactRoot(_tuneBestValueMount, container);
    if (br) br.render(createElement(TuneBestValueCallout, { model: vm }));
    else container.innerHTML = '';
    return;
  }

  const br = _ensureTuneReactRoot(_tuneBestValueMount, container);
  if (!br) return;
  br.render(createElement(TuneBestValueCallout, { model: vm }));
}

function _onHybridDimSelect(dim: HybridDim): void {
  tuneState.hybridDimension = dim;
  const setup = getCurrentSetup();
  if (setup) {
    tuneState.baselineTension = getHybridBaselineTension(setup.stringConfig, dim);
    tuneState.exploredTension = tuneState.baselineTension;
    const slider = document.getElementById('tune-slider') as HTMLInputElement | null;
    if (slider) slider.value = String(tuneState.baselineTension);
    updateSliderLabel();
    runTensionSweep(setup);
    calculateOptimalWindow(setup);
    renderOptimalBuildWindow(parseInt(slider?.min || '30'), parseInt(slider?.max || '75'));
    renderDeltaVsBaseline();
    renderGaugeExplorer(setup);
    renderTuneSliderAdornments(parseInt(slider?.min || '30'), parseInt(slider?.max || '75'));
    renderSweepChart(setup);
    renderBestValueMove();
    _recomputeExploredState();
    renderOverallBuildScore(setup, true);
    void renderRecommendedBuilds(setup);
  }
}

/**
 * Render tune hybrid toggle
 */
export function renderTuneHybridToggle(stringConfig: StringConfig): void {
  const container = document.getElementById('tune-hybrid-toggle');
  if (!container) return;

  const vm = buildTuneHybridDimToggleViewModel(stringConfig, tuneState.hybridDimension);

  if (!vm.visible) {
    const hr = _ensureTuneReactRoot(_tuneHybridToggleMount, container);
    if (hr) hr.render(null);
    else container.innerHTML = '';
    (container as HTMLElement).style.display = 'none';
    return;
  }

  (container as HTMLElement).style.display = 'flex';

  const hr = _ensureTuneReactRoot(_tuneHybridToggleMount, container);
  if (!hr) return;
  hr.render(
    createElement(TuneHybridDimToggle, {
      model: vm,
      onSelectDim: _onHybridDimSelect,
    })
  );
}

/**
 * Handle tune slider input
 */
export function onTuneSliderInput(e: Event): void {
  const val = parseInt((e.target as HTMLInputElement).value);
  tuneState.exploredTension = val;
  updateSliderLabel();
  _updateTuneApplyButton();
  _setTunePageChrome({
    sliderPulseToken: getTunePageChrome().sliderPulseToken + 1,
  });

  if (_pendingTuneRenderFrame != null) {
    cancelAnimationFrame(_pendingTuneRenderFrame);
  }
  _pendingTuneRenderFrame = requestAnimationFrame(_applyTuneInteractionFrame);
}

/**
 * Recompute explored state
 */
export function _recomputeExploredState(): void {
  const baseline = tuneState.baseline;
  if (!baseline) return;

  const setup = getCurrentSetup();
  if (!setup) return;

  const sweepEntry = tuneState.sweepData?.find((entry) => entry.tension === tuneState.exploredTension);
  if (sweepEntry) {
    const linkedDiff = baseline.mainsTension - baseline.crossesTension;
    const exploredConfig =
      tuneState.hybridDimension === 'linked'
        ? { ...setup.stringConfig, mainsTension: tuneState.exploredTension, crossesTension: Math.max(0, tuneState.exploredTension - linkedDiff) }
        : tuneState.hybridDimension === 'mains'
          ? { ...setup.stringConfig, mainsTension: tuneState.exploredTension }
          : { ...setup.stringConfig, crossesTension: tuneState.exploredTension };
    const tCtx = buildTensionContext(exploredConfig as StringConfig, setup.racquet);
    const obs = computeCompositeScore(sweepEntry.stats, tCtx);
    tuneState.explored = {
      stats: sweepEntry.stats,
      obs: +obs.toFixed(1),
      identity: tuneState.explored?.identity || baseline.identity
    };
    return;
  }

  let mainsTension = baseline.mainsTension;
  let crossesTension = baseline.crossesTension;

  if (tuneState.hybridDimension === 'linked') {
    const diff = baseline.mainsTension - baseline.crossesTension;
    mainsTension = tuneState.exploredTension;
    crossesTension = Math.max(0, tuneState.exploredTension - diff);
  } else if (tuneState.hybridDimension === 'mains') {
    mainsTension = tuneState.exploredTension;
  } else {
    crossesTension = tuneState.exploredTension;
  }

  const snapshotLoadout: Loadout = {
    id: baseline._loadoutId,
    name: 'Tune Snapshot',
    frameId: baseline.frameId,
    stringId: baseline.stringId ?? null,
    isHybrid: baseline.isHybrid,
    mainsId: baseline.mainsId ?? null,
    crossesId: baseline.crossesId ?? null,
    mainsTension,
    crossesTension,
    gauge: baseline.gauge ?? null,
    mainsGauge: baseline.mainsGauge ?? null,
    crossesGauge: baseline.crossesGauge ?? null,
    obs: baseline.obs,
    identity: baseline.identity?.archetype || '',
    _dirty: false
  };

  const exploredSetup = getSetupFromLoadout(snapshotLoadout);
  if (!exploredSetup) return;

  const stats = predictSetup(exploredSetup.racquet, exploredSetup.stringConfig);
  const tCtx = buildTensionContext(exploredSetup.stringConfig, exploredSetup.racquet);
  const obs = computeCompositeScore(stats, tCtx);
  const identity = generateIdentity(stats, exploredSetup.racquet, exploredSetup.stringConfig);

  tuneState.explored = { stats, obs: +obs.toFixed(1), identity };
}

/**
 * Update tune apply button visibility
 */
export function _updateTuneApplyButton(): void {
  if (!tuneState.baseline || !tuneState.explored) {
    _setTunePageChrome({ applyButtonVisible: false, applyButtonText: 'Apply changes' });
    return;
  }
  const tensionChanged = tuneState.exploredTension !== tuneState.baselineTension;
  const delta = tuneState.explored.obs - tuneState.baseline.obs;
  if (!tensionChanged) {
    _setTunePageChrome({ applyButtonVisible: false, applyButtonText: 'Apply changes' });
    return;
  }
  const sign = delta > 0 ? '+' : '';
  const nextText = Math.abs(delta) <= 0.05
    ? 'Apply explored tension'
    : `Apply changes (${sign}${delta.toFixed(1)} OBS)`;
  _setTunePageChrome({
    applyButtonVisible: true,
    applyButtonText: nextText,
  });
}

export function renderOverallBuildScore(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  animate = false
): void {
  const container = document.getElementById('obs-content');
  if (!container) return;

  const inTuneMode = getCurrentMode() === 'tune';
  const vm = buildTuneObsBuildScoreViewModel(
    setup,
    inTuneMode,
    tuneState.explored,
    typeof tuneState.baseline?.obs === 'number' ? tuneState.baseline.obs : null
  );

  const or = _ensureTuneReactRoot(_tuneObsMount, container);
  if (!or) return;
  or.render(createElement(TuneObsBuildScore, { model: vm }));

  if (animate) {
    animateOBSInContainer(container, '.obs-score-value', vm.score, 400, _prevObsValues.tune);
  }
  _prevObsValues.tune = vm.score;
}

function _getCurrentRecommendationKey(stringConfig: StringConfig): string | null {
  if (stringConfig.isHybrid) {
    const hybridConfig = stringConfig as StringConfig & {
      mains?: StringData;
      crosses?: StringData;
      mainsId?: string;
      crossesId?: string;
    };
    const mainsId = hybridConfig.mains?.id || hybridConfig.mainsId;
    const crossesId = hybridConfig.crosses?.id || hybridConfig.crossesId;
    return mainsId && crossesId ? `hybrid:${mainsId}/${crossesId}` : null;
  }

  const fullbedConfig = stringConfig as StringConfig & { string?: StringData };
  return fullbedConfig.string?.id ? `full:${fullbedConfig.string.id}` : null;
}

function _getRecommendationKey(candidate: RecommendedCandidate): string {
  return candidate.type === 'hybrid'
    ? `hybrid:${candidate.mainsId}/${candidate.crossesId}`
    : `full:${candidate.stringId}`;
}

function _buildTuneRecommendationLoadout(
  frameId: string,
  stringId: string,
  tension: number,
  type: string,
  mainsId?: string,
  crossesId?: string
): Loadout | null {
  const opts: {
    source: string;
    isHybrid?: boolean;
    mainsId?: string;
    crossesId?: string;
    crossesTension?: number;
  } = { source: 'manual' };

  if (type === 'hybrid' && mainsId && crossesId) {
    opts.isHybrid = true;
    opts.mainsId = mainsId;
    opts.crossesId = crossesId;
    opts.crossesTension = tension - 2;
  }

  return createLoadout(frameId, type === 'hybrid' ? mainsId || null : stringId, tension, opts);
}

export function renderWhatToTryNext(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  candidates: RecommendedCandidate[]
): void {
  const container = document.getElementById('wttn-content');
  if (!container) return;
  const vm = buildWhatToTryNextViewModel(setup, candidates);
  const wr = _ensureTuneReactRoot(_tuneWttnMount, container);
  if (!wr) return;
  wr.render(
    createElement(TuneWttn, {
      model: vm,
      onApply: ({ stringId, tension, pickType, mainsId, crossesId }) => {
        _applyWttnBuild(setup.racquet.id, stringId, tension, pickType, mainsId, crossesId);
      },
      onSave: ({ frameId, stringId, tension, pickType, mainsId, crossesId }) => {
        _saveWttnBuild(frameId, stringId, tension, pickType, mainsId, crossesId);
      },
    }),
  );
}

export function renderExplorePrompt(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  isCurrentInTop: boolean,
  topBuilds: RecommendedCandidate[]
): void {
  const row = document.getElementById('tune-row-explore');
  const container = document.getElementById('explore-content');
  if (!row || !container) return;

  const vm = buildExplorePromptViewModel(setup, isCurrentInTop, topBuilds);

  if (setup.stringConfig.isHybrid) {
    row.classList.remove('hidden');
    const er = _ensureTuneReactRoot(_tuneExploreMount, container);
    if (!er) return;
    er.render(createElement(TuneExplorePrompt, { model: vm }));
    return;
  }

  if (isCurrentInTop) {
    row.classList.add('hidden');
    const er = _ensureTuneReactRoot(_tuneExploreMount, container);
    if (er) er.render(null);
    else container.innerHTML = '';
    return;
  }

  row.classList.remove('hidden');
  const er = _ensureTuneReactRoot(_tuneExploreMount, container);
  if (!er) return;
  er.render(createElement(TuneExplorePrompt, { model: vm }));
}

export async function renderRecommendedBuilds(setup: { racquet: Racquet; stringConfig: StringConfig }): Promise<void> {
  const container = document.getElementById('recs-content');
  if (!container) return;

  const token = ++_tuneRecRenderToken;
  const recommendations = await generateRecommendedBuilds(setup);
  if (token !== _tuneRecRenderToken) return;
  const currentKey = _getCurrentRecommendationKey(setup.stringConfig);
  const topCombined = [...recommendations.fullBed, ...recommendations.hybrid];

  const recsVm = buildTuneRecsViewModel(setup, recommendations, currentKey);
  const rr = _ensureTuneReactRoot(_tuneRecsMount, container);
  if (!rr) return;
  rr.render(
    createElement(TuneRecommendedBuilds, {
      model: recsVm,
      onApply: ({ racquetId, stringId, tension, type, mainsId, crossesId }) => {
        _applyRecBuild(racquetId, stringId, tension, type, mainsId, crossesId);
      },
      onSave: ({ racquetId, stringId, tension, type, mainsId, crossesId }) => {
        _saveRecBuild(racquetId, stringId, tension, type, mainsId, crossesId);
      },
    }),
  );

  renderExplorePrompt(setup, recommendations.isCurrentInTop, topCombined);
  renderWhatToTryNext(setup, recommendations.all);
}

export function _applyWttnBuild(
  frameId: string,
  stringId: string,
  tension: number,
  type: string,
  mainsId?: string,
  crossesId?: string,
): void {
  const loadout = _buildTuneRecommendationLoadout(frameId, stringId, tension, type, mainsId, crossesId);
  if (loadout) {
    activateLoadout(loadout);
    const newSetup = getCurrentSetup();
    if (newSetup) initTuneMode(newSetup);
  }
}

export function _applyRecBuild(
  racquetId: string,
  stringId: string,
  tension: number,
  type: string,
  mainsId?: string,
  crossesId?: string
): void {
  const loadout = _buildTuneRecommendationLoadout(racquetId, stringId, tension, type, mainsId, crossesId);
  if (loadout) {
    activateLoadout(loadout);
    const newSetup = getCurrentSetup();
    if (newSetup) initTuneMode(newSetup);
  }
}

export function _saveWttnBuild(
  frameId: string,
  stringId: string,
  tension: number,
  type: string,
  mainsId?: string,
  crossesId?: string,
): void {
  const loadout = _buildTuneRecommendationLoadout(frameId, stringId, tension, type, mainsId, crossesId);
  if (loadout) {
    saveLoadout(loadout);
  }
}

export function _saveRecBuild(
  racquetId: string,
  stringId: string,
  tension: number,
  type: string,
  mainsId?: string,
  crossesId?: string
): void {
  const loadout = _buildTuneRecommendationLoadout(racquetId, stringId, tension, type, mainsId, crossesId);
  if (loadout) {
    saveLoadout(loadout);
  }
}

/**
 * Commit tune sandbox changes
 */
export function tuneSandboxCommit(): void {
  const activeLoadout = getActiveLoadout();
  if (!tuneState.explored || !activeLoadout) return;
  if (!tuneState.baseline) return;

  const diff = tuneState.baseline.mainsTension - tuneState.baseline.crossesTension;
  let newMainsTension = tuneState.baseline.mainsTension;
  let newCrossesTension = tuneState.baseline.crossesTension;

  if (tuneState.hybridDimension === 'mains') {
    newMainsTension = tuneState.exploredTension;
  } else if (tuneState.hybridDimension === 'crosses') {
    newCrossesTension = tuneState.exploredTension;
  } else {
    newMainsTension = tuneState.exploredTension;
    newCrossesTension = tuneState.exploredTension - diff;
  }

  const updatedLoadout: Loadout = {
    ...activeLoadout,
    mainsTension: newMainsTension,
    crossesTension: newCrossesTension,
  };

  const freshSetup = getSetupFromLoadout(updatedLoadout);
  if (freshSetup) {
    const stats = predictSetup(freshSetup.racquet, freshSetup.stringConfig);
    const tCtx = buildTensionContext(freshSetup.stringConfig, freshSetup.racquet);
    updatedLoadout.stats = stats;
    updatedLoadout.obs = +computeCompositeScore(stats, tCtx).toFixed(1);
    updatedLoadout.identity = generateIdentity(stats, freshSetup.racquet, freshSetup.stringConfig)?.name || '';
  }
  updatedLoadout._dirty = getSavedLoadouts().some((loadout) => loadout.id === updatedLoadout.id);
  setActiveLoadout(updatedLoadout);

  tuneState.baseline = null;
  tuneState.explored = null;
  tuneState.baselineTension = tuneState.exploredTension;
  persistActiveLoadout(updatedLoadout);

  const resetSetup = getSetupFromLoadout(updatedLoadout);
  if (resetSetup) {
    initTuneMode(resetSetup);
  }

  _setTunePageChrome({
    applyButtonVisible: false,
    applyButtonText: 'Apply changes',
  });

  renderDockPanel();
}

/**
 * Apply explored tension to main setup
 */
export function applyExploredTension(): void {
  if (!tuneState.explored) return;
  tuneSandboxCommit();
}
