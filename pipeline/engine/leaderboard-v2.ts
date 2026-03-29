// @ts-nocheck

// ============================================
// LEADERBOARD v2 — "What's the best racket for X?"
// ============================================
// Simple UX: pick a stat → see ranked frames at their best string pairing
// No archetypes, no weight vectors, no slider.
// The question is: "I want [spin/power/control/etc] — what frame?"
//
// Depends on: RACQUETS, STRINGS, predictSetup, computeCompositeScore,
//             buildTensionContext, generateIdentity, getObsScoreColor,
//             createLoadout, activateLoadout, switchMode

let _lbv2State = {
  statKey:     'obs',     // which stat (or 'obs') to rank by
  filterType:  'both',    // 'both' | 'full' | 'hybrid'
  viewMode:    'builds',  // 'builds' | 'frames' | 'strings'
  // Frame-specific filters (applies to Frames tab only)
  frameFilters: {
    brand:     '',
    pattern:   '',
    headSize:  '',
    weight:    '',
    stiffness: '',
    year:      '',
  },
  // String-specific filters (applies to Strings tab only)
  stringFilters: {
    brand:     '',   // e.g. 'Babolat', 'Solinco', 'Luxilon'
    material:  '',   // e.g. 'Polyester', 'Natural Gut'
    shape:     '',   // e.g. 'Round', 'Pentagon', 'Hexagonal'
    gauge:     '',   // 'thin' | 'mid' | 'thick'
    stiffness: '',   // 'soft' | 'medium' | 'stiff'
  },
  results:     null,
  loading:     false,
  initialized: false,
};

// ── Stat options shown to the user ───────────────────────────────────────────

const LB_STATS = [
  { key: 'obs',            label: 'Best Overall',  icon: '🏆', desc: 'Highest total build score' },
  { key: 'spin',           label: 'Most Spin',     icon: '🌀', desc: 'Maximum topspin potential' },
  { key: 'power',          label: 'Most Power',    icon: '💥', desc: 'Hardest hitting setups'    },
  { key: 'control',        label: 'Most Control',  icon: '🎯', desc: 'Precision & placement'     },
  { key: 'comfort',        label: 'Most Comfort',  icon: '🩹', desc: 'Arm-friendly, low vibration'},
  { key: 'feel',           label: 'Best Feel',     icon: '🤌', desc: 'Touch & ball connection'   },
  { key: 'maneuverability',label: 'Most Maneuverable', icon: '⚡', desc: 'Fast swing, reactive' },
  { key: 'stability',      label: 'Most Stable',   icon: '🪨', desc: 'Plow-through, twist resist'},
  { key: 'durability',     label: 'Most Durable',  icon: '🔩', desc: 'Long-lasting strings'      },
];

// ── Entry point ───────────────────────────────────────────────────────────────

function initLeaderboard() {
  _lbv2State.initialized = true;
  const panel = document.getElementById('comp-tab-leaderboard');
  if (!panel) return;
  panel.innerHTML = _buildShellHTML();
  _runLbv2();
}

// ── Shell HTML (pure Tailwind) ────────────────────────────────────────────────

