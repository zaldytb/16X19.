import { predictSetup } from '../engine/index.js';
import { getCurrentMode, getSlotColors, setSlotColors } from '../state/imperative.js';
import { getCurrentSetup } from '../state/setup-sync.js';
import { renderCompareRefreshViaBridge } from './pages/compare-runtime-bridge.js';
import { renderOverviewRadarChartViaBridge } from './pages/overview-runtime-bridge.js';
import { refreshTuneSweepChartViaBridge } from './pages/tune-runtime-bridge.js';
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
        const setup = getCurrentSetup();
        if (!setup) return;
        const stats = predictSetup(setup.racquet, setup.stringConfig);
        renderOverviewRadarChartViaBridge(stats);
      },
      refreshComparison: () => {
        renderCompareRefreshViaBridge();
      },
      refreshSweepChart: () => {
        const setup = getCurrentSetup();
        if (!setup) return;
        refreshTuneSweepChartViaBridge(setup);
      },
    },
    {
      currentMode,
      hasSweepChart: currentMode === 'tune',
    },
  );
}
