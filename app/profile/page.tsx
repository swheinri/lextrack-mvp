// app/profile/page.tsx
'use client';

import {
  Bell,
  User2,
  MapPin,
  Users,
  FileText,
  ChevronRight,
  Bookmark,
  Clock,
} from 'lucide-react';

export default function Page() {
  const rightBtn = (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-md bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-white"
      title="Benachrichtigungen"
    >
      <Bell size={14} className="opacity-70" />
      Benachrichtigungen
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Lokaler Header (Gradient) */}
      <div className="rounded-xl bg-gradient-to-r from-[#132c54] via-[#006173] to-[#009A93] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-2">
            <span className="mt-0.5">
              <User2 size={20} />
            </span>
            <div>
              <div className="text-2xl font-semibold leading-tight">Profil</div>
              <div className="mt-1 text-sm text-white/80">
                Verwalte deine persönlichen Einstellungen, Bereiche und
                Vertretungen.
              </div>
            </div>
          </div>
          <div className="shrink-0">{rightBtn}</div>
        </div>
      </div>

      {/* Content-Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Linke Spalte (2/3) */}
        <div className="space-y-6 xl:col-span-2">
          {/* Allgemein */}
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <header className="flex items-center gap-2 bg-[#112a52] px-4 py-3 text-white">
              <User2 size={18} />
              <h2 className="font-semibold">Allgemein</h2>
            </header>
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Nutzername</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  defaultValue="Swen Heinrich"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">E-Mail-Adresse</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  defaultValue="swen.heinrich@dlh.de"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Sprache</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option>Deutsch</option>
                  <option>English</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Einstellungen</label>
                <div className="flex flex-col gap-2 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-[#009A93]"
                      defaultChecked
                    />
                    Tabs speichern
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="accent-[#009A93]" />
                    E-Mail-Benachrichtigungen
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-[#009A93]"
                      defaultChecked
                    />
                    Persönliche Anrede (Startseite)
                  </label>
                </div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <button
                type="button"
                className="rounded-lg bg-[#009A93] px-3 py-2 text-sm text-white hover:brightness-110"
              >
                Änderungen speichern
              </button>
            </div>
          </section>

          {/* Mein Bereich */}
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <header className="flex items-center gap-2 bg-[#112a52] px-4 py-3 text-white">
              <MapPin size={18} />
              <h2 className="font-semibold">Mein Bereich</h2>
            </header>
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Area</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option>DLH</option>
                  <option>LHT</option>
                  <option>OCN</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Sub Area</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option>Alle</option>
                  <option>TFM</option>
                  <option>CAMO</option>
                </select>
              </div>
            </div>
            <div className="px-4 pb-4">
              <button
                type="button"
                className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-900"
              >
                Als Standard setzen
              </button>
            </div>
          </section>

          {/* Meine Vertreter:innen */}
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <header className="flex items-center gap-2 bg-[#112a52] px-4 py-3 text-white">
              <Users size={18} />
              <h2 className="font-semibold">Meine Vertreter:innen</h2>
            </header>
            <div className="space-y-4 p-4">
              <div>
                <div className="mb-2 text-sm font-medium">
                  Prozessmanagement-Rolle
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto]">
                  <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option>Bitte wählen…</option>
                    <option>Vertreter: Max Mustermann</option>
                  </select>
                  <button
                    type="button"
                    className="rounded-lg bg-[#009A93] px-3 py-2 text-sm text-white hover:brightness-110"
                  >
                    Hinzufügen
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-800 hover:bg-slate-300"
                  >
                    Löschen
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium">
                  Unmittelbare Führungskraft (Rollenzuweisung)
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto]">
                  <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option>Bitte wählen…</option>
                    <option>Vertreterin: Anna Beispiel</option>
                  </select>
                  <button
                    type="button"
                    className="rounded-lg bg-[#009A93] px-3 py-2 text-sm text-white hover:brightness-110"
                  >
                    Hinzufügen
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-800 hover:bg-slate-300"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Rechte Spalte (1/3) */}
        <div className="space-y-6">
          {/* Notifications */}
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-slate-700" />
                <h3 className="font-semibold">Benachrichtigungen</h3>
              </div>
              <button
                type="button"
                className="text-sm text-[#006173] hover:underline"
              >
                Alle ansehen
              </button>
            </header>
            <ul className="p-2">
              <li className="flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
                <span className="mt-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                <div className="text-sm">
                  <div>
                    <span className="font-medium">Daisy Duck</span> hat dir eine
                    BDSG-Prüfung zugewiesen.
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Freitag · 09:15
                  </div>
                </div>
                <ChevronRight size={16} className="ml-auto text-slate-400" />
              </li>
              <li className="flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
                <span className="mt-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div className="text-sm">
                  <div>
                    Neues Dokument im Kataster:{' '}
                    <span className="font-medium">BDSG 2025</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Heute · 08:02
                  </div>
                </div>
                <ChevronRight size={16} className="ml-auto text-slate-400" />
              </li>
            </ul>
          </section>

          {/* Zugewiesene Dokumente */}
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <FileText size={18} className="text-slate-700" />
              <h3 className="font-semibold">Zugewiesene Dokumente</h3>
            </header>
            <div className="space-y-3 p-3">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-700">
                  D
                </div>
                <div className="text-sm">
                  <div className="font-medium">
                    Verordnung zur Teichsicherheit 2025
                  </div>
                  <div className="text-xs text-slate-500">von Donald Duck</div>
                </div>
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                  In Bearbeitung
                </span>
              </div>
            </div>
          </section>

          {/* Schnellzugriff */}
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <header className="border-b border-slate-200 px-4 py-3 font-semibold">
              Schnellzugriff
            </header>
            <div className="grid grid-cols-1 gap-2 p-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <Clock size={16} /> Meine letzten Inhalte
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <Bookmark size={16} /> Meine Lesezeichen
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <FileText size={16} /> Feedback-Management
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
