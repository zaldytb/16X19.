import type { ReactNode } from 'react';

const PREVIEW_STATS = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability'] as const;
const TRACK_SEGMENTS = 25;

interface PreviewRow {
  key: typeof PREVIEW_STATS[number];
  baseValue: number;
  previewValue?: number | null;
}

interface StringFrameInjectionModulatorProps {
  frameSelect?: ReactNode;
  crossesStringSelect?: ReactNode;
  mode: 'fullbed' | 'hybrid';
  mainsName: string;
  projectedObs: string;
  gauge: string;
  crossesGauge: string;
  mainsTension: number;
  crossesTension: number;
  gaugeOptions: Array<{ value: string; label: string }>;
  crossesGaugeOptions: Array<{ value: string; label: string }>;
  previewRows: PreviewRow[];
  addEnabled: boolean;
  activateEnabled: boolean;
  onSetMode?: (mode: 'fullbed' | 'hybrid') => void;
  onGaugeChange?: (value: string) => void;
  onCrossesGaugeChange?: (value: string) => void;
  onMainsTensionChange?: (value: number) => void;
  onCrossesTensionChange?: (value: number) => void;
  onAddToLoadout?: () => void;
  onSetActive?: () => void;
  onClear?: () => void;
}

function segmentClass(index: number, row: PreviewRow): string {
  const baseFilled = Math.round((row.baseValue / 100) * TRACK_SEGMENTS);
  const previewFilled =
    row.previewValue == null ? null : Math.round(((row.previewValue ?? row.baseValue) / 100) * TRACK_SEGMENTS);

  if (previewFilled != null && row.previewValue != null && row.previewValue > row.baseValue && index < previewFilled) {
    return 'flex-1 h-full rounded-[1px] bg-dc-red';
  }
  if (previewFilled != null && row.previewValue != null && row.previewValue < row.baseValue && index >= previewFilled && index < baseFilled) {
    return 'flex-1 h-full rounded-[1px] bg-dc-red/40';
  }
  if (index < baseFilled) {
    return 'flex-1 h-full rounded-[1px] bg-dc-void dark:bg-dc-platinum';
  }
  return 'flex-1 h-full rounded-[1px] bg-black/10 dark:bg-white/10';
}

function valueMarkup(row: PreviewRow) {
  if (row.previewValue == null) {
    return <span className="text-dc-platinum">{row.baseValue}</span>;
  }
  let diffColor = 'text-dc-storm';
  if (row.previewValue > row.baseValue) diffColor = 'text-dc-red';
  if (row.previewValue < row.baseValue) diffColor = 'text-dc-accent';
  return (
    <>
      <span className="text-dc-storm">{row.baseValue}</span>
      <span className="text-dc-storm mx-1">&rarr;</span>
      <span className={diffColor}>{row.previewValue}</span>
    </>
  );
}

