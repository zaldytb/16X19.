import { useEffect, useMemo, useState } from 'react';
import { HardwareMount } from '../components/HardwareMount.js';
import { OverviewBuildDnaHighlights } from '../components/overview/OverviewBuildDnaHighlights.js';
import { OverviewFitProfileCard } from '../components/overview/OverviewFitProfileCard.js';
import { OverviewHero } from '../components/overview/OverviewHero.js';
import { LandingSearch } from '../components/overview/LandingSearch.js';
import { OverviewOCFoundation } from '../components/overview/OverviewOCFoundation.js';
import { OverviewRadarChart } from '../components/overview/OverviewRadarChart.js';
import { OverviewStatBars } from '../components/overview/OverviewStatBars.js';
import { OverviewWarnings } from '../components/overview/OverviewWarnings.js';
import { MobileLoadoutPills } from '../components/shell/MobileLoadoutPills.js';
import { FmbWizardBody } from '../components/find-my-build/FmbWizardBody.js';
import { useCurrentSetup } from '../hooks/useStore.js';
import { getScoredSetup, measurePerformance } from '../utils/performance.js';
import { _prevObsValues, animateOBSInContainer } from '../ui/components/obs-animation.js';
import { switchMode } from '../ui/pages/shell.js';
import { buildOverviewBuildDnaViewModel } from '../ui/pages/overview-build-dna-vm.js';
import { buildOverviewFitProfileCardViewModel } from '../ui/pages/overview-fit-profile-vm.js';
import { buildOverviewHeroViewModel } from '../ui/pages/overview-hero-vm.js';
import { generateFitProfile, generateWarnings } from '../ui/pages/overview-insights.js';
import { buildOverviewOCFoundationViewModel } from '../ui/pages/overview-oc-foundation-vm.js';
import { statsToRadarData } from '../ui/pages/overview-radar-chart.js';
import { buildOverviewStatBarsViewModel } from '../ui/pages/overview-stat-bars-vm.js';
import { buildOverviewWarningsViewModel } from '../ui/pages/overview-warnings-vm.js';

async function runFindMyBuildAction(
  action: 'openFindMyBuild' | 'closeFindMyBuild' | 'fmbBack' | 'fmbNext',
): Promise<void> {
  const mod = await import('../ui/pages/find-my-build.js');
  mod[action]();
}

function noopOverviewChartReady(): void {}

function useChartTheme(): 'dark' | 'light' {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );

  useEffect(() => {
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(html.dataset.theme === 'dark' ? 'dark' : 'light');
    });

    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

