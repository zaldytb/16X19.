import type {
  CompareVerdictViewModel,
  VerdictGroupVm,
  VerdictSummaryVm,
} from '../../ui/pages/compare/compare-verdict-vm.js';

type Props = {
  vm: CompareVerdictViewModel;
};

function GroupCard({ group }: { group: VerdictGroupVm }) {
  return (
    <div className="compare-verdict-group">
      <div className="compare-verdict-group-header">
        <span className="compare-verdict-group-label">{group.groupLabel}</span>
        {group.winner ? (
          <span
            className={`compare-verdict-winner-badge slot-${group.winner.toLowerCase()}-accent`}
          >
            {group.winnerLabel} {group.margin > 0 ? `+${group.margin}` : ''}
          </span>
        ) : (
          <span className="compare-verdict-winner-badge tie">Even</span>
        )}
      </div>

      <div className="compare-verdict-stat-rows">
        {group.stats.map((stat) => (
          <div key={stat.key} className="compare-verdict-stat-row">
            <span className="compare-verdict-stat-label">{stat.label}</span>
            <div className="compare-verdict-stat-values">
              {stat.values.map((v) => (
                <span
                  key={v.slotId}
                  className={`compare-verdict-stat-chip${v.isMax ? ' is-max' : ''}`}
                  style={{ borderColor: v.color }}
                >
                  {v.slotId}:{v.value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="compare-verdict-insight">{group.insight}</p>
    </div>
  );
}

function SummaryChip({ summary }: { summary: VerdictSummaryVm }) {
  return (
    <div className="compare-verdict-summary-chip" style={{ borderColor: summary.color }}>
      <div className="compare-verdict-summary-header">
        <span className="compare-verdict-summary-slot" style={{ color: summary.color }}>
          {summary.label}
        </span>
        <span className="compare-verdict-summary-obs">{summary.obs.toFixed(1)} OBS</span>
      </div>
      {summary.identity ? (
        <span className="compare-verdict-summary-identity">{summary.identity}</span>
      ) : null}
      {summary.groupsWon.length > 0 ? (
        <div className="compare-verdict-summary-wins">
          {summary.groupsWon.map((g) => (
            <span key={g} className="compare-verdict-summary-win-tag">
              {g}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CompareVerdict({ vm }: Props) {
  if (vm.kind === 'empty') return null;

  return (
    <div className="compare-verdict-section">
      <div className="compare-verdict-container">
        <div className="compare-verdict-title-row">
          <span className="compare-verdict-title">// VERDICT</span>
        </div>

        {vm.summaries && vm.summaries.length > 0 ? (
          <div className="compare-verdict-summaries">
            {vm.summaries.map((s) => (
              <SummaryChip key={s.slotId} summary={s} />
            ))}
          </div>
        ) : null}

        {vm.overallVerdict ? (
          <p className="compare-verdict-overall">{vm.overallVerdict}</p>
        ) : null}

        {vm.groups ? (
          <div className="compare-verdict-groups">
            {vm.groups.map((g) => (
              <GroupCard key={g.groupLabel} group={g} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
