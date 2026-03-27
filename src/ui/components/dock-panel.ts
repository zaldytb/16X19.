// src/ui/components/dock-panel.ts
// Dock panel UI helpers and mode-specific renderers

import type { Loadout } from '../../engine/types.js';
import { getActiveLoadout } from '../../state/store.js';

/** Action link for dock context panel */
export interface DockAction {
  label: string;
  onclick: string;
}

/**
 * Generate context action links HTML
 */
export function _dockContextActions(actions: DockAction[]): string {
  if (!actions || actions.length === 0) return '';
  return '<div class="dock-ctx-actions">' +
    actions.map(function(a) {
      return '<a class="dock-ctx-action" onclick="' + a.onclick + '">' + a.label + '</a>';
    }).join('') +
  '</div>';
}

/**
 * Generate guidance message HTML (empty state helper)
 */
export function _dockGuidance(iconSvg: string, title: string, body: string): string {
  return (
    '<div class="border border-[var(--dc-border)] bg-[var(--dc-void-deep)] p-4 flex flex-col items-center text-center gap-2">' +
      '<div class="w-8 h-8 flex items-center justify-center text-dc-platinum">' + iconSvg + '</div>' +
      '<div class="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--dc-platinum)]">' + title + '</div>' +
      '<div class="font-sans text-[11px] text-[var(--dc-storm)] leading-relaxed">' + body + '</div>' +
    '</div>'
  );
}

/** Icon SVGs for dock guidance messages */
export const _dockIcons = {
  racket: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="7" ry="4"/><path d="M12 10v10"/><path d="M9 20h6"/></svg>',
  tune: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m4.22-13.22l-4.24 4.24m-4.24 4.24l4.24 4.24M23 12h-6m-6 0H1m18.22 4.22l-4.24-4.24m-4.24-4.24l-4.24 4.24"/></svg>',
  compare: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="16" rx="1"/><rect x="13" y="4" width="7" height="16" rx="1"/></svg>',
  optimize: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  reference: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
};

/**
 * Return editor controls to their home location
 */
export function _dockReturnEditorHome(): void {
  const editorBody = document.querySelector('.dock-editor-body');
  const editorSection = document.getElementById('dock-editor-section');
  if (!editorBody || !editorSection) return;

  // Only return if it's currently outside its home
  if (editorBody.parentElement !== editorSection) {
    editorSection.appendChild(editorBody);
  }
  (editorSection as HTMLElement).style.display = '';
}

/**
 * Move editor body into context panel
 */
export function _dockRelocateEditorToContext(container: HTMLElement): boolean {
  const editorBody = document.querySelector('.dock-editor-body');
  const editorSection = document.getElementById('dock-editor-section');
  if (!editorBody) return false;

  // Move editor body into context panel
  container.appendChild(editorBody);

  // Hide the empty <details> shell
  if (editorSection) editorSection.style.display = 'none';
  return true;
}

/**
 * Safely clear a container without destroying the editor body if it's inside
 */
export function _dockClearNonEditor(container: HTMLElement): void {
  const editorBody = container.querySelector('.dock-editor-body');
  // Remove all children except the editor body
  while (container.firstChild) {
    if (container.firstChild === editorBody) break;
    container.removeChild(container.firstChild);
  }
  // Remove children after the editor body too
  if (editorBody) {
    while (editorBody.nextSibling) {
      container.removeChild(editorBody.nextSibling);
    }
  }
}

/**
 * Get current loadout for dock rendering
 * Convenience wrapper for dock panel functions
 */
export function _getDockLoadout(): Loadout | null {
  return getActiveLoadout();
}
