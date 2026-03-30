// src/ui/pages/tune.ts
// Tune page - tension exploration and optimization

import {
  predictSetup,
  buildTensionContext,
  computeCompositeScore,
  generateIdentity,
  getObsTier,
  applyGaugeModifier
} from '../../engine/index.js';
import type { Racquet, StringData, SetupAttributes, StringConfig, Loadout } from '../../engine/types.js';
import { GAUGE_LABELS } from '../../engine/constants.js';
import { getGaugeOptions } from '../../engine/string-profile.js';
import { STRINGS } from '../../data/loader.js';
import { createLoadout, saveLoadout } from '../../state/loadout.js';
import { getActiveLoadout, getSavedLoadouts, setActiveLoadout } from '../../state/store.js';
import { syncViews } from '../../runtime/coordinator.js';
import { getCurrentSetup, getSetupFromLoadout } from '../../state/setup-sync.js';
import { getCurrentMode } from '../../state/app-state.js';
import { activateLoadout, commitEditorToLoadout } from './shell.js';
import { renderDockPanel } from '../components/dock-renderers.js';
import { renderDashboard as _renderDashboard } from './overview.js';
import { _prevObsValues, animateOBS } from '../components/obs-animation.js';
import {
  generateRecommendedBuilds,
  renderWhatToTryNext as renderSharedWhatToTryNext,
  renderExplorePrompt as renderSharedExplorePrompt
} from '../shared/recommendations.js';
import { getScoredSetup } from '../../utils/performance.js';

// Window extensions for external dependencies
// Module-level state
export let sweepChart: Chart | null = null;
let _tuneRefreshing = false;
let _pendingTuneRenderFrame: number | null = null;

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

type RecommendedCandidate = ReturnType<typeof generateRecommendedBuilds>['all'][number];

// Chart.js type
type Chart = {
  destroy: () => void;
  data?: { labels?: number[]; datasets?: Array<Record<string, unknown>> };
  options?: Record<string, unknown>;
  update?: (mode?: string) => void;
};

declare const Chart: new (ctx: CanvasRenderingContext2D, config: Record<string, unknown>) => Chart;

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
  if (getCurrentMode() !== 'tune' || _tuneRefreshing) return;
  _tuneRefreshing = true;
  try {
    const setup = getCurrentSetup();
    if (setup) {
      initTuneMode(setup);
    } else {
      document.getElementById('tune-empty')?.classList.remove('hidden');
      document.getElementById('tune-panels')?.classList.add('hidden');
    }
  } finally {
    _tuneRefreshing = false;
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
  const val = tuneState.exploredTension;
  const dim = tuneState.hybridDimension;
  const setup = getCurrentSetup();
  const labelEl = document.querySelector('.slider-current-label');
  const valueEl = document.getElementById('slider-current-value');

  if (!labelEl || !valueEl) return;

  const hasSplitTensions = setup && (setup.stringConfig.mainsTension !== undefined && setup.stringConfig.crossesTension !== undefined);

  if (hasSplitTensions && dim === 'mains') {
    labelEl.textContent = 'Exploring Mains';
    valueEl.textContent = `${val} lbs`;
  } else if (hasSplitTensions && dim === 'crosses') {
    labelEl.textContent = 'Exploring Crosses';
    valueEl.textContent = `${val} lbs`;
  } else if (hasSplitTensions && dim === 'linked') {
    const diff = setup.stringConfig.mainsTension - setup.stringConfig.crossesTension;
    const mainsVal = val;
    const crossesVal = Math.max(0, val - diff);
    labelEl.textContent = 'Exploring Linked';
    valueEl.textContent = `M ${mainsVal} / X ${crossesVal} lbs`;
  } else {
    labelEl.textContent = 'Exploring';
    valueEl.textContent = `${val} lbs`;
  }
}

/**
 * Update delta card title
 */
export function updateDeltaTitle(stringConfig: StringConfig): void {
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
  const slider = document.getElementById('tune-slider') as HTMLInputElement | null;
  if (slider) {
    slider.min = String(sliderMin);
    slider.max = String(sliderMax);
    slider.value = String(tuneState.baselineTension);
  }
  const labelMin = document.getElementById('slider-label-min');
  const labelMax = document.getElementById('slider-label-max');
  if (labelMin) labelMin.textContent = String(sliderMin);
  if (labelMax) labelMax.textContent = String(sliderMax);

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
  renderBaselineMarker(sliderMin, sliderMax);
  renderOptimalZone(sliderMin, sliderMax);
  renderSweepChart(setup);
  renderBestValueMove();
  renderOverallBuildScore(setup, true);
  renderRecommendedBuilds(setup);
  renderOriginalTensionMarker();

  // Reset Apply button
  const applyBtn = document.getElementById('tune-apply-btn');
  if (applyBtn) {
    applyBtn.classList.add('hidden');
    applyBtn.textContent = 'Apply changes';
  }

  _bindTuneDelegates();
}

let _tuneDelegateBound = false;

