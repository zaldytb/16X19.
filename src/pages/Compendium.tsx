import { useEffect } from 'react';
import { initCompendium, _compSwitchTab, _compToggleHud } from '../ui/pages/compendium.js';
import { _stringToggleHud } from '../ui/pages/strings.js';

interface CompendiumProps {
  initialTab?: 'rackets' | 'strings' | 'leaderboard';
}

export function Compendium({ initialTab = 'rackets' }: CompendiumProps) {
  useEffect(() => {
    initCompendium();
    if (initialTab !== 'rackets') {
      _compSwitchTab(initialTab);
    }
  }, [initialTab]);

  return (
    <section className="workspace-mode" id="mode-compendium" data-mode="compendium">
      <div className="w-full max-w-7xl mx-auto mb-10 mt-4">
        <div className="grid grid-cols-3 border border-dc-border">
          <button className={`comp-tab-btn py-4 md:py-5 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] border-r border-dc-border transition-colors ${initialTab === 'rackets' ? 'bg-dc-active-bg text-dc-active-text font-bold' : 'bg-transparent text-dc-storm hover:bg-dc-border/50 hover:text-dc-platinum'}`} data-comp-tab="rackets" onClick={() => _compSwitchTab('rackets')}>Rackets</button>
          <button className={`comp-tab-btn py-4 md:py-5 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] border-r border-dc-border transition-colors ${initialTab === 'strings' ? 'bg-dc-active-bg text-dc-active-text font-bold' : 'bg-transparent text-dc-storm hover:bg-dc-border/50 hover:text-dc-platinum'}`} data-comp-tab="strings" onClick={() => _compSwitchTab('strings')}>Strings</button>
          <button className={`comp-tab-btn py-4 md:py-5 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] transition-colors ${initialTab === 'leaderboard' ? 'bg-dc-active-bg text-dc-active-text font-bold' : 'bg-transparent text-dc-storm hover:bg-dc-border/50 hover:text-dc-platinum'}`} data-comp-tab="leaderboard" onClick={() => _compSwitchTab('leaderboard')}>Leaderboard</button>
        </div>
      </div>

      <div className={`comp-tab-panel ${initialTab === 'rackets' ? '' : 'hidden'}`} id="comp-tab-rackets">
        <div className="comp-query-hud fixed inset-0 z-[200] opacity-0 invisible pointer-events-none transition-all duration-300 flex flex-col p-8 md:p-16 [&.active]:opacity-100 [&.active]:visible [&.active]:pointer-events-auto" id="comp-hud">
          <button className="absolute top-6 right-6 bg-transparent border-none text-dc-storm dark:text-dc-platinum-dim hover:text-dc-platinum dark:hover:text-dc-platinum text-4xl cursor-pointer z-[210] transition-colors" onClick={() => _compToggleHud()}>×</button>
          <input type="text" className="w-full bg-transparent border-0 border-b-2 border-dc-storm focus:border-dc-accent font-mono text-2xl md:text-4xl tracking-tight text-dc-platinum pb-4 mb-8 outline-none transition-colors placeholder:text-dc-storm/50" id="comp-search" placeholder="Search frames..." />
          <div className="flex gap-4 flex-wrap mb-8">
            <select id="comp-filter-brand" className="comp-hud-filter-select"><option value="">All Brands</option></select>
            <select id="comp-filter-pattern" className="comp-hud-filter-select">
              <option value="">All Patterns</option>
              <option value="16x19">16x19</option>
              <option value="18x20">18x20</option>
              <option value="16x20">16x20</option>
              <option value="16x18">16x18</option>
            </select>
            <select id="comp-filter-stiffness" className="comp-hud-filter-select">
              <option value="">All Stiffness</option>
              <option value="soft">Soft (&le;59)</option>
              <option value="medium">Medium (60-65)</option>
              <option value="stiff">Stiff (66+)</option>
            </select>
            <select id="comp-filter-headsize" className="comp-hud-filter-select">
              <option value="">All Head Sizes</option>
              <option value="97">97</option>
              <option value="98">98</option>
              <option value="100">100</option>
              <option value="102">102+</option>
            </select>
            <select id="comp-filter-weight" className="comp-hud-filter-select">
              <option value="">All Weights</option>
              <option value="ultralight">&lt; 285g (Ultra-Light)</option>
              <option value="light">285-305g (Light)</option>
              <option value="medium">305-320g (Medium)</option>
              <option value="heavy">320-340g (Heavy)</option>
              <option value="tour">&gt; 340g (Tour)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto flex-1 pr-4" id="comp-frame-list"></div>
        </div>

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
        <div className="comp-query-hud fixed inset-0 z-[200] opacity-0 invisible pointer-events-none transition-all duration-300 flex flex-col p-8 md:p-16 [&.active]:opacity-100 [&.active]:visible [&.active]:pointer-events-auto" id="string-hud">
          <button className="absolute top-6 right-6 bg-transparent border-none text-dc-storm dark:text-dc-platinum-dim hover:text-dc-platinum dark:hover:text-dc-platinum text-4xl cursor-pointer z-[210] transition-colors" onClick={() => _stringToggleHud()}>×</button>
          <input type="text" className="w-full bg-transparent border-0 border-b-2 border-dc-storm focus:border-dc-accent font-mono text-2xl md:text-4xl tracking-tight text-dc-platinum pb-4 mb-8 outline-none transition-colors placeholder:text-dc-storm/50" id="string-search" placeholder="Search strings..." />
          <div className="flex gap-4 flex-wrap mb-8">
            <select id="string-filter-material" className="comp-hud-filter-select">
              <option value="">All Materials</option>
              <option value="Polyester">Polyester</option>
              <option value="Nylon">Nylon/Multifilament</option>
              <option value="Synthetic Gut">Synthetic Gut</option>
              <option value="Natural Gut">Natural Gut</option>
            </select>
            <select id="string-filter-shape" className="comp-hud-filter-select">
              <option value="">All Shapes</option>
              <option value="Round">Round</option>
              <option value="Square">Square</option>
              <option value="Pentagon">Pentagon</option>
              <option value="Hexagonal">Hexagonal</option>
              <option value="Octagonal">Octagonal</option>
              <option value="Rough">Rough/Textured</option>
            </select>
            <select id="string-filter-stiffness" className="comp-hud-filter-select">
              <option value="">All Stiffness</option>
              <option value="soft">Soft (&lt; 180)</option>
              <option value="medium">Medium (180-210)</option>
              <option value="stiff">Stiff (&gt; 210)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto flex-1 pr-4" id="string-list"></div>
        </div>

        <div id="string-main" className="min-h-[400px] p-8">
          <div className="flex flex-col items-center justify-center h-64 text-dc-storm">
            <span className="font-mono text-4xl mb-4">🔧</span>
            <p className="font-mono text-sm">Loading string database...</p>
          </div>
        </div>
      </div>

      <div className={`comp-tab-panel ${initialTab === 'leaderboard' ? '' : 'hidden'}`} id="comp-tab-leaderboard"></div>
    </section>
  );
}
