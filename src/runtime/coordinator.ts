import {
  getActiveLoadout,
  getComparisonSlots,
  getCurrentMode,
  getDockEditorContext,
  setDockEditorContext,
} from '../state/imperative.js';
import { useAppStore } from '../state/useAppStore.js';
import { renderCompareRefreshViaBridge } from '../ui/pages/compare-runtime-bridge.js';
import { renderOverviewDashboardViaBridge } from '../ui/pages/overview-runtime-bridge.js';
import { refreshTuneIfActiveViaBridge } from '../ui/pages/tune-runtime-bridge.js';
import { hydrateDock, renderDockContextPanel, renderDockPanel } from '../ui/components/dock-renderers.js';
import { reconcileDockEditorContext } from './contracts.js';
import { reportRuntimeIssue } from './diagnostics.js';

/** Only the latest `syncViews()` invocation may apply deferred async work (dynamic imports + dock context). */
let _syncViewsGeneration = 0;

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
  const generation = ++_syncViewsGeneration;
  const mode = getCurrentMode();
  const plan = getRefreshPlan(mode, changed);

  if (changed.activeLoadout) {
    hydrateDock(getActiveLoadout());
  }

  if (changed.compareState || changed.dockEditorContext) {
    const currentContext = getDockEditorContext();
    const nextContext = reconcileDockEditorContext(
      currentContext,
      getComparisonSlots(),
    );
    if (
      nextContext.kind !== currentContext.kind ||
      (nextContext.kind === 'compare-slot' &&
        currentContext.kind === 'compare-slot' &&
        nextContext.slotId !== currentContext.slotId)
    ) {
      setDockEditorContext(nextContext);
      changed = { ...changed, dockEditorContext: true };
    }
  }

  if (plan.dockPanel) {
    renderDockPanel();
  }

  const pageWork: Promise<unknown>[] = [];

  if (plan.overview) {
    renderOverviewDashboardViaBridge();
  }

  if (plan.tune) {
    refreshTuneIfActiveViaBridge();
  }

  if (plan.compare) {
    try {
      renderCompareRefreshViaBridge();
    } catch (error) {
      reportRuntimeIssue('COMPARE_RENDER', `Compare refresh failed during "${reason}"`, {
        details: error,
      });
    }
  }

  const runAfterPageWork = (): void => {
    if (generation !== _syncViewsGeneration) return;
    if (plan.compendium) {
      try {
        void import('../ui/pages/compendium.js').then((mod) => {
          if (generation !== _syncViewsGeneration) return;
          mod._compSyncWithActiveLoadout();
        });
        void import('../ui/pages/strings.js').then((mod) => {
          if (generation !== _syncViewsGeneration) return;
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
  };

  if (pageWork.length > 0) {
    void Promise.all(pageWork).then(runAfterPageWork);
  } else {
    runAfterPageWork();
  }
}

useAppStore.subscribe((state) => state.comparisonSlots, () => {
  syncViews('compare-state-change', { compareState: true });
});
