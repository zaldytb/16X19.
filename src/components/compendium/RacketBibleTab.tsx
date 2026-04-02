import { useEffect, useMemo, useState } from 'react';
import { SearchableSelectMount } from '../SearchableSelectMount.js';
import { RACQUETS, STRINGS } from '../../data/loader.js';
import { GAUGE_LABELS, applyGaugeModifier, buildTensionContext, calcFrameBase, computeCompositeScore, getGaugeOptions, predictSetup } from '../../engine/index.js';
import type { Loadout, Racquet, SetupStats, StringConfig, StringData } from '../../engine/types.js';
import { createLoadout, saveLoadout } from '../../state/loadout.js';
import { generateBuildReason, generateTopBuilds, type Build } from '../../state/presets.js';
import { useCurrentSetup } from '../../hooks/useStore.js';
import { buildCompBaseProfileVm } from '../../ui/pages/comp-base-profile-vm.js';
import { buildCompRacketHeroVm } from '../../ui/pages/comp-racket-hero-vm.js';
import { buildCompBuildCardsVm, buildCompSortTabsVm, type SortKeyVm } from '../../ui/pages/comp-top-builds-vm.js';
import { filterRacquetsForHud, type CompFrameHudFilters } from '../../ui/pages/comp-hud-filters-vm.js';
import { activateLoadout, switchMode } from '../../ui/pages/shell.js';
import { CompendiumBaseProfile } from './CompendiumBaseProfile.js';
import { CompendiumFrameHud } from './CompendiumFrameHud.js';
import { CompendiumFrameRoster } from './CompendiumFrameRoster.js';
import { CompendiumRacketHero } from './CompendiumRacketHero.js';
import { CompendiumStringModulator } from './CompendiumStringModulator.js';
import { CompendiumTopBuilds } from './CompendiumTopBuilds.js';

type CompMode = 'fullbed' | 'hybrid';
type SortKey = SortKeyVm;

interface RacketBibleTabProps {
  focusedRacquetId?: string | null;
}

const EMPTY_FILTERS: CompFrameHudFilters = {
  search: '',
  brand: '',
  pattern: '',
  stiffness: '',
  headsize: '',
  weight: '',
};

function extractBrand(name: string): string {
  return name.split(' ')[0] || name;
}

function buildHeroPills(frameStats: SetupStats, racquet: Racquet) {
  const bestFor: string[] = [];
  const watchOut: string[] = [];
  if (frameStats.spin >= 65) bestFor.push('TOPSPIN BASELINERS');
  if (frameStats.power >= 65) bestFor.push('FREE POWER SEEKERS');
  if (frameStats.control >= 65) bestFor.push('FLAT HIT PRECISION');
  if (frameStats.comfort >= 65) bestFor.push('ARM-FRIENDLY SESSIONS');
  if (frameStats.maneuverability >= 65) bestFor.push('FAST SWING STYLES');
  if (frameStats.stability >= 65) bestFor.push('HEAVY HITTERS');
  if (frameStats.feel >= 65) bestFor.push('TOUCH PLAYERS');
  if (frameStats.control < 55) watchOut.push('LOWER CONTROL CEILING');
  if (frameStats.comfort < 55) watchOut.push('HARSH ON ARM');
  if (frameStats.power < 55) watchOut.push('LESS FREE POWER');
  if (frameStats.stability < 55) watchOut.push('TWIST OFF-CENTER');
  if (frameStats.maneuverability < 55) watchOut.push('DEMANDS FAST PREP');
  if (racquet.strungWeight > 325) watchOut.push('HEAVY TECHNIQUE REQ');
  if (racquet.strungWeight < 290) watchOut.push('LIGHT PLOW-THROUGH');
  return { bestFor, watchOut };
}

function gaugeOptions(stringId: string | null | undefined) {
  const stringItem = stringId ? (STRINGS as StringData[]).find((entry) => entry.id === stringId) || null : null;
  if (!stringItem) return [];
  return getGaugeOptions(stringItem).map((gauge) => ({ value: String(gauge), label: GAUGE_LABELS[gauge] || `${gauge}mm` }));
}

