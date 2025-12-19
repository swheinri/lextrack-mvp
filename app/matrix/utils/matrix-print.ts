// app/matrix/utils/matrix-print.ts
import type { MatrixClause, MatrixStatus, PsoeLevel, RiskLevel } from '../matrixstore';
import { matrixStatusLabel, statusLabel } from './matrix-status';

type MatrixClauseWithLevels = MatrixClause & {
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

type MatrixPrintDoc = {
  id: string;
  status?: MatrixStatus;
  lawKuerzel?: string;
  lawBezeichnung?: string;
  lawRechtsart?: string;
  lawThemenfeld?: string;
  // offen für zusätzliche Felder aus deinem Store – ohne `any`
  [key: string]: unknown;
};

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

function escapeHtml(input: unknown): string {
  const s = String(input ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function riskScore(s?: RiskLevel, p?: RiskLevel): number | null {
  if (!s || !p) return null;
  return s * p;
}

function riskLabel(s?: RiskLevel, p?: RiskLevel): string {
  if (!s || !p) return '–';
  return `S${s}/P${p}`;
}

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

export function printMatrix(opts: {
  doc: MatrixPrintDoc;
  clauses: MatrixClause[];
  isDe: boolean;
  locale: string;
  stats: { total: number; open: number; pct: number; notFulfilled: number; na: number };
  psoeStats: { avgScore: number; avgLevel: PsoeLevel | null };
  riskStats: { count: number; avgScore: number; worstScore: number; docValue: number | null };
  docRiskMode: DocRiskAggregationMode;
  docRiskScope: DocRiskScope;
  hasEvidence: (c: MatrixClause) => boolean;
}): void {
  const {
    doc,
    clauses,
    isDe,
    locale,
    stats,
    psoeStats,
    riskStats,
    docRiskMode,
    docRiskScope,
    hasEvidence,
  } = opts;

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
      docRiskMode === 'worst_case'
        ? isDe
          ? 'Worst Case'
          : 'Worst case'
        : isDe
          ? 'Index (Ø)'
          : 'Index (avg)';
    return isDe
      ? `Dokumentrisiko (${modeLbl}): ${docVal} / 16 · Ø: ${avg} / 16 · Worst: ${worst} / 16`
      : `Document risk (${modeLbl}): ${docVal} / 16 · Avg: ${avg} / 16 · Worst: ${worst} / 16`;
  })();

  const metaParts: string[] = [];
  const lawRechtsart = typeof doc.lawRechtsart === 'string' ? doc.lawRechtsart : undefined;
  const lawThemenfeld = typeof doc.lawThemenfeld === 'string' ? doc.lawThemenfeld : undefined;

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

      const s = (c.riskSeverity ?? undefined) as RiskLevel | undefined;
      const p = (c.riskProbability ?? undefined) as RiskLevel | undefined;

      const rLbl = riskLabel(s, p);
      const rScore = riskScore(s, p);
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

  const html = `<!DOCTYPE html>
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
          `<tr>
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
</html>`;

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
