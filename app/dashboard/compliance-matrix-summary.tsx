// app/dashboard/compliance-matrix-summary.tsx
'use client';

import React, { useMemo } from 'react';
import { useMatrixStore } from '../matrix/matrixstore';
import { useLanguage } from '../components/i18n/language';

const TEXT = {
  de: {
    matrices: 'Matrizen',
    clauses: 'Paragrafen gesamt',
    compliant: 'Compliance',
    rate: 'Erfüllungsgrad',
    empty: 'Noch keine Compliance-Matrix angelegt. Lege zunächst Matrizen im Modul „Compliance Matrix“ an.',
  },
  en: {
    matrices: 'Matrices',
    clauses: 'Clauses in total',
    compliant: 'Compliant',
    rate: 'Fulfilment rate',
    empty: 'No compliance matrix has been created yet. Please create matrices in the “Compliance Matrix” module first.',
  },
} as const;

export default function ComplianceMatrixSummary() {
  const { docs } = useMatrixStore();
  const { language } = useLanguage();
  const t = TEXT[language] ?? TEXT.de;

  const stats = useMemo(() => {
    const matrices = docs.length;
    let clauses = 0;
    let compliant = 0;

    docs.forEach((doc: any) => {
      const list = doc.clauses ?? [];
      clauses += list.length;
      compliant += list.filter((c: any) => c.status === 'compliant').length;
    });

    const rate = clauses > 0 ? Math.round((compliant / clauses) * 100) : 0;

    return { matrices, clauses, compliant, rate };
  }, [docs]);

  if (stats.matrices === 0) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t.empty}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* Matrizen */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="font-semibold tracking-wide text-slate-600 dark:text-slate-300">
          {t.matrices.toUpperCase()}
        </div>
        <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
          {stats.matrices}
        </div>
      </div>

      {/* Paragrafen gesamt */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="font-semibold tracking-wide text-slate-600 dark:text-slate-300">
          {t.clauses.toUpperCase()}
        </div>
        <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
          {stats.clauses}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {t.compliant}: {stats.compliant}
        </div>
      </div>

      {/* Erfüllungsgrad */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900 flex flex-col justify-between">
        <div>
          <div className="font-semibold tracking-wide text-slate-600 dark:text-slate-300">
            {t.rate.toUpperCase()}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {stats.rate}%
          </div>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-2 rounded-full bg-[#009A93]"
            style={{ width: `${stats.rate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
