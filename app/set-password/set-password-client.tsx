// app/set-password/set-password-client.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

const PASSWORD_POLICY = {
  minLen: 10,
  minSpecial: 1,
  minDigits: 1,
};

function countSpecialChars(pw: string) {
  const m = pw.match(/[^A-Za-z0-9]/g);
  return m ? m.length : 0;
}

function analyzePassword(pw: string) {
  const s = String(pw ?? '');
  const lengthOk = s.length >= PASSWORD_POLICY.minLen;
  const hasLower = /[a-z]/.test(s);
  const hasUpper = /[A-Z]/.test(s);
  const digitCount = (s.match(/\d/g) || []).length;
  const digitsOk = digitCount >= PASSWORD_POLICY.minDigits;
  const specialCount = countSpecialChars(s);
  const specialOk = specialCount >= PASSWORD_POLICY.minSpecial;

  const errors: string[] = [];
  if (!lengthOk) errors.push(`Mindestens ${PASSWORD_POLICY.minLen} Zeichen`);
  if (!hasUpper) errors.push('Mindestens 1 Großbuchstabe (A-Z)');
  if (!hasLower) errors.push('Mindestens 1 Kleinbuchstabe (a-z)');
  if (!digitsOk) errors.push(`Mindestens ${PASSWORD_POLICY.minDigits} Zahl (0-9)`);
  if (!specialOk)
    errors.push(`Mindestens ${PASSWORD_POLICY.minSpecial} Sonderzeichen (z. B. ! ? # @ _)`);

  return {
    lengthOk,
    hasLower,
    hasUpper,
    digitCount,
    digitsOk,
    specialCount,
    specialOk,
    isValid: errors.length === 0,
    errors,
  };
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

  const pwCheck = useMemo(() => analyzePassword(password), [password]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) {
      setMsg('Token fehlt. Bitte nutze den Link aus der E-Mail erneut.');
      return;
    }

    const check = analyzePassword(password);
    if (!check.isValid) {
      setMsg(`Passwort-Regeln nicht erfüllt: ${check.errors.join(' · ')}`);
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
        throw new Error(
          data?.message ??
            (data?.details ? String(data.details.join(' · ')) : 'Passwort konnte nicht gesetzt werden.')
        );
      }

      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setMsg(err?.message ?? 'Unbekannter Fehler.');
    } finally {
      setLoading(false);
    }
  }

  function Rule({ ok, text }: { ok: boolean; text: string }) {
    return (
      <li className={ok ? 'text-emerald-700' : 'text-slate-600'}>
        {ok ? '✓' : '•'} {text}
      </li>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold">Neues Passwort setzen</h1>
      <p className="mt-1 text-xs text-slate-600">
        Vergib ein neues Passwort nach den folgenden Regeln:
      </p>

      <ul className="mt-2 space-y-1 text-xs">
        <Rule ok={pwCheck.lengthOk} text={`Mindestens ${PASSWORD_POLICY.minLen} Zeichen`} />
        <Rule ok={pwCheck.hasUpper} text="Mindestens 1 Großbuchstabe (A–Z)" />
        <Rule ok={pwCheck.hasLower} text="Mindestens 1 Kleinbuchstabe (a–z)" />
        <Rule ok={pwCheck.digitsOk} text={`Mindestens ${PASSWORD_POLICY.minDigits} Zahl (0–9)`} />
        <Rule
          ok={pwCheck.specialOk}
          text={`Mindestens ${PASSWORD_POLICY.minSpecial} Sonderzeichen (z. B. ! ? # @ _)`}
        />
      </ul>

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
            autoComplete="new-password"
            placeholder={`Mind. ${PASSWORD_POLICY.minLen} Zeichen, Groß/Klein, Zahl, Sonderzeichen`}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            type="password"
            autoComplete="new-password"
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