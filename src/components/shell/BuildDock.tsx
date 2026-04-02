import { useEffect, useMemo, useRef, useState } from 'react';
import { RACQUETS, STRINGS } from '../../data/loader.js';
import { getObsScoreColor } from '../../engine/index.js';
import type { Loadout } from '../../engine/types.js';
import { useActiveLoadout, useComparisonSlots, useDockEditorContext, useSavedLoadouts } from '../../hooks/useStore.js';
import { buildMyLoadoutsViewModel } from '../../ui/pages/my-loadouts-vm.js';
import { _prevObsValues, animateOBS } from '../../ui/components/obs-animation.js';
import { _initDockCollapse, toggleDockCollapse } from '../../ui/components/dock-collapse.js';
import { toggleMobileDock } from '../../ui/components/mobile-dock.js';
import { ssInstances } from '../../ui/components/searchable-select.js';
import { populateGaugeDropdown, setHybridMode, showFrameSpecs } from '../../ui/shared/helpers.js';
import { toggleAppTheme } from '../../ui/theme-toggle.js';
import {
  saveActiveLoadout,
  shareActiveLoadout,
  shareLoadout,
  switchToLoadout,
  removeLoadout,
  resetActiveLoadout,
  exportLoadouts,
  importLoadouts,
  addLoadoutToCompare,
  _handleHybridToggle,
  cancelCompareSlotEditing,
  applyDockEditorChanges,
  getCompareEditorDirty,
  subscribeCompareEditorDirty,
} from '../../ui/pages/shell.js';
import { MyLoadoutsList } from './MyLoadoutsList.js';

