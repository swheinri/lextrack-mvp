'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2, Printer, Filter } from 'lucide-react';

import { useLanguage } from '../components/i18n/language';
import MatrixAttachments from './matrix-attachments';
import {
  statusLabel,
  statusColorClasses,
  matrixStatusLabel,
  matrixStatusColorClasses,
} from './utils/matrix-status';


import {
  useMatrixStore,
  type MatrixClause,
  type ComplianceStatus,
  type PsoeLevel,
  type InternalManualRef,
  type ProcessRef,
  type FormRef,
  type MatrixStatus,
  type RiskLevel,
} from './matrixstore';

/* =========================================================
   Hilfstypen
========================================================= */

type MatrixClauseWithLevels = MatrixClause & {
  refLevel1?: string;
  refLevel2?: string;
  refLevel3?: string;
  titleLevel1?: string;
  titleLevel2?: string;
  titleLevel3?: string;
};

type DocRiskAggregationMode = 'worst_case' | 'index';
type DocRiskScope = 'all' | 'non_compliant';

/* =========================================================
   Helper: Ref / Title Builder
========================================================= */

function buildRef(c: MatrixClauseWithLevels): string {
  const parts: string[] = [];
  if (c.refLevel1) parts.push(c.refLevel1);
  if (c.refLevel2) parts.push(c.refLevel2);
  if (c.refLevel3) parts.push(c.refLevel3);
  return parts.join(' ');
}

function buildTitle(c: MatrixClauseWithLevels): string {
  const parts: string[] = [];
  if (c.titleLevel1) parts.push(c.titleLevel1);
  if (c.titleLevel2) parts.push(c.titleLevel2);
  if (c.titleLevel3) parts.push(c.titleLevel3);
  return parts.join(' – ');
}

/* =========================================================
   Helper: HTML escaping (Print)
========================================================= */

function escapeHtml(input: unknown): string {
  const s = String(input ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* =========================================================
   Labels für Referenzen
========================================================= */

function manualsLabelForClause(c: MatrixClause): string {
  const refs = c.internalRefs ?? [];
  const lines = refs
    .map((r) => {
      const parts: string[] = [];
      if (r.exposition) parts.push(r.exposition);
      if (r.chapter) parts.push(r.chapter);
      const head = parts.join(' ');
      if (r.description) return head ? `${head} – ${r.description}` : r.description;
      return head;
    })
    .filter(Boolean) as string[];

  if (lines.length === 0) return '–';
  return Array.from(new Set(lines)).join('\n');
}

function processLabelForClause(c: MatrixClause): string {
  const refs = c.processRefs ?? [];
  const lines = refs
    .map((r) => [r.processNumber, r.processTitle].filter(Boolean).join(' – '))
    .filter(Boolean) as string[];

  if (lines.length === 0) return '–';
  return lines.join('\n');
}

function formLabelForClause(c: MatrixClause): string {
  const refs = c.formRefs ?? [];
  const lines = refs
    .map((r) => [r.formNumber, r.formTitle].filter(Boolean).join(' – '))
    .filter(Boolean) as string[];

  if (lines.length === 0) return '–';
  return lines.join('\n');
}

function processAndFormsLabelForClause(c: MatrixClause): string {
  const p = processLabelForClause(c);
  const f = formLabelForClause(c);

  const parts: string[] = [];
  if (p && p !== '–') parts.push(p);
  if (f && f !== '–') parts.push(f);

  return parts.length ? parts.join('\n') : '–';
}

/* =========================================================
   PSOE helpers + Gauge
========================================================= */

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
  } else {
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
  }
  return isDe ? 'Unbekannt' : 'Unknown';
}

