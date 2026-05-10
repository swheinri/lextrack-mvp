// app/settings/sections/general-section.tsx
'use client';

import React from 'react';
import { SunMedium, Moon, Contrast, Eye, Zap, Type as TypeIcon, Monitor, Filter, Volume2 } from 'lucide-react';

type ThemeKey =
  | 'light'
  | 'dark'
  | 'high-contrast'
  | 'colorblind'
  | 'colorblind-deuter';

type FontSizeKey = 'normal' | 'large' | 'xlarge';

function UpcomingCard({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <p className="text-xs text-slate-600">{subtitle}</p>
    </div>
  );
}

export default function GeneralSection(props: {
  t: any;
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  fontSize: FontSizeKey;
  setFontSize: (s: FontSizeKey) => void;
  language: 'de' | 'en';
  setLanguage: (l: 'de' | 'en') => void;
  applyInstantMode: () => void;
}) {
  const { t, theme, setTheme, fontSize, setFontSize, language, setLanguage, applyInstantMode } = props;

  const themeOptions: { id: ThemeKey; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: t.themeLight, icon: <SunMedium className="h-3 w-3" /> },
    { id: 'dark', label: t.themeDark, icon: <Moon className="h-3 w-3" /> },
    { id: 'high-contrast', label: t.themeHighContrast, icon: <Contrast className="h-3 w-3" /> },
    { id: 'colorblind', label: t.themeColorblind, icon: <Eye className="h-3 w-3" /> },
    { id: 'colorblind-deuter', label: t.themeDeuter, icon: <Eye className="h-3 w-3" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-[#041225] text-white px-4 py-3 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold">{t.generalHeading}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Theme */}
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <SunMedium className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-800">{t.themeLabel}</p>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">{t.themeHelp}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {themeOptions.map((opt) => {
              const isActive = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  className={[
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition',
                    isActive
                      ? 'border-[#009A93] bg-[#009A93]/10 text-[#009A93]'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-1 text-[11px] text-slate-500">
            {t.currentThemePrefix}{' '}
            <span className="font-semibold text-slate-700">
  {themeOptions.find((x) => x.id === theme)?.label ?? theme}
</span>
          </p>
        </section>

        {/* Language */}
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-800">{t.languageLabel}</p>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">{t.languageHelp}</p>

          <div className="mt-2 inline-flex rounded-full border border-slate-300 bg-slate-100 p-1 text-xs">
            {[
              { id: 'de' as const, label: t.languageGerman },
              { id: 'en' as const, label: t.languageEnglish },
            ].map((opt) => {
              const isActive = language === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLanguage(opt.id)}
                  className={[
                    'px-3 py-1 rounded-full transition',
                    isActive ? 'bg-white shadow-sm text-slate-900' : 'bg-transparent text-slate-600 hover:text-slate-900',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Font size */}
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-800">{t.fontLabel}</p>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">{t.fontHelp}</p>

          <div className="mt-2 inline-flex rounded-full border border-slate-300 bg-slate-100 p-1 text-xs">
            {[
              { id: 'normal' as const, label: t.fontNormal },
              { id: 'large' as const, label: t.fontLarge },
              { id: 'xlarge' as const, label: t.fontXLarge },
            ].map((opt) => {
              const isActive = fontSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFontSize(opt.id)}
                  className={[
                    'px-3 py-1 rounded-full transition',
                    isActive ? 'bg-white shadow-sm text-slate-900' : 'bg-transparent text-slate-600 hover:text-slate-900',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Instant mode */}
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-800">{t.instantTitle}</p>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">{t.instantHelp}</p>

          <button
            type="button"
            onClick={applyInstantMode}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#009A93] px-4 py-2 text-xs font-medium text-white shadow-sm hover:brightness-110"
          >
            <Zap className="h-4 w-4" />
            <span>{t.instantButton}</span>
          </button>
        </section>
      </div>

      {/* Upcoming row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UpcomingCard title={t.readAloudTitle} subtitle={t.readAloudSub} icon={<Volume2 className="h-4 w-4 text-slate-400" />} />
        <UpcomingCard title={t.instantPresetTitle} subtitle={t.instantPresetSub} icon={<Zap className="h-4 w-4 text-slate-400" />} />
        <UpcomingCard title={t.blueFilterTitle} subtitle={t.blueFilterSub} icon={<Filter className="h-4 w-4 text-slate-400" />} />
      </div>
    </div>
  );
}