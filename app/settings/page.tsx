// app/settings/sections/general-section.tsx
'use client';

import React, { useMemo } from 'react';
import {
  SunMedium,
  Moon,
  Contrast,
  Eye,
  Zap,
  Type as TypeIcon,
  Monitor,
  Filter,
  Volume2,
} from 'lucide-react';

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
  showWip: boolean;
}) {
  const {
    t,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    language,
    setLanguage,
    applyInstantMode,
    showWip,
  } = props;

  const isDe = language === 'de';

  // ✅ Fallbacks, falls t beim Prerendern kurz undefined ist
  const TT = useMemo(() => {
    const base = t ?? {};
    const fallbackDe = {
      generalHeading: 'Allgemein',
      themeLabel: 'Theme-Modus',
      themeHelp:
        'Wähle, wie LexTrack dargestellt wird – hell, dunkel, mit hohem Kontrast oder farbenblind-freundlich.',
      themeLight: 'Hell',
      themeDark: 'Dunkel',
      themeHighContrast: 'Hoher Kontrast',
      themeColorblind: 'Farbenblind',
      themeDeuter: 'Deuteranopie',
      currentThemePrefix: 'Aktuelles Theme:',
      languageLabel: 'Sprache',
      languageHelp:
        'Wähle die Sprache der Oberfläche. Die Auswahl wirkt sich auf Navigation, Labels und Beschreibungen aus.',
      languageGerman: 'Deutsch',
      languageEnglish: 'Englisch',
      fontLabel: 'Schriftgröße',
      fontHelp:
        'Passe die Textgröße für die Anwendung an. Überschriften werden proportional skaliert.',
      fontNormal: 'Standard',
      fontLarge: 'Groß',
      fontXLarge: 'Sehr groß',
      instantTitle: 'Lesemodus',
      instantHelp:
        'Aktiviert ein gut lesbares Preset: farbenblind-freundliches Theme und deutlich größere Schrift.',
      instantButton: 'Lesemodus aktivieren',
      readAloudTitle: 'In Vorbereitung – Vorlesen',
      readAloudSub:
        'Später kannst du dir Inhalte von LexTrack vorlesen lassen – hilfreich bei Müdigkeit oder Sehschwäche.',
      blueFilterTitle: 'In Vorbereitung – Blaulichtfilter',
      blueFilterSub:
        'Reduziert den Blauanteil der Oberfläche für entspannteres Arbeiten am Abend.',
    };

    const fallbackEn = {
      generalHeading: 'General',
      themeLabel: 'Theme mode',
      themeHelp:
        'Choose how LexTrack is displayed – light, dark, high contrast or color-blind friendly.',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeHighContrast: 'High contrast',
      themeColorblind: 'Color-blind',
      themeDeuter: 'Deuteranopia',
      currentThemePrefix: 'Current theme:',
      languageLabel: 'Language',
      languageHelp:
        'Choose the interface language. This affects navigation, labels and descriptions.',
      languageGerman: 'German',
      languageEnglish: 'English',
      fontLabel: 'Font size',
      fontHelp:
        'Adjust text size for the application. Headlines scale proportionally.',
      fontNormal: 'Default',
      fontLarge: 'Large',
      fontXLarge: 'Extra large',
      instantTitle: 'Reading mode',
      instantHelp:
        'Activates a highly readable preset: color-blind friendly theme and much larger type.',
      instantButton: 'Activate reading mode',
      readAloudTitle: 'Coming soon – Read aloud',
      readAloudSub:
        'Have LexTrack read content out loud – helpful when you are tired or have visual limitations.',
      blueFilterTitle: 'Coming soon – Blue light filter',
      blueFilterSub:
        'Reduces blue light to make working in the evening more comfortable.',
    };

    const fb = isDe ? fallbackDe : fallbackEn;
    return { ...fb, ...base };
  }, [t, isDe]);

  const themeOptions: { id: ThemeKey; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: TT.themeLight, icon: <SunMedium className="h-3 w-3" /> },
    { id: 'dark', label: TT.themeDark, icon: <Moon className="h-3 w-3" /> },
    { id: 'high-contrast', label: TT.themeHighContrast, icon: <Contrast className="h-3 w-3" /> },
    { id: 'colorblind', label: TT.themeColorblind, icon: <Eye className="h-3 w-3" /> },
    { id: 'colorblind-deuter', label: TT.themeDeuter, icon: <Eye className="h-3 w-3" /> },
  ];

  type Preset = {
    id: string;
    labelDe: string;
    labelEn: string;
    theme: ThemeKey;
    fontSize: FontSizeKey;
  };

  const presets: Preset[] = [
    {
      id: 'reading',
      labelDe: 'Lesemodus (Empfohlen)',
      labelEn: 'Reading (Recommended)',
      theme: 'colorblind',
      fontSize: 'xlarge',
    },
    {
      id: 'dark-focus',
      labelDe: 'Dunkel Fokus',
      labelEn: 'Dark focus',
      theme: 'dark',
      fontSize: 'large',
    },
    {
      id: 'audit',
      labelDe: 'Audit / Kontrast',
      labelEn: 'Audit / contrast',
      theme: 'high-contrast',
      fontSize: 'normal',
    },
  ];

  const activePreset =
    presets.find((p) => p.theme === theme && p.fontSize === fontSize) ?? null;

  const applyPreset = (p: Preset) => {
    setTheme(p.theme);
    setFontSize(p.fontSize);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-[#041225] text-white px-4 py-3 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold">{TT.generalHeading}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Theme */}
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <SunMedium className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-800">{TT.themeLabel}</p>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">{TT.themeHelp}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {themeOptions.map((opt) => {
              const isActiveBtn = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  aria-pressed={isActiveBtn}
                  className={[
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition',
                    isActiveBtn
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
            {TT.currentThemePrefix}{' '}
            <span className="font-semibold text-slate-700">
              {themeOptions.find((x) => x.id === theme)?.label ?? theme}
            </span>
          </p>
        </section>

        {/* Language */}
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-800">{TT.languageLabel}</p>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">{TT.languageHelp}</p>

          <div className="mt-2 inline-flex rounded-full border border-slate-300 bg-slate-100 p-1 text-xs">
            {[
              { id: 'de' as const, label: TT.languageGerman },
              { id: 'en' as const, label: TT.languageEnglish },
            ].map((opt) => {
              const isActiveBtn = language === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLanguage(opt.id)}
                  aria-pressed={isActiveBtn}
                  className={[
                    'px-3 py-1 rounded-full transition',
                    isActiveBtn
                      ? 'bg-white shadow-sm text-slate-900'
                      : 'bg-transparent text-slate-600 hover:text-slate-900',
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
            <p className="text-sm font-medium text-slate-800">{TT.fontLabel}</p>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">{TT.fontHelp}</p>

          <div className="mt-2 inline-flex rounded-full border border-slate-300 bg-slate-100 p-1 text-xs">
            {[
              { id: 'normal' as const, label: TT.fontNormal },
              { id: 'large' as const, label: TT.fontLarge },
              { id: 'xlarge' as const, label: TT.fontXLarge },
            ].map((opt) => {
              const isActiveBtn = fontSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFontSize(opt.id)}
                  aria-pressed={isActiveBtn}
                  className={[
                    'px-3 py-1 rounded-full transition',
                    isActiveBtn
                      ? 'bg-white shadow-sm text-slate-900'
                      : 'bg-transparent text-slate-600 hover:text-slate-900',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Lesemodus / Presets */}
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-800">{TT.instantTitle}</p>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">{TT.instantHelp}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {presets.map((p) => {
              const isActiveBtn = activePreset?.id === p.id;
              const label = isDe ? p.labelDe : p.labelEn;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  aria-pressed={isActiveBtn}
                  className={[
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition',
                    isActiveBtn
                      ? 'border-[#009A93] bg-[#009A93]/10 text-[#009A93]'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                  title={
                    isDe
                      ? `Theme: ${p.theme} · Schrift: ${p.fontSize}`
                      : `Theme: ${p.theme} · Font: ${p.fontSize}`
                  }
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={applyInstantMode}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#009A93] px-4 py-2 text-xs font-medium text-white shadow-sm hover:brightness-110"
            title={isDe ? 'Wendet das empfohlene Preset an' : 'Applies the recommended preset'}
          >
            <Zap className="h-4 w-4" />
            <span>{isDe ? 'Empfohlenes Preset anwenden' : 'Apply recommended preset'}</span>
          </button>

          <p className="mt-1 text-[11px] text-slate-500">
            {isDe ? 'Aktiv:' : 'Active:'}{' '}
            <span className="font-semibold text-slate-700">
              {activePreset
                ? (isDe ? activePreset.labelDe : activePreset.labelEn)
                : `${theme} · ${fontSize}`}
            </span>
          </p>
        </section>
      </div>

      {/* ✅ Upcoming row nur lokal (damit Read Aloud + Blaulichtfilter online verschwinden) */}
      {showWip && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UpcomingCard
            title={TT.readAloudTitle}
            subtitle={TT.readAloudSub}
            icon={<Volume2 className="h-4 w-4 text-slate-400" />}
          />
          <UpcomingCard
            title={TT.blueFilterTitle}
            subtitle={TT.blueFilterSub}
            icon={<Filter className="h-4 w-4 text-slate-400" />}
          />
        </div>
      )}
    </div>
  );
}