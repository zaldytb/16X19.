import type { SetupAttributes } from '../../engine/types.js';

type OverviewRuntimeCallbacks = {
  renderDashboard: () => void;
  renderRadarChart: (stats: SetupAttributes) => void;
};

let _callbacks: Partial<OverviewRuntimeCallbacks> = {};

export function registerOverviewRuntimeCallbacks(callbacks: Partial<OverviewRuntimeCallbacks>): void {
  _callbacks = { ..._callbacks, ...callbacks };
}

export function renderOverviewDashboardViaBridge(): void {
  _callbacks.renderDashboard?.();
}

export function renderOverviewRadarChartViaBridge(stats: SetupAttributes): void {
  _callbacks.renderRadarChart?.(stats);
}
