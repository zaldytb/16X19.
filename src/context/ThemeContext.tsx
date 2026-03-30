import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getTheme as readDomTheme, initTheme, setTheme as setDomTheme } from '../ui/theme.js';

export type Theme = 'dark' | 'light';

export type ThemeRefreshHandlers = {
  onAfterToggle?: () => void;
};

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  registerRefresh: (h: ThemeRefreshHandlers | null) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readDomTheme());
  const refreshRef = useRef<ThemeRefreshHandlers | null>(null);

  const registerRefresh = useCallback((h: ThemeRefreshHandlers | null) => {
    refreshRef.current = h;
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    setDomTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const current = html.dataset.theme as Theme | undefined;
    html.classList.add('theme-transitioning');
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    setThemeState(next);
    setTimeout(() => html.classList.remove('theme-transitioning'), 450);
    refreshRef.current?.onAfterToggle?.();
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, registerRefresh }),
    [theme, setTheme, toggleTheme, registerRefresh],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/** Call once on app mount to align DOM default theme. */
export function bootstrapTheme(): void {
  initTheme();
}
