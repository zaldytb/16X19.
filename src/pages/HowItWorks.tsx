// src/pages/HowItWorks.tsx
// How It Works page - converted from static HTML to React component

export function HowItWorks() {
  return (
    <section id="mode-howitworks" className="workspace-mode">
      <div className="hiw-page">
        <div className="hiw-header">
          <h2 className="hiw-compact-title">How it works</h2>
        </div>

        {/* SECTION 1: POSITIONING */}
        <div className="hiw-section">
          <div className="hiw-section-num">01</div>
          <h2 className="hiw-section-title">What This Actually Is</h2>
          <div className="hiw-section-body">
            <p>
              The Loadout Lab is a <strong>parametric prediction engine</strong> for tennis equipment behavior. It doesn't hit balls. It doesn't measure your swing. It takes the published physical properties of frames and strings — stiffness indices, beam widths, density coefficients, string gauge, composition — and runs them through a multi-layer scoring pipeline to estimate how a given setup would <em>feel and perform</em> under tension.
            </p>
            <p>
              Think of it as an extremely opinionated spreadsheet that went to design school. The math is real. The coefficients are tuned against known equipment behavior. But every model is a simplification, and this one is transparent about where it simplifies.
            </p>
            <div className="hiw-callout">
              <div className="hiw-callout-icon">◆</div>
              <p>This is not a racquet recommendation engine. It's a build-exploration tool — designed for players who already know what they like and want to understand <em>why</em> certain combinations produce certain feels.</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: THE MODELING CHAIN */}
        <div className="hiw-section">
          <div className="hiw-section-num">02</div>
          <h2 className="hiw-section-title">The Prediction Pipeline</h2>
          <div className="hiw-section-body">
            <p>
              Every build score flows through frame physics, a frame-stage contradiction pass, then the string stack, tension, optional hybrid blending, and finally the composite score. Each stage transforms inputs into the next; the engine is deterministic — same setup, same numbers.
            </p>

            <div className="hiw-pipeline">
              <div className="hiw-pipeline-layer">
                <div className="hiw-pipeline-badge">L0</div>
                <div className="hiw-pipeline-content">
                  <h3>Frame physics</h3>
                  <p>Raw frame specs — head size, beam width, weight, balance, stiffness (RA), swingweight, pattern — are normalized into <strong>11</strong> frame-base attributes. Technology bonuses from catalog metadata (<code>aeroBonus</code>, <code>comfortTech</code>, <code>spinTech</code>, <code>genBonus</code>) apply here. Soft tradeoff caps keep unrealistic power/control combinations in check. No string interaction yet.</p>
                </div>
              </div>
              <div className="hiw-pipeline-connector">
                <svg width="2" height="32" viewBox="0 0 2 32"><line x1="1" y1="0" x2="1" y2="32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3"/></svg>
              </div>
              <div className="hiw-pipeline-layer">
                <div className="hiw-pipeline-badge">L0.5</div>
                <div className="hiw-pipeline-content">
                  <h3>Frame contradiction modeling</h3>
                  <p>After the frame base is computed, a small internal pass can nudge attributes when the frame behaves like a &quot;contradiction cluster&quot; — e.g. high control with high spin, or stability with maneuverability — using outcome signals, spec-vs-expectation checks, bucket rarity, and optional reviewer hints exported at build time. This shapes the frame contribution <strong>before</strong> strings are blended in. There is no separate novelty score in the UI; you read the effect through the stat bars and OBS like everything else.</p>
                </div>
              </div>
              <div className="hiw-pipeline-connector">
                <svg width="2" height="32" viewBox="0 0 2 32"><line x1="1" y1="0" x2="1" y2="32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3"/></svg>
              </div>
              <div className="hiw-pipeline-layer">
                <div className="hiw-pipeline-badge">L1</div>
                <div className="hiw-pipeline-content">
                  <h3>String profile, coupling &amp; hybrid</h3>
                  <p>TWU-style lab scores and material properties feed a string profile (power, spin, control, comfort, feel, durability, playability). Non-reference gauges run through a gauge modifier. String–frame interaction deltas capture how stiff/soft strings mate with the frame. <strong>Hybrids:</strong> mains and crosses get pairing rules (gut×poly, poly×poly, etc.) and weighted blends merged into the string-side mods and profile <em>before</em> tension is applied. Full-bed setups skip the hybrid step.</p>
                </div>
              </div>
              <div className="hiw-pipeline-connector">
                <svg width="2" height="32" viewBox="0 0 2 32"><line x1="1" y1="0" x2="1" y2="32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3"/></svg>
              </div>
              <div className="hiw-pipeline-layer">
                <div className="hiw-pipeline-badge">L2</div>
                <div className="hiw-pipeline-content">
                  <h3>Tension modifier</h3>
                  <p>Average tension vs the frame&apos;s recommended window drives level effects on power, control, launch, comfort, spin, feel, and playability. A pattern-aware mains/crosses differential model applies here: open patterns (≤18 crosses) vs dense (≥20 crosses) change what counts as a sensible split. These deltas sit on top of the merged string-side profile.</p>
                </div>
              </div>
              <div className="hiw-pipeline-connector">
                <svg width="2" height="32" viewBox="0 0 2 32"><line x1="1" y1="0" x2="1" y2="32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3"/></svg>
              </div>
              <div className="hiw-pipeline-layer">
                <div className="hiw-pipeline-badge">Final</div>
                <div className="hiw-pipeline-content">
                  <h3>Blend &amp; composite</h3>
                  <p>Frame-led attributes are mixed with string-led contributions (roughly <strong>72% frame / 28% string</strong> for most stats; stability, forgiveness, and maneuverability stay frame-driven; durability and playability lean on strings plus tension). The result is the 11 setup attributes. The app also derives an <strong>identity archetype</strong> and tags from those scores. <strong>OBS</strong> is computed from the attributes with fixed weights, then tension sanity penalties if you stray far outside the frame&apos;s tension range or use extreme mains/crosses spreads.</p>
                </div>
              </div>
            </div>

            <div className="hiw-callout">
              <div className="hiw-callout-icon">⚡</div>
              <p>Hybrids fold extra pairing logic into <strong>L1</strong>. Tune mode is mostly <strong>L2</strong> (tension and differential) while holding the racquet and string choice fixed — you see how the profile moves before you apply.</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: THE ELEVEN STATS */}
        <div className="hiw-section">
          <div className="hiw-section-num">03</div>
          <h2 className="hiw-section-title">What the Numbers Mean</h2>
          <div className="hiw-section-body">
            <p>
              Eleven stats. Each scored 0–100. Each derived from actual physical properties, not vibes. Here's what each one tracks and where its inputs come from.
            </p>

            <div className="hiw-stats-grid">
              <div className="hiw-stat-card">
                <div className="hiw-stat-name">Power</div>
                <div className="hiw-stat-desc">Energy return at contact. Driven by frame stiffness, beam width, head size, and string power coefficient. Higher tension compresses this; lower tension unlocks it. The stat everyone chases.</div>
              </div>
              <div className="hiw-stat-card">
                <div className="hiw-stat-name">Spin</div>
                <div className="hiw-stat-desc">Snapback potential and string-ball bite. String texture, gauge, and pattern density are the primary drivers. Frame head size contributes via the angular velocity window. Poly dominates here for a reason.</div>
              </div>
              <div className="hiw-stat-card">
                <div className="hiw-stat-name">Control</div>
                <div className="hiw-stat-desc">Precision and predictability on directional shots. Inversely related to power at the frame level — stiffer, smaller-headed frames score higher. String tension stability and frame torsional rigidity feed this. The surgeon's stat.</div>
              </div>
              <div className="hiw-stat-card">
                <div className="hiw-stat-name">Comfort</div>
                <div className="hiw-stat-desc">Shock absorption and arm-friendliness. String softness, frame flex, and weight distribution. Distinct from feel — you can have high comfort with low feel (soft multi in a flexy frame) or high feel with low comfort (stiff poly in a stiff stick).</div>
              </div>
              <div className="hiw-stat-card">
                <div className="hiw-stat-name">Feel</div>
                <div className="hiw-stat-desc">Tactile feedback quality and information transfer to the hand. Frame flex index, string elasticity, and dampening characteristics. Natural gut maxes this out. Dead poly minimizes it. Not the same as comfort.</div>
              </div>
              <div className="hiw-stat-card">
                <div className="hiw-stat-name">Stability</div>
                <div className="hiw-stat-desc">Twisting resistance on off-center hits. Swingweight, frame mass, and beam profile. Heavier, wider-beamed frames dominate. This is about physics — mass resists rotation.</div>
              </div>
              <div className="hiw-stat-card">
                <div className="hiw-stat-name">Forgiveness</div>
                <div className="hiw-stat-desc">How well the setup compensates for off-center hits. Combines stability (resistance to twist) with head size (larger sweetspot). The "help me" stat — higher values mean less punishment on imperfect contact.</div>
              </div>
              <div className="hiw-stat-card">
                <div className="hiw-stat-name">Launch</div>
                <div className="hiw-stat-desc">Trajectory height and ball flight. Driven by string stiffness, tension, and pattern density. Softer strings and lower tensions produce higher launch angles. Critical for modern topspin games.</div>
              </div>
              <div className="hiw-stat-card">
                <div className="hiw-stat-name">Maneuverability</div>
                <div className="hiw-stat-desc">How quickly you can whip the frame through the air. Inverse of swingweight — lighter, head-light frames dominate. The reactive stat: net play, returns, and defense all depend on it.</div>
              </div>
              <div className="hiw-stat-card">
                <div className="hiw-stat-name">Durability</div>
                <div className="hiw-stat-desc">String longevity and notching resistance. Co-poly scores well on raw survival, gut scores poorly. How long before you need to restring — distinct from playability (how long it plays well).</div>
              </div>
              <div className="hiw-stat-card">
                <div className="hiw-stat-name">Playability Duration</div>
                <div className="hiw-stat-desc">How long the string maintains its performance character over hitting sessions. Not the same as durability — a string can survive forever but play dead after 5 hours. The delta between fresh-strung magic and post-session mediocrity.</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: COMPOSITE SCORE & OBS */}
        <div className="hiw-section">
          <div className="hiw-section-num">04</div>
          <h2 className="hiw-section-title">The Overall Build Score</h2>
          <div className="hiw-section-body">
            <p>
              The OBS is a <strong>weighted composite</strong> of all 11 stats, collapsed into a single number on a 0–100 scale. It&apos;s not a simple average — weights are fixed in code (for example, control and spin rank toward the top; launch and durability toward the bottom), then the sum is scaled onto the 0–100 band.
            </p>
            <p>
              <strong>Important:</strong> unusual &quot;contradiction&quot; builds don&apos;t add a separate novelty bonus on top. Frame-stage modeling already feeds into the attribute bars; OBS then reflects those attributes plus tension penalties if your tension choices are far outside the frame&apos;s recommended window.
            </p>
            <div className="hiw-rank-preview">
              <h3>The Rank Ladder</h3>
              <p>The OBS maps to a ten-tier rank ladder. Yes, the names are intentionally brainrot. No, we're not changing them.</p>
              <div className="hiw-rank-tiers">
                <div className="hiw-rank-tier"><span className="hiw-rank-score">0–10</span><span className="hiw-rank-label">Delete This</span></div>
                <div className="hiw-rank-tier"><span className="hiw-rank-score">10–20</span><span className="hiw-rank-label">Hospital Build</span></div>
                <div className="hiw-rank-tier"><span className="hiw-rank-score">20–30</span><span className="hiw-rank-label">Bruh</span></div>
                <div className="hiw-rank-tier"><span className="hiw-rank-score">30–40</span><span className="hiw-rank-label">Cooked</span></div>
                <div className="hiw-rank-tier"><span className="hiw-rank-score">40–50</span><span className="hiw-rank-label">This Ain't It</span></div>
                <div className="hiw-rank-tier"><span className="hiw-rank-score">50–60</span><span className="hiw-rank-label">Mid</span></div>
                <div className="hiw-rank-tier"><span className="hiw-rank-score">60–70</span><span className="hiw-rank-label">Built Diff</span></div>
                <div className="hiw-rank-tier"><span className="hiw-rank-score">70–80</span><span className="hiw-rank-label">S Rank</span></div>
                <div className="hiw-rank-tier"><span className="hiw-rank-score">80–90</span><span className="hiw-rank-label">WTF</span></div>
                <div className="hiw-rank-tier"><span className="hiw-rank-score">90–100</span><span className="hiw-rank-label">Max Aura</span></div>
              </div>
            </div>
            <p>
              A build doesn't need to be "Max Aura" to be good for you. The rank ladder measures <em>total predicted performance ceiling</em>, not personal fit. A 55-scoring build with exactly the stats you want might outperform a 78-scoring build that's optimized for a playstyle that isn't yours.
            </p>
          </div>
        </div>

        {/* SECTION 5: DATA PIPELINE */}
        <div className="hiw-section">
          <div className="hiw-section-num">05</div>
          <h2 className="hiw-section-title">The Data Pipeline</h2>
          <div className="hiw-section-body">
            <p>
              Equipment data lives in <code>pipeline/data/</code> as JSON files. The app loads generated data from <code>src/data/generated.ts</code>, and also emits compatibility <code>data.ts</code> from the same source — never edit either generated file directly.
            </p>
            <p>
              <strong>Source of truth:</strong> <code>frames.json</code> (hundreds of racquets) and <code>strings.json</code> (50+ strings). They are validated against schemas, then exported to <code>src/data/generated.ts</code> for the app and <code>data.ts</code> for compatibility. Export also emits <code>FRAME_META</code> (technology bonuses) and <code>FRAME_NOVELTY_PROFILE</code> (bucket rarity, percentiles, and authored contradiction hints) — do not edit generated files by hand.
            </p>
            <p>
              <strong>Adding equipment:</strong> Use <code>npm run ingest:frame</code> or <code>npm run ingest:string</code> for interactive entry. Or batch import from CSV. After any addition, run <code>npm run pipeline</code> to validate, export, and run canary regression tests.
            </p>
            <p>
              <strong>TWU scraping:</strong> Bulk scrape the Tennis Warehouse University database with <code>npm run scrape:twu</code> (frames) or <code>npm run scrape:twu-strings</code> (strings). Enrich the CSVs with inferred specs, then ingest.
            </p>
            <div className="hiw-callout">
              <div className="hiw-callout-icon">◆</div>
              <p>The prediction engine is deterministic — same inputs always produce same outputs. Canary tests guard against regression on every verified export. The canonical implementation is TypeScript in <code>src/engine/</code> (bundled by Vite for the browser); <code>npm run canary</code> imports the same modules under Node via <code>tsx</code>.</p>
            </div>
          </div>
        </div>

        {/* SECTION 6: DESIGN SYSTEM */}
        <div className="hiw-section">
          <div className="hiw-section-num">06</div>
          <h2 className="hiw-section-title">The Design System</h2>
          <div className="hiw-section-body">
            <p>
              <strong>Digicraft Brutalism</strong> — a monochrome base with an orange accent for primary emphasis (<code>#FF4500</code> / <code>dc-accent</code>) and a deeper red (<code>#AF0000</code> / <code>dc-red</code>) where chart and data stress needs extra contrast. The palette stays restrained: #1A1A1A (void), #DCDFE2 (platinum), #5E666C (storm).
            </p>
            <p>
              Typography pairs Inter (UI) with JetBrains Mono (data). Halftone grain textures add analog warmth to digital precision. No drop shadows, no gradients, no decorative chrome. The interface gets out of the way so the numbers can speak.
            </p>
            <div className="hiw-callout">
              <div className="hiw-callout-icon">◆</div>
              <p>The visual system is designed for extended use — hours of exploration without eye fatigue. High contrast for readability, but never harsh. The monochrome base lets the red data accents pop when they matter.</p>
            </div>
          </div>
        </div>

        {/* SECTION 7: TUNE MODE */}
        <div className="hiw-section">
          <div className="hiw-section-num">07</div>
          <h2 className="hiw-section-title">What Tune Mode Does</h2>
          <div className="hiw-section-body">
            <p>
              Tune mode exposes the <strong>tension stage (L2)</strong> — mains/crosses levels and differential — as an interactive sandbox. When you drag tension, you&apos;re not adjusting a single linear multiplier: you&apos;re watching all 11 stats respond through the model&apos;s tension and pattern-aware rules at once.
            </p>
            <p>
              This is the core insight: tension doesn't just change "power" or "control" in isolation. It reshapes the <em>entire stat profile</em>. A two-pound tension drop might increase power by 3 points, spin by 1.5, decrease control by 2, and barely touch feel. Tune mode lets you see all of that at once, in real time.
            </p>
            <div className="hiw-callout">
              <div className="hiw-callout-icon">🎯</div>
              <p>Tune mode is a <strong>constraint visualization + free control</strong> system. The slider explores freely against the model's optimal tension window. You see cost/gain via the OBS delta chip (green for gains, red for losses) without committing anything until you click "Apply changes."</p>
            </div>
            <p>
              The "Best Value Move" recommendation updates live as you drag — it reflects your current slider position against the optimal window, not just the baseline. The sweep chart, slider overlay, and Build Score blue bar all share the same computed optimal tension band.
            </p>
          </div>
        </div>

        {/* SECTION 8: WHAT THIS IS NOT */}
        <div className="hiw-section">
          <div className="hiw-section-num">08</div>
          <h2 className="hiw-section-title">What This Tool Is Not</h2>
          <div className="hiw-section-body">
            <div className="hiw-not-grid">
              <div className="hiw-not-card">
                <h3>Not a swing analyzer</h3>
                <p>This tool knows nothing about your swing speed, technique, or physical attributes. It models equipment behavior in isolation. A 4.0 player and a touring pro would get the same scores for the same setup — because the equipment <em>is</em> the same. How you use it is your business.</p>
              </div>
              <div className="hiw-not-card">
                <h3>Not a purchase recommendation</h3>
                <p>The Loadout Lab doesn't tell you what to buy. It tells you what a given combination would theoretically produce. Whether that's worth your money, compatible with your game, or available at your local shop — that's outside the model's scope.</p>
              </div>
              <div className="hiw-not-card">
                <h3>Not empirically validated</h3>
                <p>The coefficients are tuned against known equipment behavior and community consensus, not lab-measured ball trajectories. This is a modeling tool, not a physics simulator. The predictions are directionally accurate — they track reality — but they're not measurements. Treat the numbers as a structured framework for thinking about equipment trade-offs, not as ground truth.</p>
              </div>
              <div className="hiw-not-card">
                <h3>Not a replacement for hitting</h3>
                <p>No model replaces the feel of actually hitting with a setup. This tool helps you narrow the search space, understand why certain combos work, and explore trade-offs before you commit money and stringing time. But the court is the final test.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 9: WHY IT'S USEFUL */}
        <div className="hiw-section">
          <div className="hiw-section-num">09</div>
          <h2 className="hiw-section-title">Why It's Still Useful</h2>
          <div className="hiw-section-body">
            <p>
              Because equipment decisions are expensive, time-consuming, and weirdly emotional. You can spend $250 on a frame, $30 on strings, $25 on labor, and walk away disappointed because the setup didn't feel like you expected — and you won't know <em>why</em>.
            </p>
            <p>
              The Loadout Lab gives you a structured language for understanding equipment trade-offs. It doesn't replace experience, but it accelerates it. Instead of blindly testing 15 string/tension combos, you can model the differences, understand the mechanisms, and narrow your experiments to 3-4 setups worth actually hitting with.
            </p>
            <p>
              It's also just fun to nerd out on. If you've ever spent 45 minutes on a Tennis Warehouse forum thread debating whether Solinco Confidential at 52 plays meaningfully different from RPM Blast at 54, this tool was built for you. Now you can see the predicted differences side by side, on a radar chart, with actual numbers.
            </p>
            <div className="hiw-callout hiw-callout-final">
              <div className="hiw-callout-icon">◆</div>
              <p>Built by a left-handed one-hander who spends too much time thinking about string tension. The brainrot rank names are intentional. The math is serious. The vibes are immaculate. Welcome to the lab. — Zaldy R</p>
            </div>
          </div>
        </div>

        {/* Release Notes */}
        <div className="hiw-divider" id="release-notes"></div>

        <div className="hiw-header">
          <h2 className="hiw-compact-title">Release notes</h2>
          <p className="release-notes-sub">Technical changelog — what changed, why, and how it affects your workflow.</p>
        </div>

        <div className="hiw-section">
          <div className="hiw-section-num">v4.1</div>
          <h2 className="hiw-section-title">Engine pipeline &amp; data export</h2>
          <div className="hiw-section-body">
            <p>
              <strong>L0.5 frame contradiction modeling.</strong> After frame base scores are computed, a frame-stage pass can apply small attribute adjustments when specs and outcomes look like real-world &quot;shouldn&apos;t go together&quot; clusters. Reviewer hints and catalog rarity ship with export as <code>FRAME_NOVELTY_PROFILE</code>; there is no separate novelty score in the UI — the bars and OBS tell the story.
            </p>
            <p>
              <strong>OBS</strong> is a weighted composite of the 11 attributes plus tension sanity penalties (out-of-range tension and extreme mains/crosses gaps). Canary tests guard regressions whenever generated data or engine math changes.
            </p>
          </div>
        </div>

        <div className="hiw-section">
          <div className="hiw-section-num">v4.0</div>
          <h2 className="hiw-section-title">React migration &amp; modernization</h2>
          <div className="hiw-section-body">
            <p>
              <strong>Complete React componentization.</strong> Workspace UIs use React component architecture. State management uses Zustand for predictable updates. Tailwind and Chart.js are npm dependencies for version pinning and bundling.
            </p>
            <p>
              <strong>Bridge cleanup.</strong> Feature code no longer relies on a large global <code>window.*</code> API; cross-module behavior uses direct imports, runtime callback registries, and React where appropriate. A thin boot/install path remains for shell bootstrap and legacy glue.
            </p>
            <div className="hiw-callout">
              <div className="hiw-callout-icon">◆</div>
              <p>The app uses React Router for navigation. Loadout and app state flow through Zustand and stable facades so refresh restores the active build from local storage.</p>
            </div>
          </div>
        </div>

        <div className="hiw-section">
          <div className="hiw-section-num">v3.0</div>
          <h2 className="hiw-section-title">String Compendium + Tailwind Migration</h2>
          <div className="hiw-section-body">
            <p>
              <strong>String Compendium is live.</strong> Browse the complete string database with the same HUD overlay pattern as the Racket Bible. Each string page shows TWU scores, intrinsic characteristics (stiffness, spin potential, tension loss), and a <strong>Frame Injection modulator</strong> for real-time setup preview.
            </p>
            <p>
              The Frame Injection panel supports both <strong>Full Bed</strong> and <strong>Hybrid</strong> configurations. Select any frame from the dropdown, choose gauge and tension, and see live battery-bar previews showing how the string affects frame stats. Crosses string selection appears in hybrid mode with independent gauge control. "Add to Loadout" saves without activating; "Set Active" saves and immediately switches to Overview with your new setup.
            </p>
            <p>
              <strong>Complete Tailwind CSS migration.</strong> All components in the Racket Bible and String Compendium now use Tailwind utility classes with the Digicraft design system (dc-void, dc-platinum, dc-storm, dc-accent). Dark mode uses <code>[data-theme="dark"]</code> selector strategy. Legacy CSS purged (~800 lines removed). Elephant & Mouse typography hierarchy (hero/obs/mouse) applied consistently.
            </p>
            <div className="hiw-callout">
              <div className="hiw-callout-icon">◆</div>
              <p>The String Compendium mirrors the Racket Bible architecture: click the string name to open the HUD, select from the grid, and see detailed telemetry. The Frame Injection modulator is the inverse of the Racket Bible's String Modulator — start with string, pick frame, preview result.</p>
            </div>
          </div>
        </div>

        <div className="hiw-section">
          <div className="hiw-section-num">v2.5</div>
          <h2 className="hiw-section-title">Repository Cleanup & Documentation</h2>
          <div className="hiw-section-body">
            <p>
              Complete repository audit and documentation pass. Deleted orphaned files (<code>split-app.js</code>, temp test artifacts). Added <code>calibrate</code> npm script for string estimation coefficient fitting. Updated <code>.gitignore</code> to exclude TWU scrape CSVs and enriched intermediates.
            </p>
            <p>
              README rewritten with full architecture documentation, data pipeline workflows, TWU tooling, and file structure. The How It Works page tracks the same pipeline stages as the live engine (including frame-stage contradiction modeling and export artifacts).
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
