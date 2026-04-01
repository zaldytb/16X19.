import type { LeaderboardShellVm } from './leaderboard-shell-vm.js';

const VIEW_TABS = [
  { v: 'builds' as const, l: 'Builds', sub: 'frame + string' },
  { v: 'frames' as const, l: 'Frames', sub: 'frame only' },
  { v: 'strings' as const, l: 'Strings', sub: 'string only' },
];

const TYPE_PILLS = [
  { v: 'both' as const, l: 'All' },
  { v: 'full' as const, l: 'Full Bed' },
  { v: 'hybrid' as const, l: 'Hybrid' },
];

const FRAME_PATTERN_OPTS = [
  { v: '16x19', l: '16x19' },
  { v: '16x20', l: '16x20' },
  { v: '16x18', l: '16x18' },
  { v: '18x20', l: '18x20' },
  { v: '18x19', l: '18x19' },
];

const FRAME_HEAD_OPTS = [
  { v: '95', l: '≤95 sq in' },
  { v: '97', l: '97 sq in' },
  { v: '98', l: '98 sq in' },
  { v: '99', l: '99 sq in' },
  { v: '100', l: '100 sq in' },
  { v: '102+', l: '102+ sq in' },
];

const FRAME_WEIGHT_OPTS = [
  { v: 'ultralight', l: '< 285g' },
  { v: 'light', l: '285–305g' },
  { v: 'medium', l: '305–320g' },
  { v: 'heavy', l: '320–340g' },
  { v: 'tour', l: '> 340g' },
];

const FRAME_STIFF_OPTS = [
  { v: 'soft', l: 'Soft (≤59 RA)' },
  { v: 'medium', l: 'Medium (60–65)' },
  { v: 'stiff', l: 'Stiff (66+)' },
];

const FRAME_YEAR_OPTS = [
  { v: '2026', l: '2026' },
  { v: '2025', l: '2025' },
  { v: '2024', l: '2024' },
  { v: 'older', l: '≤2023' },
];

const STRING_MATERIAL_OPTS = [
  { v: 'Polyester', l: 'Polyester' },
  { v: 'Co-Polyester (elastic)', l: 'Co-Poly (elastic)' },
  { v: 'Natural Gut', l: 'Natural Gut' },
  { v: 'Multifilament', l: 'Multifilament' },
  { v: 'Synthetic Gut', l: 'Synthetic Gut' },
];

const STRING_SHAPE_OPTS = [
  { v: 'round', l: 'Round' },
  { v: 'pentagon', l: 'Pentagon' },
  { v: 'hexagonal', l: 'Hexagonal' },
  { v: 'octagonal', l: 'Octagonal' },
  { v: 'square', l: 'Square' },
  { v: 'textured', l: 'Textured / Rough' },
];

const STRING_GAUGE_OPTS = [
  { v: 'thin', l: 'Thin (≤1.20mm)' },
  { v: 'mid', l: 'Mid (1.21–1.27mm)' },
  { v: 'thick', l: 'Thick (≥1.28mm)' },
];

const STRING_STIFF_OPTS = [
  { v: 'soft', l: 'Soft (< 180 lb/in)' },
  { v: 'medium', l: 'Medium (180–215)' },
  { v: 'stiff', l: 'Stiff (> 215)' },
];

type Props = { vm: LeaderboardShellVm };

