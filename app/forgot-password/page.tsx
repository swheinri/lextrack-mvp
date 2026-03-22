'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim().toLowerCase());
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const e = (u.searchParams.get('email') ?? '').trim().toLowerCase();
      if (e) setEmail(e);
    } catch {
      // ignore
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const clean = email.trim().toLowerCase();
    if (!isValidEmail(clean)) {
      setMsg('Bitte eine gültige E-Mail eingeben.');
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      }).catch(() => null);

      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/95 text-slate-900 p-6 shadow-2xl">
        <h1 className="text-lg font-semibold">Passwort zurücksetzen</h1>
        <p className="mt-1 text-xs text-slate-600">
          Gib deine E-Mail ein. Wenn ein Account existiert, wird ein Reset-Link erstellt.
        </p>

        {done ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            Wenn ein Account existiert, wurde der Reset-Prozess gestartet.
          </div>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="name@company.com"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
            />

            {msg && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                {msg}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
            >
              {loading ? 'Bitte warten…' : 'Reset anfordern'}
            </button>
          </form>
        )}

        <div className="mt-4 text-xs">
          <Link className="text-teal-700 hover:underline" href="/login">
            Zurück zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}
