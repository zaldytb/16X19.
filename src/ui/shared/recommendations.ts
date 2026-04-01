// src/ui/shared/recommendations.ts
// What To Try Next (WTTN), Recommended Builds, and Explore Prompt utilities

import {
  WTTN_ATTRS,
  WTTN_ATTR_LABELS,
  IDENTITY_FAMILIES,
} from '../../engine/constants.js';
import {
  predictSetup,
  buildTensionContext,
  computeCompositeScore,
  classifySetup,
} from '../../engine/index.js';
import type {
  Racquet,
  StringConfig,
  SetupAttributes,
  StringData,
} from '../../engine/types.js';
import { runRecommendationPoolAsync } from '../../workers/engine-worker-client.js';

type CandidatePool = {
  fullBed: Candidate[];
  hybrid: Candidate[];
  all: Candidate[];
};

const recommendationPoolCache = new Map<string, CandidatePool>();

// ============================================
// TYPES
// ============================================

interface Classification {
  strongest: { attr: string; val: number }[];
  weakest: { attr: string; val: number }[];
  family: string;
}

export interface Candidate {
  type: 'full' | 'hybrid';
  label: string;
  gauge?: string;
  material?: string;
  tension: number;
  score: number;
  stats: SetupAttributes;
  stringId?: string;
  string?: StringData;
  mainsId?: string;
  crossesId?: string;
  mains?: StringData;
  crosses?: StringData;
  deltas?: Record<string, number>;
  closestScore?: number;
  moreScore?: number;
  correctiveScore?: number;
}

interface WTTNBucket {
  key: 'closest' | 'more' | 'corrective';
  title: string;
  pick: Candidate;
  icon: string;
}

// ============================================
// DELTA COMPUTATION
// ============================================

export function computeDeltas(
  currentStats: SetupAttributes,
  candidateStats: SetupAttributes
): Record<string, number> {
  const deltas: Record<string, number> = {};
  for (const a of WTTN_ATTRS) {
    deltas[a] = Math.round(candidateStats[a] - currentStats[a]);
  }
  return deltas;
}

export function computeProfileSimilarity(
  statsA: SetupAttributes,
  statsB: SetupAttributes
): number {
  let dotP = 0,
    magA = 0,
    magB = 0;
  for (const a of WTTN_ATTRS) {
    dotP += statsA[a] * statsB[a];
    magA += statsA[a] * statsA[a];
    magB += statsB[a] * statsB[a];
  }
  return dotP / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-9);
}

export function topGains(deltas: Record<string, number>, n = 4): { attr: string; delta: number }[] {
  return Object.entries(deltas)
    .filter(([, d]) => d > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([attr, d]) => ({ attr, delta: d }));
}

export function topLosses(deltas: Record<string, number>, n = 3): { attr: string; delta: number }[] {
  return Object.entries(deltas)
    .filter(([, d]) => d < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([attr, d]) => ({ attr, delta: d }));
}

function candidateSimilarity(statsA: SetupAttributes, statsB: SetupAttributes): number {
  let sumSqDiff = 0;
  for (const a of WTTN_ATTRS) {
    const d = statsA[a] - statsB[a];
    sumSqDiff += d * d;
  }
  return Math.sqrt(sumSqDiff);
}

// ============================================
// SCORING FUNCTIONS
// ============================================

function classifySetupForWTTN(stats: SetupAttributes): Classification {
  const sorted = WTTN_ATTRS.map((a) => ({ attr: a, val: stats[a] })).sort(
    (a, b) => b.val - a.val
  );
  const strongest = sorted.slice(0, 3);
  const weakest = sorted.slice(-3).reverse();
  const family = IDENTITY_FAMILIES.find((f) => f.test(stats))?.family || 'balanced';
  return { strongest, weakest, family };
}

function scoreClosestBetter(
  currentStats: SetupAttributes,
  classification: Classification,
  candidateStats: SetupAttributes,
  deltas: Record<string, number>
): number {
  const similarity = computeProfileSimilarity(currentStats, candidateStats);
  let weaknessGain = 0;
  for (const w of classification.weakest) {
    weaknessGain += Math.max(0, deltas[w.attr]);
  }
  let strengthLoss = 0;
  for (const s of classification.strongest) {
    strengthLoss += Math.max(0, -deltas[s.attr]);
  }
  const candClass = classifySetupForWTTN(candidateStats);
  const familyBonus = candClass.family === classification.family ? 8 : 0;

  return similarity * 30 + weaknessGain * 3 - strengthLoss * 4 + familyBonus;
}

