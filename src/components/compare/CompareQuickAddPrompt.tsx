import type { Racquet, StringData } from '../../engine/types.js';

type RacquetOpt = { id: string; name: string };
type StringOpt = { id: string; label: string };

type Props = {
  racquets: RacquetOpt[];
  strings: StringOpt[];
  tension: number;
  onTensionChange: (v: number) => void;
  onQuickAdd: () => void;
};

export function CompareQuickAddPrompt({
  racquets,
  strings,
  tension,
  onTensionChange,
  onQuickAdd,
}: Props) {
  return (
    <div className="compare-qa-inner">
      <p className="compare-qa-title">Add a second setup to compare</p>
      <p className="compare-qa-sub">Pick a frame and string, or save more loadouts from Racket Bible</p>
      <div className="compare-qa-fields">
        <select className="dock-qa-select" id="compare-qa-frame" defaultValue="">
          <option value="">Choose frame...</option>
          {racquets.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select className="dock-qa-select" id="compare-qa-string" defaultValue="">
          <option value="">Choose string...</option>
          {strings.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="dock-qa-input"
          id="compare-qa-tension"
          value={tension}
          min={30}
          max={70}
          style={{ width: 70 }}
          onChange={(e) => onTensionChange(parseInt(e.target.value, 10) || 53)}
        />
        <button
          type="button"
          className="dock-qa-btn dock-qa-btn-primary"
          style={{ flex: 'none', padding: '7px 16px' }}
          onClick={onQuickAdd}
        >
          Add to Compare
        </button>
      </div>
    </div>
  );
}