function clampNum(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function psoeNeedlePercent(avgScore: number) {
  const s = clampNum(avgScore, 1, 4);
  return ((s - 1) / 3) * 100;
}

function PsoeGauge({
  avgScore,
  avgLevel,
  isDe,
  onInfoClick,
}: {
  avgScore: number;
  avgLevel: PsoeLevel | null;
  isDe: boolean;
  onInfoClick?: () => void;
}) {
  const percent = psoeNeedlePercent(avgScore);

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          {isDe ? 'PSOE-Reifegrad' : 'PSOE maturity'}
        </div>

        <button
          type="button"
          onClick={onInfoClick}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-sky-400 text-[10px] text-sky-700 hover:bg-sky-100"
          title={isDe ? 'Erklärung anzeigen' : 'Show explanation'}
        >
          i
        </button>
      </div>

      <div className="relative">
        <div className="grid grid-cols-4 overflow-hidden rounded-full border border-slate-200 bg-white">
          <div className="h-3 bg-rose-200" />
          <div className="h-3 bg-amber-200" />
          <div className="h-3 bg-orange-200" />
          <div className="h-3 bg-emerald-200" />
        </div>

        <div className="absolute -top-2" style={{ left: `calc(${percent}% - 6px)` }}>
          <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-slate-900" />
        </div>

        <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-600">
          <span>P</span>
          <span>S</span>
          <span>O</span>
          <span>E</span>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-slate-700">
        {avgLevel ? (
          <>
            <span className="font-semibold">{isDe ? 'Aktueller Durchschnitt:' : 'Current average:'}</span>{' '}
            {avgLevel} ({avgScore.toFixed(1)} / 4)
          </>
        ) : (
          <span className="text-slate-500">{isDe ? 'Noch keine Bewertungen vorhanden.' : 'No ratings yet.'}</span>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Risk helpers (4x4)
========================================================= */

type RiskBand = 'low' | 'medium' | 'high' | 'critical';

function riskScore(s?: RiskLevel, p?: RiskLevel): number | null {
  if (!s || !p) return null;
  return s * p;
}

function riskBand(score: number): RiskBand {
  if (score <= 4) return 'low';
  if (score <= 8) return 'medium';
  if (score <= 12) return 'high';
  return 'critical';
}

function riskBandLabel(b: RiskBand, isDe: boolean): string {
  if (isDe) {
    switch (b) {
      case 'low':
        return 'niedrig';
      case 'medium':
        return 'mittel';
      case 'high':
        return 'hoch';
      case 'critical':
        return 'kritisch';
    }
  } else {
    switch (b) {
      case 'low':
        return 'low';
      case 'medium':
        return 'medium';
      case 'high':
        return 'high';
      case 'critical':
        return 'critical';
    }
  }
  return isDe ? 'unbekannt' : 'unknown';
}

function riskBandClasses(b: RiskBand): string {
  switch (b) {
    case 'low':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'critical':
    default:
      return 'bg-rose-100 text-rose-700 border-rose-200';
  }
}

function riskLabel(s?: RiskLevel, p?: RiskLevel): string {
  if (!s || !p) return '–';
  return `S${s}/P${p}`;
}

function clampRiskLevel(n: number): RiskLevel {
  return Math.min(4, Math.max(1, Math.round(n))) as RiskLevel;
}

/* =========================================================
   ID helper
========================================================= */

function createLocalId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/* =========================================================
   Props
========================================================= */

type Props = {
  selectedDocId: string | null;
};

/* =========================================================
   Component
========================================================= */

export default function MatrixDetail({ selectedDocId }: Props) {
  const { language } = useLanguage();
  const isDe = language === 'de';
  const locale = isDe ? 'de-DE' : 'en-GB';

  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteClauseModal, setDeleteClauseModal] = useState<MatrixClause | null>(null);

  const [psoeModalClause, setPsoeModalClause] = useState<MatrixClause | null>(null);
  const [psoeSelection, setPsoeSelection] = useState<PsoeLevel | null>(null);

  const [riskModalClause, setRiskModalClause] = useState<MatrixClause | null>(null);
  const [riskS, setRiskS] = useState<RiskLevel | null>(null);
  const [riskP, setRiskP] = useState<RiskLevel | null>(null);

  const [showPsoeInfo, setShowPsoeInfo] = useState(false);
  const [showRiskInfo, setShowRiskInfo] = useState(false);

  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'all'>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [pendingStatusFilter, setPendingStatusFilter] = useState<ComplianceStatus | 'all'>('all');
  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

  const { docs, addClause, updateClause, removeClause, removeDoc, updateDocStatus, updateDocRiskSettings } =
    useMatrixStore();

  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);

  const doc = useMemo(() => docs.find((d) => d.id === selectedDocId) ?? null, [docs, selectedDocId]);
  const clauses = doc?.clauses ?? [];

  const docRiskMode: DocRiskAggregationMode = (doc?.riskAggregationMode as DocRiskAggregationMode) ?? 'worst_case';
  const docRiskScope: DocRiskScope = (doc?.riskScope as DocRiskScope) ?? 'all';

  /* ---------- Filter + Sortierung ---------- */

  const filteredClauses = useMemo(() => {
    if (!clauses || clauses.length === 0) return [];
    let list = clauses;

    if (statusFilter !== 'all') {
      list = clauses.filter((c) => c.status === statusFilter);
    }

    return [...list].sort((a, b) => {
      const aRef = buildRef(a as MatrixClauseWithLevels);
      const bRef = buildRef(b as MatrixClauseWithLevels);
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

  /* ---------- Auto-select erste Clause ---------- */
  useEffect(() => {
    if (!doc) return;
    if (selectedClauseId) return;
    if (filteredClauses.length > 0) setSelectedClauseId(filteredClauses[0].id);
  }, [doc, selectedClauseId, filteredClauses]);

  /* ---------- Kennzahlen ---------- */

  const stats = useMemo(() => {
    const total = clauses.length;
    const open = clauses.filter((c) => c.status === 'open').length;
    const compliant = clauses.filter((c) => c.status === 'compliant').length;
    const notFulfilled = clauses.filter((c) => c.status === 'not_fulfilled').length;
    const na = clauses.filter((c) => c.status === 'not_applicable').length;
    const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
    return { total, open, compliant, notFulfilled, na, pct };
  }, [clauses]);

  const psoeStats = useMemo(() => {
    const withLevel = clauses.filter((c): c is MatrixClause & { psoeLevel: PsoeLevel } => !!c.psoeLevel);
    if (withLevel.length === 0) return { avgScore: 0, avgLevel: null as PsoeLevel | null };

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

  const riskStats = useMemo(() => {
    const relevant = clauses.filter((c) => {
      const rated = c.riskSeverity != null && c.riskProbability != null;
      if (!rated) return false;
      if (docRiskScope === 'all') return true;
      return c.status !== 'compliant';
    });

    const withRisk = relevant.map((c) => {
      const s = c.riskSeverity as RiskLevel;
      const p = c.riskProbability as RiskLevel;
      const score = s * p;
      return { id: c.id, clause: c, s, p, score };
    });

    if (withRisk.length === 0) {
      return {
        count: 0,
        avgScore: 0,
        avgS: null as RiskLevel | null,
        avgP: null as RiskLevel | null,
        worstScore: 0,
        worstS: null as RiskLevel | null,
        worstP: null as RiskLevel | null,
        worstClauseId: null as string | null,
        docValue: null as number | null,
        docBand: null as RiskBand | null,
        markerS: null as RiskLevel | null,
        markerP: null as RiskLevel | null,
        bands: { low: 0, medium: 0, high: 0, critical: 0 } as Record<RiskBand, number>,
      };
    }

    const sumScore = withRisk.reduce((acc, r) => acc + r.score, 0);
    const avgScore = sumScore / withRisk.length;

    const avgSRaw = withRisk.reduce((acc, r) => acc + r.s, 0) / withRisk.length;
    const avgPRaw = withRisk.reduce((acc, r) => acc + r.p, 0) / withRisk.length;

    const worst = withRisk.reduce((best, r) => (r.score > best.score ? r : best), withRisk[0]);

    const bands: Record<RiskBand, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const r of withRisk) bands[riskBand(r.score)] += 1;

    const avgS = clampRiskLevel(avgSRaw);
    const avgP = clampRiskLevel(avgPRaw);

    const docValue = docRiskMode === 'worst_case' ? worst.score : avgScore;
    const docBand = riskBand(Math.round(docValue));

    const markerS = docRiskMode === 'worst_case' ? worst.s : avgS;
    const markerP = docRiskMode === 'worst_case' ? worst.p : avgP;

    return {
      count: withRisk.length,
      avgScore,
      avgS,
      avgP,
      worstScore: worst.score,
      worstS: worst.s,
      worstP: worst.p,
      worstClauseId: worst.id,
      docValue,
      docBand,
      markerS,
      markerP,
      bands,
    };
  }, [clauses, docRiskScope, docRiskMode]);

  /* ---------- Filterpanel schließen ---------- */
  useEffect(() => {
    if (!showFilterPanel) return;

    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;

      const panel = filterPanelRef.current;
      const btn = filterButtonRef.current;

      const clickedPanel = !!panel && panel.contains(target);
      const clickedButton = !!btn && btn.contains(target);

      if (!clickedPanel && !clickedButton) setShowFilterPanel(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowFilterPanel(false);
    }

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showFilterPanel]);

  /* ---------- Global ESC: Modals schließen ---------- */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;

      if (psoeModalClause) {
        setPsoeModalClause(null);
        setPsoeSelection(null);
      }
      if (riskModalClause) {
        setRiskModalClause(null);
        setRiskS(null);
        setRiskP(null);
      }
      if (deleteClauseModal) setDeleteClauseModal(null);
      if (showDeleteModal) setShowDeleteModal(false);
      if (showPsoeInfo) setShowPsoeInfo(false);
      if (showRiskInfo) setShowRiskInfo(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [psoeModalClause, riskModalClause, deleteClauseModal, showDeleteModal, showPsoeInfo, showRiskInfo]);

  /* ---------- Handler: Clause CRUD ---------- */

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

  function requestDeleteClause(clause: MatrixClause) {
    setDeleteClauseModal(clause);
  }

  function confirmDeleteClause() {
    if (!doc || !deleteClauseModal) return;
    removeClause(doc.id, deleteClauseModal.id);
    if (selectedClauseId === deleteClauseModal.id) setSelectedClauseId(null);
    setDeleteClauseModal(null);
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

  function handleMatrixStatusChange(newStatus: MatrixStatus) {
    if (!doc) return;
    updateDocStatus(doc.id, newStatus);
  }

  /* ---------- PSOE modal ---------- */

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

  /* ---------- Risk modal ---------- */

  function openRiskModal(clause: MatrixClause) {
    setRiskModalClause(clause);
    setRiskS(clause.riskSeverity ?? null);
    setRiskP(clause.riskProbability ?? null);
  }

  function closeRiskModal() {
    setRiskModalClause(null);
    setRiskS(null);
    setRiskP(null);
  }

  function saveRisk() {
    if (!doc || !riskModalClause || !riskS || !riskP) return;
    updateClause(doc.id, riskModalClause.id, { riskSeverity: riskS, riskProbability: riskP });
    closeRiskModal();
  }

  /* ---------- Strukturierte Referenzen ---------- */

  function addInternalRef(clause: MatrixClause) {
    if (!doc) return;
    const current = clause.internalRefs ?? [];
    const next: InternalManualRef[] = [
      ...current,
      { id: createLocalId('iref'), exposition: '', chapter: '', description: '' },
    ];
    updateClause(doc.id, clause.id, { internalRefs: next });
  }

  function updateInternalRef(clause: MatrixClause, refId: string, patch: Partial<InternalManualRef>) {
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
    const next: ProcessRef[] = [...current, { id: createLocalId('pref'), processNumber: '', processTitle: '' }];
    updateClause(doc.id, clause.id, { processRefs: next });
  }

  function updateProcessRef(clause: MatrixClause, refId: string, patch: Partial<ProcessRef>) {
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

  function addFormRef(clause: MatrixClause) {
    if (!doc) return;
    const current = clause.formRefs ?? [];
    const next: FormRef[] = [...current, { id: createLocalId('fref'), formNumber: '', formTitle: '' }];
    updateClause(doc.id, clause.id, { formRefs: next });
  }

  function updateFormRef(clause: MatrixClause, refId: string, patch: Partial<FormRef>) {
    if (!doc) return;
    const current = clause.formRefs ?? [];
    const next = current.map((r) => (r.id === refId ? { ...r, ...patch } : r));
    updateClause(doc.id, clause.id, { formRefs: next });
  }

  function removeFormRef(clause: MatrixClause, refId: string) {
    if (!doc) return;
    const current = clause.formRefs ?? [];
    const next = current.filter((r) => r.id !== refId);
    updateClause(doc.id, clause.id, { formRefs: next });
  }

  /* ---------- Evidence vorhanden? ---------- */

  function hasEvidence(c: MatrixClause): boolean {
    const fileCount = attachmentCounts[c.id] ?? 0;

    const hasEvidenceText = !!c.evidenceNote?.trim();
    const hasComment = !!c.comment?.trim();

    const hasManualRef = (c.internalRefs ?? []).some(
      (r) =>
        (r.exposition && r.exposition.trim() !== '') ||
        (r.chapter && r.chapter.trim() !== '') ||
        (r.description && r.description.trim() !== ''),
    );

    const hasProcessRefAny = (c.processRefs ?? []).some(
      (r) => (r.processNumber && r.processNumber.trim() !== '') || (r.processTitle && r.processTitle.trim() !== ''),
    );

    const hasFormRefAny = (c.formRefs ?? []).some(
      (r) => (r.formNumber && r.formNumber.trim() !== '') || (r.formTitle && r.formTitle.trim() !== ''),
    );

    const hasFiles = fileCount > 0;

    return hasEvidenceText || hasComment || hasManualRef || hasProcessRefAny || hasFormRefAny || hasFiles;
  }

  /* =========================================================
     PRINT
  ========================================================= */

  function handlePrint() {
    if (!doc) return;

    const today = new Date();
    const dateStr = today.toLocaleDateString(locale);
    const timeStr = today.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

    const matrixStatus: MatrixStatus = (doc.status ?? 'draft') as MatrixStatus;

    const psoeSummary = (() => {
      if (!psoeStats.avgLevel) {
        return isDe ? 'PSOE-Reifegrad: – (keine Bewertungen vorhanden)' : 'PSOE maturity: – (no ratings yet)';
      }
      const scoreStr = psoeStats.avgScore.toFixed(1);
      return isDe
        ? `PSOE-Reifegrad gesamt: ${psoeStats.avgLevel} (${scoreStr} / 4)`
        : `Overall PSOE maturity: ${psoeStats.avgLevel} (${scoreStr} / 4)`;
    })();

    const riskSummary = (() => {
      if (riskStats.count === 0) {
        return isDe
          ? `Risiko: – (keine Bewertungen im Scope: ${docRiskScope === 'all' ? 'alle' : 'nur nicht compliant'})`
          : `Risk: – (no ratings in scope: ${docRiskScope === 'all' ? 'all' : 'non-compliant only'})`;
      }
      const avg = riskStats.avgScore.toFixed(1);
      const worst = riskStats.worstScore;
      const docVal = riskStats.docValue != null ? riskStats.docValue.toFixed(1) : '–';
      const modeLbl =
        docRiskMode === 'worst_case' ? (isDe ? 'Worst Case' : 'Worst case') : (isDe ? 'Index (Ø)' : 'Index (avg)');
      return isDe
        ? `Dokumentrisiko (${modeLbl}): ${docVal} / 16 · Ø: ${avg} / 16 · Worst: ${worst} / 16`
        : `Document risk (${modeLbl}): ${docVal} / 16 · Avg: ${avg} / 16 · Worst: ${worst} / 16`;
    })();

    const metaParts: string[] = [];
    const lawRechtsart = (doc as any).lawRechtsart as string | undefined;
    const lawThemenfeld = (doc as any).lawThemenfeld as string | undefined;

    if (lawRechtsart) metaParts.push(`${isDe ? 'Rechtsart' : 'Type'}: ${lawRechtsart}`);
    if (doc.lawKuerzel) metaParts.push(`${isDe ? 'Kürzel' : 'Code'}: ${doc.lawKuerzel}`);
    if (lawThemenfeld) metaParts.push(`${isDe ? 'Themenfeld' : 'Topic'}: ${lawThemenfeld}`);
    metaParts.push(`${isDe ? 'Matrixstatus' : 'Matrix status'}: ${matrixStatusLabel(matrixStatus, isDe)}`);
    const metaLine = metaParts.join(' · ');

    const summaryLine = isDe
      ? `Anforderungen: ${stats.total} · Offen: ${stats.open} · Compliance: ${stats.pct}% · Nicht erfüllt: ${stats.notFulfilled} · N/A: ${stats.na}`
      : `Requirements: ${stats.total} · Open: ${stats.open} · Compliant: ${stats.pct}% · Not fulfilled: ${stats.notFulfilled} · N/A: ${stats.na}`;

    const rowsHtml = clauses
      .map((c) => {
        const ref = buildRef(c as MatrixClauseWithLevels) || '—';
        const title = buildTitle(c as MatrixClauseWithLevels) || '—';
        const status = statusLabel(c.status, isDe);

        const manualsLabel = manualsLabelForClause(c) || '–';
        const procFormsLabel = processAndFormsLabelForClause(c) || '–';

        const evid = hasEvidence(c);
        const evidenceLabel = evid ? (isDe ? 'vorhanden' : 'available') : isDe ? 'fehlt' : 'missing';

        const maturity = c.psoeLevel ?? '—';

        const rLbl = riskLabel(c.riskSeverity, c.riskProbability);
        const rScore = riskScore(c.riskSeverity, c.riskProbability);
        const riskOut = rScore ? `${rLbl} (${rScore}/16)` : '—';

        const safeRef = escapeHtml(ref);
        const safeTitle = escapeHtml(title);
        const safeStatus = escapeHtml(status);
        const safeManuals = escapeHtml(manualsLabel).replace(/\n/g, '<br/>');
        const safeProcForms = escapeHtml(procFormsLabel).replace(/\n/g, '<br/>');
        const safeEvidence = escapeHtml(evidenceLabel);
        const safeMaturity = escapeHtml(maturity);
        const safeRisk = escapeHtml(riskOut);

        return `
          <tr>
            <td>${safeRef}</td>
            <td>${safeTitle}</td>
            <td>${safeStatus}</td>
            <td>${safeManuals}</td>
            <td>${safeProcForms}</td>
            <td style="text-align:center;">${safeEvidence}</td>
            <td style="text-align:center;">${safeMaturity}</td>
            <td style="text-align:center;">${safeRisk}</td>
          </tr>
        `;
      })
      .join('');

    const titleLine =
      doc.lawKuerzel && doc.lawBezeichnung
        ? `${doc.lawKuerzel} – ${doc.lawBezeichnung}`
        : doc.lawBezeichnung || doc.lawKuerzel || (isDe ? 'Compliance-Matrix' : 'Compliance matrix');

    const html = `
<!DOCTYPE html>
<html lang="${isDe ? 'de' : 'en'}">
<head>
  <meta charset="utf-8" />
  <title>LexTrack – ${escapeHtml(titleLine)}</title>
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
    .topbar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap: 10px; }
    .brand { font-size:10px; color:#6b7280; }
    .pill {
      font-size:10px; color:#2563eb; margin-top:4px;
      display:inline-flex; align-items:center;
      padding:2px 8px; border-radius:999px; border:1px solid #bfdbfe; background:#eff6ff;
    }
    .meta-line { font-size:9px; color:#6b7280; margin-bottom:4px; }
    .summary-line {
      margin-top:6px; margin-bottom:10px; font-size:9px; color:#374151;
      display:inline-block; padding:4px 8px; border-radius:999px;
      background:#f9fafb; border:1px solid #e5e7eb;
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
        <h1>${escapeHtml(titleLine)}</h1>
        <h2>${isDe ? 'Compliance-Matrix' : 'Compliance matrix'}</h2>
        <div class="meta-line">${escapeHtml(metaLine)}</div>
        <div class="pill">${escapeHtml(psoeSummary)}</div>
        <div class="pill" style="margin-left:6px;">${escapeHtml(riskSummary)}</div>
        <div class="summary-line">${escapeHtml(summaryLine)}</div>
      </div>
      <div style="text-align:right; font-size:10px; color:#6b7280;">
        <div>${isDe ? 'Ausgedruckt am' : 'Printed on'} ${escapeHtml(dateStr)}</div>
        <div>${escapeHtml(timeStr)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:70px;">${isDe ? 'Referenz' : 'Reference'}</th>
          <th>${isDe ? 'Titel' : 'Title'}</th>
          <th style="width:80px;">${isDe ? 'Status' : 'Status'}</th>
          <th style="width:160px;">${isDe ? 'Manuals' : 'Manuals'}</th>
          <th style="width:180px;">${isDe ? 'Prozesse / Formblätter' : 'Processes / forms'}</th>
          <th style="width:90px; text-align:center;">${isDe ? 'Evidence' : 'Evidence'}</th>
          <th style="width:70px; text-align:center;">${isDe ? 'Reifegrad' : 'Maturity'}</th>
          <th style="width:95px; text-align:center;">${isDe ? 'Risiko' : 'Risk'}</th>
        </tr>
      </thead>
      <tbody>
        ${
          rowsHtml ||
          `
          <tr>
            <td colspan="8" style="text-align:center; color:#9ca3af;">
              ${isDe ? 'Keine Anforderungen erfasst.' : 'No requirements recorded.'}
            </td>
          </tr>`
        }
      </tbody>
    </table>

    <table>
      <tfoot>
        <tr>
          <td>© 2025 LexTrack – Regulatory Intelligence &amp; Compliance</td>
          <td style="text-align:right;">${isDe ? 'Intern' : 'Internal'}</td>
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

    try {
      printWindow.onafterprint = () => {
        try {
          printWindow.close();
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* ignore */
    }

    printWindow.print();
  }

  /* =========================================================
     Render: No doc selected
  ========================================================= */

  if (!doc) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-sm text-slate-500">
        {isDe ? (
          <p>Wähle links ein Dokument aus oder lege eine neue Compliance Matrix an, um Paragraphen zu erfassen und zu bewerten.</p>
        ) : (
          <p>Select a document on the left or create a new compliance matrix to add and assess clauses.</p>
        )}
      </div>
    );
  }

  const matrixStatus: MatrixStatus = (doc.status ?? 'draft') as MatrixStatus;

  const docRiskChip = (() => {
    if (riskStats.count === 0 || riskStats.docValue == null || !riskStats.docBand) {
      return isDe ? 'Dokumentrisiko: –' : 'Document risk: –';
    }
    const v = riskStats.docValue.toFixed(1);
    const band = riskBandLabel(riskStats.docBand, isDe);
    const modeLbl =
      docRiskMode === 'worst_case'
        ? isDe
          ? 'Worst Case'
          : 'Worst case'
        : isDe
          ? 'Index (Ø)'
          : 'Index (avg)';
    return isDe ? `Dokumentrisiko (${modeLbl}): ${v}/16 (${band})` : `Document risk (${modeLbl}): ${v}/16 (${band})`;
  })();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {isDe ? 'Compliance Matrix' : 'Compliance matrix'}
          </div>
          <div className="truncate text-base font-semibold text-slate-900">
            {doc.lawKuerzel && doc.lawBezeichnung ? `${doc.lawKuerzel} – ${doc.lawBezeichnung}` : doc.lawBezeichnung || doc.lawKuerzel}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            <span className={['inline-flex items-center rounded-full border px-2 py-0.5 font-medium', matrixStatusColorClasses(matrixStatus)].join(' ')}>
              {isDe ? 'Status:' : 'Status:'} {matrixStatusLabel(matrixStatus, isDe)}
            </span>

            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
              {isDe ? 'Compliance:' : 'Compliant:'} {stats.pct}%
            </span>

            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
              {docRiskChip}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAddClause}
            className="rounded-lg bg-[#009A93] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#008b84]"
          >
            + {isDe ? 'Anforderung' : 'Clause'}
          </button>

          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700"
              value={matrixStatus}
              onChange={(e) => handleMatrixStatusChange(e.target.value as MatrixStatus)}
              title={isDe ? 'Matrixstatus' : 'Matrix status'}
            >
              <option value="draft">{isDe ? 'Angelegt' : 'Draft'}</option>
              <option value="in_review">{isDe ? 'In Bewertung' : 'In review'}</option>
              <option value="final">{isDe ? 'Abgeschlossen' : 'Completed'}</option>
            </select>

            <button
              ref={filterButtonRef}
              type="button"
              onClick={() => {
                setPendingStatusFilter(statusFilter);
                setShowFilterPanel((p) => !p);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title={isDe ? 'Filter' : 'Filter'}
            >
              <Filter size={14} />
              {isDe ? 'Filter' : 'Filter'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title={isDe ? 'Drucken' : 'Print'}
            >
              <Printer size={14} />
              {isDe ? 'Drucken' : 'Print'}
            </button>

            <button
              type="button"
              onClick={openDeleteModal}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
              title={isDe ? 'Matrix löschen' : 'Delete matrix'}
            >
              <Trash2 size={14} />
              {isDe ? 'Löschen' : 'Delete'}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div
              ref={filterPanelRef}
              className="absolute right-3 top-[calc(100%+8px)] z-30 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
            >
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {isDe ? 'Statusfilter' : 'Status filter'}
              </div>

              <div className="flex flex-wrap gap-1">
                {(['all', 'open', 'compliant', 'not_fulfilled', 'not_applicable'] as const).map((s) => {
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
                      onClick={() => setPendingStatusFilter(s as any)}
                      className={[
                        'rounded-full border px-2.5 py-1 text-[11px]',
                        active
                          ? 'border-[#009A93] bg-[#009A93] text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingStatusFilter(statusFilter);
                    setShowFilterPanel(false);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {isDe ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter(pendingStatusFilter);
                    setShowFilterPanel(false);
                  }}
                  className="rounded-lg bg-[#009A93] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#008b84]"
                >
                  {isDe ? 'Anwenden' : 'Apply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI / Gauge / Risk */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {isDe ? 'Übersicht' : 'Overview'}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-slate-500">{isDe ? 'Anforderungen' : 'Requirements'}</div>
              <div className="text-sm font-semibold text-slate-900">{stats.total}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-slate-500">{isDe ? 'Offen' : 'Open'}</div>
              <div className="text-sm font-semibold text-slate-900">{stats.open}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-slate-500">{isDe ? 'Nicht erfüllt' : 'Not fulfilled'}</div>
              <div className="text-sm font-semibold text-slate-900">{stats.notFulfilled}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-slate-500">{isDe ? 'N/A' : 'N/A'}</div>
              <div className="text-sm font-semibold text-slate-900">{stats.na}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <PsoeGauge
            avgScore={psoeStats.avgScore}
            avgLevel={psoeStats.avgLevel}
            isDe={isDe}
            onInfoClick={() => setShowPsoeInfo((prev) => !prev)}
          />

          {showPsoeInfo && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[11px] text-slate-800">
              <div className="font-semibold text-slate-900">{isDe ? 'PSOE-Reifegrade' : 'PSOE maturity levels'}</div>
              <p className="mt-1 text-slate-700">
                {isDe
                  ? 'PSOE beschreibt den Reifegrad von Systemen und Prozessen – von ersten Grundlagen bis zur nachweislich wirksamen Umsetzung.'
                  : 'PSOE describes the maturity of systems and processes – from basic foundations to demonstrably effective operation.'}
              </p>
              <ul className="mt-2 list-disc space-y-0.5 pl-4">
                <li>
                  <strong>P – Present:</strong>{' '}
                  {isDe ? 'Grundbewusstsein und minimale Strukturen sind vorhanden.' : 'Basic awareness and minimal structures are present.'}
                </li>
                <li>
                  <strong>S – Suitable:</strong>{' '}
                  {isDe ? 'Systeme/Prozesse sind grundsätzlich geeignet und für den Zweck validiert.' : 'Systems/processes are suitable and validated.'}
                </li>
                <li>
                  <strong>O – Operational:</strong>{' '}
                  {isDe ? 'Systeme/Prozesse laufen stabil im Regelbetrieb.' : 'Systems/processes operate reliably.'}
                </li>
                <li>
                  <strong>E – Effective:</strong>{' '}
                  {isDe ? 'Nachweislich wirksam und effizient; kontinuierliche Verbesserung etabliert.' : 'Demonstrably effective and efficient; continuous improvement established.'}
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Risk card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  {isDe ? 'Ihr Risiko' : 'Your risk'}
                </div>

                <button
                  type="button"
                  onClick={() => setShowRiskInfo((prev) => !prev)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-400 text-[10px] text-slate-700 hover:bg-slate-100"
                  title={isDe ? 'Erklärung anzeigen' : 'Show explanation'}
                >
                  i
                </button>
              </div>

              {showRiskInfo && (
                <div className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700">
                  <div className="font-semibold text-slate-900">
                    {isDe ? 'Risiko – Erklärung' : 'Risk – explanation'}
                  </div>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    <li>{isDe ? 'Severity (S): Auswirkungsstärke (1–4).' : 'Severity (S): impact level (1–4).'}</li>
                    <li>{isDe ? 'Probability (P): Eintrittswahrscheinlichkeit (1–4).' : 'Probability (P): likelihood (1–4).'}</li>
                    <li>{isDe ? 'Score = S × P (1–16).' : 'Score = S × P (1–16).'}</li>
                    <li>
                      {isDe
                        ? 'Gesamtrisiko: je nach Einstellung „Worst Case (max)“ oder „Index (Ø)“.'
                        : 'Document risk: depending on setting “Worst case (max)” or “Index (avg)”.'}
                    </li>
                    <li>
                      {isDe
                        ? 'Scope: optional nur Anforderungen, die nicht compliant sind.'
                        : 'Scope: optionally only non-compliant requirements.'}
                    </li>
                  </ul>
                </div>
              )}

              {riskStats.count === 0 ? (
                <div className="mt-1 text-[11px] text-slate-500">
                  {isDe
                    ? `Noch keine Risk-Bewertungen im gewählten Scope (${docRiskScope === 'all' ? 'alle' : 'nur nicht compliant'}).`
                    : `No risk ratings in selected scope (${docRiskScope === 'all' ? 'all' : 'non-compliant only'}).`}
                </div>
              ) : (
                <div className="mt-1 space-y-1 text-[11px] text-slate-700">
                  <div>
                    {isDe ? 'Dokumentrisiko:' : 'Document risk:'}{' '}
                    <span className="font-semibold">
                      {riskStats.docValue != null ? riskStats.docValue.toFixed(1) : '–'} / 16
                    </span>
                  </div>
                  <div>
                    {isDe ? 'Ø Score:' : 'Avg score:'}{' '}
                    <span className="font-semibold">{riskStats.avgScore.toFixed(1)} / 16</span>
                  </div>
                  <div>
                    {isDe ? 'Worst case:' : 'Worst case:'}{' '}
                    <span className="font-semibold">{riskStats.worstScore} / 16</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(['low', 'medium', 'high', 'critical'] as RiskBand[]).map((b) => (
                      <span
                        key={b}
                        className={[
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                          riskBandClasses(b),
                        ].join(' ')}
                      >
                        {riskBandLabel(b, isDe)}: {riskStats.bands[b]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-2 text-[11px]">
                <span className="font-semibold text-slate-600">
                  {isDe ? 'Gesamtrisiko:' : 'Document risk:'}
                </span>

                <select
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-800 focus:outline-none"
                  value={docRiskMode}
                  onChange={(e) =>
                    updateDocRiskSettings(doc.id, {
                      riskAggregationMode: e.target.value as DocRiskAggregationMode,
                    })
                  }
                  title={isDe ? 'Berechnungsmethode' : 'Aggregation method'}
                >
                  <option value="worst_case">{isDe ? 'Worst Case (max)' : 'Worst case (max)'}</option>
                  <option value="index">{isDe ? 'Index (Ø)' : 'Index (avg)'}</option>
                </select>

                <label className="ml-1 inline-flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    className="h-3 w-3"
                    checked={docRiskScope === 'non_compliant'}
                    onChange={(e) =>
                      updateDocRiskSettings(doc.id, {
                        riskScope: e.target.checked ? 'non_compliant' : 'all',
                      })
                    }
                  />
                  {isDe ? 'nur nicht compliant' : 'only non-compliant'}
                </label>
              </div>
            </div>

            <div className="shrink-0">
              <div className="grid grid-cols-5 gap-1 text-[9px] text-slate-500">
                <div />
                {[1, 2, 3, 4].map((p) => (
                  <div key={p} className="text-center">
                    P{p}
                  </div>
                ))}

                {[4, 3, 2, 1].map((s) => (
                  <React.Fragment key={s}>
                    <div className="flex items-center justify-center">S{s}</div>
                    {[1, 2, 3, 4].map((p) => {
                      const score = s * p;
                      const band = riskBand(score);

                      const isMarker =
                        riskStats.markerS && riskStats.markerP
                          ? riskStats.markerS === (s as RiskLevel) && riskStats.markerP === (p as RiskLevel)
                          : false;

                      return (
                        <div
                          key={`${s}-${p}`}
                          className={[
                            'relative h-6 w-6 rounded border',
                            band === 'low'
                              ? 'bg-emerald-200 border-emerald-300'
                              : band === 'medium'
                                ? 'bg-amber-200 border-amber-300'
                                : band === 'high'
                                  ? 'bg-orange-200 border-orange-300'
                                  : 'bg-rose-200 border-rose-300',
                          ].join(' ')}
                          title={`S${s}/P${p} = ${score}`}
                        >
                          {isMarker && (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-900">
                              ●
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              <div className="mt-1 text-[9px] text-slate-500">
                {isDe ? 'Marker:' : 'Marker:'}{' '}
                {docRiskMode === 'worst_case'
                  ? isDe
                    ? 'Worst Case'
                    : 'Worst case'
                  : isDe
                    ? 'Index (Ø)'
                    : 'Index (avg)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table + Detail */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Tabelle */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[420px] overflow-auto">
            <table className="min-w-full table-fixed border-collapse text-xs">
              <thead className="border-b border-[#008b84] bg-[#009A93]">
                <tr>
                  <th className="w-24 px-3 py-1.5 text-left font-medium text-slate-900">{isDe ? 'Referenz' : 'Reference'}</th>
                  <th className="w-40 px-3 py-1.5 text-left font-medium text-slate-900">{isDe ? 'Titel' : 'Title'}</th>
                  <th className="w-28 px-3 py-1.5 text-left font-medium text-slate-900">{isDe ? 'Status' : 'Status'}</th>
                  <th className="w-56 px-3 py-1.5 text-left font-medium text-slate-900">{isDe ? 'Manuals' : 'Manuals'}</th>
                  <th className="w-56 px-3 py-1.5 text-left font-medium text-slate-900">{isDe ? 'Prozesse / Formblätter' : 'Processes / forms'}</th>
                  <th className="w-24 px-3 py-1.5 text-center font-medium text-slate-900">{isDe ? 'Evidence' : 'Evidence'}</th>
                  <th className="w-24 px-3 py-1.5 text-center font-medium text-slate-900">{isDe ? 'Reifegrad' : 'Maturity'}</th>
                  <th className="w-24 px-3 py-1.5 text-center font-medium text-slate-900">{isDe ? 'Risk' : 'Risk'}</th>
                </tr>
              </thead>

              <tbody>
                {filteredClauses.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-center text-xs text-slate-400" colSpan={8}>
                      {isDe ? 'Keine Anforderungen gemäß Filter.' : 'No requirements matching the filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredClauses.map((c) => {
                    const ref = buildRef(c as MatrixClauseWithLevels) || '–';
                    const title = buildTitle(c as MatrixClauseWithLevels) || '–';
                    const isSelected = c.id === selectedClauseId;

                    const manualsLabel = manualsLabelForClause(c);
                    const procFormsLabel = processAndFormsLabelForClause(c);

                    const evid = hasEvidence(c);
                    const evidenceLabel = evid ? (isDe ? 'vorhanden' : 'available') : isDe ? 'fehlt' : 'missing';

                    const rScore = riskScore(c.riskSeverity, c.riskProbability);
                    const rLbl = riskLabel(c.riskSeverity, c.riskProbability);
                    const rBand = rScore ? riskBand(rScore) : null;

                    return (
                      <tr
                        key={c.id}
                        className={[
                          'cursor-pointer border-b border-slate-100',
                          isSelected ? 'bg-[#009A93]/5' : 'hover:bg-slate-50',
                        ].join(' ')}
                        onClick={() => setSelectedClauseId(c.id)}
                      >
                        <td className="whitespace-nowrap px-3 py-1.5 align-top text-slate-800">{ref}</td>

                        <td className="px-3 py-1.5 align-top text-slate-700">
                          <div className="line-clamp-2">{title}</div>
                        </td>

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

                        <td className="px-3 py-1.5 align-top text-left text-slate-600">
                          <div className="whitespace-pre-line leading-snug">{manualsLabel}</div>
                        </td>

                        <td className="px-3 py-1.5 align-top text-left text-slate-600">
                          <div className="whitespace-pre-line leading-snug">{procFormsLabel}</div>
                        </td>

                        <td className="px-3 py-1.5 align-top text-center text-slate-600">{evidenceLabel}</td>

                        <td className="px-3 py-1.5 align-top text-center text-slate-600">{c.psoeLevel ?? '–'}</td>

                        <td className="px-3 py-1.5 align-top text-center">
                          {rScore ? (
                            <span
                              className={[
                                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                riskBandClasses(rBand!),
                              ].join(' ')}
                              title={`Score: ${rScore}/16`}
                            >
                              {rLbl}
                            </span>
                          ) : (
                            <span className="text-slate-500">–</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Editor */}
        {selectedClause ? (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {isDe ? 'Ausgewählte Anforderung' : 'Selected requirement'}
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {buildRef(selectedClause as MatrixClauseWithLevels) || (isDe ? 'Ohne Referenz' : 'No ref')}
                </div>
                <div className="text-xs text-slate-600">{buildTitle(selectedClause as MatrixClauseWithLevels) || '\u00A0'}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full border border-slate-300 bg-slate-50 p-1 text-[10px]">
                  {(['open', 'compliant', 'not_fulfilled', 'not_applicable'] as ComplianceStatus[]).map((s) => {
                    const active = selectedClause.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusChange(selectedClause, s)}
                        className={['rounded-full px-2 py-1', active ? 'bg-[#009A93] text-white' : 'text-slate-600 hover:bg-white'].join(' ')}
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
                  onClick={() => openRiskModal(selectedClause)}
                  className="inline-flex items-center rounded-full border border-amber-200 px-3 py-1 text-[11px] text-amber-800 hover:bg-amber-50"
                >
                  {isDe ? 'Risiko bewerten' : 'Assess risk'}
                </button>

                <button
                  type="button"
                  onClick={() => requestDeleteClause(selectedClause)}
                  className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 text-[11px] text-rose-600 hover:bg-rose-50"
                >
                  {isDe ? 'Löschen' : 'Delete'}
                </button>
              </div>
            </div>

            {/* Referenzebenen */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[1, 2, 3].map((lvl) => {
                const refKey = `refLevel${lvl}` as keyof MatrixClause;
                const titleKey = `titleLevel${lvl}` as keyof MatrixClause;

                return (
                  <div key={lvl} className="space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {isDe ? `Referenz Ebene ${lvl}` : `Reference level ${lvl}`}
                    </div>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                      value={(selectedClause[refKey] as string) || ''}
                      onChange={(e) => handleClauseChange(selectedClause, { [refKey]: e.target.value } as any)}
                      placeholder={
                        lvl === 1 ? (isDe ? 'z.B. 4.1' : 'e.g. 4.1') : lvl === 2 ? (isDe ? 'z.B. (a)' : 'e.g. (a)') : (isDe ? 'z.B. (1)' : 'e.g. (1)')
                      }
                    />
                    <input
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                      value={(selectedClause[titleKey] as string) || ''}
                      onChange={(e) => handleClauseChange(selectedClause, { [titleKey]: e.target.value } as any)}
                      placeholder={isDe ? 'Titel / Überschrift' : 'Title / heading'}
                    />
                  </div>
                );
              })}
            </div>

            {/* Gesetzestext */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {isDe ? 'Gesetzestext / Anforderung' : 'Requirement text'}
              </div>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                rows={3}
                value={selectedClause.requirementText || ''}
                onChange={(e) => handleClauseChange(selectedClause, { requirementText: e.target.value })}
                placeholder={isDe ? 'Hier den relevanten Gesetzes-/Normtext oder die Anforderung einfügen…' : 'Paste the relevant regulation/standard text or requirement here…'}
              />
            </div>

            {/* Evidence + Kommentar */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {isDe ? 'Evidence / Nachweise' : 'Evidence / proof'}
                </div>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                  rows={3}
                  value={selectedClause.evidenceNote || ''}
                  onChange={(e) => handleClauseChange(selectedClause, { evidenceNote: e.target.value })}
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
                  onChange={(e) => handleClauseChange(selectedClause, { comment: e.target.value })}
                />
              </div>
            </div>

            {/* Strukturierte Evidence-Referenzen: 3 Bereiche */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {/* Interne Dokumente / Handbücher */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {isDe ? 'Interne Dokumente / Handbücher' : 'Internal manuals / documents'}
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
                    {isDe ? 'Noch keine internen Dokumente verknüpft.' : 'No internal documents linked yet.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(selectedClause.internalRefs ?? []).map((r) => (
                      <div key={r.id} className="space-y-1 rounded-md border border-slate-200 bg-white px-2 py-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={isDe ? 'Exposition' : 'Exposition'}
                            value={r.exposition}
                            onChange={(e) => updateInternalRef(selectedClause, r.id, { exposition: e.target.value })}
                          />
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={isDe ? 'Kapitel' : 'Chapter'}
                            value={r.chapter}
                            onChange={(e) => updateInternalRef(selectedClause, r.id, { chapter: e.target.value })}
                          />
                        </div>

                        <div className="flex gap-2">
                          <input
                            className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={isDe ? 'Kurzbeschreibung / Inhalt' : 'Short description / content'}
                            value={r.description}
                            onChange={(e) => updateInternalRef(selectedClause, r.id, { description: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => removeInternalRef(selectedClause, r.id)}
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

              {/* Prozesse */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {isDe ? 'Prozesse' : 'Processes'}
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
                    {isDe ? 'Noch keine Prozesse verknüpft.' : 'No processes linked yet.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(selectedClause.processRefs ?? []).map((r) => (
                      <div key={r.id} className="space-y-1 rounded-md border border-slate-200 bg-white px-2 py-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={isDe ? 'Prozessnummer' : 'Process no.'}
                            value={r.processNumber}
                            onChange={(e) => updateProcessRef(selectedClause, r.id, { processNumber: e.target.value })}
                          />
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={isDe ? 'Prozesstitel' : 'Process title'}
                            value={r.processTitle}
                            onChange={(e) => updateProcessRef(selectedClause, r.id, { processTitle: e.target.value })}
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeProcessRef(selectedClause, r.id)}
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

              {/* Formblätter */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {isDe ? 'Formblätter' : 'Forms'}
                  </div>
                  <button
                    type="button"
                    onClick={() => addFormRef(selectedClause)}
                    className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-100"
                  >
                    + {isDe ? 'Referenz' : 'Reference'}
                  </button>
                </div>

                {(selectedClause.formRefs ?? []).length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    {isDe ? 'Noch keine Formblätter verknüpft.' : 'No forms linked yet.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(selectedClause.formRefs ?? []).map((r) => (
                      <div key={r.id} className="space-y-1 rounded-md border border-slate-200 bg-white px-2 py-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={isDe ? 'Formblatt-Nr.' : 'Form no.'}
                            value={r.formNumber}
                            onChange={(e) => updateFormRef(selectedClause, r.id, { formNumber: e.target.value })}
                          />
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                            placeholder={isDe ? 'Bezeichnung' : 'Title'}
                            value={r.formTitle}
                            onChange={(e) => updateFormRef(selectedClause, r.id, { formTitle: e.target.value })}
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeFormRef(selectedClause, r.id)}
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

            {/* Attachments */}
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
              <p>Klicke oben in der Tabelle auf eine Anforderung, um Details, Referenzen und Evidence zu bearbeiten.</p>
            ) : (
              <p>Click a requirement in the table above to edit its details, references and evidence.</p>
            )}
          </div>
        )}
      </div>

      {/* Matrix löschen - Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <h2 className="mb-1 text-sm font-semibold text-slate-900">{isDe ? 'Eintrag wirklich löschen?' : 'Really delete this entry?'}</h2>
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

      {/* Clause löschen - Modal */}
      {deleteClauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <h2 className="mb-1 text-sm font-semibold text-slate-900">{isDe ? 'Paragraph wirklich löschen?' : 'Really delete this clause?'}</h2>
            <p className="mb-3 text-xs text-slate-600">{isDe ? 'Dieser Vorgang kann nicht rückgängig gemacht werden.' : 'This action cannot be undone.'}</p>

            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-800">
              <div className="mb-1 font-semibold text-slate-700">{isDe ? 'Betroffener Eintrag' : 'Affected entry'}</div>
              <div className="text-slate-700">
                <div>
                  <span className="font-semibold">{isDe ? 'Referenz:' : 'Reference:'}</span>{' '}
                  {buildRef(deleteClauseModal as MatrixClauseWithLevels) || '–'}
                </div>
                <div className="mt-0.5">
                  <span className="font-semibold">{isDe ? 'Titel:' : 'Title:'}</span>{' '}
                  {buildTitle(deleteClauseModal as MatrixClauseWithLevels) || '–'}
                </div>
                <div className="mt-0.5">
                  <span className="font-semibold">{isDe ? 'Status:' : 'Status:'}</span>{' '}
                  {statusLabel(deleteClauseModal.status, isDe)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteClauseModal(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {isDe ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteClause}
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
            <h2 className="mb-2 text-sm font-semibold text-slate-900">{isDe ? 'Reifegrad (PSOE) bewerten' : 'Assess maturity (PSOE)'}</h2>

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
                    psoeSelection === lvl ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    className="mt-0.5 h-3 w-3"
                    checked={psoeSelection === lvl}
                    onChange={() => setPsoeSelection(lvl)}
                  />
                  <div>
                    <div className="font-semibold text-slate-800">{psoeLabel(lvl, isDe)}</div>
                    {isDe ? (
                      <p className="text-[10px] text-slate-600">
                        {lvl === 'P' && 'Grundlagen / Bewusstsein vorhanden, minimale Fähigkeiten.'}
                        {lvl === 'S' && 'System/Prozess ist grundsätzlich geeignet und einsatzfähig.'}
                        {lvl === 'O' && 'System/Prozess läuft stabil im Betrieb unter typischen Bedingungen.'}
                        {lvl === 'E' && 'System/Prozess ist nachweislich wirksam und effizient.'}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-600">
                        {lvl === 'P' && 'Basic awareness and minimal capabilities are established.'}
                        {lvl === 'S' && 'System/process meets baseline suitability and can be used.'}
                        {lvl === 'O' && 'System/process operates consistently under typical conditions.'}
                        {lvl === 'E' && 'System/process is demonstrably effective and efficient.'}
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
                  psoeSelection ? 'bg-sky-600 hover:bg-sky-700' : 'cursor-not-allowed bg-slate-300',
                ].join(' ')}
              >
                {isDe ? 'Speichern' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Risk-Modal */}
      {riskModalClause && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
          <div className="w-full max-w-md rounded-xl bg-white p-4 text-xs shadow-xl">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">{isDe ? 'Risiko bewerten' : 'Assess risk'}</h2>

            <p className="mb-3 text-[11px] text-slate-600">
              {isDe ? 'Wähle Severity (S) und Probability (P). Score = S × P (1–16).' : 'Select Severity (S) and Probability (P). Score = S × P (1–16).'}
            </p>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Severity (S)</div>
                <div className="grid grid-cols-4 gap-2">
                  {([1, 2, 3, 4] as RiskLevel[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRiskS(v)}
                      className={[
                        'rounded-lg border px-2 py-2 text-[12px] font-semibold',
                        riskS === v ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-200 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Probability (P)</div>
                <div className="grid grid-cols-4 gap-2">
                  {([1, 2, 3, 4] as RiskLevel[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRiskP(v)}
                      className={[
                        'rounded-lg border px-2 py-2 text-[12px] font-semibold',
                        riskP === v ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-200 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {(() => {
                const sc = riskScore(riskS ?? undefined, riskP ?? undefined);
                if (!sc) {
                  return <div className="text-[11px] text-slate-600">{isDe ? 'Bitte S und P auswählen.' : 'Please select S and P.'}</div>;
                }
                const band = riskBand(sc);
                return (
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-slate-700">
                      <span className="font-semibold">{isDe ? 'Auswahl:' : 'Selection:'}</span>{' '}
                      {riskLabel(riskS ?? undefined, riskP ?? undefined)}
                      <span className="mx-2 text-slate-400">·</span>
                      <span className="font-semibold">{isDe ? 'Score:' : 'Score:'}</span> {sc}/16
                    </div>
                    <span className={['inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', riskBandClasses(band)].join(' ')}>
                      {riskBandLabel(band, isDe)}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeRiskModal}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {isDe ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={saveRisk}
                disabled={!riskS || !riskP}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-medium text-white',
                  riskS && riskP ? 'bg-amber-600 hover:bg-amber-700' : 'cursor-not-allowed bg-slate-300',
                ].join(' ')}
              >
                {isDe ? 'Speichern' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