function scoreMoreOfWhatYouWant(
  _currentStats: SetupAttributes,
  _classification: Classification,
  _candidateStats: SetupAttributes,
  deltas: Record<string, number>
): number {
  let bestTargetScore = -Infinity;

  for (const attr of WTTN_ATTRS) {
    const targetGain = Math.max(0, deltas[attr]);
    if (targetGain < 2) continue;

    let secondaryGains = 0;
    for (const a of WTTN_ATTRS) {
      if (a !== attr && deltas[a] > 0) secondaryGains += deltas[a] * 0.5;
    }

    let totalLoss = 0;
    for (const a of WTTN_ATTRS) {
      if (deltas[a] < 0) totalLoss += Math.abs(deltas[a]);
    }

    const score = targetGain * 5 + secondaryGains - totalLoss * 1.5;
    if (score > bestTargetScore) bestTargetScore = score;
  }

  return bestTargetScore === -Infinity ? -100 : bestTargetScore;
}

function scoreCorrective(
  _currentStats: SetupAttributes,
  classification: Classification,
  _candidateStats: SetupAttributes,
  deltas: Record<string, number>
): number {
  const weakest = classification.weakest[0];
  const fix = Math.max(0, deltas[weakest.attr]);

  let secondaryFix = 0;
  for (let i = 1; i < classification.weakest.length; i++) {
    secondaryFix += Math.max(0, deltas[classification.weakest[i].attr]) * 0.6;
  }

  let totalLoss = 0;
  for (const a of WTTN_ATTRS) {
    if (deltas[a] < 0) totalLoss += Math.abs(deltas[a]);
  }

  return fix * 6 + secondaryFix - totalLoss * 1.0;
}

// ============================================
// NET DIRECTION & WHY SENTENCES
// ============================================

const NET_DIRECTION_PHRASES: Record<
  string,
  { gain: string; pair: Record<string, string> }
> = {
  comfort: {
    gain: 'Softer',
    pair: { control: 'less surgical', power: 'less explosive', spin: 'less spin-heavy' },
  },
  spin: {
    gain: 'Spinnier',
    pair: { control: 'less precise', comfort: 'firmer', power: 'less raw pace' },
  },
  power: {
    gain: 'More pace',
    pair: { control: 'less precise', comfort: 'firmer', spin: 'less topspin' },
  },
  control: {
    gain: 'Sharper',
    pair: { power: 'less free power', comfort: 'firmer', spin: 'less spin' },
  },
  feel: {
    gain: 'More feel',
    pair: { power: 'less pace', durability: 'less durable', comfort: 'less padded' },
  },
  playability: {
    gain: 'More consistent over time',
    pair: { power: 'less pop', spin: 'less grip', control: 'less surgical' },
  },
  durability: {
    gain: 'Longer lasting',
    pair: { feel: 'less feel', comfort: 'firmer', spin: 'less grip' },
  },
  forgiveness: {
    gain: 'More forgiving',
    pair: { control: 'less surgical', feel: 'less feedback', spin: 'less spin' },
  },
  stability: {
    gain: 'More stable',
    pair: { comfort: 'firmer', feel: 'less delicate', power: 'less explosive' },
  },
  launch: {
    gain: 'Higher launch',
    pair: { control: 'less flat', stability: 'less locked-in', feel: 'less connected' },
  },
};

function generateNetDirection(
  gains: { attr: string; delta: number }[],
  losses: { attr: string; delta: number }[]
): string {
  if (gains.length === 0) return 'Marginal tradeoff';
  const topGain = gains[0].attr;
  const topLoss = losses.length > 0 ? losses[0].attr : null;

  const g = NET_DIRECTION_PHRASES[topGain];
  if (!g) return 'Different profile balance';

  let phrase = g.gain;
  if (topLoss && g.pair[topLoss]) phrase += ', ' + g.pair[topLoss];
  else if (topLoss) phrase += ', slightly less ' + WTTN_ATTR_LABELS[topLoss].toLowerCase();

  return phrase;
}

