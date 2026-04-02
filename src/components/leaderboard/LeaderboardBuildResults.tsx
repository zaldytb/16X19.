import { getObsScoreColor } from '../../engine/index.js';
import type { LbBuildRowVm } from './leaderboard-results-vm.js';

export type LeaderboardBuildResultsProps = {
  rows: LbBuildRowVm[];
  primaryStatColumnLabel: string;
  isObs: boolean;
  footerLeft: string;
  footerIcon: string;
  footerDesc: string;
  onView?: (row: LbBuildRowVm) => void;
  onCompare?: (row: LbBuildRowVm) => void;
};

export function LeaderboardBuildResults({
  rows,
  primaryStatColumnLabel,
  isObs,
  onCompare,
  onView,
  footerLeft,
  footerIcon,
  footerDesc,
}: LeaderboardBuildResultsProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-dc-storm/20">
              <th className="px-4 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 w-10">#</th>
              <th className="px-2 py-2.5 w-8"></th>
              <th className="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">Frame / String</th>
              <th className="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">Tension</th>
              <th className="px-3 py-2.5 text-right font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-accent">{primaryStatColumnLabel}</th>
              {!isObs ? (
                <th className="px-3 py-2.5 text-right font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">OBS</th>
              ) : (
                <th className="w-4"></th>
              )}
              <th className="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 hidden md:table-cell">Identity</th>
              <th className="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 hidden lg:table-cell">Stats</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr
                key={`${entry.rank}-${entry.racquetId}-${entry.stringId}-${entry.entryType}`}
                className={`group border-b border-dc-storm/10 transition-colors hover:bg-dc-void-lift/50 ${
                  entry.isFeatured ? 'bg-dc-accent/[0.03]' : ''
                }`}
              >
                <td className="px-4 py-3 w-10 text-center">
                  <span
                    className={`font-mono text-[11px] font-bold ${entry.isFeatured ? 'text-dc-accent' : 'text-dc-storm/60'}`}
                  >
                    {entry.rank}
                  </span>
                </td>
                <td className="px-2 py-3 w-8">
                  {entry.isHybrid ? (
                    <span className="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-emerald-500/30 text-emerald-400 bg-emerald-400/5">H</span>
                  ) : (
                    <span className="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-dc-storm/30 text-dc-storm">F</span>
                  )}
                </td>
                <td className="px-3 py-3 min-w-[160px]">
                  <div className="font-sans text-[12px] font-semibold text-dc-platinum leading-tight" title={entry.frameTitle}>
                    {entry.frameName}
                  </div>
                  <div className="font-mono text-[9px] text-dc-storm mt-0.5" title={entry.stringTitle}>
                    {entry.stringName}
                  </div>
                </td>
                <td className="px-3 py-3 w-24">
                  <span className="font-mono text-[10px] text-dc-storm/70">{entry.tensionLabel}</span>
                </td>
                <td className="px-3 py-3 w-20 text-right">
                  <span
                    className={`font-mono text-[18px] font-bold leading-none ${entry.isFeatured ? 'text-dc-accent' : 'text-dc-platinum'}`}
                  >
                    {entry.rankValDisplay}
                  </span>
                  <div className="font-mono text-[7px] uppercase tracking-[0.15em] text-dc-storm mt-0.5 text-right">{primaryStatColumnLabel}</div>
                </td>
                {!isObs ? (
                  <td className="px-3 py-3 w-16 text-right">
                    <span className="font-mono text-[12px] font-semibold" style={{ color: getObsScoreColor(entry.obs) }}>
                      {entry.obs}
                    </span>
                    <div className="font-mono text-[7px] uppercase tracking-[0.15em] text-dc-storm mt-0.5 text-right">OBS</div>
                  </td>
                ) : (
                  <td className="w-4"></td>
                )}
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="font-mono text-[9px] text-dc-storm/70 leading-tight">{entry.archetype}</span>
                </td>
                <td className="px-3 py-3 hidden lg:table-cell">
                  <div className="flex gap-1.5 flex-wrap">
                    {entry.topStatChips.map((chip) => (
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
                <td className="px-3 py-3 w-24">
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="font-mono text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink transition-colors"
                      data-lb-action="view"
                      data-racquet-id={entry.racquetId}
                      data-string-id={entry.stringId}
                      data-tension={entry.tension}
                      data-type={entry.entryType}
                      data-mains-id={entry.mainsId}
                      data-crosses-id={entry.crossesId}
                      data-crosses-tension={entry.crossesTension}
                      onClick={() => onView?.(entry)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="font-mono text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-storm/40 text-dc-storm hover:border-dc-storm hover:text-dc-platinum transition-colors"
                      data-lb-action="compare"
                      data-racquet-id={entry.racquetId}
                      data-string-id={entry.stringId}
                      data-tension={entry.tension}
                      data-type={entry.entryType}
                      data-mains-id={entry.mainsId}
                      data-crosses-id={entry.crossesId}
                      data-crosses-tension={entry.crossesTension}
                      onClick={() => onCompare?.(entry)}
                    >
                      Cmp
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
