// src/ui/shared/helpers.ts
// DOM utilities, dropdown populators, frame specs display

import { RACQUETS, STRINGS } from '../../data/loader.js';
import type { Racquet, StringData, StringConfig } from '../../engine/types.js';
import { applyGaugeModifier, getGaugeOptions } from '../../engine/string-profile.js';
import { createSearchableSelect, ssInstances } from '../components/searchable-select.js';

// ============================================
// DOM HELPERS
// ============================================

export function $(selector: string, context?: HTMLElement): HTMLElement | null {
  return (context || document).querySelector(selector);
}

export function $$(selector: string, context?: HTMLElement): NodeListOf<HTMLElement> {
  return (context || document).querySelectorAll(selector);
}

export function toggleClass(el: HTMLElement | null, className: string, force?: boolean): void {
  if (!el) return;
  if (force === undefined) {
    el.classList.toggle(className);
  } else {
    el.classList.toggle(className, force);
  }
}

export function show(el: HTMLElement | null): void {
  if (!el) return;
  el.classList.remove('hidden');
}

export function hide(el: HTMLElement | null): void {
  if (!el) return;
    el.classList.add('hidden');
}

export function setText(el: HTMLElement | null, text: string): void {
  if (!el) return;
  el.textContent = text;
}

export function setHTML(el: HTMLElement | null, html: string): void {
  if (!el) return;
  el.innerHTML = html;
}

// ============================================
// FRAME SPECS DISPLAY
// ============================================

export interface FrameSpecItem {
  label: string;
  value: string;
}

function formatBeamWidth(beamWidth: unknown): string {
  if (Array.isArray(beamWidth) && beamWidth.length > 0) {
    return beamWidth.join('/');
  }
  if (typeof beamWidth === 'number' && Number.isFinite(beamWidth)) {
    return String(beamWidth);
  }
  return '—';
}

function formatTensionRange(tensionRange: unknown): string {
  if (
    Array.isArray(tensionRange) &&
    tensionRange.length >= 2 &&
    typeof tensionRange[0] === 'number' &&
    typeof tensionRange[1] === 'number'
  ) {
    return `${tensionRange[0]}-${tensionRange[1]} lbs`;
  }
  return '—';
}

export function getFrameSpecs(racquet: Racquet): FrameSpecItem[] {
  // balancePts may exist on racquet from data.js
  const balancePts = (racquet as unknown as Record<string, string>).balancePts || `${racquet.balance}mm`;

  return [
    { label: 'STRUNG WGHT', value: `${racquet.strungWeight}g` },
    { label: 'SW', value: `${racquet.swingweight}` },
    { label: 'Stiffness', value: `${racquet.stiffness} RA` },
    { label: 'Pattern', value: racquet.pattern },
    { label: 'Head', value: `${racquet.headSize} sq in` },
    { label: 'Balance', value: balancePts },
    { label: 'Beam', value: formatBeamWidth(racquet.beamWidth) },
    { label: 'Tension', value: formatTensionRange(racquet.tensionRange) },
  ];
}

export function renderFrameSpecsHTML(specs: FrameSpecItem[]): string {
  return specs
    .map(
      (spec) => `
    <div class="frame-spec-item">
      <span class="frame-spec-label">${spec.label}</span>
      <span class="frame-spec-value">${spec.value}</span>
    </div>
  `
    )
    .join('');
}

export function showFrameSpecs(
  racquet: Racquet | null,
  containerSelector: string = '#frame-specs'
): void {
  const el = $(containerSelector);
  if (!el) return;

  if (!racquet) {
    el.classList.add('hidden');
    return;
  }

  el.classList.remove('hidden');
  el.innerHTML = renderFrameSpecsHTML(getFrameSpecs(racquet));
}

// ============================================
// DROPDOWN POPULATORS
// ============================================

export interface DropdownCallbacks {
  onRacquetChange?: (racquet: Racquet | null) => void;
  onStringChange?: (stringId: string) => void;
  onGaugeChange?: () => void;
}

