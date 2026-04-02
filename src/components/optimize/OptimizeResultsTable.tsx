import type { OptimizeResultsVm } from '../../ui/pages/optimize-results-vm.js';

type Props = {
  model: OptimizeResultsVm;
  onTargetTensionChange?: (value: string) => void;
  onClearTargetTension?: () => void;
  onView?: (rowIndex: number) => void;
  onTune?: (rowIndex: number) => void;
  onCompare?: (rowIndex: number) => void;
  onSave?: (rowIndex: number) => void;
};

export function OptimizeResultsTable({
  model,
  onClearTargetTension,
  onCompare,
  onSave,
  onTargetTensionChange,
  onTune,
  onView,
}: Props) {
  if (model.state === 'loading') {
    return <div className="opt-loading">Computing builds...</div>;
  }

  if (model.state === 'empty') {
    return (
      <div className="opt-empty">
        <p className="opt-empty-title">No builds match your filters</p>
        <p className="opt-empty-sub">Try relaxing the stat minimums or expanding the tension range.</p>
      </div>
    );
  }

  return (
    <>
      <div className="opt-tension-filter">
        <label className="opt-tension-label">Target Tension</label>
        <input
          type="number"
          className="opt-tension-input"
          id="opt-tension-filter"
          value={model.targetTension}
          placeholder="All"
          min="30"
          max="70"
          onChange={(event) => onTargetTensionChange?.(event.target.value)}
        />
        <span className="opt-tension-hint">+/-1 lb</span>
        <button className="opt-tension-clear" style={model.showClear ? undefined : { display: 'none' }} onClick={onClearTargetTension}>
          Clear
        </button>
      </div>
      <div className="opt-table-wrap">
        <table className="opt-table">
          <thead>
            <tr>
              <th className="opt-th opt-th-rank">#</th>
              <th className="opt-th opt-th-type">Type</th>
              <th className="opt-th opt-th-string">String(s)</th>
              <th className={`opt-th opt-th-num${model.sortBy === 'obs' ? ' opt-th-active' : ''}`}>OBS</th>
              <th className="opt-th opt-th-num opt-th-delta">&Delta;</th>
              <th className="opt-th opt-th-gauge">Ga.</th>
              <th className="opt-th opt-th-tension">Tension</th>
              <th className={`opt-th opt-th-num${model.sortBy === 'spin' ? ' opt-th-active' : ''}`}>Spn</th>
              <th className={`opt-th opt-th-num${model.sortBy === 'power' ? ' opt-th-active' : ''}`}>Pwr</th>
              <th className={`opt-th opt-th-num${model.sortBy === 'control' ? ' opt-th-active' : ''}`}>Ctl</th>
              <th className={`opt-th opt-th-num${model.sortBy === 'comfort' ? ' opt-th-active' : ''}`}>Cmf</th>
              <th className={`opt-th opt-th-num${model.sortBy === 'feel' ? ' opt-th-active' : ''}`}>Fel</th>
              <th className={`opt-th opt-th-num${model.sortBy === 'durability' ? ' opt-th-active' : ''}`}>Dur</th>
              <th className={`opt-th opt-th-num${model.sortBy === 'playability' ? ' opt-th-active' : ''}`}>Ply</th>
              <th className="opt-th opt-th-actions"></th>
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <tr key={`${row.rowIndex}-${row.label}-${row.tensionLabel}`} className={`opt-row${row.isTopRow ? ' opt-row-top' : ''}`}>
                <td className="opt-td opt-td-rank">{row.rank}</td>
                <td className="opt-td opt-td-type">
                  {row.typeTag === 'H' ? <span className="opt-tag-hybrid">H</span> : <span className="opt-tag-full">F</span>}
                </td>
                <td className="opt-td opt-td-string">{row.label}</td>
                <td className="opt-td opt-td-num opt-td-obs" style={{ color: row.obsColor, fontWeight: 700 }}>
                  {row.obsDisplay}
                </td>
                <td className={`opt-td opt-td-num ${row.deltaClass}`}>{row.deltaDisplay}</td>
                <td className="opt-td opt-td-gauge">{row.gaugeDisplay}</td>
                <td className="opt-td opt-td-tension">{row.tensionLabel}</td>
                <td className="opt-td opt-td-num">{row.spinDisplay}</td>
                <td className="opt-td opt-td-num">{row.powerDisplay}</td>
                <td className="opt-td opt-td-num">{row.controlDisplay}</td>
                <td className="opt-td opt-td-num">{row.comfortDisplay}</td>
                <td className="opt-td opt-td-num">{row.feelDisplay}</td>
                <td className="opt-td opt-td-num">{row.durabilityDisplay}</td>
                <td className="opt-td opt-td-num">{row.playabilityDisplay}</td>
                <td className="opt-td opt-td-actions">
                  <button className="opt-act-btn" onClick={() => onView?.(row.rowIndex)}>
                    View
                  </button>
                  <button className="opt-act-btn" onClick={() => onTune?.(row.rowIndex)}>
                    Tune
                  </button>
                  <button className="opt-act-btn" onClick={() => onCompare?.(row.rowIndex)}>
                    Compare
                  </button>
                  {row.isSaved ? (
                    <button className="opt-act-btn opt-act-save opt-act-saved" onClick={() => onSave?.(row.rowIndex)}>
                      Saved
                    </button>
                  ) : (
                    <button className="opt-act-btn opt-act-save" onClick={() => onSave?.(row.rowIndex)}>
                      Save
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
