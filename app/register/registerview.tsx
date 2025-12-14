// app/register/registerview.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Info, Filter as FilterIcon, Trash2 } from 'lucide-react';
import { useRegisterStore, LawRow, Relevanz, Status } from './registerstore';
import RegisterExportMenu from './register-export-menu';
import { useLanguage } from '../components/i18n/language';

/* ---------- Typen & Übersetzungen ---------- */

type UiRole = 'erfasser' | 'bewertender' | 'reviewer' | 'approver' | 'admin';
type Lang = 'de' | 'en';

type Props = {
  role: UiRole;
  onOpen?: (row: LawRow) => void;
  onRemove?: (row: LawRow) => void;
  /** Druckfunktion aus page.tsx (neues Layout) */
  onPrint?: () => void;
};

const th =
  'text-left px-4 py-2 font-medium whitespace-nowrap text-slate-800 dark:text-slate-100';
const td = 'px-4 py-2 align-top text-slate-700 dark:text-slate-100';

const FILTER_LS_KEY = 'lextrack_register_filters_v1';

const STATUS_LABEL: Record<Lang, Record<Status, string>> = {
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

const RELEVANZ_LABEL: Record<Lang, Record<Relevanz, string>> = {
  de: {
    Niedrig: 'Niedrig',
    Mittel: 'Mittel',
    Hoch: 'Hoch',
  },
  en: {
    Niedrig: 'Low',
    Mittel: 'Medium',
    Hoch: 'High',
  },
};

/* ---------- UI-Helper ---------- */

const chip = (text: string, classes = '') => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${classes}`}
  >
    {text}
  </span>
);

const relChip = (r: Relevanz | undefined, lang: Lang) => {
  if (!r) return '—';

  const label = RELEVANZ_LABEL[lang]?.[r] ?? r;

  const styles: Record<Relevanz, string> = {
    Niedrig: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Mittel: 'bg-amber-50 text-amber-700 ring-amber-200',
    Hoch: 'bg-red-50 text-red-700 ring-red-200',
  };

  return chip(label, styles[r]);
};

const statChip = (s: Status | undefined, lang: Lang, isDark: boolean) =>
  s
    ? chip(
        STATUS_LABEL[lang]?.[s] ?? s,
        isDark
          ? 'bg-amber-500/25 text-amber-100 ring-amber-400/70'
          : 'bg-amber-50 text-amber-700 ring-amber-200',
      )
    : '—';

/* ---------- Kleines Info-Modal ---------- */

function InfoModal({ onClose }: { onClose: () => void }) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isDe
                ? 'Compliance Kataster – Hilfe'
                : 'Compliance register – help'}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {isDe
                ? 'Das Register dient als zentrales Kataster für deine Regelwerke:'
                : 'The register serves as a central catalogue for your regulatory documents:'}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold">
              {isDe ? 'Dokumentenstatus:' : 'Document status:'}
            </span>{' '}
            {isDe
              ? 'Zeigt dir, in welchem Lebenszyklusstatus sich ein Dokument befindet – z. B. aktiv, obsolet oder archiviert.'
              : 'Shows the lifecycle state of a document – e.g. active, obsolete or archived.'}
          </p>
          <p>
            <span className="font-semibold">
              {isDe ? 'Fristen:' : 'Due dates:'}
            </span>{' '}
            {isDe
              ? 'Über die Spalte „Frist“ kannst du wichtige Termine für Aktualisierungen oder Überprüfungen der Dokumente nachhalten.'
              : 'Use the “Due date” column to track important dates for document updates or reviews.'}
          </p>
          <p>
            <span className="font-semibold">
              {isDe ? 'Erfassung durch:' : 'Captured by:'}
            </span>{' '}
            {isDe
              ? 'Zeigt, wer das Dokument in LexTrack angelegt hat (optional mit Abteilung).'
              : 'Shows who created the entry in LexTrack (optionally including the department).'}
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="rounded-md bg-[#009A93] px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
            onClick={onClose}
          >
            {isDe ? 'Schließen' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Hauptkomponente ---------- */

export default function Registerview({
  role,
  onOpen,
  onRemove,
  onPrint,
}: Props) {
  const { rows } = useRegisterStore();
  const { language } = useLanguage();
  const uiLang: Lang = language === 'en' ? 'en' : 'de';

  const [showInfo, setShowInfo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const isAdmin = role === 'admin';

  const renderErfasser = (r: LawRow): string => {
    const name = [r.erfasserVorname ?? '', r.erfasserNachname ?? '']
      .filter(Boolean)
      .join(' ');
    const abt = r.erfasserAbteilung || '';
    if (!name && !abt) return '—';
    return abt ? `${name}${name ? ', ' : ''}${abt}` : name;
  };

  /* ---------- Aktive Filter ---------- */

  const [filterThemenfeld, setFilterThemenfeld] = useState<string>('alle');
  const [filterErfasser, setFilterErfasser] = useState<string>('alle');
  const [filterRelevanz, setFilterRelevanz] = useState<string>('alle');
  const [filterStatus, setFilterStatus] = useState<string>('alle');

  /* ---------- Draft-Filter im Panel ---------- */

  const [draftFilterThemenfeld, setDraftFilterThemenfeld] =
    useState<string>('alle');
  const [draftFilterErfasser, setDraftFilterErfasser] =
    useState<string>('alle');
  const [draftFilterRelevanz, setDraftFilterRelevanz] =
    useState<string>('alle');
  const [draftFilterStatus, setDraftFilterStatus] =
    useState<string>('alle');

  /* ---------- Filter aus localStorage laden ---------- */

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(FILTER_LS_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<{
        themenfeld: string;
        erfasser: string;
        relevanz: string;
        status: string;
      }>;

      if (parsed.themenfeld) setFilterThemenfeld(parsed.themenfeld);
      if (parsed.erfasser) setFilterErfasser(parsed.erfasser);
      if (parsed.relevanz) setFilterRelevanz(parsed.relevanz);
      if (parsed.status) setFilterStatus(parsed.status);
    } catch {
      // ignore
    }
  }, []);

  /* ---------- Drafts synchronisieren, wenn Panel geöffnet wird ---------- */

  useEffect(() => {
    if (showFilters) {
      setDraftFilterThemenfeld(filterThemenfeld);
      setDraftFilterErfasser(filterErfasser);
      setDraftFilterRelevanz(filterRelevanz);
      setDraftFilterStatus(filterStatus);
    }
  }, [showFilters, filterThemenfeld, filterErfasser, filterRelevanz, filterStatus]);

  /* ---------- Aktive Filter in localStorage speichern ---------- */

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      themenfeld: filterThemenfeld,
      erfasser: filterErfasser,
      relevanz: filterRelevanz,
      status: filterStatus,
    };
    try {
      localStorage.setItem(FILTER_LS_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [filterThemenfeld, filterErfasser, filterRelevanz, filterStatus]);

  /* ---------- Optionen dynamisch ableiten ---------- */

  const {
    themenfelder,
    erfasserList,
    relevanzen,
    statusList,
  }: {
    themenfelder: string[];
    erfasserList: string[];
    relevanzen: string[];
    statusList: string[];
  } = useMemo(() => {
    const tf = new Set<string>();
    const ef = new Set<string>();
    const rv = new Set<string>();
    const st = new Set<string>();

    rows.forEach((r) => {
      if (r.themenfeld) tf.add(r.themenfeld);
      const erfasst = renderErfasser(r);
      if (erfasst && erfasst !== '—') ef.add(erfasst);
      if (r.relevanz) rv.add(r.relevanz);
      if (r.status) st.add(r.status);
    });

    return {
      themenfelder: Array.from(tf).sort(),
      erfasserList: Array.from(ef).sort(),
      relevanzen: Array.from(rv).sort(),
      statusList: Array.from(st).sort(),
    };
  }, [rows]);

  /* ---------- Gefilterte Zeilen ---------- */

  const filteredRows: LawRow[] = useMemo(
    () =>
      rows.filter((r) => {
        if (filterThemenfeld !== 'alle' && r.themenfeld !== filterThemenfeld) {
          return false;
        }
        const erfasst = renderErfasser(r);
        if (filterErfasser !== 'alle' && erfasst !== filterErfasser) {
          return false;
        }
        if (filterRelevanz !== 'alle' && (r.relevanz ?? '') !== filterRelevanz) {
          return false;
        }
        if (filterStatus !== 'alle' && (r.status ?? '') !== filterStatus) {
          return false;
        }
        return true;
      }),
    [rows, filterThemenfeld, filterErfasser, filterRelevanz, filterStatus],
  );

  const hasActiveFilter =
    filterThemenfeld !== 'alle' ||
    filterErfasser !== 'alle' ||
    filterRelevanz !== 'alle' ||
    filterStatus !== 'alle';

  const resetFilters = () => {
    setFilterThemenfeld('alle');
    setFilterErfasser('alle');
    setFilterRelevanz('alle');
    setFilterStatus('alle');

    setDraftFilterThemenfeld('alle');
    setDraftFilterErfasser('alle');
    setDraftFilterRelevanz('alle');
    setDraftFilterStatus('alle');
  };

  const applyFilters = () => {
    setFilterThemenfeld(draftFilterThemenfeld);
    setFilterErfasser(draftFilterErfasser);
    setFilterRelevanz(draftFilterRelevanz);
    setFilterStatus(draftFilterStatus);
  };

  /* ---------- Zusammenfassung der aktiven Filter ---------- */

  const activeFilterChips: string[] = [];
  if (filterThemenfeld !== 'alle') {
    activeFilterChips.push(
      uiLang === 'de'
        ? `Themenfeld: ${filterThemenfeld}`
        : `Topic: ${filterThemenfeld}`,
    );
  }
  if (filterErfasser !== 'alle') {
    activeFilterChips.push(
      uiLang === 'de'
        ? `Erfasst durch: ${filterErfasser}`
        : `Captured by: ${filterErfasser}`,
    );
  }
  if (filterRelevanz !== 'alle') {
    activeFilterChips.push(
      uiLang === 'de'
        ? `Relevanz: ${filterRelevanz}`
        : `Relevance: ${filterRelevanz}`,
    );
  }
  if (filterStatus !== 'alle') {
    activeFilterChips.push(
      uiLang === 'de' ? `Status: ${filterStatus}` : `Status: ${filterStatus}`,
    );
  }

  /* ---------- Theme für Popup / Chips ableiten ---------- */

  let isDark = false;
  if (typeof document !== 'undefined') {
    isDark = document.body.dataset.theme === 'dark';
  }

  /* ---------- Render ---------- */

  return (
    <section className="space-y-3">
      {/* Kopfbereich: Titel + Info + Export + Filter */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Titel + Untertitel */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">
            {uiLang === 'de' ? 'Compliance Kataster' : 'Compliance register'}
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            {uiLang === 'de'
              ? 'Kataster für gesetzliche, normative und interne Vorgaben.'
              : 'Register for legal, normative and internal requirements.'}
          </p>
          {hasActiveFilter && (
            <div className="mt-1 flex flex-wrap gap-1">
              {activeFilterChips.map((txt) => (
                <span
                  key={txt}
                  className="inline-flex items-center gap-1 rounded-full bg-[#009A93]/5 px-2 py-0.5 text-[11px] text-[#009A93] ring-1 ring-[#009A93]/30"
                >
                  {txt}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rechts: Filter + Export + Info */}
        <div className="relative flex items-center gap-2">
          {/* Filter-Button */}
          <button
            type="button"
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs bg-white hover:bg-slate-50 ${
              hasActiveFilter
                ? 'border-[#009A93] text-[#009A93]'
                : 'border-slate-300 text-slate-700'
            }`}
            title={
              uiLang === 'de'
                ? 'Filter für das Register setzen'
                : 'Set filters for the register'
            }
            onClick={() => setShowFilters((s) => !s)}
          >
            <FilterIcon size={16} />
            <span>{uiLang === 'de' ? 'Filter' : 'Filter'}</span>
          </button>

          {/* Druck / Export */}
          <RegisterExportMenu
            rows={filteredRows}
            renderErfasser={renderErfasser}
            onPrint={onPrint}
          />

          {/* Info-Button */}
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md bg-[#009A93] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:brightness-110"
            title={
              uiLang === 'de'
                ? 'Informationen zum Register'
                : 'Information about the register'
            }
            onClick={() => setShowInfo(true)}
          >
            <Info size={14} />
            <span>{uiLang === 'de' ? 'Info' : 'Info'}</span>
          </button>

          {/* Filter-Panel */}
          {showFilters && (
            <div
              className={`absolute right-0 top-full z-30 mt-2 w-[320px] rounded-xl border text-xs shadow-xl ${
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-100'
                  : 'border-slate-200 bg-white text-slate-800'
              }`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between border-b px-3 py-2 ${
                  isDark ? 'border-slate-800' : 'border-slate-100'
                }`}
              >
                <span className="text-[11px] font-semibold tracking-wide">
                  {uiLang === 'de' ? 'SUCHFILTER' : 'SEARCH FILTERS'}
                </span>

                {hasActiveFilter && (
                  <button
                    type="button"
                    className="text-xs text-slate-400 hover:text-[#009A93]"
                    onClick={resetFilters}
                  >
                    {uiLang === 'de' ? 'Zurücksetzen' : 'Reset'}
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="space-y-3 px-3 py-3">
                {/* Themenfeld */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {uiLang === 'de' ? 'Themenfeld' : 'Topic'}
                  </label>
                  <select
                    className={`w-full rounded-md border px-2 py-1.5 text-xs shadow-sm outline-none focus:border-[#009A93] focus:ring-[#009A93]/30 ${
                      isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-100'
                        : 'border-slate-300 bg-slate-50/80 text-slate-800'
                    }`}
                    value={draftFilterThemenfeld}
                    onChange={(e) => setDraftFilterThemenfeld(e.target.value)}
                  >
                    <option value="alle">
                      {uiLang === 'de' ? 'Alle Themenfelder' : 'All topics'}
                    </option>
                    {themenfelder.map((tf) => (
                      <option key={tf} value={tf}>
                        {tf}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Erfasst durch */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {uiLang === 'de' ? 'Erfasst durch' : 'Captured by'}
                  </label>
                  <select
                    className={`w-full rounded-md border px-2 py-1.5 text-xs shadow-sm outline-none focus:border-[#009A93] focus:ring-[#009A93]/30 ${
                      isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-100'
                        : 'border-slate-300 bg-slate-50/80 text-slate-800'
                    }`}
                    value={draftFilterErfasser}
                    onChange={(e) => setDraftFilterErfasser(e.target.value)}
                  >
                    <option value="alle">
                      {uiLang === 'de' ? 'Alle Erfasser' : 'All authors'}
                    </option>
                    {erfasserList.map((ef) => (
                      <option key={ef} value={ef}>
                        {ef}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Relevanz */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {uiLang === 'de' ? 'Relevanz' : 'Relevance'}
                  </label>
                  <select
                    className={`w-full rounded-md border px-2 py-1.5 text-xs shadow-sm outline-none focus:border-[#009A93] focus:ring-[#009A93]/30 ${
                      isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-100'
                        : 'border-slate-300 bg-slate-50/80 text-slate-800'
                    }`}
                    value={draftFilterRelevanz}
                    onChange={(e) => setDraftFilterRelevanz(e.target.value)}
                  >
                    <option value="alle">
                      {uiLang === 'de'
                        ? 'Alle Relevanzen'
                        : 'All relevance levels'}
                    </option>
                    {relevanzen.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dokumentenstatus */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {uiLang === 'de'
                      ? 'Dokumentenstatus'
                      : 'Document status'}
                  </label>
                  <select
                    className={`w-full rounded-md border px-2 py-1.5 text-xs shadow-sm outline-none focus:border-[#009A93] focus:ring-[#009A93]/30 ${
                      isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-100'
                        : 'border-slate-300 bg-slate-50/80 text-slate-800'
                    }`}
                    value={draftFilterStatus}
                    onChange={(e) => setDraftFilterStatus(e.target.value)}
                  >
                    <option value="alle">
                      {uiLang === 'de' ? 'Alle Status' : 'All statuses'}
                    </option>
                    {statusList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div
                className={`flex justify-end gap-2 border-t px-3 py-2 ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/80'
                    : 'border-slate-100 bg-slate-50/80'
                }`}
              >
                <button
                  type="button"
                  className={`rounded-md border px-3 py-1.5 text-xs hover:bg-slate-100 ${
                    isDark
                      ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                  onClick={() => setShowFilters(false)}
                >
                  {uiLang === 'de' ? 'Schließen' : 'Close'}
                </button>

                <button
                  type="button"
                  className="rounded-md bg-[#009A93] px-3 py-1.5 text-xs font-medium text-white hover:brightness-110"
                  onClick={() => {
                    applyFilters();
                    setShowFilters(false);
                  }}
                >
                  {uiLang === 'de'
                    ? 'Suchkriterien speichern'
                    : 'Save filter criteria'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabelle: reines Dokumentenregister */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[#009A93] text-white">
              <th className={th}>
                {uiLang === 'de' ? 'Rechtsart' : 'Legal type'}
              </th>
              <th className={th}>
                {uiLang === 'de' ? 'Kürzel' : 'Reference'}
              </th>
              <th className={th}>
                {uiLang === 'de'
                  ? 'Bezeichnung'
                  : 'Title / description'}
              </th>
              <th className={th}>
                {uiLang === 'de' ? 'Themenfeld' : 'Topic / area'}
              </th>
              <th className={th}>
                {uiLang === 'de' ? 'Publiziert' : 'Published'}
              </th>
              <th className={th}>
                {uiLang === 'de' ? 'Frist' : 'Due date'}
              </th>
              <th className={th}>
                {uiLang === 'de' ? 'Relevanz' : 'Relevance'}
              </th>
              <th className={th}>{uiLang === 'de' ? 'Status' : 'Status'}</th>
              <th className={th}>
                {uiLang === 'de' ? 'Erfassung durch' : 'Captured by'}
              </th>
              {isAdmin && (
                <th className={th}>
                  {uiLang === 'de' ? 'Aktionen' : 'Actions'}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-slate-500 dark:text-slate-300"
                  colSpan={isAdmin ? 10 : 9}
                >
                  {uiLang === 'de'
                    ? 'Keine Einträge für die aktuelle Filterung gefunden.'
                    : 'No entries found for the current filter selection.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 hover:bg-slate-50/50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <td className={td}>{r.rechtsart || '—'}</td>
                  <td className={td}>{r.kuerzel || '—'}</td>
                  <td
                    className={`${td} cursor-pointer underline decoration-dotted`}
                    onClick={() => onOpen?.(r)}
                  >
                    {r.bezeichnung || '—'}
                  </td>
                  <td className={td}>{r.themenfeld || '—'}</td>
                  <td className={td}>{r.publiziert || '—'}</td>
                  <td className={td}>{r.frist || '—'}</td>
                  <td className={td}>{relChip(r.relevanz, uiLang)}</td>
                  <td className={td}>{statChip(r.status, uiLang, isDark)}</td>
                  <td className={td}>{renderErfasser(r)}</td>

                  {isAdmin && (
                    <td className={`${td} text-right`}>
                      <button
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        title={
                          uiLang === 'de'
                            ? 'Eintrag entfernen'
                            : 'Remove entry'
                        }
                        onClick={() => onRemove?.(r)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </section>
  );
}
