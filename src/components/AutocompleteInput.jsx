import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Themed autocomplete for onboarding — quick-pick chips (ob-opt style) plus a
 * filtered dropdown. Replaces native datalist (inconsistent / off-theme).
 */
export default function AutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
  suggestions = [],
  quickPicks = [],
  autoFocus = false,
  maxVisible = 8,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const trimmed = (value || '').trim();
  const picks = quickPicks.length ? quickPicks : suggestions.slice(0, 4);

  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q) return suggestions.slice(0, maxVisible);
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, maxVisible);
  }, [trimmed, suggestions, maxVisible]);

  useEffect(() => {
    function onDocPointer(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', onDocPointer);
    return () => document.removeEventListener('mousedown', onDocPointer);
  }, []);

  const showQuickPicks = picks.length > 0 && !trimmed;
  const showMenu = open && trimmed.length > 0 && filtered.length > 0
    && !(filtered.length === 1 && filtered[0] === value);

  function choose(val) {
    onChange(val);
    setOpen(false);
    setActiveIndex(-1);
    requestAnimationFrame(() => inputRef.current?.blur());
  }

  function onKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
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
      {showQuickPicks && (
        <div className="ob-combo-quick" role="group" aria-label="Popular choices">
          {picks.map((opt) => (
            <button
              key={opt}
              type="button"
              className="ob-opt ob-combo-chip"
              onClick={() => choose(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        id={id}
        className="form-input"
        placeholder={placeholder}
        value={value || ''}
        autoComplete="off"
        role="combobox"
        aria-expanded={showMenu}
        aria-autocomplete="list"
        aria-controls={showMenu ? `${id}-listbox` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (trimmed) setOpen(true);
        }}
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