function _bindTuneDelegates(): void {
  if (_tuneDelegateBound) return;
  _tuneDelegateBound = true;

  document.addEventListener('click', (e: Event) => {
    const el = (e.target as Element).closest('[data-tune-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.tuneAction!;

    if (action === 'wttnApply') {
      _applyWttnBuild(el);
    } else if (action === 'wttnSave') {
      _saveWttnBuild(el);
    } else if (action === 'applyGauge') {
      const gauge = parseFloat(el.dataset.gauge ?? '0');
      const section = parseInt(el.dataset.section ?? '0', 10);
      _applyGaugeSelection(gauge, section);
    } else if (action === 'applyRec') {
      _applyRecBuild(
        el.dataset.racquetId ?? '',
        el.dataset.stringId ?? '',
        parseInt(el.dataset.tension ?? '0', 10),
        el.dataset.type ?? 'full',
        el.dataset.mainsId || undefined,
        el.dataset.crossesId || undefined
      );
    } else if (action === 'saveRec') {
      _saveRecBuild(
        el.dataset.racquetId ?? '',
        el.dataset.stringId ?? '',
        parseInt(el.dataset.tension ?? '0', 10),
        el.dataset.type ?? 'full',
        el.dataset.mainsId || undefined,
        el.dataset.crossesId || undefined
      );
    }
  });
}

/**
 * Run tension sweep
 */
export function runTensionSweep(setup: { racquet: Racquet; stringConfig: StringConfig }): void {
  const { racquet, stringConfig } = setup;
  const sweepMin = Math.max(racquet.tensionRange[0] - 5, 30);
  const sweepMax = Math.min(racquet.tensionRange[1] + 5, 75);
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

  const w = tuneState.optimalWindow;
  if (!w) {
    container.innerHTML = '<p class="tune-muted">No data</p>';
    return;
  }

  const anchorStats = tuneState.sweepData?.find(d => d.tension === w.anchor)?.stats;
  if (!anchorStats) return;

  const scaleMin = sMin || w.low - 10;
  const scaleMax = sMax || w.high + 10;
  const scaleRange = scaleMax - scaleMin || 1;

  const fillLeft = ((w.low - scaleMin) / scaleRange) * 100;
  const fillRight = ((w.high - scaleMin) / scaleRange) * 100;
  const fillWidth = fillRight - fillLeft;

  let anchorPct = ((w.anchor - scaleMin) / scaleRange) * 100;
  anchorPct = Math.max(2, Math.min(98, anchorPct));

  container.innerHTML = `
    <div class="optimal-range">
      <div class="optimal-range-visual">
        <span class="optimal-range-low">${scaleMin}</span>
        <div class="optimal-range-bar">
          <div class="optimal-range-fill" style="left:${fillLeft}%;width:${fillWidth}%"></div>
          <div class="optimal-range-anchor" style="left:${anchorPct}%">
            <span class="optimal-anchor-label">${w.anchor} lbs</span>
          </div>
        </div>
        <span class="optimal-range-high">${scaleMax}</span>
      </div>
      <p class="optimal-reason">${w.reason}</p>
    </div>
    <div class="optimal-stats-grid">
      <div class="optimal-stat">
        <span class="optimal-stat-label">Control</span>
        <span class="optimal-stat-value${anchorStats.control > 70 ? ' high' : ''}">${anchorStats.control}</span>
      </div>
      <div class="optimal-stat-divider"></div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Comfort</span>
        <span class="optimal-stat-value${anchorStats.comfort > 70 ? ' high' : ''}">${anchorStats.comfort}</span>
      </div>
      <div class="optimal-stat-divider"></div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Spin</span>
        <span class="optimal-stat-value${anchorStats.spin > 70 ? ' high' : ''}">${anchorStats.spin}</span>
      </div>
      <div class="optimal-stat-divider"></div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Power</span>
        <span class="optimal-stat-value${anchorStats.power > 70 ? ' high' : ''}">${anchorStats.power}</span>
      </div>
    </div>
  `;
}

/**
 * Render delta vs baseline
 */
export function renderDeltaVsBaseline(): void {
  const container = document.getElementById('delta-content');
  const data = tuneState.sweepData;
  if (!container || !data) return;

  const baselineEntry = data.find(d => d.tension === tuneState.baselineTension);
  const exploredEntry = data.find(d => d.tension === tuneState.exploredTension);
  if (!baselineEntry || !exploredEntry) return;

  const base = baselineEntry.stats;
  const explored = exploredEntry.stats;
  const deltaKeys: Array<keyof SetupAttributes> = ['control', 'power', 'comfort', 'spin', 'launch', 'feel', 'playability'];
  const deltaLabels = ['Control', 'Power', 'Comfort', 'Spin', 'Launch', 'Feel', 'Playability'];

  const isAtBaseline = tuneState.exploredTension === tuneState.baselineTension;
  const setup = getCurrentSetup();
  const isHybrid = setup?.stringConfig.isHybrid;
  const dim = tuneState.hybridDimension;

  let baseLabel = `Baseline: ${tuneState.baselineTension} lbs`;
  let exploreLabel = isAtBaseline ? 'At baseline' : `Exploring: ${tuneState.exploredTension} lbs`;
  if (isHybrid && setup) {
    if (dim === 'mains') {
      baseLabel = `Mains Baseline: ${tuneState.baselineTension} lbs`;
      exploreLabel = isAtBaseline ? 'At baseline' : `Mains: ${tuneState.exploredTension} lbs`;
    } else if (dim === 'crosses') {
      baseLabel = `Crosses Baseline: ${tuneState.baselineTension} lbs`;
      exploreLabel = isAtBaseline ? 'At baseline' : `Crosses: ${tuneState.exploredTension} lbs`;
    } else {
      const diff = setup.stringConfig.mainsTension - setup.stringConfig.crossesTension;
      baseLabel = `Linked Baseline: M ${tuneState.baselineTension} / X ${Math.max(0, tuneState.baselineTension - diff)} lbs`;
      if (!isAtBaseline) {
        exploreLabel = `Linked: M ${tuneState.exploredTension} / X ${Math.max(0, tuneState.exploredTension - diff)} lbs`;
      }
    }
  }

  const isFirstRender = !container.querySelector('.delta-stats-grid');
  if (isFirstRender) {
    const renderBatteryBar = (value: number): string => {
      const segments = 20;
      let segmentsHtml = '';
      const filledCount = Math.round((value / 100) * segments);

      for (let i = 0; i < segments; i++) {
        let segClass = '';
        if (i < filledCount) {
          const segValue = (i / segments) * 100;
          segClass = segValue >= 70 ? 'high' : 'filled';
        } else {
          segClass = 'empty';
        }
        segmentsHtml += `<div class="stat-bar-segment ${segClass}"></div>`;
      }

      return segmentsHtml;
    };

    container.innerHTML = `
      <div class="delta-header-row">
        <span class="delta-baseline-label">${baseLabel}</span>
        <span class="delta-explored-label" id="delta-explored-label">${exploreLabel}</span>
      </div>
      <div class="delta-stats-grid">
        ${deltaKeys.map((key, i) => {
          const diff = Math.round((explored[key] as number) - (base[key] as number));
          const cls = diff > 0 ? 'delta-positive' : diff < 0 ? 'delta-negative' : 'delta-neutral';
          const sign = diff > 0 ? '+' : '';
          return `
            <div class="delta-stat-row" data-stat="${String(key)}">
              <span class="delta-stat-label">${deltaLabels[i]}</span>
              <div class="stat-bar-track" id="delta-track-${String(key)}" data-baseline="${base[key]}" data-explored="${explored[key]}">
                ${renderBatteryBar(explored[key] as number)}
              </div>
              <span class="delta-stat-diff ${cls}" id="delta-diff-${String(key)}">${isAtBaseline ? '—' : `${sign}${diff}`}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.querySelectorAll('.stat-bar-track').forEach((track, idx) => {
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
  } else {
    _updateDeltaBatteryBars(base, explored, isAtBaseline);
    const exploreLabelEl = document.getElementById('delta-explored-label');
    if (exploreLabelEl) exploreLabelEl.textContent = exploreLabel;
  }
}

/**
 * Update delta battery bars
 */
function _updateDeltaBatteryBars(baseStats: SetupAttributes, exploredStats: SetupAttributes, isAtBaseline: boolean): void {
  const deltaKeys: Array<keyof SetupAttributes> = ['control', 'power', 'comfort', 'spin', 'launch', 'feel', 'playability'];
  const segments = 20;

  deltaKeys.forEach((key) => {
    const baseVal = Math.round(baseStats[key] as number);
    const exploredVal = Math.round(exploredStats[key] as number);
    const diff = exploredVal - baseVal;

    const track = document.getElementById(`delta-track-${String(key)}`) as HTMLElement | null;
    const diffEl = document.getElementById(`delta-diff-${String(key)}`);
    if (!track) return;

    const baseFilled = Math.round((baseVal / 100) * segments);
    const exploredFilled = Math.round((exploredVal / 100) * segments);

    let segmentsHtml = '';
    for (let i = 0; i < segments; i++) {
      let segClass = 'empty';

      if (isAtBaseline) {
        if (i < baseFilled) {
          const segValue = (i / segments) * 100;
          segClass = segValue >= 70 ? 'high active' : 'filled active';
        }
      } else {
        if (exploredVal > baseVal) {
          if (i < baseFilled) {
            const segValue = (i / segments) * 100;
            segClass = segValue >= 70 ? 'high active' : 'filled active';
          } else if (i < exploredFilled) {
            segClass = 'high active';
          }
        } else if (exploredVal < baseVal) {
          if (i < exploredFilled) {
            const segValue = (i / segments) * 100;
            segClass = segValue >= 70 ? 'high active' : 'filled active';
          } else if (i < baseFilled) {
            segClass = 'empty';
          }
        } else {
          if (i < baseFilled) {
            const segValue = (i / segments) * 100;
            segClass = segValue >= 70 ? 'high active' : 'filled active';
          }
        }
      }

      segmentsHtml += `<div class="stat-bar-segment ${segClass}"></div>`;
    }

    track.innerHTML = segmentsHtml;
    track.dataset.baseline = String(baseVal);
    track.dataset.explored = String(exploredVal);

    if (diffEl) {
      const cls = diff > 0 ? 'delta-positive' : diff < 0 ? 'delta-negative' : 'delta-neutral';
      const sign = diff > 0 ? '+' : '';
      diffEl.className = `delta-stat-diff ${cls}`;
      diffEl.textContent = isAtBaseline ? '—' : `${sign}${diff}`;
    }
  });
}

/**
 * Render gauge explorer
 */
export function renderGaugeExplorer(setup: { racquet: Racquet; stringConfig: StringConfig }): void {
  const container = document.getElementById('gauge-explore-content');
  if (!container) return;
  if (!setup) { container.innerHTML = ''; return; }

  const { racquet, stringConfig } = setup;
  const sections: Array<{
    label: string | null;
    string: StringData;
    buildConfig: (gaugedStr: StringData) => StringConfig;
  }> = [];

  if (stringConfig.isHybrid) {
    const hybridConfig = stringConfig as { mains: StringData; crosses: StringData; mainsTension: number; crossesTension: number };
    if (hybridConfig.mains) {
      sections.push({
        label: 'MAINS',
        string: hybridConfig.mains,
        buildConfig: (gaugedStr) => ({
          isHybrid: true,
          mains: gaugedStr,
          crosses: hybridConfig.crosses,
          mainsTension: hybridConfig.mainsTension,
          crossesTension: hybridConfig.crossesTension
        } as StringConfig)
      });
    }
    if (hybridConfig.crosses) {
      sections.push({
        label: 'CROSSES',
        string: hybridConfig.crosses,
        buildConfig: (gaugedStr) => ({
          isHybrid: true,
          mains: hybridConfig.mains,
          crosses: gaugedStr,
          mainsTension: hybridConfig.mainsTension,
          crossesTension: hybridConfig.crossesTension
        } as StringConfig)
      });
    }
  } else {
    const fullConfig = stringConfig as { string: StringData; mainsTension: number; crossesTension: number };
    if (fullConfig.string) {
      sections.push({
        label: null,
        string: fullConfig.string,
        buildConfig: (gaugedStr) => ({
          isHybrid: false,
          string: gaugedStr,
          mainsTension: fullConfig.mainsTension,
          crossesTension: fullConfig.crossesTension
        } as StringConfig)
      });
    }
  }

  if (sections.length === 0) { container.innerHTML = ''; return; }

  const gaugeKeys = ['spin', 'power', 'control', 'comfort', 'feel', 'durability', 'playability'];
  const gaugeLabels = ['Spin', 'Power', 'Control', 'Comfort', 'Feel', 'Durability', 'Playability'];

  let html = '';
  sections.forEach((section, secIdx) => {
    const baseStr = section.string;
    const originalStr = baseStr;
    const currentGauge = baseStr.gaugeNum;
    const gaugeOptions = getGaugeOptions(originalStr);

    const gaugeResults = gaugeOptions.map((g: number) => {
      const gaugedStr = applyGaugeModifier(originalStr, g);
      const config = section.buildConfig(gaugedStr);
      const stats = predictSetup(racquet, config);
      const tensionCtx = buildTensionContext(config, racquet);
      const obs = computeCompositeScore(stats, tensionCtx);
      return { gauge: g, stats, obs: +obs.toFixed(1), isCurrent: Math.abs(g - currentGauge) < 0.005 };
    });

    const currentResult = gaugeResults.find(r => r.isCurrent);
    if (!currentResult) return;

    if (section.label) {
      html += `<div class="gauge-explore-section-label">${section.label}: ${originalStr.name}</div>`;
    } else {
      html += `<div class="gauge-explore-section-label">${originalStr.name}</div>`;
    }

    html += `<div class="gauge-explore-grid" style="--gauge-cols: ${gaugeOptions.length}">`;

    // Header row
    html += `<div class="gauge-explore-header">`;
    html += `<span class="gauge-explore-stat-label"></span>`;
    gaugeResults.forEach((r: typeof gaugeResults[0]) => {
      const shortLabel = r.gauge >= 1.30 ? '16' : r.gauge >= 1.25 ? '16L' : r.gauge >= 1.20 ? '17' : '18';
      const mmLabel = `${r.gauge.toFixed(2)}`;
      const currentCls = r.isCurrent ? ' gauge-current' : '';
      html += `<button class="gauge-explore-col-header${currentCls}" data-tune-action="applyGauge" data-gauge="${r.gauge}" data-section="${secIdx}" title="${r.isCurrent ? 'Current gauge' : 'Click to apply this gauge'}">
        <span class="gauge-col-short">${shortLabel}</span>
        <span class="gauge-col-mm">${mmLabel}</span>
        ${r.isCurrent ? '<span class="gauge-col-tag">current</span>' : '<span class="gauge-col-tag gauge-col-apply">apply</span>'}
      </button>`;
    });
    html += `</div>`;

    // Stat rows
    gaugeKeys.forEach((key, i) => {
      html += `<div class="gauge-explore-row">`;
      html += `<span class="gauge-explore-stat-label">${gaugeLabels[i]}</span>`;
      gaugeResults.forEach((r: typeof gaugeResults[0]) => {
        const val = r.stats[key as keyof SetupAttributes] as number;
        const baseVal = currentResult.stats[key as keyof SetupAttributes] as number;
        const diff = val - baseVal;
        const cls = r.isCurrent ? 'gauge-val-current' : diff > 0 ? 'gauge-val-positive' : diff < 0 ? 'gauge-val-negative' : 'gauge-val-neutral';
        const diffStr = r.isCurrent ? '' : (diff > 0 ? `+${diff}` : `${diff}`);
        html += `<span class="gauge-explore-cell ${cls}">
          <span class="gauge-cell-val">${val}</span>
          ${diffStr ? `<span class="gauge-cell-diff">${diffStr}</span>` : ''}
        </span>`;
      });
      html += `</div>`;
    });

    // OBS row
    html += `<div class="gauge-explore-row gauge-explore-obs-row">`;
    html += `<span class="gauge-explore-stat-label gauge-obs-label">OBS</span>`;
    gaugeResults.forEach((r: typeof gaugeResults[0]) => {
      const diff = r.obs - currentResult.obs;
      const cls = r.isCurrent ? 'gauge-val-current' : diff > 0.5 ? 'gauge-val-positive' : diff < -0.5 ? 'gauge-val-negative' : 'gauge-val-neutral';
      const diffStr = r.isCurrent ? '' : (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1));
      html += `<span class="gauge-explore-cell gauge-obs-cell ${cls}">
        <span class="gauge-cell-val">${r.obs}</span>
        ${diffStr ? `<span class="gauge-cell-diff">${diffStr}</span>` : ''}
      </span>`;
    });
    html += `</div>`;

    html += `</div>`;
  });

  container.innerHTML = html;
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

/** Apply a gauge column from the explorer — updates active loadout + dock; exposed to onclick. */
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
 * Render baseline marker
 */
export function renderBaselineMarker(sliderMin: number, sliderMax: number): void {
  const marker = document.getElementById('baseline-marker');
  if (!marker) return;
  const range = sliderMax - sliderMin;
  const pct = ((tuneState.baselineTension - sliderMin) / range) * 100;
  marker.style.left = `${Math.max(0, Math.min(100, pct))}%`;
}

/**
 * Render optimal zone
 */
export function renderOptimalZone(sliderMin: number, sliderMax: number): void {
  const zone = document.getElementById('slider-optimal-zone');
  const w = tuneState.optimalWindow;
  if (!zone || !w) return;

  const range = sliderMax - sliderMin;
  const left = ((w.low - sliderMin) / range) * 100;
  const width = ((w.high - w.low) / range) * 100;

  zone.style.left = `${Math.max(0, left)}%`;
  zone.style.width = `${Math.min(100 - left, width)}%`;
}

/**
 * Render sweep chart
 */
export function renderSweepChart(setup: { racquet: Racquet }): void {
  const data = tuneState.sweepData;
  if (!data || data.length === 0) return;

  const canvas = document.getElementById('sweep-chart') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const tensions = data.map(d => d.tension);
  const isDark = document.documentElement.dataset.theme === 'dark';

  const curveColors = {
    control: { border: '#AF0000', fill: 'rgba(175, 0, 0, 0.06)' },
    spin: { border: '#CCFF00', fill: 'rgba(204, 255, 0, 0.04)' },
    power: { border: '#C8A87C', fill: 'rgba(200, 168, 124, 0.05)' },
    comfort: { border: '#A78BFA', fill: 'rgba(167, 139, 250, 0.05)' }
  };

  const datasets = [
    { label: 'Control', data: data.map(d => d.stats.control), borderColor: curveColors.control.border, backgroundColor: curveColors.control.fill, fill: true, tension: 0.3, borderWidth: 2.5, borderDash: [], pointRadius: 0, pointHoverRadius: 0, pointHitRadius: 8 },
    { label: 'Spin', data: data.map(d => d.stats.spin), borderColor: curveColors.spin.border, backgroundColor: curveColors.spin.fill, fill: true, tension: 0.3, borderWidth: 2, borderDash: [], pointRadius: 0, pointHoverRadius: 0, pointHitRadius: 8 },
    { label: 'Power', data: data.map(d => d.stats.power), borderColor: curveColors.power.border, backgroundColor: curveColors.power.fill, fill: true, tension: 0.3, borderWidth: 2, borderDash: [], pointRadius: 0, pointHoverRadius: 0, pointHitRadius: 8 },
    { label: 'Comfort', data: data.map(d => d.stats.comfort), borderColor: curveColors.comfort.border, backgroundColor: curveColors.comfort.fill, fill: true, tension: 0.3, borderWidth: 2, borderDash: [], pointRadius: 0, pointHoverRadius: 0, pointHitRadius: 8 }
  ];

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.30)';
  const legendColor = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.48)';

  const baselinePlugin = {
    id: 'tuneAnnotations',
    afterDraw(chart: { ctx: CanvasRenderingContext2D; chartArea: { left: number; right: number; top: number; bottom: number }; scales: { x: { getPixelForValue: (v: number) => number } } }) {
      const { ctx, chartArea, scales } = chart;
      const xScale = scales.x;

      const bx = xScale.getPixelForValue(tuneState.baselineTension);
      if (bx >= chartArea.left && bx <= chartArea.right) {
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.20)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(bx, chartArea.top);
        ctx.lineTo(bx, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.40)';
        ctx.font = "500 10px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('BASELINE', bx, chartArea.top - 6);
        ctx.restore();
      }

      if (tuneState.exploredTension !== tuneState.baselineTension) {
        const ex = xScale.getPixelForValue(tuneState.exploredTension);
        if (ex >= chartArea.left && ex <= chartArea.right) {
          ctx.save();
          ctx.strokeStyle = isDark ? 'rgba(220, 223, 226, 0.8)' : 'rgba(26, 26, 26, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(ex, chartArea.top);
          ctx.lineTo(ex, chartArea.bottom);
          ctx.stroke();
          ctx.fillStyle = isDark ? 'rgba(220, 223, 226, 0.8)' : 'rgba(26, 26, 26, 0.7)';
          ctx.font = "600 10px 'Inter', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText('EXPLORED', ex, chartArea.top - 6);
          ctx.restore();
        }
      }
    }
  };

  const nextData = { labels: tensions, datasets };
  const nextOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', align: 'end', labels: { color: legendColor, usePointStyle: true, boxWidth: 8, font: { size: 10, family: "'JetBrains Mono', monospace" } } },
      tooltip: { backgroundColor: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)', titleColor: isDark ? '#fff' : '#1a1a1a', bodyColor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderWidth: 1, padding: 10, displayColors: true, callbacks: { label: (item: { dataset: { label: string }; raw: number }) => `  ${item.dataset.label}: ${item.raw}` } }
    },
    scales: {
      x: { title: { display: true, text: 'Tension (lbs)', font: { family: "'Inter', sans-serif", size: 11, weight: '500' }, color: tickColor }, grid: { color: gridColor, lineWidth: 0.5 }, ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 }, color: tickColor, stepSize: 2 } },
      y: { min: 0, max: 100, title: { display: true, text: 'Rating', font: { family: "'Inter', sans-serif", size: 11, weight: '500' }, color: tickColor }, grid: { color: gridColor, lineWidth: 0.5 }, ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 }, color: tickColor, stepSize: 25 } }
    },
    animation: { duration: 400, easing: 'easeOutQuart' }
  };

  // Always destroy + recreate: in-place Chart.js updates often fail when tension range /
  // label count changes after applying WTTN or recommended builds (new string / frame).
  if (sweepChart) {
    sweepChart.destroy();
    sweepChart = null;
  }

  sweepChart = new Chart(ctx, {
    type: 'line',
    data: nextData,
    options: nextOptions,
    plugins: [baselinePlugin]
  });
}

