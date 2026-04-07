import type { CompSimilarRacketCardVm } from '../../ui/pages/comp-similar-rackets-vm.js';

type Props = {
  cards: CompSimilarRacketCardVm[];
  onSelectRacquet: (id: string) => void;
};

export function CompendiumSimilarRackets({ cards, onSelectRacquet }: Props) {
  if (cards.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-dc-border/50">
        <h3 className="font-mono text-xs tracking-[0.15em] text-dc-platinum uppercase">
          //SIMILAR PROFILES
        </h3>
        <span className="font-mono text-[11px] text-dc-storm tracking-widest">
          FRAMES WITH CLOSEST BASE STAT SIGNATURE
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <button
            key={card.racquetId}
            type="button"
            className="border border-dc-storm/30 hover:border-dc-storm p-4 flex flex-col text-left transition-colors cursor-pointer bg-transparent group"
            onClick={() => onSelectRacquet(card.racquetId)}
          >
            <div className="flex justify-between items-start mb-2 w-full">
              <span className="font-mono text-[13px] text-dc-platinum tracking-tight leading-tight group-hover:text-dc-accent transition-colors">
                {card.displayName}
              </span>
              <span className="font-mono text-[11px] text-dc-accent tracking-widest ml-2 shrink-0">
                {card.similarity}%
              </span>
            </div>

            <span className="font-mono text-[11px] text-dc-storm mb-3">
              {card.year > 0 ? `${card.year} · ` : ''}{card.specLine}
            </span>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-dc-storm/20 mt-auto">
              {card.deltaStats.map((st) => (
                <span
                  key={st.key}
                  className="font-mono text-[12px] text-dc-storm tracking-widest"
                >
                  [{st.key}{' '}
                  <b className={`text-xs font-semibold ml-0.5 ${st.delta > 0 ? 'text-dc-green' : st.delta < 0 ? 'text-dc-red' : 'text-dc-platinum'}`}>
                    {st.delta > 0 ? '+' : ''}{st.delta}
                  </b>]
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
