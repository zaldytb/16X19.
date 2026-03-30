/**
 * `window.*` bridge for inline HTML handlers — assigned from src/bridge/installWindowBridge.ts.
 * Uses permissive function types to avoid churn; implementations are typed in their modules.
 */
export {};

/* Bridge entrypoints are invoked from inline HTML with untyped args — permissive `any` here only. */
/** Lazy bridge wrappers are async, but underlying exports may be sync — single permissive signature for merges. */
type BridgeFn = (...args: any[]) => any;

declare global {
  interface Window {
    /** Optional: assigned at runtime from installWindowBridge; keeps local `WindowExt` merges valid */
    getActiveLoadout?: BridgeFn;
    getSavedLoadouts?: BridgeFn;
    setActiveLoadout?: BridgeFn;
    setSavedLoadouts?: BridgeFn;
    saveLoadout?: BridgeFn;
    getCurrentSetup?: BridgeFn;
    getSetupFromLoadout?: BridgeFn;
    createLoadout?: BridgeFn;

    activeLoadout?: unknown;
    savedLoadouts?: unknown;

    _lbv2State?: { initialized: boolean };

    // Shell / theme / my-loadouts
    activateLoadout?: BridgeFn;
    saveActiveLoadout?: BridgeFn;
    shareActiveLoadout?: BridgeFn;
    shareLoadout?: BridgeFn;
    exportLoadouts?: BridgeFn;
    importLoadouts?: BridgeFn;
    removeLoadout?: BridgeFn;
    switchToLoadout?: BridgeFn;
    resetActiveLoadout?: BridgeFn;
    commitEditorToLoadout?: BridgeFn;
    addLoadoutToCompare?: BridgeFn;
    switchMode?: BridgeFn;
    openTuneForSlot?: BridgeFn;
    _onEditorChange?: BridgeFn;
    _handleHybridToggle?: BridgeFn;
    startCompareSlotEditing?: BridgeFn;
    applyDockEditorChanges?: BridgeFn;
    cancelCompareSlotEditing?: BridgeFn;
    addActiveLoadoutToCompare?: BridgeFn;
    init?: BridgeFn;
    _initLandingSearch?: BridgeFn;
    _handleSharedBuildURL?: BridgeFn;
    handleResponsiveHeader?: BridgeFn;
    toggleTheme?: BridgeFn;
    renderMyLoadouts?: BridgeFn;
    confirmRemoveLoadout?: BridgeFn;

    // Find My Build (lazy)
    openFindMyBuild?: BridgeFn;
    closeFindMyBuild?: BridgeFn;
    fmbBack?: BridgeFn;
    fmbNext?: BridgeFn;
    _fmbShowStep?: BridgeFn;
    _fmbUpdateNextState?: BridgeFn;
    _fmbGenerateProfile?: BridgeFn;
    _fmbShowResults?: BridgeFn;
    _fmbSearchDirection?: BridgeFn;
    _fmbRankFrames?: BridgeFn;
    _fmbRenderFrameCard?: BridgeFn;
    _fmbAction?: BridgeFn;

    // Overview
    renderDashboard?: BridgeFn;
    renderOverviewHero?: BridgeFn;
    getRatingDescriptor?: BridgeFn;
    renderOCFoundation?: BridgeFn;
    renderOCSnapshot?: BridgeFn;
    _statBarColor?: BridgeFn;
    renderStatBars?: BridgeFn;
    renderBuildDNAHighlights?: BridgeFn;
    radarTooltipHandler?: BridgeFn;
    renderRadarChart?: BridgeFn;
    renderFitProfile?: BridgeFn;
    renderWarnings?: BridgeFn;
    generateFitProfile?: BridgeFn;
    generateWarnings?: BridgeFn;

    // Optimize (lazy)
    initOptimize?: BridgeFn;
    runOptimizer?: BridgeFn;
    renderOptimizerResults?: BridgeFn;
    _optApplyTensionFilter?: BridgeFn;
    _optClearTensionFilter?: BridgeFn;
    _optBuildPresetData?: BridgeFn;
    optActionView?: BridgeFn;
    optActionTune?: BridgeFn;
    optActionCompare?: BridgeFn;
    optActionSave?: BridgeFn;
    _toggleOptMS?: BridgeFn;
    _updateOptMSLabel?: BridgeFn;
    _renderExcludeTags?: BridgeFn;

    // Tune
    toggleTuneMode?: BridgeFn;
    closeTuneMode?: BridgeFn;
    dockBuilderPanel?: BridgeFn;
    refreshTuneIfActive?: BridgeFn;
    initTuneMode?: BridgeFn;
    runTensionSweep?: BridgeFn;
    calculateOptimalWindow?: BridgeFn;
    renderOptimalBuildWindow?: BridgeFn;
    renderDeltaVsBaseline?: BridgeFn;
    renderGaugeExplorer?: BridgeFn;
    renderBaselineMarker?: BridgeFn;
    renderOptimalZone?: BridgeFn;
    renderSweepChart?: BridgeFn;
    renderBestValueMove?: BridgeFn;
    renderTuneHybridToggle?: BridgeFn;
    renderOriginalTensionMarker?: BridgeFn;
    renderOverallBuildScore?: BridgeFn;
    renderRecommendedBuilds?: BridgeFn;
    renderWhatToTryNext?: BridgeFn;
    renderExplorePrompt?: BridgeFn;
    _applyWttnBuild?: BridgeFn;
    _applyRecBuild?: BridgeFn;
    _applyGaugeSelection?: (gaugeMm: number, sectionIndex: number) => void;
    _saveWttnBuild?: BridgeFn;
    _saveRecBuild?: BridgeFn;
    onTuneSliderInput?: BridgeFn;
    tuneSandboxCommit?: BridgeFn;
    applyExploredTension?: BridgeFn;
    updateSliderLabel?: BridgeFn;
    updateDeltaTitle?: BridgeFn;
    getHybridBaselineTension?: BridgeFn;
    _tuneStringKey?: BridgeFn;
    _recomputeExploredState?: BridgeFn;
    _updateTuneApplyButton?: BridgeFn;
    tuneState?: unknown;
    sweepChart?: unknown;

    // Compare
    initComparePage?: BridgeFn;
    cleanupComparePage?: BridgeFn;
    compareGetState?: BridgeFn;
    compareSubscribe?: BridgeFn;
    compareSetSlotLoadout?: BridgeFn;
    compareAddLoadoutToNextAvailableSlot?: BridgeFn;
    compareAddLoadoutToPreferredSlot?: BridgeFn;
    compareAutoFillFromSaved?: BridgeFn;
    compareClearSlot?: BridgeFn;
    compareGetConfiguredSlots?: BridgeFn;
    compareAddSlot?: BridgeFn;
    compareEditSlot?: BridgeFn;
    compareRemoveSlot?: BridgeFn;
    compareTuneSlot?: BridgeFn;
    compareSetActiveSlot?: BridgeFn;
    compareSaveSlot?: BridgeFn;
    compareQuickAddSaved?: BridgeFn;
    _showCompareQuickAddPrompt?: BridgeFn;
    _compareQuickAdd?: BridgeFn;
    _compareLoadFromSaved?: BridgeFn;
    _refreshCompareSlot?: BridgeFn;
    compareEditorCancel?: BridgeFn;
    closeCompareEditors?: BridgeFn;
    compareEditorSave?: BridgeFn;
    compareEditorSetHybrid?: BridgeFn;
    compareEditorUpdateTension?: BridgeFn;
    compareEditorLoadFromSaved?: BridgeFn;
    toggleComparisonMode?: BridgeFn;
    addComparisonSlot?: BridgeFn;
    addComparisonSlotFromHome?: BridgeFn;
    removeComparisonSlot?: BridgeFn;
    renderComparisonSlots?: BridgeFn;
    recalcSlot?: BridgeFn;
    updateComparisonRadar?: BridgeFn;
    renderComparisonDeltas?: BridgeFn;
    renderCompareSummaries?: BridgeFn;
    renderCompareVerdict?: BridgeFn;
    renderCompareMatrix?: BridgeFn;
    _toggleCompareCardEditor?: BridgeFn;
    getSlotColors?: BridgeFn;

    // Compendium (lazy)
    initCompendium?: BridgeFn;
    _compSwitchTab?: BridgeFn;
    _compToggleHud?: BridgeFn;
    _compGetFilteredRacquets?: BridgeFn;
    _compRenderRoster?: BridgeFn;
    _compSelectFrame?: BridgeFn;
    _compSyncWithActiveLoadout?: BridgeFn;
    _compRenderMain?: BridgeFn;
    _compUpdateInjectModeUI?: BridgeFn;
    _compSetInjectMode?: BridgeFn;
    _compInitStringInjector?: BridgeFn;
    _compPopulateGaugeDropdown?: BridgeFn;
    _compPreviewStats?: BridgeFn;
    _compRenderPreviewBars?: BridgeFn;
    _compClearPreview?: BridgeFn;
    _compApplyInjection?: BridgeFn;
    _compClearInjection?: BridgeFn;
    _compGenerateTopBuilds?: BridgeFn;
    _compPickDiverseBuilds?: BridgeFn;
    _compRenderBuildCard?: BridgeFn;
    _compSetSort?: BridgeFn;
    _compCreateLoadoutFromBuild?: BridgeFn;
    _compAction?: BridgeFn;
    _compAddBuildToCompare?: BridgeFn;
    _compActionCompare?: BridgeFn;

    // Strings compendium (lazy)
    _stringEnsureInitialized?: BridgeFn;
    _stringToggleHud?: BridgeFn;
    _stringGetFilteredStrings?: BridgeFn;
    _stringSyncWithActiveLoadout?: BridgeFn;
    _stringRenderRoster?: BridgeFn;
    _stringGetArchetype?: BridgeFn;
    _stringSelectString?: BridgeFn;
    _stringGeneratePills?: BridgeFn;
    _stringRenderBatteryBars?: BridgeFn;
    _stringFindSimilarStrings?: BridgeFn;
    _stringFindBestFrames?: BridgeFn;
    _stringRenderMain?: BridgeFn;
    _stringInitModulator?: BridgeFn;
    _stringSetModMode?: BridgeFn;
    _stringOnCrossesStringChange?: BridgeFn;
    _stringOnCrossesGaugeChange?: BridgeFn;
    _stringOnFrameChange?: BridgeFn;
    _stringOnGaugeChange?: BridgeFn;
    _stringOnTensionChange?: BridgeFn;
    _stringUpdatePreview?: BridgeFn;
    _stringRenderPreviewBars?: BridgeFn;
    _stringClearPreview?: BridgeFn;
    _stringAddToLoadout?: BridgeFn;
    _stringSetActiveLoadout?: BridgeFn;

    // Dock
    toggleDockCollapse?: BridgeFn;
    _syncDockRail?: BridgeFn;
    _initDockCollapse?: BridgeFn;
    toggleMobileDock?: BridgeFn;
    _syncMobileDockBar?: BridgeFn;
    animateOBS?: BridgeFn;
    _dockContextActions?: BridgeFn;
    _dockGuidance?: BridgeFn;
    _dockIcons?: Record<string, string>;
    _dockReturnEditorHome?: BridgeFn;
    _dockRelocateEditorToContext?: BridgeFn;
    _dockClearNonEditor?: BridgeFn;
    renderDockPanel?: BridgeFn;
    renderDockState?: BridgeFn;
    hydrateDock?: BridgeFn;
    renderMobileLoadoutPills?: BridgeFn;
    renderDockContextPanel?: BridgeFn;
    _dockCompareEdit?: BridgeFn;
    _dockCompareRemove?: BridgeFn;
    _dockCompareQuickAdd?: BridgeFn;
    renderDockCreateSection?: BridgeFn;
    _renderCreateForm?: BridgeFn;
    _renderCreateFormTailwind?: BridgeFn;
    _cfToggleMode?: BridgeFn;
    _wireCreateForm?: BridgeFn;
    _cfBuildLoadout?: BridgeFn;
    _cfActivate?: BridgeFn;
    _cfSave?: BridgeFn;
    _cfHighlightMissingFields?: BridgeFn;
    _cfShowFieldError?: BridgeFn;
    _cfClearFieldErrors?: BridgeFn;
    _showNewLoadoutForm?: BridgeFn;
    _hideNewLoadoutForm?: BridgeFn;
    toggleQuickAdd?: BridgeFn;
    quickAddActivate?: BridgeFn;
    quickAddSave?: BridgeFn;

    // Shared renderers / presets / helpers
    renderOBSBadge?: BridgeFn;
    sharedRenderOverallBuildScore?: BridgeFn;
    renderStatBar?: BridgeFn;
    renderGroupedStatBars?: BridgeFn;
    renderIdentityPill?: BridgeFn;
    sharedGenerateFitProfile?: BridgeFn;
    sharedGenerateWarnings?: BridgeFn;
    assignStaggerIndices?: BridgeFn;
    animateCounter?: BridgeFn;
    computeDeltas?: BridgeFn;
    computeProfileSimilarity?: BridgeFn;
    topGains?: BridgeFn;
    topLosses?: BridgeFn;
    sharedRenderWhatToTryNext?: BridgeFn;
    generateRecommendedBuilds?: BridgeFn;
    sharedRenderExplorePrompt?: BridgeFn;
    getPresetDetail?: BridgeFn;
    getPresetName?: BridgeFn;
    createUserPreset?: BridgeFn;
    renderPresetItemHTML?: BridgeFn;
    renderPresetListHTML?: BridgeFn;
    extractPresetData?: BridgeFn;
    loadPresetIntoComparisonSlot?: BridgeFn;
    loadPresetsFromStorage?: BridgeFn;
    savePresetsToStorage?: BridgeFn;
    renderComparisonPresets?: BridgeFn;
    PresetManager?: unknown;
    $?: BridgeFn;
    $$?: BridgeFn;
    show?: BridgeFn;
    hide?: BridgeFn;
    toggleClass?: BridgeFn;
    showFrameSpecs?: BridgeFn;
    getFrameSpecs?: BridgeFn;
    populateRacquetDropdown?: BridgeFn;
    populateStringDropdown?: BridgeFn;
    populateGaugeDropdown?: BridgeFn;
    _initQaSearchable?: BridgeFn;
    getSetupFromEditorDOM?: BridgeFn;
    setHybridMode?: BridgeFn;
    scrollToElement?: BridgeFn;
    debounce?: BridgeFn;
    throttle?: BridgeFn;

    // Leaderboard (lazy)
    initLeaderboard?: BridgeFn;
    initLeaderboardApp?: BridgeFn;
    _lbv2SetStat?: BridgeFn;
    _lbv2SetFilter?: BridgeFn;
    _lbv2SetView?: BridgeFn;
    _lbv2SetFrameFilter?: BridgeFn;
    _lbv2ClearFrameFilters?: BridgeFn;
    _lbv2SetStringFilter?: BridgeFn;
    _lbv2ClearStringFilters?: BridgeFn;
    _lbv2View?: BridgeFn;
    _lbv2ViewFrame?: BridgeFn;
    _lbv2ViewString?: BridgeFn;
    _lbv2Compare?: BridgeFn;
  }
}