/**
 * Render best value move
 */
export function renderBestValueMove(): void {
  const container = document.getElementById('slider-best-value');
  const data = tuneState.sweepData;
  const w = tuneState.optimalWindow;
  if (!container || !data || !w) { container && (container.innerHTML = ''); return; }

  const current = tuneState.exploredTension;
  const isInZone = current >= w.low && current <= w.high;

  if (isInZone) {
    container.innerHTML = `<div class="best-value-callout best-value-ok">
      <span class="best-value-icon">●</span>
      <span>You're in the optimal zone (${w.low}–${w.high} lbs). No adjustment needed.</span>
    </div>`;
  } else {
    const anchor = w.anchor;
    const diff = anchor - current;
    const direction = diff > 0 ? 'up' : 'down';
    const SVG_CHEV_UP = '<svg width="10" height="10" viewBox="0 0 10 10" style="display:inline-block;vertical-align:middle"><path d="M2 7L5 3L8 7" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="square"/></svg>';
    const SVG_CHEV_DOWN = '<svg width="10" height="10" viewBox="0 0 10 10" style="display:inline-block;vertical-align:middle"><path d="M2 3L5 7L8 3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="square"/></svg>';
    const arrowIcon = diff > 0 ? SVG_CHEV_UP : SVG_CHEV_DOWN;
    container.innerHTML = `<div class="best-value-callout best-value-move">
      <span class="best-value-icon">${arrowIcon}</span>
      <span><strong>Best Value Move:</strong> ${direction} ${Math.abs(diff)} lbs to ${anchor} lbs for peak balanced performance.</span>
    </div>`;
  }
}

