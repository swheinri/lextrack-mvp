// app/matrix/matrix-doc-list.tsx
'use client';

import React from 'react';
import { useLanguage } from '../components/i18n/language';
import type { MatrixClause, MatrixDocument, ComplianceStatus } from './matrixstore';

type Props = {
  docs: MatrixDocument[];
  selectedDocId: string | null;
  onSelectDoc: (id: string) => void;
};

type DocStats = {
  total: number;
  applicable: number; // total - na
  compliant: number;
  open: number;
  notFulfilled: number;
  na: number;
  compliancePct: number; // compliant / applicable
};

function computeDocStats(doc: { clauses: MatrixClause[] }): DocStats {
  const clauses = Array.isArray(doc.clauses) ? doc.clauses : [];
  const total = clauses.length;

  let compliant = 0;
  let open = 0;
  let notFulfilled = 0;
  let na = 0;

  for (const c of clauses) {
    const s = (c.status ?? 'open') as ComplianceStatus;
    switch (s) {
      case 'compliant':
        compliant += 1;
        break;
      case 'not_fulfilled':
        notFulfilled += 1;
        break;
      case 'not_applicable':
        na += 1;
        break;
      case 'open':
      default:
        open += 1;
        break;
    }
  }

  const applicable = Math.max(0, total - na);
  const compliancePct =
    applicable > 0 ? Math.round((compliant / applicable) * 100) : 0;

  return { total, applicable, compliant, open, notFulfilled, na, compliancePct };
}

function Chip({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium',
        className,
      ].join(' ')}
    >
      {label}
    </span>
  );
}

export default function MatrixDocList({ docs, selectedDocId, onSelectDoc }: Props) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
          {isDe ? 'Vorhandene Compliance Matrizen' : 'Existing compliance matrices'}
        </h2>
        <div className="text-[11px] text-slate-500">
          {docs.length} {isDe ? 'Dokumente' : 'documents'}
        </div>
      </div>

      {docs.length === 0 ? (
        <p className="text-xs text-slate-500 sm:text-sm">
          {isDe
            ? 'Es sind noch keine Compliance Matrizen angelegt. Wähle oben ein Dokument aus und lege eine Matrix an.'
            : 'No compliance matrices have been created yet. Select a document above to create one.'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {docs.map((doc) => {
            const isActive = doc.id === selectedDocId;
            const s = computeDocStats(doc);

            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => onSelectDoc(doc.id)}
                className={[
                  'flex min-w-[260px] max-w-[360px] flex-1 flex-col rounded-xl border bg-white px-3 py-3 text-left shadow-sm transition',
                  isActive
                    ? 'border-[#009A93] bg-[#009A93]/5'
                    : 'border-slate-200 hover:border-[#009A93]/60 hover:bg-slate-50',
                ].join(' ')}
              >
                {/* Titelzeile */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-xs font-semibold text-slate-900">
                      {doc.lawBezeichnung || (isDe ? 'Unbenanntes Dokument' : 'Untitled document')}
                    </div>
                  </div>

                  {doc.lawKuerzel ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {doc.lawKuerzel}
                    </span>
                  ) : null}
                </div>

                {/* Meta */}
                <div className="mt-1 text-[11px] text-slate-600">
                  {isDe
                    ? `Anforderungen: ${s.total} · Anwendbar: ${s.applicable} · Compliance: ${s.compliancePct}%`
                    : `Requirements: ${s.total} · Applicable: ${s.applicable} · Compliance: ${s.compliancePct}%`}
                </div>

                {/* 4-farbiger Balken: grün compliant, rot not fulfilled, gelb open, blau N/A */}
                <div
                  className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200"
                  role="img"
                  aria-label={
                    isDe
                      ? `Status-Verteilung: Erfüllt ${s.compliant}, Nicht erfüllt ${s.notFulfilled}, Offen ${s.open}, N/A ${s.na}`
                      : `Status distribution: Compliant ${s.compliant}, Not fulfilled ${s.notFulfilled}, Open ${s.open}, N/A ${s.na}`
                  }
                  title={
                    isDe
                      ? `Erfüllt: ${s.compliant} · Nicht erfüllt: ${s.notFulfilled} · Offen: ${s.open} · N/A: ${s.na}`
                      : `Compliant: ${s.compliant} · Not fulfilled: ${s.notFulfilled} · Open: ${s.open} · N/A: ${s.na}`
                  }
                >
                  <div className="flex h-full w-full">
                    {s.compliant > 0 && (
                      <span className="h-full bg-emerald-500" style={{ flex: s.compliant }} />
                    )}
                    {s.notFulfilled > 0 && (
                      <span className="h-full bg-rose-500" style={{ flex: s.notFulfilled }} />
                    )}
                    {s.open > 0 && (
                      <span className="h-full bg-amber-400" style={{ flex: s.open }} />
                    )}
                    {s.na > 0 && (
                      <span className="h-full bg-sky-400" style={{ flex: s.na }} />
                    )}
                  </div>
                </div>

                {/* Chips */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip
                    label={isDe ? `Erfüllt: ${s.compliant}` : `Compliant: ${s.compliant}`}
                    className="border-emerald-200 bg-emerald-50 text-emerald-700"
                  />
                  <Chip
                    label={isDe ? `Nicht erfüllt: ${s.notFulfilled}` : `Not fulfilled: ${s.notFulfilled}`}
                    className="border-rose-200 bg-rose-50 text-rose-700"
                  />
                  <Chip
                    label={isDe ? `Offen: ${s.open}` : `Open: ${s.open}`}
                    className="border-amber-200 bg-amber-50 text-amber-800"
                  />
                  <Chip
                    label={`N/A: ${s.na}`}
                    className="border-sky-200 bg-sky-50 text-sky-700"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}