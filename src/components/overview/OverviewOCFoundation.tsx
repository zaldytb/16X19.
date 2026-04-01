import type { OverviewOCFoundationViewModel } from '../../ui/pages/overview-oc-foundation-vm.js';

type Props = {
  model: OverviewOCFoundationViewModel;
};

export function OverviewOCFoundation({ model }: Props) {
  const { racquet, strStiff, strTensionLoss, strSpinPot, stats } = model;

  return (
    <>
      <div className="oc-foundation-group">
        <span className="oc-foundation-group-title">[FRAME]</span>
        <span className="oc-foundation-group-values">
          WGHT {racquet.strungWeight}g strung <span className="oc-sep">/</span> SW {racquet.swingweight}{' '}
          <span className="oc-sep">/</span> RA {racquet.stiffness} <span className="oc-sep">/</span> PAT {racquet.pattern}
        </span>
      </div>
      <div className="oc-foundation-group">
        <span className="oc-foundation-group-title">[STRNG]</span>
        <span className="oc-foundation-group-values">
          STIF {strStiff} <span className="oc-sep">/</span> LOSS {strTensionLoss}% <span className="oc-sep">/</span> SPIN{' '}
          {strSpinPot}
        </span>
      </div>
      <div className="oc-foundation-group">
        <span className="oc-foundation-group-title">[MODEL]</span>
        <span className="oc-foundation-group-values">
          POWR {stats.power} <span className="oc-sep">/</span> CTRL {stats.control} <span className="oc-sep">/</span> COMF{' '}
          {stats.comfort}
        </span>
      </div>
    </>
  );
}
