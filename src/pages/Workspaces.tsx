import { useLayoutEffect } from 'react';
import { RawHtml } from '../components/RawHtml.js';
import { useActiveLoadout } from '../hooks/useStore.js';
import * as Shell from '../ui/pages/shell.js';

import overviewHtml from '../assets/workspace/overview.html?raw';
import tuneHtml from '../assets/workspace/tune.html?raw';
import compareHtml from '../assets/workspace/compare.html?raw';
import optimizeHtml from '../assets/workspace/optimize.html?raw';
import compendiumHtml from '../assets/workspace/compendium.html?raw';
import howitworksHtml from '../assets/workspace/howitworks.html?raw';

export function OverviewWorkspace() {
  const active = useActiveLoadout();
  useLayoutEffect(() => {
    window.renderDashboard?.();
  }, [active]);
  return <RawHtml html={overviewHtml} />;
}

export function TuneWorkspace() {
  const active = useActiveLoadout();
  useLayoutEffect(() => {
    Shell.wireTuneSlider();
    window.refreshTuneIfActive?.();
  }, [active]);
  return <RawHtml html={tuneHtml} />;
}

export function CompareWorkspace() {
  useLayoutEffect(() => {
    Shell.runCompareModeActivation();
  }, []);
  return <RawHtml html={compareHtml} />;
}

export function OptimizeWorkspace() {
  useLayoutEffect(() => {
    Shell.runOptimizeRouteActivation();
  }, []);
  return <RawHtml html={optimizeHtml} />;
}

export function CompendiumWorkspace() {
  useLayoutEffect(() => {
    Shell.runCompendiumRouteActivation({ tab: 'rackets' });
  }, []);
  return <RawHtml html={compendiumHtml} />;
}

/** Strings tab — same DOM as compendium; tab switched after init. */
export function StringsWorkspace() {
  useLayoutEffect(() => {
    Shell.runCompendiumRouteActivation({ tab: 'strings' });
  }, []);
  return <RawHtml html={compendiumHtml} />;
}

/** Leaderboard tab inside compendium shell */
export function LeaderboardWorkspace() {
  useLayoutEffect(() => {
    void import('../ui/pages/leaderboard.js').then(() => {
      Shell.runCompendiumRouteActivation({ tab: 'leaderboard' });
    });
  }, []);
  return <RawHtml html={compendiumHtml} />;
}

export function HowItWorksWorkspace() {
  return <RawHtml html={howitworksHtml} />;
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
