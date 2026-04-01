import {
  FmbStepBall,
  FmbStepCourt,
  FmbStepPainPoints,
  FmbStepPriorities,
  FmbStepResult,
  FmbStepSwing,
} from './FmbWizardSteps.js';

type Props = {
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
};

export function FmbWizardBody({ onClose, onBack, onNext }: Props) {
  return (
    <div id="find-my-build" className="fmb-wizard hidden">
      <div className="fmb-progress">
        <div className="fmb-progress-fill" id="fmb-progress-fill" style={{ width: '20%' }}></div>
      </div>

      <div className="fmb-header">
        <button type="button" className="fmb-close" id="fmb-close" onClick={onClose} title="Close">
          &times;
        </button>
      </div>

      <FmbStepSwing />
      <FmbStepBall />
      <FmbStepCourt />
      <FmbStepPainPoints />
      <FmbStepPriorities />
      <FmbStepResult />

      <div className="fmb-nav">
        <button type="button" className="fmb-back" id="fmb-back" onClick={onBack}>
          Back
        </button>
        <button type="button" className="fmb-next" id="fmb-next" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
