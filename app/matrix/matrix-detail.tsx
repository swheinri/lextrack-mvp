// app/matrix/matrix-detail.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../components/i18n/language';
import MatrixAttachments from './matrix-attachments';

import {
  useMatrixStore,
  type MatrixClause,
  type ComplianceStatus,
  type PsoeLevel,
  type InternalManualRef,
  type ProcessRef,
  type MatrixStatus,
} from './matrixstore';
import { Trash2, Printer, Filter } from 'lucide-react';

/* ---------- Hilfsfunktionen ---------- */

function buildRef(
  c: MatrixClause & { refLevel1?: string; refLevel2?: string; refLevel3?: string },
): string {
  const parts: string[] = [];
  if (c.refLevel1) parts.push(c.refLevel1);
  if (c.refLevel2) parts.push(c.refLevel2);
  if (c.refLevel3) parts.push(c.refLevel3);
  return parts.join(' ');
}

function buildTitle(
  c: MatrixClause & { titleLevel1?: string; titleLevel2?: string; titleLevel3?: string },
): string {
  const parts: string[] = [];
  if (c.titleLevel1) parts.push(c.titleLevel1);
  if (c.titleLevel2) parts.push(c.titleLevel2);
  if (c.titleLevel3) parts.push(c.titleLevel3);
  return parts.join(' – ');
}

/** Kurz-Label für verknüpfte Manuals (Interne Dokumente / Handbücher) */
function manualsLabelForClause(c: MatrixClause, _isDe: boolean): string {
  const refs = c.internalRefs ?? [];

  // Pro Referenz eine Zeile: "MOE 1.2.3 – Kurzbeschreibung"
  const lines = refs
    .map((r) => {
      const parts: string[] = [];

      if (r.exposition) parts.push(r.exposition); // z.B. MOE / CAME
      if (r.chapter) parts.push(r.chapter); // z.B. 1.2.3

      const head = parts.join(' '); // "MOE 1.2.3"

      if (r.description) {
        return head ? `${head} – ${r.description}` : r.description;
      }

      return head;
    })
    .filter(Boolean) as string[];

  if (lines.length === 0) return '–';

  const unique = Array.from(new Set(lines));
  return unique.join('\n');
}

/** Kurz-Label für verknüpfte Prozesse / Formulare */
function processLabelForClause(c: MatrixClause, _isDe: boolean): string {
  const refs = c.processRefs ?? [];

  // Pro Prozess/Form eine Zeile: "VA 2345 / Dok.ABC – Prozesstitel"
  const lines = refs
    .map((r) => {
      let head = '';

      if (r.processNumber) {
        head = r.processNumber; // z.B. VA 2345
      }

      if (r.formRef) {
        head = head ? `${head} / ${r.formRef}` : r.formRef; // "VA 2345 / Dok.ABC"
      }

      if (r.processTitle) {
        head = head ? `${head} – ${r.processTitle}` : r.processTitle;
      }

      return head;
    })
    .filter(Boolean) as string[];

  if (lines.length === 0) return '–';

  return lines.join('\n');
}

function statusLabel(status: ComplianceStatus, isDe: boolean): string {
  if (isDe) {
    switch (status) {
      case 'not_applicable':
        return 'Nicht zutreffend';
      case 'not_fulfilled':
        return 'Nicht erfüllt';
      case 'compliant':
        return 'Compliance';
    }
  } else {
    switch (status) {
      case 'not_applicable':
        return 'Not applicable';
      case 'not_fulfilled':
        return 'Not fulfilled';
      case 'compliant':
        return 'Compliant';
    }
  }
  return isDe ? 'Unbekannt' : 'Unknown';
}

