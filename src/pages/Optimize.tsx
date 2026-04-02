import { useEffect, useMemo, useRef, useState } from 'react';
import { HardwareMount } from '../components/HardwareMount.js';
import { RACQUETS, STRINGS } from '../data/loader.js';
import type { Loadout, Racquet, SetupAttributes, StringData } from '../engine/types.js';
import { createLoadout, saveLoadout } from '../state/loadout.js';
import { useActiveLoadout, useCurrentSetup } from '../hooks/useStore.js';
import { buildOptimizeBrandChecksVm, buildOptimizeExcludeTagsVm, buildOptimizeMaterialChecksVm, buildOptimizeMultiselectLabel } from '../ui/pages/optimize-filters-vm.js';
import { buildOptimizeResultsViewModel, getOptimizeCandidateKey, type OptimizeCandidateVmSource } from '../ui/pages/optimize-results-vm.js';
import { OptimizeMultiselectChecks } from '../components/optimize/OptimizeMultiselectChecks.js';
import { OptimizeExcludeTags } from '../components/optimize/OptimizeExcludeTags.js';
import { OptimizeUpgradePanel } from '../components/optimize/OptimizeUpgradePanel.js';
import { OptimizeResultsTable } from '../components/optimize/OptimizeResultsTable.js';
import { OptimizeSearchDropdown } from '../components/optimize/OptimizeSearchDropdown.js';
import { getScoredSetup, STRING_BRANDS, STRING_MATERIALS } from '../utils/performance.js';
import { addLoadoutToNextAvailableSlot } from '../ui/pages/compare/compare-slot-api.js';
import { activateLoadout, switchMode } from '../ui/pages/shell.js';
import { getOptimizeRouteState, setOptimizeRouteState, type OptimizeSetupType, type OptimizeStatMinimums } from '../ui/pages/optimize-route-state.js';
import { optimizerDtosToCandidates, runOptimizerScanAsync } from '../workers/engine-worker-client.js';

type OptimizeCandidate = OptimizeCandidateVmSource;
type SortBy = 'obs' | 'spin' | 'control' | 'power' | 'comfort' | 'feel' | 'durability' | 'playability' | 'maneuverability' | 'stability';
type LockSide = 'none' | 'mains' | 'crosses';

const DEFAULT_STAT_MINIMUMS: OptimizeStatMinimums = {
  spin: 0,
  control: 0,
  power: 0,
  comfort: 0,
  feel: 0,
  durability: 0,
  playability: 0,
  stability: 0,
  maneuverability: 0,
};

function resolveInitialFrame(activeLoadout: Loadout | null, currentSetup: ReturnType<typeof useCurrentSetup>) {
  const routeState = getOptimizeRouteState();
  if (routeState.frameId && routeState.frameName) {
    return { frameId: routeState.frameId, frameQuery: routeState.frameName, routeState };
  }
  if (activeLoadout?.frameId) {
    const racquet = (RACQUETS as Racquet[]).find((entry) => entry.id === activeLoadout.frameId);
    if (racquet) return { frameId: racquet.id, frameQuery: racquet.name, routeState };
  }
  if (currentSetup?.racquet) {
    return { frameId: currentSetup.racquet.id, frameQuery: currentSetup.racquet.name, routeState };
  }
  const fallback = (RACQUETS as Racquet[])[0] || null;
  return {
    frameId: fallback?.id || '',
    frameQuery: fallback?.name || '',
    routeState,
  };
}

function createOptimizerLoadout(candidate: OptimizeCandidate) {
  if (candidate.type === 'hybrid') {
    return createLoadout(candidate.racquet.id, candidate.mainsData?.id || null, candidate.tension, {
      source: 'optimize',
      isHybrid: true,
      mainsId: candidate.mainsData?.id || null,
      crossesId: candidate.crossesData?.id || null,
      crossesTension: candidate.crossesTension,
    });
  }

  return createLoadout(candidate.racquet.id, candidate.stringData?.id || null, candidate.tension, {
    source: 'optimize',
    isHybrid: false,
    crossesTension: candidate.tension,
  });
}

