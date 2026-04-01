// Optimizer candidate generation — shared by worker and sync fallback (no getScoredSetup cache).

import { RACQUETS, STRINGS } from '../data/loader.js';
import {
  predictSetup,
  buildTensionContext,
  computeCompositeScore,
} from '../engine/index.js';
import type { Racquet, StringData, SetupAttributes, StringConfig } from '../engine/types.js';
import { toSetupAttributes } from './setup-attributes.js';

export interface OptimizerScanParams {
  racquetId: string;
  filteredStringIds: string[];
  setupType: 'full' | 'hybrid' | 'both';
  lockSide: 'none' | 'mains' | 'crosses';
  lockStringId: string | null;
  tensionMin: number;
  tensionMax: number;
  sortBy: string;
  mins: {
    spin: number;
    control: number;
    power: number;
    comfort: number;
    feel: number;
    durability: number;
    playability: number;
    stability: number;
    maneuverability: number;
  };
  upgradeMode: boolean;
  currentOBS: number;
  currentStats: SetupAttributes | null;
  upgradeOBS: number;
  upgradeCtlLoss: number;
  upgradeDurLoss: number;
}

export interface OptimizerScanCandidateDTO {
  type: 'full' | 'hybrid';
  label: string;
  gauge?: string;
  tension: number;
  crossesTension?: number;
  score: number;
  stats: SetupAttributes;
  stringDataId?: string;
  mainsDataId?: string;
  crossesDataId?: string;
}

function scoreSetup(racquet: Racquet, cfg: StringConfig): { stats: SetupAttributes; obs: number } {
  const statsRaw = predictSetup(racquet, cfg);
  const stats = toSetupAttributes(statsRaw);
  const tCtx = buildTensionContext(cfg, racquet);
  const obs = computeCompositeScore(statsRaw, tCtx);
  return { stats, obs };
}

/**
 * Pure optimizer scan — matches legacy optimize.ts scoring (predictSetup + OBS).
 */
