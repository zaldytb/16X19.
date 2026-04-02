import { getCurrentMode, getSlotColors, setSlotColors } from '../state/imperative.js';
import { getCurrentSetup } from '../state/setup-sync.js';
import { renderCompareRefreshViaBridge } from './pages/compare-runtime-bridge.js';
import { toggleTheme } from './theme.js';

export function toggleAppTheme(): void {
  const currentMode = getCurrentMode();

  toggleTheme(
    {
      refreshSlotColors: () => {
        const nextColors = [...getSlotColors()];
        setSlotColors(nextColors);
      },
      refreshRadarChart: () => {
        // Overview radar is React-owned and observes theme changes directly.
      },
      refreshComparison: () => {
        renderCompareRefreshViaBridge();
      },
      refreshSweepChart: () => {
        const setup = getCurrentSetup();
        if (!setup) return;
        void import('./pages/tune.js').then((mod) => {
          mod.refreshTuneSweepChartIfMounted(setup);
        });
      },
    },
    {
      currentMode,
      hasSweepChart: currentMode === 'tune',
    },
  );
}
