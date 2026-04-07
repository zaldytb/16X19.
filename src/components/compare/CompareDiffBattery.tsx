import type { CSSProperties } from 'react';
import type { CompareDiffBatteryViewModel } from '../../ui/pages/compare/compare-diff-battery-vm.js';
import type { SlotId } from '../../ui/pages/compare/types.js';

type Props = {
  vm: CompareDiffBatteryViewModel;
  onToggleShowAll: () => void;
};

function WinnerBadge({
  winner,
  slotBorder,
}: {
  winner: SlotId | null;
  slotBorder: string | undefined;
}) {
  if (!winner) {
    return <span className="diff-winner-badge diff-winner-tie">—</span>;
  }
  return (
    <span className="diff-winner-badge" style={{ color: slotBorder || 'var(--dc-platinum)' }}>
      {winner}{' '}
      <span className="diff-winner-dot" style={{ background: slotBorder }} />
    </span>
  );
}

export function CompareDiffBattery({ vm, onToggleShowAll }: Props) {
  if (vm.kind === 'empty') {
    return <div className="diff-empty">{vm.emptyMessage}</div>;
  }

  const { rows, showMoreButton, sortedDiffCount } = vm;

  return (
    <div className="diff-battery-container">
      <div className="diff-header">
        <span className="diff-header-label">// STAT COMPARISON</span>
        <span className="diff-header-baseline">Baseline: Slot A</span>
      </div>
      <div className="diff-rows">
        {rows?.map((row) => (
          <div className="diff-row" key={row.stat} data-stat={row.stat}>
            <div className="diff-label">{row.label}</div>
            <div className="diff-battery-wrap">
              <div className="diff-battery-stack">
                {row.layers.map((layer) => (
                  <div
                    key={layer.slotId}
                    className={`diff-battery-row slot-${layer.slotId.toLowerCase()}`}
                  >
                    <span className="diff-slot-label">{layer.slotId}</span>
                    <span className="stat-bar-track diff-bar-track">
                      {layer.segmentStates.map((isFilled, segIndex) => (
                        <span
                          key={segIndex}
                          className={`stat-bar-segment diff-bar-segment ${isFilled ? 'is-filled' : 'empty'} slot-${layer.slotId.toLowerCase()}`}
                          style={
                            isFilled
                              ? ({ '--segment-color': layer.borderColor } as CSSProperties)
                              : undefined
                          }
                        />
                      ))}
                    </span>
                    <span className="diff-bar-value">{Math.round(layer.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="diff-value">{row.diffPercentDisplay}</div>
            <div className="diff-winner">
              <WinnerBadge
                winner={row.winner}
                slotBorder={
                  row.winner
                    ? row.valueChips.find((c) => c.slotId === row.winner)?.color
                    : undefined
                }
              />
            </div>
          </div>
        ))}
      </div>
      {showMoreButton && sortedDiffCount != null ? (
        <button type="button" className="diff-show-more" onClick={onToggleShowAll}>
          Show all {sortedDiffCount} stats <span className="diff-show-more-icon">↓</span>
        </button>
      ) : null}
    </div>
  );
}
