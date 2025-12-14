// app/register/workflow.ts
export type WorkflowState =
  | 'erfasst'
  | 'in_bearbeitung'
  | 'wiedervorlage'
  | 'frist_abgelaufen'
  | 'bewertung'
  | 'review'
  | 'zurueckgewiesen'
  | 'bestaetigt'
  | 'aktiv'
  | 'in_umsetzung'
  | 'umgesetzt'
  | 'ueberholt'
  | 'archiviert';

export type RiskMode = 'qualitativ' | 'emv' | 'fmea' | 'fta' | 'bia';
export type BewertungErgebnis = 'muss' | 'kann' | 'nicht_relevant';

export const allowedTransitions: Record<WorkflowState, WorkflowState[]> = {
  erfasst: ['in_bearbeitung'],
  in_bearbeitung: ['erfasst', 'wiedervorlage', 'frist_abgelaufen', 'bewertung'],
  wiedervorlage: ['in_bearbeitung'],
  frist_abgelaufen: ['in_bearbeitung'],
  bewertung: ['review'],
  review: ['zurueckgewiesen', 'bestaetigt'],
  zurueckgewiesen: ['in_bearbeitung'],
  bestaetigt: ['aktiv', 'archiviert'],
  aktiv: ['in_umsetzung', 'archiviert'],
  in_umsetzung: ['umgesetzt'],
  umgesetzt: ['ueberholt', 'archiviert'],
  ueberholt: ['archiviert'],
  archiviert: [],
};

// Optionale Guards – hier nur Beispiele/Platzhalter:
export type GuardCtx = {
  hasMinimumMeta?: boolean;       // Typ/Bezeichnung/Themenfeld gesetzt?
  reviewerDifferentFromAuthor?: boolean;
  projektReady?: boolean;         // Owner + mind. 1 Maßnahme
  bewertungErgebnis?: BewertungErgebnis;
};

export function canTransition(from: WorkflowState, to: WorkflowState, _ctx?: GuardCtx) {
  return allowedTransitions[from]?.includes(to);
}

export function describeTransition(to: WorkflowState, extra?: Partial<GuardCtx> & {
  riskMode?: RiskMode;
  reason?: string;
}) {
  const parts = [`Status: ${to}`];
  if (extra?.riskMode) parts.push(`Riskengine: ${extra.riskMode}`);
  if (extra?.bewertungErgebnis) parts.push(`Bewertung: ${extra.bewertungErgebnis}`);
  if (extra?.reason) parts.push(`Hinweis: ${extra.reason}`);
  return `Workflow: ${parts.join(' | ')}`;
}