function generateWhySentence(
  bucket: 'closest' | 'more' | 'corrective',
  gains: { attr: string; delta: number }[],
  losses: { attr: string; delta: number }[],
  classification: Classification
): string {
  const topG = gains
    .slice(0, 2)
    .map((g) => WTTN_ATTR_LABELS[g.attr].toLowerCase())
    .join(' and ');
  const topL = losses.length > 0 ? losses[0] : null;

  if (bucket === 'closest') {
    if (topL)
      return `Preserves the current ${classification.family.replace('-', ' ')} identity while improving ${topG}, with minimal ${WTTN_ATTR_LABELS[topL.attr].toLowerCase()} tradeoff.`;
    return `Preserves the current ${classification.family.replace('-', ' ')} identity while adding ${topG}.`;
  }
  if (bucket === 'more') {
    return `Pushes ${topG} meaningfully harder${topL ? ', accepting some ' + WTTN_ATTR_LABELS[topL.attr].toLowerCase() + ' loss' : ''}.`;
  }
  if (bucket === 'corrective') {
    const weakName = WTTN_ATTR_LABELS[classification.weakest[0].attr].toLowerCase();
    return `Directly addresses the current setup's ${weakName} weakness${topL ? ', trading some ' + WTTN_ATTR_LABELS[topL.attr].toLowerCase() : ''}.`;
  }
  return 'An alternative profile worth exploring.';
}

// ============================================
// WTTN VIEW MODEL (React / parity with former innerHTML)
// ============================================

export type WttnViewModel =
  | { kind: 'empty'; message: string }
  | {
      kind: 'buckets';
      racquetId: string;
      buckets: Array<{
        bucketKey: 'closest' | 'more' | 'corrective';
        title: string;
        iconSvg: string;
        buildName: string;
        gaugeSpan: { text: string } | null;
        isHybrid: boolean;
        tensionLabel: string;
        why: string;
        displayGains: Array<{ attrLabel: string; delta: number }>;
        displayLosses: Array<{ attrLabel: string; delta: number }>;
        netDir: string;
        stringId: string;
        mainsId: string;
        crossesId: string;
        tension: number;
        pickType: 'full' | 'hybrid';
      }>;
    };

