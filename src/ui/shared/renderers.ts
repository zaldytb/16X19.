// src/ui/shared/renderers.ts
// Shared rendering utilities: OBS score display, stat bars, common UI components

import {
  STAT_GROUPS,
  OBS_TIERS,
  STAT_LABELS,
  STAT_CSS_CLASSES,
} from '../../engine/constants.js';
import {
  predictSetup,
  buildTensionContext,
  computeCompositeScore,
  generateIdentity,
  classifySetup,
} from '../../engine/index.js';
import type { Racquet, StringConfig, SetupAttributes, IdentityResult } from '../../engine/types.js';
import { getGaugeOptions } from '../../engine/string-profile.js';
import { STRINGS } from '../../data/loader.js';
import { animateOBSInContainer } from '../components/obs-animation.js';

// ============================================
// OBS SCORE DISPLAY
// ============================================

interface OBSTier {
  min: number;
  max: number;
  label: string;
}

function getObsTier(score: number): OBSTier {
  for (const tier of OBS_TIERS) {
    if (score >= tier.min && score < tier.max) return tier;
  }
  return OBS_TIERS[OBS_TIERS.length - 1];
}

interface OBSRenderOptions {
  animate?: boolean;
  showDelta?: boolean;
  baselineScore?: number;
  size?: 'sm' | 'md' | 'lg';
}

const _obsBadgePrevScores = new WeakMap<HTMLElement, number>();

export function renderOBSBadge(
  container: HTMLElement,
  score: number,
  options: OBSRenderOptions = {}
): void {
  const { animate = false, showDelta = false, baselineScore, size = 'md' } = options;
  const tier = getObsTier(score);
  const pct = Math.min(Math.max(score / 100, 0), 1) * 100;

  // Delta vs baseline
  let deltaHTML = '';
  if (showDelta && baselineScore !== undefined) {
    const delta = score - baselineScore;
    if (Math.abs(delta) > 0.05) {
      const sign = delta > 0 ? '+' : '';
      const deltaCls = delta > 0 ? 'obs-delta-pos' : 'obs-delta-neg';
      deltaHTML = `<span class="obs-delta-chip ${deltaCls}">${sign}${delta.toFixed(1)}</span>`;
    }
  }

  // 10-segment battery indicator
  const segments = 10;
  const filled = Math.min(segments, Math.max(0, Math.ceil(score / 10)));
  let batteryHTML = '<div class="obs-battery">';
  for (let i = 0; i < segments; i++) {
    const isFilled = i < filled;
    const isTopTier = i >= 8;
    const segClass = isFilled
      ? isTopTier
        ? 'obs-battery-seg obs-battery-filled obs-battery-top'
        : 'obs-battery-seg obs-battery-filled'
      : 'obs-battery-seg';
    batteryHTML += `<div class="${segClass}"></div>`;
  }
  batteryHTML += '</div>';

  const isSRank = tier.label === 'S Rank';
  const rankClass = isSRank ? 'obs-rank-badge s-rank' : 'obs-rank-badge';

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  container.innerHTML = `
    <div class="obs-top-row">
      <div class="obs-score-group">
        <span class="obs-score-value ${sizeClasses[size]}">${score.toFixed(1)}</span>
        ${deltaHTML}
      </div>
      <span class="${rankClass}">${tier.label}</span>
    </div>
    ${batteryHTML}
  `;

  const previousScore = _obsBadgePrevScores.get(container);
  if (animate) {
    animateOBSInContainer(container, '.obs-score-value', score, 400, previousScore ?? null);
  }
  _obsBadgePrevScores.set(container, score);
}

// Legacy OBS renderer - used by various pages
export function renderOverallBuildScore(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  options: { animate?: boolean; containerSelector?: string } = {}
): void {
  const container = document.querySelector(options.containerSelector || '#obs-content') as HTMLElement;
  if (!container) return;

  const { racquet, stringConfig } = setup;
  const stats = predictSetup(racquet, stringConfig);
  const tCtx = buildTensionContext(stringConfig, racquet);
  const score = computeCompositeScore(stats, tCtx);

  renderOBSBadge(container, score, { animate: options.animate });
}

// ============================================
// STAT BARS
// ============================================

export interface StatBarItem {
  key: string;
  value: number;
  label?: string;
  cssClass?: string;
}

export function renderStatBar(
  container: HTMLElement,
  items: StatBarItem[],
  options: { stagger?: boolean; maxValue?: number } = {}
): void {
  const { stagger = false, maxValue = 100 } = options;

  container.innerHTML = items
    .map((item, idx) => {
      const pct = Math.min(100, Math.max(0, (item.value / maxValue) * 100));
      const delay = stagger ? idx * 50 : 0;
      const cssClass = item.cssClass || item.key;
      const label = item.label || item.key;

      return `
        <div class="stat-bar-row" style="animation-delay: ${delay}ms">
          <div class="stat-bar-label">${label}</div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill ${cssClass}" style="width: ${pct}%"></div>
          </div>
          <div class="stat-bar-value">${Math.round(item.value)}</div>
        </div>
      `;
    })
    .join('');
}

// Grouped stat bars (Attack/Defense/Touch/Longevity)
export function renderGroupedStatBars(
  container: HTMLElement,
  stats: SetupAttributes,
  options: { stagger?: boolean } = {}
): void {
  const { stagger = false } = options;

  container.innerHTML = STAT_GROUPS.map((group, groupIdx) => {
    const groupDelay = stagger ? groupIdx * 100 : 0;

    const bars = group.keys
      .map((key, idx) => {
        const value = stats[key as keyof SetupAttributes] as number;
        const pct = Math.min(100, Math.max(0, value));
        const delay = groupDelay + idx * 50;
        const label = STAT_LABELS[STAT_CSS_CLASSES.indexOf(key)] || key;

        return `
          <div class="stat-bar-row" style="animation-delay: ${delay}ms">
            <div class="stat-bar-label">${label}</div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill ${key}" style="width: ${pct}%"></div>
            </div>
            <div class="stat-bar-value">${Math.round(value)}</div>
          </div>
        `;
      })
      .join('');

    return `
      <div class="stat-group">
        <div class="stat-group-header">${group.label}</div>
        <div class="stat-group-bars">${bars}</div>
      </div>
    `;
  }).join('');
}

