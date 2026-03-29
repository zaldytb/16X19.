// TENNIS LOADOUT LAB — Engine + UI
// ============================================
// EXTRACTION STATUS (Phase 2) - COMPLETE:
//   EXTRACTED: data imports → src/data/loader.js
//   EXTRACTED: engine constants → src/engine/constants.js
//   EXTRACTED: frame physics → src/engine/frame-physics.js
//   EXTRACTED: string profile → src/engine/string-profile.js
//   EXTRACTED: tension → src/engine/tension.js
//   EXTRACTED: hybrid → src/engine/hybrid.js
//   EXTRACTED: composite → src/engine/composite.js
//   EXTRACTED: engine index → src/engine/index.js
//   EXTRACTED: theme → src/ui/theme.js
//   EXTRACTED: leaderboard → src/ui/pages/leaderboard.js (MOVED + DEDUPLICATED)
//   CREATED: state modules → src/state/loadout.js, setup-sync.js
//   CREATED: utils → src/utils/helpers.js
//   CREATED: nav → src/ui/nav.js
//   REDUCED: app.js from ~12,548 to ~11,292 lines (-1,256 lines)
//   REDUCED: bundle size from ~104 KB to ~97 KB gzipped
// ============================================
// PREDICTION ENGINE
// ============================================

import { RACQUETS, STRINGS, FRAME_META } from './src/data/loader.js';
import {
  GAUGE_OPTIONS, GAUGE_LABELS, STAT_KEYS, STAT_LABELS, STAT_LABELS_FULL,
  STAT_CSS_CLASSES, STAT_GROUPS, OBS_TIERS, WTTN_ATTRS, WTTN_ATTR_LABELS,
  IDENTITY_FAMILIES, LB_STATS, DEFAULT_PRESETS
} from './src/engine/constants.js';
import {
  clamp, lerp, norm, getPatternOpenness, getAvgBeam, getMaxBeam, getMinBeam,
  isVariableBeam, calcFrameBase, normalizeRawSpecs
} from './src/engine/frame-physics.js';
import {
  calcBaseStringProfile, calcStringFrameMod, applyGaugeModifier, getGaugeOptions
} from './src/engine/string-profile.js';
import {
  calcTensionModifier, buildTensionContext
} from './src/engine/tension.js';
import {
  predictSetup, computeCompositeScore,
  getObsTier, getObsScoreColor, generateIdentity, classifySetup
} from './src/engine/composite.js';
import { calcHybridInteraction } from './src/engine/hybrid.js';
import { loadSavedLoadouts, persistSavedLoadouts, setActiveLoadout as _stateSetActiveLoadout, setSavedLoadouts as _stateSetSavedLoadouts, getSetupFromLoadout } from './src/state/loadout.js';
import { getActiveLoadout, setActiveLoadout, getSavedLoadouts, setSavedLoadouts, addSavedLoadout, removeSavedLoadout, updateSavedLoadout, subscribe } from './src/state/store.js';
import {
  installWindowAppStateBridge,
  setCurrentMode as _setAppCurrentMode,
  setComparisonSlots as _setAppComparisonSlots,
  setComparisonRadarChart as _setAppComparisonRadarChart,
  setCurrentRadarChart as _setAppCurrentRadarChart,
  setSlotColors as _setAppSlotColors
} from './src/state/app-state.js';
import { createSearchableSelect, ssInstances, _initQaSearchable } from './src/ui/components/searchable-select.js';
import { renderMyLoadouts, confirmRemoveLoadout } from './src/ui/pages/my-loadouts.js';
import { _dockContextActions, _dockGuidance, _dockIcons, _dockReturnEditorHome, _dockRelocateEditorToContext, _dockClearNonEditor } from './src/ui/components/dock-panel.js';
import { 
  encodeLoadoutToURL, 
  decodeLoadoutFromURL, 
  generateShareURL,
  showShareToast,
  copyToClipboard,
  exportLoadoutsToFile,
  importLoadoutsFromJSON,
  parseSharedBuildFromURL
} from './src/utils/share.js';
import { 
  generateTopBuilds, 
  pickDiverseBuilds, 
  generateBuildReason,
  ARCHETYPE_COLORS 
} from './src/state/presets.js';

// ============================================
// DATA FOUNDATION
// ============================================

// getDataFoundation removed — replaced by renderOCFoundation in 4-card grid

// ============================================
// SETUP BADGE TEXT
// ============================================


// ============================================
// UI CONTROLLER
// ============================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let currentRadarChart = null;
let comparisonRadarChart = null;
let comparisonSlots = []; // array of { racquet, stringConfig, stats, identity }
let isComparisonMode = false;

// ============================================
// PERSISTENT SHELL — MODE SYSTEM
// ============================================
let currentMode = 'overview';
const scrollPositions = { overview: 0, tune: 0, compare: 0, optimize: 0, compendium: 0, howitworks: 0 };
let _compareInitialized = false;
let _tuneInitialized = false;
let _optimizeInitialized = false;
let _compendiumInitialized = false;

function _syncLegacyModeState(mode) {
  currentMode = mode;
  isTuneMode = (mode === 'tune');
  isComparisonMode = (mode === 'compare');
  _setAppCurrentMode(currentMode);
}

installWindowAppStateBridge();
_syncLegacyModeState(currentMode);
_setAppComparisonSlots(comparisonSlots);
_setAppComparisonRadarChart(comparisonRadarChart);
_setAppCurrentRadarChart(currentRadarChart);

// === LOADOUT SYSTEM ===
// activeLoadout and savedLoadouts are now backed by the centralized state store.
// The local variables are kept as backward-compatible shims using getters/setters.

// Shim for activeLoadout — reads/writes go through the store
delete window.activeLoadout;
Object.defineProperty(window, 'activeLoadout', {
  get: () => getActiveLoadout(),
  set: (v) => setActiveLoadout(v),
  configurable: true
});

// Shim for savedLoadouts — reads/writes go through the store
delete window.savedLoadouts;
Object.defineProperty(window, 'savedLoadouts', {
  get: () => getSavedLoadouts(),
  set: (v) => setSavedLoadouts(v),
  configurable: true
});

// Local refs for modules that import from this file (deprecated, use store directly)
let activeLoadout = null; // Synced with store via subscription below
let savedLoadouts = [];   // Synced with store via subscription below

