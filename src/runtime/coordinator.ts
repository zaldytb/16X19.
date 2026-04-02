import {
  getComparisonSlots,
  getCurrentMode,
  getDockEditorContext,
  setDockEditorContext,
} from '../state/imperative.js';
import { useAppStore } from '../state/useAppStore.js';
import { renderDockContextPanel, renderDockPanel } from '../ui/components/dock-renderers.js';
import { reconcileDockEditorContext } from './contracts.js';

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
    overview: false,
    tune: mode === 'tune' && !!(changed.activeLoadout || changed.mode),
    compare: false,
    compendium: false,
  };
}

export function syncViews(reason: string, changed: ViewChangeSet): void {
  const generation = ++_syncViewsGeneration;
  const mode = getCurrentMode();
  const plan = getRefreshPlan(mode, changed);

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

  if (plan.tune) {
    pageWork.push(
      import('../ui/pages/tune.js').then((mod) => {
        if (generation !== _syncViewsGeneration) return;
        mod.refreshTuneIfMounted();
      }),
    );
  }

  const runAfterPageWork = (): void => {
    if (generation !== _syncViewsGeneration) return;
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
