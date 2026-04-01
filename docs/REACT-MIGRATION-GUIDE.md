# React Migration Guide: The Zero-Pixel Protocol

This document is a strict protocol for AI Coder Agents tasked with migrating imperative Vanilla TypeScript modules (`src/ui/pages/*.ts`) to declarative React functional components (`src/pages/*.tsx`) in the **Tennis Loadout Lab (16X19)** project.

**CRITICAL MANDATE: The current UI works perfectly. Do not change a single pixel.**
All changes during the React migration must happen entirely "under the hood." Your job is to translate imperative DOM manipulation into declarative JSX with **100% structural and stylistic parity**. You are forbidden from "sanitizing," "improving," or re-architecting the visual layer.

If the UI diverges by a single pixel, the migration has failed.

---

## 1. The Strangler Fig Pattern (Component-Level Migration)

Do **NOT** attempt to rewrite an entire page (e.g., `overview.ts` to `Overview.tsx`) in a single step. This is the primary cause of hallucinated DOM structures and broken layouts.

Instead, migrate the page **widget by widget**:

1. **Identify a target widget** (e.g., the "Live Delta Card" inside the Tune workspace).
2. **Create the React Component** (`LiveDeltaCard.tsx`).
3. **Mount locally inside the legacy file:** Instead of updating the router, instantiate your new React component inside the *existing* imperative `.ts` module using `createRoot(container).render(...)`.
4. **Remove only the legacy DOM logic** corresponding to that specific widget.
5. Repeat until all individual widgets on a page are migrated. Only then should you migrate the root page container and update the Vite routing shell.

---

## 2. The DOM Contract Enforcement

Agents often assume they know better structural patterns than the existing codebase. In this project, that assumption causes breakages. 

Before translating *any* rendering logic to JSX, you must execute the following contract:

1. **Snapshot:** Analyze the existing imperative code, observing all `.innerHTML`, `.createElement`, and `.classList.add`/`.toggle` calls. 
2. **1:1 Mapping:** The resulting JSX DOM tree must structurally match the legacy output node for node.
3. **Tailwind Preservation:** The Vite Tailwind compiler (`@tailwindcss/vite`) scans the codebase for static utility strings. You must preserve the **exact, space-separated string values** found in the legacy codebase.
    *   *Do NOT* invent new utility groupings.
    *   *Do NOT* use complex dynamic logic (`clsx(condition && 'bg-red-500', isFoo ? 'text-white' : 'text-black')`) if the original code used explicit class swapping. Match the original logic's exact output state.

---

## 3. Strict State / UI Separation

Legacy imperative modules (`src/ui/pages/*.ts`) often intertwine state calculation (reading `getCurrentSetup()`, `useAppStore.getState()`, or helpers from `src/state/imperative.ts`) deeply within DOM manipulation rendering loops.

If you attempt to migrate these simultaneously into a single complex React component, you will break the app's state flow.

**Single source of truth:** Loadout and app state live in [`src/state/useAppStore.ts`](../src/state/useAppStore.ts). Vanilla modules use [`src/state/imperative.ts`](../src/state/imperative.ts) or `useAppStore.getState()`; derived setup uses [`src/state/setup-sync.ts`](../src/state/setup-sync.ts) / [`src/state/selectors.ts`](../src/state/selectors.ts). React islands should subscribe via `useAppStore` selectors or [`src/hooks/useStore.ts`](../src/hooks/useStore.ts) — not duplicate globals.

**Before writing a `.tsx` file, split the legacy code:**

### Step 3a: Extract Pure Data
Extract the calculations mapping store-backed inputs (e.g. active loadout → view-model) into a pure helper function:
```typescript
// Legacy calculation extraction
export function getRadarViewModel(setup: Setup): RadarData {
   // All calculations here...
   return { scores, maxValues, colors };
}
```

### Step 3b: Dumb React Component
Create a pure, prop-driven React component that knows nothing about Zustand or `useAppStore.ts`. It simply receives the extracted data and renders the strict DOM contract.
```typescript
export function RadarWidget({ data }: { data: RadarData }) {
   // Strict 1:1 JSX mapping of the legacy HTML template
   return <div className="dc-radar-container">...</div>;
}
```

### Step 3c: Wrapper Hooking
Only after the pure UI component is validated, wrap it in a container component that subscribes to Zustand (`useAppStore` or `hooks/useStore.ts`) and bridges the data into props.

---

## 4. Checklist for Agent Commits
Before submitting a migration PR/change, an agent must verify:
- [ ] Has the widget been migrated in isolation using `createRoot` inside the Vanilla TS module?
- [ ] Does the JSX match the legacy DOM node-for-node?
- [ ] Are all Tailwind class strings identical to their legacy forms?
- [ ] Is imperative state access (`imperative.ts` / `getCurrentSetup()` / Zustand) kept out of leaf components — dumb widgets receive only props / view-models?
- [ ] Does `npm run typecheck && npm run canary && npm run build` pass?
