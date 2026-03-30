// src/ui/components/dock-create.ts
// Dock create form handlers

import { RACQUETS, STRINGS } from '../../data/loader.js';
import { getActiveLoadout, getSavedLoadouts } from '../../state/store.js';
import { getCurrentMode } from '../../state/app-state.js';
import { createLoadout, saveLoadout } from '../../state/loadout.js';
import { activateLoadout, switchMode } from '../pages/shell.js';
import { renderOverviewDashboardViaBridge } from '../pages/overview-runtime-bridge.js';
import { _initQaSearchable } from './searchable-select.js';
import type { Loadout } from '../../engine/types.js';

// Module-level state
let _cfCreatingNew = false;

/**
 * Render the dock create section
 */
export function renderDockCreateSection(): void {
  const container = document.getElementById('dock-create-area');
  const editorSection = document.getElementById('dock-editor-section');
  if (!container) return;

  if (getCurrentMode() === 'compare') {
    container.innerHTML = '';
    return;
  }

  const al = getActiveLoadout();
  const sls = getSavedLoadouts();

  if (!al && !_cfCreatingNew) {
    container.innerHTML = _renderCreateFormTailwind('Create Loadout', false);
    _wireCreateForm(container);
    if (editorSection) editorSection.style.display = 'none';
  } else if (al && !_cfCreatingNew) {
    container.innerHTML =
      '<button class="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[var(--dc-border)] font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] hover:border-[var(--dc-border-hover)] transition-colors" data-cf-action="showNewLoadoutForm">' +
        '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>' +
        'Create New Loadout' +
      '</button>';
    _bindDockCreateDelegates();
    if (editorSection) editorSection.style.display = '';
  } else if (_cfCreatingNew) {
    container.innerHTML = _renderCreateFormTailwind('New Loadout', true);
    _wireCreateForm(container);
    if (editorSection) editorSection.style.display = 'none';
  }
}

/**
 * Render create form HTML with Tailwind styling
 */
export function _renderCreateFormTailwind(title: string, showCancel: boolean): string {
  return (
    '<div class="dock-cf-form border border-[var(--dc-border)] bg-[var(--dc-void-deep)] p-4 flex flex-col gap-3">' +
      '<div class="flex items-center justify-between border-b border-[var(--dc-border)] pb-3">' +
        '<span class="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--dc-platinum)]">' + title + '</span>' +
        (showCancel ? '<a class="font-mono text-[9px] uppercase tracking-widest text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] cursor-pointer transition-colors" href="#" data-cf-action="hideNewLoadoutForm">Cancel</a>' : '') +
      '</div>' +
      // Full/Hybrid toggle
      '<div class="flex border border-[var(--dc-border)]">' +
        '<button class="dock-cf-toggle-btn flex-1 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] bg-[var(--dc-platinum)] text-[var(--dc-void)] border-r border-[var(--dc-border)] transition-colors" data-cf-mode="full" data-cf-action="toggleMode">Full Bed</button>' +
        '<button class="dock-cf-toggle-btn flex-1 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] bg-transparent text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] transition-colors" data-cf-mode="hybrid" data-cf-action="toggleMode">Hybrid</button>' +
      '</div>' +
      // Body
      '<div class="dock-cf-body flex flex-col gap-3" data-cf-hybrid="false">' +
        // Full bed
        '<div class="dock-cf-fullbed flex flex-col gap-2">' +
          _cfFieldHtml('Frame', 'dock-cf-frame-search', 'dock-cf-frame', 'dock-cf-frame-dropdown', 'Search frames...') +
          _cfFieldHtml('String', 'dock-cf-string-search', 'dock-cf-string', 'dock-cf-string-dropdown', 'Search strings...') +
          '<div class="grid grid-cols-2 gap-2">' +
            _cfTensionHtml('Mains lbs', 'dock-cf-tension-m', '55') +
            _cfTensionHtml('Crosses lbs', 'dock-cf-tension-x', '53') +
          '</div>' +
        '</div>' +
        // Hybrid
        '<div class="dock-cf-hybrid hidden flex flex-col gap-2">' +
          _cfFieldHtml('Frame', 'dock-cf-h-frame-search', 'dock-cf-h-frame', 'dock-cf-h-frame-dropdown', 'Search frames...') +
          _cfFieldHtml('Mains String', 'dock-cf-mains-search', 'dock-cf-mains', 'dock-cf-mains-dropdown', 'Search mains...') +
          '<div class="grid grid-cols-2 gap-2">' +
            _cfTensionHtml('Mains lbs', 'dock-cf-mains-tension', '55') +
            _cfTensionHtml('Crosses lbs', 'dock-cf-crosses-tension', '53') +
          '</div>' +
          _cfFieldHtml('Crosses String', 'dock-cf-crosses-search', 'dock-cf-crosses', 'dock-cf-crosses-dropdown', 'Search crosses...') +
        '</div>' +
      '</div>' +
      // Actions
      '<div class="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--dc-border)]">' +
        '<button class="py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] bg-[var(--dc-platinum)] text-[var(--dc-void)] hover:bg-[var(--dc-white)] transition-colors" data-cf-action="activate">Set Active</button>' +
        '<button class="py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] border border-[var(--dc-border)] text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] hover:border-[var(--dc-border-hover)] bg-transparent transition-colors" data-cf-action="save">Save</button>' +
      '</div>' +
    '</div>'
  );
}

