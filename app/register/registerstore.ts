// app/register/registerstore.ts
'use client';

import * as React from 'react';

/* ---------- Typen ---------- */

// Dokumentenstatus (Workflow) – "offen" wurde ersetzt durch "erfasst"
export type Status =
  | 'erfasst'
  | 'zugeteilt'
  | 'in_pruefung'
  | 'zurueckgewiesen'
  | 'freigegeben'
  | 'aktiv'
  | 'obsolet'
  | 'archiviert';

// ✅ Export, damit andere Files (page.tsx, registerview.tsx, exports, stats, gates) es sauber nutzen können
export function normalizeStatus(s: unknown): Status | undefined {
  const v = String(s ?? '').trim().toLowerCase();
  if (!v) return undefined;

  // Legacy / EN → Neu
  if (v === 'offen' || v === 'open') return 'erfasst';
  if (v === 'assigned') return 'zugeteilt';
  if (v === 'in prüfung' || v === 'in pruefung' || v === 'in-pruefung' || v === 'in review')
    return 'in_pruefung';
  if (v === 'rejected' || v === 'zurückgewiesen' || v === 'zurueckgewiesen')
    return 'zurueckgewiesen';
  if (v === 'released') return 'freigegeben';
  if (v === 'active') return 'aktiv';
  if (v === 'obsolete') return 'obsolet';
  if (v === 'archived') return 'archiviert';

  // erlaubte Werte (neu)
  if (
    v === 'erfasst' ||
    v === 'zugeteilt' ||
    v === 'in_pruefung' ||
    v === 'zurueckgewiesen' ||
    v === 'freigegeben' ||
    v === 'aktiv' ||
    v === 'obsolet' ||
    v === 'archiviert'
  ) {
    return v as Status;
  }

  return undefined;
}

// Fachliche Relevanz
export type Relevanz = 'Niedrig' | 'Mittel' | 'Hoch';

// Risikotyp (später nutzbar, aktuell nur Metadatum)
export type RiskMode = 'qualitativ' | 'emv' | 'fmea' | 'fta' | 'bia';

/** Norm-/Rechtsfamilie zur Auswertung (Reporting / KI). */
export type NormFamily = 'DIN' | 'ISO' | 'EU' | 'Sonstige';

/** Strukturierte Dokumentenart für das Kataster. */
export type Dokumentenart =
  | 'Verordnung'
  | 'Gesetz'
  | 'Norm'
  | 'Vorschrift'
  | 'Vertrag'
  | 'Richtlinie'
  | 'Sonstige';

/** Vertragsumfeld – nur relevant, wenn Dokumentenart = „Vertrag“ */
export type Vertragsumfeld = 'B2B' | 'B2C' | 'B2G' | 'Intern';

export type BewertungErgebnis = 'muss' | 'kann' | 'nicht_relevant';

export type HistoryItem = {
  date: string; // ISO
  text: string;
  user?: string;
};

/**
 * ✅ Kompatibilität: Wir haben nur EINEN Prozess (Status).
 * Einige Alt-Komponenten nutzen aber noch "workflowState".
 * Daher: Alias statt zweitem Prozess.
 */
export type WorkflowState = Status;

/**
 * Optionales Bewertungs-Metafeld (kann später entfernt werden,
 * wenn du es nicht brauchst).
 */
export type EvaluationStatus =
  | 'unbewertet'
  | 'in_progress'
  | 'bewertet'
  | 'reviewed'
  | 'approved'
  | 'rejected';

