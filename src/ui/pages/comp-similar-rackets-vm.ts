import { RACQUETS } from '../../data/loader.js';
import { calcFrameBase } from '../../engine/frame-physics.js';
import type { FrameBaseScores, Racquet, SetupAttributes } from '../../engine/types.js';
import { WTTN_ATTR_LABELS } from '../../engine/constants.js';
import { computeProfileSimilarity, computeDeltas } from '../shared/recommendations.js';

export interface CompSimilarRacketCardVm {
  racquetId: string;
  displayName: string;
  year: number;
  similarity: number;
  deltaStats: { key: string; label: string; delta: number }[];
  specLine: string;
}

// Lazy singleton: frame base scores for every racquet
let _frameBaseIndex: Map<string, FrameBaseScores> | null = null;

function getFrameBaseIndex(): Map<string, FrameBaseScores> {
  if (_frameBaseIndex) return _frameBaseIndex;
  const index = new Map<string, FrameBaseScores>();
  for (const r of RACQUETS as Racquet[]) {
    index.set(r.id, calcFrameBase(r));
  }
  _frameBaseIndex = index;
  return index;
}

function toSetupAttrs(fb: FrameBaseScores): SetupAttributes {
  return {
    spin: fb.spin,
    power: fb.power,
    control: fb.control,
    launch: fb.launch,
    feel: fb.feel,
    comfort: fb.comfort,
    stability: fb.stability,
    forgiveness: fb.forgiveness,
    maneuverability: fb.maneuverability,
    durability: fb.durability,
    playability: fb.playability,
  };
}

export function buildCompSimilarRacketsVm(
  selectedRacquetId: string,
  selectedFrameBase: FrameBaseScores,
  count = 5,
): CompSimilarRacketCardVm[] {
  const index = getFrameBaseIndex();
  const selectedAttrs = toSetupAttrs(selectedFrameBase);

  const scored: { racquet: Racquet; similarity: number; fb: FrameBaseScores }[] = [];
  for (const r of RACQUETS as Racquet[]) {
    if (r.id === selectedRacquetId) continue;
    const fb = index.get(r.id);
    if (!fb) continue;
    const sim = computeProfileSimilarity(selectedAttrs, toSetupAttrs(fb));
    scored.push({ racquet: r, similarity: sim, fb });
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  const top = scored.slice(0, count);

  return top.map(({ racquet, similarity, fb }) => {
    const deltas = computeDeltas(selectedAttrs, toSetupAttrs(fb));
    const topDeltas = Object.entries(deltas)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 3)
      .map(([key, delta]) => ({ key: key.toUpperCase().slice(0, 4), label: WTTN_ATTR_LABELS[key] || key, delta }));

    const ext = racquet as Racquet & { year?: number };
    return {
      racquetId: racquet.id,
      displayName: racquet.name,
      year: typeof ext.year === 'number' ? ext.year : 0,
      similarity: Math.round(similarity * 100),
      deltaStats: topDeltas,
      specLine: `${racquet.headSize}sq / ${racquet.strungWeight}g / ${racquet.pattern}`,
    };
  });
}
