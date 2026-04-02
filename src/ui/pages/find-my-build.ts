// src/ui/pages/find-my-build.ts
// Find My Build wizard implementation

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Racquet, StringData, Loadout } from '../../engine/types.js';
import { createLoadout, saveLoadout } from '../../state/loadout.js';
import type { Build } from '../../state/presets.js';
import { renderDockContextPanel } from '../components/dock-renderers.js';
import { activateLoadout, switchMode } from './shell.js';
import { FmbResultsDirections } from '../../components/overview/FmbResultsDirections.js';
import { FmbResultsSummary } from '../../components/overview/FmbResultsSummary.js';
import { buildFmbDirectionsViewModel, buildFmbSummaryViewModel } from './find-my-build-vm.js';
import { queueOptimizeSearch } from './optimize-route-state.js';
import { runFmbRankAsync } from '../../workers/engine-worker-client.js';

// FMB Wizard state
let _fmbStep: number | 'result' = 1;
const _fmbAnswers: {
  swing: string | null;
  ball: string | null;
  court: string | null;
  painPoints: string[];
  priorities: string[];
} = {
  swing: null,
  ball: null,
  court: null,
  painPoints: [],
  priorities: []
};
let _fmbCurrentFrames: Array<{
  racquet: Racquet;
  score: number;
  topBuilds: Build[];
}> = [];
let _fmbLastProfile: {
  statPriorities: Record<string, number>;
  minThresholds: Record<string, number>;
  setupPreference: string;
  sortBy: string;
  notes: string[];
} | null = null;

type FmbReactMount = { root: Root | null; host: HTMLElement | null };

const _fmbSummaryMount: FmbReactMount = { root: null, host: null };
const _fmbDirectionsMount: FmbReactMount = { root: null, host: null };

function _ensureFmbReactRoot(mount: FmbReactMount, container: HTMLElement | null): Root | null {
  if (!container) return null;
  if (mount.root && mount.host) {
    if (mount.host !== container || !mount.host.isConnected) {
      mount.root.unmount();
      mount.root = null;
      mount.host = null;
    }
  }
  if (!mount.root) {
    mount.root = createRoot(container);
    mount.host = container;
  }
  return mount.root;
}

/**
 * Open the Find My Build wizard
 */
export function openFindMyBuild(): void {
  _bindFmbDelegates();
  _fmbStep = 1;
  _fmbAnswers.swing = null;
  _fmbAnswers.ball = null;
  _fmbAnswers.court = null;
  _fmbAnswers.painPoints = [];
  _fmbAnswers.priorities = [];

  document.querySelectorAll('.fmb-option').forEach(b => {
    b.classList.remove('selected');
    const badge = b.querySelector('.fmb-priority-badge');
    if (badge) badge.remove();
  });

  const wizard = document.getElementById('find-my-build');
  if (wizard) wizard.classList.remove('hidden');

  const emptyState = document.getElementById('empty-state');
  if (emptyState) emptyState.style.display = 'none';

  _fmbShowStep(1);
}

/**
 * Close the Find My Build wizard
 */
export function closeFindMyBuild(): void {
  const wizard = document.getElementById('find-my-build');
  if (wizard) wizard.classList.add('hidden');
  const emptyState = document.getElementById('empty-state');
  if (emptyState) emptyState.style.display = '';
}

/**
 * Show a specific step in the wizard
 */
export function _fmbShowStep(step: number | 'result'): void {
  _fmbStep = step;
  const totalSteps = 5;

  const pct = step === 'result' ? 100 : (step as number / totalSteps) * 100;
  const progressFill = document.getElementById('fmb-progress-fill');
  if (progressFill) progressFill.style.width = pct + '%';

  document.querySelectorAll('.fmb-step').forEach(el => {
    const s = (el as HTMLElement).dataset.step;
    el.classList.toggle('hidden', s !== String(step));
  });

  const backBtn = document.getElementById('fmb-back') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('fmb-next') as HTMLButtonElement | null;

  if (step === 'result') {
    if (backBtn) backBtn.style.display = '';
    if (nextBtn) nextBtn.style.display = 'none';
  } else {
    if (backBtn) backBtn.style.display = step === 1 ? 'none' : '';
    if (nextBtn) {
      nextBtn.style.display = '';
      nextBtn.textContent = step === 5 ? 'See Results' : 'Next';
    }
    _fmbUpdateNextState();
  }
}

/**
 * Update next button enabled state
 */
export function _fmbUpdateNextState(): void {
  const nextBtn = document.getElementById('fmb-next') as HTMLButtonElement | null;
  if (!nextBtn) return;

  let canProceed = false;

  if (_fmbStep === 1) canProceed = _fmbAnswers.swing !== null;
  else if (_fmbStep === 2) canProceed = _fmbAnswers.ball !== null;
  else if (_fmbStep === 3) canProceed = _fmbAnswers.court !== null;
  else if (_fmbStep === 4) canProceed = _fmbAnswers.painPoints.length > 0;
  else if (_fmbStep === 5) canProceed = _fmbAnswers.priorities.length === 3;

  nextBtn.disabled = !canProceed;
}

