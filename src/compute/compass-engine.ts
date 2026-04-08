// src/compute/compass-engine.ts
// Compass data computation — computes racket positions for all 3 map modes.

import { RACQUETS, STRINGS, FRAME_META } from '../data/loader.js';
import { calcFrameBase, predictSetup, computeCompositeScore, buildTensionContext } from '../engine/index.js';
import type { Racquet, FrameBaseScores, SetupAttributes, StringConfig, FrameMeta } from '../engine/types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export type CompassMode = 'performance' | 'obs-ranking' | 'obs-tuner';

export interface CompassPoint {
  racquet: Racquet;
  frameBase: FrameBaseScores;
  refStats: SetupAttributes | null;   // null until mode 2/3 computed
  refObs: number;
  customScore: number;                // Mode 3 — recomputed on slider change
  position: { x: number; y: number }; // normalized [-1, 1]
  quadrant: 'NE' | 'NW' | 'SE' | 'SW' | 'CENTER';
  brand: string;
}

export interface TunerWeights {
  spin: number;
  power: number;
  control: number;
  launch: number;
  feel: number;
  comfort: number;
  stability: number;
  forgiveness: number;
  maneuverability: number;
  durability: number;
  playability: number;
}

export interface TunerPreset {
  name: string;
  label: string;
  weights: TunerWeights;
}

export const DEFAULT_WEIGHTS: TunerWeights = {
  spin: 5, power: 5, control: 5, launch: 5, feel: 5,
  comfort: 5, stability: 5, forgiveness: 5, maneuverability: 5,
  durability: 5, playability: 5,
};

export const TUNER_PRESETS: TunerPreset[] = [
  {
    name: 'baseline-grinder', label: 'Baseline Grinder',
    weights: { spin: 9, power: 4, control: 8, launch: 5, feel: 5, comfort: 6, stability: 5, forgiveness: 4, maneuverability: 5, durability: 7, playability: 5 },
  },
  {
    name: 'aggressive-baseliner', label: 'Aggressive Baseliner',
    weights: { spin: 8, power: 9, control: 5, launch: 7, feel: 5, comfort: 4, stability: 5, forgiveness: 4, maneuverability: 5, durability: 4, playability: 4 },
  },
  {
    name: 'all-courter', label: 'All-Courter',
    weights: { spin: 5, power: 5, control: 7, launch: 5, feel: 7, comfort: 5, stability: 6, forgiveness: 5, maneuverability: 7, durability: 5, playability: 5 },
  },
  {
    name: 'serve-volleyer', label: 'Serve & Volleyer',
    weights: { spin: 4, power: 8, control: 5, launch: 5, feel: 8, comfort: 4, stability: 7, forgiveness: 5, maneuverability: 9, durability: 4, playability: 4 },
  },
  {
    name: 'arm-friendly', label: 'Arm-Friendly',
    weights: { spin: 4, power: 4, control: 5, launch: 5, feel: 8, comfort: 10, stability: 5, forgiveness: 7, maneuverability: 5, durability: 5, playability: 6 },
  },
];

// ─── Brand detection ────────────────────────────────────────────────────────

export function getBrand(racquet: Racquet): string {
  const name = racquet.name.toLowerCase();
  if (name.startsWith('head')) return 'Head';
  if (name.startsWith('wilson')) return 'Wilson';
  if (name.startsWith('babolat')) return 'Babolat';
  if (name.startsWith('yonex')) return 'Yonex';
  if (name.startsWith('tecnifibre') || name.startsWith('tf')) return 'Tecnifibre';
  if (name.startsWith('dunlop')) return 'Dunlop';
  if (name.startsWith('mizuno')) return 'Mizuno';
  if (name.startsWith('prince')) return 'Prince';
  if (name.startsWith('volkl') || name.startsWith('völkl')) return 'Volkl';
  if (name.startsWith('prokennex')) return 'ProKennex';
  if (name.startsWith('solinco')) return 'Solinco';
  if (name.startsWith('diadem')) return 'Diadem';
  return 'Other';
}

