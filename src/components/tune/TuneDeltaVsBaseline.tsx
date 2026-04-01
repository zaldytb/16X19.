// Dumb presentational component — DOM must match legacy renderDeltaVsBaseline innerHTML 1:1.

import type { TuneDeltaVsBaselineViewModel } from '../../ui/pages/tune-delta-vs-baseline-vm.js';

type Props = {
  model: TuneDeltaVsBaselineViewModel;
};

export function TuneDeltaVsBaseline({ model }: Props) {
  const { baseLabel, exploreLabel, rows } = model;

  return (
    <>
      <div className="delta-header-row">
        <span className="delta-baseline-label">{baseLabel}</span>
        <span className="delta-explored-label" id="delta-explored-label">
          {exploreLabel}
        </span>
      </div>
      <div className="delta-stats-grid">
        {rows.map((row) => (
          <div key={row.statKey} className="delta-stat-row" data-stat={row.statKey}>
            <span className="delta-stat-label">{row.label}</span>
            <div
              className="stat-bar-track"
              id={row.trackId}
              data-baseline={row.dataBaseline}
              data-explored={row.dataExplored}
            >
              {row.segmentClasses.map((cls, i) => (
                <div key={i} className={cls} />
              ))}
            </div>
            <span className={`delta-stat-diff ${row.diffCls}`} id={row.diffId}>
              {row.diffText}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
