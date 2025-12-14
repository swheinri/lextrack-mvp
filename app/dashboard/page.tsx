// app/dashboard/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Info } from 'lucide-react';

import { useRegisterStore } from '../register/registerstore';
import { useMatrixStore } from '../matrix/matrixstore';
import { useTheme } from '../components/themecontext';
import { useLanguage } from '../components/i18n/language';
import {
  DashboardSettingsDialog,
  type DashboardCardKey,
} from './settings-dialog';

import {
  computeStatusCounts,
  computeDeadlineStats,
} from '../register/register-stats';

type CardKey = 'all' | 'active' | 'obsolete' | 'archived' | 'dueSoon';
type VisibleConfig = Record<CardKey, boolean>;

// ------------------ Texte DE / EN ------------------

const TEXT = {
  de: {
    title: 'Dashboard',
    subtitle:
      'Dein persönlicher Einstieg in LexTrack – fokussiert auf Dokumentenstatus, Fristen und Compliance Matrix.',

    infoTitle: 'Hilfe zum Dashboard',
    infoP1:
      'Das Dashboard zeigt dir zentrale Kennzahlen aus dem Compliance Kataster – z. B. wie viele Dokumente aktiv, obsolet oder archiviert sind.',
    infoP2:
      'Zusätzlich erhältst du einen Überblick über die Compliance-Matrix (Anzahl Matrizen, Anforderungen und Erfüllungsgrad). Über „Dashboard anpassen“ kannst du auswählen, welche Kacheln angezeigt werden.',
    infoHint:
      'Hinweis: Die Dashboard-Konfiguration wird lokal in deinem Browser gespeichert. Wenn du LexTrack auf einem anderen Gerät oder in einem anderen Browser verwendest, können die Einstellungen abweichen.',
    btnClose: 'Schließen',

    cardAll: 'Alle Dokumente',
    cardActive: 'Aktive Dokumente',
    cardObsolete: 'Obsolete Dokumente',
    cardArchived: 'Archivierte Dokumente',
    cardDueSoon: 'Fristen & Fälligkeiten',

    subtitleAllStatic: 'Im Kataster erfasste Einträge',
    subtitleActiveStatic: 'Status: aktiv',
    subtitleObsoleteStatic: 'Status: obsolet',
    subtitleArchivedStatic: 'Status: archiviert',
    subtitleDueSoonStatic: 'Auswertung auf Basis des Fristdatums',

    customizeTitle: 'CUSTOMIZE DASHBOARD',
    customizeReset: 'Zurücksetzen',
    customizeSave: 'Einstellungen speichern',
    customizeClose: 'Schließen',

    cmTitle: 'Compliance Matrix',
    cmSub:
      'Hier siehst du die ersten Kennzahlen aus der Compliance Matrix. Später können weitere KPIs als Kacheln und Diagramme ergänzt werden.',
    cmLabelMatrices: 'Matrizen',
    cmLabelClauses: 'Anforderungen gesamt',
    cmLabelCompliant: 'Compliance (erfüllt)',
    cmLabelRate: 'Erfüllungsgrad',
    cmEmpty:
      'Noch keine Compliance-Matrix angelegt. Lege zunächst Matrizen im Modul „Compliance Matrix“ an.',

    cmHelperMatrices: 'Angelegte Compliance-Matrizen',
    cmHelperClauses: 'Zuordnungen / Anforderungen über alle Matrizen',
    cmHelperCompliant: 'Davon als „Compliance“ bewertet',
    cmHelperRate: 'Anteil erfüllter Anforderungen in %',

    cmPlannedTitle: 'Geplant sind z. B.:',
    cmPlanned1: 'Erfüllungsgrad pro Norm / Standard',
    cmPlanned2: 'Offene Maßnahmen aus der Matrix',
    cmPlanned3: 'Risiko-Hotspots nach Themenfeldern',
  },
  en: {
    title: 'Dashboard',
    subtitle:
      'Your personal entry into LexTrack – focused on document status, due dates and the compliance matrix.',

    infoTitle: 'Help for dashboard',
    infoP1:
      'The dashboard shows key figures from the compliance register – for example how many documents are active, obsolete or archived.',
    infoP2:
      'In addition you get an overview of the compliance matrix (number of matrices, requirements and fulfilment level). Via “Customize dashboard” you can select which tiles are displayed.',
    infoHint:
      'Note: The dashboard configuration is stored locally in your browser. If you use LexTrack on another device or browser, the settings may differ.',
    btnClose: 'Close',

    cardAll: 'All documents',
    cardActive: 'Active documents',
    cardObsolete: 'Obsolete documents',
    cardArchived: 'Archived documents',
    cardDueSoon: 'Deadlines & due items',

    subtitleAllStatic: 'Entries recorded in the register',
    subtitleActiveStatic: 'Status: active',
    subtitleObsoleteStatic: 'Status: obsolete',
    subtitleArchivedStatic: 'Status: archived',
    subtitleDueSoonStatic: 'Based on the due date field',

    customizeTitle: 'CUSTOMIZE DASHBOARD',
    customizeReset: 'Reset',
    customizeSave: 'Save settings',
    customizeClose: 'Close',

    cmTitle: 'Compliance matrix',
    cmSub:
      'Here you see the first key figures from the compliance matrix. More KPIs and charts can be added later.',
    cmLabelMatrices: 'Matrices',
    cmLabelClauses: 'Requirements in total',
    cmLabelCompliant: 'Compliance (fulfilled)',
    cmLabelRate: 'Fulfilment rate',
    cmEmpty:
      'No compliance matrix has been created yet. Please create matrices in the “Compliance Matrix” module first.',

    cmHelperMatrices: 'Created compliance matrices',
    cmHelperClauses: 'Assigned requirements across all matrices',
    cmHelperCompliant: 'Of those marked as “Compliant”',
    cmHelperRate: 'Share of fulfilled requirements in %',

    cmPlannedTitle: 'Planned examples:',
    cmPlanned1: 'Fulfilment per standard',
    cmPlanned2: 'Open actions from the matrix',
    cmPlanned3: 'Risk hot spots per topic area',
  },
} as const;

