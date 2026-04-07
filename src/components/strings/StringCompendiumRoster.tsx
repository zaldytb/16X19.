import type { StringData } from '../../engine/types.js';
import type { HybridRole } from '../../engine/hybridRole.js';

type Props = {
  strings: StringData[];
  selectedStringId: string | null;
  getArchetype: (s: StringData) => string;
  getHybridRole: (s: StringData) => HybridRole;
  onSelectString?: (stringId: string) => void;
};

function roleBadgeClass(role: HybridRole): string {
  if (role === 'MAINS') return 'text-dc-accent';
  if (role === 'CROSS') return 'text-dc-platinum';
  return 'text-dc-storm';
}

function roleShortLabel(role: HybridRole): string {
  if (role === 'MAINS') return 'MAINS';
  if (role === 'CROSS') return 'CROSS';
  return 'VERSATILE';
}

export function StringCompendiumRoster({ getArchetype, getHybridRole, onSelectString, selectedStringId, strings }: Props) {
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
        const role = getHybridRole(stringItem);
        return (
          <button
            key={stringItem.id}
            type="button"
            className={`${baseClasses} ${borderClasses}`}
            data-id={stringItem.id}
            data-string-action="selectString"
            data-string-arg={stringItem.id}
            onClick={() => onSelectString?.(stringItem.id)}
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-base font-semibold leading-tight tracking-tight text-dc-platinum">
                {stringItem.name}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-dc-accent">{archetype}</span>
                <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${roleBadgeClass(role)}`}>
                  · {roleShortLabel(role)}
                </span>
              </div>
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
