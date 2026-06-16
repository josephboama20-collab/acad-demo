import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const THEMES = ['light', 'twilight', 'dark'];

const STORAGE_KEY = 'acad_theme_v1';

const ThemeContext = createContext(null);

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const colors = { light: '#eef2f7', twilight: '#0b1118', dark: '#030508' };
    meta.setAttribute('content', colors[theme] ?? colors.twilight);
  }
}

export function initTheme() {
  let theme = 'twilight';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.includes(saved)) theme = saved;
  } catch {
    /* ignore */
  }
  applyTheme(theme);
  return theme;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => initTheme());

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next)) return;
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const idx = THEMES.indexOf(current);
      const next = THEMES[(idx + 1) % THEMES.length];
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, cycleTheme }), [theme, setTheme, cycleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
