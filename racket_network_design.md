# Racket Network — Design & Architecture

> **PowerBI on crack, but for rackets.**
> A 4-axis compass chart that maps every racket in the database across multiple analytical lenses.

---

## The Concept

Inspired by the [HEAD Racquet Compass](https://www.head.com/), but generalized to work across **all brands** and offering **3 distinct analytical modes**. Each mode uses a 4-axis scatter/compass layout, but the axes and the scoring logic behind each dot's position change per mode.

![HEAD Racquet Compass reference](/c/Users/Zld/.gemini/antigravity/brain/6260d39a-bd90-4302-9ed7-ec8f7e67c9e8/.system_generated/artifacts/head_compass_ref.png)

---

## The 3 Modes

### Mode 1: Performance Compass 🎯
**"How does it play?"**

Pure performance-characteristic mapping. Like the HEAD compass but using our engine's `calcFrameBase` scores instead of marketing categories.

| Axis | Direction | Source | What it means |
|------|-----------|--------|--------------|
| **↑ Spin** | North | `frameBase.spin` | Topspin potential (pattern openness, spin tech, aero) |
| **→ Power** | East | `frameBase.power` | Free power (stiffness, beam, swingweight) |
| **↓ Touch** | South | `frameBase.feel` | Feel + connection (flex, thin beam, HL balance) |
| **← Control** | West | `frameBase.control` | Precision + directional confidence (density, small head, stiff) |

**How a dot is positioned:**
```
x = frameBase.power - frameBase.control   →  positive = right (power), negative = left (control)
y = frameBase.spin  - frameBase.feel       →  positive = up (spin), negative = down (touch)
```

**The result:** a natural 4-quadrant spread:
- **NW (Spin + Control)** → HEAD Radical zone — precise spin machines  
- **NE (Spin + Power)** → HEAD Extreme zone — powerful spin  
- **SW (Touch + Control)** → HEAD Gravity zone — precision touch  
- **SE (Touch + Power)** → HEAD Boom zone — powerful touch  
- **Center** → HEAD Speed zone — balanced all-rounders  

Each quadrant gets a family label and color.

---

### Mode 2: OBS Ranking Plot 📊
**"Where does it lean?"**

Every racket is computed with a **default reference stringing** (e.g., Luxilon ALU Power @ 52lbs) so OBS scores are comparable. If two rackets both score OBS 72, this plot reveals *how* they got there — one via spin/power, another via control/comfort.

| Axis | Direction | Source | What it means |
|------|-----------|--------|--------------|
| **↑ Attack** | North | `(spin + power + launch) / 3` | Offensive output |
| **→ Comfort** | East | `(comfort + forgiveness + feel) / 3` | Arm-friendliness & cushion |
| **↓ Longevity** | South | `(durability + playability) / 2` | String-bed endurance |
| **← Defense** | West | `(control + stability) / 2` | Defensive solidity |

**How a dot is positioned:**
```
x = comfortGroup - defenseGroup   →  positive = right (comfort-leaning), negative = left (defense-leaning)
y = attackGroup  - longevityGroup  →  positive = up (attack-leaning), negative = down (longevity-leaning)
```

**Dot size** encodes OBS: higher OBS = larger dot.
**Dot color** encodes OBS tier (using existing `OBS_TIERS` palette).

This instantly answers: _"I want an OBS 75+ racket that leans spin/power"_ — look NW with large dots.

---

### Mode 3: OBS Tuner 🎛️
**"Score rackets for MY game."**

The user sets **personal weight sliders** for each of the 11 stats. Then every racket is scored with a **custom weighted OBS** and plotted with the same axis geometry as Mode 1, but dot size and brightness now reflect the personalized score.

| Feature | Description |
|---------|-------------|
| **Sliders** | 11 sliders, one per stat (spin, power, control, launch, feel, comfort, stability, forgiveness, maneuverability, durability, playability) |
| **Weights range** | 0 – 10 (default: 5 for all) |
| **Custom score** | `Σ(stat_i × weight_i) / Σ(weight_i)` — weighted average |
| **Plot axes** | Same as Mode 1 (Spin/Power/Touch/Control) for spatial position |
| **Dot encoding** | Size + glow intensity = custom score value |

**Workflow:**
1. Drag "Spin" to 10, "Control" to 8, "Power" to 3
2. Rackets with high spin + control light up brightest
3. Rackets with power-only lean fade/shrink
4. Hover any dot → full stats card with your custom score prominently shown

#### Tuner Presets
Quick-set buttons for common play styles:
- **Baseline Grinder**: Spin 9, Control 8, Durability 7, Comfort 6
- **Aggressive Baseliner**: Power 9, Spin 8, Launch 7, Control 5
- **All-Courter**: Control 7, Maneuverability 7, Feel 7, Stability 6
- **Serve & Volleyer**: Power 8, Maneuverability 9, Feel 8, Stability 7
- **Arm-Friendly**: Comfort 10, Feel 8, Forgiveness 7, Stability 5

---

## Axis System Details

### The 4-Axis Compass Geometry

All 3 modes share the same visual layout — a circle with 4 labeled axes:

```
            NORTH
              │
              │
  WEST ───────┼─────── EAST
              │
              │
            SOUTH
```

Dots are positioned using `(x, y)` coordinates normalized to `[-1, 1]`:
- The compass area is a circle of radius 1
- Dots near the center are balanced
- Dots near the edge are extreme in one or two attributes
- A subtle dashed circle at radius ~0.6 marks the "typical" boundary

### Normalization Strategy

For each racket, the raw x/y values are computed (per-mode formula above), then normalized against the min/max across ALL rackets in the database:

```typescript
const xNorm = (xRaw - xMin) / (xMax - xMin) * 2 - 1;  // maps to [-1, 1]
const yNorm = (yRaw - yMin) / (yMax - yMin) * 2 - 1;
```

This ensures the full dataset spreads to fill the compass nicely.

---

## Data Pipeline

### Frame-Only Computation
For Mode 1 (Performance Compass), we compute `calcFrameBase(racquet)` for every racket — **no stringing needed**. This gives us the 11 raw frame scores.

### Reference Setup Computation  
For Modes 2 and 3, we compute a full `predictSetup(racquet, referenceString)` using a **default reference stringing**:
- **String**: Luxilon ALU Power 125 (poly reference)
- **Tension**: Mid-range of the racket's tension range
- **Mode**: Fullbed

This ensures apples-to-apples comparison.

### Compute Cache
Pre-compute all racket positions on first load (or in a Web Worker) since we need to process ~50+ rackets × 3 modes.

```typescript
interface RacketNetworkPoint {
  racquet: Racquet;
  frameBase: FrameBaseScores;
  stats: SetupAttributes;          // with reference stringing
  obs: number;                     // standard OBS
  customScore: number;             // Mode 3 only — recomputed on slider change
  position: { x: number; y: number };  // normalized [-1, 1], computed per-mode
  quadrant: string;                // NE, NW, SE, SW, CENTER
  familyLabel: string;             // e.g. "Precise Spin", "Powerful Touch"
}
```

---

## UI Architecture

### Components

```
src/
  pages/
    Network.tsx                    ← Page component (lazy-loaded)
  components/
    network/
      NetworkCompass.tsx            ← The main SVG/Canvas chart
      NetworkModeSelector.tsx       ← Mode 1/2/3 tabs
      NetworkAxisLabels.tsx         ← Animated axis labels per mode  
      NetworkDot.tsx                ← Individual racket dot (hover/click)
      NetworkTooltip.tsx            ← Hover card with stats
      NetworkTunerPanel.tsx         ← Mode 3 slider panel
      NetworkLegend.tsx             ← Quadrant family legend
      NetworkFilters.tsx            ← Brand filter, year filter
```

### Routing
Add `/network` route:
```typescript
// modePaths.ts
network: '/network',

// App.tsx
<Route path="network" element={<NetworkWorkspace />} />
```

### State
Use local component state (not Zustand) since this page is self-contained. Only the tuner weights potentially persist to localStorage.

---

## Visual Design

### Color Palette (per quadrant)
Aligned with the app's existing dark theme (`dc-*` design tokens):

| Quadrant | Family | Color | CSS Variable |
|----------|--------|-------|--------------|
| NW (Spin+Control) | Precise Spin | `#FF4B4B` (red) | `--nw-spin-control` |
| NE (Spin+Power) | Powerful Spin | `#C8E64E` (lime-yellow) | `--ne-spin-power` |
| SW (Touch+Control) | Precise Touch | `#6BA3D6` (blue) | `--sw-touch-control` |
| SE (Touch+Power) | Powerful Touch | `#5CE0D8` (cyan) | `--se-touch-power` |
| Center | Balanced | `#FFFFFF` | `--center-balanced` |

### Dot Design
- **Size**: 8–20px diameter (encodes OBS or custom score)
- **Opacity**: 0.5–1.0 (encodes OBS or custom score)  
- **Border**: 2px ring in quadrant color
- **Glow**: `box-shadow` or SVG filter for high-score dots
- **Hover**: Expand to 1.3×, show tooltip
- **Selected**: Persistent highlight ring

### Interactions
- **Hover dot**: Tooltip with racket name, brand, year, key stats
- **Click dot**: Pin tooltip + highlight in sidebar
- **Click quadrant label**: Filter to only that quadrant's rackets
- **Drag (Mode 3)**: Drag a tuner slider and watch dots animate

### Animation
- On mode switch: dots animate from old position to new position (spring physics)
- On filter: dots fade in/out
- On tuner change: dots resize + reposition with smooth transition

---

## Implementation Priority

> [!IMPORTANT]
> This is the build order. Each step is independently demo-able.

| Phase | What | Effort |
|-------|------|--------|
| **P0** | Route + empty page + mode selector tabs | 30 min |
| **P1** | SVG compass layout (axes, labels, circles) | 1 hr |
| **P2** | Mode 1 — Performance Compass with all racket dots | 2 hr |
| **P3** | Dot hover tooltips + click behavior | 1 hr |
| **P4** | Mode 2 — OBS Ranking Plot (needs reference stringing computation) | 2 hr |
| **P5** | Mode 3 — OBS Tuner with slider panel | 2 hr |
| **P6** | Brand/year filters + quadrant click filtering | 1 hr |
| **P7** | Animations (mode transitions, tuner live update) | 1 hr |
| **P8** | Mobile responsiveness + polish | 1 hr |

---

## Open Questions For You

1. **Axis choice for Mode 1**: Spin/Power/Touch/Control feels right because it mirrors HEAD, but an alternative is **Spin/Power/Comfort/Maneuverability** — what's more useful?

2. **Mode 2 reference stringing**: Should we use a fixed string (ALU Power 125 @ mid tension) or let the user pick a reference string? Fixed is simpler and keeps it about the frame.

3. **Mode 3 axis override**: Should Mode 3 use the same Spin/Power/Touch/Control axes as Mode 1, or should the user also be able to choose which 4 stats become axes?

4. **Naming**: "Racket Network" vs "Racket Compass" vs "Racket Atlas" vs something else?

5. **Brand coloring**: Should dots be colored by brand instead of quadrant? Or offer both as a toggle?