export function Overview() {
  const setup = useCurrentSetup();
  const chartTheme = useChartTheme();

  const dashboard = useMemo(() => {
    if (!setup) return null;

    const scored = measurePerformance('overview dashboard render', () => getScoredSetup(setup));
    const fitProfile = generateFitProfile(scored.stats, setup.racquet, setup.stringConfig);
    const warnings = generateWarnings(setup.racquet, setup.stringConfig, scored.stats);
    const radarData = statsToRadarData(scored.stats);

    return {
      scored,
      heroModel: buildOverviewHeroViewModel(
        setup.racquet,
        setup.stringConfig,
        scored.stats,
        scored.identity,
        scored.obs,
      ),
      statBarsModel: buildOverviewStatBarsViewModel(scored.stats),
      buildDnaModel: buildOverviewBuildDnaViewModel(scored.stats),
      fitProfileModel: buildOverviewFitProfileCardViewModel(fitProfile),
      ocFoundationModel: buildOverviewOCFoundationViewModel(setup.racquet, setup.stringConfig, scored.stats),
      warningsModel: buildOverviewWarningsViewModel(warnings),
      radarData,
      radarDataKey: radarData.join(','),
      hasWarnings: warnings.length > 0,
    };
  }, [setup]);

  useEffect(() => {
    if (!dashboard) return;

    queueMicrotask(() => {
      const host = document.getElementById('overview-hero');
      if (!host) return;
      animateOBSInContainer(host, '.hero-obs-value', dashboard.scored.obs, 500, _prevObsValues.hero);
      _prevObsValues.hero = dashboard.scored.obs;
    });
  }, [dashboard]);

  const handleSelectFrame = (racquetId: string) => {
    switchMode('compendium');
    window.setTimeout(() => {
      void import('../ui/pages/compendium.js').then((mod) => {
        mod.initCompendium();
        mod._compSelectFrame(racquetId);

        window.setTimeout(() => {
          const item = document.querySelector(`#comp-frame-list > button[data-id="${racquetId}"]`);
          if (item instanceof HTMLElement) {
            item.scrollIntoView({ block: 'center' });
          }
        }, 100);
      });
    }, 0);
  };

  return (
    <section className="workspace-mode" id="mode-overview" data-mode="overview">
      <HardwareMount>
      <div className="route-panel-enter">
        <div id="mobile-loadout-pills" className="mobile-loadout-pills"><MobileLoadoutPills /></div>

        <div id="empty-state" className={`flex flex-col items-center justify-center min-h-[75vh] w-full px-4 md:px-8${dashboard ? ' hidden' : ''}`}>
          <div className="w-full max-w-4xl flex flex-col gap-12 relative">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-dc-accent uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-dc-accent animate-pulse"></span> AWAITING TELEMETRY
            </span>
            <h2 className="text-5xl md:text-6xl font-semibold tracking-tighter text-dc-platinum leading-none">Initialize Loadout.</h2>
          </div>

          <LandingSearch onSelectFrame={handleSelectFrame} />

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
      </div>

      <FmbWizardBody
        onClose={() => {
          void runFindMyBuildAction('closeFindMyBuild');
        }}
        onBack={() => {
          void runFindMyBuildAction('fmbBack');
        }}
        onNext={() => {
          void runFindMyBuildAction('fmbNext');
        }}
      />

      <div id="dashboard-content" className={`dashboard-content${dashboard ? '' : ' hidden'}`}>
        {dashboard ? (
          <>
            <div className="w-full" id="overview-hero">
              <OverviewHero
                model={dashboard.heroModel}
                onBackToBible={() => switchMode('compendium')}
                onTuneThisBuild={() => switchMode('tune')}
              />
            </div>

            <div className="bg-white dark:bg-dc-void-lift border border-dc-border rounded-lg p-8 md:p-5 relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-8 items-start">
                <div className="flex flex-col gap-2">
                  <div id="stat-bars">
                    <OverviewStatBars model={dashboard.statBarsModel} />
                  </div>
                  <div className="pt-4 mt-4 border-t border-dc-border" id="build-dna-highlights">
                    <OverviewBuildDnaHighlights model={dashboard.buildDnaModel} />
                  </div>
                </div>
                <div className="flex flex-col justify-between h-full items-center">
                  <div className="relative w-full flex items-center justify-center">
                    <div id="radar-chart-root" className="w-full flex justify-center">
                      <OverviewRadarChart
                        statsData={dashboard.radarData}
                        statsDataKey={dashboard.radarDataKey}
                        chartTheme={chartTheme}
                        onChartReady={noopOverviewChartReady}
                      />
                    </div>
                  </div>
                  <div className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-md p-3 px-4" id="oc-foundation">
                    <OverviewOCFoundation model={dashboard.ocFoundationModel} />
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 border border-dc-border bg-black/[0.02] dark:bg-black/20" id="fit-grid">
                <OverviewFitProfileCard model={dashboard.fitProfileModel} />
              </div>
            </div>

            <div className={`card warnings-card${dashboard.hasWarnings ? '' : ' hidden'}`} id="warnings-card">
              <div className="card-header">
                <h3 className="card-title warning-title">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="12" r="0.8" fill="currentColor"/></svg>
                  Warnings
                </h3>
              </div>
              <div className="warnings-list" id="warnings-list">
                <OverviewWarnings model={dashboard.warningsModel} />
              </div>
            </div>
          </>
        ) : null}
      </div>
      </HardwareMount>
    </section>
  );
}