function _cfFieldHtml(label: string, searchId: string, hiddenId: string, dropdownId: string, placeholder: string): string {
  return (
    '<div class="flex flex-col gap-1">' +
      '<span class="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--dc-storm)]">' + label + '</span>' +
      '<div class="relative">' +
        '<input type="text" class="w-full px-2 py-1.5 bg-[var(--dc-void)] border border-[var(--dc-border)] text-[var(--dc-platinum)] font-sans text-[12px] outline-none focus:border-[var(--dc-border-active)] transition-colors placeholder:text-[var(--dc-storm)]" id="' + searchId + '" placeholder="' + placeholder + '" autocomplete="off">' +
        '<input type="hidden" id="' + hiddenId + '">' +
        '<div class="absolute top-full left-0 right-0 z-50 bg-[var(--dc-void-deep)] border border-[var(--dc-border)] max-h-48 overflow-y-auto hidden" id="' + dropdownId + '"></div>' +
      '</div>' +
    '</div>'
  );
}

function _cfTensionHtml(label: string, inputId: string, defaultVal: string): string {
  return (
    '<div class="flex flex-col gap-1">' +
      '<span class="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--dc-storm)]">' + label + '</span>' +
      '<input type="number" class="px-2 py-1.5 bg-[var(--dc-void)] border border-[var(--dc-border)] text-[var(--dc-platinum)] font-mono text-[12px] outline-none focus:border-[var(--dc-border-active)] transition-colors" id="' + inputId + '" value="' + defaultVal + '" min="30" max="70">' +
    '</div>'
  );
}

/**
 * Toggle between full bed and hybrid mode in create form
 */
export function _cfToggleMode(btn: HTMLElement): void {
  const container = btn.closest('.dock-cf-form') as HTMLElement | null;
  if (!container) return;

  const mode = btn.dataset.cfMode;
  const isHybrid = mode === 'hybrid';

  const fullSection = container.querySelector('.dock-cf-fullbed') as HTMLElement | null;
  const hybridSection = container.querySelector('.dock-cf-hybrid') as HTMLElement | null;

  if (fullSection) {
    if (isHybrid) fullSection.classList.add('hidden');
    else fullSection.classList.remove('hidden');
  }
  if (hybridSection) {
    if (isHybrid) hybridSection.classList.remove('hidden');
    else hybridSection.classList.add('hidden');
  }

  container.querySelectorAll('.dock-cf-toggle-btn').forEach(b => {
    const isTarget = (b as HTMLElement).dataset.cfMode === mode;
    b.classList.toggle('active', isTarget);
    (b as HTMLElement).style.background = isTarget ? 'var(--dc-platinum)' : 'transparent';
    (b as HTMLElement).style.color = isTarget ? 'var(--dc-void)' : 'var(--dc-storm)';
  });
}

