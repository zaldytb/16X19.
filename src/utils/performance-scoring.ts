import {
  buildTensionContext,
  computeCompositeScore,
  generateIdentity,
  predictSetup,
} from '../engine/index.js';
import type { Racquet, SetupStats, StringConfig } from '../engine/types.js';

type SetupLike = {
  racquet: Racquet;
  stringConfig: StringConfig;
};

interface ScoredSetupResult {
  stats: SetupStats;
  obs: number;
  identity: ReturnType<typeof generateIdentity>;
}

const _scoredSetupCache = new Map<string, ScoredSetupResult>();

function getStringConfigKey(stringConfig: StringConfig): string {
  if (stringConfig.isHybrid) {
    return [
      'hybrid',
      stringConfig.mains.id,
      stringConfig.crosses.id,
      stringConfig.mains._gaugeModified ? stringConfig.mains.gaugeNum : '',
      stringConfig.crosses._gaugeModified ? stringConfig.crosses.gaugeNum : '',
      stringConfig.mainsTension,
      stringConfig.crossesTension,
    ].join('|');
  }

  return [
    'full',
    stringConfig.string.id,
    stringConfig.string._gaugeModified ? stringConfig.string.gaugeNum : '',
    stringConfig.mainsTension,
    stringConfig.crossesTension,
  ].join('|');
}

export function getScoredSetup(setup: SetupLike): ScoredSetupResult {
  const cacheKey = `${setup.racquet.id}|${getStringConfigKey(setup.stringConfig)}`;
  const cached = _scoredSetupCache.get(cacheKey);
  if (cached) return cached;

  const stats = predictSetup(setup.racquet, setup.stringConfig);
  const obs = computeCompositeScore(
    stats,
    buildTensionContext(setup.stringConfig, setup.racquet),
  );
  const identity = generateIdentity(stats, setup.racquet, setup.stringConfig);
  const result = { stats, obs, identity };
  _scoredSetupCache.set(cacheKey, result);
  return result;
}

export function clearScoredSetupCache(): void {
  _scoredSetupCache.clear();
}
