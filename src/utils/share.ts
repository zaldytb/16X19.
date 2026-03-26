// Shareable URLs + Export/Import Utilities
// =========================================
// Self-contained utilities for sharing loadouts via URLs and JSON files

import type { SetupStats } from '../engine/types.js';

/** Loadout object shape used throughout the app */
export interface Loadout {
  id: string;
  name: string;
  frameId: string;
  stringId: string | null;
  isHybrid: boolean;
  mainsId: string | null;
  crossesId: string | null;
  mainsTension: number;
  crossesTension: number;
  gauge?: string | null;
  mainsGauge?: string | null;
  crossesGauge?: string | null;
  stats?: SetupStats;
  obs: number;
  identity?: string;
  source?: string;
  _dirty?: boolean;
}

/** Dependencies required for importLoadoutsFromJSON */
interface ImportDependencies {
  createLoadout: (
    frameId: string,
    stringId: string | null,
    tension: number,
    opts: {
      source?: string;
      name?: string;
      isHybrid?: boolean;
      mainsId?: string | null;
      crossesId?: string | null;
      crossesTension?: number;
    }
  ) => Loadout | null;
  saveLoadout: (loadout: Loadout) => void;
  savedLoadouts: Loadout[];
  renderDockPanel: () => void;
  showToast: (msg: string) => void;
}

/** Raw loadout data from URL decoding or JSON import */
interface DecodedLoadoutData {
  frameId: string;
  stringId: string | null;
  mainsTension: number;
  crossesTension: number;
  isHybrid: boolean;
  mainsId: string | null;
  crossesId: string | null;
}

/** Export data structure for JSON file */
interface ExportData {
  version: number;
  exportDate: string;
  loadouts: Array<{
    name: string;
    frameId: string;
    stringId: string | null;
    isHybrid: boolean;
    mainsId: string | null;
    crossesId: string | null;
    mainsTension: number;
    crossesTension: number;
    source?: string;
  }>;
}

/**
 * Encode a loadout to a compact URL-safe string
 * @param lo - Loadout object
 * @returns URL-safe base64 encoded string
 */
export function encodeLoadoutToURL(lo: Loadout): string {
  // Compact encoding: frameId|stringId|tension|crossesTension|isHybrid|mainsId|crossesId
  const parts = [
    lo.frameId || '',
    lo.stringId || '',
    String(lo.mainsTension || 53),
    String(lo.crossesTension || lo.mainsTension || 53),
    lo.isHybrid ? '1' : '0',
    lo.mainsId || '',
    lo.crossesId || ''
  ];
  return btoa(parts.join('|')).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Decode a loadout from a URL parameter
 * @param encoded - URL-safe base64 encoded string
 * @returns Decoded loadout data or null if invalid
 */
export function decodeLoadoutFromURL(encoded: string): DecodedLoadoutData | null {
  try {
    // Re-add padding
    let padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (padded.length % 4) padded += '=';
    const decoded = atob(padded);
    const parts = decoded.split('|');
    if (parts.length < 3) return null;
    return {
      frameId: parts[0],
      stringId: parts[1] || null,
      mainsTension: parseInt(parts[2], 10) || 53,
      crossesTension: parseInt(parts[3], 10) || parseInt(parts[2], 10) || 53,
      isHybrid: parts[4] === '1',
      mainsId: parts[5] || null,
      crossesId: parts[6] || null
    };
  } catch (e) { return null; }
}

/**
 * Generate a shareable URL for a loadout
 * @param loadout - Loadout object
 * @returns Full shareable URL
 */
export function generateShareURL(loadout: Loadout): string {
  const encoded = encodeLoadoutToURL(loadout);
  return window.location.origin + window.location.pathname + '?build=' + encoded;
}

/**
 * Show a toast notification
 * @param msg - Message to display
 */
export function showShareToast(msg: string): void {
  let toast = document.getElementById('share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'share-toast';
    toast.className = 'share-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('share-toast-show');
  setTimeout(() => toast!.classList.remove('share-toast-show'), 2500);
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Success status
 */
export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  } else {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve(success);
  }
}

/**
 * Export loadouts to a JSON file
 * @param loadouts - Array of loadout objects
 * @param showToast - Toast notification function
 */
export function exportLoadoutsToFile(loadouts: Loadout[], showToast: (msg: string) => void): void {
  if (loadouts.length === 0) {
    showToast('No loadouts to export');
    return;
  }
  
  const exportData: ExportData = {
    version: 1,
    exportDate: new Date().toISOString(),
    loadouts: loadouts.map(lo => ({
      name: lo.name,
      frameId: lo.frameId,
      stringId: lo.stringId,
      isHybrid: lo.isHybrid,
      mainsId: lo.mainsId,
      crossesId: lo.crossesId,
      mainsTension: lo.mainsTension,
      crossesTension: lo.crossesTension,
      source: lo.source
    }))
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tennis-loadout-lab-builds.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Loadouts exported!');
}

/**
 * Import loadouts from a JSON file
 * @param jsonText - JSON file content
 * @param deps - Dependencies object
 * @returns Number of loadouts imported
 */
export function importLoadoutsFromJSON(jsonText: string, deps: ImportDependencies): number {
  const data: Partial<ExportData> = JSON.parse(jsonText);
  if (!data.loadouts || !Array.isArray(data.loadouts)) {
    throw new Error('Invalid file format');
  }
  
  let imported = 0;
  data.loadouts.forEach(raw => {
    if (!raw.frameId) return;
    const opts: {
      source?: string;
      name?: string;
      isHybrid?: boolean;
      mainsId?: string | null;
      crossesId?: string | null;
      crossesTension?: number;
    } = { source: raw.source || 'import', name: raw.name };
    if (raw.isHybrid) {
      opts.isHybrid = true;
      opts.mainsId = raw.mainsId;
      opts.crossesId = raw.crossesId;
      opts.crossesTension = raw.crossesTension;
    }
    const lo = deps.createLoadout(raw.frameId, raw.isHybrid ? raw.mainsId : raw.stringId, raw.mainsTension, opts);
    if (lo) {
      // Check for duplicate — full identity match including hybrid and crosses tension
      const isDupe = deps.savedLoadouts.some(existing => {
        if (existing.frameId !== lo.frameId) return false;
        if (existing.mainsTension !== lo.mainsTension) return false;
        if (existing.crossesTension !== lo.crossesTension) return false;
        if ((existing.isHybrid || false) !== (lo.isHybrid || false)) return false;
        if (lo.isHybrid) {
          return existing.mainsId === lo.mainsId && existing.crossesId === lo.crossesId;
        }
        return existing.stringId === lo.stringId;
      });
      if (!isDupe) {
        deps.saveLoadout(lo);
        imported++;
      }
    }
  });
  
  return imported;
}

/**
 * Parse shared build from URL parameters
 * @returns Decoded loadout data or null if no valid share param
 */
export function parseSharedBuildFromURL(): DecodedLoadoutData | null {
  const params = new URLSearchParams(window.location.search);
  const buildParam = params.get('build');
  if (!buildParam) return null;
  
  return decodeLoadoutFromURL(buildParam);
}
