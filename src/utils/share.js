// Shareable URLs + Export/Import Utilities
// =========================================
// Self-contained utilities for sharing loadouts via URLs and JSON files

/**
 * Encode a loadout to a compact URL-safe string
 * @param {Object} lo - Loadout object
 * @returns {string} URL-safe base64 encoded string
 */
export function encodeLoadoutToURL(lo) {
  // Compact encoding: frameId|stringId|tension|crossesTension|isHybrid|mainsId|crossesId
  var parts = [
    lo.frameId || '',
    lo.stringId || '',
    lo.mainsTension || 53,
    lo.crossesTension || lo.mainsTension || 53,
    lo.isHybrid ? '1' : '0',
    lo.mainsId || '',
    lo.crossesId || ''
  ];
  return btoa(parts.join('|')).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Decode a loadout from a URL parameter
 * @param {string} encoded - URL-safe base64 encoded string
 * @returns {Object|null} Decoded loadout data or null if invalid
 */
export function decodeLoadoutFromURL(encoded) {
  try {
    // Re-add padding
    var padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (padded.length % 4) padded += '=';
    var decoded = atob(padded);
    var parts = decoded.split('|');
    if (parts.length < 3) return null;
    return {
      frameId: parts[0],
      stringId: parts[1] || null,
      mainsTension: parseInt(parts[2]) || 53,
      crossesTension: parseInt(parts[3]) || parseInt(parts[2]) || 53,
      isHybrid: parts[4] === '1',
      mainsId: parts[5] || null,
      crossesId: parts[6] || null
    };
  } catch(e) { return null; }
}

/**
 * Generate a shareable URL for a loadout
 * @param {Object} loadout - Loadout object
 * @returns {string} Full shareable URL
 */
export function generateShareURL(loadout) {
  var encoded = encodeLoadoutToURL(loadout);
  return window.location.origin + window.location.pathname + '?build=' + encoded;
}

/**
 * Show a toast notification
 * @param {string} msg - Message to display
 */
export function showShareToast(msg) {
  var toast = document.getElementById('share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'share-toast';
    toast.className = 'share-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('share-toast-show');
  setTimeout(function() { toast.classList.remove('share-toast-show'); }, 2500);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function() {
      return true;
    }).catch(function() {
      return false;
    });
  } else {
    // Fallback
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    var success = document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve(success);
  }
}

/**
 * Export loadouts to a JSON file
 * @param {Array} loadouts - Array of loadout objects
 * @param {Function} showToast - Toast notification function
 */
export function exportLoadoutsToFile(loadouts, showToast) {
  if (loadouts.length === 0) {
    showToast('No loadouts to export');
    return;
  }
  
  var exportData = {
    version: 1,
    exportDate: new Date().toISOString(),
    loadouts: loadouts.map(function(lo) {
      return {
        name: lo.name,
        frameId: lo.frameId,
        stringId: lo.stringId,
        isHybrid: lo.isHybrid,
        mainsId: lo.mainsId,
        crossesId: lo.crossesId,
        mainsTension: lo.mainsTension,
        crossesTension: lo.crossesTension,
        source: lo.source
      };
    })
  };
  
  var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
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
 * @param {string} jsonText - JSON file content
 * @param {Object} deps - Dependencies object with:
 *   - createLoadout: Function to create a loadout
 *   - saveLoadout: Function to save a loadout
 *   - savedLoadouts: Array of existing loadouts (for duplicate checking)
 *   - renderDockPanel: Function to re-render dock
 *   - showToast: Function to show notifications
 * @returns {number} Number of loadouts imported
 */
export function importLoadoutsFromJSON(jsonText, deps) {
  var data = JSON.parse(jsonText);
  if (!data.loadouts || !Array.isArray(data.loadouts)) {
    throw new Error('Invalid file format');
  }
  
  var imported = 0;
  data.loadouts.forEach(function(raw) {
    if (!raw.frameId) return;
    var opts = { source: raw.source || 'import', name: raw.name };
    if (raw.isHybrid) {
      opts.isHybrid = true;
      opts.mainsId = raw.mainsId;
      opts.crossesId = raw.crossesId;
      opts.crossesTension = raw.crossesTension;
    }
    var lo = deps.createLoadout(raw.frameId, raw.isHybrid ? raw.mainsId : raw.stringId, raw.mainsTension, opts);
    if (lo) {
      // Check for duplicate — full identity match including hybrid and crosses tension
      var isDupe = deps.savedLoadouts.some(function(existing) {
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
 * @returns {Object|null} Decoded loadout data or null if no valid share param
 */
export function parseSharedBuildFromURL() {
  var params = new URLSearchParams(window.location.search);
  var buildParam = params.get('build');
  if (!buildParam) return null;
  
  return decodeLoadoutFromURL(buildParam);
}
