// src/ui/components/mobile-dock.ts
// Mobile dock bar functionality

import { getActiveLoadout } from '../../state/store.js';
import { _prevObsValues, animateOBS } from './obs-animation.js';

function getNumericObs(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

/**
 * Sync mobile dock bar with current active loadout
 */
export function _syncMobileDockBar(): void {
  const obsEl = document.getElementById('dock-mob-obs');
  const labelEl = document.getElementById('dock-mob-label');
  if (!obsEl || !labelEl) return;
  
  const al = getActiveLoadout();
  if (al) {
    const newMobObs = getNumericObs(al.obs);
    if (newMobObs > 0 && _prevObsValues.mobile != null && _prevObsValues.mobile > 0) {
      animateOBS(obsEl, _prevObsValues.mobile, newMobObs, 400);
    } else {
      obsEl.textContent = newMobObs > 0 ? newMobObs.toFixed(1) : '';
    }
    _prevObsValues.mobile = newMobObs;
    labelEl.textContent = al.name || 'Active loadout';
  } else {
    obsEl.textContent = '';
    labelEl.textContent = 'No active loadout';
  }
}

/**
 * Toggle mobile dock expanded/collapsed state
 */
export function toggleMobileDock(): void {
  const dock = document.getElementById('build-dock');
  const backdrop = document.getElementById('dock-backdrop');
  const mobileBar = document.getElementById('dock-mobile-bar');
  if (!dock) return;

  const isExpanded = dock.classList.toggle('dock-expanded');

  // Toggle backdrop
  if (backdrop) {
    if (isExpanded) {
      backdrop.classList.add('active');
    } else {
      backdrop.classList.remove('active');
    }
  }

  // Chevron rotation via class
  if (mobileBar) {
    mobileBar.classList.toggle('bar-expanded', isExpanded);
  }
}
