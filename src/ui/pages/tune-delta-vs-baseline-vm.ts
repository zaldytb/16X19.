// Pure view-model for Tune delta vs baseline (#delta-content) — parity with renderDeltaVsBaseline + _updateDeltaBatteryBars.

import type { Racquet, SetupAttributes, StringConfig } from '../../engine/types.js';

export const TUNE_DELTA_KEYS: Array<keyof SetupAttributes> = [
  'control',
  'power',
  'comfort',
  'spin',
  'launch',
  'feel',
  'playability',
];

export const TUNE_DELTA_LABELS = [
  'Control',
  'Power',
  'Comfort',
  'Spin',
  'Launch',
  'Feel',
  'Playability',
] as const;

export type TuneDeltaRowViewModel = {
  statKey: string;
  label: string;
  trackId: string;
  dataBaseline: string;
  dataExplored: string;
  diffId: string;
  diffCls: 'delta-positive' | 'delta-negative' | 'delta-neutral';
  diffText: string;
  /** Full class per segment div, e.g. "stat-bar-segment high" */
  segmentClasses: string[];
};

export type TuneDeltaVsBaselineViewModel = {
  baseLabel: string;
  exploreLabel: string;
  rows: TuneDeltaRowViewModel[];
};

/** First-paint segment classes (no `active` — animation adds it). */
export function buildFirstPaintTrackSegments(exploredValue: number): string[] {
  const segments = 20;
  const filledCount = Math.round((exploredValue / 100) * segments);
  const out: string[] = [];
  for (let i = 0; i < segments; i++) {
    let segClass: string;
    if (i < filledCount) {
      const segValue = (i / segments) * 100;
      segClass = segValue >= 70 ? 'high' : 'filled';
    } else {
      segClass = 'empty';
    }
    out.push(`stat-bar-segment ${segClass}`);
  }
  return out;
}

/** Update-path segment classes (includes `active` where legacy applies). */
export function buildUpdateTrackSegments(
  baseVal: number,
  exploredVal: number,
  isAtBaseline: boolean
): string[] {
  const segments = 20;
  const baseFilled = Math.round((baseVal / 100) * segments);
  const exploredFilled = Math.round((exploredVal / 100) * segments);
  const result: string[] = [];

  for (let i = 0; i < segments; i++) {
    let segClass = 'empty';

    if (isAtBaseline) {
      if (i < baseFilled) {
        const segValue = (i / segments) * 100;
        segClass = segValue >= 70 ? 'high active' : 'filled active';
      }
    } else if (exploredVal > baseVal) {
      if (i < baseFilled) {
        const segValue = (i / segments) * 100;
        segClass = segValue >= 70 ? 'high active' : 'filled active';
      } else if (i < exploredFilled) {
        segClass = 'high active';
      }
    } else if (exploredVal < baseVal) {
      if (i < exploredFilled) {
        const segValue = (i / segments) * 100;
        segClass = segValue >= 70 ? 'high active' : 'filled active';
      } else if (i < baseFilled) {
        segClass = 'empty';
      }
    } else {
      if (i < baseFilled) {
        const segValue = (i / segments) * 100;
        segClass = segValue >= 70 ? 'high active' : 'filled active';
      }
    }

    result.push(`stat-bar-segment ${segClass}`);
  }

  return result;
}

export function buildDeltaHeaderLabels(
  setup: { racquet: Racquet; stringConfig: StringConfig } | null | undefined,
  baselineTension: number,
  exploredTension: number,
  hybridDimension: 'mains' | 'crosses' | 'linked'
): { baseLabel: string; exploreLabel: string } {
  const isAtBaseline = exploredTension === baselineTension;
  const isHybrid = setup?.stringConfig.isHybrid;
  const dim = hybridDimension;

  let baseLabel = `Baseline: ${baselineTension} lbs`;
  let exploreLabel = isAtBaseline ? 'At baseline' : `Exploring: ${exploredTension} lbs`;

  if (isHybrid && setup) {
    if (dim === 'mains') {
      baseLabel = `Mains Baseline: ${baselineTension} lbs`;
      exploreLabel = isAtBaseline ? 'At baseline' : `Mains: ${exploredTension} lbs`;
    } else if (dim === 'crosses') {
      baseLabel = `Crosses Baseline: ${baselineTension} lbs`;
      exploreLabel = isAtBaseline ? 'At baseline' : `Crosses: ${exploredTension} lbs`;
    } else {
      const diff = setup.stringConfig.mainsTension - setup.stringConfig.crossesTension;
      baseLabel = `Linked Baseline: M ${baselineTension} / X ${Math.max(0, baselineTension - diff)} lbs`;
      if (!isAtBaseline) {
        exploreLabel = `Linked: M ${exploredTension} / X ${Math.max(0, exploredTension - diff)} lbs`;
      }
    }
  }

  return { baseLabel, exploreLabel };
}

export function buildTuneDeltaVsBaselineViewModel(
  base: SetupAttributes,
  explored: SetupAttributes,
  isAtBaseline: boolean,
  setup: { racquet: Racquet; stringConfig: StringConfig } | null | undefined,
  baselineTension: number,
  exploredTension: number,
  hybridDimension: 'mains' | 'crosses' | 'linked',
  isFirstRender: boolean
): TuneDeltaVsBaselineViewModel {
  const { baseLabel, exploreLabel } = buildDeltaHeaderLabels(
    setup,
    baselineTension,
    exploredTension,
    hybridDimension
  );

  const rows: TuneDeltaRowViewModel[] = TUNE_DELTA_KEYS.map((key, i) => {
    const label = TUNE_DELTA_LABELS[i];
    const statKey = String(key);
    const baseVal = Math.round(base[key] as number);
    const exploredVal = Math.round(explored[key] as number);
    const exploredRaw = explored[key] as number;

    const diffInt = isFirstRender
      ? Math.round((explored[key] as number) - (base[key] as number))
      : exploredVal - baseVal;
    const diffCls: TuneDeltaRowViewModel['diffCls'] =
      diffInt > 0 ? 'delta-positive' : diffInt < 0 ? 'delta-negative' : 'delta-neutral';
    const sign = diffInt > 0 ? '+' : '';
    const diffText = isAtBaseline ? '\u2014' : `${sign}${diffInt}`;

    const segmentClasses = isFirstRender
      ? buildFirstPaintTrackSegments(exploredRaw)
      : buildUpdateTrackSegments(baseVal, exploredVal, isAtBaseline);

    return {
      statKey,
      label,
      trackId: `delta-track-${statKey}`,
      dataBaseline: isFirstRender ? String(base[key]) : String(baseVal),
      dataExplored: isFirstRender ? String(explored[key]) : String(exploredVal),
      diffId: `delta-diff-${statKey}`,
      diffCls,
      diffText,
      segmentClasses,
    };
  });

  return { baseLabel, exploreLabel, rows };
}
