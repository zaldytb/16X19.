import type { Racquet, StringData } from '../../engine/types.js';

export interface StringPillsVm {
  bestFor: string[];
  watchOut: string[];
}

export interface StringTelemetryRowVm {
  label: string;
  value: number;
  filledSegments: number;
}

export interface StringTelemetryGroupVm {
  title: string;
  rows: StringTelemetryRowVm[];
}

export interface StringSimilarCardVm {
  id: string;
  archetype: string;
  spinScore: number;
  name: string;
  material: string;
  shape: string;
}

export interface StringBestFrameCardVm {
  racquetId: string;
  identityLabel: string;
  obs: number;
  name: string;
  pattern: string;
  strungWeight: number;
}

export interface StringCompendiumDetailVm {
  twuComposite: number;
  name: string;
  materialUpper: string;
  shape: string;
  notesHtml: string | null;
  stiffness: number;
  spinPotentialDisplay: string;
  tensionLossDisplay: string;
  snapbackLabel: string;
  bestForLines: string[];
  watchOutLines: string[];
  telemetryGroups: StringTelemetryGroupVm[];
  similarCards: StringSimilarCardVm[];
  bestFrameCards: StringBestFrameCardVm[];
}

const SEGMENTS = 25;

function buildTelemetryGroups(stringItem: StringData): StringTelemetryGroupVm[] {
  const scores = stringItem.twScore || {};
  const groups: Array<{ title: string; stats: Array<{ label: string; val: number }> }> = [
    {
      title: 'Response',
      stats: [
        { label: 'Power', val: scores.power || 50 },
        { label: 'Spin', val: scores.spin || 50 },
        { label: 'Control', val: scores.control || 50 },
      ],
    },
    {
      title: 'Feel',
      stats: [
        { label: 'Feel', val: scores.feel || 50 },
        { label: 'Comfort', val: scores.comfort || 50 },
        { label: 'Playability', val: scores.playabilityDuration || 50 },
      ],
    },
    {
      title: 'Longevity',
      stats: [
        { label: 'Durability', val: scores.durability || 50 },
        { label: 'Tension Loss', val: Math.max(0, 100 - (stringItem.tensionLoss || 0) * 2) },
      ],
    },
  ];

  return groups.map((group) => ({
    title: group.title,
    rows: group.stats.map((stat) => {
      const pct = Math.max(0, Math.min(100, stat.val));
      const filledSegments = Math.round((pct / 100) * SEGMENTS);
      return { label: stat.label, value: Math.round(stat.val), filledSegments };
    }),
  }));
}

export function buildStringCompendiumDetailVm(
  stringItem: StringData,
  pills: StringPillsVm,
  similarStrings: StringData[],
  bestFrames: Array<{ racquet: Racquet; obs: number }>,
  getArchetype: (s: StringData) => string,
  getFrameIdentityLabel: (r: Racquet) => string,
): StringCompendiumDetailVm {
  const twScores = stringItem.twScore || {};
  const twuComposite = Math.round(
    (twScores.control || 50) * 0.16 +
      (twScores.spin || 50) * 0.13 +
      (twScores.comfort || 50) * 0.13 +
      (twScores.power || 50) * 0.11 +
      (twScores.feel || 50) * 0.1 +
      (twScores.durability || 50) * 0.07 +
      (twScores.playabilityDuration || 50) * 0.06,
  );

  const notes = typeof stringItem.notes === 'string' ? stringItem.notes : '';
  const spinPotentialDisplay =
    stringItem.spinPotential !== undefined && stringItem.spinPotential !== null
      ? String(stringItem.spinPotential)
      : '\u2014';
  const tensionLossDisplay =
    stringItem.tensionLoss !== undefined && stringItem.tensionLoss !== null
      ? `${stringItem.tensionLoss}%`
      : '\u2014';

  const similarCards: StringSimilarCardVm[] = similarStrings.map((similar) => ({
    id: similar.id,
    archetype: getArchetype(similar),
    spinScore: similar.twScore?.spin || 0,
    name: similar.name,
    material: similar.material,
    shape: similar.shape,
  }));

  const bestFrameCards: StringBestFrameCardVm[] = bestFrames.map((frameResult) => ({
    racquetId: frameResult.racquet.id,
    identityLabel: getFrameIdentityLabel(frameResult.racquet),
    obs: frameResult.obs,
    name: frameResult.racquet.name.replace(/\s+\d+g$/, ''),
    pattern: frameResult.racquet.pattern,
    strungWeight: frameResult.racquet.strungWeight,
  }));

  return {
    twuComposite,
    name: stringItem.name,
    materialUpper: stringItem.material.toUpperCase(),
    shape: stringItem.shape,
    notesHtml: notes || null,
    stiffness: Math.round(stringItem.stiffness),
    spinPotentialDisplay,
    tensionLossDisplay,
    snapbackLabel: stringItem.stiffness > 200 ? 'High' : stringItem.stiffness > 180 ? 'Med' : 'Low',
    bestForLines: pills.bestFor,
    watchOutLines: pills.watchOut,
    telemetryGroups: buildTelemetryGroups(stringItem),
    similarCards,
    bestFrameCards,
  };
}
