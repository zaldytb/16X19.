// Pure view-model for Tune hybrid dimension toggle (#tune-hybrid-toggle) — parity with renderTuneHybridToggle.

import type { StringConfig } from '../../engine/types.js';

export type HybridDim = 'mains' | 'crosses' | 'linked';

export type TuneHybridDimToggleViewModel =
  | { visible: false }
  | { visible: true; activeDim: HybridDim };

export function buildTuneHybridDimToggleViewModel(
  stringConfig: StringConfig,
  hybridDimension: HybridDim
): TuneHybridDimToggleViewModel {
  const hasSplitTensions =
    stringConfig.isHybrid ||
    (stringConfig.mainsTension !== undefined && stringConfig.crossesTension !== undefined);
  if (!hasSplitTensions) {
    return { visible: false };
  }
  return { visible: true, activeDim: hybridDimension };
}
