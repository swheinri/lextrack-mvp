// app/components/shell/header.tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../i18n/language';
import { useUserPreferences } from '../userpreferences';
import { LogOut } from 'lucide-react';

// einfache Zeit-bezogene Begrüßung
function getTimeGreeting(lang: 'de' | 'en') {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) {
    return lang === 'de' ? 'Guten Morgen' : 'Good morning';
  }
  if (hour >= 11 && hour < 17) {
    return lang === 'de' ? 'Guten Tag' : 'Good afternoon';
  }
  if (hour >= 17 && hour < 22) {
    return lang === 'de' ? 'Guten Abend' : 'Good evening';
  }
  return lang === 'de' ? 'Guten Abend' : 'Good evening';
}

export default function Header() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { displayName, personalGreeting } = useUserPreferences();

  const isDe = language === 'de';

  const titles = {
    de: {
      '/': 'Übersicht',
      '/register': 'Kataster',
      '/matrix': 'Compliance Matrix',
      '/reports': 'Berichte',
      '/settings': 'Einstellungen',
    },
    en: {
      '/': 'Home',
      '/register': 'Register',
      '/matrix': 'Compliance Matrix',
      '/reports': 'Reports',
      '/settings': 'Settings',
    },
  } as const;

  const t = titles[language] ?? titles.de;

  // einfachen Match auf Basis-Pfad machen
  const basePath = ('/' + pathname.split('/')[1]) as keyof typeof t;
  const pageTitle = t[basePath] ?? t['/'];

  // Text für die Begrüßung im Header
  const timeGreeting = getTimeGreeting(isDe ? 'de' : 'en');
  const name =
    displayName && displayName.trim().length > 0
      ? displayName.trim()
      : isDe
      ? 'LexTrack-Nutzer:in'
      : 'LexTrack user';

  const greetingText = `${timeGreeting}, ${name}.`;

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-[#021633] via-[#003a5e] to-[#009A93] text-white shadow-sm">
      {/* links: Produkt + Seitentitel */}
      <div className="flex flex-col min-w-[180px]">
        <span className="text-sm font-semibold">LexTrack Compliance Suite</span>
        <span className="text-xs text-white/80">{pageTitle}</span>
      </div>

      {/* Mitte: nur anzeigen, wenn persönliche Begrüßung aktiv */}
      <div className="flex-1 flex justify-center">
        {personalGreeting && (
          <p className="text-xs sm:text-sm font-medium text-white text-center">
            {greetingText}
          </p>
        )}
      </div>

      {/* rechts: Abmelden-Button (optisch sekundär) */}
      <div className="flex items-center justify-end min-w-[120px]">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[11px] text-white hover:bg-white/20"
        >
          <LogOut className="h-3 w-3" />
          <span>{isDe ? 'Abmelden' : 'Sign out'}</span>
        </button>
      </div>
    </header>
  );
}
