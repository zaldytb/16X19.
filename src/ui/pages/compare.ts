/**
 * Compare System - TypeScript Migration
 * Handles multi-setup comparison with radar charts, verdict analysis, and slot management
 */

import { predictSetup, generateIdentity, computeCompositeScore, getObsScoreColor } from '../../engine/index.js';
import { STAT_KEYS, STAT_LABELS, STAT_LABELS_FULL } from '../../engine/constants.js';
import { getActiveLoadout, getSavedLoadouts } from '../../state/store.js';
import {
  getComparisonSlots as getAppComparisonSlots,
  setComparisonRadarChart as setAppComparisonRadarChart,
  getComparisonRadarChart as getAppComparisonRadarChart,
  getCurrentMode as getAppCurrentMode,
  getSlotColors as getAppSlotColors,
  setSlotColors as setAppSlotColors
} from '../../state/app-state.js';
import { createSearchableSelect } from '../components/searchable-select.js';
import type { Loadout, SetupStats, StringData, Racquet, IdentityResult, TensionContext } from '../../engine/types.js';

// Data imports - use any since data.js has different runtime types
import { RACQUETS as _RACQUETS, STRINGS as _STRINGS } from '../../data/loader.js';
const RACQUETS = (_RACQUETS as unknown) as Racquet[];
const STRINGS = (_STRINGS as unknown) as StringData[];

// Chart.js type declaration for global Chart object
declare const Chart: any;

// ============================================
// Types
// ============================================

export interface CompareSlot {
  id: number;
  racquetId: string;
  stringId: string;
  isHybrid: boolean;
  mainsId: string;
  crossesId: string;
  mainsTension: number;
  crossesTension: number;
  stats: SetupStats | null;
  identity: IdentityResult | null;
  sourceLoadoutId?: string | null;
  snapshotObs?: number;
}

interface CompareWindowExt extends Window {
  compareGetState?: () => { slots?: Array<{ id: string; loadout: Loadout | null; stats: SetupStats | null }> };
  compareSetSlotLoadout?: (slotId: string, loadout: Loadout, stats: SetupStats) => void;
}

export interface SlotColor {
  border: string;
  bg: string;
  bgFaint: string;
  label: string;
  cssClass: string;
  borderDash: number[];
}

// ============================================
// State Access
// ============================================

// Access the global state from app.js (backward compatibility)
// All functions use these helpers to ensure they operate on the same data
function slots(): CompareSlot[] {
  return getAppComparisonSlots<CompareSlot>();
}
function setRadarChart(chart: any): void {
  setAppComparisonRadarChart(chart);
}
function getRadarChart(): any {
  return getAppComparisonRadarChart();
}

function getCompareStateSlotByIndex(index: number): { id: string; loadout: Loadout | null; stats: SetupStats | null } | null {
  const state = (window as CompareWindowExt).compareGetState?.();
  return state?.slots?.[index] || null;
}

function buildStatsFromLoadout(loadout: Loadout): SetupStats | null {
  const racquet = RACQUETS.find((frame) => frame.id === loadout.frameId);
  if (!racquet) return null;

  if (loadout.isHybrid) {
    const mains = STRINGS.find((string) => string.id === loadout.mainsId);
    const crosses = STRINGS.find((string) => string.id === loadout.crossesId);
    if (!mains || !crosses) return null;
    return predictSetup(racquet, {
      isHybrid: true,
      mains,
      crosses,
      mainsTension: loadout.mainsTension,
      crossesTension: loadout.crossesTension,
    });
  }

  const string = STRINGS.find((entry) => entry.id === loadout.stringId);
  if (!string) return null;
  return predictSetup(racquet, {
    isHybrid: false,
    string,
    mainsTension: loadout.mainsTension,
    crossesTension: loadout.crossesTension,
  });
}

const SLOT_COLOR_PALETTE: SlotColor[] = [
  {
    border: 'rgba(175, 0, 0, 0.8)',
    bg: 'rgba(175, 0, 0, 0.06)',
    bgFaint: 'rgba(175, 0, 0, 0.04)',
    label: 'A',
    cssClass: 'a',
    borderDash: []
  },
  {
    border: 'rgba(220, 223, 226, 0.5)',
    bg: 'rgba(220, 223, 226, 0.03)',
    bgFaint: 'rgba(220, 223, 226, 0.02)',
    label: 'B',
    cssClass: 'b',
    borderDash: [6, 3]
  },
  {
    border: 'rgba(220, 223, 226, 0.25)',
    bg: 'rgba(220, 223, 226, 0.02)',
    bgFaint: 'rgba(220, 223, 226, 0.01)',
    label: 'C',
    cssClass: 'c',
    borderDash: [2, 2]
  }
];

