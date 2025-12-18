// app/matrix/utils/matrix-status.ts
import type { ComplianceStatus, MatrixStatus } from '../matrixstore';

export function statusLabel(status: ComplianceStatus, isDe: boolean): string {
  if (isDe) {
    switch (status) {
      case 'open':
        return 'Offen';
      case 'not_applicable':
        return 'Nicht zutreffend';
      case 'not_fulfilled':
        return 'Nicht erfüllt';
      case 'compliant':
        return 'Compliance';
      default:
        return 'Unbekannt';
    }
  }

  switch (status) {
    case 'open':
      return 'Open';
    case 'not_applicable':
      return 'Not applicable';
    case 'not_fulfilled':
      return 'Not fulfilled';
    case 'compliant':
      return 'Compliant';
    default:
      return 'Unknown';
  }
}

export function statusColorClasses(status: ComplianceStatus): string {
  switch (status) {
    case 'compliant':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'not_fulfilled':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'not_applicable':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'open':
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200';
  }
}

export function matrixStatusLabel(status: MatrixStatus, isDe: boolean): string {
  if (isDe) {
    switch (status) {
      case 'draft':
        return 'Angelegt';
      case 'in_review':
        return 'In Bewertung';
      case 'final':
        return 'Abgeschlossen';
      default:
        return 'Unbekannt';
    }
  }

  switch (status) {
    case 'draft':
      return 'Draft';
    case 'in_review':
      return 'In review';
    case 'final':
      return 'Completed';
    default:
      return 'Unknown';
  }
}

export function matrixStatusColorClasses(status: MatrixStatus): string {
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
