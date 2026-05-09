// app/set-password/set-password-client.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function isStrongPassword(pw: string) {
  return typeof pw === 'string' && pw.trim().length >= 10;
}

export default function SetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => {
    return (searchParams?.get('token') ?? '').trim();
  }, [searchParams]);

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) {
      setMsg('Token fehlt. Bitte nutze den Link aus der E-Mail erneut.');
      return;
    }
    if (!isStrongPassword(password)) {
      setMsg('Passwort zu kurz (mind. 10 Zeichen).');
      return;
    }
    if (password !== password2) {
      setMsg('Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message ?? 'Passwort konnte nicht gesetzt werden.');
      }

      setDone(true);
      // Optional: nach 1.5s zurück zum Login
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setMsg(err?.message ?? 'Unbekannter Fehler.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-lg font-semibold">Neues Passwort setzen</h1>
      <p className="mt-1 text-xs text-slate-600">
        Vergib ein neues Passwort (mind. 10 Zeichen).
      </p>

      {!token && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
          Token fehlt. Bitte öffne den Reset-Link aus der E-Mail erneut.
        </div>
      )}

      {done ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          Passwort wurde gesetzt. Du wirst zum Login weitergeleitet…
        </div>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={submit}>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            type="password"
            placeholder="Neues Passwort (mind. 10 Zeichen)"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            type="password"
            placeholder="Neues Passwort wiederholen"
            value={password2}
            onChange={(ev) => setPassword2(ev.target.value)}
          />

          {msg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
              {msg}
            </div>
          )}

          <button
            disabled={loading || !token}
            className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
          >
            {loading ? 'Bitte warten…' : 'Passwort festlegen'}
          </button>
        </form>
      )}

      <div className="mt-4 text-xs">
        <Link className="text-teal-700 hover:underline" href="/login">
          Zurück zum Login
        </Link>
      </div>
    </>
  );
}