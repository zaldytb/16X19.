/**
 * Maps primary app modes (app-state) to React Router paths.
 * Some secondary routes intentionally resolve back to a parent shell mode.
 */
const MODE_TO_PATH: Record<string, string> = {
  overview: '/',
  tune: '/tune',
  compare: '/compare',
  optimize: '/optimize',
  compendium: '/compendium',
  strings: '/strings',
  leaderboard: '/leaderboard',
  howitworks: '/how-it-works',
  myloadouts: '/my-loadouts',
};

/**
 * Route ownership for shared shell state.
 * `/strings` and `/leaderboard` live inside the Compendium shell.
 * `/my-loadouts` is a standalone route, but it still uses the Overview shell mode.
 */
const PATH_TO_MODE: Record<string, string> = {
  '/': 'overview',
  '/tune': 'tune',
  '/compare': 'compare',
  '/optimize': 'optimize',
  '/compendium': 'compendium',
  '/strings': 'compendium',
  '/leaderboard': 'compendium',
  '/how-it-works': 'howitworks',
  '/my-loadouts': 'overview',
};

export function modeToPath(mode: string): string {
  return MODE_TO_PATH[mode] ?? '/';
}

export function pathToMode(pathname: string): string {
  const normalized = pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
  return PATH_TO_MODE[normalized] ?? PATH_TO_MODE[pathname] ?? 'overview';
}
