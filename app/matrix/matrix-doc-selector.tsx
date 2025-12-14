// app/matrix/matrix-doc-selector.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useRegisterStore, type LawRow } from '../register/registerstore';
import { useLanguage } from '../components/i18n/language';
import { Search } from 'lucide-react';

type Props = {
  selectedLawId: string;
  onSelectedLawIdChange: (id: string) => void;
  onCreateFromLaw: () => void;
};

export default function MatrixDocSelector({
  selectedLawId,
  onSelectedLawIdChange,
  onCreateFromLaw,
}: Props) {
  const { rows } = useRegisterStore();
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [query, setQuery] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(true);

  const filteredRows = useMemo(() => {
    let list = rows as LawRow[];

    if (showOnlyActive) {
      list = list.filter(
        (r) => !r.status || r.status === 'aktiv' || r.status === 'offen',
      );
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((r) => {
        return (
          r.kuerzel.toLowerCase().includes(q) ||
          r.bezeichnung.toLowerCase().includes(q) ||
          (r.rechtsart || '').toLowerCase().includes(q) ||
          (r.themenfeld || '').toLowerCase().includes(q)
        );
      });
    }

    // leichte Sortierung: zuerst Kürzel, dann Bezeichnung
    return [...list].sort((a, b) => {
      const ak = (a.kuerzel || '').localeCompare(b.kuerzel || '', 'de');
      if (ak !== 0) return ak;
      return (a.bezeichnung || '').localeCompare(b.bezeichnung || '', 'de');
    });
  }, [rows, query, showOnlyActive]);

  const selectedLaw = filteredRows.find((r) => r.id === selectedLawId) ??
    rows.find((r) => r.id === selectedLawId) ??
    null;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      {/* Kopf + Filterzeile */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {isDe
              ? 'Regelwerk aus dem Register auswählen'
              : 'Select regulation from register'}
          </div>
          <p className="text-[11px] text-slate-600">
            {isDe
              ? 'Suche ein Regelwerk aus dem Dokumentenregister und lege dafür eine Compliance Matrix an.'
              : 'Search a regulation from the register and create a compliance matrix for it.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] text-slate-700">
            <input
              type="checkbox"
              className="h-3 w-3 rounded border-slate-300"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
            />
            <span>
              {isDe ? 'Nur offene/aktive' : 'Only open/active'}
            </span>
          </label>
        </div>
      </div>

      {/* Suchfeld */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
          placeholder={
            isDe
              ? 'Nach Kürzel, Bezeichnung oder Themenfeld suchen …'
              : 'Search by code, title or topic …'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Ergebnisliste */}
      <div className="max-h-52 overflow-auto rounded-lg border border-slate-200 bg-slate-50">
        {filteredRows.length === 0 ? (
          <div className="px-3 py-3 text-[11px] text-slate-400">
            {isDe
              ? 'Keine Regelwerke entsprechend der Filter gefunden.'
              : 'No regulations found for the current filters.'}
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 text-xs">
            {filteredRows.map((row) => {
              const active = row.id === selectedLawId;
              return (
                <li
                  key={row.id}
                  className={[
                    'cursor-pointer px-3 py-2 hover:bg-white',
                    active ? 'bg-white' : '',
                  ].join(' ')}
                  onClick={() => onSelectedLawIdChange(row.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-900">
                        {row.rechtsart
                          ? `${row.rechtsart} – ${row.kuerzel}`
                          : row.kuerzel}
                      </div>
                      <div className="text-[11px] text-slate-700">
                        {row.bezeichnung}
                      </div>
                      {row.themenfeld && (
                        <div className="mt-0.5 text-[10px] text-slate-500">
                          {row.themenfeld}
                        </div>
                      )}
                    </div>
                    {row.status && (
                      <span className="mt-0.5 inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                        {isDe ? 'Status: ' : 'Status: '}
                        <span className="ml-1 font-medium">
                          {row.status}
                        </span>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Aktion: Matrix anlegen/öffnen */}
      <div className="flex flex-col gap-1 border-t border-slate-100 pt-2 text-[11px] sm:flex-row sm:items-center sm:justify-between">
        <div className="text-slate-500">
          {selectedLaw ? (
            <>
              {isDe ? 'Ausgewähltes Regelwerk: ' : 'Selected regulation: '}
              <span className="font-semibold text-slate-800">
                {selectedLaw.kuerzel} – {selectedLaw.bezeichnung}
              </span>
            </>
          ) : (
            <span className="text-slate-400">
              {isDe
                ? 'Bitte wähle ein Regelwerk aus der Liste aus.'
                : 'Please select a regulation from the list.'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onCreateFromLaw}
          disabled={!selectedLawId}
          className={[
            'mt-1 inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[11px] font-medium',
            selectedLawId
              ? 'bg-[#009A93] text-white shadow-sm hover:bg-[#007e78]'
              : 'cursor-not-allowed bg-slate-200 text-slate-500',
          ].join(' ')}
        >
          {isDe ? 'Matrix anlegen / öffnen' : 'Create / open matrix'}
        </button>
      </div>
    </div>
  );
}
