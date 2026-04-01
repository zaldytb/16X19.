import type { Racquet, SetupStats } from '../../engine/types.js';

export interface CompRacketHeroVm {
  displayTitle: string;
  baseObs: number;
  year: number;
  identityLine: string;
  notesHtml: string | null;
  swingweight: number;
  stiffness: number;
  pattern: string;
  headSize: number;
  balancePts: string | number;
  tensionRangeLabel: string;
  bestForLines: string[];
  watchOutLines: string[];
}

function computeDisplayTitle(racquet: Racquet): string {
  return racquet.name.replace(/\s+\d+g$/, ` ${Math.round((racquet.strungWeight - 13) / 5) * 5}g`);
}

export function computeCompBaseObsFromFrameBase(frameBase: SetupStats): number {
  return Math.round(
    frameBase.spin * 0.15 +
      frameBase.power * 0.12 +
      frameBase.control * 0.18 +
      frameBase.comfort * 0.12 +
      frameBase.feel * 0.1 +
      frameBase.stability * 0.12 +
      frameBase.forgiveness * 0.08 +
      frameBase.maneuverability * 0.08,
  );
}

export function buildCompRacketHeroVm(
  racquet: Racquet,
  frameBase: SetupStats,
  pills: { bestFor: string[]; watchOut: string[] },
): CompRacketHeroVm {
  const baseObs = computeCompBaseObsFromFrameBase(frameBase);
  const ext = racquet as Racquet & { balancePts?: number; year?: number; identity?: string; notes?: string };
  const balancePts = ext.balancePts ?? '';
  return {
    displayTitle: computeDisplayTitle(racquet),
    baseObs,
    year: typeof ext.year === 'number' ? ext.year : 0,
    identityLine: typeof ext.identity === 'string' ? ext.identity : '',
    notesHtml: typeof ext.notes === 'string' ? ext.notes : null,
    swingweight: racquet.swingweight,
    stiffness: racquet.stiffness,
    pattern: racquet.pattern,
    headSize: racquet.headSize,
    balancePts,
    tensionRangeLabel: `${racquet.tensionRange[0]}-${racquet.tensionRange[1]}`,
    bestForLines: pills.bestFor.map((p) => p.toUpperCase()),
    watchOutLines: pills.watchOut.map((p) => p.toUpperCase()),
  };
}
