// src/components/shell/Footer.tsx
// Site footer component

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function Footer() {
  const navigate = useNavigate();

  const handleReleaseNotesClick = useCallback(() => {
    navigate('/how-it-works');
    setTimeout(() => {
      const el = document.getElementById('release-notes');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  }, [navigate]);

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-left">
          <p className="footer-data-sources">
            Data sourced from <strong>Tennis Warehouse University (TWU)</strong> String Performance Database, manufacturer
            official specs, and measured racquet data.
          </p>
          <p className="footer-methodology">
            <span className="tag tag-measured">MEASURED</span> = TWU / official source data &nbsp;
            <span className="tag tag-modeled">MODELED</span> = Prediction engine output &nbsp;
            <span className="tag tag-estimated">ESTIMATED</span> = Inferred from similar setups
          </p>
        </div>
        <div className="footer-right">
          <button className="footer-link" onClick={handleReleaseNotesClick}>
            Release Notes
          </button>
          <a href="https://ko-fi.com/loadoutlab" target="_blank" rel="noopener noreferrer" className="footer-kofi">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="currentColor"
              />
            </svg>
            Buy me a coffee
          </a>
        </div>
      </div>
    </footer>
  );
}
