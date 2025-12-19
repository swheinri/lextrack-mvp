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
  pct: number;
  avgLevel: PsoeLevel | null;
  avgScore: number;
  onTogglePsoeInfo: () => void;
};

const pillBase =
  'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium';

export default function MatrixSummaryBar({
  isDe,
  total,
  compliant,
  notFulfilled,
  na,
  pct,
  avgLevel,
  avgScore,
  onTogglePsoeInfo,
}: Props) {
  const totalLabel = isDe ? `${total} Anforderungen` : `${total} requirements`;

  // ✅ Option A: compliant wirklich nutzen
  const compliantLabel = isDe ? `Erfüllt: ${compliant}` : `Compliant: ${compliant}`;
  const pctLabel = isDe ? `Compliance: ${pct}%` : `Compliance: ${pct}%`;

  const notFulfilledLabel = isDe
    ? `Nicht erfüllt: ${notFulfilled}`
    : `Not fulfilled: ${notFulfilled}`;

  const naLabel = isDe ? `N/A: ${na}` : `N/A: ${na}`;

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

        {/* KPI-Pills */}
        <div className="flex flex-wrap gap-2">
          <span className={`${pillBase} border-slate-200 bg-slate-50 text-slate-700`}>
            {totalLabel}
          </span>

          <span className={`${pillBase} border-emerald-200 bg-emerald-50 text-emerald-700`}>
            {compliantLabel}
          </span>

          <span className={`${pillBase} border-emerald-200 bg-emerald-50 text-emerald-700`}>
            {pctLabel}
          </span>

          <span className={`${pillBase} border-rose-200 bg-rose-50 text-rose-700`}>
            {notFulfilledLabel}
          </span>

          <span className={`${pillBase} border-slate-200 bg-slate-50 text-slate-700`}>
            {naLabel}
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
