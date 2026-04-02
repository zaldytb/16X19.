// Dumb presentational — parity with former WTTN innerHTML from recommendations.ts

import type { WttnViewModel } from '../../ui/shared/recommendations.js';

type Props = {
  model: WttnViewModel;
  onApply: (build: {
    stringId: string;
    tension: number;
    pickType: string;
    mainsId?: string;
    crossesId?: string;
  }) => void;
  onSave: (build: {
    frameId: string;
    stringId: string;
    tension: number;
    pickType: string;
    mainsId?: string;
    crossesId?: string;
  }) => void;
};

export function TuneWttn({ model, onApply, onSave }: Props) {
  if (model.kind === 'empty') {
    return <p className="wttn-empty">{model.message}</p>;
  }

  return (
    <>
      {model.buckets.map((b) => (
        <div key={b.bucketKey} className="wttn-card" data-bucket={b.bucketKey}>
          <div className="wttn-bucket-header">
            <div className="wttn-bucket-icon" dangerouslySetInnerHTML={{ __html: b.iconSvg }} />
            <span className="wttn-bucket-label">{b.title}</span>
          </div>
          <div>
            <div className="wttn-build-name">
              {b.buildName}{' '}
              {b.gaugeSpan ? <span className="wttn-gauge">{b.gaugeSpan.text}</span> : null}
            </div>
            <div className="wttn-build-meta">
              {b.isHybrid ? (
                <span className="recs-type-badge recs-type-hybrid">HYBRID</span>
              ) : (
                <span className="recs-type-badge recs-type-full">FULL BED</span>
              )}
              <span className="wttn-build-tension">{b.tensionLabel}</span>
            </div>
          </div>
          <p className="wttn-why">{b.why}</p>
          <div className="wttn-deltas">
            {b.displayGains.length > 0 ? (
              <div className="wttn-delta-row">
                <span className="wttn-delta-label">Gain</span>
                <div className="wttn-delta-chips">
                  {b.displayGains.map((g, i) => (
                    <span key={i} className="wttn-chip wttn-chip-gain">
                      {g.attrLabel} +{g.delta}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {b.displayLosses.length > 0 ? (
              <div className="wttn-delta-row">
                <span className="wttn-delta-label">Give Up</span>
                <div className="wttn-delta-chips">
                  {b.displayLosses.map((l, i) => (
                    <span key={i} className="wttn-chip wttn-chip-loss">
                      {l.attrLabel} {l.delta}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="wttn-net">
            <span className="wttn-net-label">Net</span>
            <span className="wttn-net-phrase">{b.netDir}</span>
          </div>
          <div className="wttn-action-row">
            <button
              className="wttn-apply-btn"
              onClick={() =>
                onApply({
                  stringId: b.stringId,
                  tension: b.tension,
                  pickType: b.pickType,
                  mainsId: b.mainsId,
                  crossesId: b.crossesId,
                })
              }
            >
              Apply
            </button>
            <button
              className="wttn-save-btn"
              onClick={() =>
                onSave({
                  frameId: model.racquetId,
                  stringId: b.stringId,
                  tension: b.tension,
                  pickType: b.pickType,
                  mainsId: b.mainsId,
                  crossesId: b.crossesId,
                })
              }
            >
              Save
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
