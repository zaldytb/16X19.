import { useEffect, useRef } from 'react';
import {
  createOverviewRadarChart,
  patchOverviewRadarChartData,
  patchOverviewRadarChartTheme,
  type OverviewRadarChartHandle,
} from '../../ui/pages/overview-radar-chart.js';

type Props = {
  statsData: number[];
  statsDataKey: string;
  chartTheme: 'dark' | 'light';
  onChartReady: (chart: OverviewRadarChartHandle | null) => void;
};

function getGlobalChart(): {
  getChart?: (key: HTMLCanvasElement) => OverviewRadarChartHandle | undefined;
} | undefined {
  return (globalThis as unknown as { Chart?: { getChart?: (key: HTMLCanvasElement) => OverviewRadarChartHandle | undefined } })
    .Chart;
}

export function OverviewRadarChart({ statsData, statsDataKey, chartTheme, onChartReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<OverviewRadarChartHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chartApi = getGlobalChart();
    const existing = chartInstanceRef.current || chartApi?.getChart?.(canvas) || null;

    if (existing) {
      chartInstanceRef.current = existing;
      patchOverviewRadarChartData(existing, statsData);
      patchOverviewRadarChartTheme(existing, chartTheme);
      existing.update('active');
      onChartReady(existing);
      return;
    }

    const chart = createOverviewRadarChart(ctx, statsData, chartTheme);
    chartInstanceRef.current = chart;
    onChartReady(chart);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- statsData aligns with statsDataKey; omitting statsData avoids reruns on fresh array identity
  }, [statsDataKey, chartTheme, onChartReady]);

  useEffect(() => {
    return () => {
      const c = chartInstanceRef.current;
      if (c) {
        c.destroy?.();
        chartInstanceRef.current = null;
      }
      onChartReady(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount-only; onChartReady is stable from overview.ts
  }, []);

  return <canvas ref={canvasRef} id="radar-chart" />;
}
