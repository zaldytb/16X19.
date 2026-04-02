import { useEffect, useMemo, useState } from 'react';
import { RACQUETS, STRINGS } from '../../data/loader.js';
import { calcBaseStringProfile, calcFrameBase } from '../../engine/index.js';
import type { FrameBaseScores, Racquet, SetupStats, StringData, StringProfileScores } from '../../engine/types.js';
import { createLoadout } from '../../state/loadout.js';
import { addLoadoutToNextAvailableSlot } from '../../ui/pages/compare/compare-slot-api.js';
import { switchMode, activateLoadout } from '../../ui/pages/shell.js';
import { runLeaderboardBuildsAsync } from '../../workers/engine-worker-client.js';
import { LeaderboardBuildResults } from './LeaderboardBuildResults.js';
import { LeaderboardFrameResults } from './LeaderboardFrameResults.js';
import { LeaderboardShell } from './LeaderboardShell.js';
import { buildLeaderboardBuildRows, buildLeaderboardFrameRows, buildLeaderboardStringRows, type LbBuildResultInput } from './leaderboard-results-vm.js';
import { buildLeaderboardShellVm, type LbShellStatOptionVm } from './leaderboard-shell-vm.js';
import { LeaderboardStringResults } from './LeaderboardStringResults.js';

type FilterType = 'both' | 'full' | 'hybrid';
type ViewMode = 'builds' | 'frames' | 'strings';

interface LeaderboardPanelProps {
  onViewFrame: (racquetId: string) => void;
  onViewString: (stringId: string) => void;
}

interface FrameResult {
  racquet: Racquet;
  frameBase: FrameBaseScores;
  rankVal: number;
  statKey: string;
  frameLabel: string;
}

interface StringResult {
  string: StringData;
  profile: StringProfileScores;
  rankVal: number;
  statKey: string;
}

const STATS = [
  { key: 'obs', label: 'Best Overall', icon: 'T', desc: 'Highest total build score' },
  { key: 'spin', label: 'Most Spin', icon: 'S', desc: 'Maximum topspin potential' },
  { key: 'power', label: 'Most Power', icon: 'P', desc: 'Hardest hitting setups' },
  { key: 'control', label: 'Most Control', icon: 'C', desc: 'Precision and placement' },
  { key: 'comfort', label: 'Most Comfort', icon: 'A', desc: 'Arm-friendly, low vibration' },
  { key: 'feel', label: 'Best Feel', icon: 'F', desc: 'Touch and ball connection' },
  { key: 'maneuverability', label: 'Most Maneuverable', icon: 'M', desc: 'Fast swing, reactive' },
  { key: 'stability', label: 'Most Stable', icon: 'B', desc: 'Plow-through, twist resistance' },
  { key: 'durability', label: 'Most Durable', icon: 'D', desc: 'Long-lasting strings' },
] satisfies LbShellStatOptionVm[];

const EMPTY_FRAME_FILTERS = {
  brand: '',
  pattern: '',
  headSize: '',
  weight: '',
  stiffness: '',
  year: '',
};

const EMPTY_STRING_FILTERS = {
  brand: '',
  material: '',
  shape: '',
  gauge: '',
  stiffness: '',
};

function computeFrameObs(frameBase: Record<string, number>): number {
  return Math.round(
    (frameBase.spin || 0) * 0.15 +
      (frameBase.power || 0) * 0.12 +
      (frameBase.control || 0) * 0.18 +
      (frameBase.comfort || 0) * 0.12 +
      (frameBase.feel || 0) * 0.1 +
      (frameBase.stability || 0) * 0.12 +
      (frameBase.forgiveness || 0) * 0.08 +
      (frameBase.maneuverability || 0) * 0.08 +
      (frameBase.launch || 0) * 0.05,
  );
}

function computeStringObs(profile: Record<string, number>): number {
  return Math.round(
    (profile.spin || 0) * 0.15 +
      (profile.power || 0) * 0.12 +
      (profile.control || 0) * 0.18 +
      (profile.comfort || 0) * 0.13 +
      (profile.feel || 0) * 0.12 +
      (profile.durability || 0) * 0.15 +
      (profile.playability || 0) * 0.15,
  );
}

