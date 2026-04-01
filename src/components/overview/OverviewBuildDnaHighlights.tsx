import type { OverviewBuildDnaViewModel } from '../../ui/pages/overview-build-dna-vm.js';

type Props = {
  model: OverviewBuildDnaViewModel;
};

export function OverviewBuildDnaHighlights({ model }: Props) {
  return (
    <div className="dna-highlights-row">
      <span className="dna-highlights-label">STRONG</span>{model.topStrong.map((s) => (
        <span key={`t-${s.label}`} className="dna-log-strong">
          [+] {s.label.toUpperCase()} {s.val}
        </span>
      ))}
      <span className="dna-highlights-label">GAP</span>{model.bottomGap.map((s) => (
        <span key={`b-${s.label}`} className="dna-log-gap">
          [-] {s.label.toUpperCase()} {s.val}
        </span>
      ))}
    </div>
  );
}
