// app/components/shell/header.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../i18n/language';
import { useUserPreferences } from '../userpreferences';
import { LogOut } from 'lucide-react';

// einfache Zeit-bezogene Begrüßung
function getTimeGreeting(lang: 'de' | 'en') {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return lang === 'de' ? 'Guten Morgen' : 'Good morning';
  if (hour >= 11 && hour < 17) return lang === 'de' ? 'Guten Tag' : 'Good afternoon';
  if (hour >= 17 && hour < 22) return lang === 'de' ? 'Guten Abend' : 'Good evening';
  return lang === 'de' ? 'Guten Abend' : 'Good evening';
}

export default function Header() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { language } = useLanguage();
  const { displayName, personalGreeting } = useUserPreferences();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ✅ verhindert Hydration mismatch (Server kennt localStorage/Prefs nicht)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDe = language === 'de';

  const titles = {
    de: {
      '/': 'Übersicht',
      '/dashboard': 'Übersicht',
      '/register': 'Kataster',
      '/matrix': 'Compliance Matrix',
      '/reports': 'Berichte',
      '/settings': 'Einstellungen',
    },
    en: {
      '/': 'Home',
      '/dashboard': 'Home',
      '/register': 'Register',
      '/matrix': 'Compliance Matrix',
      '/reports': 'Reports',
      '/settings': 'Settings',
    },
  } as const;

  const t = titles[language] ?? titles.de;

  const baseSeg = pathname.split('/')[1] || '';
  const basePath = ('/' + baseSeg) as keyof typeof t;

  const pageTitle = (t as any)[basePath] ?? t['/'];

  // Greeting erst nach Mount berechnen/anzeigen (sonst SSR != Client)
  const timeGreeting = mounted ? getTimeGreeting(isDe ? 'de' : 'en') : '';
  const name =
    mounted && displayName && displayName.trim().length > 0
      ? displayName.trim()
      : isDe
      ? 'LexTrack-Nutzer:in'
      : 'LexTrack user';

  const greetingText = mounted ? `${timeGreeting}, ${name}.` : '';

  // Logout-Handler
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout fehlgeschlagen:', error);
    } finally {
      setIsLoggingOut(false);
      router.replace('/login');
    }
  };

  return (
    <header className="flex items-center justify-between bg-gradient-to-r from-[#021633] via-[#003a5e] to-[#009A93] px-6 py-3 text-white shadow-sm">
      {/* links: Produkt + Seitentitel */}
      <div className="min-w-[180px] flex flex-col">
        <span className="text-sm font-semibold">LexTrack Compliance Suite</span>
        <span className="text-xs text-white/80" suppressHydrationWarning>
          {pageTitle}
        </span>
      </div>

      {/* Mitte: persönliche Begrüßung (optional) */}
      <div className="flex flex-1 justify-center">
        {personalGreeting && mounted ? (
          <p
            className="text-center text-xs font-medium text-white sm:text-sm"
            suppressHydrationWarning
          >
            {greetingText}
          </p>
        ) : null}
      </div>

      {/* rechts: Abmelden-Button */}
      <div className="flex min-w-[120px] items-center justify-end">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[11px] text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={isDe ? 'Abmelden' : 'Sign out'}
        >
          <LogOut className="h-3 w-3" />
          <span>{isDe ? 'Abmelden' : 'Sign out'}</span>
        </button>
      </div>
    </header>
  );
}