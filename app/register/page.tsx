// app/register/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Eingabeform from './eingabeform';
import { useRegisterStore, LawRow } from './registerstore';
import EditorPanel from './editorpanel';
import Registerview from './registerview';
import { Info } from 'lucide-react';
import { useLanguage } from '../components/i18n/language';
import { useMatrixStore } from '../matrix/matrixstore';

/* ---- Rollenmodell (UI-seitig) ---- */
type UiRole = 'erfasser' | 'bewertender' | 'reviewer' | 'approver' | 'admin';

/* ---------- Texte DE / EN ---------- */

const TEXT = {
  de: {
    headerTitle: 'Datenerfassung',
    headerSubline:
      'Erfasse hier neue Gesetze, Richtlinien oder interne Vorgaben für das Register.',

    infoTitle: 'Hilfe zur Datenerfassung',
    infoP1:
      'In diesem Bereich kannst du neue gesetzliche, normative oder interne Vorgaben erfassen – zum Beispiel Gesetze, Richtlinien, Normen, Policies oder interne Verfahrensanweisungen.',
    infoP2:
      'Es gibt im MVP keine Pflichtfelder. Ein Eintrag erscheint im Compliance Kataster, sobald mindestens ein Basisfeld wie Rechtsart, Kürzel oder Bezeichnung ausgefüllt wurde.',
    infoP3:
      'Optional kannst du eine externe Quelle über eine URL hinterlegen oder ein PDF-Dokument anhängen, um das zugrunde liegende Rechtsdokument direkt verfügbar zu machen.',
    infoClose: 'Schließen',

    deleteTitle: 'Eintrag wirklich löschen?',
    deleteText:
      'Dieser Vorgang kann nicht rückgängig gemacht werden. Der folgende Eintrag wird dauerhaft aus dem Compliance Kataster entfernt:',
    deleteCancel: 'Abbrechen',
    deleteConfirm: 'Endgültig löschen',

    cannotDeleteTitle: 'Eintrag kann nicht gelöscht werden',
    cannotDeleteLead:
      'Der Eintrag kann nicht gelöscht werden, weil mindestens einer der folgenden Gründe vorliegt:',
    cannotDeleteClose: 'Verstanden',
    cannotDeleteReasonMatrix:
      'Es existiert mindestens eine Compliance-Matrix zu diesem Dokument.',
    cannotDeleteReasonActive: 'Der Dokumentenstatus „aktiv“ ist.',
    cannotDeleteReasonArchived: 'Der Dokumentenstatus „archiviert“ ist.',
  },
  en: {
    headerTitle: 'Data entry',
    headerSubline:
      'Use this section to record new laws, guidelines or internal requirements for the register.',

    infoTitle: 'Help for data entry',
    infoP1:
      'In this section you can record new legal, normative or internal requirements – for example laws, guidelines, standards, policies or internal procedures.',
    infoP2:
      'In the MVP there are no mandatory fields. An entry appears in the compliance register as soon as at least one basic field such as legal type, reference or title has been filled in.',
    infoP3:
      'Optionally, you can add an external source via URL or attach a PDF document so that the underlying legal document is directly available.',
    infoClose: 'Close',

    deleteTitle: 'Delete entry permanently?',
    deleteText:
      'This action cannot be undone. The following entry will be permanently removed from the compliance register:',
    deleteCancel: 'Cancel',
    deleteConfirm: 'Delete permanently',

    cannotDeleteTitle: 'Entry cannot be deleted',
    cannotDeleteLead:
      'The entry cannot be deleted because at least one of the following reasons applies:',
    cannotDeleteClose: 'Got it',
    cannotDeleteReasonMatrix:
      'At least one compliance matrix exists for this document.',
    cannotDeleteReasonActive: 'The document status is “active”.',
    cannotDeleteReasonArchived: 'The document status is “archived”.',
  },
} as const;

/* ---- Hilfsfunktionen für History ---- */

function displayValue(val: unknown): string {
  if (val == null || val === '') return '—';
  return String(val);
}

function displayDate(val: unknown): string {
  if (!val) return '';
  const d = new Date(String(val));
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('de-DE');
}

function describeDateChange(label: string, beforeVal?: unknown, afterVal?: unknown) {
  const from = beforeVal ? displayDate(beforeVal) : '';
  const to = afterVal ? displayDate(afterVal) : '';

  if (!from && to) return `${label} auf ${to} gesetzt`;
  if (from && !to) return `${label}-Datum entfernt`;
  if (from && to && from !== to) return `${label} von ${from} auf ${to} geändert`;
  return null;
}

