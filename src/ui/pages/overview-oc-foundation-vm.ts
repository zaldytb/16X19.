import type { Racquet, SetupAttributes, StringConfig as EngineStringConfig } from '../../engine/types.js';

type StringConfig = EngineStringConfig;

export type OverviewOCFoundationViewModel = {
  racquet: Racquet;
  strStiff: number;
  strTensionLoss: string;
  strSpinPot: string;
  stats: Pick<SetupAttributes, 'power' | 'control' | 'comfort'>;
};

export function buildOverviewOCFoundationViewModel(
  racquet: Racquet,
  stringConfig: StringConfig,
  stats: SetupAttributes
): OverviewOCFoundationViewModel {
  let strStiff: number;
  let strTensionLoss: string;
  let strSpinPot: string;

  if (stringConfig.isHybrid) {
    const m = stringConfig.mains;
    const x = stringConfig.crosses;
    strStiff = Math.round((m.stiffness + x.stiffness) / 2);
    strTensionLoss = ((m.tensionLoss + x.tensionLoss) / 2).toFixed(0);
    strSpinPot = ((m.spinPotential + x.spinPotential) / 2).toFixed(1);
  } else {
    const s = stringConfig.string;
    strStiff = Math.round(s.stiffness);
    strTensionLoss = s.tensionLoss.toFixed(0);
    strSpinPot = s.spinPotential.toFixed(1);
  }

  return {
    racquet,
    strStiff,
    strTensionLoss,
    strSpinPot,
    stats: { power: stats.power, control: stats.control, comfort: stats.comfort },
  };
}
