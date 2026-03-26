// src/utils/helpers.ts
// Small shared utilities

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return function(...args: Parameters<T>): void {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Format number with specified precision
 */
export function formatNumber(num: number | null | undefined, decimals = 1): string {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return (+num).toFixed(decimals);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Simple hash function for strings
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}