export type LawRow = {
  id: string;

  // Grundlegende Metadaten
  dokumentenart?: Dokumentenart;
  vertragsumfeld?: Vertragsumfeld;
  rechtsart?: string; // legacy / Freitext
  normFamily?: NormFamily;

  kuerzel: string;
  bezeichnung: string;
  themenfeld: string;

  publiziert?: string;
  frist?: string;
  relevanz?: Relevanz;

  // ✅ der EINE Prozessstatus
  status?: Status;

  // Detailfelder
  herausgeber?: string;
  gueltigSeit?: string;
  gueltigBis?: string;

  // URL/Quelle
  dokumentUrl?: string;
  quelleUrl?: string;

  // Upload (lokal)
  dokumentFileName?: string;
  dokumentFileHref?: string;

  // Anzeigename
  dokumentName?: string;

  // Organisation
  zustaendigkeit?: string;
  kategorie?: string;
  abgeloestDurch?: string;

  // Erfassung
  erfasserVorname?: string;
  erfasserNachname?: string;
  erfasserAbteilung?: string;

  // --- Governance / Rollenfelder (für Gates relevant) ---
  assignedTo?: string;
  reviewedBy?: string;
  approvedBy?: string;
  reviewerNote?: string;
  approverNote?: string;

  // Zeitstempel
  createdAt?: string;

  // ✅ Archiv / Aufbewahrung (Audit/Retention)
  obsoletedAt?: string;     // ISO (Zeitpunkt, ab dem "obsolet" gesetzt wurde)
  archivedAt?: string;      // ISO (Zeitpunkt, ab dem "archiviert" gesetzt wurde)
  retentionUntil?: string;  // ISO (archivedAt + 10 Jahre)

  // --- Legacy/Kompatibilität (optional) ---
  // (damit alte Komponenten noch bauen; fachlich entspricht es dem Status)
  workflowState?: WorkflowState;
  evaluationStatus?: EvaluationStatus;

  // Bewertung / Risiko (bleibt erstmal)
  riskMode?: RiskMode;
  bewertungErgebnis?: BewertungErgebnis;
  evaluationNote?: string;

  evaluationLikelihood?: number;
  evaluationImpact?: number;
  evaluationScore?: number;
  evaluationLevel?: 'Niedrig' | 'Mittel' | 'Hoch';
  evaluatedAt?: string;
  evaluatedBy?: string;

  // Maßnahmen / Projekte (bleibt)
  mitigationPlanned?: boolean;
  mitigationAt?: string;

  projekt?: {
    owner?: string;
    milestones?: { id: string; title: string; due: string; done?: boolean }[];
    tasks?: { id: string; title: string; due?: string; assignee?: string; done?: boolean }[];
  };

  history?: HistoryItem[];
};

type Snapshot = { rows: LawRow[]; lastAddedId?: string };

type Store = {
  getSnapshot(): Snapshot;
  subscribe(cb: () => void): () => void;
  add(row: LawRow): void;
  update(id: string, patch: Partial<LawRow>): void;
  remove(id: string): void;
  clear(): void;
};

/* ---------- interner Zustand ---------- */

const LS_KEY = 'lextrack_register_rows_v1';
const listeners = new Set<() => void>();
const stateRef: { current: Snapshot } = { current: { rows: [], lastAddedId: undefined } };
const serverSnapshot: Snapshot = { rows: [], lastAddedId: undefined };

function saveToLS(rows: LawRow[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
  } catch {
    // ignore
  }
}

/**
 * Laden aus LocalStorage + Migration:
 * - status "offen/open" => "erfasst"
 * - status EN Labels => DE Workflow
 * - invalid history => entfernt
 * - rows ohne id => verworfen
 */
function loadFromLS(): LawRow[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    let changedAny = false;
    const normalized: LawRow[] = [];

    for (const item of parsed as any[]) {
      if (!item || typeof item !== 'object') {
        changedAny = true;
        continue;
      }

      const next: any = { ...(item as any) };
      let changed = false;

      // id muss existieren (sonst Row verwerfen)
      if (typeof next.id !== 'string' || next.id.trim().length === 0) {
        changedAny = true;
        continue;
      }

      // ✅ Status normalisieren
      const beforeStatus = next.status;
      const afterStatus = normalizeStatus(beforeStatus);
      if ((beforeStatus ?? undefined) !== (afterStatus ?? undefined)) {
        next.status = afterStatus;
        changed = true;
      }

      // history muss Array sein (sonst entfernen)
      if (next.history != null && !Array.isArray(next.history)) {
        delete next.history;
        changed = true;
      }

      // defensive: timestamps als string
      for (const k of ['createdAt', 'obsoletedAt', 'archivedAt', 'retentionUntil'] as const) {
        if (next[k] != null && typeof next[k] !== 'string') {
          delete next[k];
          changed = true;
        }
      }

      normalized.push(next as LawRow);
      if (changed) changedAny = true;
    }

    if (changedAny) saveToLS(normalized);
    return normalized;
  } catch {
    return [];
  }
}

