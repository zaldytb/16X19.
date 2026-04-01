import type { Racquet } from '../../engine/types.js';

export type CompFrameHudFilters = {
  search: string;
  brand: string;
  pattern: string;
  stiffness: string;
  headsize: string;
  weight: string;
};

export function filterRacquetsForHud(racquets: readonly Racquet[], f: CompFrameHudFilters): Racquet[] {
  const search = f.search.toLowerCase();
  const { brand, pattern, stiffness, headsize, weight } = f;

  return racquets.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search)) return false;
    if (brand && !r.name.startsWith(brand)) return false;
    if (pattern && r.pattern !== pattern) return false;
    if (stiffness === 'soft' && r.stiffness > 59) return false;
    if (stiffness === 'medium' && (r.stiffness < 60 || r.stiffness > 65)) return false;
    if (stiffness === 'stiff' && r.stiffness < 66) return false;
    if (headsize === '102' && r.headSize < 102) return false;
    if (headsize && headsize !== '102' && r.headSize !== parseInt(headsize, 10)) return false;
    if (weight === 'ultralight' && r.strungWeight >= 285) return false;
    if (weight === 'light' && (r.strungWeight < 285 || r.strungWeight > 305)) return false;
    if (weight === 'medium' && (r.strungWeight < 305 || r.strungWeight > 320)) return false;
    if (weight === 'heavy' && (r.strungWeight < 320 || r.strungWeight > 340)) return false;
    if (weight === 'tour' && r.strungWeight <= 340) return false;
    return true;
  });
}

export function readCompFrameHudFiltersFromDom(): CompFrameHudFilters {
  return {
    search: (document.getElementById('comp-search') as HTMLInputElement | null)?.value || '',
    brand: (document.getElementById('comp-filter-brand') as HTMLSelectElement | null)?.value || '',
    pattern: (document.getElementById('comp-filter-pattern') as HTMLSelectElement | null)?.value || '',
    stiffness: (document.getElementById('comp-filter-stiffness') as HTMLSelectElement | null)?.value || '',
    headsize: (document.getElementById('comp-filter-headsize') as HTMLSelectElement | null)?.value || '',
    weight: (document.getElementById('comp-filter-weight') as HTMLSelectElement | null)?.value || '',
  };
}
