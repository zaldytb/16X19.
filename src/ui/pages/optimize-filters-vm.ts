import type { StringData } from '../../engine/types.js';

export type OptimizeMsRowVm = { value: string; checked: boolean };

export function buildOptimizeMaterialChecksVm(
  materials: readonly string[],
  allowed: Set<string>,
): OptimizeMsRowVm[] {
  return materials.map((value) => ({ value, checked: allowed.has(value) }));
}

export function buildOptimizeBrandChecksVm(
  brands: readonly string[],
  allowed: Set<string>,
): OptimizeMsRowVm[] {
  return brands.map((value) => ({ value, checked: allowed.has(value) }));
}

export function buildOptimizeMultiselectLabel(
  noun: string,
  total: number,
  allowed: Set<string>,
  values: readonly string[],
): string {
  const checked = values.filter((v) => allowed.has(v)).length;
  if (checked === total) {
    return `All ${noun}s`;
  }
  if (checked === 0) {
    return `No ${noun}s`;
  }
  return `${checked} of ${total} ${noun}s`;
}

export function buildOptimizeExcludeTagsVm(
  excludedIds: Set<string>,
  strings: readonly StringData[],
): { id: string; name: string }[] {
  return Array.from(excludedIds).map((id) => {
    const s = strings.find((x) => x.id === id);
    return { id, name: s ? s.name : id };
  });
}
