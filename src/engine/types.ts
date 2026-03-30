// src/engine/types.ts
// Core domain types for the prediction engine.
// All types are derived from the actual shapes in use — do NOT change engine
// logic to fit these types; update these types to match reality instead.

// ============================================
// DATA LAYER — raw equipment shapes
// ============================================

/** Per-string TWU lab measurements (source of truth for string-profile calc) */
export interface TwScore {
  power: number;
  spin: number;
  comfort: number;
  control: number;
  feel: number;
  playabilityDuration: number;
  durability: number;
}

/** String entry as stored in generated data modules / STRINGS array */
export interface StringData {
  id: string;
  name: string;
  gauge: string;
  gaugeNum: number;
  material: string;
  shape: string;
  stiffness: number;
  tensionLoss: number;
  spinPotential: number;
  twScore: TwScore;
  /** Set by applyGaugeModifier when gauge differs from reference */
  _gaugeModified?: boolean;
  /** Original reference gauge, set by applyGaugeModifier */
  _refGauge?: number;
  [key: string]: unknown; // allow extra fields from generated data
}

/** Racquet entry as stored in generated data modules / RACQUETS array.
 *  Field names match the actual data — note `swingweight` (lowercase w). */
export interface Racquet {
  id: string;
  name: string;
  headSize: number;
  /** Strung weight in grams */
  strungWeight: number;
  /** Swing weight in kg·cm² (lowercase 'w' — matches generated data) */
  swingweight: number;
  stiffness: number;
  balance: number;
  beamWidth: number[];
  pattern: string;
  tensionRange: [number, number];
  [key: string]: unknown;
}

/** Per-frame technology metadata from FRAME_META in generated data */
export interface FrameMeta {
  aeroBonus: number;
  comfortTech: number;
  spinTech: number;
  genBonus: number;
}

// ============================================
// ENGINE LAYER — intermediate & final scores
// ============================================

/** Scores produced by calcFrameBase (11 attributes, all numbers) */
export interface FrameBaseScores {
  power: number;
  spin: number;
  control: number;
  launch: number;
  comfort: number;
  stability: number;
  forgiveness: number;
  feel: number;
  maneuverability: number;
  durability: number;
  playability: number;
  /** Debug slot — may be undefined; set externally in some callers */
  _frameDebug?: unknown;
}

/** Scores produced by calcBaseStringProfile (7 attributes — strings don't drive launch/stability/etc.) */
export interface StringProfileScores {
  power: number;
  spin: number;
  control: number;
  feel: number;
  comfort: number;
  durability: number;
  playability: number;
}

/** Modifier deltas produced by calcStringFrameMod */
export interface StringFrameMod {
  powerMod: number;
  spinMod: number;
  controlMod: number;
  comfortMod: number;
  feelMod: number;
  launchMod: number;
}

/** Modifier deltas produced by calcTensionModifier */
export interface TensionMod {
  powerMod: number;
  controlMod: number;
  launchMod: number;
  comfortMod: number;
  spinMod: number;
  feelMod: number;
  playabilityMod: number;
  durabilityMod: number;
  _differential: number;
}

/** Modifier deltas produced by calcHybridInteraction */
export interface HybridMod {
  powerMod: number;
  spinMod: number;
  controlMod: number;
  comfortMod: number;
  feelMod: number;
  durabilityMod: number;
  playabilityMod: number;
  launchMod: number;
}

/** Final 11-attribute scores used throughout the UI */
export interface SetupAttributes {
  spin: number;
  power: number;
  control: number;
  launch: number;
  feel: number;
  comfort: number;
  stability: number;
  forgiveness: number;
  maneuverability: number;
  durability: number;
  playability: number;
}

/** Debug payload attached to predictSetup result */
export interface SetupDebug {
  frameBase: FrameBaseScores;
  stringProfile: StringProfileScores;
  stringMod: StringFrameMod;
  tensionMod: TensionMod;
  _frameDebug: unknown;
  hybridInteraction: HybridMod | null;
}

/** Full return type of predictSetup — attributes + debug bag */
export interface SetupStats extends SetupAttributes {
  _debug?: SetupDebug;
}

// ============================================
// LOADOUT TYPE (single source of truth)
// ============================================

/** Loadout object — the primary user-saved build representation */
export interface Loadout {
  id: string;
  name: string;
  frameId: string;
  stringId: string | null;
  isHybrid: boolean;
  mainsId: string | null;
  crossesId: string | null;
  mainsTension: number;
  crossesTension: number;
  gauge?: string | null;
  mainsGauge?: string | null;
  crossesGauge?: string | null;
  stats?: SetupStats;
  obs: number;
  identity?: string;
  source?: string;
  _dirty?: boolean;
}

// ============================================
// INPUT TYPES
// ============================================

/** Hybrid setup: separate mains + crosses */
export interface HybridStringConfig {
  isHybrid: true;
  mains: StringData;
  crosses: StringData;
  mainsTension: number;
  crossesTension: number;
}

/** Fullbed setup: single string */
export interface FullbedStringConfig {
  isHybrid: false;
  string: StringData;
  mainsTension: number;
  crossesTension: number;
}

/** Discriminated union — TypeScript narrows automatically on `isHybrid` */
export type StringConfig = HybridStringConfig | FullbedStringConfig;

/** Context object used by computeCompositeScore for tension sanity penalties */
export interface TensionContext {
  avgTension: number;
  tensionRange: [number, number];
  differential: number;
  patternCrosses: number;
}

// ============================================
// CONSTANTS / CONFIG TYPES
// ============================================

/** Available gauge sizes keyed by material name */
export type GaugeOptions = Record<string, number[]>;

/** Human-readable gauge labels keyed by gauge number (e.g. 1.25 → "16L (1.25mm)") */
export type GaugeLabels = Record<number, string>;

/** OBS tier entry */
export interface ObsTier {
  min: number;
  max: number;
  label: string;
}

/** Identity family entry — test receives final SetupAttributes */
export interface IdentityFamily {
  family: string;
  test: (s: SetupAttributes) => boolean;
}

/** Stat group definition (Attack / Defense / Touch / Longevity) */
export interface StatGroup {
  label: string;
  keys: string[];
}

/** Leaderboard stat definition */
export interface LbStat {
  key: string;
  label: string;
  icon: string;
  desc: string;
}

/** Default stringing preset — fullbed or hybrid */
export interface DefaultPreset {
  name: string;
  mode: 'fullbed' | 'hybrid';
  label: string;
  // fullbed fields
  material?: string;
  tension?: number;
  // hybrid fields
  materialMains?: string;
  materialCrosses?: string;
  tensionMains?: number;
  tensionCrosses?: number;
}

// ============================================
// OUTPUT TYPES
// ============================================

/** Result of generateIdentity */
export interface IdentityResult {
  archetype: string;
  /** @deprecated Use archetype instead. Name kept for backward compatibility. */
  name?: string;
  description: string;
  tags: string[];
}

/** Result of classifySetup */
export interface ClassifyResult {
  strongest: Array<{ attr: string; val: number }>;
  weakest: Array<{ attr: string; val: number }>;
  family: string;
}
