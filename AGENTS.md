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
| Build Card Grid | `app.js` line ~8533 | `grid grid-cols-1 md:grid-cols-2 gap-6` |
| Modulator Buttons | `app.js` line ~8512 | Tailwind with disabled states |

### ⏳ Still in Vanilla CSS (`style.css`)
| Component | CSS Classes | Migration Complexity |
|-----------|-------------|---------------------|
| Hero Block | `.comp-hero*`, `.comp-section*` | Medium |
| String Modulator Panel | `.comp-modulator*`, `.comp-inject*` | High (complex grid) |
| Stat Groups | `.comp-stat-group`, `.comp-stat-row` | Medium |
| Sort Tabs | `.comp-sort-tab` | Low |
| HUD Filters | `.comp-hud*` | Medium |
| Console Output | `.comp-console*` | Low |

### ❌ Purged from CSS
These legacy classes were removed from `style.css`:
- `.comp-build-card`, `.comp-build-featured`, `.comp-build-grid`
- `.comp-card-btn`, `.comp-card-top`, `.comp-card-archetype`
- `.comp-card-obs`, `.comp-card-string`, `.comp-card-meta`
- `.comp-card-actions`, `.comp-card-stats-inline`

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

---

## Common Pitfalls

1. **Tailwind CDN Limitations**: No JIT mode, all utilities must be in class strings at parse time
2. **Dark Mode Detection**: Requires `data-theme="dark"` on `<html>`, not body or class-based
3. **Color Contrast**: `dc-void` is near-black, `dc-platinum` is light gray - easy to mix up
4. **Legacy CSS**: Check `style.css` before adding new Tailwind classes to avoid conflicts

---

## Testing Checklist

When modifying UI components:
- [ ] Test in both light and dark mode
- [ ] Verify text contrast is readable
- [ ] Check responsive breakpoints (mobile/desktop)
- [ ] Ensure buttons have hover states
- [ ] Verify featured cards span full width in grid