/**
 * Wire up searchable selects in create form
 */
export function _wireCreateForm(container: HTMLElement): void {
  const frameItems = RACQUETS.map(r => ({ id: r.id, label: r.name }));
  const stringItems = STRINGS.map(s => ({ id: s.id, label: s.name + ' (' + s.gauge + ')' }));

  // Full bed searchables
  _initQaSearchable('dock-cf-frame-search', 'dock-cf-frame', 'dock-cf-frame-dropdown', frameItems);
  _initQaSearchable('dock-cf-string-search', 'dock-cf-string', 'dock-cf-string-dropdown', stringItems);

  // Hybrid searchables
  _initQaSearchable('dock-cf-h-frame-search', 'dock-cf-h-frame', 'dock-cf-h-frame-dropdown', frameItems);
  _initQaSearchable('dock-cf-mains-search', 'dock-cf-mains', 'dock-cf-mains-dropdown', stringItems);
  _initQaSearchable('dock-cf-crosses-search', 'dock-cf-crosses', 'dock-cf-crosses-dropdown', stringItems);

  _bindDockCreateDelegates();
}

/**
 * Build loadout from create form values
 */
export function _cfBuildLoadout(): Loadout | null {
  const form = document.querySelector('.dock-cf-form') as HTMLElement | null;
  if (!form) return null;

  const hybridSection = form.querySelector('.dock-cf-hybrid') as HTMLElement | null;
  const isHybrid = hybridSection && !hybridSection.classList.contains('hidden');

  if (isHybrid) {
    const frameId = (document.getElementById('dock-cf-h-frame') as HTMLInputElement | null)?.value;
    const mainsId = (document.getElementById('dock-cf-mains') as HTMLInputElement | null)?.value;
    const crossesId = (document.getElementById('dock-cf-crosses') as HTMLInputElement | null)?.value;
    const mainsTension = parseInt((document.getElementById('dock-cf-mains-tension') as HTMLInputElement | null)?.value || '55') || 55;
    const crossesTension = parseInt((document.getElementById('dock-cf-crosses-tension') as HTMLInputElement | null)?.value || '53') || 53;
    if (!frameId || !mainsId || !crossesId) return null;

    return createLoadout(frameId, mainsId, mainsTension, {
      isHybrid: true,
      mainsId,
      crossesId,
      crossesTension,
      source: 'manual'
    }) || null;
  } else {
    const frameId = (document.getElementById('dock-cf-frame') as HTMLInputElement | null)?.value;
    const stringId = (document.getElementById('dock-cf-string') as HTMLInputElement | null)?.value;
    const mainsT = parseInt((document.getElementById('dock-cf-tension-m') as HTMLInputElement | null)?.value || '55') || 55;
    const crossesT = parseInt((document.getElementById('dock-cf-tension-x') as HTMLInputElement | null)?.value || '53') || 53;
    if (!frameId || !stringId) return null;

    return createLoadout(frameId, stringId, mainsT, { source: 'manual', crossesTension: crossesT }) || null;
  }
}

/**
 * Activate loadout from create form
 */
export function _cfActivate(): void {
  const sls = getSavedLoadouts();
  const isFirstLoadout = !getActiveLoadout() && sls.length === 0;
  const lo = _cfBuildLoadout();
  if (!lo) {
    _cfHighlightMissingFields();
    return;
  }
  _cfClearFieldErrors();

  _cfCreatingNew = false;
  activateLoadout(lo);
  renderDockCreateSection();

  if (isFirstLoadout) {
    saveLoadout(lo);
    switchMode('tune');
  } else if (getCurrentMode() === 'overview') {
    renderOverviewDashboardViaBridge();
  }
}

/**
 * Save loadout from create form
 */
export function _cfSave(): void {
  const lo = _cfBuildLoadout();
  if (!lo) {
    _cfHighlightMissingFields();
    return;
  }
  _cfClearFieldErrors();

  _cfCreatingNew = false;
  saveLoadout(lo);
  renderDockCreateSection();
}

