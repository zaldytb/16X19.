// Searchable Dropdown Component
// ==============================
// Self-contained UI component for racquet/string selection with filtering

import { RACQUETS, STRINGS } from '../../data/loader.js';
import type { Racquet, StringData } from '../../engine/types.js';
import { GAUGE_LABELS } from '../../engine/constants.js';
import { getGaugeOptions } from '../../engine/index.js';

type SelectType = 'racquet' | 'string' | 'custom';

interface CustomOption {
  value: string;
  label: string;
}

interface SearchableSelectOptions {
  type?: SelectType;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  options?: CustomOption[] | null;
}

interface SearchableSelectInstance {
  getValue: () => string;
  setValue: (val: string) => void;
  setOptions: (newOptions: CustomOption[]) => void;
  updateConfig: (config: Partial<SearchableSelectOptions>) => void;
  _container: HTMLElement;
  _cleanup: () => void;
}

interface IndexedOption {
  id: string;
  groupKey: string;
  searchText: string;
  primaryText: string;
  secondaryText: string;
  badgeHTML: string;
}

// Parse brand from racquet name (first word)
function parseRacquetBrand(name: string): string {
  return name.split(' ')[0];
}

// Parse family from racquet name (second word or group like "Pure Aero")
function parseRacquetFamily(name: string): string {
  const parts = name.split(' ');
  if (parts.length < 2) return '';
  // Known two-word families
  const twoWord = ['Pure Aero', 'Pure Drive', 'Pure Strike', 'Pro Staff', 'Poly Tour'];
  const rest = parts.slice(1).join(' ');
  for (const tw of twoWord) {
    if (rest.startsWith(tw)) return tw;
  }
  return parts[1];
}

// Sort racquets: brand → family → model → year desc
function getSortedRacquets(): Racquet[] {
  return [...(RACQUETS as unknown as Racquet[])].sort((a, b) => {
    const brandA = parseRacquetBrand(a.name);
    const brandB = parseRacquetBrand(b.name);
    if (brandA !== brandB) return brandA.localeCompare(brandB);
    const famA = parseRacquetFamily(a.name);
    const famB = parseRacquetFamily(b.name);
    if (famA !== famB) return famA.localeCompare(famB);
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return ((b as unknown as { year?: number }).year || 0) - ((a as unknown as { year?: number }).year || 0);
  });
}

// Sort strings: brand → name → gauge
function getSortedStrings(): StringData[] {
  return [...(STRINGS as unknown as StringData[])].sort((a, b) => {
    const brandA = a.name.split(' ')[0];
    const brandB = b.name.split(' ')[0];
    if (brandA !== brandB) return brandA.localeCompare(brandB);
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return (a.gaugeNum || 0) - (b.gaugeNum || 0);
  });
}

const SORTED_RACQUETS = getSortedRacquets();
const SORTED_STRINGS = getSortedStrings();
const RACQUET_NAME_BY_ID = new Map(SORTED_RACQUETS.map((racquet) => [racquet.id, racquet.name]));
const STRING_NAME_BY_ID = new Map(SORTED_STRINGS.map((string) => [string.id, string.name]));

function buildRacquetIndex(items: Racquet[]): IndexedOption[] {
  return items.map((racquetItem) => {
    const wtMatch = racquetItem.name.match(/^(.+?)\s+(\d+g)$/);
    return {
      id: racquetItem.id,
      groupKey: parseRacquetBrand(racquetItem.name),
      searchText: `${racquetItem.name} ${racquetItem.year || ''} ${racquetItem.pattern || ''}`.toLowerCase(),
      primaryText: wtMatch ? wtMatch[1] : racquetItem.name,
      secondaryText: `${racquetItem.year || ''}`,
      badgeHTML: wtMatch ? `<span class="ss-opt-badge badge-weight">${wtMatch[2]}</span>` : '',
    };
  });
}

function buildStringIndex(items: StringData[]): IndexedOption[] {
  return items.map((stringItem) => ({
    id: stringItem.id,
    groupKey: stringItem.name.split(' ')[0],
    searchText: `${stringItem.name} ${stringItem.gauge} ${stringItem.material || ''} ${stringItem.gaugeNum || ''} ${stringItem.shape || ''}`.toLowerCase(),
    primaryText: stringItem.name,
    secondaryText: `${stringItem.shape || stringItem.material || ''}`,
    badgeHTML: getStringMaterialBadge(stringItem.material),
  }));
}

const RACQUET_INDEXED_OPTIONS = buildRacquetIndex(SORTED_RACQUETS);
const STRING_INDEXED_OPTIONS = buildStringIndex(SORTED_STRINGS);

