/**
 * Pure view-model for Leaderboard v2 filter/shell UI (mirrors legacy _buildShellHTML inputs).
 */

import { RACQUET_BRANDS, STRING_BRANDS } from '../../utils/performance-derived.js';

export type LbShellStatOptionVm = {
  key: string;
  label: string;
  icon: string;
  desc: string;
};

export type LeaderboardShellStateInput = {
  statKey: string;
  filterType: 'both' | 'full' | 'hybrid';
  viewMode: 'builds' | 'frames' | 'strings';
  frameFilters: {
    brand: string;
    pattern: string;
    headSize: string;
    weight: string;
    stiffness: string;
    year: string;
  };
  stringFilters: {
    brand: string;
    material: string;
    shape: string;
    gauge: string;
    stiffness: string;
  };
};

export type LeaderboardShellVm = LeaderboardShellStateInput & {
  statOptions: LbShellStatOptionVm[];
  racquetBrands: string[];
  stringBrands: string[];
};

export function buildLeaderboardShellVm(
  state: LeaderboardShellStateInput,
  statOptions: LbShellStatOptionVm[],
): LeaderboardShellVm {
  return {
    ...state,
    statOptions,
    racquetBrands: RACQUET_BRANDS,
    stringBrands: STRING_BRANDS,
  };
}
