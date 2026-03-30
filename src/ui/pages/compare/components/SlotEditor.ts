/**
 * Slot Editor Modal Component
 * Modal for editing a compare slot
 */

import type { Loadout, Racquet, StringData } from '../../../../engine/types.js';
import type { SlotId } from '../types.js';
import { getSlotColor } from '../types.js';
import { getSavedLoadouts } from '../../../../state/store.js';

export interface SlotEditorProps {
  slotId: SlotId;
  currentLoadout: Loadout | null;
  racquets: Racquet[];
  strings: StringData[];
  onSave: (slotId: SlotId, loadout: Loadout, stats: any) => void;
  onCancel: () => void;
}

interface EditorState {
  frameId: string;
  stringId: string;
  isHybrid: boolean;
  mainsId: string;
  crossesId: string;
  mainsTension: number;
  crossesTension: number;
}

function getInitialState(loadout: Loadout | null): EditorState {
  if (!loadout) {
    return {
      frameId: '',
      stringId: '',
      isHybrid: false,
      mainsId: '',
      crossesId: '',
      mainsTension: 53,
      crossesTension: 51
    };
  }
  
  return {
    frameId: loadout.frameId,
    stringId: loadout.stringId || '',
    isHybrid: loadout.isHybrid || false,
    mainsId: loadout.mainsId || '',
    crossesId: loadout.crossesId || '',
    mainsTension: loadout.mainsTension,
    crossesTension: loadout.crossesTension
  };
}

function renderSavedLoadoutOptions(): string {
  const saved = getSavedLoadouts();
  if (!saved || saved.length === 0) return '';
  
  const options = saved.map(lo => {
    const name = (lo as any).name || 'Unnamed';
    return `<option value="${lo.id}">${name}</option>`;
  }).join('');
  
  return `
    <div class="editor-section">
      <label class="editor-label">Load from My Loadouts</label>
      <select class="editor-select" id="editor-loadout-select" data-compare-action="loadFromSaved">
        <option value="">— Select a saved loadout —</option>
        ${options}
      </select>
    </div>
  `;
}

function renderFrameSelect(racquets: Racquet[], selectedId: string): string {
  const options = racquets.map(r => {
    const selected = r.id === selectedId ? 'selected' : '';
    return `<option value="${r.id}" ${selected}>${r.name}</option>`;
  }).join('');
  
  return `
    <div class="editor-section">
      <label class="editor-label">Frame</label>
      <select class="editor-select" id="editor-frame-select">
        <option value="">— Choose a frame —</option>
        ${options}
      </select>
    </div>
  `;
}

function renderStringModeToggle(isHybrid: boolean): string {
  return `
    <div class="editor-section">
      <label class="editor-label">String Configuration</label>
      <div class="editor-toggle">
        <button type="button" 
                class="editor-toggle-btn ${!isHybrid ? 'active' : ''}" 
                data-mode="full"
                data-compare-action="editorSetHybrid" data-compare-arg="false">Full Bed</button>
        <button type="button" 
                class="editor-toggle-btn ${isHybrid ? 'active' : ''}" 
                data-mode="hybrid"
                data-compare-action="editorSetHybrid" data-compare-arg="true">Hybrid</button>
      </div>
    </div>
  `;
}

function renderStringSelects(strings: StringData[], state: EditorState): string {
  const stringOptions = strings.map(s => {
    return `<option value="${s.id}">${s.name}</option>`;
  }).join('');
  
  if (state.isHybrid) {
    const mainsSelected = state.mainsId ? strings.find(s => s.id === state.mainsId)?.id : '';
    const crossesSelected = state.crossesId ? strings.find(s => s.id === state.crossesId)?.id : '';
    
    return `
      <div class="editor-section">
        <label class="editor-label">Mains</label>
        <select class="editor-select" id="editor-mains-select">
          <option value="">— Choose mains —</option>
          ${stringOptions.replace(`value="${mainsSelected}"`, `value="${mainsSelected}" selected`)}
        </select>
      </div>
      
      <div class="editor-section">
        <label class="editor-label">Crosses</label>
        <select class="editor-select" id="editor-crosses-select">
          <option value="">— Choose crosses —</option>
          ${stringOptions.replace(`value="${crossesSelected}"`, `value="${crossesSelected}" selected`)}
        </select>
      </div>
    `;
  }
  
  const stringSelected = state.stringId ? strings.find(s => s.id === state.stringId)?.id : '';
  
  return `
    <div class="editor-section">
      <label class="editor-label">String</label>
      <select class="editor-select" id="editor-string-select">
        <option value="">— Choose a string —</option>
        ${stringOptions.replace(`value="${stringSelected}"`, `value="${stringSelected}" selected`)}
      </select>
    </div>
  `;
}

