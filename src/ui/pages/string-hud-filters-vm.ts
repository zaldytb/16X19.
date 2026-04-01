import type { StringData } from '../../engine/types.js';

export type StringHudFilters = {
  search: string;
  material: string;
  shape: string;
  stiffness: string;
};

export function filterStringsForHud(strings: readonly StringData[], f: StringHudFilters): StringData[] {
  const search = f.search.toLowerCase();
  const { material, shape, stiffness } = f;

  return strings.filter((stringItem) => {
    if (search && !stringItem.name.toLowerCase().includes(search)) return false;
    if (material && !stringItem.material.includes(material)) return false;
    if (shape && !stringItem.shape.toLowerCase().includes(shape.toLowerCase())) return false;
    if (stiffness === 'soft' && stringItem.stiffness >= 180) return false;
    if (stiffness === 'medium' && (stringItem.stiffness < 180 || stringItem.stiffness > 210)) return false;
    if (stiffness === 'stiff' && stringItem.stiffness <= 210) return false;
    return true;
  });
}

export function readStringHudFiltersFromDom(): StringHudFilters {
  return {
    search: (document.getElementById('string-search') as HTMLInputElement | null)?.value || '',
    material: (document.getElementById('string-filter-material') as HTMLSelectElement | null)?.value || '',
    shape: (document.getElementById('string-filter-shape') as HTMLSelectElement | null)?.value || '',
    stiffness: (document.getElementById('string-filter-stiffness') as HTMLSelectElement | null)?.value || '',
  };
}
