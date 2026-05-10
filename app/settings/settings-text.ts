// app/settings/settings-text.ts

export const TEXT = {
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

    // Coming soon cards
    readAloudTitle: 'In Vorbereitung – Vorlesen',
    readAloudSub:
      'Später kannst du dir Inhalte von LexTrack vorlesen lassen – hilfreich bei Müdigkeit oder Sehschwäche.',
    instantPresetTitle: 'In Vorbereitung – Lesemodus-Presets',
    instantPresetSub:
      'Vordefinierte Presets für Schriftgröße und Theme, die du per Klick aktivieren kannst.',
    blueFilterTitle: 'In Vorbereitung – Blaulichtfilter',
    blueFilterSub:
      'Reduziert den Blauanteil der Oberfläche für entspannteres Arbeiten am Abend.',

    // Data & export
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

    // Coming soon cards
    readAloudTitle: 'Coming soon – Read aloud',
    readAloudSub:
      'Have LexTrack read content out loud – helpful when you are tired or have visual limitations.',
    instantPresetTitle: 'Coming soon – Reading mode presets',
    instantPresetSub:
      'Predefined combinations of theme and font size that you can activate with a single click.',
    blueFilterTitle: 'Coming soon – Blue light filter',
    blueFilterSub:
      'Reduces blue light to make working in the evening more comfortable.',

    // Data & export
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