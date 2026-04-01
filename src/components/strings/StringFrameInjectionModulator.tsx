/**
 * Strings tab frame injection modulator — markup matches legacy `string-modulator-shell` (Zero-Pixel).
 * SearchableSelect mounts into #string-mod-frame / #string-mod-crosses-string from strings.ts after render.
 */

const PREVIEW_STATS = ['spin', 'power', 'control', 'feel', 'comfort'] as const;
const TRACK_SEGMENTS = 25;

export function StringFrameInjectionModulator() {
  return (
    <div className="bg-transparent border border-dc-storm/30 p-5 md:p-6 mb-10 flex flex-col gap-5">
      <div className="flex justify-between items-center border-b border-dc-storm/30 pb-3 mb-1">
        <span className="font-mono text-[13px] text-dc-accent uppercase tracking-[0.2em]">//FRAME INJECTION</span>
        <div className="flex gap-4">
          <button
            type="button"
            className="string-mod-mode-btn text-dc-accent border-dc-accent border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors"
            data-mode="fullbed"
            data-string-action="setModMode"
            data-string-arg="fullbed"
          >
            Full Bed
          </button>
          <button
            type="button"
            className="string-mod-mode-btn text-dc-storm border-transparent border-b-2 pb-1 font-mono text-[12px] uppercase tracking-widest hover:text-dc-platinum transition-colors"
            data-mode="hybrid"
            data-string-action="setModMode"
            data-string-arg="hybrid"
          >
            Hybrid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// SELECT FRAME</span>
          <div id="string-mod-frame" data-placeholder="Select Frame..." />
          <p className="text-[12px] text-dc-storm italic">Required: Choose a frame to inject this string into</p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// PROJECTED OBS</span>
          <div id="string-mod-obs" className="flex items-center">
            <span className="font-mono text-4xl font-bold text-dc-storm">&mdash;</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// MAINS STRING</span>
          <div id="string-mod-mains-name" className="font-mono text-sm text-dc-platinum py-2 border-b border-dc-storm/30">
            Select a string first
          </div>
        </div>

        <div className="flex flex-col gap-3" id="string-mod-crosses-string-col" style={{ display: 'none' }}>
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// CROSSES STRING</span>
          <div id="string-mod-crosses-string" data-placeholder="Same as mains..." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// MAINS GAUGE</span>
          <select
            id="string-mod-gauge"
            className="appearance-none bg-white dark:bg-dc-void border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 px-2 outline-none focus:border-dc-accent transition-colors cursor-pointer"
            data-string-action="gaugeChange"
            defaultValue=""
          >
            <option value="">Default</option>
          </select>
        </div>

        <div className="flex flex-col gap-3" id="string-mod-crosses-gauge-col" style={{ display: 'none' }}>
          <span className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em]">// CROSSES GAUGE</span>
          <select
            id="string-mod-crosses-gauge"
            className="appearance-none bg-white dark:bg-dc-void border-b border-dc-storm/50 text-dc-platinum font-mono text-sm py-2 px-2 outline-none focus:border-dc-accent transition-colors cursor-pointer"
            data-string-action="crossesGaugeChange"
            defaultValue=""
          >
            <option value="">Same as mains</option>
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
            defaultValue={52}
            min={30}
            max={70}
            step={1}
            data-string-action="tensionChange"
            data-string-arg="mains"
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
            defaultValue={50}
            min={30}
            max={70}
            step={1}
            data-string-action="tensionChange"
            data-string-arg="crosses"
          />
        </div>
      </div>

      <div className="border-t border-dc-storm/30 pt-4 mt-2">
        <h4 className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em] mb-4">// LIVE PREVIEW</h4>
        <div className="flex flex-col gap-2.5">
          {PREVIEW_STATS.map((stat) => (
            <div key={stat} className="flex items-center gap-4 group" data-stat={stat}>
              <span className="font-mono text-[13px] text-dc-storm group-hover:text-dc-platinum transition-colors uppercase tracking-[0.15em] w-20">
                {stat}
              </span>
              <div className="flex flex-1 gap-[2px] h-1.5 items-center" id={`string-track-${stat}`}>
                {Array.from({ length: TRACK_SEGMENTS }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full rounded-[1px] bg-black/10 dark:bg-white/10"
                  />
                ))}
              </div>
              <span className="font-mono text-[13px] font-bold text-dc-platinum w-16 text-right" id={`string-val-${stat}`}>
                &mdash;
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
          disabled
          data-string-action="addToLoadout"
        >
          Add to Loadout
        </button>
        <button
          type="button"
          className="flex-1 font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-platinum text-dc-platinum hover:bg-dc-platinum hover:text-dc-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          id="string-mod-activate"
          disabled
          data-string-action="setActive"
        >
          Set Active
        </button>
        <button
          type="button"
          className="font-mono text-[12px] uppercase tracking-widest px-4 py-2 border border-dc-storm/50 text-dc-storm hover:bg-dc-storm/10 hover:text-dc-platinum hover:border-dc-storm transition-colors"
          data-string-action="clearPreview"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
