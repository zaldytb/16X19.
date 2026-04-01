// src/data/loader.ts
// Runtime catalog from public/data/catalog.json (see pipeline/scripts/export-to-app.ts).

import type { Racquet, StringData, FrameMeta, FrameNoveltyProfile } from '../engine/types.js';

/** Populated by initCatalog(); mutable arrays keep references stable for module-level snapshots. */
export const RACQUETS: Racquet[] = [];
export const STRINGS: StringData[] = [];
export const FRAME_META: Record<string, FrameMeta> = {};
export const FRAME_NOVELTY_PROFILE: Record<string, FrameNoveltyProfile> = {};

export let RACQUET_INDEX = new Map<string, Racquet>();
export let STRING_INDEX = new Map<string, StringData>();

let initPromise: Promise<void> | null = null;

function rebuildIndices(): void {
  RACQUET_INDEX = new Map(RACQUETS.map((racquet) => [racquet.id, racquet]));
  STRING_INDEX = new Map(STRINGS.map((string) => [string.id, string]));
}

function replaceRecord<T extends Record<string, unknown>>(target: T, source: T): void {
  for (const k of Object.keys(target)) {
    delete target[k];
  }
  Object.assign(target, source);
}

/** Load racquet/string catalog from the static JSON emitted by `npm run export`. */
export async function initCatalog(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const url = `${import.meta.env.BASE_URL}data/catalog.json`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load catalog (${res.status}): ${url}`);
    }
    const data = (await res.json()) as {
      racquets: Racquet[];
      strings: StringData[];
      frameMeta: Record<string, FrameMeta>;
      frameNoveltyProfile: Record<string, FrameNoveltyProfile>;
    };
    RACQUETS.length = 0;
    RACQUETS.push(...data.racquets);
    STRINGS.length = 0;
    STRINGS.push(...data.strings);
    replaceRecord(FRAME_META, data.frameMeta);
    replaceRecord(FRAME_NOVELTY_PROFILE, data.frameNoveltyProfile);
    rebuildIndices();
  })();
  return initPromise;
}

export function getRacquetById(id: string | null | undefined): Racquet | undefined {
  return id ? (RACQUET_INDEX.get(id) as Racquet | undefined) : undefined;
}

export function getStringById(id: string | null | undefined): StringData | undefined {
  return id ? (STRING_INDEX.get(id) as StringData | undefined) : undefined;
}