export function runOptimizerScan(
  params: OptimizerScanParams,
  options?: { shouldAbort?: () => boolean },
): OptimizerScanCandidateDTO[] {
  const shouldAbort = options?.shouldAbort;

  const racquet =
    (RACQUETS as unknown as Racquet[]).find((r) => r.id === params.racquetId) ||
    (RACQUETS[0] as unknown as Racquet);

  const idSet = new Set(params.filteredStringIds);
  const filteredStrings = (STRINGS as StringData[]).filter((s) => idSet.has(s.id));

  const lockedString = params.lockStringId
    ? STRINGS.find((s) => s.id === params.lockStringId) ?? null
    : null;

  const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
  const sweepMin = Math.max(params.tensionMin, 30);
  const sweepMax = Math.min(params.tensionMax, 75);

  function findOptimalTension(buildConfig: {
    isHybrid: boolean;
    string?: StringData;
    mains?: StringData;
    crosses?: StringData;
  }): { score: number; tension: number; stats: SetupAttributes | null } {
    let bestScore = -1;
    let bestTension = midTension;
    let bestStats: SetupAttributes | null = null;
    for (let t = sweepMin; t <= sweepMax; t += 1) {
      if (shouldAbort?.()) return { score: -1, tension: bestTension, stats: bestStats };
      const cfg = {
        ...buildConfig,
        mainsTension: t,
        crossesTension: t - (buildConfig.isHybrid ? 2 : 0),
      } as StringConfig;
      const { stats, obs } = scoreSetup(racquet, cfg);
      if (obs > bestScore) {
        bestScore = obs;
        bestTension = t;
        bestStats = stats;
      }
    }
    return { score: bestScore, tension: bestTension, stats: bestStats };
  }

  const candidates: OptimizerScanCandidateDTO[] = [];
  const fullResults = new Map<string, ReturnType<typeof findOptimalTension>>();

  const setupType = params.setupType;
  const lockSide = params.lockSide;

  if (setupType === 'full' || setupType === 'both') {
    for (let index = 0; index < filteredStrings.length; index += 1) {
      if (shouldAbort?.()) return candidates;
      const s = filteredStrings[index];
      const result = findOptimalTension({ isHybrid: false, string: s });
      fullResults.set(s.id, result);
      if (result.stats) {
        candidates.push({
          type: 'full',
          label: s.name,
          gauge: (s.gauge || '').replace(/\s*\(.*\)/, ''),
          tension: result.tension,
          crossesTension: result.tension,
          score: result.score,
          stats: result.stats,
          stringDataId: s.id,
        });
      }
    }
  }

  if (setupType === 'hybrid' || setupType === 'both') {
    let hybridMainsPool: StringData[];
    let hybridCrossesPool: StringData[];

    if (lockSide === 'mains' && lockedString) {
      hybridMainsPool = [lockedString];
      hybridCrossesPool = filteredStrings.filter((s) => s.id !== lockedString.id);
    } else if (lockSide === 'crosses' && lockedString) {
      hybridMainsPool = filteredStrings;
      hybridCrossesPool = [lockedString];
    } else {
      const tempFullForRanking: Array<{ stringId: string; score: number }> = [];
      filteredStrings.forEach((s) => {
        const result = fullResults.get(s.id) || findOptimalTension({ isHybrid: false, string: s });
        fullResults.set(s.id, result);
        if (result.stats) tempFullForRanking.push({ stringId: s.id, score: result.score });
      });
      tempFullForRanking.sort((a, b) => b.score - a.score);
      const topMainsIds = new Set(tempFullForRanking.slice(0, 12).map((c) => c.stringId));
      filteredStrings.forEach((s) => {
        if (s.material === 'Natural Gut' || s.material === 'Multifilament') topMainsIds.add(s.id);
      });
      hybridMainsPool = filteredStrings.filter((s) => topMainsIds.has(s.id));

      hybridCrossesPool = filteredStrings.filter((s) => {
        const shape = (s.shape || '').toLowerCase();
        const isRoundSlick = shape.includes('round') || shape.includes('slick') || shape.includes('coated');
        const isElastic = s.material === 'Co-Polyester (elastic)';
        const isSoftPoly = s.material === 'Polyester' && s.stiffness < 200;
        return isRoundSlick || isElastic || isSoftPoly;
      });
    }

    for (const mains of hybridMainsPool) {
      for (const cross of hybridCrossesPool) {
        if (shouldAbort?.()) return candidates;
        if (cross.id === mains.id) continue;
        const result = findOptimalTension({ isHybrid: true, mains, crosses: cross });
        if (result.stats && result.score > 0) {
          candidates.push({
            type: 'hybrid',
            label: `${mains.name} / ${cross.name}`,
            gauge:
              (mains.gauge || '').replace(/\s*\(.*\)/, '') + '/' + (cross.gauge || '').replace(/\s*\(.*\)/, ''),
            tension: result.tension,
            crossesTension: result.tension - 2,
            score: result.score,
            stats: result.stats,
            mainsDataId: mains.id,
            crossesDataId: cross.id,
          });
        }
      }
    }
  }

  const mins = params.mins;
  let filteredCandidates = candidates.filter(
    (c) =>
      c.stats.spin >= mins.spin &&
      c.stats.control >= mins.control &&
      c.stats.power >= mins.power &&
      c.stats.comfort >= mins.comfort &&
      c.stats.feel >= mins.feel &&
      c.stats.durability >= mins.durability &&
      c.stats.playability >= mins.playability &&
      c.stats.stability >= mins.stability &&
      c.stats.maneuverability >= mins.maneuverability,
  );

  if (params.upgradeMode && params.currentStats) {
    const cur = params.currentStats;
    filteredCandidates = filteredCandidates.filter((c) => {
      if (c.score < params.currentOBS + params.upgradeOBS) return false;
      if (cur.control - c.stats.control > params.upgradeCtlLoss) return false;
      if (cur.durability - c.stats.durability > params.upgradeDurLoss) return false;
      return true;
    });
  }

  const sortBy = params.sortBy;
  filteredCandidates.sort((a, b) => {
    if (sortBy === 'obs') return b.score - a.score;
    return (
      ((b.stats as unknown as Record<string, number>)[sortBy] || 0) -
      ((a.stats as unknown as Record<string, number>)[sortBy] || 0)
    );
  });

  return filteredCandidates;
}
