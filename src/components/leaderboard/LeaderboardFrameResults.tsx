import type { LbFrameRowVm } from './leaderboard-results-vm.js';

export type LeaderboardFrameResultsProps = {
  rows: LbFrameRowVm[];
  primaryStatColumnLabel: string;
  footerLeft: string;
  footerIcon: string;
  footerDesc: string;
  onViewFrame?: (racquetId: string) => void;
};

export function LeaderboardFrameResults({
  rows,
  primaryStatColumnLabel,
  footerLeft,
  footerIcon,
  footerDesc,
  onViewFrame,
}: LeaderboardFrameResultsProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-dc-storm/20">
              <th className="px-4 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 w-10">#</th>
              <th className="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">Frame</th>
              <th className="px-3 py-2.5 text-right font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-accent">{primaryStatColumnLabel}</th>
              <th className="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 hidden md:table-cell">Stats</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr
                key={`${entry.rank}-${entry.racquetId}`}
                className={`group border-b border-dc-storm/10 transition-colors hover:bg-dc-void-lift/50 ${entry.isFeatured ? 'bg-dc-accent/[0.03]' : ''}`}
              >
                <td className="px-4 py-3 w-10 text-center">
                  <span
                    className={`font-mono text-[11px] font-bold ${entry.isFeatured ? 'text-dc-accent' : 'text-dc-storm/60'}`}
                  >
                    {entry.rank}
                  </span>
                </td>
                <td className="px-3 py-3 min-w-[200px]">
                  <div className="font-sans text-[12px] font-semibold text-dc-platinum leading-tight">{entry.frameName}</div>
                  <div className="font-mono text-[9px] text-dc-storm/60 mt-0.5">{entry.specLine}</div>
                </td>
                <td className="px-3 py-3 w-20 text-right">
                  <span
                    className={`font-mono text-[18px] font-bold leading-none ${entry.isFeatured ? 'text-dc-accent' : 'text-dc-platinum'}`}
                  >
                    {entry.rankVal}
                  </span>
                  <div className="font-mono text-[7px] uppercase tracking-[0.15em] text-dc-storm mt-0.5 text-right">{primaryStatColumnLabel}</div>
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <div className="flex gap-1.5 flex-wrap">
                    {entry.statChips.map((chip) => (
                      <span
                        key={chip.key}
                        className={`font-mono text-[8px] font-bold px-1.5 py-0.5 border ${
                          chip.high
                            ? 'border-emerald-500/25 text-emerald-400 bg-emerald-400/5'
                            : 'border-dc-storm/20 text-dc-storm'
                        }`}
                      >
                        {chip.key} {chip.val}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 w-20">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="font-mono text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink transition-colors"
                      data-lb-action="viewFrame"
                      data-racquet-id={entry.racquetId}
                      onClick={() => onViewFrame?.(entry.racquetId)}
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-dc-storm/10 flex justify-between items-center">
        <span className="font-mono text-[9px] text-dc-storm/50">{footerLeft}</span>
        <span className="font-mono text-[9px] text-dc-storm/50">
          {footerIcon} {footerDesc}
        </span>
      </div>
    </>
  );
}
