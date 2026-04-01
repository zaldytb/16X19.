import type { OptimizeMsRowVm } from '../../ui/pages/optimize-filters-vm.js';

type Props = {
  rows: OptimizeMsRowVm[];
  onToggle: (value: string, checked: boolean) => void;
};

export function OptimizeMultiselectChecks({ rows, onToggle }: Props) {
  return (
    <>
      {rows.map((row) => (
        <label key={row.value} className={`opt-ms-item${row.checked ? ' active' : ''}`}>
          <input
            type="checkbox"
            checked={row.checked}
            value={row.value}
            onChange={(e) => onToggle(row.value, e.target.checked)}
          />
          <span>{row.value}</span>
        </label>
      ))}
    </>
  );
}
