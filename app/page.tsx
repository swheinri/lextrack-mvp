// app/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useRegisterStore, LawRow } from './register/registerstore';
import { useLanguage } from './components/i18n/language';
import { useMatrixStore, type MatrixStatus } from './matrix/matrixstore';
import {
  LayoutGrid,
  BarChart2,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';

import {
  computeStatusCounts,
  computeDeadlineStats,
} from './register/register-stats';

/* ---------- Typen ---------- */

type RegisterViewMode = 'cards' | 'charts' | 'mixed';

type MetricKey =
  | 'totalDocs'
  | 'activeDocs'
  | 'openDocs'
  | 'obsoleteDocs'
  | 'dueSoon'
  | 'statusDistribution'
  | 'relevanceDistribution';

/* ---------- Auswertungs-Helper ---------- */

function countByRelevance(rows: LawRow[]) {
  const base = { Niedrig: 0, Mittel: 0, Hoch: 0 };
  for (const r of rows) {
    if (!r.relevanz) continue;
    if (base[r.relevanz as keyof typeof base] != null) {
      base[r.relevanz as keyof typeof base]++;
    }
  }
  return base;
}

/* ---------- Kleine UI-Helfer ---------- */

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-slate-500">
          {hint}
        </div>
      )}
    </div>
  );
}

/* ---------- Einfaches Balkendiagramm ---------- */

