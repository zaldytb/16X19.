import type {
  StringCompendiumDetailVm,
  StringTelemetryRowVm,
} from '../../ui/pages/string-compendium-detail-vm.js';

type Props = {
  vm: StringCompendiumDetailVm;
};

/** Same segment classes as Overview / racket compendium — style.css handles light/dark empty-track contrast. */
function segmentClass(index: number, row: StringTelemetryRowVm): string {
  const isHigh = row.value > 70;
  if (index < row.filledSegments) {
    return isHigh ? 'stat-bar-segment high active' : 'stat-bar-segment filled active';
  }
  return 'stat-bar-segment empty';
}

export function StringCompendiumDetail({ vm }: Props) {
  return (
    <>
      <div className="relative flex flex-col items-start mb-8">
        <div className="absolute top-6 right-6 md:top-8 md:right-8 flex flex-col items-end">
          <span className="font-mono text-[13px] text-dc-storm tracking-[0.2em] mb-1">TWU SCORE</span>
          <span className="font-mono text-5xl font-semibold leading-[0.85] text-dc-platinum">{vm.twuComposite}</span>
        </div>

        <h2
          className="text-5xl md:text-[4rem] font-semibold tracking-tight text-dc-platinum leading-none mb-0 pr-[120px] flex items-center gap-3 cursor-pointer group"
          data-string-action="toggleHud"
        >
          {vm.name}
          <span className="text-2xl text-dc-red opacity-50 group-hover:opacity-100 transition-opacity">&#9660;</span>
        </h2>

        <div className="flex items-center gap-2 mt-4 font-mono text-[13px] flex-wrap">
          <span className="text-dc-platinum">{vm.materialUpper}</span>
          <span className="text-dc-accent opacity-60 text-[13px]">//</span>
          <span className="text-dc-storm uppercase tracking-[0.15em]">{vm.shape}</span>
        </div>

        {vm.notesHtml ? (
          <p className="max-w-[650px] mt-6 text-sm leading-relaxed text-dc-storm">{vm.notesHtml}</p>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full mt-12 pt-8 border-t border-dc-border">
          <div className="flex flex-col-reverse gap-1.5">
            <span className="font-mono text-xl font-bold text-dc-platinum leading-none">{vm.stiffness}</span>
            <span className="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">STIFFNESS (lb/in)</span>
          </div>
          <div className="flex flex-col-reverse gap-1.5">
            <span className="font-mono text-xl font-bold text-dc-platinum leading-none">{vm.spinPotentialDisplay}</span>
            <span className="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">SPIN POTENTIAL</span>
          </div>
          <div className="flex flex-col-reverse gap-1.5">
            <span className="font-mono text-xl font-bold text-dc-platinum leading-none">{vm.tensionLossDisplay}</span>
            <span className="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">TENSION LOSS</span>
          </div>
          <div className="flex flex-col-reverse gap-1.5">
            <span className="font-mono text-xl font-bold text-dc-platinum leading-none">{vm.snapbackLabel}</span>
            <span className="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">SNAPBACK</span>
          </div>
        </div>

        {vm.bestForLines.length > 0 || vm.watchOutLines.length > 0 ? (
          <div className="flex flex-wrap gap-4 w-full mt-8 p-0">
            {vm.bestForLines.map((line) => (
              <span
                key={`bf-${line}`}
                className="font-mono text-[13px] font-bold tracking-[0.05em] uppercase text-dc-platinum"
              >
                [+] {line}
              </span>
            ))}
            {vm.watchOutLines.map((line) => (
              <span
                key={`wo-${line}`}
                className="font-mono text-[13px] font-bold tracking-[0.05em] uppercase text-dc-red"
              >
                [-] {line}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mb-12">
        <h3 className="font-mono text-xs tracking-[0.15em] text-dc-platinum uppercase mb-1">// STRING TELEMETRY</h3>
        <p className="text-xs text-dc-storm mb-6 italic">Intrinsic characteristics from Tennis Warehouse testing</p>
        <div className="flex flex-col gap-6">
          {vm.telemetryGroups.map((group) => (
            <div key={group.title} className="flex flex-col">
              <h4 className="font-mono text-[13px] text-dc-storm uppercase tracking-[0.2em] border-b border-dc-border pb-2 mb-3">
                {group.title}
              </h4>
              <div className="flex flex-col gap-2.5">
                {group.rows.map((row) => (
                  <div key={row.label} className="flex items-center gap-4 group">
                    <span className="font-mono text-[13px] text-dc-storm group-hover:text-dc-platinum transition-colors uppercase tracking-[0.15em] w-28">
                      {row.label}
                    </span>
                    <div className="stat-bar-track flex flex-1 gap-[2px] h-1.5 items-center">
                      {Array.from({ length: 25 }, (_, i) => (
                        <div key={i} className={segmentClass(i, row)} />
                      ))}
                    </div>
                    <span className="font-mono text-[13px] font-bold text-dc-platinum w-8 text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h3 className="font-mono text-xs tracking-[0.15em] text-dc-platinum uppercase mb-1">// BEST PAIRED WITH</h3>
        <p className="text-xs text-dc-storm mb-6 italic">Top performing frames with this string (52 lbs)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {vm.bestFrameCards.map((card) => (
            <div
              key={card.racquetId}
              className="bg-transparent border border-dc-border hover:border-dc-storm p-4 flex flex-col cursor-pointer transition-colors group"
              data-string-action="goToFrame"
              data-string-arg={card.racquetId}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-[10px] text-dc-storm uppercase tracking-widest group-hover:text-dc-platinum transition-colors">
                  {card.identityLabel}
                </span>
                <span className="font-mono text-lg font-bold text-dc-accent">{card.obs.toFixed(1)}</span>
              </div>
              <div className="text-sm font-semibold text-dc-platinum mb-1">{card.name}</div>
              <div className="font-mono text-[13px] text-dc-storm">
                {card.pattern} // {card.strungWeight}g strung
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h3 className="font-mono text-xs tracking-[0.15em] text-dc-platinum uppercase mb-1">// SIMILAR STRINGS</h3>
        <p className="text-xs text-dc-storm mb-6 italic">Alternatives with similar performance profiles</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {vm.similarCards.map((card) => (
            <div
              key={card.id}
              className="bg-transparent border border-dc-border hover:border-dc-storm p-4 flex flex-col cursor-pointer transition-colors group"
              data-string-action="selectString"
              data-string-arg={card.id}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-[10px] text-dc-storm uppercase tracking-widest group-hover:text-dc-platinum transition-colors">
                  {card.archetype}
                </span>
                <span className="font-mono text-lg font-bold text-dc-platinum">
                  {card.spinScore}
                  <span className="text-[13px] text-dc-storm ml-1">SPIN</span>
                </span>
              </div>
              <div className="text-sm font-semibold text-dc-platinum mb-1">{card.name}</div>
              <div className="font-mono text-[13px] text-dc-storm">
                {card.material} // {card.shape}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
