// app/matrix/matrix-doc-picker.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../components/i18n/language';

export type MatrixStatus = 'draft' | 'in_review' | 'final';

export type MatrixDocPickerItem = {
  registerId: string;      // ID des Register-Dokuments
  matrixId: string | null; // ID der Matrix (falls vorhanden)
  label: string;           // Anzeige-Text "2019/2025 – Titel"
  hasMatrix: boolean;
  status?: MatrixStatus;
};

type Props = {
  items: MatrixDocPickerItem[];
  selectedMatrixId: string | null;
  onChoose: (item: MatrixDocPickerItem) => void;
};

function statusBadgeLabel(status: MatrixStatus | undefined, isDe: boolean): string | null {
  if (!status) return null;
  const mapDe: Record<MatrixStatus, string> = {
    draft: 'Entwurf',
    in_review: 'In Prüfung',
    final: 'Final',
  };
  const mapEn: Record<MatrixStatus, string> = {
    draft: 'Draft',
    in_review: 'In review',
    final: 'Final',
  };
  return (isDe ? mapDe : mapEn)[status];
}

export default function MatrixDocPicker({ items, selectedMatrixId, onChoose }: Props) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, q]);

  const countLabel = isDe
    ? `${filtered.length} von ${items.length}`
    : `${filtered.length} of ${items.length}`;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {isDe ? 'Referenzdokument' : 'Reference document'}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isDe ? 'Dokument suchen …' : 'Search document…'}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none transition focus:border-[#009A93] focus:ring-2 focus:ring-[#009A93]/20"
            aria-label={isDe ? 'Dokument suchen' : 'Search document'}
          />
        </div>

        <div className="pt-5 text-[11px] text-slate-400">{countLabel}</div>
      </div>

      <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-[11px] text-slate-400">
            {isDe ? 'Kein Dokument gefunden.' : 'No document found.'}
          </div>
        ) : (
          filtered.map((item) => {
            const isActive = !!item.matrixId && item.matrixId === selectedMatrixId;
            const stateLabel = statusBadgeLabel(item.status, isDe);

            return (
              <button
                key={item.registerId}
                type="button"
                onClick={() => onChoose(item)}
                className={[
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition',
                  isActive ? 'bg-[#009A93]/10' : 'hover:bg-slate-50',
                ].join(' ')}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-slate-800">{item.label}</div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {stateLabel && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {stateLabel}
                    </span>
                  )}

                  <span
                    className={[
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      item.hasMatrix
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500',
                    ].join(' ')}
                    title={
                      item.hasMatrix
                        ? isDe
                          ? 'Für dieses Dokument existiert bereits eine Matrix.'
                          : 'A matrix already exists for this document.'
                        : isDe
                        ? 'Für dieses Dokument existiert noch keine Matrix.'
                        : 'No matrix exists for this document yet.'
                    }
                  >
                    {item.hasMatrix
                      ? isDe
                        ? 'Matrix vorhanden'
                        : 'Matrix exists'
                      : isDe
                      ? 'Keine Matrix'
                      : 'No matrix'}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="text-[11px] text-slate-500">
        {isDe
          ? 'Tipp: Suche nach Kürzel oder Titel. Auswahl öffnet die Matrix (oder legt sie an).'
          : 'Tip: Search by reference code or title. Selection opens the matrix (or creates it).'}
      </div>
    </div>
  );
}