function statusColorClasses(status: ComplianceStatus): string {
  switch (status) {
    case 'compliant':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'not_fulfilled':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'not_applicable':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

/* ---------- Matrix-Status (Dokumentenstatus) ---------- */

function matrixStatusLabel(status: MatrixStatus, isDe: boolean): string {
  if (isDe) {
    switch (status) {
      case 'draft':
        return 'Angelegt';
      case 'in_review':
        return 'In Bewertung';
      case 'final':
        return 'Abgeschlossen';
    }
  } else {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'in_review':
        return 'In review';
      case 'final':
        return 'Completed';
    }
  }
  return isDe ? 'Unbekannt' : 'Unknown';
}

function matrixStatusColorClasses(status: MatrixStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'in_review':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'final':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

/* ---------- PSOE Helper ---------- */

const PSOE_SCORE: Record<PsoeLevel, number> = {
  P: 1,
  S: 2,
  O: 3,
  E: 4,
};

function psoeLabel(level: PsoeLevel, isDe: boolean): string {
  if (isDe) {
    switch (level) {
      case 'P':
        return 'Present (P) – Grundlagen vorhanden';
      case 'S':
        return 'Suitable (S) – geeignet / passend';
      case 'O':
        return 'Operational (O) – im Betrieb';
      case 'E':
        return 'Effective (E) – wirksam / effizient';
    }
  }
  switch (level) {
    case 'P':
      return 'Present (P) – basic presence';
    case 'S':
      return 'Suitable (S) – fit for purpose';
    case 'O':
      return 'Operational (O) – in operation';
    case 'E':
      return 'Effective (E) – effective & efficient';
  }
  return isDe ? 'Unbekannt' : 'Unknown';
}

/* ---------- kleine ID-Hilfe für Referenzen ---------- */

function createLocalId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/* ---------- Props ---------- */

type Props = {
  selectedDocId: string | null;
};

/* =================================================================== */

export default function MatrixDetail({ selectedDocId }: Props) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // PSOE-Modal
  const [psoeModalClause, setPsoeModalClause] = useState<MatrixClause | null>(null);
  const [psoeSelection, setPsoeSelection] = useState<PsoeLevel | null>(null);

  // Info-Box für PSOE
  const [showPsoeInfo, setShowPsoeInfo] = useState(false);

  const { docs, addClause, updateClause, removeClause, removeDoc, updateDocStatus } =
    useMatrixStore();

  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'all'>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [pendingStatusFilter, setPendingStatusFilter] =
    useState<ComplianceStatus | 'all'>('all');

  const doc = useMemo(
    () => docs.find((d) => d.id === selectedDocId) ?? null,
    [docs, selectedDocId],
  );

  const clauses = doc?.clauses ?? [];

  /* ---------- Filter + Sortierung ---------- */

  const filteredClauses = useMemo(() => {
    const base = clauses;
    if (!base || base.length === 0) return [];

    let list = base;
    if (statusFilter !== 'all') {
      list = base.filter((c) => c.status === statusFilter);
    }

    return [...list].sort((a, b) => {
      const aRef = buildRef(a as any);
      const bRef = buildRef(b as any);
      const aHasRef = !!aRef;
      const bHasRef = !!bRef;

      if (aHasRef && !bHasRef) return -1;
      if (!aHasRef && bHasRef) return 1;
      if (!aHasRef && !bHasRef) return 0;

      return aRef.localeCompare(bRef, 'de');
    });
  }, [clauses, statusFilter]);

  const selectedClause =
    filteredClauses.find((c) => c.id === selectedClauseId) ??
    clauses.find((c) => c.id === selectedClauseId) ??
    null;

  const stats = useMemo(() => {
    const total = clauses.length;
    const compliant = clauses.filter((c) => c.status === 'compliant').length;
    const notFulfilled = clauses.filter((c) => c.status === 'not_fulfilled').length;
    const na = clauses.filter((c) => c.status === 'not_applicable').length;
    const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
    return { total, compliant, notFulfilled, na, pct };
  }, [clauses]);

  // PSOE-Matrix-Reifegrad
  const psoeStats = useMemo(() => {
    const withLevel = clauses.filter(
      (c): c is MatrixClause & { psoeLevel: PsoeLevel } => !!c.psoeLevel,
    );

    if (withLevel.length === 0) {
      return { avgScore: 0, avgLevel: null as PsoeLevel | null };
    }

    const sum = withLevel.reduce((acc, c) => acc + PSOE_SCORE[c.psoeLevel], 0);
    const avgScore = sum / withLevel.length;

    const levels: PsoeLevel[] = ['P', 'S', 'O', 'E'];
    let best: PsoeLevel = 'P';
    let bestDiff = Infinity;
    for (const lvl of levels) {
      const diff = Math.abs(PSOE_SCORE[lvl] - avgScore);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = lvl;
      }
    }

    return { avgScore, avgLevel: best };
  }, [clauses]);

  const selectedAttachmentCount =
    selectedClause ? attachmentCounts[selectedClause.id] ?? 0 : 0;

  /* ---------- Handler: allgemeine Clause-Änderungen ---------- */

  function handleAddClause() {
    if (!doc) return;
    addClause(doc.id);
  }

  function handleStatusChange(clause: MatrixClause, status: ComplianceStatus) {
    if (!doc) return;
    updateClause(doc.id, clause.id, { status });
  }

  function handleClauseChange(clause: MatrixClause, patch: Partial<MatrixClause>) {
    if (!doc) return;
    updateClause(doc.id, clause.id, patch);
  }

  function handleDeleteClause(clause: MatrixClause) {
    if (!doc) return;
    if (
      !window.confirm(
        isDe ? 'Paragraph wirklich löschen?' : 'Really delete this clause?',
      )
    )
      return;
    removeClause(doc.id, clause.id);
    if (selectedClauseId === clause.id) {
      setSelectedClauseId(null);
    }
  }

  function openDeleteModal() {
    if (!doc) return;
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
  }

  function confirmDeleteDoc() {
    if (!doc) return;
    removeDoc(doc.id);
    setSelectedClauseId(null);
    setShowDeleteModal(false);
  }

  // Matrix-Status ändern
  function handleMatrixStatusChange(newStatus: MatrixStatus) {
    if (!doc) return;
    updateDocStatus(doc.id, newStatus);
  }

  function openPsoeModal(clause: MatrixClause) {
    setPsoeModalClause(clause);
    setPsoeSelection(clause.psoeLevel ?? null);
  }

  function closePsoeModal() {
    setPsoeModalClause(null);
    setPsoeSelection(null);
  }

  function savePsoeLevel() {
    if (!doc || !psoeModalClause || !psoeSelection) return;
    updateClause(doc.id, psoeModalClause.id, { psoeLevel: psoeSelection });
    closePsoeModal();
  }

  /* ---------- Handler: strukturierte Evidence-Referenzen ---------- */

  function addInternalRef(clause: MatrixClause) {
    if (!doc) return;
    const current = clause.internalRefs ?? [];
    const next: InternalManualRef[] = [
      ...current,
      {
        id: createLocalId('iref'),
        exposition: '',
        chapter: '',
        description: '',
      },
    ];
    updateClause(doc.id, clause.id, { internalRefs: next });
  }

  function updateInternalRef(
    clause: MatrixClause,
    refId: string,
    patch: Partial<InternalManualRef>,
  ) {
    if (!doc) return;
    const current = clause.internalRefs ?? [];
    const next = current.map((r) => (r.id === refId ? { ...r, ...patch } : r));
    updateClause(doc.id, clause.id, { internalRefs: next });
  }

  function removeInternalRef(clause: MatrixClause, refId: string) {
    if (!doc) return;
    const current = clause.internalRefs ?? [];
    const next = current.filter((r) => r.id !== refId);
    updateClause(doc.id, clause.id, { internalRefs: next });
  }

  function addProcessRef(clause: MatrixClause) {
    if (!doc) return;
    const current = clause.processRefs ?? [];
    const next: ProcessRef[] = [
      ...current,
      {
        id: createLocalId('pref'),
        processNumber: '',
        processTitle: '',
        formRef: '',
      },
    ];
    updateClause(doc.id, clause.id, { processRefs: next });
  }

  function updateProcessRef(
    clause: MatrixClause,
    refId: string,
    patch: Partial<ProcessRef>,
  ) {
    if (!doc) return;
    const current = clause.processRefs ?? [];
    const next = current.map((r) => (r.id === refId ? { ...r, ...patch } : r));
    updateClause(doc.id, clause.id, { processRefs: next });
  }

  function removeProcessRef(clause: MatrixClause, refId: string) {
    if (!doc) return;
    const current = clause.processRefs ?? [];
    const next = current.filter((r) => r.id !== refId);
    updateClause(doc.id, clause.id, { processRefs: next });
  }

        /* ---------- Drucken ---------- */

  function handlePrint() {
    if (!doc) return;

    const today = new Date();
    const dateStr = today.toLocaleDateString(isDe ? 'de-DE' : 'en-GB');
    const timeStr = today.toLocaleTimeString(isDe ? 'de-DE' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Matrixstatus (für Meta-Zeile)
    const matrixStatus: MatrixStatus = (doc.status ?? 'draft') as MatrixStatus;

    // PSOE-Gesamt-Reifegrad für den Report
    const psoeSummary = (() => {
      if (!psoeStats.avgLevel) {
        return isDe
          ? 'PSOE-Reifegrad: – (keine Bewertungen vorhanden)'
          : 'PSOE maturity: – (no ratings yet)';
      }
      const scoreStr = psoeStats.avgScore.toFixed(1);
      return isDe
        ? `PSOE-Reifegrad gesamt: ${psoeStats.avgLevel} (${scoreStr} / 4)`
        : `Overall PSOE maturity: ${psoeStats.avgLevel} (${scoreStr} / 4)`;
    })();

    // Meta-Zeile unter dem Titel (Rechtsart, Kürzel, Themenfeld, Matrixstatus)
    const metaParts: string[] = [];
    const lawRechtsart = (doc as any).lawRechtsart as string | undefined;
    const lawThemenfeld = (doc as any).lawThemenfeld as string | undefined;

    if (lawRechtsart) {
      metaParts.push(
        `${isDe ? 'Rechtsart' : 'Type'}: ${lawRechtsart}`,
      );
    }
    if (doc.lawKuerzel) {
      metaParts.push(
        `${isDe ? 'Kürzel' : 'Code'}: ${doc.lawKuerzel}`,
      );
    }
    if (lawThemenfeld) {
      metaParts.push(
        `${isDe ? 'Themenfeld' : 'Topic'}: ${lawThemenfeld}`,
      );
    }
    metaParts.push(
      `${isDe ? 'Matrixstatus' : 'Matrix status'}: ${matrixStatusLabel(matrixStatus, isDe)}`,
    );
    const metaLine = metaParts.join(' · ');

    // KPI-Zeile (Kennzahlen der Matrix)
    const summaryLine = isDe
      ? `Anforderungen: ${stats.total} · Compliance: ${stats.pct}% · Nicht erfüllt: ${stats.notFulfilled} · N/A: ${stats.na}`
      : `Requirements: ${stats.total} · Compliant: ${stats.pct}% · Not fulfilled: ${stats.notFulfilled} · N/A: ${stats.na}`;

    const rowsHtml = clauses
      .map((c) => {
        const ref = buildRef(c as any) || '—';
        const title = buildTitle(c as any) || '—';
        const status = statusLabel(c.status, isDe);

        // statt nur der Anzahl: die echten Labels wie in der UI
        const manualsLabel = manualsLabelForClause(c, isDe) || '–';
        const processLabel = processLabelForClause(c, isDe) || '–';

        const fileCount = attachmentCounts[c.id] ?? 0;
        const hasText = !!c.evidenceNote?.trim();
        const hasFiles = fileCount > 0;

        let evidenceLabel: string;
        if (!hasText && !hasFiles) {
          evidenceLabel = isDe ? 'Evidence fehlt' : 'Evidence missing';
        } else {
          const parts: string[] = [];
          if (hasText) parts.push(isDe ? 'Text' : 'Text');
          if (hasFiles) {
            parts.push(
              isDe
                ? `${fileCount} Datei${fileCount === 1 ? '' : 'en'}`
                : `${fileCount} file${fileCount === 1 ? '' : 's'}`,
            );
          }
          evidenceLabel = parts.join(' · ');
        }

        const maturity = c.psoeLevel ?? '—';

        return `
          <tr>
            <td>${ref}</td>
            <td>${title}</td>
            <td>${status}</td>
            <td>${manualsLabel.replace(/\n/g, '<br/>')}</td>
            <td>${processLabel.replace(/\n/g, '<br/>')}</td>
            <td>${evidenceLabel}</td>
            <td style="text-align:center;">${maturity}</td>
          </tr>
        `;
      })
      .join('');

    const titleLine =
      doc.lawKuerzel && doc.lawBezeichnung
        ? `${doc.lawKuerzel} – ${doc.lawBezeichnung}`
        : doc.lawBezeichnung ||
          doc.lawKuerzel ||
          (isDe ? 'Compliance-Matrix' : 'Compliance matrix');

    const html = `
<!DOCTYPE html>
<html lang="${isDe ? 'de' : 'en'}">
<head>
  <meta charset="utf-8" />
  <title>LexTrack – ${titleLine}</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    body { margin: 24px; font-size: 11px; color: #111827; background:#f3f4f6; }
    h1 { font-size: 16px; margin: 0 0 2px 0; }
    h2 { font-size: 12px; margin: 0 0 4px 0; font-weight: 500; color: #4b5563; }
    .page {
      max-width: 980px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      padding: 16px 20px 18px 20px;
      box-shadow: 0 0 0 1px #e5e7eb;
    }
    .topbar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
    .brand { font-size:10px; color:#6b7280; }
    .psoe-summary {
      font-size:10px;
      color:#2563eb;
      margin-top:4px;
      display:inline-flex;
      align-items:center;
      padding:2px 8px;
      border-radius:999px;
      border:1px solid #bfdbfe;
      background:#eff6ff;
    }
    .meta-line { font-size:9px; color:#6b7280; margin-bottom:4px; }
    .summary-line {
      margin-top:4px;
      margin-bottom:8px;
      font-size:9px;
      color:#374151;
      display:inline-block;
      padding:4px 8px;
      border-radius:999px;
      background:#f9fafb;
      border:1px solid #e5e7eb;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th, td { border: 1px solid #d1d5db; padding: 4px 6px; vertical-align: top; }
    th { background:#f3f4f6; font-weight:600; text-align:left; }
    tfoot td { border:none; font-size:9px; color:#6b7280; padding-top:12px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="topbar">
      <div>
        <div class="brand">LexTrack – Die Compliance Suite</div>
        <h1>${titleLine}</h1>
        <h2>${isDe ? 'Compliance-Matrix' : 'Compliance matrix'}</h2>
        <div class="meta-line">${metaLine}</div>
        <div class="psoe-summary">${psoeSummary}</div>
        <div class="summary-line">${summaryLine}</div>
      </div>
      <div style="text-align:right; font-size:10px; color:#6b7280;">
        <div>${isDe ? 'Ausgedruckt am' : 'Printed on'} ${dateStr}</div>
        <div>${timeStr}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:70px;">${isDe ? 'Referenz' : 'Reference'}</th>
          <th>${isDe ? 'Titel' : 'Title'}</th>
          <th style="width:80px;">${isDe ? 'Status' : 'Status'}</th>
          <th style="width:160px;">${isDe ? 'Manuals' : 'Manuals'}</th>
          <th style="width:180px;">${isDe ? 'Prozesse / Doks.' : 'Processes / docs'}</th>
          <th style="width:140px;">${isDe ? 'Evidence' : 'Evidence'}</th>
          <th style="width:60px;">${isDe ? 'Reifegrad' : 'Maturity'}</th>
        </tr>
      </thead>
      <tbody>
        ${
          rowsHtml ||
          `
          <tr>
            <td colspan="7" style="text-align:center; color:#9ca3af;">
              ${
                isDe
                  ? 'Keine Anforderungen erfasst.'
                  : 'No requirements recorded.'
              }
            </td>
          </tr>`
        }
      </tbody>
    </table>

    <table>
      <tfoot>
        <tr>
          <td>
            © 2025 LexTrack – Regulatory Intelligence &amp; Compliance
          </td>
          <td style="text-align:right;">
            ${isDe ? 'Intern' : 'Internal'}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="text-align:right; font-size:8px; padding-top:2px; color:#9ca3af;">
            ${isDe ? 'Generiert mit LexTrack Compliance Suite' : 'Generated with LexTrack Compliance Suite'}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }



  /* ================================================================= */

  if (!doc) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-sm text-slate-500">
        {isDe ? (
          <p>
            Wähle links ein Dokument aus oder lege eine neue Compliance Matrix
            an, um Paragraphen zu erfassen und zu bewerten.
          </p>
        ) : (
          <p>
            Select a document on the left or create a new compliance matrix to
            add and assess clauses.
          </p>
        )}
      </div>
    );
  }

  const matrixStatus: MatrixStatus = (doc.status ?? 'draft') as MatrixStatus;

  return (
    <>
      <div className="space-y-4">
        {/* Kopf: Dokument + Matrixstatus + Icon-Leiste */}
        <div className="relative flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-slate-900">
              {doc.lawBezeichnung ||
                (isDe ? 'Unbenanntes Dokument' : 'Untitled')}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                {doc.lawKuerzel
                  ? `${isDe ? 'Regelwerk' : 'Regulation'}: ${doc.lawKuerzel}`
                  : isDe
                  ? 'Ohne Kürzel'
                  : 'No code'}
              </span>

              <div
                className={[
                  'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px]',
                  matrixStatusColorClasses(matrixStatus),
                ].join(' ')}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide">
                  {isDe ? 'Matrixstatus' : 'Matrix status'}
                </span>
                <select
                  className="bg-transparent text-[11px] font-medium focus:outline-none"
                  value={matrixStatus}
                  onChange={(e) =>
                    handleMatrixStatusChange(e.target.value as MatrixStatus)
                  }
                >
                  {(['draft', 'in_review', 'final'] as MatrixStatus[]).map(
                    (s) => (
                      <option key={s} value={s} className="text-slate-900">
                        {matrixStatusLabel(s, isDe)}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => {
                setPendingStatusFilter(statusFilter);
                setShowFilterPanel((prev) => !prev);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50"
              title={isDe ? 'Filter einstellen' : 'Set filters'}
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50"
              title={isDe ? 'Matrix drucken' : 'Print matrix'}
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={openDeleteModal}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
              title={isDe ? 'Matrix löschen' : 'Delete matrix'}
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {showFilterPanel && (
              <div className="absolute right-4 top-12 z-30 w-64 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {isDe ? 'Filter Status' : 'Filter status'}
                </div>

                <div className="space-y-1.5 px-3 py-3">
                  {(
                    ['all', 'compliant', 'not_fulfilled', 'not_applicable'] as const
                  ).map((s) => {
                    const active = pendingStatusFilter === s;
                    const label =
                      s === 'all'
                        ? isDe
                          ? 'Alle'
                          : 'All'
                        : statusLabel(s as ComplianceStatus, isDe);

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setPendingStatusFilter(
                            s as ComplianceStatus | 'all',
                          )
                        }
                        className={[
                          'flex w-full items-center justify-between rounded-full border px-3 py-1.5 text-[11px]',
                          active
                            ? 'border-[#009A93] bg-[#009A93] text-white'
                            : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-white',
                        ].join(' ')}
                      >
                        <span>{label}</span>
                        {active && (
                          <span className="h-4 w-4 rounded-full border border-white bg-white/30" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setShowFilterPanel(false)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {isDe ? 'Abbrechen' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter(pendingStatusFilter);
                      setShowFilterPanel(false);
                    }}
                    className="rounded-md bg-[#009A93] px-3 py-1 text-[11px] font-medium text-white hover:bg-[#007e78]"
                  >
                    {isDe ? 'Übernehmen' : 'Apply'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kennzahlenblock (inline) */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-semibold uppercase tracking-wide text-slate-500">
              {isDe ? 'Kennzahlen dieser Matrix' : 'Metrics of this matrix'}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                {isDe ? 'Anforderungen: ' : 'Requirements: '}{' '}
                <span className="ml-1 font-semibold">{stats.total}</span>
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                {isDe ? 'Compliance: ' : 'Compliant: '}{' '}
                <span className="ml-1 font-semibold">{stats.pct}%</span>
              </span>
              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
                {isDe ? 'Nicht erfüllt: ' : 'Not fulfilled: '}{' '}
                <span className="ml-1 font-semibold">{stats.notFulfilled}</span>
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                N/A:{' '}
                <span className="ml-1 font-semibold">
                  {stats.na}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowPsoeInfo((prev) => !prev)}
                className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-100"
              >
                <span>
                  {isDe ? 'Reifegrad (PSOE): ' : 'Maturity (PSOE): '}
                  {psoeStats.avgLevel
                    ? psoeLabel(psoeStats.avgLevel, isDe)
                    : isDe
                      ? 'Noch nicht bewertet'
                      : 'Not assessed yet'}
                </span>
                <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full border border-sky-400 text-[10px]">
                  i
                </span>
              </button>
            </div>
            <p className="mt-2 text-slate-500">
              {isDe
                ? 'Lege neue Anforderungen an oder bearbeite bestehende Einträge unten in der Tabelle.'
                : 'Add new requirements or edit existing entries in the table below.'}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddClause}
              className="inline-flex items-center rounded-full bg-[#009A93] px-4 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-[#007e78]"
            >
              + {isDe ? 'Anforderung hinzufügen' : 'Add requirement'}
            </button>
          </div>
        </div>

        {/* PSOE Info-Box */}
        {showPsoeInfo && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[11px] text-slate-800">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              {/* Linke Spalte: Erklärung + Definitionen */}
              <div className="md:flex-1">
                <div className="font-semibold text-slate-900">
                  {isDe ? 'PSOE-Reifegrade' : 'PSOE maturity levels'}
                </div>
                <p className="mt-1 text-slate-700">
                  {isDe
                    ? 'PSOE beschreibt den Reifegrad von Systemen und Prozessen – von ersten Grundlagen bis zur nachweislich wirksamen Umsetzung.'
                    : 'PSOE describes the maturity of systems and processes – from basic foundations to demonstrably effective operation.'}
                </p>
                <ul className="mt-2 list-disc space-y-0.5 pl-4">
                  <li>
                    <strong>P – Present:</strong>{' '}
                    {isDe
                      ? 'Grundbewusstsein und minimale Strukturen sind vorhanden.'
                      : 'Basic awareness and minimal structures are present.'}
                  </li>
                  <li>
                    <strong>S – Suitable:</strong>{' '}
                    {isDe
                      ? 'Systeme/Prozesse sind grundsätzlich geeignet und für den Zweck validiert.'
                      : 'Systems/processes are suitable and validated for their intended purpose.'}
                  </li>
                  <li>
                    <strong>O – Operational:</strong>{' '}
                    {isDe
                      ? 'Systeme/Prozesse laufen stabil im Regelbetrieb unter typischen Bedingungen.'
                      : 'Systems/processes are fully implemented and operate reliably under normal conditions.'}
                  </li>
                  <li>
                    <strong>E – Effective:</strong>{' '}
                    {isDe
                      ? 'Systeme/Prozesse sind nachweislich wirksam und effizient; kontinuierliche Verbesserung ist etabliert.'
                      : 'Systems/processes are demonstrably effective and efficient, with continuous improvement established.'}
                  </li>
                </ul>
              </div>

              {/* Rechte Spalte: Barometer / Skala */}
              {psoeStats.avgLevel && (
                <div className="mt-3 flex justify-end md:mt-0 md:w-1/2 lg:w-1/3">
                  <div className="w-full max-w-xs text-right">
                    {/* Label + Wert */}
                    <div className="text-[11px] font-semibold text-slate-800">
                      {isDe ? 'Ihr Reifegrad' : 'Your maturity level'}
                    </div>
                    <div className="mt-0.5 inline-flex items-center justify-end rounded-full border border-sky-200 bg-white/70 px-2 py-0.5 text-[10px] text-sky-700">
                      {isDe ? 'Aktueller Durchschnitt:' : 'Current average:'}{' '}
                      <span className="ml-1 font-semibold">
                        {psoeStats.avgLevel} ({psoeStats.avgScore.toFixed(1)} / 4)
                      </span>
                    </div>

                    {/* Barometer */}
                    <div className="mt-2">
                      <div className="relative h-8">
                        {/* Farbskala */}
                        <div className="absolute inset-x-0 bottom-0 h-2 rounded-full bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-200" />

                        {/* Pfeil von oben */}
                        <div
                          className="pointer-events-none absolute top-0 flex flex-col items-center"
                          style={{
                            left: `${Math.min(
                              100,
                              Math.max(0, ((psoeStats.avgScore - 1) / 3) * 100), // 1 = P, 4 = E
                            )}%`,
                            transform: 'translateX(-50%)',
                          }}
                        >
                          <div className="text-[8px] text-sky-700">▼</div>
                          <div className="h-4 w-px bg-sky-600" />
                        </div>
                      </div>

                      <div className="mt-1 flex justify-between text-[9px] font-medium text-slate-600">
                        <span>P</span>
                        <span>S</span>
                        <span>O</span>
                        <span>E</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabelle: Anforderungen-Übersicht */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[320px] overflow-auto">
            <table className="min-w-full table-fixed border-collapse text-xs">
              <thead className="border-b border-[#008b84] bg-[#009A93]">
                <tr>
                  {/* Referenz etwas schmaler */}
                  <th className="w-24 px-3 py-1.5 text-left font-medium text-slate-900">
                    {isDe ? 'Referenz' : 'Reference'}
                  </th>

                  {/* Titel begrenzen */}
                  <th className="w-40 px-3 py-1.5 text-left font-medium text-slate-900">
                    {isDe ? 'Titel' : 'Title'}
                  </th>

                  {/* Status leicht schmaler */}
                  <th className="w-28 px-3 py-1.5 text-left font-medium text-slate-900">
                    {isDe ? 'Status' : 'Status'}
                  </th>

                  {/* Manuals breiter */}
                  <th className="w-56 px-3 py-1.5 text-left font-medium text-slate-900">
                    {isDe ? 'Manuals' : 'Manuals'}
                  </th>

                  {/* Prozesse / Doks. ebenfalls breiter */}
                  <th className="w-56 px-3 py-1.5 text-left font-medium text-slate-900">
                    {isDe ? 'Prozesse / Doks.' : 'Processes / docs'}
                  </th>

                  {/* Evidence / Reifegrad */}
                  <th className="w-32 px-3 py-1.5 text-center font-medium text-slate-900">
                    {isDe ? 'Evidence' : 'Evidence'}
                  </th>
                  <th className="w-24 px-3 py-1.5 text-center font-medium text-slate-900">
                    {isDe ? 'Reifegrad' : 'Maturity'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClauses.length === 0 ? (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-xs text-slate-400"
                      colSpan={7}
                    >
                      {isDe
                        ? 'Keine Anforderungen gemäß Filter.'
                        : 'No requirements matching the filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredClauses.map((c) => {
                    const ref = buildRef(c as any) || '–';
                    const title = buildTitle(c as any) || '–';
                    const isSelected = c.id === selectedClauseId;

                    const fileCount = attachmentCounts[c.id] ?? 0;

                    const manualsLabel = manualsLabelForClause(c, isDe);
                    const processLabel = processLabelForClause(c, isDe);

                    const hasEvidenceText = !!c.evidenceNote?.trim();
                    const hasComment = !!c.comment?.trim();
                    const hasManualRef = (c.internalRefs ?? []).some(
                      (r) =>
                        (r.exposition && r.exposition.trim() !== '') ||
                        (r.chapter && r.chapter.trim() !== '') ||
                        (r.description && r.description.trim() !== ''),
                    );
                    const hasProcessRef = (c.processRefs ?? []).some(
                      (r) =>
                        (r.processNumber && r.processNumber.trim() !== '') ||
                        (r.formRef && r.formRef.trim() !== '') ||
                        (r.processTitle && r.processTitle.trim() !== ''),
                    );
                    const hasFiles = fileCount > 0;

                    const hasEvidence =
                      hasEvidenceText ||
                      hasComment ||
                      hasManualRef ||
                      hasProcessRef ||
                      hasFiles;

                    const evidenceLabel = hasEvidence
                      ? isDe
                        ? 'Evidence vorhanden'
                        : 'Evidence available'
                      : isDe
                        ? 'Evidence fehlt'
                        : 'Evidence missing';

                    const needsEvidence = c.status === 'compliant';

                    const evidenceClass =
                      needsEvidence && !hasEvidence
                        ? 'text-rose-600 font-semibold'
                        : 'text-slate-600';

                    return (
                      <tr
                        key={c.id}
                        className={[
                          'cursor-pointer border-b border-slate-100',
                          isSelected ? 'bg-[#009A93]/5' : 'hover:bg-slate-50',
                        ].join(' ')}
                        onClick={() => setSelectedClauseId(c.id)}
                      >
                        {/* Referenz */}
                        <td className="whitespace-nowrap px-3 py-1.5 align-top text-slate-800">
                          {ref}
                        </td>

                        {/* Titel */}
                        <td className="px-3 py-1.5 align-top text-slate-700">
                          <div className="line-clamp-2">{title}</div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-1.5 align-top">
                          <span
                            className={[
                              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                              statusColorClasses(c.status),
                            ].join(' ')}
                          >
                            {statusLabel(c.status, isDe)}
                          </span>
                        </td>

                        {/* Manuals */}
                        <td className="px-3 py-1.5 align-top text-left text-slate-600">
                          <div className="whitespace-pre-line leading-snug">
                            {manualsLabel}
                          </div>
                        </td>

                        {/* Prozesse / Dokumente */}
                        <td className="px-3 py-1.5 align-top text-left text-slate-600">
                          <div className="whitespace-pre-line leading-snug">
                            {processLabel}
                          </div>
                        </td>

                        {/* Evidence */}
                        <td
                          className={[
                            'px-3 py-1.5 align-top text-center',
                            evidenceClass,
                          ].join(' ')}
                        >
                          {evidenceLabel}
                        </td>

                        {/* Reifegrad */}
                        <td className="px-3 py-1.5 align-top text-center text-slate-600">
                          {c.psoeLevel ?? '–'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail-Editor */}
        {selectedClause ? (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {isDe ? 'Ausgewählte Anforderung' : 'Selected requirement'}
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {buildRef(selectedClause as any) ||
                    (isDe ? 'Ohne Referenz' : 'No ref')}
                </div>
                <div className="text-xs text-slate-600">
                  {buildTitle(selectedClause as any) || '\u00A0'}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full border border-slate-300 bg-slate-50 p-1 text-[10px]">
                  {(
                    [
                      'compliant',
                      'not_fulfilled',
                      'not_applicable',
                    ] as ComplianceStatus[]
                  ).map((s) => {
                    const active = selectedClause.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusChange(selectedClause, s)}
                        className={[
                          'rounded-full px-2 py-1',
                          active
                            ? 'bg-[#009A93] text-white'
                            : 'text-slate-600 hover:bg-white',
                        ].join(' ')}
                      >
                        {statusLabel(s, isDe)}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => openPsoeModal(selectedClause)}
                  className="inline-flex items-center rounded-full border border-sky-200 px-3 py-1 text-[11px] text-sky-700 hover:bg-sky-50"
                >
                  {isDe ? 'Reifegrad bewerten' : 'Assess maturity (PSOE)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClause(selectedClause)}
                  className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 text-[11px] text-rose-600 hover:bg-rose-50"
                >
                  {isDe ? 'Löschen' : 'Delete'}
                </button>
              </div>
            </div>

            {selectedClause.status === 'compliant' &&
              !selectedClause.evidenceNote?.trim() &&
              selectedAttachmentCount === 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                  {isDe
                    ? 'Hinweis: Die Anforderung ist als „Compliance“ bewertet, es ist jedoch kein Evidence-Nachweis hinterlegt.'
                    : 'Note: This requirement is marked as “Compliant” but no evidence is documented yet.'}
                </div>
              )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[1, 2, 3].map((lvl) => {
                const refKey = `refLevel${lvl}` as keyof MatrixClause;
                const titleKey = `titleLevel${lvl}` as keyof MatrixClause;

                return (
                  <div key={lvl} className="space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {isDe
                        ? `Referenz Ebene ${lvl}`
                        : `Reference level ${lvl}`}
                    </div>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                      value={(selectedClause[refKey] as string) || ''}
                      onChange={(e) =>
                        handleClauseChange(
                          selectedClause,
                          {
                            [refKey]: e.target.value,
                          } as any,
                        )
                      }
                      placeholder={
                        lvl === 1
                          ? isDe
                            ? 'z.B. 4.1'
                            : 'e.g. 4.1'
                          : lvl === 2
                          ? isDe
                            ? 'z.B. (a)'
                            : 'e.g. (a)'
                          : isDe
                          ? 'z.B. (1)'
                          : 'e.g. (1)'
                      }
                    />
                    <input
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                      value={(selectedClause[titleKey] as string) || ''}
                      onChange={(e) =>
                        handleClauseChange(
                          selectedClause,
                          {
                            [titleKey]: e.target.value,
                          } as any,
                        )
                      }
                      placeholder={
                        isDe ? 'Titel / Überschrift' : 'Title / heading'
                      }
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {isDe ? 'Gesetzestext / Anforderung' : 'Requirement text'}
              </div>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                rows={3}
                value={selectedClause.requirementText || ''}
                onChange={(e) =>
                  handleClauseChange(selectedClause, {
                    requirementText: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {isDe ? 'Evidence / Nachweise' : 'Evidence / proof'}
                </div>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                  rows={3}
                  value={selectedClause.evidenceNote || ''}
                  onChange={(e) =>
                    handleClauseChange(selectedClause, {
                      evidenceNote: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {isDe ? 'Kommentar' : 'Comment'}
                </div>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                  rows={3}
                  value={selectedClause.comment || ''}
                  onChange={(e) =>
                    handleClauseChange(selectedClause, {
                      comment: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Strukturierte Evidence-Referenzen */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {/* Interne Dokumente / Handbücher */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {isDe
                      ? 'Interne Dokumente / Handbücher'
                      : 'Internal manuals / documents'}
                  </div>
                  <button
                    type="button"
                    onClick={() => addInternalRef(selectedClause)}
                    className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-100"
                  >
                    + {isDe ? 'Referenz' : 'Reference'}
                  </button>
                </div>

                {(selectedClause.internalRefs ?? []).length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    {isDe
                      ? 'Noch keine internen Dokumente verknüpft.'
                      : 'No internal documents linked yet.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(selectedClause.internalRefs ?? []).map((r) => (
                      <div
                        key={r.id}
                        className="space-y-1 rounded-md border border-slate-200 bg-white px-2 py-2"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={isDe ? 'Exposition' : 'Exposition'}
                            value={r.exposition}
                            onChange={(e) =>
                              updateInternalRef(selectedClause, r.id, {
                                exposition: e.target.value,
                              })
                            }
                          />
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={isDe ? 'Kapitel' : 'Chapter'}
                            value={r.chapter}
                            onChange={(e) =>
                              updateInternalRef(selectedClause, r.id, {
                                chapter: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={
                              isDe
                                ? 'Kurzbeschreibung / Inhalt'
                                : 'Short description / content'
                            }
                            value={r.description}
                            onChange={(e) =>
                              updateInternalRef(selectedClause, r.id, {
                                description: e.target.value,
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeInternalRef(selectedClause, r.id)
                            }
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-200 text-[11px] text-rose-600 hover:bg-rose-50"
                            title={isDe ? 'Referenz entfernen' : 'Remove'}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prozesse / Formulare */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {isDe ? 'Prozesse / Formulare' : 'Processes / forms'}
                  </div>
                  <button
                    type="button"
                    onClick={() => addProcessRef(selectedClause)}
                    className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-100"
                  >
                    + {isDe ? 'Referenz' : 'Reference'}
                  </button>
                </div>

                {(selectedClause.processRefs ?? []).length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    {isDe
                      ? 'Noch keine Prozesse/Formulare verknüpft.'
                      : 'No processes/forms linked yet.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(selectedClause.processRefs ?? []).map((r) => (
                      <div
                        key={r.id}
                        className="space-y-1 rounded-md border border-slate-200 bg-white px-2 py-2"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={
                              isDe ? 'Prozessnummer' : 'Process no.'
                            }
                            value={r.processNumber}
                            onChange={(e) =>
                              updateProcessRef(selectedClause, r.id, {
                                processNumber: e.target.value,
                              })
                            }
                          />
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={
                              isDe ? 'Formblatt/Dok.-Nr.' : 'Form ref'
                            }
                            value={r.formRef}
                            onChange={(e) =>
                              updateProcessRef(selectedClause, r.id, {
                                formRef: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={
                              isDe ? 'Prozesstitel' : 'Process title'
                            }
                            value={r.processTitle}
                            onChange={(e) =>
                              updateProcessRef(selectedClause, r.id, {
                                processTitle: e.target.value,
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeProcessRef(selectedClause, r.id)
                            }
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-200 text-[11px] text-rose-600 hover:bg-rose-50"
                            title={isDe ? 'Referenz entfernen' : 'Remove'}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2">
              <MatrixAttachments
                clauseId={selectedClause.id}
                isDe={isDe}
                onChangeCount={(count: number) =>
                  setAttachmentCounts((prev) => ({
                    ...prev,
                    [selectedClause.id]: count,
                  }))
                }
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-4 text-xs text-slate-500">
            {isDe ? (
              <p>
                Klicke oben in der Tabelle auf eine Anforderung, um Details,
                Referenzen und Evidence zu bearbeiten.
              </p>
            ) : (
              <p>
                Click a requirement in the table above to edit its details,
                references and evidence.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Lösch-Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <h2 className="mb-1 text-sm font-semibold text-slate-900">
              {isDe ? 'Eintrag wirklich löschen?' : 'Really delete this entry?'}
            </h2>
            <p className="mb-3 text-xs text-slate-600">
              {isDe
                ? 'Dieser Vorgang kann nicht rückgängig gemacht werden. Die folgende Compliance-Matrix wird dauerhaft aus LexTrack entfernt:'
                : 'This action cannot be undone. The following compliance matrix will be permanently removed from LexTrack:'}
            </p>

            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-800">
              <div className="mb-1 grid grid-cols-4 gap-2 font-semibold text-slate-600">
                <span>{isDe ? 'Rechtsart' : 'Type'}</span>
                <span>{isDe ? 'Kürzel' : 'Code'}</span>
                <span>{isDe ? 'Bezeichnung' : 'Title'}</span>
                <span>{isDe ? 'Themenfeld' : 'Topic'}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <span>{(doc as any).lawRechtsart || '–'}</span>
                <span>{doc.lawKuerzel || '–'}</span>
                <span>{doc.lawBezeichnung || '–'}</span>
                <span>{(doc as any).lawThemenfeld || '–'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {isDe ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteDoc}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                {isDe ? 'Endgültig löschen' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PSOE-Modal */}
      {psoeModalClause && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
          <div className="w-full max-w-md rounded-xl bg-white p-4 text-xs shadow-xl">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              {isDe ? 'Reifegrad (PSOE) bewerten' : 'Assess maturity (PSOE)'}
            </h2>

            <p className="mb-3 text-[11px] text-slate-600">
              {isDe
                ? 'Wähle den Reifegrad, der den aktuellen Stand dieser Anforderung am besten beschreibt.'
                : 'Select the maturity level that best reflects the current state of this requirement.'}
            </p>

            <div className="mb-4 space-y-2">
              {(['P', 'S', 'O', 'E'] as PsoeLevel[]).map((lvl) => (
                <label
                  key={lvl}
                  className={[
                    'flex cursor-pointer items-start gap-2 rounded-lg border px-2 py-1.5',
                    psoeSelection === lvl
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    className="mt-0.5 h-3 w-3"
                    checked={psoeSelection === lvl}
                    onChange={() => setPsoeSelection(lvl)}
                  />
                  <div>
                    <div className="font-semibold text-slate-800">
                      {psoeLabel(lvl, isDe)}
                    </div>
                    {isDe ? (
                      <p className="text-[10px] text-slate-600">
                        {lvl === 'P' &&
                          'Grundlagen / Bewusstsein vorhanden, minimale Fähigkeiten.'}
                        {lvl === 'S' &&
                          'System/Prozess ist grundsätzlich geeignet und einsatzfähig.'}
                        {lvl === 'O' &&
                          'System/Prozess läuft stabil im Betrieb unter typischen Bedingungen.'}
                        {lvl === 'E' &&
                          'System/Prozess ist nachweislich wirksam und effizient.'}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-600">
                        {lvl === 'P' &&
                          'Basic awareness and minimal capabilities are established.'}
                        {lvl === 'S' &&
                          'System/process meets baseline suitability and can be used.'}
                        {lvl === 'O' &&
                          'System/process operates consistently under typical conditions.'}
                        {lvl === 'E' &&
                          'System/process is demonstrably effective and efficient.'}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closePsoeModal}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {isDe ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={savePsoeLevel}
                disabled={!psoeSelection}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-medium text-white',
                  psoeSelection
                    ? 'bg-sky-600 hover:bg-sky-700'
                    : 'cursor-not-allowed bg-slate-300',
                ].join(' ')}
              >
                {isDe ? 'Speichern' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
