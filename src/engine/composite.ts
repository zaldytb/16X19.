// src/engine/composite.ts
// Composite scoring, identity generation, and OBS calculations

import { clamp, calcFrameBase } from './frame-physics.js';
import { calcBaseStringProfile, calcStringFrameMod } from './string-profile.js';
import { calcTensionModifier, buildTensionContext } from './tension.js';
import { calcHybridInteraction } from './hybrid.js';
import { OBS_TIERS, IDENTITY_FAMILIES, WTTN_ATTRS } from './constants.js';
import { FRAME_META as DEFAULT_FRAME_META, FRAME_NOVELTY_PROFILE } from '../data/loader.js';
import type {
  Racquet,
  FrameMeta,
  FrameBaseScores,
  FrameNoveltyAdjustment,
  FrameNoveltyBreakdown,
  FrameNoveltyProfile,
  StringConfig,
  SetupStats,
  SetupAttributes,
  StringFrameMod,
  StringProfileScores,
  ObsTier,
  TensionContext,
  IdentityResult,
  ClassifyResult,
  NoveltyBreakdown,
  NoveltyContext,
  NoveltySignal,
  SetupDebug,
} from './types';

const ZERO_NOVELTY_ADJUSTMENT: FrameNoveltyAdjustment = {
  power: 0,
  spin: 0,
  control: 0,
  launch: 0,
  comfort: 0,
  stability: 0,
  forgiveness: 0,
  feel: 0,
  maneuverability: 0,
  durability: 0,
  playability: 0
};

/**
 * PREDICTION LAYER 4 — Full setup prediction.
 * Orchestrates frame base + string profile + tension modifier + hybrid interaction.
 * @param racquet — racquet data
 * @param stringConfig — { isHybrid, mains, crosses, string, mainsTension, crossesTension }
 * @returns final attribute scores + debug info
 */
