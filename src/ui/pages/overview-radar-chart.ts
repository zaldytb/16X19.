/**
 * Chart.js radar chart for Overview — global Chart from index.html CDN.
 */

import { STAT_KEYS, STAT_LABELS_FULL } from '../../engine/constants.js';
import type { SetupAttributes } from '../../engine/types.js';

export type OverviewRadarChartHandle = {
  canvas?: HTMLCanvasElement;
  data: {
    datasets: Array<{
      data: number[];
      borderColor: string;
      backgroundColor: string;
      pointBackgroundColor: string;
      pointBorderColor: string;
    }>;
    labels: string[];
  };
  options: {
    scales: {
      r: {
        grid: { color: string };
        angleLines: { color: string };
        pointLabels: { color: string };
      };
    };
  };
  update: (mode: string) => void;
  destroy?: () => void;
};

declare const Chart: new (
  ctx: CanvasRenderingContext2D,
  config: Record<string, unknown>
) => OverviewRadarChartHandle;

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
  tooltipEl.style.left = position.left + window.scrollX + tooltip.caretX + 15 + 'px';
  tooltipEl.style.top = position.top + window.scrollY + tooltip.caretY - 10 + 'px';
}

export function statsToRadarData(stats: SetupAttributes): number[] {
  return STAT_KEYS.map((k) => stats[k as keyof SetupAttributes] as number);
}

export function createOverviewRadarChart(
  ctx: CanvasRenderingContext2D,
  statsData: number[],
  chartTheme: 'dark' | 'light'
): OverviewRadarChartHandle {
  const isDark = chartTheme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const angleColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const labelColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.44)';
  const accentColor = '#AF0000';
  const fillColor = 'rgba(175, 0, 0, 0.06)';

  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: STAT_LABELS_FULL,
      datasets: [
        {
          data: statsData,
          backgroundColor: fillColor,
          borderColor: accentColor,
          borderWidth: 2,
          pointBackgroundColor: accentColor,
          pointBorderColor: 'transparent',
          pointRadius: 3,
          pointHoverRadius: 6,
          hitRadius: 30,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: { padding: 0 },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: radarTooltipHandler,
        },
      },
      elements: {
        point: { hitRadius: 30, hoverRadius: 6 },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false, stepSize: 20 },
          grid: { color: gridColor, circular: true, lineWidth: 1 },
          angleLines: { color: angleColor, lineWidth: 1 },
          pointLabels: { display: false, color: labelColor },
        },
      },
      animation: { duration: 800, easing: 'easeOutQuart' },
    },
  });
}

export function patchOverviewRadarChartData(
  chart: OverviewRadarChartHandle,
  statsData: number[]
): void {
  chart.data.datasets[0].data = statsData;
}

export function patchOverviewRadarChartTheme(
  chart: OverviewRadarChartHandle,
  chartTheme: 'dark' | 'light'
): void {
  const isDark = chartTheme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const angleColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const labelColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.44)';
  const accentColor = '#AF0000';
  const fillColor = 'rgba(175, 0, 0, 0.06)';

  const ds = chart.data.datasets[0];
  ds.borderColor = accentColor;
  ds.backgroundColor = fillColor;
  ds.pointBackgroundColor = accentColor;
  ds.pointBorderColor = 'transparent';
  chart.options.scales.r.grid.color = gridColor;
  chart.options.scales.r.angleLines.color = angleColor;
  chart.options.scales.r.pointLabels.color = labelColor;
}
