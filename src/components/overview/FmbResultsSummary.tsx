import type { FmbProfileSummaryVm } from '../../ui/pages/find-my-build-vm.js';

type Props = {
  model: FmbProfileSummaryVm;
};

export function FmbResultsSummary({ model }: Props) {
  return (
    <div className="fmb-profile-card">
      <div className="fmb-profile-label">YOUR PROFILE</div>
      <h3 className="fmb-profile-identity">{model.identity}</h3>
      <div className="fmb-profile-priorities">
        <span className="fmb-prio-label">Optimizing for:</span>
        {model.priorityLabels.map((priority, index) => (
          <span key={`${priority}-${index}`} className="fmb-prio-tag">{index + 1}. {priority}</span>
        ))}
      </div>
      {model.thresholdTags.length ? (
        <div className="fmb-profile-thresholds">
          {model.thresholdTags.map((threshold) => (
            <span key={threshold} className="fmb-thresh-tag">{threshold}</span>
          ))}
        </div>
      ) : null}
      {model.notes.length ? (
        <div className="fmb-profile-notes">
          {model.notes.map((note) => (
            <div key={note} className="fmb-note">{note}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
