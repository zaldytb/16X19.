// src/pages/Compass.tsx
// 16×19 Compass — multi-mode 4-axis racket mapping page.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CompassChart } from '../components/compass/CompassChart.js';
import { CompassTooltip } from '../components/compass/CompassTooltip.js';
import { CompassTunerPanel } from '../components/compass/CompassTunerPanel.js';
import {
  computeAllPoints,
  computePerformancePositions,
  computeObsRankingPositions,
  computeTunerPositions,
  BRAND_COLORS,
  DEFAULT_WEIGHTS,
  type CompassPoint,
  type CompassMode,
  type TunerWeights,
  type TunerPreset,
} from '../compute/compass-engine.js';
import { createLoadout } from '../state/loadout.js';
import { useAppStore } from '../state/useAppStore.js';

const MODE_ICONS: Record<CompassMode, React.ReactNode> = {
  performance: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
    </svg>
  ),
  'obs-ranking': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="4" width="4" height="17" rx="1" /><rect x="17" y="8" width="4" height="13" rx="1" />
    </svg>
  ),
  'obs-tuner': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
};

const MODE_LABELS: Record<CompassMode, { title: string; sub: string }> = {
  performance: {
    title: 'Performance',
    sub: 'Frame physics mapping',
  },
  'obs-ranking': {
    title: 'OBS Ranking',
    sub: 'Score leaning analysis',
  },
  'obs-tuner': {
    title: 'OBS Tuner',
    sub: 'Custom playstyle scoring',
  },
};

const REF_STRING_ID = 'restring-slap-17';
const REF_TENSION = 50;

