import type { OverviewHeroViewModel } from '../../ui/pages/overview-hero-vm.js';

type Props = {
  model: OverviewHeroViewModel;
  onBackToBible: () => void;
  onTuneThisBuild: () => void;
};

export function OverviewHero({ model, onBackToBible, onTuneThisBuild }: Props) {
  const tierClass = model.tierClassSuffix ? `hero-obs-tier ${model.tierClassSuffix}` : 'hero-obs-tier';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="hero-score shrink-0">
          <span className="hero-obs-label">System Sync Rating</span>
          <span className="hero-obs-value">{model.scoreDisplay}</span>
          <span className={tierClass}>{model.tierLabel}</span>
        </div>
        <div className="hero-identity flex-1 min-w-0">
          <div className="hero-archetype">{model.archetype}</div>
          <div className="hero-desc">{model.description}</div>
          <div className="hero-terminal">
            <span className="hero-terminal-value">{model.racquetDisplayName}</span>
            <span className="hero-terminal-sep">//</span>
            <span className="hero-terminal-value">{model.stringLine}</span>
            <span className="hero-terminal-sep">//</span>
            <span className="hero-terminal-value">{model.tensionLabel}</span>
          </div>
        </div>
      </div>
      <div className="mt-2 pt-6 border-t border-dc-storm/20">
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 bg-transparent border border-dc-storm/40 dark:border-dc-storm/40 text-dc-platinum font-mono text-[12px] font-bold uppercase tracking-widest py-3 px-4 hover:border-dc-platinum dark:hover:border-dc-platinum hover:bg-dc-void/5 dark:hover:bg-dc-platinum/5 transition-colors flex items-center justify-center gap-2"
            onClick={onBackToBible}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            //BACK TO BIBLE
          </button>
          <button
            type="button"
            className="flex-1 bg-dc-accent text-dc-ink font-mono text-[12px] font-bold uppercase tracking-widest py-3 px-4 hover:bg-dc-accent/90 transition-colors flex items-center justify-center gap-2"
            onClick={onTuneThisBuild}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v10" />
              <path d="M21 12h-6m-6 0H1" />
            </svg>
            Tune This Build
          </button>
        </div>
      </div>
    </div>
  );
}
