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

      <div className="fmb-step" data-step="1" id="fmb-step-1">
        <h3 className="fmb-question">How would you describe your swing?</h3>
        <div className="fmb-options" data-key="swing">
          <button type="button" className="fmb-option" data-value="compact">
            <span className="fmb-option-title">Compact &amp; Quick</span>
            <span className="fmb-option-desc">Short take-back, fast hands, values maneuverability</span>
          </button>
          <button type="button" className="fmb-option" data-value="smooth">
            <span className="fmb-option-title">Full &amp; Smooth</span>
            <span className="fmb-option-desc">Medium swing, balanced tempo, all-around strokes</span>
          </button>
          <button type="button" className="fmb-option" data-value="heavy">
            <span className="fmb-option-title">Long &amp; Heavy</span>
            <span className="fmb-option-desc">Big take-back, heavy ball, wants stability and plow-through</span>
          </button>
        </div>
      </div>

      <div className="fmb-step hidden" data-step="2" id="fmb-step-2">
        <h3 className="fmb-question">What does your ball look like?</h3>
        <div className="fmb-options" data-key="ball">
          <button type="button" className="fmb-option" data-value="flat">
            <span className="fmb-option-title">Flat / Drive</span>
            <span className="fmb-option-desc">Low spin, emphasizes control and raw power</span>
          </button>
          <button type="button" className="fmb-option" data-value="moderate">
            <span className="fmb-option-title">Moderate Topspin</span>
            <span className="fmb-option-desc">Balanced spin, all-court versatility</span>
          </button>
          <button type="button" className="fmb-option" data-value="heavy">
            <span className="fmb-option-title">Heavy Topspin</span>
            <span className="fmb-option-desc">High spin, shaped shots, big kick serve</span>
          </button>
        </div>
      </div>

      <div className="fmb-step hidden" data-step="3" id="fmb-step-3">
        <h3 className="fmb-question">What&apos;s your court identity?</h3>
        <div className="fmb-options" data-key="court">
          <button type="button" className="fmb-option" data-value="baseliner">
            <span className="fmb-option-title">Baseliner</span>
            <span className="fmb-option-desc">Stays back, rallies, grinds out consistency</span>
          </button>
          <button type="button" className="fmb-option" data-value="allcourt">
            <span className="fmb-option-title">All-Court</span>
            <span className="fmb-option-desc">Mixes baseline with net play, values variety</span>
          </button>
          <button type="button" className="fmb-option" data-value="firststrike">
            <span className="fmb-option-title">First-Strike</span>
            <span className="fmb-option-desc">Aggressive, takes ball early, ends points fast</span>
          </button>
          <button type="button" className="fmb-option" data-value="touch">
            <span className="fmb-option-title">Touch Player</span>
            <span className="fmb-option-desc">Net play, slice, drop shots - feel is everything</span>
          </button>
        </div>
      </div>

      <div className="fmb-step hidden" data-step="4" id="fmb-step-4">
        <h3 className="fmb-question">
          Main pain points? <span className="fmb-hint">Pick up to 2</span>
        </h3>
        <div className="fmb-options fmb-options-multi" data-key="painPoints" data-max="2">
          <button type="button" className="fmb-option" data-value="arm">
            <span className="fmb-option-title">Arm / Elbow Discomfort</span>
            <span className="fmb-option-desc">Need a comfortable, arm-friendly setup</span>
          </button>
          <button type="button" className="fmb-option" data-value="breaks">
            <span className="fmb-option-title">Strings Break Too Fast</span>
            <span className="fmb-option-desc">Need durability without sacrificing performance</span>
          </button>
          <button type="button" className="fmb-option" data-value="long">
            <span className="fmb-option-title">Ball Flies Long</span>
            <span className="fmb-option-desc">Need more control and a lower launch angle</span>
          </button>
          <button type="button" className="fmb-option" data-value="pace">
            <span className="fmb-option-title">Not Enough Pace</span>
            <span className="fmb-option-desc">Need more free power from the string bed</span>
          </button>
          <button type="button" className="fmb-option" data-value="spin">
            <span className="fmb-option-title">Can&apos;t Generate Spin</span>
            <span className="fmb-option-desc">Need more bite and ball rotation</span>
          </button>
          <button type="button" className="fmb-option" data-value="dead">
            <span className="fmb-option-title">Racquet Feels Dead</span>
            <span className="fmb-option-desc">Need better feel and playability</span>
          </button>
        </div>
      </div>

      <div className="fmb-step hidden" data-step="5" id="fmb-step-5">
        <h3 className="fmb-question">
          Top 3 priorities? <span className="fmb-hint">Select in order of importance</span>
        </h3>
        <div className="fmb-options fmb-options-multi fmb-options-priority" data-key="priorities" data-max="3">
          <button type="button" className="fmb-option" data-value="control">
            <span className="fmb-option-title">Control</span>
            <span className="fmb-option-desc">Placement accuracy, directional precision</span>
          </button>
          <button type="button" className="fmb-option" data-value="spin">
            <span className="fmb-option-title">Spin</span>
            <span className="fmb-option-desc">Ball rotation, kick, and shape</span>
          </button>
          <button type="button" className="fmb-option" data-value="power">
            <span className="fmb-option-title">Power</span>
            <span className="fmb-option-desc">Pace and depth from the string bed</span>
          </button>
          <button type="button" className="fmb-option" data-value="comfort">
            <span className="fmb-option-title">Comfort</span>
            <span className="fmb-option-desc">Arm-friendliness, vibration dampening</span>
          </button>
          <button type="button" className="fmb-option" data-value="feel">
            <span className="fmb-option-title">Feel</span>
            <span className="fmb-option-desc">Touch, feedback, connection to the ball</span>
          </button>
          <button type="button" className="fmb-option" data-value="durability">
            <span className="fmb-option-title">Durability</span>
            <span className="fmb-option-desc">String longevity and tension maintenance</span>
          </button>
          <button type="button" className="fmb-option" data-value="stability">
            <span className="fmb-option-title">Stability</span>
            <span className="fmb-option-desc">Frame stability, plow-through, twist resistance</span>
          </button>
        </div>
      </div>

      <div className="fmb-step hidden" data-step="result" id="fmb-result">
        <div className="fmb-summary" id="fmb-summary"></div>
        <div className="fmb-directions" id="fmb-directions"></div>
      </div>

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
