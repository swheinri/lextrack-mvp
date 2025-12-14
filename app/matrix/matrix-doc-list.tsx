'use client';

import React from 'react';
import { useLanguage } from '../components/i18n/language';
import type { MatrixDocument, MatrixClause } from './matrixstore';

type Props = {
  docs: MatrixDocument[];
  selectedDocId: string | null;
  onSelectDoc: (id: string) => void;
};

function computeDocStats(doc: { clauses: MatrixClause[] }) {
  const total = doc.clauses.length || 0;
  const compliant = doc.clauses.filter((c) => c.status === 'compliant').length;
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
  return { total, compliant, pct };
}

export default function MatrixDocList({
  docs,
  selectedDocId,
  onSelectDoc,
}: Props) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
        {isDe
          ? 'Vorhandene Compliance Matrizen'
          : 'Existing compliance matrices'}
      </h2>

      {docs.length === 0 ? (
        <p className="text-xs text-slate-500 sm:text-sm">
          {isDe
            ? 'Es sind noch keine Compliance Matrizen angelegt. Wähle oben ein Dokument aus und lege eine Matrix an.'
            : 'No compliance matrices have been created yet. Select a document above to create one.'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {docs.map((doc) => {
            const isActive = doc.id === selectedDocId;
            const stats = computeDocStats(doc);
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => onSelectDoc(doc.id)}
                className={[
                  'flex min-w-[220px] max-w-xs flex-col rounded-xl border px-3 py-2 text-left text-xs shadow-sm transition',
                  isActive
                    ? 'border-[#009A93] bg-[#009A93]/5'
                    : 'border-slate-200 bg-white hover:border-[#009A93]/60 hover:bg-slate-50',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="line-clamp-1 font-semibold text-slate-800">
                    {doc.lawBezeichnung ||
                      (isDe ? 'Unbenanntes Dokument' : 'Untitled document')}
                  </div>
                  {doc.lawKuerzel && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {doc.lawKuerzel}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {isDe ? 'Paragraphen:' : 'Clauses:'} {stats.total} ·{' '}
                  {isDe ? 'Compliance' : 'Compliant'} {stats.pct}%
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
