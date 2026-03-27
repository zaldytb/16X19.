// src/ui/pages/overview.ts
// Overview page rendering - dashboard, hero, stat bars, radar chart

import { RACQUETS, STRINGS } from '../../data/loader.js';
import {
  predictSetup,
  generateIdentity,
  getObsTier,
  buildTensionContext,
  computeCompositeScore
} from '../../engine/index.js';
import {
  STAT_KEYS,
  STAT_LABELS,
  STAT_LABELS_FULL,
  STAT_GROUPS
} from '../../engine/constants.js';
import type { StringData, Racquet, SetupAttributes, StringConfig as EngineStringConfig } from '../../engine/types.js';
import { getActiveLoadout } from '../../state/store.js';
import { _prevObsValues, animateOBS } from '../components/obs-animation.js';
import { renderMobileLoadoutPills } from '../components/dock-renderers.js';

// Globals from app.js
declare const currentRadarChart: Chart | null;
declare function $(sel: string): HTMLElement | null;

// External dependencies (via window)
interface WindowExt extends Window {
  getCurrentSetup?: () => { racquet: Racquet; stringConfig: EngineStringConfig } | null;
  refreshTuneIfActive?: () => void;
  switchMode?: (mode: string) => void;
  commitEditorToLoadout?: () => void;
  _assignStaggerIndices?: (selector: string) => void;
}

type StringConfig = EngineStringConfig;

/**
 * Render the main dashboard
 */
export function renderDashboard(): void {
  renderMobileLoadoutPills();
  const win = window as WindowExt;
  const setup = win.getCurrentSetup?.();

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
  const stats = predictSetup(racquet, stringConfig);
  const identity = generateIdentity(stats, racquet, stringConfig);
  const fitProfile = generateFitProfile(stats, racquet, stringConfig);
  const warnings = generateWarnings(racquet, stringConfig, stats);

  // Hero Band
  renderOverviewHero(racquet, stringConfig, stats, identity);

  // Stats
  renderStatBars(stats);
  renderRadarChart(stats);

  // Fit
  renderFitProfile(fitProfile);

  // Progressive depth
  renderOCFoundation(racquet, stringConfig, stats);

  // Warnings
  renderWarnings(warnings);

  // Assign stagger indices
  win._assignStaggerIndices?.('#dashboard-content');

  // Refresh Tune mode if active
  win.refreshTuneIfActive?.();
}

/**
 * Render the overview hero block with OBS score
 */