function _buildShellHTML() {
  const statPills = LB_STATS.map(s => {
    const active = s.key === _lbv2State.statKey;
    return `<button
      class="lb2-stat-pill flex items-center gap-2 px-4 py-2.5 border font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-150 cursor-pointer whitespace-nowrap ${
        active
          ? 'border-dc-accent text-dc-accent bg-dc-accent/5'
          : 'border-dc-storm/40 text-dc-storm hover:border-dc-storm hover:text-dc-platinum'
      }"
      data-stat="${s.key}"
      onclick="_lbv2SetStat('${s.key}')"
      title="${s.desc}"
    >
      <span>${s.icon}</span>
      <span>${s.label}</span>
    </button>`;
  }).join('');

  const typePills = [
    { v: 'both',   l: 'All' },
    { v: 'full',   l: 'Full Bed' },
    { v: 'hybrid', l: 'Hybrid' },
  ].map(({ v, l }) => {
    const active = v === _lbv2State.filterType;
    return `<button
      class="px-3 py-1.5 border font-mono text-[9px] font-bold uppercase tracking-[0.1em] transition-all duration-150 cursor-pointer ${
        active
          ? 'border-dc-accent text-dc-accent bg-dc-accent/5'
          : 'border-dc-storm/40 text-dc-storm hover:border-dc-storm hover:text-dc-platinum'
      }"
      onclick="_lbv2SetFilter('${v}')"
    >${l}</button>`;
  }).join('');

  // View mode tabs — Builds / Frames / Strings
  const viewTabs = [
    { v: 'builds',  l: 'Builds',  sub: 'frame + string' },
    { v: 'frames',  l: 'Frames',  sub: 'frame only'     },
    { v: 'strings', l: 'Strings', sub: 'string only'    },
  ].map(({ v, l, sub }) => {
    const active = v === _lbv2State.viewMode;
    return `<button
      class="flex flex-col items-start px-4 py-2 border-b-2 font-mono transition-all duration-150 cursor-pointer ${
        active
          ? 'border-dc-accent text-dc-accent'
          : 'border-transparent text-dc-storm hover:text-dc-platinum hover:border-dc-storm/40'
      }"
      onclick="_lbv2SetView('${v}')"
    >
      <span class="text-[10px] font-bold uppercase tracking-[0.12em]">${l}</span>
      <span class="text-[8px] tracking-[0.08em] opacity-60">${sub}</span>
    </button>`;
  }).join('');

  // Type filter only relevant for builds tab
  const showTypeFilter = _lbv2State.viewMode === 'builds';

  // Frame filters — only shown on frames tab
  const showFrameFilters = _lbv2State.viewMode === 'frames';
  const ff = _lbv2State.frameFilters;

  // Derive brand list dynamically from RACQUETS
  const brands = typeof RACQUETS !== 'undefined'
    ? [...new Set(RACQUETS.map(r => r.name.split(' ')[0]))].sort()
    : ['Babolat','Head','Wilson','Yonex','Tecnifibre','Dunlop','Prince','Volkl','Diadem','Solinco','ProKennex'];

  const sel = (id, val, opts, placeholder) =>
    `<select
      id="${id}"
      class="bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none"
      onchange="_lbv2SetFrameFilter('${id.replace('lb2-ff-','')}')"
    >
      <option value="">${placeholder}</option>
      ${opts.map(o => `<option value="${o.v}" ${val === o.v ? 'selected' : ''}>${o.l}</option>`).join('')}
    </select>`;

  const frameFilterRow = showFrameFilters ? `
    <div class="flex items-center gap-2 flex-wrap">
      <span class="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Filter</span>
      ${sel('lb2-ff-brand', ff.brand, brands.map(b => ({ v: b, l: b })), 'All brands')}
      ${sel('lb2-ff-pattern', ff.pattern, [
        { v: '16x19', l: '16x19' },
        { v: '16x20', l: '16x20' },
        { v: '16x18', l: '16x18' },
        { v: '18x20', l: '18x20' },
        { v: '18x19', l: '18x19' },
      ], 'All patterns')}
      ${sel('lb2-ff-headSize', ff.headSize, [
        { v: '95',   l: '≤95 sq in' },
        { v: '97',   l: '97 sq in' },
        { v: '98',   l: '98 sq in' },
        { v: '99',   l: '99 sq in' },
        { v: '100',  l: '100 sq in' },
        { v: '102+', l: '102+ sq in' },
      ], 'All head sizes')}
      ${sel('lb2-ff-weight', ff.weight, [
        { v: 'ultralight', l: '< 285g' },
        { v: 'light',      l: '285–305g' },
        { v: 'medium',     l: '305–320g' },
        { v: 'heavy',      l: '320–340g' },
        { v: 'tour',       l: '> 340g' },
      ], 'All weights')}
      ${sel('lb2-ff-stiffness', ff.stiffness, [
        { v: 'soft',   l: 'Soft (≤59 RA)' },
        { v: 'medium', l: 'Medium (60–65)' },
        { v: 'stiff',  l: 'Stiff (66+)' },
      ], 'All stiffness')}
      ${sel('lb2-ff-year', ff.year, [
        { v: '2026',  l: '2026' },
        { v: '2025',  l: '2025' },
        { v: '2024',  l: '2024' },
        { v: 'older', l: '≤2023' },
      ], 'All years')}
      ${Object.values(ff).some(v => v !== '') ? `
        <button
          class="font-mono text-[9px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-storm/30 text-dc-storm/60 hover:border-dc-red hover:text-dc-red transition-colors"
          onclick="_lbv2ClearFrameFilters()"
        >Clear</button>` : ''}
    </div>` : '';

  // String filters — only shown on strings tab
  const showStringFilters = _lbv2State.viewMode === 'strings';
  const sf = _lbv2State.stringFilters;

  const stringBrands = typeof STRINGS !== 'undefined'
    ? [...new Set(STRINGS.map(s => s.name.split(' ')[0]))].sort()
    : ['Babolat','Solinco','Luxilon','Head','Tecnifibre','Wilson','Yonex','Volkl','Dunlop','Toroline','Grapplesnake','ReString','Diadem'];

  const ssel = (id, val, opts, placeholder) =>
    `<select
      id="${id}"
      class="bg-transparent border border-dc-storm/40 text-dc-storm font-mono text-[9px] px-2 py-1.5 cursor-pointer hover:border-dc-storm focus:border-dc-accent focus:text-dc-platinum transition-colors outline-none"
      onchange="_lbv2SetStringFilter('${id.replace('lb2-sf-','')}')"
    >
      <option value="">${placeholder}</option>
      ${opts.map(o => `<option value="${o.v}" ${val === o.v ? 'selected' : ''}>${o.l}</option>`).join('')}
    </select>`;

  const stringFilterRow = showStringFilters ? `
    <div class="flex items-center gap-2 flex-wrap">
      <span class="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Filter</span>
      ${ssel('lb2-sf-brand', sf.brand, stringBrands.map(b => ({ v: b, l: b })), 'All brands')}
      ${ssel('lb2-sf-material', sf.material, [
        { v: 'Polyester',              l: 'Polyester' },
        { v: 'Co-Polyester (elastic)', l: 'Co-Poly (elastic)' },
        { v: 'Natural Gut',            l: 'Natural Gut' },
        { v: 'Multifilament',          l: 'Multifilament' },
        { v: 'Synthetic Gut',          l: 'Synthetic Gut' },
      ], 'All materials')}
      ${ssel('lb2-sf-shape', sf.shape, [
        { v: 'round',      l: 'Round' },
        { v: 'pentagon',   l: 'Pentagon' },
        { v: 'hexagonal',  l: 'Hexagonal' },
        { v: 'octagonal',  l: 'Octagonal' },
        { v: 'square',     l: 'Square' },
        { v: 'textured',   l: 'Textured / Rough' },
      ], 'All shapes')}
      ${ssel('lb2-sf-gauge', sf.gauge, [
        { v: 'thin',  l: 'Thin (≤1.20mm)' },
        { v: 'mid',   l: 'Mid (1.21–1.27mm)' },
        { v: 'thick', l: 'Thick (≥1.28mm)' },
      ], 'All gauges')}
      ${ssel('lb2-sf-stiffness', sf.stiffness, [
        { v: 'soft',   l: 'Soft (< 180 lb/in)' },
        { v: 'medium', l: 'Medium (180–215)' },
        { v: 'stiff',  l: 'Stiff (> 215)' },
      ], 'All stiffness')}
      ${Object.values(sf).some(v => v !== '') ? `
        <button
          class="font-mono text-[9px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-storm/30 text-dc-storm/60 hover:border-dc-red hover:text-dc-red transition-colors"
          onclick="_lbv2ClearStringFilters()"
        >Clear</button>` : ''}
    </div>` : '';

  return `
    <div class="flex flex-col min-h-full">

      <!-- View mode tabs -->
      <div class="flex border-b border-dc-storm/20 px-5 pt-3">
        ${viewTabs}
      </div>

      <!-- Sticky controls -->
      <div class="sticky top-0 z-10 bg-dc-void-deep border-b border-dc-storm/20 px-5 py-4 flex flex-col gap-3">

        <!-- Primary question -->
        <div class="flex items-baseline gap-3">
          <span class="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Show me</span>
          <div class="flex gap-2 flex-wrap" id="lb2-stat-pills">
            ${statPills}
          </div>
        </div>

        <!-- Secondary filter (builds tab only) -->
        ${showTypeFilter ? `
        <div class="flex items-center gap-3">
          <span class="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-dc-storm shrink-0">Setup type</span>
          <div class="flex gap-1.5">
            ${typePills}
          </div>
          <span class="font-mono text-[9px] text-dc-storm/50 ml-auto" id="lb2-count"></span>
        </div>` : ''}

        <!-- Frame filters (frames tab only) -->
        ${frameFilterRow}

        <!-- String filters (strings tab only) -->
        ${stringFilterRow}

        ${!showTypeFilter ? `
        <div class="flex justify-end">
          <span class="font-mono text-[9px] text-dc-storm/50" id="lb2-count"></span>
        </div>` : ''}

      </div>

      <!-- Results -->
      <div class="flex-1" id="lb2-results">
        <div class="flex flex-col items-center justify-center py-16 gap-4">
          <div class="w-7 h-7 border-2 border-dc-storm/30 border-t-dc-accent rounded-full animate-spin"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.15em] text-dc-storm">Computing…</span>
        </div>
      </div>

    </div>
  `;
}

