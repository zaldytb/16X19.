const _scheduledRenders = new Map<string, number>();
const _valueCache = new Map<string, unknown>();

const _devMode =
  typeof location !== 'undefined' &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
const _perfThresholdMs = 24;

export function scheduleRender(key: string, callback: () => void): void {
  const existing = _scheduledRenders.get(key);
  if (existing != null) {
    cancelAnimationFrame(existing);
  }

  const frame = requestAnimationFrame(() => {
    _scheduledRenders.delete(key);
    callback();
  });
  _scheduledRenders.set(key, frame);
}

export function getCachedValue<T>(key: string, factory: () => T): T {
  if (_valueCache.has(key)) {
    return _valueCache.get(key) as T;
  }
  const value = factory();
  _valueCache.set(key, value);
  return value;
}

export function clearRuntimeValueCache(): void {
  _valueCache.clear();
}

export function measurePerformance<T>(name: string, run: () => T): T {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const result = run();
  const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const duration = end - start;

  if (_devMode && duration >= _perfThresholdMs) {
    console.log(`[Perf] ${name}: ${duration.toFixed(1)}ms`);
  }

  return result;
}
