/**
 * Minimal `window.*` bridge for remaining inline HTML handlers.
 * Phase 5: Bridge significantly reduced - most functions now imported directly.
 */
export {};

type BridgeFn = (...args: any[]) => any;

declare global {
  interface Window {
    // State accessors (used by inline handlers referencing window.activeLoadout / window.savedLoadouts)
    activeLoadout?: unknown;
    savedLoadouts?: unknown;

    _lbv2State?: { initialized: boolean };

    // Shell / theme / my-loadouts (essential inline handlers)
    activateLoadout?: BridgeFn;
    saveActiveLoadout?: BridgeFn;
    shareActiveLoadout?: BridgeFn;
    shareLoadout?: BridgeFn;
    createLoadout?: BridgeFn;
    saveLoadout?: BridgeFn;
    exportLoadouts?: BridgeFn;
    importLoadouts?: BridgeFn;
    removeLoadout?: BridgeFn;
    switchToLoadout?: BridgeFn;
    resetActiveLoadout?: BridgeFn;
    addLoadoutToCompare?: BridgeFn;
    addActiveLoadoutToCompare?: BridgeFn;
    startCompareSlotEditing?: BridgeFn;
    applyDockEditorChanges?: BridgeFn;
    cancelCompareSlotEditing?: BridgeFn;
    _handleHybridToggle?: BridgeFn;
    _onEditorChange?: BridgeFn;
    switchMode?: BridgeFn;
    toggleTheme?: BridgeFn;
    renderMyLoadouts?: BridgeFn;
    confirmRemoveLoadout?: BridgeFn;

    // Overview (render entry point)
    getCurrentSetup?: BridgeFn;
    renderDashboard?: BridgeFn;
    openFindMyBuild?: BridgeFn;
    closeFindMyBuild?: BridgeFn;
    fmbBack?: BridgeFn;
    fmbNext?: BridgeFn;
    _fmbSearchDirection?: BridgeFn;

    // Optimize (lazy - essential inline handlers)
    initOptimize?: BridgeFn;
    _toggleOptMS?: BridgeFn;
    optActionView?: BridgeFn;
    optActionTune?: BridgeFn;
    optActionCompare?: BridgeFn;
    optActionSave?: BridgeFn;

    // Tune (essential inline handlers)
    refreshTuneIfActive?: BridgeFn;
    renderTune?: BridgeFn;
    initTuneMode?: BridgeFn;
    tuneSandboxCommit?: BridgeFn;
    _applyWttnBuild?: BridgeFn;
    _applyRecBuild?: BridgeFn;
    _applyGaugeSelection?: (gaugeMm: number, sectionIndex: number) => void;
    _saveWttnBuild?: BridgeFn;
    _saveRecBuild?: BridgeFn;
    onTuneSliderInput?: BridgeFn;

    // Compare (essential inline handlers)
    initComparePage?: BridgeFn;
    compareGetState?: BridgeFn;
    renderCompareSummaries?: BridgeFn;
    renderCompareVerdict?: BridgeFn;
    renderCompareMatrix?: BridgeFn;
    compareAddSlot?: BridgeFn;
    compareEditSlot?: BridgeFn;
    compareRemoveSlot?: BridgeFn;
    compareClearSlot?: BridgeFn;
    compareSetSlotLoadout?: BridgeFn;
    _compareLoadFromSaved?: BridgeFn;
    _refreshCompareSlot?: BridgeFn;
    _compareQuickAdd?: BridgeFn;
    _showCompareQuickAddPrompt?: BridgeFn;

    // Compendium (lazy - essential inline handlers)
    initCompendium?: BridgeFn;
    _compSwitchTab?: BridgeFn;
    _compToggleHud?: BridgeFn;
    _compSelectFrame?: BridgeFn;
    _compSyncWithActiveLoadout?: BridgeFn;
    _compSetSort?: BridgeFn;
    _compAction?: BridgeFn;
    _compActionCompare?: BridgeFn;
    _compSetInjectMode?: BridgeFn;
    _compApplyInjection?: BridgeFn;
    _compClearInjection?: BridgeFn;

    // Strings (lazy - essential inline handlers)
    _stringToggleHud?: BridgeFn;
    _stringEnsureInitialized?: BridgeFn;
    _stringSyncWithActiveLoadout?: BridgeFn;
    _stringSelectString?: BridgeFn;
    _stringSetModMode?: BridgeFn;
    _stringAddToLoadout?: BridgeFn;
    _stringSetActiveLoadout?: BridgeFn;
    _stringClearPreview?: BridgeFn;

    // Leaderboard (lazy)
    initLeaderboard?: BridgeFn;
    _lbv2SetStat?: BridgeFn;
    _lbv2SetFilter?: BridgeFn;
    _lbv2SetView?: BridgeFn;
    _lbv2View?: BridgeFn;
    _lbv2Compare?: BridgeFn;

    // Dock (essential inline handlers)
    toggleDockCollapse?: BridgeFn;
    toggleMobileDock?: BridgeFn;
    renderDockPanel?: BridgeFn;
    hydrateDock?: BridgeFn;
    renderDockContextPanel?: BridgeFn;
    _dockCompareEdit?: BridgeFn;
    _dockCompareRemove?: BridgeFn;
    _showNewLoadoutForm?: BridgeFn;
    _hideNewLoadoutForm?: BridgeFn;
    _cfToggleMode?: BridgeFn;
    _cfActivate?: BridgeFn;
    _cfSave?: BridgeFn;

    // Shared helpers (minimal)
    $?: (sel: string) => HTMLElement | null;
    show?: (el: HTMLElement | null) => void;
    hide?: (el: HTMLElement | null) => void;
  }
}