export function getSlotColors(): SlotColor[] {
  const existing = getAppSlotColors<SlotColor>();
  if (existing.length > 0) {
    return existing;
  }

  const colors = SLOT_COLOR_PALETTE.map((color) => ({
    ...color,
    borderDash: [...color.borderDash]
  }));
  setAppSlotColors(colors);
  return getAppSlotColors<SlotColor>();
}

// ============================================
// Slot Management
// ============================================

export function toggleComparisonMode(): void {
  // Legacy compat â€” now routes through switchMode in app.js
  // This function is called from inline handlers, so it needs window.switchMode
  if (typeof (window as any).switchMode === 'function') {
    const currentMode = getAppCurrentMode();
    if (currentMode === 'compare') {
      (window as any).switchMode('overview');
    } else {
      (window as any).switchMode('compare');
    }
  }
}

export function addComparisonSlotFromHome(): void {
  if (slots().length >= 3) return;

  const setup = getCurrentSetup();
  const slotData: CompareSlot = {
    id: Date.now(),
    racquetId: '',
    stringId: '',
    isHybrid: false,
    mainsId: '',
    crossesId: '',
    mainsTension: 55,
    crossesTension: 53,
    stats: null,
    identity: null
  };

  if (setup) {
    slotData.racquetId = setup.racquet.id;
    if (setup.stringConfig.isHybrid) {
      slotData.isHybrid = true;
      slotData.mainsId = setup.stringConfig.mains.id;
      slotData.crossesId = setup.stringConfig.crosses.id;
      slotData.mainsTension = setup.stringConfig.mainsTension;
      slotData.crossesTension = setup.stringConfig.crossesTension;
    } else {
      slotData.isHybrid = false;
      slotData.stringId = setup.stringConfig.string.id;
      slotData.mainsTension = setup.stringConfig.mainsTension;
      slotData.crossesTension = setup.stringConfig.crossesTension;
    }
  }

  slots().push(slotData);
  // Render first, then recalc (DOM must exist before deltas render)
  renderComparisonSlots();
  if (slotData.racquetId && (slotData.stringId || slotData.mainsId)) {
    recalcSlot(slots().length - 1);
  }
}

