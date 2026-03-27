// Tennis Loadout Lab - Vite Entry Point
// =====================================

// Import CSS for Vite to process
import '../style.css';

// Import all app functionality
import * as App from '../app.js';

// Import state store for window bridge
import { getActiveLoadout, getSavedLoadouts, setActiveLoadout, setSavedLoadouts } from './state/store.js';

// Import page modules
import * as Leaderboard from './ui/pages/leaderboard.js';
import * as MyLoadouts from './ui/pages/my-loadouts.js';
import * as FindMyBuild from './ui/pages/find-my-build.js';
import * as Overview from './ui/pages/overview.js';
import * as Optimize from './ui/pages/optimize.js';
import * as Tune from './ui/pages/tune.js';

// Import dock components
import * as DockCollapse from './ui/components/dock-collapse.js';
import * as MobileDock from './ui/components/mobile-dock.js';
import * as ObsAnimation from './ui/components/obs-animation.js';
import * as DockPanel from './ui/components/dock-panel.js';
import * as DockRenderers from './ui/components/dock-renderers.js';
import * as DockCreate from './ui/components/dock-create.js';

// Bridge: expose all exports to window for inline HTML handlers
// This maintains backward compatibility with onclick="funcName()" patterns
Object.entries(App).forEach(([key, val]) => {
  if (typeof val === 'function' || typeof val === 'object') {
    window[key] = val;
  }
});

// Bridge: expose state store functions to window
window.getActiveLoadout = getActiveLoadout;
window.getSavedLoadouts = getSavedLoadouts;
window.setActiveLoadout = setActiveLoadout;
window.setSavedLoadouts = setSavedLoadouts;

// Bridge: expose My Loadouts functions to window
window.renderMyLoadouts = MyLoadouts.renderMyLoadouts;
window.confirmRemoveLoadout = MyLoadouts.confirmRemoveLoadout;

// Bridge: expose Find My Build functions to window
window.openFindMyBuild = FindMyBuild.openFindMyBuild;
window.closeFindMyBuild = FindMyBuild.closeFindMyBuild;
window.fmbBack = FindMyBuild.fmbBack;
window.fmbNext = FindMyBuild.fmbNext;
window._fmbShowStep = FindMyBuild._fmbShowStep;
window._fmbUpdateNextState = FindMyBuild._fmbUpdateNextState;
window._fmbGenerateProfile = FindMyBuild._fmbGenerateProfile;
window._fmbShowResults = FindMyBuild._fmbShowResults;
window._fmbSearchDirection = FindMyBuild._fmbSearchDirection;
window._fmbRankFrames = FindMyBuild._fmbRankFrames;
window._fmbRenderFrameCard = FindMyBuild._fmbRenderFrameCard;
window._fmbAction = FindMyBuild._fmbAction;

// Bridge: expose Overview functions to window
window.renderDashboard = Overview.renderDashboard;
window.renderOverviewHero = Overview.renderOverviewHero;
window.getRatingDescriptor = Overview.getRatingDescriptor;
window.renderOCFoundation = Overview.renderOCFoundation;
window.renderOCSnapshot = Overview.renderOCSnapshot;
window._statBarColor = Overview._statBarColor;
window.renderStatBars = Overview.renderStatBars;
window.renderBuildDNAHighlights = Overview.renderBuildDNAHighlights;
window.radarTooltipHandler = Overview.radarTooltipHandler;
window.renderRadarChart = Overview.renderRadarChart;
window.renderFitProfile = Overview.renderFitProfile;
window.renderWarnings = Overview.renderWarnings;
window.generateFitProfile = Overview.generateFitProfile;
window.generateWarnings = Overview.generateWarnings;

// Bridge: expose Optimize functions to window
window.initOptimize = Optimize.initOptimize;
window.runOptimizer = Optimize.runOptimizer;
window.renderOptimizerResults = Optimize.renderOptimizerResults;
window._optApplyTensionFilter = Optimize._optApplyTensionFilter;
window._optClearTensionFilter = Optimize._optClearTensionFilter;
window._optBuildPresetData = Optimize._optBuildPresetData;
window.optActionView = Optimize.optActionView;
window.optActionTune = Optimize.optActionTune;
window.optActionCompare = Optimize.optActionCompare;
window.optActionSave = Optimize.optActionSave;
window._toggleOptMS = Optimize._toggleOptMS;
window._updateOptMSLabel = Optimize._updateOptMSLabel;
window._renderExcludeTags = Optimize._renderExcludeTags;

// Bridge: expose Tune functions to window
window.toggleTuneMode = Tune.toggleTuneMode;
window.closeTuneMode = Tune.closeTuneMode;
window.dockBuilderPanel = Tune.dockBuilderPanel;
window.refreshTuneIfActive = Tune.refreshTuneIfActive;
window.initTuneMode = Tune.initTuneMode;
window.runTensionSweep = Tune.runTensionSweep;
window.calculateOptimalWindow = Tune.calculateOptimalWindow;
window.renderOptimalBuildWindow = Tune.renderOptimalBuildWindow;
window.renderDeltaVsBaseline = Tune.renderDeltaVsBaseline;
window.renderGaugeExplorer = Tune.renderGaugeExplorer;
window.renderBaselineMarker = Tune.renderBaselineMarker;
window.renderOptimalZone = Tune.renderOptimalZone;
window.renderSweepChart = Tune.renderSweepChart;
window.renderBestValueMove = Tune.renderBestValueMove;
window.renderTuneHybridToggle = Tune.renderTuneHybridToggle;
window.renderOriginalTensionMarker = Tune.renderOriginalTensionMarker;
window.onTuneSliderInput = Tune.onTuneSliderInput;
// tuneSandboxCommit intentionally uses app.js version (slider/state bound to app.js flow)
window.applyExploredTension = Tune.applyExploredTension;
window.updateSliderLabel = Tune.updateSliderLabel;
window.updateDeltaTitle = Tune.updateDeltaTitle;
window.getHybridBaselineTension = Tune.getHybridBaselineTension;
window._tuneStringKey = Tune._tuneStringKey;
window._recomputeExploredState = Tune._recomputeExploredState;
window._updateTuneApplyButton = Tune._updateTuneApplyButton;