export const BRAND_COLORS: Record<string, string> = {
  Head: '#ffffff',
  Wilson: '#ef4444',
  Babolat: '#a3e635',
  Yonex: '#6366f1',
  Tecnifibre: '#f97316',
  Dunlop: '#c4b5fd',
  Mizuno: '#f472b6',
  Prince: '#facc15',
  Volkl: '#fb923c',
  ProKennex: '#22d3ee',
  Solinco: '#34d399',
  Diadem: '#e879f9',
  Other: '#9ca3af',
};

// ─── Reference stringing ────────────────────────────────────────────────────

const REF_STRING_ID = 'restring-slap-17';
const REF_TENSION = 50;

function getRefStringConfig(racquet: Racquet): StringConfig | null {
  const refString = STRINGS.find(s => s.id === REF_STRING_ID);
  if (!refString) return null;
  return {
    isHybrid: false as const,
    string: refString,
    mainsTension: REF_TENSION,
    crossesTension: REF_TENSION,
  };
}

// ─── Compute pipeline ───────────────────────────────────────────────────────

let _cache: CompassPoint[] | null = null;

export function computeAllPoints(): CompassPoint[] {
  if (_cache) return _cache;
  const points: CompassPoint[] = [];

  for (const racquet of RACQUETS) {
    const frameBase = calcFrameBase(racquet);
    const refCfg = getRefStringConfig(racquet);
    let refStats: SetupAttributes | null = null;
    let refObs = 0;

    if (refCfg) {
      const setupResult = predictSetup(racquet, refCfg);
      refStats = setupResult;
      const tCtx = buildTensionContext(refCfg, racquet);
      refObs = computeCompositeScore(setupResult, tCtx);
    }

    points.push({
      racquet,
      frameBase,
      refStats,
      refObs: +refObs.toFixed(1),
      customScore: 0,
      position: { x: 0, y: 0 },
      quadrant: 'CENTER',
      brand: getBrand(racquet),
    });
  }

  _cache = points;
  return points;
}

export function invalidateCompassCache(): void {
  _cache = null;
}

// ─── Position calculations per mode ─────────────────────────────────────────

function normalizeRange(values: number[]): { min: number; max: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max: max === min ? max + 1 : max };
}

function toNorm(val: number, min: number, max: number): number {
  return ((val - min) / (max - min)) * 2 - 1;
}

function getQuadrant(x: number, y: number): 'NE' | 'NW' | 'SE' | 'SW' | 'CENTER' {
  const threshold = 0.12;
  if (Math.abs(x) < threshold && Math.abs(y) < threshold) return 'CENTER';
  if (x >= 0 && y >= 0) return 'NE';
  if (x < 0 && y >= 0) return 'NW';
  if (x >= 0 && y < 0) return 'SE';
  return 'SW';
}

/**
 * Mode 1: Performance Compass
 * Axes: Spin↑  Power→  Touch↓  Control←
 * "Touch" = (feel + control) / 2 per user spec; vertical axis = spin - touch
 * Horizontal axis = power - maneuverability
 */
export function computePerformancePositions(points: CompassPoint[]): CompassPoint[] {
  const rawXs: number[] = [];
  const rawYs: number[] = [];

  for (const p of points) {
    const fb = p.frameBase;
    const touch = (fb.feel + fb.control) / 2;
    const x = fb.power - fb.maneuverability;
    const y = fb.spin - touch;
    rawXs.push(x);
    rawYs.push(y);
  }

  const xRange = normalizeRange(rawXs);
  const yRange = normalizeRange(rawYs);

  return points.map((p, i) => {
    const x = toNorm(rawXs[i], xRange.min, xRange.max);
    const y = toNorm(rawYs[i], yRange.min, yRange.max);
    return { ...p, position: { x, y }, quadrant: getQuadrant(x, y) };
  });
}