export function populateRacquetDropdown(
  container: HTMLElement,
  callbacks?: DropdownCallbacks,
  options?: { id?: string; placeholder?: string }
): void {
  const id = options?.id || container.id || 'racquet-select';
  const placeholder = options?.placeholder || 'Select Racquet...';

  ssInstances[id] = createSearchableSelect(container, {
    type: 'racquet',
    placeholder,
    value: '',
    id: id + '-trigger',
    onChange: (val) => {
      const racquet = (RACQUETS as unknown as Racquet[]).find((r) => r.id === val) || null;
      if (callbacks?.onRacquetChange) {
        callbacks.onRacquetChange(racquet);
      }
    },
  });
}

export function populateStringDropdown(
  container: HTMLElement,
  options?: {
    id?: string;
    placeholder?: string;
    initialValue?: string;
    gaugeTargetId?: string;
    onChange?: (stringId: string) => void;
  }
): void {
  const id = options?.id || container.id || 'string-select';
  const placeholder = options?.placeholder || 'Select String...';
  const initialValue = options?.initialValue || '';

  // Set gauge target for callback
  if (options?.gaugeTargetId) {
    container.dataset.gaugeTarget = options.gaugeTargetId;
  }

  ssInstances[id] = createSearchableSelect(container, {
    type: 'string',
    placeholder,
    value: initialValue,
    id: id + '-trigger',
    onChange: (val) => {
      // Update gauge display if target specified
      if (options?.gaugeTargetId) {
        const gaugeEl = document.getElementById(options.gaugeTargetId) as HTMLSelectElement;
        if (gaugeEl) {
          populateGaugeDropdown(gaugeEl, val);
        }
      }
      if (options?.onChange) {
        options.onChange(val);
      }
    },
  });
}

export function populateGaugeDropdown(
  selectEl: HTMLSelectElement,
  stringId: string
): void {
  if (!stringId) {
    selectEl.innerHTML = '<option value="">—</option>';
    selectEl.disabled = true;
    return;
  }

  const s = STRINGS.find((x) => x.id === stringId);
  if (!s) {
    selectEl.innerHTML = '<option value="">—</option>';
    selectEl.disabled = true;
    return;
  }

  // Get gauge options from engine
  const options = getGaugeOptions(s);
  const refGauge = s.gaugeNum;

  const labels: Record<number, string> = {
    1.15: '18 (1.15mm)',
    1.2: '17 (1.20mm)',
    1.25: '16L (1.25mm)',
    1.3: '16 (1.30mm)',
    1.35: '15L (1.35mm)',
    1.4: '15L (1.40mm)',
  };

  selectEl.innerHTML = options
    .map((g: number) => {
      const isRef = Math.abs(g - refGauge) < 0.005;
      let label = labels[g];
      if (!label) {
        const gNum = g >= 1.3 ? '16' : g >= 1.25 ? '16L' : g >= 1.2 ? '17' : '18';
        label = `${gNum} (${g.toFixed(2)}mm)`;
      }
      const tag = isRef ? ' •' : '';
      return `<option value="${g}" ${isRef ? 'selected' : ''}>${label}${tag}</option>`;
    })
    .join('');
  selectEl.disabled = false;
}

// ============================================
// SETUP FROM DOM EXTRACTION
// ============================================

export interface DOMSetupResult {
  racquet: Racquet;
  stringConfig: StringConfig;
}

