// app/settings/page.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Users, Bell, Database, Plug, FileText, Monitor } from 'lucide-react';

import { useTheme } from '../components/themecontext';
import { useLanguage } from '../components/i18n/language';

import GeneralSection from './sections/general-section';
import DataSection from './sections/data-section';
import PersonalSection from './sections/personal-section';
import WipSection from './sections/wip-section';

import { TEXT } from './settings-text';

type SettingsSection =
  | 'general'
  | 'register'
  | 'users'
  | 'integrations'
  | 'notifications'
  | 'data';

type ThemeKey =
  | 'light'
  | 'dark'
  | 'high-contrast'
  | 'colorblind'
  | 'colorblind-deuter';

type FontSizeKey = 'normal' | 'large' | 'xlarge';

const cardBase =
  'flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-[#009A93] hover:shadow-md transition cursor-pointer';
const cardTitle = 'text-sm font-semibold text-slate-800';
const cardSub = 'text-xs text-slate-500';

function pickSetter<T>(label: string, ...candidates: any[]): (v: T) => void {
  const fn = candidates.find((x) => typeof x === 'function');
  if (typeof fn === 'function') return fn;

  // dev: sichtbar machen, production: no-op
  let warned = false;
  return ((v: T) => {
    if (!warned && process.env.NODE_ENV !== 'production') {
      warned = true;
      console.error(
        `[settings] Missing setter "${label}". Settings buttons will not work until the context provides it.`
      );
    }
    void v;
  }) as any;
}

export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSection>('general');

  // ✅ nur lokal zeigen: .env.local -> NEXT_PUBLIC_SHOW_WIP=1
  const showWip = useMemo(() => process.env.NEXT_PUBLIC_SHOW_WIP === '1', []);

  // ✅ Hydration-Fix: erst nach Mount „echtes“ UI rendern
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ---- Theme Context robust lesen (falls Naming im Context ändert) ----
  const themeCtx: any = useTheme();
  const theme = (themeCtx?.theme ?? themeCtx?.mode ?? 'light') as ThemeKey;
  const fontSize = (themeCtx?.fontSize ?? themeCtx?.font ?? 'normal') as FontSizeKey;

  const setTheme = pickSetter<ThemeKey>(
    'setTheme',
    themeCtx?.setTheme,
    themeCtx?.setThemeMode,
    themeCtx?.setMode
  );

  const setFontSize = pickSetter<FontSizeKey>(
    'setFontSize',
    themeCtx?.setFontSize,
    themeCtx?.setFont,
    themeCtx?.setFontsize
  );

  // ---- Language Context robust lesen ----
  const langCtx: any = useLanguage();
  const languageRaw = String(langCtx?.language ?? langCtx?.lang ?? 'de');
  const language = (languageRaw === 'en' ? 'en' : 'de') as 'de' | 'en';
  const setLanguage = pickSetter<'de' | 'en'>('setLanguage', langCtx?.setLanguage, langCtx?.setLang);

  const t = (TEXT as any)[language] ?? TEXT.de;
  const isDe = language === 'de';

  // ✅ falls jemand per Zustand/URL in eine ausgeblendete Sektion kommt → zurück
  useEffect(() => {
    if (!showWip && (active === 'register' || active === 'integrations' || active === 'users')) {
      setActive('general');
    }
  }, [showWip, active]);

  // Lesemodus: farbenblindfreundlich + sehr große Schrift
  const applyInstantMode = () => {
    setTheme('colorblind');
    setFontSize('xlarge');
  };

  // Wichtig: erst nach Mount rendern, damit SSR/Client nicht auseinanderlaufen
  if (!mounted) {
    return (
      <div className="space-y-6">
        {/* kleines Skeleton, damit es nicht „kaputt“ aussieht */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="h-[68px] rounded-xl border border-slate-200 bg-white/60" />
          <div className="h-[68px] rounded-xl border border-slate-200 bg-white/60" />
          <div className="h-[68px] rounded-xl border border-slate-200 bg-white/60" />
        </div>
        <div className="h-[52px] rounded-xl bg-[#041225]/80" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="h-[170px] rounded-xl border border-slate-200 bg-white/60" />
          <div className="h-[170px] rounded-xl border border-slate-200 bg-white/60" />
          <div className="h-[170px] rounded-xl border border-slate-200 bg-white/60" />
          <div className="h-[170px] rounded-xl border border-slate-200 bg-white/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Karten-Grid oben */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* General */}
        <button type="button" className={cardBase} onClick={() => setActive('general')}>
          <div className="text-left">
            <div className={cardTitle}>{t.sections.generalTitle}</div>
            <div className={cardSub}>{t.sections.generalSub}</div>
          </div>
          <Monitor className="h-5 w-5 text-slate-400" />
        </button>

        {/* Notifications / Personal */}
        <button type="button" className={cardBase} onClick={() => setActive('notifications')}>
          <div className="text-left">
            <div className={cardTitle}>{t.sections.notificationsTitle}</div>
            <div className={cardSub}>{t.sections.notificationsSub}</div>
          </div>
          <Bell className="h-5 w-5 text-slate-400" />
        </button>

        {/* Data */}
        <button type="button" className={cardBase} onClick={() => setActive('data')}>
          <div className="text-left">
            <div className={cardTitle}>{t.sections.dataTitle}</div>
            <div className={cardSub}>{t.sections.dataSub}</div>
          </div>
          <Database className="h-5 w-5 text-slate-400" />
        </button>

        {/* WIP-Kacheln: nur lokal */}
        {showWip && (
          <>
            <button type="button" className={cardBase} onClick={() => setActive('register')}>
              <div className="text-left">
                <div className={cardTitle}>{t.sections.registerTitle}</div>
                <div className={cardSub}>{t.sections.registerSub}</div>
              </div>
              <FileText className="h-5 w-5 text-slate-400" />
            </button>

            <button type="button" className={cardBase} onClick={() => setActive('integrations')}>
              <div className="text-left">
                <div className={cardTitle}>{t.sections.integrationsTitle}</div>
                <div className={cardSub}>{t.sections.integrationsSub}</div>
              </div>
              <Plug className="h-5 w-5 text-slate-400" />
            </button>

            <button type="button" className={cardBase} onClick={() => setActive('users')}>
              <div className="text-left">
                <div className={cardTitle}>{t.sections.usersTitle}</div>
                <div className={cardSub}>{t.sections.usersSub}</div>
              </div>
              <Users className="h-5 w-5 text-slate-400" />
            </button>
          </>
        )}
      </div>

      {/* Sections */}
      {active === 'general' && (
        <GeneralSection
          t={t}
          theme={theme}
          setTheme={setTheme}
          fontSize={fontSize}
          setFontSize={setFontSize}
          language={language}
          setLanguage={setLanguage}
          applyInstantMode={applyInstantMode}
          showWip={showWip}
        />
      )}

      {active === 'notifications' && <PersonalSection isDe={isDe} />}

      {active === 'data' && <DataSection t={t} isDe={isDe} />}

      {/* WIP-Detailseite nur lokal */}
      {showWip && active !== 'general' && active !== 'notifications' && active !== 'data' && (
        <WipSection t={t} />
      )}
    </div>
  );
}