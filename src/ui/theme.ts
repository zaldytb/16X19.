// src/ui/theme.ts
// Theme DOM helpers and responsive header management

type Theme = 'dark' | 'light';

interface ThemeCallbacks {
  refreshSlotColors?: () => void;
  refreshRadarChart?: () => void;
  refreshComparison?: () => void;
  refreshSweepChart?: () => void;
}

interface ThemeState {
  currentMode?: string;
  hasSweepChart?: boolean;
}

/**
 * Toggle between light and dark themes.
 * @param callbacks - Object containing callback functions for theme-dependent updates
 * @param state - Object containing current state
 */
export function toggleTheme(callbacks: ThemeCallbacks = {}, state: ThemeState = {}): void {
  const html = document.documentElement;
  const current = html.dataset.theme as Theme | undefined;

  // Wave 2: Smooth color crossfade
  html.classList.add('theme-transitioning');
  html.dataset.theme = current === 'dark' ? 'light' : 'dark';
  setTimeout(() => html.classList.remove('theme-transitioning'), 450);

  // Refresh theme-dependent colors
  if (callbacks.refreshSlotColors) {
    callbacks.refreshSlotColors();
  }

  // Update charts
  if (callbacks.refreshRadarChart) {
    callbacks.refreshRadarChart();
  }
  
  if (callbacks.refreshComparison) {
    callbacks.refreshComparison();
  }

  // Refresh sweep chart if tune mode is open
  if (state.currentMode === 'tune' && state.hasSweepChart && callbacks.refreshSweepChart) {
    callbacks.refreshSweepChart();
  }
}

export function handleResponsiveHeader(): void {
  const switcher = document.getElementById('mode-switcher');
  const dockRegion = document.querySelector('.header-dock-region');
  const workspaceRegion = document.querySelector('.header-workspace-region');
  if (!switcher || !dockRegion || !workspaceRegion) return;
  if (switcher.dataset.responsiveHeaderBound === 'true') return;
  switcher.dataset.responsiveHeaderBound = 'true';

  const mediaQuery = window.matchMedia('(max-width: 1024px)');
  const onBreakpoint = (event: MediaQueryList | MediaQueryListEvent): void => {
    if (event.matches) {
      if (!dockRegion.contains(switcher)) {
        dockRegion.appendChild(switcher);
      }
      return;
    }

    const actions = workspaceRegion.querySelector('.header-actions');
    const trail = actions?.querySelector('.header-actions-trail');
    if (actions && trail && !actions.contains(switcher)) {
      actions.insertBefore(switcher, trail);
    }
  };

  mediaQuery.addEventListener('change', onBreakpoint);
  onBreakpoint(mediaQuery);
}

/**
 * Get current theme
 * @returns 'dark' or 'light'
 */
export function getTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme) || 'dark';
}

/**
 * Set theme explicitly
 * @param theme - 'dark' or 'light'
 */
export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/**
 * Initialize theme based on user preference or system preference
 */
export function initTheme(): void {
  const html = document.documentElement;
  // Default to dark if not set
  if (!html.dataset.theme) {
    html.dataset.theme = 'dark';
  }
}