function getNumericObs(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getLoadoutDetails(loadout: Loadout | null): { frameName: string; stringName: string; details: string; sourceLabel: string } {
  if (!loadout) {
    return {
      frameName: '\u2014',
      stringName: '\u2014',
      details: '\u2014',
      sourceLabel: '',
    };
  }

  const racquet = RACQUETS.find((frame) => frame.id === loadout.frameId);
  const frameName = racquet ? racquet.name.replace(/\s+\d+g$/, '') : '\u2014';
  const stringName = loadout.isHybrid
    ? (() => {
        const mains = STRINGS.find((stringItem) => stringItem.id === loadout.mainsId);
        const crosses = STRINGS.find((stringItem) => stringItem.id === loadout.crossesId);
        return mains && crosses ? 'Hybrid' : '\u2014';
      })()
    : (STRINGS.find((stringItem) => stringItem.id === loadout.stringId)?.name ?? '\u2014');

  const labels: Record<string, string> = {
    quiz: 'Quiz',
    compendium: 'Racket Bible',
    manual: 'Manual',
    preset: 'Preset',
    optimize: 'Optimizer',
    shared: 'Shared',
  };

  return {
    frameName,
    stringName,
    details: `${frameName} \u00B7 ${stringName} \u00B7 M${loadout.mainsTension}/X${loadout.crossesTension}`,
    sourceLabel: loadout._dirty ? '\u270E Modified' : labels[loadout.source || ''] || '',
  };
}

function resetGaugeSelect(id: string): void {
  const element = document.getElementById(id) as HTMLSelectElement | null;
  if (!element) return;
  element.innerHTML = '<option value="">\u2014</option>';
  element.disabled = true;
}

function syncDockEditorFields(loadout: Loadout | null): void {
  if (!ssInstances['select-racquet']) return;

  if (!loadout) {
    ssInstances['select-racquet']?.setValue('');
    ssInstances['select-string-full']?.setValue('');
    ssInstances['select-string-mains']?.setValue('');
    ssInstances['select-string-crosses']?.setValue('');
    setHybridMode(false);

    const tensionDefaults = [
      ['input-tension-full-mains', '55'],
      ['input-tension-full-crosses', '53'],
      ['input-tension-mains', '55'],
      ['input-tension-crosses', '53'],
    ] as const;

    tensionDefaults.forEach(([id, value]) => {
      const input = document.getElementById(id) as HTMLInputElement | null;
      if (input) input.value = value;
    });

    resetGaugeSelect('gauge-select-full');
    resetGaugeSelect('gauge-select-mains');
    resetGaugeSelect('gauge-select-crosses');
    showFrameSpecs(null);
    return;
  }

  const racquet = RACQUETS.find((frame) => frame.id === loadout.frameId) || null;
  ssInstances['select-racquet']?.setValue(loadout.frameId);
  showFrameSpecs(racquet || null);

  if (loadout.isHybrid) {
    setHybridMode(true);
    ssInstances['select-string-mains']?.setValue(loadout.mainsId || '');
    ssInstances['select-string-crosses']?.setValue(loadout.crossesId || '');

    const mainsGauge = document.getElementById('gauge-select-mains') as HTMLSelectElement | null;
    const crossesGauge = document.getElementById('gauge-select-crosses') as HTMLSelectElement | null;
    if (mainsGauge && loadout.mainsId) {
      populateGaugeDropdown(mainsGauge, loadout.mainsId);
      mainsGauge.value = loadout.mainsGauge ? String(loadout.mainsGauge) : mainsGauge.value;
    } else {
      resetGaugeSelect('gauge-select-mains');
    }
    if (crossesGauge && loadout.crossesId) {
      populateGaugeDropdown(crossesGauge, loadout.crossesId);
      crossesGauge.value = loadout.crossesGauge ? String(loadout.crossesGauge) : crossesGauge.value;
    } else {
      resetGaugeSelect('gauge-select-crosses');
    }
    resetGaugeSelect('gauge-select-full');

    const mainsTension = document.getElementById('input-tension-mains') as HTMLInputElement | null;
    const crossesTension = document.getElementById('input-tension-crosses') as HTMLInputElement | null;
    if (mainsTension) mainsTension.value = String(loadout.mainsTension);
    if (crossesTension) crossesTension.value = String(loadout.crossesTension);
    return;
  }

  setHybridMode(false);
  ssInstances['select-string-full']?.setValue(loadout.stringId || '');
  const fullGauge = document.getElementById('gauge-select-full') as HTMLSelectElement | null;
  if (fullGauge && loadout.stringId) {
    populateGaugeDropdown(fullGauge, loadout.stringId);
    fullGauge.value = loadout.gauge ? String(loadout.gauge) : fullGauge.value;
  } else {
    resetGaugeSelect('gauge-select-full');
  }
  resetGaugeSelect('gauge-select-mains');
  resetGaugeSelect('gauge-select-crosses');

  const fullMainsTension = document.getElementById('input-tension-full-mains') as HTMLInputElement | null;
  const fullCrossesTension = document.getElementById('input-tension-full-crosses') as HTMLInputElement | null;
  if (fullMainsTension) fullMainsTension.value = String(loadout.mainsTension);
  if (fullCrossesTension) fullCrossesTension.value = String(loadout.crossesTension);
}

function DockActiveLoadoutCard() {
  const activeLoadout = useActiveLoadout();
  const dockEditorContext = useDockEditorContext();
  const obsRef = useRef<HTMLSpanElement>(null);
  const details = useMemo(() => getLoadoutDetails(activeLoadout), [activeLoadout]);
  const obsValue = getNumericObs(activeLoadout?.obs);
  const obsColor = obsValue > 0 ? getObsScoreColor(obsValue) : 'var(--dc-storm)';
  const saveDisabled = dockEditorContext.kind === 'compare-slot';
  const saveTitle = saveDisabled
    ? `Dock editor is updating compare slot ${dockEditorContext.slotId}`
    : activeLoadout?._dirty
      ? 'Unsaved changes'
      : 'Save to My Loadouts';

  useEffect(() => {
    const obsEl = obsRef.current;
    if (!obsEl) return;

    if (obsValue > 0 && _prevObsValues.dock != null && _prevObsValues.dock > 0) {
      animateOBS(obsEl, _prevObsValues.dock, obsValue, 400);
    } else {
      obsEl.textContent = obsValue > 0 ? obsValue.toFixed(1) : '\u2014';
    }
    _prevObsValues.dock = obsValue;
  }, [obsValue]);

  if (!activeLoadout) {
    return (
      <div id="dock-active-loadout">
        <div id="dock-lo-empty" className="border border-dc-border px-4 py-6 text-center">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-platinum mb-1">No active loadout</p>
          <p className="font-sans text-[11px] text-dc-storm">Search a racket or take the quiz</p>
        </div>

        <div id="dock-lo-active" className="hidden border border-dc-border"></div>
      </div>
    );
  }

  return (
    <div id="dock-active-loadout">
      <div id="dock-lo-empty" className="hidden border border-dc-border px-4 py-6 text-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-platinum mb-1">No active loadout</p>
        <p className="font-sans text-[11px] text-dc-storm">Search a racket or take the quiz</p>
      </div>

      <div id="dock-lo-active" className="border border-dc-border">
        <div className="flex gap-3 p-4 border-b border-dc-border">
          <div className="w-14 h-14 shrink-0 border border-dc-accent flex flex-col items-center justify-center" id="dock-lo-obs-ring" style={{ borderColor: obsColor }}>
            <span ref={obsRef} className="font-mono text-[18px] font-bold leading-none" id="dock-lo-obs-val" style={{ color: obsColor }}>
              {obsValue > 0 ? obsValue.toFixed(1) : '\u2014'}
            </span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <div className="font-sans text-[13px] font-semibold text-dc-platinum leading-tight truncate" id="dock-lo-name">{activeLoadout.name || '\u2014'}</div>
            <div className="font-mono text-[10px] text-dc-storm truncate" id="dock-lo-identity">{activeLoadout.identity || ''}</div>
            <div className="font-mono text-[10px] text-dc-storm truncate" id="dock-lo-details">{details.details}</div>
            <div
              className={`font-mono text-[9px] uppercase tracking-widest text-dc-storm mt-0.5 ${details.sourceLabel ? '' : 'hidden'}`}
              id="dock-lo-source"
              style={activeLoadout._dirty ? { color: 'var(--dc-warn)' } : undefined}
            >
              {details.sourceLabel}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3">
          <button
            className="flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] hover:text-dc-platinum hover:bg-dc-void-lift transition-colors border-r border-dc-border"
            onClick={() => saveActiveLoadout()}
            title={saveTitle}
            disabled={saveDisabled}
            style={saveDisabled
              ? { color: 'var(--dc-storm)', opacity: 0.45, pointerEvents: 'none' }
              : activeLoadout._dirty
                ? { color: 'var(--dc-warn)' }
                : undefined}
          >
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
  );
}

function DockMyLoadoutsPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedLoadouts = useSavedLoadouts();
  const activeLoadout = useActiveLoadout();
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);
  const model = useMemo(
    () => buildMyLoadoutsViewModel(savedLoadouts, activeLoadout, confirmingRemoveId),
    [activeLoadout, confirmingRemoveId, savedLoadouts],
  );

  useEffect(() => {
    if (confirmingRemoveId && !savedLoadouts.some((loadout) => loadout.id === confirmingRemoveId)) {
      setConfirmingRemoveId(null);
    }
  }, [confirmingRemoveId, savedLoadouts]);

  return (
    <div id="dock-my-loadouts">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] font-bold tracking-[0.25em] uppercase text-dc-storm flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          My Loadouts
        </span>
        <span className="font-mono text-[9px] font-bold text-dc-storm border border-dc-border px-1.5 py-0.5" id="dock-myl-count">{model.countLabel}</span>
      </div>

      <div className="flex flex-col border border-dc-border" id="dock-myl-list">
        <MyLoadoutsList
          model={model}
          onSwitchToLoadout={(id) => {
            setConfirmingRemoveId(null);
            switchToLoadout(id);
          }}
          onShareLoadout={(id) => {
            setConfirmingRemoveId(null);
            shareLoadout(id);
          }}
          onAddLoadoutToCompare={(id) => {
            setConfirmingRemoveId(null);
            addLoadoutToCompare(id);
          }}
          onConfirmRemoveLoadout={(id) => setConfirmingRemoveId(id)}
          onRemoveLoadout={(id) => {
            setConfirmingRemoveId(null);
            removeLoadout(id);
          }}
          onCancelRemoveLoadout={() => setConfirmingRemoveId(null)}
        />
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
  );
}

