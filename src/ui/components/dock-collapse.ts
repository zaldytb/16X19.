// src/ui/components/dock-collapse.ts
// Dock collapse rail functionality

import { getObsScoreColor } from '../../engine/composite.js';
import { getActiveLoadout, getSavedLoadouts } from '../../state/store.js';

/**
 * Toggle dock collapsed state (desktop rail mode)
 */
export function toggleDockCollapse(): void {
  const dock = document.getElementById('build-dock');
  if (!dock) return;
  const isCollapsed = dock.classList.toggle('dock-collapsed');
  document.documentElement.style.setProperty('--dock-w', isCollapsed ? '64px' : '300px');
  try { localStorage.setItem('dockCollapsed', isCollapsed ? '1' : '0'); } catch(e) {}
  if (isCollapsed) _syncDockRail();
  // Dispatch resize after CSS transition for chart reflow
  setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 320);
}

/**
 * Sync dock rail OBS display with current active loadout
 */
export function _syncDockRail(): void {
  const obsEl = document.getElementById('dock-rail-obs');
  const countEl = document.getElementById('dock-rail-count');
  const activeLoadout = getActiveLoadout();
  if (obsEl) {
    if (activeLoadout && activeLoadout.obs) {
      obsEl.textContent = activeLoadout.obs.toFixed(1);
      obsEl.style.color = getObsScoreColor(activeLoadout.obs);
    } else {
      obsEl.textContent = '\u2014';
      obsEl.style.color = 'var(--dc-storm)';
    }
  }
  if (countEl) {
    const saved = getSavedLoadouts();
    countEl.textContent = String(saved.length);
  }
}

/**
 * Initialize dock collapse state from localStorage
 */
export function _initDockCollapse(): void {
  try {
    const collapsed = localStorage.getItem('dockCollapsed') === '1';
    if (collapsed && window.innerWidth > 1024) {
      const dock = document.getElementById('build-dock');
      if (dock) {
        dock.classList.add('dock-collapsed');
        document.documentElement.style.setProperty('--dock-w', '64px');
        _syncDockRail();
      }
    }
  } catch(e) {}
}