export function addComparisonSlot(): void {
  if (slots().length >= 3) return;

  const slotIndex = slots().length;

  const slotData: CompareSlot = {
    id: Date.now(),
    racquetId: '',
    stringId: '',
    isHybrid: false,
    mainsId: '',
    crossesId: '',
    mainsTension: 55,
    crossesTension: 53,
    stats: null,
    identity: null
  };

  slots().push(slotData);
  renderComparisonSlots();
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  try { updateComparisonRadar(); } catch (e) { }

  // Unconfigured cards auto-open in edit mode â€” no toggle needed
  // Just scroll to the new card
  const newCard = document.querySelector(`.compare-summary-card[data-slot-index="${slotIndex}"]`);
  if (newCard) {
    requestAnimationFrame(() => {
      newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}

export function removeComparisonSlot(index: number): void {
  slots().splice(index, 1);
  renderComparisonSlots();
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  try { updateComparisonRadar(); } catch (e) { }
  try { renderComparisonDeltas(); } catch (e) { }
  try {
    if (typeof (window as any).renderDockContextPanel === 'function') {
      (window as any).renderDockContextPanel();
    }
  } catch (e) { }
}

export function renderComparisonSlots(): void {
  // Legacy: editors panel is hidden. Only update add button visibility.
  const addBtn = document.getElementById('btn-add-slot') as HTMLElement | null;
  if (addBtn) {
    addBtn.style.display = slots().length >= 3 ? 'none' : '';
  }
}

export function recalcSlot(index: number): void {
  const slot = slots()[index];
  const racquet = RACQUETS.find(r => r.id === slot.racquetId);

  let stringConfig: { isHybrid: false; string: typeof STRINGS[0]; mainsTension: number; crossesTension: number } | { isHybrid: true; mains: typeof STRINGS[0]; crosses: typeof STRINGS[0]; mainsTension: number; crossesTension: number } | null = null;

  if (slot.isHybrid) {
    const mainsData = STRINGS.find(s => s.id === slot.mainsId);
    const crossesData = STRINGS.find(s => s.id === slot.crossesId);
    if (racquet && mainsData && crossesData) {
      stringConfig = {
        isHybrid: true,
        mains: mainsData,
        crosses: crossesData,
        mainsTension: slot.mainsTension,
        crossesTension: slot.crossesTension
      };
    }
  } else {
    const stringData = STRINGS.find(s => s.id === slot.stringId);
    if (racquet && stringData) {
      stringConfig = {
        isHybrid: false,
        string: stringData,
        mainsTension: slot.mainsTension,
        crossesTension: slot.crossesTension
      };
    }
  }

  if (racquet && stringConfig) {
    slot.stats = predictSetup(racquet, stringConfig);
    slot.identity = generateIdentity(slot.stats, racquet, stringConfig);
  } else {
    slot.stats = null;
    slot.identity = null;
  }

  // Partial update: update card OBS/archetype/meta in-place if card exists
  const card = document.querySelector(`.compare-summary-card[data-slot-index="${index}"]`);
  if (card && slot.stats) {
    const scoreRq = RACQUETS.find(r => r.id === slot.racquetId);
    const scoreCtx = scoreRq ? { 
      avgTension: (slot.mainsTension + slot.crossesTension) / 2, 
      tensionRange: scoreRq.tensionRange as [number, number],
      differential: slot.mainsTension - slot.crossesTension,
      patternCrosses: scoreRq.patternCrosses
    } as TensionContext : null;
    const newObs = computeCompositeScore(slot.stats, scoreCtx).toFixed(1);
    const archEl = card.querySelector('.compare-summary-archetype');
    const obsEl = card.querySelector('.compare-summary-score-value');
    const metaEl = card.querySelector('.compare-summary-meta-compact');

    if (archEl) archEl.textContent = slot.identity?.archetype || 'Balanced Setup';
    if (obsEl) {
      obsEl.textContent = newObs;
      (obsEl as HTMLElement).style.color = getObsScoreColor(parseFloat(newObs));
    }
    if (metaEl) {
      const mp: string[] = [];
      if (scoreRq) mp.push(scoreRq.name);
      if (slot.isHybrid) {
        const m2 = STRINGS.find(s => s.id === slot.mainsId);
        const x2 = STRINGS.find(s => s.id === slot.crossesId);
        if (m2 && x2) mp.push(m2.name + ' / ' + x2.name);
      } else {
        const str2 = STRINGS.find(s => s.id === slot.stringId);
        if (str2) mp.push(str2.name);
      }
      mp.push('M:' + slot.mainsTension + ' / X:' + slot.crossesTension);
      metaEl.textContent = mp.join(' Â· ');
    }
  } else {
    // Full re-render needed (e.g. slot became configured or lost stats)
    renderCompareSummaries();
  }

  renderComparisonSlots();
  renderCompareVerdict();
  renderCompareMatrix();
  try { updateComparisonRadar(); } catch (e) { }
  try { renderComparisonDeltas(); } catch (e) { }
  try {
    if (typeof (window as any).renderDockContextPanel === 'function') {
      (window as any).renderDockContextPanel();
    }
  } catch (e) { }
}

// ============================================
// Radar Chart
// ============================================

export function updateComparisonRadar(): void {
  const canvas = document.getElementById('comparison-radar-chart') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const datasets: any[] = [];
  const colors = getSlotColors();

  const pointStyles = ['circle', 'rectRot', 'triangle'];

  slots().forEach((slot, i) => {
    if (!slot.stats) return;
    const color = colors[i];
    datasets.push({
      label: `Setup ${color.label}`,
      data: STAT_KEYS.map(k => slot.stats![k as keyof SetupStats]),
      backgroundColor: color.bgFaint,
      borderColor: color.border,
      borderWidth: 1.8,
      borderDash: color.borderDash,
      pointBackgroundColor: color.border,
      pointBorderColor: 'transparent',
      pointStyle: pointStyles[i] || 'circle',
      pointRadius: 3,
      pointHoverRadius: 5
    });
  });

  const isDark = document.documentElement.dataset.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const angleColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const labelColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.36)';
  const legendColor = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.48)';

  const radarChart = getRadarChart();
  if (radarChart) {
    radarChart.data.datasets = datasets;
    radarChart.options.scales!.r!.grid!.color = gridColor;
    radarChart.options.scales!.r!.angleLines!.color = angleColor;
    radarChart.options.scales!.r!.pointLabels!.color = labelColor;
    radarChart.options.plugins!.legend!.labels!.color = legendColor;
    radarChart.update('active');
    return;
  }

  // Dynamic import for Chart.js to avoid bundling issues
  const ChartCtor = (window as any).Chart;
  if (!ChartCtor) {
    console.error('Chart.js not loaded');
    return;
  }

  const newChart = new ChartCtor(ctx, {
    type: 'radar',
    data: {
      labels: STAT_LABELS_FULL,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
            color: legendColor,
            usePointStyle: true,
            padding: 16
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 25, display: false },
          grid: { color: gridColor, circular: false, lineWidth: 0.5 },
          angleLines: { color: angleColor, lineWidth: 0.5 },
          pointLabels: {
            font: { family: "'Inter', sans-serif", size: 10, weight: '500' },
            color: labelColor
          }
        }
      },
      animation: { duration: 600, easing: 'easeOutQuart' }
    }
  });
  
  setRadarChart(newChart);
}

