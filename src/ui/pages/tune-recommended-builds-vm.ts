// Pure view-model for Tune recommended builds (#recs-content) — parity with _renderRecommendationItem + renderRecommendedBuilds shell.

import { generateRecommendedBuilds } from '../shared/recommendations.js';
import type { Racquet, StringConfig } from '../../engine/types.js';

type RecPool = ReturnType<typeof generateRecommendedBuilds>;
type RecCand = RecPool['fullBed'][number];

export type TuneRecItemViewModel = {
  rank: number;
  isCurrent: boolean;
  label: string;
  gauge?: string;
  tensionLabel: string;
  scoreText: string;
  deltaStr: string;
  deltaCls: 'recs-delta-positive' | 'recs-delta-negative' | 'recs-delta-neutral';
  showYou: boolean;
  racquetId: string;
  stringId: string;
  mainsId: string;
  crossesId: string;
  tension: number;
  type: string;
};

export type TuneRecsViewModel = {
  footnoteRacquetName: string;
  fullBed: TuneRecItemViewModel[];
  hybrid: TuneRecItemViewModel[];
};

function getRecommendationKey(candidate: RecCand): string {
  return candidate.type === 'hybrid'
    ? `hybrid:${candidate.mainsId}/${candidate.crossesId}`
    : `full:${candidate.stringId}`;
}

function mapCandidate(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  candidate: RecCand,
  rank: number,
  currentOBS: number,
  currentKey: string | null
): TuneRecItemViewModel {
  const isCurrent = currentKey === getRecommendationKey(candidate);
  const delta = candidate.score - currentOBS;
  const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
  const deltaCls: TuneRecItemViewModel['deltaCls'] =
    delta > 0.5 ? 'recs-delta-positive' : delta < -0.5 ? 'recs-delta-negative' : 'recs-delta-neutral';
  const tensionLabel =
    candidate.type === 'hybrid'
      ? `M:${candidate.tension} / X:${candidate.tension - 2} lbs`
      : `${candidate.tension} lbs`;
  const stringId = candidate.stringId || candidate.string?.id || '';
  const mainsId = candidate.mainsId || '';
  const crossesId = candidate.crossesId || '';
  return {
    rank,
    isCurrent,
    label: candidate.label,
    gauge: candidate.gauge || undefined,
    tensionLabel,
    scoreText: candidate.score.toFixed(1),
    deltaStr,
    deltaCls,
    showYou: isCurrent,
    racquetId: setup.racquet.id,
    stringId,
    mainsId,
    crossesId,
    tension: candidate.tension,
    type: candidate.type,
  };
}

export function buildTuneRecsViewModel(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  recs: RecPool,
  currentKey: string | null
): TuneRecsViewModel {
  const footnoteRacquetName = setup.racquet.name.replace(/\s+\d+g$/, '');
  const currentOBS = recs.currentOBS;

  return {
    footnoteRacquetName,
    fullBed: recs.fullBed.map((c, i) => mapCandidate(setup, c, i + 1, currentOBS, currentKey)),
    hybrid: recs.hybrid.map((c, i) => mapCandidate(setup, c, i + 1, currentOBS, currentKey)),
  };
}