function filterFrames(racquets: Racquet[], filters: typeof EMPTY_FRAME_FILTERS): Racquet[] {
  return racquets.filter((racquet) => {
    if (filters.brand && !racquet.name.startsWith(filters.brand)) return false;
    if (filters.pattern && racquet.pattern !== filters.pattern) return false;
    if (filters.headSize) {
      if (filters.headSize === '102+' && racquet.headSize < 102) return false;
      if (filters.headSize !== '102+' && racquet.headSize !== parseInt(filters.headSize, 10)) return false;
    }
    if (filters.weight) {
      const weight = racquet.strungWeight;
      if (filters.weight === 'ultralight' && weight >= 285) return false;
      if (filters.weight === 'light' && (weight < 285 || weight >= 305)) return false;
      if (filters.weight === 'medium' && (weight < 305 || weight >= 320)) return false;
      if (filters.weight === 'heavy' && (weight < 320 || weight >= 340)) return false;
      if (filters.weight === 'tour' && weight < 340) return false;
    }
    if (filters.stiffness) {
      const stiffness = racquet.stiffness;
      if (filters.stiffness === 'soft' && stiffness > 59) return false;
      if (filters.stiffness === 'medium' && (stiffness < 60 || stiffness > 65)) return false;
      if (filters.stiffness === 'stiff' && stiffness < 66) return false;
    }
    if (filters.year) {
      const racquetYear = typeof racquet.year === 'number' ? racquet.year : 0;
      if (filters.year === 'older' && racquetYear > 2023) return false;
      if (filters.year !== 'older' && racquetYear !== parseInt(filters.year, 10)) return false;
    }
    return true;
  });
}

function filterStrings(strings: StringData[], filters: typeof EMPTY_STRING_FILTERS): StringData[] {
  return strings.filter((stringItem) => {
    if (filters.brand && !stringItem.name.startsWith(filters.brand)) return false;
    if (filters.material && stringItem.material !== filters.material) return false;
    if (filters.shape && !(stringItem.shape || '').toLowerCase().includes(filters.shape)) return false;
    if (filters.gauge) {
      const gauge = stringItem.gaugeNum || 1.25;
      if (filters.gauge === 'thin' && gauge > 1.2) return false;
      if (filters.gauge === 'mid' && (gauge <= 1.2 || gauge >= 1.28)) return false;
      if (filters.gauge === 'thick' && gauge < 1.28) return false;
    }
    if (filters.stiffness) {
      const stiffness = stringItem.stiffness || 200;
      if (filters.stiffness === 'soft' && stiffness >= 180) return false;
      if (filters.stiffness === 'medium' && (stiffness < 180 || stiffness > 215)) return false;
      if (filters.stiffness === 'stiff' && stiffness <= 215) return false;
    }
    return true;
  });
}