function _numericObs(value) {
  var numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function _formatBeamWidth(beamWidth) {
  if (Array.isArray(beamWidth) && beamWidth.length > 0) return beamWidth.join('/');
  if (typeof beamWidth === 'number' && Number.isFinite(beamWidth)) return String(beamWidth);
  return '\u2014';
}

function _formatTensionRange(tensionRange) {
  if (
    Array.isArray(tensionRange) &&
    tensionRange.length >= 2 &&
    typeof tensionRange[0] === 'number' &&
    typeof tensionRange[1] === 'number'
  ) {
    return tensionRange[0] + '-' + tensionRange[1] + ' lbs';
  }
  return '\u2014';
}

// Sync local refs with store (for backward compat with code that reads local vars)
subscribe('activeLoadout', () => { activeLoadout = getActiveLoadout(); });
subscribe('savedLoadouts', () => { savedLoadouts = getSavedLoadouts(); });

// loadSavedLoadouts and persistSavedLoadouts imported from src/state/loadout.js

function createLoadout(frameId, stringId, tension, opts) {
  if (typeof window.createLoadout === 'function' && window.createLoadout !== createLoadout) {
    return window.createLoadout(frameId, stringId, tension, opts);
  }
  opts = opts || {};
  const racquet = RACQUETS.find(r => r.id === frameId);
  const rawStringData = STRINGS.find(s => s.id === stringId);
  if (!racquet || !rawStringData) return null;

  // Apply gauge modifiers to string data before prediction
  let stringData = rawStringData;
  if (!opts.isHybrid && opts.gauge) {
    stringData = applyGaugeModifier(rawStringData, opts.gauge);
  }

  let mainsData = opts.isHybrid ? STRINGS.find(s => s.id === opts.mainsId) : undefined;
  let crossesData = opts.isHybrid ? STRINGS.find(s => s.id === opts.crossesId) : undefined;
  if (mainsData && opts.mainsGauge) mainsData = applyGaugeModifier(mainsData, opts.mainsGauge);
  if (crossesData && opts.crossesGauge) crossesData = applyGaugeModifier(crossesData, opts.crossesGauge);

  const cfg = {
    isHybrid: opts.isHybrid || false,
    string: opts.isHybrid ? undefined : stringData,
    mains: mainsData,
    crosses: crossesData,
    mainsTension: tension,
    crossesTension: opts.crossesTension || tension
  };

  const stats = predictSetup(racquet, cfg);
  const tCtx = stats ? buildTensionContext(cfg, racquet) : null;
  const obs = stats ? computeCompositeScore(stats, tCtx) : 0;
  const identity = stats ? generateIdentity(stats, racquet, cfg) : null;

  // Build name
  let loName = opts.name;
  if (!loName) {
    if (opts.isHybrid && mainsData && crossesData) {
      loName = mainsData.name + ' / ' + crossesData.name + ' on ' + racquet.name;
    } else {
      loName = rawStringData.name + ' on ' + racquet.name;
    }
  }

  return {
    id: opts.id || 'lo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name: loName,
    frameId: frameId,
    stringId: opts.isHybrid ? null : stringId,
    isHybrid: opts.isHybrid || false,
    mainsId: opts.mainsId || null,
    crossesId: opts.crossesId || null,
    mainsTension: tension,
    crossesTension: opts.crossesTension || tension,
    gauge: opts.gauge || null,
    mainsGauge: opts.mainsGauge || null,
    crossesGauge: opts.crossesGauge || null,
    stats: stats,
    obs: +obs.toFixed(1),
    identity: identity ? identity.name : '',
    source: opts.source || 'manual',
    _dirty: false
  };
}

function activateLoadout(loadout) {
  if (typeof window.activateLoadout === 'function' && window.activateLoadout !== activateLoadout) {
    return window.activateLoadout(loadout);
  }
}

function _syncOptimizeFrame(loadout) {
  if (!_optimizeInitialized || !loadout) return;
  var racquet = RACQUETS.find(function(r) { return r.id === loadout.frameId; });
  var el = document.getElementById('opt-frame-search');
  var val = document.getElementById('opt-frame-value');
  if (el && racquet) el.value = racquet.name;
  if (val && racquet) val.value = racquet.id;
}

function saveLoadout(loadout) {
  if (!loadout) return;
  const copy = Object.assign({}, loadout);
  delete copy._dirty; // runtime state, don't persist
  const sls = getSavedLoadouts();
  const existing = sls.findIndex(l => l.id === copy.id);
  if (existing >= 0) {
    updateSavedLoadout(copy.id, copy);
  } else {
    addSavedLoadout(copy);
  }
  // Also update legacy state module
  _stateSetSavedLoadouts(getSavedLoadouts());
  persistSavedLoadouts();
  renderDockPanel();
}

function removeLoadout(loadoutId) {
  removeSavedLoadout(loadoutId);
  // Also update legacy state module
  _stateSetSavedLoadouts(getSavedLoadouts());
  persistSavedLoadouts();
  renderDockPanel();
}

function switchToLoadout(loadoutId) {
  const sls = getSavedLoadouts();
  const lo = sls.find(l => l.id === loadoutId);
  if (lo) {
    const copy = Object.assign({}, lo);
    copy._dirty = false; // fresh switch, no unsaved changes
    activateLoadout(copy);
  }
}

function hydrateDock(loadout) {
  if (!loadout) return;
  const racquet = RACQUETS.find(r => r.id === loadout.frameId);
  if (!racquet) return;

  ssInstances['select-racquet']?.setValue(loadout.frameId);
  showFrameSpecs(racquet);

  if (loadout.isHybrid) {
    setHybridMode(true);
    ssInstances['select-string-mains']?.setValue(loadout.mainsId);
    populateGaugeDropdown(document.getElementById('gauge-select-mains'), loadout.mainsId);
    if (loadout.mainsGauge) {
      const gm = document.getElementById('gauge-select-mains');
      if (gm) gm.value = String(loadout.mainsGauge);
    }
    $('#input-tension-mains').value = loadout.mainsTension;
    ssInstances['select-string-crosses']?.setValue(loadout.crossesId);
    populateGaugeDropdown(document.getElementById('gauge-select-crosses'), loadout.crossesId);
    if (loadout.crossesGauge) {
      const gx = document.getElementById('gauge-select-crosses');
      if (gx) gx.value = String(loadout.crossesGauge);
    }
    $('#input-tension-crosses').value = loadout.crossesTension;
  } else {
    setHybridMode(false);
    ssInstances['select-string-full']?.setValue(loadout.stringId);
    populateGaugeDropdown(document.getElementById('gauge-select-full'), loadout.stringId);
    if (loadout.gauge) {
      const gf = document.getElementById('gauge-select-full');
      if (gf) gf.value = String(loadout.gauge);
    }
    $('#input-tension-full-mains').value = loadout.mainsTension;
    $('#input-tension-full-crosses').value = loadout.crossesTension;
  }
}

// ============================================
// PHASE 1: SINGLE SOURCE OF TRUTH
// getSetupFromLoadout reads FROM the loadout object (not DOM)
// commitEditorToLoadout writes FROM the dock editor INTO the loadout
// Data flow is always: loadout → DOM (via hydrateDock), never DOM → loadout silently
// ============================================

function commitEditorToLoadout() {
  if (typeof window.commitEditorToLoadout === 'function' && window.commitEditorToLoadout !== commitEditorToLoadout) {
    return window.commitEditorToLoadout();
  }
}

function renderDockPanel() {
  if (typeof window.renderDockPanel === 'function' && window.renderDockPanel !== renderDockPanel) {
    return window.renderDockPanel();
  }
}

function renderMobileLoadoutPills() {
  if (typeof window.renderMobileLoadoutPills === 'function' && window.renderMobileLoadoutPills !== renderMobileLoadoutPills) {
    return window.renderMobileLoadoutPills();
  }
}

// ============================================
// CONTEXT-AWARE DOCK PANEL SYSTEM
// ============================================
// The dock renders mode-specific content in #dock-context-panel.
// Each mode gets its own render function that outputs HTML + wires events.
// Editor controls (searchable selects, tension inputs) are physically
// relocated via appendChild — instances survive the move.

function renderDockContextPanel() {
  if (typeof window.renderDockContextPanel === 'function' && window.renderDockContextPanel !== renderDockContextPanel) {
    return window.renderDockContextPanel();
  }
}

// --- Mode Panel Implementations ---

function _dockEscHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _dockCurrentBuildCardHtmlLegacy(opts) {
  var obsChip = (opts.obsNum === '\u2014' || opts.obsNum === '—') ? '\u2014' : opts.obsNum;
  var frameRow = opts.frameLine.trim() === ''
    ? ''
    : '<div class="dock-ctx-meta-row"><dt>Frame</dt><dd>' + _dockEscHtml(opts.frameLine) + '</dd></div>';
  return (
    '<div class="dock-ctx-current-card">' +
      '<div class="dock-ctx-current-top">' +
        '<span class="dock-ctx-label dock-ctx-label--card">' + opts.sectionLabel + '</span>' +
        '<div class="dock-ctx-obs-block">' +
          '<span class="dock-ctx-obs-cap">OBS</span>' +
          '<span class="dock-ctx-obs-pill">' + _dockEscHtml(obsChip) + '</span>' +
        '</div>' +
      '</div>' +
      '<p class="dock-ctx-current-headline">' + _dockEscHtml(opts.headline) + '</p>' +
      '<dl class="dock-ctx-meta-grid">' +
        frameRow +
        '<div class="dock-ctx-meta-row"><dt>Strings</dt><dd>' + _dockEscHtml(opts.stringsLine) + '</dd></div>' +
        '<div class="dock-ctx-meta-row"><dt>Tension</dt><dd class="dock-ctx-meta-mono">' + _dockEscHtml(opts.tensionShort) + '</dd></div>' +
      '</dl>' +
    '</div>'
  );
}

function _renderDockPanelBible(container) {
  // Return editor controls home first
  _dockReturnEditorHome();

  // Hide editor in Bible mode — user is browsing, not editing
  const editorSection = document.getElementById('dock-editor-section');
  if (editorSection) editorSection.style.display = 'none';

  const al = getActiveLoadout();
  if (!al) {
    // No loadout — onboarding guidance
    container.innerHTML = _dockGuidance(
      _dockIcons.racket,
      'Getting started',
      'Browse frames on the right. Each one shows its top string pairings ranked by OBS (overall build score).<br><br>Tap <strong>Set Active</strong> on any build card to load it — then you can tune tension, compare builds, and explore alternatives.'
    );
  } else {
    // Has loadout — show current build summary + action links
    const racquet = RACQUETS.find(r => r.id === al.frameId);
    const frameName = racquet ? racquet.name.replace(/\s+\d+g$/, '') : '—';
    const obsValue = _numericObs(al.obs);
    const obs = obsValue > 0 ? obsValue.toFixed(1) : '—';

    let stringName = '—';
    if (al.isHybrid) {
      const m = STRINGS.find(s => s.id === al.mainsId);
      const x = STRINGS.find(s => s.id === al.crossesId);
      stringName = m && x ? m.name + ' / ' + x.name : '—';
    } else {
      const str = STRINGS.find(s => s.id === al.stringId);
      stringName = str ? str.name : '—';
    }

    var named = (al.name && al.name.trim()) ? al.name.trim() : '';
    var headline = named || frameName;
    var frameMeta = (named && named !== frameName) ? frameName : '';
    var tensionShort = 'M' + al.mainsTension + ' / X' + al.crossesTension;

    container.innerHTML = _dockCurrentBuildCardHtmlLegacy({
      sectionLabel: 'Current build',
      headline: headline,
      frameLine: frameMeta,
      stringsLine: stringName,
      tensionShort: tensionShort,
      obsNum: obs,
    }) + _dockContextActions([
      { label: '→ View build overview', onclick: "switchMode('overview')" },
      { label: '→ Tune this build', onclick: "switchMode('tune')" },
      { label: '→ Compare with others', onclick: "switchMode('compare')" },
      { label: '→ Find a better string', onclick: "switchMode('optimize')" }
    ]);
  }
}

function _renderDockPanelOverview(container) {
  if (!activeLoadout) {
    // No loadout — return editor home, show it normally for creation flow
    _dockReturnEditorHome();
    // Clear only non-editor content from container
    _dockClearNonEditor(container);
    return;
  }

  // Loadout active — check if editor is already in place
  const editorBody = document.querySelector('.dock-editor-body');
  const editorAlreadyHere = editorBody && editorBody.parentElement === container;

  if (!editorAlreadyHere) {
    // Clear container safely, then relocate editor in
    _dockClearNonEditor(container);
    _dockRelocateEditorToContext(container);
  } else {
    // Editor already here — clean up elements from other modes
    const tuneLine = container.querySelector('.dock-tune-frame-line');
    if (tuneLine) tuneLine.remove();
    const existingActions = container.querySelector('.dock-ctx-actions');
    if (existingActions) existingActions.remove();
  }

  // Add/refresh action links below the editor
  container.insertAdjacentHTML('beforeend', _dockContextActions([
    { label: '→ Tune tension curves', onclick: "switchMode('tune')" },
    { label: '→ Compare with saved', onclick: "switchMode('compare')" },
    { label: '→ Find a better string', onclick: "switchMode('optimize')" }
  ]));
}

function _renderDockPanelTune(container) {
  const al = getActiveLoadout();
  if (!al) {
    _dockReturnEditorHome();
    const editorSection = document.getElementById('dock-editor-section');
    if (editorSection) editorSection.style.display = 'none';
    container.innerHTML = _dockGuidance(_dockIcons.tune, 'No build loaded',
      'Load a build from Overview or the Racket Bible to start tuning.');
    return;
  }

  // Add tune-mode class for CSS overrides (hides frame section + tension rows)
  container.classList.add('dock-tune-mode');

  const racquet = RACQUETS.find(r => r.id === al.frameId);
  const frameName = racquet ? racquet.name : '—';

  // Check if editor is already relocated here
  const editorBody = document.querySelector('.dock-editor-body');
  const editorAlreadyHere = editorBody && editorBody.parentElement === container;

  if (!editorAlreadyHere) {
    _dockReturnEditorHome();
    _dockClearNonEditor(container);

    // Compact frame info line above the editor
    container.insertAdjacentHTML('afterbegin', `
      <div class="dock-tune-frame-line">
        <span class="dock-ctx-label">Frame</span>
        <div class="dock-tune-frame-row">
          <span class="dock-tune-frame-name">${frameName}</span>
          <a class="dock-tune-change" onclick="switchMode('overview')">change</a>
        </div>
      </div>
    `);

    _dockRelocateEditorToContext(container);
  } else {
    // Editor already here — ensure frame line exists (may be missing if coming from Overview)
    let frameLine = container.querySelector('.dock-tune-frame-line');
    if (!frameLine) {
      const editorBody = container.querySelector('.dock-editor-body');
      const frameHTML = `
        <div class="dock-tune-frame-line">
          <span class="dock-ctx-label">Frame</span>
          <div class="dock-tune-frame-row">
            <span class="dock-tune-frame-name">${frameName}</span>
            <a class="dock-tune-change" onclick="switchMode('overview')">change</a>
          </div>
        </div>
      `;
      if (editorBody) {
        editorBody.insertAdjacentHTML('beforebegin', frameHTML);
      } else {
        container.insertAdjacentHTML('afterbegin', frameHTML);
      }
    } else {
      // Update existing frame name
      const nameEl = frameLine.querySelector('.dock-tune-frame-name');
      if (nameEl) nameEl.textContent = frameName;
    }
    // Clear old action links
    const existingActions = container.querySelector('.dock-ctx-actions');
    if (existingActions) existingActions.remove();
  }

  // Action links below editor
  container.insertAdjacentHTML('beforeend', _dockContextActions([
    { label: '→ Compare with saved', onclick: "switchMode('compare')" },
    { label: '→ Find a better string', onclick: "switchMode('optimize')" },
    { label: '→ Back to overview', onclick: "switchMode('overview')" }
  ]));
}

function _renderDockPanelCompare(container) {
  _dockReturnEditorHome();
  const editorSection = document.getElementById('dock-editor-section');
  if (editorSection) editorSection.style.display = 'none';

  let html = '';

  // Slot summaries
  if (comparisonSlots.length > 0) {
    html += '<div class="dock-ctx-label">Compare slots</div>';
    html += '<div class="dock-compare-slots">';
    comparisonSlots.forEach((slot, i) => {
      const color = SLOT_COLORS[i];
      const racquet = RACQUETS.find(r => r.id === slot.racquetId);
      const frameName = racquet ? racquet.name.replace(/\s+\d+g$/, '') : 'Not set';

      let stringName = '—';
      if (slot.isHybrid) {
        const m = STRINGS.find(s => s.id === slot.mainsId);
        const x = STRINGS.find(s => s.id === slot.crossesId);
        stringName = m && x ? m.name + ' / ' + x.name : '—';
      } else {
        const str = STRINGS.find(s => s.id === slot.stringId);
        stringName = str ? str.name : '—';
      }

      let obs = '—';
      if (slot.stats && racquet) {
        const tensionCtx = buildTensionContext({
          isHybrid: slot.isHybrid,
          mains: slot.isHybrid ? STRINGS.find(s => s.id === slot.mainsId) : null,
          crosses: slot.isHybrid ? STRINGS.find(s => s.id === slot.crossesId) : null,
          string: slot.isHybrid ? null : STRINGS.find(s => s.id === slot.stringId),
          mainsTension: slot.mainsTension,
          crossesTension: slot.crossesTension
        }, racquet);
        obs = computeCompositeScore(slot.stats, tensionCtx).toFixed(1);
      }

      html += `
        <div class="dock-compare-slot" style="border-left: 3px solid ${color.border}">
          <div class="dock-compare-slot-header">
            <span class="dock-compare-slot-label" style="color: ${color.border}">Slot ${color.label}</span>
            <span class="dock-compare-slot-obs" style="color:${slot.stats ? getObsScoreColor(parseFloat(obs)) : 'var(--dc-storm)'}">${obs}</span>
          </div>
          <div class="dock-compare-slot-meta">${frameName}</div>
          <div class="dock-compare-slot-meta">${stringName} · ${slot.mainsTension}/${slot.crossesTension}</div>
          <div class="dock-compare-slot-actions">
            <button class="dock-compare-slot-btn" onclick="_dockCompareEdit(${i})">Edit</button>
            <button class="dock-compare-slot-btn dock-compare-slot-remove" onclick="_dockCompareRemove(${i})">Remove</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  // Quick Add from saved loadouts not already in slots
  const slotKeys = comparisonSlots.map(s => s.racquetId + '-' + (s.stringId || s.mainsId));
  const available = savedLoadouts.filter(lo => {
    const key = lo.frameId + '-' + (lo.stringId || lo.mainsId);
    return !slotKeys.includes(key);
  });

  if (available.length > 0 && comparisonSlots.length < 3) {
    html += '<div class="dock-ctx-label">Quick add</div>';
    html += '<div class="dock-compare-quickadd">';
    available.slice(0, 5).forEach(lo => {
      // Fix 6: Show frame name + string name separately in quick add pills
      var racquet = RACQUETS.find(function(r) { return r.id === lo.frameId; });
      var frameName = racquet ? racquet.name.split(' ').slice(0, 2).join(' ') : 'Unknown';
      var stringName = '';
      if (lo.isHybrid) {
        var m = STRINGS.find(function(s) { return s.id === lo.mainsId; });
        var x = STRINGS.find(function(s) { return s.id === lo.crossesId; });
        stringName = m && x ? m.name.split(' ')[0] + '/' + x.name.split(' ')[0] : 'Hybrid';
      } else {
        var str = STRINGS.find(function(s) { return s.id === lo.stringId; });
        stringName = str ? str.name.split(' ')[0] : '—';
      }
      var slotObsValue = _numericObs(lo.obs);
      html += '<button class="dock-compare-pill" onclick="_dockCompareQuickAdd(\'' + lo.id + '\')" title="OBS ' + (slotObsValue > 0 ? slotObsValue.toFixed(1) : '—') + '">' +
        '<span class="dock-compare-pill-frame">' + frameName + '</span>' +
        '<span class="dock-compare-pill-string">' + stringName + '</span>' +
      '</button>';
    });
    html += '</div>';
  }

  // Empty state
  const al = getActiveLoadout();
  if (comparisonSlots.length === 0 && getSavedLoadouts().length === 0 && !al) {
    html = _dockGuidance(_dockIcons.compare, 'Nothing to compare yet',
      'Set a build active from the Racket Bible, then come back here.');
  }

  // Action links
  const validSlots = comparisonSlots.filter(s => s.stats);
  html += _dockContextActions([
    ...(validSlots.length >= 2 ? [{ label: '→ Tune active build', onclick: "switchMode('tune')" }] : []),
    { label: '→ Optimize from here', onclick: "switchMode('optimize')" },
    { label: '→ Back to overview', onclick: "switchMode('overview')" }
  ]);

  container.innerHTML = html;
}

// --- Dock Compare Helpers ---
function _dockCompareEdit(slotIndex) {
  // Open inline card editor
  _toggleCompareCardEditor(slotIndex);
  // Scroll card into view
  var card = document.querySelector('.compare-summary-card[data-slot-index="' + slotIndex + '"]');
  if (card) requestAnimationFrame(function() { card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
}

function _dockCompareRemove(slotIndex) {
  if (typeof window._dockCompareRemove === 'function' && window._dockCompareRemove !== _dockCompareRemove) {
    return window._dockCompareRemove(slotIndex);
  }
}

function _dockCompareQuickAdd(loadoutId) {
  if (typeof window._dockCompareQuickAdd === 'function' && window._dockCompareQuickAdd !== _dockCompareQuickAdd) {
    return window._dockCompareQuickAdd(loadoutId);
  }
}

function _renderDockPanelOptimize(container) {
  _dockReturnEditorHome();
  const editorSection = document.getElementById('dock-editor-section');
  if (editorSection) editorSection.style.display = 'none';

  const al = getActiveLoadout();
  if (!al) {
    container.innerHTML = _dockGuidance(
      _dockIcons.optimize,
      'No build to optimize from',
      'Load a build first — the optimizer finds better string pairings for your current frame.'
    ) + _dockContextActions([
      { label: '→ Browse the Racket Bible', onclick: "switchMode('compendium')" },
      { label: '→ Try the quiz', onclick: "openFindMyBuild()" }
    ]);
    return;
  }

  const racquet = RACQUETS.find(r => r.id === al.frameId);
  const obsValue = _numericObs(al.obs);
  const obs = obsValue > 0 ? obsValue.toFixed(1) : '—';

  // Current string info
  let stringName = '—';
  if (al.isHybrid) {
    const m = STRINGS.find(s => s.id === al.mainsId);
    const x = STRINGS.find(s => s.id === al.crossesId);
    stringName = m && x ? m.name + ' / ' + x.name : '—';
  } else {
    const str = STRINGS.find(s => s.id === al.stringId);
    stringName = str ? str.name : '—';
  }

  const tensionShort = `M${al.mainsTension} / X${al.crossesTension}`;
  const frameLine = racquet ? racquet.name.replace(/\s+\d+g$/, '') : '—';
  const named = (al.name && al.name.trim()) ? al.name.trim() : '';
  const headline = named || frameLine;
  const frameMeta = (named && named !== frameLine) ? frameLine : '';

  container.innerHTML = _dockCurrentBuildCardHtmlLegacy({
    sectionLabel: 'Optimizing from',
    headline: headline,
    frameLine: frameMeta,
    stringsLine: stringName,
    tensionShort: tensionShort,
    obsNum: obs,
  }) + _dockContextActions([
    { label: '→ Back to overview', onclick: "switchMode('overview')" },
    { label: '→ Tune this build', onclick: "switchMode('tune')" },
    { label: '→ Compare top results', onclick: "switchMode('compare')" }
  ]);
}

function _renderDockPanelReference(container) {
  _dockReturnEditorHome();
  const editorSection = document.getElementById('dock-editor-section');
  if (editorSection) editorSection.style.display = 'none';

  const al = getActiveLoadout();
  const actions = [];
  if (al) {
    actions.push({ label: '→ Back to your build', onclick: "switchMode('overview')" });
    actions.push({ label: '→ Tune tension curves', onclick: "switchMode('tune')" });
  } else {
    actions.push({ label: '→ Browse the Racket Bible', onclick: "switchMode('compendium')" });
    actions.push({ label: '→ Try the quiz', onclick: "openFindMyBuild()" });
  }

  container.innerHTML = _dockGuidance(
    _dockIcons.reference,
    'Reference',
    "You're reading how the prediction engine works."
  ) + _dockContextActions(actions);
}

// === Mobile dock bar sync ===
function _syncMobileDockBar() {
  if (typeof window._syncMobileDockBar === 'function' && window._syncMobileDockBar !== _syncMobileDockBar) {
    return window._syncMobileDockBar();
  }
}

function toggleMobileDock() {
  if (typeof window.toggleMobileDock === 'function' && window.toggleMobileDock !== toggleMobileDock) {
    return window.toggleMobileDock();
  }
}

// ═══ DOCK COLLAPSE RAIL ═══

function toggleDockCollapse() {
  if (typeof window.toggleDockCollapse === 'function' && window.toggleDockCollapse !== toggleDockCollapse) {
    return window.toggleDockCollapse();
  }
}

function _syncDockRail() {
  if (typeof window._syncDockRail === 'function' && window._syncDockRail !== _syncDockRail) {
    return window._syncDockRail();
  }
}

function _initDockCollapse() {
  if (typeof window._initDockCollapse === 'function' && window._initDockCollapse !== _initDockCollapse) {
    return window._initDockCollapse();
  }
}


// ============================================
// SHAREABLE URLs + EXPORT/IMPORT
// ============================================
// Core functions imported from './src/utils/share.js'

function shareLoadout(loadoutId) {
  var lo = savedLoadouts.find(function(l) { return l.id === loadoutId; });
  if (!lo && activeLoadout && activeLoadout.id === loadoutId) lo = activeLoadout;
  if (!lo) return;
  
  var url = generateShareURL(lo);
  copyToClipboard(url).then(function() {
    showShareToast('Link copied to clipboard!');
  });
}

function shareActiveLoadout() {
  if (!activeLoadout) return;
  shareLoadout(activeLoadout.id);
}

function exportLoadouts() {
  exportLoadoutsToFile(savedLoadouts, showShareToast);
}

function importLoadouts(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var imported = importLoadoutsFromJSON(e.target.result, {
        createLoadout: createLoadout,
        saveLoadout: saveLoadout,
        savedLoadouts: savedLoadouts,
        renderDockPanel: renderDockPanel,
        showToast: showShareToast
      });
      showShareToast(imported + ' loadout' + (imported !== 1 ? 's' : '') + ' imported!');
      renderDockPanel();
    } catch(err) {
      showShareToast('Error reading file');
    }
  };
  reader.readAsText(file);
  // Reset input so same file can be imported again
  event.target.value = '';
}

function _handleSharedBuildURL() {
  var decoded = parseSharedBuildFromURL();
  if (!decoded || !decoded.frameId) return false;
  
  // Create the loadout
  var opts = { source: 'shared' };
  if (decoded.isHybrid) {
    opts.isHybrid = true;
    opts.mainsId = decoded.mainsId;
    opts.crossesId = decoded.crossesId;
    opts.crossesTension = decoded.crossesTension;
  }
  var lo = createLoadout(
    decoded.frameId,
    decoded.isHybrid ? decoded.mainsId : decoded.stringId,
    decoded.mainsTension,
    opts
  );
  
  if (lo) {
    activateLoadout(lo);
    saveLoadout(lo);
    // Clean URL without reload
    var cleanURL = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', cleanURL);
    showShareToast('Shared build loaded!');
    return true;
  }
  return false;
}

// Dock action handlers
function saveActiveLoadout() {
  if (typeof window.saveActiveLoadout === 'function' && window.saveActiveLoadout !== saveActiveLoadout) {
    return window.saveActiveLoadout();
  }
  const al = getActiveLoadout();
  if (!al) return;
  al._dirty = false;
  saveLoadout(al);
}

function duplicateActiveLoadout() {
  const al = getActiveLoadout();
  if (!al) return;
  var dupe = Object.assign({}, al, {
    id: 'lo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name: al.name + ' (copy)'
  });
  saveLoadout(dupe);
  activateLoadout(dupe);
}

function resetActiveLoadout() {
  if (typeof window.resetActiveLoadout === 'function' && window.resetActiveLoadout !== resetActiveLoadout) {
    return window.resetActiveLoadout();
  }
}

function addLoadoutToCompare(loadoutId) {
  if (typeof window.addLoadoutToCompare === 'function' && window.addLoadoutToCompare !== addLoadoutToCompare) {
    return window.addLoadoutToCompare(loadoutId);
  }
}

function renderDockState() {
  renderDockPanel();
}

function switchMode(mode) {
  if (typeof window.switchMode === 'function' && window.switchMode !== switchMode) {
    return window.switchMode(mode);
  }
}

// ============================================
// DYNAMIC PRESET SYSTEM
// ============================================

// Persistence helpers — try web storage, fall back to in-memory
const _store = (function() { try { return window['local' + 'Storage']; } catch(e) { return null; } })();

function loadPresetsFromStorage() {
  try {
    if (!_store) return null;
    const stored = _store.getItem('tll-presets');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* storage blocked or corrupt — ignore */ }
  return null;
}

function savePresetsToStorage() {
  try {
    if (!_store) return;
    _store.setItem('tll-presets', JSON.stringify(userPresets));
  } catch (e) { /* storage blocked — ignore */ }
}

let userPresets = loadPresetsFromStorage() || [...DEFAULT_PRESETS];

function getPresetDetail(preset) {
  if (typeof window.getPresetDetail === 'function' && window.getPresetDetail !== getPresetDetail) {
    return window.getPresetDetail(preset);
  }
}

function renderHomePresets() {
  const container = $('#preset-list');
  if (!container) return;
  container.innerHTML = '';

  userPresets.forEach((preset, idx) => {
    const div = document.createElement('div');
    div.className = 'preset-item';
    div.innerHTML = `
      <button class="preset-btn" data-preset-idx="${idx}">
        <span class="preset-name">${preset.name}</span>
        <span class="preset-detail">${getPresetDetail(preset)}</span>
      </button>
      <button class="preset-delete" data-preset-idx="${idx}" title="Remove preset">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    `;
    container.appendChild(div);
  });

  // Attach events
  container.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.presetIdx);
      loadPresetFromData(userPresets[idx]);
    });
  });
  container.querySelectorAll('.preset-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.presetIdx);
      userPresets.splice(idx, 1);
      savePresetsToStorage();
      renderHomePresets();
      renderComparisonPresets();
    });
  });
}

function saveCurrentAsPreset() {
  const setup = getCurrentSetup();
  if (!setup) return;

  const { racquet, stringConfig } = setup;
  let presetName = '';

  if (stringConfig.isHybrid) {
    presetName = `${stringConfig.mains.name}/${stringConfig.crosses.name} on ${racquet.name}`;
  } else {
    presetName = `${stringConfig.string.name} on ${racquet.name}`;
  }

  const preset = {
    id: 'user-' + Date.now(),
    name: presetName,
    racquetId: racquet.id,
    isHybrid: stringConfig.isHybrid,
    mainsId: stringConfig.isHybrid ? stringConfig.mains.id : null,
    crossesId: stringConfig.isHybrid ? stringConfig.crosses.id : null,
    mainsTension: stringConfig.mainsTension,
    crossesTension: stringConfig.crossesTension,
    stringId: stringConfig.isHybrid ? null : stringConfig.string.id
  };

  userPresets.push(preset);
  savePresetsToStorage();
  renderHomePresets();
  renderComparisonPresets();

  // Flash save button
  const btn = $('#btn-save-preset');
  if (btn) {
    btn.classList.add('saved');
    btn.textContent = '✓ Saved';
    setTimeout(() => {
      btn.classList.remove('saved');
      btn.textContent = '+ Save Current Setup';
    }, 1200);
  }
}

function loadPresetFromData(preset) {
  if (!preset) return;
  const racquet = RACQUETS.find(r => r.id === preset.racquetId);
  if (!racquet) return;

  const mt = preset.mainsTension ?? preset.tension ?? 55;
  const xt = preset.crossesTension ?? preset.tension ?? 53;

  const opts = {
    source: 'preset',
    crossesTension: xt,
  };
  if (preset.isHybrid) {
    opts.isHybrid = true;
    opts.mainsId = preset.mainsId;
    opts.crossesId = preset.crossesId;
  }

  const lo = createLoadout(
    preset.racquetId,
    preset.isHybrid ? preset.mainsId : preset.stringId,
    mt,
    opts
  );
  if (lo) {
    activateLoadout(lo);
    renderDashboard();
  }
}

function loadPresetIntoSlot(presetIdx, slotIdx) {
  const preset = userPresets[presetIdx];
  if (!preset) return;
  const slot = comparisonSlots[slotIdx];
  if (!slot) return;

  slot.racquetId = preset.racquetId;
  slot.isHybrid = preset.isHybrid;

  if (preset.isHybrid) {
    slot.mainsId = preset.mainsId;
    slot.crossesId = preset.crossesId;
    slot.mainsTension = preset.mainsTension;
    slot.crossesTension = preset.crossesTension;
    slot.stringId = '';
  } else {
    slot.stringId = preset.stringId;
    slot.mainsTension = preset.mainsTension ?? preset.tension ?? 55;
    slot.crossesTension = preset.crossesTension ?? preset.tension ?? 53;
    slot.mainsId = '';
    slot.crossesId = '';
  }

  recalcSlot(slotIdx);
}

function renderComparisonPresets() {
  const container = $('#comparison-presets');
  if (!container) return;

  // Build suggestions from: 1) saved loadouts, 2) tune recommendations
  const suggestions = [];
  const slotKeys = new Set(comparisonSlots.map(s => s.racquetId + '|' + s.stringId + '|' + s.mainsTension));
  
  // Add saved loadouts not already in comparison
  savedLoadouts.forEach(lo => {
    const key = lo.frameId + '|' + lo.stringId + '|' + lo.mainsTension;
    if (!slotKeys.has(key)) {
      const racquet = RACQUETS.find(r => r.id === lo.frameId);
      suggestions.push({
        label: lo.name.length > 28 ? lo.name.substring(0, 28) + '...' : lo.name,
        obs: lo.obs,
        frameId: lo.frameId,
        stringId: lo.stringId,
        tension: lo.mainsTension,
        source: 'saved',
        isHybrid: lo.isHybrid,
        mainsId: lo.mainsId,
        crossesId: lo.crossesId,
        crossesTension: lo.crossesTension
      });
    }
  });
  
  // If we have an active setup, add Tune-page recommended builds as suggestions
  if (activeLoadout) {
    const setup = getCurrentSetup();
    if (setup && typeof renderRecommendedBuilds === 'function') {
      // Quick-generate top 3 alternative builds for the current frame
      const racquet = setup.racquet;
      const midT = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
      const quickRecs = [];
      STRINGS.slice(0, 30).forEach(s => {
        if (activeLoadout.stringId === s.id) return;
        const cfg = { isHybrid: false, string: s, mainsTension: midT, crossesTension: midT };
        const stats = predictSetup(racquet, cfg);
        if (!stats) return;
        const tCtx = buildTensionContext(cfg, racquet);
        const score = computeCompositeScore(stats, tCtx);
        quickRecs.push({ label: s.name + ' on ' + racquet.name, obs: +score.toFixed(1), frameId: racquet.id, stringId: s.id, tension: midT, source: 'suggested' });
      });
      quickRecs.sort((a, b) => b.obs - a.obs);
      const seen = new Set(suggestions.map(s => s.frameId + '|' + s.stringId));
      quickRecs.slice(0, 4).forEach(r => {
        const key = r.frameId + '|' + r.stringId + '|' + r.tension;
        if (!slotKeys.has(key) && !seen.has(r.frameId + '|' + r.stringId)) {
          suggestions.push(r);
        }
      });
    }
  }
  
  if (suggestions.length === 0) {
    container.innerHTML = '<span class="comp-presets-empty">Save loadouts from Racket Bible to quick-add here</span>';
    return;
  }

  let html = '';
  suggestions.slice(0, 5).forEach((s, idx) => {
    html += `<button class="comp-preset-btn" data-sug-idx="${idx}" title="${s.label} · OBS ${s.obs || '—'}">
      <span class="comp-preset-name">${s.label}</span>
    </button>`;
  });
  container.innerHTML = html;

  // Store suggestions for click handler
  container._suggestions = suggestions;

  container.querySelectorAll('.comp-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.sugIdx);
      const s = container._suggestions[idx];
      if (!s) return;
      let targetSlot = comparisonSlots.findIndex(sl => !sl.racquetId);
      if (targetSlot === -1) {
        if (comparisonSlots.length < 3) {
          addComparisonSlot();
          targetSlot = comparisonSlots.length - 1;
        } else {
          targetSlot = comparisonSlots.length - 1;
        }
      }
      // Load suggestion into comparison slot
      const slot = comparisonSlots[targetSlot];
      if (slot) {
        slot.racquetId = s.frameId;
        slot.stringId = s.stringId || '';
        slot.isHybrid = s.isHybrid || false;
        slot.mainsId = s.mainsId || '';
        slot.crossesId = s.crossesId || '';
        slot.mainsTension = s.tension || 53;
        slot.crossesTension = s.crossesTension || s.tension || 53;
        recalcSlot(targetSlot);
      }

      // Re-render presets to remove the one just added
      renderComparisonPresets();

      // Flash feedback
      btn.classList.add('loaded');
      setTimeout(() => btn.classList.remove('loaded'), 600);
    });
  });
}

function getSlotColors() {
  if (typeof window.getSlotColors === 'function' && window.getSlotColors !== getSlotColors) {
    return window.getSlotColors();
  }
}
let SLOT_COLORS = getSlotColors();
_setAppSlotColors(SLOT_COLORS);

// ============================================
// POPULATE DROPDOWNS (Searchable)
// ============================================
// createSearchableSelect and ssInstances imported from './src/ui/components/searchable-select.js'

function populateRacquetDropdown(targetEl) {
  if (typeof window.populateRacquetDropdown === 'function' && window.populateRacquetDropdown !== populateRacquetDropdown) {
    return window.populateRacquetDropdown(targetEl);
  }
}

function populateStringDropdown(targetEl, initialValue) {
  if (typeof window.populateStringDropdown === 'function' && window.populateStringDropdown !== populateStringDropdown) {
    return window.populateStringDropdown(targetEl, initialValue);
  }
}

function populateGaugeDropdown(el, stringId) {
  if (typeof window.populateGaugeDropdown === 'function' && window.populateGaugeDropdown !== populateGaugeDropdown) {
    return window.populateGaugeDropdown(el, stringId);
  }
}

// ============================================
// FRAME SPECS DISPLAY
// ============================================

function showFrameSpecs(racquet) {
  if (typeof window.showFrameSpecs === 'function' && window.showFrameSpecs !== showFrameSpecs) {
    return window.showFrameSpecs(racquet);
  }
}

// ============================================
// MAIN DASHBOARD RENDER
// ============================================

// _getSetupFromEditorDOM: reads build state directly from dock editor form elements.
// Used ONLY as fallback when no activeLoadout exists (e.g., creation form, first-time user).
// For all normal operation, getCurrentSetup() reads from the loadout model instead.
function _getSetupFromEditorDOM() {
  const racquetId = ssInstances['select-racquet']?.getValue() || '';
  const racquet = RACQUETS.find(r => r.id === racquetId);
  if (!racquet) return null;

  const isHybrid = $('#btn-hybrid').classList.contains('active');

  if (isHybrid) {
    const mainsId = ssInstances['select-string-mains']?.getValue() || '';
    const crossesId = ssInstances['select-string-crosses']?.getValue() || '';
    if (!mainsId || !crossesId) return null;

    // Read gauge selections
    const mainsGaugeEl = document.getElementById('gauge-select-mains');
    const crossesGaugeEl = document.getElementById('gauge-select-crosses');
    const mainsGauge = mainsGaugeEl && mainsGaugeEl.value ? parseFloat(mainsGaugeEl.value) : null;
    const crossesGauge = crossesGaugeEl && crossesGaugeEl.value ? parseFloat(crossesGaugeEl.value) : null;

    // Apply gauge modifiers to string data
    let mainsData = STRINGS.find(s => s.id === mainsId);
    let crossesData = STRINGS.find(s => s.id === crossesId);
    if (mainsData && mainsGauge) mainsData = applyGaugeModifier(mainsData, mainsGauge);
    if (crossesData && crossesGauge) crossesData = applyGaugeModifier(crossesData, crossesGauge);

    return {
      racquet,
      stringConfig: {
        isHybrid: true,
        mains: mainsData,
        crosses: crossesData,
        mainsId, crossesId,
        mainsTension: parseInt($('#input-tension-mains').value) || 55,
        crossesTension: parseInt($('#input-tension-crosses').value) || 53
      }
    };
  } else {
    const stringId = ssInstances['select-string-full']?.getValue() || '';
    if (!stringId) return null;

    // Read gauge selection
    const gaugeEl = document.getElementById('gauge-select-full');
    const selectedGauge = gaugeEl && gaugeEl.value ? parseFloat(gaugeEl.value) : null;

    // Apply gauge modifier to string data
    let stringData = STRINGS.find(s => s.id === stringId);
    if (stringData && selectedGauge) stringData = applyGaugeModifier(stringData, selectedGauge);

    return {
      racquet,
      stringConfig: {
        isHybrid: false,
        string: stringData,
        mainsTension: parseInt($('#input-tension-full-mains').value) || 55,
        crossesTension: parseInt($('#input-tension-full-crosses').value) || 53
      }
    };
  }
}

// getCurrentSetup: Smart wrapper — reads from activeLoadout model when available,
// falls back to DOM editor for creation form / no-loadout state.
// This is the ONLY function external code should call to get the current build.
function getCurrentSetup() {
  const al = getActiveLoadout();
  if (al) {
    return getSetupFromLoadout(al);
  }
  return _getSetupFromEditorDOM();
}

// Wave 2: Assign stagger animation indices to direct children of a container
function _assignStaggerIndices(containerSel) {
  const container = document.querySelector(containerSel);
  if (!container) return;
  const children = container.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    // Skip hidden elements
    if (child.classList.contains('hidden') || child.style.display === 'none') continue;
    child.classList.add('stagger-item');
    child.style.setProperty('--stagger-i', i);
    // Force animation replay
    child.style.animation = 'none';
    child.offsetHeight;
    child.style.animation = '';
  }
}

// Fallback legacy bridge: any old app.js call is forwarded to the final window-bound implementation.
function _bridge(fnName, ...args) {
  const impl = window[fnName];
  if (typeof impl === 'function' && impl !== _bridge) {
    return impl(...args);
  }
  return undefined;
}

function renderDashboard() {
  return _bridge('renderDashboard');
}

function renderOverviewHero(racquet, stringConfig, stats, identity) {
  return _bridge('renderOverviewHero', racquet, stringConfig, stats, identity);
}


// ============================================
// OVERVIEW 4-CARD GRID
// ============================================

function getRatingDescriptor(score, identity) {
  return _bridge('getRatingDescriptor', score, identity);
}


function renderOCFoundation(racquet, stringConfig, stats) {
  return _bridge('renderOCFoundation', racquet, stringConfig, stats);
}

function renderOCSnapshot(fitProfile) {
  return _bridge('renderOCSnapshot', fitProfile);
}

// Stat bar grouping for Build DNA
function _statBarColor(val) {
  return _bridge('_statBarColor', val);
}

function renderStatBars(stats) {
  return _bridge('renderStatBars', stats);
}

function renderBuildDNAHighlights(stats) {
  return _bridge('renderBuildDNAHighlights', stats);
}

// ---- Ballistic HUD Tooltip Handler ----
function radarTooltipHandler(context) {
  return _bridge('radarTooltipHandler', context);
}

function renderRadarChart(stats) {
  return _bridge('renderRadarChart', stats);
}

function renderFitProfile(fitProfile) {
  return _bridge('renderFitProfile', fitProfile);
}

function renderFitProfileActive(fitProfile) {
  return _bridge('renderFitProfile', fitProfile);
}

function renderWarnings(warnings) {
  return _bridge('renderWarnings', warnings);
}

// ============================================
// COMPARISON MODE
// ============================================

function toggleComparisonMode() {
  return _bridge('toggleComparisonMode');
}

function addComparisonSlotFromHome() {
  return _bridge('addComparisonSlotFromHome');
}

function addComparisonSlot() {
  return _bridge('addComparisonSlot');
}

function removeComparisonSlot(index) {
  return _bridge('removeComparisonSlot', index);
}

function renderComparisonSlots() {
  return _bridge('renderComparisonSlots');
}

function recalcSlot(index) {
  return _bridge('recalcSlot', index);
}
function updateComparisonRadar() {
  return _bridge('updateComparisonRadar');
}

function renderComparisonDeltas() {
  return _bridge('renderComparisonDeltas');
}

// ============================================
// COMPARE REDESIGN — Summary Cards, Verdict, Matrix
// ============================================

function renderCompareSummaries() {
  return _bridge('renderCompareSummaries');
}

// Fix 2: Build "Load from My Loadouts" dropdown for compare slot editor
// Compare legacy inline-editor helpers are intentionally retired.
function _compareBuildLoadFromSavedDropdown(slotIndex) {
  return '';
}

function _compareLoadFromSaved(slotIndex, loadoutId) {
  return _bridge('_compareLoadFromSaved', slotIndex, loadoutId);
}

function _compareEditorStringHTML(slot, index) {
  return '';
}

function _toggleCompareCardEditor(index) {
  return _bridge('_toggleCompareCardEditor', index);
}

function _compareInitEditorSS(card, index, slot) {}

function openCompareEditor(idx) { _toggleCompareCardEditor(idx); }
function closeCompareEditors() {
  return _bridge('closeCompareEditors');
}

function generateCompareVerdict(slotA, slotB) {
  return _bridge('generateCompareVerdict', slotA, slotB);
}

function renderCompareVerdict() {
  return _bridge('renderCompareVerdict');
}

function renderCompareMatrix() {
  return _bridge('renderCompareMatrix');
}


// ============================================
// PRESETS (dynamic system — see renderHomePresets / renderComparisonPresets)
// ============================================

function setHybridMode(isHybrid) {
  var btnFull = document.getElementById('btn-full');
  var btnHybrid = document.getElementById('btn-hybrid');
  var fullConfig = document.getElementById('full-bed-config');
  var hybridConfig = document.getElementById('hybrid-config');

  if (btnFull) {
    btnFull.classList.toggle('active', !isHybrid);
    btnFull.classList.toggle('bg-dc-platinum', !isHybrid);
    btnFull.classList.toggle('text-dc-void', !isHybrid);
    btnFull.classList.toggle('bg-transparent', isHybrid);
    btnFull.classList.toggle('text-dc-storm', isHybrid);
    btnFull.classList.toggle('hover:text-dc-platinum', isHybrid);
  }
  if (btnHybrid) {
    btnHybrid.classList.toggle('active', isHybrid);
    btnHybrid.classList.toggle('bg-dc-platinum', isHybrid);
    btnHybrid.classList.toggle('text-dc-void', isHybrid);
    btnHybrid.classList.toggle('bg-transparent', !isHybrid);
    btnHybrid.classList.toggle('text-dc-storm', !isHybrid);
    btnHybrid.classList.toggle('hover:text-dc-platinum', !isHybrid);
  }
  if (fullConfig) fullConfig.classList.toggle('hidden', isHybrid);
  if (hybridConfig) hybridConfig.classList.toggle('hidden', !isHybrid);
}

// Global editor change handler
function _onEditorChange() {
  if (typeof window._onEditorChange === 'function' && window._onEditorChange !== _onEditorChange) {
    return window._onEditorChange();
  }
  if (activeLoadout) {
    commitEditorToLoadout();
  } else {
    renderDashboard();
  }
}

// Fix 3: Handle Full Bed <-> Hybrid toggle with confirmation and pre-populate
function _handleHybridToggle(toHybrid) {
  if (typeof window._handleHybridToggle === 'function' && window._handleHybridToggle !== _handleHybridToggle) {
    return window._handleHybridToggle(toHybrid);
  }
}

// ============================================
// TUNE MODE — TENSION TUNING LAB
// ============================================

let isTuneMode = false;
let _tuneRefreshing = false;
let sweepChart = null;
let tuneState = {
  baselineTension: 55,       // The tension from baseline snapshot
  exploredTension: 55,       // The slider's current position
  hybridDimension: 'linked', // 'mains', 'crosses', or 'linked'
  sweepData: null,           // cached sweep results
  baselineStats: null,       // stats at baseline tension (for sweep ref)
  optimalWindow: null,       // { low, high, anchor, reason }

  // --- Sandbox state (frozen baseline vs live exploration) ---
  baseline: null,  // { frameId, stringId, isHybrid, mainsId, crossesId, mainsTension, crossesTension, gauge, mainsGauge, crossesGauge, stats, obs, identity }
  explored: null   // { stats, obs, identity } — recomputed on every slider/string/gauge change
};

function toggleTuneMode() {
  if (typeof window.toggleTuneMode === 'function' && window.toggleTuneMode !== toggleTuneMode) {
    return window.toggleTuneMode();
  }
}

function closeTuneMode() {
  if (typeof window.closeTuneMode === 'function' && window.closeTuneMode !== closeTuneMode) {
    return window.closeTuneMode();
  }
}

// dockBuilderPanel is no longer needed — builder stays permanently in build-dock
// Kept as no-op for any lingering calls
function dockBuilderPanel(inTune) {
  // No-op: builder panel is now permanently in the left build-dock
}

// Auto-refresh Tune panels when user changes setup while Tune is open
function refreshTuneIfActive() {
  if (typeof window.refreshTuneIfActive === 'function' && window.refreshTuneIfActive !== refreshTuneIfActive) {
    return window.refreshTuneIfActive();
  }
}

function getHybridBaselineTension(stringConfig, dimension) {
  if (typeof window.getHybridBaselineTension === 'function' && window.getHybridBaselineTension !== getHybridBaselineTension) {
    return window.getHybridBaselineTension(stringConfig, dimension);
  }
  if (dimension === 'mains') return stringConfig.mainsTension;
  if (dimension === 'crosses') return stringConfig.crossesTension;
  // linked: average
  return Math.round((stringConfig.mainsTension + stringConfig.crossesTension) / 2);
}

function updateSliderLabel() {
  if (typeof window.updateSliderLabel === 'function' && window.updateSliderLabel !== updateSliderLabel) {
    return window.updateSliderLabel();
  }
}

function updateDeltaTitle(stringConfig) {
  if (typeof window.updateDeltaTitle === 'function' && window.updateDeltaTitle !== updateDeltaTitle) {
    return window.updateDeltaTitle(stringConfig);
  }
}

function _tuneStringKey(lo) {
  if (typeof window._tuneStringKey === 'function' && window._tuneStringKey !== _tuneStringKey) {
    return window._tuneStringKey(lo);
  }
  return lo.isHybrid ? (lo.mainsId + '/' + lo.crossesId) : (lo.stringId || '');
}

function initTuneMode(setup) {
  if (typeof window.initTuneMode === 'function' && window.initTuneMode !== initTuneMode) {
    return window.initTuneMode(setup);
  }
}

function runTensionSweep(setup) {
  if (typeof window.runTensionSweep === 'function' && window.runTensionSweep !== runTensionSweep) {
    return window.runTensionSweep(setup);
  }
}

function calculateOptimalWindow(setup) {
  if (typeof window.calculateOptimalWindow === 'function' && window.calculateOptimalWindow !== calculateOptimalWindow) {
    return window.calculateOptimalWindow(setup);
  }
}

function renderOptimalBuildWindow(sMin, sMax) {
  if (typeof window.renderOptimalBuildWindow === 'function' && window.renderOptimalBuildWindow !== renderOptimalBuildWindow) {
    return window.renderOptimalBuildWindow(sMin, sMax);
  }
}

function renderDeltaVsBaseline() {
  if (typeof window.renderDeltaVsBaseline === 'function' && window.renderDeltaVsBaseline !== renderDeltaVsBaseline) {
    return window.renderDeltaVsBaseline();
  }
}

// Update delta battery bars dynamically (like racket bible comp-track)
function _updateDeltaBatteryBars(baseStats, exploredStats, isAtBaseline) {
  const deltaKeys = ['control', 'power', 'comfort', 'spin', 'launch', 'feel', 'playability'];
  const segments = 20;
  
  deltaKeys.forEach(key => {
    const baseVal = Math.round(baseStats[key]);
    const exploredVal = Math.round(exploredStats[key]);
    const diff = exploredVal - baseVal;
    
    const track = document.getElementById(`delta-track-${key}`);
    const diffEl = document.getElementById(`delta-diff-${key}`);
    if (!track) return;
    
    const baseFilled = Math.round((baseVal / 100) * segments);
    const exploredFilled = Math.round((exploredVal / 100) * segments);
    
    // Rebuild segments with before/after visualization
    let segmentsHtml = '';
    for (let i = 0; i < segments; i++) {
      let segClass = 'empty';
      
      if (isAtBaseline) {
        // At baseline - show base value only
        if (i < baseFilled) {
          const segValue = (i / segments) * 100;
          segClass = segValue >= 70 ? 'high active' : 'filled active';
        }
      } else {
        // Exploring - show comparison
        if (exploredVal > baseVal) {
          // Increased - base in normal, increase in accent
          if (i < baseFilled) {
            const segValue = (i / segments) * 100;
            segClass = segValue >= 70 ? 'high active' : 'filled active';
          } else if (i < exploredFilled) {
            segClass = 'high active'; // Increased portion in accent
          }
        } else if (exploredVal < baseVal) {
          // Decreased - explored in darker/reduced, base remainder
          if (i < exploredFilled) {
            const segValue = (i / segments) * 100;
            segClass = segValue >= 70 ? 'high active' : 'filled active';
          } else if (i < baseFilled) {
            segClass = 'empty'; // Lost portion
          }
        } else {
          // Same - show base
          if (i < baseFilled) {
            const segValue = (i / segments) * 100;
            segClass = segValue >= 70 ? 'high active' : 'filled active';
          }
        }
      }
      
      segmentsHtml += `<div class="stat-bar-segment ${segClass}"></div>`;
    }
    
    track.innerHTML = segmentsHtml;
    track.dataset.baseline = baseVal;
    track.dataset.explored = exploredVal;
    
    // Update diff label
    if (diffEl) {
      const cls = diff > 0 ? 'delta-positive' : diff < 0 ? 'delta-negative' : 'delta-neutral';
      const sign = diff > 0 ? '+' : '';
      diffEl.className = `delta-stat-diff ${cls}`;
      diffEl.textContent = isAtBaseline ? '—' : `${sign}${diff}`;
    }
  });
}

// ============================================
// GAUGE EXPLORER — shows how each available gauge shifts stats vs current
// ============================================
function renderGaugeExplorer(setup) {
  if (typeof window.renderGaugeExplorer === 'function' && window.renderGaugeExplorer !== renderGaugeExplorer) {
    return window.renderGaugeExplorer(setup);
  }
}

function renderBaselineMarker(sliderMin, sliderMax) {
  if (typeof window.renderBaselineMarker === 'function' && window.renderBaselineMarker !== renderBaselineMarker) {
    return window.renderBaselineMarker(sliderMin, sliderMax);
  }
}

function renderOptimalZone(sliderMin, sliderMax) {
  if (typeof window.renderOptimalZone === 'function' && window.renderOptimalZone !== renderOptimalZone) {
    return window.renderOptimalZone(sliderMin, sliderMax);
  }
}

function renderSweepChart(setup) {
  if (typeof window.renderSweepChart === 'function' && window.renderSweepChart !== renderSweepChart) {
    return window.renderSweepChart(setup);
  }
}

function renderBestValueMove() {
  if (typeof window.renderBestValueMove === 'function' && window.renderBestValueMove !== renderBestValueMove) {
    return window.renderBestValueMove();
  }
}

// ---- Overall Build Score — Rank Ladder Bar ----

function getObsRingColor() {
  // Digicraft Brutalism — Artful Red when exploring, platinum when static
  // Check if we're in tune mode and tension has been adjusted from baseline
  if (typeof tuneState !== 'undefined' && tuneState.exploredTension !== tuneState.baselineTension) {
    return '#AF0000'; // Artful Red when exploring
  }
  return 'var(--dc-border-active)'; // Platinum when static/saved
}

function getObsBadgeStyle(score) {
  // Digicraft Brutalism — monochrome badge styling
  // Differentiation via opacity, not color
  const isDark = document.documentElement.dataset.theme === 'dark';
  const bg = isDark ? '220, 223, 226' : '26, 26, 26';
  const text = isDark ? '240, 242, 244' : '10, 10, 10';
  
  if (score >= 80) return `background: rgba(${bg}, 0.12); color: rgba(${text}, 0.95);`;
  if (score >= 70) return `background: rgba(${bg}, 0.10); color: rgba(${text}, 0.85);`;
  if (score >= 60) return `background: rgba(${bg}, 0.08); color: rgba(${text}, 0.75);`;
  if (score >= 50) return `background: rgba(${bg}, 0.06); color: rgba(${text}, 0.65);`;
  if (score >= 40) return `background: rgba(${bg}, 0.05); color: rgba(${text}, 0.55);`;
  if (score >= 30) return `background: rgba(${bg}, 0.04); color: rgba(${text}, 0.50);`;
  return `background: rgba(${bg}, 0.03); color: rgba(${text}, 0.45);`;
}

// ---- OBS Counting Animation ----
let _prevObsValues = { tune: null, hero: null, dock: null, mobile: null };

function animateOBS(el, from, to, duration) {
  if (typeof window.animateOBS === 'function' && window.animateOBS !== animateOBS) {
    return window.animateOBS(el, from, to, duration);
  }
}

function renderOverallBuildScore(setup, animate) {
  if (typeof window.renderOverallBuildScore === 'function' && window.renderOverallBuildScore !== renderOverallBuildScore) {
    return window.renderOverallBuildScore(setup, animate);
  }
}

// ---- What To Try Next — 3-bucket contextual recommendations ----

function computeProfileSimilarity(statsA, statsB) {
  // Cosine-like similarity on the 10-attr profile
  let dotP = 0, magA = 0, magB = 0;
  for (const a of WTTN_ATTRS) {
    dotP += statsA[a] * statsB[a];
    magA += statsA[a] * statsA[a];
    magB += statsB[a] * statsB[a];
  }
  return dotP / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-9);
}

function computeDeltas(currentStats, candidateStats) {
  const deltas = {};
  for (const a of WTTN_ATTRS) {
    deltas[a] = Math.round(candidateStats[a] - currentStats[a]);
  }
  return deltas;
}

function topGains(deltas, n = 4) {
  return Object.entries(deltas)
    .filter(([, d]) => d > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([attr, d]) => ({ attr, delta: d }));
}

function topLosses(deltas, n = 3) {
  return Object.entries(deltas)
    .filter(([, d]) => d < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([attr, delta]) => ({ attr, delta }));
}

function generateNetDirection(gains, losses) {
  if (gains.length === 0) return 'Marginal tradeoff';
  const topGain = gains[0].attr;
  const topLoss = losses.length > 0 ? losses[0].attr : null;

  const phrases = {
    comfort:     { gain: 'Softer',    pair: { control: 'less surgical', power: 'less explosive', spin: 'less spin-heavy' } },
    spin:        { gain: 'Spinnier',  pair: { control: 'less precise', comfort: 'firmer', power: 'less raw pace' } },
    power:       { gain: 'More pace', pair: { control: 'less precise', comfort: 'firmer', spin: 'less topspin' } },
    control:     { gain: 'Sharper',   pair: { power: 'less free power', comfort: 'firmer', spin: 'less spin' } },
    feel:        { gain: 'More feel', pair: { power: 'less pace', durability: 'less durable', comfort: 'less padded' } },
    playability: { gain: 'More consistent over time', pair: { power: 'less pop', spin: 'less grip', control: 'less surgical' } },
    durability:  { gain: 'Longer lasting', pair: { feel: 'less feel', comfort: 'firmer', spin: 'less grip' } },
    forgiveness: { gain: 'More forgiving', pair: { control: 'less surgical', feel: 'less feedback', spin: 'less spin' } },
    stability:   { gain: 'More stable', pair: { comfort: 'firmer', feel: 'less delicate', power: 'less explosive' } },
    launch:      { gain: 'Higher launch', pair: { control: 'less flat', stability: 'less locked-in', feel: 'less connected' } },
  };

  const g = phrases[topGain];
  if (!g) return 'Different profile balance';
  let phrase = g.gain;
  if (topLoss && g.pair[topLoss]) phrase += ', ' + g.pair[topLoss];
  else if (topLoss) phrase += ', slightly less ' + WTTN_ATTR_LABELS[topLoss].toLowerCase();

  return phrase;
}

function scoreClosestBetter(currentStats, classification, candidateStats, deltas) {
  const similarity = computeProfileSimilarity(currentStats, candidateStats);
  let weaknessGain = 0;
  for (const w of classification.weakest) {
    weaknessGain += Math.max(0, deltas[w.attr]);
  }
  let strengthLoss = 0;
  for (const s of classification.strongest) {
    strengthLoss += Math.max(0, -deltas[s.attr]);
  }
  // Same family bonus
  const candClass = classifySetup(candidateStats);
  const familyBonus = candClass.family === classification.family ? 8 : 0;

  return (similarity * 30) + (weaknessGain * 3) - (strengthLoss * 4) + familyBonus;
}

function scoreMoreOfWhatYouWant(currentStats, classification, candidateStats, deltas) {
  // Find what the user already excels at / likes — push one strength harder
  // Or find the 2nd-weakest area and boost it meaningfully
  let bestTargetScore = -Infinity;

  // Try each attribute as a "target" — pick the one that scores best
  for (const attr of WTTN_ATTRS) {
    const targetGain = Math.max(0, deltas[attr]);
    if (targetGain < 2) continue; // must be a meaningful gain

    // Secondary gains
    let secondaryGains = 0;
    for (const a of WTTN_ATTRS) {
      if (a !== attr && deltas[a] > 0) secondaryGains += deltas[a] * 0.5;
    }

    // Total loss
    let totalLoss = 0;
    for (const a of WTTN_ATTRS) {
      if (deltas[a] < 0) totalLoss += Math.abs(deltas[a]);
    }

    const score = (targetGain * 5) + secondaryGains - (totalLoss * 1.5);
    if (score > bestTargetScore) bestTargetScore = score;
  }

  return bestTargetScore === -Infinity ? -100 : bestTargetScore;
}

function scoreCorrective(currentStats, classification, candidateStats, deltas) {
  // Biggest weakness fix
  const weakest = classification.weakest[0]; // most limiting
  const fix = Math.max(0, deltas[weakest.attr]);

  // Secondary weakness fixes
  let secondaryFix = 0;
  for (let i = 1; i < classification.weakest.length; i++) {
    secondaryFix += Math.max(0, deltas[classification.weakest[i].attr]) * 0.6;
  }

  // Total loss elsewhere
  let totalLoss = 0;
  for (const a of WTTN_ATTRS) {
    if (deltas[a] < 0) totalLoss += Math.abs(deltas[a]);
  }

  return (fix * 6) + secondaryFix - (totalLoss * 1.0);
}

function candidateSimilarity(statsA, statsB) {
  let sumSqDiff = 0;
  for (const a of WTTN_ATTRS) {
    const d = statsA[a] - statsB[a];
    sumSqDiff += d * d;
  }
  return Math.sqrt(sumSqDiff);
}

function generateWhySentence(bucket, gains, losses, classification) {
  const topG = gains.slice(0, 2).map(g => WTTN_ATTR_LABELS[g.attr].toLowerCase()).join(' and ');
  const topL = losses.length > 0 ? losses[0] : null;

  if (bucket === 'closest') {
    if (topL) return `Preserves the current ${classification.family.replace('-',' ')} identity while improving ${topG}, with minimal ${WTTN_ATTR_LABELS[topL.attr].toLowerCase()} tradeoff.`;
    return `Preserves the current ${classification.family.replace('-',' ')} identity while adding ${topG}.`;
  }
  if (bucket === 'more') {
    return `Pushes ${topG} meaningfully harder${topL ? ', accepting some ' + WTTN_ATTR_LABELS[topL.attr].toLowerCase() + ' loss' : ''}.`;
  }
  if (bucket === 'corrective') {
    const weakName = WTTN_ATTR_LABELS[classification.weakest[0].attr].toLowerCase();
    return `Directly addresses the current setup's ${weakName} weakness${topL ? ', trading some ' + WTTN_ATTR_LABELS[topL.attr].toLowerCase() : ''}.`;
  }
  return 'An alternative profile worth exploring.';
}

function renderWhatToTryNext(setup, allCandidates) {
  if (typeof window.renderWhatToTryNext === 'function' && window.renderWhatToTryNext !== renderWhatToTryNext) {
    return window.renderWhatToTryNext(setup, allCandidates);
  }
}

// ---- Recommended Builds ----
function renderRecommendedBuilds(setup) {
  if (typeof window.renderRecommendedBuilds === 'function' && window.renderRecommendedBuilds !== renderRecommendedBuilds) {
    return window.renderRecommendedBuilds(setup);
  }
}

function renderExplorePrompt(setup, isCurrentInTop, topBuilds) {
  if (typeof window.renderExplorePrompt === 'function' && window.renderExplorePrompt !== renderExplorePrompt) {
    return window.renderExplorePrompt(setup, isCurrentInTop, topBuilds);
  }
}

function onTuneSliderInput(e) {
  if (typeof window.onTuneSliderInput === 'function' && window.onTuneSliderInput !== onTuneSliderInput) {
    return window.onTuneSliderInput(e);
  }
}

// Recompute tuneState.explored from baseline config + current slider tension
function _recomputeExploredState() {
  if (typeof window._recomputeExploredState === 'function' && window._recomputeExploredState !== _recomputeExploredState) {
    return window._recomputeExploredState();
  }
}

function _updateTuneApplyButton() {
  if (typeof window._updateTuneApplyButton === 'function' && window._updateTuneApplyButton !== _updateTuneApplyButton) {
    return window._updateTuneApplyButton();
  }
}

function tuneSandboxCommit() {
  if (typeof window.tuneSandboxCommit === 'function' && window.tuneSandboxCommit !== tuneSandboxCommit) {
    return window.tuneSandboxCommit();
  }
}

function renderTuneHybridToggle(stringConfig) {
  if (typeof window.renderTuneHybridToggle === 'function' && window.renderTuneHybridToggle !== renderTuneHybridToggle) {
    return window.renderTuneHybridToggle(stringConfig);
  }
}

// Bi-directional sync: when Tune slider changes, update main tension inputs
function syncTuneToMain(tension) {
  const setup = getCurrentSetup();
  if (!setup) return;
  const { stringConfig } = setup;

  if (stringConfig.isHybrid) {
    const diff = stringConfig.mainsTension - stringConfig.crossesTension;
    if (tuneState.hybridDimension === 'mains') {
      $('#input-tension-mains').value = tension;
    } else if (tuneState.hybridDimension === 'crosses') {
      $('#input-tension-crosses').value = tension;
    } else {
      $('#input-tension-mains').value = tension;
      $('#input-tension-crosses').value = tension - diff;
    }
  } else {
    // Full Bed: independent tensions with dimension toggle
    const diff = stringConfig.mainsTension - stringConfig.crossesTension;
    if (tuneState.hybridDimension === 'mains') {
      $('#input-tension-full-mains').value = tension;
    } else if (tuneState.hybridDimension === 'crosses') {
      $('#input-tension-full-crosses').value = tension;
    } else {
      // Linked: maintain differential
      $('#input-tension-full-mains').value = tension;
      $('#input-tension-full-crosses').value = tension - diff;
    }
  }
  tuneState.baselineTension = tension;
  tuneState.exploredTension = tension;
  renderDashboard();
}

// Apply explored tension as new baseline
function applyExploredTension() {
  if (typeof window.applyExploredTension === 'function' && window.applyExploredTension !== applyExploredTension) {
    return window.applyExploredTension();
  }
}

// Compare page entry: open tune for a specific comparison slot
function openTuneForSlot(slotIndex) {
  if (typeof window.openTuneForSlot === 'function' && window.openTuneForSlot !== openTuneForSlot) {
    return window.openTuneForSlot(slotIndex);
  }
}

// ============================================
// THEME TOGGLE (imported from src/ui/theme.js)
// ============================================

import { toggleTheme as _toggleThemeBase, getTheme, setTheme, initTheme } from './src/ui/theme.js';

// Wrapper that provides app-specific callbacks to the theme module
function toggleTheme() {
  const callbacks = {
    refreshSlotColors: () => {
      SLOT_COLORS = getSlotColors();
      _setAppSlotColors(SLOT_COLORS);
    },
    refreshRadarChart: () => {
      const setup = getCurrentSetup();
      if (!setup) return;

      const renderRadarChartImpl = typeof window.renderRadarChart === 'function'
        ? window.renderRadarChart
        : renderRadarChart;
      if (typeof renderRadarChartImpl === 'function') {
        const stats = predictSetup(setup.racquet, setup.stringConfig);
        renderRadarChartImpl(stats);
      }
    },
    refreshComparison: () => {
      if (comparisonRadarChart) {
        updateComparisonRadar();
        renderComparisonSlots();
      }
    },
    refreshSweepChart: () => {
      if (sweepChart) {
        sweepChart.destroy();
        sweepChart = null;
        const setup = getCurrentSetup();
        if (setup) renderSweepChart(setup);
      }
    }
  };
  
  const state = {
    currentMode,
    hasSweepChart: !!sweepChart
  };
  
  _toggleThemeBase(callbacks, state);
}

// ============================================
// EVENT LISTENERS
// ============================================

let _initCalled = false;

function init() {
  if (typeof window.init === 'function' && window.init !== init) {
    return window.init();
  }
}

// ============================================
// LANDING SEARCH
// ============================================

function _initLandingSearch() {
  var searchEl = document.getElementById('landing-search');
  var dropdownEl = document.getElementById('landing-search-dropdown');
  if (!searchEl || !dropdownEl) return;

  var selectedIdx = -1;

  function renderResults(query) {
    if (!query || query.length < 1) {
      dropdownEl.classList.add('hidden');
      selectedIdx = -1;
      return;
    }
    var q = query.toLowerCase();
    var matches = RACQUETS.filter(function(r) {
      return r.name.toLowerCase().indexOf(q) >= 0 ||
             (r.identity && r.identity.toLowerCase().indexOf(q) >= 0) ||
             r.id.toLowerCase().indexOf(q) >= 0;
    }).slice(0, 10);

    if (matches.length === 0) {
      dropdownEl.innerHTML = '<div class="landing-dd-empty">No frames found</div>';
      dropdownEl.classList.remove('hidden');
      selectedIdx = -1;
      return;
    }

    selectedIdx = -1;
    dropdownEl.innerHTML = matches.map(function(r, i) {
      return '<div class="landing-dd-item" data-id="' + r.id + '" data-idx="' + i + '">' +
        '<span class="landing-dd-name">' + r.name + '</span>' +
        '<span class="landing-dd-meta">' + r.year + ' \u00b7 ' + (r.identity || '') + '</span>' +
      '</div>';
    }).join('');
    dropdownEl.classList.remove('hidden');

    dropdownEl.querySelectorAll('.landing-dd-item').forEach(function(el) {
      el.addEventListener('mousedown', function(e) {
        e.preventDefault();
        _landingSelectFrame(el.dataset.id);
      });
    });
  }

  function highlightItem(idx) {
    var items = dropdownEl.querySelectorAll('.landing-dd-item');
    items.forEach(function(el, i) {
      el.classList.toggle('landing-dd-active', i === idx);
    });
    if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
  }

  searchEl.addEventListener('input', function() {
    renderResults(searchEl.value);
  });

  searchEl.addEventListener('focus', function() {
    if (searchEl.value.length > 0) renderResults(searchEl.value);
  });

  searchEl.addEventListener('blur', function() {
    setTimeout(function() { dropdownEl.classList.add('hidden'); }, 150);
  });

  searchEl.addEventListener('keydown', function(e) {
    var items = dropdownEl.querySelectorAll('.landing-dd-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
      highlightItem(selectedIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, 0);
      highlightItem(selectedIdx);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && items[selectedIdx]) {
        _landingSelectFrame(items[selectedIdx].dataset.id);
      } else if (items.length > 0) {
        _landingSelectFrame(items[0].dataset.id);
      }
    } else if (e.key === 'Escape') {
      dropdownEl.classList.add('hidden');
      searchEl.blur();
    }
  });
}

function _landingSelectFrame(racquetId) {
  // Switch to Racket Bible and select the frame
  if (!_compendiumInitialized) {
    if (window.initCompendium && window.initCompendium !== initCompendium) {
      window.initCompendium();
    } else {
      initCompendium();
    }
    _compendiumInitialized = true;
  }
  if (window._compSelectFrame && window._compSelectFrame !== _compSelectFrame) {
    window._compSelectFrame(racquetId);
  } else {
    _compSelectFrame(racquetId);
  }
  switchMode('compendium');

  // Also scroll the roster to highlight
  setTimeout(function() {
    var item = document.querySelector('#comp-frame-list > button[data-id="' + racquetId + '"]');
    if (item) item.scrollIntoView({ block: 'center' });
  }, 100);

  // Clear the search
  var searchEl = document.getElementById('landing-search');
  if (searchEl) searchEl.value = '';
  var dropdown = document.getElementById('landing-search-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
}

/* ============================================
   RESPONSIVE HEADER — move mode-switcher on ≤1024px
   ============================================ */
function handleResponsiveHeader() {
  const switcher = document.getElementById('mode-switcher');
  const dockRegion = document.querySelector('.header-dock-region');
  const workspaceRegion = document.querySelector('.header-workspace-region');
  if (!switcher || !dockRegion || !workspaceRegion) return;

  const mql = window.matchMedia('(max-width: 1024px)');

  function onBreakpoint(e) {
    if (e.matches) {
      // Mobile/tablet: move switcher into dock-region
      if (!dockRegion.contains(switcher)) {
        dockRegion.appendChild(switcher);
      }
    } else {
      // Desktop: move switcher back into workspace-region .header-actions
      const actions = workspaceRegion.querySelector('.header-actions');
      const trail = actions && actions.querySelector('.header-actions-trail');
      if (actions && trail && !actions.contains(switcher)) {
        actions.insertBefore(switcher, trail);
      }
    }
  }

  mql.addEventListener('change', onBreakpoint);
  onBreakpoint(mql); // run on load
}

// ============================================
// OPTIMIZE MODE — Build Optimizer / Workbench
// ============================================

// --- Optimizer state ---
let _optExcludedStringIds = new Set();

function initOptimize() {
  if (typeof window.initOptimize === 'function' && window.initOptimize !== initOptimize) {
    return window.initOptimize();
  }
}

// --- Searchable dropdown helper ---
// --- Optimizer multi-select dropdown helpers ---
function _toggleOptMS(msId) {
  if (typeof window._toggleOptMS === 'function' && window._toggleOptMS !== _toggleOptMS) {
    return window._toggleOptMS(msId);
  }
}

function _updateOptMSLabel(containerId, labelId, noun, total) {
  if (typeof window._updateOptMSLabel === 'function' && window._updateOptMSLabel !== _updateOptMSLabel) {
    return window._updateOptMSLabel(containerId, labelId, noun, total);
  }
}

// Close opt dropdowns on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('.opt-multiselect')) {
    document.querySelectorAll('.opt-ms-dropdown').forEach(function(d) { d.classList.add('hidden'); });
  }
});

