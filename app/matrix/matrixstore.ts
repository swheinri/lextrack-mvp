// app/matrix/matrixstore.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LawRow } from '../register/registerstore';

/* ---------- Typen ---------- */

export type ComplianceStatus =
  | 'compliant'
  | 'not_fulfilled'
  | 'not_applicable';

export type PsoeLevel = 'P' | 'S' | 'O' | 'E';

export type InternalManualRef = {
  id: string;
  exposition: string;   // z.B. CAME, OMM, MOE
  chapter: string;      // Kapitel / Section
  description: string;  // kurze Beschreibung
};

export type LegalRef = {
  id: string;
  regulation: string;   // z.B. (EU) 1321/2014
  part: string;         // z.B. Part-CAMO, Part-M
  paragraph: string;    // z.B. M.A.201(a)
};

export type ProcessRef = {
  id: string;
  processNumber: string; // z.B. IQM.123456
  processTitle: string;  // Titel des Prozesses
  formRef: string;       // Formblatt / Dok.-Referenz
};

export type MatrixClause = {
  id: string;

  // Mehrstufige Referenzstruktur, z.B.:
  // 4.1  /  (a)  /  (1)
  refLevel1?: string;
  refLevel2?: string;
  refLevel3?: string;

  // Zu jeder Ebene eine eigene Überschrift / Titel
  titleLevel1?: string;
  titleLevel2?: string;
  titleLevel3?: string;

  requirementText?: string;
  evidenceNote?: string;
  comment?: string;
  status: ComplianceStatus;

  // PSOE-Reifegrad (optional)
  psoeLevel?: PsoeLevel;

  // Optional: Hierarchie (für spätere Features, aktuell eher „nice to have“)
  parentId?: string | null;

  // Verknüpfungen
  internalRefs: InternalManualRef[];
  legalRefs: LegalRef[];
  processRefs: ProcessRef[];
};

/* ---------- Matrix-Dokumentstatus ---------- */

export type MatrixStatus = 'draft' | 'in_review' | 'final';

export type MatrixDocument = {
  id: string;
  lawId: string;
  lawKuerzel?: string;
  lawBezeichnung?: string;
  lawRechtsart?: string;
  lawThemenfeld?: string;
  clauses: MatrixClause[];
  status: MatrixStatus; // Bearbeitungsstatus der gesamten Matrix
};

type MatrixState = {
  docs: MatrixDocument[];

  /* Aktionen */
  createOrGetDocumentForLaw: (law: LawRow) => MatrixDocument;
  addClause: (docId: string, parentId?: string) => void;
  updateClause: (
    docId: string,
    clauseId: string,
    patch: Partial<MatrixClause>
  ) => void;
  removeClause: (docId: string, clauseId: string) => void;
  removeDoc: (docId: string) => void;

  updateDocStatus: (docId: string, status: MatrixStatus) => void;
};

/* ---------- Helper ---------- */

function createId(prefix: string = 'clause'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultClause(parentId?: string): MatrixClause {
  return {
    id: createId(),
    refLevel1: '',
    refLevel2: '',
    refLevel3: '',
    titleLevel1: '',
    titleLevel2: '',
    titleLevel3: '',
    requirementText: '',
    evidenceNote: '',
    comment: '',
    status: 'not_applicable',
    psoeLevel: undefined,
    parentId: parentId ?? null,
    internalRefs: [],
    legalRefs: [],
    processRefs: [],
  };
}

/* ==================================================================== */

export const useMatrixStore = create<MatrixState>()(
  persist(
    (set, get) => ({
      docs: [],

      createOrGetDocumentForLaw: (law: LawRow) => {
        const state = get();
        const existing = state.docs.find((d) => d.lawId === String(law.id));
        if (existing) {
          return existing;
        }

        const newDoc: MatrixDocument = {
          id: createId('doc'),
          lawId: String(law.id),
          lawKuerzel: (law as any).kuerzel ?? '',
          lawBezeichnung:
            (law as any).bezeichnung ??
            (law as any).name ??
            String(law.id),
          lawRechtsart: (law as any).rechtsart ?? '',
          lawThemenfeld: (law as any).themenfeld ?? '',
          clauses: [],
          status: 'draft',
        };

        set({ docs: [...state.docs, newDoc] });
        return newDoc;
      },

      addClause: (docId: string, parentId?: string) => {
        set((state) => {
          const docs = state.docs.map((doc) => {
            if (doc.id !== docId) return doc;
            const newClause = createDefaultClause(parentId);
            return {
              ...doc,
              clauses: [...doc.clauses, newClause],
            };
          });
          return { docs };
        });
      },

      updateClause: (
        docId: string,
        clauseId: string,
        patch: Partial<MatrixClause>
      ) => {
        set((state) => {
          const docs = state.docs.map((doc) => {
            if (doc.id !== docId) return doc;
            const clauses = doc.clauses.map((c) =>
              c.id === clauseId ? { ...c, ...patch } : c
            );
            return { ...doc, clauses };
          });
          return { docs };
        });
      },

      removeClause: (docId: string, clauseId: string) => {
        set((state) => {
          const docs = state.docs.map((doc) => {
            if (doc.id !== docId) return doc;
            const clauses = doc.clauses.filter((c) => c.id !== clauseId);
            return { ...doc, clauses };
          });
          return { docs };
        });
      },

      removeDoc: (docId: string) => {
        set((state) => ({
          docs: state.docs.filter((d) => d.id !== docId),
        }));
      },

      updateDocStatus: (docId: string, status: MatrixStatus) => {
        set((state) => {
          const docs = state.docs.map((doc) =>
            doc.id === docId ? { ...doc, status } : doc
          );
          return { docs };
        });
      },
    }),
    {
      name: 'lextrack_matrix_v2', // neuer Key, damit alte Testdaten nicht stören
    }
  )
);