export function buildWhatToTryNextViewModel(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  allCandidates: Candidate[]
): WttnViewModel {
  const { racquet, stringConfig } = setup;

  const currentStats = predictSetup(racquet, stringConfig);
  const classification = classifySetupForWTTN(currentStats);

  let currentBuildKey: string | null = null;
  if (stringConfig.isHybrid) {
    const mId = stringConfig.mains?.id || (stringConfig as unknown as Record<string, string>).mainsId || '';
    const xId = stringConfig.crosses?.id || (stringConfig as unknown as Record<string, string>).crossesId || '';
    currentBuildKey = `hybrid:${mId}/${xId}`;
  } else if (stringConfig.string) {
    currentBuildKey = `full:${stringConfig.string.id}`;
  }

  function getCandidateKey(c: Candidate): string {
    if (c.type === 'hybrid') return `hybrid:${c.mainsId}/${c.crossesId}`;
    return `full:${c.stringId || (c.string && c.string.id) || ''}`;
  }

  const scored = allCandidates
    .filter((c) => getCandidateKey(c) !== currentBuildKey)
    .map((c) => {
      const deltas = computeDeltas(currentStats, c.stats);
      return {
        ...c,
        deltas,
        closestScore: scoreClosestBetter(currentStats, classification, c.stats, deltas),
        moreScore: scoreMoreOfWhatYouWant(currentStats, classification, c.stats, deltas),
        correctiveScore: scoreCorrective(currentStats, classification, c.stats, deltas),
      };
    });

  if (scored.length < 3) {
    return {
      kind: 'empty',
      message: 'Not enough alternative builds to generate contextual recommendations.',
    };
  }

  scored.sort((a, b) => (b.closestScore || 0) - (a.closestScore || 0));
  const closest = scored[0];

  const DISTINCTNESS_PENALTY = 15;
  for (const c of scored) {
    const sim = candidateSimilarity(c.stats, closest.stats);
    if (sim < 6) c.moreScore = (c.moreScore || 0) - DISTINCTNESS_PENALTY;
  }
  scored.sort((a, b) => (b.moreScore || 0) - (a.moreScore || 0));
  const more =
    scored.find((c) => getCandidateKey(c) !== getCandidateKey(closest)) || scored[0];

  for (const c of scored) {
    const simClosest = candidateSimilarity(c.stats, closest.stats);
    const simMore = candidateSimilarity(c.stats, more.stats);
    if (simClosest < 6) c.correctiveScore = (c.correctiveScore || 0) - DISTINCTNESS_PENALTY;
    if (simMore < 6) c.correctiveScore = (c.correctiveScore || 0) - DISTINCTNESS_PENALTY;
  }
  scored.sort((a, b) => (b.correctiveScore || 0) - (a.correctiveScore || 0));
  const corrective =
    scored.find(
      (c) =>
        getCandidateKey(c) !== getCandidateKey(closest) &&
        getCandidateKey(c) !== getCandidateKey(more)
    ) || scored[0];

  const bucketDefs: WTTNBucket[] = [
    {
      key: 'closest',
      title: 'Closest Better Version',
      pick: closest,
      icon: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    },
    {
      key: 'more',
      title: 'More of What You Want',
      pick: more,
      icon: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 13L8 3l5 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    },
    {
      key: 'corrective',
      title: 'Corrective Move',
      pick: corrective,
      icon: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8z" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    },
  ];

  const buckets = bucketDefs.map((b) => {
    const { pick, key, title, icon } = b;
    const gains = topGains(pick.deltas || {}, 4);
    const losses = topLosses(pick.deltas || {}, 3);
    const netDir = generateNetDirection(gains, losses);
    const why = generateWhySentence(key, gains, losses, classification);

    const displayGains = gains
      .slice(0, 4)
      .filter((g) => g.delta >= 1)
      .map((g) => ({ attrLabel: WTTN_ATTR_LABELS[g.attr], delta: g.delta }));
    const displayLosses = losses
      .slice(0, 3)
      .filter((l) => l.delta <= -1)
      .map((l) => ({ attrLabel: WTTN_ATTR_LABELS[l.attr], delta: l.delta }));

    const stringId = pick.stringId || (pick.string ? pick.string.id : '');
    const mainsId = pick.mainsId || '';
    const crossesId = pick.crossesId || '';

    const buildName = pick.label || (pick.string && pick.string.name) || 'Unknown';
    let gaugeSpan: { text: string } | null = null;
    if (pick.gauge) {
      gaugeSpan = { text: pick.gauge };
    } else if (pick.string) {
      gaugeSpan = { text: pick.string.gauge };
    }

    return {
      bucketKey: key,
      title,
      iconSvg: icon,
      buildName,
      gaugeSpan,
      isHybrid: pick.type === 'hybrid',
      tensionLabel:
        pick.type === 'hybrid'
          ? `M:${pick.tension} / X:${pick.tension - 2} lbs`
          : `${pick.tension} lbs`,
      why,
      displayGains,
      displayLosses,
      netDir,
      stringId,
      mainsId,
      crossesId,
      tension: pick.tension,
      pickType: pick.type,
    };
  });

  return { kind: 'buckets', racquetId: racquet.id, buckets };
}

// ============================================
// RECOMMENDED BUILDS
// ============================================

export type RecommendedBuildsResult = {
  fullBed: Candidate[];
  hybrid: Candidate[];
  all: Candidate[];
  currentOBS: number;
  isCurrentInTop: boolean;
};

export async function generateRecommendedBuilds(
  setup: { racquet: Racquet; stringConfig: StringConfig }
): Promise<RecommendedBuildsResult> {
  const { racquet, stringConfig } = setup;

  const currentStats = predictSetup(racquet, stringConfig);
  const currentTCtx = buildTensionContext(stringConfig, racquet);
  const currentOBS = computeCompositeScore(currentStats, currentTCtx);
  let candidatePool = recommendationPoolCache.get(racquet.id);
  if (!candidatePool) {
    const pool = await runRecommendationPoolAsync(racquet.id);
    candidatePool = {
      fullBed: pool.fullBed as Candidate[],
      hybrid: pool.hybrid as Candidate[],
      all: pool.all as Candidate[],
    };
    recommendationPoolCache.set(racquet.id, candidatePool);
  }

  // Check if current is in top
  let currentKey: string | null = null;
  if (stringConfig.isHybrid) {
    const mId =
      stringConfig.mains?.id || (stringConfig as unknown as Record<string, string>).mainsId;
    const xId =
      stringConfig.crosses?.id || (stringConfig as unknown as Record<string, string>).crossesId;
    currentKey = `hybrid:${mId}/${xId}`;
  } else if (stringConfig.string) {
    currentKey = `full:${stringConfig.string.id}`;
  }

  function getCandidateKey(c: Candidate): string {
    return c.type === 'hybrid'
      ? `hybrid:${c.mainsId}/${c.crossesId}`
      : `full:${c.stringId}`;
  }

  const isCurrentInTop =
    currentKey !== null &&
    [...candidatePool.fullBed, ...candidatePool.hybrid].some((c) => getCandidateKey(c) === currentKey);

  return {
    fullBed: candidatePool.fullBed,
    hybrid: candidatePool.hybrid,
    all: candidatePool.all,
    currentOBS,
    isCurrentInTop,
  };
}

