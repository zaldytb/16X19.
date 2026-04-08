// src/components/compass/CompassChart.tsx
// The main SVG compass visualization — axes, dots, hover tooltips.

import { useCallback, useMemo, useRef, useState } from 'react';
import type { CompassPoint, CompassMode, TunerWeights } from '../../compute/compass-engine.js';
import { BRAND_COLORS, MODE_AXES } from '../../compute/compass-engine.js';

interface CompassChartProps {
  points: CompassPoint[];
  mode: CompassMode;
  weights?: TunerWeights;
  activeRacquetId: string | null;
  onDotClick: (point: CompassPoint) => void;
  onDotHover: (point: CompassPoint | null) => void;
  hoveredPoint: CompassPoint | null;
  brandFilter: string[];
}

const SIZE = 620;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = SIZE / 2 - 70;

function toCanvas(x: number, y: number): { cx: number; cy: number } {
  // Clamp to circle boundary
  const dist = Math.sqrt(x * x + y * y);
  const clamped = dist > 0.95 ? 0.95 / dist : 1;
  return {
    cx: CX + x * clamped * RADIUS,
    cy: CY - y * clamped * RADIUS, // SVG y is inverted
  };
}

function getDotRadius(point: CompassPoint, mode: CompassMode): number {
  if (mode === 'obs-ranking') {
    return 4 + (point.refObs / 100) * 8;
  }
  if (mode === 'obs-tuner') {
    return 4 + (point.customScore / 100) * 8;
  }
  return 6;
}

function getDotOpacity(point: CompassPoint, mode: CompassMode): number {
  if (mode === 'obs-ranking') {
    return 0.4 + (point.refObs / 100) * 0.6;
  }
  if (mode === 'obs-tuner') {
    return 0.3 + (point.customScore / 100) * 0.7;
  }
  return 0.85;
}

export function CompassChart({
  points,
  mode,
  weights,
  activeRacquetId,
  onDotClick,
  onDotHover,
  hoveredPoint,
  brandFilter,
}: CompassChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const axes = MODE_AXES[mode];

  const filtered = useMemo(() => {
    if (brandFilter.length === 0) return points;
    return points.filter(p => brandFilter.includes(p.brand));
  }, [points, brandFilter]);

  const handleDotEnter = useCallback((p: CompassPoint) => {
    onDotHover(p);
  }, [onDotHover]);

  const handleDotLeave = useCallback(() => {
    onDotHover(null);
  }, [onDotHover]);

  /* Render dashed concentric rings at 33% and 66% of radius */
  const rings = [0.33, 0.66, 1.0];

  return (
    <div className="compass-chart-container">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="compass-svg"
        aria-label="16x19 Compass — racket positioning chart"
      >
        <defs>
          {/* Glow filter for high-score dots */}
          <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="dot-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <circle cx={CX} cy={CY} r={RADIUS + 20} fill="rgba(0,0,0,0.3)" />

        {/* Concentric rings */}
        {rings.map((r, i) => (
          <circle
            key={i}
            cx={CX}
            cy={CY}
            r={RADIUS * r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={r === 1 ? 1.5 : 1}
            strokeDasharray={r < 1 ? '4 6' : 'none'}
          />
        ))}

        {/* Axis lines */}
        <line x1={CX} y1={CY - RADIUS} x2={CX} y2={CY + RADIUS} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <line x1={CX - RADIUS} y1={CY} x2={CX + RADIUS} y2={CY} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* Axis labels */}
        <text x={CX} y={CY - RADIUS - 16} textAnchor="middle" className="compass-axis-label">{axes.north}</text>
        <text x={CX + RADIUS + 16} y={CY + 4} textAnchor="start" className="compass-axis-label">{axes.east}</text>
        <text x={CX} y={CY + RADIUS + 28} textAnchor="middle" className="compass-axis-label">{axes.south}</text>
        <text x={CX - RADIUS - 16} y={CY + 4} textAnchor="end" className="compass-axis-label">{axes.west}</text>

        {/* Axis arrow tips */}
        <polygon points={`${CX},${CY - RADIUS - 4} ${CX - 4},${CY - RADIUS + 4} ${CX + 4},${CY - RADIUS + 4}`} fill="rgba(255,255,255,0.25)" />
        <polygon points={`${CX + RADIUS + 4},${CY} ${CX + RADIUS - 4},${CY - 4} ${CX + RADIUS - 4},${CY + 4}`} fill="rgba(255,255,255,0.25)" />
        <polygon points={`${CX},${CY + RADIUS + 4} ${CX - 4},${CY + RADIUS - 4} ${CX + 4},${CY + RADIUS - 4}`} fill="rgba(255,255,255,0.25)" />
        <polygon points={`${CX - RADIUS - 4},${CY} ${CX - RADIUS + 4},${CY - 4} ${CX - RADIUS + 4},${CY + 4}`} fill="rgba(255,255,255,0.25)" />

        {/* Racket dots */}
        {filtered.map((p) => {
          const { cx, cy } = toCanvas(p.position.x, p.position.y);
          const r = getDotRadius(p, mode);
          const opacity = getDotOpacity(p, mode);
          const color = BRAND_COLORS[p.brand] || BRAND_COLORS.Other;
          const isHovered = hoveredPoint?.racquet.id === p.racquet.id;
          const isActive = activeRacquetId === p.racquet.id;
          // Only glow on hover/active — not by default on OBS modes
          const showGlow = isHovered || isActive;

          return (
            <g key={p.racquet.id} className="compass-dot-group">
              {/* Hit area (larger invisible circle for easier click) */}
              <circle
                cx={cx}
                cy={cy}
                r={Math.max(r + 6, 12)}
                fill="transparent"
                className="compass-dot-hitarea"
                onMouseEnter={() => handleDotEnter(p)}
                onMouseLeave={handleDotLeave}
                onClick={() => onDotClick(p)}
              />
              {/* Active ring */}
              {isActive && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 5}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  opacity={0.6}
                  className="compass-dot-active-ring"
                />
              )}
              {/* Dot */}
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? r * 1.4 : r}
                fill={color}
                opacity={isHovered ? 1 : opacity}
                filter={showGlow ? 'url(#dot-glow)' : undefined}
                className="compass-dot"
                style={{ transition: 'r 0.2s ease, opacity 0.2s ease, cx 0.5s cubic-bezier(.4,0,.2,1), cy 0.5s cubic-bezier(.4,0,.2,1)' }}
              />
              {/* Brand initial on larger dots */}
              {r >= 7 && (
                <text
                  x={cx}
                  y={cy + 3}
                  textAnchor="middle"
                  className="compass-dot-label"
                  style={{ fontSize: `${Math.max(7, r - 1)}px`, pointerEvents: 'none' }}
                >
                  {p.brand.charAt(0)}
                </text>
              )}
            </g>
          );
        })}

        {/* Center crosshair */}
        <circle cx={CX} cy={CY} r={3} fill="rgba(255,255,255,0.3)" />
      </svg>
    </div>
  );
}
