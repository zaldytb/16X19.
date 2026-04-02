// src/pages/Tune.tsx
// Tune page - React component wrapper around existing imperative rendering

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { HardwareMount } from '../components/HardwareMount.js';
import { useActiveLoadout, useCurrentMode } from '../hooks/useStore.js';
import {
  getTunePageChrome,
  onTuneSliderInput,
  refreshTuneIfActive,
  setTunePageMounted,
  subscribeTunePageChrome,
  tuneSandboxCommit,
} from '../ui/pages/tune.js';

export function Tune() {
  const initialized = useRef(false);
  const sliderValueRef = useRef<HTMLSpanElement>(null);
  const activeLoadout = useActiveLoadout();
  const currentMode = useCurrentMode();
  const chrome = useSyncExternalStore(subscribeTunePageChrome, getTunePageChrome, getTunePageChrome);

  useEffect(() => {
    setTunePageMounted(true);

    if (!initialized.current) {
      initialized.current = true;
      refreshTuneIfActive();
    }

    return () => {
      setTunePageMounted(false);
    };
  }, []);

  useEffect(() => {
    const valueEl = sliderValueRef.current;
    if (!valueEl || chrome.sliderPulseToken === 0) return;
    valueEl.classList.remove('slider-value-pulse');
    void valueEl.offsetHeight;
    valueEl.classList.add('slider-value-pulse');
  }, [chrome.sliderPulseToken]);

  useEffect(() => {
    if (currentMode !== 'tune' || !activeLoadout || !chrome.hasSetup) return;

    const retryTimer = window.setTimeout(() => {
      const wttnEmpty = (document.getElementById('wttn-content')?.childElementCount ?? 0) === 0;
      const recsEmpty = (document.getElementById('recs-content')?.childElementCount ?? 0) === 0;
      if (wttnEmpty || recsEmpty) {
        refreshTuneIfActive();
      }
    }, 220);

    return () => {
      window.clearTimeout(retryTimer);
    };
  }, [activeLoadout?.id, chrome.hasSetup, currentMode]);

  return (
    <section className="workspace-mode" id="mode-tune" data-mode="tune">
      <HardwareMount>
        <div className="tune-layout p-6">
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-dc-border">
            <div className="flex flex-col gap-1">
              <h2 className="font-mono text-[11px] font-bold tracking-[0.2em] text-dc-platinum uppercase">Tension tuning</h2>
              <p className="text-[13px] text-dc-storm font-normal leading-tight" id="tune-subtitle">{chrome.subtitle}</p>
            </div>
          </div>

          <div className={`text-center py-16 text-dc-storm text-sm ${chrome.hasSetup ? 'hidden' : ''}`} id="tune-empty">
            <p>Configure a frame and string, then explore tension tradeoffs.</p>
          </div>

          <div className={`flex flex-col gap-5 ${chrome.hasSetup ? '' : 'hidden'}`} id="tune-panels">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-4 items-stretch">
              <div className="tune-card bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg hover:border-dc-storm transition-colors duration-200" id="tune-card-obs">
                <div className="flex items-center px-0.5 py-4 border-b border-dc-border">
                  <h3 className="tune-card-title font-mono text-[11px] font-bold tracking-[0.15em] text-dc-platinum uppercase">Build score</h3>
                </div>
                <div className="obs-content px-0.5" id="obs-content"></div>
                <button
                  className={`tune-apply-btn ${chrome.applyButtonVisible ? '' : 'hidden'}`}
                  id="tune-apply-btn"
                  onClick={() => tuneSandboxCommit()}
                >
                  {chrome.applyButtonText}
                </button>
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
                      <span className="slider-label-min" id="slider-label-min">{chrome.sliderMin}</span>
                      <span className="slider-label-max" id="slider-label-max">{chrome.sliderMax}</span>
                    </div>
                    <div className="slider-track" id="slider-track">
                      <div
                        id="tune-slider-adornments-root"
                        className="tune-slider-adornments-root"
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      />
                      <input
                        type="range"
                        className="tune-slider"
                        id="tune-slider"
                        min={chrome.sliderMin}
                        max={chrome.sliderMax}
                        step="1"
                        value={chrome.sliderValue}
                        onInput={(event) => onTuneSliderInput(event.nativeEvent)}
                        onChange={() => {}}
                      />
                    </div>
                    <div className="slider-value-display">
                      <span className="slider-current-label">{chrome.sliderCurrentLabel}</span>
                      <span ref={sliderValueRef} className="slider-current-value" id="slider-current-value">{chrome.sliderCurrentValue}</span>
                    </div>
                  </div>
                  <div className="slider-best-value" id="slider-best-value"></div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="tune-card bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg hover:border-dc-storm transition-colors duration-200 mb-4" id="tune-card-chart">
                <div className="flex items-center px-0.5 py-4 border-b border-dc-border">
                  <h3 className="tune-card-title font-mono text-[11px] font-bold tracking-[0.15em] text-dc-platinum uppercase">Response across tension</h3>
                </div>
                <div className="sweep-chart-container px-0.5" id="sweep-chart-root" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="tune-card bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg hover:border-dc-storm transition-colors duration-200" id="tune-card-delta">
                  <div className="flex items-center px-0.5 py-4 border-b border-dc-border">
                    <h3 className="tune-card-title font-mono text-[11px] font-bold tracking-[0.15em] text-dc-platinum uppercase">{chrome.deltaTitle}</h3>
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

            <details className="bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden mb-4" id="tune-details-recs">
              <summary className="flex items-center gap-3 px-0.5 py-4 cursor-pointer font-mono text-[11px] font-semibold text-dc-storm dark:text-dc-platinum tracking-[0.1em] uppercase select-none hover:text-dc-platinum dark:hover:text-dc-white transition-colors duration-200 list-none [&::-webkit-details-marker]:hidden">
                <svg className="w-3.5 h-3.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
      </HardwareMount>
    </section>
  );
}