/**
 * Go back in wizard
 */
export function fmbBack(): void {
  if (_fmbStep === 'result') {
    _fmbShowStep(5);
  } else if (typeof _fmbStep === 'number' && _fmbStep > 1) {
    _fmbShowStep(_fmbStep - 1);
  }
}

/**
 * Go next in wizard
 */
export function fmbNext(): void {
  if (typeof _fmbStep === 'number' && _fmbStep < 5) {
    _fmbShowStep(_fmbStep + 1);
  } else if (_fmbStep === 5) {
    const profile = _fmbGenerateProfile(_fmbAnswers);
    _fmbShowStep('result');
    void _fmbShowResults(profile);
  }
}

// Wire option click handlers
document.addEventListener('click', (e) => {
  const option = (e.target as Element).closest('.fmb-option') as HTMLElement | null;
  if (!option) return;

  const container = option.closest('.fmb-options') as HTMLElement | null;
  if (!container) return;

  const key = container.dataset.key;
  const value = option.dataset.value || '';
  const isMulti = container.classList.contains('fmb-options-multi');
  const maxSel = parseInt(container.dataset.max || '99');
  const isPriority = container.classList.contains('fmb-options-priority');

  if (!key) return;

  if (isMulti) {
    if (isPriority) {
      const arr = _fmbAnswers[key as keyof typeof _fmbAnswers] as string[];
      const idx = arr.indexOf(value);
      if (idx >= 0) {
        arr.splice(idx, 1);
        option.classList.remove('selected');
        const badge = option.querySelector('.fmb-priority-badge');
        if (badge) badge.remove();
        container.querySelectorAll('.fmb-option.selected').forEach(btn => {
          const bv = (btn as HTMLElement).dataset.value || '';
          const bi = arr.indexOf(bv);
          const bg = btn.querySelector('.fmb-priority-badge');
          if (bg) bg.textContent = String(bi + 1);
        });
      } else if (arr.length < maxSel) {
        arr.push(value);
        option.classList.add('selected');
        const badge = document.createElement('span');
        badge.className = 'fmb-priority-badge';
        badge.textContent = String(arr.length);
        option.appendChild(badge);
      }
    } else {
      const arr = _fmbAnswers[key as keyof typeof _fmbAnswers] as string[];
      const idx = arr.indexOf(value);
      if (idx >= 0) {
        arr.splice(idx, 1);
        option.classList.remove('selected');
      } else if (arr.length < maxSel) {
        arr.push(value);
        option.classList.add('selected');
      }
    }
  } else {
    container.querySelectorAll('.fmb-option').forEach(b => b.classList.remove('selected'));
    option.classList.add('selected');
    (_fmbAnswers as Record<string, unknown>)[key] = value;
  }

  _fmbUpdateNextState();
});

/**
 * Generate player profile from answers
 */
export function _fmbGenerateProfile(answers: typeof _fmbAnswers): {
  statPriorities: Record<string, number>;
  minThresholds: Record<string, number>;
  setupPreference: string;
  sortBy: string;
  notes: string[];
} {
  const profile = {
    statPriorities: {} as Record<string, number>,
    minThresholds: {} as Record<string, number>,
    setupPreference: 'both',
    sortBy: 'obs',
    notes: [] as string[]
  };

  if (answers.swing === 'compact') {
    profile.minThresholds.maneuverability = 60;
    profile.notes.push('Compact swing \u2192 prioritizing maneuverable setups');
  } else if (answers.swing === 'heavy') {
    profile.minThresholds.stability = 58;
    profile.notes.push('Heavy swing \u2192 prioritizing stable, high-plow setups');
  }

  if (answers.ball === 'flat') {
    profile.statPriorities.control = 3;
    profile.statPriorities.power = 2;
    profile.minThresholds.control = 62;
  } else if (answers.ball === 'heavy') {
    profile.statPriorities.spin = 3;
    profile.minThresholds.spin = 65;
  } else {
    profile.statPriorities.spin = 2;
  }

  if (answers.court === 'baseliner') {
    profile.statPriorities.durability = (profile.statPriorities.durability || 0) + 1;
    profile.statPriorities.playability = (profile.statPriorities.playability || 0) + 1;
  } else if (answers.court === 'touch') {
    profile.statPriorities.feel = 3;
    profile.minThresholds.feel = 62;
  } else if (answers.court === 'firststrike') {
    profile.statPriorities.power = (profile.statPriorities.power || 0) + 1;
    profile.statPriorities.control = (profile.statPriorities.control || 0) + 1;
  }

  answers.painPoints.forEach(p => {
    if (p === 'arm') { profile.minThresholds.comfort = 60; profile.notes.push('Arm sensitivity \u2192 comfort floor 60'); }
    if (p === 'breaks') { profile.minThresholds.durability = 65; profile.notes.push('String breaker \u2192 durability floor 65'); }
    if (p === 'long') { profile.minThresholds.control = 62; profile.notes.push('Ball goes long \u2192 control floor 62'); }
    if (p === 'pace') { profile.statPriorities.power = 3; }
    if (p === 'spin') { profile.statPriorities.spin = 3; }
    if (p === 'dead') { profile.minThresholds.feel = 60; profile.minThresholds.playability = 65; }
  });

  answers.priorities.forEach((stat, i) => {
    profile.statPriorities[stat] = Math.max(profile.statPriorities[stat] || 0, 3 - i);
  });

  const topStat = Object.entries(profile.statPriorities).sort((a, b) => b[1] - a[1])[0];
  if (topStat && topStat[0] !== 'obs') profile.sortBy = topStat[0];

  return profile;
}

