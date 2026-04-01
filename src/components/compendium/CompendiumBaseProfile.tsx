import type { CompBaseStatGroupVm, CompBaseStatRowVm } from '../../ui/pages/comp-base-profile-vm.js';

type Props = {
  groups: CompBaseStatGroupVm[];
};

function segmentClass(
  index: number,
  row: CompBaseStatRowVm,
): string {
  const baseFilled = row.filledSegments;
  const previewFilled = row.previewFilledSegments;
  const deltaDirection = row.deltaDirection;
  let bgClass = 'bg-black/10 dark:bg-white/10';
  if (index < baseFilled) bgClass = 'bg-dc-void dark:bg-dc-platinum';
  if (previewFilled != null && deltaDirection === 'up' && index < previewFilled) bgClass = 'bg-dc-red';
  if (previewFilled != null && deltaDirection === 'down' && index >= previewFilled && index < baseFilled) {
    bgClass = 'bg-dc-red/40';
  }
  return `flex-1 h-full rounded-[1px] transition-colors duration-150 ${bgClass}`;
}

function ValueCell({ row }: { row: CompBaseStatRowVm }) {
  if (row.previewValue == null || row.deltaDirection === undefined) {
    return <span className="text-dc-platinum">{row.value}</span>;
  }
  const pv = row.previewValue;
  const diff = pv - row.value;
  let diffColor = 'text-dc-storm';
  if (diff > 0) diffColor = 'text-dc-red';
  if (diff < 0) diffColor = 'text-dc-accent';
  return (
    <>
      <span className="text-dc-storm">{row.value}</span>
      <span className="text-dc-storm mx-1">&rarr;</span>
      <span className={diffColor}>{pv}</span>
    </>
  );
}

export function CompendiumBaseProfile({ groups }: Props) {
  return (
    <div className="mb-12">
      <h3 className="font-mono text-xs tracking-[0.15em] text-dc-platinum uppercase mb-1">
        // BASE FRAME PROFILE
      </h3>
      <p className="text-xs text-dc-storm mb-6 italic">Frame-only characteristics before string influence</p>
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col">
            <h4 className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em] border-b border-dc-border pb-2 mb-3">
              {group.title}
            </h4>
            <div className="flex flex-col gap-2.5">
              {group.rows.map((row) => (
                <div key={row.id} className="flex items-center gap-4 group" data-stat={row.id}>
                  <span className="font-mono text-[13px] text-dc-storm group-hover:text-dc-platinum transition-colors uppercase tracking-[0.15em] w-28">
                    {row.label}
                  </span>
                  <div
                    className="flex flex-1 gap-[2px] h-1.5 items-center"
                    id={`comp-track-${row.id}`}
                    data-base={row.value}
                    data-has-preview={row.previewFilledSegments != null ? 'true' : undefined}
                  >
                    {Array.from({ length: 25 }, (_, i) => (
                      <div key={i} className={segmentClass(i, row)} data-seg={i} />
                    ))}
                  </div>
                  <span
                    className="font-mono text-[13px] font-bold text-dc-platinum w-8 text-right"
                    id={`comp-val-${row.id}`}
                  >
                    <ValueCell row={row} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
