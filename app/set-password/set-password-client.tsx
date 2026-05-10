// app/set-password/set-password-client.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

const POLICY = {
  minLen: 10,
  minDigits: 1,
  minSpecial: 1,
};

function countMatches(value: string, re: RegExp): number {
  const m = value.match(re);
  return m ? m.length : 0;
}

function analyzePassword(pw: string) {
  const s = String(pw ?? '');

  const lengthOk = s.length >= POLICY.minLen;
  const upperOk = /[A-Z]/.test(s);
  const lowerOk = /[a-z]/.test(s);
  const digitCount = countMatches(s, /\d/g);
  const digitsOk = digitCount >= POLICY.minDigits;
  const specialCount = countMatches(s, /[^A-Za-z0-9]/g);
  const specialOk = specialCount >= POLICY.minSpecial;

  const ok = lengthOk && upperOk && lowerOk && digitsOk && specialOk;

  return {
    ok,
    lengthOk,
    upperOk,
    lowerOk,
    digitCount,
    digitsOk,
    specialCount,
    specialOk,
  };
}

function RuleRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={[
          'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold',
          ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500',
        ].join(' ')}
        aria-hidden
      >
        {ok ? '✓' : '•'}
      </span>
      <span className={ok ? 'text-emerald-700' : 'text-slate-600'}>{label}</span>
    </li>
  );
}

type TokenState = 'checking' | 'valid' | 'invalid';

export default function SetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => (searchParams?.get('token') ?? '').trim(), [searchParams]);

  const [tokenState, setTokenState] = useState<TokenState>('checking');

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const pw = useMemo(() => analyzePassword(password), [password]);
  const matchOk = password.length > 0 && password === password2;

  // ✅ Token sofort serverseitig prüfen: abgelaufen/benutzt => Formular sperren
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setTokenState('invalid');
        return;
      }

      setTokenState('checking');
      try {
        const res = await fetch(
          `/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`,
          { method: 'GET', cache: 'no-store' }
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        setTokenState(data?.valid ? 'valid' : 'invalid');
      } catch {
        if (!cancelled) setTokenState('invalid');
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const canSubmit = tokenState === 'valid' && pw.ok && matchOk && !loading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) {
      setMsg('Token fehlt. Bitte nutze den Link aus der E-Mail erneut.');
      return;
    }
    if (tokenState !== 'valid') {
      setMsg('Dieser Reset-Link ist ungültig, abgelaufen oder wurde bereits benutzt.');
      return;
    }
    if (!pw.ok) {
      setMsg('Passwort erfüllt die Anforderungen noch nicht.');
      return;
    }
    if (!matchOk) {
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
        const details = Array.isArray(data?.details) ? data.details.join(' · ') : null;
        throw new Error(details || data?.message || 'Passwort konnte nicht gesetzt werden.');
      }

      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setMsg(err?.message ?? 'Unbekannter Fehler.');
      // ✅ Token könnte inzwischen "verbraucht" sein
      setTokenState('invalid');
    } finally {
      setLoading(false);
    }
  }

  const tokenBanner =
    !token ? (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
        Token fehlt. Bitte öffne den Reset-Link aus der E-Mail erneut.
      </div>
    ) : tokenState === 'checking' ? (
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        Prüfe Reset-Link…
      </div>
    ) : tokenState === 'invalid' ? (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
        Dieser Reset-Link ist ungültig, abgelaufen oder wurde bereits benutzt. Bitte fordere einen neuen Link an.
      </div>
    ) : null;

  return (
    <>
      <h1 className="text-lg font-semibold">Neues Passwort setzen</h1>
      <p className="mt-1 text-xs text-slate-600">
        Bitte wähle ein Passwort, das alle Anforderungen erfüllt.
      </p>

      {tokenBanner}

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
            placeholder="Neues Passwort"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            disabled={tokenState !== 'valid' || loading}
          />

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="mb-2 font-semibold text-slate-700">Passwort-Anforderungen</div>
            <ul className="space-y-1">
              <RuleRow ok={pw.lengthOk} label={`Mindestens ${POLICY.minLen} Zeichen`} />
              <RuleRow ok={pw.upperOk} label="Mindestens 1 Großbuchstabe (A–Z)" />
              <RuleRow ok={pw.lowerOk} label="Mindestens 1 Kleinbuchstabe (a–z)" />
              <RuleRow ok={pw.digitsOk} label={`Mindestens ${POLICY.minDigits} Zahl (0–9)`} />
              <RuleRow
                ok={pw.specialOk}
                label={`Mindestens ${POLICY.minSpecial} Sonderzeichen (z. B. ! ? # @ _)`}
              />
            </ul>
          </div>

          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            type="password"
            autoComplete="new-password"
            placeholder="Neues Passwort wiederholen"
            value={password2}
            onChange={(ev) => setPassword2(ev.target.value)}
            disabled={tokenState !== 'valid' || loading}
          />

          {password2.length > 0 && (
            <div className="text-xs">
              {matchOk ? (
                <span className="text-emerald-700">✓ Passwörter stimmen überein</span>
              ) : (
                <span className="text-slate-600">• Passwörter stimmen noch nicht überein</span>
              )}
            </div>
          )}

          {msg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
              {msg}
            </div>
          )}

          <button
            disabled={!canSubmit}
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