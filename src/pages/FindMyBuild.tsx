// src/pages/FindMyBuild.tsx
// Find My Build wizard - React component

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RACQUETS } from '../data/loader.js';
import type { Racquet } from '../engine/types.js';
import { generateTopBuilds } from '../state/presets.js';
import type { Build } from '../state/presets.js';
import { createLoadout, saveLoadout } from '../state/loadout.js';
import { activateLoadout } from '../ui/pages/shell.js';

interface FMBAnswers {
  swing: string | null;
  ball: string | null;
  court: string | null;
  painPoints: string[];
  priorities: string[];
}

interface FrameResult {
  racquet: Racquet;
  score: number;
  topBuilds: Build[];
}

interface FindMyBuildProps {
  onClose: () => void;
}

function buildToLoadout(frameId: string, build: Build) {
  const stringId = build.isHybrid
    ? (build.mains?.id || '')
    : (build.string?.id || '');

  return createLoadout(frameId, stringId, build.tension, {
    isHybrid: build.isHybrid,
    mainsId: build.mains?.id || null,
    crossesId: build.crosses?.id || null,
    crossesTension: build.crossesTension,
  });
}

const swingOptions = [
  { id: 'compact', label: 'Compact', desc: 'Short, efficient swing' },
  { id: 'moderate', label: 'Moderate', desc: 'Standard swing path' },
  { id: 'long', label: 'Long & Fast', desc: 'Full, powerful swing' },
];

const ballOptions = [
  { id: 'flat', label: 'Flat', desc: 'Prefer flat shots' },
  { id: 'topspin', label: 'Topspin', desc: 'Heavy topspin player' },
  { id: 'slice', label: 'Slice', desc: 'Use slice frequently' },
];

const courtOptions = [
  { id: 'hard', label: 'Hard Court', desc: 'Primarily hard courts' },
  { id: 'clay', label: 'Clay', desc: 'Primarily clay courts' },
  { id: 'grass', label: 'Grass', desc: 'Primarily grass courts' },
  { id: 'mixed', label: 'Mixed', desc: 'Play on all surfaces' },
];

const painOptions = [
  { id: 'elbow', label: 'Tennis Elbow', desc: 'Arm-friendly needed' },
  { id: 'shoulder', label: 'Shoulder', desc: 'Low swingweight' },
  { id: 'wrist', label: 'Wrist', desc: 'Flexible, dampened' },
  { id: 'none', label: 'No Issues', desc: 'No pain points' },
];

const priorityOptions = [
  { id: 'power', label: 'Power', desc: 'Maximize power' },
  { id: 'control', label: 'Control', desc: 'Precision & placement' },
  { id: 'spin', label: 'Spin', desc: 'Topspin generation' },
  { id: 'feel', label: 'Feel', desc: 'Touch & feedback' },
  { id: 'comfort', label: 'Comfort', desc: 'Arm-friendly' },
  { id: 'stability', label: 'Stability', desc: 'Plow-through' },
];