// ── State setters ─────────────────────────────────────────────────────────────

function _lbv2SetStat(key) {
  if (_lbv2State.statKey === key) return;
  _lbv2State.statKey = key;
  _lbv2State.results = null;

  // Update pill active states
  document.querySelectorAll('.lb2-stat-pill').forEach(btn => {
    const isActive = btn.dataset.stat === key;
    btn.className = btn.className
      .replace(/border-dc-accent|text-dc-accent|bg-dc-accent\/5|border-dc-storm\/40|text-dc-storm|hover:border-dc-storm|hover:text-dc-platinum/g, '').trim();
    if (isActive) {
      btn.classList.add('border-dc-accent', 'text-dc-accent', 'bg-dc-accent/5');
    } else {
      btn.classList.add('border-dc-storm/40', 'text-dc-storm', 'hover:border-dc-storm', 'hover:text-dc-platinum');
    }
  });

  _runLbv2();
}

function _lbv2SetFilter(filterType) {
  if (_lbv2State.filterType === filterType) return;
  _lbv2State.filterType = filterType;
  _lbv2State.results = null;
  // Re-render shell to update type pills, then run
  const panel = document.getElementById('comp-tab-leaderboard');
  if (panel) panel.innerHTML = _buildShellHTML();
  _runLbv2();
}

function _lbv2SetView(viewMode) {
  if (_lbv2State.viewMode === viewMode) return;
  _lbv2State.viewMode = viewMode;
  _lbv2State.results = null;
  // Re-render shell (type filter visibility changes), then run
  const panel = document.getElementById('comp-tab-leaderboard');
  if (panel) panel.innerHTML = _buildShellHTML();
  _runLbv2();
}

function _lbv2SetFrameFilter(key) {
  const el = document.getElementById('lb2-ff-' + key);
  if (!el) return;
  _lbv2State.frameFilters[key] = el.value;
  _lbv2State.results = null;
  // Re-render shell to update Clear button visibility, then run
  const panel = document.getElementById('comp-tab-leaderboard');
  if (panel) panel.innerHTML = _buildShellHTML();
  _runLbv2();
}

function _lbv2ClearFrameFilters() {
  _lbv2State.frameFilters = { brand: '', pattern: '', headSize: '', weight: '', stiffness: '', year: '' };
  _lbv2State.results = null;
  const panel = document.getElementById('comp-tab-leaderboard');
  if (panel) panel.innerHTML = _buildShellHTML();
  _runLbv2();
}

function _lbv2SetStringFilter(key) {
  const el = document.getElementById('lb2-sf-' + key);
  if (!el) return;
  _lbv2State.stringFilters[key] = el.value;
  _lbv2State.results = null;
  const panel = document.getElementById('comp-tab-leaderboard');
  if (panel) panel.innerHTML = _buildShellHTML();
  _runLbv2();
}

function _lbv2ClearStringFilters() {
  _lbv2State.stringFilters = { brand: '', material: '', shape: '', gauge: '', stiffness: '' };
  _lbv2State.results = null;
  const panel = document.getElementById('comp-tab-leaderboard');
  if (panel) panel.innerHTML = _buildShellHTML();
  _runLbv2();
}

