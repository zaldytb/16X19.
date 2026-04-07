import type { Racquet, StringData } from '../../engine/types.js';
import type { HybridRole, HybridPartnerCard } from '../../engine/hybridRole.js';

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
  hybridRole: HybridRole;
  hybridRoleLabel: string;       // e.g. "Mains String" / "Cross String" / "Versatile"
  hybridRoleSubtext: string;     // one-line physical rationale
  partnerCards: HybridPartnerCard[];
  partnerSectionTitle: string;   // "Best Cross Partners" / "Best Mains Partners" / "Hybrid Partners"
  partnerSectionSubtext: string; // short description for the section
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

function buildHybridRoleLabel(role: HybridRole): string {
  if (role === 'MAINS') return 'Mains String';
  if (role === 'CROSS') return 'Cross String';
  return 'Versatile';
}

function buildHybridRoleSubtext(role: HybridRole, stringItem: StringData): string {
  if (role === 'MAINS') {
    return `Shaped geometry and stiffness optimized for snapback generation. Best used in the mains position of a hybrid setup.`;
  }
  if (role === 'CROSS') {
    return `Round profile and low stiffness provide a compliant platform for the mains to snap against. Best used as the cross string.`;
  }
  return `Balanced properties across edge geometry, stiffness, and tension maintenance — performs well in either mains or cross position.`;
}

function buildPartnerSectionMeta(role: HybridRole): { title: string; subtext: string } {
  if (role === 'MAINS') {
    return {
      title: '// BEST CROSS PARTNERS',
      subtext: 'Cross strings that maximize snapback quality, platform compliance, and tension maintenance compatibility with this mains.',
    };
  }
  if (role === 'CROSS') {
    return {
      title: '// BEST MAINS PARTNERS',
      subtext: 'Mains strings whose edge geometry and spin profile pair optimally with this cross string.',
    };
  }
  return {
    title: '// HYBRID PARTNERS',
    subtext: 'Top pairing options when using this string in either the mains or cross position.',
  };
}

export function buildStringCompendiumDetailVm(
  stringItem: StringData,
  pills: StringPillsVm,
  similarStrings: StringData[],
  bestFrames: Array<{ racquet: Racquet; obs: number }>,
  getArchetype: (s: StringData) => string,
  getFrameIdentityLabel: (r: Racquet) => string,
  hybridRoleResult: { role: HybridRole },
  partnerCards: HybridPartnerCard[],
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

  const { role } = hybridRoleResult;
  const partnerMeta = buildPartnerSectionMeta(role);

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
    hybridRole: role,
    hybridRoleLabel: buildHybridRoleLabel(role),
    hybridRoleSubtext: buildHybridRoleSubtext(role, stringItem),
    partnerCards,
    partnerSectionTitle: partnerMeta.title,
    partnerSectionSubtext: partnerMeta.subtext,
  };
}
