/** Shared OBS baseline cache used by compendium and string-compendium previews. */
let _value: number | null = null;

export function getCompBaseObs(): number | null {
  return _value;
}

export function setCompBaseObs(v: number | null): void {
  _value = v;
}
