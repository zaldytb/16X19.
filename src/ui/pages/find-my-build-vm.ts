import type { Racquet } from '../../engine/types.js';
import type { Build } from '../../state/presets.js';

export type FmbProfileSummaryVm = {
  identity: string;
  priorityLabels: string[];
  thresholdTags: string[];
  notes: string[];
};

export type FmbBuildRowVm = {
  frameIdx: number;
  buildIdx: number;
  name: string;
  tensionLabel: string;
  obs: string;
};

export type FmbFrameCardVm = {
  frameIdx: number;
  frameName: string;
  frameMeta: string;
  builds: FmbBuildRowVm[];
};

export type FmbDirectionsVm = {
  frames: FmbFrameCardVm[];
};

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildFmbSummaryViewModel(
  answers: {
    swing: string | null;
    ball: string | null;
    court: string | null;
    priorities: string[];
  },
  profile: {
    minThresholds: Record<string, number>;
    notes: string[];
  },
): FmbProfileSummaryVm {
  const swingLabels: Record<string, string> = { compact: 'compact-swing', smooth: 'balanced-swing', heavy: 'heavy-swing' };
  const ballLabels: Record<string, string> = { flat: 'flat-hitting', moderate: 'moderate-spin', heavy: 'heavy-topspin' };
  const courtLabels: Record<string, string> = { baseliner: 'baseliner', allcourt: 'all-court', firststrike: 'first-strike', touch: 'touch player' };

  const identity = `${courtLabels[answers.court || ''] || 'all-court'} with a ${swingLabels[answers.swing || ''] || 'balanced'}, ${ballLabels[answers.ball || ''] || 'moderate-spin'} game`;

  return {
    identity: toTitleCase(identity),
    priorityLabels: answers.priorities.map((priority) => toTitleCase(priority)),
    thresholdTags: Object.entries(profile.minThresholds).map(([key, value]) => `${toTitleCase(key)} \u2265 ${value}`),
    notes: profile.notes,
  };
}

export function buildFmbDirectionsViewModel(
  rankedFrames: Array<{ racquet: Racquet; topBuilds: Build[] }>,
): FmbDirectionsVm {
  return {
    frames: rankedFrames.map((frame, frameIdx) => ({
      frameIdx,
      frameName: frame.racquet.name,
      frameMeta: `${frame.racquet.headSize}" \u00B7 ${frame.racquet.weight}g \u00B7 ${frame.racquet.pattern}`,
      builds: frame.topBuilds.map((build, buildIdx) => {
        const isHybrid = build.type === 'hybrid';
        const name = isHybrid
          ? `${build.mains?.name} / ${build.crosses?.name}`
          : build.string?.name || 'Unknown';

        return {
          frameIdx,
          buildIdx,
          name,
          tensionLabel: isHybrid
            ? `M:${build.tension} / X:${build.tension - 2} lbs`
            : `${build.tension} lbs`,
          obs: build.score.toFixed(1),
        };
      }),
    })),
  };
}
