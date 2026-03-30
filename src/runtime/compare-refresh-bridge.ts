/**
 * Breaks the static cycle between compare UI and the coordinator.
 * compare/index calls notifyCompareStateChanged(); coordinator registers the handler once.
 */

let _onCompareStateChange: (() => void) | null = null;

export function registerCompareStateRefreshHandler(handler: () => void): void {
  _onCompareStateChange = handler;
}

export function notifyCompareStateChanged(): void {
  _onCompareStateChange?.();
}