function _initOptSearchable(inputEl, dropdownEl, hiddenEl, getItems, onSelect) {
  let isOpen = false;

  function render(q) {
    const items = getItems();
    const filtered = q ? items.filter(i => i.name.toLowerCase().includes(q.toLowerCase())) : items;
    if (filtered.length === 0) {
      dropdownEl.classList.add('hidden');
      return;
    }
    dropdownEl.innerHTML = filtered.slice(0, 30).map(i =>
      `<div class="opt-search-item" data-id="${i.id}">${i.name}</div>`
    ).join('');
    dropdownEl.classList.remove('hidden');
    isOpen = true;

    dropdownEl.querySelectorAll('.opt-search-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const id = item.dataset.id;
        const name = item.textContent;
        if (hiddenEl) hiddenEl.value = id;
        inputEl.value = name;
        dropdownEl.classList.add('hidden');
        isOpen = false;
        if (onSelect) onSelect(id, name);
      });
    });
  }

  inputEl.addEventListener('focus', () => render(inputEl.value));
  inputEl.addEventListener('input', () => render(inputEl.value));
  inputEl.addEventListener('blur', () => {
    setTimeout(() => { dropdownEl.classList.add('hidden'); isOpen = false; }, 150);
  });
}

// --- Render exclude tags ---
function _renderExcludeTags() {
  if (typeof window._renderExcludeTags === 'function' && window._renderExcludeTags !== _renderExcludeTags) {
    return window._renderExcludeTags();
  }
}

