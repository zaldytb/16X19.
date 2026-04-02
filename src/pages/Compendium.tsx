import { useEffect } from 'react';
import { CompendiumFrameHud } from '../components/compendium/CompendiumFrameHud.js';
import { StringCompendiumHud } from '../components/compendium/StringCompendiumHud.js';
import { cleanupCompendiumPage, initCompendium, _compSwitchTab, _compToggleHud } from '../ui/pages/compendium.js';
import { cleanupLeaderboardPage } from '../ui/pages/leaderboard.js';
import { cleanupStringsPage, _stringToggleHud } from '../ui/pages/strings.js';

interface CompendiumProps {
  initialTab?: 'rackets' | 'strings' | 'leaderboard';
}

export function Compendium({ initialTab = 'rackets' }: CompendiumProps) {
  useEffect(() => {
    initCompendium();
    if (initialTab !== 'rackets') {
      _compSwitchTab(initialTab);
    }
    return () => {
      cleanupCompendiumPage();
      cleanupStringsPage();
      cleanupLeaderboardPage();
    };
  }, [initialTab]);

  return (
    <section className="workspace-mode" id="mode-compendium" data-mode="compendium">
      <div className="route-panel-enter">
        <div className="w-full max-w-7xl mx-auto mb-10 mt-4">
        <div className="grid grid-cols-3 border border-dc-border">
          <button className={`comp-tab-btn py-4 md:py-5 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] border-r border-dc-border transition-colors ${initialTab === 'rackets' ? 'bg-dc-active-bg text-dc-active-text font-bold' : 'bg-transparent text-dc-storm hover:bg-dc-border/50 hover:text-dc-platinum'}`} data-comp-tab="rackets" onClick={() => _compSwitchTab('rackets')}>Rackets</button>
          <button className={`comp-tab-btn py-4 md:py-5 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] border-r border-dc-border transition-colors ${initialTab === 'strings' ? 'bg-dc-active-bg text-dc-active-text font-bold' : 'bg-transparent text-dc-storm hover:bg-dc-border/50 hover:text-dc-platinum'}`} data-comp-tab="strings" onClick={() => _compSwitchTab('strings')}>Strings</button>
          <button className={`comp-tab-btn py-4 md:py-5 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] transition-colors ${initialTab === 'leaderboard' ? 'bg-dc-active-bg text-dc-active-text font-bold' : 'bg-transparent text-dc-storm hover:bg-dc-border/50 hover:text-dc-platinum'}`} data-comp-tab="leaderboard" onClick={() => _compSwitchTab('leaderboard')}>Leaderboard</button>
        </div>
        </div>

        <div className={`comp-tab-panel ${initialTab === 'rackets' ? '' : 'hidden'}`} id="comp-tab-rackets">
        <CompendiumFrameHud onClose={() => _compToggleHud()} />

        <div className="comp-layout">
          <div className="comp-main" id="comp-main">
            <div className="comp-empty">
              <p className="comp-empty-title">Select a frame</p>
              <p className="comp-empty-sub">Click the frame name above to browse the racket database.</p>
            </div>
          </div>
        </div>
        </div>

        <div className={`comp-tab-panel ${initialTab === 'strings' ? '' : 'hidden'}`} id="comp-tab-strings">
        <StringCompendiumHud onClose={() => _stringToggleHud()} />

        <div id="string-main" className="min-h-[400px] p-8">
          <div className="flex flex-col items-center justify-center h-64 text-dc-storm">
            <span className="font-mono text-4xl mb-4">🔧</span>
            <p className="font-mono text-sm">Loading string database...</p>
          </div>
        </div>
        </div>

        <div className={`comp-tab-panel ${initialTab === 'leaderboard' ? '' : 'hidden'}`} id="comp-tab-leaderboard">
          <div id="comp-leaderboard-root" className="min-h-full" />
        </div>
      </div>
    </section>
  );
}
