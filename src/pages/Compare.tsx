// src/pages/Compare.tsx
// Compare page - React-owned route

import '../ui/pages/compare/compare.css';
import { useEffect, useMemo, useState } from 'react';
import { RACQUETS, STRINGS } from '../data/loader.js';
import { useCompareState } from '../hooks/useCompare.js';
import { useActiveLoadout, useSavedLoadouts } from '../hooks/useStore.js';
import { useTheme } from '../hooks/useTheme.js';
import type { Loadout } from '../engine/types.js';
import type { SlotId, CompareSlot } from '../ui/pages/compare/types.js';
import { setEditingSlot } from '../ui/pages/compare/hooks/useCompareState.js';
import { addLoadoutToSlot } from '../ui/pages/compare/compare-slot-api.js';
import { buildCompareSlotGridViewModel } from '../ui/pages/compare/compare-slot-grid-vm.js';
import { buildCompareDiffBatteryViewModel } from '../ui/pages/compare/compare-diff-battery-vm.js';
import {
  addSlot,
  cancelEditor,
  editSlot,
  removeSlot,
  saveSlot,
  setActiveSlot,
  tuneSlot,
} from '../ui/pages/compare/compare-actions.js';
import { CompareSlotGrid } from '../components/compare/CompareSlotGrid.js';
import { CompareRadarChart } from '../components/compare/CompareRadarChart.js';
import { CompareDiffBattery } from '../components/compare/CompareDiffBattery.js';
import { CompareSlotEditorModal } from '../components/compare/CompareSlotEditorModal.js';

function getConfiguredSlots(slots: ReturnType<typeof useCompareState>['slots']): CompareSlot[] {
  return slots.filter((slot): slot is CompareSlot => slot.loadout !== null);
}

function getCurrentEditingLoadout(
  slotId: SlotId | null,
  slots: ReturnType<typeof useCompareState>['slots'],
  activeLoadout: Loadout | null,
): Loadout | null {
  if (!slotId) return null;
  const slot = slots.find((item) => item.id === slotId);
  return slot?.loadout || activeLoadout || null;
}

export function Compare() {
  const { slots, editingSlotId } = useCompareState();
  const activeLoadout = useActiveLoadout();
  const savedLoadouts = useSavedLoadouts();
  const { theme } = useTheme();
  const [showAllStats, setShowAllStats] = useState(false);

  const configuredSlots = useMemo(() => getConfiguredSlots(slots), [slots]);
  const slotItems = useMemo(() => buildCompareSlotGridViewModel(slots), [slots]);
  const diffVm = useMemo(
    () => buildCompareDiffBatteryViewModel(configuredSlots, 6, showAllStats),
    [configuredSlots, showAllStats],
  );
  const radarKey = useMemo(
    () => configuredSlots.map((slot) => `${slot.id}:${slot.loadout.id}:${slot.loadout.obs || 0}`).join('|'),
    [configuredSlots],
  );
  const currentEditingLoadout = useMemo(
    () => getCurrentEditingLoadout(editingSlotId, slots, activeLoadout),
    [activeLoadout, editingSlotId, slots],
  );

  useEffect(() => {
    return () => {
      setEditingSlot(null);
      setShowAllStats(false);
    };
  }, []);

  return (
    <section className="workspace-mode" id="mode-compare" data-mode="compare">
      <div className="compare-page">
        <div className="compare-header">
          <span className="compare-title">// COMPARE</span>
        </div>

        <div className="compare-slots-grid" id="compare-slots-container">
          <CompareSlotGrid
            items={slotItems}
            onAdd={addSlot}
            onEdit={editSlot}
            onRemove={removeSlot}
            onTune={tuneSlot}
            onSetActive={setActiveSlot}
            onSave={saveSlot}
          />
        </div>

        <div className="compare-radar-section">
          <div className="compare-radar-wrapper" id="compare-radar-container">
            <CompareRadarChart
              slots={configuredSlots}
              radarKey={radarKey}
              themeKey={theme}
            />
          </div>
        </div>

        <div className="compare-diff-section" id="compare-diff-container">
          <CompareDiffBattery
            vm={diffVm}
            onToggleShowAll={() => setShowAllStats((current) => !current)}
          />
        </div>
      </div>

      <div id="compare-editor-container">
        {editingSlotId ? (
          <CompareSlotEditorModal
            slotId={editingSlotId}
            currentLoadout={currentEditingLoadout}
            racquets={RACQUETS}
            strings={STRINGS}
            savedLoadouts={savedLoadouts}
            onApply={(slotId, loadout) => {
              addLoadoutToSlot(slotId, loadout);
              cancelEditor();
            }}
            onCancel={cancelEditor}
          />
        ) : null}
      </div>
    </section>
  );
}
