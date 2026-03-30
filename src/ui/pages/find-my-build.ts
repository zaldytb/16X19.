// src/ui/pages/find-my-build.ts
// Find My Build wizard implementation

import { RACQUETS } from '../../data/loader.js';
import type { Racquet, StringData, Loadout } from '../../engine/types.js';
import { createLoadout, saveLoadout } from '../../state/loadout.js';
import { generateTopBuilds } from '../../state/presets.js';
import type { Build } from '../../state/presets.js';
import { renderDockContextPanel } from '../components/dock-renderers.js';
import { activateLoadout, switchMode } from './shell.js';

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
    _fmbShowResults(profile);
    _fmbShowStep('result');
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
 * Show FMB results
 */
export function _fmbShowResults(profile: ReturnType<typeof _fmbGenerateProfile>): void {
  const summaryEl = document.getElementById('fmb-summary');
  const directionsEl = document.getElementById('fmb-directions');
  if (!summaryEl || !directionsEl) return;

  const swingLabels: Record<string, string> = { compact: 'compact-swing', smooth: 'balanced-swing', heavy: 'heavy-swing' };
  const ballLabels: Record<string, string> = { flat: 'flat-hitting', moderate: 'moderate-spin', heavy: 'heavy-topspin' };
  const courtLabels: Record<string, string> = { baseliner: 'baseliner', allcourt: 'all-court', firststrike: 'first-strike', touch: 'touch player' };

  const identity = `${courtLabels[_fmbAnswers.court || ''] || 'all-court'} with a ${swingLabels[_fmbAnswers.swing || ''] || 'balanced'}, ${ballLabels[_fmbAnswers.ball || ''] || 'moderate-spin'} game`;

  const prioLabels = _fmbAnswers.priorities.map(p => p.charAt(0).toUpperCase() + p.slice(1));

  const threshLines = Object.entries(profile.minThresholds)
    .map(([k, v]) => `<span class="fmb-thresh-tag">${k.charAt(0).toUpperCase() + k.slice(1)} \u2265 ${v}</span>`)
    .join('');

  summaryEl.innerHTML = `
    <div class="fmb-profile-card">
      <div class="fmb-profile-label">YOUR PROFILE</div>
      <h3 class="fmb-profile-identity">${identity.charAt(0).toUpperCase() + identity.slice(1)}</h3>
      <div class="fmb-profile-priorities">
        <span class="fmb-prio-label">Optimizing for:</span>
        ${prioLabels.map((p, i) => `<span class="fmb-prio-tag">${i + 1}. ${p}</span>`).join('')}
      </div>
      ${threshLines ? `<div class="fmb-profile-thresholds">${threshLines}</div>` : ''}
      ${profile.notes.length ? `<div class="fmb-profile-notes">${profile.notes.map(n => `<div class="fmb-note">${n}</div>`).join('')}</div>` : ''}
    </div>
  `;

  const rankedFrames = _fmbRankFrames(profile);
  _fmbCurrentFrames = rankedFrames;

  directionsEl.innerHTML = `
    <div class="fmb-frame-results">
      <h4 class="fmb-frames-title">Recommended Frames</h4>
      <p class="fmb-frames-sub">Based on your playstyle profile. Each frame shows its best builds.</p>
      <div class="fmb-frame-list">
        ${rankedFrames.map((fr, idx) => _fmbRenderFrameCard(fr, idx)).join('')}
      </div>
      <div class="fmb-also-try">
        <p class="fmb-also-try-text">Want more options?</p>
        <button class="fmb-dir-btn" data-fmb-action="searchDirection" data-fmb-direction="closest">Search All Strings in Optimizer</button>
      </div>
    </div>
  `;
}

/**
 * Search direction handler
 */
export function _fmbSearchDirection(direction: 'closest' | 'safer' | 'ceiling'): void {
  const profile = _fmbGenerateProfile(_fmbAnswers);
  _fmbLastProfile = profile;

  void import('./optimize.js').then(({ initOptimize }) => initOptimize());

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

  if (_fmbCurrentFrames && _fmbCurrentFrames.length > 0) {
    const topFrame = _fmbCurrentFrames[0].racquet;
    setVal('opt-frame-search', topFrame.name);
    const frameValEl = document.getElementById('opt-frame-value') as HTMLInputElement | null;
    if (frameValEl) frameValEl.value = topFrame.id;
  }

  closeFindMyBuild();
  switchMode('optimize');

  requestAnimationFrame(() => {
    document.getElementById('opt-run-btn')?.click();
  });
}

/**
 * Rank frames based on profile
 */
export function _fmbRankFrames(profile: ReturnType<typeof _fmbGenerateProfile>): typeof _fmbCurrentFrames {
  const ranked = (RACQUETS as unknown as Racquet[]).map(racquet => {
    const topBuilds = generateTopBuilds(racquet, 3);

    let score = 0;
    if (topBuilds.length > 0) {
      const bestBuild = topBuilds[0];
      const stats = bestBuild.stats as unknown as Record<string, number>;

      Object.entries(profile.statPriorities).forEach(([stat, weight]) => {
        score += (stats[stat] || 0) * weight;
      });

      Object.entries(profile.minThresholds).forEach(([stat, min]) => {
        const val = stats[stat] || 0;
        if (val < min) score -= (min - val) * 2;
      });

      score += bestBuild.score * 0.5;
    }

    return { racquet, score, topBuilds };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, 5);
}

/**
 * Render frame card HTML
 */
export function _fmbRenderFrameCard(fr: typeof _fmbCurrentFrames[0], idx: number): string {
  const racquet = fr.racquet;
  const builds = fr.topBuilds;

  let buildsHtml = '';
  if (builds && builds.length > 0) {
    buildsHtml = '<div class="fmb-frame-builds">' +
      builds.map((build: Build, bIdx: number) => {
        const isHybrid = build.type === 'hybrid';
        const name = isHybrid
          ? `${build.mains?.name} / ${build.crosses?.name}`
          : build.string?.name || 'Unknown';
        const tension = isHybrid
          ? `M:${build.tension} / X:${build.tension - 2} lbs`
          : `${build.tension} lbs`;
        const obs = build.score.toFixed(1);

        return `<div class="fmb-build-row">
          <div class="fmb-build-info">
            <span class="fmb-build-name">${name}</span>
            <span class="fmb-build-tension">${tension}</span>
          </div>
          <div class="fmb-build-obs">${obs}</div>
          <div class="fmb-build-actions">
            <button class="fmb-build-btn" data-fmb-action="activate" data-frame-idx="${idx}" data-build-idx="${bIdx}">Activate</button>
            <button class="fmb-build-btn fmb-build-btn-secondary" data-fmb-action="save" data-frame-idx="${idx}" data-build-idx="${bIdx}">Save</button>
          </div>
        </div>`;
      }).join('') +
    '</div>';
  }

  return `<div class="fmb-frame-card" data-frame-idx="${idx}">
    <div class="fmb-frame-header">
      <div class="fmb-frame-name">${racquet.name}</div>
      <div class="fmb-frame-meta">${racquet.headSize}" \u00B7 ${racquet.weight}g \u00B7 ${racquet.pattern}</div>
    </div>
    ${buildsHtml}
  </div>`;
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
