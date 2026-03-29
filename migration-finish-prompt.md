> **Archived — historical agent prompt.** The repo no longer uses root `app.js` or `src/main.js`; see [`ts-migration-plan.md`](ts-migration-plan.md) and [`README.md`](README.md) for the current layout.

# 16X19 (Tennis Loadout Lab) - Final TypeScript Migration Prompt

**Objective:** Cross the finish line by completely eliminating the `app.js` monolith. The frontend must run exclusively on our Vite + TypeScript bridge (`src/main.js`). 

## Context & Rules
- The project is currently a hybrid. `src/main.js` handles routing, but still imports `app.js` to blindly loop through and expose its contents to `window.*` for inline HTML handlers.
- **Rule 1:** All runtime logic MUST be strongly typed in TypeScript.
- **Rule 2:** ZERO UI REDESIGNS OR DOM ALTERATIONS. You are migrating logic, not redesigning the app. You must preserve all existing CSS classes, ID selectors, and DOM structures exactly as they are. The app uses a Tailwind 4.x CDN, so runtime-generated utility classes (like `bg-dc-platinum`, `text-dc-void`) must NOT be altered or consolidated.
- **Rule 3:** Preserve the exact Dark Mode mechanism. `toggleTheme` relies on `data-theme="dark"` on the `<html>` element. Do not implement a generic replacement.
- **Rule 4:** After edits, you MUST verify using `npm run typecheck && npm run canary && npm run build`. If it fails, fix the types before proceeding.
- **Rule 5:** The `window.*` bridge in `src/main.js` must be explicitly populated. We are removing the automatic `Object.entries(App)` loop. All inline `<button onclick="...">` handlers in `index.html` rely on this bridge.

## Execution Steps

### Step 1: Extract Remaining Orphaned Logic 
**Critical Warning:** You MUST copy-paste the logic of the functions EXACTLY. Do NOT refactor the body, do NOT replace `document.getElementById` with React/generic abstractions, and do NOT alter the string values of classes. Add Type annotations and nothing more.

Search `app.js` for the following isolated functional blocks and migrate them to their appropriate TS modules. Ensure type safety:
1. `setHybridMode` -> Move to `src/ui/shared/helpers.ts` or `src/ui/components/dock-renderers.ts`.
2. `hydrateDock` -> Move to `src/ui/components/dock-renderers.ts`.
3. `toggleTheme` -> Move to `src/ui/theme.ts` (create the file if it doesn't exist).
4. `renderComparisonPresets` -> Move to `src/ui/shared/presets.ts`.
5. `_initLandingSearch` & `_handleSharedBuildURL` -> Move to `src/ui/pages/shell.ts` or `src/main.js`.

### Step 2: Refactor `src/ui/pages/shell.ts` Dependencies
Right now, `src/ui/pages/shell.ts` imports several things from `../../../app.js`. 
- Redirect all these imports to point at your newly migrated TS exports in `src/ui/`.
- Ensure zero imports reference `app.js` in `shell.ts`.

### Step 3: Dismantle the `app.js` Bridge Loop
Open `src/main.js` and look for:
`import * as App from '../app.js';`
and the loop:
`Object.entries(App).forEach(...)`

- Provide an explicit mapping for any core functions that the loop was catching but aren't currently bound in the file. (e.g., `window.toggleTheme = Theme.toggleTheme;`). 
- Delete the `App` import and the loop entirely.

### Step 4: Delete the Monolith
Once `src/main.js` no longer depends on `app.js`, and `shell.ts` no longer imports from it, physically delete `app.js` from the repository root:
`rm app.js`

### Step 5: Verification & Safety
Run the validation gate locally:
`npm run typecheck && npm run canary && npm run build`

If compilation passes, manually check `index.html` in the dev server:
- Click the dark mode toggle (tests `toggleTheme`).
- Toggle a full-bed vs hybrid setup (tests `setHybridMode`).
- Load an active loadout (tests `hydrateDock`).