// ── Main runner ───────────────────────────────────────────────────────────────

function _runLbv2() {
  const resultsEl = document.getElementById('lb2-results');
  if (!resultsEl) return;

  const statMeta = LB_STATS.find(s => s.key === _lbv2State.statKey);
  resultsEl.innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 gap-4">
      <div class="w-7 h-7 border-2 border-dc-storm/30 border-t-dc-accent rounded-full animate-spin"></div>
      <span class="font-mono text-[10px] uppercase tracking-[0.15em] text-dc-storm">
        Computing ${statMeta?.label || ''}…
      </span>
    </div>`;

  requestAnimationFrame(() => setTimeout(() => {
    try {
      let results;
      if (_lbv2State.viewMode === 'frames') {
        results = _computeLbv2Frames();
      } else if (_lbv2State.viewMode === 'strings') {
        results = _computeLbv2Strings();
      } else {
        results = _computeLbv2Results();
      }
      _lbv2State.results = results;

      const countEl = document.getElementById('lb2-count');
      if (countEl) countEl.textContent = `${results.length} ${_lbv2State.viewMode}`;

      if (_lbv2State.viewMode === 'frames') {
        _renderLbv2Frames(results);
      } else if (_lbv2State.viewMode === 'strings') {
        _renderLbv2Strings(results);
      } else {
        _renderLbv2Results(results);
      }
    } catch (err) {
      if (resultsEl) resultsEl.innerHTML = `
        <div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-red/70">
          Error: ${err.message}
        </div>`;
      console.error('Leaderboard error:', err);
    }
  }, 16));
}

// ── Computation ───────────────────────────────────────────────────────────────

function _computeLbv2Results() {
  const statKey    = _lbv2State.statKey;
  const filterType = _lbv2State.filterType;
  const candidates = [];

  // Helper: find optimal tension for a config and return its stat value
  function scoreConfig(racquet, cfg) {
    const sweepMin = Math.max(racquet.tensionRange[0] - 3, 30);
    const sweepMax = Math.min(racquet.tensionRange[1] + 3, 70);
    let best = { score: -1, statVal: 0, tension: 53, stats: null };

    for (let t = sweepMin; t <= sweepMax; t += 2) {
      const c = Object.assign({}, cfg, {
        mainsTension: t,
        crossesTension: cfg.isHybrid ? t - 2 : t,
      });
      const stats = predictSetup(racquet, c);
      if (!stats) continue;
      const tCtx  = buildTensionContext(c, racquet);
      const obs   = computeCompositeScore(stats, tCtx);
      const rankVal = statKey === 'obs' ? obs : (stats[statKey] || 0);
      if (rankVal > best.score) {
        best = { score: rankVal, statVal: statKey === 'obs' ? obs : (stats[statKey] || 0), obs, tension: t, stats, cfg: c };
      }
    }
    return best;
  }

  // ── Full-bed candidates ───────────────────────────────────────────────────
  if (filterType !== 'hybrid') {
    RACQUETS.forEach(racquet => {
      STRINGS.forEach(str => {
        const cfg = { isHybrid: false, string: str };
        const best = scoreConfig(racquet, cfg);
        if (!best.stats) return;

        candidates.push({
          type:        'full',
          racquet,
          string:      str,
          mains:       null,
          crosses:     null,
          tension:     best.tension,
          crossesTension: best.tension,
          stats:       best.stats,
          obs:         +best.obs.toFixed(1),
          rankVal:     best.score,
          statKey,
          identity:    generateIdentity(best.stats, racquet, best.cfg),
          frameLabel:  racquet.name,
          stringLabel: str.name,
        });
      });
    });
  }

  // ── Hybrid candidates ─────────────────────────────────────────────────────
  if (filterType !== 'full') {
    // Top 12 full-bed strings per racquet + gut/multi as mains candidates
    // Cross pool: slick/round/elastic polys
    const crossPool = STRINGS.filter(s => {
      const shape = (s.shape || '').toLowerCase();
      return shape.includes('round') || shape.includes('slick') ||
             shape.includes('coated') || s.material === 'Co-Polyester (elastic)' ||
             (s.material === 'Polyester' && s.stiffness < 195);
    });

    // Smart mains set: top strings overall + always gut/multi
    const globalFull = [];
    STRINGS.forEach(s => {
      const cfg  = { isHybrid: false, string: s };
      const mid  = 53;
      const sc   = predictSetup(RACQUETS[0], Object.assign({}, cfg, { mainsTension: mid, crossesTension: mid }));
      if (sc) globalFull.push({ id: s.id, score: sc[statKey] || computeCompositeScore(sc, null) || 0 });
    });
    globalFull.sort((a, b) => b.score - a.score);
    const topMainsIds = new Set(globalFull.slice(0, 12).map(x => x.id));
    STRINGS.forEach(s => {
      if (s.material === 'Natural Gut' || s.material === 'Multifilament') {
        topMainsIds.add(s.id);
      }
    });

    RACQUETS.forEach(racquet => {
      topMainsIds.forEach(mainsId => {
        const mains = STRINGS.find(s => s.id === mainsId);
        if (!mains) return;
        crossPool.forEach(cross => {
          if (cross.id === mains.id) return;
          const cfg = { isHybrid: true, mains, crosses: cross };
          const best = scoreConfig(racquet, cfg);
          if (!best.stats) return;

          candidates.push({
            type:          'hybrid',
            racquet,
            string:        mains,
            mains,
            crosses:       cross,
            tension:       best.tension,
            crossesTension: best.tension - 2,
            stats:         best.stats,
            obs:           +best.obs.toFixed(1),
            rankVal:       best.score,
            statKey,
            identity:      generateIdentity(best.stats, racquet, best.cfg),
            frameLabel:    racquet.name,
            stringLabel:   mains.name + ' / ' + cross.name,
          });
        });
      });
    });
  }

  // Sort by rankVal desc, then deduplicate (keep best per frame×string key)
  candidates.sort((a, b) => b.rankVal - a.rankVal);

  const seen = new Set();
  const deduped = [];
  for (const c of candidates) {
    const key = c.racquet.id + '|' + (c.type === 'hybrid'
      ? c.mains.id + '/' + c.crosses.id
      : c.string.id);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
    if (deduped.length >= 60) break;
  }

  return deduped;
}

// ── Results renderer (pure Tailwind) ─────────────────────────────────────────

function _renderLbv2Results(results) {
  const resultsEl = document.getElementById('lb2-results');
  if (!resultsEl) return;

  if (!results || results.length === 0) {
    resultsEl.innerHTML = `
      <div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-storm">
        No results — try a different filter.
      </div>`;
    return;
  }

  const statMeta = LB_STATS.find(s => s.key === _lbv2State.statKey) || LB_STATS[0];
  const isObs    = _lbv2State.statKey === 'obs';
  const statLabel = isObs ? 'OBS' : statMeta.label.replace('Most ', '').replace('Best ', '');

  const rows = results.slice(0, 50).map((entry, i) => {
    const rank       = i + 1;
    const isFeatured = rank === 1;
    const rankValDisplay = isObs
      ? entry.rankVal.toFixed(1)
      : Math.round(entry.rankVal);

    const tensionLabel = entry.type === 'hybrid'
      ? `M${entry.tension} / X${entry.crossesTension}`
      : `${entry.tension} lbs`;

    const typeTag = entry.type === 'hybrid'
      ? `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-emerald-500/30 text-emerald-400 bg-emerald-400/5">H</span>`
      : `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-dc-storm/30 text-dc-storm">F</span>`;

    // Top 3 stats for this entry
    const topStats = ['spin', 'power', 'control', 'comfort', 'feel', 'stability']
      .map(k => ({ k, v: entry.stats[k] }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 3)
      .map(({ k, v }) => {
        const high = v >= 70;
        return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border ${
          high
            ? 'border-emerald-500/25 text-emerald-400 bg-emerald-400/5'
            : 'border-dc-storm/20 text-dc-storm'
        }">${k.slice(0,3).toUpperCase()} ${v}</span>`;
      }).join('');

    // Frame name — truncate
    const frameName = entry.frameLabel.length > 30
      ? entry.frameLabel.slice(0, 30) + '…'
      : entry.frameLabel;
    const stringName = entry.stringLabel.length > 35
      ? entry.stringLabel.slice(0, 35) + '…'
      : entry.stringLabel;

    const archetype = entry.identity?.archetype || '—';

    // Action handler data attrs
    const mainsId   = entry.mains?.id   || '';
    const crossesId = entry.crosses?.id || '';
    const stringId  = entry.type === 'hybrid' ? mainsId : (entry.string?.id || '');

    return `
      <tr class="group border-b border-dc-storm/10 transition-colors hover:bg-dc-void-lift/50 ${
        isFeatured ? 'bg-dc-accent/[0.03]' : ''
      }">
        <!-- Rank -->
        <td class="px-4 py-3 w-10 text-center">
          <span class="font-mono text-[11px] font-bold ${isFeatured ? 'text-dc-accent' : 'text-dc-storm/60'}">${rank}</span>
        </td>

        <!-- Type -->
        <td class="px-2 py-3 w-8">${typeTag}</td>

        <!-- Frame + String -->
        <td class="px-3 py-3 min-w-[160px]">
          <div class="font-sans text-[12px] font-semibold text-dc-platinum leading-tight" title="${entry.frameLabel}">${frameName}</div>
          <div class="font-mono text-[9px] text-dc-storm mt-0.5" title="${entry.stringLabel}">${stringName}</div>
        </td>

        <!-- Tension -->
        <td class="px-3 py-3 w-24">
          <span class="font-mono text-[10px] text-dc-storm/70">${tensionLabel}</span>
        </td>

        <!-- Primary stat (the ranked one) -->
        <td class="px-3 py-3 w-20 text-right">
          <span class="font-mono text-[18px] font-bold leading-none ${isFeatured ? 'text-dc-accent' : 'text-dc-white'}">${rankValDisplay}</span>
          <div class="font-mono text-[7px] uppercase tracking-[0.15em] text-dc-storm mt-0.5 text-right">${statLabel}</div>
        </td>

        <!-- OBS (always shown) -->
        ${!isObs ? `
        <td class="px-3 py-3 w-16 text-right">
          <span class="font-mono text-[12px] font-semibold" style="color:${getObsScoreColor(entry.obs)}">${entry.obs}</span>
          <div class="font-mono text-[7px] uppercase tracking-[0.15em] text-dc-storm mt-0.5 text-right">OBS</div>
        </td>` : `<td class="w-4"></td>`}

        <!-- Archetype -->
        <td class="px-3 py-3 hidden md:table-cell">
          <span class="font-mono text-[9px] text-dc-storm/70 leading-tight">${archetype}</span>
        </td>

        <!-- Top stats -->
        <td class="px-3 py-3 hidden lg:table-cell">
          <div class="flex gap-1.5 flex-wrap">${topStats}</div>
        </td>

        <!-- Actions -->
        <td class="px-3 py-3 w-24">
          <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="font-mono text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink transition-colors"
              onclick="_lbv2View('${entry.racquet.id}','${stringId}',${entry.tension},'${entry.type}','${mainsId}','${crossesId}',${entry.crossesTension})"
            >View</button>
            <button
              class="font-mono text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-storm/40 text-dc-storm hover:border-dc-storm hover:text-dc-platinum transition-colors"
              onclick="_lbv2Compare('${entry.racquet.id}','${stringId}',${entry.tension},'${entry.type}','${mainsId}','${crossesId}',${entry.crossesTension})"
            >Cmp</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  resultsEl.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-dc-storm/20">
            <th class="px-4 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 w-10">#</th>
            <th class="px-2 py-2.5 w-8"></th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">Frame / String</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">Tension</th>
            <th class="px-3 py-2.5 text-right font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-accent">${statLabel}</th>
            ${!isObs ? `<th class="px-3 py-2.5 text-right font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">OBS</th>` : `<th class="w-4"></th>`}
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 hidden md:table-cell">Identity</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 hidden lg:table-cell">Stats</th>
            <th class="w-24"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="px-5 py-3 border-t border-dc-storm/10 flex justify-between items-center">
      <span class="font-mono text-[9px] text-dc-storm/50">${results.length} builds scored · best setup per frame×string at optimal tension</span>
      <span class="font-mono text-[9px] text-dc-storm/50">${statMeta.icon} ${statMeta.desc}</span>
    </div>
  `;
}

// ── Frames-only computation ───────────────────────────────────────────────────
// Ranks frames by their base physics stats — no string, no tension.
// Uses calcFrameBase() directly. Stable sort, all 263 frames.

function _computeLbv2Frames() {
  const statKey = _lbv2State.statKey;
  const ff      = _lbv2State.frameFilters;

  // Apply filters
  const filtered = RACQUETS.filter(function(r) {
    if (ff.brand && !r.name.startsWith(ff.brand)) return false;
    if (ff.pattern && r.pattern !== ff.pattern) return false;
    if (ff.headSize) {
      if (ff.headSize === '102+' && r.headSize < 102) return false;
      if (ff.headSize !== '102+' && r.headSize !== parseInt(ff.headSize)) return false;
    }
    if (ff.weight) {
      const w = r.strungWeight;
      if (ff.weight === 'ultralight' && w >= 285) return false;
      if (ff.weight === 'light'      && (w < 285 || w >= 305)) return false;
      if (ff.weight === 'medium'     && (w < 305 || w >= 320)) return false;
      if (ff.weight === 'heavy'      && (w < 320 || w >= 340)) return false;
      if (ff.weight === 'tour'       && w < 340) return false;
    }
    if (ff.stiffness) {
      const ra = r.stiffness;
      if (ff.stiffness === 'soft'   && ra > 59) return false;
      if (ff.stiffness === 'medium' && (ra < 60 || ra > 65)) return false;
      if (ff.stiffness === 'stiff'  && ra < 66) return false;
    }
    if (ff.year) {
      if (ff.year === 'older' && r.year > 2023) return false;
      if (ff.year !== 'older' && r.year !== parseInt(ff.year)) return false;
    }
    return true;
  });

  return filtered.map(function(racquet) {
    const frameBase = calcFrameBase(racquet);
    const frameObs = statKey === 'obs'
      ? Math.round((
          frameBase.spin * 0.15 +
          frameBase.power * 0.12 +
          frameBase.control * 0.18 +
          frameBase.comfort * 0.12 +
          frameBase.feel * 0.10 +
          frameBase.stability * 0.12 +
          frameBase.forgiveness * 0.08 +
          frameBase.maneuverability * 0.08 +
          frameBase.launch * 0.05
        ))
      : null;

    const rankVal = statKey === 'obs' ? frameObs : Math.round(frameBase[statKey] || 0);

    return { racquet, frameBase, rankVal, statKey, frameLabel: racquet.name };
  })
  .filter(function(e) { return e.rankVal != null; })
  .sort(function(a, b) { return b.rankVal - a.rankVal; })
  .slice(0, 60);
}

function _renderLbv2Frames(results) {
  const resultsEl = document.getElementById('lb2-results');
  if (!resultsEl) return;

  if (!results || results.length === 0) {
    resultsEl.innerHTML = `<div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-storm">No results.</div>`;
    return;
  }

  const statMeta  = LB_STATS.find(s => s.key === _lbv2State.statKey) || LB_STATS[0];
  const isObs     = _lbv2State.statKey === 'obs';
  const statLabel = isObs ? 'Score' : statMeta.label.replace('Most ', '').replace('Best ', '');

  // Secondary stats to always show for context
  const contextStats = ['spin', 'power', 'control', 'comfort', 'stability', 'maneuverability']
    .filter(k => k !== _lbv2State.statKey)
    .slice(0, 4);

  const rows = results.slice(0, 50).map(function(entry, i) {
    const rank       = i + 1;
    const isFeatured = rank === 1;
    const fb         = entry.frameBase;

    const specChips = contextStats.map(function(k) {
      const v    = Math.round(fb[k] || 0);
      const high = v >= 68;
      return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border ${
        high
          ? 'border-emerald-500/25 text-emerald-400 bg-emerald-400/5'
          : 'border-dc-storm/20 text-dc-storm'
      }">${k.slice(0,3).toUpperCase()} ${v}</span>`;
    }).join('');

    const frameName = entry.frameLabel.length > 36
      ? entry.frameLabel.slice(0, 36) + '…'
      : entry.frameLabel;

    const r = entry.racquet;
    const specLine = `${r.strungWeight}g · SW ${r.swingweight} · ${r.stiffness} RA · ${r.pattern} · ${r.headSize} sq in`;

    return `
      <tr class="group border-b border-dc-storm/10 transition-colors hover:bg-dc-void-lift/50 ${isFeatured ? 'bg-dc-accent/[0.03]' : ''}">
        <td class="px-4 py-3 w-10 text-center">
          <span class="font-mono text-[11px] font-bold ${isFeatured ? 'text-dc-accent' : 'text-dc-storm/60'}">${rank}</span>
        </td>
        <td class="px-3 py-3 min-w-[200px]">
          <div class="font-sans text-[12px] font-semibold text-dc-platinum leading-tight">${frameName}</div>
          <div class="font-mono text-[9px] text-dc-storm/60 mt-0.5">${specLine}</div>
        </td>
        <td class="px-3 py-3 w-20 text-right">
          <span class="font-mono text-[18px] font-bold leading-none ${isFeatured ? 'text-dc-accent' : 'text-dc-white'}">${entry.rankVal}</span>
          <div class="font-mono text-[7px] uppercase tracking-[0.15em] text-dc-storm mt-0.5 text-right">${statLabel}</div>
        </td>
        <td class="px-3 py-3 hidden md:table-cell">
          <div class="flex gap-1.5 flex-wrap">${specChips}</div>
        </td>
        <td class="px-3 py-3 w-20">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="font-mono text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink transition-colors"
              onclick="_lbv2ViewFrame('${r.id}')"
            >View</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  resultsEl.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-dc-storm/20">
            <th class="px-4 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 w-10">#</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">Frame</th>
            <th class="px-3 py-2.5 text-right font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-accent">${statLabel}</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 hidden md:table-cell">Stats</th>
            <th class="w-20"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="px-5 py-3 border-t border-dc-storm/10 flex justify-between items-center">
      <span class="font-mono text-[9px] text-dc-storm/50">${results.length} frames · base physics, no string interaction</span>
      <span class="font-mono text-[9px] text-dc-storm/50">${statMeta.icon} ${statMeta.desc}</span>
    </div>
  `;
}

// ── Strings-only computation ──────────────────────────────────────────────────
// Ranks strings by their intrinsic profile — no frame, no tension.
// Uses calcBaseStringProfile() which maps twScore + physical props to stats.

function _computeLbv2Strings() {
  const statKey = _lbv2State.statKey;
  const sf      = _lbv2State.stringFilters;

  // Apply filters
  const filtered = STRINGS.filter(function(s) {
    if (sf.brand && !s.name.startsWith(sf.brand)) return false;
    if (sf.material && s.material !== sf.material) return false;
    if (sf.shape) {
      const shape = (s.shape || '').toLowerCase();
      if (!shape.includes(sf.shape)) return false;
    }
    if (sf.gauge) {
      const g = s.gaugeNum || 1.25;
      if (sf.gauge === 'thin'  && g > 1.20) return false;
      if (sf.gauge === 'mid'   && (g <= 1.20 || g >= 1.28)) return false;
      if (sf.gauge === 'thick' && g < 1.28) return false;
    }
    if (sf.stiffness) {
      const st = s.stiffness || 200;
      if (sf.stiffness === 'soft'   && st >= 180) return false;
      if (sf.stiffness === 'medium' && (st < 180 || st > 215)) return false;
      if (sf.stiffness === 'stiff'  && st <= 215) return false;
    }
    return true;
  });

  return filtered.map(function(str) {
    const profile = calcBaseStringProfile(str);

    const strObs = statKey === 'obs'
      ? Math.round(
          profile.spin        * 0.15 +
          profile.power       * 0.12 +
          profile.control     * 0.18 +
          profile.comfort     * 0.13 +
          profile.feel        * 0.12 +
          profile.durability  * 0.15 +
          profile.playability * 0.15
        )
      : null;

    const rankVal = statKey === 'obs' ? strObs : Math.round(profile[statKey] || str.twScore?.[statKey] || 0);

    return { string: str, profile, rankVal, statKey };
  })
  .filter(function(e) { return e.rankVal != null && e.rankVal > 0; })
  .sort(function(a, b) { return b.rankVal - a.rankVal; })
  .slice(0, 60);
}

function _renderLbv2Strings(results) {
  const resultsEl = document.getElementById('lb2-results');
  if (!resultsEl) return;

  if (!results || results.length === 0) {
    resultsEl.innerHTML = `<div class="flex items-center justify-center py-16 font-mono text-[11px] text-dc-storm">No results.</div>`;
    return;
  }

  const statMeta  = LB_STATS.find(s => s.key === _lbv2State.statKey) || LB_STATS[0];
  const isObs     = _lbv2State.statKey === 'obs';
  const statLabel = isObs ? 'Score' : statMeta.label.replace('Most ', '').replace('Best ', '');

  const contextStats = ['spin', 'power', 'control', 'comfort', 'feel', 'durability', 'playability']
    .filter(k => k !== _lbv2State.statKey)
    .slice(0, 4);

  const rows = results.slice(0, 50).map(function(entry, i) {
    const rank       = i + 1;
    const isFeatured = rank === 1;
    const s          = entry.string;
    const p          = entry.profile;

    const matTag = (function() {
      const m = (s.material || '').toLowerCase();
      if (m.includes('natural gut')) return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-amber-500/30 text-amber-400 bg-amber-400/5">GUT</span>`;
      if (m.includes('multifilament')) return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-sky-500/30 text-sky-400 bg-sky-400/5">MULTI</span>`;
      if (m.includes('co-polyester')) return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-purple-500/25 text-purple-400 bg-purple-400/5">CO-POLY</span>`;
      if (m.includes('synthetic')) return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-dc-storm/30 text-dc-storm">SYN GUT</span>`;
      return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border border-dc-storm/30 text-dc-storm">POLY</span>`;
    })();

    const statChips = contextStats.map(function(k) {
      const v    = Math.round(p[k] || 0);
      const high = v >= 68;
      return `<span class="font-mono text-[8px] font-bold px-1.5 py-0.5 border ${
        high
          ? 'border-emerald-500/25 text-emerald-400 bg-emerald-400/5'
          : 'border-dc-storm/20 text-dc-storm'
      }">${k.slice(0,3).toUpperCase()} ${v}</span>`;
    }).join('');

    const specLine = `${s.gauge} · ${s.shape} · ${Math.round(s.stiffness)} lb/in`;

    return `
      <tr class="group border-b border-dc-storm/10 transition-colors hover:bg-dc-void-lift/50 ${isFeatured ? 'bg-dc-accent/[0.03]' : ''}">
        <td class="px-4 py-3 w-10 text-center">
          <span class="font-mono text-[11px] font-bold ${isFeatured ? 'text-dc-accent' : 'text-dc-storm/60'}">${rank}</span>
        </td>
        <td class="px-3 py-3 min-w-[180px]">
          <div class="flex items-center gap-2">
            <span class="font-sans text-[12px] font-semibold text-dc-platinum leading-tight">${s.name}</span>
            ${matTag}
          </div>
          <div class="font-mono text-[9px] text-dc-storm/60 mt-0.5">${specLine}</div>
        </td>
        <td class="px-3 py-3 w-20 text-right">
          <span class="font-mono text-[18px] font-bold leading-none ${isFeatured ? 'text-dc-accent' : 'text-dc-white'}">${entry.rankVal}</span>
          <div class="font-mono text-[7px] uppercase tracking-[0.15em] text-dc-storm mt-0.5 text-right">${statLabel}</div>
        </td>
        <td class="px-3 py-3 hidden md:table-cell">
          <div class="flex gap-1.5 flex-wrap">${statChips}</div>
        </td>
        <td class="px-3 py-3 w-20">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="font-mono text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5 border border-dc-accent text-dc-accent hover:bg-dc-accent hover:text-dc-ink transition-colors"
              onclick="_lbv2ViewString('${s.id}')"
            >View</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  resultsEl.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-dc-storm/20">
            <th class="px-4 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 w-10">#</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60">String</th>
            <th class="px-3 py-2.5 text-right font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-accent">${statLabel}</th>
            <th class="px-3 py-2.5 text-left font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-dc-storm/60 hidden md:table-cell">Stats</th>
            <th class="w-20"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="px-5 py-3 border-t border-dc-storm/10 flex justify-between items-center">
      <span class="font-mono text-[9px] text-dc-storm/50">${results.length} strings · intrinsic profile, no frame interaction</span>
      <span class="font-mono text-[9px] text-dc-storm/50">${statMeta.icon} ${statMeta.desc}</span>
    </div>
  `;
}



function _lbv2View(racquetId, stringId, tension, type, mainsId, crossesId, crossesTension) {
  const opts = { source: 'leaderboard' };
  if (type === 'hybrid') {
    opts.isHybrid = true;
    opts.mainsId = mainsId;
    opts.crossesId = crossesId;
    opts.crossesTension = crossesTension;
  }
  const lo = createLoadout(racquetId, type === 'hybrid' ? mainsId : stringId, tension, opts);
  if (lo) { activateLoadout(lo); switchMode('overview'); }
}

function _lbv2ViewFrame(racquetId) {
  // Navigate to Racket Bible and select the frame
  if (!_compendiumInitialized) {
    initCompendium();
    _compendiumInitialized = true;
  }
  _compSelectFrame(racquetId);
  _compSwitchTab('rackets');
}

function _lbv2ViewString(stringId) {
  // Navigate to String Compendium and select the string
  _compSwitchTab('strings');
  setTimeout(function() { _stringSelectString(stringId); }, 120);
}

function _lbv2Compare(racquetId, stringId, tension, type, mainsId, crossesId, crossesTension) {
  if (comparisonSlots.length >= 3) comparisonSlots.pop();
  const racquet = RACQUETS.find(r => r.id === racquetId);
  if (!racquet) return;

  const isHybrid = type === 'hybrid';
  let cfg;
  if (isHybrid) {
    const mains  = STRINGS.find(s => s.id === mainsId);
    const cross  = STRINGS.find(s => s.id === crossesId);
    cfg = { isHybrid: true, mains, crosses: cross, mainsTension: tension, crossesTension };
  } else {
    const str = STRINGS.find(s => s.id === stringId);
    cfg = { isHybrid: false, string: str, mainsTension: tension, crossesTension: tension };
  }

  const stats    = predictSetup(racquet, cfg);
  const identity = stats ? generateIdentity(stats, racquet, cfg) : null;

  comparisonSlots.push({
    id: Date.now() + Math.random(),
    racquetId,
    stringId:       isHybrid ? '' : stringId,
    isHybrid,
    mainsId:        mainsId || '',
    crossesId:      crossesId || '',
    mainsTension:   tension,
    crossesTension: crossesTension || tension,
    stats,
    identity,
  });

  switchMode('compare');
  renderComparisonSlots();
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  try { updateComparisonRadar(); } catch(e) {}
}
