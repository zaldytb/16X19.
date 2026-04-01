// Dumb presentational component — slider-optimal-zone, slider-baseline-marker, tune-original-marker.

import type { TuneSliderAdornmentsViewModel } from '../../ui/pages/tune-slider-adornments-vm.js';

type Props = {
  model: TuneSliderAdornmentsViewModel;
};

export function TuneSliderAdornments({ model }: Props) {
  const oz = model.optimalZone;

  return (
    <>
      <div
        className="slider-optimal-zone"
        id="slider-optimal-zone"
        style={
          oz
            ? { left: `${oz.leftPct}%`, width: `${oz.widthPct}%` }
            : { left: '0%', width: '0%' }
        }
      />
      <div
        className="slider-baseline-marker"
        id="slider-baseline-marker"
        style={{ left: `${model.baselineLeftPct}%` }}
      />
      {model.original ? (
        <div
          className="tune-original-marker"
          style={{ left: model.original.left }}
          title={`Original: ${model.original.tension} lbs`}
        >
          <span className="tune-original-label">Start: {model.original.tension}</span>
        </div>
      ) : null}
    </>
  );
}
