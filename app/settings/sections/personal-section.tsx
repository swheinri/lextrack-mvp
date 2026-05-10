// app/settings/sections/personal-section.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, MapPin, User2, Users } from 'lucide-react';
import { useUserPreferences } from '../../components/userpreferences';

const LS_KEY = 'lextrack_personal_settings_v1';

type StoredPersonalSettings = {
  profileEmail?: string;
  saveTabs?: boolean;
  mailNotifications?: boolean;
  prefArea?: string;
  prefSubArea?: string;
  delegateProcess?: string;
  delegateManager?: string;
};

const DEFAULTS: Required<StoredPersonalSettings> = {
  profileEmail: 'swen.heinrich@example.com',
  saveTabs: true,
  mailNotifications: false,
  prefArea: 'GEN',
  prefSubArea: 'ALL',
  delegateProcess: '',
  delegateManager: '',
};

function safeParse(raw: string | null): StoredPersonalSettings | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as StoredPersonalSettings) : null;
  } catch {
    return null;
  }
}

export default function PersonalSection({ isDe }: { isDe: boolean }) {
  const { displayName, setDisplayName, personalGreeting, setPersonalGreeting } =
    useUserPreferences();

  // Lokale States (UI-only)
  const [profileEmail, setProfileEmail] = useState(DEFAULTS.profileEmail);
  const [saveTabs, setSaveTabs] = useState(DEFAULTS.saveTabs);
  const [mailNotifications, setMailNotifications] = useState(DEFAULTS.mailNotifications);
  const [prefArea, setPrefArea] = useState(DEFAULTS.prefArea);
  const [prefSubArea, setPrefSubArea] = useState(DEFAULTS.prefSubArea);
  const [delegateProcess, setDelegateProcess] = useState(DEFAULTS.delegateProcess);
  const [delegateManager, setDelegateManager] = useState(DEFAULTS.delegateManager);

  // ✅ verhindert „Default-Werte überschreiben gespeicherte Werte“
  const [loaded, setLoaded] = useState(false);

  // kleines Feedback (optional)
  const [flash, setFlash] = useState<string | null>(null);

  const payload = useMemo<StoredPersonalSettings>(
    () => ({
      profileEmail,
      saveTabs,
      mailNotifications,
      prefArea,
      prefSubArea,
      delegateProcess,
      delegateManager,
    }),
    [profileEmail, saveTabs, mailNotifications, prefArea, prefSubArea, delegateProcess, delegateManager]
  );

  // 1) Laden (einmalig)
  useEffect(() => {
    const data = safeParse(localStorage.getItem(LS_KEY));
    if (data) {
      if (typeof data.profileEmail === 'string') setProfileEmail(data.profileEmail);
      if (typeof data.saveTabs === 'boolean') setSaveTabs(data.saveTabs);
      if (typeof data.mailNotifications === 'boolean') setMailNotifications(data.mailNotifications);

      if (typeof data.prefArea === 'string') setPrefArea(data.prefArea);
      if (typeof data.prefSubArea === 'string') setPrefSubArea(data.prefSubArea);

      if (typeof data.delegateProcess === 'string') setDelegateProcess(data.delegateProcess);
      if (typeof data.delegateManager === 'string') setDelegateManager(data.delegateManager);
    }
    setLoaded(true);
  }, []);

  // 2) Speichern (bei Änderungen) – erst nach Load
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [loaded, payload]);

  function showFlash(text: string) {
    setFlash(text);
    window.setTimeout(() => setFlash(null), 1400);
  }

  function saveNow() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
      showFlash(isDe ? 'Gespeichert.' : 'Saved.');
    } catch {
      showFlash(isDe ? 'Konnte nicht speichern.' : 'Could not save.');
    }
  }

  function resetPersonalSettings() {
    // nur diese Seite (LS_KEY) zurücksetzen
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // ignore
    }

    // States zurück auf DEFAULTS
    setProfileEmail(DEFAULTS.profileEmail);
    setSaveTabs(DEFAULTS.saveTabs);
    setMailNotifications(DEFAULTS.mailNotifications);
    setPrefArea(DEFAULTS.prefArea);
    setPrefSubArea(DEFAULTS.prefSubArea);
    setDelegateProcess(DEFAULTS.delegateProcess);
    setDelegateManager(DEFAULTS.delegateManager);

    showFlash(isDe ? 'Zurückgesetzt.' : 'Reset.');
  }

  return (
    <div className="space-y-6">
      {/* Headline-Band */}
      <div className="rounded-xl bg-[#041225] text-white px-4 py-3 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold">
          {isDe ? 'Persönliche Einstellungen' : 'Personal settings'}
        </h2>
      </div>

      {flash && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          {flash}
        </div>
      )}

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
                <span>{isDe ? 'Zuletzt geöffnete Tabs merken' : 'Remember last open tabs'}</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-[#009A93]"
                  checked={personalGreeting}
                  onChange={(e) => setPersonalGreeting(e.target.checked)}
                />
                <span>
                  {isDe ? 'Persönliche Begrüßung im Header anzeigen' : 'Show personal greeting in header'}
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">
                {isDe ? 'E-Mail-Benachrichtigungen' : 'Email notifications'}
              </p>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-[#009A93]"
                  checked={mailNotifications}
                  onChange={(e) => setMailNotifications(e.target.checked)}
                />
                <span>{isDe ? 'Wichtige Ereignisse per E-Mail senden' : 'Send important events via email'}</span>
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
                  {isDe ? 'Neue Dokumente im Verantwortungsbereich' : 'New documents in my responsibility'}
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
                <p className="font-medium">{isDe ? 'Anstehende Bewertungsfristen' : 'Upcoming due dates'}</p>
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
                <p className="font-medium">{isDe ? 'Wöchentliche Zusammenfassung' : 'Weekly summary'}</p>
                <p className="text-xs text-slate-500">
                  {isDe ? 'Optionaler Überblick über Änderungen deiner Inhalte.' : 'Optional overview of changes in your content.'}
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
            <label className="text-xs text-slate-500">{isDe ? 'Organisation' : 'Organisation'}</label>
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
            <label className="text-xs text-slate-500">{isDe ? 'Bereich / Sub Area' : 'Area / sub area'}</label>
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

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={saveNow}
              className="flex-1 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800"
            >
              {isDe ? 'Als Standard setzen' : 'Set as default'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(isDe ? 'Persönliche Einstellungen zurücksetzen?' : 'Reset personal settings?')) {
                  resetPersonalSettings();
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              title={isDe ? 'Setzt nur diese Seite zurück' : 'Resets only this page'}
            >
              {isDe ? 'Zurücksetzen' : 'Reset'}
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
              {isDe ? 'Prozessmanagement-Rolle' : 'Process management role'}
            </p>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={isDe ? 'Name der Vertretung (optional)' : 'Delegate name (optional)'}
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
            <p className="text-xs font-medium text-slate-500">{isDe ? 'Unmittelbare Führungskraft' : 'Direct manager'}</p>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={isDe ? 'Name der Führungskraft' : 'Manager name'}
              value={delegateManager}
              onChange={(e) => setDelegateManager(e.target.value)}
            />
            <p className="text-[11px] text-slate-500">
              {isDe ? 'Wird später für Freigaben und Rollen-Zuweisungen verwendet.' : 'Will be used later for approvals and role assignments.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}