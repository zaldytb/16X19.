import { getActiveLoadout } from '../state/store.js';
import {
  getComparisonSlots,
  getCurrentMode,
  getDockEditorContext,
  setDockEditorContext,
} from '../state/app-state.js';
import * as Overview from '../ui/pages/overview.js';
import * as Tune from '../ui/pages/tune.js';
import * as ComparePage from '../ui/pages/compare/index.js';
import { hydrateDock, renderDockContextPanel, renderDockPanel } from '../ui/components/dock-renderers.js';
import { reconcileDockEditorContext } from './contracts.js';
import { reportRuntimeIssue } from './diagnostics.js';

export interface ViewChangeSet {
  activeLoadout?: boolean;
  savedLoadouts?: boolean;
  compareState?: boolean;
  mode?: boolean;
  dockEditorContext?: boolean;
}

export interface RefreshPlan {
  dockPanel: boolean;
  dockContext: boolean;
  overview: boolean;
  tune: boolean;
  compare: boolean;
  compendium: boolean;
}

export function getRefreshPlan(mode: string, changed: ViewChangeSet): RefreshPlan {
  return {
    dockPanel: !!(changed.activeLoadout || changed.savedLoadouts),
    dockContext: !!(
      changed.activeLoadout ||
      changed.savedLoadouts ||
      changed.compareState ||
      changed.mode ||
      changed.dockEditorContext
    ),
    overview: mode === 'overview' && !!(changed.activeLoadout || changed.mode),
    tune: mode === 'tune' && !!(changed.activeLoadout || changed.mode),
    compare: mode === 'compare' && !!(changed.compareState || changed.mode),
    compendium: mode === 'compendium' && !!(changed.activeLoadout || changed.mode),
  };
}

export function syncViews(reason: string, changed: ViewChangeSet): void {
  const mode = getCurrentMode();
  const plan = getRefreshPlan(mode, changed);

  if (changed.activeLoadout) {
    hydrateDock(getActiveLoadout());
  }

  if (changed.compareState || changed.dockEditorContext) {
    const currentContext = getDockEditorContext();
    const nextContext = reconcileDockEditorContext(
      currentContext,
      getComparisonSlots<{ id: string | number }>(),
    );
    if (nextContext.kind !== currentContext.kind ||
        (nextContext.kind === 'compare-slot' &&
          currentContext.kind === 'compare-slot' &&
          nextContext.slotId !== currentContext.slotId)) {
      setDockEditorContext(nextContext);
      changed = { ...changed, dockEditorContext: true };
    }
  }

  if (plan.dockPanel) {
    renderDockPanel();
  }

  if (plan.overview) {
    Overview.renderDashboard();
  }

  if (plan.tune) {
    Tune.refreshTuneIfActive();
  }

  if (plan.compare) {
    try {
      ComparePage.renderComparisonSlots();
      ComparePage.updateComparisonRadar();
      ComparePage.renderComparisonDeltas();
    } catch (error) {
      reportRuntimeIssue('COMPARE_RENDER', `Compare refresh failed during "${reason}"`, {
        details: error,
      });
    }
  }

  if (plan.compendium) {
    try {
      void import('../ui/pages/compendium.js').then((mod) => {
        mod._compSyncWithActiveLoadout();
      });
      void import('../ui/pages/strings.js').then((mod) => {
        mod._stringSyncWithActiveLoadout();
      });
    } catch (error) {
      reportRuntimeIssue('COMPENDIUM_RENDER', `Compendium refresh failed during "${reason}"`, {
        details: error,
      });
    }
  }

  if (plan.dockContext || changed.dockEditorContext) {
    renderDockContextPanel();
  }
}
