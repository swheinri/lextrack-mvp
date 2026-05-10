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
import { APP_VERSION, APP_BUILD_DATE } from '../config/app-meta';
import { UpcomingCard } from './components/upcoming-card';
import  GeneralSection from './sections/general-section';
import DataSection from './sections/data-section';
import PersonalSection from './sections/personal-section';
import WipSection from './sections/wip-section';

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

type FontSizeKey = 'normal' | 'large' | 'xlarge';

/* ---------- Texte DE / EN ---------- */

const TEXT = {
  de: {
    sections: {
      generalTitle: 'Allgemein',
      generalSub: 'Basis-Einstellungen, Sprache & Darstellung.',
      registerTitle: 'Register-Konfiguration',
      registerSub: 'Standardfelder, Themenfelder und Kategorienstruktur (MVP).',
      integrationsTitle: 'Integrationen',
      integrationsSub: 'Schnittstellen zu Drittsystemen (späteres Release).',
      notificationsTitle: 'Persönliche Einstellungen',
      notificationsSub: 'Profilbezogene Angaben und Benachrichtigungen.',
      usersTitle: 'Benutzer & Rollen',
      usersSub: 'Verwaltung von Accounts und Berechtigungen (geplant).',
      dataTitle: 'Daten & Export',
      dataSub: 'Datenexport und Backups (geplant).',
    },

    generalHeading: 'Allgemein',
    dataHeading: 'Daten & Export',

    themeLabel: 'Theme-Modus',
    themeHelp:
      'Wähle, wie LexTrack dargestellt wird – hell, dunkel, mit hohem Kontrast oder farbenblind-freundlich.',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeHighContrast: 'Hoher Kontrast',
    themeColorblind: 'Farbenblind',
    themeDeuter: 'Deuteranopie',
    currentThemePrefix: 'Aktuelles Theme:',

    fontLabel: 'Schriftgröße',
    fontHelp:
      'Passe die Textgröße für die Anwendung an. Überschriften werden proportional skaliert.',
    fontNormal: 'Standard',
    fontLarge: 'Groß',
    fontXLarge: 'Sehr groß',

    languageLabel: 'Sprache',
    languageHelp:
      'Wähle die Sprache der Oberfläche. Die Auswahl wirkt sich auf Navigation, Labels und Beschreibungen aus.',
    languageGerman: 'Deutsch',
    languageEnglish: 'Englisch',

    instantTitle: 'Lesemodus',
    instantHelp:
      'Aktiviert ein gut lesbares Preset: farbenblind-freundliches Theme und deutlich größere Schrift.',
    instantButton: 'Lesemodus aktivieren',

    // „In Vorbereitung“-Karten
    readAloudTitle: 'In Vorbereitung – Vorlesen',
    readAloudSub:
      'Später kannst du dir Inhalte von LexTrack vorlesen lassen – hilfreich bei Müdigkeit oder Sehschwäche.',
    instantPresetTitle: 'In Vorbereitung – Lesemodus-Presets',
    instantPresetSub:
      'Vordefinierte Presets für Schriftgröße und Theme, die du per Klick aktivieren kannst.',
    blueFilterTitle: 'In Vorbereitung – Blaulichtfilter',
    blueFilterSub:
      'Reduziert den Blauanteil der Oberfläche für entspannteres Arbeiten am Abend.',

    // Daten & Export – Texte
    versionCardTitle: 'Anwendungsversion',
    versionLabel: 'Aktuelle Version',
    versionBuildLabel: 'Build-Datum',
    backupCardTitle: 'Datensicherungen & Exporte',
    backupCardSubtitle:
      'In einem späteren Release kannst du hier Backups und Exporte deiner LexTrack-Daten verwalten. Aktuell dient dieser Bereich als Überblick über den technischen Stand der Anwendung.',

    wipTitle: 'In Vorbereitung',
    wipText:
      'Diese Einstellungskategorie ist im MVP noch nicht aktiv. Die Funktionen werden in einem späteren Release ergänzt.',
  },
  en: {
    sections: {
      generalTitle: 'General',
      generalSub: 'Basic settings, language & appearance.',
      registerTitle: 'Register configuration',
      registerSub: 'Default fields, topic areas and category structure (MVP).',
      integrationsTitle: 'Integrations',
      integrationsSub: 'Interfaces to third-party systems (future release).',
      notificationsTitle: 'Personal settings',
      notificationsSub: 'Profile information and notifications.',
      usersTitle: 'Users & roles',
      usersSub: 'Management of accounts and permissions (planned).',
      dataTitle: 'Data & export',
      dataSub: 'Data export and backups (planned).',
    },

    generalHeading: 'General',
    dataHeading: 'Data & export',

    themeLabel: 'Theme mode',
    themeHelp:
      'Choose how LexTrack is displayed – light, dark, high contrast or color-blind friendly.',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeHighContrast: 'High contrast',
    themeColorblind: 'Color-blind',
    themeDeuter: 'Deuteranopia',
    currentThemePrefix: 'Current theme:',

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

    instantTitle: 'Reading mode',
    instantHelp:
      'Activates a highly readable preset: color-blind friendly theme and much larger type.',
    instantButton: 'Activate reading mode',

    // Upcoming cards
    readAloudTitle: 'Coming soon – Read aloud',
    readAloudSub:
      'Have LexTrack read content out loud – helpful when you are tired or have visual limitations.',
    instantPresetTitle: 'Coming soon – Reading mode presets',
    instantPresetSub:
      'Predefined combinations of theme and font size that you can activate with a single click.',
    blueFilterTitle: 'Coming soon – Blue light filter',
    blueFilterSub:
      'Reduces blue light to make working in the evening more comfortable.',

    // Data & export – texts
    versionCardTitle: 'Application version',
    versionLabel: 'Current version',
    versionBuildLabel: 'Build date',
    backupCardTitle: 'Backups & exports',
    backupCardSubtitle:
      'In a later release you will be able to manage backups and exports of your LexTrack data here. For now this section gives you an overview of the technical application status.',

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

export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSection>('general');

  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { displayName, setDisplayName, personalGreeting, setPersonalGreeting } =
    useUserPreferences();

  const t = TEXT[language] ?? TEXT.de;
  const isDe = language === 'de';

  // Lokale States (UI-only)
  const [profileEmail, setProfileEmail] = useState('swen-heinrich@outlook.de');
  const [saveTabs, setSaveTabs] = useState(true);
  const [mailNotifications, setMailNotifications] = useState(false);

  const [prefArea, setPrefArea] = useState('GEN');
  const [prefSubArea, setPrefSubArea] = useState('ALL');

  const [delegateProcess, setDelegateProcess] = useState('');
  const [delegateManager, setDelegateManager] = useState('');

  // Lesemodus: farbblindfreundliches Theme + sehr große Schrift
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
  />
)}

      {active === 'notifications' && <PersonalSection isDe={isDe} />}

      {active === 'data' && <DataSection t={t} isDe={isDe} />}

      {active !== 'general' && active !== 'notifications' && active !== 'data' && (
  <WipSection t={t} />
)}
    </div>
  );
}