export function predictSetup(racquet: Racquet, stringConfig: StringConfig, frameMeta?: Record<string, FrameMeta>): SetupStats {
  const rawFrameBase = calcFrameBase(racquet, frameMeta);
  const metaSource = frameMeta || (DEFAULT_FRAME_META as Record<string, FrameMeta>);
  const resolvedFrameMeta = metaSource[racquet.id] || { aeroBonus: 0, comfortTech: 0, spinTech: 0, genBonus: 0 };
  const frameNoveltyProfile = (FRAME_NOVELTY_PROFILE as Record<string, FrameNoveltyProfile>)[racquet.id] || null;
  const noveltyContext = {
    racquet,
    frameMeta: resolvedFrameMeta,
    frameNoveltyProfile
  };
  const frameNovelty = computeNoveltyBreakdown(rawFrameBase, noveltyContext);
  const frameBase = applyFrameNovelty(rawFrameBase, frameNovelty.attributeBoosts);

  let stringMod: StringFrameMod;
  let stringProfile: StringProfileScores;
  let avgTension: number;

  if (stringConfig.isHybrid) {
    const mainsMod = calcStringFrameMod(stringConfig.mains);
    const crossesMod = calcStringFrameMod(stringConfig.crosses);
    const mainsProfile = calcBaseStringProfile(stringConfig.mains);
    const crossesProfile = calcBaseStringProfile(stringConfig.crosses);

    const hybridMods = calcHybridInteraction(stringConfig.mains, stringConfig.crosses);

    stringMod = {
      powerMod: mainsMod.powerMod * 0.7 + crossesMod.powerMod * 0.3 + hybridMods.powerMod,
      spinMod: mainsMod.spinMod * 0.7 + crossesMod.spinMod * 0.3 + hybridMods.spinMod,
      controlMod: mainsMod.controlMod * 0.3 + crossesMod.controlMod * 0.7 + hybridMods.controlMod,
      comfortMod: mainsMod.comfortMod * 0.7 + crossesMod.comfortMod * 0.3 + hybridMods.comfortMod,
      feelMod: mainsMod.feelMod * 0.7 + crossesMod.feelMod * 0.3 + hybridMods.feelMod,
      launchMod: mainsMod.launchMod * 0.7 + crossesMod.launchMod * 0.3 + hybridMods.launchMod
    };

    // Hybrid power ceiling: diminishing returns above threshold.
    // Above ~78, additional power-profile contributions reduce shot certainty
    // (control consistency and ball contact precision) rather than adding
    // meaningful extra velocity. Applies only in the hybrid path where two
    // power profiles are being compounded.
    const HYBRID_POWER_THRESHOLD = 78;
    const HYBRID_POWER_ABSORPTION = 0.45; // 55% of excess above threshold is returned
    const rawHybridPower = mainsProfile.power * 0.7 + crossesProfile.power * 0.3;
    const hybridPower = rawHybridPower <= HYBRID_POWER_THRESHOLD
      ? rawHybridPower
      : HYBRID_POWER_THRESHOLD + (rawHybridPower - HYBRID_POWER_THRESHOLD) * (1 - HYBRID_POWER_ABSORPTION);

    stringProfile = {
      power: hybridPower,
      spin: mainsProfile.spin * 0.6 + crossesProfile.spin * 0.4,
      control: mainsProfile.control * 0.4 + crossesProfile.control * 0.6,
      feel: mainsProfile.feel * 0.7 + crossesProfile.feel * 0.3,
      comfort: mainsProfile.comfort * 0.7 + crossesProfile.comfort * 0.3,
      durability: mainsProfile.durability * 0.4 + crossesProfile.durability * 0.6 + hybridMods.durabilityMod,
      playability: mainsProfile.playability * 0.6 + crossesProfile.playability * 0.4 + (hybridMods.playabilityMod || 0)
    };

    avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  } else {
    stringMod = calcStringFrameMod(stringConfig.string);
    stringProfile = calcBaseStringProfile(stringConfig.string);
    stringMod.launchMod = stringMod.launchMod || 0;
    avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  }

  const tensionMod = calcTensionModifier(stringConfig.mainsTension, stringConfig.crossesTension, racquet.tensionRange as [number, number], racquet.pattern as string);

  const FW = 0.72; // frame weight
  const SW = 0.28; // string profile weight

  const stats: SetupStats = {
    spin: clamp(frameBase.spin * FW + stringProfile.spin * SW + stringMod.spinMod + tensionMod.spinMod),
    power: clamp(frameBase.power * FW + stringProfile.power * SW + stringMod.powerMod + tensionMod.powerMod),
    control: clamp(frameBase.control * FW + stringProfile.control * SW + stringMod.controlMod + tensionMod.controlMod),
    launch: clamp(frameBase.launch + stringMod.launchMod + tensionMod.launchMod),
    feel: clamp(frameBase.feel * FW + stringProfile.feel * SW + stringMod.feelMod + tensionMod.feelMod),
    comfort: clamp(frameBase.comfort * FW + stringProfile.comfort * SW + stringMod.comfortMod + tensionMod.comfortMod),
    stability: clamp(frameBase.stability),
    forgiveness: clamp(frameBase.forgiveness),
    maneuverability: clamp(frameBase.maneuverability),
    durability: clamp(stringProfile.durability + (tensionMod.durabilityMod || 0)),
    playability: clamp(stringProfile.playability + tensionMod.playabilityMod)
  };

  stats._debug = {
    rawFrameBase,
    frameBase,
    frameNovelty,
    stringProfile,
    stringMod,
    tensionMod,
    _frameDebug: frameBase._frameDebug,
    hybridInteraction: stringConfig.isHybrid ? calcHybridInteraction(stringConfig.mains, stringConfig.crosses) : null,
    noveltyContext
  };

  return stats;
}