/**
 * Render tune hybrid toggle
 */
export function renderTuneHybridToggle(stringConfig: StringConfig): void {
  const container = document.getElementById('tune-hybrid-toggle');
  if (!container) return;

  const hasSplitTensions = stringConfig.isHybrid || (stringConfig.mainsTension !== undefined && stringConfig.crossesTension !== undefined);
  if (!hasSplitTensions) {
    container.innerHTML = '';
    (container as HTMLElement).style.display = 'none';
    return;
  }
  (container as HTMLElement).style.display = 'flex';

  const dims = [
    { key: 'linked', label: 'Linked' },
    { key: 'mains', label: 'Mains' },
    { key: 'crosses', label: 'Crosses' }
  ];

  container.innerHTML = dims.map(d => {
    const isActive = tuneState.hybridDimension === d.key;
    return `<button class="tune-dim-btn${isActive ? ' active' : ''}" data-dim="${d.key}">${d.label}</button>`;
  }).join('');

  container.querySelectorAll('.tune-dim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dim = (btn as HTMLElement).dataset.dim as 'mains' | 'crosses' | 'linked';
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
        renderBaselineMarker(parseInt(slider?.min || '30'), parseInt(slider?.max || '75'));
        renderOptimalZone(parseInt(slider?.min || '30'), parseInt(slider?.max || '75'));
        renderSweepChart(setup);
        renderBestValueMove();
        _recomputeExploredState();
        renderOriginalTensionMarker();
        renderOverallBuildScore(setup, true);
        renderRecommendedBuilds(setup);
      }
    });
  });
}

