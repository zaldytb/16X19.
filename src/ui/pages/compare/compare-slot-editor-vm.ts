import type { Loadout } from '../../../engine/types.js';
import type { SlotId } from './types.js';

export interface CompareEditorFormState {
  frameId: string;
  stringId: string;
  isHybrid: boolean;
  mainsId: string;
  crossesId: string;
  mainsTension: number;
  crossesTension: number;
}

export function getInitialEditorFormState(loadout: Loadout | null): CompareEditorFormState {
  if (!loadout) {
    return {
      frameId: '',
      stringId: '',
      isHybrid: false,
      mainsId: '',
      crossesId: '',
      mainsTension: 53,
      crossesTension: 51,
    };
  }

  return {
    frameId: loadout.frameId,
    stringId: loadout.stringId || '',
    isHybrid: loadout.isHybrid || false,
    mainsId: loadout.mainsId || '',
    crossesId: loadout.crossesId || '',
    mainsTension: loadout.mainsTension,
    crossesTension: loadout.crossesTension,
  };
}

export function buildLoadoutFromEditorForm(slotId: SlotId, form: CompareEditorFormState): Loadout {
  return {
    id: `compare-${Date.now()}`,
    name: `Compare ${slotId}`,
    frameId: form.frameId,
    isHybrid: form.isHybrid,
    mainsId: form.isHybrid ? form.mainsId || null : null,
    crossesId: form.isHybrid ? form.crossesId || null : null,
    stringId: form.isHybrid ? null : form.stringId || null,
    mainsTension: form.mainsTension,
    crossesTension: form.crossesTension,
    gauge: null,
    mainsGauge: null,
    crossesGauge: null,
    obs: 0,
    stats: undefined,
  };
}
