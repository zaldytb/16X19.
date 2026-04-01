type Props = {
  upgradeMode: boolean;
  onUpgradeModeChange: (checked: boolean) => void;
};

export function OptimizeUpgradePanel({ upgradeMode, onUpgradeModeChange }: Props) {
  return (
    <label className="opt-checkbox-label">
      <input
        type="checkbox"
        id="opt-upgrade-mode"
        checked={upgradeMode}
        onChange={(e) => onUpgradeModeChange(e.target.checked)}
      />
      Compare vs current build
    </label>
  );
}
