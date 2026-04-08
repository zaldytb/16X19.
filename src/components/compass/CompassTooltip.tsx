// src/components/compass/CompassTooltip.tsx
// Hover tooltip showing racket details + stats.

import type { CompassPoint, CompassMode } from '../../compute/compass-engine.js';
import { BRAND_COLORS } from '../../compute/compass-engine.js';

interface CompassTooltipProps {
  point: CompassPoint;
  mode: CompassMode;
  onActivate: (point: CompassPoint) => void;
}

const STAT_DISPLAY = [
  { key: 'spin', label: 'Spin' },
  { key: 'power', label: 'Power' },
  { key: 'control', label: 'Control' },
  { key: 'feel', label: 'Feel' },
  { key: 'comfort', label: 'Comfort' },
  { key: 'stability', label: 'Stability' },
  { key: 'maneuverability', label: 'Maneuver.' },
  { key: 'forgiveness', label: 'Forgive.' },
  { key: 'launch', label: 'Launch' },
] as const;

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="compass-minibar-track">
      <div className="compass-minibar-fill" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

export function CompassTooltip({ point, mode, onActivate }: CompassTooltipProps) {
  const color = BRAND_COLORS[point.brand] || BRAND_COLORS.Other;
  const stats = point.refStats || point.frameBase;
  const r = point.racquet;

  return (
    <div className="compass-tooltip" id="compass-tooltip">
      {/* Header */}
      <div className="compass-tooltip-header">
        <div className="compass-tooltip-brand" style={{ color }}>
          {point.brand}
        </div>
        <div className="compass-tooltip-name">{r.name}</div>
        <div className="compass-tooltip-meta">
          {r.headSize}sq in · {r.pattern} · {(r as { year?: number }).year || ''}
        </div>
      </div>

      {/* Scores */}
      <div className="compass-tooltip-scores">
        {mode !== 'performance' && (
          <div className="compass-tooltip-obs">
            <span className="compass-tooltip-obs-label">OBS</span>
            <span className="compass-tooltip-obs-value">{point.refObs}</span>
          </div>
        )}
        {mode === 'obs-tuner' && (
          <div className="compass-tooltip-custom">
            <span className="compass-tooltip-obs-label">TUNER</span>
            <span className="compass-tooltip-obs-value" style={{ color: '#a3e635' }}>{point.customScore}</span>
          </div>
        )}
      </div>

      {/* Stat bars */}
      <div className="compass-tooltip-stats">
        {STAT_DISPLAY.map(s => {
          const val = (stats as unknown as Record<string, number>)[s.key] ?? 0;
          return (
            <div key={s.key} className="compass-tooltip-stat-row">
              <span className="compass-tooltip-stat-label">{s.label}</span>
              <MiniBar value={val} color={color} />
              <span className="compass-tooltip-stat-value">{Math.round(val)}</span>
            </div>
          );
        })}
      </div>

      {/* Specs */}
      <div className="compass-tooltip-specs">
        <span>{r.strungWeight}g</span>
        <span>SW {r.swingweight}</span>
        <span>RA {r.stiffness}</span>
        <span>Beam {r.beamWidth.join('/')}</span>
      </div>

      {/* Activate button */}
      <button
        className="compass-tooltip-activate"
        onClick={() => onActivate(point)}
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        Activate Loadout
      </button>
    </div>
  );
}
