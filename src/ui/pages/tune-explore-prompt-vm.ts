// Pure view-model for Tune explore prompt (#explore-content) — parity with renderExplorePrompt in recommendations.ts

import type { Racquet, StringConfig } from '../../engine/types.js';

export type ExplorePromptViewModel =
  | { kind: 'empty' }
  | { kind: 'hybridNudge' }
  | { kind: 'tryDifferent'; topStringName: string };

export function buildExplorePromptViewModel(
  setup: { racquet: Racquet; stringConfig: StringConfig },
  isCurrentInTop: boolean,
  topBuilds: Array<{ string?: { name?: string } }>
): ExplorePromptViewModel {
  if (setup.stringConfig.isHybrid) {
    return { kind: 'hybridNudge' };
  }
  if (isCurrentInTop) {
    return { kind: 'empty' };
  }
  const topName = topBuilds[0]?.string?.name || 'a top-rated string';
  return { kind: 'tryDifferent', topStringName: topName };
}