let _optLastCandidates = null;
let _optLastCurrentOBS = 0;

function runOptimizer() {
  if (typeof window.runOptimizer === 'function' && window.runOptimizer !== runOptimizer) {
    return window.runOptimizer();
  }
}

function _runOptimizerCore(resultsEl, countEl) {
  // Read filters
  const frameSelVal = document.getElementById('opt-frame-value').value;
  const setupType = document.querySelector('.opt-toggle.active')?.dataset.value || 'both';

  // Material filter: get checked materials
  const allowedMaterials = new Set(
    Array.from(document.querySelectorAll('#opt-material-checks input:checked')).map(cb => cb.value)
  );

  // Brand filter: get checked brands
  const allowedBrands = new Set(
    Array.from(document.querySelectorAll('#opt-brand-checks input:checked')).map(cb => cb.value)
  );

  // Hybrid lock
  const lockSide = document.getElementById('opt-lock-side')?.value || 'none';
  const lockStringId = document.getElementById('opt-lock-string-value')?.value || '';
  const lockedString = lockStringId ? STRINGS.find(s => s.id === lockStringId) : null;

  // Filter strings by material, brand, and exclude list
  function isStringAllowed(s) {
    if (_optExcludedStringIds.has(s.id)) return false;
    if (!allowedMaterials.has(s.material)) return false;
    if (!allowedBrands.has(s.name.split(' ')[0])) return false;
    return true;
  }
  const filteredStrings = STRINGS.filter(isStringAllowed);
  const sortBy = document.getElementById('opt-sort').value;
  const tensionMin = parseInt(document.getElementById('opt-tension-min').value) || 40;
  const tensionMax = parseInt(document.getElementById('opt-tension-max').value) || 65;
  const upgradeMode = document.getElementById('opt-upgrade-mode').checked;

  // Stat minimums
  const mins = {
    spin: parseInt(document.getElementById('opt-min-spin').value) || 0,
    control: parseInt(document.getElementById('opt-min-control').value) || 0,
    power: parseInt(document.getElementById('opt-min-power').value) || 0,
    comfort: parseInt(document.getElementById('opt-min-comfort').value) || 0,
    feel: parseInt(document.getElementById('opt-min-feel').value) || 0,
    durability: parseInt(document.getElementById('opt-min-durability').value) || 0,
    playability: parseInt(document.getElementById('opt-min-playability').value) || 0,
    stability: parseInt(document.getElementById('opt-min-stability').value) || 0,
    maneuverability: parseInt(document.getElementById('opt-min-maneuverability').value) || 0
  };

  // Upgrade constraints
  const upgradeOBS = parseFloat(document.getElementById('opt-upgrade-obs').value) || 0;
  const upgradeCtlLoss = parseFloat(document.getElementById('opt-upgrade-ctl-loss').value) || 5;
  const upgradeDurLoss = parseFloat(document.getElementById('opt-upgrade-dur-loss').value) || 10;

  // Get selected frame
  let racquet;
  if (frameSelVal === 'current' || !frameSelVal) {
    // Use active loadout frame, or current setup frame, or first frame
    if (activeLoadout && activeLoadout.frameId) {
      racquet = RACQUETS.find(r => r.id === activeLoadout.frameId) || RACQUETS[0];
    } else {
      const setup = getCurrentSetup();
      racquet = setup ? setup.racquet : RACQUETS[0];
    }
  } else {
    racquet = RACQUETS.find(r => r.id === frameSelVal) || RACQUETS[0];
  }

  // Compute current build OBS for deltas
  let currentOBS = 0;
  let currentStats = null;
  const currentSetup = getCurrentSetup();
  if (currentSetup) {
    currentStats = predictSetup(currentSetup.racquet, currentSetup.stringConfig);
    if (currentStats) {
      const tCtx = buildTensionContext(currentSetup.stringConfig, currentSetup.racquet);
      currentOBS = computeCompositeScore(currentStats, tCtx);
    }
  }

  const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
  const sweepMin = Math.max(tensionMin, 30);
  const sweepMax = Math.min(tensionMax, 75);

  // Helper: find optimal tension for a config within range
  function findOptimalTension(buildConfig) {
    let bestScore = -1, bestTension = midTension, bestStats = null;
    for (let t = sweepMin; t <= sweepMax; t += 1) {
      const cfg = { ...buildConfig };
      cfg.mainsTension = t;
      cfg.crossesTension = t - (buildConfig.isHybrid ? 2 : 0);
      const stats = predictSetup(racquet, cfg);
      if (!stats) continue;
      const tCtx = buildTensionContext(cfg, racquet);
      const score = computeCompositeScore(stats, tCtx);
      if (score > bestScore) {
        bestScore = score;
        bestTension = t;
        bestStats = stats;
      }
    }
    return { score: bestScore, tension: bestTension, stats: bestStats };
  }

  let candidates = [];

  // --- FULL BED candidates ---
  if (setupType === 'full' || setupType === 'both') {
    filteredStrings.forEach(s => {
      const result = findOptimalTension({ isHybrid: false, string: s });
      if (result.stats) {
        candidates.push({
          type: 'full',
          label: s.name,
          gauge: (s.gauge || '').replace(/\s*\(.*\)/, ''),
          tension: result.tension,
          crossesTension: result.tension,
          score: result.score,
          stats: result.stats,
          stringData: s,
          racquet: racquet
        });
      }
    });
  }

  // --- HYBRID candidates ---
  if (setupType === 'hybrid' || setupType === 'both') {
    let hybridMainsPool, hybridCrossesPool;

    if (lockSide === 'mains' && lockedString) {
      // Locked mains: sweep all filtered crosses
      hybridMainsPool = [lockedString];
      hybridCrossesPool = filteredStrings.filter(s => s.id !== lockedString.id);
    } else if (lockSide === 'crosses' && lockedString) {
      // Locked crosses: sweep all filtered mains
      hybridMainsPool = filteredStrings;
      hybridCrossesPool = [lockedString];
    } else {
      // No lock: smart pairing — top 12 mains + gut/multi, suitable crosses
      const tempFullForRanking = [];
      filteredStrings.forEach(s => {
        const result = findOptimalTension({ isHybrid: false, string: s });
        if (result.stats) tempFullForRanking.push({ stringId: s.id, score: result.score });
      });
      tempFullForRanking.sort((a, b) => b.score - a.score);
      const topMainsIds = new Set(tempFullForRanking.slice(0, 12).map(c => c.stringId));
      filteredStrings.forEach(s => {
        if (s.material === 'Natural Gut' || s.material === 'Multifilament') topMainsIds.add(s.id);
      });
      hybridMainsPool = filteredStrings.filter(s => topMainsIds.has(s.id));

      // Cross candidates: round/slick/elastic/soft polys from filtered pool
      hybridCrossesPool = filteredStrings.filter(s => {
        const shape = (s.shape || '').toLowerCase();
        const isRoundSlick = shape.includes('round') || shape.includes('slick') || shape.includes('coated');
        const isElastic = s.material === 'Co-Polyester (elastic)';
        const isSoftPoly = s.material === 'Polyester' && s.stiffness < 200;
        return isRoundSlick || isElastic || isSoftPoly;
      });
    }

    hybridMainsPool.forEach(mains => {
      hybridCrossesPool.forEach(cross => {
        if (cross.id === mains.id) return;
        const result = findOptimalTension({ isHybrid: true, mains, crosses: cross });
        if (result.stats && result.score > 0) {
          candidates.push({
            type: 'hybrid',
            label: `${mains.name} / ${cross.name}`,
            gauge: ((mains.gauge || '').replace(/\s*\(.*\)/, '') + '/' + (cross.gauge || '').replace(/\s*\(.*\)/, '')),
            tension: result.tension,
            crossesTension: result.tension - 2,
            score: result.score,
            stats: result.stats,
            mainsData: mains,
            crossesData: cross,
            racquet: racquet
          });
        }
      });
    });
  }

  // --- Filter by stat minimums ---
  candidates = candidates.filter(c => {
    return c.stats.spin >= mins.spin &&
           c.stats.control >= mins.control &&
           c.stats.power >= mins.power &&
           c.stats.comfort >= mins.comfort &&
           c.stats.feel >= mins.feel &&
           c.stats.durability >= mins.durability &&
           c.stats.playability >= mins.playability &&
           c.stats.stability >= mins.stability &&
           c.stats.maneuverability >= mins.maneuverability;
  });

  // --- Upgrade mode filtering ---
  if (upgradeMode && currentStats) {
    candidates = candidates.filter(c => {
      if (c.score < currentOBS + upgradeOBS) return false;
      if (currentStats.control - c.stats.control > upgradeCtlLoss) return false;
      if (currentStats.durability - c.stats.durability > upgradeDurLoss) return false;
      return true;
    });
  }

  // --- Sort ---
  candidates.sort((a, b) => {
    if (sortBy === 'obs') return b.score - a.score;
    return (b.stats[sortBy] || 0) - (a.stats[sortBy] || 0);
  });

  // Store for re-sorting
  _optLastCandidates = candidates;
  _optLastCurrentOBS = currentOBS;

  countEl.textContent = `${candidates.length} result${candidates.length !== 1 ? 's' : ''}`;
  renderOptimizerResults(candidates, sortBy, currentOBS);
}

