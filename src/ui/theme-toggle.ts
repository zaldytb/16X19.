import { predictSetup } from '../engine/index.js';
import { getCurrentMode, getSlotColors, setSlotColors } from '../state/app-state.js';
import { getCurrentSetup } from '../state/setup-sync.js';
import { toggleTheme } from './theme.js';

export function toggleAppTheme(): void {
  const currentMode = getCurrentMode();

  toggleTheme(
    {
      refreshSlotColors: () => {
        const nextColors = [...getSlotColors<unknown[]>()];
        setSlotColors(nextColors);
      },
      refreshRadarChart: () => {
        const setup = getCurrentSetup();
        if (!setup) return;
        const stats = predictSetup(setup.racquet, setup.stringConfig);
        void import('./pages/overview.js').then(({ renderRadarChart }) => {
          renderRadarChart(stats);
        });
      },
      refreshComparison: () => {
        void import('./pages/compare/index.js').then(({ updateComparisonRadar, renderComparisonSlots }) => {
          updateComparisonRadar();
          renderComparisonSlots();
        });
      },
      refreshSweepChart: () => {
        const setup = getCurrentSetup();
        if (!setup) return;
        void import('./pages/tune.js').then(({ sweepChart, renderSweepChart }) => {
          if (!sweepChart) return;
          sweepChart.destroy();
          renderSweepChart(setup);
        });
      },
    },
    {
      currentMode,
      hasSweepChart: currentMode === 'tune',
    },
  );
}
