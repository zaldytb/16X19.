/**
 * Single dynamic entry for Chart.js — registers controllers/scales once and exposes the module.
 * Avoids CDN + npm duplication and defers parse cost until first chart use.
 */

let chartModule: typeof import('chart.js') | null = null;

export async function ensureChartLoaded(): Promise<typeof import('chart.js')> {
  if (chartModule) return chartModule;

  const mod = await import('chart.js');
  const {
    Chart,
    CategoryScale,
    Filler,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    RadarController,
    RadialLinearScale,
    Tooltip,
    Title,
  } = mod;

  Chart.register(
    RadarController,
    RadialLinearScale,
    LineController,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    Title,
  );

  if (typeof globalThis !== 'undefined') {
    (globalThis as unknown as { Chart: typeof Chart }).Chart = Chart;
  }

  chartModule = mod;
  return mod;
}
