import { useRef } from 'react';
import { toggleDockCollapse } from '../../ui/components/dock-collapse.js';
import { toggleMobileDock } from '../../ui/components/mobile-dock.js';
import { toggleAppTheme } from '../../ui/theme-toggle.js';
import {
  saveActiveLoadout,
  shareActiveLoadout,
  resetActiveLoadout,
  exportLoadouts,
  importLoadouts,
  _handleHybridToggle,
  cancelCompareSlotEditing,
  applyDockEditorChanges,
} from '../../ui/pages/shell.js';

export function BuildDock() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <aside className="build-dock" id="build-dock">
        <div className="dock-rail" id="dock-rail">
          <button className="dock-rail-expand" onClick={() => toggleDockCollapse()} title="Expand dock">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="6 4 10 8 6 12"/></svg>
          </button>
          <div className="dock-rail-obs" id="dock-rail-obs">—</div>
          <div className="dock-rail-count" id="dock-rail-count">0</div>
        </div>

        <div className="builder-panel flex flex-col gap-4 min-w-0" id="builder-panel">
          <div className="flex justify-end">
            <button className="w-7 h-7 flex items-center justify-center border border-dc-border bg-transparent text-dc-storm hover:text-dc-platinum hover:border-dc-border-hover transition-colors" onClick={() => toggleDockCollapse()} title="Collapse dock">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="8 2 4 6 8 10"/></svg>
            </button>
          </div>

          <div id="dock-active-loadout">
            <div id="dock-lo-empty" className="border border-dc-border px-4 py-6 text-center">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-platinum mb-1">No active loadout</p>
              <p className="font-sans text-[11px] text-dc-storm">Search a racket or take the quiz</p>
            </div>

            <div id="dock-lo-active" className="hidden border border-dc-border">
              <div className="flex gap-3 p-4 border-b border-dc-border">
                <div className="w-14 h-14 shrink-0 border border-dc-accent flex flex-col items-center justify-center" id="dock-lo-obs-ring">
                  <span className="font-mono text-[18px] font-bold leading-none" id="dock-lo-obs-val">—</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                  <div className="font-sans text-[13px] font-semibold text-dc-platinum leading-tight truncate" id="dock-lo-name">—</div>
                  <div className="font-mono text-[10px] text-dc-storm truncate" id="dock-lo-identity">—</div>
                  <div className="font-mono text-[10px] text-dc-storm truncate" id="dock-lo-details">—</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-dc-storm mt-0.5 hidden" id="dock-lo-source"></div>
                </div>
              </div>

              <div className="grid grid-cols-3">
                <button className="flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] text-dc-storm hover:text-dc-platinum hover:bg-dc-void-lift transition-colors border-r border-dc-border" onClick={() => saveActiveLoadout()} title="Save to My Loadouts">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 13H3a1 1 0 01-1-1V2a1 1 0 011-1h5.5L12 4.5V12a1 1 0 01-1 1z"/><polyline points="8.5 1 8.5 5 12 5"/></svg>
                  Save
                </button>
                <button className="flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] text-dc-storm hover:text-dc-platinum hover:bg-dc-void-lift transition-colors border-r border-dc-border" onClick={() => shareActiveLoadout()} title="Copy share link">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 9l4-4M9 5v3.5M9 5H5.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="1" width="12" height="12" rx="2.5"/></svg>
                  Share
                </button>
                <button className="flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] text-dc-storm hover:text-dc-platinum hover:bg-dc-void-lift transition-colors" onClick={() => resetActiveLoadout()} title="Clear active loadout">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1 1 4 1 4 4"/><path d="M3.5 1.5A6 6 0 1 1 1.5 8"/></svg>
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div id="dock-context-panel" className="dock-context-panel"></div>

          <div id="dock-my-loadouts">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] font-bold tracking-[0.25em] uppercase text-dc-storm flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                My Loadouts
              </span>
              <span className="font-mono text-[9px] font-bold text-dc-storm border border-dc-border px-1.5 py-0.5" id="dock-myl-count">0</span>
            </div>

            <div className="flex flex-col border border-dc-border" id="dock-myl-list">
              <div className="px-3 py-4 text-center font-mono text-[10px] text-dc-storm">No saved loadouts yet</div>
            </div>

            <div className="flex border border-t-0 border-dc-border">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-dc-storm hover:text-dc-platinum hover:bg-dc-void-lift transition-colors border-r border-dc-border" onClick={() => exportLoadouts()}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2v6M3.5 5.5L6 8l2.5-2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 9v1.5h8V9" strokeLinecap="round"/></svg>
                Export
              </button>
              <label className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-dc-storm hover:text-dc-platinum hover:bg-dc-void-lift transition-colors cursor-pointer">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 8V2M3.5 4.5L6 2l2.5 2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 9v1.5h8V9" strokeLinecap="round"/></svg>
                Import
                <input ref={fileInputRef} type="file" accept=".json" onChange={(event) => importLoadouts(event.nativeEvent)} className="hidden" />
              </label>
            </div>
          </div>

          <div id="dock-create-area"></div>

          <details className="dock-editor-details" id="dock-editor-section">
            <summary className="dock-editor-summary">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.5 1.5l2 2-7.5 7.5H3v-2L10.5 1.5z"/></svg>
              <span id="dock-editor-title">Edit Active Loadout</span>
            </summary>
            <div className="dock-editor-body">
              <div className="flex flex-col gap-2 mb-4">
                <span className="font-mono text-[9px] font-bold tracking-[0.25em] uppercase text-dc-storm flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="5" x2="8" y2="11" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5"/></svg>
                  Frame
                </span>
                <div id="select-racquet"></div>
                <div id="frame-specs" className="hidden flex flex-col border border-dc-border bg-dc-void-deep px-3 py-2"></div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[9px] font-bold tracking-[0.25em] uppercase text-dc-storm flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="4" x2="5" y2="12" stroke="currentColor" strokeWidth="1.5"/><line x1="11" y1="4" x2="11" y2="12" stroke="currentColor" strokeWidth="1.5"/></svg>
                  String Setup
                </span>

                <div className="flex border border-dc-border">
                  <button className="flex-1 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] bg-dc-platinum text-dc-void border-r border-dc-border transition-colors active" data-mode="full" id="btn-full" onClick={() => _handleHybridToggle(false)}>Full Bed</button>
                  <button className="flex-1 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] bg-transparent text-dc-storm hover:text-dc-platinum transition-colors" data-mode="hybrid" id="btn-hybrid" onClick={() => _handleHybridToggle(true)}>Hybrid</button>
                </div>

                <div id="full-bed-config" className="flex flex-col gap-2 pt-1">
                  <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.2em]">String</span>
                  <div id="select-string-full" data-gauge-target="gauge-select-full"></div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.15em]">Gauge</span>
                    <select id="gauge-select-full" className="gauge-select" disabled><option value="">—</option></select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.15em]">Mains lbs</span>
                      <input type="number" id="input-tension-full-mains" className="text-input" min="30" max="70" defaultValue="55" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.15em]">Crosses lbs</span>
                      <input type="number" id="input-tension-full-crosses" className="text-input" min="30" max="70" defaultValue="53" />
                    </div>
                  </div>
                </div>

                <div id="hybrid-config" className="hidden flex flex-col gap-3 pt-1">
                  <div className="flex flex-col gap-2 pl-2 border-l-2 border-dc-storm/30">
                    <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.2em]">Mains</span>
                    <div id="select-string-mains" data-placeholder="Select Main String..." data-gauge-target="gauge-select-mains"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.15em]">Gauge</span>
                        <select id="gauge-select-mains" className="gauge-select" disabled><option value="">—</option></select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.15em]">Tension</span>
                        <input type="number" id="input-tension-mains" className="text-input" min="30" max="70" defaultValue="55" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pl-2 border-l-2 border-dc-storm/20">
                    <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.2em]">Crosses</span>
                    <div id="select-string-crosses" data-placeholder="Select Cross String..." data-gauge-target="gauge-select-crosses"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.15em]">Gauge</span>
                        <select id="gauge-select-crosses" className="gauge-select" disabled><option value="">—</option></select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.15em]">Tension</span>
                        <input type="number" id="input-tension-crosses" className="text-input" min="30" max="70" defaultValue="53" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dock-editor-compare-actions hidden" id="dock-editor-compare-actions">
                <div className="dock-editor-compare-copy" id="dock-editor-compare-copy">Changes stay in the dock until you apply them to this compare slot.</div>
                <div className="dock-editor-compare-row">
                  <button className="dock-editor-compare-btn" type="button" onClick={() => cancelCompareSlotEditing()}>Cancel</button>
                  <button className="dock-editor-compare-btn dock-editor-compare-btn-primary" id="dock-editor-compare-apply" type="button" onClick={() => applyDockEditorChanges()} disabled>Apply To Slot</button>
                </div>
              </div>
            </div>
          </details>
        </div>
      </aside>

      <div className="dock-mobile-bar" id="dock-mobile-bar" onClick={() => toggleMobileDock()}>
        <div className="dock-mob-lead">
          <span className="dock-mob-kicker">Builder</span>
          <div className="dock-mob-summary" id="dock-mob-summary">
            <span className="dock-mob-obs" id="dock-mob-obs"></span>
            <span className="dock-mob-label" id="dock-mob-label">No active loadout</span>
          </div>
        </div>
        <svg className="dock-mob-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4 6 8 10 12 6"/></svg>
        <button className="dock-mob-theme" id="dock-mob-theme" onClick={(event) => { event.stopPropagation(); toggleAppTheme(); }} title="Toggle theme">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="dock-backdrop" id="dock-backdrop"></div>
    </>
  );
}
