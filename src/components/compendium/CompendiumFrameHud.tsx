type Props = {
  active?: boolean;
  brands?: string[];
  filters?: {
    search: string;
    brand: string;
    pattern: string;
    stiffness: string;
    headsize: string;
    weight: string;
  } | null;
  onClose: () => void;
  onSearchChange?: (value: string) => void;
  onBrandChange?: (value: string) => void;
  onPatternChange?: (value: string) => void;
  onStiffnessChange?: (value: string) => void;
  onHeadsizeChange?: (value: string) => void;
  onWeightChange?: (value: string) => void;
  children?: React.ReactNode;
};

export function CompendiumFrameHud({
  active = false,
  brands = [],
  children,
  filters,
  onBrandChange,
  onClose,
  onHeadsizeChange,
  onPatternChange,
  onSearchChange,
  onStiffnessChange,
  onWeightChange,
}: Props) {
  const className = typeof active === 'boolean'
    ? `comp-query-hud fixed inset-0 z-[200] transition-all duration-300 flex flex-col p-8 md:p-16${active ? ' active opacity-100 visible pointer-events-auto' : ' opacity-0 invisible pointer-events-none'}`
    : 'comp-query-hud fixed inset-0 z-[200] opacity-0 invisible pointer-events-none transition-all duration-300 flex flex-col p-8 md:p-16 [&.active]:opacity-100 [&.active]:visible [&.active]:pointer-events-auto';

  return (
    <div
      className={className}
      id="comp-hud"
    >
      <button
        type="button"
        className="absolute top-6 right-6 bg-transparent border-none text-dc-storm dark:text-dc-platinum-dim hover:text-dc-platinum dark:hover:text-dc-platinum text-4xl cursor-pointer z-[210] transition-colors"
        onClick={onClose}
      >
        ×
      </button>
      <input
        type="text"
        className="w-full bg-transparent border-0 border-b-2 border-dc-storm focus:border-dc-accent font-mono text-2xl md:text-4xl tracking-tight text-dc-platinum pb-4 mb-8 outline-none transition-colors placeholder:text-dc-storm/50"
        id="comp-search"
        placeholder="Search frames..."
        value={filters?.search}
        onChange={(event) => onSearchChange?.(event.target.value)}
      />
      <div className="flex gap-4 flex-wrap mb-8">
        <select id="comp-filter-brand" className="comp-hud-filter-select" value={filters?.brand} onChange={(event) => onBrandChange?.(event.target.value)}>
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
        <select id="comp-filter-pattern" className="comp-hud-filter-select" value={filters?.pattern} onChange={(event) => onPatternChange?.(event.target.value)}>
          <option value="">All Patterns</option>
          <option value="16x19">16x19</option>
          <option value="18x20">18x20</option>
          <option value="16x20">16x20</option>
          <option value="16x18">16x18</option>
        </select>
        <select id="comp-filter-stiffness" className="comp-hud-filter-select" value={filters?.stiffness} onChange={(event) => onStiffnessChange?.(event.target.value)}>
          <option value="">All Stiffness</option>
          <option value="soft">Soft (&le;59)</option>
          <option value="medium">Medium (60-65)</option>
          <option value="stiff">Stiff (66+)</option>
        </select>
        <select id="comp-filter-headsize" className="comp-hud-filter-select" value={filters?.headsize} onChange={(event) => onHeadsizeChange?.(event.target.value)}>
          <option value="">All Head Sizes</option>
          <option value="97">97</option>
          <option value="98">98</option>
          <option value="100">100</option>
          <option value="102">102+</option>
        </select>
        <select id="comp-filter-weight" className="comp-hud-filter-select" value={filters?.weight} onChange={(event) => onWeightChange?.(event.target.value)}>
          <option value="">All Weights</option>
          <option value="ultralight">&lt; 285g (Ultra-Light)</option>
          <option value="light">285-305g (Light)</option>
          <option value="medium">305-320g (Medium)</option>
          <option value="heavy">320-340g (Heavy)</option>
          <option value="tour">&gt; 340g (Tour)</option>
        </select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto flex-1 pr-4" id="comp-frame-list">{children}</div>
    </div>
  );
}
