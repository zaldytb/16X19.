/**
 * Chart.js tension sweep chart for Tune — extracted from tune.ts (global Chart from index.html CDN).
 */

import type { SetupAttributes } from '../../engine/types.js';

type ChartInstance = {
  destroy: () => void;
  data?: { labels?: number[]; datasets?: Array<Record<string, unknown>> };
  options?: Record<string, unknown>;
  update?: (mode?: string) => void;
};

declare const Chart: new (
  ctx: CanvasRenderingContext2D,
  config: Record<string, unknown>
) => ChartInstance;

export type SweepDataRow = { tension: number; stats: SetupAttributes };

export function createTuneSweepChart(
  ctx: CanvasRenderingContext2D,
  data: SweepDataRow[],
  getTensions: () => { baselineTension: number; exploredTension: number }
): ChartInstance {
  const tensions = data.map((d) => d.tension);
  const isDark = document.documentElement.dataset.theme === 'dark';

  const curveColors = {
    control: { border: '#AF0000', fill: 'rgba(175, 0, 0, 0.06)' },
    spin: { border: '#CCFF00', fill: 'rgba(204, 255, 0, 0.04)' },
    power: { border: '#C8A87C', fill: 'rgba(200, 168, 124, 0.05)' },
    comfort: { border: '#A78BFA', fill: 'rgba(167, 139, 250, 0.05)' },
  };

  const datasets = [
    {
      label: 'Control',
      data: data.map((d) => d.stats.control),
      borderColor: curveColors.control.border,
      backgroundColor: curveColors.control.fill,
      fill: true,
      tension: 0.3,
      borderWidth: 2.5,
      borderDash: [],
      pointRadius: 0,
      pointHoverRadius: 0,
      pointHitRadius: 8,
    },
    {
      label: 'Spin',
      data: data.map((d) => d.stats.spin),
      borderColor: curveColors.spin.border,
      backgroundColor: curveColors.spin.fill,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      borderDash: [],
      pointRadius: 0,
      pointHoverRadius: 0,
      pointHitRadius: 8,
    },
    {
      label: 'Power',
      data: data.map((d) => d.stats.power),
      borderColor: curveColors.power.border,
      backgroundColor: curveColors.power.fill,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      borderDash: [],
      pointRadius: 0,
      pointHoverRadius: 0,
      pointHitRadius: 8,
    },
    {
      label: 'Comfort',
      data: data.map((d) => d.stats.comfort),
      borderColor: curveColors.comfort.border,
      backgroundColor: curveColors.comfort.fill,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      borderDash: [],
      pointRadius: 0,
      pointHoverRadius: 0,
      pointHitRadius: 8,
    },
  ];

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.30)';
  const legendColor = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.48)';

  const baselinePlugin = {
    id: 'tuneAnnotations',
    afterDraw(chart: {
      ctx: CanvasRenderingContext2D;
      chartArea: { left: number; right: number; top: number; bottom: number };
      scales: { x: { getPixelForValue: (v: number) => number } };
    }) {
      const { ctx: c, chartArea, scales } = chart;
      const xScale = scales.x;
      const { baselineTension, exploredTension } = getTensions();

      const bx = xScale.getPixelForValue(baselineTension);
      if (bx >= chartArea.left && bx <= chartArea.right) {
        c.save();
        c.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.20)';
        c.lineWidth = 1;
        c.setLineDash([4, 4]);
        c.beginPath();
        c.moveTo(bx, chartArea.top);
        c.lineTo(bx, chartArea.bottom);
        c.stroke();
        c.setLineDash([]);
        c.fillStyle = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.40)';
        c.font = "500 10px 'Inter', sans-serif";
        c.textAlign = 'center';
        c.fillText('BASELINE', bx, chartArea.top - 6);
        c.restore();
      }

      if (exploredTension !== baselineTension) {
        const ex = xScale.getPixelForValue(exploredTension);
        if (ex >= chartArea.left && ex <= chartArea.right) {
          c.save();
          c.strokeStyle = isDark ? 'rgba(220, 223, 226, 0.8)' : 'rgba(26, 26, 26, 0.7)';
          c.lineWidth = 1.5;
          c.setLineDash([]);
          c.beginPath();
          c.moveTo(ex, chartArea.top);
          c.lineTo(ex, chartArea.bottom);
          c.stroke();
          c.fillStyle = isDark ? 'rgba(220, 223, 226, 0.8)' : 'rgba(26, 26, 26, 0.7)';
          c.font = "600 10px 'Inter', sans-serif";
          c.textAlign = 'center';
          c.fillText('EXPLORED', ex, chartArea.top - 6);
          c.restore();
        }
      }
    },
  };

  const nextData = { labels: tensions, datasets };
  const nextOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: legendColor,
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 10, family: "'JetBrains Mono', monospace" },
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)',
        titleColor: isDark ? '#fff' : '#1a1a1a',
        bodyColor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: (item: { dataset: { label: string }; raw: number }) => `  ${item.dataset.label}: ${item.raw}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Tension (lbs)',
          font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
          color: tickColor,
        },
        grid: { color: gridColor, lineWidth: 0.5 },
        ticks: {
          font: { family: "'JetBrains Mono', monospace", size: 10 },
          color: tickColor,
          stepSize: 2,
        },
      },
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Rating',
          font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
          color: tickColor,
        },
        grid: { color: gridColor, lineWidth: 0.5 },
        ticks: {
          font: { family: "'JetBrains Mono', monospace", size: 10 },
          color: tickColor,
          stepSize: 25,
        },
      },
    },
    animation: { duration: 400, easing: 'easeOutQuart' },
  };

  return new Chart(ctx, {
    type: 'line',
    data: nextData,
    options: nextOptions,
    plugins: [baselinePlugin],
  });
}
