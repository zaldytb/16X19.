// src/components/shell/BootLoader.tsx
// Boot animation loader component

import { useEffect, useRef } from 'react';

let bootSequenceIntervalId: ReturnType<typeof setInterval> | null = null;
let bootPendingTimeouts: number[] = [];

function clearBootPendingTimeouts(): void {
  for (const id of bootPendingTimeouts) {
    window.clearTimeout(id);
  }
  bootPendingTimeouts = [];
}

function clearDigicraftBootSequence(): void {
  if (bootSequenceIntervalId !== null) {
    window.clearInterval(bootSequenceIntervalId);
    bootSequenceIntervalId = null;
  }
  clearBootPendingTimeouts();
}

function runDigicraftBootSequence(): void {
  clearDigicraftBootSequence();

  const loader = document.getElementById('dc-boot-loader');
  const batteryTrack = document.getElementById('dc-boot-battery');
  const pctText = document.getElementById('dc-boot-pct');
  const logsContainer = document.getElementById('dc-boot-logs');

  if (!loader || !batteryTrack || !logsContainer) {
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

  bootSequenceIntervalId = window.setInterval(() => {
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
      if (bootSequenceIntervalId !== null) {
        window.clearInterval(bootSequenceIntervalId);
        bootSequenceIntervalId = null;
      }
      const fadeTimeout = window.setTimeout(() => {
        loader.classList.add('opacity-0');
        const removeTimeout = window.setTimeout(() => loader.remove(), 700);
        bootPendingTimeouts.push(removeTimeout);
      }, 120);
      bootPendingTimeouts.push(fadeTimeout);
    }
  }, 32);
}

export function BootLoader() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      runDigicraftBootSequence();
    }
    return () => clearDigicraftBootSequence();
  }, []);

  useEffect(() => {
    const maxMs = 8000;
    const t = window.setTimeout(() => {
      document.getElementById('dc-boot-loader')?.remove();
    }, maxMs);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      id="dc-boot-loader"
      className="fixed inset-0 z-[999] bg-dc-void flex flex-col items-center justify-center p-6 transition-opacity duration-700 ease-in-out"
    >
      <div className="w-full max-w-md bg-transparent border border-dc-border p-8 md:p-12 relative flex flex-col gap-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        {/* Targeting reticle corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-dc-platinum"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-dc-platinum"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-dc-platinum"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-dc-platinum"></div>

        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-dc-accent uppercase tracking-[0.2em] animate-pulse">
              // KERNEL_INIT
            </span>
            <h1 className="text-4xl md:text-5xl font-mono font-bold text-dc-platinum tracking-tighter leading-none mt-2">
              16<span className="text-dc-accent">X</span>19
            </h1>
          </div>
          <span className="font-mono text-[9px] text-dc-storm tracking-[0.2em]">v2.4.0</span>
        </div>

        {/* Progress battery */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-end font-mono text-[9px] tracking-widest uppercase">
            <span className="text-dc-storm">Synchronizing Grid</span>
            <span className="text-dc-platinum font-bold text-xs" id="dc-boot-pct">
              0%
            </span>
          </div>
          <div className="flex gap-[2px] h-1.5 w-full" id="dc-boot-battery"></div>
        </div>

        {/* Terminal log */}
        <div
          className="flex flex-col gap-1.5 font-mono text-[9px] tracking-[0.15em] text-dc-storm mt-2 h-14 overflow-hidden"
          id="dc-boot-logs"
        ></div>
      </div>
    </div>
  );
}
