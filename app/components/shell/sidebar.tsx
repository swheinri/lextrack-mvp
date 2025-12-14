//app/components/shell/sidebar
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Grid3X3,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useLanguage } from '../i18n/language';

type NavItem = {
  href: string;
  key: 'home' | 'register' | 'matrix' | 'reports' | 'settings';
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/',          key: 'home',    icon: Home },
  { href: '/register',  key: 'register',icon: FileText },
  { href: '/matrix',    key: 'matrix',  icon: Grid3X3 },
  { href: '/reports',   key: 'reports', icon: BarChart3 },
  { href: '/settings',  key: 'settings',icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { language } = useLanguage();

  const labels = {
    de: {
      home: 'Übersicht',
      register: 'Kataster',
      matrix: 'Compliance Matrix',
      reports: 'Berichte',
      settings: 'Einstellungen',
    },
    en: {
      home: 'Home',
      register: 'Register',
      matrix: 'Compliance Matrix',
      reports: 'Reports',
      settings: 'Settings',
    },
  } as const;

  const t = labels[language] ?? labels.de;

  return (
    // ✅ an Shell-Höhe koppeln: h-full statt h-screen
    <aside className="flex h-full w-64 flex-col bg-[#021633] text-slate-100">
      {/* Logo-Bereich – ✅ Unterlinie entfernt */}
      <div className="px-4 py-4">
        <div className="text-sm font-semibold tracking-wide">LexTrack</div>
        <div className="text-[11px] text-slate-400">
          Regulatory Intelligence &amp; Compliance
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-slate-100/10 text-white'
                  : 'text-slate-300 hover:bg-slate-100/5 hover:text-white',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              <span>{t[item.key]}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
