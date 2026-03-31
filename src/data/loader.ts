// src/data/loader.ts
// Single source of truth for equipment data imports
// Re-exports from generated data so modules don't import the generated file directly.

import { RACQUETS, STRINGS, FRAME_META, FRAME_NOVELTY_PROFILE } from './generated.js';
import type { Racquet, StringData, FrameMeta, FrameNoveltyProfile } from '../engine/types.js';

export const RACQUET_INDEX = new Map(
  RACQUETS.map((racquet) => [racquet.id, racquet])
);

export const STRING_INDEX = new Map(
  STRINGS.map((string) => [string.id, string])
);

export function getRacquetById(id: string | null | undefined): Racquet | undefined {
  return id ? (RACQUET_INDEX.get(id) as Racquet | undefined) : undefined;
}

export function getStringById(id: string | null | undefined): StringData | undefined {
  return id ? (STRING_INDEX.get(id) as StringData | undefined) : undefined;
}

export { RACQUETS, STRINGS, FRAME_META, FRAME_NOVELTY_PROFILE };
export type { Racquet, StringData, FrameMeta, FrameNoveltyProfile };