/**
 * Highlight missing fields in create form
 */
export function _cfHighlightMissingFields(): void {
  const form = document.querySelector('.dock-cf-form') as HTMLElement | null;
  if (!form) return;

  const hybridSection = form.querySelector('.dock-cf-hybrid') as HTMLElement | null;
  const isHybrid = hybridSection && !hybridSection.classList.contains('hidden');

  _cfClearFieldErrors();

  if (isHybrid) {
    const hFrame = document.getElementById('dock-cf-h-frame') as HTMLInputElement | null;
    const mains = document.getElementById('dock-cf-mains') as HTMLInputElement | null;
    const crosses = document.getElementById('dock-cf-crosses') as HTMLInputElement | null;

    if (!hFrame || !hFrame.value) _cfShowFieldError('dock-cf-h-frame-search', 'Frame is required');
    if (!mains || !mains.value) _cfShowFieldError('dock-cf-mains-search', 'Select a string from the dropdown');
    if (!crosses || !crosses.value) _cfShowFieldError('dock-cf-crosses-search', 'Select a string from the dropdown');
  } else {
    const frame = document.getElementById('dock-cf-frame') as HTMLInputElement | null;
    const string = document.getElementById('dock-cf-string') as HTMLInputElement | null;

    if (!frame || !frame.value) _cfShowFieldError('dock-cf-frame-search', 'Frame is required');
    if (!string || !string.value) {
      const stringSearch = document.getElementById('dock-cf-string-search') as HTMLInputElement | null;
      if (stringSearch && stringSearch.value.trim()) {
        _cfShowFieldError('dock-cf-string-search', 'Select a string from the dropdown');
      } else {
        _cfShowFieldError('dock-cf-string-search', 'String is required');
      }
    }
  }
}

/**
 * Show field error in create form
 */
export function _cfShowFieldError(inputId: string, message: string): void {
  const input = document.getElementById(inputId) as HTMLElement | null;
  if (!input) return;

  const wrapper = input.closest('.dock-qa-searchable') as HTMLElement | null;
  if (wrapper) wrapper.classList.add('ss-invalid');

  input.classList.add('ss-invalid');

  const field = input.closest('.dock-qa-field') as HTMLElement | null;
  if (field) {
    const existingError = field.querySelector('.ss-field-error');
    if (!existingError) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'ss-field-error';
      errorDiv.textContent = message;
      field.appendChild(errorDiv);
    }
  }
}

/**
 * Clear all field errors in create form
 */
export function _cfClearFieldErrors(): void {
  document.querySelectorAll('.dock-cf-form .ss-invalid').forEach(el => {
    el.classList.remove('ss-invalid');
  });
  document.querySelectorAll('.dock-cf-form .ss-field-error').forEach(el => {
    el.remove();
  });
}

/**
 * Show new loadout form
 */
export function _showNewLoadoutForm(): void {
  _cfCreatingNew = true;
  renderDockCreateSection();
}

/**
 * Hide new loadout form
 */
export function _hideNewLoadoutForm(): void {
  _cfCreatingNew = false;
  renderDockCreateSection();
}

// ---------------------------------------------------------------------------
// Delegated event listener — replaces inline onclick handlers
// ---------------------------------------------------------------------------
let _cfDelegateBound = false;

export function _bindDockCreateDelegates(): void {
  if (_cfDelegateBound) return;
  _cfDelegateBound = true;

  document.addEventListener('click', (e: Event) => {
    const el = (e.target as Element).closest('[data-cf-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.cfAction!;

    switch (action) {
      case 'showNewLoadoutForm':
        _showNewLoadoutForm();
        break;
      case 'hideNewLoadoutForm':
        e.preventDefault();
        _hideNewLoadoutForm();
        break;
      case 'toggleMode':
        _cfToggleMode(el);
        break;
      case 'activate':
        _cfActivate();
        break;
      case 'save':
        _cfSave();
        break;
    }
  });
}

