// app/dashboard/compliance-matrix-summary.tsx
'use client';

import React, { useMemo } from 'react';
import { useMatrixStore } from '../matrix/matrixstore';

type MatrixClauseLike = { status?: string };
type MatrixDocLike = { clauses?: MatrixClauseLike[] };

export default function ComplianceMatrixSummary() {
  const { docs } = useMatrixStore() as { docs: MatrixDocLike[] };

  const stats = useMemo(() => {
    const matrices = docs.length;
    let clauses = 0;
    let compliant = 0;

    docs.forEach((doc) => {
      const list = doc.clauses ?? [];
      clauses += list.length;
      compliant += list.filter((c) => c.status === 'compliant').length;
    });

    const rate = clauses > 0 ? Math.round((compliant / clauses) * 100) : 0;

    return { matrices, clauses, compliant, rate };
  }, [docs]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
        COMPLIANCE MATRIX
      </div>

      {stats.matrices === 0 ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          No matrices yet.
        </p>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Matrices</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {stats.matrices}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Requirements</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {stats.clauses}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Compliant</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {stats.compliant} / {stats.clauses}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Rate</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {stats.rate}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
