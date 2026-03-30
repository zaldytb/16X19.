import { Suspense, useEffect, useLayoutEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.js';
import { RawHtml } from './components/RawHtml.js';
import { registerRouterNavigate } from './routing/routerNavigate.js';
import { pathToMode } from './routing/modePaths.js';
import { getCurrentMode, setCurrentMode } from './state/app-state.js';
import { _syncLegacyModeState } from './ui/pages/shell.js';
import { syncViews } from './runtime/coordinator.js';
import {
  clearDigicraftBootSequence,
  runDigicraftBootSequence,
  runVanillaAppInit,
} from './bridge/installWindowBridge.js';

import shellChromeBeforeWorkspaceHtml from './assets/shell-chrome-before-workspace.html?raw';
import shellChromeAfterWorkspaceHtml from './assets/shell-chrome-after-workspace.html?raw';
import mobileTabBarHtml from './assets/mobile-tab-bar.html?raw';
import footerHtml from './assets/footer.html?raw';
import bootLoaderHtml from './assets/boot-loader.html?raw';

import {
  OverviewWorkspace,
  TuneWorkspace,
  CompareWorkspace,
  OptimizeWorkspace,
  CompendiumWorkspace,
  StringsWorkspace,
  LeaderboardWorkspace,
  HowItWorksWorkspace,
  MyLoadoutsWorkspace,
} from './pages/Workspaces.js';

function RouterRegistration() {
  const navigate = useNavigate();
  useEffect(() => {
    registerRouterNavigate(navigate);
    return () => registerRouterNavigate(null);
  }, [navigate]);
  return null;
}

/** Keep legacy app-state mode in sync when using browser navigation. */
function RouteModeSync() {
  const location = useLocation();
  useEffect(() => {
    const mode = pathToMode(location.pathname);
    if (mode !== getCurrentMode()) {
      setCurrentMode(mode);
      _syncLegacyModeState(mode);
    }
    document.querySelectorAll('.mode-btn').forEach((button) => {
      button.classList.toggle('active', (button as HTMLElement).dataset.mode === mode);
    });
    document.querySelectorAll('.mobile-tab-btn').forEach((button) => {
      button.classList.toggle('active', (button as HTMLElement).dataset.mode === mode);
    });
    syncViews('route-sync', { mode: true, dockEditorContext: true });
  }, [location.pathname]);
  return null;
}

function ShellLayout() {
  // Boot markup comes from RawHtml; run after commit so nodes exist. In React 18
  // Strict Mode the tree remounts once in dev — init only in main.tsx would
  // animate detached DOM and leave the visible loader stuck at 0%.
  useLayoutEffect(() => {
    runDigicraftBootSequence();
    return () => clearDigicraftBootSequence();
  }, []);

  useLayoutEffect(() => {
    runVanillaAppInit();
  }, []);

  useEffect(() => {
    const maxMs = 8000;
    const t = window.setTimeout(() => {
      document.getElementById('dc-boot-loader')?.remove();
    }, maxMs);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <RawHtml html={bootLoaderHtml} />
      <main className="app-shell">
        <RawHtml html={shellChromeBeforeWorkspaceHtml} />
        <div className="workspace" id="workspace">
          <Suspense fallback={<div className="p-8 text-dc-storm font-mono text-xs">Loading…</div>}>
            <Outlet />
          </Suspense>
        </div>
        <RawHtml html={shellChromeAfterWorkspaceHtml} />
      </main>
      <RawHtml html={mobileTabBarHtml} />
    </>
  );
}

function appBasename(): string | undefined {
  const raw = import.meta.env.BASE_URL || '/';
  if (raw === '/' || raw === './') return undefined;
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={appBasename()}>
        <RouterRegistration />
        <RouteModeSync />
        <Routes>
          <Route element={<ShellLayout />}>
            <Route index element={<OverviewWorkspace />} />
            <Route path="tune" element={<TuneWorkspace />} />
            <Route path="compare" element={<CompareWorkspace />} />
            <Route path="optimize" element={<OptimizeWorkspace />} />
            <Route path="compendium" element={<CompendiumWorkspace />} />
            <Route path="strings" element={<StringsWorkspace />} />
            <Route path="leaderboard" element={<LeaderboardWorkspace />} />
            <Route path="how-it-works" element={<HowItWorksWorkspace />} />
            <Route path="my-loadouts" element={<MyLoadoutsWorkspace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <RawHtml html={footerHtml} />
      </BrowserRouter>
    </ThemeProvider>
  );
}
