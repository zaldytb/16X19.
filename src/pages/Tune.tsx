// src/pages/Tune.tsx
// Tune page - React component wrapper around existing imperative rendering

import { useEffect, useRef } from 'react';
import { useActiveLoadout } from '../hooks/useStore.js';
import { wireTuneSlider } from '../ui/pages/shell.js';

export function Tune() {
  const activeLoadout = useActiveLoadout();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      // Prime the imperative Tune runtime after the route markup mounts.
      window.renderTune?.();
      wireTuneSlider();
    }
  }, []);

  useEffect(() => {
    if (initialized.current) {
      // Re-render when active loadout changes
      window.renderTune?.();
      wireTuneSlider();
    }
  }, [activeLoadout]);

  return (
    <section className="workspace-mode" id="mode-tune" data-mode="tune">
      <div className="tune-layout p-6">
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-dc-border">
          <div className="flex flex-col gap-1">
            <h2 className="font-mono text-[11px] font-bold tracking-[0.2em] text-dc-platinum uppercase">Tension tuning</h2>
            <p className="text-[13px] text-dc-storm font-normal leading-tight" id="tune-subtitle">— Select a setup to begin tuning</p>
          </div>
        </div>

        {/* Empty state when no setup */}
        <div className="text-center py-16 text-dc-storm text-sm" id="tune-empty">
          <p>Configure a frame and string, then explore tension tradeoffs.</p>
        </div>

        {/* Active tune panels */}
        <div className="flex flex-col gap-5 hidden" id="tune-panels">
          {/* Zone 1: OBS + Slider (always visible, side by side) */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-4 items-stretch">
            <div className="tune-card bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg hover:border-dc-storm transition-colors duration-200" id="tune-card-obs">
              <div className="flex items-center px-0.5 py-4 border-b border-dc-border">
                <h3 className="tune-card-title font-mono text-[11px] font-bold tracking-[0.15em] text-dc-platinum uppercase">Build score</h3>
              </div>
              <div className="obs-content px-0.5" id="obs-content"></div>
              <button className="tune-apply-btn hidden" id="tune-apply-btn" onClick={() => window.tuneSandboxCommit?.()}>Apply changes</button>
              <div className="optimal-content" id="optimal-content"></div>
            </div>
            <div className="tune-card bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg hover:border-dc-storm transition-colors duration-200" id="tune-card-slider">
              <div className="flex items-center justify-between px-0.5 py-4 border-b border-dc-border">
                <h3 className="tune-card-title font-mono text-[11px] font-bold tracking-[0.15em] text-dc-platinum uppercase">Tension explorer</h3>
                <div className="tune-hybrid-toggle" id="tune-hybrid-toggle"></div>
              </div>
              <div className="slider-content px-0.5" id="slider-content">
                <div className="slider-track-wrapper">
                  <div className="slider-labels">
                    <span className="slider-label-min" id="slider-label-min">40</span>
                    <span className="slider-label-max" id="slider-label-max">70</span>
                  </div>
                  <div className="slider-track" id="slider-track">
                    <div className="slider-optimal-zone" id="slider-optimal-zone"></div>
                    <div className="slider-baseline-marker" id="slider-baseline-marker"></div>
                    <input type="range" className="tune-slider" id="tune-slider" min="40" max="70" step="1" defaultValue="55" />
                  </div>
                  <div className="slider-value-display">
                    <span className="slider-current-label">Exploring</span>
                    <span className="slider-current-value" id="slider-current-value">55 lbs</span>
                  </div>
                </div>
                <div className="slider-best-value" id="slider-best-value"></div>
              </div>
            </div>
          </div>

          {/* Zone 2: Chart + Delta/WTTN */}
          <div className="mb-4">
            <div className="tune-card bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg hover:border-dc-storm transition-colors duration-200 mb-4" id="tune-card-chart">
              <div className="flex items-center px-0.5 py-4 border-b border-dc-border">
                <h3 className="tune-card-title font-mono text-[11px] font-bold tracking-[0.15em] text-dc-platinum uppercase">Response across tension</h3>
              </div>
              <div className="sweep-chart-container px-0.5">
                <canvas id="sweep-chart"></canvas>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="tune-card bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg hover:border-dc-storm transition-colors duration-200" id="tune-card-delta">
                <div className="flex items-center px-0.5 py-4 border-b border-dc-border">
                  <h3 className="tune-card-title font-mono text-[11px] font-bold tracking-[0.15em] text-dc-platinum uppercase">Delta vs baseline</h3>
                </div>
                <div className="delta-content px-0.5" id="delta-content"></div>
              </div>
              <div className="tune-card bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg hover:border-dc-storm transition-colors duration-200" id="tune-card-wttn">
                <div className="flex items-center px-3 py-4 border-b border-dc-border">
                  <h3 className="tune-card-title font-mono text-[11px] font-bold tracking-[0.15em] text-dc-platinum uppercase">What to try next</h3>
                </div>
                <div className="wttn-content px-3 overflow-x-auto" id="wttn-content"></div>
              </div>
            </div>
          </div>

          {/* Zone 3: Collapsed depth */}
          <details className="bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden mb-4" id="tune-details-recs">
            <summary className="flex items-center gap-3 px-0.5 py-4 cursor-pointer font-mono text-[11px] font-semibold text-dc-storm dark:text-dc-platinum tracking-[0.1em] uppercase select-none hover:text-dc-platinum dark:hover:text-dc-white transition-colors duration-200 list-none [&::-webkit-details-marker]:hidden">
              <svg className="w-3.5 h-3.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Recommended builds
            </summary>
            <div className="tune-card border-0 rounded-none shadow-none" id="tune-card-recs">
              <div className="recs-content px-0.5" id="recs-content"></div>
            </div>
          </details>

          <details className="bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden mb-4" id="tune-details-gauge">
            <summary className="flex items-center gap-3 px-0.5 py-4 cursor-pointer font-mono text-[11px] font-semibold text-dc-storm dark:text-dc-platinum tracking-[0.1em] uppercase select-none hover:text-dc-platinum dark:hover:text-dc-white transition-colors duration-200 list-none [&::-webkit-details-marker]:hidden">
              <svg className="w-3.5 h-3.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Gauge explorer
            </summary>
            <div className="tune-card border-0 rounded-none shadow-none" id="tune-card-gauge">
              <div className="gauge-explore-content px-0.5" id="gauge-explore-content"></div>
            </div>
          </details>

          <div className="hidden" id="tune-row-explore">
            <div className="tune-card bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg hover:border-dc-storm transition-colors duration-200" id="tune-card-explore">
              <div className="explore-content px-0.5" id="explore-content"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