function getStringMaterialBadge(material: string | undefined): string {
  if (!material) return '';
  const m = material.toLowerCase();
  if (m.includes('multifilament') || m.includes('multi')) return '<span class="ss-opt-badge badge-multi">MULTI</span>';
  if (m.includes('synthetic')) return '<span class="ss-opt-badge badge-syngut">SYN GUT</span>';
  if (m.includes('natural gut') || (m.includes('gut') && !m.includes('synthetic'))) return '<span class="ss-opt-badge badge-gut">GUT</span>';
  if (m.includes('co-poly') || m.includes('copoly')) return '<span class="ss-opt-badge badge-copoly">CO-POLY</span>';
  if (m.includes('poly')) return '<span class="ss-opt-badge badge-poly">POLY</span>';
  return '';
}

// Registry of all searchable selects for cleanup
const _ssRegistry = new Map<HTMLElement, SearchableSelectInstance>();

export function createSearchableSelect(
  container: HTMLElement,
  {
    type = 'racquet',
    placeholder: initialPlaceholder = 'Select...',
    value = '',
    onChange: initialOnChange = () => {},
    id = '',
    options = null
  }: SearchableSelectOptions
): SearchableSelectInstance {
  // Clean up previous instance if exists
  if (_ssRegistry.has(container)) {
    const old = _ssRegistry.get(container)!;
    if (old._cleanup) old._cleanup();
  }

  container.innerHTML = '';
  container.classList.add('searchable-select');

  let items: (Racquet | StringData | CustomOption)[];
  let customOptions: CustomOption[] | null = options;
  let indexedOptions: IndexedOption[] = [];
  let currentPlaceholder = initialPlaceholder;
  let currentOnChange = initialOnChange;
  if (type === 'custom' && options) {
    items = options;
  } else {
    items = type === 'racquet' ? SORTED_RACQUETS : SORTED_STRINGS;
    indexedOptions = type === 'racquet' ? RACQUET_INDEXED_OPTIONS : STRING_INDEXED_OPTIONS;
  }

  // Build trigger
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ss-trigger';
  if (id) trigger.id = id;

  // Build dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'ss-dropdown';

  const searchWrap = document.createElement('div');
  searchWrap.className = 'ss-search-wrap';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'ss-search';
  if (type === 'racquet') {
    searchInput.placeholder = 'Search racquets...';
  } else if (type === 'string') {
    searchInput.placeholder = 'Search strings...';
  } else {
    searchInput.placeholder = 'Search...';
  }
  searchInput.autocomplete = 'off';
  searchWrap.appendChild(searchInput);
  dropdown.appendChild(searchWrap);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'ss-options';
  dropdown.appendChild(optionsContainer);

  container.appendChild(trigger);
  container.appendChild(dropdown);

  let selectedValue = value;
  let highlightIndex = -1;
  let flatOptions: HTMLDivElement[] = []; // all visible option elements for keyboard nav
  let pendingRenderFrame: number | null = null;
  let lastFilter = '';

  function getDisplayText(val: string): string {
    if (!val) return '';
    if (type === 'custom') {
      const opt = customOptions?.find(x => x.value === val);
      return opt ? opt.label : '';
    }
    if (type === 'racquet') {
      return RACQUET_NAME_BY_ID.get(val) || '';
    } else {
      return STRING_NAME_BY_ID.get(val) || '';  // gauge is now a separate selector
    }
  }

  function updateTrigger(): void {
    const text = getDisplayText(selectedValue);
    if (text) {
      trigger.textContent = text;
      trigger.classList.remove('ss-placeholder');
    } else {
      trigger.textContent = currentPlaceholder;
      trigger.classList.add('ss-placeholder');
    }
  }

  function renderOptions(filter = ''): void {
    lastFilter = filter;
    optionsContainer.replaceChildren();
    flatOptions = [];
    highlightIndex = -1;
    const q = filter.toLowerCase().trim();

    let lastGroup = '';
    let hasResults = false;
    const fragment = document.createDocumentFragment();

    const sourceItems = type === 'custom'
      ? items.map((item) => {
          const customItem = item as CustomOption;
          return {
            id: customItem.value,
            groupKey: '',
            searchText: customItem.label.toLowerCase(),
            primaryText: customItem.label,
            secondaryText: '',
            badgeHTML: '',
          } as IndexedOption;
        })
      : indexedOptions;

    sourceItems.forEach((item) => {
      const itemId = item.id;
      const searchText = item.searchText;
      const groupKey = item.groupKey;
      const primaryText = item.primaryText;
      const secondaryText = item.secondaryText;
      const badgeHTML = item.badgeHTML;

      // Filter
      if (q) {
        const words = q.split(/\s+/);
        const match = words.every(w => searchText.includes(w));
        if (!match) return;
      }

      hasResults = true;

      // Group header (skip for custom type)
      if (type !== 'custom' && groupKey !== lastGroup) {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'ss-group-label';
        groupLabel.textContent = groupKey;
        fragment.appendChild(groupLabel);
        lastGroup = groupKey;
      }

      // Option
      const opt = document.createElement('div');
      opt.className = 'ss-option';
      if (itemId === selectedValue) opt.classList.add('ss-selected');
      opt.dataset.value = itemId;

      if (type === 'custom') {
        // Simple layout for custom options
        opt.innerHTML = `<span class="ss-opt-primary">${primaryText}</span>`;
      } else if (type === 'string') {
        // 2-line stacked layout for strings: name on line 1, type+gauge on line 2
        opt.classList.add('ss-option-stacked');
        opt.innerHTML = `
          <span class="ss-opt-primary">${primaryText}</span>
          <span class="ss-opt-meta">${badgeHTML}<span class="ss-opt-secondary">${secondaryText}</span></span>
        `;
      } else {
        // 2-line stacked layout for racquets: model on line 1, weight+year on line 2
        opt.classList.add('ss-option-stacked');
        opt.innerHTML = `
          <span class="ss-opt-primary">${primaryText}</span>
          <span class="ss-opt-meta">${badgeHTML}<span class="ss-opt-secondary">${secondaryText}</span></span>
        `;
      }

      fragment.appendChild(opt);
      flatOptions.push(opt);
    });

    if (!hasResults) {
      const noRes = document.createElement('div');
      noRes.className = 'ss-no-results';
      noRes.textContent = 'No matches found';
      fragment.appendChild(noRes);
    }

    optionsContainer.appendChild(fragment);
  }

  function queueRenderOptions(filter = ''): void {
    lastFilter = filter;
    if (pendingRenderFrame != null) {
      cancelAnimationFrame(pendingRenderFrame);
    }
    pendingRenderFrame = requestAnimationFrame(() => {
      pendingRenderFrame = null;
      renderOptions(lastFilter);
    });
  }

  function flushPendingRender(): void {
    if (pendingRenderFrame == null) return;
    cancelAnimationFrame(pendingRenderFrame);
    pendingRenderFrame = null;
    renderOptions(lastFilter);
  }

  function selectOption(val: string): void {
    selectedValue = val;
    updateTrigger();
    closeDropdown();
    currentOnChange(val);
  }

  function openDropdown(): void {
    container.classList.add('ss-open');
    searchInput.value = '';
    renderOptions();
    // Slight delay for DOM to settle before focus
    requestAnimationFrame(() => searchInput.focus());
    // Scroll selected into view
    requestAnimationFrame(() => {
      const sel = optionsContainer.querySelector('.ss-selected');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    });
  }

  function closeDropdown(): void {
    container.classList.remove('ss-open');
    searchInput.value = '';
    highlightIndex = -1;
    if (pendingRenderFrame != null) {
      cancelAnimationFrame(pendingRenderFrame);
      pendingRenderFrame = null;
    }
  }

  function isOpen(): boolean {
    return container.classList.contains('ss-open');
  }

  // Event: trigger click
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen()) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Event: search input
  searchInput.addEventListener('input', () => {
    queueRenderOptions(searchInput.value);
  });

  optionsContainer.addEventListener('mousemove', (e) => {
    const option = (e.target as HTMLElement | null)?.closest('.ss-option') as HTMLDivElement | null;
    if (!option) return;
    const nextIndex = flatOptions.indexOf(option);
    if (nextIndex < 0 || nextIndex === highlightIndex) return;
    flatOptions.forEach((entry) => entry.classList.remove('ss-highlighted'));
    option.classList.add('ss-highlighted');
    highlightIndex = nextIndex;
  });

  optionsContainer.addEventListener('click', (e) => {
    const option = (e.target as HTMLElement | null)?.closest('.ss-option') as HTMLDivElement | null;
    if (!option) return;
    e.stopPropagation();
    const val = option.dataset.value;
    if (val) selectOption(val);
  });

  // Event: keyboard
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
      flushPendingRender();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatOptions.length === 0) return;
      highlightIndex = Math.min(highlightIndex + 1, flatOptions.length - 1);
      flatOptions.forEach(o => o.classList.remove('ss-highlighted'));
      flatOptions[highlightIndex].classList.add('ss-highlighted');
      flatOptions[highlightIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatOptions.length === 0) return;
      highlightIndex = Math.max(highlightIndex - 1, 0);
      flatOptions.forEach(o => o.classList.remove('ss-highlighted'));
      flatOptions[highlightIndex].classList.add('ss-highlighted');
      flatOptions[highlightIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && flatOptions[highlightIndex]) {
        const val = flatOptions[highlightIndex].dataset.value;
        if (val) selectOption(val);
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
      trigger.focus();
    }
  });

  // Close on outside click
  function onDocClick(e: MouseEvent): void {
    if (!container.contains(e.target as Node)) {
      closeDropdown();
    }
  }
  document.addEventListener('click', onDocClick);

  // Init
  updateTrigger();

  const instance: SearchableSelectInstance = {
    getValue: () => selectedValue,
    setValue: (val: string) => {
      selectedValue = val;
      updateTrigger();
      if (isOpen()) {
        queueRenderOptions(searchInput.value);
      }
    },
    setOptions: (newOptions: CustomOption[]) => {
      if (type === 'custom') {
        customOptions = newOptions;
        items = newOptions;
        indexedOptions = [];
        queueRenderOptions(lastFilter);
      }
    },
    updateConfig: (config: Partial<SearchableSelectOptions>) => {
      if (typeof config.placeholder === 'string') {
        currentPlaceholder = config.placeholder;
      }
      if (typeof config.onChange === 'function') {
        currentOnChange = config.onChange;
      }
      if (config.id !== undefined) {
        if (config.id) trigger.id = config.id;
        else trigger.removeAttribute('id');
      }
      if (config.options !== undefined && type === 'custom') {
        customOptions = config.options;
        items = config.options || [];
        indexedOptions = [];
      }
      if (typeof config.value === 'string') {
        selectedValue = config.value;
      }
      updateTrigger();
      if (isOpen()) {
        queueRenderOptions(searchInput.value);
      }
    },
    _container: container,
    _cleanup: () => {
      document.removeEventListener('click', onDocClick);
      if (pendingRenderFrame != null) {
        cancelAnimationFrame(pendingRenderFrame);
        pendingRenderFrame = null;
      }
    }
  };

  _ssRegistry.set(container, instance);
  return instance;
}

