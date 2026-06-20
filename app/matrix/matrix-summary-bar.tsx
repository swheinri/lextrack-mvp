// app/matrix/matrix-summary-bar.tsx
'use client';

import React from 'react';
import type { PsoeLevel } from './matrixstore';

type Props = {
  isDe: boolean;

  total: number;
  compliant: number;
  notFulfilled: number;
  na: number;

  /**
   * Optional: Wenn der Caller es liefert, nutzen wir es.
   * Wenn nicht, berechnen wir open als Rest:
   * total - compliant - notFulfilled - na
   */
  open?: number;

  pct: number;
  avgLevel: PsoeLevel | null;
  avgScore: number;
  onTogglePsoeInfo: () => void;
};

const pillBase =
  'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium';

function clampInt(n: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const x = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 0;
  return Math.max(min, Math.min(max, x));
}

function clampPct(n: unknown): number {
  const x = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

export default function MatrixSummaryBar({
  isDe,
  total,
  compliant,
  notFulfilled,
  na,
  open,
  pct,
  avgLevel,
  avgScore,
  onTogglePsoeInfo,
}: Props) {
  const totalSafe = clampInt(total, 0);

  // Diese drei müssen “echt” sein (nicht aus total abgeleitet)
  const compliantSafe = clampInt(compliant, 0, totalSafe);
  const notFulfilledSafe = clampInt(notFulfilled, 0, totalSafe);
  const naSafe = clampInt(na, 0, totalSafe);

  // Offen: entweder vom Caller, oder als Rest berechnet
  const openDerived = totalSafe - compliantSafe - notFulfilledSafe - naSafe;
  const openSafe = clampInt(open ?? openDerived, 0, totalSafe);

  // Falls irgendwas “überläuft”, nehmen wir die Summe als Basis für den Balken,
  // damit die Anzeige nicht “kaputt” wird.
  const sum = compliantSafe + notFulfilledSafe + naSafe + openSafe;
  const denom = sum > 0 ? sum : 1;

  const wCompliant = (compliantSafe / denom) * 100;
  const wNotFulfilled = (notFulfilledSafe / denom) * 100;
  const wNa = (naSafe / denom) * 100;
  const wOpen = (openSafe / denom) * 100;

  const pctSafe = clampPct(pct);

  const totalLabel = isDe ? `${totalSafe} Anforderungen` : `${totalSafe} requirements`;
  const compliantLabel = isDe ? `Erfüllt: ${compliantSafe}` : `Compliant: ${compliantSafe}`;
  const notFulfilledLabel = isDe
    ? `Nicht erfüllt: ${notFulfilledSafe}`
    : `Not fulfilled: ${notFulfilledSafe}`;
  const naLabel = isDe ? `N/A: ${naSafe}` : `N/A: ${naSafe}`;
  const openLabel = isDe ? `Offen: ${openSafe}` : `Open: ${openSafe}`;
  const pctLabel = isDe ? `Compliance: ${pctSafe}%` : `Compliance: ${pctSafe}%`;

  const maturityText =
    avgLevel && avgScore
      ? `${avgLevel} (${avgScore.toFixed(1)})`
      : isDe
        ? 'noch nicht bewertet'
        : 'not yet assessed';

  const maturityLabel = isDe
    ? `Reifegrad (PSOE): ${maturityText}`
    : `Maturity (PSOE): ${maturityText}`;

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {isDe ? 'Kennzahlen dieser Matrix' : 'Key figures of this matrix'}
        </div>

        {/* Balken: 4-farbig (grün/rot/blau/amber) */}
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
          role="img"
          aria-label={
            isDe
              ? `Status-Verteilung: Erfüllt ${compliantSafe}, Nicht erfüllt ${notFulfilledSafe}, N/A ${naSafe}, Offen ${openSafe}`
              : `Status distribution: Compliant ${compliantSafe}, Not fulfilled ${notFulfilledSafe}, N/A ${naSafe}, Open ${openSafe}`
          }
          title={
            isDe
              ? `Erfüllt ${compliantSafe} · Nicht erfüllt ${notFulfilledSafe} · N/A ${naSafe} · Offen ${openSafe}`
              : `Compliant ${compliantSafe} · Not fulfilled ${notFulfilledSafe} · N/A ${naSafe} · Open ${openSafe}`
          }
        >
          <div className="flex h-full w-full">
            <div className="h-full bg-emerald-500" style={{ width: `${wCompliant}%` }} />
            <div className="h-full bg-rose-500" style={{ width: `${wNotFulfilled}%` }} />
            <div className="h-full bg-sky-500" style={{ width: `${wNa}%` }} />
            <div className="h-full bg-amber-500" style={{ width: `${wOpen}%` }} />
          </div>
        </div>

        {/* KPI-Pills */}
        <div className="flex flex-wrap gap-2">
          <span className={`${pillBase} border-slate-200 bg-slate-50 text-slate-700`}>
            {totalLabel}
          </span>

          <span className={`${pillBase} border-emerald-200 bg-emerald-50 text-emerald-700`}>
            {compliantLabel}
          </span>

          <span className={`${pillBase} border-rose-200 bg-rose-50 text-rose-700`}>
            {notFulfilledLabel}
          </span>

          <span className={`${pillBase} border-sky-200 bg-sky-50 text-sky-700`}>
            {naLabel}
          </span>

          <span className={`${pillBase} border-amber-200 bg-amber-50 text-amber-800`}>
            {openLabel}
          </span>

          <span className={`${pillBase} border-slate-200 bg-slate-50 text-slate-700`}>
            {pctLabel}
          </span>

          {/* PSOE-Reifegrad + Info-Toggle */}
          <button
            type="button"
            onClick={onTogglePsoeInfo}
            className={`${pillBase} border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300`}
          >
            {maturityLabel}
            <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-sky-400 text-[10px]">
              i
            </span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          {isDe
            ? 'Lege neue Anforderungen an oder bearbeite bestehende Einträge unten in der Tabelle.'
            : 'Add new requirements or edit existing entries in the table below.'}
        </p>
      </div>
    </section>
  );
}