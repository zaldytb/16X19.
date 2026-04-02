import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Increment when the tab becomes active again to replay clip + flicker without remounting children (preserves #comp-main / #string-main). */
  replayKey?: number;
};

export function HardwareMount({ children, replayKey = 0 }: Props) {
  const [isMounting, setIsMounting] = useState(true);
  const innerRef = useRef<HTMLDivElement>(null);
  const skipGridRestart = useRef(true);

  useEffect(() => {
    setIsMounting(true);
    const timer = window.setTimeout(() => {
      setIsMounting(false);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [replayKey]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    if (skipGridRestart.current) {
      skipGridRestart.current = false;
      return;
    }
    inner.classList.remove('animate-grid-sync');
    void inner.offsetWidth;
    inner.classList.add('animate-grid-sync');
  }, [replayKey]);

  return (
    <div className={`w-full ${isMounting ? 'animate-flicker' : ''}`}>
      <div ref={innerRef} className="animate-grid-sync origin-top">
        {children}
      </div>
    </div>
  );
}