// ============================================
// Delta Comparison
// ============================================

export function renderComparisonDeltas(): void {
  const container = document.getElementById('comparison-deltas');
  if (!container) return;

  const validSlots = slots().filter(s => s.stats);
  if (validSlots.length < 2) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  const colors = getSlotColors();

  for (let i = 1; i < validSlots.length; i++) {
    const base = validSlots[0];
    const comp = validSlots[i];
    const baseColor = colors[slots().indexOf(base)];
    const compColor = colors[slots().indexOf(comp)];

    html += `<div class="delta-group">
      <div class="delta-title">Setup ${compColor.label} vs Setup ${baseColor.label}</div>
      ${STAT_KEYS.map((key, j) => {
        const diff = (comp.stats![key as keyof SetupStats] as number) - (base.stats![key as keyof SetupStats] as number);
        const cls = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
        const sign = diff > 0 ? '+' : '';
        return `<div class="delta-item">
          <span class="delta-label">${STAT_LABELS[j]}</span>
          <span class="delta-value ${cls}">${sign}${diff.toFixed(0)}</span>
        </div>`;
      }).join('')}
    </div>`;
  }

  container.innerHTML = html;
}

// ============================================
// Summary Cards
// ============================================

export function renderCompareSummaries(): void {
  const container = document.getElementById('compare-summaries');
  const emptyState = document.getElementById('compare-empty-state');
  const verdict = document.getElementById('compare-verdict');
  const matrix = document.getElementById('compare-matrix');
  const proof = document.getElementById('compare-proof');
  const radarDetails = document.getElementById('compare-details-radar');

  if (!container) return;

  const validSlots = slots().filter(s => s.stats);

  if (slots().length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = '';
    if (verdict) verdict.style.display = 'none';
    if (matrix) matrix.style.display = 'none';
    if (proof) proof.style.display = 'none';
    if (radarDetails) radarDetails.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  if (validSlots.length < 2) {
    if (verdict) verdict.style.display = 'none';
    if (matrix) matrix.style.display = 'none';
    if (proof) proof.style.display = 'none';
    if (radarDetails) radarDetails.style.display = 'none';
  }

  // Track which slots are currently editing (preserve across re-render)
  const prevEditing: Record<string, boolean> = {};
  container.querySelectorAll('.compare-summary-card.compare-card-editing').forEach((el) => {
    const idx = (el as HTMLElement).dataset.slotIndex;
    if (idx != null) prevEditing[idx] = true;
  });

  container.innerHTML = '';
  const colors = getSlotColors();

  slots().forEach((slot, index) => {
    const color = colors[index];

    // Unconfigured placeholder
    if (!slot.stats) {
      const div = document.createElement('div');
      div.className = `compare-summary-card compare-card-editing slot-color-${color.cssClass}`;
      div.dataset.slotIndex = String(index);
      div.style.opacity = '0.85';
      const quickLoadHTML = _compareBuildLoadFromSavedDropdown(index);
      div.innerHTML = `
        <div class="compare-summary-top">
          <div class="compare-summary-identity">
            <span class="compare-summary-label slot-label-${color.cssClass}">Setup ${color.label}</span>
            <div class="compare-summary-archetype" style="font-size:0.82rem;opacity:0.5;">Not configured</div>
          </div>
          <button class="compare-card-remove" onclick="removeComparisonSlot(${index})" title="Remove">âœ•</button>
        </div>
        <div class="compare-card-editor" data-slot="${index}">
          ${quickLoadHTML}
          <div class="compare-ed-row">
            <div class="compare-ed-ss-racquet" data-slot="${index}" data-value="${slot.racquetId || ''}"></div>
          </div>
          <div class="compare-ed-toggle">
            <button class="compare-ed-toggle-btn ${slot.isHybrid ? '' : 'active'}" data-slot="${index}" data-mode="full">Full Bed</button>
            <button class="compare-ed-toggle-btn ${slot.isHybrid ? 'active' : ''}" data-slot="${index}" data-mode="hybrid">Hybrid</button>
          </div>
          ${_compareEditorStringHTML(slot, index)}
        </div>
      `;
      container.appendChild(div);
      _compareInitEditorSS(div, index, slot);
      return;
    }

    const racquet = RACQUETS.find(r => r.id === slot.racquetId);
    const slotTensionCtx = racquet ? { 
      avgTension: (slot.mainsTension + slot.crossesTension) / 2, 
      tensionRange: racquet.tensionRange as [number, number],
      differential: slot.mainsTension - slot.crossesTension,
      patternCrosses: racquet.patternCrosses
    } as TensionContext : null;
    const obsScore = computeCompositeScore(slot.stats, slotTensionCtx).toFixed(1);
    const pct = Math.min(100, Math.max(0, parseFloat(obsScore)));
    const circumference = 2 * Math.PI * 22;
    const dashOffset = circumference * (1 - pct / 100);
    const archetype = slot.identity?.archetype || 'Balanced Setup';
    const isEditing = prevEditing[index];

    // Compact meta
    const metaParts: string[] = [];
    if (racquet) metaParts.push(racquet.name);
    if (slot.isHybrid) {
      const m = STRINGS.find(s => s.id === slot.mainsId);
      const x = STRINGS.find(s => s.id === slot.crossesId);
      if (m && x) metaParts.push(m.name + ' / ' + x.name);
    } else {
      const str = STRINGS.find(s => s.id === slot.stringId);
      if (str) metaParts.push(str.name);
    }
    metaParts.push('M:' + slot.mainsTension + ' / X:' + slot.crossesTension);

    const div = document.createElement('div');
    div.className = `compare-summary-card slot-color-${color.cssClass}${isEditing ? ' compare-card-editing' : ''}`;
    div.dataset.slotIndex = String(index);

    // Build "Load from My Loadouts" dropdown HTML
    const loadFromSavedHTML = _compareBuildLoadFromSavedDropdown(index);

    div.innerHTML = `
      <div class="compare-summary-top">
        <div class="compare-summary-identity">
          <span class="compare-summary-label slot-label-${color.cssClass}">Setup ${color.label}</span>
          <div class="compare-summary-archetype">${archetype}</div>
        </div>
        <div class="compare-summary-score">
          <div class="compare-summary-score-ring compare-ring-sm">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" stroke="var(--border-subtle)" stroke-width="2.5" fill="none" />
              <circle cx="24" cy="24" r="22" stroke="${color.border}" stroke-width="2.5" fill="none"
                stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
                stroke-linecap="round" transform="rotate(-90 24 24)" />
            </svg>
            <span class="compare-summary-score-value" style="color:${getObsScoreColor(parseFloat(obsScore))}">${obsScore}</span>
          </div>
        </div>
      </div>
      <div class="compare-summary-meta-compact">${metaParts.join(' Â· ')}</div>
      ${_isCompareSlotStale(slot) ? '<div class="compare-slot-stale"><span class="compare-stale-text">â†» Source loadout changed</span><button class="compare-stale-btn" onclick="_refreshCompareSlot(' + index + ')">Refresh</button></div>' : ''}
      <div class="compare-card-actions">
        <button class="compare-action-btn compare-action-edit" onclick="_toggleCompareCardEditor(${index})">
          <svg viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Edit
        </button>
        <button class="compare-action-btn" onclick="openTuneForSlot(${index})">
          <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>
          Tune
        </button>
        <button class="compare-action-btn compare-action-remove" onclick="removeComparisonSlot(${index})">âœ•</button>
      </div>
      <div class="compare-card-editor" data-slot="${index}">
        ${loadFromSavedHTML}
        <div class="compare-ed-row">
          <div class="compare-ed-ss-racquet" data-slot="${index}" data-value="${slot.racquetId || ''}"></div>
        </div>
        <div class="compare-ed-toggle">
          <button class="compare-ed-toggle-btn ${slot.isHybrid ? '' : 'active'}" data-slot="${index}" data-mode="full">Full Bed</button>
          <button class="compare-ed-toggle-btn ${slot.isHybrid ? 'active' : ''}" data-slot="${index}" data-mode="hybrid">Hybrid</button>
        </div>
        ${_compareEditorStringHTML(slot, index)}
      </div>
    `;
    container.appendChild(div);
    _compareInitEditorSS(div, index, slot);
  });
}

// ============================================
// Editor Helpers
// ============================================

function _compareBuildLoadFromSavedDropdown(slotIndex: number): string {
  const saved = getSavedLoadouts();
  if (!saved || saved.length === 0) return '';
  
  const options = saved.map(lo => 
    `<option value="${lo.id}">${(lo as any).name || 'Unnamed'}</option>`
  ).join('');
  
  return `
    <div class="compare-ed-loadfrom">
      <select class="compare-ed-loadfrom-select" onchange="_compareLoadFromSaved(${slotIndex}, this.value)">
        <option value="">Load from My Loadouts...</option>
        ${options}
      </select>
    </div>
  `;
}

export function _compareLoadFromSaved(slotIndex: number, loadoutId: string): void {
  if (!loadoutId) return;
  const saved = getSavedLoadouts();
  const lo = saved.find((s: any) => s.id === loadoutId);
  if (!lo) return;

  const newSlot = getCompareStateSlotByIndex(slotIndex);
  const newStats = ((lo as Loadout).stats as SetupStats | null) || buildStatsFromLoadout(lo as Loadout);
  const win = window as CompareWindowExt;
  if (newSlot && newStats && typeof win.compareSetSlotLoadout === 'function') {
    win.compareSetSlotLoadout(newSlot.id, { ...(lo as Loadout), stats: newStats }, newStats);
    return;
  }

  if (!slots()[slotIndex]) return;

  const slot = slots()[slotIndex];
  slot.racquetId = (lo as any).frameId || '';
  
  if ((lo as any).isHybrid) {
    slot.isHybrid = true;
    slot.mainsId = (lo as any).mainsId || '';
    slot.crossesId = (lo as any).crossesId || '';
    slot.mainsTension = (lo as any).mainsTension ?? 55;
    slot.crossesTension = (lo as any).crossesTension ?? 53;
  } else {
    slot.isHybrid = false;
    slot.stringId = (lo as any).stringId || '';
    slot.mainsTension = (lo as any).mainsTension ?? (lo as any).tension ?? 55;
    slot.crossesTension = (lo as any).crossesTension ?? (lo as any).tension ?? 53;
  }
  
  slot.sourceLoadoutId = loadoutId;
  slot.snapshotObs = (lo as any).obs;

  recalcSlot(slotIndex);
  renderCompareSummaries();
}

function _isCompareSlotStale(slot: CompareSlot): boolean {
  if (!slot.sourceLoadoutId || !slot.snapshotObs) return false;
  const saved = getSavedLoadouts();
  const lo = saved.find((s: any) => s.id === slot.sourceLoadoutId);
  if (!lo) return false;
  return Math.abs(((lo as any).obs ?? 0) - slot.snapshotObs) > 0.2;
}

export function _refreshCompareSlot(index: number): void {
  const newSlot = getCompareStateSlotByIndex(index);
  const newLoadout = newSlot?.loadout as (Loadout & { sourceLoadoutId?: string | null }) | null;
  if (newLoadout?.sourceLoadoutId) {
    _compareLoadFromSaved(index, newLoadout.sourceLoadoutId);
    return;
  }

  const slot = slots()[index];
  if (!slot?.sourceLoadoutId) return;
  _compareLoadFromSaved(index, slot.sourceLoadoutId);
}

function _compareEditorStringHTML(slot: CompareSlot, index: number): string {
  if (slot.isHybrid) {
    return `
      <div class="compare-ed-row">
        <div class="compare-ed-ss-mains" data-slot="${index}" data-value="${slot.mainsId || ''}"></div>
      </div>
      <div class="compare-ed-row">
        <div class="compare-ed-ss-crosses" data-slot="${index}" data-value="${slot.crossesId || ''}"></div>
      </div>
      <div class="compare-ed-row compare-ed-tensions">
        <label>Mains tension</label>
        <input type="range" min="20" max="70" value="${slot.mainsTension}" 
          oninput="_compareOnTensionInput(this, ${index}, 'mainsTension')">
        <span class="compare-ed-tension-val">${slot.mainsTension}</span>
      </div>
      <div class="compare-ed-row compare-ed-tensions">
        <label>Crosses tension</label>
        <input type="range" min="20" max="70" value="${slot.crossesTension}" 
          oninput="_compareOnTensionInput(this, ${index}, 'crossesTension')">
        <span class="compare-ed-tension-val">${slot.crossesTension}</span>
      </div>
    `;
  } else {
    return `
      <div class="compare-ed-row">
        <div class="compare-ed-ss-string" data-slot="${index}" data-value="${slot.stringId || ''}"></div>
      </div>
      <div class="compare-ed-row compare-ed-tensions">
        <label>Mains tension</label>
        <input type="range" min="20" max="70" value="${slot.mainsTension}" 
          oninput="_compareOnTensionInput(this, ${index}, 'mainsTension')">
        <span class="compare-ed-tension-val">${slot.mainsTension}</span>
      </div>
      <div class="compare-ed-row compare-ed-tensions">
        <label>Crosses tension</label>
        <input type="range" min="20" max="70" value="${slot.crossesTension}" 
          oninput="_compareOnTensionInput(this, ${index}, 'crossesTension')">
        <span class="compare-ed-tension-val">${slot.crossesTension}</span>
      </div>
    `;
  }
}

function _compareInitEditorSS(card: Element, index: number, slot: CompareSlot): void {
  // Initialize searchable selects for this editor
  const racquetSS = card.querySelector(`.compare-ed-ss-racquet[data-slot="${index}"]`);
  const stringSS = card.querySelector(`.compare-ed-ss-string[data-slot="${index}"]`);
  const mainsSS = card.querySelector(`.compare-ed-ss-mains[data-slot="${index}"]`);
  const crossesSS = card.querySelector(`.compare-ed-ss-crosses[data-slot="${index}"]`);

  if (racquetSS) {
    createSearchableSelect(racquetSS as HTMLElement, {
      type: 'racquet',
      placeholder: 'Choose a frame...',
      value: slot.racquetId,
      onChange: (val: string) => { slots()[index].racquetId = val; recalcSlot(index); }
    });
  }

  if (stringSS) {
    createSearchableSelect(stringSS as HTMLElement, {
      type: 'string',
      placeholder: 'Choose a string...',
      value: slot.stringId,
      onChange: (val: string) => { slots()[index].stringId = val; recalcSlot(index); }
    });
  }

  if (mainsSS) {
    createSearchableSelect(mainsSS as HTMLElement, {
      type: 'string',
      placeholder: 'Mains string...',
      value: slot.mainsId,
      onChange: (val: string) => { slots()[index].mainsId = val; recalcSlot(index); }
    });
  }

  if (crossesSS) {
    createSearchableSelect(crossesSS as HTMLElement, {
      type: 'string',
      placeholder: 'Crosses string...',
      value: slot.crossesId,
      onChange: (val: string) => { slots()[index].crossesId = val; recalcSlot(index); }
    });
  }

  // Bind toggle buttons
  card.querySelectorAll('.compare-ed-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const idx = parseInt(target.dataset.slot || '0');
      const mode = target.dataset.mode || 'full';
      slots()[idx].isHybrid = (mode === 'hybrid');
      renderCompareSummaries();
      recalcSlot(idx);
    });
  });
}

