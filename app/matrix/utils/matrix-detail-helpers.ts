// app/matrix/utils/matrix-detail-helpers.ts

import type { MatrixClause, PsoeLevel, RiskLevel } from '../matrixstore';

/* =========================================================
   Typen (Exports)
========================================================= */

export type MatrixClauseWithLevels = MatrixClause & {
  refLevel1?: string;
  refLevel2?: string;
  refLevel3?: string;
  titleLevel1?: string;
  titleLevel2?: string;
  titleLevel3?: string;
};

export type DocRiskAggregationMode = 'worst_case' | 'index';
export type DocRiskScope = 'all' | 'non_compliant';
export type RiskBand = 'low' | 'medium' | 'high' | 'critical';

export type MatrixKpiStats = {
  total: number;
  open: number;
  compliant: number;
  notFulfilled: number;
  na: number;
  pct: number;
};

export type PsoeKpiStats = {
  avgScore: number;
  avgLevel: PsoeLevel | null;
};

export type RiskKpiStats = {
  count: number;
  avgScore: number;
  avgS: RiskLevel | null;
  avgP: RiskLevel | null;
  worstScore: number;
  worstS: RiskLevel | null;
  worstP: RiskLevel | null;
  worstClauseId: string | null;
  docValue: number | null;
  docBand: RiskBand | null;
  markerS: RiskLevel | null;
  markerP: RiskLevel | null;
  bands: Record<RiskBand, number>;
};

/* =========================================================
   KPI helpers
========================================================= */

export function computeMatrixKpis(clauses: MatrixClause[]): MatrixKpiStats {
  const total = clauses.length;
  const open = clauses.filter((c) => c.status === 'open').length;
  const compliant = clauses.filter((c) => c.status === 'compliant').length;
  const notFulfilled = clauses.filter((c) => c.status === 'not_fulfilled').length;
  const na = clauses.filter((c) => c.status === 'not_applicable').length;
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
  return { total, open, compliant, notFulfilled, na, pct };
}

export function computePsoeKpis(
  clauses: MatrixClause[],
  psoeScore: Record<PsoeLevel, number>
): PsoeKpiStats {
  const withLevel = clauses.filter(
    (c): c is MatrixClause & { psoeLevel: PsoeLevel } => !!c.psoeLevel
  );
  if (withLevel.length === 0) return { avgScore: 0, avgLevel: null };

  const sum = withLevel.reduce((acc, c) => acc + psoeScore[c.psoeLevel], 0);
  const avgScore = sum / withLevel.length;

  const levels: PsoeLevel[] = ['P', 'S', 'O', 'E'];
  let best: PsoeLevel = 'P';
  let bestDiff = Infinity;

  for (const lvl of levels) {
    const diff = Math.abs(psoeScore[lvl] - avgScore);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = lvl;
    }
  }

  return { avgScore, avgLevel: best };
}

export function computeRiskKpis(opts: {
  clauses: MatrixClause[];
  docRiskScope: DocRiskScope;
  docRiskMode: DocRiskAggregationMode;
  clampRiskLevel: (n: number) => RiskLevel;
  riskBand: (score: number) => RiskBand;
}): RiskKpiStats {
  const { clauses, docRiskScope, docRiskMode, clampRiskLevel, riskBand } = opts;

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
    return { id: c.id, s, p, score };
  });

  if (withRisk.length === 0) {
    return {
      count: 0,
      avgScore: 0,
      avgS: null,
      avgP: null,
      worstScore: 0,
      worstS: null,
      worstP: null,
      worstClauseId: null,
      docValue: null,
      docBand: null,
      markerS: null,
      markerP: null,
      bands: { low: 0, medium: 0, high: 0, critical: 0 },
    };
  }

  const sumScore = withRisk.reduce((acc, r) => acc + r.score, 0);
  const avgScore = sumScore / withRisk.length;

  const avgSRaw = withRisk.reduce((acc, r) => acc + r.s, 0) / withRisk.length;
  const avgPRaw = withRisk.reduce((acc, r) => acc + r.p, 0) / withRisk.length;

  const worst = withRisk.reduce(
    (best, r) => (r.score > best.score ? r : best),
    withRisk[0]
  );

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
}

