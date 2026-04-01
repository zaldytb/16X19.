// Dumb presentational component — DOM must match legacy renderBestValueMove innerHTML 1:1.

import type { TuneBestValueViewModel } from '../../ui/pages/tune-best-value-vm.js';

type Props = {
  model: TuneBestValueViewModel;
};

export function TuneBestValueCallout({ model }: Props) {
  if (model.status === 'empty') {
    return null;
  }

  if (model.status === 'in-zone') {
    return (
      <div className="best-value-callout best-value-ok">
        <span className="best-value-icon">●</span>
        <span>{`You're in the optimal zone (${model.low}\u2013${model.high} lbs). No adjustment needed.`}</span>
      </div>
    );
  }

  const { arrowSvg, directionWord, diffAbs, anchor } = model;
  return (
    <div className="best-value-callout best-value-move">
      <span className="best-value-icon" dangerouslySetInnerHTML={{ __html: arrowSvg }} />
      <span>
        <strong>Best Value Move:</strong> {directionWord} {diffAbs} lbs to {anchor} lbs for peak balanced performance.
      </span>
    </div>
  );
}
