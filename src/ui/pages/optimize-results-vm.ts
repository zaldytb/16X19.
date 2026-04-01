import { getObsScoreColor } from '../../engine/index.js';
import type { SetupAttributes, StringData, Racquet } from '../../engine/types.js';

export type OptimizeCandidateVmSource = {
  type: 'full' | 'hybrid';
  label: string;
  gauge?: string;
  tension: number;
  crossesTension?: number;
  score: number;
  stats: SetupAttributes;
  stringData?: StringData;
  mainsData?: StringData;
  crossesData?: StringData;
  racquet: Racquet;
};

export type OptimizeCandidateRowVm = {
  rowIndex: number;
  rank: number;
  typeTag: 'H' | 'F';
  label: string;
  obsDisplay: string;
  obsColor: string;
  deltaDisplay: string;
  deltaClass: string;
  gaugeDisplay: string;
  tensionLabel: string;
  spinDisplay: string;
  powerDisplay: string;
  controlDisplay: string;
  comfortDisplay: string;
  feelDisplay: string;
  durabilityDisplay: string;
  playabilityDisplay: string;
  isTopRow: boolean;
  isSaved: boolean;
};

export type OptimizeResultsVm =
  | { state: 'empty' }
  | { state: 'loading' }
  | {
      state: 'results';
      targetTension: string;
      showClear: boolean;
      sortBy: string;
      rows: OptimizeCandidateRowVm[];
    };

function formatStat(value: number | undefined): string {
  return typeof value === 'number' ? value.toFixed(0) : '\u2014';
}

export function buildOptimizeResultsViewModel(
  candidates: OptimizeCandidateVmSource[] | null,
  currentOBS: number,
  targetTension: string,
  savedCandidateKey: string | null,
  sortBy: string,
): OptimizeResultsVm {
  if (candidates === null) {
    return { state: 'loading' };
  }

  if (candidates.length === 0) {
    return { state: 'empty' };
  }

  let displayCandidates = candidates;
  if (targetTension !== '' && !Number.isNaN(parseInt(targetTension, 10))) {
    const target = parseInt(targetTension, 10);
    displayCandidates = candidates.filter((candidate) => Math.abs(candidate.tension - target) <= 1);
  }

  const rows = displayCandidates.slice(0, 200).map((candidate, index) => {
    const delta = candidate.score - currentOBS;
    const key = getOptimizeCandidateKey(candidate);

    return {
      rowIndex: index,
      rank: index + 1,
      typeTag: candidate.type === 'hybrid' ? ('H' as const) : ('F' as const),
      label: candidate.label,
      obsDisplay: candidate.score.toFixed(1),
      obsColor: getObsScoreColor(candidate.score),
      deltaDisplay: delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1),
      deltaClass: delta > 0.5 ? 'opt-delta-pos' : delta < -0.5 ? 'opt-delta-neg' : 'opt-delta-neutral',
      gaugeDisplay: candidate.gauge || '\u2014',
      tensionLabel: candidate.type === 'hybrid' ? `${candidate.tension}/${candidate.crossesTension}` : `${candidate.tension}`,
      spinDisplay: formatStat(candidate.stats.spin),
      powerDisplay: formatStat(candidate.stats.power),
      controlDisplay: formatStat(candidate.stats.control),
      comfortDisplay: formatStat(candidate.stats.comfort),
      feelDisplay: formatStat(candidate.stats.feel),
      durabilityDisplay: formatStat(candidate.stats.durability),
      playabilityDisplay: formatStat(candidate.stats.playability),
      isTopRow: index === 0,
      isSaved: savedCandidateKey === key,
    };
  });

  return {
    state: 'results',
    targetTension,
    showClear: targetTension !== '',
    sortBy,
    rows,
  };
}

export function getOptimizeCandidateKey(candidate: OptimizeCandidateVmSource): string {
  return candidate.type === 'hybrid'
    ? `${candidate.racquet.id}|hybrid|${candidate.mainsData?.id || ''}|${candidate.crossesData?.id || ''}|${candidate.tension}|${candidate.crossesTension || ''}`
    : `${candidate.racquet.id}|full|${candidate.stringData?.id || ''}|${candidate.tension}|${candidate.crossesTension || ''}`;
}