// Bridge: expose Tune state
window.tuneState = Tune.tuneState;
window.sweepChart = Tune.sweepChart;

// Bridge: expose dock component functions to window
window.toggleDockCollapse = DockCollapse.toggleDockCollapse;
window._syncDockRail = DockCollapse._syncDockRail;
window._initDockCollapse = DockCollapse._initDockCollapse;
window.toggleMobileDock = MobileDock.toggleMobileDock;
window._syncMobileDockBar = MobileDock._syncMobileDockBar;
window.animateOBS = ObsAnimation.animateOBS;

// Bridge: expose dock panel functions to window
window._dockContextActions = DockPanel._dockContextActions;
window._dockGuidance = DockPanel._dockGuidance;
window._dockIcons = DockPanel._dockIcons;
window._dockReturnEditorHome = DockPanel._dockReturnEditorHome;
window._dockRelocateEditorToContext = DockPanel._dockRelocateEditorToContext;
window._dockClearNonEditor = DockPanel._dockClearNonEditor;

// Bridge: expose dock renderer functions to window
window.renderDockPanel = DockRenderers.renderDockPanel;
window.renderDockState = DockRenderers.renderDockState;
window.renderMobileLoadoutPills = DockRenderers.renderMobileLoadoutPills;
window.renderDockContextPanel = DockRenderers.renderDockContextPanel;
window._dockCompareEdit = DockRenderers._dockCompareEdit;
window._dockCompareRemove = DockRenderers._dockCompareRemove;
window._dockCompareQuickAdd = DockRenderers._dockCompareQuickAdd;

// Bridge: expose dock create functions to window
window.renderDockCreateSection = DockCreate.renderDockCreateSection;
window._renderCreateForm = DockCreate._renderCreateForm;
window._renderCreateFormTailwind = DockCreate._renderCreateFormTailwind;
window._cfToggleMode = DockCreate._cfToggleMode;
window._wireCreateForm = DockCreate._wireCreateForm;
window._cfBuildLoadout = DockCreate._cfBuildLoadout;
window._cfActivate = DockCreate._cfActivate;
window._cfSave = DockCreate._cfSave;
window._cfHighlightMissingFields = DockCreate._cfHighlightMissingFields;
window._cfShowFieldError = DockCreate._cfShowFieldError;
window._cfClearFieldErrors = DockCreate._cfClearFieldErrors;
window._showNewLoadoutForm = DockCreate._showNewLoadoutForm;
window._hideNewLoadoutForm = DockCreate._hideNewLoadoutForm;
window.toggleQuickAdd = DockCreate.toggleQuickAdd;
window.quickAddActivate = DockCreate.quickAddActivate;
window.quickAddSave = DockCreate.quickAddSave;

// Backward-compatible shims for inline HTML handlers that reference activeLoadout/savedLoadouts directly
Object.defineProperty(window, 'activeLoadout', {
  get: () => getActiveLoadout(),
  set: (v) => setActiveLoadout(v),
  configurable: true
});
Object.defineProperty(window, 'savedLoadouts', {
  get: () => getSavedLoadouts(),
  set: (v) => setSavedLoadouts(v),
  configurable: true
});

// Bridge leaderboard exports to window (needed for inline HTML handlers)
Object.entries(Leaderboard).forEach(([key, val]) => {
  if (typeof val === 'function' || key === '_lbv2State') {
    window[key] = val;
  }
});

// Initialize leaderboard with app dependencies
if (Leaderboard.initLeaderboardApp) {
  Leaderboard.initLeaderboardApp(App);
}

// Debug: confirm bridge worked (only in development)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  console.log('[Main] App exports bridged:', Object.keys(App).filter(k => typeof App[k] === 'function').length, 'functions');
}

// Initialize the app immediately (module scripts run after DOMContentLoaded)
// The DOMContentLoaded listener in app.js won't fire for module scripts
try {
  if (document.readyState === 'loading') {
    // DOM not ready yet, wait for event
    document.addEventListener('DOMContentLoaded', () => {
      // DOM ready, init app
      App.init();
      App.handleResponsiveHeader();
      App._initDockCollapse();
    });
  } else {
    // DOM already loaded, init immediately
    // DOM already loaded, init immediately
    App.init();
    App.handleResponsiveHeader();
    App._initDockCollapse();
  }
  
  // Also run the dock scroll shadow and backdrop handlers from app.js
  const dock = document.getElementById('build-dock');
  if (dock) {
    dock.addEventListener('scroll', function() {
      dock.classList.toggle('dock-scrolled', dock.scrollTop > 0);
    }, { passive: true });
  }
  
  const dockBackdrop = document.getElementById('dock-backdrop');
  if (dockBackdrop) {
    dockBackdrop.addEventListener('click', function() {
      const d = document.getElementById('build-dock');
      if (d && d.classList.contains('dock-expanded')) {
        App.toggleMobileDock();
      }
    });
  }
} catch (e) {
  console.error('[Main] Error during initialization:', e);
}
