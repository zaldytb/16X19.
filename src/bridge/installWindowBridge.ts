// Tennis Loadout Lab - Vite Entry Point
// =====================================

import * as Shell from '../ui/pages/shell.js';
import * as Theme from '../ui/theme.js';

import * as DockCollapse from '../ui/components/dock-collapse.js';
import * as MobileDock from '../ui/components/mobile-dock.js';


let bootSequenceIntervalId: ReturnType<typeof setInterval> | null = null;
let bootPendingTimeouts: number[] = [];

function clearBootPendingTimeouts(): void {
  for (const id of bootPendingTimeouts) {
    window.clearTimeout(id);
  }
  bootPendingTimeouts = [];
}

/** Stop boot animation timers (e.g. React Strict Mode remount before finish). */
export function clearDigicraftBootSequence(): void {
  if (bootSequenceIntervalId !== null) {
    window.clearInterval(bootSequenceIntervalId);
    bootSequenceIntervalId = null;
  }
  clearBootPendingTimeouts();
}

export function runDigicraftBootSequence(): void {
  clearDigicraftBootSequence();

  const loader = document.getElementById('dc-boot-loader');
  const batteryTrack = document.getElementById('dc-boot-battery');
  const pctText = document.getElementById('dc-boot-pct');
  const logsContainer = document.getElementById('dc-boot-logs');

  if (!loader || !batteryTrack || !logsContainer) {
    // Avoid leaving a full-screen overlay up if markup/timing failed.
    if (loader) loader.remove();
    return;
  }
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const hasBootedThisSession = (() => {
    try {
      return window.sessionStorage.getItem('tll-boot-seen') === '1';
    } catch (_err) {
      return false;
    }
  })();

  if (reduceMotion || hasBootedThisSession) {
    loader.remove();
    return;
  }

  try {
    window.sessionStorage.setItem('tll-boot-seen', '1');
  } catch (_err) {
    // Ignore storage failures.
  }

  batteryTrack.innerHTML = '';
  logsContainer.innerHTML = '';

  const totalSegments = 10;
  const segments: HTMLDivElement[] = [];
  for (let i = 0; i < totalSegments; i += 1) {
    const segment = document.createElement('div');
    segment.className = 'flex-1 bg-black/10 dark:bg-white/5 transition-colors duration-75';
    batteryTrack.appendChild(segment);
    segments.push(segment);
  }

  const logs = [
    '> Loading 16x19.core.js...',
    '> Fetching global frame database...',
    '> Booting String Modulator V2...',
    '> Calibrating compare runtime...',
  ];

  let currentLog = 0;
  let progress = 0;

  const pushLog = () => {
    if (currentLog >= logs.length) return;
    const logLine = document.createElement('span');
    logLine.className = 'text-dc-storm';
    logLine.innerText = logs[currentLog];
    logsContainer.appendChild(logLine);
    currentLog += 1;
  };

  pushLog();

  const bootInterval = window.setInterval(() => {
    progress = Math.min(100, progress + 8);
    if (pctText) pctText.innerText = `${progress}%`;

    const filled = Math.round((progress / 100) * totalSegments);
    segments.forEach((segment, index) => {
      segment.className = index < filled
        ? 'flex-1 bg-dc-accent transition-colors duration-75'
        : 'flex-1 bg-black/10 dark:bg-white/5 transition-colors duration-75';
    });

    if (progress > 25 && currentLog === 1) pushLog();
    if (progress > 50 && currentLog === 2) pushLog();
    if (progress > 75 && currentLog === 3) pushLog();

    if (progress === 100) {
      window.clearInterval(bootInterval);
      bootSequenceIntervalId = null;
      const t1 = window.setTimeout(() => {
        loader.classList.add('opacity-0');
        const t2 = window.setTimeout(() => loader.remove(), 700);
        bootPendingTimeouts.push(t2);
      }, 120);
      bootPendingTimeouts.push(t1);
    }
  }, 32);
  bootSequenceIntervalId = bootInterval;
}

/**
 * Non-React shell init: Shell.init(), dock listeners.
 * Boot animation runs from App ShellLayout useLayoutEffect (after React commits markup).
 */
export function runVanillaAppInit(): void {
  try {
    Shell.init();
    Theme.handleResponsiveHeader();
    DockCollapse._initDockCollapse();

    const dock = document.getElementById('build-dock');
    if (dock && dock.dataset.scrollBound !== 'true') {
      dock.dataset.scrollBound = 'true';
      dock.addEventListener('scroll', function handleDockScroll() {
        dock.classList.toggle('dock-scrolled', dock.scrollTop > 0);
      }, { passive: true });
    }

    const dockBackdrop = document.getElementById('dock-backdrop');
    if (dockBackdrop && dockBackdrop.dataset.clickBound !== 'true') {
      dockBackdrop.dataset.clickBound = 'true';
      dockBackdrop.addEventListener('click', function handleDockBackdropClick() {
        const d = document.getElementById('build-dock');
        if (d && d.classList.contains('dock-expanded')) {
          MobileDock.toggleMobileDock();
        }
      });
    }
  } catch (e) {
    console.error('[Main] Error during initialization:', e);
  }
}
