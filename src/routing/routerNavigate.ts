import type { NavigateFunction } from 'react-router-dom';

let _navigate: NavigateFunction | null = null;

export function registerRouterNavigate(nav: NavigateFunction | null): void {
  _navigate = nav;
}

export function getRouterNavigate(): NavigateFunction | null {
  return _navigate;
}
