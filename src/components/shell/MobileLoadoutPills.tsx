import { useSavedLoadouts, useActiveLoadout } from '../../hooks/useStore.js';
import { switchToLoadout } from '../../ui/pages/shell.js';

export function MobileLoadoutPills() {
  const savedLoadouts = useSavedLoadouts();
  const activeLoadout = useActiveLoadout();

  if (savedLoadouts.length === 0) {
    return null;
  }

  return (
    <>
      {savedLoadouts.map((loadout) => {
        const isActive = activeLoadout?.id === loadout.id;
        const obsValue = typeof loadout.obs === 'number' && Number.isFinite(loadout.obs) ? loadout.obs : Number(loadout.obs);
        const obsDisplay = Number.isFinite(obsValue) && obsValue > 0 ? obsValue.toFixed(1) : '\u2014';
        const className = isActive
          ? 'bg-[var(--dc-platinum)] text-[var(--dc-void)] border-[var(--dc-platinum)]'
          : 'bg-transparent text-[var(--dc-storm)] border-[var(--dc-border)] hover:text-[var(--dc-platinum)] hover:border-[var(--dc-storm)]';

        return (
          <button
            key={loadout.id}
            type="button"
            className={`shrink-0 flex items-center gap-2 px-3 py-1.5 border font-mono text-[10px] font-semibold transition-colors ${className}`}
            onClick={() => switchToLoadout(loadout.id)}
          >
            {loadout.name || 'Loadout'}
            <span className="opacity-60">{obsDisplay}</span>
          </button>
        );
      })}
    </>
  );
}
