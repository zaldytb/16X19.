// src/components/shell/BootLoader.tsx
// Boot animation loader component

import { useEffect, useRef } from 'react';
import {
  clearDigicraftBootSequence,
  runDigicraftBootSequence,
} from '../../bridge/installWindowBridge.js';

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