/* =========================================================
   Ref / Title
========================================================= */

export function buildRef(c: MatrixClauseWithLevels): string {
  const parts: string[] = [];
  if (c.refLevel1) parts.push(c.refLevel1);
  if (c.refLevel2) parts.push(c.refLevel2);
  if (c.refLevel3) parts.push(c.refLevel3);
  return parts.join(' ');
}

export function buildTitle(c: MatrixClauseWithLevels): string {
  const parts: string[] = [];
  if (c.titleLevel1) parts.push(c.titleLevel1);
  if (c.titleLevel2) parts.push(c.titleLevel2);
  if (c.titleLevel3) parts.push(c.titleLevel3);
  return parts.join(' – ');
}

/* =========================================================
   Labels für Referenzen
========================================================= */

export function manualsLabelForClause(c: MatrixClause): string {
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

export function processLabelForClause(c: MatrixClause): string {
  const refs = c.processRefs ?? [];
  const lines = refs
    .map((r) => [r.processNumber, r.processTitle].filter(Boolean).join(' – '))
    .filter(Boolean) as string[];

  if (lines.length === 0) return '–';
  return lines.join('\n');
}

export function formLabelForClause(c: MatrixClause): string {
  const refs = c.formRefs ?? [];
  const lines = refs
    .map((r) => [r.formNumber, r.formTitle].filter(Boolean).join(' – '))
    .filter(Boolean) as string[];

  if (lines.length === 0) return '–';
  return lines.join('\n');
}

export function processAndFormsLabelForClause(c: MatrixClause): string {
  const p = processLabelForClause(c);
  const f = formLabelForClause(c);

  const parts: string[] = [];
  if (p && p !== '–') parts.push(p);
  if (f && f !== '–') parts.push(f);

  return parts.length ? parts.join('\n') : '–';
}

/* =========================================================
   PSOE Helpers
========================================================= */

export const PSOE_SCORE: Record<PsoeLevel, number> = { P: 1, S: 2, O: 3, E: 4 };

export function psoeLabel(level: PsoeLevel, isDe: boolean): string {
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

export function psoeNeedlePercent(avgScore: number) {
  const s = clampNum(avgScore || 1, 1, 4);
  return ((s - 1) / 3) * 100;
}

/* =========================================================
   Risk helpers (4x4)
========================================================= */

export function riskScore(s?: RiskLevel | null, p?: RiskLevel | null): number | null {
  if (!s || !p) return null;
  return s * p;
}

export function riskBand(score: number): RiskBand {
  if (score >= 13) return 'critical';
  if (score >= 9) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

export function riskBandLabel(b: RiskBand, isDe: boolean): string {
  if (isDe) {
    switch (b) {
      case 'low':
        return 'Niedrig';
      case 'medium':
        return 'Mittel';
      case 'high':
        return 'Hoch';
      case 'critical':
        return 'Kritisch';
    }
  } else {
    switch (b) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      case 'critical':
        return 'Critical';
    }
  }
  return isDe ? 'Unbekannt' : 'Unknown';
}

export function riskBandClasses(b: RiskBand): string {
  switch (b) {
    case 'low':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'medium':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'high':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'critical':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function riskLabel(s?: RiskLevel | null, p?: RiskLevel | null): string {
  if (!s || !p) return '–';
  return `S${s}/P${p}`;
}

export function clampRiskLevel(n: number): RiskLevel {
  return Math.min(4, Math.max(1, Math.round(n))) as RiskLevel;
}

/* =========================================================
   ID helper
========================================================= */

export function createLocalId(prefix: string): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  const maybe = c as unknown as { randomUUID?: () => string } | undefined;

  if (maybe?.randomUUID && typeof maybe.randomUUID === 'function') {
    return `${prefix}_${maybe.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}