export function BuildDock() {
  const activeLoadout = useActiveLoadout();
  const savedLoadouts = useSavedLoadouts();
  const comparisonSlots = useComparisonSlots();
  const dockEditorContext = useDockEditorContext();
  const mobileObsRef = useRef<HTMLSpanElement>(null);
  const [compareEditorDirty, setCompareEditorDirtyState] = useState(() => getCompareEditorDirty());
  const activeObs = getNumericObs(activeLoadout?.obs);
  const railObsDisplay = activeObs > 0 ? activeObs.toFixed(1) : '\u2014';
  const railObsColor = activeObs > 0 ? getObsScoreColor(activeObs) : 'var(--dc-storm)';
  const editorTitle = dockEditorContext.kind === 'compare-slot'
    ? `Edit Compare Slot ${dockEditorContext.slotId}`
    : dockEditorContext.kind === 'compare-overview'
      ? 'Compare Slot Editor'
      : 'Edit Active Loadout';
  const compareCopy = compareEditorDirty
    ? `Draft changes are ready for compare slot ${dockEditorContext.kind === 'compare-slot' ? dockEditorContext.slotId : ''}.`
    : `Editing compare slot ${dockEditorContext.kind === 'compare-slot' ? dockEditorContext.slotId : ''}. Make changes, then apply them here.`;
  const editorTargetLoadout = useMemo(() => {
    if (dockEditorContext.kind === 'active') return activeLoadout;
    if (dockEditorContext.kind === 'compare-slot') {
      return comparisonSlots.find((slot) => String(slot.id) === String(dockEditorContext.slotId))?.loadout ?? activeLoadout ?? null;
    }
    return null;
  }, [activeLoadout, comparisonSlots, dockEditorContext]);

  useEffect(() => {
    _initDockCollapse();

    const dock = document.getElementById('build-dock');
    const dockBackdrop = document.getElementById('dock-backdrop');
    if (!dock || !dockBackdrop) return;

    const handleDockScroll = () => {
      dock.classList.toggle('dock-scrolled', dock.scrollTop > 0);
    };
    const handleDockBackdropClick = () => {
      if (dock.classList.contains('dock-expanded')) {
        toggleMobileDock();
      }
    };

    handleDockScroll();
    dock.addEventListener('scroll', handleDockScroll, { passive: true });
    dockBackdrop.addEventListener('click', handleDockBackdropClick);

    return () => {
      dock.removeEventListener('scroll', handleDockScroll);
      dockBackdrop.removeEventListener('click', handleDockBackdropClick);
    };
  }, []);

  useEffect(() => {
    const obsEl = mobileObsRef.current;
    if (!obsEl) return;

    if (activeObs > 0 && _prevObsValues.mobile != null && _prevObsValues.mobile > 0) {
      animateOBS(obsEl, _prevObsValues.mobile, activeObs, 400);
    } else {
      obsEl.textContent = activeObs > 0 ? activeObs.toFixed(1) : '';
    }
    _prevObsValues.mobile = activeObs;
  }, [activeObs]);

  useEffect(() => subscribeCompareEditorDirty(() => {
    setCompareEditorDirtyState(getCompareEditorDirty());
  }), []);

  useEffect(() => {
    if (dockEditorContext.kind === 'compare-overview') return;
    syncDockEditorFields(editorTargetLoadout);
  }, [dockEditorContext.kind, dockEditorContext.kind === 'compare-slot' ? dockEditorContext.slotId : '', editorTargetLoadout]);

  return (
    <>
      <aside className="build-dock" id="build-dock">
        <div className="dock-rail" id="dock-rail">
          <button className="dock-rail-expand" onClick={() => toggleDockCollapse()} title="Expand dock">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="6 4 10 8 6 12"/></svg>
          </button>
          <div className="dock-rail-obs" id="dock-rail-obs" style={{ color: railObsColor }}>{railObsDisplay}</div>
          <div className="dock-rail-count" id="dock-rail-count">{savedLoadouts.length}</div>
        </div>

        <div className="builder-panel flex flex-col gap-4 min-w-0" id="builder-panel">
          <div className="flex justify-end">
            <button className="w-7 h-7 flex items-center justify-center border border-dc-border bg-transparent text-dc-storm hover:text-dc-platinum hover:border-dc-border-hover transition-colors" onClick={() => toggleDockCollapse()} title="Collapse dock">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="8 2 4 6 8 10"/></svg>
            </button>
          </div>

          <DockActiveLoadoutCard />

          <div id="dock-context-panel" className="dock-context-panel"></div>

          <DockMyLoadoutsPanel />

          <div id="dock-create-area"></div>

          <details className="dock-editor-details" id="dock-editor-section">
            <summary className="dock-editor-summary">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.5 1.5l2 2-7.5 7.5H3v-2L10.5 1.5z"/></svg>
              <span id="dock-editor-title">{editorTitle}</span>
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
                    <select id="gauge-select-full" className="gauge-select" disabled><option value="">\u2014</option></select>
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
                        <select id="gauge-select-mains" className="gauge-select" disabled><option value="">\u2014</option></select>
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
                        <select id="gauge-select-crosses" className="gauge-select" disabled><option value="">\u2014</option></select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.15em]">Tension</span>
                        <input type="number" id="input-tension-crosses" className="text-input" min="30" max="70" defaultValue="53" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`dock-editor-compare-actions ${dockEditorContext.kind === 'compare-slot' ? '' : 'hidden'}`} id="dock-editor-compare-actions">
                <div className="dock-editor-compare-copy" id="dock-editor-compare-copy">{compareCopy}</div>
                <div className="dock-editor-compare-row">
                  <button className="dock-editor-compare-btn" type="button" onClick={() => cancelCompareSlotEditing()}>Cancel</button>
                  <button className="dock-editor-compare-btn dock-editor-compare-btn-primary" id="dock-editor-compare-apply" type="button" onClick={() => applyDockEditorChanges()} disabled={!compareEditorDirty}>Apply To Slot</button>
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
            <span ref={mobileObsRef} className="dock-mob-obs" id="dock-mob-obs">{activeObs > 0 ? activeObs.toFixed(1) : ''}</span>
            <span className="dock-mob-label" id="dock-mob-label">{activeLoadout?.name || 'No active loadout'}</span>
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
