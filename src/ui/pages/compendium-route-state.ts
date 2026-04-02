type CompendiumTab = 'rackets' | 'strings' | 'leaderboard';

interface CompendiumRouteState {
  activeTab: CompendiumTab | null;
  racquetId: string | null;
  stringId: string | null;
}

let _state: CompendiumRouteState = {
  activeTab: null,
  racquetId: null,
  stringId: null,
};

export function getCompendiumRouteState(): CompendiumRouteState {
  return { ..._state };
}

export function openCompendiumTab(tab: CompendiumTab): void {
  _state = { ..._state, activeTab: tab };
}

export function focusCompendiumFrame(racquetId: string): void {
  _state = { activeTab: 'rackets', racquetId, stringId: null };
}

export function focusCompendiumString(stringId: string): void {
  _state = { activeTab: 'strings', racquetId: null, stringId };
}

export function clearCompendiumRouteFocus(): void {
  _state = {
    activeTab: null,
    racquetId: null,
    stringId: null,
  };
}
