// app/lib/workflow-gates.ts
// Zentrale Gate-Logik zwischen Dokumentenstatus (Register) und Matrix-Status.
//
// Ziel (Variante B / Audit-Workflow):
// Dokument: erfasst → in_pruefung → freigegeben → aktiv → obsolet → archiviert
// Matrix:   draft → in_review → final
//
// Gates (soft, später optional hart):
// - in_pruefung: Matrix sollte existieren (draft/in_review/final)
// - freigegeben: Matrix sollte final sein
// - aktiv:       Matrix sollte final sein
//
// Hinweis: "fehlende Matrix" = Bewertungs-/Nachweisstatus fehlt. Das ist ein Risiko-Indikator,
// aber muss nicht automatisch den Dokumentenstatus ändern. Gate-Level kann später als "warn/block"
// in UI/Workflow genutzt werden.

import type { Status as DocStatus } from '@/app/register/registerstore';
import type { MatrixStatus } from '@/app/matrix/matrixstore';

export type GateLevel = 'ok' | 'warn' | 'block';

export type MatrixGateState = 'missing' | 'draft' | 'in_review' | 'final';

export type GateResult = {
  ok: boolean;
  level: GateLevel;
  state: MatrixGateState;
  messageDe: string;
  messageEn: string;
};

function toGateState(matrixStatus: MatrixStatus | null | undefined): MatrixGateState {
  if (!matrixStatus) return 'missing';
  return matrixStatus;
}

/**
 * Gate für das Setzen eines ZIEL-Status im Register.
 * (Wir betrachten hier bewusst nur den Zielstatus – Sequenzen/Transitions können später ergänzt werden.)
 */
export function canSetDocumentStatus(target: DocStatus, ctx: { matrixStatus?: MatrixStatus | null }): GateResult {
  const state = toGateState(ctx.matrixStatus);

  // Default: ok
  const ok: GateResult = {
    ok: true,
    level: 'ok',
    state,
    messageDe: 'OK',
    messageEn: 'OK',
  };

  // Gate: in_pruefung -> Matrix sollte existieren
  if (target === 'in_pruefung') {
    if (state === 'missing') {
      return {
        ok: false,
        level: 'warn',
        state,
        messageDe: 'Gate: Für „In Prüfung“ sollte eine Matrix angelegt sein (mind. Draft).',
        messageEn: 'Gate: For “In review”, a matrix should exist (at least draft).',
      };
    }
    return ok;
  }

  // Gate: freigegeben/aktiv -> Matrix sollte final sein
  if (target === 'freigegeben' || target === 'aktiv') {
    if (state !== 'final') {
      return {
        ok: false,
        level: 'block',
        state,
        messageDe:
          'Gate: Für „Freigegeben/Aktiv“ sollte die Matrix abgeschlossen sein (Status „final“).',
        messageEn:
          'Gate: For “Released/Active”, the matrix should be completed (status “final”).',
      };
    }
    return ok;
  }

  // Für erfasst/obsolet/archiviert keine Matrix-Pflicht
  return ok;
}

/**
 * Rein informatives Gate für Anzeige (Chip/Tooltip) – unabhängig davon,
 * ob wir später in UI wirklich blocken.
 */
export function describeMatrixGate(matrixStatus?: MatrixStatus | null): {
  state: MatrixGateState;
  level: GateLevel;
  labelDe: string;
  labelEn: string;
} {
  const state = toGateState(matrixStatus);

  switch (state) {
    case 'missing':
      return {
        state,
        level: 'warn',
        labelDe: 'Matrix fehlt',
        labelEn: 'Matrix missing',
      };
    case 'draft':
      return {
        state,
        level: 'warn',
        labelDe: 'Matrix angelegt (Draft)',
        labelEn: 'Matrix created (draft)',
      };
    case 'in_review':
      return {
        state,
        level: 'warn',
        labelDe: 'Matrix in Bewertung',
        labelEn: 'Matrix in review',
      };
    case 'final':
      return {
        state,
        level: 'ok',
        labelDe: 'Matrix abgeschlossen',
        labelEn: 'Matrix completed',
      };
  }
}