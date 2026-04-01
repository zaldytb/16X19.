import type { FmbDirectionsVm } from '../../ui/pages/find-my-build-vm.js';

type Props = {
  model: FmbDirectionsVm;
};

function obsToneClass(obs: string): string {
  const n = parseFloat(obs);
  if (Number.isNaN(n)) return 'text-dc-platinum';
  if (n >= 85) return 'text-dc-accent';
  if (n >= 70) return 'text-dc-platinum';
  return 'text-dc-storm';
}

export function FmbResultsDirections({ model }: Props) {
  return (
    <div className="fmb-frame-results mt-6 space-y-5">
      <div className="space-y-1">
        <h4 className="text-lg md:text-xl font-semibold tracking-tight text-dc-platinum">Recommended frames</h4>
        <p className="font-mono text-[11px] text-dc-storm leading-relaxed max-w-prose">
          Based on your playstyle profile. Each card lists top string builds at optimal tension for that frame.
        </p>
      </div>

      <div className="fmb-frame-list flex flex-col gap-4">
        {model.frames.map((frame) => (
          <div
            key={frame.frameIdx}
            className="fmb-frame-card rounded-lg border border-dc-border bg-white dark:bg-dc-void-lift overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            data-frame-idx={frame.frameIdx}
          >
            <div className="fmb-frame-header border-b border-dc-border/80 px-4 py-3 md:px-5 md:py-4 bg-black/[0.03] dark:bg-black/20">
              <div className="fmb-frame-name text-base md:text-lg font-semibold text-dc-platinum tracking-tight">
                {frame.frameName}
              </div>
              <div className="fmb-frame-meta mt-1 font-mono text-[10px] md:text-[11px] text-dc-storm uppercase tracking-wide">
                {frame.frameMeta}
              </div>
            </div>

            {frame.builds.length ? (
              <div className="fmb-frame-builds divide-y divide-dc-border/60">
                {frame.builds.map((build) => (
                  <div
                    key={`${build.frameIdx}-${build.buildIdx}`}
                    className="fmb-build-row flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 md:px-5 md:py-3.5"
                  >
                    <div className="fmb-build-info flex-1 min-w-0 flex flex-col gap-1">
                      <span className="fmb-build-name text-sm font-medium text-dc-platinum truncate" title={build.name}>
                        {build.name}
                      </span>
                      <span className="fmb-build-tension font-mono text-[11px] text-dc-storm">{build.tensionLabel}</span>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-1 shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-dc-storm">OBS</div>
                        <div className={`fmb-build-obs font-mono text-lg font-semibold tabular-nums ${obsToneClass(build.obs)}`}>
                          {build.obs}
                        </div>
                      </div>
                      <div className="fmb-build-actions flex gap-2">
                        <button
                          type="button"
                          className="fmb-build-btn rounded border border-dc-accent/80 bg-transparent px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-dc-accent hover:bg-dc-accent hover:text-dc-void transition-colors"
                          data-fmb-action="activate"
                          data-frame-idx={build.frameIdx}
                          data-build-idx={build.buildIdx}
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          className="fmb-build-btn fmb-build-btn-secondary rounded border border-dc-border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-dc-platinum hover:border-dc-platinum hover:bg-dc-platinum/10 transition-colors"
                          data-fmb-action="save"
                          data-frame-idx={build.frameIdx}
                          data-build-idx={build.buildIdx}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 font-mono text-[11px] text-dc-storm text-center">No builds scored for this frame.</div>
            )}
          </div>
        ))}
      </div>

      <div className="fmb-also-try rounded-lg border border-dc-border border-dashed bg-black/[0.02] dark:bg-black/15 px-4 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="fmb-also-try-text font-mono text-[11px] text-dc-storm">Want more options?</p>
        <button
          type="button"
          className="fmb-dir-btn shrink-0 rounded border border-dc-border px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-dc-platinum hover:border-dc-accent hover:text-dc-accent transition-colors w-full sm:w-auto"
          data-fmb-action="searchDirection"
          data-fmb-direction="closest"
        >
          Search in optimizer
        </button>
      </div>
    </div>
  );
}
