// Parity with renderExplorePrompt innerHTML in recommendations.ts

import type { ExplorePromptViewModel } from '../../ui/pages/tune-explore-prompt-vm.js';

type Props = {
  model: ExplorePromptViewModel;
};

export function TuneExplorePrompt({ model }: Props) {
  if (model.kind === 'empty') {
    return null;
  }

  if (model.kind === 'hybridNudge') {
    return (
      <div className="explore-prompt">
        <div className="explore-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 3v14m-5-5l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="explore-text">
          <p className="explore-headline">Curious how a full-bed setup compares?</p>
          <p className="explore-body">
            Your hybrid is dialed in — but the top-rated strings above are scored as full-bed setups. Try
            swapping to one of them on the main page and re-enter Tune to see how the response curves shift.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="explore-prompt">
      <div className="explore-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 7v3l2 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="explore-text">
        <p className="explore-headline">Try a different string?</p>
        <p className="explore-body">
          {
            "Your current string didn't make the top 5 for this frame. Consider switching to "
          }
          <strong>{model.topStringName}</strong>
          {
            ' or another recommended build above — swap on the main page, then re-enter Tune to compare the tension response curves.'
          }
        </p>
      </div>
    </div>
  );
}