export function getSetupFromEditorDOM(
  selectors: {
    racquetSelectId: string;
    hybridBtnSelector: string;
    mainsSelectId?: string;
    crossesSelectId?: string;
    fullSelectId?: string;
    mainsGaugeSelectId?: string;
    crossesGaugeSelectId?: string;
    fullGaugeSelectId?: string;
    mainsTensionInputId: string;
    crossesTensionInputId: string;
  }
): DOMSetupResult | null {
  const racquetId = ssInstances[selectors.racquetSelectId]?.getValue() || '';
  const racquet = RACQUETS.find((r) => r.id === racquetId);
  if (!racquet) return null;

  const hybridBtn = $(selectors.hybridBtnSelector);
  const isHybrid = hybridBtn?.classList.contains('active') || false;

  if (isHybrid) {
    const mainsId = ssInstances[selectors.mainsSelectId || '']?.getValue() || '';
    const crossesId = ssInstances[selectors.crossesSelectId || '']?.getValue() || '';
    if (!mainsId || !crossesId) return null;

    // Read gauge selections
    const mainsGaugeEl = selectors.mainsGaugeSelectId
      ? (document.getElementById(selectors.mainsGaugeSelectId) as HTMLSelectElement)
      : null;
    const crossesGaugeEl = selectors.crossesGaugeSelectId
      ? (document.getElementById(selectors.crossesGaugeSelectId) as HTMLSelectElement)
      : null;
    const mainsGauge = mainsGaugeEl?.value ? parseFloat(mainsGaugeEl.value) : null;
    const crossesGauge = crossesGaugeEl?.value ? parseFloat(crossesGaugeEl.value) : null;

    // Apply gauge modifiers (cast from data.js)
    let mainsData = (STRINGS as unknown as StringData[]).find((s) => s.id === mainsId);
    let crossesData = (STRINGS as unknown as StringData[]).find((s) => s.id === crossesId);
    if (mainsData && mainsGauge) mainsData = applyGaugeModifier(mainsData, mainsGauge);
    if (crossesData && crossesGauge) crossesData = applyGaugeModifier(crossesData, crossesGauge);

    if (!mainsData || !crossesData) return null;

    const mainsTensionEl = document.getElementById(selectors.mainsTensionInputId) as HTMLInputElement;
    const crossesTensionEl = document.getElementById(selectors.crossesTensionInputId) as HTMLInputElement;

    return {
      racquet: racquet as unknown as Racquet,
      stringConfig: {
        isHybrid: true,
        mains: mainsData as unknown as StringData,
        crosses: crossesData as unknown as StringData,
        mainsTension: parseInt(mainsTensionEl?.value) || 55,
        crossesTension: parseInt(crossesTensionEl?.value) || 53,
      },
    };
  } else {
    const stringId = ssInstances[selectors.fullSelectId || '']?.getValue() || '';
    if (!stringId) return null;

    // Read gauge selection
    const gaugeEl = selectors.fullGaugeSelectId
      ? (document.getElementById(selectors.fullGaugeSelectId) as HTMLSelectElement)
      : null;
    const selectedGauge = gaugeEl?.value ? parseFloat(gaugeEl.value) : null;

    // Apply gauge modifier
    let stringData = (STRINGS as unknown as StringData[]).find((s) => s.id === stringId);
    if (stringData && selectedGauge) stringData = applyGaugeModifier(stringData, selectedGauge);

    if (!stringData) return null;

    const mainsTensionEl = document.getElementById(selectors.mainsTensionInputId) as HTMLInputElement;
    const crossesTensionEl = document.getElementById(selectors.crossesTensionInputId) as HTMLInputElement;

    return {
      racquet: racquet as unknown as Racquet,
      stringConfig: {
        isHybrid: false,
        string: stringData as unknown as StringData,
        mainsTension: parseInt(mainsTensionEl?.value) || 55,
        crossesTension: parseInt(crossesTensionEl?.value) || 53,
      },
    };
  }
}

// ============================================
// HYBRID MODE TOGGLE
// ============================================

export function setHybridMode(
  isHybrid: boolean,
  options?: {
    hybridBtnSelector?: string;
    fullbedPanelSelector?: string;
    hybridPanelSelector?: string;
    onToggle?: (isHybrid: boolean) => void;
  }
): void {
  const hybridBtn = $(options?.hybridBtnSelector || '#btn-hybrid');
  const fullbedPanel = $(options?.fullbedPanelSelector || '#fullbed-panel');
  const hybridPanel = $(options?.hybridPanelSelector || '#hybrid-panel');

  if (hybridBtn) {
    if (isHybrid) {
      hybridBtn.classList.add('active');
    } else {
      hybridBtn.classList.remove('active');
    }
  }

  if (fullbedPanel && hybridPanel) {
    if (isHybrid) {
      fullbedPanel.classList.add('hidden');
      hybridPanel.classList.remove('hidden');
    } else {
      fullbedPanel.classList.remove('hidden');
      hybridPanel.classList.add('hidden');
    }
  }

  if (options?.onToggle) {
    options.onToggle(isHybrid);
  }
}

// ============================================
// SCROLL & ANIMATION HELPERS
// ============================================

export function scrollToElement(selector: string, options?: ScrollIntoViewOptions): void {
  const el = $(selector);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start', ...options });
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
