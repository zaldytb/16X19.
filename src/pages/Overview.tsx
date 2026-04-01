import { useEffect } from 'react';
import { _initLandingSearch } from '../ui/pages/shell.js';
import { renderDashboard } from '../ui/pages/overview.js';

async function runFindMyBuildAction(
  action: 'openFindMyBuild' | 'closeFindMyBuild' | 'fmbBack' | 'fmbNext',
): Promise<void> {
  const mod = await import('../ui/pages/find-my-build.js');
  mod[action]();
}

export function Overview() {
  useEffect(() => {
    _initLandingSearch();
  }, []);

  useEffect(() => {
    // Live overview updates are coordinated through `syncViews()`.
    // Rendering once on mount avoids flattening the hero OBS animation
    // with a second immediate render from the route wrapper.
    renderDashboard();
  }, []);

  return (
    <section className="workspace-mode" id="mode-overview" data-mode="overview">
      <div id="mobile-loadout-pills" className="mobile-loadout-pills"></div>

      <div id="empty-state" className="flex flex-col items-center justify-center min-h-[75vh] w-full px-4 md:px-8">
        <div className="w-full max-w-4xl flex flex-col gap-12 relative">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-dc-accent uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-dc-accent animate-pulse"></span> AWAITING TELEMETRY
            </span>
            <h2 className="text-5xl md:text-6xl font-semibold tracking-tighter text-dc-platinum leading-none">Initialize Loadout.</h2>
          </div>

          <div className="relative w-full group">
            <div className="flex items-center bg-transparent border border-dc-border focus-within:border-dc-accent transition-colors">
              <div className="pl-6 text-dc-storm group-focus-within:text-dc-accent transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <input type="text" className="w-full bg-transparent border-none text-2xl md:text-3xl font-mono text-dc-platinum placeholder:text-dc-storm/40 py-6 px-6 outline-none" id="landing-search" placeholder="Enter frame designation..." autoComplete="off" />
            </div>
            <div className="hidden absolute top-full left-0 w-full bg-dc-void border border-dc-border mt-2 z-50 shadow-2xl max-h-96 overflow-y-auto" id="landing-search-dropdown"></div>
            <div className="flex gap-4 mt-4 font-mono text-[9px] text-dc-storm uppercase tracking-widest">
              <span>Targets:</span>
              {['Pure Aero 98', 'Blade 98', 'Ezone 100'].map((target) => (
                <span
                  key={target}
                  className="text-dc-platinum hover:text-dc-accent cursor-pointer transition-colors"
                  onClick={() => {
                    const input = document.getElementById('landing-search') as HTMLInputElement | null;
                    if (!input) return;
                    input.value = target;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                  }}
                >
                  {target}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full opacity-60">
            <div className="h-[1px] bg-dc-border flex-1"></div>
            <span className="font-mono text-[9px] text-dc-storm uppercase tracking-[0.3em]">OR RUN DIAGNOSTIC</span>
            <div className="h-[1px] bg-dc-border flex-1"></div>
          </div>

          <button className="group w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 bg-transparent border border-dc-border hover:border-dc-platinum transition-all cursor-pointer text-left" id="fmb-cta" onClick={() => { void runFindMyBuildAction('openFindMyBuild'); }}>
            <div className="flex items-start gap-6">
              <div className="mt-1 w-10 h-10 border border-dc-storm group-hover:border-dc-platinum flex items-center justify-center text-dc-storm group-hover:text-dc-void group-hover:bg-dc-platinum transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-2xl font-semibold text-dc-platinum tracking-tight group-hover:translate-x-1 transition-transform">Find My Build Algorithm</span>
                <span className="font-mono text-[11px] text-dc-storm uppercase tracking-widest">Execute 5-step player profile calibration</span>
              </div>
            </div>
            <div className="text-dc-storm group-hover:text-dc-platinum transition-colors md:group-hover:translate-x-2 duration-300 hidden md:block">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          </button>
        </div>
      </div>

      <div id="find-my-build" className="fmb-wizard hidden">
        <div className="fmb-progress"><div className="fmb-progress-fill" id="fmb-progress-fill" style={{ width: '20%' }}></div></div>

        <div className="fmb-header">
          <button className="fmb-close" id="fmb-close" onClick={() => { void runFindMyBuildAction('closeFindMyBuild'); }} title="Close">&times;</button>
        </div>

        <div className="fmb-step" data-step="1" id="fmb-step-1">
          <h3 className="fmb-question">How would you describe your swing?</h3>
          <div className="fmb-options" data-key="swing">
            <button className="fmb-option" data-value="compact"><span className="fmb-option-title">Compact &amp; Quick</span><span className="fmb-option-desc">Short take-back, fast hands, values maneuverability</span></button>
            <button className="fmb-option" data-value="smooth"><span className="fmb-option-title">Full &amp; Smooth</span><span className="fmb-option-desc">Medium swing, balanced tempo, all-around strokes</span></button>
            <button className="fmb-option" data-value="heavy"><span className="fmb-option-title">Long &amp; Heavy</span><span className="fmb-option-desc">Big take-back, heavy ball, wants stability and plow-through</span></button>
          </div>
        </div>

        <div className="fmb-step hidden" data-step="2" id="fmb-step-2">
          <h3 className="fmb-question">What does your ball look like?</h3>
          <div className="fmb-options" data-key="ball">
            <button className="fmb-option" data-value="flat"><span className="fmb-option-title">Flat / Drive</span><span className="fmb-option-desc">Low spin, emphasizes control and raw power</span></button>
            <button className="fmb-option" data-value="moderate"><span className="fmb-option-title">Moderate Topspin</span><span className="fmb-option-desc">Balanced spin, all-court versatility</span></button>
            <button className="fmb-option" data-value="heavy"><span className="fmb-option-title">Heavy Topspin</span><span className="fmb-option-desc">High spin, shaped shots, big kick serve</span></button>
          </div>
        </div>

        <div className="fmb-step hidden" data-step="3" id="fmb-step-3">
          <h3 className="fmb-question">What's your court identity?</h3>
          <div className="fmb-options" data-key="court">
            <button className="fmb-option" data-value="baseliner"><span className="fmb-option-title">Baseliner</span><span className="fmb-option-desc">Stays back, rallies, grinds out consistency</span></button>
            <button className="fmb-option" data-value="allcourt"><span className="fmb-option-title">All-Court</span><span className="fmb-option-desc">Mixes baseline with net play, values variety</span></button>
            <button className="fmb-option" data-value="firststrike"><span className="fmb-option-title">First-Strike</span><span className="fmb-option-desc">Aggressive, takes ball early, ends points fast</span></button>
            <button className="fmb-option" data-value="touch"><span className="fmb-option-title">Touch Player</span><span className="fmb-option-desc">Net play, slice, drop shots - feel is everything</span></button>
          </div>
        </div>

        <div className="fmb-step hidden" data-step="4" id="fmb-step-4">
          <h3 className="fmb-question">Main pain points? <span className="fmb-hint">Pick up to 2</span></h3>
          <div className="fmb-options fmb-options-multi" data-key="painPoints" data-max="2">
            <button className="fmb-option" data-value="arm"><span className="fmb-option-title">Arm / Elbow Discomfort</span><span className="fmb-option-desc">Need a comfortable, arm-friendly setup</span></button>
            <button className="fmb-option" data-value="breaks"><span className="fmb-option-title">Strings Break Too Fast</span><span className="fmb-option-desc">Need durability without sacrificing performance</span></button>
            <button className="fmb-option" data-value="long"><span className="fmb-option-title">Ball Flies Long</span><span className="fmb-option-desc">Need more control and a lower launch angle</span></button>
            <button className="fmb-option" data-value="pace"><span className="fmb-option-title">Not Enough Pace</span><span className="fmb-option-desc">Need more free power from the string bed</span></button>
            <button className="fmb-option" data-value="spin"><span className="fmb-option-title">Can't Generate Spin</span><span className="fmb-option-desc">Need more bite and ball rotation</span></button>
            <button className="fmb-option" data-value="dead"><span className="fmb-option-title">Racquet Feels Dead</span><span className="fmb-option-desc">Need better feel and playability</span></button>
          </div>
        </div>

        <div className="fmb-step hidden" data-step="5" id="fmb-step-5">
          <h3 className="fmb-question">Top 3 priorities? <span className="fmb-hint">Select in order of importance</span></h3>
          <div className="fmb-options fmb-options-multi fmb-options-priority" data-key="priorities" data-max="3">
            <button className="fmb-option" data-value="control"><span className="fmb-option-title">Control</span><span className="fmb-option-desc">Placement accuracy, directional precision</span></button>
            <button className="fmb-option" data-value="spin"><span className="fmb-option-title">Spin</span><span className="fmb-option-desc">Ball rotation, kick, and shape</span></button>
            <button className="fmb-option" data-value="power"><span className="fmb-option-title">Power</span><span className="fmb-option-desc">Pace and depth from the string bed</span></button>
            <button className="fmb-option" data-value="comfort"><span className="fmb-option-title">Comfort</span><span className="fmb-option-desc">Arm-friendliness, vibration dampening</span></button>
            <button className="fmb-option" data-value="feel"><span className="fmb-option-title">Feel</span><span className="fmb-option-desc">Touch, feedback, connection to the ball</span></button>
            <button className="fmb-option" data-value="durability"><span className="fmb-option-title">Durability</span><span className="fmb-option-desc">String longevity and tension maintenance</span></button>
            <button className="fmb-option" data-value="stability"><span className="fmb-option-title">Stability</span><span className="fmb-option-desc">Frame stability, plow-through, twist resistance</span></button>
          </div>
        </div>

        <div className="fmb-step hidden" data-step="result" id="fmb-result">
          <div className="fmb-summary" id="fmb-summary"></div>
          <div className="fmb-directions" id="fmb-directions"></div>
        </div>

        <div className="fmb-nav">
          <button className="fmb-back" id="fmb-back" onClick={() => { void runFindMyBuildAction('fmbBack'); }}>Back</button>
          <button className="fmb-next" id="fmb-next" onClick={() => { void runFindMyBuildAction('fmbNext'); }}>Next</button>
        </div>
      </div>

      <div id="dashboard-content" className="dashboard-content hidden">
        <div className="w-full" id="overview-hero"></div>

        <div className="bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg p-8 md:p-5 relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-8 items-start">
            <div className="flex flex-col gap-2">
              <div id="stat-bars"></div>
              <div className="pt-4 mt-4 border-t border-dc-border" id="build-dna-highlights"></div>
            </div>
            <div className="flex flex-col justify-between h-full items-center">
              <div className="relative w-full flex items-center justify-center">
                <div id="radar-chart-root" className="w-full flex justify-center" />
              </div>
              <div className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-md p-3 px-4" id="oc-foundation"></div>
            </div>
          </div>
          <div className="mt-6 p-4 border border-dc-border bg-black/[0.02] dark:bg-black/20" id="fit-grid"></div>
        </div>

        <div className="card warnings-card hidden" id="warnings-card">
          <div className="card-header">
            <h3 className="card-title warning-title">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="12" r="0.8" fill="currentColor"/></svg>
              Warnings
            </h3>
          </div>
          <div className="warnings-list" id="warnings-list"></div>
        </div>
      </div>
    </section>
  );
}