export function StringFrameInjectionModulator({
  mode,
  frameSelect,
  mainsName,
  projectedObs,
  crossesStringSelect,
  gauge,
  crossesGauge,
  mainsTension,
  crossesTension,
  gaugeOptions,
  crossesGaugeOptions,
  previewRows,
  addEnabled,
  activateEnabled,
  onAddToLoadout,
  onClear,
  onCrossesGaugeChange,
  onCrossesTensionChange,
  onGaugeChange,
  onMainsTensionChange,
  onSetActive,
  onSetMode,
}: StringFrameInjectionModulatorProps) {
  const isHybrid = mode === 'hybrid';

  return (
    <div className="bg-transparent border border-dc-storm/30 p-5 md:p-6 mb-10 flex flex-col gap-5">
      <div className="flex justify-between items-center border-b border-dc-storm/30 pb-3 mb-1">
        <span className="font-mono text-[13px] text-dc-accent uppercase tracking-[0.2em]">//FRAME INJECTION</span>
        <div className="flex gap-4">
          <button
            type="button"
            className={`string-mod-mode-btn border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors ${!isHybrid ? 'text-dc-accent border-dc-accent' : 'text-dc-storm border-transparent'}`}
            data-mode="fullbed"
            data-string-action="setModMode"
            data-string-arg="fullbed"
            onClick={() => onSetMode?.('fullbed')}
          >
            Full Bed
          </button>
          <button
            type="button"
            className={`string-mod-mode-btn border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors ${isHybrid ? 'text-dc-accent border-dc-accent' : 'text-dc-storm border-transparent'}`}
            data-mode="hybrid"
            data-string-action="setModMode"
            data-string-arg="hybrid"
            onClick={() => onSetMode?.('hybrid')}
          >
            Hybrid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// SELECT FRAME</span>
          {frameSelect ?? <div id="string-mod-frame" data-placeholder="Select Frame..." />}
          <p className="text-[12px] text-dc-storm italic">Required: Choose a frame to inject this string into</p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// PROJECTED OBS</span>
          <div id="string-mod-obs" className="flex items-center">
            <span className={`font-mono text-4xl font-bold ${projectedObs === '—' ? 'text-dc-storm' : 'text-dc-accent'}`}>{projectedObs}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// MAINS STRING</span>
          <div id="string-mod-mains-name" className="font-mono text-sm text-dc-platinum py-2 border-b border-dc-storm/30">
            {mainsName}
          </div>
        </div>

        <div className="flex flex-col gap-3" id="string-mod-crosses-string-col" style={{ display: isHybrid ? 'block' : 'none' }}>
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// CROSSES STRING</span>
          {crossesStringSelect ?? <div id="string-mod-crosses-string" data-placeholder="Same as mains..." />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// MAINS GAUGE</span>
          <select
            id="string-mod-gauge"
            className="appearance-none bg-white dark:bg-dc-void border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 px-2 outline-none focus:border-dc-accent transition-colors cursor-pointer"
            data-string-action="gaugeChange"
            value={gauge}
            onChange={(event) => onGaugeChange?.(event.target.value)}
          >
            <option value="">Default</option>
            {gaugeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-3" id="string-mod-crosses-gauge-col" style={{ display: isHybrid ? 'block' : 'none' }}>
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// CROSSES GAUGE</span>
          <select
            id="string-mod-crosses-gauge"
            className="appearance-none bg-white dark:bg-dc-void border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 px-2 outline-none focus:border-dc-accent transition-colors cursor-pointer"
            data-string-action="crossesGaugeChange"
            value={crossesGauge}
            onChange={(event) => onCrossesGaugeChange?.(event.target.value)}
          >
            <option value="">Same as mains</option>
            {crossesGaugeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="flex flex-col gap-3" id="string-mod-mains-col">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// MAINS TENSION</span>
          <input
            type="number"
            id="string-mod-mains-tension"
            className="bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors"
            value={mainsTension}
            min={30}
            max={70}
            step={1}
            data-string-action="tensionChange"
            data-string-arg="mains"
            onChange={(event) => onMainsTensionChange?.(parseInt(event.target.value || '0', 10))}
          />
        </div>

        <div className="flex flex-col gap-3" id="string-mod-crosses-col">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]" id="string-mod-crosses-label">
            // CROSSES TENSION
          </span>
          <input
            type="number"
            id="string-mod-crosses-tension"
            className="bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors"
            value={crossesTension}
            min={30}
            max={70}
            step={1}
            data-string-action="tensionChange"
            data-string-arg="crosses"
            onChange={(event) => onCrossesTensionChange?.(parseInt(event.target.value || '0', 10))}
          />
        </div>
      </div>

      <div className="border-t border-dc-storm/30 pt-4 mt-2">
        <h4 className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em] mb-4">// LIVE PREVIEW</h4>
        <div className="flex flex-col gap-2.5">
          {previewRows.map((row) => (
            <div key={row.key} className="flex items-center gap-4 group" data-stat={row.key}>
              <span className="font-mono text-[13px] text-dc-storm group-hover:text-dc-platinum transition-colors uppercase tracking-[0.15em] w-20">
                {row.key}
              </span>
              <div className="flex flex-1 gap-[2px] h-1.5 items-center" id={`string-track-${row.key}`}>
                {Array.from({ length: TRACK_SEGMENTS }).map((_, i) => (
                  <div key={i} className={segmentClass(i, row)} />
                ))}
              </div>
              <span className="font-mono text-[13px] font-bold text-dc-platinum w-16 text-right" id={`string-val-${row.key}`}>
                {valueMarkup(row)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          className="flex-1 font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          id="string-mod-add"
          disabled={!addEnabled}
          data-string-action="addToLoadout"
          onClick={onAddToLoadout}
        >
          Add to Loadout
        </button>
        <button
          type="button"
          className="flex-1 font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-platinum text-dc-platinum hover:bg-dc-platinum hover:text-dc-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          id="string-mod-activate"
          disabled={!activateEnabled}
          data-string-action="setActive"
          onClick={onSetActive}
        >
          Set Active
        </button>
        <button
          type="button"
          className="font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-storm/50 text-dc-storm hover:bg-dc-storm/10 hover:text-dc-platinum hover:border-dc-storm transition-colors"
          data-string-action="clearPreview"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
