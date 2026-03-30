// src/pages/Compare.tsx
// Compare page - React component wrapper around existing imperative rendering

import { useEffect } from 'react';
import {
  cleanupComparePage,
  initComparePage,
  renderCompareMatrix,
  renderCompareSummaries,
  renderCompareVerdict,
} from '../ui/pages/compare/index.js';

export function Compare() {
  useEffect(() => {
    initComparePage();
    renderCompareSummaries();
    renderCompareVerdict();
    renderCompareMatrix();

    return () => {
      cleanupComparePage();
    };
  }, []);

  return (
    <section className="workspace-mode" id="mode-compare" data-mode="compare">
      <div className="compare-page">
        {/* Header */}
        <div className="compare-header">
          <span className="compare-title">// COMPARE</span>
        </div>

        {/* Slot Cards Grid */}
        <div className="compare-slots-grid" id="compare-slots-container">
          {/* Slots rendered dynamically */}
        </div>

        {/* Radar Chart Section */}
        <div className="compare-radar-section">
          <div className="compare-radar-wrapper" id="compare-radar-container">
            {/* Radar chart rendered here */}
          </div>
        </div>

        {/* Differential Analysis Section */}
        <div className="compare-diff-section" id="compare-diff-container">
          {/* Diff battery rendered here */}
        </div>
      </div>

      {/* Editor Modal Container */}
      <div id="compare-editor-container"></div>
    </section>
  );
}
