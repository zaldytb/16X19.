import { Suspense, useLayoutEffect } from 'react';
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
import { registerRouterNavigate } from './routing/routerNavigate.js';
import { pathToMode } from './routing/modePaths.js';
import { useAppStore } from './state/useAppStore.js';
import { syncViews } from './runtime/coordinator.js';
import { runVanillaAppInit } from './bridge/installWindowBridge.js';
import {
  BootLoader,
  Header,
  BuildDock,
  MobileTabBar,
  Footer,
} from './components/shell/index.js';

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
  useLayoutEffect(() => {
    registerRouterNavigate(navigate);
    return () => registerRouterNavigate(null);
  }, [navigate]);
  return null;
}

/** Keep store mode in sync with browser navigation. */
function RouteModeSync() {
  const location = useLocation();
  useLayoutEffect(() => {
    const mode = pathToMode(location.pathname);
    const { currentMode, setCurrentMode } = useAppStore.getState();
    if (mode !== currentMode) {
      setCurrentMode(mode);
    }
    // Update active states on buttons
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
  useLayoutEffect(() => {
    runVanillaAppInit();
  }, []);

  return (
    <>
      <BootLoader />
      <main className="app-shell">
        <Header />
        <BuildDock />
        <div className="workspace" id="workspace">
          <Suspense fallback={<div className="p-8 text-dc-storm font-mono text-xs">Loading…</div>}>
            <Outlet />
          </Suspense>
        </div>
        <MobileTabBar />
      </main>
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
        <Footer />
      </BrowserRouter>
    </ThemeProvider>
  );
}