function savePreviousActiveLoadout(activeLoadout: Loadout | null, nextLoadout: Loadout): void {
  if (!activeLoadout || !activeLoadout.id) return;

  const isSameBuild =
    activeLoadout.frameId === nextLoadout.frameId &&
    (activeLoadout.stringId || '') === (nextLoadout.stringId || '') &&
    !!activeLoadout.isHybrid === !!nextLoadout.isHybrid &&
    (activeLoadout.mainsId || '') === (nextLoadout.mainsId || '') &&
    (activeLoadout.crossesId || '') === (nextLoadout.crossesId || '') &&
    (activeLoadout.mainsTension || 0) === (nextLoadout.mainsTension || 0) &&
    (activeLoadout.crossesTension || 0) === (nextLoadout.crossesTension || 0);

  if (!isSameBuild) {
    saveLoadout(activeLoadout);
  }
}

export function Optimize() {
  const activeLoadout = useActiveLoadout();
  const currentSetup = useCurrentSetup();
  const initialFrame = useMemo(() => resolveInitialFrame(activeLoadout, currentSetup), [activeLoadout, currentSetup]);

  const [frameQuery, setFrameQuery] = useState(initialFrame.frameQuery);
  const [frameId, setFrameId] = useState(initialFrame.frameId);
  const [setupType, setSetupType] = useState<OptimizeSetupType>((initialFrame.routeState.setupType as OptimizeSetupType | undefined) || 'both');
  const [lockSide, setLockSide] = useState<LockSide>((initialFrame.routeState.lockSide as LockSide | undefined) || 'none');
  const [lockQuery, setLockQuery] = useState(initialFrame.routeState.lockQuery || '');
  const [lockStringId, setLockStringId] = useState(initialFrame.routeState.lockStringId || '');
  const [excludeQuery, setExcludeQuery] = useState(initialFrame.routeState.excludeQuery || '');
  const [allowedMaterials, setAllowedMaterials] = useState<string[]>(() => initialFrame.routeState.allowedMaterials || [...STRING_MATERIALS]);
  const [allowedBrands, setAllowedBrands] = useState<string[]>(() => initialFrame.routeState.allowedBrands || [...STRING_BRANDS]);
  const [excludedStringIds, setExcludedStringIds] = useState<string[]>(() => initialFrame.routeState.excludedStringIds || []);
  const [sortBy, setSortBy] = useState<SortBy>((initialFrame.routeState.sortBy as SortBy | undefined) || 'obs');
  const [mins, setMins] = useState<OptimizeStatMinimums>(() => ({ ...DEFAULT_STAT_MINIMUMS, ...(initialFrame.routeState.mins || {}) }));
  const [tensionMin, setTensionMin] = useState(initialFrame.routeState.tensionMin ?? 40);
  const [tensionMax, setTensionMax] = useState(initialFrame.routeState.tensionMax ?? 65);
  const [upgradeMode, setUpgradeMode] = useState(initialFrame.routeState.upgradeMode ?? false);
  const [upgradeObs, setUpgradeObs] = useState(initialFrame.routeState.upgradeObs ?? 0);
  const [upgradeCtlLoss, setUpgradeCtlLoss] = useState(initialFrame.routeState.upgradeCtlLoss ?? 5);
  const [upgradeDurLoss, setUpgradeDurLoss] = useState(initialFrame.routeState.upgradeDurLoss ?? 10);
  const [filtersCollapsed, setFiltersCollapsed] = useState(initialFrame.routeState.filtersCollapsed ?? false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [targetTension, setTargetTension] = useState(initialFrame.routeState.targetTension || '');
  const [candidates, setCandidates] = useState<OptimizeCandidate[] | null>(() => (initialFrame.routeState.candidates as OptimizeCandidate[] | null | undefined) ?? []);
  const [hasRun, setHasRun] = useState(initialFrame.routeState.hasRun ?? false);
  const [isRunning, setIsRunning] = useState(initialFrame.routeState.isRunning ?? false);
  const [savedCandidateKey, setSavedCandidateKey] = useState<string | null>(initialFrame.routeState.savedCandidateKey ?? null);

  const materialRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLDivElement | null>(null);
  const runTokenRef = useRef(0);
  const savedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const sync = () => {
      setFiltersCollapsed((current) => {
        if (initialFrame.routeState.filtersCollapsed != null) {
          return current;
        }
        return media.matches;
      });
    };
    if (initialFrame.routeState.filtersCollapsed == null) {
      sync();
    }
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [initialFrame.routeState.filtersCollapsed]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (materialRef.current && !materialRef.current.contains(target)) {
        setMaterialOpen(false);
      }
      if (brandRef.current && !brandRef.current.contains(target)) {
        setBrandOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    if (!initialFrame.routeState.autorun) return;
    setOptimizeRouteState({ autorun: false });
    queueMicrotask(() => {
      void handleRun();
    });
  }, []);

  useEffect(() => {
    setOptimizeRouteState({
      frameId,
      frameName: frameQuery,
      setupType,
      lockSide,
      lockQuery,
      lockStringId,
      excludeQuery,
      allowedMaterials,
      allowedBrands,
      excludedStringIds,
      sortBy,
      tensionMin,
      tensionMax,
      mins,
      upgradeMode,
      upgradeObs,
      upgradeCtlLoss,
      upgradeDurLoss,
      filtersCollapsed,
      targetTension,
      hasRun,
      isRunning,
      savedCandidateKey,
      candidates,
    });
  }, [
    allowedBrands,
    allowedMaterials,
    candidates,
    excludeQuery,
    excludedStringIds,
    filtersCollapsed,
    frameId,
    frameQuery,
    hasRun,
    isRunning,
    lockQuery,
    lockSide,
    lockStringId,
    mins,
    savedCandidateKey,
    setupType,
    sortBy,
    targetTension,
    tensionMax,
    tensionMin,
    upgradeCtlLoss,
    upgradeDurLoss,
    upgradeMode,
    upgradeObs,
  ]);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current != null) {
        window.clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  const allowedMaterialSet = useMemo(() => new Set(allowedMaterials), [allowedMaterials]);
  const allowedBrandSet = useMemo(() => new Set(allowedBrands), [allowedBrands]);
  const excludedStringIdSet = useMemo(() => new Set(excludedStringIds), [excludedStringIds]);

  const currentScore = useMemo(() => {
    if (!currentSetup) return { obs: 0, stats: null as SetupAttributes | null };
    const scored = getScoredSetup(currentSetup);
    return { obs: scored.obs, stats: scored.stats };
  }, [currentSetup]);

  const materialVm = useMemo(() => buildOptimizeMaterialChecksVm(STRING_MATERIALS, allowedMaterialSet), [allowedMaterialSet]);
  const brandVm = useMemo(() => buildOptimizeBrandChecksVm(STRING_BRANDS, allowedBrandSet), [allowedBrandSet]);
  const excludeTagsVm = useMemo(() => buildOptimizeExcludeTagsVm(excludedStringIdSet, STRINGS as StringData[]), [excludedStringIdSet]);
  const materialLabel = useMemo(() => buildOptimizeMultiselectLabel('material', STRING_MATERIALS.length, allowedMaterialSet, STRING_MATERIALS), [allowedMaterialSet]);
  const brandLabel = useMemo(() => buildOptimizeMultiselectLabel('brand', STRING_BRANDS.length, allowedBrandSet, STRING_BRANDS), [allowedBrandSet]);

  const frameItems = useMemo(() => (RACQUETS as Racquet[]).map((racquet) => ({ id: racquet.id, name: racquet.name })), []);
  const lockItems = useMemo(() => (STRINGS as StringData[]).map((stringItem) => ({ id: stringItem.id, name: stringItem.name })), []);
  const excludeItems = useMemo(
    () => (STRINGS as StringData[]).filter((entry) => !excludedStringIdSet.has(entry.id)).map((entry) => ({ id: entry.id, name: entry.name })),
    [excludedStringIdSet],
  );

  const filteredStrings = useMemo(() => {
    return (STRINGS as StringData[]).filter((stringItem) => {
      if (excludedStringIdSet.has(stringItem.id)) return false;
      if (!allowedMaterialSet.has(stringItem.material)) return false;
      if (!allowedBrandSet.has(stringItem.name.split(' ')[0])) return false;
      return true;
    });
  }, [allowedBrandSet, allowedMaterialSet, excludedStringIdSet]);

  const sortedCandidates = useMemo(() => {
    if (candidates === null) return null;
    const list = [...candidates];
    list.sort((left, right) => {
      if (sortBy === 'obs') return right.score - left.score;
      return ((right.stats as unknown as Record<string, number>)[sortBy] || 0) - ((left.stats as unknown as Record<string, number>)[sortBy] || 0);
    });
    return list;
  }, [candidates, sortBy]);

  const displayedCandidates = useMemo(() => {
    if (!sortedCandidates) return [];
    if (targetTension === '' || Number.isNaN(parseInt(targetTension, 10))) return sortedCandidates;
    const target = parseInt(targetTension, 10);
    return sortedCandidates.filter((candidate) => Math.abs(candidate.tension - target) <= 1);
  }, [sortedCandidates, targetTension]);

  const resultsModel = useMemo(
    () => buildOptimizeResultsViewModel(isRunning ? null : sortedCandidates, currentScore.obs, targetTension, savedCandidateKey, sortBy),
    [currentScore.obs, isRunning, savedCandidateKey, sortBy, sortedCandidates, targetTension],
  );

  async function handleRun() {
    const racquet = (RACQUETS as Racquet[]).find((entry) => entry.id === frameId) || (RACQUETS as Racquet[])[0];
    if (!racquet) return;

    const nextRunToken = ++runTokenRef.current;
    setHasRun(true);
    setIsRunning(true);
    setCandidates(null);
    setTargetTension('');

    try {
      const dtos = await runOptimizerScanAsync({
        racquetId: racquet.id,
        filteredStringIds: filteredStrings.map((entry) => entry.id),
        setupType,
        lockSide,
        lockStringId: lockStringId || null,
        tensionMin,
        tensionMax,
        sortBy,
        mins,
        upgradeMode,
        currentOBS: currentScore.obs,
        currentStats: currentScore.stats,
        upgradeOBS: upgradeObs,
        upgradeCtlLoss,
        upgradeDurLoss,
      });

      if (nextRunToken !== runTokenRef.current) return;
      setCandidates(optimizerDtosToCandidates(dtos, racquet) as OptimizeCandidate[]);
    } catch (_error) {
      if (nextRunToken !== runTokenRef.current) return;
      setCandidates([]);
    } finally {
      if (nextRunToken === runTokenRef.current) {
        setIsRunning(false);
      }
    }
  }

  function updateMin(key: keyof OptimizeStatMinimums, value: string) {
    const parsed = parseInt(value || '0', 10);
    setMins((current) => ({ ...current, [key]: Number.isNaN(parsed) ? 0 : parsed }));
  }

  function toggleAllowedValue(values: string[], nextValue: string, checked: boolean) {
    if (checked) return [...values, nextValue].filter((value, index, all) => all.indexOf(value) === index);
    return values.filter((value) => value !== nextValue);
  }

  function getCandidateAt(rowIndex: number) {
    return displayedCandidates[rowIndex] || null;
  }

  function handleView(rowIndex: number) {
    const candidate = getCandidateAt(rowIndex);
    if (!candidate) return;
    const loadout = createOptimizerLoadout(candidate);
    if (!loadout) return;
    savePreviousActiveLoadout(activeLoadout, loadout);
    activateLoadout(loadout);
    switchMode('overview');
  }

  function handleTune(rowIndex: number) {
    const candidate = getCandidateAt(rowIndex);
    if (!candidate) return;
    const loadout = createOptimizerLoadout(candidate);
    if (!loadout) return;
    savePreviousActiveLoadout(activeLoadout, loadout);
    activateLoadout(loadout);
    switchMode('tune');
  }

  function handleCompare(rowIndex: number) {
    const candidate = getCandidateAt(rowIndex);
    if (!candidate) return;
    const loadout = createOptimizerLoadout(candidate);
    if (!loadout) return;
    const slotId = addLoadoutToNextAvailableSlot(loadout);
    if (!slotId) {
      window.alert('All 3 compare slots are already filled. Remove one before adding an optimizer result.');
      return;
    }
    switchMode('compare');
  }

  function handleSave(rowIndex: number) {
    const candidate = getCandidateAt(rowIndex);
    if (!candidate) return;
    const loadout = createOptimizerLoadout(candidate);
    if (loadout) {
      saveLoadout(loadout);
    }
    const nextKey = getOptimizeCandidateKey(candidate);
    setSavedCandidateKey(nextKey);
    if (savedTimeoutRef.current != null) {
      window.clearTimeout(savedTimeoutRef.current);
    }
    savedTimeoutRef.current = window.setTimeout(() => {
      setSavedCandidateKey(null);
      savedTimeoutRef.current = null;
    }, 1200);
  }

  return (
    <section className="workspace-mode" id="mode-optimize" data-mode="optimize">
      <HardwareMount>
        <div className="opt-layout">
          <button
            id="opt-filter-toggle"
            className={`opt-filter-toggle${filtersCollapsed ? '' : ' filters-open'}`}
            type="button"
            onClick={() => setFiltersCollapsed((current) => !current)}
          >
            <span>Filters</span>
            <svg className="opt-filter-toggle-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4.5h10M4 7h6M6 9.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <aside className={`opt-filters${filtersCollapsed ? ' opt-filters-collapsed' : ''}`} id="opt-filters">
            <div className="opt-filter-header">
              <h3 className="opt-filter-title">Optimizer</h3>
              <button className="opt-run-btn" id="opt-run-btn" type="button" onClick={() => void handleRun()}>
                Search
              </button>
            </div>

            <div className="opt-filter-section">
              <label className="opt-label">Frame</label>
              <div id="opt-react-frame-search-root">
                <OptimizeSearchDropdown
                  inputId="opt-frame-search"
                  dropdownId="opt-frame-dropdown"
                  hiddenId="opt-frame-value"
                  placeholder="Search frames..."
                  items={frameItems}
                  query={frameQuery}
                  hiddenValue={frameId}
                  onQueryChange={setFrameQuery}
                  onSelectItem={(id, name) => {
                    setFrameId(id);
                    setFrameQuery(name);
                  }}
                />
              </div>
            </div>

            <div className="opt-filter-section">
              <label className="opt-label">Setup Type</label>
              <div className="opt-toggle-group">
                <button className={`opt-toggle${setupType === 'both' ? ' active' : ''}`} data-value="both" id="opt-type-both" type="button" onClick={() => setSetupType('both')}>
                  Both
                </button>
                <button className={`opt-toggle${setupType === 'full' ? ' active' : ''}`} data-value="full" id="opt-type-full" type="button" onClick={() => setSetupType('full')}>
                  Full Bed
                </button>
                <button className={`opt-toggle${setupType === 'hybrid' ? ' active' : ''}`} data-value="hybrid" id="opt-type-hybrid" type="button" onClick={() => setSetupType('hybrid')}>
                  Hybrid
                </button>
              </div>
            </div>

            <div className={`opt-filter-section opt-hybrid-lock${setupType === 'full' ? ' hidden' : ''}`} id="opt-hybrid-lock-section">
              <label className="opt-label">Lock String</label>
              <div className="opt-lock-row">
                <select id="opt-lock-side" className="opt-select opt-select-sm" value={lockSide} onChange={(event) => setLockSide(event.target.value as LockSide)}>
                  <option value="none">None</option>
                  <option value="mains">Lock Mains</option>
                  <option value="crosses">Lock Crosses</option>
                </select>
              </div>
              <div className={`opt-lock-string-wrap${lockSide === 'none' ? ' hidden' : ''}`} id="opt-lock-string-wrap">
                <div id="opt-react-lock-search-root">
                  <OptimizeSearchDropdown
                    inputId="opt-lock-string-search"
                    dropdownId="opt-lock-string-dropdown"
                    hiddenId="opt-lock-string-value"
                    placeholder="Search strings..."
                    items={lockItems}
                    query={lockQuery}
                    hiddenValue={lockStringId}
                    onQueryChange={setLockQuery}
                    onSelectItem={(id, name) => {
                      setLockStringId(id);
                      setLockQuery(name);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="opt-filter-section">
              <label className="opt-label">Material</label>
              <div className="opt-multiselect" id="opt-material-ms" ref={materialRef}>
                <button className="opt-ms-trigger" type="button" onClick={() => { setMaterialOpen((current) => !current); setBrandOpen(false); }}>
                  <span className="opt-ms-label" id="opt-material-ms-label">{materialLabel}</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="2 4 5 7 8 4" />
                  </svg>
                </button>
                <div className={`opt-ms-dropdown${materialOpen ? '' : ' hidden'}`} id="opt-material-checks">
                  <OptimizeMultiselectChecks rows={materialVm} onToggle={(value, checked) => setAllowedMaterials((current) => toggleAllowedValue(current, value, checked))} />
                </div>
              </div>
            </div>

            <div className="opt-filter-section">
              <label className="opt-label">Brand</label>
              <div className="opt-multiselect" id="opt-brand-ms" ref={brandRef}>
                <button className="opt-ms-trigger" type="button" onClick={() => { setBrandOpen((current) => !current); setMaterialOpen(false); }}>
                  <span className="opt-ms-label" id="opt-brand-ms-label">{brandLabel}</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="2 4 5 7 8 4" />
                  </svg>
                </button>
                <div className={`opt-ms-dropdown${brandOpen ? '' : ' hidden'}`} id="opt-brand-checks">
                  <OptimizeMultiselectChecks rows={brandVm} onToggle={(value, checked) => setAllowedBrands((current) => toggleAllowedValue(current, value, checked))} />
                </div>
              </div>
            </div>

            <div className="opt-filter-section">
              <label className="opt-label">Exclude Strings</label>
              <div className="opt-exclude-wrap">
                <div id="opt-react-exclude-search-root">
                  <OptimizeSearchDropdown
                    inputId="opt-exclude-search"
                    dropdownId="opt-exclude-dropdown"
                    hiddenId={null}
                    placeholder="Search to exclude..."
                    items={excludeItems}
                    query={excludeQuery}
                    onQueryChange={setExcludeQuery}
                    onSelectItem={(id) => {
                      setExcludedStringIds((current) => [...current, id].filter((value, index, all) => all.indexOf(value) === index));
                      setExcludeQuery('');
                    }}
                  />
                </div>
              </div>
              <div className="opt-exclude-tags" id="opt-exclude-tags">
                <OptimizeExcludeTags tags={excludeTagsVm} onRemove={(id) => setExcludedStringIds((current) => current.filter((value) => value !== id))} />
              </div>
            </div>

            <div className="opt-filter-section">
              <label className="opt-label">Sort By</label>
              <select id="opt-sort" className="opt-select" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
                <option value="obs">OBS (Overall)</option>
                <option value="spin">Spin</option>
                <option value="control">Control</option>
                <option value="power">Power</option>
                <option value="comfort">Comfort</option>
                <option value="feel">Feel</option>
                <option value="durability">Durability</option>
                <option value="playability">Playability</option>
                <option value="maneuverability">Maneuverability</option>
                <option value="stability">Stability</option>
              </select>
            </div>

            <details className="opt-filter-section opt-min-details">
              <summary className="opt-min-summary">Stat minimums</summary>
              <div className="opt-min-grid">
                <div className="opt-min-row"><span>Spin</span><input type="number" id="opt-min-spin" className="opt-min-input" min="0" max="100" value={mins.spin} placeholder="0" onChange={(event) => updateMin('spin', event.target.value)} /></div>
                <div className="opt-min-row"><span>Control</span><input type="number" id="opt-min-control" className="opt-min-input" min="0" max="100" value={mins.control} placeholder="0" onChange={(event) => updateMin('control', event.target.value)} /></div>
                <div className="opt-min-row"><span>Power</span><input type="number" id="opt-min-power" className="opt-min-input" min="0" max="100" value={mins.power} placeholder="0" onChange={(event) => updateMin('power', event.target.value)} /></div>
                <div className="opt-min-row"><span>Comfort</span><input type="number" id="opt-min-comfort" className="opt-min-input" min="0" max="100" value={mins.comfort} placeholder="0" onChange={(event) => updateMin('comfort', event.target.value)} /></div>
                <div className="opt-min-row"><span>Feel</span><input type="number" id="opt-min-feel" className="opt-min-input" min="0" max="100" value={mins.feel} placeholder="0" onChange={(event) => updateMin('feel', event.target.value)} /></div>
                <div className="opt-min-row"><span>Durability</span><input type="number" id="opt-min-durability" className="opt-min-input" min="0" max="100" value={mins.durability} placeholder="0" onChange={(event) => updateMin('durability', event.target.value)} /></div>
                <div className="opt-min-row"><span>Playability</span><input type="number" id="opt-min-playability" className="opt-min-input" min="0" max="100" value={mins.playability} placeholder="0" onChange={(event) => updateMin('playability', event.target.value)} /></div>
                <div className="opt-min-row"><span>Stability</span><input type="number" id="opt-min-stability" className="opt-min-input" min="0" max="100" value={mins.stability} placeholder="0" onChange={(event) => updateMin('stability', event.target.value)} /></div>
                <div className="opt-min-row"><span>Maneuverability</span><input type="number" id="opt-min-maneuverability" className="opt-min-input" min="0" max="100" value={mins.maneuverability} placeholder="0" onChange={(event) => updateMin('maneuverability', event.target.value)} /></div>
              </div>
            </details>

            <div className="opt-filter-section">
              <label className="opt-label">Tension Range</label>
              <div className="opt-tension-range">
                <input type="number" id="opt-tension-min" className="opt-min-input" min="30" max="75" value={tensionMin} placeholder="Min" onChange={(event) => setTensionMin(parseInt(event.target.value || '40', 10) || 40)} />
                <span className="opt-range-sep">-</span>
                <input type="number" id="opt-tension-max" className="opt-min-input" min="30" max="75" value={tensionMax} placeholder="Max" onChange={(event) => setTensionMax(parseInt(event.target.value || '65', 10) || 65)} />
              </div>
            </div>

            <div className="opt-filter-section">
              <label className="opt-label">Upgrade Mode</label>
              <div id="opt-react-upgrade-checkbox-root">
                <OptimizeUpgradePanel upgradeMode={upgradeMode} onUpgradeModeChange={setUpgradeMode} />
              </div>
              <div className={`opt-upgrade-fields${upgradeMode ? '' : ' hidden'}`} id="opt-upgrade-fields">
                <div className="opt-min-row"><span>OBS &ge; current +</span><input type="number" id="opt-upgrade-obs" className="opt-min-input" value={upgradeObs} placeholder="0" onChange={(event) => setUpgradeObs(parseFloat(event.target.value || '0') || 0)} /></div>
                <div className="opt-min-row"><span>Max control loss</span><input type="number" id="opt-upgrade-ctl-loss" className="opt-min-input" value={upgradeCtlLoss} placeholder="5" onChange={(event) => setUpgradeCtlLoss(parseFloat(event.target.value || '5') || 5)} /></div>
                <div className="opt-min-row"><span>Max durability loss</span><input type="number" id="opt-upgrade-dur-loss" className="opt-min-input" value={upgradeDurLoss} placeholder="10" onChange={(event) => setUpgradeDurLoss(parseFloat(event.target.value || '10') || 10)} /></div>
              </div>
            </div>

            <div className="opt-results-count" id="opt-results-count">
              {sortedCandidates ? `${sortedCandidates.length} result${sortedCandidates.length !== 1 ? 's' : ''}` : isRunning ? 'Running...' : '0 results'}
            </div>
          </aside>

          <div className="opt-results" id="opt-results">
            {hasRun ? (
              <OptimizeResultsTable
                model={resultsModel}
                onTargetTensionChange={setTargetTension}
                onClearTargetTension={() => setTargetTension('')}
                onView={handleView}
                onTune={handleTune}
                onCompare={handleCompare}
                onSave={handleSave}
              />
            ) : (
              <div className="opt-empty">
                <p className="opt-empty-title">Configure filters and hit Search</p>
                <p className="opt-empty-sub">The optimizer will generate and rank builds using the full prediction engine.</p>
              </div>
            )}
          </div>
        </div>
      </HardwareMount>
    </section>
  );
}