export function renderOverviewHero(
  racquet: Racquet,
  stringConfig: StringConfig,
  stats: SetupAttributes,
  identity: { archetype: string; description: string }
): void {
  const el = document.getElementById('overview-hero');
  if (!el) return;

  const tensionCtx = buildTensionContext(stringConfig, racquet);
  const score = computeCompositeScore(stats, tensionCtx);
  const tier = getObsTier(score);

  // String name for meta line
  let stringName: string;
  if (stringConfig.isHybrid) {
    stringName = `${stringConfig.mains.name} ${stringConfig.mains.gauge} / ${stringConfig.crosses.name} ${stringConfig.crosses.gauge}`;
  } else {
    stringName = `${stringConfig.string.name} ${stringConfig.string.gauge}`;
  }
  const tensionLabel = `M${stringConfig.mainsTension} / X${stringConfig.crossesTension}`;

  const tierClass = tier.label === 'S Rank' ? 's-rank' : '';

  el.innerHTML = `
    <div class="flex flex-col gap-6">
      <!-- Score + Identity Row -->
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <!-- Score Block -->
        <div class="hero-score shrink-0">
          <span class="hero-obs-label">System Sync Rating</span>
          <span class="hero-obs-value">${score.toFixed(1)}</span>
          <span class="hero-obs-tier ${tierClass}">${tier.label}</span>
        </div>
        <!-- Identity Block -->
        <div class="hero-identity flex-1 min-w-0">
          <div class="hero-archetype">${identity.archetype}</div>
          <div class="hero-desc">${identity.description}</div>
          <div class="hero-terminal">
            <span class="hero-terminal-value">${racquet.name.replace(/\s+\d+g$/, '')}</span><span class="hero-terminal-sep">//</span><span class="hero-terminal-value">${stringName}</span><span class="hero-terminal-sep">//</span><span class="hero-terminal-value">${tensionLabel}</span>
          </div>
        </div>
      </div>
      <!-- CTA Actions -->
      <div class="mt-2 pt-6 border-t border-dc-storm/20">
        <div class="flex gap-3">
          <button 
            class="flex-1 bg-transparent border border-dc-storm/40 dark:border-dc-storm/40 text-dc-void dark:text-dc-platinum font-mono text-[12px] font-bold uppercase tracking-widest py-3 px-4 hover:border-dc-void dark:hover:border-dc-platinum hover:bg-dc-void/5 dark:hover:bg-dc-platinum/5 transition-colors flex items-center justify-center gap-2"
            onclick="switchMode('compendium')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            //BACK TO BIBLE
          </button>
          <button 
            class="flex-1 bg-dc-accent text-dc-void font-mono text-[12px] font-bold uppercase tracking-widest py-3 px-4 hover:bg-dc-accent/90 transition-colors flex items-center justify-center gap-2"
            onclick="switchMode('tune')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v10"/><path d="M21 12h-6m-6 0H1"/></svg>
            Tune This Build
          </button>
        </div>
      </div>
    </div>
  `;

  // OBS counting animation
  const heroObsEl = el.querySelector('.hero-obs-value') as HTMLElement | null;
  if (heroObsEl && _prevObsValues.hero != null) {
    animateOBS(heroObsEl, _prevObsValues.hero, score, 500);
  }
  _prevObsValues.hero = score;
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

  const sep = '<span class="oc-sep">/</span>';

  let strStiff: number;
  let strTensionLoss: string;
  let strSpinPot: string;

  if (stringConfig.isHybrid) {
    const m = stringConfig.mains;
    const x = stringConfig.crosses;
    strStiff = Math.round((m.stiffness + x.stiffness) / 2);
    strTensionLoss = ((m.tensionLoss + x.tensionLoss) / 2).toFixed(0);
    strSpinPot = ((m.spinPotential + x.spinPotential) / 2).toFixed(1);
  } else {
    const s = stringConfig.string;
    strStiff = Math.round(s.stiffness);
    strTensionLoss = s.tensionLoss.toFixed(0);
    strSpinPot = s.spinPotential.toFixed(1);
  }

  el.innerHTML = `
    <div class="oc-foundation-group">
      <span class="oc-foundation-group-title">[FRAME]</span>
      <span class="oc-foundation-group-values">WGHT ${racquet.strungWeight}g strung ${sep} SW ${racquet.swingweight} ${sep} RA ${racquet.stiffness} ${sep} PAT ${racquet.pattern}</span>
    </div>
    <div class="oc-foundation-group">
      <span class="oc-foundation-group-title">[STRNG]</span>
      <span class="oc-foundation-group-values">STIF ${strStiff} ${sep} LOSS ${strTensionLoss}% ${sep} SPIN ${strSpinPot}</span>
    </div>
    <div class="oc-foundation-group">
      <span class="oc-foundation-group-title">[MODEL]</span>
      <span class="oc-foundation-group-values">POWR ${stats.power} ${sep} CTRL ${stats.control} ${sep} COMF ${stats.comfort}</span>
    </div>
  `;
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

  container.innerHTML = '';

  const keyToLabel: Record<string, string> = {};
  STAT_KEYS.forEach((k, i) => keyToLabel[k] = STAT_LABELS[i]);

  let barIdx = 0;
  STAT_GROUPS.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'stat-group';
    groupDiv.innerHTML = '<div class="stat-group-label">' + group.label + '</div>';

    group.keys.forEach(key => {
      const value = stats[key as keyof SetupAttributes] as number;
      const isHigh = value > 70;
      const segments = 20;
      const filledSegments = Math.round((value / 100) * segments);

      let segmentsHtml = '';
      for (let i = 0; i < segments; i++) {
        let segClass = 'empty';
        if (i < filledSegments) {
          segClass = isHigh ? 'high' : 'filled';
        }
        segmentsHtml += `<div class="stat-bar-segment ${segClass}" data-seg="${i}"></div>`;
      }

      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `
        <div class="stat-row-header">
          <span class="stat-label">${keyToLabel[key]}</span>
          <span class="stat-value">${value}</span>
        </div>
        <div class="stat-bar-track" data-value="${value}">
          ${segmentsHtml}
        </div>
      `;
      groupDiv.appendChild(row);
      barIdx++;
    });

    container.appendChild(groupDiv);
  });

  // Animate segments
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.querySelectorAll('.stat-bar-track').forEach((track, idx) => {
        const value = parseFloat((track as HTMLElement).dataset.value || '0');
        const segments = track.querySelectorAll('.stat-bar-segment');
        const filledCount = Math.round((value / 100) * segments.length);

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

  renderBuildDNAHighlights(stats);
}

/**
 * Render Build DNA highlights (top 3 + bottom 2 stats)
 */
export function renderBuildDNAHighlights(stats: SetupAttributes): void {
  const el = document.getElementById('build-dna-highlights');
  if (!el) return;

  const entries = STAT_KEYS.map((k, i) => ({ key: k, label: STAT_LABELS[i], val: stats[k as keyof SetupAttributes] as number }));
  const sorted = [...entries].sort((a, b) => b.val - a.val);
  const top3 = sorted.slice(0, 3);
  const bot2 = sorted.slice(-2).reverse();

  const topLogs = top3.map(s =>
    '<span class="dna-log-strong">[+] ' + s.label.toUpperCase() + ' ' + s.val + '</span>'
  ).join('');
  const botLogs = bot2.map(s =>
    '<span class="dna-log-gap">[-] ' + s.label.toUpperCase() + ' ' + s.val + '</span>'
  ).join('');

  el.innerHTML = `
    <div class="dna-highlights-row">
      <span class="dna-highlights-label">STRONG</span>${topLogs}
      <span class="dna-highlights-label">GAP</span>${botLogs}
    </div>
  `;
}

/**
 * Tooltip handler for radar chart
 */
export function radarTooltipHandler(context: {
  tooltip: {
    opacity: number;
    dataPoints?: Array<{ label: string; raw: number }>;
    caretX: number;
    caretY: number;
  };
  chart: { canvas: HTMLElement };
}): void {
  let tooltipEl = document.getElementById('chartjs-tooltip');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-tooltip';
    tooltipEl.className = 'chartjs-tooltip';
    document.body.appendChild(tooltipEl);
  }

  const tooltip = context.tooltip;

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  const dataPoint = tooltip.dataPoints?.[0];
  if (!dataPoint) return;

  const label = dataPoint.label;
  const value = dataPoint.raw;

  tooltipEl.innerHTML = `
    <div class="tooltip-label">// ${label}</div>
    <div class="tooltip-value">
      <div class="tooltip-marker"></div>
      <span>${value}</span>
    </div>
  `;

  const position = context.chart.canvas.getBoundingClientRect();
  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = (position.left + window.scrollX + tooltip.caretX + 15) + 'px';
  tooltipEl.style.top = (position.top + window.scrollY + tooltip.caretY - 10) + 'px';
}

