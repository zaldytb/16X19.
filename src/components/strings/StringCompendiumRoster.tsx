import type { StringData } from '../../engine/types.js';

type Props = {
  strings: StringData[];
  selectedStringId: string | null;
  getArchetype: (s: StringData) => string;
};

export function StringCompendiumRoster({ strings, selectedStringId, getArchetype }: Props) {
  return (
    <>
      {strings.map((stringItem) => {
        const isActive = stringItem.id === selectedStringId;
        const baseClasses =
          'bg-transparent border text-left flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer p-4';
        const borderClasses = isActive
          ? 'border-dc-accent'
          : 'border-dc-storm dark:border-dc-platinum-dim hover:border-dc-platinum';
        const archetype = getArchetype(stringItem);
        return (
          <button
            key={stringItem.id}
            type="button"
            className={`${baseClasses} ${borderClasses}`}
            data-id={stringItem.id}
            data-string-action="selectString"
            data-string-arg={stringItem.id}
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-base font-semibold leading-tight tracking-tight text-dc-platinum">
                {stringItem.name}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-dc-accent">{archetype}</span>
              <span className="font-mono text-[12px] text-dc-storm">
                {stringItem.material} // {stringItem.shape}
              </span>
              <span className="font-mono text-[13px] font-semibold text-dc-platinum">
                {Math.round(stringItem.stiffness)} lb/in
              </span>
            </div>
          </button>
        );
      })}
    </>
  );
}
