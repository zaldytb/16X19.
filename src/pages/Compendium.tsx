import { useEffect, useRef, useState } from 'react';
import { RacketBibleTab } from '../components/compendium/RacketBibleTab.js';
import { StringCompendiumTab } from '../components/compendium/StringCompendiumTab.js';
import { HardwareMount } from '../components/HardwareMount.js';
import { LeaderboardPanel } from '../components/leaderboard/LeaderboardPanel.js';
import { focusCompendiumFrame, focusCompendiumString, getCompendiumRouteState, clearCompendiumRouteFocus } from '../ui/pages/compendium-route-state.js';

interface CompendiumProps {
  initialTab?: 'rackets' | 'strings' | 'leaderboard';
}

type CompTab = 'rackets' | 'strings' | 'leaderboard';

export function Compendium({ initialTab = 'rackets' }: CompendiumProps) {
  const [activeTab, setActiveTab] = useState<CompTab>(initialTab);
  const [mountEpoch, setMountEpoch] = useState<Record<CompTab, number>>({
    rackets: 0,
    strings: 0,
    leaderboard: 0,
  });
  const routeEpochPrimed = useRef(false);
  const routeState = getCompendiumRouteState();

  useEffect(() => {
    const nextTab = routeState.activeTab ?? initialTab;
    setActiveTab(nextTab);
    if (routeEpochPrimed.current) {
      setMountEpoch((epoch) => ({ ...epoch, [nextTab]: epoch[nextTab] + 1 }));
    } else {
      routeEpochPrimed.current = true;
    }
    clearCompendiumRouteFocus();
  }, [initialTab, routeState.activeTab]);

  const handleTabClick = (tab: CompTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setMountEpoch((epoch) => ({ ...epoch, [tab]: epoch[tab] + 1 }));
  };

  const handleViewFrame = (racquetId: string) => {
    focusCompendiumFrame(racquetId);
    setActiveTab('rackets');
    setMountEpoch((epoch) => ({ ...epoch, rackets: epoch.rackets + 1 }));
  };

  const handleViewString = (stringId: string) => {
    focusCompendiumString(stringId);
    setActiveTab('strings');
    setMountEpoch((epoch) => ({ ...epoch, strings: epoch.strings + 1 }));
  };

  return (
    <section className="workspace-mode" id="mode-compendium" data-mode="compendium">
      <div className="route-panel-enter">
        <div className="w-full max-w-7xl mx-auto mb-10 mt-4">
          <div className="grid grid-cols-3 border border-dc-border">
            <button
              type="button"
              className={`comp-tab-btn py-4 md:py-5 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] border-r border-dc-border transition-colors ${activeTab === 'rackets' ? 'bg-dc-active-bg text-dc-active-text font-bold' : 'bg-transparent text-dc-storm hover:bg-dc-border/50 hover:text-dc-platinum'}`}
              data-comp-tab="rackets"
              onClick={() => handleTabClick('rackets')}
            >
              Rackets
            </button>
            <button
              type="button"
              className={`comp-tab-btn py-4 md:py-5 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] border-r border-dc-border transition-colors ${activeTab === 'strings' ? 'bg-dc-active-bg text-dc-active-text font-bold' : 'bg-transparent text-dc-storm hover:bg-dc-border/50 hover:text-dc-platinum'}`}
              data-comp-tab="strings"
              onClick={() => handleTabClick('strings')}
            >
              Strings
            </button>
            <button
              type="button"
              className={`comp-tab-btn py-4 md:py-5 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] transition-colors ${activeTab === 'leaderboard' ? 'bg-dc-active-bg text-dc-active-text font-bold' : 'bg-transparent text-dc-storm hover:bg-dc-border/50 hover:text-dc-platinum'}`}
              data-comp-tab="leaderboard"
              onClick={() => handleTabClick('leaderboard')}
            >
              Leaderboard
            </button>
          </div>
        </div>

        {activeTab === 'rackets' ? (
          <div className="comp-tab-panel" id="comp-tab-rackets">
            <HardwareMount replayKey={mountEpoch.rackets}>
              <RacketBibleTab focusedRacquetId={routeState.racquetId} />
            </HardwareMount>
          </div>
        ) : null}

        {activeTab === 'strings' ? (
          <div className="comp-tab-panel" id="comp-tab-strings">
            <HardwareMount replayKey={mountEpoch.strings}>
              <StringCompendiumTab focusedStringId={routeState.stringId} onGoToFrame={handleViewFrame} />
            </HardwareMount>
          </div>
        ) : null}

        {activeTab === 'leaderboard' ? (
          <div className="comp-tab-panel" id="comp-tab-leaderboard">
            <HardwareMount replayKey={mountEpoch.leaderboard}>
              <LeaderboardPanel onViewFrame={handleViewFrame} onViewString={handleViewString} />
            </HardwareMount>
          </div>
        ) : null}
      </div>
    </section>
  );
}
