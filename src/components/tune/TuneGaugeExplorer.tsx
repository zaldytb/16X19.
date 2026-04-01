// Dumb presentational component — DOM must match legacy renderGaugeExplorer innerHTML 1:1.
// Clicks use document delegation via data-tune-action (no React onClick).

import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import type { TuneGaugeExplorerViewModel } from '../../ui/pages/tune-gauge-explorer-vm.js';

type Props = {
  model: Extract<TuneGaugeExplorerViewModel, { kind: 'content' }>;
};

export function TuneGaugeExplorer({ model }: Props) {
  return (
    <>
      {model.sections.map((sec) => (
        <Fragment key={sec.sectionIndex}>
          <div className="gauge-explore-section-label">{sec.sectionLabelText}</div>
          <div
            className="gauge-explore-grid"
            style={{ '--gauge-cols': sec.colCount } as CSSProperties}
          >
            <div className="gauge-explore-header">
              <span className="gauge-explore-stat-label" />
              {sec.columns.map((col) => (
                <button
                  key={col.gauge}
                  className={`gauge-explore-col-header${col.headerClassSuffix}`}
                  data-tune-action="applyGauge"
                  data-gauge={col.gauge}
                  data-section={sec.sectionIndex}
                  title={col.title}
                >
                  <span className="gauge-col-short">{col.shortLabel}</span>
                  <span className="gauge-col-mm">{col.mmLabel}</span>
                  {col.isCurrent ? (
                    <span className="gauge-col-tag">current</span>
                  ) : (
                    <span className="gauge-col-tag gauge-col-apply">apply</span>
                  )}
                </button>
              ))}
            </div>

            {sec.statRows.map((row) => (
              <div key={row.label} className="gauge-explore-row">
                <span className="gauge-explore-stat-label">{row.label}</span>
                {row.cells.map((cell, ci) => (
                  <span key={ci} className={`gauge-explore-cell ${cell.cls}`}>
                    <span className="gauge-cell-val">{cell.val}</span>
                    {cell.diffStr ? <span className="gauge-cell-diff">{cell.diffStr}</span> : null}
                  </span>
                ))}
              </div>
            ))}

            <div className="gauge-explore-row gauge-explore-obs-row">
              <span className="gauge-explore-stat-label gauge-obs-label">OBS</span>
              {sec.obsCells.map((cell, ci) => (
                <span key={ci} className={`gauge-explore-cell gauge-obs-cell ${cell.cls}`}>
                  <span className="gauge-cell-val">{cell.val}</span>
                  {cell.diffStr ? <span className="gauge-cell-diff">{cell.diffStr}</span> : null}
                </span>
              ))}
            </div>
          </div>
        </Fragment>
      ))}
    </>
  );
}