function renderOptimizerResults(candidates, sortBy, currentOBS) {
  if (typeof window.renderOptimizerResults === 'function' && window.renderOptimizerResults !== renderOptimizerResults) {
    return window.renderOptimizerResults(candidates, sortBy, currentOBS);
  }
}

// Fix 5: Apply target tension filter to optimizer results (client-side only)
function _optApplyTensionFilter(value) {
  if (typeof window._optApplyTensionFilter === 'function' && window._optApplyTensionFilter !== _optApplyTensionFilter) {
    return window._optApplyTensionFilter(value);
  }
}

// Clear tension filter when running new optimization
function _optClearTensionFilter() {
  if (typeof window._optClearTensionFilter === 'function' && window._optClearTensionFilter !== _optClearTensionFilter) {
    return window._optClearTensionFilter();
  }
}

// --- Row action handlers ---

function _optBuildPresetData(candidate) {
  if (typeof window._optBuildPresetData === 'function' && window._optBuildPresetData !== _optBuildPresetData) {
    return window._optBuildPresetData(candidate);
  }
}

function optActionView(idx) {
  if (typeof window.optActionView === 'function' && window.optActionView !== optActionView) {
    return window.optActionView(idx);
  }
}

function optActionTune(idx) {
  if (typeof window.optActionTune === 'function' && window.optActionTune !== optActionTune) {
    return window.optActionTune(idx);
  }
}