function renderTensionInputs(state: EditorState): string {
  return `
    <div class="editor-section editor-tensions">
      <div class="editor-tension">
        <label class="editor-label">Mains Tension</label>
        <div class="editor-tension-control">
          <input type="range" 
                 id="editor-mains-tension" 
                 min="20" 
                 max="70" 
                 value="${state.mainsTension}"
                 data-compare-action="updateTension" data-compare-arg="mains">
          <span class="editor-tension-value" id="editor-mains-tension-display">${state.mainsTension} lbs</span>
        </div>
      </div>
      
      <div class="editor-tension">
        <label class="editor-label">Crosses Tension</label>
        <div class="editor-tension-control">
          <input type="range" 
                 id="editor-crosses-tension" 
                 min="20" 
                 max="70" 
                 value="${state.crossesTension}"
                 data-compare-action="updateTension" data-compare-arg="crosses">
          <span class="editor-tension-value" id="editor-crosses-tension-display">${state.crossesTension} lbs</span>
        </div>
      </div>
    </div>
  `;
}

export function renderSlotEditor(props: SlotEditorProps): string {
  const { slotId, currentLoadout, racquets, strings } = props;
  const color = getSlotColor(slotId);
  const state = getInitialState(currentLoadout);
  
  return `
    <div class="compare-editor-modal" id="compare-editor-modal" data-slot-id="${slotId}">
      <div class="compare-editor-backdrop" data-compare-action="editorCancel"></div>
      <div class="compare-editor-content">
        <div class="compare-editor-header">
          <span class="compare-editor-title">// EDIT SLOT ${color.label}</span>
          <button class="compare-editor-close" data-compare-action="editorCancel"></button>
        </div>
        
        <div class="compare-editor-body">
          ${renderSavedLoadoutOptions()}
          
          <div class="editor-divider"></div>
          
          ${renderFrameSelect(racquets, state.frameId)}
          ${renderStringModeToggle(state.isHybrid)}
          ${renderStringSelects(strings, state)}
          ${renderTensionInputs(state)}
        </div>
        
        <div class="compare-editor-footer">
          <button class="editor-btn editor-btn-secondary" data-compare-action="editorCancel">Cancel</button>
          <button class="editor-btn editor-btn-primary" data-compare-action="editorSave">Apply Changes</button>
        </div>
      </div>
    </div>
  `;
}

export function mountSlotEditor(container: HTMLElement, props: SlotEditorProps): () => void {
  container.insertAdjacentHTML('beforeend', renderSlotEditor(props));
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  
  return () => {
    const modal = document.getElementById('compare-editor-modal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
  };
}

export function getEditorFormData(): Partial<Loadout> | null {
  const frameSelect = document.getElementById('editor-frame-select') as HTMLSelectElement | null;
  const stringSelect = document.getElementById('editor-string-select') as HTMLSelectElement | null;
  const mainsSelect = document.getElementById('editor-mains-select') as HTMLSelectElement | null;
  const crossesSelect = document.getElementById('editor-crosses-select') as HTMLSelectElement | null;
  const mainsTension = document.getElementById('editor-mains-tension') as HTMLInputElement | null;
  const crossesTension = document.getElementById('editor-crosses-tension') as HTMLInputElement | null;
  
  const frameId = frameSelect?.value;
  if (!frameId) return null;
  
  const isHybrid = !!mainsSelect && mainsSelect.offsetParent !== null;
  
  if (isHybrid) {
    return {
      frameId,
      isHybrid: true,
      mainsId: mainsSelect?.value || '',
      crossesId: crossesSelect?.value || '',
      mainsTension: parseInt(mainsTension?.value || '53'),
      crossesTension: parseInt(crossesTension?.value || '51')
    };
  }
  
  return {
    frameId,
    isHybrid: false,
    stringId: stringSelect?.value || '',
    mainsTension: parseInt(mainsTension?.value || '53'),
    crossesTension: parseInt(crossesTension?.value || '51')
  };
}
