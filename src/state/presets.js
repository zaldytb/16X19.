// Preset / Top Builds Generation
// ===============================
// Generates recommended string setups for racquets

import { STRINGS } from '../data/loader.js';
import { predictSetup } from '../engine/composite.js';
import { buildTensionContext } from '../engine/tension.js';
import { computeCompositeScore } from '../engine/composite.js';

/**
 * Generate top recommended builds for a racquet
 * @param {Object} racquet - Racquet object
 * @param {number} count - Number of builds to generate (default 6)
 * @returns {Array} Array of build objects with type, string, stats, score, etc.
 */
export function generateTopBuilds(racquet, count = 6) {
  const halfCount = Math.ceil(count / 2);
  const midT = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);

  // --- Full bed candidates ---
  const fullBuilds = [];
  STRINGS.forEach(s => {
    [racquet.tensionRange[0], midT, racquet.tensionRange[1]].forEach(t => {
      const cfg = { isHybrid: false, string: s, mainsTension: t, crossesTension: t };
      const stats = predictSetup(racquet, cfg);
      if (!stats) return;
      const tCtx = buildTensionContext(cfg, racquet);
      const score = computeCompositeScore(stats, tCtx);
      fullBuilds.push({ type: 'full', string: s, tension: t, crossesTension: t, stats, score, cfg });
    });
  });
  fullBuilds.sort((a, b) => b.score - a.score);
  const seenFull = new Map();
  const uniqueFull = [];
  for (const b of fullBuilds) {
    if (!seenFull.has(b.string.id)) {
      seenFull.set(b.string.id, true);
      uniqueFull.push(b);
    }
    if (uniqueFull.length >= halfCount * 3) break;
  }

  // --- Hybrid candidates ---
  const hybridBuilds = [];
  const topMainsIds = [...seenFull.keys()].slice(0, 8);
  const crossCandidates = STRINGS.filter(s => 
    s.material === 'Polyester' || s.material === 'Co-Polyester (elastic)' || s.material === 'Multifilament' || s.material === 'Natural Gut'
  ).slice(0, 15);
  topMainsIds.forEach(mId => {
    const mains = STRINGS.find(s => s.id === mId);
    if (!mains) return;
    crossCandidates.forEach(cross => {
      if (cross.id === mains.id) return;
      const cfg = { isHybrid: true, mains, crosses: cross, mainsTension: midT, crossesTension: midT - 2 };
      const stats = predictSetup(racquet, cfg);
      if (!stats) return;
      const tCtx = buildTensionContext(cfg, racquet);
      const score = computeCompositeScore(stats, tCtx);
      hybridBuilds.push({
        type: 'hybrid', string: mains, mains, crosses: cross,
        label: mains.name + ' / ' + cross.name,
        tension: midT, crossesTension: midT - 2,
        stats, score, cfg,
        mainsId: mains.id, crossesId: cross.id
      });
    });
  });
  hybridBuilds.sort((a, b) => b.score - a.score);
  const seenHybrid = new Map();
  const uniqueHybrid = [];
  for (const b of hybridBuilds) {
    const key = b.mainsId + '|' + b.crossesId;
    if (!seenHybrid.has(key)) {
      seenHybrid.set(key, true);
      uniqueHybrid.push(b);
    }
    if (uniqueHybrid.length >= halfCount * 3) break;
  }

  // Pick diverse from each pool
  const topFull = pickDiverseBuilds(uniqueFull, halfCount);
  const topHybrid = pickDiverseBuilds(uniqueHybrid, count - halfCount);
  return [...topFull, ...topHybrid];
}

/**
 * Pick diverse builds by archetype
 * @param {Array} builds - Array of build objects
 * @param {number} count - Number of builds to pick
 * @returns {Array} Diverse subset of builds
 */
export function pickDiverseBuilds(builds, count) {
  builds.forEach(b => {
    const s = b.stats;
    if (s.spin >= 72 && s.spin >= s.control && s.spin >= s.power) b.archetype = 'Spin Focus';
    else if (s.control >= 72 && s.control >= s.spin) b.archetype = 'Control Focus';
    else if (s.power >= 65 && s.power >= s.control) b.archetype = 'Power Focus';
    else if (s.comfort >= 68) b.archetype = 'Comfort Build';
    else if (s.feel >= 70) b.archetype = 'Feel Build';
    else if (s.durability >= 75) b.archetype = 'Durability Build';
    else b.archetype = 'Balanced';
  });

  const result = [];
  const archetypesSeen = new Set();
  for (const b of builds) {
    if (!archetypesSeen.has(b.archetype) && result.length < count) {
      archetypesSeen.add(b.archetype);
      result.push(b);
    }
  }
  for (const b of builds) {
    if (result.length >= count) break;
    if (!result.includes(b)) result.push(b);
  }
  return result.slice(0, count);
}

/**
 * Generate reason text for featured build card
 * @param {Object} build - Build object with stats, isHybrid, etc.
 * @param {Object} frameStats - Frame base stats
 * @returns {string} Reason text explaining why this build is recommended
 */
export function generateBuildReason(build, frameStats) {
  if (build.isHybrid && frameStats.spin >= 60) return 'Ranks high because this frame rewards snapback hybrids with shaped mains.';
  if (build.stats.comfort >= 70) return 'Safer choice for arm comfort without sacrificing too much spin.';
  if (build.stats.control >= 70) return 'Highest control ceiling for players who prioritize placement.';
  if (build.stats.durability >= 80) return 'Longest lasting setup — great value for frequent players.';
  if (build.stats.spin >= 75) return 'Maximum spin generation for heavy topspin game styles.';
  return 'Best overall balance of performance metrics for this frame.';
}

/**
 * Archetype colors for build cards (Digicraft Brutalism palette)
 */
export const ARCHETYPE_COLORS = {
  'Spin Focus': 'rgba(220, 223, 226, 0.9)',
  'Control Focus': 'rgba(220, 223, 226, 0.8)',
  'Power Focus': 'rgba(220, 223, 226, 0.7)',
  'Comfort Build': 'rgba(220, 223, 226, 0.75)',
  'Feel Build': 'rgba(220, 223, 226, 0.85)',
  'Durability Build': 'rgba(220, 223, 226, 0.65)',
  'Balanced': 'rgba(220, 223, 226, 0.5)'
};