/**
 * Show FMB results (async — heavy scoring runs in Web Worker)
 */
export async function _fmbShowResults(profile: ReturnType<typeof _fmbGenerateProfile>): Promise<void> {
  const summaryEl = document.getElementById('fmb-summary');
  const directionsEl = document.getElementById('fmb-directions');
  if (!summaryEl || !directionsEl) return;

  const summaryRoot = _ensureFmbReactRoot(_fmbSummaryMount, summaryEl);
  const directionsRoot = _ensureFmbReactRoot(_fmbDirectionsMount, directionsEl);
  if (!summaryRoot || !directionsRoot) return;

  const loading = createElement(
    'div',
    {
      className:
        'rounded-lg border border-dc-border border-dashed bg-black/[0.03] dark:bg-black/15 px-6 py-10 flex flex-col items-center justify-center gap-4',
    },
    createElement('div', {
      className: 'h-8 w-8 border-2 border-dc-storm/30 border-t-dc-accent rounded-full animate-spin',
    }),
    createElement(
      'div',
      { className: 'text-center space-y-1' },
      createElement(
        'div',
        { className: 'font-mono text-[10px] uppercase tracking-[0.2em] text-dc-accent' },
        'Scoring',
      ),
      createElement(
        'div',
        { className: 'font-mono text-[11px] text-dc-storm' },
        'Ranking frames and string builds…',
      ),
    ),
  );
  summaryRoot.render(loading);
  directionsRoot.render(loading);

  let rankedFrames;
  try {
    rankedFrames = await runFmbRankAsync({
      statPriorities: profile.statPriorities,
      minThresholds: profile.minThresholds,
      sortBy: profile.sortBy,
      notes: profile.notes,
    });
  } catch (err) {
    const msg = (err as Error).message || String(err);
    const errEl = createElement(
      'div',
      {
        className:
          'rounded-lg border border-red-500/40 bg-red-950/20 px-4 py-3 font-mono text-[11px] text-red-300/90',
      },
      `Error: ${msg}`,
    );
    summaryRoot.render(errEl);
    directionsRoot.render(errEl);
    return;
  }

  _fmbCurrentFrames = rankedFrames;

  summaryRoot.render(createElement(FmbResultsSummary, {
    model: buildFmbSummaryViewModel(_fmbAnswers, profile),
  }));
  directionsRoot.render(createElement(FmbResultsDirections, {
    model: buildFmbDirectionsViewModel(rankedFrames),
  }));
}

/**
 * Search direction handler
 */
