import type { CSSProperties } from 'react';
import type { OverviewFitProfileCardViewModel } from '../../ui/pages/overview-fit-profile-vm.js';

type Props = {
  model: OverviewFitProfileCardViewModel;
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 16,
};

const colStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
};

export function OverviewFitProfileCard({ model }: Props) {
  return (
    <div style={gridStyle}>
      <div style={colStyle}>
        <span className="dna-fit-label dna-fit-best">Best For</span>
        <p className="dna-fit-line">{model.bestForText}</p>
      </div>
      <div style={colStyle}>
        <span className="dna-fit-label dna-fit-warn">Watch</span>
        <p className="dna-fit-line">{model.watchOutText}</p>
      </div>
      <div style={colStyle}>
        <span className="dna-fit-label dna-fit-tension">Sweet Spot</span>
        <p className="dna-fit-line">{model.tensionText}</p>
      </div>
    </div>
  );
}
