// app/reports/page.tsx
'use client';

import React, { useMemo } from 'react';
import { useRegisterStore, LawRow } from '../register/registerstore';
import NormRadarChart from './normradarchart';
import { buildNormRadarData } from './psoe-helpers';

type MaturityRow = {
  kategorie: string;
  relevant: number;
  aktiv: number;
  offen: number;
  scorePct: number;
};

function buildMaturityByCategory(rows: LawRow[]): MaturityRow[] {
  const map = new Map<string, { aktiv: number; offen: number }>();

  for (const row of rows) {
    const status = row.status;
    if (status !== 'aktiv' && status !== 'offen') continue;

    const key = row.kategorie?.trim() || 'Unkategorisiert';
    const entry = map.get(key) ?? { aktiv: 0, offen: 0 };

    if (status === 'aktiv') entry.aktiv += 1;
    else entry.offen += 1;

    map.set(key, entry);
  }

  const result: MaturityRow[] = [];
  for (const [kategorie, { aktiv, offen }] of map) {
    const relevant = aktiv + offen;
    if (!relevant) continue;
    const scorePct = Math.round((aktiv / relevant) * 100);
    result.push({ kategorie, relevant, aktiv, offen, scorePct });
  }

  result.sort((a, b) => a.kategorie.localeCompare(b.kategorie));
  return result;
}

export default function ReportsPage() {
  const { rows } = useRegisterStore();

  const maturityByCategory = useMemo(
    () => buildMaturityByCategory(rows),
    [rows]
  );

  const radarPoints = useMemo(
    () => buildNormRadarData(rows),
    [rows]
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-900">Berichte</h1>
        <p className="mt-1 text-sm text-slate-600">
          Überblick über den Reifegrad deiner Normen-Familien und Kategorien –
          basierend auf dem Register.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Reifegrad-Tabelle */}
        <section className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <header className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Reifegrad je Norm-Kategorie
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Berechnung: aktiv / (aktiv + offen) pro Kategorie.
              Einträge mit anderen Status werden nicht berücksichtigt.
            </p>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Norm-Kategorie</th>
                  <th className="px-4 py-2 font-semibold text-right">
                    Relevante Einträge
                  </th>
                  <th className="px-4 py-2 font-semibold text-right">
                    Aktiv (umgesetzt)
                  </th>
                  <th className="px-4 py-2 font-semibold text-right">Offen</th>
                  <th className="px-4 py-2 font-semibold text-right">
                    Reifegrad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {maturityByCategory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-center text-slate-500"
                    >
                      Noch keine Daten mit Status „aktiv“ oder „offen“
                      vorhanden.
                    </td>
                  </tr>
                ) : (
                  maturityByCategory.map((row) => (
                    <tr key={row.kategorie}>
                      <td className="px-4 py-2 text-slate-900">
                        {row.kategorie}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-800">
                        {row.relevant}
                      </td>
                      <td className="px-4 py-2 text-right text-emerald-600">
                        {row.aktiv}
                      </td>
                      <td className="px-4 py-2 text-right text-amber-600">
                        {row.offen}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {row.scorePct}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* PSOE-Radar */}
        <section className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <header className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              PSOE-Reifegrad je Norm-Familie
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Spinnennetz-Darstellung des Reifegrads (Skala 0–4) pro Kategorie.
              Die Berechnung basiert aktuell auf dem Verhältnis aktiv / (aktiv
              + offen) und kann später durch echte PSOE-Scores je Paragraph
              ersetzt werden.
            </p>
          </header>

          <NormRadarChart points={radarPoints} />
        </section>
      </div>
    </div>
  );
}
