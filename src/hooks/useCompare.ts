import { useEffect, useState } from 'react';
import { getState, subscribe } from '../ui/pages/compare/hooks/useCompareState.js';
import type { CompareState } from '../ui/pages/compare/types.js';

/**
 * Subscribe to compare page state (slots, active/editing slot).
 * Uses subscription + useState because getState() returns a new object each call.
 */
export function useCompareState(): CompareState {
  const [state, setState] = useState(getState);
  useEffect(() => subscribe((next) => setState(next)), []);
  return state;
}
