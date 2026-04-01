// Strip debug payload from predictSetup results for worker transfer and lean DTOs.

import type { SetupAttributes, SetupStats } from '../engine/types.js';

export function toSetupAttributes(stats: SetupStats): SetupAttributes {
  return {
    spin: stats.spin,
    power: stats.power,
    control: stats.control,
    launch: stats.launch,
    feel: stats.feel,
    comfort: stats.comfort,
    stability: stats.stability,
    forgiveness: stats.forgiveness,
    maneuverability: stats.maneuverability,
    durability: stats.durability,
    playability: stats.playability,
  };
}