/**
 * Render original tension marker
 */
export function renderOriginalTensionMarker(): void {
  const slider = document.getElementById('tune-slider') as HTMLInputElement | null;
  if (!slider || !slider.parentElement || !tuneState.originalTension) return;

  const container = slider.parentElement;
  const oldMarker = container.querySelector('.tune-original-marker');
  if (oldMarker) oldMarker.remove();

  const min = parseInt(slider.min, 10);
  const max = parseInt(slider.max, 10);
  const pct = ((tuneState.originalTension - min) / (max - min)) * 100;

  const marker = document.createElement('div');
  marker.className = 'tune-original-marker';
  marker.style.left = `calc(${pct}% - 1px)`;
  marker.title = `Original: ${tuneState.originalTension} lbs`;
  marker.innerHTML = `<span class="tune-original-label">Start: ${tuneState.originalTension}</span>`;
  container.style.position = 'relative';
  container.appendChild(marker);
}

/**
 * Handle tune slider input
 */
export function onTuneSliderInput(e: Event): void {
  const val = parseInt((e.target as HTMLInputElement).value);
  tuneState.exploredTension = val;
  updateSliderLabel();
  _updateTuneApplyButton();

  const valueEl = document.getElementById('slider-current-value');
  if (valueEl) {
    valueEl.classList.remove('slider-value-pulse');
    valueEl.offsetHeight;
    valueEl.classList.add('slider-value-pulse');
  }

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
  const btn = document.getElementById('tune-apply-btn');
  if (!btn) return;
  if (!tuneState.baseline || !tuneState.explored) {
    btn.classList.add('hidden');
    return;
  }
  const tensionChanged = tuneState.exploredTension !== tuneState.baselineTension;
  const delta = tuneState.explored.obs - tuneState.baseline.obs;
  if (!tensionChanged) {
    btn.classList.add('hidden');
    btn.textContent = 'Apply changes';
    return;
  }
  const sign = delta > 0 ? '+' : '';
  btn.classList.remove('hidden');
  btn.textContent = Math.abs(delta) <= 0.05
    ? 'Apply explored tension'
    : `Apply changes (${sign}${delta.toFixed(1)} OBS)`;
}

