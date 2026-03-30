// src/pages/Optimize.tsx
// Optimize page - React component wrapper around existing imperative rendering

import { useEffect, useRef } from 'react';
import { initOptimize } from '../ui/pages/optimize.js';

export function Optimize() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initOptimize();
    }
  }, []);

  return (
    <section className="workspace-mode" id="mode-optimize" data-mode="optimize">
      <div className="opt-layout">
        {/* Filter panel (left) */}
        <aside className="opt-filters" id="opt-filters">
          <div className="opt-filter-header">
            <h3 className="opt-filter-title">Optimizer</h3>
            <button className="opt-run-btn" id="opt-run-btn">Search</button>
          </div>

          {/* Frame selection (searchable) */}
          <div className="opt-filter-section">
            <label className="opt-label">Frame</label>
            <div className="opt-search-wrap" id="opt-frame-search-wrap">
              <input
                type="text"
                id="opt-frame-search"
                className="opt-search-input"
                placeholder="Search frames..."
                autoComplete="off"
              />
              <div className="opt-search-dropdown hidden" id="opt-frame-dropdown"></div>
            </div>
            <input type="hidden" id="opt-frame-value" value="current" />
          </div>

          {/* Setup type */}
          <div className="opt-filter-section">
            <label className="opt-label">Setup Type</label>
            <div className="opt-toggle-group">
              <button className="opt-toggle active" data-value="both" id="opt-type-both">Both</button>
              <button className="opt-toggle" data-value="full" id="opt-type-full">Full Bed</button>
              <button className="opt-toggle" data-value="hybrid" id="opt-type-hybrid">Hybrid</button>
            </div>
          </div>

          {/* Hybrid lock (optional mains/crosses) */}
          <div className="opt-filter-section opt-hybrid-lock hidden" id="opt-hybrid-lock-section">
            <label className="opt-label">Lock String</label>
            <div className="opt-lock-row">
              <select id="opt-lock-side" className="opt-select opt-select-sm">
                <option value="none">None</option>
                <option value="mains">Lock Mains</option>
                <option value="crosses">Lock Crosses</option>
              </select>
            </div>
            <div className="opt-lock-string-wrap hidden" id="opt-lock-string-wrap">
              <input
                type="text"
                id="opt-lock-string-search"
                className="opt-search-input"
                placeholder="Search strings..."
                autoComplete="off"
              />
              <div className="opt-search-dropdown hidden" id="opt-lock-string-dropdown"></div>
              <input type="hidden" id="opt-lock-string-value" value="" />
            </div>
          </div>

          {/* Material filter */}
          <div className="opt-filter-section">
            <label className="opt-label">Material</label>
            <div className="opt-multiselect" id="opt-material-ms">
              <button
                className="opt-ms-trigger"
                onClick={() => window._toggleOptMS?.('opt-material-ms')}
              >
                <span className="opt-ms-label" id="opt-material-ms-label">All materials</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <polyline points="2 4 5 7 8 4"/>
                </svg>
              </button>
              <div className="opt-ms-dropdown hidden" id="opt-material-checks"></div>
            </div>
          </div>

          {/* Brand filter */}
          <div className="opt-filter-section">
            <label className="opt-label">Brand</label>
            <div className="opt-multiselect" id="opt-brand-ms">
              <button
                className="opt-ms-trigger"
                onClick={() => window._toggleOptMS?.('opt-brand-ms')}
              >
                <span className="opt-ms-label" id="opt-brand-ms-label">All brands</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <polyline points="2 4 5 7 8 4"/>
                </svg>
              </button>
              <div className="opt-ms-dropdown hidden" id="opt-brand-checks"></div>
            </div>
          </div>

          {/* Exclude strings */}
          <div className="opt-filter-section">
            <label className="opt-label">Exclude Strings</label>
            <div className="opt-exclude-wrap">
              <input
                type="text"
                id="opt-exclude-search"
                className="opt-search-input"
                placeholder="Search to exclude..."
                autoComplete="off"
              />
              <div className="opt-search-dropdown hidden" id="opt-exclude-dropdown"></div>
            </div>
            <div className="opt-exclude-tags" id="opt-exclude-tags"></div>
          </div>

          {/* Sort by */}
          <div className="opt-filter-section">
            <label className="opt-label">Sort By</label>
            <select id="opt-sort" className="opt-select">
              <option value="obs" selected>OBS (Overall)</option>
              <option value="spin">Spin</option>
              <option value="control">Control</option>
              <option value="power">Power</option>
              <option value="comfort">Comfort</option>
              <option value="feel">Feel</option>
              <option value="durability">Durability</option>
              <option value="playability">Playability</option>
              <option value="maneuverability">Maneuverability</option>
              <option value="stability">Stability</option>
            </select>
          </div>

          {/* Stat minimums (collapsed by default) */}
          <details className="opt-filter-section opt-min-details">
            <summary className="opt-min-summary">Stat minimums</summary>
            <div className="opt-min-grid">
              <div className="opt-min-row"><span>Spin</span><input type="number" id="opt-min-spin" className="opt-min-input" min="0" max="100" defaultValue="0" placeholder="0" /></div>
              <div className="opt-min-row"><span>Control</span><input type="number" id="opt-min-control" className="opt-min-input" min="0" max="100" defaultValue="0" placeholder="0" /></div>
              <div className="opt-min-row"><span>Power</span><input type="number" id="opt-min-power" className="opt-min-input" min="0" max="100" defaultValue="0" placeholder="0" /></div>
              <div className="opt-min-row"><span>Comfort</span><input type="number" id="opt-min-comfort" className="opt-min-input" min="0" max="100" defaultValue="0" placeholder="0" /></div>
              <div className="opt-min-row"><span>Feel</span><input type="number" id="opt-min-feel" className="opt-min-input" min="0" max="100" defaultValue="0" placeholder="0" /></div>
              <div className="opt-min-row"><span>Durability</span><input type="number" id="opt-min-durability" className="opt-min-input" min="0" max="100" defaultValue="0" placeholder="0" /></div>
              <div className="opt-min-row"><span>Playability</span><input type="number" id="opt-min-playability" className="opt-min-input" min="0" max="100" defaultValue="0" placeholder="0" /></div>
              <div className="opt-min-row"><span>Stability</span><input type="number" id="opt-min-stability" className="opt-min-input" min="0" max="100" defaultValue="0" placeholder="0" /></div>
              <div className="opt-min-row"><span>Maneuverability</span><input type="number" id="opt-min-maneuverability" className="opt-min-input" min="0" max="100" defaultValue="0" placeholder="0" /></div>
            </div>
          </details>

          {/* Tension range */}
          <div className="opt-filter-section">
            <label className="opt-label">Tension Range</label>
            <div className="opt-tension-range">
              <input type="number" id="opt-tension-min" className="opt-min-input" min="30" max="75" defaultValue="40" placeholder="Min" />
              <span className="opt-range-sep">–</span>
              <input type="number" id="opt-tension-max" className="opt-min-input" min="30" max="75" defaultValue="65" placeholder="Max" />
            </div>
          </div>

          {/* Upgrade mode */}
          <div className="opt-filter-section">
            <label className="opt-label">Upgrade Mode</label>
            <label className="opt-checkbox-label">
              <input type="checkbox" id="opt-upgrade-mode" /> Compare vs current build
            </label>
            <div className="opt-upgrade-fields hidden" id="opt-upgrade-fields">
              <div className="opt-min-row"><span>OBS ≥ current +</span><input type="number" id="opt-upgrade-obs" className="opt-min-input" defaultValue="0" placeholder="0" /></div>
              <div className="opt-min-row"><span>Max control loss</span><input type="number" id="opt-upgrade-ctl-loss" className="opt-min-input" defaultValue="5" placeholder="5" /></div>
              <div className="opt-min-row"><span>Max durability loss</span><input type="number" id="opt-upgrade-dur-loss" className="opt-min-input" defaultValue="10" placeholder="10" /></div>
            </div>
          </div>

          {/* Results count */}
          <div className="opt-results-count" id="opt-results-count">0 results</div>
        </aside>

        {/* Results table (main) */}
        <div className="opt-results" id="opt-results">
          <div className="opt-empty">
            <p className="opt-empty-title">Configure filters and hit Search</p>
            <p className="opt-empty-sub">The optimizer will generate and rank builds using the full prediction engine.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
