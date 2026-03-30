import { useEffect } from 'react';
import * as Shell from '../ui/pages/shell.js';
import { HowItWorks } from './HowItWorks.js';
import { Overview } from './Overview.js';
import { Optimize } from './Optimize.js';
import { Compendium } from './Compendium.js';
import { Tune } from './Tune.js';
import { Compare } from './Compare.js';

export function OverviewWorkspace() {
  return <Overview />;
}

export function TuneWorkspace() {
  return <Tune />;
}

export function CompareWorkspace() {
  return <Compare />;
}

export function OptimizeWorkspace() {
  useEffect(() => {
    // Legacy initialization after React render
    const timer = setTimeout(() => {
      window.initOptimize?.();
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return <Optimize />;
}

export function CompendiumWorkspace() {
  return <Compendium initialTab="rackets" />;
}

/** Strings tab — same component, different initial tab */
export function StringsWorkspace() {
  return <Compendium initialTab="strings" />;
}

/** Leaderboard tab inside compendium shell */
export function LeaderboardWorkspace() {
  useEffect(() => {
    // Ensure leaderboard module is loaded
    void import('../ui/pages/leaderboard.js');
  }, []);
  return <Compendium initialTab="leaderboard" />;
}

export function HowItWorksWorkspace() {
  return <HowItWorks />;
}

export function MyLoadoutsWorkspace() {
  return (
    <section className="workspace-mode" id="mode-my-loadouts" data-mode="overview">
      <div className="p-8 max-w-2xl">
        <h2 className="font-mono text-[11px] font-bold tracking-[0.2em] text-dc-platinum uppercase mb-4">
          My Loadouts
        </h2>
        <p className="text-dc-storm text-sm mb-6">
          Saved loadouts live in the dock. Use the builder panel to activate, share, or compare builds.
        </p>
      </div>
    </section>
  );
}
