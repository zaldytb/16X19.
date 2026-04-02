import { useEffect, useMemo, useState } from 'react';
import { SearchableSelectMount } from '../SearchableSelectMount.js';
import { StringCompendiumHud } from './StringCompendiumHud.js';
import { StringCompendiumRoster } from '../strings/StringCompendiumRoster.js';
import { StringCompendiumDetail } from '../strings/StringCompendiumDetail.js';
import { StringFrameInjectionModulator } from '../strings/StringFrameInjectionModulator.js';
import { RACQUETS, STRINGS } from '../../data/loader.js';
import { GAUGE_LABELS, applyGaugeModifier, buildTensionContext, calcFrameBase, computeCompositeScore, getGaugeOptions, predictSetup } from '../../engine/index.js';
import type { Racquet, SetupStats, StringConfig, StringData } from '../../engine/types.js';
import { createLoadout, saveLoadout } from '../../state/loadout.js';
import { useCurrentSetup } from '../../hooks/useStore.js';
import { filterStringsForHud, type StringHudFilters } from '../../ui/pages/string-hud-filters-vm.js';
import { buildStringCompendiumDetailVm } from '../../ui/pages/string-compendium-detail-vm.js';
import { activateLoadout, switchMode } from '../../ui/pages/shell.js';

type StringMode = 'fullbed' | 'hybrid';

interface StringCompendiumTabProps {
  focusedStringId?: string | null;
  onGoToFrame: (racquetId: string) => void;
}

const EMPTY_FILTERS: StringHudFilters = {
  search: '',
  material: '',
  shape: '',
  stiffness: '',
};

function getArchetype(stringItem: StringData): string {
  const scores = stringItem.twScore || {};
  if ((scores.spin || 0) >= 85 && (scores.control || 0) >= 80) return 'Spin Control';
  if ((scores.spin || 0) >= 85) return 'Spin Focus';
  if ((scores.control || 0) >= 85) return 'Control';
  if ((scores.power || 0) >= 75) return 'Power';
  if ((scores.comfort || 0) >= 80) return 'Comfort';
  if ((scores.durability || 0) >= 85) return 'Durability';
  return 'All-Rounder';
}

function getFrameIdentityLabel(racquet: Racquet): string {
  const identity = typeof racquet.identity === 'string' ? racquet.identity : '';
  return identity || racquet.pattern;
}

function buildPills(stringItem: StringData) {
  const scores = stringItem.twScore || {};
  const bestFor: string[] = [];
  const watchOut: string[] = [];
  if ((scores.spin || 0) >= 85) bestFor.push('SPIN GENERATION');
  if ((scores.control || 0) >= 85) bestFor.push('PRECISION SHOTS');
  if ((scores.power || 0) >= 75) bestFor.push('FREE POWER');
  if ((scores.comfort || 0) >= 80) bestFor.push('ARM COMFORT');
  if ((scores.durability || 0) >= 85) bestFor.push('LONGEVITY');
  if ((scores.playabilityDuration || 0) >= 85) bestFor.push('TENSION MAINTENANCE');
  if ((scores.comfort || 0) < 60) watchOut.push('STIFF FEEL');
  if ((scores.durability || 0) < 60) watchOut.push('FAST BREAKAGE');
  if ((stringItem.tensionLoss || 0) > 30) watchOut.push('HIGH TENSION DROP');
  if ((scores.power || 0) < 50) watchOut.push('LOW POWER OUTPUT');
  return { bestFor, watchOut };
}

function gaugeOptions(stringId: string | null | undefined) {
  const stringItem = stringId ? (STRINGS as StringData[]).find((entry) => entry.id === stringId) || null : null;
  if (!stringItem) return [];
  return getGaugeOptions(stringItem).map((gauge) => ({ value: String(gauge), label: GAUGE_LABELS[gauge] || `${gauge}mm` }));
}

function findSimilarStrings(sourceId: string, limit = 4): StringData[] {
  const source = (STRINGS as StringData[]).find((entry) => entry.id === sourceId);
  if (!source) return [];
  const keys: Array<keyof StringData['twScore']> = ['power', 'spin', 'comfort', 'control', 'feel', 'durability'];
  return (STRINGS as StringData[]).filter((entry) => entry.id !== sourceId).map((entry) => ({
    string: entry,
    distance: keys.reduce((sum, key) => sum + (((entry.twScore[key] || 50) - (source.twScore[key] || 50)) ** 2), 0),
  })).sort((a, b) => a.distance - b.distance).slice(0, limit).map((entry) => entry.string);
}

function findBestFrames(stringId: string, limit = 4) {
  const stringItem = (STRINGS as StringData[]).find((entry) => entry.id === stringId);
  if (!stringItem) return [];
  const cfg: StringConfig = { isHybrid: false, string: stringItem, mainsTension: 52, crossesTension: 50 };
  return (RACQUETS as Racquet[]).map((racquet) => ({ racquet, obs: computeCompositeScore(predictSetup(racquet, cfg), buildTensionContext(cfg, racquet)) })).sort((a, b) => b.obs - a.obs).slice(0, limit);
}

