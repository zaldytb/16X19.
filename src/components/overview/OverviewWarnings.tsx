import type { OverviewWarningsViewModel } from '../../ui/pages/overview-warnings-vm.js';

type Props = {
  model: OverviewWarningsViewModel;
};

export function OverviewWarnings({ model }: Props) {
  return (
    <>
      {model.messages.map((w, i) => (
        <div key={i} className="warning-item">
          <svg className="warning-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="12" r="0.8" fill="currentColor" />
          </svg>
          <span>{w}</span>
        </div>
      ))}
    </>
  );
}
