import type { FmbProfileSummaryVm } from '../../ui/pages/find-my-build-vm.js';

type Props = {
  model: FmbProfileSummaryVm;
};

export function FmbResultsSummary({ model }: Props) {
  return (
    <div className="rounded-lg border border-dc-border bg-white dark:bg-dc-void-lift p-5 md:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] space-y-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-dc-accent">
        Your profile
      </div>
      <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-dc-platinum leading-snug">
        {model.identity}
      </h3>
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-widest text-dc-storm">Optimizing for</div>
        <div className="flex flex-wrap gap-2">
          {model.priorityLabels.map((priority, index) => (
            <span
              key={`${priority}-${index}`}
              className="inline-flex items-center rounded border border-dc-border bg-black/[0.06] dark:bg-black/25 px-2.5 py-1 font-mono text-[11px] text-dc-platinum"
            >
              <span className="mr-1.5 text-dc-accent tabular-nums">{index + 1}.</span>
              {priority}
            </span>
          ))}
        </div>
      </div>
      {model.thresholdTags.length ? (
        <div className="space-y-2 pt-1 border-t border-dc-border/80">
          <div className="font-mono text-[10px] uppercase tracking-widest text-dc-storm">Targets</div>
          <div className="flex flex-wrap gap-2">
            {model.thresholdTags.map((threshold) => (
              <span
                key={threshold}
                className="rounded-sm border border-dc-border/60 px-2 py-0.5 font-mono text-[10px] text-dc-platinum/90"
              >
                {threshold}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {model.notes.length ? (
        <div className="space-y-1.5 pt-1 border-t border-dc-border/80">
          {model.notes.map((note) => (
            <div
              key={note}
              className="font-mono text-[11px] leading-relaxed text-dc-storm border-l-2 border-dc-accent/40 pl-3"
            >
              {note}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
