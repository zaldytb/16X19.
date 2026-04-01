/**
 * Pure view-models for Leaderboard v2 React result tables (builds / frames / strings).
 * Input shapes mirror BuildResult / FrameResult / StringResult without importing leaderboard.ts (avoid cycles).
 */

import type { FrameBaseScores, IdentityResult, Racquet, SetupStats, StringData, StringProfileScores } from '../../engine/types.js';

// —— Builds ——————————————————————————————————————————————————————————————

export type LbBuildResultInput = {
  type: 'full' | 'hybrid';
  racquet: Racquet;
  string: StringData | null;
  mains: StringData | null;
  crosses: StringData | null;
  tension: number;
  crossesTension: number;
  stats: SetupStats;
  obs: number;
  rankVal: number;
  identity: IdentityResult;
  frameLabel: string;
  stringLabel: string;
};

export type LbBuildStatChipVm = { key: string; val: number; high: boolean };

export type LbBuildRowVm = {
  rank: number;
  isFeatured: boolean;
  rankValDisplay: string;
  tensionLabel: string;
  frameName: string;
  stringName: string;
  frameTitle: string;
  stringTitle: string;
  isHybrid: boolean;
  topStatChips: LbBuildStatChipVm[];
  archetype: string;
  obs: number;
  mainsId: string;
  crossesId: string;
  stringId: string;
  racquetId: string;
  tension: number;
  crossesTension: number;
  entryType: string;
};

export function buildLeaderboardBuildRows(results: LbBuildResultInput[], statKey: string): LbBuildRowVm[] {
  const isObs = statKey === 'obs';
  return results.slice(0, 50).map((entry, i) => {
    const rank = i + 1;
    const isFeatured = rank === 1;
    const rankValDisplay = isObs ? entry.rankVal.toFixed(1) : String(Math.round(entry.rankVal));
    const tensionLabel =
      entry.type === 'hybrid'
        ? `M${entry.tension} / X${entry.crossesTension}`
        : `${entry.tension} lbs`;
    const frameName =
      entry.frameLabel.length > 30 ? `${entry.frameLabel.slice(0, 30)}…` : entry.frameLabel;
    const stringName =
      entry.stringLabel.length > 35 ? `${entry.stringLabel.slice(0, 35)}…` : entry.stringLabel;
    const topStatChips = ['spin', 'power', 'control', 'comfort', 'feel', 'stability']
      .map((k) => ({ k, v: (entry.stats as unknown as Record<string, number>)[k] ?? 0 }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 3)
      .map(({ k, v }) => ({
        key: k.slice(0, 3).toUpperCase(),
        val: v,
        high: v >= 70,
      }));
    const mainsId = entry.mains?.id ?? '';
    const crossesId = entry.crosses?.id ?? '';
    const stringId = entry.type === 'hybrid' ? mainsId : entry.string?.id ?? '';
    return {
      rank,
      isFeatured,
      rankValDisplay,
      tensionLabel,
      frameName,
      stringName,
      frameTitle: entry.frameLabel,
      stringTitle: entry.stringLabel,
      isHybrid: entry.type === 'hybrid',
      topStatChips,
      archetype: entry.identity?.archetype ?? '—',
      obs: entry.obs,
      mainsId,
      crossesId,
      stringId,
      racquetId: entry.racquet.id,
      tension: entry.tension,
      crossesTension: entry.crossesTension,
      entryType: entry.type,
    };
  });
}

// —— Frames ——————————————————————————————————————————————————————————————

export type LbFrameInput = {
  racquet: Racquet;
  frameBase: FrameBaseScores;
  rankVal: number;
  statKey: string;
  frameLabel: string;
};

export type LbFrameStatChipVm = { key: string; val: number; high: boolean };

export type LbFrameRowVm = {
  rank: number;
  isFeatured: boolean;
  frameName: string;
  specLine: string;
  rankVal: number;
  statChips: LbFrameStatChipVm[];
  racquetId: string;
};

export function buildLeaderboardFrameRows(results: LbFrameInput[], contextStatKeys: string[]): LbFrameRowVm[] {
  return results.slice(0, 50).map((entry, i) => {
    const rank = i + 1;
    const isFeatured = rank === 1;
    const fb = entry.frameBase as unknown as Record<string, number>;
    const frameName =
      entry.frameLabel.length > 36 ? `${entry.frameLabel.slice(0, 36)}…` : entry.frameLabel;
    const r = entry.racquet;
    const specLine = `${r.strungWeight}g · SW ${r.swingweight} · ${r.stiffness} RA · ${r.pattern} · ${r.headSize} sq in`;
    const statChips = contextStatKeys.map((k) => {
      const v = Math.round(fb[k] || 0);
      return { key: k.slice(0, 3).toUpperCase(), val: v, high: v >= 68 };
    });
    return {
      rank,
      isFeatured,
      frameName,
      specLine,
      rankVal: entry.rankVal,
      statChips,
      racquetId: r.id,
    };
  });
}

// —— Strings ——————————————————————————————————————————————————————————————

export type LbStringInput = {
  string: StringData;
  profile: StringProfileScores;
  rankVal: number;
  statKey: string;
};

export type LbStringStatChipVm = { key: string; val: number; high: boolean };

export type LbStringRowVm = {
  rank: number;
  isFeatured: boolean;
  stringName: string;
  material: string;
  specLine: string;
  rankVal: number;
  statChips: LbStringStatChipVm[];
  stringId: string;
};

export function buildLeaderboardStringRows(
  results: LbStringInput[],
  contextStatKeys: string[],
): LbStringRowVm[] {
  return results.slice(0, 50).map((entry, i) => {
    const rank = i + 1;
    const isFeatured = rank === 1;
    const s = entry.string;
    const p = entry.profile as unknown as Record<string, number>;
    const statChips = contextStatKeys.map((k) => {
      const v = Math.round(p[k] || 0);
      return { key: k.slice(0, 3).toUpperCase(), val: v, high: v >= 68 };
    });
    const specLine = `${s.gauge} · ${s.shape} · ${Math.round(s.stiffness)} lb/in`;
    return {
      rank,
      isFeatured,
      stringName: s.name,
      material: s.material || '',
      specLine,
      rankVal: entry.rankVal,
      statChips,
      stringId: s.id,
    };
  });
}
