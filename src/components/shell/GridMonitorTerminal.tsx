// src/components/shell/GridMonitorTerminal.tsx
// VS Code-style global footer terminal — System Daemon that watches everything
// NOW WITH IDLE SECRET SAUCE DROPS

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from '../../state/useAppStore.js';
import {
  generateGridJudgment,
  generateCommandResponse,
  shouldAutoOpenTerminal,
  extractMetricsFromLoadout,
  getRandomSecretSauce,
  randInt,
  type SetupMetrics,
} from '../../engine/grid-monitor.js';
import { RACQUETS, STRINGS } from '../../data/generated.js';
import type { Racquet } from '../../engine/types.js';

interface LogEntry {
  id: string;
  text: string;
  type: 'system' | 'user' | 'critical' | 'response' | 'sauce';
  timestamp: number;
}

/** Generate unique ID for log entries */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Typewriter delay per character in ms */
const TYPEWRITER_SPEED = 12;

export function GridMonitorTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: generateId(), text: '> GRID_MONITOR_V4 ONLINE.', type: 'system', timestamp: Date.now() },
    { id: generateId(), text: '> STATUS: UNHINGED.', type: 'system', timestamp: Date.now() },
    { id: generateId(), text: '> SECRET SAUCE: ACTIVATED.', type: 'sauce', timestamp: Date.now() },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingRoast, setPendingRoast] = useState<string | null>(null);

  const endOfLogsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousSetupRef = useRef<string>('');
  const lastRoastTimeRef = useRef<number>(0);
  const sauceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // DATA SOURCES — Zustand Selectors
  // ═══════════════════════════════════════════════════════════════

  const activeLoadout = useAppStore((state) => state.activeLoadout);

  // Create lookup maps for data resolution
  const frameLookup = useRef(new Map(RACQUETS.map((f: Racquet) => [f.id, f]))).current;
  const stringLookup = useRef(new Map(STRINGS.map((s) => [s.id, s]))).current;

  // ═══════════════════════════════════════════════════════════════
  // TYPEWRITER EFFECT
  // ═══════════════════════════════════════════════════════════════

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'system') => {
    const entry: LogEntry = {
      id: generateId(),
      text,
      type,
      timestamp: Date.now(),
    };
    setLogs((prev) => [...prev, entry]);
  }, []);

  const typewriteLog = useCallback(
    (text: string, type: LogEntry['type'] = 'system') => {
      setIsTyping(true);
      const entryId = generateId();
      const timestamp = Date.now();

      // Start with empty text
      setLogs((prev) => [...prev, { id: entryId, text: '>', type, timestamp }]);

      let charIndex = 1; // Start after the ">"
      const chars = text.slice(1); // Remove the ">" prefix for typing

      const typeNextChar = () => {
        if (charIndex <= chars.length) {
          const currentText = '>' + chars.slice(0, charIndex);
          setLogs((prev) =>
            prev.map((log) => (log.id === entryId ? { ...log, text: currentText } : log))
          );
          charIndex++;
          setTimeout(typeNextChar, TYPEWRITER_SPEED);
        } else {
          setIsTyping(false);
          // Process pending roast if any
          if (pendingRoast && pendingRoast !== text) {
            const nextRoast = pendingRoast;
            setPendingRoast(null);
            setTimeout(() => typewriteLog(nextRoast, 'system'), 300);
          }
        }
      };

      typeNextChar();
    },
    [pendingRoast]
  );

  // ═══════════════════════════════════════════════════════════════
  // AUTO-SCROLL
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ═══════════════════════════════════════════════════════════════
  // REACTIVE OBSERVER — Watch for Loadout Changes
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    const metrics = extractMetricsFromLoadout(activeLoadout, frameLookup, stringLookup);

    // Create a signature of the current setup
    const setupSignature = metrics
      ? `${metrics.frameName}|${metrics.mainsTension}|${metrics.crossesTension}|${metrics.obs}`
      : 'null';

    // Skip if setup hasn't changed
    if (setupSignature === previousSetupRef.current) return;
    previousSetupRef.current = setupSignature;

    // Debounce roasts — max one per 2 seconds
    const now = Date.now();
    if (now - lastRoastTimeRef.current < 2000) return;

    if (metrics) {
      const roast = generateGridJudgment(metrics);
      lastRoastTimeRef.current = now;

      // Auto-open terminal for dramatic setups
      if (shouldAutoOpenTerminal(metrics) && !isOpen) {
        setIsOpen(true);
      }

      // Add spacer then roast
      setLogs((prev) => [...prev, { id: generateId(), text: '', type: 'system', timestamp: now }]);

      if (isTyping) {
        setPendingRoast(roast);
      } else {
        typewriteLog(roast, roast.includes('CRITICAL') ? 'critical' : 'system');
      }
    } else {
      // No active loadout
      addLog('> SYSTEM IDLE. Awaiting telemetry input...', 'system');
    }
  }, [activeLoadout, frameLookup, stringLookup, isOpen, isTyping, typewriteLog, addLog]);

  // ═══════════════════════════════════════════════════════════════
  // IDLE SECRET SAUCE DROPS — The Real Vibe
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    const startIdleSauce = () => {
      // Clear any existing interval
      if (sauceIntervalRef.current) {
        clearInterval(sauceIntervalRef.current);
      }

      sauceIntervalRef.current = setInterval(() => {
        // Only drop sauce when idle (no active loadout) and not typing
        if (!activeLoadout && !isTyping) {
          const sauce = getRandomSecretSauce();
          addLog(sauce, 'sauce');

          // Auto-open terminal occasionally for sauce (20% chance)
          if (Math.random() > 0.8 && !isOpen) {
            setIsOpen(true);
          }
        }
      }, randInt(8000, 12000)); // 8-12 seconds, feels random and alive
    };

    startIdleSauce();

    return () => {
      if (sauceIntervalRef.current) {
        clearInterval(sauceIntervalRef.current);
      }
    };
  }, [activeLoadout, isTyping, isOpen, addLog]);

  // ═══════════════════════════════════════════════════════════════
  // COMMAND HANDLING
  // ═══════════════════════════════════════════════════════════════

  const handleCommand = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim() && !isTyping) {
        const command = inputValue.trim();
        const now = Date.now();

        // Add user command to log
        addLog(`> USER: ${command}`, 'user');

        // Handle clear command immediately
        if (command.toLowerCase() === 'clear') {
          setLogs([
            { id: generateId(), text: '> GRID_MONITOR_V4 ONLINE.', type: 'system', timestamp: now },
            { id: generateId(), text: '> LOG CLEARED.', type: 'system', timestamp: now },
          ]);
          setInputValue('');
          return;
        }

        // Generate response with artificial delay
        setTimeout(() => {
          const response = generateCommandResponse(command);
          const lines = response.split('\n');

          lines.forEach((line, index) => {
            setTimeout(() => {
              const lineType: LogEntry['type'] = 
                line.includes('AVAILABLE') || line.includes('STATUS') 
                  ? 'response' 
                  : line.includes('smooth armpits') || line.includes('tiddies')
                    ? 'sauce'
                    : 'system';
              addLog(line, lineType);
            }, index * 100);
          });
        }, 400);

        setInputValue('');
      }
    },
    [inputValue, isTyping, addLog]
  );

  // ═══════════════════════════════════════════════════════════════
  // FOCUS INPUT WHEN OPENING
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ═══════════════════════════════════════════════════════════════
  // STATUS TEXT
  // ═══════════════════════════════════════════════════════════════

  const statusText = activeLoadout
    ? `MONITORING: ${activeLoadout.name || 'ACTIVE TELEMETRY'}`
    : 'AWAITING LOADOUT // IDLE SAUCE ACTIVE';

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[100] bg-[var(--dc-void)] border-t border-[var(--dc-border)] font-mono transition-all duration-300 ease-[var(--ease-out)] ${
        isOpen ? 'h-48' : 'h-8'
      }`}
    >
      {/* ═══ Terminal Header / Toggle Bar ═══ */}
      <div
        className="flex justify-between items-center px-4 h-8 bg-[var(--dc-void-deep)] border-b border-[var(--dc-border)] cursor-pointer hover:bg-[var(--dc-void-lift)] transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen(!isOpen);
          }
        }}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close terminal' : 'Open terminal'}
      >
        <div className="flex items-center gap-3">
          {/* Pulsing status indicator */}
          <span
            className={`w-2 h-2 rounded-[1px] ${
              activeLoadout ? 'bg-[var(--dc-accent)]' : 'bg-[var(--dc-amber)]'
            } ${activeLoadout || !isOpen ? 'animate-pulse' : ''}`}
          />
          <span className="text-[10px] text-[var(--dc-accent)] uppercase tracking-[0.15em] font-medium">
            TERMINAL // GRID_MONITOR
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`text-[9px] uppercase tracking-[0.1em] hidden sm:inline transition-colors ${
              activeLoadout ? 'text-[var(--dc-platinum)]' : 'text-[var(--dc-amber)]'
            }`}
          >
            {statusText}
          </span>
          <button
            className="text-[var(--dc-storm)] hover:text-[var(--dc-platinum)] text-xs transition-colors focus:outline-none"
            aria-hidden="true"
            tabIndex={-1}
          >
            {isOpen ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* ═══ Terminal Body ═══ */}
      <div
        className={`flex flex-col h-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Output Logs */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1 text-[10px] tracking-[0.05em] scrollbar-thin">
          {logs.map((log) => (
            <span
              key={log.id}
              className={`whitespace-pre-wrap leading-relaxed ${
                log.type === 'critical'
                  ? 'text-[var(--dc-red)] animate-pulse font-medium'
                  : log.type === 'user'
                    ? 'text-[var(--dc-storm-light)]'
                    : log.type === 'response'
                      ? 'text-[var(--dc-amber)]'
                      : log.type === 'sauce'
                        ? 'text-[var(--dc-warn)] italic'
                        : 'text-[var(--dc-platinum)]'
              }`}
            >
              {log.text}
            </span>
          ))}
          <div ref={endOfLogsRef} />
        </div>

        {/* Input Line */}
        <div className="px-4 py-2 border-t border-[var(--dc-border)] flex items-center bg-[var(--dc-void-deep)]">
          <span className="text-[var(--dc-accent)] font-bold mr-2 text-[10px]">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleCommand}
            disabled={isTyping}
            className="flex-1 bg-transparent border-none outline-none text-[10px] text-[var(--dc-platinum)] placeholder:text-[var(--dc-storm)]/40 focus:ring-0 disabled:opacity-50 font-mono tracking-[0.03em]"
            placeholder={isTyping ? 'Processing...' : "Enter command or 'help'..."}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
          {/* Blinking cursor block when empty */}
          {inputValue.length === 0 && !isTyping && (
            <span className="w-1.5 h-3.5 bg-[var(--dc-platinum)] animate-pulse ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}
