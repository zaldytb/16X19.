/**
 * Radar Chart Component
 * Ballistic-style multi-layer radar for compare page
 */

import { ensureChartLoaded } from '../../../../chart/ensure-chart-loaded.js';
import { STAT_KEYS, STAT_LABELS } from '../../../../engine/constants.js';
import type { SetupStats } from '../../../../engine/types.js';
import type { CompareSlot } from '../types.js';

let _chart: import('chart.js').Chart<'radar'> | null = null;

export interface RadarChartProps {
  slots: CompareSlot[];
}

const OUTER_LABELS = [...STAT_LABELS];

function createDatasets(slots: CompareSlot[]) {
  const pointStyles = ['circle', 'rectRot', 'triangle'];
  const statKeys = STAT_KEYS as Array<keyof SetupStats>;

  return slots.map((slot, index) => {
    const color = slot.color;
    const data = statKeys.map((key) => Number(slot.stats[key]));

    return {
      label: `Slot ${color.label}`,
      data,
      backgroundColor: color.bgFaint,
      borderColor: color.border,
      borderWidth: color.isPrimary ? 2.5 : 2,
      borderDash: color.borderDash,
      pointBackgroundColor: color.border,
      pointBorderColor: 'transparent',
      pointStyle: pointStyles[index] || 'circle',
      pointRadius: color.isPrimary ? 4 : 3,
      pointHoverRadius: color.isPrimary ? 7 : 5,
      hitRadius: 30,
    };
  });
}

export async function renderRadarChart(containerId: string, props: RadarChartProps): Promise<void> {
  const { Chart } = await ensureChartLoaded();
  const canvas = document.getElementById(containerId) as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { slots } = props;

  if (slots.length === 0) {
    if (_chart) {
      _chart.destroy();
      _chart = null;
    }
    return;
  }

  const datasets = createDatasets(slots);

  const isDark = document.documentElement.dataset.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const angleColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const pointLabelColor = isDark ? 'rgba(220, 223, 226, 0.82)' : 'rgba(26, 26, 26, 0.72)';

  const chartCanvas = _chart?.canvas as HTMLCanvasElement | undefined;
  if (_chart && chartCanvas && chartCanvas !== canvas) {
    _chart.destroy();
    _chart = null;
  }

  // Update existing chart if slot count matches
  if (_chart && _chart.data.datasets.length === datasets.length) {
    _chart.data.datasets = datasets as typeof _chart.data.datasets;
    const rScale = _chart.options.scales?.r as
      | { grid?: { color?: string }; angleLines?: { color?: string }; pointLabels?: { color?: string } }
      | undefined;
    if (rScale?.grid) rScale.grid.color = gridColor;
    if (rScale?.angleLines) rScale.angleLines.color = angleColor;
    if (rScale?.pointLabels) rScale.pointLabels.color = pointLabelColor;
    _chart.update('active');
    return;
  }

  // Destroy and recreate if slot count changed
  if (_chart) {
    _chart.destroy();
  }

  _chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: OUTER_LABELS,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: { padding: 34 },
      plugins: {
        legend: {
          display: false, // Custom legend in UI
        },
        tooltip: {
          enabled: true,
          backgroundColor: isDark ? 'rgba(14, 14, 14, 0.96)' : 'rgba(245, 246, 247, 0.96)',
          titleColor: isDark ? '#FF4500' : '#AF0000',
          bodyColor: isDark ? '#F0F2F4' : '#1A1A1A',
          borderColor: isDark ? 'rgba(255, 69, 0, 0.22)' : 'rgba(175, 0, 0, 0.18)',
          borderWidth: 1,
          padding: 14,
          cornerRadius: 2,
          displayColors: false,
          titleFont: {
            family: 'JetBrains Mono, monospace',
            size: 10,
            weight: 600,
          },
          bodyFont: {
            family: 'JetBrains Mono, monospace',
            size: 11,
            weight: 500,
          },
          caretSize: 0,
          boxPadding: 0,
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (context) => {
              const value = context.raw as number;
              const datasetLabel = String(context.dataset.label ?? '');
              return `${datasetLabel}  ${Math.round(value)}`;
            },
          },
        },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false, stepSize: 20 },
          grid: {
            color: gridColor,
            circular: true,
            lineWidth: 1.1,
          },
          angleLines: {
            color: angleColor,
            lineWidth: 1,
          },
          pointLabels: {
            display: true,
            color: pointLabelColor,
            centerPointLabels: false,
            padding: 18,
            font: {
              family: 'JetBrains Mono, monospace',
              size: 9,
              weight: 600,
            },
          },
        },
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
      },
    },
  });
}

export function updateRadarChart(slots: CompareSlot[]): void {
  if (!_chart) return;

  const datasets = createDatasets(slots);
  _chart.data.datasets = datasets;
  _chart.update('active');
}

export function destroyRadarChart(): void {
  if (_chart) {
    _chart.destroy();
    _chart = null;
  }
}

export function exportRadarChart(): string {
  const canvas = document.getElementById('compare-radar-chart') as HTMLCanvasElement | null;
  if (!canvas) return '';
  return canvas.toDataURL('image/png');
}
