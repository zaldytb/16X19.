// Dumb presentational component — DOM must match legacy renderOverallBuildScore innerHTML 1:1.

import type { TuneObsBuildScoreViewModel } from '../../ui/pages/tune-obs-build-score-vm.js';

type Props = {
  model: TuneObsBuildScoreViewModel;
};

export function TuneObsBuildScore({ model }: Props) {
  const { scoreText, tierLabel, rankClass, deltaChip, batterySegmentClasses } = model;

  return (
    <>
      <div className="obs-top-row">
        <div className="obs-score-group">
          <span className="obs-score-value">{scoreText}</span>
          {deltaChip ? <span className={deltaChip.className}>{deltaChip.text}</span> : null}
        </div>
        <span className={rankClass}>{tierLabel}</span>
      </div>
      <div className="obs-battery">
        {batterySegmentClasses.map((cls, i) => (
          <div key={i} className={cls} />
        ))}
      </div>
    </>
  );
}
