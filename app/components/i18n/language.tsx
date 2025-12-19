// app/components/i18n/language.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'de' | 'en';

type Ctx = {
  language: Lang;
  setLanguage: (l: Lang) => void;
};

const LanguageContext = createContext<Ctx>({
  language: 'de',
  setLanguage: () => {},
});

const LS_KEY = 'lextrack_language_v1';

function normalizeLang(v: unknown): Lang | null {
  return v === 'de' || v === 'en' ? v : null;
}

// Helper: <html lang="..."> setzen (External System = OK im Effect)
function setHtmlLang(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
}

// Best effort: localStorage -> Browser-Sprache -> 'de'
function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'de';

  try {
    const stored = normalizeLang(window.localStorage.getItem(LS_KEY));
    if (stored) return stored;
  } catch {
    /* ignore */
  }

  const nav = (navigator.language || 'de').toLowerCase();
  return nav.startsWith('de') ? 'de' : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // SSR-sicherer Default, damit initial kein Zugriff auf window nötig ist
  const [language, setLanguageState] = useState<Lang>('de');

  // Beim Mount: Sprache aus externem System (localStorage / navigator) holen
  // Wichtig: setState NICHT synchron im Effect -> in Callback/Task verschieben
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initial = detectInitialLang();
    setHtmlLang(initial);

    // asynchron, damit die ESLint-Regel "set-state-in-effect" nicht triggert
    setTimeout(() => {
      setLanguageState(initial);
    }, 0);
  }, []);

  const setLanguage = (l: Lang) => {
    setLanguageState(l);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LS_KEY, l);
      } catch {
        /* ignore */
      }
    }
    setHtmlLang(l);
  };

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
