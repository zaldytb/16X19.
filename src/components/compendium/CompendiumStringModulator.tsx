import type { ReactNode } from 'react';

interface CompendiumStringModulatorProps {
  mainsSelect?: ReactNode;
  crossesSelect?: ReactNode;
  mode: 'fullbed' | 'hybrid';
  mainsLabel: string;
  crossesLabel: string;
  mainsGaugeOptions: Array<{ value: string; label: string }>;
  crossesGaugeOptions: Array<{ value: string; label: string }>;
  mainsGauge: string;
  crossesGauge: string;
  mainsTension: number;
  crossesTension: number;
  applyEnabled: boolean;
  onSetMode?: (mode: 'fullbed' | 'hybrid') => void;
  onMainsGaugeChange?: (value: string) => void;
  onCrossesGaugeChange?: (value: string) => void;
  onMainsTensionChange?: (value: number) => void;
  onCrossesTensionChange?: (value: number) => void;
  onApply?: () => void;
  onClear?: () => void;
}

/**
 * Racket Bible string modulator shell. SearchableSelect still mounts into
 * `#comp-mains-select` / `#comp-crosses-select`, but React owns the rest.
 */
export function CompendiumStringModulator({
  mode,
  mainsSelect,
  mainsLabel,
  crossesLabel,
  crossesSelect,
  mainsGaugeOptions,
  crossesGaugeOptions,
  mainsGauge,
  crossesGauge,
  mainsTension,
  crossesTension,
  applyEnabled,
  onApply,
  onClear,
  onCrossesGaugeChange,
  onCrossesTensionChange,
  onMainsGaugeChange,
  onMainsTensionChange,
  onSetMode,
}: CompendiumStringModulatorProps) {
  const isHybrid = mode === 'hybrid';

  return (
    <div className="relative z-[1] overflow-visible bg-transparent border border-dc-storm/30 p-5 md:p-6 mb-10 flex flex-col gap-5">
      <div className="flex justify-between items-center border-b border-dc-storm/30 pb-3 mb-1">
        <span className="font-mono text-[13px] text-dc-accent uppercase tracking-[0.2em]">//STRING MODULATOR</span>
        <div className="flex gap-4">
          <button
            type="button"
            className={`comp-inject-mode-btn border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors ${!isHybrid ? 'text-dc-accent border-dc-accent' : 'text-dc-storm border-transparent'}`}
            data-mode="fullbed"
            data-comp-action="setInjectMode"
            onClick={() => onSetMode?.('fullbed')}
          >
            Full Bed
          </button>
          <button
            type="button"
            className={`comp-inject-mode-btn border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors ${isHybrid ? 'text-dc-accent border-dc-accent' : 'text-dc-storm border-transparent'}`}
            data-mode="hybrid"
            data-comp-action="setInjectMode"
            onClick={() => onSetMode?.('hybrid')}
          >
            Hybrid
          </button>
        </div>
      </div>

      <div className="relative overflow-visible grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="relative overflow-visible flex flex-col gap-3" id="comp-mains-col">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]" id="comp-mains-label">
            {mainsLabel}
          </span>
          {mainsSelect ?? <div id="comp-mains-select" className="comp-string-select-container" />}
          <div className="grid grid-cols-2 gap-4">
            <select
              className="appearance-none bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%235E666C%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpolyline%20points=%276%209%2012%2015%2018%209%27%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-right pr-5 cursor-pointer"
              id="comp-mains-gauge"
              value={mainsGauge}
              onChange={(event) => onMainsGaugeChange?.(event.target.value)}
            >
              <option value="">Gauge...</option>
              {mainsGaugeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors"
              id="comp-mains-tension"
              value={mainsTension}
              min={30}
              max={70}
              step={1}
              onChange={(event) => onMainsTensionChange?.(parseInt(event.target.value || '0', 10))}
            />
          </div>
        </div>

        <div className="relative overflow-visible flex flex-col gap-3" id="comp-crosses-col">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]" id="comp-crosses-label">
            {crossesLabel}
          </span>
          {crossesSelect ?? <div id="comp-crosses-select" className="comp-string-select-container" style={{ display: isHybrid ? 'block' : 'none' }} />}
          <div className="grid grid-cols-2 gap-4">
            <select
              className="appearance-none bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%235E666C%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpolyline%20points=%276%209%2012%2015%2018%209%27%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-right pr-5 cursor-pointer"
              id="comp-crosses-gauge"
              value={crossesGauge}
              onChange={(event) => onCrossesGaugeChange?.(event.target.value)}
            >
              <option value="">Gauge...</option>
              {crossesGaugeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="bg-transparent border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 outline-none focus:border-dc-accent transition-colors"
              id="comp-crosses-tension"
              value={crossesTension}
              min={30}
              max={70}
              step={1}
              onChange={(event) => onCrossesTensionChange?.(parseInt(event.target.value || '0', 10))}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          className="flex-1 font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-storm/50 text-dc-platinum hover:bg-dc-storm/20 hover:border-dc-storm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          id="comp-inject-apply"
          disabled={!applyEnabled}
          data-comp-action="applyInjection"
          onClick={onApply}
        >
          Apply
        </button>
        <button
          type="button"
          className="font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-storm/50 text-dc-storm hover:bg-dc-storm/10 hover:text-dc-platinum hover:border-dc-storm transition-colors"
          data-comp-action="clearInjection"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