/** Destroy dropdown listeners and clear registry before removing container (e.g. React remount). */
export function disposeSearchableSelectContainer(container: HTMLElement | null): void {
  if (!container) return;
  const inst = _ssRegistry.get(container);
  if (inst?._cleanup) inst._cleanup();
  _ssRegistry.delete(container);
  container.innerHTML = '';
  container.classList.remove('searchable-select');
}

// Store references to searchable select instances
export const ssInstances: Record<string, SearchableSelectInstance> = {};

// Simple searchable dropdown for create form (dock-qa pattern)
interface QaItem {
  id: string;
  label: string;
}

export function _initQaSearchable(
  searchId: string,
  hiddenId: string,
  dropdownId: string,
  items: QaItem[]
): void {
  const searchEl = document.getElementById(searchId) as HTMLInputElement | null;
  const hiddenEl = document.getElementById(hiddenId) as HTMLInputElement | null;
  const dropdownEl = document.getElementById(dropdownId) as HTMLDivElement | null;
  if (!searchEl || !hiddenEl || !dropdownEl) return;

  // Store references that are guaranteed non-null for use in nested functions
  const searchInput = searchEl;
  const hiddenInput = hiddenEl;
  const dropdown = dropdownEl;

  function renderDropdown(filter: string): void {
    const filtered = filter ? items.filter(item => {
      return item.label.toLowerCase().indexOf(filter.toLowerCase()) >= 0;
    }) : items;

    if (filtered.length === 0) {
      dropdown.innerHTML = '<div class="dock-qa-dd-empty">No results</div>';
    } else {
      dropdown.innerHTML = filtered.slice(0, 20).map(item => {
        return '<div class="dock-qa-dd-item" data-id="' + item.id + '">' + item.label + '</div>';
      }).join('');
    }
    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('.dock-qa-dd-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const target = e.currentTarget as HTMLDivElement;
        hiddenInput.value = target.dataset.id || '';
        searchInput.value = target.textContent || '';
        dropdown.classList.add('hidden');
      });
    });
  }

  searchInput.addEventListener('focus', () => { renderDropdown(searchInput.value); });
  searchInput.addEventListener('input', () => {
    hiddenInput.value = '';
    renderDropdown(searchInput.value);
  });
  searchInput.addEventListener('blur', () => {
    setTimeout(() => { dropdown.classList.add('hidden'); }, 150);
  });
}
