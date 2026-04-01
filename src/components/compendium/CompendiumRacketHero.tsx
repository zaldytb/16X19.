import type { CompRacketHeroVm } from '../../ui/pages/comp-racket-hero-vm.js';

type Props = {
  vm: CompRacketHeroVm;
};

export function CompendiumRacketHero({ vm }: Props) {
  return (
    <div className="relative flex flex-col items-start mb-8">
      <div className="absolute top-6 right-6 md:top-8 md:right-8 flex flex-col items-end">
        <span className="font-mono text-[13px] text-dc-storm tracking-[0.2em] mb-1">BASE SCORE</span>
        <span className="font-mono text-5xl font-semibold leading-[0.85] text-dc-platinum">
          {vm.baseObs}
          <span className="text-xl text-dc-storm ml-1">OBS</span>
        </span>
        <div
          id="comp-string-delta"
          className="flex items-center gap-1 mt-1 opacity-0 transition-opacity duration-200"
        >
          <span className="font-mono text-lg font-bold text-dc-red">+</span>
          <span className="font-mono text-lg font-bold text-dc-red" id="comp-string-delta-value">
            0
          </span>
          <span className="font-mono text-xs text-dc-storm/60 ml-0.5">OBS</span>
        </div>
      </div>

      <h2
        className="text-5xl md:text-[4rem] font-semibold tracking-tight text-dc-platinum leading-none mb-0 pr-[120px] flex items-center gap-3 cursor-pointer group"
        data-comp-action="toggleHud"
      >
        {vm.displayTitle}
        <span className="text-2xl text-dc-red opacity-50 group-hover:opacity-100 transition-opacity">
          &#9662;
        </span>
      </h2>

      <div className="flex items-center gap-2 mt-4 font-mono text-[13px] flex-wrap">
        <span className="text-dc-platinum">{vm.year}</span>
        <span className="text-dc-accent opacity-60 text-[13px]">//</span>
        <span className="text-dc-storm uppercase tracking-[0.15em]">{vm.identityLine}</span>
      </div>

      {vm.notesHtml ? (
        <p className="max-w-[650px] mt-6 text-sm leading-relaxed text-dc-storm">{vm.notesHtml}</p>
      ) : null}

      <div className="grid grid-cols-3 md:grid-cols-6 gap-8 w-full mt-12 pt-8 border-t border-dc-border">
        <div className="flex flex-col-reverse gap-1.5">
          <span className="font-mono text-xl font-bold text-dc-platinum leading-none">{vm.swingweight}</span>
          <span className="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">SWINGWEIGHT</span>
        </div>
        <div className="flex flex-col-reverse gap-1.5">
          <span className="font-mono text-xl font-bold text-dc-platinum leading-none">{vm.stiffness}</span>
          <span className="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">STIFFNESS</span>
        </div>
        <div className="flex flex-col-reverse gap-1.5">
          <span className="font-mono text-xl font-bold text-dc-platinum leading-none">{vm.pattern}</span>
          <span className="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">PATTERN</span>
        </div>
        <div className="flex flex-col-reverse gap-1.5">
          <span className="font-mono text-xl font-bold text-dc-platinum leading-none">{vm.headSize}</span>
          <span className="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">HEAD SIZE</span>
        </div>
        <div className="flex flex-col-reverse gap-1.5">
          <span className="font-mono text-xl font-bold text-dc-platinum leading-none">{vm.balancePts}</span>
          <span className="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">BALANCE</span>
        </div>
        <div className="flex flex-col-reverse gap-1.5">
          <span className="font-mono text-xl font-bold text-dc-platinum leading-none">{vm.tensionRangeLabel}</span>
          <span className="font-mono text-[9px] text-dc-storm tracking-[0.3em] uppercase">TENSION</span>
        </div>
      </div>

      {vm.bestForLines.length + vm.watchOutLines.length > 0 ? (
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
  );
}