export function FindMyBuild({ onClose }: FindMyBuildProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [answers, setAnswers] = useState<FMBAnswers>({
    swing: null,
    ball: null,
    court: null,
    painPoints: [],
    priorities: [],
  });
  const [results, setResults] = useState<FrameResult[] | null>(null);

  const totalSteps = 5;
  const progress = step === 5 && results ? 100 : (step / totalSteps) * 100;

  const handleOptionSelect = useCallback((category: keyof FMBAnswers, value: string) => {
    setAnswers((prev) => {
      const current = prev[category];
      if (Array.isArray(current)) {
        const exists = current.includes(value);
        return {
          ...prev,
          [category]: exists
            ? current.filter((v) => v !== value)
            : [...current, value],
        };
      }
      return { ...prev, [category]: value };
    });
  }, []);

  const generateResults = useCallback(() => {
    // Simple scoring based on answers
    const frameScores = RACQUETS.map((racquet) => {
      let score = 50; // Base score

      // Adjust based on swing type
      if (answers.swing === 'compact' && racquet.swingweight < 320) score += 10;
      if (answers.swing === 'long' && racquet.swingweight > 320) score += 10;

      // Adjust based on pain points
      if (answers.painPoints.includes('elbow') && racquet.stiffness < 64) score += 15;
      if (answers.painPoints.includes('shoulder') && racquet.swingweight < 315) score += 10;

      // Adjust based on priorities
      if (answers.priorities.includes('power') && racquet.headSize > 100) score += 10;
      if (answers.priorities.includes('control') && racquet.headSize <= 100) score += 10;

      // Generate top builds for this frame
      const topBuilds = generateTopBuilds(racquet, 3);

      return { racquet, score, topBuilds };
    });

    // Sort by score and take top 5
    const sorted = frameScores.sort((a, b) => b.score - a.score).slice(0, 5);
    setResults(sorted);
  }, [answers]);

  const handleNext = useCallback(() => {
    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
      generateResults();
      setStep(5);
    }
  }, [step, generateResults]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const handleActivateBuild = useCallback((frameId: string, build: Build) => {
    const loadout = buildToLoadout(frameId, build);
    if (loadout) {
      activateLoadout(loadout);
      onClose();
    }
  }, [onClose]);

  const handleSaveBuild = useCallback((frameId: string, build: Build) => {
    const loadout = buildToLoadout(frameId, build);
    if (loadout) {
      saveLoadout(loadout);
    }
  }, []);

  const handleOptimizeFrame = useCallback((result: FrameResult) => {
    const topBuild = result.topBuilds[0];
    const loadout = topBuild ? buildToLoadout(result.racquet.id, topBuild) : null;
    if (loadout) {
      activateLoadout(loadout);
    }
    onClose();
    navigate('/optimize');
  }, [onClose, navigate]);

  return (
    <div className="fmb-wizard fixed inset-0 z-[200] bg-dc-void/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
      <div className="fmb-container w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-dc-void border border-dc-border shadow-2xl">
        {/* Header */}
        <div className="fmb-header flex items-center justify-between p-6 border-b border-dc-border">
          <div>
            <h2 className="font-mono text-lg font-bold text-dc-platinum">Find My Build</h2>
            <p className="text-dc-storm text-sm">Step {step} of {totalSteps}</p>
          </div>
          <button
            onClick={onClose}
            className="text-dc-storm hover:text-dc-platinum transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-dc-border">
          <div
            className="h-full bg-dc-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Swing Type */}
          {step === 1 && (
            <div className="fmb-step">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-dc-platinum mb-6">
                What&apos;s your swing type?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {swingOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect('swing', opt.id)}
                    className={`fmb-option p-4 border text-left transition-all ${
                      answers.swing === opt.id
                        ? 'border-dc-accent bg-dc-accent/5'
                        : 'border-dc-border hover:border-dc-storm'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold uppercase text-dc-platinum mb-1">
                      {opt.label}
                    </div>
                    <div className="text-dc-storm text-sm">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Ball Type */}
          {step === 2 && (
            <div className="fmb-step">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-dc-platinum mb-6">
                What type of shots do you prefer?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ballOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect('ball', opt.id)}
                    className={`fmb-option p-4 border text-left transition-all ${
                      answers.ball === opt.id
                        ? 'border-dc-accent bg-dc-accent/5'
                        : 'border-dc-border hover:border-dc-storm'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold uppercase text-dc-platinum mb-1">
                      {opt.label}
                    </div>
                    <div className="text-dc-storm text-sm">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Court Surface */}
          {step === 3 && (
            <div className="fmb-step">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-dc-platinum mb-6">
                What surface do you play on most?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courtOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect('court', opt.id)}
                    className={`fmb-option p-4 border text-left transition-all ${
                      answers.court === opt.id
                        ? 'border-dc-accent bg-dc-accent/5'
                        : 'border-dc-border hover:border-dc-storm'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold uppercase text-dc-platinum mb-1">
                      {opt.label}
                    </div>
                    <div className="text-dc-storm text-sm">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Pain Points & Priorities */}
          {step === 4 && (
            <div className="fmb-step space-y-6">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-dc-platinum mb-4">
                  Any pain points? (Optional, select all that apply)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {painOptions.map((opt) => {
                    const isSelected = answers.painPoints.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleOptionSelect('painPoints', opt.id)}
                        className={`px-3 py-2 border text-sm transition-all ${
                          isSelected
                            ? 'border-dc-accent bg-dc-accent/10 text-dc-accent'
                            : 'border-dc-border text-dc-storm hover:border-dc-storm'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-dc-platinum mb-4">
                  What are your top priorities? (Select 2-3)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((opt) => {
                    const isSelected = answers.priorities.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleOptionSelect('priorities', opt.id)}
                        className={`px-3 py-2 border text-sm transition-all ${
                          isSelected
                            ? 'border-dc-accent bg-dc-accent/10 text-dc-accent'
                            : 'border-dc-border text-dc-storm hover:border-dc-storm'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Results */}
          {step === 5 && results && (
            <div className="fmb-step">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-dc-platinum mb-6">
                Recommended Frames
              </h3>
              <div className="space-y-4">
                {results.map((result, idx) => (
                  <div
                    key={result.racquet.id}
                    className="border border-dc-border p-4 hover:border-dc-storm transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-xs font-bold text-dc-accent">
                            #{idx + 1}
                          </span>
                          <h4 className="font-sans text-base font-semibold text-dc-platinum">
                            {result.racquet.name}
                          </h4>
                        </div>
                        <div className="text-dc-storm text-sm space-x-3">
                          <span>{result.racquet.headSize} in²</span>
                          <span>•</span>
                          <span>{result.racquet.strungWeight}g</span>
                          <span>•</span>
                          <span>SW: {result.racquet.swingweight}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOptimizeFrame(result)}
                          className="px-3 py-1.5 border border-dc-accent text-dc-accent font-mono text-xs uppercase hover:bg-dc-accent hover:text-dc-ink transition-colors"
                        >
                          Optimize
                        </button>
                      </div>
                    </div>

                    {result.topBuilds.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-dc-border">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-dc-storm mb-3">
                          Top Builds
                        </p>
                        <div className="space-y-2">
                          {result.topBuilds.slice(0, 2).map((build, bidx) => (
                            <div
                              key={bidx}
                              className="flex items-center justify-between gap-4 p-2 bg-dc-void-lift"
                            >
                              <div className="text-sm">
                                <span className="text-dc-platinum">
                                  {build.isHybrid
                                    ? `${build.mains?.name || ''} / ${build.crosses?.name || ''}`
                                    : build.string?.name || ''}
                                </span>
                                <span className="text-dc-storm ml-2">
                                  @ {build.tension}lbs
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleActivateBuild(result.racquet.id, build)}
                                  className="px-2 py-1 text-xs font-mono uppercase text-dc-accent hover:underline"
                                >
                                  Activate
                                </button>
                                <button
                                  onClick={() => handleSaveBuild(result.racquet.id, build)}
                                  className="px-2 py-1 text-xs font-mono uppercase text-dc-storm hover:text-dc-platinum"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fmb-footer flex items-center justify-between p-6 border-t border-dc-border">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-4 py-2 border border-dc-border text-dc-storm font-mono text-xs uppercase tracking-widest hover:border-dc-storm hover:text-dc-platinum transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>

          {step < 5 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && !answers.swing) ||
                (step === 2 && !answers.ball) ||
                (step === 3 && !answers.court)
              }
              className="px-4 py-2 bg-dc-accent text-dc-ink font-mono text-xs font-bold uppercase tracking-widest hover:bg-dc-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-dc-platinum text-dc-void font-mono text-xs font-bold uppercase tracking-widest hover:bg-dc-white transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