// ============================================
// IDENTITY PILL
// ============================================

export function renderIdentityPill(
  container: HTMLElement,
  identity: IdentityResult,
  options: { size?: 'sm' | 'md' | 'lg' } = {}
): void {
  const { size = 'md' } = options;
  const { archetype, description } = identity;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  container.innerHTML = `
    <span class="identity-pill ${sizeClasses[size]}">
      <span class="identity-archetype">${archetype}</span>
      <span class="identity-description">${description}</span>
    </span>
  `;
}

// ============================================
// GAUGE DROPDOWN OPTIONS
// ============================================

export function renderGaugeOptions(
  selectEl: HTMLSelectElement,
  stringId: string
): void {
  if (!stringId) {
    selectEl.innerHTML = '<option value="">—</option>';
    selectEl.disabled = true;
    return;
  }

  const s = STRINGS.find((x) => x.id === stringId);
  if (!s) {
    selectEl.innerHTML = '<option value="">—</option>';
    selectEl.disabled = true;
    return;
  }

  const options = getGaugeOptions(s);
  const refGauge = s.gaugeNum;

  selectEl.innerHTML = options
    .map((g) => {
      const isRef = Math.abs(g - refGauge) < 0.005;
      let label = getGaugeLabel(g);
      const tag = isRef ? ' •' : '';
      return `<option value="${g}" ${isRef ? 'selected' : ''}>${label}${tag}</option>`;
    })
    .join('');
  selectEl.disabled = false;
}

function getGaugeLabel(g: number): string {
  const labels: Record<number, string> = {
    1.15: '18 (1.15mm)',
    1.2: '17 (1.20mm)',
    1.25: '16L (1.25mm)',
    1.3: '16 (1.30mm)',
    1.35: '15L (1.35mm)',
    1.4: '15L (1.40mm)',
  };

  if (labels[g]) return labels[g];

  // Build label for non-standard gauges
  const gNum = g >= 1.3 ? '16' : g >= 1.25 ? '16L' : g >= 1.2 ? '17' : '18';
  return `${gNum} (${g.toFixed(2)}mm)`;
}

// ============================================
// FIT PROFILE & WARNINGS
// ============================================

export interface FitProfileItem {
  icon: string;
  label: string;
  value: string;
  score?: number;
}

export function generateFitProfile(
  stats: SetupAttributes,
  racquet: Racquet,
  stringConfig: StringConfig
): FitProfileItem[] {
  const identity = generateIdentity(stats, racquet, stringConfig);

  return [
    {
      icon: '🎯',
      label: 'Play Style',
      value: identity.archetype,
    },
    {
      icon: '🏷️',
      label: 'Identity',
      value: identity.description,
    },
    {
      icon: '⚡',
      label: 'Power Level',
      value: stats.power > 70 ? 'High' : stats.power > 55 ? 'Medium' : 'Low',
      score: stats.power,
    },
    {
      icon: '🎾',
      label: 'Spin Potential',
      value: stats.spin > 75 ? 'Extreme' : stats.spin > 65 ? 'High' : 'Moderate',
      score: stats.spin,
    },
    {
      icon: '🎯',
      label: 'Control',
      value: stats.control > 70 ? 'Surgical' : stats.control > 55 ? 'Good' : 'Forgiving',
      score: stats.control,
    },
    {
      icon: '💪',
      label: 'Comfort',
      value: stats.comfort > 70 ? 'Arm-friendly' : stats.comfort > 50 ? 'Moderate' : 'Firm',
      score: stats.comfort,
    },
  ];
}

export interface WarningItem {
  type: 'warning' | 'info' | 'success';
  message: string;
}

export function generateWarnings(
  racquet: Racquet,
  stringConfig: StringConfig,
  stats: SetupAttributes
): WarningItem[] {
  const warnings: WarningItem[] = [];

  // Tension warnings
  const avgTension =
    (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  if (avgTension > racquet.tensionRange[1] + 5) {
    warnings.push({
      type: 'warning',
      message: `Tension (${avgTension} lbs) is above recommended range for ${racquet.name}`,
    });
  } else if (avgTension < racquet.tensionRange[0] - 5) {
    warnings.push({
      type: 'warning',
      message: `Tension (${avgTension} lbs) is below recommended range for ${racquet.name}`,
    });
  }

  // Comfort warning for stiff setups
  if (stats.comfort < 40) {
    warnings.push({
      type: 'warning',
      message: 'Very stiff setup - consider lower tension or softer string',
    });
  }

  // Mismatch warnings
  if (stats.power > 75 && stats.control < 50) {
    warnings.push({
      type: 'info',
      message: 'High power, low control - consider tighter pattern or higher tension',
    });
  }

  return warnings;
}

// ============================================
// ANIMATION HELPERS
// ============================================

export function assignStaggerIndices(container: HTMLElement, selector: string): void {
  const items = container.querySelectorAll(selector);
  items.forEach((item, idx) => {
    (item as HTMLElement).style.animationDelay = `${idx * 50}ms`;
  });
}

export function animateCounter(
  element: HTMLElement,
  start: number,
  end: number,
  duration: number
): void {
  const startTime = performance.now();

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = start + (end - start) * eased;

    element.textContent = current.toFixed(1);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