export function Compass() {
  const [mode, setMode] = useState<CompassMode>('performance');
  const [hoveredPoint, setHoveredPoint] = useState<CompassPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<CompassPoint | null>(null);
  const [weights, setWeights] = useState<TunerWeights>({ ...DEFAULT_WEIGHTS });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const setActiveLoadout = useAppStore(s => s.setActiveLoadout);
  const addSavedLoadout = useAppStore(s => s.addSavedLoadout);
  const activeLoadout = useAppStore(s => s.activeLoadout);

  // Compute all racket base data once
  const rawPoints = useMemo(() => computeAllPoints(), []);

  // Positioned points per mode
  const points = useMemo(() => {
    switch (mode) {
      case 'performance':
        return computePerformancePositions(rawPoints);
      case 'obs-ranking':
        return computeObsRankingPositions(rawPoints);
      case 'obs-tuner':
        return computeTunerPositions(rawPoints, weights);
    }
  }, [rawPoints, mode, weights]);

  // Extract unique brands
  const brands = useMemo(() => {
    const set = new Set(rawPoints.map(p => p.brand));
    return Array.from(set).sort();
  }, [rawPoints]);

  const toggleBrand = useCallback((brand: string) => {
    setBrandFilter(prev => {
      if (prev.includes(brand)) return prev.filter(b => b !== brand);
      return [...prev, brand];
    });
  }, []);

  const handleDotClick = useCallback((point: CompassPoint) => {
    setSelectedPoint(prev => prev?.racquet.id === point.racquet.id ? null : point);
  }, []);

  const handleDotHover = useCallback((point: CompassPoint | null) => {
    setHoveredPoint(point);
  }, []);

  // Activate a racket as a loadout (with ReString Slap @ 50lbs)
  const handleActivateLoadout = useCallback((point: CompassPoint) => {
    const lo = createLoadout(point.racquet.id, REF_STRING_ID, REF_TENSION, {
      source: 'compass',
    });
    if (lo) {
      setActiveLoadout(lo);
      addSavedLoadout(lo);
    }
  }, [setActiveLoadout, addSavedLoadout]);

  const tooltipPoint = selectedPoint || hoveredPoint;

  // Sort points so dots for active/hovered racket render on top
  const sortedPoints = useMemo(() => {
    return [...points].sort((a, b) => {
      const aWeight = (a.racquet.id === hoveredPoint?.racquet.id ? 100 : 0) +
        (a.racquet.id === selectedPoint?.racquet.id ? 50 : 0) +
        (a.racquet.id === activeLoadout?.frameId ? 25 : 0);
      const bWeight = (b.racquet.id === hoveredPoint?.racquet.id ? 100 : 0) +
        (b.racquet.id === selectedPoint?.racquet.id ? 50 : 0) +
        (b.racquet.id === activeLoadout?.frameId ? 25 : 0);
      return aWeight - bWeight;
    });
  }, [points, hoveredPoint, selectedPoint, activeLoadout]);

  return (
    <section className="workspace-mode" id="mode-compass" data-mode="compass">
      <div className="route-panel-enter">
        {/* Page header */}
        <div className="compass-page-header">
          <div className="compass-page-header-text">
            <span className="font-mono text-[10px] text-dc-accent uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-dc-accent animate-pulse" /> 16×19 COMPASS
            </span>
            <h1 className="compass-page-title">Racket Universe</h1>
            <p className="compass-page-subtitle">
              {rawPoints.length} frames mapped across {brands.length} brands. Switch modes to change the analytical lens.
            </p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="compass-mode-tabs" id="compass-mode-tabs">
          {(Object.keys(MODE_LABELS) as CompassMode[]).map(m => (
            <button
              key={m}
              type="button"
              className={`compass-mode-tab${mode === m ? ' active' : ''}`}
              onClick={() => setMode(m)}
              id={`compass-mode-${m}`}
            >
              <span className="compass-mode-tab-icon">{MODE_ICONS[m]}</span>
              <span className="compass-mode-tab-title">{MODE_LABELS[m].title}</span>
              <span className="compass-mode-tab-sub">{MODE_LABELS[m].sub}</span>
            </button>
          ))}
        </div>

        {/* Main layout */}
        <div className={`compass-layout${mode === 'obs-tuner' ? ' compass-layout--tuner' : ''}`}>
          {/* Brand filter sidebar */}
          <div className="compass-sidebar">
            <div className="compass-brand-filter">
              <h4 className="compass-filter-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Brands
              </h4>
              <div className="compass-brand-list">
                {brands.map(brand => {
                  const color = BRAND_COLORS[brand] || BRAND_COLORS.Other;
                  const active = brandFilter.length === 0 || brandFilter.includes(brand);
                  const count = rawPoints.filter(p => p.brand === brand).length;
                  return (
                    <button
                      key={brand}
                      type="button"
                      className={`compass-brand-btn${active ? ' active' : ''}`}
                      onClick={() => toggleBrand(brand)}
                      id={`compass-brand-${brand.toLowerCase()}`}
                    >
                      <span className="compass-brand-dot" style={{ backgroundColor: color }} />
                      <span className="compass-brand-name">{brand}</span>
                      <span className="compass-brand-count">{count}</span>
                    </button>
                  );
                })}
              </div>
              {brandFilter.length > 0 && (
                <button
                  type="button"
                  className="compass-brand-clear"
                  onClick={() => setBrandFilter([])}
                >
                  Show All
                </button>
              )}
            </div>

            {/* Legend */}
            <div className="compass-legend">
              <h4 className="compass-filter-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/>
                </svg>
                Guide
              </h4>
              {mode === 'obs-ranking' && (
                <div className="compass-legend-item">
                  <span className="compass-legend-dot compass-legend-dot--small" />
                  <span className="compass-legend-dot compass-legend-dot--medium" />
                  <span className="compass-legend-dot compass-legend-dot--large" />
                  <span className="compass-legend-text">Dot size = OBS score</span>
                </div>
              )}
              {mode === 'obs-tuner' && (
                <div className="compass-legend-item">
                  <span className="compass-legend-dot compass-legend-dot--dim" />
                  <span className="compass-legend-dot compass-legend-dot--bright" />
                  <span className="compass-legend-text">Brightness = tuner score</span>
                </div>
              )}
              <div className="compass-legend-footnote">
                Ref: ReString Slap @ 50lbs
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="compass-chart-wrapper">
            <CompassChart
              points={sortedPoints}
              mode={mode}
              weights={weights}
              activeRacquetId={activeLoadout?.frameId ?? null}
              onDotClick={handleDotClick}
              onDotHover={handleDotHover}
              hoveredPoint={hoveredPoint}
              brandFilter={brandFilter}
            />

            {/* Tooltip overlay — absolute inside chart wrapper */}
            {tooltipPoint && (
              <div className="compass-tooltip-anchor">
                <CompassTooltip
                  point={tooltipPoint}
                  mode={mode}
                  onActivate={handleActivateLoadout}
                />
              </div>
            )}
          </div>

          {/* Tuner panel (Mode 3 only) */}
          {mode === 'obs-tuner' && (
            <CompassTunerPanel
              weights={weights}
              onWeightsChange={setWeights}
              activePreset={activePreset}
              onPresetSelect={(p) => setActivePreset(p?.name ?? null)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
