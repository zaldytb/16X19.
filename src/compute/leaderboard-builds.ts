// Leaderboard "builds" tab — catalog-scale scoring (worker + sync fallback).

import { RACQUETS, STRINGS } from '../data/loader.js';
import {
  predictSetup,
  computeCompositeScore,
  buildTensionContext,
  generateIdentity,
} from '../engine/index.js';
import type {
  Racquet,
  StringData,
  StringConfig,
  SetupStats,
  TensionContext,
  IdentityResult,
} from '../engine/types.js';
import { deriveHybridRole } from '../engine/hybridRole.js';

interface BuildConfig {
  isHybrid: boolean;
  string?: StringData;
  mains?: StringData;
  crosses?: StringData;
  mainsTension: number;
  crossesTension: number;
}

interface BestResult {
  score: number;
  statVal: number;
  obs: number;
  tension: number;
  stats: SetupStats | null;
  cfg: BuildConfig;
}

export interface LeaderboardBuildComputeResult {
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
  statKey: string;
  identity: IdentityResult;
  frameLabel: string;
  stringLabel: string;
}

export function computeLeaderboardBuildResults(
  statKey: string,
  filterType: 'both' | 'full' | 'hybrid',
  options?: { shouldAbort?: () => boolean },
): LeaderboardBuildComputeResult[] {
  const shouldAbort = options?.shouldAbort;
  const candidates: LeaderboardBuildComputeResult[] = [];

  function scoreConfig(
    racquet: Racquet,
    cfg: Omit<BuildConfig, 'mainsTension' | 'crossesTension'>,
  ): BestResult {
    const sweepMin = Math.max(racquet.tensionRange[0] - 3, 30);
    const sweepMax = Math.min(racquet.tensionRange[1] + 3, 70);
    let best: BestResult = {
      score: -1,
      statVal: 0,
      obs: 0,
      tension: 53,
      stats: null,
      cfg: { ...cfg, mainsTension: 53, crossesTension: 51 },
    };

    for (let t = sweepMin; t <= sweepMax; t += 2) {
      if (shouldAbort?.()) return best;
      const c: BuildConfig = Object.assign({}, cfg, {
        mainsTension: t,
        crossesTension: cfg.isHybrid ? t - 2 : t,
      });
      const stats = predictSetup(racquet, c as StringConfig);
      if (!stats) continue;
      const tCtx = buildTensionContext(c as StringConfig, racquet);
      const obs = computeCompositeScore(stats, tCtx);
      const rankVal = statKey === 'obs' ? obs : ((stats as unknown as Record<string, number>)[statKey] || 0);
      if (rankVal > best.score) {
        best = {
          score: rankVal,
          statVal: statKey === 'obs' ? obs : ((stats as unknown as Record<string, number>)[statKey] || 0),
          obs,
          tension: t,
          stats,
          cfg: c,
        };
      }
    }
    return best;
  }

  if (filterType !== 'hybrid') {
    (RACQUETS as unknown as Racquet[]).forEach((racquet: Racquet) => {
      (STRINGS as StringData[]).forEach((str: StringData) => {
        if (shouldAbort?.()) return;
        const cfg = { isHybrid: false, string: str };
        const best = scoreConfig(racquet, cfg);
        if (!best.stats) return;

        candidates.push({
          type: 'full',
          racquet,
          string: str,
          mains: null,
          crosses: null,
          tension: best.tension,
          crossesTension: best.tension,
          stats: best.stats,
          obs: +best.obs.toFixed(1),
          rankVal: best.score,
          statKey,
          identity: generateIdentity(best.stats, racquet, best.cfg as StringConfig),
          frameLabel: racquet.name,
          stringLabel: str.name,
        });
      });
    });
  }

  if (filterType !== 'full') {
    // Use the affinity engine's hybrid role derivation to identify cross candidates.
    // CROSS and VERSATILE strings are eligible; MAINS-classified strings are excluded.
    const crossPool = (STRINGS as StringData[]).filter((s: StringData) => {
      const role = deriveHybridRole(s).role;
      return role === 'CROSS' || role === 'VERSATILE';
    });

    const globalFull: Array<{ id: string; score: number }> = [];
    const mid = 53;
    (STRINGS as StringData[]).forEach((s: StringData) => {
      if (shouldAbort?.()) return;
      const cfg = { isHybrid: false, string: s };
      const sc = predictSetup(
        (RACQUETS as unknown as Racquet[])[0],
        Object.assign({}, cfg, { mainsTension: mid, crossesTension: mid }) as StringConfig,
      );
      if (sc) {
        globalFull.push({
          id: s.id,
          score:
            (sc as unknown as Record<string, number>)[statKey] ||
            computeCompositeScore(sc, null as unknown as TensionContext) ||
            0,
        });
      }
    });
    globalFull.sort((a, b) => b.score - a.score);
    const topMainsIds = new Set(globalFull.slice(0, 12).map((x) => x.id));
    (STRINGS as StringData[]).forEach((s: StringData) => {
      if (s.material === 'Natural Gut' || s.material === 'Multifilament') {
        topMainsIds.add(s.id);
      }
    });

    (RACQUETS as unknown as Racquet[]).forEach((racquet: Racquet) => {
      topMainsIds.forEach((mainsId) => {
        if (shouldAbort?.()) return;
        const mains = (STRINGS as StringData[]).find((s: StringData) => s.id === mainsId);
        if (!mains) return;
        crossPool.forEach((cross: StringData) => {
          if (shouldAbort?.()) return;
          if (cross.id === mains.id) return;
          const cfg = { isHybrid: true, mains, crosses: cross };
          const best = scoreConfig(racquet, cfg);
          if (!best.stats) return;

          candidates.push({
            type: 'hybrid',
            racquet,
            string: mains,
            mains,
            crosses: cross,
            tension: best.tension,
            crossesTension: best.tension - 2,
            stats: best.stats,
            obs: +best.obs.toFixed(1),
            rankVal: best.score,
            statKey,
            identity: generateIdentity(best.stats, racquet, best.cfg as StringConfig),
            frameLabel: racquet.name,
            stringLabel: mains.name + ' / ' + cross.name,
          });
        });
      });
    });
  }

  candidates.sort((a, b) => b.rankVal - a.rankVal);

  const seen = new Set<string>();
  const frameCount = new Map<string, number>();
  const MAX_PER_FRAME = 3;
  const deduped: LeaderboardBuildComputeResult[] = [];
  for (const c of candidates) {
    const key =
      c.racquet.id +
      '|' +
      (c.type === 'hybrid' ? c.mains!.id + '/' + c.crosses!.id : c.string!.id);
    if (seen.has(key)) continue;
    const frameSlots = frameCount.get(c.racquet.id) ?? 0;
    if (frameSlots >= MAX_PER_FRAME) continue;
    seen.add(key);
    frameCount.set(c.racquet.id, frameSlots + 1);
    deduped.push(c);
    if (deduped.length >= 60) break;
  }

  return deduped;
}