export function LeaderboardPanel({ onViewFrame, onViewString }: LeaderboardPanelProps) {
  const [statKey, setStatKey] = useState('obs');
  const [filterType, setFilterType] = useState<FilterType>('both');
  const [viewMode, setViewMode] = useState<ViewMode>('builds');
  const [frameFilters, setFrameFilters] = useState(EMPTY_FRAME_FILTERS);
  const [stringFilters, setStringFilters] = useState(EMPTY_STRING_FILTERS);
  const [buildResults, setBuildResults] = useState<LbBuildResultInput[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (viewMode !== 'builds') return;
    let cancelled = false;
    setLoading(true);
    void runLeaderboardBuildsAsync(statKey, filterType).then((results) => {
      if (cancelled) return;
      setBuildResults(results as LbBuildResultInput[]);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setBuildResults([]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filterType, statKey, viewMode]);

  const frameResults = useMemo<FrameResult[]>(() => {
    if (viewMode !== 'frames') return [];
    return filterFrames(RACQUETS as Racquet[], frameFilters)
      .map((racquet) => {
        const frameBase = calcFrameBase(racquet);
        const frameBaseRecord = frameBase as unknown as Record<string, number>;
        const rankVal = statKey === 'obs'
          ? computeFrameObs(frameBaseRecord)
          : Math.round(frameBaseRecord[statKey] || 0);
        return { racquet, frameBase, rankVal, statKey, frameLabel: racquet.name };
      })
      .sort((left, right) => right.rankVal - left.rankVal)
      .slice(0, 60);
  }, [frameFilters, statKey, viewMode]);

  const stringResults = useMemo<StringResult[]>(() => {
    if (viewMode !== 'strings') return [];
    return filterStrings(STRINGS as StringData[], stringFilters)
      .map((stringItem) => {
        const profile = calcBaseStringProfile(stringItem);
        const profileRecord = profile as unknown as Record<string, number>;
        const twScoreRecord = stringItem.twScore as unknown as Record<string, number>;
        const rankVal = statKey === 'obs'
          ? computeStringObs(profileRecord)
          : Math.round(profileRecord[statKey] || twScoreRecord[statKey] || 0);
        return { string: stringItem, profile, rankVal, statKey };
      })
      .filter((entry) => entry.rankVal > 0)
      .sort((left, right) => right.rankVal - left.rankVal)
      .slice(0, 60);
  }, [statKey, stringFilters, viewMode]);

  const shellVm = useMemo(
    () =>
      buildLeaderboardShellVm(
        {
          statKey,
          filterType,
          viewMode,
          frameFilters,
          stringFilters,
        },
        STATS,
      ),
    [filterType, frameFilters, statKey, stringFilters, viewMode],
  );

  const buildRows = useMemo(
    () => buildLeaderboardBuildRows(buildResults, statKey),
    [buildResults, statKey],
  );
  const frameRows = useMemo(
    () => buildLeaderboardFrameRows(frameResults, ['spin', 'power', 'control', 'comfort'].filter((key) => key !== statKey)),
    [frameResults, statKey],
  );
  const stringRows = useMemo(
    () => buildLeaderboardStringRows(stringResults, ['spin', 'power', 'control', 'comfort'].filter((key) => key !== statKey)),
    [statKey, stringResults],
  );

  const statMeta = STATS.find((stat) => stat.key === statKey) || STATS[0];
  const count = viewMode === 'builds' ? buildRows.length : viewMode === 'frames' ? frameRows.length : stringRows.length;

  const handleViewBuild = (row: (typeof buildRows)[number]) => {
    const loadout = createLoadout(row.racquetId, row.isHybrid ? row.mainsId || row.stringId : row.stringId, row.tension, {
      source: 'leaderboard',
      isHybrid: row.isHybrid,
      mainsId: row.mainsId || null,
      crossesId: row.crossesId || null,
      crossesTension: row.crossesTension,
    });
    if (!loadout) return;
    activateLoadout(loadout);
    switchMode('overview');
  };

  const handleCompareBuild = (row: (typeof buildRows)[number]) => {
    const loadout = createLoadout(row.racquetId, row.isHybrid ? row.mainsId || row.stringId : row.stringId, row.tension, {
      source: 'leaderboard',
      isHybrid: row.isHybrid,
      mainsId: row.mainsId || null,
      crossesId: row.crossesId || null,
      crossesTension: row.crossesTension,
    });
    if (!loadout) return;
    const slotId = addLoadoutToNextAvailableSlot(loadout);
    if (!slotId) {
      window.alert('All 3 compare slots are already filled. Remove one before adding a leaderboard result.');
      return;
    }
    switchMode('compare');
  };

  return (
    <div className="min-h-full">
      <LeaderboardShell
        vm={shellVm}
        onSetView={setViewMode}
        onSetStat={setStatKey}
        onSetFilter={setFilterType}
        onSetFrameFilter={(key, value) => setFrameFilters((current) => ({ ...current, [key]: value }))}
        onClearFrameFilters={() => setFrameFilters(EMPTY_FRAME_FILTERS)}
        onSetStringFilter={(key, value) => setStringFilters((current) => ({ ...current, [key]: value }))}
        onClearStringFilters={() => setStringFilters(EMPTY_STRING_FILTERS)}
      />

      <div className="flex justify-end px-5 pt-2">
        <span className="font-mono text-[9px] text-dc-storm/50 tabular-nums">{count} {viewMode}</span>
      </div>

      <div className="flex-1" id="lb2-results">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-7 h-7 border-2 border-dc-storm/30 border-t-dc-accent rounded-full animate-spin"></div>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-dc-storm">
              Computing {statMeta.label}
            </span>
          </div>
        ) : viewMode === 'builds' ? (
          <LeaderboardBuildResults
            rows={buildRows}
            primaryStatColumnLabel={statKey === 'obs' ? 'OBS' : statMeta.label.replace('Most ', '').replace('Best ', '')}
            isObs={statKey === 'obs'}
            footerLeft={`${buildRows.length} builds scored · best setup per frame×string at optimal tension`}
            footerIcon={statMeta.icon}
            footerDesc={statMeta.desc}
            onView={handleViewBuild}
            onCompare={handleCompareBuild}
          />
        ) : viewMode === 'frames' ? (
          <LeaderboardFrameResults
            rows={frameRows}
            primaryStatColumnLabel={statKey === 'obs' ? 'Score' : statMeta.label.replace('Most ', '').replace('Best ', '')}
            footerLeft={`${frameRows.length} frames · base physics, no string interaction`}
            footerIcon={statMeta.icon}
            footerDesc={statMeta.desc}
            onViewFrame={onViewFrame}
          />
        ) : (
          <LeaderboardStringResults
            rows={stringRows}
            primaryStatColumnLabel={statKey === 'obs' ? 'Score' : statMeta.label.replace('Most ', '').replace('Best ', '')}
            footerLeft={`${stringRows.length} strings · intrinsic profile, no frame interaction`}
            footerIcon={statMeta.icon}
            footerDesc={statMeta.desc}
            onViewString={onViewString}
          />
        )}
      </div>
    </div>
  );
}