/**
 * Mode 2: OBS Ranking Plot
 * Axes: Spin↑  Power→  Touch↓  Control←
 * Mirrors the HEAD Racquet Compass model — natural tennis opposites on each axis.
 * Uses full setup attributes (frame+string+tension) unlike Mode 1 which uses frameBase only.
 */
export function computeObsRankingPositions(points: CompassPoint[]): CompassPoint[] {
  const rawXs: number[] = [];
  const rawYs: number[] = [];

  for (const p of points) {
    const s = p.refStats;
    if (!s) {
      rawXs.push(0);
      rawYs.push(0);
      continue;
    }
    rawXs.push(s.power - s.control);  // power→east, control→west
    rawYs.push(s.spin - s.feel);      // spin→north, touch(feel)→south
  }

  const xRange = normalizeRange(rawXs);
  const yRange = normalizeRange(rawYs);

  return points.map((p, i) => {
    const x = toNorm(rawXs[i], xRange.min, xRange.max);
    const y = toNorm(rawYs[i], yRange.min, yRange.max);
    return { ...p, position: { x, y }, quadrant: getQuadrant(x, y) };
  });
}

/**
 * Mode 3: OBS Tuner
 * Same axes as Mode 1 (Spin/Power/Touch/Maneuverability), but dot size/glow = custom score.
 */
export function computeTunerPositions(points: CompassPoint[], weights: TunerWeights): CompassPoint[] {
  const withScores = points.map(p => {
    const s = p.refStats;
    if (!s) return { ...p, customScore: 0 };

    const keys = Object.keys(weights) as Array<keyof TunerWeights>;
    const totalWeight = keys.reduce((sum, k) => sum + weights[k], 0);
    if (totalWeight === 0) return { ...p, customScore: 0 };

    const score = keys.reduce((sum, k) => sum + (s[k] * weights[k]), 0) / totalWeight;
    return { ...p, customScore: +score.toFixed(1) };
  });

  // Use Mode 1 axes for spatial positioning
  return computePerformancePositions(withScores);
}

// ─── Quadrant families ──────────────────────────────────────────────────────

export const QUADRANT_FAMILIES: Record<string, Record<string, { label: string; description: string }>> = {
  performance: {
    NW: { label: 'Spin Machines', description: 'High spin + maneuverable' },
    NE: { label: 'Power Spin', description: 'High spin + power' },
    SW: { label: 'Touch Specialists', description: 'Precise touch + maneuverable' },
    SE: { label: 'Power Touch', description: 'Touch + power' },
    CENTER: { label: 'All-Rounders', description: 'Balanced across all axes' },
  },
  'obs-ranking': {
    NE: { label: 'Power Spin', description: 'High spin + powerful' },
    NW: { label: 'Spin Control', description: 'High spin + controlled' },
    SE: { label: 'Power Touch', description: 'Powerful + finesse' },
    SW: { label: 'Touch Control', description: 'Controlled + finesse' },
    CENTER: { label: 'All-Court', description: 'Balanced across all axes' },
  },
  'obs-tuner': {
    NW: { label: 'Spin Machines', description: 'High spin + maneuverable' },
    NE: { label: 'Power Spin', description: 'High spin + power' },
    SW: { label: 'Touch Specialists', description: 'Precise touch + maneuverable' },
    SE: { label: 'Power Touch', description: 'Touch + power' },
    CENTER: { label: 'All-Rounders', description: 'Balanced across all axes' },
  },
};

export const MODE_AXES: Record<string, { north: string; east: string; south: string; west: string }> = {
  performance: { north: 'SPIN', east: 'POWER', south: 'TOUCH', west: 'AGILITY' },
  'obs-ranking': { north: 'SPIN', east: 'POWER', south: 'TOUCH', west: 'CONTROL' },
  'obs-tuner': { north: 'SPIN', east: 'POWER', south: 'TOUCH', west: 'AGILITY' },
};
