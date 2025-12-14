// app/settings/page.tsx
'use client';

import React, { useState } from 'react';
import {
  Users,
  Bell,
  Database,
  Plug,
  FileText,
  Monitor,
  SunMedium,
  Moon,
  Contrast,
  Eye,
  Zap,
  Type,
  Volume2,
  Filter,
  MapPin,
  User2,
} from 'lucide-react';
import { useTheme } from '../components/themecontext';
import { useLanguage } from '../components/i18n/language';
import { useUserPreferences } from '../components/userpreferences';

/* ---------- Typen ---------- */

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

/* ---------- Texte DE / EN ---------- */

const TEXT = {
  de: {
    sections: {
      generalTitle: 'allgemein',
      generalSub: 'basis-einstellungen, sprache & darstellung.',
      registerTitle: 'register-konfiguration',
      registerSub:
        'standardfelder, themenfelder und kategorienstruktur (mvp).',
      integrationsTitle: 'integrationen',
      integrationsSub: 'schnittstellen zu drittsystemen (späteres release).',
      notificationsTitle: 'persönliche einstellungen',
      notificationsSub: 'profilbezogene angaben und benachrichtigungen.',
      usersTitle: 'benutzer & rollen',
      usersSub: 'verwaltung von accounts und berechtigungen (geplant).',
      dataTitle: 'daten & export',
      dataSub: 'datenexport und backups (geplant).',
    },

    generalHeading: 'Allgemein',

    themeLabel: 'Theme-Modus',
    themeHelp:
      'Wähle, wie LexTrack dargestellt wird – hell, dunkel, mit hohem Kontrast oder farbblind-freundlich.',
    themeLight: 'hell',
    themeDark: 'dunkel',
    themeHighContrast: 'high contrast',
    themeColorblind: 'colorblind',
    themeDeuter: 'deuteranopia',
    currentThemePrefix: 'aktuelles theme:',

    fontLabel: 'Schriftgröße',
    fontHelp:
      'Passe die Textgröße für die Anwendung an. Headlines werden proportional skaliert.',
    fontNormal: 'Standard',
    fontLarge: 'Groß',
    fontXLarge: 'Sehr groß',

    languageLabel: 'Sprache',
    languageHelp:
      'Wähle die Sprache der Oberfläche. Die Auswahl wirkt sich auf Navigation, Labels und Beschreibungen aus.',
    languageGerman: 'Deutsch',
    languageEnglish: 'Englisch',

    instantTitle: 'Instant-Modus',
    instantHelp:
      'Aktiviert ein gut lesbares Preset: farbblind-freundliches Theme und deutlich größere Schrift.',
    instantButton: 'Instant-Lesemodus aktivieren',

    // „In Vorbereitung“-Karten
    readAloudTitle: 'In Vorbereitung – Read Aloud',
    readAloudSub:
      'Später kannst du dir Inhalte von LexTrack vorlesen lassen – hilfreich bei Müdigkeit oder Sehschwäche.',
    instantPresetTitle: 'In Vorbereitung – Instant Mode Preset',
    instantPresetSub:
      'Vordefinierte Presets für Schriftgröße und Theme, die du per Klick aktivieren kannst.',
    blueFilterTitle: 'In Vorbereitung – Blaulichtfilter',
    blueFilterSub:
      'Reduziert den Blauanteil der Oberfläche für entspannteres Arbeiten am Abend.',

    wipTitle: 'In Vorbereitung',
    wipText:
      'Diese Einstellungskategorie ist im MVP noch nicht aktiv. Die Funktionen werden in einem späteren Release ergänzt.',
  },
  en: {
    sections: {
      generalTitle: 'general',
      generalSub: 'basic settings, language & appearance.',
      registerTitle: 'register configuration',
      registerSub:
        'default fields, topic areas and category structure (MVP).',
      integrationsTitle: 'integrations',
      integrationsSub: 'interfaces to third-party systems (future release).',
      notificationsTitle: 'personal settings',
      notificationsSub: 'profile information and notifications.',
      usersTitle: 'users & roles',
      usersSub: 'management of accounts and permissions (planned).',
      dataTitle: 'data & export',
      dataSub: 'data export and backups (planned).',
    },

    generalHeading: 'General',

    themeLabel: 'Theme mode',
    themeHelp:
      'Choose how LexTrack is displayed – light, dark, high contrast or colour-blind friendly.',
    themeLight: 'light',
    themeDark: 'dark',
    themeHighContrast: 'high contrast',
    themeColorblind: 'colour-blind',
    themeDeuter: 'deuteranopia',
    currentThemePrefix: 'current theme:',

    fontLabel: 'Font size',
    fontHelp:
      'Adjust text size for the application. Headlines scale proportionally.',
    fontNormal: 'Default',
    fontLarge: 'Large',
    fontXLarge: 'Extra large',

    languageLabel: 'Language',
    languageHelp:
      'Choose the interface language. This affects navigation, labels and descriptions.',
    languageGerman: 'German',
    languageEnglish: 'English',

    instantTitle: 'Instant mode',
    instantHelp:
      'Activates a highly readable preset: colour-blind friendly theme and much larger type.',
    instantButton: 'Activate instant reading mode',

    // Upcoming cards
    readAloudTitle: 'Coming soon – Read aloud',
    readAloudSub:
      'Have LexTrack read content out loud – helpful when you are tired or have visual limitations.',
    instantPresetTitle: 'Coming soon – Instant mode presets',
    instantPresetSub:
      'Predefined combinations of theme and font size that you can activate with a single click.',
    blueFilterTitle: 'Coming soon – Blue light filter',
    blueFilterSub:
      'Reduces blue light to make working in the evening more comfortable.',

    wipTitle: 'Coming soon',
    wipText:
      'This category of settings is not yet active in the MVP. The features will be added in a later release.',
  },
} as const;