// Chart.js type declaration
type Chart = {
  data: { datasets: Array<{ data: number[]; borderColor: string; backgroundColor: string; pointBackgroundColor: string; pointBorderColor: string }>; labels: string[] };
  options: { scales: { r: { grid: { color: string }; angleLines: { color: string }; pointLabels: { color: string } } } };
  update: (mode: string) => void;
};

declare const Chart: new (
  ctx: CanvasRenderingContext2D,
  config: Record<string, unknown>
) => Chart;

let _currentRadarChart: Chart | null = null;

/**
 * Render radar chart using Chart.js
 */
export function renderRadarChart(stats: SetupAttributes): void {
  const canvas = document.getElementById('radar-chart') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const chartApi = Chart as unknown as {
    getChart?: (key: HTMLCanvasElement) => Chart | undefined;
  };
  const existingChart = _currentRadarChart || chartApi.getChart?.(canvas) || null;
  if (!_currentRadarChart && existingChart) {
    _currentRadarChart = existingChart;
  }

  const data = STAT_KEYS.map(k => stats[k as keyof SetupAttributes] as number);

  const isDark = document.documentElement.dataset.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const angleColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const labelColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.44)';
  const accentColor = '#AF0000';
  const fillColor = 'rgba(175, 0, 0, 0.06)';

  if (existingChart) {
    existingChart.data.datasets[0].data = data;
    existingChart.data.datasets[0].borderColor = accentColor;
    existingChart.data.datasets[0].backgroundColor = fillColor;
    existingChart.data.datasets[0].pointBackgroundColor = accentColor;
    existingChart.data.datasets[0].pointBorderColor = 'transparent';
    existingChart.options.scales.r.grid.color = gridColor;
    existingChart.options.scales.r.angleLines.color = angleColor;
    existingChart.options.scales.r.pointLabels.color = labelColor;
    existingChart.update('active');
    return;
  }

  _currentRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: STAT_LABELS_FULL,
      datasets: [{
        data,
        backgroundColor: fillColor,
        borderColor: accentColor,
        borderWidth: 2,
        pointBackgroundColor: accentColor,
        pointBorderColor: 'transparent',
        pointRadius: 3,
        pointHoverRadius: 6,
        hitRadius: 30
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: { padding: 0 },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: radarTooltipHandler
        }
      },
      elements: {
        point: { hitRadius: 30, hoverRadius: 6 }
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false, stepSize: 20 },
          grid: { color: gridColor, circular: true, lineWidth: 1 },
          angleLines: { color: angleColor, lineWidth: 1 },
          pointLabels: { display: false }
        }
      },
      animation: { duration: 800, easing: 'easeOutQuart' }
    }
  });
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

