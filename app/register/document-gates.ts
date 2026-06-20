// app/register/document-gates.ts
import type { LawRow, Status } from './registerstore';

export type GateResult =
  | { ok: true }
  | { ok: false; reasons: string[] };

export const RETENTION_YEARS = 10;

/**
 * Erlaubte Status-Übergänge (Dokumentenprozess).
 * Ziel: ein Prozess, klare Kanten, audit-fähig.
 */
export const allowedStatusTransitions: Record<Status, Status[]> = {
  erfasst: ['zugeteilt'],
  zugeteilt: ['in_pruefung', 'erfasst'],
  in_pruefung: ['freigegeben', 'zurueckgewiesen'],
  zurueckgewiesen: ['zugeteilt', 'erfasst'],
  freigegeben: ['aktiv'],
  aktiv: ['obsolet'],
  obsolet: ['archiviert'],
  archiviert: [],
};

function isBlank(v: unknown): boolean {
  return !String(v ?? '').trim();
}

/**
 * Prüft Preconditions pro Übergang.
 * rowAfter = "so wie es nach dem Speichern wäre" (also inkl. Draft-Patch).
 */
export function canTransitionStatus(
  from: Status,
  to: Status,
  rowAfter: LawRow,
  opts?: { requireReviewerDifferentFromAuthor?: boolean }
): GateResult {
  const allowed = allowedStatusTransitions[from]?.includes(to) ?? false;
  if (!allowed) {
    return {
      ok: false,
      reasons: [
        `Übergang nicht erlaubt: ${from} → ${to}`,
      ],
    };
  }

  const reasons: string[] = [];

  // erfasst → zugeteilt
  if (from === 'erfasst' && to === 'zugeteilt') {
    if (isBlank(rowAfter.dokumentenart)) reasons.push('Pflichtfeld fehlt: Dokumentenart');
    if (isBlank(rowAfter.kuerzel)) reasons.push('Pflichtfeld fehlt: Kürzel');
    if (isBlank(rowAfter.bezeichnung)) reasons.push('Pflichtfeld fehlt: Bezeichnung');
    if (isBlank(rowAfter.themenfeld)) reasons.push('Pflichtfeld fehlt: Themenfeld');
  }

  // zugeteilt → in_pruefung
  if (from === 'zugeteilt' && to === 'in_pruefung') {
    if (isBlank(rowAfter.assignedTo)) reasons.push('Pflichtfeld fehlt: Zuweisung (assignedTo)');
    // optional: frist als Review-Due-Date (noch kein Muss)
  }

  // in_pruefung → freigegeben
  if (from === 'in_pruefung' && to === 'freigegeben') {
    if (isBlank(rowAfter.reviewedBy)) reasons.push('Pflichtfeld fehlt: Reviewer (reviewedBy)');

    if (opts?.requireReviewerDifferentFromAuthor) {
      const author = [rowAfter.erfasserVorname ?? '', rowAfter.erfasserNachname ?? '']
        .filter(Boolean)
        .join(' ')
        .trim();
      const reviewer = String(rowAfter.reviewedBy ?? '').trim();
      if (author && reviewer && author === reviewer) {
        reasons.push('Guard verletzt: Reviewer darf nicht identisch zum Erfasser sein');
      }
    }
  }

  // in_pruefung → zurueckgewiesen
  if (from === 'in_pruefung' && to === 'zurueckgewiesen') {
    if (isBlank(rowAfter.reviewedBy)) reasons.push('Pflichtfeld fehlt: Reviewer (reviewedBy)');
    if (isBlank(rowAfter.reviewerNote)) reasons.push('Pflichtfeld fehlt: Reviewer-Notiz (Begründung)');
  }

  // obsolet → archiviert (Archiv-Teil)
  if (from === 'obsolet' && to === 'archiviert') {
    // optional: später Guard "obsoletReason" etc.
  }

  return reasons.length ? { ok: false, reasons } : { ok: true };
}

/**
 * Side-Effects bei Statuswechsel (Archiv / Obsolet timestamps).
 */
export function statusSideEffects(to: Status, rowBefore: LawRow): Partial<LawRow> {
  const now = new Date().toISOString();

  if (to === 'obsolet') {
    return { obsoletedAt: rowBefore.obsoletedAt ?? now };
  }

  if (to === 'archiviert') {
    const archivedAt = rowBefore.archivedAt ?? now;
    const retentionUntil = rowBefore.retentionUntil ?? addYearsIso(archivedAt, RETENTION_YEARS);
    return { archivedAt, retentionUntil };
  }

  return {};
}

function addYearsIso(iso: string, years: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}