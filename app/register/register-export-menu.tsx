// app/register/register-export-menu.tsx
'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import type { LawRow, Relevanz, Status } from './registerstore';
import { useLanguage } from '../components/i18n/language';

type Lang = 'de' | 'en';

type Props = {
  rows: LawRow[];
  renderErfasser: (row: LawRow) => string;
  /** Neue Drucklogik aus page.tsx (schöne Matrix-Optik) */
  onPrint?: () => void;
};

/* ----------------------------------------------------------
   Übersetzungen für CSV
---------------------------------------------------------- */

const RELEVANCE_LABEL: Record<Lang, Record<string, string>> = {
  de: { Niedrig: 'Niedrig', Mittel: 'Mittel', Hoch: 'Hoch' },
  en: { Niedrig: 'Low', Mittel: 'Medium', Hoch: 'High' },
};

const STATUS_LABEL: Record<Lang, Record<string, string>> = {
  de: {
    aktiv: 'aktiv',
    offen: 'offen',
    archiviert: 'archiviert',
    obsolet: 'obsolet',
  },
  en: {
    aktiv: 'active',
    offen: 'open',
    archiviert: 'archived',
    obsolet: 'obsolete',
  },
};

function mapRelevance(value: Relevanz | undefined, lang: Lang) {
  if (!value) return '—';
  return RELEVANCE_LABEL[lang][value] ?? value;
}

function mapStatus(value: Status | undefined, lang: Lang) {
  if (!value) return '—';
  return STATUS_LABEL[lang][value] ?? value;
}

/* ----------------------------------------------------------
   Spalten für CSV in beiden Sprachen
---------------------------------------------------------- */

const COLUMNS: Record<Lang, string[]> = {
  de: [
    'Rechtsart',
    'Kürzel',
    'Bezeichnung',
    'Themenfeld',
    'Publiziert',
    'Frist',
    'Relevanz',
    'Status',
    'Erfassung durch',
  ],
  en: [
    'Legal type',
    'Reference',
    'Title / description',
    'Topic / area',
    'Published',
    'Due date',
    'Relevance',
    'Status',
    'Captured by',
  ],
};

export default function RegisterExportMenu({
  rows,
  renderErfasser,
  onPrint,
}: Props) {
  const { language } = useLanguage();
  const lang: Lang = language === 'en' ? 'en' : 'de';

  /* ----------------------------------------------------------
     PRINT – nutzt die neue Drucklogik aus page.tsx
  ---------------------------------------------------------- */
  const handlePrint = () => {
    if (onPrint) {
      // Schöne Register-Druckansicht (gleicher Style wie Matrix)
      onPrint();
    } else if (typeof window !== 'undefined') {
      // Fallback, falls kein onPrint übergeben wurde
      window.print();
    }
  };

  /* ----------------------------------------------------------
     CSV EXPORT
  ---------------------------------------------------------- */
  const handleExportCsv = () => {
    const cols = COLUMNS[lang];

    const escape = (val: unknown) => {
      if (val == null) return '';
      const s = String(val);
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines: string[] = [];
    lines.push(cols.map(escape).join(';'));

    for (const r of rows) {
      const rel = mapRelevance(r.relevanz, lang);
      const status = mapStatus(r.status, lang);

      const row = [
        r.rechtsart ?? '',
        r.kuerzel ?? '',
        r.bezeichnung ?? '',
        r.themenfeld ?? '',
        r.publiziert ?? '',
        r.frist ?? '',
        rel,
        status,
        renderErfasser(r) ?? '',
      ];

      lines.push(row.map(escape).join(';'));
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download =
      lang === 'de'
        ? 'lextrack-compliance-kataster.csv'
        : 'lextrack-compliance-register.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ----------------------------------------------------------
     Buttons
  ---------------------------------------------------------- */

  return (
    <div className="relative">
      <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-transparent text-xs shadow-sm">
        <button
          type="button"
          className="flex items-center justify-center px-2 py-1 text-slate-600 dark:text-slate-200"
          title={lang === 'de' ? 'Register drucken' : 'Print register'}
          onClick={handlePrint}
        >
          <Printer size={18} />
        </button>

        <button
          type="button"
          className="border-l border-slate-200 px-3 py-1 text-slate-600 dark:text-slate-200"
          title={lang === 'de' ? 'CSV exportieren' : 'Export CSV'}
          onClick={handleExportCsv}
        >
          CSV
        </button>
      </div>
    </div>
  );
}
