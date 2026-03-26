// Tennis Loadout Lab - Vite Entry Point
// =====================================

// Import CSS for Vite to process
import '../style.css';

// Import all app functionality
import * as App from '../app.js';

// Import leaderboard section (registers itself)
import '../app-leaderboard-section.js';

// Bridge: expose all exports to window for inline HTML handlers
// This maintains backward compatibility with onclick="funcName()" patterns
Object.entries(App).forEach(([key, val]) => {
  if (typeof val === 'function' || typeof val === 'object') {
    window[key] = val;
  }
});

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