function buildHistoryEntries(before: LawRow, after: Partial<LawRow>) {
  const fieldConfig: {
    key: keyof LawRow;
    label: string;
    type?: 'date' | 'status';
  }[] = [
    { key: 'rechtsart', label: 'Typ' },
    { key: 'kuerzel', label: 'Kürzel' },
    { key: 'bezeichnung', label: 'Bezeichnung' },
    { key: 'themenfeld', label: 'Themenfeld' },

    { key: 'publiziert', label: 'Publiziert am', type: 'date' },
    { key: 'gueltigSeit', label: 'Gültig ab', type: 'date' },
    { key: 'gueltigBis', label: 'Gültig bis', type: 'date' },
    { key: 'frist', label: 'Frist', type: 'date' },

    // Quelle / Dokument
    { key: 'dokumentUrl', label: 'Quelle (URL)' },
    { key: 'quelleUrl', label: 'Quelle (URL)' },
    { key: 'dokumentName', label: 'Dokument (Anzeigename)' },

    // Organisation & Status
    { key: 'zustaendigkeit', label: 'Zuständigkeit' },
    { key: 'herausgeber', label: 'Herausgeber' },
    { key: 'relevanz', label: 'Relevanz' },
    { key: 'kategorie', label: 'Kategorie' },

    { key: 'status', label: 'Dokumentenstatus', type: 'status' },
    { key: 'abgeloestDurch', label: 'Abgelöst durch' },

    // Bewertung / Workflow
    { key: 'riskMode', label: 'Riskengine' },
    { key: 'bewertungErgebnis', label: 'Bewertungsergebnis' },
    { key: 'workflowState', label: 'Workflow-Status' },
    { key: 'evaluationStatus', label: 'Bewertungsstatus' },

    // Verantwortlichkeiten
    { key: 'assignedTo', label: 'Zugewiesen an' },
    { key: 'reviewedBy', label: 'Reviewer' },
    { key: 'reviewerNote', label: 'Reviewer-Notiz' },
    { key: 'approvedBy', label: 'Approver' },
    { key: 'approverNote', label: 'Freigabe-Notiz' },
  ];

  const now = new Date().toISOString();
  const user = 'Admin';
  const messages: string[] = [];

  for (const cfg of fieldConfig) {
    const f = cfg.key;
    if (!Object.prototype.hasOwnProperty.call(after, f)) continue;

    const beforeVal = before[f];
    const afterVal = after[f];

    if ((beforeVal ?? '') === (afterVal ?? '')) continue;

    if (cfg.type === 'date') {
      const msg = describeDateChange(cfg.label, beforeVal, afterVal);
      if (msg) messages.push(msg);
      continue;
    }

    if (cfg.type === 'status') {
      const from = displayValue(beforeVal);
      const to = displayValue(afterVal);
      if (!beforeVal && afterVal) {
        messages.push(`Dokumentenstatus auf "${to}" gesetzt`);
      } else if (from && !afterVal) {
        messages.push('Dokumentenstatus entfernt');
      } else if (from !== to) {
        messages.push(`Dokumentenstatus von "${from}" auf "${to}" geändert`);
      }
      continue;
    }

    const from = displayValue(beforeVal);
    const to = displayValue(afterVal);
    messages.push(`${cfg.label} von "${from}" auf "${to}" geändert`);
  }

  if (messages.length === 0) return [];
  return [{ date: now, user, text: messages.join('\n') }];
}

type HistoryEntry = NonNullable<LawRow['history']>[number];

function ensureCreationEntry(existing: LawRow['history'], before: LawRow): HistoryEntry[] {
  const history: HistoryEntry[] = existing ? [...existing] : [];
  if (history.length === 0) {
    const createdAt = before.createdAt || before.publiziert || new Date().toISOString();
    const creator =
      [before.erfasserVorname ?? '', before.erfasserNachname ?? '']
        .filter(Boolean)
        .join(' ') || 'System';
    history.push({ date: createdAt, user: creator, text: 'Angelegt' });
  }
  return history;
}

/* ---- Minimaltypisierung für MatrixDocs (nur was wir hier brauchen) ---- */
type MatrixDocLite = {
  lawId?: string | null;
};

