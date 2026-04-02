import { useEffect, useRef, useCallback } from 'react';
import { createSearchableSelect, disposeSearchableSelectContainer, ssInstances } from '../ui/components/searchable-select.js';

type CustomOption = {
  value: string;
  label: string;
};

interface SearchableSelectMountProps {
  registryKey: string;
  type?: 'racquet' | 'string' | 'custom';
  placeholder?: string;
  value?: string;
  id?: string;
  options?: CustomOption[] | null;
  onChange?: (value: string) => void;
}

export function SearchableSelectMount({
  id,
  onChange,
  options,
  placeholder,
  registryKey,
  type = 'racquet',
  value = '',
}: SearchableSelectMountProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<ReturnType<typeof createSearchableSelect> | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep callback ref up to date without triggering effect
  onChangeRef.current = onChange;

  // Stable wrapper that calls latest callback
  const stableOnChange = useCallback((val: string) => {
    onChangeRef.current?.(val);
  }, []);

  // Initialize once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const instance = createSearchableSelect(container, {
      id,
      onChange: stableOnChange,
      options,
      placeholder,
      type,
      value,
    });
    instanceRef.current = instance;
    ssInstances[registryKey] = instance;

    return () => {
      instanceRef.current = null;
      disposeSearchableSelectContainer(container);
      delete ssInstances[registryKey];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryKey, type]);

  // Update config when value/placeholder/id/options change (NOT onChange)
  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    instance.updateConfig({
      id,
      options,
      placeholder,
      value,
    });
    ssInstances[registryKey] = instance;
  }, [id, options, placeholder, registryKey, value]);

  return <div ref={containerRef} className="comp-string-select-container" />;
}
