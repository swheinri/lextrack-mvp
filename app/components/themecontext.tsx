// app/components/themecontext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

export type ThemeMode =
  | 'light'
  | 'dark'
  | 'high-contrast'
  | 'colorblind'
  | 'colorblind-deuter';

export type FontSize = 'normal' | 'large' | 'xlarge';

// Falls du später wieder Farbschemata nutzen willst:
export type AccentColor = 'teal' | 'blue' | 'violet' | 'amber';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;

  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;

  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_LS_KEY = 'lextrack_theme_v1';
const FONT_LS_KEY = 'lextrack_fontsize_v1';
const ACCENT_LS_KEY = 'lextrack_accent_v1';

function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

function applyFontSizeToDocument(fontSize: FontSize) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.fontSize = fontSize;
}

function applyAccentToDocument(accent: AccentColor) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.accent = accent;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [fontSize, setFontSizeState] = useState<FontSize>('normal');
  const [accent, setAccentState] = useState<AccentColor>('teal');

  // Initial aus localStorage laden
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedTheme = window.localStorage.getItem(THEME_LS_KEY) as
        | ThemeMode
        | null;
      const storedFontSize = window.localStorage.getItem(FONT_LS_KEY) as
        | FontSize
        | null;
      const storedAccent = window.localStorage.getItem(ACCENT_LS_KEY) as
        | AccentColor
        | null;

      // Theme
      if (
        storedTheme === 'light' ||
        storedTheme === 'dark' ||
        storedTheme === 'high-contrast' ||
        storedTheme === 'colorblind' ||
        storedTheme === 'colorblind-deuter'
      ) {
        setThemeState(storedTheme);
        applyThemeToDocument(storedTheme);
      } else {
        applyThemeToDocument('light');
      }

      // Schriftgröße
      if (
        storedFontSize === 'normal' ||
        storedFontSize === 'large' ||
        storedFontSize === 'xlarge'
      ) {
        setFontSizeState(storedFontSize);
        applyFontSizeToDocument(storedFontSize);
      } else {
        applyFontSizeToDocument('normal');
      }

      // Accent
      if (
        storedAccent === 'teal' ||
        storedAccent === 'blue' ||
        storedAccent === 'violet' ||
        storedAccent === 'amber'
      ) {
        setAccentState(storedAccent);
        applyAccentToDocument(storedAccent);
      } else {
        applyAccentToDocument('teal');
      }
    } catch {
      // ignore
    }
  }, []);

  // Theme speichern / anwenden
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(THEME_LS_KEY, theme);
    } catch {
      // ignore
    }
    applyThemeToDocument(theme);
  }, [theme]);

  // Schriftgröße speichern / anwenden
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(FONT_LS_KEY, fontSize);
    } catch {
      // ignore
    }
    applyFontSizeToDocument(fontSize);
  }, [fontSize]);

  // Accent speichern / anwenden
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(ACCENT_LS_KEY, accent);
    } catch {
      // ignore
    }
    applyAccentToDocument(accent);
  }, [accent]);

  const setTheme = (mode: ThemeMode) => setThemeState(mode);
  const setFontSize = (size: FontSize) => setFontSizeState(size);
  const setAccent = (acc: AccentColor) => setAccentState(acc);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, fontSize, setFontSize, accent, setAccent }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
