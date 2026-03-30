// src/components/shell/Header.tsx
// Site header with navigation

import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext.js';
import { getCurrentMode, setCurrentMode } from '../../state/app-state.js';
import { _syncLegacyModeState } from '../../ui/pages/shell.js';
import { pathToMode } from '../../routing/modePaths.js';
import { syncViews } from '../../runtime/coordinator.js';

const modeIcons: Record<string, React.ReactNode> = {
  compendium: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="1" width="12" height="14" rx="1.5" />
      <line x1="5" y1="4" x2="11" y2="4" />
      <line x1="5" y1="7" x2="11" y2="7" />
      <line x1="5" y1="10" x2="9" y2="10" />
    </svg>
  ),
  overview: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1" y="8.5" width="12.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  tune: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="7.5" y1="1.5" x2="7.5" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="7.5" y1="11" x2="7.5" y2="13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1.5" y1="7.5" x2="4" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="11" y1="7.5" x2="13.5" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
    </svg>
  ),
  compare: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="2.5" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="2.5" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <line x1="7.5" y1="5" x2="7.5" y2="10" stroke="currentColor" strokeWidth="1.3" strokeDasharray="1.5 1.5" />
    </svg>
  ),
  optimize: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 11.5l3.5-3.5 2 2L11 5.5M11 5.5H8M11 5.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const modes = [
  { id: 'compendium', label: 'Bible', path: '/compendium' },
  { id: 'overview', label: 'Overview', path: '/' },
  { id: 'tune', label: 'Tune', path: '/tune' },
  { id: 'compare', label: 'Compare', path: '/compare' },
  { id: 'optimize', label: 'Optimize', path: '/optimize' },
];

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const currentMode = pathToMode(location.pathname);

  const handleModeClick = useCallback(
    (mode: string, path: string) => {
      if (mode !== getCurrentMode()) {
        setCurrentMode(mode as any);
        _syncLegacyModeState(mode);
      }
      navigate(path);
      syncViews('mode-click', { mode: true, dockEditorContext: true });
    },
    [navigate]
  );

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <header className="site-header">
      <div className="header-dock-region">
        <div
          className="flex items-center gap-4 group cursor-pointer"
          onClick={handleReload}
        >
          <div className="grid grid-cols-4 gap-1 w-10 h-10 border border-dc-border p-1 group-hover:border-dc-accent transition-colors">
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-accent animate-pulse w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
            <div className="bg-dc-storm/20 w-full h-full"></div>
          </div>

          <div className="flex flex-col">
            <h1 className="font-mono text-2xl font-bold tracking-[-0.05em] text-dc-platinum leading-none">
              16<span className="text-dc-accent">X</span>19
            </h1>
            <p className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.3em] mt-1">
              Prediction Engine // v2.4.0
            </p>
          </div>
        </div>

        <div className="mobile-header-actions">
          <button
            className="mobile-theme-btn"
            onClick={toggleTheme}
            title="Toggle Light/Dark Mode"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            className="mobile-info-btn"
            data-mode="howitworks"
            id="btn-mode-howitworks-mobile"
            title="How It Works"
            onClick={() => navigate('/how-it-works')}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M5.8 5.8a1.7 1.7 0 0 1 3.3.5c0 1.1-1.6 1.5-1.6 1.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7.5" cy="10.8" r="0.6" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      <div className="header-workspace-region">
        <div className="header-actions">
          <nav className="mode-switcher mode-switcher--segmented" id="mode-switcher" aria-label="Main workspace">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`mode-btn ${currentMode === mode.id ? 'active' : ''}`}
                data-mode={mode.id}
                id={`btn-mode-${mode.id}`}
                title={
                  mode.id === 'compendium'
                    ? 'Racket Bible — frame database'
                    : mode.label
                }
                onClick={() => handleModeClick(mode.id, mode.path)}
              >
                {modeIcons[mode.id]}
                <span>{mode.label}</span>
              </button>
            ))}
          </nav>
          <div className="header-actions-trail">
            <button
              type="button"
              className="mode-btn mode-btn-util mode-btn-util--square"
              data-mode="howitworks"
              id="btn-mode-howitworks"
              title="How It Works"
              onClick={() => navigate('/how-it-works')}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path
                  d="M5.8 5.8a1.7 1.7 0 0 1 3.3.5c0 1.1-1.6 1.5-1.6 1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="7.5" cy="10.8" r="0.6" fill="currentColor" />
              </svg>
            </button>
            <button type="button" className="btn-theme" id="btn-theme" title="Toggle Light/Dark Mode" onClick={toggleTheme}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