export function renderOverallBuildScore(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  animate = false
): void {
  const container = document.getElementById('obs-content');
  if (!container) return;

  const inTuneMode = getCurrentMode() === 'tune';
  const stats = inTuneMode && tuneState.explored?.stats
    ? tuneState.explored.stats
    : getScoredSetup(setup).stats;
  const score = inTuneMode && typeof tuneState.explored?.obs === 'number'
    ? tuneState.explored.obs
    : getScoredSetup(setup).obs;

  const tier = getObsTier(score);
  let deltaHTML = '';
  if (inTuneMode && typeof tuneState.baseline?.obs === 'number') {
    const delta = score - tuneState.baseline.obs;
    if (Math.abs(delta) > 0.05) {
      const sign = delta > 0 ? '+' : '';
      const deltaCls = delta > 0 ? 'obs-delta-pos' : 'obs-delta-neg';
      deltaHTML = `<span class="obs-delta-chip ${deltaCls}">${sign}${delta.toFixed(1)}</span>`;
    }
  }

  const segments = 10;
  const filled = Math.min(segments, Math.max(0, Math.ceil(score / 10)));
  let batteryHTML = '<div class="obs-battery">';
  for (let i = 0; i < segments; i++) {
    const isFilled = i < filled;
    const isTopTier = i >= 8;
    const segClass = isFilled
      ? (isTopTier ? 'obs-battery-seg obs-battery-filled obs-battery-top' : 'obs-battery-seg obs-battery-filled')
      : 'obs-battery-seg';
    batteryHTML += `<div class="${segClass}"></div>`;
  }
  batteryHTML += '</div>';

  const rankClass = tier.label === 'S Rank' ? 'obs-rank-badge s-rank' : 'obs-rank-badge';
  container.innerHTML = `
    <div class="obs-top-row">
      <div class="obs-score-group">
        <span class="obs-score-value">${score.toFixed(1)}</span>
        ${deltaHTML}
      </div>
      <span class="${rankClass}">${tier.label}</span>
    </div>
    ${batteryHTML}
  `;

  if (animate && _prevObsValues.tune != null) {
    const obsEl = container.querySelector('.obs-score-value');
    if (obsEl instanceof HTMLElement) {
      animateOBS(obsEl, _prevObsValues.tune, score, 400);
    }
  }
  _prevObsValues.tune = score;
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

function _renderRecommendationItem(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  candidate: RecommendedCandidate,
  rank: number,
  currentOBS: number,
  currentKey: string | null
): string {
  const isCurrent = currentKey === _getRecommendationKey(candidate);
  const delta = candidate.score - currentOBS;
  const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
  const deltaCls =
    delta > 0.5 ? 'recs-delta-positive' : delta < -0.5 ? 'recs-delta-negative' : 'recs-delta-neutral';
  const tensionLabel =
    candidate.type === 'hybrid'
      ? `M:${candidate.tension} / X:${candidate.tension - 2} lbs`
      : `${candidate.tension} lbs`;
  const stringId = candidate.stringId || candidate.string?.id || '';
  const mainsId = candidate.mainsId || '';
  const crossesId = candidate.crossesId || '';

  return `
    <div class="recs-item ${isCurrent ? 'recs-item-current' : ''}">
      <div class="recs-rank">${rank}</div>
      <div class="recs-info">
        <div class="recs-name">${candidate.label} ${candidate.gauge ? `<span class="recs-gauge">${candidate.gauge}</span>` : ''}</div>
        <div class="recs-meta">
          <span class="recs-tension-rec">${tensionLabel}</span>
          ${isCurrent ? '<span class="recs-badge-current">CURRENT</span>' : ''}
        </div>
      </div>
      <div class="recs-composite">
        <span class="recs-composite-value">${candidate.score.toFixed(1)}</span>
        <span class="recs-composite-delta ${deltaCls}">${isCurrent ? 'YOU' : deltaStr}</span>
      </div>
      <div class="recs-action-row">
        <button class="recs-apply-btn" data-tune-action="applyRec" data-racquet-id="${setup.racquet.id}" data-string-id="${stringId}" data-tension="${candidate.tension}" data-type="${candidate.type}" data-mains-id="${mainsId}" data-crosses-id="${crossesId}">Apply</button>
        <button class="recs-save-btn" data-tune-action="saveRec" data-racquet-id="${setup.racquet.id}" data-string-id="${stringId}" data-tension="${candidate.tension}" data-type="${candidate.type}" data-mains-id="${mainsId}" data-crosses-id="${crossesId}">Save</button>
      </div>
    </div>
  `;
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

function _flashActionButton(button: HTMLElement, idleLabel: string, successLabel: string): void {
  if (!(button instanceof HTMLButtonElement)) return;
  button.textContent = successLabel;
  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = idleLabel;
    button.disabled = false;
  }, 1500);
}