function clampFloat(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function cloneAdjustment(): FrameNoveltyAdjustment {
  return { ...ZERO_NOVELTY_ADJUSTMENT };
}

function addAdjustment(target: FrameNoveltyAdjustment, patch: Partial<FrameNoveltyAdjustment>, scale: number = 1): void {
  for (const [key, value] of Object.entries(patch) as Array<[keyof FrameNoveltyAdjustment, number | undefined]>) {
    if (!value) continue;
    target[key] = round2(target[key] + value * scale);
  }
}

function applyFrameNovelty(frameBase: FrameBaseScores, boosts: FrameNoveltyAdjustment): FrameBaseScores {
  return {
    ...frameBase,
    power: clamp(frameBase.power + boosts.power),
    spin: clamp(frameBase.spin + boosts.spin),
    control: clamp(frameBase.control + boosts.control),
    launch: clamp(frameBase.launch + boosts.launch),
    comfort: clamp(frameBase.comfort + boosts.comfort),
    stability: clamp(frameBase.stability + boosts.stability),
    forgiveness: clamp(frameBase.forgiveness + boosts.forgiveness),
    feel: clamp(frameBase.feel + boosts.feel),
    maneuverability: clamp(frameBase.maneuverability + boosts.maneuverability),
    durability: clamp(frameBase.durability + boosts.durability),
    playability: clamp(frameBase.playability + boosts.playability)
  };
}

function getPatternDensity(pattern: string): number {
  const [mains, crosses] = pattern.split('x').map(Number);
  return mains * crosses;
}

function getAverageBeam(beamWidth: number[]): number {
  return beamWidth.reduce((sum, width) => sum + width, 0) / beamWidth.length;
}

function scoreCluster(values: number[], thresholds: number[], base: number, weight: number, maxScore: number, bonus: number = 0): number {
  const qualifies = values.every((value, idx) => value >= thresholds[idx]);
  if (!qualifies) return 0;
  const excess = values.reduce((sum, value, idx) => sum + Math.max(0, value - thresholds[idx]), 0);
  return round2(Math.min(base + excess * weight + bonus, maxScore));
}

function getNoveltyContext(stats: SetupAttributes, noveltyContext?: NoveltyContext | null): NoveltyContext | null {
  if (noveltyContext) return noveltyContext;
  const debug = (stats as SetupStats)._debug as SetupDebug | undefined;
  return debug?.noveltyContext || null;
}

function getNoveltySourceStats(stats: SetupAttributes): SetupAttributes {
  const debug = (stats as SetupStats)._debug as SetupDebug | undefined;
  return debug?.rawFrameBase || stats;
}

function computeOutcomeContradictionScore(stats: SetupAttributes, noveltyContext: NoveltyContext | null): { bonus: number; signals: NoveltySignal[]; archetypes: string[]; attributeBoosts: FrameNoveltyAdjustment } {
  const candidates: NoveltySignal[] = [];
  const attributeBoosts = cloneAdjustment();
  const hintWeights = noveltyContext?.frameNoveltyProfile?.hintWeights || {
    controlBomber: 0,
    plushLauncher: 0,
    stableWhipper: 0,
    preciseSpinner: 0,
    comfortableAttacker: 0
  };

  const controlBomber = scoreCluster(
    [stats.power, stats.control, stats.spin],
    [61, 69, 68],
    0.65,
    0.07,
    2.15,
    stats.launch >= 58 ? 0.1 : 0
  ) + hintWeights.controlBomber * 0.18;
  if (controlBomber > 0) {
    candidates.push({
      id: 'controlBomber',
      label: 'Control bomber',
      source: 'outcome',
      score: round2(controlBomber),
      detail: hintWeights.controlBomber > 0
        ? 'Power, control, and spin all clear their normal tradeoff zone together; review hints reinforce the frame leaning.'
        : 'Power, control, and spin all clear their normal tradeoff zone together.'
    });
    addAdjustment(attributeBoosts, {
      power: 0.12 + controlBomber * 0.08,
      control: 0.16 + controlBomber * 0.1,
      spin: 0.14 + controlBomber * 0.09,
      launch: 0.04 + controlBomber * 0.03
    });
  }

  const plushLauncher = scoreCluster(
    [stats.power, stats.comfort, stats.forgiveness],
    [63, 66, 63],
    0.55,
    0.06,
    1.85
  ) + hintWeights.plushLauncher * 0.18;
  if (plushLauncher > 0) {
    candidates.push({
      id: 'plushLauncher',
      label: 'Plush launcher',
      source: 'outcome',
      score: round2(plushLauncher),
      detail: hintWeights.plushLauncher > 0
        ? 'Easy power, arm-friendliness, and forgiveness are all elevated at once; review hints support the contradiction.'
        : 'Easy power, arm-friendliness, and forgiveness are all elevated at once.'
    });
    addAdjustment(attributeBoosts, {
      power: 0.1 + plushLauncher * 0.06,
      comfort: 0.2 + plushLauncher * 0.12,
      forgiveness: 0.14 + plushLauncher * 0.08,
      feel: 0.04 + plushLauncher * 0.03
    });
  }

  const stableWhipper = scoreCluster(
    [stats.stability, stats.maneuverability, stats.spin],
    [58, 60, 72],
    0.55,
    0.05,
    2.05,
    stats.power >= 60 ? 0.1 : 0
  ) + hintWeights.stableWhipper * 0.18;
  if (stableWhipper > 0) {
    candidates.push({
      id: 'stableWhipper',
      label: 'Stable whipper',
      source: 'outcome',
      score: round2(stableWhipper),
      detail: hintWeights.stableWhipper > 0
        ? 'Stability stays high without giving up whip speed or spin access; review hints reinforce the frame character.'
        : 'Stability stays high without giving up whip speed or spin access.'
    });
    addAdjustment(attributeBoosts, {
      stability: 0.12 + stableWhipper * 0.08,
      maneuverability: 0.16 + stableWhipper * 0.1,
      spin: 0.1 + stableWhipper * 0.07
    });
  }

  const preciseSpinner = scoreCluster(
    [stats.control, stats.spin, stats.launch],
    [69, 68, 55],
    0.55,
    0.06,
    1.75,
    stats.feel >= 64 ? 0.1 : 0
  ) + hintWeights.preciseSpinner * 0.18;
  if (preciseSpinner > 0) {
    candidates.push({
      id: 'preciseSpinner',
      label: 'Precise spinner',
      source: 'outcome',
      score: round2(preciseSpinner),
      detail: hintWeights.preciseSpinner > 0
        ? 'Launch and spin stay lively while directional confidence remains strong; reviewer hints support the aimed-spin profile.'
        : 'Launch and spin stay lively while directional confidence remains strong.'
    });
    addAdjustment(attributeBoosts, {
      control: 0.14 + preciseSpinner * 0.08,
      spin: 0.1 + preciseSpinner * 0.06,
      launch: 0.08 + preciseSpinner * 0.05,
      feel: 0.04 + preciseSpinner * 0.03
    });
  }

  const comfortableAttacker = scoreCluster(
    [stats.comfort, stats.power, stats.feel],
    [67, 64, 63],
    0.5,
    0.06,
    1.65,
    stats.control >= 66 ? 0.1 : 0
  ) + hintWeights.comfortableAttacker * 0.18;
  if (comfortableAttacker > 0) {
    candidates.push({
      id: 'comfortableAttacker',
      label: 'Comfortable attacker',
      source: 'outcome',
      score: round2(comfortableAttacker),
      detail: hintWeights.comfortableAttacker > 0
        ? 'The frame finishes points with pace but still feels cushioned and connected; review hints lean the same way.'
        : 'The frame finishes points with pace but still feels cushioned and connected.'
    });
    addAdjustment(attributeBoosts, {
      comfort: 0.16 + comfortableAttacker * 0.09,
      power: 0.12 + comfortableAttacker * 0.07,
      feel: 0.12 + comfortableAttacker * 0.06,
      control: 0.04 + comfortableAttacker * 0.03
    });
  }

  const signals = candidates.sort((a, b) => b.score - a.score).slice(0, 3);
  const bonus = round2(Math.min(signals.reduce((sum, signal) => sum + signal.score, 0), 4.2));
  return { bonus, signals, archetypes: signals.map((signal) => signal.id), attributeBoosts };
}

function computeSpecContradictionScore(stats: SetupAttributes, noveltyContext: NoveltyContext | null): { bonus: number; signals: NoveltySignal[]; attributeBoosts: FrameNoveltyAdjustment } {
  if (!noveltyContext) return { bonus: 0, signals: [], attributeBoosts: cloneAdjustment() };

  const { racquet, frameMeta } = noveltyContext;
  const avgBeam = getAverageBeam(racquet.beamWidth);
  const patternDensity = getPatternDensity(racquet.pattern);
  const candidates: NoveltySignal[] = [];
  const attributeBoosts = cloneAdjustment();

  const densePatternSpin = patternDensity >= 320
    ? scoreCluster([stats.spin, stats.control], [69, 68], 0.35, 0.04, 0.85)
    : 0;
  if (densePatternSpin > 0) {
    candidates.push({
      id: 'densePatternSpinSurprise',
      label: 'Dense-pattern spin surprise',
      source: 'spec',
      score: densePatternSpin,
      detail: 'A denser layout is still producing standout spin without losing control.'
    });
    addAdjustment(attributeBoosts, {
      spin: 0.06 + densePatternSpin * 0.05,
      control: 0.05 + densePatternSpin * 0.04
    });
  }

  const powerComfortSurprise = (racquet.stiffness >= 66 || avgBeam >= 23 || frameMeta.aeroBonus >= 1.5)
    ? scoreCluster([stats.power, stats.comfort], [62, 64], 0.35, 0.055, 0.95)
    : 0;
  if (powerComfortSurprise > 0) {
    candidates.push({
      id: 'powerComfortSurprise',
      label: 'Power-comfort surprise',
      source: 'spec',
      score: powerComfortSurprise,
      detail: 'The frame spec leans modern and punchy, yet the final result still lands plush.'
    });
    addAdjustment(attributeBoosts, {
      comfort: 0.08 + powerComfortSurprise * 0.05,
      feel: 0.03 + powerComfortSurprise * 0.03
    });
  }

  const stableWhipSurprise = (racquet.swingweight >= 323 || racquet.strungWeight >= 324)
    ? scoreCluster([stats.stability, stats.maneuverability], [66, 66], 0.3, 0.05, 0.85, stats.spin >= 68 ? 0.08 : 0)
    : 0;
  if (stableWhipSurprise > 0) {
    candidates.push({
      id: 'stableWhipSurprise',
      label: 'Stable-whip spec surprise',
      source: 'spec',
      score: stableWhipSurprise,
      detail: 'The mass profile suggests plow, but the outcome still swings fast and lively.'
    });
    addAdjustment(attributeBoosts, {
      stability: 0.05 + stableWhipSurprise * 0.04,
      maneuverability: 0.06 + stableWhipSurprise * 0.04
    });
  }

  const openPatternPrecision = patternDensity <= 304
    ? scoreCluster([stats.control, stats.spin], [70, 67], 0.3, 0.045, 0.75)
    : 0;
  if (openPatternPrecision > 0) {
    candidates.push({
      id: 'openPatternPrecisionSurprise',
      label: 'Open-pattern precision surprise',
      source: 'spec',
      score: openPatternPrecision,
      detail: 'An open spin-friendly layout is still holding strong point-to-point precision.'
    });
    addAdjustment(attributeBoosts, {
      control: 0.05 + openPatternPrecision * 0.04,
      spin: 0.02 + openPatternPrecision * 0.02
    });
  }

  const signals = candidates.sort((a, b) => b.score - a.score).slice(0, 2);
  const bonus = round2(Math.min(signals.reduce((sum, signal) => sum + signal.score, 0), 1.8));
  return { bonus, signals, attributeBoosts };
}

function computeRarityBonus(noveltyContext: NoveltyContext | null, matchedContradictions: number): { bonus: number; signals: NoveltySignal[] } {
  const profile = noveltyContext?.frameNoveltyProfile;
  if (!profile || matchedContradictions <= 0 || profile.rarityScore <= 0) {
    return { bonus: 0, signals: [] };
  }

  const multiplier = matchedContradictions >= 3 ? 0.7 : matchedContradictions === 2 ? 0.55 : 0.35;
  let bonus = profile.rarityScore * multiplier;
  if (profile.bucketSize <= 3 && matchedContradictions >= 2) bonus += 0.12;
  bonus = round2(Math.min(bonus, 0.8));

  if (bonus <= 0 || profile.rarityTags.length === 0) {
    return { bonus: 0, signals: [] };
  }

  const topTags = [...profile.rarityTags].sort((a, b) => b.score - a.score).slice(0, 2);
  const tagWeight = topTags.reduce((sum, tag) => sum + tag.score, 0) || 1;
  const signals = topTags.map((tag, idx) => ({
    id: idx === 0 ? 'frameRarityAmplifier' : `frameRarityAmplifier${idx + 1}`,
    label: idx === 0 ? 'Rare frame profile' : `Rare frame trait: ${tag.label}`,
    source: 'rarity' as const,
    score: round2((tag.score / tagWeight) * bonus),
    detail: `Bucket ${profile.bucketKey} has ${profile.bucketSize} frame${profile.bucketSize === 1 ? '' : 's'}; ${tag.label} helps amplify the contradiction.`
  }));

  return { bonus, signals };
}

export function computeNoveltyBreakdown(stats: SetupAttributes, noveltyContext?: NoveltyContext | null): FrameNoveltyBreakdown {
  const sourceStats = getNoveltySourceStats(stats);
  const resolvedContext = getNoveltyContext(stats, noveltyContext);
  const outcome = computeOutcomeContradictionScore(sourceStats, resolvedContext);
  const spec = computeSpecContradictionScore(sourceStats, resolvedContext);
  const rarity = computeRarityBonus(resolvedContext, outcome.signals.length + spec.signals.length);
  const attributeBoosts = cloneAdjustment();
  addAdjustment(attributeBoosts, outcome.attributeBoosts);
  addAdjustment(attributeBoosts, spec.attributeBoosts);
  const rarityMultiplier = 1 + rarity.bonus * 0.12;
  const amplifiedBoosts = cloneAdjustment();
  addAdjustment(amplifiedBoosts, attributeBoosts, rarityMultiplier);
  for (const key of Object.keys(amplifiedBoosts) as Array<keyof FrameNoveltyAdjustment>) {
    amplifiedBoosts[key] = round2(clampFloat(amplifiedBoosts[key], 0, 2.5));
  }
  const totalBonus = round2(Math.min(outcome.bonus + spec.bonus + rarity.bonus, 6));

  return {
    totalBonus,
    outcomeBonus: outcome.bonus,
    specBonus: spec.bonus,
    rarityBonus: rarity.bonus,
    archetypes: outcome.archetypes,
    signals: [...outcome.signals, ...spec.signals, ...rarity.signals].sort((a, b) => b.score - a.score),
    attributeBoosts: amplifiedBoosts
  };
}

/**
 * Compute overall build score (OBS) from stats and tension context.
 * @param stats — attribute scores
 * @param tensionContext — { avgTension, tensionRange, differential, patternCrosses }
 * @returns OBS score 0-100
 */
export function computeCompositeScore(stats: SetupAttributes, tensionContext: TensionContext | null): number {
  const raw = stats.control * 0.16
            + stats.spin * 0.13
            + stats.comfort * 0.13
            + stats.power * 0.11
            + stats.feel * 0.10
            + stats.maneuverability * 0.09
            + stats.stability * 0.07
            + stats.forgiveness * 0.07
            + stats.playability * 0.06
            + stats.launch * 0.04
            + stats.durability * 0.04;

  let scaled = 22 + (raw - 58) * 8.5;

  // Tension sanity penalty
  if (tensionContext) {
    const { avgTension, tensionRange } = tensionContext;
    const low = tensionRange[0];
    const high = tensionRange[1];
    const margin = 8;

    if (avgTension < low - margin) {
      const deficit = (low - margin) - avgTension;
      const penalty = Math.min(deficit * 3, 90);
      scaled -= penalty;
    } else if (avgTension < low) {
      const deficit = low - avgTension;
      scaled -= deficit * 1.5;
    }

    if (avgTension > high + margin) {
      const excess = avgTension - (high + margin);
      const penalty = Math.min(excess * 2.5, 80);
      scaled -= penalty;
    } else if (avgTension > high) {
      const excess = avgTension - high;
      scaled -= excess * 1.2;
    }

    // Mains/Crosses differential penalty
    if (tensionContext.differential !== undefined) {
      const diff = tensionContext.differential;
      const absDiff = Math.abs(diff);
      const patCrosses = tensionContext.patternCrosses || 19;
      const isDense20 = patCrosses >= 20;
      const fwdThreshold = isDense20 ? 4 : 6;
      const revThreshold = isDense20 ? 4 : 4;
      const extremeThreshold = 10;

      if (absDiff > extremeThreshold) {
        scaled -= 12 + (absDiff - extremeThreshold) * 5;
      } else if (diff > fwdThreshold) {
        const excess = diff - fwdThreshold;
        scaled -= excess * (isDense20 ? 4 : 3);
      }

      if (diff < -revThreshold && !isDense20) {
        scaled -= (absDiff - revThreshold) * 3;
      } else if (diff < -(revThreshold + 2) && isDense20) {
        scaled -= (absDiff - revThreshold - 2) * 2.5;
      }
    }
  }

  return Math.max(0, Math.min(100, scaled));
}

/**
 * Get OBS tier label for a score.
 * @param score — OBS score
 * @returns tier with min, max, label
 */
export function getObsTier(score: number): ObsTier {
  for (let i = OBS_TIERS.length - 1; i >= 0; i--) {
    if (score >= OBS_TIERS[i].min) return OBS_TIERS[i];
  }
  return OBS_TIERS[0];
}

/**
 * Get color for OBS score display.
 * @param score — OBS score
 * @returns CSS color value
 */
export function getObsScoreColor(score: number): string {
  return 'var(--dc-white)';
}

/**
 * Generate identity archetype and description from stats.
 * @param stats — attribute scores
 * @param racquet — racquet data
 * @param stringConfig — string configuration
 * @returns { archetype, description, tags }
 */
export function generateIdentity(stats: SetupAttributes, racquet: Racquet, stringConfig: StringConfig): IdentityResult {
  const candidates = [
    { name: 'Precision Topspin Blade', score: (stats.spin >= 80 ? 20 : 0) + (stats.control >= 85 ? 20 : 0) + (stats.power < 55 ? 10 : 0), req: stats.spin >= 78 && stats.control >= 82 && stats.power < 60 },
    { name: 'Surgical Topspin Machine', score: (stats.spin - 70) * 2 + (stats.control - 65) * 1.5, req: stats.spin >= 75 && stats.control >= 65 && stats.control < 82 },
    { name: 'Topspin Howitzer', score: (stats.spin - 70) * 3 + (stats.power - 60) * 2, req: stats.spin >= 78 && stats.power >= 65 && stats.spin >= stats.power },
    { name: 'Power Spin Hybrid', score: (stats.power - 60) * 3 + (stats.spin - 70) * 2, req: stats.spin >= 75 && stats.power >= 70 && stats.power > stats.spin },
    { name: 'Spin Dominator', score: (stats.spin - 65) * 2.5, req: stats.spin >= 75 && stats.power < 65 && stats.control < 82 },
    { name: 'Power Brawler', score: (stats.power - 65) * 3 + (100 - stats.control) * 0.5, req: stats.power >= 75 && stats.control <= 65 },
    { name: 'Power Hybrid', score: (stats.power - 55) * 1.5 + (stats.spin - 50) * 0.5, req: stats.power >= 65 && stats.power < 80 && stats.spin < 78 && stats.control > 55 },
    { name: 'Precision Instrument', score: (stats.control - 75) * 3 + (stats.feel - 60) * 1.5, req: stats.control >= 82 && stats.spin < 78 },
    { name: 'Control Platform', score: (stats.control - 65) * 2, req: stats.control >= 70 && stats.control < 82 && stats.spin < 75 },
    { name: 'Comfort Cannon', score: (stats.comfort - 65) * 2 + (stats.power - 55) * 1.5, req: stats.comfort >= 72 && stats.power >= 65 },
    { name: 'Touch Artist', score: (stats.feel - 70) * 2.5 + (stats.comfort - 60), req: stats.feel >= 75 && stats.control >= 70 && stats.power < 65 },
    { name: 'Wall of Stability', score: (stats.stability - 65) * 3 + (stats.control - 60), req: stats.stability >= 70 && stats.control >= 70 },
    { name: 'Forgiving Weapon', score: (stats.forgiveness - 60) * 2 + (stats.power - 55) * 1.5, req: stats.forgiveness >= 68 && stats.power >= 60 },
    { name: 'Whip Master', score: (stats.maneuverability - 65) * 2.5 + (stats.spin - 60) * 1.5, req: stats.maneuverability >= 72 && stats.spin >= 68 },
    { name: 'Speed Demon', score: (stats.maneuverability - 70) * 3 + (stats.power - 55) * 1, req: stats.maneuverability >= 75 && stats.power >= 55 && stats.stability < 60 },
    { name: 'Endurance Build', score: (stats.playability - 80) * 3 + (stats.durability - 75) * 2, req: stats.playability >= 88 && stats.durability >= 80 },
    { name: 'Marathon Setup', score: (stats.durability - 80) * 2.5 + (stats.playability - 75) * 2, req: stats.durability >= 85 && stats.playability >= 82 },
  ];

  const valid = candidates.filter(c => c.req).sort((a, b) => b.score - a.score);
  const archetype = valid.length > 0 ? valid[0].name : 'Balanced Setup';

  const descriptions: Record<string, string> = {
    'Precision Topspin Blade': `Elite spin combined with surgical control and low power assist — you generate all the pace, the setup generates all the placement. A scalpel for topspin artists who shape every ball.`,
    'Surgical Topspin Machine': `High spin potential meets solid control. Excels at constructing points with heavy topspin from the baseline, allowing you to hit with margin and still redirect at will.`,
    'Topspin Howitzer': `Massive topspin wrapped in a power platform. The ball launches with heavy rotation AND depth — opponents get pushed behind the baseline by a ball that kicks up and keeps coming.`,
    'Power Spin Hybrid': `Power-forward with spin enhancement. The gut mains provide natural power and feel while the frame and pattern add topspin capability. A dual-threat that hits deep with dip — opponents feel both the pace and the kick.`,
    'Spin Dominator': `Spin-first setup that generates heavy ball rotation. The string bed grips the ball aggressively, creating a high-bouncing, dipping trajectory that pushes opponents behind the baseline.`,
    'Power Brawler': `Maximum power with enough raw muscle to overpower opponents. Best for players who want to dictate with pace and don't need surgical precision on every shot.`,
    'Power Hybrid': `Balanced power delivery with enough control to keep balls in play. Good for intermediate to advanced players transitioning to more aggressive play.`,
    'Precision Instrument': `Control-first build for players who generate their own pace. Every swing gives clear feedback and directional precision. Rewards clean technique with surgical accuracy.`,
    'Control Platform': `Reliable control with enough assistance to stay competitive. A stable platform for developing players or all-courters who value consistency.`,
    'Comfort Cannon': `Arm-friendly power. High comfort rating means you can swing freely without worrying about elbow or shoulder strain, while still getting good power return.`,
    'Touch Artist': `Maximum feel and connection to the ball. Ideal for net players and all-courters who rely on touch, placement, and variety over raw power.`,
    'Wall of Stability': `Immovable on contact. High stability means the frame doesn't twist on off-center hits, giving you confidence even when you're not hitting the sweet spot.`,
    'Forgiving Weapon': `Large effective sweet spot with decent power. Mis-hits still go in, and centered hits carry real authority. Good for developing power hitters.`,
    'Whip Master': `Exceptional racquet-head speed potential meets high spin capability. The light, maneuverable frame lets you generate steep swing paths and aggressive topspin without fighting the racquet.`,
    'Speed Demon': `Lightning-fast swing speed from an ultra-maneuverable platform. The frame practically disappears in the hand, letting you rip through contact zones with minimal effort.`,
    'Endurance Build': `Exceptional playability duration. This setup maintains its performance characteristics far longer than average, meaning fewer restrings and more consistent play.`,
    'Marathon Setup': `Built to last. Both durability and playability are elite — the string bed stays lively for weeks and resists breakage. Ideal for frequent players.`,
    'Balanced Setup': `Well-rounded profile with no glaring weaknesses. A versatile setup that adapts to different game styles and court conditions.`
  };

  const tags: string[] = [];
  if (stats.spin >= 75) tags.push('High Spin');
  if (stats.power >= 70) tags.push('Power');
  if (stats.control >= 75) tags.push('Precision');
  if (stats.comfort >= 72) tags.push('Arm-Friendly');
  if (stats.feel >= 72) tags.push('Touch');
  if (stats.stability >= 70) tags.push('Stable');
  if (stats.maneuverability >= 72) tags.push('Fast Swing');
  if (stats.durability >= 78) tags.push('Durable');
  if (stats.playability >= 82) tags.push('Long-Lasting');
  if (stats.forgiveness >= 70) tags.push('Forgiving');

  return {
    archetype,
    description: descriptions[archetype] || descriptions['Balanced Setup'],
    tags: tags.slice(0, 4)
  };
}

// Helper for identity classification (used by some UI components)
export function classifySetup(stats: SetupAttributes): ClassifyResult {
  const sorted = WTTN_ATTRS.map(a => ({ attr: a, val: stats[a] })).sort((a, b) => b.val - a.val);
  const strongest = sorted.slice(0, 3);
  const weakest = sorted.slice(-3).reverse();
  const family = IDENTITY_FAMILIES.find(f => f.test(stats))?.family || 'balanced';
  return { strongest, weakest, family };
}

// Re-exports for convenience
export { calcFrameBase } from './frame-physics.js';
export { calcBaseStringProfile } from './string-profile.js';
export { buildTensionContext } from './tension.js';
