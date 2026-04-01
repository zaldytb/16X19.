/**
 * Chart.js sweep chart for Tune — owns canvas + Chart lifecycle (create/destroy on data/theme change).
 * Live baseline/explored annotation lines use getTensions() via ref so slider updates need only chart.update('none') from tune.ts.
 */

import { useEffect, useRef } from 'react';
import { createTuneSweepChart } from '../../ui/pages/tune-sweep-chart.js';
import type { SweepDataRow } from '../../ui/pages/tune-sweep-chart.js';

export type TuneSweepChartHandle = {
  destroy: () => void;
  update?: (mode?: string) => void;
};

type Props = {
  sweepData: SweepDataRow[];
  getTensions: () => { baselineTension: number; exploredTension: number };
  chartTheme: 'dark' | 'light';
  onChartReady: (chart: TuneSweepChartHandle | null) => void;
};

export function TuneSweepChart({ sweepData, getTensions, chartTheme, onChartReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getTensionsRef = useRef(getTensions);
  getTensionsRef.current = getTensions;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sweepData.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chart = createTuneSweepChart(ctx, sweepData, () => getTensionsRef.current());
    onChartReady(chart);

    return () => {
      chart.destroy();
      onChartReady(null);
    };
  }, [sweepData, chartTheme, onChartReady]);

  return <canvas ref={canvasRef} id="sweep-chart" />;
}
