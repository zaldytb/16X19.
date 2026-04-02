import type { CompBuildCardVm, CompSortTabVm } from '../../ui/pages/comp-top-builds-vm.js';

type Props = {
  sortTabs: CompSortTabVm[];
  cards: CompBuildCardVm[];
  onSetSort?: (key: CompSortTabVm['key']) => void;
  onSetActive?: (index: number) => void;
  onTune?: (index: number) => void;
  onSave?: (index: number) => void;
};

export function CompendiumTopBuilds({ cards, onSave, onSetActive, onSetSort, onTune, sortTabs }: Props) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-dc-border/50">
        <h3 className="font-mono text-xs tracking-[0.15em] text-dc-platinum uppercase">//TOP BUILDS</h3>
        <div className="flex gap-4 border-b border-transparent pb-0">
          {sortTabs.map((tab) => {
            const baseClasses = 'font-mono text-[12px] uppercase tracking-[0.1em] pb-2 transition-colors';
            const activeClasses = tab.isActive
              ? 'text-dc-accent border-b-2 border-dc-accent -mb-[9px] pb-[7px]'
              : 'text-dc-storm hover:text-dc-platinum';
            return (
              <button
                key={tab.key}
                type="button"
                className={`${baseClasses} ${activeClasses}`}
                data-comp-action="setSort"
                data-key={tab.key}
                onClick={() => onSetSort?.(tab.key)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          const cardClasses = card.isFeatured
            ? 'relative bg-transparent border border-dc-accent shadow-[0_0_15px_rgba(255,69,0,0.05)] p-5 flex flex-col transition-colors duration-200 col-span-full'
            : 'relative bg-transparent border border-dc-storm/30 hover:border-dc-storm p-5 flex flex-col transition-colors duration-200';
          return (
            <div key={card.buildKey} className={cardClasses}>
              {card.isFeatured ? (
                <div className="absolute -top-[1px] -left-[1px] bg-dc-accent text-dc-ink font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
                  BEST OVERALL
                </div>
              ) : null}
              <div className="flex justify-between items-start my-1.5">
                <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">{card.archetype}</span>
                <span className="font-mono text-4xl md:text-5xl font-semibold text-dc-platinum leading-[0.8] tracking-tighter">
                  {card.score.toFixed(1)}
                </span>
              </div>
              <div className="text-base font-semibold text-dc-platinum tracking-tight mb-0.5 pr-12 leading-tight">
                {card.stringLabel}
              </div>
              <div className="font-mono text-[12px] text-dc-storm mb-4">{card.metaLabel}</div>
              {card.reasonText ? (
                <div className="text-xs text-dc-storm mb-4 pl-3 border-l-2 border-dc-storm italic">
                  {card.reasonText}
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-2 mt-auto mb-4">
                <button
                  type="button"
                  className="bg-transparent border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink font-mono text-[13px] uppercase tracking-widest py-1.5 transition-colors text-center"
                  data-comp-action="buildAction"
                  data-action-name="setActive"
                  data-index={card.index}
                  onClick={() => onSetActive?.(card.index)}
                >
                  Set Active
                </button>
                <button
                  type="button"
                  className="bg-transparent border border-dc-storm/50 dark:border-dc-storm/30 text-dc-storm hover:border-dc-storm hover:bg-dc-storm/10 hover:text-dc-platinum font-mono text-[13px] uppercase tracking-widest py-1.5 transition-colors text-center"
                  data-comp-action="buildAction"
                  data-action-name="tune"
                  data-index={card.index}
                  onClick={() => onTune?.(card.index)}
                >
                  Tune
                </button>
                <button
                  type="button"
                  className="bg-transparent border border-dc-storm/50 dark:border-dc-storm/30 text-dc-storm hover:border-dc-storm hover:bg-dc-storm/10 hover:text-dc-platinum font-mono text-[13px] uppercase tracking-widest py-1.5 transition-colors text-center"
                  data-comp-action="buildAction"
                  data-action-name="save"
                  data-index={card.index}
                  onClick={() => onSave?.(card.index)}
                >
                  Save
                </button>
              </div>
              <div className="flex flex-wrap gap-3 pt-3 border-t border-dc-storm/30 dark:border-dc-storm/20">
                {card.statsLine.map((st) => (
                  <span
                    key={st.key}
                    className="font-mono text-[13px] text-dc-storm tracking-widest"
                  >
                    [
                    {st.key}{' '}
                    <b className="text-xs text-dc-platinum font-semibold ml-0.5">{st.val}</b>]
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
