// app/register/registerstore.ts
'use client';

import * as React from 'react';

/* ---------- Typen ---------- */

// Dokumentenstatus (MVP) – inkl. "offen" als Erfassungs-/Vorklärungsstatus
export type Status = 'offen' | 'aktiv' | 'obsolet' | 'archiviert';

// Fachliche Relevanz
export type Relevanz = 'Niedrig' | 'Mittel' | 'Hoch';

// Risikotyp (später für Risiko-/Workflow-Modul nutzbar, aktuell nur Metadatum)
export type RiskMode = 'qualitativ' | 'emv' | 'fmea' | 'fta' | 'bia';

/**
 * Norm-/Rechtsfamilie zur Auswertung (Reporting / KI).
 */
export type NormFamily = 'DIN' | 'ISO' | 'EU' | 'Sonstige';

/**
 * Strukturierte Dokumentenart für das Kataster.
 */
export type Dokumentenart =
  | 'Verordnung'
  | 'Gesetz'
  | 'Norm'
  | 'Vorschrift'
  | 'Vertrag'
  | 'Richtlinie'
  | 'Sonstige';

/**
 * Vertragsumfeld – nur relevant, wenn Dokumentenart = „Vertrag“,
 * kann aber generell gepflegt werden.
 */
export type Vertragsumfeld = 'B2B' | 'B2C' | 'B2G' | 'Intern';

/**
 * Workflow-Zustände – aktuell im Register nicht aktiv verwendet,
 * bleiben aber als optionale Alt-Felder erhalten.
 */
export type WorkflowState =
  | 'erfasst'
  | 'in_bewertung'
  | 'bewertet'
  | 'freizugebend'
  | 'bestaetigt' // legacy
  | 'abgeschlossen'
  | 'ueberarbeitung'
  | 'archiviert';

/**
 * Bewertungs-/Prozessstatus – ebenfalls nur noch Alt-Feld,
 * die Logik dazu ist im MVP deaktiviert.
 */
export type EvaluationStatus =
  | 'unbewertet'
  | 'in_progress'
  | 'bewertet'
  | 'reviewed'
  | 'approved'
  | 'rejected';

export type BewertungErgebnis = 'muss' | 'kann' | 'nicht_relevant';

export type HistoryItem = {
  date: string; // ISO
  text: string; // z. B. "Bezeichnung: 'alt' → 'neu'"
  user?: string; // optional (z. B. 'Admin')
};

export type LawRow = {
  id: string;

  // Grundlegende Metadaten
  dokumentenart?: Dokumentenart;      // neue strukturierte Dokumentenart
  vertragsumfeld?: Vertragsumfeld;    // optionales Vertragsumfeld
  rechtsart?: string;                 // legacy / Freitext
  normFamily?: NormFamily;            // z. B. DIN / ISO / EU / Sonstige

  kuerzel: string;
  bezeichnung: string;
  themenfeld: string;

  publiziert?: string;
  frist?: string;
  relevanz?: Relevanz;
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

  // --- Workflow/Bewertung (aktuell nicht aktiv genutzt, Felder bleiben erhalten) ---
  createdAt?: string;
  workflowState?: WorkflowState;
  riskMode?: RiskMode;
  bewertungErgebnis?: BewertungErgebnis;
  evaluationNote?: string;

  evaluationLikelihood?: number; // 1..5
  evaluationImpact?: number; // 1..5
  evaluationScore?: number; // P×I
  evaluationLevel?: 'Niedrig' | 'Mittel' | 'Hoch'; // abgeleitet aus Score
  evaluatedAt?: string;
  evaluatedBy?: string;

  evaluationStatus?: EvaluationStatus;

  // Maßnahmen
  mitigationPlanned?: boolean;
  mitigationAt?: string;

  // Rollen/Governance
  assignedTo?: string; // Reviewer- oder Bearbeiter-User-ID
  reviewedBy?: string; // User-ID des Reviewers
  approvedBy?: string; // User-ID des Approvers
  reviewerNote?: string; // optionale Prüfnotiz
  approverNote?: string; // optionale Freigabenotiz

  projekt?: {
    owner?: string;
    milestones?: { id: string; title: string; due: string; done?: boolean }[];
    tasks?: {
      id: string;
      title: string;
      due?: string;
      assignee?: string;
      done?: boolean;
    }[];
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
const stateRef: { current: Snapshot } = {
  current: { rows: [], lastAddedId: undefined },
};
const serverSnapshot: Snapshot = { rows: [], lastAddedId: undefined };

/**
 * Laden aus LocalStorage (ohne Nachberechnung).
 */
function loadFromLS(): LawRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = raw ? (JSON.parse(raw) as LawRow[]) : [];
    return parsed;
  } catch {
    return [];
  }
}

function saveToLS(rows: LawRow[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
  } catch {
    // Ignorieren – z. B. bei Storage-Quota-Problemen
  }
}

stateRef.current.rows = loadFromLS();

/* ---------- Store-Implementierung ---------- */

const store: Store = {
  getSnapshot: () => stateRef.current,

  subscribe: (cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  add: (row) => {
    const nowIso = new Date().toISOString();
    const created = row.createdAt ?? nowIso;

    // History: einfache Anlage-Notiz
    const creator =
      [row.erfasserVorname ?? '', row.erfasserNachname ?? '']
        .filter(Boolean)
        .join(' ') || 'System';

    const history: HistoryItem[] = Array.isArray(row.history)
      ? [...row.history]
      : [];

    if (history.length === 0) {
      history.push({ date: created, user: creator, text: 'Angelegt' });
    }

    const toInsert: LawRow = {
      ...row,
      createdAt: created,
      history,
    };

    const next = [toInsert, ...stateRef.current.rows];
    stateRef.current = { rows: next, lastAddedId: toInsert.id };
    saveToLS(next);
    listeners.forEach((l) => l());
  },

  update: (id, patch) => {
    const next = stateRef.current.rows.map((r) =>
      r.id === id ? { ...r, ...patch } : r,
    );
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
    () => serverSnapshot,
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
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return 'id_' + Math.random().toString(36).slice(2, 10);
}
