// Tennis Loadout Lab - Vite Entry Point
// =====================================

// Import CSS for Vite to process
import '../style.css';

// Import all app functionality
import * as App from '../app.js';

// Import state store for window bridge
import { getActiveLoadout, getSavedLoadouts, setActiveLoadout, setSavedLoadouts } from './state/store.js';

// Import leaderboard section
import * as Leaderboard from './ui/pages/leaderboard.js';

// Bridge: expose all exports to window for inline HTML handlers
// This maintains backward compatibility with onclick="funcName()" patterns
Object.entries(App).forEach(([key, val]) => {
  if (typeof val === 'function' || typeof val === 'object') {
    window[key] = val;
  }
});

// Bridge: expose state store functions to window
window.getActiveLoadout = getActiveLoadout;
window.getSavedLoadouts = getSavedLoadouts;
window.setActiveLoadout = setActiveLoadout;
window.setSavedLoadouts = setSavedLoadouts;

// Backward-compatible shims for inline HTML handlers that reference activeLoadout/savedLoadouts directly
Object.defineProperty(window, 'activeLoadout', {
  get: () => getActiveLoadout(),
  set: (v) => setActiveLoadout(v),
  configurable: true
});
Object.defineProperty(window, 'savedLoadouts', {
  get: () => getSavedLoadouts(),
  set: (v) => setSavedLoadouts(v),
  configurable: true
});

// Bridge leaderboard exports to window (needed for inline HTML handlers)
Object.entries(Leaderboard).forEach(([key, val]) => {
  if (typeof val === 'function' || key === '_lbv2State') {
    window[key] = val;
  }
});

// Initialize leaderboard with app dependencies
if (Leaderboard.initLeaderboardApp) {
  Leaderboard.initLeaderboardApp(App);
}

// Debug: confirm bridge worked (only in development)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  console.log('[Main] App exports bridged:', Object.keys(App).filter(k => typeof App[k] === 'function').length, 'functions');
}

// Initialize the app immediately (module scripts run after DOMContentLoaded)
// The DOMContentLoaded listener in app.js won't fire for module scripts
try {
  if (document.readyState === 'loading') {
    // DOM not ready yet, wait for event
    document.addEventListener('DOMContentLoaded', () => {
      // DOM ready, init app
      App.init();
      App.handleResponsiveHeader();
      App._initDockCollapse();
    });
  } else {
    // DOM already loaded, init immediately
    // DOM already loaded, init immediately
    App.init();
    App.handleResponsiveHeader();
    App._initDockCollapse();
  }
  
  // Also run the dock scroll shadow and backdrop handlers from app.js
  const dock = document.getElementById('build-dock');
  if (dock) {
    dock.addEventListener('scroll', function() {
      dock.classList.toggle('dock-scrolled', dock.scrollTop > 0);
    }, { passive: true });
  }
  
  const dockBackdrop = document.getElementById('dock-backdrop');
  if (dockBackdrop) {
    dockBackdrop.addEventListener('click', function() {
      const d = document.getElementById('build-dock');
      if (d && d.classList.contains('dock-expanded')) {
        App.toggleMobileDock();
      }
    });
  }
} catch (e) {
  console.error('[Main] Error during initialization:', e);
}
