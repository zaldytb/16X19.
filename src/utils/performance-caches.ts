import { clearScoredSetupCache } from './performance-scoring.js';
import { clearRuntimeValueCache } from './performance-runtime.js';

export function clearPerformanceCaches(scope?: 'all' | 'setup' | 'values'): void {
  if (!scope || scope === 'all' || scope === 'setup') {
    clearScoredSetupCache();
  }
  if (!scope || scope === 'all' || scope === 'values') {
    clearRuntimeValueCache();
  }
}
