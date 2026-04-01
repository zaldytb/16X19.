// Dumb presentational component — DOM must match legacy renderOptimalBuildWindow innerHTML 1:1.

import type { OptimalBuildWindowViewModel } from '../../ui/pages/tune-optimal-build-window-vm.js';

type Props = {
  model: Extract<OptimalBuildWindowViewModel, { status: 'no-data' | 'ok' }>;
};

export function OptimalBuildWindow({ model }: Props) {
  if (model.status === 'no-data') {
    return <p className="tune-muted">No data</p>;
  }

  const { scaleMin, scaleMax, fillLeft, fillWidth, anchorPct, anchor, reason, anchorStats } = model;

  return (
    <>
      <div className="optimal-range">
        <div className="optimal-range-visual">
          <span className="optimal-range-low">{scaleMin}</span>
          <div className="optimal-range-bar">
            <div className="optimal-range-fill" style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }} />
            <div className="optimal-range-anchor" style={{ left: `${anchorPct}%` }}>
              <span className="optimal-anchor-label">{anchor} lbs</span>
            </div>
          </div>
          <span className="optimal-range-high">{scaleMax}</span>
        </div>
        <p className="optimal-reason">{reason}</p>
      </div>
      <div className="optimal-stats-grid">
        <div className="optimal-stat">
          <span className="optimal-stat-label">Control</span>
          <span className={`optimal-stat-value${anchorStats.control > 70 ? ' high' : ''}`}>{anchorStats.control}</span>
        </div>
        <div className="optimal-stat-divider" />
        <div className="optimal-stat">
          <span className="optimal-stat-label">Comfort</span>
          <span className={`optimal-stat-value${anchorStats.comfort > 70 ? ' high' : ''}`}>{anchorStats.comfort}</span>
        </div>
        <div className="optimal-stat-divider" />
        <div className="optimal-stat">
          <span className="optimal-stat-label">Spin</span>
          <span className={`optimal-stat-value${anchorStats.spin > 70 ? ' high' : ''}`}>{anchorStats.spin}</span>
        </div>
        <div className="optimal-stat-divider" />
        <div className="optimal-stat">
          <span className="optimal-stat-label">Power</span>
          <span className={`optimal-stat-value${anchorStats.power > 70 ? ' high' : ''}`}>{anchorStats.power}</span>
        </div>
      </div>
    </>
  );
}
