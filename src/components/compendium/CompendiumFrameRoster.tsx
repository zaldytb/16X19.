import type { Racquet } from '../../engine/types.js';

type Props = {
  racquets: Racquet[];
  selectedRacquetId: string | null;
  onSelectFrame?: (racquetId: string) => void;
};

export function CompendiumFrameRoster({ racquets, selectedRacquetId, onSelectFrame }: Props) {
  return (
    <>
      {racquets.map((r) => {
        const ext = r as Racquet & { year?: number; identity?: string };
        const isActive = r.id === selectedRacquetId;
        const specs = `${r.strungWeight}g strung · ${r.stiffness} RA · ${r.pattern}`;
        const baseClasses =
          'bg-transparent border text-left flex flex-col justify-between gap-6 transition-all duration-200 cursor-pointer p-5';
        const borderClasses = isActive ? 'border-dc-accent' : 'border-dc-platinum-dim hover:border-dc-platinum';
        return (
          <button
            key={r.id}
            type="button"
            className={`${baseClasses} ${borderClasses}`}
            data-id={r.id}
            data-comp-action="selectFrame"
            onClick={() => onSelectFrame?.(r.id)}
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-lg font-semibold leading-tight tracking-tight text-dc-platinum">
                {r.name.replace(/\s+\d+g$/, '')}
              </span>
              <span className="font-mono text-[13px] tracking-[0.15em] text-dc-platinum-dim mt-1">
                {typeof ext.year === 'number' ? ext.year : ''}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[13px] uppercase tracking-[0.15em] text-dc-accent">
                {(typeof ext.identity === 'string' ? ext.identity : '') || r.pattern}
              </span>
              <span className="font-mono text-[13px] font-semibold text-dc-platinum">{specs}</span>
            </div>
          </button>
        );
      })}
    </>
  );
}
