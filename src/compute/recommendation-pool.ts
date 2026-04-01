// Heavy recommendation candidate pool — shared by worker and main-thread fallback.

import { STRINGS } from '../data/loader.js';
import {
  predictSetup,
  buildTensionContext,
  computeCompositeScore,
} from '../engine/index.js';
import type { Racquet, StringConfig, SetupAttributes, StringData } from '../engine/types.js';
import { toSetupAttributes } from './setup-attributes.js';

export type RecommendationPoolCandidate = {
  type: 'full' | 'hybrid';
  label: string;
  gauge?: string;
  material?: string;
  tension: number;
  score: number;
  stats: SetupAttributes;
  stringId?: string;
  mainsId?: string;
  crossesId?: string;
  string?: StringData;
  mains?: StringData;
  crosses?: StringData;
};

export function buildRecommendationPoolForRacquet(racquet: Racquet): {
  fullBed: RecommendationPoolCandidate[];
  hybrid: RecommendationPoolCandidate[];
  all: RecommendationPoolCandidate[];
} {
  const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
  const sweepMin = Math.max(racquet.tensionRange[0] - 3, 30);
  const sweepMax = Math.min(racquet.tensionRange[1] + 3, 75);

  function findOptimalTension(buildConfig: {
    isHybrid: boolean;
    mains?: StringData;
    crosses?: StringData;
    string?: StringData;
  }): { score: number; tension: number; stats: SetupAttributes | null } {
    let bestScore = -1;
    let bestTension = midTension;
    let bestStats: SetupAttributes | null = null;

    for (let t = sweepMin; t <= sweepMax; t += 1) {
      const cfg = { ...buildConfig } as StringConfig;
      cfg.mainsTension = t;
      cfg.crossesTension = t - (buildConfig.isHybrid ? 2 : 0);
      const statsRaw = predictSetup(racquet, cfg);
      if (!statsRaw) continue;
      const stats = toSetupAttributes(statsRaw);
      const tCtx = buildTensionContext(cfg, racquet);
      const score = computeCompositeScore(statsRaw, tCtx);
      if (score > bestScore) {
        bestScore = score;
        bestTension = t;
        bestStats = stats;
      }
    }
    return { score: bestScore, tension: bestTension, stats: bestStats };
  }

  const fullBedCandidates: RecommendationPoolCandidate[] = [];
  STRINGS.forEach((s) => {
    const result = findOptimalTension({ isHybrid: false, string: s });
    if (result.stats) {
      fullBedCandidates.push({
        type: 'full',
        label: s.name,
        gauge: (s.gauge || '').replace(/\s*\(.*\)/, ''),
        material: s.material,
        tension: result.tension,
        score: result.score,
        stats: result.stats,
        stringId: s.id,
        string: s,
      });
    }
  });

  const hybridCandidates: RecommendationPoolCandidate[] = [];
  fullBedCandidates.sort((a, b) => b.score - a.score);
  const topMainsIds = new Set(fullBedCandidates.slice(0, 12).map((c) => c.stringId));
  STRINGS.forEach((s) => {
    if (s.material === 'Natural Gut' || s.material === 'Multifilament') {
      topMainsIds.add(s.id);
    }
  });

  const crossCandidates = STRINGS.filter((s) => {
    const shape = (s.shape || '').toLowerCase();
    const isRoundSlick = shape.includes('round') || shape.includes('slick') || shape.includes('coated');
    const isElastic = s.material === 'Co-Polyester (elastic)';
    const isSoftPoly = s.material === 'Polyester' && s.stiffness < 200;
    return isRoundSlick || isElastic || isSoftPoly;
  });

  topMainsIds.forEach((mainsId) => {
    const mains = STRINGS.find((s) => s.id === mainsId);
    if (!mains) return;

    crossCandidates.forEach((cross) => {
      if (cross.id === mains.id) return;
      const result = findOptimalTension({
        isHybrid: true,
        mains,
        crosses: cross,
      });
      if (result.stats && result.score > 0) {
        hybridCandidates.push({
          type: 'hybrid',
          label: `${mains.name} / ${cross.name}`,
          gauge:
            (mains.gauge || '').replace(/\s*\(.*\)/, '') +
            '/' +
            (cross.gauge || '').replace(/\s*\(.*\)/, ''),
          material: `${mains.material} / ${cross.material}`,
          tension: result.tension,
          score: result.score,
          stats: result.stats,
          mainsId: mains.id,
          crossesId: cross.id,
          mains,
          crosses: cross,
        });
      }
    });
  });

  fullBedCandidates.sort((a, b) => b.score - a.score);
  hybridCandidates.sort((a, b) => b.score - a.score);
  const allCandidates = [...fullBedCandidates, ...hybridCandidates].sort((a, b) => b.score - a.score);
  return {
    fullBed: fullBedCandidates.slice(0, 5),
    hybrid: hybridCandidates.slice(0, 5),
    all: allCandidates,
  };
}
