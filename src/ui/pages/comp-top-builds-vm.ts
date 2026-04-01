import type { Racquet, SetupStats } from '../../engine/types.js';
import type { Build } from '../../state/presets.js';

export type SortKeyVm = 'score' | 'spin' | 'control' | 'power' | 'comfort' | 'durability';

export interface CompSortTabVm {
  key: SortKeyVm;
  label: string;
  isActive: boolean;
}

export interface CompBuildCardStatVm {
  key: string;
  val: number;
}

export interface CompBuildCardVm {
  index: number;
  isFeatured: boolean;
  archetype: string;
  score: number;
  stringLabel: string;
  metaLabel: string;
  reasonText: string | null;
  statsLine: CompBuildCardStatVm[];
  buildKey: string;
}

type BuildWithArch = Build & { archetype?: string };

const SORT_OPTIONS: Array<{ key: SortKeyVm; label: string }> = [
  { key: 'score', label: 'OBS' },
  { key: 'spin', label: 'Spin' },
  { key: 'control', label: 'Control' },
  { key: 'power', label: 'Power' },
  { key: 'comfort', label: 'Comfort' },
  { key: 'durability', label: 'Durability' },
];

export function buildCompSortTabsVm(activeKey: SortKeyVm): CompSortTabVm[] {
  return SORT_OPTIONS.map((s) => ({
    key: s.key,
    label: s.label,
    isActive: activeKey === s.key,
  }));
}

export function buildCompBuildCardsVm(
  builds: BuildWithArch[],
  frameStats: SetupStats,
  generateReason: (build: BuildWithArch, frameStats: SetupStats) => string,
): CompBuildCardVm[] {
  return builds.map((build, index) => {
    const isFeatured = index === 0;
    const isHybrid = build.type === 'hybrid';
    const stringLabel = isHybrid ? build.label || build.string.name : build.string.name;
    const metaLabel = isHybrid
      ? `Hybrid · M:${build.tension} / X:${build.crossesTension}`
      : `Full Bed · ${build.tension} lbs`;
    const s = build.stats;
    const statEntries = [
      { key: 'SPIN', val: Math.round(s.spin) },
      { key: 'PWR', val: Math.round(s.power) },
      { key: 'CTRL', val: Math.round(s.control) },
      { key: 'CMF', val: Math.round(s.comfort) },
      { key: 'FEEL', val: Math.round(s.feel) },
      { key: 'DUR', val: Math.round(s.durability) },
    ]
      .sort((a, b) => b.val - a.val)
      .slice(0, 3);
    const reasonText = isFeatured ? generateReason(build, frameStats) : null;
    return {
      index,
      isFeatured,
      archetype: build.archetype || '',
      score: build.score,
      stringLabel,
      metaLabel,
      reasonText,
      statsLine: statEntries,
      buildKey: `${build.string?.id || ''}-${index}-${build.score}`,
    };
  });
}