function createBuildLoadout(racquetId: string, build: Build): Loadout | null {
  const isHybrid = build.type === 'hybrid';
  const stringId = isHybrid ? build.mainsId || build.string.id : build.string.id;
  return createLoadout(racquetId, stringId, build.tension, {
    source: 'compendium',
    isHybrid,
    mainsId: isHybrid ? build.mainsId || null : null,
    crossesId: isHybrid ? build.crossesId || null : null,
    crossesTension: build.crossesTension || build.tension,
  });
}

function resolveInitialRacquetId(focusedId: string | null | undefined, setupRacquetId: string | undefined): string | null {
  if (focusedId) return focusedId;
  if (setupRacquetId) return setupRacquetId;
  const all = RACQUETS as Racquet[];
  return all.length > 0 ? all[0].id : null;
}

export function RacketBibleTab({ focusedRacquetId }: RacketBibleTabProps) {
  const currentSetup = useCurrentSetup();
  const [hudOpen, setHudOpen] = useState(false);
  const [filters, setFilters] = useState<CompFrameHudFilters>(EMPTY_FILTERS);
  const [selectedRacquetId, setSelectedRacquetId] = useState<string | null>(() => resolveInitialRacquetId(focusedRacquetId, currentSetup?.racquet?.id));
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [mode, setMode] = useState<CompMode>('fullbed');
  const [mainsId, setMainsId] = useState('');
  const [crossesId, setCrossesId] = useState('');
  const [mainsGauge, setMainsGauge] = useState('');
  const [crossesGauge, setCrossesGauge] = useState('');
  const [mainsTension, setMainsTension] = useState(52);
  const [crossesTension, setCrossesTension] = useState(50);

  const brands = useMemo(() => [...new Set((RACQUETS as Racquet[]).map((racquet) => extractBrand(racquet.name)))].sort(), []);
  const racquets = useMemo(() => filterRacquetsForHud(RACQUETS as Racquet[], filters), [filters]);
  const selectedRacquet = useMemo(() => (selectedRacquetId ? (RACQUETS as Racquet[]).find((racquet) => racquet.id === selectedRacquetId) || null : null), [selectedRacquetId]);
  const frameBase = useMemo(() => (selectedRacquet ? calcFrameBase(selectedRacquet) : null), [selectedRacquet]);
  const builds = useMemo(() => (selectedRacquet ? generateTopBuilds(selectedRacquet, 6) : []), [selectedRacquet]);

  useEffect(() => {
    if (focusedRacquetId) {
      setSelectedRacquetId(focusedRacquetId);
    }
  }, [focusedRacquetId]);

  useEffect(() => {
    if (!selectedRacquet) return;
    const activeConfig = currentSetup?.racquet?.id === selectedRacquet.id ? currentSetup.stringConfig : null;
    const mid = Math.round((selectedRacquet.tensionRange[0] + selectedRacquet.tensionRange[1]) / 2);
    setMode(activeConfig?.isHybrid ? 'hybrid' : 'fullbed');
    setMainsId(activeConfig?.isHybrid ? activeConfig.mains?.id || '' : activeConfig?.string?.id || '');
    setCrossesId(activeConfig?.isHybrid ? activeConfig.crosses?.id || activeConfig.mains?.id || '' : activeConfig?.string?.id || '');
    setMainsGauge('');
    setCrossesGauge('');
    setMainsTension(activeConfig?.mainsTension || mid);
    setCrossesTension(activeConfig?.crossesTension || mid - 2);
  }, [currentSetup, selectedRacquet]);

  const mainsString = useMemo(() => (mainsId ? (STRINGS as StringData[]).find((entry) => entry.id === mainsId) || null : null), [mainsId]);
  const crossesString = useMemo(() => {
    const targetId = mode === 'hybrid' ? crossesId || mainsId : mainsId;
    return targetId ? (STRINGS as StringData[]).find((entry) => entry.id === targetId) || mainsString : mainsString;
  }, [crossesId, mainsId, mainsString, mode]);

  const previewStats = useMemo(() => {
    if (!selectedRacquet || !mainsString) return null;
    const mains = mainsGauge ? applyGaugeModifier(mainsString, parseFloat(mainsGauge)) : mainsString;
    const crossesBase = crossesString || mainsString;
    const crosses = crossesGauge ? applyGaugeModifier(crossesBase, parseFloat(crossesGauge)) : crossesBase;
    const cfg: StringConfig = mode === 'hybrid'
      ? { isHybrid: true, mains, crosses, mainsTension, crossesTension }
      : { isHybrid: false, string: mains, mainsTension, crossesTension };
    return predictSetup(selectedRacquet, cfg);
  }, [crossesGauge, crossesString, crossesTension, mainsGauge, mainsString, mainsTension, mode, selectedRacquet]);

  const deltaObs = useMemo(() => {
    if (!selectedRacquet || !frameBase || !previewStats || !mainsString) return null;
    const mains = mainsGauge ? applyGaugeModifier(mainsString, parseFloat(mainsGauge)) : mainsString;
    const crossesBase = crossesString || mainsString;
    const crosses = crossesGauge ? applyGaugeModifier(crossesBase, parseFloat(crossesGauge)) : crossesBase;
    const cfg: StringConfig = mode === 'hybrid'
      ? { isHybrid: true, mains, crosses, mainsTension, crossesTension }
      : { isHybrid: false, string: mains, mainsTension, crossesTension };
    const obs = computeCompositeScore(previewStats, buildTensionContext(cfg, selectedRacquet));
    const baseObs = Math.round(frameBase.spin * 0.15 + frameBase.power * 0.12 + frameBase.control * 0.18 + frameBase.comfort * 0.12 + frameBase.feel * 0.1 + frameBase.stability * 0.12 + frameBase.forgiveness * 0.08 + frameBase.maneuverability * 0.08);
    return Math.round((obs - baseObs) * 10) / 10;
  }, [crossesGauge, crossesString, crossesTension, frameBase, mainsGauge, mainsString, mainsTension, mode, previewStats, selectedRacquet]);

  const heroVm = useMemo(() => (selectedRacquet && frameBase ? buildCompRacketHeroVm(selectedRacquet, frameBase, buildHeroPills(frameBase, selectedRacquet)) : null), [frameBase, selectedRacquet]);
  const baseGroups = useMemo(() => (frameBase ? buildCompBaseProfileVm(frameBase, previewStats) : []), [frameBase, previewStats]);
  const sortedBuilds = useMemo(() => [...builds].sort((left, right) => sortKey === 'score' ? right.score - left.score : (right.stats[sortKey] || 0) - (left.stats[sortKey] || 0)), [builds, sortKey]);
  const sortTabs = useMemo(() => buildCompSortTabsVm(sortKey), [sortKey]);
  const buildCards = useMemo(() => (frameBase ? buildCompBuildCardsVm(sortedBuilds, frameBase, generateBuildReason) : []), [frameBase, sortedBuilds]);

  return (
    <div className="comp-layout">
      <CompendiumFrameHud
        active={hudOpen}
        brands={brands}
        filters={filters}
        onClose={() => setHudOpen(false)}
        onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
        onBrandChange={(value) => setFilters((current) => ({ ...current, brand: value }))}
        onPatternChange={(value) => setFilters((current) => ({ ...current, pattern: value }))}
        onStiffnessChange={(value) => setFilters((current) => ({ ...current, stiffness: value }))}
        onHeadsizeChange={(value) => setFilters((current) => ({ ...current, headsize: value }))}
        onWeightChange={(value) => setFilters((current) => ({ ...current, weight: value }))}
      >
        <CompendiumFrameRoster racquets={racquets} selectedRacquetId={selectedRacquetId} onSelectFrame={(racquetId) => { setSelectedRacquetId(racquetId); setHudOpen(false); }} />
      </CompendiumFrameHud>

      <div className="comp-main" id="comp-main">
        {selectedRacquet && frameBase && heroVm ? (
          <>
            <CompendiumRacketHero vm={heroVm} deltaObs={deltaObs} onToggleHud={() => setHudOpen(true)} />
            <CompendiumStringModulator
              mode={mode}
              mainsLabel={mode === 'hybrid' ? '// MAINS' : '// STRING'}
              crossesLabel="// CROSSES"
              mainsGaugeOptions={gaugeOptions(mainsId)}
              crossesGaugeOptions={gaugeOptions(mode === 'hybrid' ? crossesId || mainsId : mainsId)}
              mainsGauge={mainsGauge}
              crossesGauge={crossesGauge}
              mainsTension={mainsTension}
              crossesTension={crossesTension}
              applyEnabled={!!previewStats}
              onSetMode={(nextMode) => { setMode(nextMode); setCrossesId(nextMode === 'hybrid' ? crossesId || mainsId : mainsId); }}
              onMainsGaugeChange={setMainsGauge}
              onCrossesGaugeChange={setCrossesGauge}
              onMainsTensionChange={setMainsTension}
              onCrossesTensionChange={setCrossesTension}
              onApply={() => {
                if (!selectedRacquet || !mainsId) return;
                const loadout = createLoadout(selectedRacquet.id, mainsId, mainsTension, {
                  source: 'bible',
                  isHybrid: mode === 'hybrid',
                  mainsId: mode === 'hybrid' ? mainsId : null,
                  crossesId: mode === 'hybrid' ? crossesId || mainsId : null,
                  crossesTension,
                  mainsGauge: mainsGauge || undefined,
                  crossesGauge: crossesGauge || undefined,
                });
                if (!loadout) return;
                activateLoadout(loadout);
                switchMode('overview');
              }}
              onClear={() => {
                const mid = Math.round((selectedRacquet.tensionRange[0] + selectedRacquet.tensionRange[1]) / 2);
                setMainsId('');
                setCrossesId('');
                setMainsGauge('');
                setCrossesGauge('');
                setMainsTension(mid);
                setCrossesTension(mid - 2);
              }}
              mainsSelect={<SearchableSelectMount registryKey="comp-mains-select" type="string" placeholder="Select String..." value={mainsId} onChange={(value) => { setMainsId(value); if (mode === 'fullbed') setCrossesId(value); setMainsGauge(''); setCrossesGauge(''); }} />}
              crossesSelect={<SearchableSelectMount registryKey="comp-crosses-select" type="string" placeholder="Select Cross String..." value={crossesId} onChange={(value) => { setCrossesId(value); setCrossesGauge(''); }} />}
            />
            <CompendiumBaseProfile groups={baseGroups} />
            <CompendiumTopBuilds
              sortTabs={sortTabs}
              cards={buildCards}
              onSetSort={setSortKey}
              onSave={(index) => { if (!selectedRacquet) return; const loadout = createBuildLoadout(selectedRacquet.id, sortedBuilds[index]); if (loadout) saveLoadout(loadout); }}
              onSetActive={(index) => { if (!selectedRacquet) return; const loadout = createBuildLoadout(selectedRacquet.id, sortedBuilds[index]); if (loadout) { activateLoadout(loadout); switchMode('overview'); } }}
              onTune={(index) => { if (!selectedRacquet) return; const loadout = createBuildLoadout(selectedRacquet.id, sortedBuilds[index]); if (loadout) { saveLoadout(loadout); activateLoadout(loadout); switchMode('tune'); } }}
            />
          </>
        ) : (
          <div className="comp-empty">
            <p className="comp-empty-title">Select a frame</p>
            <p className="comp-empty-sub">Click the frame name above to browse the racket database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
