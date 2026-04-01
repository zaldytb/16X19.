import { SEGMENT_COUNT } from '../../ui/pages/overview-stat-bars-vm.js';
import type { OverviewStatBarsViewModel } from '../../ui/pages/overview-stat-bars-vm.js';

type Props = {
  model: OverviewStatBarsViewModel;
};

export function OverviewStatBars({ model }: Props) {
  return (
    <>
      {model.groups.map((group) => (
        <div key={group.label} className="stat-group">
          <div className="stat-group-label">{group.label}</div>
          {group.rows.map((row) => (
            <div key={row.statKey} className="stat-row" data-stat-key={row.statKey}>
              <div className="stat-row-header">
                <span className="stat-label">{row.label}</span>
                <span className="stat-value">{row.value}</span>
              </div>
              <div className="stat-bar-track" data-value={String(row.value)}>
                {Array.from({ length: SEGMENT_COUNT }, (_, index) => {
                  const filled = index < row.filledCount;
                  const segClass = filled
                    ? row.isHigh
                      ? 'stat-bar-segment high active'
                      : 'stat-bar-segment filled active'
                    : 'stat-bar-segment empty';
                  return <div key={index} className={segClass} data-seg={index} />;
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