const LS_KEY = 'lextrack_dashboard_cards_v1';

const DEFAULT_VISIBLE: VisibleConfig = {
  all: true,
  active: true,
  obsolete: false,
  archived: true,
  dueSoon: false,
};

export default function DashboardPage() {
  const { rows } = useRegisterStore();
  const { docs: matrixDocs } = useMatrixStore();

  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = TEXT[language] ?? TEXT.de;
  const isDark = theme === 'dark'; // aktuell nicht genutzt, aber ok für spätere Anpassungen

  /* ---------- Kennzahlen aus dem Kataster ---------- */

  const statusStats = useMemo(() => computeStatusCounts(rows), [rows]);
  const deadlineStats = useMemo(() => computeDeadlineStats(rows), [rows]);

  // Dynamische Subtitel, damit die 9 vs. 7 Dokumente erklärt werden
  const allSubtitle =
    language === 'de'
      ? `Aktiv: ${statusStats.aktiv} · Obsolet: ${statusStats.obsolet} · Archiviert: ${statusStats.archiviert} · Offen/ohne Status: ${
          statusStats.offen + statusStats.ohneStatus
        }`
      : `Active: ${statusStats.aktiv} · Obsolete: ${statusStats.obsolet} · Archived: ${statusStats.archiviert} · Open/without status: ${
          statusStats.offen + statusStats.ohneStatus
        }`;

  const activeSubtitle =
    language === 'de'
      ? `Dokumente mit Status „aktiv“. Zusätzlich ${statusStats.offen} offen.`
      : `Documents with status "active". Additionally ${statusStats.offen} open.`;

  const obsoleteSubtitle =
    language === 'de'
      ? `Obsolet (außer Kraft). Ohne Status: ${statusStats.ohneStatus}.`
      : `Obsolete (no longer valid). Without status: ${statusStats.ohneStatus}.`;

  const archivedSubtitle =
    language === 'de'
      ? 'Abgelegte Vorgaben, nur noch historisch relevant.'
      : 'Archived requirements, only relevant for history.';

  const dueSoonSubtitle =
    language === 'de'
      ? `Mit Frist: ${deadlineStats.mitFrist} · Fällig ≤30 Tage: ${deadlineStats.faelligIn30Tagen} · Überfällig: ${deadlineStats.ueberfaellig}`
      : `With deadline: ${deadlineStats.mitFrist} · Due ≤30 days: ${deadlineStats.faelligIn30Tagen} · Overdue: ${deadlineStats.ueberfaellig}`;

  /* ---------- Kennzahlen aus der Compliance Matrix ---------- */

  const matrixStats = useMemo(() => {
    const matrices = matrixDocs.length;
    let clauses = 0;
    let compliant = 0;

    matrixDocs.forEach((doc: any) => {
      const list = doc.clauses ?? [];
      clauses += list.length;
      compliant += list.filter((c: any) => c.status === 'compliant').length;
    });

    const rate = clauses > 0 ? Math.round((compliant / clauses) * 100) : 0;

    return { matrices, clauses, compliant, rate };
  }, [matrixDocs]);

  /* ---------- Sichtbare Kacheln (mit localStorage) ---------- */

  const [visibleCards, setVisibleCards] =
    useState<VisibleConfig>(DEFAULT_VISIBLE);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<VisibleConfig> | null;
      if (!parsed || typeof parsed !== 'object') return;

      setVisibleCards((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(visibleCards));
    } catch {
      /* ignore */
    }
  }, [visibleCards]);

  const visibleKeys = useMemo(
    () =>
      (Object.keys(visibleCards) as DashboardCardKey[]).filter(
        (k) => visibleCards[k as CardKey],
      ),
    [visibleCards]
  );

  const handleDialogChange = (keys: DashboardCardKey[]) => {
    setVisibleCards((prev) => {
      const next: VisibleConfig = { ...prev };
      (Object.keys(next) as DashboardCardKey[]).forEach((k) => {
        next[k as CardKey] = keys.includes(k);
      });
      return next;
    });
  };

  const resetConfig = () => setVisibleCards(DEFAULT_VISIBLE);

  const [showConfig, setShowConfig] = useState(false);
  const [showDashboardInfo, setShowDashboardInfo] = useState(false);

  /* ---------- Render ---------- */

  return (
    <div className="space-y-6">
      {/* Kopfbereich mit Buttons rechts auf Höhe der Headline */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {t.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={() => setShowConfig(true)}
            >
              {language === 'de' ? 'Dashboard anpassen' : 'Customize dashboard'}
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md bg-[#009A93] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:brightness-110"
              onClick={() => setShowDashboardInfo(true)}
            >
              <Info size={14} />
              <span>Info</span>
            </button>
          </div>
        </div>
      </div>

      {/* Einstellungs-Dialog */}
      <DashboardSettingsDialog
        open={showConfig}
        onClose={() => setShowConfig(false)}
        value={visibleKeys}
        onChange={handleDialogChange}
      />

      {/* Info-Modal */}
      {showDashboardInfo && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-50">
                {t.infoTitle}
              </h3>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => setShowDashboardInfo(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <p>{t.infoP1}</p>
              <p>{t.infoP2}</p>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">
                {t.infoHint}
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="rounded-md bg-[#009A93] px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
                onClick={() => setShowDashboardInfo(false)}
              >
                {t.btnClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kachelbereich (Register-Kennzahlen) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {visibleCards.all && (
          <Card
            title={t.cardAll}
            value={statusStats.gesamt}
            subtitle={allSubtitle}
          />
        )}
        {visibleCards.active && (
          <Card
            title={t.cardActive}
            value={statusStats.aktiv}
            subtitle={activeSubtitle}
          />
        )}
        {visibleCards.archived && (
          <Card
            title={t.cardArchived}
            value={statusStats.archiviert}
            subtitle={archivedSubtitle}
          />
        )}
        {visibleCards.obsolete && (
          <Card
            title={t.cardObsolete}
            value={statusStats.obsolet}
            subtitle={obsoleteSubtitle}
          />
        )}
        {visibleCards.dueSoon && (
          <Card
            title={t.cardDueSoon}
            value={deadlineStats.faelligIn30Tagen}
            subtitle={dueSoonSubtitle}
          />
        )}
      </div>

      {/* Compliance-Matrix Bereich mit Kacheln */}
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {t.cmTitle}
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {t.cmSub}
          </p>
        </div>

        {matrixStats.matrices === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.cmEmpty}
          </p>
        ) : (
          <>
            {/* Kacheln */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MatrixStatCard
                label={t.cmLabelMatrices}
                value={String(matrixStats.matrices)}
                helper={t.cmHelperMatrices}
              />
              <MatrixStatCard
                label={t.cmLabelClauses}
                value={String(matrixStats.clauses)}
                helper={t.cmHelperClauses}
              />
              <MatrixStatCard
                label={t.cmLabelCompliant}
                value={`${matrixStats.compliant} / ${matrixStats.clauses}`}
                helper={t.cmHelperCompliant}
              />
              <MatrixStatCard
                label={t.cmLabelRate}
                value={`${matrixStats.rate}%`}
                helper={t.cmHelperRate}
                showBar
                barValue={matrixStats.rate}
              />
            </div>

            {/* geplanter Ausblick wie im Screenshot */}
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <p className="mb-1 font-semibold">{t.cmPlannedTitle}</p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>{t.cmPlanned1}</li>
                <li>{t.cmPlanned2}</li>
                <li>{t.cmPlanned3}</li>
              </ul>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* ---------- Helfer-Komponenten ---------- */

function Card({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
        {title.toUpperCase()}
      </div>
      <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {subtitle}
      </div>
    </div>
  );
}

function MatrixStatCard({
  label,
  value,
  helper,
  showBar,
  barValue,
}: {
  label: string;
  value: string;
  helper: string;
  showBar?: boolean;
  barValue?: number;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        {value}
      </span>
      <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
        {helper}
      </span>

      {showBar && typeof barValue === 'number' && (
        <div className="mt-2">
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-[#009A93]"
              style={{
                width: `${Math.min(Math.max(barValue, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
