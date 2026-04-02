import type { MyLoadoutsVm } from '../../ui/pages/my-loadouts-vm.js';

type Props = {
  model: MyLoadoutsVm;
  onSwitchToLoadout: (id: string) => void;
  onShareLoadout: (id: string) => void;
  onAddLoadoutToCompare: (id: string) => void;
  onConfirmRemoveLoadout: (id: string) => void;
  onRemoveLoadout: (id: string) => void;
  onCancelRemoveLoadout: () => void;
};

export function MyLoadoutsList({
  model,
  onSwitchToLoadout,
  onShareLoadout,
  onAddLoadoutToCompare,
  onConfirmRemoveLoadout,
  onRemoveLoadout,
  onCancelRemoveLoadout,
}: Props) {
  if (model.rows.length === 0) {
    return <div className="px-3 py-4 text-center font-mono text-[10px] text-dc-storm">No saved loadouts yet</div>;
  }

  return (
    <>
      {model.rows.map((row) => (
        <div
          key={row.id}
          className={`group relative flex items-stretch border-b border-[var(--dc-border)] last:border-b-0 transition-colors ${row.activeBorderClass}`}
          data-lo-id={row.id}
        >
          <button
            type="button"
            className="flex items-center gap-2.5 flex-1 min-w-0 px-3 py-2.5 cursor-pointer text-left"
            onClick={() => onSwitchToLoadout(row.id)}
          >
            <div className="w-9 h-9 shrink-0 border border-[var(--dc-border)] flex items-center justify-center">
              <span className="font-mono text-[11px] font-bold" style={{ color: row.obsColor }}>{row.obsDisplay}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-[11px] font-semibold text-[var(--dc-platinum)] leading-tight truncate flex items-center gap-1">
                {row.frameName}
                {row.isActive ? <span className="font-mono text-[7px] uppercase tracking-wider text-[var(--dc-accent)]">Active</span> : null}
                {row.sourceLabel ? <span className="font-mono text-[7px] text-[var(--dc-storm)] border border-[var(--dc-border)] px-1">{row.sourceLabel}</span> : null}
              </div>
              <div className="font-mono text-[9px] text-[var(--dc-storm)] truncate leading-tight mt-0.5">{row.stringName}</div>
              <div className="font-mono text-[8px] text-[var(--dc-storm)]/60 mt-0.5">{row.tensionLabel}</div>
            </div>
          </button>

          {row.isConfirmingRemoval ? (
            <div className="flex items-stretch border-l border-[var(--dc-border)]" style={{ opacity: 1, pointerEvents: 'auto' }}>
              <span className="font-mono text-[8px] text-[var(--dc-storm)] px-2 flex items-center whitespace-nowrap">Delete?</span>
              <button className="px-2 font-mono text-[9px] font-bold text-[var(--dc-red)] hover:bg-[var(--dc-void)] border-l border-[var(--dc-border)] h-full transition-colors" onClick={() => onRemoveLoadout(row.id)}>Yes</button>
              <button className="px-2 font-mono text-[9px] text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] border-l border-[var(--dc-border)] h-full transition-colors" onClick={() => onCancelRemoveLoadout()}>No</button>
            </div>
          ) : (
            <div className="flex items-stretch opacity-0 group-hover:opacity-100 transition-opacity border-l border-[var(--dc-border)]">
              <button className="w-8 flex items-center justify-center text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] hover:bg-[var(--dc-void)] transition-colors" onClick={() => onShareLoadout(row.id)} title="Share">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7.5L8 4.5M8 4.5V7M8 4.5H5.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="1" width="10" height="10" rx="2"/></svg>
              </button>
              <button className="w-8 flex items-center justify-center text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] hover:bg-[var(--dc-void)] transition-colors border-l border-[var(--dc-border)]" onClick={() => onAddLoadoutToCompare(row.id)} title="Compare">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="4" height="10" rx="0.5"/><rect x="7" y="1" width="4" height="10" rx="0.5"/></svg>
              </button>
              <button className="w-8 flex items-center justify-center text-[var(--dc-storm)] hover:text-[var(--dc-red)] hover:bg-[var(--dc-void)] transition-colors border-l border-[var(--dc-border)]" onClick={() => onConfirmRemoveLoadout(row.id)} title="Remove">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/></svg>
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