stateRef.current.rows = loadFromLS();

/* ---------- Store-Implementierung ---------- */

function isoNow() {
  return new Date().toISOString();
}

function addYearsIso(iso: string, years: number): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

const store: Store = {
  getSnapshot: () => stateRef.current,

  subscribe: (cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  add: (row) => {
    const nowIso = isoNow();
    const created = row.createdAt ?? nowIso;

    const creator =
      [row.erfasserVorname ?? '', row.erfasserNachname ?? ''].filter(Boolean).join(' ') || 'System';

    const history: HistoryItem[] = Array.isArray(row.history) ? [...row.history] : [];
    if (history.length === 0) {
      history.push({ date: created, user: creator, text: 'Angelegt' });
    }

    // ✅ Status bei Insert normalisieren (und default "erfasst", damit Workflow startet)
    const normalizedStatus = normalizeStatus(row.status) ?? 'erfasst';

    const toInsert: LawRow = {
      ...row,
      status: normalizedStatus,
      createdAt: created,
      history,
    };

    const next = [toInsert, ...stateRef.current.rows];
    stateRef.current = { rows: next, lastAddedId: toInsert.id };
    saveToLS(next);
    listeners.forEach((l) => l());
  },

  update: (id, patch) => {
    const now = isoNow();

    const next = stateRef.current.rows.map((r) => {
      if (r.id !== id) return r;

      const p: Partial<LawRow> = { ...patch };

      // ✅ Status normalisieren
      if (Object.prototype.hasOwnProperty.call(p, 'status')) {
        p.status = normalizeStatus(p.status) ?? undefined;

        // ✅ leichte Automatik für Zeitstempel (macht Gates robuster)
        const newStatus = p.status;
        if (newStatus === 'obsolet' && !r.obsoletedAt && !p.obsoletedAt) {
          p.obsoletedAt = now;
        }
        if (newStatus === 'archiviert') {
          const archivedAt = (p.archivedAt ?? r.archivedAt ?? now) as string;
          if (!p.archivedAt) p.archivedAt = archivedAt;

          // 10 Jahre Aufbewahrung ab Archivierung
          if (!p.retentionUntil && !r.retentionUntil) {
            p.retentionUntil = addYearsIso(archivedAt, 10);
          }
        }
      }

      return { ...r, ...p };
    });

    stateRef.current = { rows: next, lastAddedId: undefined };
    saveToLS(next);
    listeners.forEach((l) => l());
  },

  remove: (id) => {
    const next = stateRef.current.rows.filter((r) => r.id !== id);
    stateRef.current = { rows: next, lastAddedId: undefined };
    saveToLS(next);
    listeners.forEach((l) => l());
  },

  clear: () => {
    stateRef.current = { rows: [], lastAddedId: undefined };
    saveToLS([]);
    listeners.forEach((l) => l());
  },
};

/* ---------- öffentliches Hook ---------- */

export function useRegisterStore() {
  const snapshot = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => serverSnapshot
  );

  return {
    rows: snapshot.rows,
    lastAddedId: snapshot.lastAddedId,
    add: store.add,
    update: store.update,
    remove: store.remove,
    clear: store.clear,
  };
}

/* ---------- Hilfsfunktion ---------- */

export function makeId(): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  const maybe = c as unknown as { randomUUID?: () => string } | undefined;
  if (maybe?.randomUUID && typeof maybe.randomUUID === 'function') {
    return maybe.randomUUID();
  }
  return 'id_' + Math.random().toString(36).slice(2, 10);
}