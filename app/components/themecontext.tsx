// app/components/themecontext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

function isThemeMode(v: unknown): v is ThemeMode {
  return (
    v === 'light' ||
    v === 'dark' ||
    v === 'high-contrast' ||
    v === 'colorblind' ||
    v === 'colorblind-deuter'
  );
}

function isFontSize(v: unknown): v is FontSize {
  return v === 'normal' || v === 'large' || v === 'xlarge';
}

function isAccentColor(v: unknown): v is AccentColor {
  return v === 'teal' || v === 'blue' || v === 'violet' || v === 'amber';
}

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

function readLS(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLS(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const v = readLS(THEME_LS_KEY);
    return isThemeMode(v) ? v : 'light';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const v = readLS(FONT_LS_KEY);
    return isFontSize(v) ? v : 'normal';
  });

  const [accent, setAccentState] = useState<AccentColor>(() => {
    const v = readLS(ACCENT_LS_KEY);
    return isAccentColor(v) ? v : 'teal';
  });

  // Theme speichern / anwenden
  useEffect(() => {
    writeLS(THEME_LS_KEY, theme);
    applyThemeToDocument(theme);
  }, [theme]);

  // Schriftgröße speichern / anwenden
  useEffect(() => {
    writeLS(FONT_LS_KEY, fontSize);
    applyFontSizeToDocument(fontSize);
  }, [fontSize]);

  // Accent speichern / anwenden
  useEffect(() => {
    writeLS(ACCENT_LS_KEY, accent);
    applyAccentToDocument(accent);
  }, [accent]);

  const setTheme = (mode: ThemeMode) => setThemeState(mode);
  const setFontSize = (size: FontSize) => setFontSizeState(size);
  const setAccent = (acc: AccentColor) => setAccentState(acc);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
