import { RACQUETS, STRINGS } from '../../data/loader.js';
import { getObsScoreColor } from '../../engine/index.js';
import type { Loadout } from '../../engine/types.js';

const sourceLabels: Record<string, string> = {
  quiz: 'Quiz',
  compendium: 'Bible',
  manual: '',
  preset: 'Preset',
  optimize: 'Opt',
  shared: 'Shared',
  import: 'Imp',
};

export type MyLoadoutRowVm = {
  id: string;
  frameName: string;
  stringName: string;
  obsDisplay: string;
  obsColor: string;
  tensionLabel: string;
  sourceLabel: string;
  isActive: boolean;
  isConfirmingRemoval: boolean;
  activeBorderClass: string;
};

export type MyLoadoutsVm = {
  countLabel: string;
  rows: MyLoadoutRowVm[];
};

function getNumericObs(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function isLoadoutActive(lo: Loadout, activeLoadout: Loadout | null): boolean {
  if (!activeLoadout) return false;
  if (activeLoadout.id === lo.id) return true;

  return activeLoadout.frameId === lo.frameId &&
    activeLoadout.mainsTension === lo.mainsTension &&
    activeLoadout.crossesTension === lo.crossesTension &&
    activeLoadout.isHybrid === (lo.isHybrid || false) &&
    (lo.isHybrid
      ? activeLoadout.mainsId === lo.mainsId && activeLoadout.crossesId === lo.crossesId
      : activeLoadout.stringId === lo.stringId);
}

function getLoadoutStringName(lo: Loadout): string {
  if (lo.isHybrid) {
    const mains = STRINGS.find((stringItem) => stringItem.id === lo.mainsId);
    const crosses = STRINGS.find((stringItem) => stringItem.id === lo.crossesId);
    return mains && crosses ? `${mains.name} / ${crosses.name}` : '\u2014';
  }

  const stringItem = STRINGS.find((entry) => entry.id === lo.stringId);
  return stringItem ? stringItem.name : '\u2014';
}

export function buildMyLoadoutsViewModel(
  savedLoadouts: Loadout[],
  activeLoadout: Loadout | null,
  confirmingRemoveId: string | null,
): MyLoadoutsVm {
  return {
    countLabel: String(savedLoadouts.length),
    rows: savedLoadouts.map((loadout) => {
      const isActive = isLoadoutActive(loadout, activeLoadout);
      const racquet = RACQUETS.find((frame) => frame.id === loadout.frameId);
      const frameName = racquet ? racquet.name : '\u2014';
      const obsValue = getNumericObs(loadout.obs);

      return {
        id: loadout.id,
        frameName,
        stringName: getLoadoutStringName(loadout),
        obsDisplay: obsValue > 0 ? obsValue.toFixed(1) : '\u2014',
        obsColor: getObsScoreColor(obsValue),
        tensionLabel: `M${loadout.mainsTension}/X${loadout.crossesTension} lbs`,
        sourceLabel: sourceLabels[loadout.source || ''] || '',
        isActive,
        isConfirmingRemoval: confirmingRemoveId === loadout.id,
        activeBorderClass: isActive
          ? 'border-l-2 border-l-[var(--dc-accent)] bg-[var(--dc-void-lift)]'
          : 'border-l-2 border-l-transparent hover:bg-[var(--dc-void-lift)]',
      };
    }),
  };
}
