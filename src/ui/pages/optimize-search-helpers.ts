/**
 * Shared filter for Optimize searchable dropdowns (frame, lock string, exclude).
 * Full React dropdown extraction deferred — see docs/REACT-MIGRATION-PLAN.md.
 */
export function filterOptSearchItems<T extends { id: string; name: string }>(
  items: T[],
  query: string,
  limit = 30,
): T[] {
  const q = query.trim().toLowerCase();
  const list = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  return list.slice(0, limit);
}
