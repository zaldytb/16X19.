// Parity with renderRecommendedBuilds innerHTML in tune.ts

import type {
  TuneRecItemViewModel,
  TuneRecsViewModel,
} from '../../ui/pages/tune-recommended-builds-vm.js';

type Props = {
  model: TuneRecsViewModel;
  onApply: (item: {
    racquetId: string;
    stringId: string;
    tension: number;
    type: string;
    mainsId?: string;
    crossesId?: string;
  }) => void;
  onSave: (item: {
    racquetId: string;
    stringId: string;
    tension: number;
    type: string;
    mainsId?: string;
    crossesId?: string;
  }) => void;
};

function RecItem({
  item,
  onApply,
  onSave,
}: {
  item: TuneRecItemViewModel;
  onApply: Props['onApply'];
  onSave: Props['onSave'];
}) {
  return (
    <div className={`recs-item${item.isCurrent ? ' recs-item-current' : ''}`}>
      <div className="recs-rank">{item.rank}</div>
      <div className="recs-info">
        <div className="recs-name">
          {item.label}{' '}
          {item.gauge ? <span className="recs-gauge">{item.gauge}</span> : null}
        </div>
        <div className="recs-meta">
          <span className="recs-tension-rec">{item.tensionLabel}</span>
          {item.isCurrent ? <span className="recs-badge-current">CURRENT</span> : null}
        </div>
      </div>
      <div className="recs-composite">
        <span className="recs-composite-value">{item.scoreText}</span>
        <span className={`recs-composite-delta ${item.deltaCls}`}>{item.showYou ? 'YOU' : item.deltaStr}</span>
      </div>
      <div className="recs-action-row">
        <button
          className="recs-apply-btn"
          onClick={() =>
            onApply({
              racquetId: item.racquetId,
              stringId: item.stringId,
              tension: item.tension,
              type: item.type,
              mainsId: item.mainsId,
              crossesId: item.crossesId,
            })
          }
        >
          Apply
        </button>
        <button
          className="recs-save-btn"
          onClick={() =>
            onSave({
              racquetId: item.racquetId,
              stringId: item.stringId,
              tension: item.tension,
              type: item.type,
              mainsId: item.mainsId,
              crossesId: item.crossesId,
            })
          }
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function TuneRecommendedBuilds({ model, onApply, onSave }: Props) {
  return (
    <>
      <div className="recs-split">
        <div className="recs-panel">
          <div className="recs-panel-header">
            <span className="recs-panel-title">FULL BED</span>
            <span className="recs-panel-sub">Single string, both directions</span>
          </div>
          <div className="recs-list">
            {model.fullBed.map((it) => (
              <RecItem key={`f-${it.rank}-${it.label}`} item={it} onApply={onApply} onSave={onSave} />
            ))}
          </div>
        </div>
        <div className="recs-panel">
          <div className="recs-panel-header">
            <span className="recs-panel-title">HYBRID</span>
            <span className="recs-panel-sub">Mains / Crosses pairing</span>
          </div>
          <div className="recs-list">
            {model.hybrid.map((it) => (
              <RecItem key={`h-${it.rank}-${it.label}`} item={it} onApply={onApply} onSave={onSave} />
            ))}
          </div>
        </div>
      </div>
      <p className="recs-footnote">
        Composite score across all 11 stats at optimal tension for <strong>{model.footnoteRacquetName}</strong>.
        Delta is vs your current build.
      </p>
    </>
  );
}
