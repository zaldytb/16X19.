# Tennis Loadout Lab — Agent Documentation

## Project Overview
Physics-based tennis equipment analysis tool. Vanilla JS + Tailwind CSS (CDN mode, no build step).

---

## Tailwind CSS Implementation State

### Configuration (`index.html` lines 13-51)
```javascript
tailwind.config = {
  darkMode: ['selector', '[data-theme="dark"]'],  // Data-attribute based
  theme: {
    extend: {
      colors: {
        'dc-void': '#1A1A1A',        // Near-black (primary dark)
        'dc-void-deep': '#141414',   // Deeper black
        'dc-void-lift': '#222222',   // Elevated dark surfaces
        'dc-storm': '#5E666C',       // Muted gray
        'dc-storm-light': '#8A9199', // Lighter gray
        'dc-platinum': '#DCDFE2',    // Light gray (primary light)
        'dc-platinum-dim': '#B0B5BA',// Dimmed light
        'dc-white': '#F0F2F4',       // Off-white
        'dc-accent': '#FF4500',      // Orange accent
        'dc-red': '#AF0000',         // Red alert
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'hero': 'clamp(2.8rem, 5vw, 4.5rem)',
        'obs': 'clamp(2.5rem, 4vw, 3.5rem)',
        'mouse': '9px',
      }
    }
  }
}
```

### Dark Mode Strategy
- **Selector**: `[data-theme="dark"]` on `<html>` element
- **Toggle**: `toggleTheme()` in `app.js` (line ~6819)
- **Implementation**: Use `dark:` prefix for conditional styling
  ```html
  <!-- Light = dark text, Dark = light text -->
  <span class="text-dc-void dark:text-dc-platinum">Text</span>
  ```

---

## Migration Status

### ✅ Migrated to Tailwind
| Component | Location | Notes |
|-----------|----------|-------|
| Build Cards | `app.js` `_compRenderBuildCard()` | Full Tailwind, compact scale |
| Build Card Grid | `app.js` `_compRenderMain()` | `grid grid-cols-1 md:grid-cols-2 gap-6` |
| Hero Block | `app.js` `_compRenderMain()` | Full Tailwind with dark mode |
| String Modulator | `app.js` `_compRenderMain()` | Full Tailwind, hybrid toggle, real-time preview |
| Stat Groups | `app.js` `_compRenderMain()` | Battery bars with before/after preview |
| Sort Tabs | `app.js` `_compRenderMain()` | Tailwind with active states |
| HUD Filters | `app.js` `_compRenderRoster()` | Full Tailwind overlay |
| Console Output | `app.js` `_compRenderMain()` | Tailwind typography |
| String Compendium | `app.js` `_stringRenderMain()` | Full Tailwind mirror of Racket Bible |
| Frame Injection | `app.js` `_stringRenderMain()` | String-first modulator with hybrid support |
| Base Score Display | `app.js` `_compRenderMain()` | Frame-only OBS with delta indicator |
| Searchable Selects | `app.js` `createSearchableSelect()` | Custom dropdown component with Tailwind |

### ⏳ Still in Vanilla CSS (`style.css`)
| Component | CSS Classes | Migration Complexity |
|-----------|-------------|---------------------|
| Overview Page | `.overview-*` | High (many components) |
| Compare Page | `.compare-*` | High (complex interactions) |
| Optimize Page | `.opt-*` | Medium |
| Dock | `.dock-*` | Medium |
| Landing Page | `.landing-*` | Low |

### ❌ Purged from CSS
These legacy classes were removed from `style.css`:
- `.comp-build-card*`, `.comp-build-featured`, `.comp-build-grid`
- `.comp-card-*` (all card components)
- `.comp-hero*` (hero block)
- `.comp-modulator*` (modulator panel)
- `.comp-stats*`, `.comp-stat-*` (stat groups)
- `.comp-sort-*` (sort tabs)
- `.comp-hud*` (HUD overlay)
- `.comp-frame-*` (frame roster items)

---

## Typography Hierarchy (Elephant & Mouse)

| Element | Size | Class | Weight |
|---------|------|-------|--------|
| Hero Title | `clamp(2.8rem, 5vw, 4.5rem)` | `text-hero` | Bold |
| Section Headers | `clamp(2.5rem, 4vw, 3.5rem)` | `text-obs` | Semibold |
| Card Score | `text-4xl md:text-5xl` | Custom | Semibold |
| Labels | `9px` | `text-mouse` | Normal |
| Micro Labels | `8px` | `text-[8px]` | Bold |

---

## Best Practices for Future Agents

### 1. Always Use Dark Mode Prefixes
When adding text that needs to be visible in both modes:
```javascript
// ❌ Bad - blends in one mode
<span class="text-dc-platinum">Text</span>

// ✅ Good - adapts to both modes
<span class="text-dc-void dark:text-dc-platinum">Text</span>
```

### 2. Keep Compact Scale for Cards
Build cards use tight spacing:
- Padding: `p-5` (not `p-6`)
- Margins: `mb-4`, `my-1.5`
- Buttons: `py-1.5` (slim)
- Typography: Score at `text-4xl/5xl`, labels at `text-[9px]`

### 3. Use Design Tokens
Always use `dc-*` colors, never hardcode:
```javascript
// ❌ Bad
<span class="text-gray-200">Text</span>

// ✅ Good
<span class="text-dc-platinum">Text</span>
```

### 4. Card Grid Pattern
```javascript
// Grid container
`<div class="grid grid-cols-1 md:grid-cols-2 gap-6">${cards}</div>`

// Individual card (featured spans full width)
const cardClasses = isFeatured 
  ? "... col-span-full"  // Full width
  : "...";               // Normal grid cell
```

