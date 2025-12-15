// app/login/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@lextrack.local');
  const [password, setPassword] = useState('lextrack123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Login fehlgeschlagen.');
        return;
      }

      // nach erfolgreichem Login auf die Startseite
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      setError('Es ist ein technischer Fehler aufgetreten.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-900">
      {/* Hintergrundbild */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/login-mountains.jpg')" }}
      />

      {/* Overlay für besseren Kontrast */}
      <div className="absolute inset-0 bg-slate-950/55" />

      {/* Center-Layout */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        {/* Login-Card */}
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white/95 shadow-2xl ring-1 ring-slate-900/10 backdrop-blur">
          {/* Header / Brand-Bereich mit weicherem Verlauf */}
          <div
            className="rounded-t-3xl px-8 py-7 text-center text-teal-50"
            style={{
              backgroundImage:
                'linear-gradient(180deg, #020617 0%, #020617 35%, #021826 65%, #009a93 100%)',
            }}
          >
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-xs font-semibold tracking-wide">
              Lx
            </div>

            <div className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100/80">
              LEXTRACK
            </div>
            <div className="mt-1 text-[13px] font-medium text-teal-100">
              Compliance Suite
            </div>

            <div className="mt-4 space-y-1 text-[13px] leading-relaxed">
              <div className="font-semibold text-white">Built for trust.</div>
              <div className="text-teal-50/90">Designed for clarity.</div>
              <div className="text-teal-50/90">When perfection is needed.</div>
            </div>

            <div className="mt-5 border-t border-teal-500/30 pt-3 text-[10px] text-teal-100/70">
              Compliance Software as a Service · LexTrack © 2025
            </div>
          </div>

          {/* Formularbereich */}
          <div className="px-8 py-7">
            <div className="mb-4">
              <h1 className="text-lg font-semibold text-slate-900">
                Willkommen zurück
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                Melde dich mit deinen Zugangsdaten bei LexTrack an.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1 text-xs">
                <label
                  htmlFor="email"
                  className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                >
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 transition hover:border-teal-500/60 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/70"
                />
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Passwort
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-teal-700 hover:text-teal-800"
                  >
                    Passwort vergessen?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 transition hover:border-teal-500/60 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/70"
                />
              </div>

              {error && (
                <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white"
              >
                {loading ? 'Anmeldung läuft…' : 'Anmelden'}
              </button>
            </form>

            <p className="mt-4 text-[11px] text-slate-500">
              Noch kein Zugang?{' '}
              <Link
                href="#"
                className="font-medium text-teal-700 hover:text-teal-900"
              >
                Kontakt mit dem LexTrack-Team aufnehmen
              </Link>
            </p>

            {/* Demo-Zugang nur in DEV anzeigen, NIE in Produktion */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                <div className="font-semibold mb-1">Demo-Zugang (nur lokal)</div>
                <div>E-Mail: admin@lextrack.local</div>
                <div>Passwort: lextrack123</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer mit Impressum / Datenschutz */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        <footer className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-1.5 text-[10px] text-slate-200 backdrop-blur-sm">
          <span className="font-medium">LexTrack © 2025</span>
          <span className="hidden text-slate-400 sm:inline">•</span>
          <span className="text-slate-300">made by Swen Heinrich</span>
          <span className="hidden text-slate-400 sm:inline">•</span>
          <Link
            href="/impressum"
            className="text-teal-300 underline-offset-2 hover:text-teal-100 hover:underline"
          >
            Impressum
          </Link>
          <span className="text-slate-400">•</span>
          <Link
            href="/datenschutz"
            className="text-teal-300 underline-offset-2 hover:text-teal-100 hover:underline"
          >
            Datenschutz
          </Link>
        </footer>
      </div>
    </div>
  );
}
