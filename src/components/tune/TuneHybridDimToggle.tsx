// Dumb presentational component — DOM must match legacy renderTuneHybridToggle 1:1.

import type {
  HybridDim,
  TuneHybridDimToggleViewModel,
} from '../../ui/pages/tune-hybrid-dim-toggle-vm.js';

type Props = {
  model: Extract<TuneHybridDimToggleViewModel, { visible: true }>;
  onSelectDim: (dim: HybridDim) => void;
};

const DIMS: Array<{ key: HybridDim; label: string }> = [
  { key: 'linked', label: 'Linked' },
  { key: 'mains', label: 'Mains' },
  { key: 'crosses', label: 'Crosses' },
];

export function TuneHybridDimToggle({ model, onSelectDim }: Props) {
  return (
    <>
      {DIMS.map((d) => (
        <button
          key={d.key}
          className={`tune-dim-btn${model.activeDim === d.key ? ' active' : ''}`}
          data-dim={d.key}
          onClick={() => onSelectDim(d.key)}
        >
          {d.label}
        </button>
      ))}
    </>
  );
}
