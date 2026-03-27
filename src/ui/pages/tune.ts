// src/ui/pages/tune.ts
// Tune page - tension exploration and optimization

import {
  predictSetup,
  buildTensionContext,
  computeCompositeScore,
  generateIdentity,
  getObsTier,
  getObsScoreColor,
  applyGaugeModifier
} from '../../engine/index.js';
import type { Racquet, StringData, SetupAttributes, StringConfig, Loadout } from '../../engine/types.js';
import { GAUGE_LABELS } from '../../engine/constants.js';
import { getGaugeOptions } from '../../engine/string-profile.js';
import { STRINGS } from '../../data/loader.js';
import { _prevObsValues } from '../components/obs-animation.js';

// Window extensions for external dependencies
interface WindowExt extends Window {
  switchMode?: (mode: string) => void;
  getCurrentSetup?: () => { racquet: Racquet; stringConfig: StringConfig } | null;
  renderDashboard?: () => void;
  renderRecommendedBuilds?: (setup: { racquet: Racquet; stringConfig: StringConfig }) => void;
  renderWhatToTryNext?: (setup: { racquet: Racquet; stringConfig: StringConfig }, candidates: unknown[]) => void;
  renderOverallBuildScore?: (setup: { racquet: Racquet; stringConfig: StringConfig }, animate: boolean) => void;
  renderExplorePrompt?: (setup: { racquet: Racquet; stringConfig: StringConfig }, isCurrentInTop: boolean, topBuilds: unknown[]) => void;
  activeLoadout?: Loadout | null;
  currentMode?: string;
  $?: (sel: string) => HTMLElement | null;
}

// Module-level state
export let sweepChart: Chart | null = null;
let _tuneRefreshing = false;

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
    _stringKey: string;
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

// Chart.js type
type Chart = {
  destroy: () => void;
};

declare const Chart: new (ctx: CanvasRenderingContext2D, config: Record<string, unknown>) => Chart;

/**
 * Toggle tune mode (legacy compat)
 */
export function toggleTuneMode(): void {
  const win = window as WindowExt;
  if (win.currentMode === 'tune') {
    win.switchMode?.('overview');
  } else {
    const setup = win.getCurrentSetup?.();
    if (!setup) return;
    win.switchMode?.('tune');
  }
}

/**
 * Close tune mode (legacy compat)
 */
export function closeTuneMode(): void {
  (window as WindowExt).switchMode?.('overview');
}

/**
 * dockBuilderPanel - no-op for backward compat
 */
export function dockBuilderPanel(_inTune: boolean): void {
  // Builder panel is now permanently in the left build-dock
}

/**
 * Refresh tune panels if tune mode is active
 */
