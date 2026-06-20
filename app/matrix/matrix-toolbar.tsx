// app/matrix/matrix-toolbar.tsx
'use client';

import React, { useMemo } from 'react';
import { useLanguage } from '../components/i18n/language';

type ChipProps = {
  children: React.ReactNode;
};

function Chip({ children }: ChipProps) {
  return (
    <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-600">
      {children}
    </span>
  );
}

export default function MatrixToolbar() {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const copy = useMemo(() => {
    if (isDe) {
      return {
        lead: 'MVP 1:',
        text: 'Paragraphenstruktur, Referenzen und Evidence erfassen.',
        placeholder: 'Filter & Ansichten folgen in MVP 2',
      };
    }
    return {
      lead: 'MVP 1:',
      text: 'Capture clause structure, references and evidence.',
      placeholder: 'Filters & views in MVP 2',
    };
  }, [isDe]);

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-slate-700 sm:text-sm">
        <span className="font-semibold">{copy.lead}</span> {copy.text}
      </div>

      {/* Platzhalter für spätere Filter / Ansichtsoptionen */}
      <div className="flex flex-wrap items-center gap-2">
        <Chip>{copy.placeholder}</Chip>
      </div>
    </section>
  );
}