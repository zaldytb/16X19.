// src/ui/nav.ts
// Navigation and mode switching

// Mode constants
type Mode = 'overview' | 'tune' | 'compare' | 'optimize' | 'compendium' | 'howitworks';

export const MODES: Record<string, Mode> = {
  OVERVIEW: 'overview',
  TUNE: 'tune',
  COMPARE: 'compare',
  OPTIMIZE: 'optimize',
  COMPENDIUM: 'compendium',
  HOWITWORKS: 'howitworks'
} as const;

// Scroll positions for each mode
const scrollPositions: Record<string, number> = {};

interface NavCallbacks {
  onModeSwitch?: (mode: string) => void;
}

/**
 * Get current scroll position for a mode
 */
export function getScrollPosition(mode: string): number {
  return scrollPositions[mode] || 0;
}

/**
 * Save scroll position for a mode
 */
export function saveScrollPosition(mode: string, position: number): void {
  scrollPositions[mode] = position;
}

/**
 * Initialize navigation
 * @param callbacks - Callbacks for mode initialization
 */
export function initNav(callbacks: NavCallbacks = {}): void {
  // Wire up mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = (btn as HTMLElement).dataset.mode;
      if (mode && callbacks.onModeSwitch) {
        callbacks.onModeSwitch(mode);
      }
    });
  });

  // Wire up mobile tab buttons
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = (btn as HTMLElement).dataset.mode;
      if (mode && callbacks.onModeSwitch) {
        callbacks.onModeSwitch(mode);
      }
    });
  });
}

/**
 * Get mode display name
 */
export function getModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    [MODES.OVERVIEW]: 'Overview',
    [MODES.TUNE]: 'Tune',
    [MODES.COMPARE]: 'Compare',
    [MODES.OPTIMIZE]: 'Optimize',
    [MODES.COMPENDIUM]: 'Explore',
    [MODES.HOWITWORKS]: 'How It Works'
  };
  return labels[mode] || mode;
}