function optActionCompare(idx) {
  if (typeof window.optActionCompare === 'function' && window.optActionCompare !== optActionCompare) {
    return window.optActionCompare(idx);
  }
}

function optActionSave(idx) {
  if (typeof window.optActionSave === 'function' && window.optActionSave !== optActionSave) {
    return window.optActionSave(idx);
  }
}

// ============================================
// FIND MY BUILD — Guided Playstyle Wizard
// ============================================

let _fmbStep = 1;
const _fmbAnswers = { swing: null, ball: null, court: null, painPoints: [], priorities: [] };
let _fmbCurrentFrames = []; // stores ranked frame results for index-based action handlers

function openFindMyBuild() {
  if (typeof window.openFindMyBuild === 'function' && window.openFindMyBuild !== openFindMyBuild) {
    return window.openFindMyBuild();
  }
}

function closeFindMyBuild() {
  if (typeof window.closeFindMyBuild === 'function' && window.closeFindMyBuild !== closeFindMyBuild) {
    return window.closeFindMyBuild();
  }
}

function _fmbShowStep(step) {
  if (typeof window._fmbShowStep === 'function' && window._fmbShowStep !== _fmbShowStep) {
    return window._fmbShowStep(step);
  }
}

function _fmbUpdateNextState() {
  if (typeof window._fmbUpdateNextState === 'function' && window._fmbUpdateNextState !== _fmbUpdateNextState) {
    return window._fmbUpdateNextState();
  }
}