function resolveInitialStringId(focusedId: string | null | undefined, setup: ReturnType<typeof useCurrentSetup>): string | null {
  if (focusedId) return focusedId;
  const syncedConfig = setup?.stringConfig;
  const syncedId = syncedConfig
    ? syncedConfig.isHybrid
      ? syncedConfig.mains?.id
      : syncedConfig.string?.id
    : undefined;
  if (syncedId) return syncedId;
  const all = STRINGS as StringData[];
  return all.length > 0 ? all[0].id : null;
}

export function StringCompendiumTab({ focusedStringId, onGoToFrame }: StringCompendiumTabProps) {
  const currentSetup = useCurrentSetup();
  const [hudOpen, setHudOpen] = useState(false);
  const [filters, setFilters] = useState<StringHudFilters>(EMPTY_FILTERS);
  const [selectedStringId, setSelectedStringId] = useState<string | null>(() => resolveInitialStringId(focusedStringId, currentSetup));
  const [frameId, setFrameId] = useState<string | null>(null);
  const [mode, setMode] = useState<StringMode>('fullbed');
  const [gauge, setGauge] = useState('');
  const [crossesGauge, setCrossesGauge] = useState('');
  const [crossesId, setCrossesId] = useState<string | null>(null);
  const [mainsTension, setMainsTension] = useState(52);
  const [crossesTension, setCrossesTension] = useState(50);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const strings = useMemo(() => filterStringsForHud(STRINGS as StringData[], filters), [filters]);
  const selectedString = useMemo(() => (selectedStringId ? (STRINGS as StringData[]).find((entry) => entry.id === selectedStringId) || null : null), [selectedStringId]);
  const selectedFrame = useMemo(() => (frameId ? (RACQUETS as Racquet[]).find((racquet) => racquet.id === frameId) || null : null), [frameId]);
  const baseStats = useMemo(() => (selectedFrame ? calcFrameBase(selectedFrame) : null), [selectedFrame]);

  useEffect(() => {
    if (focusedStringId) {
      setSelectedStringId(focusedStringId);
    }
  }, [focusedStringId]);

  useEffect(() => {
    if (!selectedString) return;
    const synced = currentSetup?.stringConfig;
    const syncedId = synced?.isHybrid ? synced.mains?.id : synced?.string?.id;
    if (synced && syncedId === selectedString.id) {
      setFrameId(currentSetup?.racquet?.id || null);
      setMode(synced.isHybrid ? 'hybrid' : 'fullbed');
      setCrossesId(synced.isHybrid ? synced.crosses?.id || synced.mains?.id || selectedString.id : selectedString.id);
      setGauge('');
      setCrossesGauge('');
      setMainsTension(synced.mainsTension);
      setCrossesTension(synced.crossesTension);
      setPreviewEnabled(true);
      return;
    }
    setCrossesId(selectedString.id);
    setGauge('');
    setCrossesGauge('');
    setPreviewEnabled(true);
  }, [currentSetup, selectedString]);

  const stringDetailVm = useMemo(() => selectedString ? buildStringCompendiumDetailVm(selectedString, buildPills(selectedString), findSimilarStrings(selectedString.id), findBestFrames(selectedString.id), getArchetype, getFrameIdentityLabel) : null, [selectedString]);
  const crossesString = useMemo(() => mode === 'hybrid' && crossesId && crossesId !== selectedStringId ? (STRINGS as StringData[]).find((entry) => entry.id === crossesId) || selectedString : selectedString, [crossesId, mode, selectedString, selectedStringId]);
  const previewStats = useMemo(() => {
    if (!selectedString || !selectedFrame || !baseStats || !previewEnabled) return null;
    const cfg = mode === 'hybrid'
      ? { isHybrid: true as const, mains: gauge ? applyGaugeModifier(selectedString, parseFloat(gauge)) : selectedString, crosses: crossesGauge ? applyGaugeModifier(crossesString || selectedString, parseFloat(crossesGauge)) : crossesString || selectedString, mainsTension, crossesTension }
      : { isHybrid: false as const, string: gauge ? applyGaugeModifier(selectedString, parseFloat(gauge)) : selectedString, mainsTension, crossesTension };
    return predictSetup(selectedFrame, cfg);
  }, [baseStats, crossesGauge, crossesString, crossesTension, gauge, mainsTension, mode, previewEnabled, selectedFrame, selectedString]);
  const previewObs = useMemo(() => {
    if (!selectedString || !selectedFrame || !previewStats || !previewEnabled) return '—';
    const cfg = mode === 'hybrid'
      ? { isHybrid: true as const, mains: gauge ? applyGaugeModifier(selectedString, parseFloat(gauge)) : selectedString, crosses: crossesGauge ? applyGaugeModifier(crossesString || selectedString, parseFloat(crossesGauge)) : crossesString || selectedString, mainsTension, crossesTension }
      : { isHybrid: false as const, string: gauge ? applyGaugeModifier(selectedString, parseFloat(gauge)) : selectedString, mainsTension, crossesTension };
    return computeCompositeScore(previewStats, buildTensionContext(cfg, selectedFrame)).toFixed(1);
  }, [crossesGauge, crossesString, crossesTension, gauge, mainsTension, mode, previewEnabled, previewStats, selectedFrame, selectedString]);

  const previewRows = useMemo(() => {
    const keys = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability'] as const;
    return keys.map((key) => ({ key, baseValue: baseStats ? Math.round(baseStats[key]) : 50, previewValue: previewStats ? Math.round(previewStats[key]) : null }));
  }, [baseStats, previewStats]);

  return (
    <>
      <StringCompendiumHud
        active={hudOpen}
        filters={filters}
        onClose={() => setHudOpen(false)}
        onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
        onMaterialChange={(value) => setFilters((current) => ({ ...current, material: value }))}
        onShapeChange={(value) => setFilters((current) => ({ ...current, shape: value }))}
        onStiffnessChange={(value) => setFilters((current) => ({ ...current, stiffness: value }))}
      >
        <StringCompendiumRoster strings={strings} selectedStringId={selectedStringId} getArchetype={getArchetype} onSelectString={(stringId) => { setSelectedStringId(stringId); setHudOpen(false); }} />
      </StringCompendiumHud>

      <div id="string-main" className="min-h-[400px] p-8">
        {selectedString && stringDetailVm ? (
          <>
            <StringCompendiumDetail vm={stringDetailVm} onToggleHud={() => setHudOpen(true)} onGoToFrame={onGoToFrame} onSelectString={setSelectedStringId} />
            <StringFrameInjectionModulator
              mode={mode}
              mainsName={selectedString.name}
              projectedObs={previewObs}
              gauge={gauge}
              crossesGauge={crossesGauge}
              mainsTension={mainsTension}
              crossesTension={crossesTension}
              gaugeOptions={gaugeOptions(selectedString.id)}
              crossesGaugeOptions={gaugeOptions(crossesId || selectedString.id)}
              previewRows={previewRows}
              addEnabled={!!previewStats}
              activateEnabled={!!previewStats}
              onSetMode={(nextMode) => { setMode(nextMode); setCrossesId(nextMode === 'hybrid' ? crossesId || selectedString.id : selectedString.id); setPreviewEnabled(true); }}
              onGaugeChange={(value) => { setGauge(value); setPreviewEnabled(true); }}
              onCrossesGaugeChange={(value) => { setCrossesGauge(value); setPreviewEnabled(true); }}
              onMainsTensionChange={(value) => { setMainsTension(value); setPreviewEnabled(true); }}
              onCrossesTensionChange={(value) => { setCrossesTension(value); setPreviewEnabled(true); }}
              onAddToLoadout={() => {
                if (!selectedString || !frameId) return window.alert('Please select both a string and a frame');
                const isHybrid = mode === 'hybrid' && !!crossesId && crossesId !== selectedString.id;
                const loadout = createLoadout(frameId, selectedString.id, mainsTension, { source: 'string-compendium', crossesTension: isHybrid ? crossesTension : mainsTension, gauge: isHybrid ? null : gauge || null, mainsGauge: isHybrid ? gauge || null : null, crossesGauge: isHybrid ? (crossesGauge || gauge || null) : null, isHybrid, mainsId: isHybrid ? selectedString.id : null, crossesId: isHybrid ? crossesId : null });
                if (loadout) saveLoadout(loadout);
              }}
              onSetActive={() => {
                if (!selectedString || !frameId) return window.alert('Please select both a string and a frame');
                const isHybrid = mode === 'hybrid' && !!crossesId && crossesId !== selectedString.id;
                const loadout = createLoadout(frameId, selectedString.id, mainsTension, { source: 'string-compendium', crossesTension: isHybrid ? crossesTension : mainsTension, gauge: isHybrid ? null : gauge || null, mainsGauge: isHybrid ? gauge || null : null, crossesGauge: isHybrid ? (crossesGauge || gauge || null) : null, isHybrid, mainsId: isHybrid ? selectedString.id : null, crossesId: isHybrid ? crossesId : null });
                if (!loadout) return;
                saveLoadout(loadout);
                activateLoadout(loadout);
                switchMode('overview');
              }}
              onClear={() => setPreviewEnabled(false)}
              frameSelect={<SearchableSelectMount registryKey="string-mod-frame" type="racquet" placeholder="Select Frame..." value={frameId || ''} onChange={(value) => { setFrameId(value || null); setPreviewEnabled(true); }} />}
              crossesStringSelect={<SearchableSelectMount registryKey="string-mod-crosses-string" type="custom" placeholder="Same as mains..." value={crossesId && crossesId !== selectedString.id ? crossesId : ''} options={(STRINGS as StringData[]).filter((entry) => entry.id !== selectedString.id).map((entry) => ({ value: entry.id, label: entry.name }))} onChange={(value) => { setCrossesId(value || selectedString.id); setPreviewEnabled(true); }} />}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-dc-storm">
            <span className="font-mono text-4xl mb-4">S</span>
            <p className="font-mono text-sm">Loading string database...</p>
          </div>
        )}
      </div>
    </>
  );
}
