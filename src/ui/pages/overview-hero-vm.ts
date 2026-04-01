import { buildTensionContext, computeCompositeScore, getObsTier } from '../../engine/index.js';
import type { Racquet, SetupAttributes, StringConfig as EngineStringConfig } from '../../engine/types.js';

type StringConfig = EngineStringConfig;

export type OverviewHeroViewModel = {
  scoreDisplay: string;
  tierLabel: string;
  tierClassSuffix: string;
  archetype: string;
  description: string;
  racquetDisplayName: string;
  stringLine: string;
  tensionLabel: string;
};

export function buildOverviewHeroViewModel(
  racquet: Racquet,
  stringConfig: StringConfig,
  stats: SetupAttributes,
  identity: { archetype: string; description: string },
  precomputedObs?: number
): OverviewHeroViewModel {
  const score =
    typeof precomputedObs === 'number'
      ? precomputedObs
      : computeCompositeScore(stats, buildTensionContext(stringConfig, racquet));
  const tier = getObsTier(score);

  let stringLine: string;
  if (stringConfig.isHybrid) {
    stringLine = `${stringConfig.mains.name} ${stringConfig.mains.gauge} / ${stringConfig.crosses.name} ${stringConfig.crosses.gauge}`;
  } else {
    stringLine = `${stringConfig.string.name} ${stringConfig.string.gauge}`;
  }

  const racquetDisplayName = racquet.name.replace(/\s+\d+g$/, '');
  const tierClassSuffix = tier.label === 'S Rank' ? 's-rank' : '';

  return {
    scoreDisplay: score.toFixed(1),
    tierLabel: tier.label,
    tierClassSuffix,
    archetype: identity.archetype,
    description: identity.description,
    racquetDisplayName,
    stringLine,
    tensionLabel: `M${stringConfig.mainsTension} / X${stringConfig.crossesTension}`,
  };
}