/* ---------- Styling-Hilfen ---------- */

const cardBase =
  'flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-[#009A93] hover:shadow-md transition cursor-pointer';
const cardTitle = 'text-sm font-semibold text-slate-800';
const cardSub = 'text-xs text-slate-500';

/* ---------- Helper-Komponenten ---------- */

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

/* ======================================================================= */

export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSection>('general');

  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { displayName, setDisplayName, personalGreeting, setPersonalGreeting } =
    useUserPreferences();

  const t = TEXT[language] ?? TEXT.de;
  const isDe = language === 'de';

  // Lokale States (UI-only)
  const [profileEmail, setProfileEmail] = useState('swen.heinrich@example.com');
  const [saveTabs, setSaveTabs] = useState(true);
  const [mailNotifications, setMailNotifications] = useState(false);

  const [prefArea, setPrefArea] = useState('GEN');
  const [prefSubArea, setPrefSubArea] = useState('ALL');

  const [delegateProcess, setDelegateProcess] = useState('');
  const [delegateManager, setDelegateManager] = useState('');

  // Instant-Mode: farbblindfreundliches Theme + SEHR große Schrift
  const applyInstantMode = () => {
    setTheme('colorblind');
    setFontSize('xlarge');
  };

  const themeOptions: { id: ThemeKey; label: string; icon: React.ReactNode }[] =
    [
      {
        id: 'light',
        label: t.themeLight,
        icon: <SunMedium className="h-3 w-3" />,
      },
      {
        id: 'dark',
        label: t.themeDark,
        icon: <Moon className="h-3 w-3" />,
      },
      {
        id: 'high-contrast',
        label: t.themeHighContrast,
        icon: <Contrast className="h-3 w-3" />,
      },
      {
        id: 'colorblind',
        label: t.themeColorblind,
        icon: <Eye className="h-3 w-3" />,
      },
      {
        id: 'colorblind-deuter',
        label: t.themeDeuter,
        icon: <Eye className="h-3 w-3" />,
      },
    ];

  return (
    <div className="space-y-6">
      {/* Karten-Grid oben (Navigation der Settings-Kategorien) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          type="button"
          className={cardBase}
          onClick={() => setActive('general')}
        >
          <div className="text-left">
            <div className={cardTitle}>{t.sections.generalTitle}</div>
            <div className={cardSub}>{t.sections.generalSub}</div>
          </div>
          <Monitor className="h-5 w-5 text-slate-400" />
        </button>

        <button
          type="button"
          className={cardBase}
          onClick={() => setActive('register')}
        >
          <div className="text-left">
            <div className={cardTitle}>{t.sections.registerTitle}</div>
            <div className={cardSub}>{t.sections.registerSub}</div>
          </div>
          <FileText className="h-5 w-5 text-slate-400" />
        </button>

        <button
          type="button"
          className={cardBase}
          onClick={() => setActive('integrations')}
        >
          <div className="text-left">
            <div className={cardTitle}>{t.sections.integrationsTitle}</div>
            <div className={cardSub}>{t.sections.integrationsSub}</div>
          </div>
          <Plug className="h-5 w-5 text-slate-400" />
        </button>

        <button
          type="button"
          className={cardBase}
          onClick={() => setActive('notifications')}
        >
          <div className="text-left">
            <div className={cardTitle}>{t.sections.notificationsTitle}</div>
            <div className={cardSub}>{t.sections.notificationsSub}</div>
          </div>
          <Bell className="h-5 w-5 text-slate-400" />
        </button>

        <button
          type="button"
          className={cardBase}
          onClick={() => setActive('users')}
        >
          <div className="text-left">
            <div className={cardTitle}>{t.sections.usersTitle}</div>
            <div className={cardSub}>{t.sections.usersSub}</div>
          </div>
          <Users className="h-5 w-5 text-slate-400" />
        </button>

        <button
          type="button"
          className={cardBase}
          onClick={() => setActive('data')}
        >
          <div className="text-left">
            <div className={cardTitle}>{t.sections.dataTitle}</div>
            <div className={cardSub}>{t.sections.dataSub}</div>
          </div>
          <Database className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      {/* Detailbereich GENERAL */}
      {active === 'general' && (
        <div className="space-y-6">
          {/* Headline-Band */}
          <div className="rounded-xl bg-[#041225] text-white px-4 py-3 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold">
              {t.generalHeading}
            </h2>
          </div>

          {/* Erste Zeile: Theme / Sprache / Schriftgröße / Instant-Modus */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Theme-Modus */}
            <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <SunMedium className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-800">
                  {t.themeLabel}
                </p>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                {t.themeHelp}
              </p>

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
                  {theme}
                </span>
              </p>
            </section>

            {/* Sprache */}
            <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-800">
                  {t.languageLabel}
                </p>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                {t.languageHelp}
              </p>

              <div className="mt-2 inline-flex rounded-full border border-slate-300 bg-slate-100 p-1 text-xs">
                {[
                  { id: 'de', label: t.languageGerman },
                  { id: 'en', label: t.languageEnglish },
                ].map((opt) => {
                  const isActive = language === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLanguage(opt.id as 'de' | 'en')}
                      className={[
                        'px-3 py-1 rounded-full transition',
                        isActive
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

            {/* Schriftgröße */}
            <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-800">
                  {t.fontLabel}
                </p>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                {t.fontHelp}
              </p>

              <div className="mt-2 inline-flex rounded-full border border-slate-300 bg-slate-100 p-1 text-xs">
                {[
                  { id: 'normal', label: t.fontNormal },
                  { id: 'large', label: t.fontLarge },
                  { id: 'xlarge', label: t.fontXLarge },
                ].map((opt) => {
                  const isActive = fontSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFontSize(opt.id as any)}
                      className={[
                        'px-3 py-1 rounded-full transition',
                        isActive
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

            {/* Instant-Modus */}
            <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-800">
                  {t.instantTitle}
                </p>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                {t.instantHelp}
              </p>

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

          {/* Zweite Zeile: „In Vorbereitung“-Karten */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UpcomingCard
              title={t.readAloudTitle}
              subtitle={t.readAloudSub}
              icon={<Volume2 className="h-4 w-4 text-slate-400" />}
            />
            <UpcomingCard
              title={t.instantPresetTitle}
              subtitle={t.instantPresetSub}
              icon={<Zap className="h-4 w-4 text-slate-400" />}
            />
            <UpcomingCard
              title={t.blueFilterTitle}
              subtitle={t.blueFilterSub}
              icon={<Filter className="h-4 w-4 text-slate-400" />}
            />
          </div>
        </div>
      )}

      {/* Detailbereich: PERSÖNLICHE EINSTELLUNGEN */}
      {active === 'notifications' && (
        <div className="space-y-6">
          {/* Headline-Band */}
          <div className="rounded-xl bg-[#041225] text-white px-4 py-3 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold">
              {isDe ? 'Persönliche Einstellungen' : 'Personal settings'}
            </h2>
          </div>

          {/* Erste Zeile: Profil + Benachrichtigungen */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Profil & Basisdaten */}
            <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <User2 className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-800">
                  {isDe ? 'Profil & Basisdaten' : 'Profile & basics'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">
                    {isDe ? 'Name für Begrüßung' : 'Name for greeting'}
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500">
                    {isDe
                      ? 'Dieser Name wird in der persönlichen Begrüßung im Header verwendet. Lässt du das Feld leer, wird eine neutrale Anrede genutzt.'
                      : 'This name is used in the personal greeting in the header. If left empty, a neutral salutation is used.'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">
                    {isDe ? 'E-Mail-Adresse' : 'Email address'}
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500">
                    {isDe ? 'Persönliche Optionen' : 'Personal options'}
                  </p>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-[#009A93]"
                      checked={saveTabs}
                      onChange={(e) => setSaveTabs(e.target.checked)}
                    />
                    <span>
                      {isDe
                        ? 'Zuletzt geöffnete Tabs merken'
                        : 'Remember last open tabs'}
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-[#009A93]"
                      checked={personalGreeting}
                      onChange={(e) =>
                        setPersonalGreeting(e.target.checked)
                      }
                    />
                    <span>
                      {isDe
                        ? 'Persönliche Begrüßung im Header anzeigen'
                        : 'Show personal greeting in header'}
                    </span>
                  </label>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500">
                    {isDe
                      ? 'E-Mail-Benachrichtigungen'
                      : 'Email notifications'}
                  </p>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-[#009A93]"
                      checked={mailNotifications}
                      onChange={(e) =>
                        setMailNotifications(e.target.checked)
                      }
                    />
                    <span>
                      {isDe
                        ? 'Wichtige Ereignisse per E-Mail senden'
                        : 'Send important events via email'}
                    </span>
                  </label>
                </div>
              </div>
            </section>

            {/* Benachrichtigungs-Präferenzen */}
            <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-800">
                  {isDe ? 'Benachrichtigungen' : 'Notifications'}
                </h3>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-medium">
                      {isDe
                        ? 'Neue Dokumente im Verantwortungsbereich'
                        : 'New documents in my responsibility'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isDe
                        ? 'Benachrichtigt dich, wenn dir neue Dokumente zugewiesen werden.'
                        : 'Notifies you when new documents are assigned to you.'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                  <div>
                    <p className="font-medium">
                      {isDe
                        ? 'Anstehende Bewertungsfristen'
                        : 'Upcoming due dates'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isDe
                        ? 'Erinnert dich an bald fällige Bewertungen im Register oder in Matrizen.'
                        : 'Reminds you of upcoming due dates in the register or matrices.'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                  <div>
                    <p className="font-medium">
                      {isDe
                        ? 'Wöchentliche Zusammenfassung'
                        : 'Weekly summary'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isDe
                        ? 'Optionaler Überblick über Änderungen deiner Inhalte.'
                        : 'Optional overview of changes in your content.'}
                    </p>
                  </div>
                </li>
              </ul>
            </section>
          </div>

          {/* Zweite Zeile: Mein Bereich */}
          <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">
                {isDe ? 'Mein Bereich' : 'My area'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">
                  {isDe ? 'Organisation' : 'Organisation'}
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={prefArea}
                  onChange={(e) => setPrefArea(e.target.value)}
                >
                  <option value="GEN">GEN</option>
                  <option value="COMP">COMP</option>
                  <option value="OPS">OPS</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500">
                  {isDe ? 'Bereich / Sub Area' : 'Area / sub area'}
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={prefSubArea}
                  onChange={(e) => setPrefSubArea(e.target.value)}
                >
                  <option value="ALL">{isDe ? 'Alle' : 'All'}</option>
                  <option value="REG">REG</option>
                  <option value="IT">IT</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  className="w-full rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800"
                >
                  {isDe ? 'Als Standard setzen' : 'Set as default'}
                </button>
              </div>
            </div>
          </section>

          {/* Dritte Zeile: Vertretungen */}
          <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">
                {isDe ? 'Vertretungen' : 'Delegations'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">
                  {isDe
                    ? 'Prozessmanagement-Rolle'
                    : 'Process management role'}
                </p>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder={
                    isDe
                      ? 'Name der Vertretung (optional)'
                      : 'Delegate name (optional)'
                  }
                  value={delegateProcess}
                  onChange={(e) => setDelegateProcess(e.target.value)}
                />
                <p className="text-[11px] text-slate-500">
                  {isDe
                    ? 'Hier kannst du eine Person hinterlegen, die dich bei Prozessaufgaben vertreten darf.'
                    : 'Define a person who may act as your delegate for process-related tasks.'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">
                  {isDe ? 'Unmittelbare Führungskraft' : 'Direct manager'}
                </p>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder={
                    isDe ? 'Name der Führungskraft' : 'Manager name'
                  }
                  value={delegateManager}
                  onChange={(e) => setDelegateManager(e.target.value)}
                />
                <p className="text-[11px] text-slate-500">
                  {isDe
                    ? 'Wird später für Freigaben und Rollen-Zuweisungen verwendet.'
                    : 'Will be used later for approvals and role assignments.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Andere Settings-Kategorien noch als generisches „In Vorbereitung“ */}
      {active !== 'general' && active !== 'notifications' && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-2">
            {t.wipTitle}
          </h2>
          <p className="text-sm text-slate-600">{t.wipText}</p>
        </div>
      )}
    </div>
  );
}
