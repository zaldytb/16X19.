// src/components/shell/MobileTabBar.tsx
// Mobile bottom navigation tab bar

import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pathToMode } from '../../routing/modePaths.js';

const tabs = [
  {
    id: 'compendium',
    label: 'Bible',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="1" width="12" height="14" rx="1.5" />
        <line x1="5" y1="4" x2="11" y2="4" />
        <line x1="5" y1="7" x2="11" y2="7" />
        <line x1="5" y1="10" x2="9" y2="10" />
      </svg>
    ),
  },
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="1" y="8.5" width="12.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: 'tune',
    label: 'Tune',
    icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
        <line x1="7.5" y1="1.5" x2="7.5" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="7.5" y1="11" x2="7.5" y2="13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="1.5" y1="7.5" x2="4" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="11" y1="7.5" x2="13.5" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'compare',
    label: 'Compare',
    icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="2.5" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="9" y="2.5" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <line x1="7.5" y1="5" x2="7.5" y2="10" stroke="currentColor" strokeWidth="1.3" strokeDasharray="1.5 1.5" />
      </svg>
    ),
  },
  {
    id: 'optimize',
    label: 'Optimize',
    icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
        <path d="M2 11.5l3.5-3.5 2 2L11 5.5M11 5.5H8M11 5.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const modeToPath: Record<string, string> = {
  compendium: '/compendium',
  overview: '/',
  tune: '/tune',
  compare: '/compare',
  optimize: '/optimize',
};

export function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentMode = pathToMode(location.pathname);

  const handleTabClick = useCallback(
    (mode: string) => {
      const path = modeToPath[mode] || '/';
      navigate(path);
    },
    [navigate]
  );

  return (
    <nav className="mobile-tab-bar" id="mobile-tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`mobile-tab-btn ${currentMode === tab.id ? 'active' : ''}`}
          data-mode={tab.id}
          onClick={() => handleTabClick(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