### 5. Button Pattern
```javascript
// Primary (Set Active)
<button class="bg-transparent border border-dc-accent text-dc-accent 
  hover:bg-dc-accent hover:text-dc-void 
  font-mono text-[9px] uppercase tracking-widest py-1.5 
  transition-colors text-center">Set Active</button>

// Secondary (Tune/Save)
<button class="bg-transparent border border-dc-storm/50 dark:border-dc-storm/30 
  text-dc-storm hover:border-dc-storm hover:bg-dc-storm/10 
  hover:text-dc-void dark:hover:text-dc-platinum 
  font-mono text-[9px] uppercase tracking-widest py-1.5 
  transition-colors text-center">Tune</button>
```

### 6. Searchable Select Component
Custom dropdown component using Tailwind:
```javascript
// Store instance for programmatic access
ssInstances['my-select'] = createSearchableSelect(container, {
  type: 'string',  // 'racquet' | 'string' | 'custom'
  placeholder: 'Select...',
  value: initialValue,
  onChange: (val) => { /* update state */ }
});

// Later: programmatically set value
ssInstances['my-select'].setValue(newValue);
```

**Key classes:**
- `.ss-trigger` — dropdown button
- `.ss-dropdown` — options container
- `.ss-option` — individual option
- `.ss-selected` — selected state
- `.ss-highlighted` — keyboard navigation highlight

---

## Common Pitfalls

1. **Tailwind CDN Limitations**: No JIT mode, all utilities must be in class strings at parse time
2. **Dark Mode Detection**: Requires `data-theme="dark"` on `<html>`, not body or class-based
3. **Color Contrast**: `dc-void` is near-black, `dc-platinum` is light gray - easy to mix up
4. **Legacy CSS**: Check `style.css` before adding new Tailwind classes to avoid conflicts
5. **State Sync**: When using `createSearchableSelect`, store the instance in `ssInstances` to enable programmatic updates via `setValue()`
6. **Component Re-init**: Clear `ssInstances` entries before re-initializing to prevent stale state

---

## String Compendium

The String Compendium mirrors the Racket Bible but with String-first exploration.

### Workflow
1. **Browse strings** via grid with material/shape filters
2. **Select string** → Opens Hero block with Telemetry
3. **Pick frame** (required) → Enables Frame Injection panel
4. **Adjust gauge/tension** → Real-time preview updates
5. **Hybrid mode** → Toggle between fullbed and hybrid with independent crosses string
6. **Add to Loadout / Set Active** → Save configuration

### Key Functions
| Function | Purpose |
|----------|---------|
| `_stringRenderMain(string)` | Hero block + Telemetry bars |
| `_stringRenderFrameInjector(string)` | Frame picker + modulator controls |
| `_stringPreviewStats()` | Real-time before/after battery bars |
| `_stringAddToLoadout()` | Save string+frame combo to loadout |
| `_stringSetActive()` | Set as current active setup |

### State Management
```javascript
let _stringSelectedId = null;
let _stringInjectState = {
  frameId: '', stringId: '', mode: 'fullbed' | 'hybrid',
  mainsGauge: '', crossesGauge: '', 
  mainsTension: 52, crossesTension: 50
};
```

### Hybrid Mode UI
- Fullbed: Single gauge dropdown, single tension input
- Hybrid: Separate mains/crosses gauges, separate tensions, crosses string selector

---

## Testing Checklist

When modifying UI components:
- [ ] Test in both light and dark mode
- [ ] Verify text contrast is readable
- [ ] Check responsive breakpoints (mobile/desktop)
- [ ] Ensure buttons have hover states
- [ ] Verify featured cards span full width in grid
- [ ] Test string hybrid mode toggle
- [ ] Verify frame injection preview updates correctly
- [ ] Test searchable select dropdowns (keyboard nav, search, selection)
- [ ] Verify setValue() API updates UI correctly
- [ ] Test mode switching preserves state correctly

---

## Setup Syncing Across App

The app maintains consistency between the active loadout and all pages through `getCurrentSetup()` which returns the active racquet + string configuration.

### Sync Flow

```
Active Loadout (source of truth)
    ↓ getCurrentSetup()
├── Overview Page — renders active build dashboard
├── Tune Page — initializes with current racquet + strings  
├── Compare Page — uses active loadout as baseline
├── Optimize Page — suggests improvements from current setup
└── Racket Bible — syncs on entry via _compSyncWithActiveLoadout()
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `getCurrentSetup()` | Returns `{racquet, stringConfig}` from active loadout or editor DOM |
| `activateLoadout(lo)` | Sets new active loadout, triggers re-render across pages |
| `_compSyncWithActiveLoadout()` | Switches Racket Bible to active racket frame + re-inits string injector |
| `_compInitStringInjector()` | Initializes modulator with active loadout strings or fresh state |
| `_stringSyncWithActiveLoadout()` | Syncs String Compendium with active loadout state |

### Consistency Rules

1. **Same racket as active** → Show active strings in modulator, allow modification
2. **Different racket** → Fresh start (empty strings), user builds new setup
3. **No active loadout** → Fresh start, Apply creates new loadout and activates it
4. **Mode switch** → `switchMode('compendium')` calls `_compSyncWithActiveLoadout()`

### Roundtrip Survival

User journey that maintains consistency:
1. Go to Racket Bible → auto-selects active racket frame
2. Switch to Tune/Compare/Optimize → uses active racquet + strings
3. Modify in Tune → updates active loadout
4. Return to Racket Bible → syncs to show updated active racket + strings