function _compareOnTensionInput(target: HTMLInputElement, idx: number, targetKey: string): void {
  const val = parseInt(target.value) || 55;
  (slots()[idx] as any)[targetKey] = val;
  const display = target.parentElement?.querySelector('.compare-ed-tension-val');
  if (display) display.textContent = String(val);
  recalcSlot(idx);
}

export function _toggleCompareCardEditor(index: number): void {
  const card = document.querySelector(`.compare-summary-card[data-slot-index="${index}"]`);
  if (!card) return;
  card.classList.toggle('compare-card-editing');
  if (card.classList.contains('compare-card-editing')) {
    // Re-init searchable selects when opening editor
    _compareInitEditorSS(card, index, slots()[index]);
  }
}

// ============================================
// Verdict & Matrix
// ============================================

export function renderCompareVerdict(): void {
  const container = document.getElementById('compare-verdict');
  if (!container) return;

  const validSlots = slots().filter(s => s.stats);
  if (validSlots.length < 2) {
    container.style.display = 'none';
    return;
  }
  container.style.display = '';

  // Score each slot for different scenarios
  const scored = validSlots.map(slot => {
    const stats = slot.stats!;
    return {
      slot,
      power: stats.power + stats.spin,
      control: stats.control + stats.feel,
      comfort: stats.comfort + stats.feel,
      spin: stats.spin + stats.control,
      overall: stats.power + stats.control + stats.spin + stats.comfort + stats.feel + stats.stability
    };
  });

  const bestPower = scored.reduce((a, b) => a.power > b.power ? a : b);
  const bestControl = scored.reduce((a, b) => a.control > b.control ? a : b);
  const bestComfort = scored.reduce((a, b) => a.comfort > b.comfort ? a : b);
  const bestSpin = scored.reduce((a, b) => a.spin > b.spin ? a : b);
  const bestOverall = scored.reduce((a, b) => a.overall > b.overall ? a : b);

  const colors = getSlotColors();
  const slotA = validSlots[0];
  const colorA = colors[slots().indexOf(slotA)];

  let html = `
    <div class="compare-verdict-header">
      <span class="slot-badge" style="background:${colorA.border};color:white">A</span>
      <span class="compare-verdict-title">Comparison Verdict</span>
    </div>
    <div class="compare-verdict-grid">
      <div class="verdict-item">
        <div class="verdict-label">Best Power</div>
        <div class="verdict-value">Setup ${colors[slots().indexOf(bestPower.slot)].label}</div>
      </div>
      <div class="verdict-item">
        <div class="verdict-label">Best Control</div>
        <div class="verdict-value">Setup ${colors[slots().indexOf(bestControl.slot)].label}</div>
      </div>
      <div class="verdict-item">
        <div class="verdict-label">Best Comfort</div>
        <div class="verdict-value">Setup ${colors[slots().indexOf(bestComfort.slot)].label}</div>
      </div>
      <div class="verdict-item">
        <div class="verdict-label">Best Spin</div>
        <div class="verdict-value">Setup ${colors[slots().indexOf(bestSpin.slot)].label}</div>
      </div>
      <div class="verdict-item verdict-winner">
        <div class="verdict-label">Best Overall</div>
        <div class="verdict-value">Setup ${colors[slots().indexOf(bestOverall.slot)].label}</div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

export function renderCompareMatrix(): void {
  const container = document.getElementById('compare-matrix');
  if (!container) return;

  const validSlots = slots().filter(s => s.stats);
  if (validSlots.length < 2) {
    container.style.display = 'none';
    return;
  }
  container.style.display = '';

  const colors = getSlotColors();
  const stats = ['power', 'control', 'spin', 'comfort', 'feel', 'stability'] as const;

  let html = '<div class="compare-matrix-table"><table><thead><tr><th>Stat</th>';
  validSlots.forEach((slot, i) => {
    const color = colors[slots().indexOf(slot)];
    html += `<th style="color:${color.border}">Setup ${color.label}</th>`;
  });
  html += '</tr></thead><tbody>';

  stats.forEach(stat => {
    html += `<tr><td class="matrix-stat">${stat}</td>`;
    const values = validSlots.map(s => s.stats![stat as keyof SetupStats] as number);
    const maxVal = Math.max(...values);
    
    validSlots.forEach((slot, i) => {
      const val = values[i];
      const isMax = val === maxVal;
      html += `<td class="matrix-val${isMax ? ' matrix-max' : ''}">${val.toFixed(0)}${isMax ? ' â˜…' : ''}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// ============================================
// Tune Integration
// ============================================

export function openTuneForSlot(slotIndex: number): void {
  const slot = slots()[slotIndex];
  if (!slot) return;

  // Switch to tune mode and set up for this slot
  if (typeof (window as any).switchMode === 'function') {
    (window as any).switchMode('tune');
    
    // Set the tune mode to use this slot's configuration
    const win = window as any;
    if (win.tuneState) {
      win.tuneState.frameId = slot.racquetId;
      win.tuneState.isHybrid = slot.isHybrid;
      win.tuneState.mainsId = slot.mainsId;
      win.tuneState.crossesId = slot.crossesId;
      win.tuneState.stringId = slot.stringId;
      win.tuneState.mainsTension = slot.mainsTension;
      win.tuneState.crossesTension = slot.crossesTension;
    }
  }
}

// ============================================
// External Dependencies (from app.js)
// ============================================

declare function getCurrentSetup(): { racquet: Racquet; stringConfig: any } | null;
