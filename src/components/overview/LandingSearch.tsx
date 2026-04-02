import { useEffect, useMemo, useRef, useState } from 'react';
import { RACQUETS } from '../../data/loader.js';
import type { Racquet } from '../../engine/types.js';

interface LandingSearchProps {
  onSelectFrame: (racquetId: string) => void;
}

type RacquetWithIdentity = Racquet & { identity?: string };

const TARGETS = ['Pure Aero 98', 'Blade 98', 'Ezone 100'] as const;

export function LandingSearch({ onSelectFrame }: LandingSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const blurTimeoutRef = useRef<number | null>(null);

  const matches = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const lowered = trimmed.toLowerCase();
    return RACQUETS.filter((racquet) => {
      const candidate = racquet as RacquetWithIdentity;
      return (
        racquet.name.toLowerCase().includes(lowered) ||
        racquet.id.toLowerCase().includes(lowered) ||
        String(candidate.identity || '').toLowerCase().includes(lowered)
      );
    }).slice(0, 10);
  }, [query]);

  const showDropdown = isFocused && query.trim().length > 0;

  useEffect(() => {
    setSelectedIndex(matches.length > 0 ? 0 : -1);
  }, [matches]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current != null) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const selectFrame = (racquetId: string) => {
    setQuery('');
    setSelectedIndex(-1);
    setIsFocused(false);
    onSelectFrame(racquetId);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => {
      setIsFocused(false);
    }, 150);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current != null) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFocused(true);
  };

  return (
    <div className="relative w-full group">
      <div className="flex items-center bg-transparent border border-dc-border focus-within:border-dc-accent transition-colors">
        <div className="pl-6 text-dc-storm group-focus-within:text-dc-accent transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          className="w-full bg-transparent border-none text-2xl md:text-3xl font-mono text-dc-platinum placeholder:text-dc-storm/40 py-6 px-6 outline-none"
          id="landing-search"
          placeholder="Enter frame designation..."
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (!matches.length) {
              if (event.key === 'Escape') {
                setIsFocused(false);
                (event.currentTarget as HTMLInputElement).blur();
              }
              return;
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setSelectedIndex((current) => Math.min(current + 1, matches.length - 1));
              return;
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setSelectedIndex((current) => Math.max(current - 1, 0));
              return;
            }

            if (event.key === 'Enter') {
              event.preventDefault();
              const target = matches[selectedIndex] || matches[0];
              if (target) selectFrame(target.id);
              return;
            }

            if (event.key === 'Escape') {
              setIsFocused(false);
              (event.currentTarget as HTMLInputElement).blur();
            }
          }}
        />
      </div>

      <div
        className={`${showDropdown ? '' : 'hidden '}absolute top-full left-0 w-full bg-dc-void border border-dc-border mt-2 z-50 shadow-2xl max-h-96 overflow-y-auto`}
        id="landing-search-dropdown"
      >
        {matches.length === 0 ? (
          <div className="landing-dd-empty">No frames found</div>
        ) : (
          matches.map((racquet, index) => {
            const candidate = racquet as RacquetWithIdentity;
            const isActive = index === selectedIndex;

            return (
              <div
                key={racquet.id}
                className={`landing-dd-item${isActive ? ' landing-dd-active' : ''}`}
                data-id={racquet.id}
                data-idx={index}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectFrame(racquet.id);
                }}
              >
                <span className="landing-dd-name">{racquet.name}</span>
                <span className="landing-dd-meta">
                  {String(racquet.year)}
                  {' | '}
                  {String(candidate.identity || '')}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-4 mt-4 font-mono text-[9px] text-dc-storm uppercase tracking-widest">
        <span>Targets:</span>
        {TARGETS.map((target) => (
          <span
            key={target}
            className="text-dc-platinum hover:text-dc-accent cursor-pointer transition-colors"
            onMouseDown={(event) => {
              event.preventDefault();
              setQuery(target);
              setIsFocused(true);
            }}
          >
            {target}
          </span>
        ))}
      </div>
    </div>
  );
}