function fmbBack() {
  if (typeof window.fmbBack === 'function' && window.fmbBack !== fmbBack) {
    return window.fmbBack();
  }
}

function fmbNext() {
  if (typeof window.fmbNext === 'function' && window.fmbNext !== fmbNext) {
    return window.fmbNext();
  }
}

// Wire option click handlers (delegated)
document.addEventListener('click', (e) => {
  const option = e.target.closest('.fmb-option');
  if (!option) return;

  const container = option.closest('.fmb-options');
  if (!container) return;

  const key = container.dataset.key;
  const value = option.dataset.value;
  const isMulti = container.classList.contains('fmb-options-multi');
  const maxSel = parseInt(container.dataset.max) || 99;
  const isPriority = container.classList.contains('fmb-options-priority');

  if (isMulti) {
    if (isPriority) {
      // Priority: ordered selection with numbered badges
      const arr = _fmbAnswers[key];
      const idx = arr.indexOf(value);
      if (idx >= 0) {
        // Deselect: remove and renumber
        arr.splice(idx, 1);
        option.classList.remove('selected');
        const badge = option.querySelector('.fmb-priority-badge');
        if (badge) badge.remove();
        // Renumber remaining
        container.querySelectorAll('.fmb-option.selected').forEach(btn => {
          const bv = btn.dataset.value;
          const bi = arr.indexOf(bv);
          const bg = btn.querySelector('.fmb-priority-badge');
          if (bg) bg.textContent = bi + 1;
        });
      } else if (arr.length < maxSel) {
        arr.push(value);
        option.classList.add('selected');
        const badge = document.createElement('span');
        badge.className = 'fmb-priority-badge';
        badge.textContent = arr.length;
        option.appendChild(badge);
      }
      _fmbAnswers[key] = arr;
    } else {
      // Standard multi-select (pain points)
      const arr = _fmbAnswers[key];
      const idx = arr.indexOf(value);
      if (idx >= 0) {
        arr.splice(idx, 1);
        option.classList.remove('selected');
      } else if (arr.length < maxSel) {
        arr.push(value);
        option.classList.add('selected');
      }
      _fmbAnswers[key] = arr;
    }
  } else {
    // Single select
    container.querySelectorAll('.fmb-option').forEach(b => b.classList.remove('selected'));
    option.classList.add('selected');
    _fmbAnswers[key] = value;
  }

  _fmbUpdateNextState();
});

function _fmbGenerateProfile(answers) {
  if (typeof window._fmbGenerateProfile === 'function' && window._fmbGenerateProfile !== _fmbGenerateProfile) {
    return window._fmbGenerateProfile(answers);
  }
}

function _fmbShowResults(profile) {
  if (typeof window._fmbShowResults === 'function' && window._fmbShowResults !== _fmbShowResults) {
    return window._fmbShowResults(profile);
  }
}

let _fmbLastProfile = null;

function _fmbSearchDirection(direction) {
  if (typeof window._fmbSearchDirection === 'function' && window._fmbSearchDirection !== _fmbSearchDirection) {
    return window._fmbSearchDirection(direction);
  }
}

// ============================================
// COMPENDIUM — Frame-Centric Exploration
// ============================================

const _compendiumBuildCache = {};
let _compSelectedRacquetId = null;
let _compSortKey = 'score';
let _compCurrentBuilds = []; // stores sorted builds for current frame (for index-based action handlers)

// ============================================
// COMPENDIUM V2 — RACKET SHOWROOM
// ============================================

// String compendium global state (declared before use)
let _stringSelectedId = null;
let _stringsInitialized = false;

// String Modulator State (for frame injection)
let _stringModState = {
  stringId: null,
  frameId: null,
  mode: 'fullbed',
  gauge: '',
  mainsTension: 52,
  crossesTension: 50,
  baseStats: null,
  previewStats: null
};

// Tab switching for pill bar
function _compSwitchTab(tab) {
  if (typeof window._compSwitchTab === 'function' && window._compSwitchTab !== _compSwitchTab) {
    return window._compSwitchTab(tab);
  }
}

// Toggle Query HUD overlay with scroll-lock
function _compToggleHud() {
  if (typeof window._compToggleHud === 'function' && window._compToggleHud !== _compToggleHud) {
    return window._compToggleHud();
  }
}

// ============================================
// STRING COMPENDIUM
// ============================================

// Toggle String HUD overlay
function _stringToggleHud() {
  if (typeof window._stringToggleHud === 'function' && window._stringToggleHud !== _stringToggleHud) {
    return window._stringToggleHud();
  }
}

// Get filtered strings based on search and filters
function _stringGetFilteredStrings() {
  if (typeof window._stringGetFilteredStrings === 'function' && window._stringGetFilteredStrings !== _stringGetFilteredStrings) {
    return window._stringGetFilteredStrings();
  }
}

// Sync String Compendium state with active loadout
function _stringSyncWithActiveLoadout() {
  if (typeof window._stringSyncWithActiveLoadout === 'function' && window._stringSyncWithActiveLoadout !== _stringSyncWithActiveLoadout) {
    return window._stringSyncWithActiveLoadout();
  }
}

// Render string roster in HUD
function _stringRenderRoster() {
  if (typeof window._stringRenderRoster === 'function' && window._stringRenderRoster !== _stringRenderRoster) {
    return window._stringRenderRoster();
  }
}

// Get string archetype based on twScore
function _stringGetArchetype(s) {
  if (typeof window._stringGetArchetype === 'function' && window._stringGetArchetype !== _stringGetArchetype) {
    return window._stringGetArchetype(s);
  }
}

// Select string and render main content
function _stringSelectString(stringId) {
  if (typeof window._stringSelectString === 'function' && window._stringSelectString !== _stringSelectString) {
    return window._stringSelectString(stringId);
  }
}

// Generate "Best for" and "Watch out" pills for strings
function _stringGeneratePills(string) {
  if (typeof window._stringGeneratePills === 'function' && window._stringGeneratePills !== _stringGeneratePills) {
    return window._stringGeneratePills(string);
  }
}

// Render string battery bars from twScore
function _stringRenderBatteryBars(string) {
  if (typeof window._stringRenderBatteryBars === 'function' && window._stringRenderBatteryBars !== _stringRenderBatteryBars) {
    return window._stringRenderBatteryBars(string);
  }
}

// Find similar strings based on twScore profile
function _stringFindSimilarStrings(sourceId, limit = 4) {
  if (typeof window._stringFindSimilarStrings === 'function' && window._stringFindSimilarStrings !== _stringFindSimilarStrings) {
    return window._stringFindSimilarStrings(sourceId, limit);
  }
}

// Find best frames for this string
function _stringFindBestFrames(stringId, limit = 4) {
  if (typeof window._stringFindBestFrames === 'function' && window._stringFindBestFrames !== _stringFindBestFrames) {
    return window._stringFindBestFrames(stringId, limit);
  }
}

// Render main string content
function _stringRenderMain(string) {
  if (typeof window._stringRenderMain === 'function' && window._stringRenderMain !== _stringRenderMain) {
    return window._stringRenderMain(string);
  }
}
// ============================================
// STRING MODULATOR (Frame Injection)
// ============================================

function _stringInitModulator(string) {
  if (typeof window._stringInitModulator === 'function' && window._stringInitModulator !== _stringInitModulator) {
    return window._stringInitModulator(string);
  }
}

function _stringSetModMode(mode) {
  if (typeof window._stringSetModMode === 'function' && window._stringSetModMode !== _stringSetModMode) {
    return window._stringSetModMode(mode);
  }
}

function _stringOnCrossesStringChange(crossesId) {
  if (typeof window._stringOnCrossesStringChange === 'function' && window._stringOnCrossesStringChange !== _stringOnCrossesStringChange) {
    return window._stringOnCrossesStringChange(crossesId);
  }
}

function _stringOnCrossesGaugeChange(gauge) {
  if (typeof window._stringOnCrossesGaugeChange === 'function' && window._stringOnCrossesGaugeChange !== _stringOnCrossesGaugeChange) {
    return window._stringOnCrossesGaugeChange(gauge);
  }
}

function _stringOnFrameChange(frameId) {
  if (typeof window._stringOnFrameChange === 'function' && window._stringOnFrameChange !== _stringOnFrameChange) {
    return window._stringOnFrameChange(frameId);
  }
}

function _stringOnGaugeChange(gauge) {
  if (typeof window._stringOnGaugeChange === 'function' && window._stringOnGaugeChange !== _stringOnGaugeChange) {
    return window._stringOnGaugeChange(gauge);
  }
}

function _stringOnTensionChange(type, value) {
  if (typeof window._stringOnTensionChange === 'function' && window._stringOnTensionChange !== _stringOnTensionChange) {
    return window._stringOnTensionChange(type, value);
  }
}

function _stringUpdatePreview() {
  if (typeof window._stringUpdatePreview === 'function' && window._stringUpdatePreview !== _stringUpdatePreview) {
    return window._stringUpdatePreview();
  }
}

function _stringRenderPreviewBars(baseStats, previewStats) {
  if (typeof window._stringRenderPreviewBars === 'function' && window._stringRenderPreviewBars !== _stringRenderPreviewBars) {
    return window._stringRenderPreviewBars(baseStats, previewStats);
  }
}

function _stringClearPreview() {
  if (typeof window._stringClearPreview === 'function' && window._stringClearPreview !== _stringClearPreview) {
    return window._stringClearPreview();
  }
}

function _stringAddToLoadout() {
  if (typeof window._stringAddToLoadout === 'function' && window._stringAddToLoadout !== _stringAddToLoadout) {
    return window._stringAddToLoadout();
  }
}

function _stringSetActiveLoadout() {
  if (typeof window._stringSetActiveLoadout === 'function' && window._stringSetActiveLoadout !== _stringSetActiveLoadout) {
    return window._stringSetActiveLoadout();
  }
}

// Generate "Best for" and "Watch out" pills based on frame stats
function _compGenerateHeroPills(frameStats, racquet) {
  const bestFor = [];
  const watchOut = [];
  
  // Console-style uppercase output for Digicraft bento aesthetic
  if (frameStats.spin >= 65) bestFor.push('TOPSPIN BASELINERS');
  if (frameStats.power >= 65) bestFor.push('FREE POWER SEEKERS');
  if (frameStats.control >= 65) bestFor.push('FLAT HIT PRECISION');
  if (frameStats.comfort >= 65) bestFor.push('ARM-FRIENDLY SESSIONS');
  if (frameStats.maneuverability >= 65) bestFor.push('FAST SWING STYLES');
  if (frameStats.stability >= 65) bestFor.push('HEAVY HITTERS');
  if (frameStats.feel >= 65) bestFor.push('TOUCH PLAYERS');
  
  if (frameStats.control < 55) watchOut.push('LOWER CONTROL CEILING');
  if (frameStats.comfort < 55) watchOut.push('HARSH ON ARM');
  if (frameStats.power < 55) watchOut.push('LESS FREE POWER');
  if (frameStats.stability < 55) watchOut.push('TWIST OFF-CENTER');
  if (frameStats.maneuverability < 55) watchOut.push('DEMANDS FAST PREP');
  if (racquet.strungWeight > 325) watchOut.push('HEAVY TECHNIQUE REQ');
  if (racquet.strungWeight < 290) watchOut.push('LIGHT PLOW-THROUGH');
  
  return { bestFor, watchOut };
}

// Generate reason text for featured build card
function _compGenerateBuildReason(build, frameStats) {
  return generateBuildReason(build, frameStats);
}

function initCompendium() {
  if (typeof window.initCompendium === 'function' && window.initCompendium !== initCompendium) {
    return window.initCompendium();
  }
}

function _extractBrand(name) {
  // Extract brand from racquet name (first word, or "Wilson" for "Wilson Pro Staff", etc.)
  const brandMap = {
    'Babolat': 'Babolat', 'Head': 'Head', 'Wilson': 'Wilson',
    'Yonex': 'Yonex', 'Tecnifibre': 'Tecnifibre', 'Prince': 'Prince',
    'Dunlop': 'Dunlop', 'Volkl': 'Volkl'
  };
  for (const [key, brand] of Object.entries(brandMap)) {
    if (name.startsWith(key)) return brand;
  }
  return name.split(' ')[0];
}

function _compGetFilteredRacquets() {
  if (typeof window._compGetFilteredRacquets === 'function' && window._compGetFilteredRacquets !== _compGetFilteredRacquets) {
    return window._compGetFilteredRacquets();
  }
}

function _compRenderRoster() {
  if (typeof window._compRenderRoster === 'function' && window._compRenderRoster !== _compRenderRoster) {
    return window._compRenderRoster();
  }
}

function _compSelectFrame(racquetId) {
  if (typeof window._compSelectFrame === 'function' && window._compSelectFrame !== _compSelectFrame) {
    return window._compSelectFrame(racquetId);
  }
}

// Sync racket bible with active loadout (called when switching back to compendium mode)
function _compSyncWithActiveLoadout() {
  if (typeof window._compSyncWithActiveLoadout === 'function' && window._compSyncWithActiveLoadout !== _compSyncWithActiveLoadout) {
    return window._compSyncWithActiveLoadout();
  }
}

function _compRenderMain(racquet) {
  if (typeof window._compRenderMain === 'function' && window._compRenderMain !== _compRenderMain) {
    return window._compRenderMain(racquet);
  }
}

// Global state for string injection
let _compInjectState = {
  racquet: null,
  mainsId: '',
  crossesId: '',
  mode: 'fullbed',
  baseStats: null
};

// Update mode UI only (for initialization - doesn't modify state)
function _compUpdateInjectModeUI(mode) {
  if (typeof window._compUpdateInjectModeUI === 'function' && window._compUpdateInjectModeUI !== _compUpdateInjectModeUI) {
    return window._compUpdateInjectModeUI(mode);
  }
}

// Set injection mode (fullbed/hybrid) - for user clicks, modifies state
function _compSetInjectMode(mode) {
  if (typeof window._compSetInjectMode === 'function' && window._compSetInjectMode !== _compSetInjectMode) {
    return window._compSetInjectMode(mode);
  }
}

// Initialize searchable selects for string matrix injector
function _compInitStringInjector(racquet) {
  if (typeof window._compInitStringInjector === 'function' && window._compInitStringInjector !== _compInitStringInjector) {
    return window._compInitStringInjector(racquet);
  }
}

// Populate gauge dropdown for a string
function _compPopulateGaugeDropdown(selectId, stringId) {
  if (typeof window._compPopulateGaugeDropdown === 'function' && window._compPopulateGaugeDropdown !== _compPopulateGaugeDropdown) {
    return window._compPopulateGaugeDropdown(selectId, stringId);
  }
}

// Preview stats with string injection
function _compPreviewStats() {
  if (typeof window._compPreviewStats === 'function' && window._compPreviewStats !== _compPreviewStats) {
    return window._compPreviewStats();
  }
}

// Render preview bars showing before/after (Tailwind battery style)
function _compRenderPreviewBars(baseStats, previewStats) {
  if (typeof window._compRenderPreviewBars === 'function' && window._compRenderPreviewBars !== _compRenderPreviewBars) {
    return window._compRenderPreviewBars(baseStats, previewStats);
  }
}

// Clear preview and reset to base stats (Tailwind)
function _compClearPreview() {
  if (typeof window._compClearPreview === 'function' && window._compClearPreview !== _compClearPreview) {
    return window._compClearPreview();
  }
}

// Apply injection to create a new loadout
function _compApplyInjection() {
  if (typeof window._compApplyInjection === 'function' && window._compApplyInjection !== _compApplyInjection) {
    return window._compApplyInjection();
  }
}

// Clear injection and reset all fields
function _compClearInjection() {
  if (typeof window._compClearInjection === 'function' && window._compClearInjection !== _compClearInjection) {
    return window._compClearInjection();
  }
}