type MatrixStoreLite = {
  docs?: MatrixDocLite[];
};

/* ---- Component ---- */

export default function Page() {
  const { rows, remove, update } = useRegisterStore();

  // Falls useMatrixStore in deinem Projekt nicht sauber typisiert ist:
  const matrixStore = useMatrixStore() as unknown as MatrixStoreLite;
  const docs = matrixStore.docs ?? [];

  const { language } = useLanguage();
  const t = TEXT[language] ?? TEXT.de;
  const isDe = language === 'de';

  const role: UiRole = 'admin';

  const [editId, setEditId] = useState<string | null>(null);
  const [showEntryInfo, setShowEntryInfo] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<LawRow | null>(null);
  const [blockedRow, setBlockedRow] = useState<LawRow | null>(null);
  const [blockedReasons, setBlockedReasons] = useState<string[]>([]);

  const current = useMemo(
    () => rows.find((r) => r.id === editId) ?? null,
    [rows, editId],
  );

  // --- Save + History ---
  const handleSave = (id: string, patch: Partial<LawRow>) => {
    const before = rows.find((r) => r.id === id);
    if (!before) return;

    // history aus patch ignorieren (wir bauen sie hier konsistent neu)
    const { history, ...restPatch } = patch;
    void history;

    const changeEntries = buildHistoryEntries(before, restPatch);
    const baseHistory = ensureCreationEntry(before.history, before);
    const nextHistory =
      changeEntries.length > 0 ? [...baseHistory, ...changeEntries] : baseHistory;

    update(id, {
      ...restPatch,
      history: nextHistory,
    });
  };

  const openFromRegisterView = (row: LawRow) => setEditId(row.id);

  const computeBlockReasons = (row: LawRow): string[] => {
    const reasons: string[] = [];
    const hasMatrix = docs.some((d) => d.lawId === row.id);

    if (hasMatrix) reasons.push(t.cannotDeleteReasonMatrix);
    if (row.status === 'aktiv') reasons.push(t.cannotDeleteReasonActive);
    if (row.status === 'archiviert') reasons.push(t.cannotDeleteReasonArchived);

    return reasons;
  };

  const removeFromRegisterView = (row: LawRow) => {
    const reasons = computeBlockReasons(row);
    if (reasons.length > 0) {
      setBlockedRow(row);
      setBlockedReasons(reasons);
      return;
    }
    setRowToDelete(row);
  };

  const confirmDelete = () => {
    if (!rowToDelete) return;
    remove(rowToDelete.id);
    setRowToDelete(null);
  };

  const cancelDelete = () => setRowToDelete(null);

  const closeBlockedDialog = () => {
    setBlockedRow(null);
    setBlockedReasons([]);
  };

  /* ---------- Druckfunktion: Compliance-Kataster ---------- */

  const handlePrintRegister = () => {
    const locale = isDe ? 'de-DE' : 'en-GB';

    const today = new Date();
    const dateStr = today.toLocaleDateString(locale);
    const timeStr = today.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });

    const formatDate = (value?: string | null) => {
      if (!value) return '—';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleDateString(locale);
    };

    const mapStatusForStats = (status?: string | null) => {
      const s = (status ?? '').toLowerCase();
      if (s === 'offen' || s === 'open') return 'open';
      if (s === 'aktiv' || s === 'active') return 'active';
      if (s === 'obsolet' || s === 'obsolete') return 'obsolete';
      if (s === 'archiviert' || s === 'archived') return 'archived';
      return 'other';
    };

    const total = rows.length;
    let open = 0;
    let active = 0;
    let obsolete = 0;
    let archived = 0;

    rows.forEach((r) => {
      switch (mapStatusForStats(r.status ?? null)) {
        case 'open':
          open += 1;
          break;
        case 'active':
          active += 1;
          break;
        case 'obsolete':
          obsolete += 1;
          break;
        case 'archived':
          archived += 1;
          break;
      }
    });

    const rowsHtml = rows
      .map((r) => {
        const rechtsart = r.rechtsart || '—';
        const kuerzel = r.kuerzel || '—';
        const bezeichnung = r.bezeichnung || '—';
        const themenfeld = r.themenfeld || '—';
        const publiziert = formatDate(r.publiziert ?? null);
        const frist = formatDate(r.frist ?? null);
        const relevanz = r.relevanz || '—';
        const status = r.status || '—';
        const erfasser =
          [r.erfasserVorname, r.erfasserNachname].filter(Boolean).join(' ') || '—';

        return `
          <tr>
            <td>${rechtsart}</td>
            <td>${kuerzel}</td>
            <td>${bezeichnung}</td>
            <td>${themenfeld}</td>
            <td>${publiziert}</td>
            <td>${frist}</td>
            <td>${relevanz}</td>
            <td>${status}</td>
            <td>${erfasser}</td>
          </tr>
        `;
      })
      .join('');

    const titleLine = isDe ? 'Compliance Kataster' : 'Compliance register';

    const html = `
<!DOCTYPE html>
<html lang="${isDe ? 'de' : 'en'}">
<head>
  <meta charset="utf-8" />
  <title>LexTrack – ${titleLine}</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 24px; background:#f3f4f6; color:#111827; font-size: 11px; }
    .page { max-width: 980px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 16px 20px 20px; box-shadow: 0 0 0 1px #e5e7eb; }
    .topbar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
    .brand { font-size:10px; color:#6b7280; }
    h1 { font-size:16px; margin:2px 0 0 0; }
    h2 { font-size:12px; margin:2px 0 0 0; font-weight:500; color:#4b5563; }
    .meta-line { margin-top:4px; font-size:10px; color:#6b7280; }
    .badges { margin-top:6px; display:flex; flex-wrap:wrap; gap:4px; }
    .badge { border-radius:999px; padding:2px 8px; border:1px solid #e5e7eb; background:#f9fafb; font-size:10px; color:#374151; display:inline-flex; align-items:center; gap:4px; }
    .badge-label { font-weight:500; text-transform:uppercase; letter-spacing:0.03em; font-size:9px; color:#6b7280; }
    .badge strong { font-weight:600; }
    .badge-primary { border-color:#bfdbfe; background:#eff6ff; color:#1d4ed8; }
    .topbar-right { text-align:right; font-size:10px; color:#6b7280; }
    table { width:100%; border-collapse:collapse; margin-top:10px; }
    th, td { border:1px solid #e5e7eb; padding:4px 6px; vertical-align:top; }
    th { background:#f3f4f6; font-weight:600; text-align:left; }
    tbody tr:nth-child(even) td { background:#f9fafb; }
    .footer { margin-top:8px; display:flex; justify-content:space-between; font-size:9px; color:#6b7280; }
    @media print {
      body { background:#ffffff; margin: 10mm; }
      .page { box-shadow:none; border-radius:0; padding:0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="topbar">
      <div>
        <div class="brand">LexTrack – Die Compliance Suite</div>
        <h1>${titleLine}</h1>
        <h2>${isDe ? 'Regelwerkskataster' : 'Regulatory register'}</h2>
        <div class="meta-line">
          ${isDe
            ? 'Kataster für gesetzliche, normative und interne Vorgaben.'
            : 'Register for legal, normative and internal requirements.'}
        </div>
        <div class="badges">
          <div class="badge badge-primary">
            <span class="badge-label">${isDe ? 'Einträge' : 'Entries'}</span>
            <strong>${total}</strong>
          </div>
          <div class="badge">
            <span class="badge-label">${isDe ? 'Offen' : 'Open'}</span>
            <strong>${open}</strong>
          </div>
          <div class="badge">
            <span class="badge-label">${isDe ? 'Aktiv' : 'Active'}</span>
            <strong>${active}</strong>
          </div>
          <div class="badge">
            <span class="badge-label">${isDe ? 'Obsolet' : 'Obsolete'}</span>
            <strong>${obsolete}</strong>
          </div>
          <div class="badge">
            <span class="badge-label">${isDe ? 'Archiviert' : 'Archived'}</span>
            <strong>${archived}</strong>
          </div>
        </div>
      </div>
      <div class="topbar-right">
        <div>${isDe ? 'Ausgedruckt am' : 'Printed on'} ${dateStr}</div>
        <div>${timeStr}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:55px;">${isDe ? 'Rechtsart' : 'Type'}</th>
          <th style="width:70px;">${isDe ? 'Kürzel' : 'Code'}</th>
          <th>${isDe ? 'Bezeichnung' : 'Title'}</th>
          <th style="width:110px;">${isDe ? 'Themenfeld' : 'Topic'}</th>
          <th style="width:70px;">${isDe ? 'Publiziert' : 'Published'}</th>
          <th style="width:70px;">${isDe ? 'Frist' : 'Due date'}</th>
          <th style="width:70px;">${isDe ? 'Relevanz' : 'Relevance'}</th>
          <th style="width:70px;">${isDe ? 'Status' : 'Status'}</th>
          <th style="width:130px;">${isDe ? 'Erfassung durch' : 'Recorded by'}</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || `
        <tr>
          <td colspan="9" style="text-align:center; color:#9ca3af;">
            ${isDe ? 'Keine Einträge im Kataster.' : 'No entries in the register.'}
          </td>
        </tr>
        `}
      </tbody>
    </table>

    <div class="footer">
      <div>© 2025 LexTrack – Regulatory Intelligence &amp; Compliance</div>
      <div style="text-align:right;">
        <div>${isDe ? 'Intern' : 'Internal'}</div>
        <div>${isDe ? 'Generiert mit LexTrack Compliance Suite' : 'Generated with LexTrack Compliance Suite'}</div>
      </div>
    </div>
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
  };

  return (
    <div className="space-y-6">
      {/* Header Datenerfassung + Info */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-800 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold leading-tight">{t.headerTitle}</div>
            <div className="mt-1 text-sm text-slate-500">{t.headerSubline}</div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md bg-[#009A93] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:brightness-110"
            onClick={() => setShowEntryInfo(true)}
          >
            <Info size={14} />
            <span>Info</span>
          </button>
        </div>
      </div>

      {/* Info-Modal zur Datenerfassung */}
      {showEntryInfo && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-800">{t.infoTitle}</h3>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                onClick={() => setShowEntryInfo(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>{t.infoP1}</p>
              <p>{t.infoP2}</p>
              <p>{t.infoP3}</p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="rounded-md bg-[#009A93] px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
                onClick={() => setShowEntryInfo(false)}
              >
                {t.infoClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formular zur Dokumentenerfassung */}
      <Eingabeform />

      {/* Compliance Register – interaktive Ansicht */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-slate-700">
          {isDe ? 'Compliance Kataster' : 'Compliance register'}
        </div>

        <Registerview
          role={role}
          onOpen={openFromRegisterView}
          onRemove={removeFromRegisterView}
          onPrint={handlePrintRegister}
        />
      </div>

      {/* Editor für einen ausgewählten Datensatz */}
      {current && (
        <EditorPanel
          row={current}
          onClose={() => setEditId(null)}
          onSave={handleSave}
        />
      )}

      {/* Dialog: Eintrag kann NICHT gelöscht werden */}
      {blockedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{t.cannotDeleteTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">{t.cannotDeleteLead}</p>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="font-semibold text-slate-600">Rechtsart</div>
                  <div className="mt-0.5 whitespace-normal break-words text-slate-900">
                    {blockedRow.rechtsart || '—'}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-slate-600">Kürzel</div>
                  <div className="mt-0.5 whitespace-normal break-words text-slate-900">
                    {blockedRow.kuerzel || '—'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="font-semibold text-slate-600">Bezeichnung / Themenfeld</div>
                  <div className="mt-0.5 whitespace-normal break-words text-slate-900">
                    {blockedRow.bezeichnung || 'Ohne Bezeichnung'}
                    {blockedRow.themenfeld ? ` – ${blockedRow.themenfeld}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-800">
              {blockedReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded-md bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-900"
                onClick={closeBlockedDialog}
              >
                {t.cannotDeleteClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lösch-Dialog */}
      {rowToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{t.deleteTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">{t.deleteText}</p>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="font-semibold text-slate-600">Rechtsart</div>
                  <div className="mt-0.5 whitespace-normal break-words text-slate-900">
                    {rowToDelete.rechtsart || '—'}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-slate-600">Kürzel</div>
                  <div className="mt-0.5 whitespace-normal break-words text-slate-900">
                    {rowToDelete.kuerzel || '—'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="font-semibold text-slate-600">Bezeichnung / Themenfeld</div>
                  <div className="mt-0.5 whitespace-normal break-words text-slate-900">
                    {rowToDelete.bezeichnung || 'Ohne Bezeichnung'}
                    {rowToDelete.themenfeld ? ` – ${rowToDelete.themenfeld}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                onClick={cancelDelete}
              >
                {t.deleteCancel}
              </button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                onClick={confirmDelete}
              >
                {t.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