export function renderWhatToTryNext(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  candidates: RecommendedCandidate[]
): void {
  const container = document.getElementById('wttn-content');
  if (!container) return;
  container.innerHTML = renderSharedWhatToTryNext(container, setup, candidates);
}

export function renderExplorePrompt(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  isCurrentInTop: boolean,
  topBuilds: RecommendedCandidate[]
): void {
  const row = document.getElementById('tune-row-explore');
  const container = document.getElementById('explore-content');
  if (!row || !container) return;

  if (setup.stringConfig.isHybrid) {
    row.classList.remove('hidden');
    renderSharedExplorePrompt(container, setup, isCurrentInTop, topBuilds);
    return;
  }

  if (isCurrentInTop) {
    row.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  row.classList.remove('hidden');
  renderSharedExplorePrompt(container, setup, isCurrentInTop, topBuilds);
}

export function renderRecommendedBuilds(setup: { racquet: Racquet; stringConfig: StringConfig }): void {
  const container = document.getElementById('recs-content');
  if (!container) return;

  const recommendations = generateRecommendedBuilds(setup);
  const currentKey = _getCurrentRecommendationKey(setup.stringConfig);
  const topCombined = [...recommendations.fullBed, ...recommendations.hybrid];

  container.innerHTML = `
    <div class="recs-split">
      <div class="recs-panel">
        <div class="recs-panel-header">
          <span class="recs-panel-title">FULL BED</span>
          <span class="recs-panel-sub">Single string, both directions</span>
        </div>
        <div class="recs-list">
          ${recommendations.fullBed.map((candidate, index) => _renderRecommendationItem(setup, candidate, index + 1, recommendations.currentOBS, currentKey)).join('')}
        </div>
      </div>
      <div class="recs-panel">
        <div class="recs-panel-header">
          <span class="recs-panel-title">HYBRID</span>
          <span class="recs-panel-sub">Mains / Crosses pairing</span>
        </div>
        <div class="recs-list">
          ${recommendations.hybrid.map((candidate, index) => _renderRecommendationItem(setup, candidate, index + 1, recommendations.currentOBS, currentKey)).join('')}
        </div>
      </div>
    </div>
    <p class="recs-footnote">Composite score across all 11 stats at optimal tension for <strong>${setup.racquet.name.replace(/\s+\d+g$/, '')}</strong>. Delta is vs your current build.</p>
  `;

  renderExplorePrompt(setup, recommendations.isCurrentInTop, topCombined);
  renderWhatToTryNext(setup, recommendations.all);
}

export function _applyWttnBuild(btn: HTMLElement): void {
  const setup = getCurrentSetup();
  if (!setup) return;

  const stringId = btn.dataset.stringId || '';
  const tension = parseInt(btn.dataset.tension || '', 10);
  const type = btn.dataset.type || 'full';
  const mainsId = btn.dataset.mainsId || undefined;
  const crossesId = btn.dataset.crossesId || undefined;

  const loadout = _buildTuneRecommendationLoadout(setup.racquet.id, stringId, tension, type, mainsId, crossesId);
  if (loadout) {
    activateLoadout(loadout);
    const newSetup = getCurrentSetup();
    if (newSetup) initTuneMode(newSetup);
  }

  _flashActionButton(btn, 'Apply', 'Applied \u2713');
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

export function _saveWttnBuild(btn: HTMLElement): void {
  const frameId = btn.dataset.frameId || '';
  const stringId = btn.dataset.stringId || '';
  const tension = parseInt(btn.dataset.tension || '', 10);
  const type = btn.dataset.type || 'full';
  const mainsId = btn.dataset.mainsId || undefined;
  const crossesId = btn.dataset.crossesId || undefined;

  const loadout = _buildTuneRecommendationLoadout(frameId, stringId, tension, type, mainsId, crossesId);
  if (loadout) {
    saveLoadout(loadout);
    _flashActionButton(btn, 'Save', 'Saved \u2713');
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

  activeLoadout.mainsTension = newMainsTension;
  activeLoadout.crossesTension = newCrossesTension;

  const freshSetup = getCurrentSetup();
  if (freshSetup) {
    const stats = predictSetup(freshSetup.racquet, freshSetup.stringConfig);
    const tCtx = buildTensionContext(freshSetup.stringConfig, freshSetup.racquet);
    activeLoadout.stats = stats;
    activeLoadout.obs = +computeCompositeScore(stats, tCtx).toFixed(1);
    activeLoadout.identity = generateIdentity(stats, freshSetup.racquet, freshSetup.stringConfig)?.name || '';
  }
  activeLoadout._dirty = getSavedLoadouts().some((loadout) => loadout.id === activeLoadout.id);

  const mainsInput = document.getElementById('input-tension-mains') as HTMLInputElement | null;
  const crossesInput = document.getElementById('input-tension-crosses') as HTMLInputElement | null;
  const fullMainsInput = document.getElementById('input-tension-full-mains') as HTMLInputElement | null;
  const fullCrossesInput = document.getElementById('input-tension-full-crosses') as HTMLInputElement | null;

  if (activeLoadout.isHybrid) {
    if (mainsInput) mainsInput.value = String(newMainsTension);
    if (crossesInput) crossesInput.value = String(newCrossesTension);
  } else {
    if (fullMainsInput) fullMainsInput.value = String(newMainsTension);
    if (fullCrossesInput) fullCrossesInput.value = String(newCrossesTension);
  }

  tuneState.baseline = null;
  tuneState.explored = null;
  tuneState.baselineTension = tuneState.exploredTension;

  const resetSetup = getCurrentSetup();
  if (resetSetup) {
    initTuneMode(resetSetup);
  }

  const btn = document.getElementById('tune-apply-btn');
  if (btn) {
    btn.classList.add('hidden');
    btn.textContent = 'Apply changes';
  }

  renderDockPanel();
  _renderDashboard();
}

/**
 * Apply explored tension to main setup
 */
export function applyExploredTension(): void {
  if (!tuneState.explored) return;

  const setup = getCurrentSetup();
  if (!setup) return;

  const diff = setup.stringConfig.mainsTension - setup.stringConfig.crossesTension;
  let newMainsTension = setup.stringConfig.mainsTension;
  let newCrossesTension = setup.stringConfig.crossesTension;

  if (tuneState.hybridDimension === 'mains') {
    newMainsTension = tuneState.exploredTension;
  } else if (tuneState.hybridDimension === 'crosses') {
    newCrossesTension = tuneState.exploredTension;
  } else {
    newMainsTension = tuneState.exploredTension;
    newCrossesTension = tuneState.exploredTension - diff;
  }

  // Update input fields
  const mainsInput = document.getElementById('input-tension-mains') as HTMLInputElement | null;
  const crossesInput = document.getElementById('input-tension-crosses') as HTMLInputElement | null;
  const fullMainsInput = document.getElementById('input-tension-full-mains') as HTMLInputElement | null;
  const fullCrossesInput = document.getElementById('input-tension-full-crosses') as HTMLInputElement | null;

  if (mainsInput) mainsInput.value = String(newMainsTension);
  if (crossesInput) crossesInput.value = String(newCrossesTension);
  if (fullMainsInput) fullMainsInput.value = String(newMainsTension);
  if (fullCrossesInput) fullCrossesInput.value = String(newCrossesTension);

  // Trigger editor change
  if (getActiveLoadout()) {
    commitEditorToLoadout();
  } else {
    _renderDashboard();
  }

  // Reset tune state
  tuneSandboxCommit();
}
