// Tennis Loadout Lab - Vite Entry Point
// =====================================

// Import CSS for Vite to process
// Import state store for window bridge
import { getActiveLoadout, getSavedLoadouts, setActiveLoadout, setSavedLoadouts } from '../state/store.js';
import { saveLoadout as saveLoadoutState } from '../state/loadout.js';
import { getCurrentSetup, getSetupFromLoadout } from '../state/setup-sync.js';

// Import page modules
import * as MyLoadouts from '../ui/pages/my-loadouts.js';
import * as Overview from '../ui/pages/overview.js';
import * as Tune from '../ui/pages/tune.js';
import * as ComparePage from '../ui/pages/compare/index.js';
import * as Shell from '../ui/pages/shell.js';
import * as Theme from '../ui/theme.js';

// Import dock components
import * as DockCollapse from '../ui/components/dock-collapse.js';
import * as MobileDock from '../ui/components/mobile-dock.js';
import * as ObsAnimation from '../ui/components/obs-animation.js';
import * as DockPanel from '../ui/components/dock-panel.js';
import * as DockRenderers from '../ui/components/dock-renderers.js';
import * as DockCreate from '../ui/components/dock-create.js';
import * as SearchableSelect from '../ui/components/searchable-select.js';

// Import shared utilities
import * as SharedRenderers from '../ui/shared/renderers.js';
import * as SharedPresets from '../ui/shared/presets.js';
import * as SharedHelpers from '../ui/shared/helpers.js';
import { createLoadout, saveLoadout } from '../state/loadout.js';


const pageLoaders = {
  leaderboard: () => import('../ui/pages/leaderboard.js'),
  findMyBuild: () => import('../ui/pages/find-my-build.js'),
  optimize: () => import('../ui/pages/optimize.js'),
  compendium: () => import('../ui/pages/compendium.js'),
  strings: () => import('../ui/pages/strings.js'),
};

type LeaderboardModule = typeof import('../ui/pages/leaderboard.js');
let leaderboardModulePromise: Promise<LeaderboardModule> | null = null;

async function ensureLeaderboardModule() {
  if (!leaderboardModulePromise) {
    leaderboardModulePromise = pageLoaders.leaderboard().then((mod) => {
      if (mod._lbv2State) {
        window._lbv2State = mod._lbv2State;
      }
      return mod;
    });
  }
  return leaderboardModulePromise;
}

function bindLazyFunction(
  windowKey: string,
  loader: () => Promise<Record<string, unknown>>,
  exportKey: string = windowKey,
): void {
  const w = window as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
  w[windowKey] = async (...args: unknown[]) => {
    const mod = await loader();
    const fn = mod[exportKey];
    if (typeof fn !== 'function') return undefined;
    return (fn as (...fnArgs: unknown[]) => unknown)(...args);
  };
}

let bootSequenceIntervalId: ReturnType<typeof setInterval> | null = null;
let bootPendingTimeouts: number[] = [];

function clearBootPendingTimeouts(): void {
  for (const id of bootPendingTimeouts) {
    window.clearTimeout(id);
  }
  bootPendingTimeouts = [];
}

/** Stop boot animation timers (e.g. React Strict Mode remount before finish). */
export function clearDigicraftBootSequence(): void {
  if (bootSequenceIntervalId !== null) {
    window.clearInterval(bootSequenceIntervalId);
    bootSequenceIntervalId = null;
  }
  clearBootPendingTimeouts();
}

export function runDigicraftBootSequence(): void {
  clearDigicraftBootSequence();

  const loader = document.getElementById('dc-boot-loader');
  const batteryTrack = document.getElementById('dc-boot-battery');
  const pctText = document.getElementById('dc-boot-pct');
  const logsContainer = document.getElementById('dc-boot-logs');

  if (!loader || !batteryTrack || !logsContainer) {
    // Avoid leaving a full-screen overlay up if markup/timing failed.
    if (loader) loader.remove();
    return;
  }
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const hasBootedThisSession = (() => {
    try {
      return window.sessionStorage.getItem('tll-boot-seen') === '1';
    } catch (_err) {
      return false;
    }
  })();

  if (reduceMotion || hasBootedThisSession) {
    loader.remove();
    return;
  }

  try {
    window.sessionStorage.setItem('tll-boot-seen', '1');
  } catch (_err) {
    // Ignore storage failures.
  }

  batteryTrack.innerHTML = '';
  logsContainer.innerHTML = '';

  const totalSegments = 10;
  const segments: HTMLDivElement[] = [];
  for (let i = 0; i < totalSegments; i += 1) {
    const segment = document.createElement('div');
    segment.className = 'flex-1 bg-black/10 dark:bg-white/5 transition-colors duration-75';
    batteryTrack.appendChild(segment);
    segments.push(segment);
  }

  const logs = [
    '> Loading 16x19.core.js...',
    '> Fetching global frame database...',
    '> Booting String Modulator V2...',
    '> Calibrating compare runtime...',
  ];

  let currentLog = 0;
  let progress = 0;

  const pushLog = () => {
    if (currentLog >= logs.length) return;
    const logLine = document.createElement('span');
    logLine.className = 'text-dc-storm';
    logLine.innerText = logs[currentLog];
    logsContainer.appendChild(logLine);
    currentLog += 1;
  };

  pushLog();

  const bootInterval = window.setInterval(() => {
    progress = Math.min(100, progress + 8);
    if (pctText) pctText.innerText = `${progress}%`;

    const filled = Math.round((progress / 100) * totalSegments);
    segments.forEach((segment, index) => {
      segment.className = index < filled
        ? 'flex-1 bg-dc-accent transition-colors duration-75'
        : 'flex-1 bg-black/10 dark:bg-white/5 transition-colors duration-75';
    });

    if (progress > 25 && currentLog === 1) pushLog();
    if (progress > 50 && currentLog === 2) pushLog();
    if (progress > 75 && currentLog === 3) pushLog();

    if (progress === 100) {
      window.clearInterval(bootInterval);
      bootSequenceIntervalId = null;
      const t1 = window.setTimeout(() => {
        loader.classList.add('opacity-0');
        const t2 = window.setTimeout(() => loader.remove(), 700);
        bootPendingTimeouts.push(t2);
      }, 120);
      bootPendingTimeouts.push(t1);
    }
  }, 32);
  bootSequenceIntervalId = bootInterval;
}

