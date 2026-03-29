// Searchable Dropdown Component
// ==============================
// Self-contained UI component for racquet/string selection with filtering

import { RACQUETS, STRINGS } from '../../data/loader.js';
import type { Racquet, StringData } from '../../engine/types.js';
import { GAUGE_LABELS } from '../../engine/constants.js';
import { getGaugeOptions } from '../../engine/string-profile.js';

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
    placeholder = 'Select...',
    value = '',
    onChange = () => {},
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

  function getDisplayText(val: string): string {
    if (!val) return '';
    if (type === 'custom') {
      const opt = customOptions?.find(x => x.value === val);
      return opt ? opt.label : '';
    }
    if (type === 'racquet') {
      const r = RACQUETS.find(x => x.id === val);
      return r ? r.name : '';
    } else {
      const s = STRINGS.find(x => x.id === val);
      return s ? s.name : '';  // gauge is now a separate selector
    }
  }

  function updateTrigger(): void {
    const text = getDisplayText(selectedValue);
    if (text) {
      trigger.textContent = text;
      trigger.classList.remove('ss-placeholder');
    } else {
      trigger.textContent = placeholder;
      trigger.classList.add('ss-placeholder');
    }
  }

  function renderOptions(filter = ''): void {
    optionsContainer.innerHTML = '';
    flatOptions = [];
    highlightIndex = -1;
    const q = filter.toLowerCase().trim();

    let lastGroup = '';
    let hasResults = false;

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
        optionsContainer.appendChild(groupLabel);
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

      opt.addEventListener('mouseenter', () => {
        flatOptions.forEach(o => o.classList.remove('ss-highlighted'));
        opt.classList.add('ss-highlighted');
        highlightIndex = flatOptions.indexOf(opt);
      });

      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        selectOption(itemId);
      });

      optionsContainer.appendChild(opt);
      flatOptions.push(opt);
    });

    if (!hasResults) {
      const noRes = document.createElement('div');
      noRes.className = 'ss-no-results';
      noRes.textContent = 'No matches found';
      optionsContainer.appendChild(noRes);
    }
  }

  function selectOption(val: string): void {
    selectedValue = val;
    updateTrigger();
    closeDropdown();
    onChange(val);
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
    renderOptions(searchInput.value);
  });

  // Event: keyboard
  searchInput.addEventListener('keydown', (e) => {
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
    },
    setOptions: (newOptions: CustomOption[]) => {
      if (type === 'custom') {
        customOptions = newOptions;
        items = newOptions;
        indexedOptions = [];
        renderOptions();
      }
    },
    _cleanup: () => {
      document.removeEventListener('click', onDocClick);
    }
  };

  _ssRegistry.set(container, instance);
  return instance;
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
