export type OptimizeSetupType = 'both' | 'full' | 'hybrid';

export interface OptimizeStatMinimums {
  spin: number;
  control: number;
  power: number;
  comfort: number;
  feel: number;
  durability: number;
  playability: number;
  stability: number;
  maneuverability: number;
}

export interface OptimizeRouteState {
  frameId?: string | null;
  frameName?: string | null;
  setupType?: OptimizeSetupType;
  lockSide?: 'none' | 'mains' | 'crosses';
  lockQuery?: string;
  lockStringId?: string;
  excludeQuery?: string;
  allowedMaterials?: string[];
  allowedBrands?: string[];
  excludedStringIds?: string[];
  sortBy?: string;
  tensionMin?: number;
  tensionMax?: number;
  mins?: Partial<OptimizeStatMinimums> | null;
  upgradeMode?: boolean;
  upgradeObs?: number;
  upgradeCtlLoss?: number;
  upgradeDurLoss?: number;
  filtersCollapsed?: boolean;
  targetTension?: string;
  hasRun?: boolean;
  isRunning?: boolean;
  savedCandidateKey?: string | null;
  candidates?: unknown[] | null;
  autorun?: boolean;
}

let optimizeRouteState: OptimizeRouteState = {};

export function getOptimizeRouteState(): OptimizeRouteState {
  return { ...optimizeRouteState };
}

export function clearOptimizeRouteState(): void {
  optimizeRouteState = {};
}

export function focusOptimizeFrame(frameName: string, frameId: string): void {
  optimizeRouteState = {
    ...optimizeRouteState,
    frameId,
    frameName,
  };
}

export function queueOptimizeSearch(state: OptimizeRouteState): void {
  optimizeRouteState = {
    ...optimizeRouteState,
    ...state,
  };
}

export function setOptimizeRouteState(state: OptimizeRouteState): void {
  optimizeRouteState = {
    ...optimizeRouteState,
    ...state,
  };
}
