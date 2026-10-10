import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Themed autocomplete input for onboarding — replaces the native <datalist>
 * (which renders inconsistently and off-theme across browsers). Keyboard +
 * mouse friendly, and users can still type any custom value.
 */
export default function AutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
  suggestions = [],
  autoFocus = false,
  maxVisible = 8,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef(null);

  const filtered = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return suggestions.slice(0, maxVisible);
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, maxVisible);
  }, [value, suggestions, maxVisible]);

  useEffect(() => {
    function onDocPointer(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocPointer);
    return () => document.removeEventListener('mousedown', onDocPointer);
  }, []);

  const showMenu = open && filtered.length > 0 && !(filtered.length === 1 && filtered[0] === value);

  function choose(val) {
    onChange(val);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e) {
    if (!open && e.key === 'ArrowDown') {
      setOpen(true);
      return;
    }
    if (!showMenu) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0 && filtered[activeIndex]) {
      e.preventDefault();
      choose(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="ob-combo" ref={wrapRef}>
      <input
        id={id}
        className="form-input"
        placeholder={placeholder}
        value={value || ''}
        autoComplete="off"
        role="combobox"
        aria-expanded={showMenu}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
      />
      {showMenu && (
        <ul className="ob-combo-menu" id={`${id}-listbox`} role="listbox">
          {filtered.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={i === activeIndex}
              className={`ob-combo-option${i === activeIndex ? ' active' : ''}${opt === value ? ' sel' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(opt);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
