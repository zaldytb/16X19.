import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { Loadout, Racquet, StringData } from '../../engine/types.js';
import type { SlotId } from '../../ui/pages/compare/types.js';
import { getSlotColor } from '../../ui/pages/compare/types.js';
import {
  getInitialEditorFormState,
  type CompareEditorFormState,
  buildLoadoutFromEditorForm,
} from '../../ui/pages/compare/compare-slot-editor-vm.js';
import { toTrackedCompareLoadout } from '../../ui/pages/compare/compare-slot-api.js';

type Props = {
  slotId: SlotId;
  currentLoadout: Loadout | null;
  racquets: Racquet[];
  strings: StringData[];
  savedLoadouts: Loadout[];
  onApply: (slotId: SlotId, loadout: Loadout) => void;
  onCancel: () => void;
};

export function CompareSlotEditorModal({
  slotId,
  currentLoadout,
  racquets,
  strings,
  savedLoadouts,
  onApply,
  onCancel,
}: Props) {
  const color = getSlotColor(slotId);
  const [form, setForm] = useState<CompareEditorFormState>(() => getInitialEditorFormState(currentLoadout));

  useEffect(() => {
    setForm(getInitialEditorFormState(currentLoadout));
  }, [currentLoadout]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const apply = () => {
    if (!form.frameId) {
      window.alert('Please select a frame');
      return;
    }
    onApply(slotId, buildLoadoutFromEditorForm(slotId, form));
  };

  const loadFromSaved = (loadoutId: string) => {
    if (!loadoutId) return;
    const saved = savedLoadouts.find((lo) => lo.id === loadoutId);
    if (!saved) return;
    setForm(getInitialEditorFormState(toTrackedCompareLoadout({ ...saved })));
  };

  const setHybrid = (isHybrid: boolean) => {
    setForm((prev) => ({ ...prev, isHybrid }));
  };

  return (
    <div className="compare-editor-modal" id="compare-editor-modal" data-slot-id={slotId}>
      <div className="compare-editor-backdrop" role="presentation" onClick={onCancel} />
      <div className="compare-editor-content">
        <div className="compare-editor-header">
          <span className="compare-editor-title">// EDIT SLOT {color.label}</span>
          <button type="button" className="compare-editor-close" onClick={onCancel} aria-label="Close" />
        </div>

        <div className="compare-editor-body">
          {savedLoadouts.length > 0 ? (
            <>
              <div className="editor-section">
                <label className="editor-label" htmlFor="editor-loadout-select">
                  Load from My Loadouts
                </label>
                <select
                  className="editor-select"
                  id="editor-loadout-select"
                  defaultValue=""
                  onChange={(e) => loadFromSaved(e.target.value)}
                >
                  <option value="">— Select a saved loadout —</option>
                  {savedLoadouts.map((lo) => (
                    <option key={lo.id} value={lo.id}>
                      {(lo as { name?: string }).name || 'Unnamed'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="editor-divider" />
            </>
          ) : null}

          <EditorFormFields
            racquets={racquets}
            strings={strings}
            form={form}
            setForm={setForm}
            setHybrid={setHybrid}
          />
        </div>

        <div className="compare-editor-footer">
          <button type="button" className="editor-btn editor-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="editor-btn editor-btn-primary" onClick={apply}>
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

type FormFieldsProps = {
  racquets: Racquet[];
  strings: StringData[];
  form: CompareEditorFormState;
  setForm: Dispatch<SetStateAction<CompareEditorFormState>>;
  setHybrid: (v: boolean) => void;
};

function EditorFormFields({ racquets, strings, form, setForm, setHybrid }: FormFieldsProps) {
  return (
    <>
      <div className="editor-section">
        <label className="editor-label" htmlFor="editor-frame-select">
          Frame
        </label>
        <select
          className="editor-select"
          id="editor-frame-select"
          value={form.frameId}
          onChange={(e) => setForm((p) => ({ ...p, frameId: e.target.value }))}
        >
          <option value="">— Choose a frame —</option>
          {racquets.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="editor-section">
        <label className="editor-label">String Configuration</label>
        <div className="editor-toggle">
          <button
            type="button"
            className={`editor-toggle-btn ${!form.isHybrid ? 'active' : ''}`}
            data-mode="full"
            onClick={() => setHybrid(false)}
          >
            Full Bed
          </button>
          <button
            type="button"
            className={`editor-toggle-btn ${form.isHybrid ? 'active' : ''}`}
            data-mode="hybrid"
            onClick={() => setHybrid(true)}
          >
            Hybrid
          </button>
        </div>
      </div>

      {form.isHybrid ? (
        <>
          <div className="editor-section">
            <label className="editor-label" htmlFor="editor-mains-select">
              Mains
            </label>
            <select
              className="editor-select"
              id="editor-mains-select"
              value={form.mainsId}
              onChange={(e) => setForm((p) => ({ ...p, mainsId: e.target.value }))}
            >
              <option value="">— Choose mains —</option>
              {strings.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="editor-section">
            <label className="editor-label" htmlFor="editor-crosses-select">
              Crosses
            </label>
            <select
              className="editor-select"
              id="editor-crosses-select"
              value={form.crossesId}
              onChange={(e) => setForm((p) => ({ ...p, crossesId: e.target.value }))}
            >
              <option value="">— Choose crosses —</option>
              {strings.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <div className="editor-section">
          <label className="editor-label" htmlFor="editor-string-select">
            String
          </label>
          <select
            className="editor-select"
            id="editor-string-select"
            value={form.stringId}
            onChange={(e) => setForm((p) => ({ ...p, stringId: e.target.value }))}
          >
            <option value="">— Choose a string —</option>
            {strings.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="editor-section editor-tensions">
        <div className="editor-tension">
          <label className="editor-label">Mains Tension</label>
          <div className="editor-tension-control">
            <input
              type="range"
              id="editor-mains-tension"
              min={20}
              max={70}
              value={form.mainsTension}
              onChange={(e) =>
                setForm((p) => ({ ...p, mainsTension: parseInt(e.target.value, 10) || 53 }))
              }
            />
            <span className="editor-tension-value" id="editor-mains-tension-display">
              {form.mainsTension} lbs
            </span>
          </div>
        </div>
        <div className="editor-tension">
          <label className="editor-label">Crosses Tension</label>
          <div className="editor-tension-control">
            <input
              type="range"
              id="editor-crosses-tension"
              min={20}
              max={70}
              value={form.crossesTension}
              onChange={(e) =>
                setForm((p) => ({ ...p, crossesTension: parseInt(e.target.value, 10) || 51 }))
              }
            />
            <span className="editor-tension-value" id="editor-crosses-tension-display">
              {form.crossesTension} lbs
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
