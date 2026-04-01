// src/ui/pages/my-loadouts.ts
// My Loadouts panel rendering

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Loadout } from '../../engine/types.js';
import { getActiveLoadout, getSavedLoadouts } from '../../state/store.js';
import { MyLoadoutsList } from '../../components/shell/MyLoadoutsList.js';
import { buildMyLoadoutsViewModel } from './my-loadouts-vm.js';

// ---------------------------------------------------------------------------
// Callback registry — shell.ts registers cross-module actions here at init.
// ---------------------------------------------------------------------------
type MyLoadoutsCallbacks = {
  switchToLoadout: (id: string) => void;
  shareLoadout: (id: string) => void;
  addLoadoutToCompare: (id: string) => void;
  removeLoadout: (id: string) => void;
};

const _noop = (_id?: string) => { void _id; };
let _myLoadoutsCbs: MyLoadoutsCallbacks = {
  switchToLoadout: _noop,
  shareLoadout: _noop,
  addLoadoutToCompare: _noop,
  removeLoadout: _noop,
};

export function registerMyLoadoutsCallbacks(cbs: Partial<MyLoadoutsCallbacks>): void {
  _myLoadoutsCbs = { ..._myLoadoutsCbs, ...cbs };
}

let _listenerBound = false;
let _confirmingRemoveLoadoutId: string | null = null;

type MyLoadoutsReactMount = { root: Root | null; host: HTMLElement | null };

const _myLoadoutsMount: MyLoadoutsReactMount = { root: null, host: null };

function _ensureMyLoadoutsReactRoot(container: HTMLElement | null): Root | null {
  if (!container) return null;
  if (_myLoadoutsMount.root && _myLoadoutsMount.host) {
    if (_myLoadoutsMount.host !== container || !_myLoadoutsMount.host.isConnected) {
      _myLoadoutsMount.root.unmount();
      _myLoadoutsMount.root = null;
      _myLoadoutsMount.host = null;
    }
  }
  if (!_myLoadoutsMount.root) {
    _myLoadoutsMount.root = createRoot(container);
    _myLoadoutsMount.host = container;
  }
  return _myLoadoutsMount.root;
}

function _bindMyLoadoutsListeners(): void {
  if (_listenerBound) return;
  const list = document.getElementById('dock-myl-list');
  if (!list) return;
  _listenerBound = true;
  list.addEventListener('click', (e: Event) => {
    const btn = (e.target as Element).closest('[data-lo-action]') as HTMLElement | null;
    if (!btn) return;
    const action = btn.dataset.loAction;
    const id = btn.dataset.id ?? '';
    switch (action) {
      case 'switchToLoadout':
        _confirmingRemoveLoadoutId = null;
        _myLoadoutsCbs.switchToLoadout(id);
        break;
      case 'shareLoadout':
        _confirmingRemoveLoadoutId = null;
        _myLoadoutsCbs.shareLoadout(id);
        break;
      case 'addLoadoutToCompare':
        _confirmingRemoveLoadoutId = null;
        _myLoadoutsCbs.addLoadoutToCompare(id);
        break;
      case 'confirmRemoveLoadout': confirmRemoveLoadout(id); break;
      case 'removeLoadout':
        _confirmingRemoveLoadoutId = null;
        _myLoadoutsCbs.removeLoadout(id);
        break;
      case 'renderMyLoadouts':
        _confirmingRemoveLoadoutId = null;
        renderMyLoadouts();
        break;
    }
  });
}

/**
 * Render the My Loadouts list in the dock
 */
export function renderMyLoadouts(): void {
  const listEl = document.getElementById('dock-myl-list');
  const countEl = document.getElementById('dock-myl-count');
  if (!listEl) return;

  const savedLoadouts = getSavedLoadouts();
  const activeLoadout = getActiveLoadout();

  if (countEl) countEl.textContent = String(savedLoadouts.length);
  if (_confirmingRemoveLoadoutId && !savedLoadouts.some((loadout) => loadout.id === _confirmingRemoveLoadoutId)) {
    _confirmingRemoveLoadoutId = null;
  }

  _bindMyLoadoutsListeners();
  const root = _ensureMyLoadoutsReactRoot(listEl);
  if (!root) return;

  const vm = buildMyLoadoutsViewModel(savedLoadouts, activeLoadout, _confirmingRemoveLoadoutId);
  root.render(createElement(MyLoadoutsList, { model: vm }));
}

/**
 * Two-step remove confirmation (QA-028)
 */
export function confirmRemoveLoadout(loadoutId: string): void {
  _confirmingRemoveLoadoutId = loadoutId;
  renderMyLoadouts();
}
