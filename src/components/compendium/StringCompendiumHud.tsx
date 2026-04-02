type Props = {
  active?: boolean;
  filters?: {
    search: string;
    material: string;
    shape: string;
    stiffness: string;
  } | null;
  onClose: () => void;
  onSearchChange?: (value: string) => void;
  onMaterialChange?: (value: string) => void;
  onShapeChange?: (value: string) => void;
  onStiffnessChange?: (value: string) => void;
  children?: React.ReactNode;
};

export function StringCompendiumHud({
  active = false,
  children,
  filters,
  onClose,
  onMaterialChange,
  onSearchChange,
  onShapeChange,
  onStiffnessChange,
}: Props) {
  const className = typeof active === 'boolean'
    ? `comp-query-hud fixed inset-0 z-[200] transition-all duration-300 flex flex-col p-8 md:p-16${active ? ' active opacity-100 visible pointer-events-auto' : ' opacity-0 invisible pointer-events-none'}`
    : 'comp-query-hud fixed inset-0 z-[200] opacity-0 invisible pointer-events-none transition-all duration-300 flex flex-col p-8 md:p-16 [&.active]:opacity-100 [&.active]:visible [&.active]:pointer-events-auto';

  return (
    <div
      className={className}
      id="string-hud"
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
        id="string-search"
        placeholder="Search strings..."
        value={filters?.search}
        onChange={(event) => onSearchChange?.(event.target.value)}
      />
      <div className="flex gap-4 flex-wrap mb-8">
        <select id="string-filter-material" className="comp-hud-filter-select" value={filters?.material} onChange={(event) => onMaterialChange?.(event.target.value)}>
          <option value="">All Materials</option>
          <option value="Polyester">Polyester</option>
          <option value="Nylon">Nylon/Multifilament</option>
          <option value="Synthetic Gut">Synthetic Gut</option>
          <option value="Natural Gut">Natural Gut</option>
        </select>
        <select id="string-filter-shape" className="comp-hud-filter-select" value={filters?.shape} onChange={(event) => onShapeChange?.(event.target.value)}>
          <option value="">All Shapes</option>
          <option value="Round">Round</option>
          <option value="Square">Square</option>
          <option value="Pentagon">Pentagon</option>
          <option value="Hexagonal">Hexagonal</option>
          <option value="Octagonal">Octagonal</option>
          <option value="Rough">Rough/Textured</option>
        </select>
        <select id="string-filter-stiffness" className="comp-hud-filter-select" value={filters?.stiffness} onChange={(event) => onStiffnessChange?.(event.target.value)}>
          <option value="">All Stiffness</option>
          <option value="soft">Soft (&lt; 180)</option>
          <option value="medium">Medium (180-210)</option>
          <option value="stiff">Stiff (&gt; 210)</option>
        </select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto flex-1 pr-4" id="string-list">{children}</div>
    </div>
  );
}