export function _fmbSearchDirection(direction: 'closest' | 'safer' | 'ceiling'): void {
  const profile = _fmbGenerateProfile(_fmbAnswers);
  _fmbLastProfile = profile;

  const mins: Record<string, number> = { spin: 0, control: 0, power: 0, comfort: 0, feel: 0, durability: 0, playability: 0, stability: 0, maneuverability: 0 };
  let sortBy = profile.sortBy;

  if (direction === 'closest') {
    Object.entries(profile.minThresholds).forEach(([k, v]) => {
      if (k in mins) mins[k] = v;
    });
    sortBy = 'obs';
  } else if (direction === 'safer') {
    Object.entries(profile.minThresholds).forEach(([k, v]) => {
      if (k in mins) mins[k] = Math.max(0, v - 5);
    });
    mins.comfort = Math.max(mins.comfort, 55);
    mins.durability = Math.max(mins.durability, 55);
    sortBy = 'obs';
  } else if (direction === 'ceiling') {
    Object.entries(profile.minThresholds).forEach(([k, v]) => {
      if (k === 'comfort' || k === 'durability') return;
      if (k in mins) mins[k] = v;
    });
    sortBy = _fmbAnswers.priorities[0] || profile.sortBy;
  }

  const setVal = (id: string, v: number | string) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = String(v);
  };

  setVal('opt-min-spin', mins.spin);
  setVal('opt-min-control', mins.control);
  setVal('opt-min-power', mins.power);
  setVal('opt-min-comfort', mins.comfort);
  setVal('opt-min-feel', mins.feel);
  setVal('opt-min-durability', mins.durability);
  setVal('opt-min-playability', mins.playability);
  setVal('opt-min-stability', mins.stability);
  setVal('opt-min-maneuverability', mins.maneuverability);
  setVal('opt-sort', sortBy);

  const typeBtn = document.querySelector(`.opt-toggle[data-value="${profile.setupPreference}"]`) as HTMLElement | null;
  if (typeBtn) {
    document.querySelectorAll('.opt-toggle').forEach(b => b.classList.remove('active'));
    typeBtn.classList.add('active');
  }

  const topFrameForOpt =
    _fmbCurrentFrames && _fmbCurrentFrames.length > 0 ? _fmbCurrentFrames[0].racquet : null;

  closeFindMyBuild();
  queueOptimizeSearch({
    frameId: topFrameForOpt?.id || null,
    frameName: topFrameForOpt?.name || null,
    setupType: profile.setupPreference as 'both' | 'full' | 'hybrid',
    sortBy,
    mins,
    autorun: true,
  });
  switchMode('optimize');
}

/**
 * Handle frame card action
 */
export function _fmbAction(action: 'activate' | 'save', frameIdx: number, buildIdx: number, btn: HTMLElement): void {
  const frame = _fmbCurrentFrames[frameIdx];
  if (!frame) return;

  const build = frame.topBuilds[buildIdx] as Build | undefined;
  if (!build) return;

  if (action === 'activate') {
    _fmbActivateBuild(frame.racquet.id, build);
    btn.textContent = 'Activated \u2713';
    btn.setAttribute('disabled', 'true');
    setTimeout(() => {
      btn.textContent = 'Activate';
      btn.removeAttribute('disabled');
    }, 1500);
  } else if (action === 'save') {
    _fmbSaveBuild(frame.racquet.id, build);
    btn.textContent = 'Saved \u2713';
    setTimeout(() => { btn.textContent = 'Save'; }, 1500);
  }
}

/**
 * Activate a build from FMB results
 */
function _fmbActivateBuild(racquetId: string, build: typeof _fmbCurrentFrames[0]['topBuilds'][0]): void {
  const isHybrid = build.type === 'hybrid';

  const lo = isHybrid && build.mains && build.crosses
    ? createLoadout(racquetId, build.mains.id, build.tension, {
        isHybrid: true,
        mainsId: build.mains.id,
        crossesId: build.crosses.id,
        crossesTension: build.tension - 2,
        source: 'quiz'
      })
    : build.string
      ? createLoadout(racquetId, build.string.id, build.tension, { source: 'quiz' })
      : null;

  if (lo) {
    closeFindMyBuild();
    activateLoadout(lo);
    switchMode('overview');
    renderDockContextPanel();
  }
}

/**
 * Save a build from FMB results
 */
function _fmbSaveBuild(racquetId: string, build: typeof _fmbCurrentFrames[0]['topBuilds'][0]): void {
  const isHybrid = build.type === 'hybrid';

  const lo = isHybrid && build.mains && build.crosses
    ? createLoadout(racquetId, build.mains.id, build.tension, {
        isHybrid: true,
        mainsId: build.mains.id,
        crossesId: build.crosses.id,
        crossesTension: build.tension - 2,
        source: 'quiz'
      })
    : build.string
      ? createLoadout(racquetId, build.string.id, build.tension, { source: 'quiz' })
      : null;

  if (lo) {
    saveLoadout(lo);
  }
}

// ---------------------------------------------------------------------------
// Delegated event listeners — replaces inline onclick handlers
// ---------------------------------------------------------------------------
let _fmbDelegateBound = false;

export function _bindFmbDelegates(): void {
  if (_fmbDelegateBound) return;
  _fmbDelegateBound = true;

  document.addEventListener('click', (e: Event) => {
    const el = (e.target as Element).closest('[data-fmb-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.fmbAction!;

    if (action === 'activate' || action === 'save') {
      const frameIdx = parseInt(el.dataset.frameIdx ?? '0', 10);
      const buildIdx = parseInt(el.dataset.buildIdx ?? '0', 10);
      _fmbAction(action, frameIdx, buildIdx, el);
    } else if (action === 'searchDirection') {
      const dir = el.dataset.fmbDirection as 'closest' | 'safer' | 'ceiling' | undefined;
      if (dir) _fmbSearchDirection(dir);
    }
  });
}
