'use client';

import React from 'react';
import { useLanguage } from '../components/i18n/language';

export default function MatrixToolbar() {
  const { language } = useLanguage();
  const isDe = language === 'de';

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs sm:text-sm text-slate-700">
        {isDe ? (
          <>
            <span className="font-semibold">MVP 1:</span>{' '}
            Paragraphenstruktur, Referenzen und Evidence erfassen.
          </>
        ) : (
          <>
            <span className="font-semibold">MVP 1:</span>{' '}
            Capture clause structure, references and evidence.
          </>
        )}
      </div>

      {/* Platzhalter für spätere Filter / Ansichtsoptionen */}
      <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
        {/* Beispiel-Platzhalter, später mit echter Funktion füllen */}
        <span className="rounded-full border border-slate-300 bg-white px-2 py-1">
          {isDe ? 'Filter & Ansicht folgen in MVP 2' : 'Filters & views in MVP 2'}
        </span>
      </div>
    </section>
  );
}