function HorizontalBarChart({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: { label: string; value: number }[];
  emptyLabel: string;
}) {
  const max = items.reduce((m, x) => (x.value > m ? x.value : m), 0) || 1;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.label} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span>{it.label}</span>
                <span>{it.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-[#009a93]"
                  style={{ width: `${(it.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Einfaches Kreisdiagramm ---------- */

function PieChart({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: { label: string; value: number; color: string }[];
  emptyLabel: string;
}) {
  const total = items.reduce((sum, it) => sum + it.value, 0);
  if (total === 0) {
    return (
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{emptyLabel}</div>
      </div>
    );
  }

  let current = 0;
  const segments: string[] = [];
  items.forEach((it) => {
    const start = current;
    const slice = (it.value / total) * 360;
    const end = current + slice;
    segments.push(
      `${it.color} ${start.toFixed(1)}deg ${end.toFixed(1)}deg`,
    );
    current = end;
  });

  const gradient = `conic-gradient(${segments.join(',')})`;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      <div className="flex items-center gap-4">
        <div
          className="h-24 w-24 rounded-full border border-slate-200"
          style={{ backgroundImage: gradient }}
        />
        <div className="space-y-1 text-xs text-slate-700">
          {items.map((it) => {
            const pct = ((it.value / total) * 100).toFixed(0);
            return (
              <div key={it.label} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: it.color }}
                />
                <span>
                  {it.label} – {it.value} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===================================================================== */

export default function OverviewPage() {
  const { rows } = useRegisterStore();
  const { language } = useLanguage();
  const isDe = language === 'de';

  // matrix-daten (nur lesend)
  const { docs } = useMatrixStore();

  const [registerView, setRegisterView] =
    useState<RegisterViewMode>('mixed');
  const [metricConfigOpen, setMetricConfigOpen] = useState(false);

  const [enabledMetrics, setEnabledMetrics] = useState<
    Record<MetricKey, boolean>
  >({
    totalDocs: true,
    activeDocs: true,
    openDocs: true,
    obsoleteDocs: true,
    dueSoon: true,
    statusDistribution: true,
    relevanceDistribution: true,
  });

  const toggleMetric = (key: MetricKey) => {
    setEnabledMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const stats = useMemo(() => {
    const status = computeStatusCounts(rows);
    const deadlines = computeDeadlineStats(rows);
    const byRel = countByRelevance(rows);

    return { status, deadlines, byRel };
  }, [rows]);

  // kennzahlen aus der compliance matrix inkl. status
  const matrixStats = useMemo(() => {
    const matrixCount = docs.length;
    let totalClauses = 0;
    let compliantClauses = 0;

    const statusCounts: Record<MatrixStatus, number> = {
      draft: 0,
      in_review: 0,
      final: 0,
    };

    docs.forEach((doc: any) => {
      const clauses = doc.clauses ?? [];
      totalClauses += clauses.length;
      compliantClauses += clauses.filter(
        (c: any) => c.status === 'compliant',
      ).length;

      const rawStatus: string = doc.status ?? 'draft';
      const allowed: MatrixStatus[] = ['draft', 'in_review', 'final'];
      const status: MatrixStatus = allowed.includes(
        rawStatus as MatrixStatus,
      )
        ? (rawStatus as MatrixStatus)
        : 'draft';

      statusCounts[status] += 1;
    });

    const compliantPct =
      totalClauses > 0
        ? Math.round((compliantClauses / totalClauses) * 100)
        : 0;

    return {
      matrixCount,
      totalClauses,
      compliantClauses,
      compliantPct,
      statusCounts,
    };
  }, [docs]);

  const noDataLabel = isDe
    ? 'Noch keine Daten vorhanden.'
    : 'No data available yet.';

  const offenOhneStatus = stats.status.offen + stats.status.ohneStatus;

  return (
    <div className="space-y-6">
      {/* header-card register / kataster */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
              {isDe ? 'Register / Kataster' : 'Register / catalogue'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              {isDe
                ? 'Kennzahlen aus deinem Compliance Kataster. Später kannst du die Ansicht weiter konfigurieren.'
                : 'Key figures from your compliance register. You can configure this view further later.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* toggle view: kacheln / diagramme / mix */}
            <div className="inline-flex rounded-full border border-slate-300 bg-white p-1 text-[11px] shadow-sm">
              <button
                type="button"
                onClick={() => setRegisterView('cards')}
                className={[
                  'inline-flex items-center gap-1 rounded-full px-3 py-1.5',
                  registerView === 'cards'
                    ? 'bg-[#009a93] text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                <LayoutGrid className="h-3 w-3" />
                <span>{isDe ? 'Kacheln' : 'Cards'}</span>
              </button>
              <button
                type="button"
                onClick={() => setRegisterView('charts')}
                className={[
                  'inline-flex items-center gap-1 rounded-full px-3 py-1.5',
                  registerView === 'charts'
                    ? 'bg-[#009a93] text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                <BarChart2 className="h-3 w-3" />
                <span>{isDe ? 'Diagramme' : 'Charts'}</span>
              </button>
              <button
                type="button"
                onClick={() => setRegisterView('mixed')}
                className={[
                  'inline-flex items-center gap-1 rounded-full px-3 py-1.5',
                  registerView === 'mixed'
                    ? 'bg-[#009a93] text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                <Layers className="h-3 w-3" />
                <span>{isDe ? 'Mix' : 'Mixed'}</span>
              </button>
            </div>

            {/* kennzahlen-konfiguration */}
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-700 shadow-sm hover:bg-slate-50"
                onClick={() => setMetricConfigOpen((o) => !o)}
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span>{isDe ? 'Kennzahlen' : 'Metrics'}</span>
              </button>

              {metricConfigOpen && (
                <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-2 font-semibold">
                    {isDe ? 'Kennzahlen auswählen' : 'Select metrics'}
                  </div>
                  <div className="space-y-2 px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {isDe ? 'Kacheln' : 'Cards'}
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabledMetrics.totalDocs}
                        onChange={() => toggleMetric('totalDocs')}
                        className="h-3 w-3"
                      />
                      <span>
                        {isDe ? 'Dokumente gesamt' : 'Documents total'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabledMetrics.activeDocs}
                        onChange={() => toggleMetric('activeDocs')}
                        className="h-3 w-3"
                      />
                      <span>
                        {isDe ? 'Aktive Dokumente' : 'Active documents'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabledMetrics.openDocs}
                        onChange={() => toggleMetric('openDocs')}
                        className="h-3 w-3"
                      />
                      <span>
                        {isDe
                          ? 'Offene / ohne Status'
                          : 'Open / without status'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabledMetrics.obsoleteDocs}
                        onChange={() => toggleMetric('obsoleteDocs')}
                        className="h-3 w-3"
                      />
                      <span>
                        {isDe
                          ? 'Obsolete / archiviert'
                          : 'Obsolete / archived'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabledMetrics.dueSoon}
                        onChange={() => toggleMetric('dueSoon')}
                        className="h-3 w-3"
                      />
                      <span>
                        {isDe ? 'Fristen (30 Tage)' : 'Due (30 days)'}
                      </span>
                    </label>

                    <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {isDe ? 'Diagramme' : 'Charts'}
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabledMetrics.statusDistribution}
                        onChange={() =>
                          toggleMetric('statusDistribution')
                        }
                        className="h-3 w-3"
                      />
                      <span>
                        {isDe
                          ? 'Status-Verteilung'
                          : 'Status distribution'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabledMetrics.relevanceDistribution}
                        onChange={() =>
                          toggleMetric('relevanceDistribution')
                        }
                        className="h-3 w-3"
                      />
                      <span>
                        {isDe
                          ? 'Relevanz-Verteilung'
                          : 'Relevance distribution'}
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end border-t border-slate-100 px-3 py-2">
                    <button
                      type="button"
                      className="rounded-md bg-slate-100 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-200"
                      onClick={() => setMetricConfigOpen(false)}
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* grid: register & compliance matrix */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr,1.4fr]">
        {/* register / kataster */}
        <section className="space-y-4">
          {(registerView === 'cards' || registerView === 'mixed') && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {enabledMetrics.totalDocs && (
                <StatCard
                  label={isDe ? 'Dokumente gesamt' : 'Documents total'}
                  value={stats.status.gesamt}
                  hint={
                    isDe
                      ? `Aktiv: ${stats.status.aktiv} · Obsolet: ${stats.status.obsolet} · Archiviert: ${stats.status.archiviert} · Offen/ohne Status: ${offenOhneStatus}`
                      : `Active: ${stats.status.aktiv} · Obsolete: ${stats.status.obsolet} · Archived: ${stats.status.archiviert} · Open/without status: ${offenOhneStatus}`
                  }
                />
              )}
              {enabledMetrics.activeDocs && (
                <StatCard
                  label={isDe ? 'Aktive Dokumente' : 'Active documents'}
                  value={stats.status.aktiv}
                  hint={
                    isDe
                      ? `Mit Status „aktiv“ markiert. Offen/ohne Status: ${offenOhneStatus}.`
                      : `Marked as "active". Open/without status: ${offenOhneStatus}.`
                  }
                />
              )}
              {enabledMetrics.openDocs && (
                <StatCard
                  label={
                    isDe ? 'Offene / ohne Status' : 'Open / without status'
                  }
                  value={offenOhneStatus}
                  hint={
                    isDe
                      ? `Davon explizit „offen“: ${stats.status.offen}, ohne Status: ${stats.status.ohneStatus}.`
                      : `Of these explicitly "open": ${stats.status.offen}, without status: ${stats.status.ohneStatus}.`
                  }
                />
              )}
              {enabledMetrics.obsoleteDocs && (
                <StatCard
                  label={
                    isDe ? 'Obsolete / archiviert' : 'Obsolete / archived'
                  }
                  value={
                    stats.status.obsolet + stats.status.archiviert
                  }
                  hint={
                    isDe
                      ? 'Nicht mehr gültige oder nur noch historisch relevante Vorgaben.'
                      : 'No longer valid or only historically relevant documents.'
                  }
                />
              )}
              {enabledMetrics.dueSoon && (
                <StatCard
                  label={isDe ? 'Fristen (30 Tage)' : 'Due (30 days)'}
                  value={stats.deadlines.faelligIn30Tagen}
                  hint={
                    isDe
                      ? `Mit Frist: ${stats.deadlines.mitFrist} · Fällig ≤30 Tage: ${stats.deadlines.faelligIn30Tagen} · Überfällig: ${stats.deadlines.ueberfaellig}`
                      : `With deadline: ${stats.deadlines.mitFrist} · Due ≤30 days: ${stats.deadlines.faelligIn30Tagen} · Overdue: ${stats.deadlines.ueberfaellig}`
                  }
                />
              )}
            </div>
          )}

          {(registerView === 'charts' || registerView === 'mixed') && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {enabledMetrics.statusDistribution && (
                <PieChart
                  title={
                    isDe ? 'Status-Verteilung' : 'Status distribution'
                  }
                  items={[
                    {
                      label: isDe ? 'offen' : 'open',
                      value: stats.status.offen,
                      color: '#64748b',
                    },
                    {
                      label: isDe ? 'aktiv' : 'active',
                      value: stats.status.aktiv,
                      color: '#009a93',
                    },
                    {
                      label: isDe ? 'obsolet' : 'obsolete',
                      value: stats.status.obsolet,
                      color: '#f97316',
                    },
                    {
                      label: isDe ? 'archiviert' : 'archived',
                      value: stats.status.archiviert,
                      color: '#0f172a',
                    },
                  ].filter((it) => it.value > 0)}
                  emptyLabel={noDataLabel}
                />
              )}

              {enabledMetrics.relevanceDistribution && (
                <HorizontalBarChart
                  title={
                    isDe
                      ? 'Verteilung nach Relevanz'
                      : 'Distribution by relevance'
                  }
                  items={[
                    {
                      label: isDe ? 'Niedrig' : 'Low',
                      value: stats.byRel.Niedrig,
                    },
                    {
                      label: isDe ? 'Mittel' : 'Medium',
                      value: stats.byRel.Mittel,
                    },
                    {
                      label: isDe ? 'Hoch' : 'High',
                      value: stats.byRel.Hoch,
                    },
                  ].filter((it) => it.value > 0)}
                  emptyLabel={noDataLabel}
                />
              )}
            </div>
          )}
        </section>

        {/* compliance matrix – header + eigene kacheln wie oben */}
        <section className="space-y-3">
          {/* header-card compliance matrix */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              {isDe ? 'Compliance Matrix' : 'Compliance matrix'}
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              {isDe
                ? 'Hier siehst du erste Kennzahlen aus der Compliance Matrix. Später können weitere KPIs als Kacheln und Diagramme ergänzt werden.'
                : 'Here you see first key figures from the compliance matrix. More KPIs as cards and charts can be added later.'}
            </p>
          </div>

          {/* kachel-row + statuszeile + Kreisdiagramm */}
          {matrixStats.matrixCount > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatCard
                  label={isDe ? 'Matrizen' : 'Matrices'}
                  value={matrixStats.matrixCount}
                  hint={
                    isDe
                      ? 'Angelegte Compliance-Matrizen.'
                      : 'Created compliance matrices.'
                  }
                />
                <StatCard
                  label={
                    isDe ? 'Paragraphen gesamt' : 'Clauses in total'
                  }
                  value={matrixStats.totalClauses}
                  hint={
                    isDe
                      ? 'Anforderungen in allen Matrizen.'
                      : 'Requirements across all matrices.'
                  }
                />
                <StatCard
                  label={isDe ? 'Compliance' : 'Compliant'}
                  value={matrixStats.compliantClauses}
                  hint={
                    isDe
                      ? 'Als „compliant“ bewertete Anforderungen.'
                      : 'Requirements marked as compliant.'
                  }
                />
                <StatCard
                  label={
                    isDe ? 'Erfüllungsgrad (%)' : 'Fulfilment rate (%)'
                  }
                  value={matrixStats.compliantPct}
                  hint={
                    isDe
                      ? 'Anteil erfüllter Anforderungen in %.'
                      : 'Share of fulfilled requirements in %.'
                  }
                />
              </div>

              <p className="mt-2 text-[11px] text-slate-600">
                {isDe ? (
                  <>
                    <span className="font-semibold">Status:&nbsp;</span>
                    <span>
                      Angelegt: {matrixStats.statusCounts.draft}
                    </span>
                    {' · '}
                    <span>
                      In Bewertung: {matrixStats.statusCounts.in_review}
                    </span>
                    {' · '}
                    <span>
                      Abgeschlossen: {matrixStats.statusCounts.final}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Status:&nbsp;</span>
                    <span>
                      Draft: {matrixStats.statusCounts.draft}
                    </span>
                    {' · '}
                    <span>
                      In review: {matrixStats.statusCounts.in_review}
                    </span>
                    {' · '}
                    <span>
                      Completed: {matrixStats.statusCounts.final}
                    </span>
                  </>
                )}
              </p>

              {/* Kreisdiagramm Matrix-Status */}
              <div className="mt-3">
                <PieChart
                  title={isDe ? 'Matrixstatus' : 'Matrix status'}
                  items={[
                    {
                      label: isDe ? 'Angelegt' : 'Draft',
                      value: matrixStats.statusCounts.draft,
                      color: '#64748b',
                    },
                    {
                      label: isDe ? 'In Bewertung' : 'In review',
                      value: matrixStats.statusCounts.in_review,
                      color: '#f59e0b',
                    },
                    {
                      label: isDe ? 'Abgeschlossen' : 'Completed',
                      value: matrixStats.statusCounts.final,
                      color: '#10b981',
                    },
                  ].filter((it) => it.value > 0)}
                  emptyLabel={noDataLabel}
                />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
              {isDe
                ? 'Noch keine Compliance-Matrix angelegt. Lege zunächst Matrizen im Modul „Compliance Matrix“ an.'
                : 'No compliance matrix has been created yet. Please create matrices in the “Compliance Matrix” module first.'}
            </div>
          )}

          {/* roadmap / geplanter inhalt */}
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-sm text-slate-500">
            {isDe ? (
              <>
                <p>
                  Die Struktur ist so angelegt, dass später weitere
                  Detail-KPIs (z. B. pro Norm oder Themenfeld) ergänzt werden
                  können.
                </p>
                <p className="mt-2">Geplant sind z. B.:</p>
                <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
                  <li>Erfüllungsgrad pro Norm / Standard</li>
                  <li>Offene Maßnahmen aus der Matrix</li>
                  <li>Risiko-Hotspots nach Themenfeldern</li>
                </ul>
              </>
            ) : (
              <>
                <p>
                  The structure is prepared so that more detailed KPIs (e.g.
                  per standard or topic area) can be added later.
                </p>
                <p className="mt-2">Planned, for example:</p>
                <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
                  <li>Compliance level per standard</li>
                  <li>Open actions from the matrix</li>
                  <li>Risk hotspots by topic area</li>
                </ul>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
