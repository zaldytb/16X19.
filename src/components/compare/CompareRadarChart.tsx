import { useLayoutEffect } from 'react';
import type { CompareSlot } from '../../ui/pages/compare/types.js';
import {
  destroyRadarChart,
  renderRadarChart,
} from '../../ui/pages/compare/components/RadarChart.js';

type Props = {
  slots: CompareSlot[];
  radarKey: string;
};

export function CompareRadarChart({ slots, radarKey }: Props) {
  useLayoutEffect(() => {
    if (slots.length === 0) {
      destroyRadarChart();
      return;
    }
    renderRadarChart('compare-radar-chart', { slots });
  }, [radarKey, slots.length]);

  useLayoutEffect(() => {
    return () => {
      destroyRadarChart();
    };
  }, []);

  if (slots.length === 0) {
    return (
      <div className="compare-radar-empty">
        <div className="compare-radar-placeholder">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.3">
            <path
              d="M32 4L58 20v24L32 60 6 44V20L32 4z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <p>Add builds to see comparison</p>
        </div>
      </div>
    );
  }

  return (
    <div className="compare-radar-wrapper">
      <canvas id="compare-radar-chart" />
    </div>
  );
}
