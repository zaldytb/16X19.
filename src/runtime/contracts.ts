import type { DockEditorContext } from '../state/app-state.js';
import { reportRuntimeIssue } from './diagnostics.js';

export interface RuntimeContractResult {
  ok: boolean;
  missing: string[];
}

export function validateDomContracts(
  requiredIds: string[],
  getById: (id: string) => HTMLElement | null,
): RuntimeContractResult {
  const missing = requiredIds.filter((id) => !getById(id));
  return { ok: missing.length === 0, missing };
}

export function validateWindowBindings(
  requiredBindings: string[],
  target: Record<string, unknown>,
): RuntimeContractResult {
  if (requiredBindings.length === 0) {
    return { ok: true, missing: [] };
  }
  const missing = requiredBindings.filter((binding) => typeof target[binding] !== 'function');
  return { ok: missing.length === 0, missing };
}

type CompareSlotLike = {
  id: string | number;
  loadout: unknown | null;
  stats: unknown | null;
};

export function normalizeCompareSlots<T extends CompareSlotLike>(slots: T[]): T[] {
  return slots.map((slot) => {
    if (slot.loadout !== null && slot.stats == null) {
      return {
        ...slot,
        loadout: null,
        stats: null,
      };
    }
    return slot;
  });
}

export function reconcileDockEditorContext(
  context: DockEditorContext,
  slots: Array<{ id: string | number }>,
): DockEditorContext {
  if (context.kind !== 'compare-slot') return context;

  const exists = slots.some((slot) => String(slot.id) === String(context.slotId));
  return exists ? context : { kind: 'compare-overview' };
}

interface ValidateRuntimeContractsOptions {
  requiredDomIds: string[];
  // Most callers now pass an empty list because the runtime no longer depends
  // on a global `window.*` bridge. Keep this for narrow compatibility checks.
  requiredWindowBindings: string[];
  documentRef?: Document;
  windowRef?: Window & Record<string, unknown>;
  throwInDev?: boolean;
}

export function validateRuntimeContracts(options: ValidateRuntimeContractsOptions): boolean {
  const documentRef = options.documentRef || document;
  const windowRef = options.windowRef || (window as unknown as Window & Record<string, unknown>);
  const domResult = validateDomContracts(options.requiredDomIds, (id) => documentRef.getElementById(id));
  const bindingResult = validateWindowBindings(options.requiredWindowBindings, windowRef);

  if (!domResult.ok) {
    reportRuntimeIssue(
      'MISSING_DOM',
      `Missing required DOM nodes: ${domResult.missing.join(', ')}`,
      { details: domResult.missing, throwInDev: options.throwInDev },
    );
  }

  if (!bindingResult.ok) {
    reportRuntimeIssue(
      'MISSING_BINDING',
      `Missing required window bindings: ${bindingResult.missing.join(', ')}`,
      { details: bindingResult.missing, throwInDev: options.throwInDev },
    );
  }

  return domResult.ok && bindingResult.ok;
}
