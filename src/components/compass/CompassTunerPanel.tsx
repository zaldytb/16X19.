// src/components/compass/CompassTunerPanel.tsx
// Mode 3 tuner: 11 stat weight sliders + presets.

import React, { useCallback } from 'react';
import type { TunerWeights, TunerPreset } from '../../compute/compass-engine.js';
import { TUNER_PRESETS, DEFAULT_WEIGHTS } from '../../compute/compass-engine.js';

interface TunerPanelProps {
  weights: TunerWeights;
  onWeightsChange: (weights: TunerWeights) => void;
  activePreset: string | null;
  onPresetSelect: (preset: TunerPreset | null) => void;
}

const ico = (d: string) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const SLIDERS: Array<{ key: keyof TunerWeights; label: string; icon: React.ReactNode }> = [
  { key: 'spin', label: 'Spin', icon: ico('M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z') },
  { key: 'power', label: 'Power', icon: ico('M13 2L3 14h9l-1 8 10-12h-9l1-8z') },
  { key: 'control', label: 'Control', icon: ico('M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0-14a4 4 0 110 8 4 4 0 010-8z') },
  { key: 'feel', label: 'Feel', icon: ico('M18 12a6 6 0 01-6 6 6 6 0 01-6-6c0-3 2-5.5 6-10 4 4.5 6 7 6 10z') },
  { key: 'comfort', label: 'Comfort', icon: ico('M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z') },
  { key: 'maneuverability', label: 'Maneuver.', icon: ico('M5 12h14M12 5l7 7-7 7') },
  { key: 'stability', label: 'Stability', icon: ico('M3 21h18M5 21V7l7-4 7 4v14') },
  { key: 'forgiveness', label: 'Forgive.', icon: ico('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z') },
  { key: 'launch', label: 'Launch', icon: ico('M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z') },
  { key: 'durability', label: 'Durability', icon: ico('M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71') },
  { key: 'playability', label: 'Playability', icon: ico('M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83') },
];

export function CompassTunerPanel({
  weights,
  onWeightsChange,
  activePreset,
  onPresetSelect,
}: TunerPanelProps) {
  const handleSliderChange = useCallback(
    (key: keyof TunerWeights, value: number) => {
      onWeightsChange({ ...weights, [key]: value });
      onPresetSelect(null);
    },
    [weights, onWeightsChange, onPresetSelect],
  );

  const handlePreset = useCallback(
    (preset: TunerPreset) => {
      onWeightsChange({ ...preset.weights });
      onPresetSelect(preset);
    },
    [onWeightsChange, onPresetSelect],
  );

  const handleReset = useCallback(() => {
    onWeightsChange({ ...DEFAULT_WEIGHTS });
    onPresetSelect(null);
  }, [onWeightsChange, onPresetSelect]);

  return (
    <div className="compass-tuner" id="compass-tuner-panel">
      <div className="compass-tuner-header">
        <h3 className="compass-tuner-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          Tuner Weights
        </h3>
        <button className="compass-tuner-reset" onClick={handleReset} type="button">Reset</button>
      </div>

      {/* Presets */}
      <div className="compass-tuner-presets">
        {TUNER_PRESETS.map(preset => (
          <button
            key={preset.name}
            type="button"
            className={`compass-tuner-preset-btn${activePreset === preset.name ? ' active' : ''}`}
            onClick={() => handlePreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div className="compass-tuner-sliders">
        {SLIDERS.map(({ key, label, icon }) => (
          <div key={key} className="compass-tuner-slider-row">
            <span className="compass-tuner-slider-icon">{icon}</span>
            <span className="compass-tuner-slider-label">{label}</span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={weights[key]}
              onChange={(e) => handleSliderChange(key, parseInt(e.target.value, 10))}
              className="compass-tuner-slider"
              id={`compass-tuner-${key}`}
            />
            <span className="compass-tuner-slider-value">{weights[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
