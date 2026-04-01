import { useMemo, useState } from 'react';
import { filterOptSearchItems } from '../../ui/pages/optimize-search-helpers.js';

export type OptSearchItem = { id: string; name: string };

type Props = {
  inputId: string;
  dropdownId: string;
  /** When set, renders a hidden input after the search wrap (frame / lock string). Omit for exclude-only search. */
  hiddenId?: string | null | undefined;
  placeholder: string;
  items: OptSearchItem[];
  query: string;
  hiddenValue?: string;
  onQueryChange: (q: string) => void;
  onSelectItem: (id: string, name: string) => void;
};

export function OptimizeSearchDropdown({
  inputId,
  dropdownId,
  hiddenId,
  placeholder,
  items,
  query,
  hiddenValue = '',
  onQueryChange,
  onSelectItem,
}: Props) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => filterOptSearchItems(items, query, 30), [items, query]);

  return (
    <>
      <div className="opt-search-wrap">
        <input
          type="text"
          id={inputId}
          className="opt-search-input"
          placeholder={placeholder}
          autoComplete="off"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
        />
        <div
          className={`opt-search-dropdown${open && filtered.length > 0 ? '' : ' hidden'}`}
          id={dropdownId}
        >
          {filtered.map((i) => (
            <div
              key={i.id}
              className="opt-search-item"
              data-id={i.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectItem(i.id, i.name);
                setOpen(false);
              }}
            >
              {i.name}
            </div>
          ))}
        </div>
      </div>
      {hiddenId ? (
        <input type="hidden" id={hiddenId} value={hiddenValue} readOnly aria-hidden />
      ) : null}
    </>
  );
}
