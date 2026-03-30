// src/ui/components/obs-animation.ts
// OBS score animation utilities

/** Previous OBS values for animation continuity */
export const _prevObsValues = {
  tune: null as number | null,
  hero: null as number | null,
  dock: null as number | null,
  mobile: null as number | null
};

type ObsHostAnimationState = {
  displayed: number;
  target: number;
  raf: number | null;
};

const _obsHostAnimationStates = new WeakMap<HTMLElement, ObsHostAnimationState>();

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate OBS value change with smooth interpolation
 */
export function animateOBS(
  el: HTMLElement,
  from: number,
  to: number,
  duration: number
): void {
  if (!el || isNaN(from) || isNaN(to)) return;
  if (Math.abs(from - to) < 0.05) { el.textContent = to.toFixed(1); return; }
  if (prefersReducedMotion()) {
    el.textContent = to.toFixed(1);
    return;
  }
  
  // Cancel any existing animation on this element
  const animKey = '_obsAnim';
  if ((el as any)[animKey]) cancelAnimationFrame((el as any)[animKey]);
  
  duration = duration || 350;
  const t0 = performance.now();
  el.textContent = from.toFixed(1);
  
  function step(t: number) {
    const p = Math.min(1, (t - t0) / duration);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - p, 3);
    const cur = from + (to - from) * eased;
    el.textContent = cur.toFixed(1);
    if (p < 1) {
      (el as any)[animKey] = requestAnimationFrame(step);
    } else {
      (el as any)[animKey] = null;
    }
  }
  
  (el as any)[animKey] = requestAnimationFrame(step);
}

/**
 * Animate an OBS value inside a persistent host container.
 * This preserves counting continuity even when the score markup gets rebuilt
 * via `innerHTML` during repeated page refreshes.
 */
export function animateOBSInContainer(
  host: HTMLElement,
  valueSelector: string,
  to: number,
  duration: number,
  fallbackFrom: number | null = null
): void {
  const obsEl = host.querySelector(valueSelector);
  if (!(obsEl instanceof HTMLElement) || isNaN(to)) return;

  const existingState = _obsHostAnimationStates.get(host);
  const from = existingState?.displayed ?? fallbackFrom ?? to;

  if (existingState?.raf != null) {
    cancelAnimationFrame(existingState.raf);
  }

  if (Math.abs(from - to) < 0.05 || prefersReducedMotion()) {
    obsEl.textContent = to.toFixed(1);
    _obsHostAnimationStates.set(host, { displayed: to, target: to, raf: null });
    return;
  }

  const state: ObsHostAnimationState = {
    displayed: from,
    target: to,
    raf: null,
  };
  _obsHostAnimationStates.set(host, state);
  obsEl.textContent = from.toFixed(1);

  const t0 = performance.now();

  function step(t: number) {
    if (_obsHostAnimationStates.get(host) !== state) return;

    const p = Math.min(1, (t - t0) / (duration || 350));
    const eased = 1 - Math.pow(1 - p, 3);
    const cur = from + (to - from) * eased;
    state.displayed = cur;

    const currentEl = host.querySelector(valueSelector);
    if (currentEl instanceof HTMLElement) {
      currentEl.textContent = cur.toFixed(1);
    }

    if (p < 1) {
      state.raf = requestAnimationFrame(step);
    } else {
      state.displayed = to;
      state.raf = null;
      if (currentEl instanceof HTMLElement) {
        currentEl.textContent = to.toFixed(1);
      }
    }
  }

  state.raf = requestAnimationFrame(step);
}
