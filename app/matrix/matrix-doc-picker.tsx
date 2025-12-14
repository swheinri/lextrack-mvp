// app/matrix/matrix-doc-picker.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../components/i18n/language';

export type MatrixStatus = 'draft' | 'in_review' | 'final';

export type MatrixDocPickerItem = {
  registerId: string;          // ID des Register-Dokuments
  matrixId: string | null;     // ID der Matrix (falls vorhanden)
  label: string;               // Anzeige-Text "2019/2025 – Titel"
  hasMatrix: boolean;
  status?: MatrixStatus;
};

type Props = {
  items: MatrixDocPickerItem[];
  selectedMatrixId: string | null;
  onChoose: (item: MatrixDocPickerItem) => void;
};

export default function MatrixDocPicker({
  items,
  selectedMatrixId,
  onChoose,
}: Props) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        i.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-start md:justify-between">
      <div className="flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {isDe ? 'Referenzdokument' : 'Reference document'}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isDe ? 'Dokument suchen …' : 'Search document…'
          }
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
        />

        <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-slate-400">
              {isDe
                ? 'Kein Dokument gefunden.'
                : 'No document found.'}
            </div>
          ) : (
            filtered.map((item) => {
              const isActive =
                item.matrixId && item.matrixId === selectedMatrixId;

              return (
                <button
                  key={item.registerId}
                  type="button"
                  onClick={() => onChoose(item)}
                  className={[
                    'flex w-full items-center justify-between px-3 py-1.5 text-left text-xs',
                    isActive
                      ? 'bg-[#009A93]/10'
                      : 'hover:bg-slate-50',
                  ].join(' ')}
                >
                  <span className="truncate">{item.label}</span>

                  <span
                    className={[
                      'ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      item.hasMatrix
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500',
                    ].join(' ')}
                  >
                    {item.hasMatrix
                      ? isDe
                        ? 'Matrix vorhanden'
                        : 'Matrix exists'
                      : isDe
                      ? 'Noch keine Matrix'
                      : 'No matrix yet'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