// Minimal window bridge for remaining inline HTML handlers
// Phase 5: Bridge has been significantly reduced - only essential inline handlers remain
export function installWindowBridge(): void {
  // Core state accessors (used by inline handlers referencing window.activeLoadout / window.savedLoadouts)
  Object.defineProperty(window, 'activeLoadout', {
    get: () => getActiveLoadout(),
    set: (v) => setActiveLoadout(v),
    configurable: true,
  });
  Object.defineProperty(window, 'savedLoadouts', {
    get: () => getSavedLoadouts(),
    set: (v) => setSavedLoadouts(v),
    configurable: true,
  });

  // Essential shell functions for inline handlers
  window.switchMode = Shell.switchMode;
  window.switchToLoadout = Shell.switchToLoadout;
  window.activateLoadout = Shell.activateLoadout;
  window.createLoadout = createLoadout;
  window.saveLoadout = saveLoadout;
  window.saveActiveLoadout = Shell.saveActiveLoadout;
  window.shareActiveLoadout = Shell.shareActiveLoadout;
  window.shareLoadout = Shell.shareLoadout;
  window.exportLoadouts = Shell.exportLoadouts;
  window.importLoadouts = Shell.importLoadouts;
  window.removeLoadout = Shell.removeLoadout;
  window.resetActiveLoadout = Shell.resetActiveLoadout;
  window.addLoadoutToCompare = Shell.addLoadoutToCompare;
  window.addActiveLoadoutToCompare = Shell.addActiveLoadoutToCompare;
  window.startCompareSlotEditing = Shell.startCompareSlotEditing;
  window.applyDockEditorChanges = Shell.applyDockEditorChanges;
  window.cancelCompareSlotEditing = Shell.cancelCompareSlotEditing;
  window._handleHybridToggle = Shell._handleHybridToggle;
  window._onEditorChange = Shell._onEditorChange;

  // Theme
  window.toggleTheme = Theme.toggleAppTheme;

  // My Loadouts
  window.renderMyLoadouts = MyLoadouts.renderMyLoadouts;
  window.confirmRemoveLoadout = MyLoadouts.confirmRemoveLoadout;

  // Overview render functions (used by shell)
  window.getCurrentSetup = getCurrentSetup;
  window.renderDashboard = Overview.renderDashboard;

  // Tune functions for inline handlers
  window.renderTune = Tune.refreshTuneIfActive;
  window.initTuneMode = Tune.initTuneMode;
  window.onTuneSliderInput = Tune.onTuneSliderInput;
  window.tuneSandboxCommit = Tune.tuneSandboxCommit;
  window._applyWttnBuild = Tune._applyWttnBuild;
  window._applyRecBuild = Tune._applyRecBuild;
  window._applyGaugeSelection = Tune._applyGaugeSelection;
  window._saveWttnBuild = Tune._saveWttnBuild;
  window._saveRecBuild = Tune._saveRecBuild;
  window.refreshTuneIfActive = Tune.refreshTuneIfActive;

  // Compare functions for inline handlers
  window.compareGetState = ComparePage.getState;
  window.initComparePage = ComparePage.initComparePage;
  window.renderCompareSummaries = ComparePage.renderCompareSummaries;
  window.renderCompareVerdict = ComparePage.renderCompareVerdict;
  window.renderCompareMatrix = ComparePage.renderCompareMatrix;
  window.compareAddSlot = Shell.startCompareSlotEditing;
  window.compareEditSlot = Shell.startCompareSlotEditing;
  window.compareRemoveSlot = ComparePage.removeSlot;
  window.compareClearSlot = ComparePage.clearSlot;
  window.compareSetSlotLoadout = ComparePage.setSlotLoadout;
  window._compareLoadFromSaved = ComparePage.compareLoadFromSaved;
  window._refreshCompareSlot = ComparePage.refreshCompareSlot;
  window._compareQuickAdd = ComparePage.quickAddFromPrompt;
  window._showCompareQuickAddPrompt = ComparePage.showQuickAddPrompt;

  // Dock components
  window.toggleDockCollapse = DockCollapse.toggleDockCollapse;
  window.toggleMobileDock = MobileDock.toggleMobileDock;

  // Dock renderers
  window.renderDockPanel = DockRenderers.renderDockPanel;
  window.hydrateDock = DockRenderers.hydrateDock;
  window.renderDockContextPanel = DockRenderers.renderDockContextPanel;
  window._dockCompareEdit = DockRenderers._dockCompareEdit;
  window._dockCompareRemove = DockRenderers._dockCompareRemove;

  // Dock create
  window._showNewLoadoutForm = DockCreate._showNewLoadoutForm;
  window._hideNewLoadoutForm = DockCreate._hideNewLoadoutForm;
  window._cfToggleMode = DockCreate._cfToggleMode;
  window._cfActivate = DockCreate._cfActivate;
  window._cfSave = DockCreate._cfSave;

  // Lazy-loaded modules
  [
    'initOptimize',
    '_toggleOptMS',
    'optActionView',
    'optActionTune',
    'optActionCompare',
    'optActionSave',
  ].forEach((key) => bindLazyFunction(key, pageLoaders.optimize));

  [
    'initCompendium',
    '_compSwitchTab',
    '_compToggleHud',
    '_compSelectFrame',
    '_compSetSort',
    '_compAction',
    '_compActionCompare',
    '_compSetInjectMode',
    '_compApplyInjection',
    '_compClearInjection',
  ].forEach((key) => bindLazyFunction(key, pageLoaders.compendium));
  window._compSyncWithActiveLoadout = () =>
    pageLoaders.compendium().then((mod) => {
      if (typeof mod._compSyncWithActiveLoadout === 'function') {
        return mod._compSyncWithActiveLoadout();
      }
      return undefined;
    });

  [
    '_stringToggleHud',
    '_stringSelectString',
    '_stringSetModMode',
    '_stringAddToLoadout',
    '_stringSetActiveLoadout',
    '_stringClearPreview',
  ].forEach((key) => bindLazyFunction(key, pageLoaders.strings));
  window._stringEnsureInitialized = () =>
    pageLoaders.strings().then((mod) => {
      if (typeof mod._stringEnsureInitialized === 'function') {
        return mod._stringEnsureInitialized();
      }
      return undefined;
    });
  window._stringSyncWithActiveLoadout = () =>
    pageLoaders.strings().then((mod) => {
      if (typeof mod._stringSyncWithActiveLoadout === 'function') {
        return mod._stringSyncWithActiveLoadout();
      }
      return undefined;
    });

  [
    'openFindMyBuild',
    'closeFindMyBuild',
    'fmbBack',
    'fmbNext',
    '_fmbSearchDirection',
  ].forEach((key) => bindLazyFunction(key, pageLoaders.findMyBuild));

  // Leaderboard
  [
    'initLeaderboard',
    '_lbv2SetStat',
    '_lbv2SetFilter',
    '_lbv2SetView',
    '_lbv2View',
    '_lbv2Compare',
  ].forEach((key) => bindLazyFunction(key, ensureLeaderboardModule, key));
  window._lbv2State = window._lbv2State || { initialized: false };

  // Shared helpers (minimal)
  window.$ = SharedHelpers.$;
  window.show = SharedHelpers.show;
  window.hide = SharedHelpers.hide;

  // Debug
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log('[Main] Minimal window bridge ready');
  }
}

/**
 * Non-React shell init: Shell.init(), dock listeners.
 * Boot animation runs from App ShellLayout useLayoutEffect (after React commits markup).
 */
export function runVanillaAppInit(): void {
  try {
    Shell.init();
    Theme.handleResponsiveHeader();
    DockCollapse._initDockCollapse();

    const dock = document.getElementById('build-dock');
    if (dock && dock.dataset.scrollBound !== 'true') {
      dock.dataset.scrollBound = 'true';
      dock.addEventListener('scroll', function handleDockScroll() {
        dock.classList.toggle('dock-scrolled', dock.scrollTop > 0);
      }, { passive: true });
    }

    const dockBackdrop = document.getElementById('dock-backdrop');
    if (dockBackdrop && dockBackdrop.dataset.clickBound !== 'true') {
      dockBackdrop.dataset.clickBound = 'true';
      dockBackdrop.addEventListener('click', function handleDockBackdropClick() {
        const d = document.getElementById('build-dock');
        if (d && d.classList.contains('dock-expanded')) {
          MobileDock.toggleMobileDock();
        }
      });
    }
  } catch (e) {
    console.error('[Main] Error during initialization:', e);
  }
}
