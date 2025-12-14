//app/components/i18n/language.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Lang>('de');

  // beim Mount: aus localStorage oder Browser ableiten
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(LS_KEY) as Lang | null;
      if (stored === 'de' || stored === 'en') {
        setLanguageState(stored);
        setHtmlLang(stored);
        return;
      }
    } catch {
      /* ignore */
    }

    // Fallback: Browser-Sprache
    const navLang = navigator.language?.toLowerCase() ?? 'de';
    const initial: Lang = navLang.startsWith('de') ? 'de' : 'en';
    setLanguageState(initial);
    setHtmlLang(initial);
  }, []);

  // Helper: <html lang="..."> setzen
  const setHtmlLang = (lang: Lang) => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;
  };

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

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