function _compGenerateTopBuilds(racquet, count) {
  if (typeof window._compGenerateTopBuilds === 'function' && window._compGenerateTopBuilds !== _compGenerateTopBuilds) {
    return window._compGenerateTopBuilds(racquet, count);
  }
}

function _compPickDiverseBuilds(builds, count) {
  if (typeof window._compPickDiverseBuilds === 'function' && window._compPickDiverseBuilds !== _compPickDiverseBuilds) {
    return window._compPickDiverseBuilds(builds, count);
  }
}

// Digicraft Brutalism — monochrome archetype colors imported from presets.js
const _compArchetypeColors = ARCHETYPE_COLORS;

function _compRenderBuildCard(build, index, racquet, frameStats) {
  if (typeof window._compRenderBuildCard === 'function' && window._compRenderBuildCard !== _compRenderBuildCard) {
    return window._compRenderBuildCard(build, index, racquet, frameStats);
  }
}

function _compSetSort(key) {
  if (typeof window._compSetSort === 'function' && window._compSetSort !== _compSetSort) {
    return window._compSetSort(key);
  }
}

// --- Build card action handlers ---
// Unified action handler — reads full build data from _compCurrentBuilds by index.
// Correctly handles both full-bed and hybrid builds.

function _compCreateLoadoutFromBuild(build) {
  if (typeof window._compCreateLoadoutFromBuild === 'function' && window._compCreateLoadoutFromBuild !== _compCreateLoadoutFromBuild) {
    return window._compCreateLoadoutFromBuild(build);
  }
}

function _compAction(action, buildIndex, evt) {
  if (typeof window._compAction === 'function' && window._compAction !== _compAction) {
    return window._compAction(action, buildIndex, evt);
  }
}

function _compAddBuildToCompare(build) {
  if (typeof window._compAddBuildToCompare === 'function' && window._compAddBuildToCompare !== _compAddBuildToCompare) {
    return window._compAddBuildToCompare(build);
  }
}

// Legacy scalar-param compare handler — used by _addSuggestionToCompare and _compareQuickAdd
// These flows only produce full-bed slots from dropdown selections.
function _compActionCompare(racquetId, stringId, tension) {
  if (typeof window._compActionCompare === 'function' && window._compActionCompare !== _compActionCompare) {
    return window._compActionCompare(racquetId, stringId, tension);
  }
}

// ============================================
// FMB — Frame-First Result Helpers
// ============================================

function _fmbRankFrames(profile) {
  if (typeof window._fmbRankFrames === 'function' && window._fmbRankFrames !== _fmbRankFrames) {
    return window._fmbRankFrames(profile);
  }
}

function _fmbRenderFrameCard(fr, idx) {
  if (typeof window._fmbRenderFrameCard === 'function' && window._fmbRenderFrameCard !== _fmbRenderFrameCard) {
    return window._fmbRenderFrameCard(fr, idx);
  }
}

// Unified FMB action handler — reads full build data by frame+build index
function _fmbAction(action, frameIdx, buildIdx, btn) {
  if (typeof window._fmbAction === 'function' && window._fmbAction !== _fmbAction) {
    return window._fmbAction(action, frameIdx, buildIdx, btn);
  }
}

// Legacy aliases for backward compat
function _fmbActivateBuild(racquetId, stringId, tension) {
  var lo = createLoadout(racquetId, stringId, tension, { source: 'quiz' });
  if (lo) { closeFindMyBuild(); activateLoadout(lo); switchMode('overview'); renderDashboard(); }
}
function _fmbSaveBuild(racquetId, stringId, tension, btn) {
  var lo = createLoadout(racquetId, stringId, tension, { source: 'quiz' });
  if (lo) { saveLoadout(lo); if (btn) { btn.textContent = 'Saved \u2713'; btn.disabled = true; setTimeout(function() { btn.textContent = 'Save'; btn.disabled = false; }, 1500); } }
}

// Legacy alias
function _fmbSelectBuild(racquetId, stringId, tension) {
  _fmbActivateBuild(racquetId, stringId, tension);
}

// ============================================
// FEATURE: Apply-to-Loadout for WTTN + Rec Builds
// ============================================

function _applyWttnBuild(btn) {
  if (typeof window._applyWttnBuild === 'function' && window._applyWttnBuild !== _applyWttnBuild) {
    return window._applyWttnBuild(btn);
  }
}

function _applyRecBuild(racquetId, stringId, tension, type, mainsId, crossesId) {
  if (typeof window._applyRecBuild === 'function' && window._applyRecBuild !== _applyRecBuild) {
    return window._applyRecBuild(racquetId, stringId, tension, type, mainsId, crossesId);
  }
}

function _saveWttnBuild(btn) {
  if (typeof window._saveWttnBuild === 'function' && window._saveWttnBuild !== _saveWttnBuild) {
    return window._saveWttnBuild(btn);
  }
}

function _saveRecBuild(racquetId, stringId, tension, type, mainsId, crossesId) {
  if (typeof window._saveRecBuild === 'function' && window._saveRecBuild !== _saveRecBuild) {
    return window._saveRecBuild(racquetId, stringId, tension, type, mainsId, crossesId);
  }
  var opts = { source: 'manual' };
  if (type === 'hybrid' && mainsId && crossesId) {
    opts.isHybrid = true;
    opts.mainsId = mainsId;
    opts.crossesId = crossesId;
    opts.crossesTension = tension - 2;
  }
  var lo = createLoadout(racquetId, type === 'hybrid' ? mainsId : stringId, tension, opts);
  if (lo) saveLoadout(lo);
}

// ============================================
// FEATURE: Original Tension Marker
// ============================================

function renderOriginalTensionMarker() {
  if (typeof window.renderOriginalTensionMarker === 'function' && window.renderOriginalTensionMarker !== renderOriginalTensionMarker) {
    return window.renderOriginalTensionMarker();
  }
}

// ============================================
// FEATURE: Gauge Selection Apply
// ============================================

function _applyGaugeSelection(gauge, sectionIdx) {
  var setup = getCurrentSetup();
  if (!setup) return;

  var stringConfig = setup.stringConfig;

  if (stringConfig.isHybrid) {
    var gaugeSelectId = sectionIdx === 0 ? 'gauge-select-mains' : 'gauge-select-crosses';
    var gaugeEl = document.getElementById(gaugeSelectId);
    if (gaugeEl) {
      for (var i = 0; i < gaugeEl.options.length; i++) {
        if (Math.abs(parseFloat(gaugeEl.options[i].value) - gauge) < 0.005) {
          gaugeEl.value = gaugeEl.options[i].value;
          break;
        }
      }
    }
  } else {
    var gEl = document.getElementById('gauge-select-full');
    if (gEl) {
      for (var j = 0; j < gEl.options.length; j++) {
        if (Math.abs(parseFloat(gEl.options[j].value) - gauge) < 0.005) {
          gEl.value = gEl.options[j].value;
          break;
        }
      }
    }
  }

  // Commit gauge change to active loadout BEFORE re-rendering
  if (activeLoadout) {
    commitEditorToLoadout();
  }

  renderDashboard();

  var newSetup = getCurrentSetup();
  if (newSetup && currentMode === 'tune') {
    initTuneMode(newSetup);
  }
}

// ============================================
// FEATURE: Compare Preset Suggestions
// ============================================

function _renderCompareSuggestions() {
}

function _addSuggestionToCompare(frameId, stringId, tension) {
  _compActionCompare(frameId, stringId, tension);
}

// ============================================
// FEATURE: Compare Slot Loadout Tags
// ============================================

function _getCompareSlotTag(slot) {
  return '';
}

// ============================================
// FEATURE: Compare Auto-Fill + Quick Add Prompt
// ============================================

function _addLoadoutAsSlot(lo) {
  if (typeof window.compareAddLoadoutToPreferredSlot === 'function') {
    return window.compareAddLoadoutToPreferredSlot(lo);
  }
}
function _isCompareSlotStale(slot) {
  return false;
}

function _refreshCompareSlot(slotIndex) {
  if (typeof window._refreshCompareSlot === 'function' && window._refreshCompareSlot !== _refreshCompareSlot) {
    return window._refreshCompareSlot(slotIndex);
  }
}


function _autoFillCompareFromSaved() {
  if (typeof window.compareAutoFillFromSaved === 'function') {
    return window.compareAutoFillFromSaved();
  }
}

function _showCompareQuickAddPrompt() {
  if (typeof window._showCompareQuickAddPrompt === 'function' && window._showCompareQuickAddPrompt !== _showCompareQuickAddPrompt) {
    return window._showCompareQuickAddPrompt();
  }
}

function _compareQuickAdd() {
  if (typeof window._compareQuickAdd === 'function' && window._compareQuickAdd !== _compareQuickAdd) {
    return window._compareQuickAdd();
  }
}

function _init16x19Favicon() {
  const favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) return;
  
  // Create SVG data URIs for blinking favicon
  const idleSvg = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" fill="none" stroke="%23FF4500" stroke-width="1.5"/><text x="8" y="11" font-family="monospace" font-size="7" fill="%23DCDFE2" text-anchor="middle">16</text></svg>`;
  const activeSvg = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" fill="none" stroke="%23FF4500" stroke-width="1.5"/><text x="8" y="11" font-family="monospace" font-size="7" fill="%23FF4500" text-anchor="middle">X</text></svg>`;
  
  let isTick = true;
  setInterval(() => {
    favicon.href = isTick ? activeSvg : idleSvg;
    isTick = !isTick;
  }, 1000);
}

function _runDigicraftBootSequence() {
  const loader = document.getElementById('dc-boot-loader');
  const batteryTrack = document.getElementById('dc-boot-battery');
  const pctText = document.getElementById('dc-boot-pct');
  const logsContainer = document.getElementById('dc-boot-logs');

  if (!loader) return;

  const totalSegments = 10;
  let segments = [];
  for (let i = 0; i < totalSegments; i++) {
    const seg = document.createElement('div');
    seg.className = "flex-1 bg-black/10 dark:bg-white/5 transition-colors duration-75";
    batteryTrack.appendChild(seg);
    segments.push(seg);
  }

  const logs = [
    "> Loading 16x19.core.js...",
    "> Fetching global frame database...",
    "> Booting String Modulator V2...",
    "> Calibrating compare runtime..."
  ];

  let currentLog = 0;
  let progress = 0;
  pushLog();

  const bootInterval = setInterval(() => {
    progress = Math.min(100, progress + 4);
    if (pctText) pctText.innerText = progress + "%";

    const filled = Math.round((progress / 100) * totalSegments);
    segments.forEach((seg, index) => {
      seg.className = index < filled
        ? "flex-1 bg-dc-accent transition-colors duration-75"
        : "flex-1 bg-black/10 dark:bg-white/5 transition-colors duration-75";
    });

    if (progress > 25 && currentLog === 1) pushLog();
    if (progress > 50 && currentLog === 2) pushLog();
    if (progress > 75 && currentLog === 3) pushLog();

    if (progress === 100) {
      clearInterval(bootInterval);
      setTimeout(() => {
        loader.classList.add("opacity-0");
        setTimeout(() => loader.remove(), 700);
      }, 400);
    }
  }, 80);

  function pushLog() {
    const logSpan = document.createElement("span");
    logSpan.className = "text-dc-storm";
    logSpan.innerText = logs[currentLog];
    logsContainer.appendChild(logSpan);
    currentLog++;
  }
}


document.addEventListener('DOMContentLoaded', () => {
  _init16x19Favicon();
  _runDigicraftBootSequence();
  init();
  handleResponsiveHeader();
  _initDockCollapse();

  // Dock scroll shadow
  const dock = document.getElementById('build-dock');
  if (dock) {
    dock.addEventListener('scroll', function() {
      dock.classList.toggle('dock-scrolled', dock.scrollTop > 0);
    }, { passive: true });
  }

  // Backdrop closes dock overlay
  var dockBackdrop = document.getElementById('dock-backdrop');
  if (dockBackdrop) {
    dockBackdrop.addEventListener('click', function() {
      var d = document.getElementById('build-dock');
      if (d && d.classList.contains('dock-expanded')) {
        toggleMobileDock();
      }
    });
  }
});

export {
  STRINGS,
  FRAME_META,
  
  // Core data and prediction
  predictSetup,
  generateIdentity,
  calcFrameBase,
  calcBaseStringProfile,
  calcStringFrameMod,
  calcTensionModifier,
  calcHybridInteraction,
  
  // Loadout management
  createLoadout,
  activateLoadout,
  getCurrentSetup,
  saveLoadout,
  saveActiveLoadout,
  resetActiveLoadout,
  shareActiveLoadout,
  exportLoadouts,
  importLoadouts,
  confirmRemoveLoadout,
  removeLoadout,
  
  // UI Components
  createSearchableSelect,
  ssInstances,
  switchMode,
  _syncLegacyModeState,
  switchToLoadout,
  toggleTheme,
  setHybridMode,
  toggleDockCollapse,
  toggleMobileDock,
  hydrateDock,
  renderDockPanel,
  renderComparisonPresets,
  populateRacquetDropdown,
  populateStringDropdown,
  showFrameSpecs,
  populateGaugeDropdown,
  _handleSharedBuildURL,
  
  // Scoring and context
  computeCompositeScore,
  buildTensionContext,
  getObsScoreColor,
  renderOverallBuildScore,
  renderRecommendedBuilds,
  renderWhatToTryNext,
  renderExplorePrompt,
  
  // Initialization functions
  init,
  initTuneMode,
  refreshTuneIfActive,
  initOptimize,
  initCompendium,
  
  // State variables accessed externally
  comparisonSlots,
  _compendiumInitialized,
  
  // Helper functions used by leaderboard
  _compSelectFrame,
  _compSwitchTab,
  
  // Landing search
  _initLandingSearch,
  _showCompareQuickAddPrompt,
  
  // Racket Bible / Compendium functions
  _compToggleHud,
  _compAction,
  _compApplyInjection,
  _compSetInjectMode,
  _compClearInjection,
  _compSetSort,
  _stringToggleHud,
  _stringRenderRoster,
  _stringSyncWithActiveLoadout,
  _stringSelectString,
  _stringSetModMode,
  _stringAddToLoadout,
  _stringSetActiveLoadout,
  _stringClearPreview,
  
  // Tune mode functions
  toggleTuneMode,
  closeTuneMode,
  tuneSandboxCommit,
  applyExploredTension,
  onTuneSliderInput,
  _onEditorChange,
  
  // Compare state (note: comparisonSlots exported above in State variables section)
  comparisonRadarChart,
  SLOT_COLORS,
  
  // Compare functions
  addComparisonSlot,
  addComparisonSlotFromHome,
  removeComparisonSlot,
  renderComparisonSlots,
  renderCompareSummaries,
  renderCompareVerdict,
  renderCompareMatrix,
  updateComparisonRadar,
  closeCompareEditors,
  openTuneForSlot,
  _refreshCompareSlot,
  _toggleCompareCardEditor,
  
  // Optimize functions
  _toggleOptMS,
  runOptimizer,
  _optApplyTensionFilter,
  

  
  // Apply/Save functions
  _applyWttnBuild,
  _saveWttnBuild,
  _applyRecBuild,
  _saveRecBuild,
  
  // Quiz functions
  openFindMyBuild,
  closeFindMyBuild,
  fmbBack,
  fmbNext,
  _fmbSearchDirection,
  
  // Utility functions
  clamp,
  lerp,
  norm,
  getPatternOpenness,
  getAvgBeam,
  getMaxBeam,
  getMinBeam,
  isVariableBeam,
  applyGaugeModifier,
  getGaugeOptions,
  
  _applyGaugeSelection,
  
  // Theme and responsive
  handleResponsiveHeader,
  _initDockCollapse,
  
  // My Loadouts actions
  shareLoadout,
  addLoadoutToCompare,

  // Find My Build frame ranking
  _compGenerateTopBuilds,

  // Dock functions
  _dockCompareEdit,
  _dockCompareRemove,
  _dockCompareQuickAdd,

  // Searchable select helpers
  _initQaSearchable,
};
