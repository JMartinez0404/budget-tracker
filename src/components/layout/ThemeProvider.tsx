'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Storage key is a constant string — never includes user input.
export const THEME_STORAGE_KEY = 'budget-tracker-theme';
const VALID_THEMES: readonly Theme[] = ['light', 'dark', 'system'] as const;

function isValidTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (VALID_THEMES as readonly string[]).includes(v);
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    // Validate against a hardcoded allowlist — never trust storage contents.
    return isValidTheme(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveTheme(t: Theme): ResolvedTheme {
  if (t === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return t;
}

function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with 'dark' for SSR — matches the pre-hydration script's default for
  // users who haven't set a preference. Actual resolution happens on mount.
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  // Sync with localStorage + media query on mount. The pre-hydration inline
  // script has already applied the correct class to <html>; this effect just
  // brings React state in line with what the DOM / storage already reflect.
  // setState in effect is intentional here — standard hydration reconciliation.
  useEffect(() => {
    const stored = readStoredTheme();
    const r = resolveTheme(stored);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(stored);
    setResolvedTheme(r);
    applyTheme(r);
  }, []);

  // When theme is 'system', react to OS changes.
  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const r: ResolvedTheme = mql.matches ? 'dark' : 'light';
      setResolvedTheme(r);
      applyTheme(r);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    // Defense in depth — ignore anything that is not in the allowlist.
    if (!isValidTheme(t)) return;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      // localStorage may be unavailable (private mode, quota). Fail open:
      // the selection still applies for this session.
    }
    setThemeState(t);
    const r = resolveTheme(t);
    setResolvedTheme(r);
    applyTheme(r);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/**
 * The inline script injected into <head> to apply the theme before hydration,
 * preventing a flash of the wrong theme. All values are literals — no user
 * input is interpolated. Safe to pass to dangerouslySetInnerHTML.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var t;if(s==='light'||s==='dark'||s==='system'){t=s;}else{t='system';}var r;if(t==='system'){r=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}else{r=t;}var d=document.documentElement;if(r==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}d.style.colorScheme=r;}catch(e){}})();`;
