import { lazy } from 'react';
import { Overview } from './Overview.js';

const CompendiumPage = lazy(async () => {
  const module = await import('./Compendium.js');
  return { default: module.Compendium };
});

const HowItWorksPage = lazy(async () => {
  const module = await import('./HowItWorks.js');
  return { default: module.HowItWorks };
});

const TunePage = lazy(async () => {
  const module = await import('./Tune.js');
  return { default: module.Tune };
});

const ComparePage = lazy(async () => {
  const module = await import('./Compare.js');
  return { default: module.Compare };
});

const OptimizePage = lazy(async () => {
  const module = await import('./Optimize.js');
  return { default: module.Optimize };
});

export function OverviewWorkspace() {
  return <Overview />;
}

export function TuneWorkspace() {
  return (
    <TunePage />
  );
}

export function CompareWorkspace() {
  return (
    <ComparePage />
  );
}

export function OptimizeWorkspace() {
  return <OptimizePage />;
}

export function CompendiumWorkspace() {
  return <CompendiumPage initialTab="rackets" />;
}

/** Strings tab — same component, different initial tab */
export function StringsWorkspace() {
  return <CompendiumPage initialTab="strings" />;
}

/** Leaderboard tab inside compendium shell */
export function LeaderboardWorkspace() {
  return <CompendiumPage initialTab="leaderboard" />;
}

export function HowItWorksWorkspace() {
  return <HowItWorksPage />;
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