/**
 * Render warnings section
 */
export function renderWarnings(warnings: string[]): void {
  const card = document.getElementById('warnings-card');
  const list = document.getElementById('warnings-list');
  if (!card || !list) return;

  if (warnings.length === 0) {
    card.classList.add('hidden');
    return;
  }

  card.classList.remove('hidden');
  list.innerHTML = warnings.map(w => `
    <div class="warning-item">
      <svg class="warning-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="8" cy="12" r="0.8" fill="currentColor"/>
      </svg>
      <span>${w}</span>
    </div>
  `).join('');
}

/**
 * Generate fit profile from stats
 */
export function generateFitProfile(
  stats: SetupAttributes,
  racquet: Racquet,
  _stringConfig: StringConfig
): { bestFor: string[]; watchOut: string[]; tensionRec: string } {
  const bestFor: string[] = [];
  const watchOut: string[] = [];

  if (stats.spin >= 70) bestFor.push('Baseline grinders who rely on topspin');
  if (stats.power >= 65) bestFor.push('Players who like to dictate with pace');
  if (stats.control >= 70) bestFor.push('Touch players and all-courters');
  if (stats.comfort >= 70) bestFor.push('Players with arm sensitivity');
  if (stats.stability >= 70) bestFor.push('Aggressive returners and blockers');
  if (stats.feel >= 75) bestFor.push('Net players and volleyers');
  if (stats.maneuverability >= 70) bestFor.push('Quick-swing players and net rushers');
  if (stats.forgiveness >= 65) bestFor.push('Developing players building consistency');
  if (stats.playability >= 80) bestFor.push('Frequent players (3+ times/week)');

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

  // Gut rain warning
  for (const s of allStrings) {
    if (s.material === 'Natural Gut') {
      warnings.push(`${s.name} is natural gut — avoid moisture/humidity. Not recommended for wet climates without protection.`);
    }
  }

  return warnings;
}
