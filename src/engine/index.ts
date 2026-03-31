// src/engine/index.ts
// Public API for the prediction engine — re-exports all engine functions

// Constants
export {
  GAUGE_OPTIONS,
  GAUGE_LABELS,
  STAT_KEYS,
  STAT_LABELS,
  STAT_LABELS_FULL,
  STAT_CSS_CLASSES,
  STAT_GROUPS,
  OBS_TIERS,
  WTTN_ATTRS,
  WTTN_ATTR_LABELS,
  IDENTITY_FAMILIES,
  LB_STATS,
  DEFAULT_PRESETS
} from './constants.js';

// Frame physics
export {
  clamp,
  lerp,
  norm,
  getPatternOpenness,
  getAvgBeam,
  getMaxBeam,
  getMinBeam,
  isVariableBeam,
  calcFrameBase,
  normalizeRawSpecs
} from './frame-physics.js';

// String profile
export {
  calcBaseStringProfile,
  calcStringFrameMod,
  applyGaugeModifier,
  getGaugeOptions
} from './string-profile.js';

// Tension
export {
  calcTensionModifier,
  buildTensionContext
} from './tension.js';

// Hybrid
export {
  calcHybridInteraction
} from './hybrid.js';

// Composite / scoring
export {
  predictSetup,
  computeNoveltyBreakdown,
  computeCompositeScore,
  getObsTier,
  getObsScoreColor,
  generateIdentity,
  classifySetup
} from './composite.js';