export function LeaderboardShell({ vm }: Props) {
  const { statKey, filterType, viewMode, frameFilters: ff, stringFilters: sf, statOptions, racquetBrands, stringBrands } =
    vm;

  const showTypeFilter = viewMode === 'builds';
  const showFrameFilters = viewMode === 'frames';
  const showStringFilters = viewMode === 'strings';
  const frameFiltersActive = Object.values(ff).some((v) => v !== '');
  const stringFiltersActive = Object.values(sf).some((v) => v !== '');

  return (
    <>
      <div className="lbv2-view-tabs border-b border-dc-storm/20 px-3 pt-2 md:px-5 md:pt-3 overflow-x-auto">
        <div className="flex min-w-min">
          {VIEW_TABS.map(({ v, l, sub }) => {
            const active = v === viewMode;
            return (
              <button
                key={v}
                type="button"
                className={`flex shrink-0 flex-row md:flex-col items-center md:items-start gap-1.5 md:gap-0 px-3 py-1.5 md:px-4 md:py-2 border-b-2 font-mono transition-all duration-150 cursor-pointer ${
                  active
                    ? 'border-dc-accent text-dc-accent'
                    : 'border-transparent text-dc-storm hover:text-dc-platinum hover:border-dc-storm/40'
                }`}
                data-view-mode={v}
                data-lb-action="setView"
                data-lb-arg={v}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{l}</span>
                <span className="hidden md:inline text-[8px] tracking-[0.08em] opacity-60">{sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-dc-void-deep border-b border-dc-storm/20 px-3 py-2 md:px-5 md:py-4 flex flex-col gap-2 md:gap-3">
        <div className="flex flex-col gap-1.5 md:flex-row md:items-baseline md:gap-3">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Show me</span>
          <div className="lbv2-stat-scroll -mx-3 px-3 md:mx-0 md:px-0">
            <div className="flex gap-2 flex-nowrap" id="lb2-stat-pills">
              {statOptions.map((s) => {
                const active = s.key === statKey;
                return (
                  <button
                    key={s.key}
                    type="button"
                    className={`lb2-stat-pill flex shrink-0 items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2.5 border font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-150 cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-dc-accent text-dc-accent bg-dc-accent/5'
                        : 'border-dc-storm/40 text-dc-storm hover:border-dc-storm hover:text-dc-platinum'
                    }`}
                    data-stat={s.key}
                    data-lb-action="setStat"
                    data-lb-arg={s.key}
                    title={s.desc}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${showTypeFilter ? '' : 'hidden'}`}
          id="lb2-type-filter-row"
        >
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Setup type</span>
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_PILLS.map(({ v, l }) => {
              const active = v === filterType;
              return (
                <button
                  key={v}
                  type="button"
                  className={`px-3 py-1.5 border font-mono text-[9px] font-bold uppercase tracking-[0.1em] transition-all duration-150 cursor-pointer ${
                    active
                      ? 'border-dc-accent text-dc-accent bg-dc-accent/5'
                      : 'border-dc-storm/40 text-dc-storm hover:border-dc-storm hover:text-dc-platinum'
                  }`}
                  data-type-filter={v}
                  data-lb-action="setFilter"
                  data-lb-arg={v}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <div className={showFrameFilters ? '' : 'hidden'} id="lb2-frame-filters-row">
          <div className="lbv2-filter-scroll -mx-3 px-3 md:mx-0 md:px-0">
            <div className="flex items-center gap-2 flex-nowrap md:flex-wrap min-w-min pb-0.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Filter</span>
              <select
                id="lb2-ff-brand"
                className="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
                data-lb-action="setFrameFilter"
                data-lb-arg="brand"
                value={ff.brand}
                onChange={() => {}}
              >
                <option value="">All brands</option>
                {racquetBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                id="lb2-ff-pattern"
                className="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
                data-lb-action="setFrameFilter"
                data-lb-arg="pattern"
                value={ff.pattern}
                onChange={() => {}}
              >
                <option value="">All patterns</option>
                {FRAME_PATTERN_OPTS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
              <select
                id="lb2-ff-headSize"
                className="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
                data-lb-action="setFrameFilter"
                data-lb-arg="headSize"
                value={ff.headSize}
                onChange={() => {}}
              >
                <option value="">All head sizes</option>
                {FRAME_HEAD_OPTS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
              <select
                id="lb2-ff-weight"
                className="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
                data-lb-action="setFrameFilter"
                data-lb-arg="weight"
                value={ff.weight}
                onChange={() => {}}
              >
                <option value="">All weights</option>
                {FRAME_WEIGHT_OPTS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
              <select
                id="lb2-ff-stiffness"
                className="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
                data-lb-action="setFrameFilter"
                data-lb-arg="stiffness"
                value={ff.stiffness}
                onChange={() => {}}
              >
                <option value="">All stiffness</option>
                {FRAME_STIFF_OPTS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
              <select
                id="lb2-ff-year"
                className="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
                data-lb-action="setFrameFilter"
                data-lb-arg="year"
                value={ff.year}
                onChange={() => {}}
              >
                <option value="">All years</option>
                {FRAME_YEAR_OPTS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
              {frameFiltersActive ? (
                <button
                  type="button"
                  className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-storm/30 text-dc-storm/60 hover:border-dc-red hover:text-dc-red transition-colors shrink-0"
                  data-lb-action="clearFrameFilters"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className={showStringFilters ? '' : 'hidden'} id="lb2-string-filters-row">
          <div className="lbv2-filter-scroll -mx-3 px-3 md:mx-0 md:px-0">
            <div className="flex items-center gap-2 flex-nowrap md:flex-wrap min-w-min pb-0.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Filter</span>
              <select
                id="lb2-sf-brand"
                className="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
                data-lb-action="setStringFilter"
                data-lb-arg="brand"
                value={sf.brand}
                onChange={() => {}}
              >
                <option value="">All brands</option>
                {stringBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                id="lb2-sf-material"
                className="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
                data-lb-action="setStringFilter"
                data-lb-arg="material"
                value={sf.material}
                onChange={() => {}}
              >
                <option value="">All materials</option>
                {STRING_MATERIAL_OPTS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
              <select
                id="lb2-sf-shape"
                className="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
                data-lb-action="setStringFilter"
                data-lb-arg="shape"
                value={sf.shape}
                onChange={() => {}}
              >
                <option value="">All shapes</option>
                {STRING_SHAPE_OPTS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
              <select
                id="lb2-sf-gauge"
                className="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
                data-lb-action="setStringFilter"
                data-lb-arg="gauge"
                value={sf.gauge}
                onChange={() => {}}
              >
                <option value="">All gauges</option>
                {STRING_GAUGE_OPTS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
              <select
                id="lb2-sf-stiffness"
                className="lbv2-filter-select bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none shrink-0"
                data-lb-action="setStringFilter"
                data-lb-arg="stiffness"
                value={sf.stiffness}
                onChange={() => {}}
              >
                <option value="">All stiffness</option>
                {STRING_STIFF_OPTS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
              {stringFiltersActive ? (
                <button
                  type="button"
                  className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-storm/30 text-dc-storm/60 hover:border-dc-red hover:text-dc-red transition-colors shrink-0"
                  data-lb-action="clearStringFilters"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-0.5 border-t border-dc-storm/10 md:border-0 md:pt-0">
          <span className="font-mono text-[9px] text-dc-storm/50 tabular-nums" id="lb2-count"></span>
        </div>
      </div>
    </>
  );
}