export function refreshTuneIfActive(): void {
  const win = window as WindowExt;
  if (win.currentMode !== 'tune' || _tuneRefreshing) return;
  _tuneRefreshing = true;
  try {
    const setup = win.getCurrentSetup?.();
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
  const win = window as WindowExt;
  const setup = win.getCurrentSetup?.();
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

/**
 * Initialize tune mode
 */
export function initTuneMode(setup: { racquet: Racquet; stringConfig: StringConfig }): void {
  const { racquet, stringConfig } = setup;
  const win = window as WindowExt;
  const activeLoadout = win.activeLoadout;

  // Snapshot baseline from activeLoadout
  if (activeLoadout && (!tuneState.baseline || tuneState.baseline._loadoutId !== activeLoadout.id || tuneState.baseline._frameId !== activeLoadout.frameId || tuneState.baseline._stringKey !== _tuneStringKey(activeLoadout))) {
    const tCtx = buildTensionContext(stringConfig, racquet);
    const bStats = predictSetup(racquet, stringConfig);
    const bObs = computeCompositeScore(bStats, tCtx);
    const bIdent = generateIdentity(bStats, racquet, stringConfig);
    tuneState.baseline = {
      _loadoutId: activeLoadout.id,
      _frameId: activeLoadout.frameId,
      _stringKey: _tuneStringKey(activeLoadout),
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
      stats: bStats,
      obs: +bObs.toFixed(1),
      identity: bIdent
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
  win.renderOverallBuildScore?.(setup, true);
  win.renderRecommendedBuilds?.(setup);
  renderOriginalTensionMarker();

  // Reset Apply button
  const applyBtn = document.getElementById('tune-apply-btn');
  if (applyBtn) applyBtn.classList.add('hidden');
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

  _updateDeltaBatteryBars(baselineEntry.stats, exploredEntry.stats, tuneState.exploredTension === tuneState.baselineTension);
}

/**
 * Update delta battery bars
 */
function _updateDeltaBatteryBars(baseStats: SetupAttributes, exploredStats: SetupAttributes, isAtBaseline: boolean): void {
  const container = document.getElementById('delta-content');
  if (!container) return;

  const stats = ['spin', 'power', 'control', 'comfort', 'feel', 'stability', 'forgiveness'];
  const labels = ['Spin', 'Power', 'Control', 'Comfort', 'Feel', 'Stability', 'Forgiveness'];

  let html = '<div class="delta-bars">';
  stats.forEach((key, i) => {
    const baseVal = baseStats[key as keyof SetupAttributes] as number;
    const expVal = exploredStats[key as keyof SetupAttributes] as number;
    const delta = expVal - baseVal;
    const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
    const deltaCls = delta > 0 ? 'delta-pos' : delta < 0 ? 'delta-neg' : 'delta-neutral';

    html += `
      <div class="delta-bar-row">
        <span class="delta-bar-label">${labels[i]}</span>
        <div class="delta-bar-track">
          <div class="delta-bar-fill ${deltaCls}" style="width:${Math.min(100, Math.max(0, expVal))}%"></div>
        </div>
        <span class="delta-bar-value ${deltaCls}">${isAtBaseline ? baseVal : expVal}</span>
        ${!isAtBaseline ? `<span class="delta-bar-delta ${deltaCls}">${deltaStr}</span>` : ''}
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
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
      html += `<button class="gauge-explore-col-header${currentCls}" onclick="_applyGaugeSelection(${r.gauge},${secIdx})" title="${r.isCurrent ? 'Current gauge' : 'Click to apply this gauge'}">
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
  const zone = document.getElementById('optimal-zone');
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

  if (sweepChart) {
    sweepChart.destroy();
  }

  sweepChart = new Chart(ctx, {
    type: 'line',
    data: { labels: tensions, datasets },
    options: {
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
    },
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
  const container = document.getElementById('tune-dimension-toggle');
  if (!container) return;

  const isHybrid = stringConfig.isHybrid;
  if (!isHybrid) {
    container.innerHTML = '';
    return;
  }

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
      const win = window as WindowExt;
      const setup = win.getCurrentSetup?.();
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
        renderSweepChart(setup);
        renderBestValueMove();
        _recomputeExploredState();
      }
    });
  });
}

/**
 * Render original tension marker
 */
export function renderOriginalTensionMarker(): void {
  const marker = document.getElementById('original-tension-marker');
  const label = document.getElementById('original-tension-label');
  if (!marker || !label) return;

  const isAtOriginal = tuneState.exploredTension === tuneState.originalTension;
  marker.style.opacity = isAtOriginal ? '1' : '0.3';
  label.style.opacity = isAtOriginal ? '1' : '0.5';
  label.textContent = `Original: ${tuneState.originalTension} lbs`;
}

/**
 * Handle tune slider input
 */
export function onTuneSliderInput(e: Event): void {
  const val = parseInt((e.target as HTMLInputElement).value);
  tuneState.exploredTension = val;
  updateSliderLabel();
  _recomputeExploredState();
  renderDeltaVsBaseline();
  renderBestValueMove();

  const win = window as WindowExt;
  const setup = win.getCurrentSetup?.();
  if (setup) {
    win.renderOverallBuildScore?.(setup, false);
    renderSweepChart(setup);
  }

  _updateTuneApplyButton();
}

/**
 * Recompute explored state
 */
export function _recomputeExploredState(): void {
  const win = window as WindowExt;
  const setup = win.getCurrentSetup?.();
  if (!setup) return;

  const { racquet, stringConfig } = setup;
  let modifiedConfig: StringConfig;
  const diff = stringConfig.mainsTension - stringConfig.crossesTension;

  if (tuneState.hybridDimension === 'mains') {
    modifiedConfig = { ...stringConfig, mainsTension: tuneState.exploredTension } as StringConfig;
  } else if (tuneState.hybridDimension === 'crosses') {
    modifiedConfig = { ...stringConfig, crossesTension: tuneState.exploredTension } as StringConfig;
  } else {
    modifiedConfig = { ...stringConfig, mainsTension: tuneState.exploredTension, crossesTension: tuneState.exploredTension - diff } as StringConfig;
  }

  const stats = predictSetup(racquet, modifiedConfig);
  const tCtx = buildTensionContext(modifiedConfig, racquet);
  const obs = computeCompositeScore(stats, tCtx);
  const identity = generateIdentity(stats, racquet, modifiedConfig);

  tuneState.explored = { stats, obs: +obs.toFixed(1), identity };
}

/**
 * Update tune apply button visibility
 */
export function _updateTuneApplyButton(): void {
  const btn = document.getElementById('tune-apply-btn');
  if (!btn) return;
  const isDirty = tuneState.exploredTension !== tuneState.baselineTension;
  btn.classList.toggle('hidden', !isDirty);
}

/**
 * Commit tune sandbox changes
 */
export function tuneSandboxCommit(): void {
  const win = window as WindowExt;
  const setup = win.getCurrentSetup?.();
  if (!setup || !tuneState.baseline) return;

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

  // Update baseline
  tuneState.baseline.mainsTension = newMainsTension;
  tuneState.baseline.crossesTension = newCrossesTension;
  tuneState.baselineTension = tuneState.exploredTension;
  tuneState.baseline.stats = tuneState.explored!.stats;
  tuneState.baseline.obs = tuneState.explored!.obs;
  tuneState.baseline.identity = tuneState.explored!.identity;

  // Refresh UI
  if (setup) {
    runTensionSweep(setup);
    calculateOptimalWindow(setup);
    const slider = document.getElementById('tune-slider') as HTMLInputElement | null;
    const sliderMin = slider ? parseInt(slider.min) : 30;
    const sliderMax = slider ? parseInt(slider.max) : 75;
    renderOptimalBuildWindow(sliderMin, sliderMax);
    renderDeltaVsBaseline();
    renderBaselineMarker(sliderMin, sliderMax);
    renderOptimalZone(sliderMin, sliderMax);
    renderSweepChart(setup);
    renderBestValueMove();
    renderOriginalTensionMarker();
    win.renderOverallBuildScore?.(setup, true);
  }

  _updateTuneApplyButton();
}

/**
 * Apply explored tension to main setup
 */
export function applyExploredTension(): void {
  if (!tuneState.explored) return;

  const win = window as WindowExt;
  const setup = win.getCurrentSetup?.();
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
  if (win.activeLoadout) {
    // commitEditorToLoadout would be called via window
    (window as unknown as { commitEditorToLoadout?: () => void }).commitEditorToLoadout?.();
  } else {
    win.renderDashboard?.();
  }

  // Reset tune state
  tuneSandboxCommit();
}
