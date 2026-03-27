// src/ui/components/obs-animation.ts
// OBS score animation utilities

/** Previous OBS values for animation continuity */
export const _prevObsValues = {
  tune: null as number | null,
  hero: null as number | null,
  dock: null as number | null,
  mobile: null as number | null
};

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
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
