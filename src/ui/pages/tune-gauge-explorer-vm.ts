// Pure view-model for Tune gauge explorer (#gauge-explore-content) — parity with renderGaugeExplorer.

import {
  applyGaugeModifier,
  buildTensionContext,
  computeCompositeScore,
  getGaugeOptions,
  predictSetup,
} from '../../engine/index.js';
import type { Racquet, SetupAttributes, StringConfig, StringData } from '../../engine/types.js';

const GAUGE_KEYS = ['spin', 'power', 'control', 'comfort', 'feel', 'durability', 'playability'] as const;
const GAUGE_LABELS = ['Spin', 'Power', 'Control', 'Comfort', 'Feel', 'Durability', 'Playability'];

export type GaugeExplorerCellCls =
  | 'gauge-val-current'
  | 'gauge-val-positive'
  | 'gauge-val-negative'
  | 'gauge-val-neutral';

export type TuneGaugeExplorerColumnVM = {
  gauge: number;
  shortLabel: string;
  mmLabel: string;
  isCurrent: boolean;
  headerClassSuffix: '' | ' gauge-current';
  title: string;
};

export type TuneGaugeExplorerSectionVM = {
  sectionIndex: number;
  sectionLabelText: string;
  colCount: number;
  columns: TuneGaugeExplorerColumnVM[];
  statRows: Array<{
    label: string;
    cells: Array<{ val: number; diffStr: string; cls: GaugeExplorerCellCls }>;
  }>;
  obsCells: Array<{ val: number; diffStr: string; cls: GaugeExplorerCellCls }>;
};

export type TuneGaugeExplorerViewModel = { kind: 'empty' } | { kind: 'content'; sections: TuneGaugeExplorerSectionVM[] };

export function buildTuneGaugeExplorerViewModel(setup: {
  racquet: Racquet;
  stringConfig: StringConfig;
}): TuneGaugeExplorerViewModel {
  const { racquet, stringConfig } = setup;

  const sections: Array<{
    label: string | null;
    string: StringData;
    buildConfig: (gaugedStr: StringData) => StringConfig;
  }> = [];

  if (stringConfig.isHybrid) {
    const hybridConfig = stringConfig as {
      mains: StringData;
      crosses: StringData;
      mainsTension: number;
      crossesTension: number;
    };
    if (hybridConfig.mains) {
      sections.push({
        label: 'MAINS',
        string: hybridConfig.mains,
        buildConfig: (gaugedStr) =>
          ({
            isHybrid: true,
            mains: gaugedStr,
            crosses: hybridConfig.crosses,
            mainsTension: hybridConfig.mainsTension,
            crossesTension: hybridConfig.crossesTension,
          }) as StringConfig,
      });
    }
    if (hybridConfig.crosses) {
      sections.push({
        label: 'CROSSES',
        string: hybridConfig.crosses,
        buildConfig: (gaugedStr) =>
          ({
            isHybrid: true,
            mains: hybridConfig.mains,
            crosses: gaugedStr,
            mainsTension: hybridConfig.mainsTension,
            crossesTension: hybridConfig.crossesTension,
          }) as StringConfig,
      });
    }
  } else {
    const fullConfig = stringConfig as {
      string: StringData;
      mainsTension: number;
      crossesTension: number;
    };
    if (fullConfig.string) {
      sections.push({
        label: null,
        string: fullConfig.string,
        buildConfig: (gaugedStr) =>
          ({
            isHybrid: false,
            string: gaugedStr,
            mainsTension: fullConfig.mainsTension,
            crossesTension: fullConfig.crossesTension,
          }) as StringConfig,
      });
    }
  }

  if (sections.length === 0) {
    return { kind: 'empty' };
  }

  const outSections: TuneGaugeExplorerSectionVM[] = [];

  sections.forEach((section, secIdx) => {
    const baseStr = section.string;
    const originalStr = baseStr;
    const currentGauge = baseStr.gaugeNum;
    const gaugeOptions = getGaugeOptions(originalStr);

    const gaugeResults = gaugeOptions.map((g: number) => {
      const gaugedStr = applyGaugeModifier(originalStr, g);
      const config = section.buildConfig(gaugedStr);
      const stats = predictSetup(racquet, config);
      const tensionCtx = buildTensionContext(config, racquet);
      const obs = computeCompositeScore(stats, tensionCtx);
      return { gauge: g, stats, obs: +obs.toFixed(1), isCurrent: Math.abs(g - currentGauge) < 0.005 };
    });

    const currentResult = gaugeResults.find((r) => r.isCurrent);
    if (!currentResult) return;

    const sectionLabelText = section.label
      ? `${section.label}: ${originalStr.name}`
      : originalStr.name;

    const columns: TuneGaugeExplorerColumnVM[] = gaugeResults.map((r) => {
      const shortLabel =
        r.gauge >= 1.3 ? '16' : r.gauge >= 1.25 ? '16L' : r.gauge >= 1.2 ? '17' : '18';
      const mmLabel = `${r.gauge.toFixed(2)}`;
      const headerClassSuffix: '' | ' gauge-current' = r.isCurrent ? ' gauge-current' : '';
      const title = r.isCurrent ? 'Current gauge' : 'Click to apply this gauge';
      return {
        gauge: r.gauge,
        shortLabel,
        mmLabel,
        isCurrent: r.isCurrent,
        headerClassSuffix,
        title,
      };
    });

    const statRows = GAUGE_KEYS.map((key, i) => ({
      label: GAUGE_LABELS[i],
      cells: gaugeResults.map((r) => {
        const val = r.stats[key as keyof SetupAttributes] as number;
        const baseVal = currentResult.stats[key as keyof SetupAttributes] as number;
        const diff = val - baseVal;
        const cls: GaugeExplorerCellCls = r.isCurrent
          ? 'gauge-val-current'
          : diff > 0
            ? 'gauge-val-positive'
            : diff < 0
              ? 'gauge-val-negative'
              : 'gauge-val-neutral';
        const diffStr = r.isCurrent ? '' : diff > 0 ? `+${diff}` : `${diff}`;
        return { val, diffStr, cls };
      }),
    }));

    const obsCells = gaugeResults.map((r) => {
      const diff = r.obs - currentResult.obs;
      const cls: GaugeExplorerCellCls = r.isCurrent
        ? 'gauge-val-current'
        : diff > 0.5
          ? 'gauge-val-positive'
          : diff < -0.5
            ? 'gauge-val-negative'
            : 'gauge-val-neutral';
      const diffStr = r.isCurrent ? '' : diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
      return { val: r.obs, diffStr, cls };
    });

    outSections.push({
      sectionIndex: secIdx,
      sectionLabelText,
      colCount: gaugeOptions.length,
      columns,
      statRows,
      obsCells,
    });
  });

  if (outSections.length === 0) {
    return { kind: 'empty' };
  }

  return { kind: 'content', sections: outSections };
}
