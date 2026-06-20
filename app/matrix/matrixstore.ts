// app/matrix/matrixstore.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LawRow } from '../register/registerstore';

/* ---------- Typen ---------- */

export type ComplianceStatus =
  | 'open'
  | 'compliant'
  | 'not_fulfilled'
  | 'not_applicable';

export type PsoeLevel = 'P' | 'S' | 'O' | 'E';

export type RiskLevel = 1 | 2 | 3 | 4;

export type RiskAggregationMode = 'worst_case' | 'index';
export type RiskScope = 'all' | 'non_compliant';

export type InternalManualRef = {
  id: string;
  exposition: string; // z.B. CAME, OMM, MOE
  chapter: string; // Kapitel / Section
  description: string; // kurze Beschreibung
};

export type LegalRef = {
  id: string;
  regulation: string; // z.B. (EU) 1321/2014
  part: string; // z.B. Part-CAMO, Part-M
  paragraph: string; // z.B. M.A.201(a)
};

export type ProcessRef = {
  id: string;
  processNumber: string; // z.B. IQM.123456 oder "Prozess 1234"
  processTitle: string; // Titel des Prozesses
};

export type FormRef = {
  id: string;
  formNumber: string; // z.B. VA 1234 / Dok.-Nr.
  formTitle: string; // Bezeichnung
};

export type MatrixClause = {
  id: string;

  // Mehrstufige Referenzstruktur, z.B.: 4.1 / (a) / (1)
  refLevel1?: string;
  refLevel2?: string;
  refLevel3?: string;

  // Zu jeder Ebene eine eigene Überschrift / Titel
  titleLevel1?: string;
  titleLevel2?: string;
  titleLevel3?: string;

  // Gesetzestext / Anforderung (Freitext)
  requirementText?: string;

  // Evidence / Kommentar
  evidenceNote?: string;
  comment?: string;

  status: ComplianceStatus;

  // PSOE-Reifegrad (optional)
  psoeLevel?: PsoeLevel;

  // Risk (4x4) optional pro Clause
  riskSeverity?: RiskLevel;
  riskProbability?: RiskLevel;

  parentId?: string | null;

  // Verknüpfungen
  internalRefs: InternalManualRef[];
  legalRefs: LegalRef[];

  // getrennt:
  processRefs: ProcessRef[];
  formRefs: FormRef[];
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
  status: MatrixStatus;

  // pro Dokument konfigurierbar:
  riskAggregationMode?: RiskAggregationMode; // worst_case | index
  riskScope?: RiskScope; // all | non_compliant
};

type MatrixState = {
  docs: MatrixDocument[];

  /* Aktionen */
  createOrGetDocumentForLaw: (law: LawRow) => MatrixDocument;

  addClause: (docId: string, parentId?: string) => void;
  updateClause: (docId: string, clauseId: string, patch: Partial<MatrixClause>) => void;
  removeClause: (docId: string, clauseId: string) => void;

  removeDoc: (docId: string) => void;
  updateDocStatus: (docId: string, status: MatrixStatus) => void;

  updateDocRiskSettings: (
    docId: string,
    patch: Partial<Pick<MatrixDocument, 'riskAggregationMode' | 'riskScope'>>
  ) => void;
};

/* ---------- Helpers ---------- */

const DEFAULT_DOC_STATUS: MatrixStatus = 'draft';
const DEFAULT_RISK_MODE: RiskAggregationMode = 'worst_case';
const DEFAULT_RISK_SCOPE: RiskScope = 'non_compliant';

function createId(prefix = 'id'): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  const maybe = c as unknown as { randomUUID?: () => string } | undefined;

  if (maybe?.randomUUID) return `${prefix}_${maybe.randomUUID()}`;

  // fallback: etwas stabiler als nur Math.random()
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeComplianceStatus(v: unknown): ComplianceStatus {
  const s = String(v ?? '').trim().toLowerCase();
  if (s === 'open' || s === 'compliant' || s === 'not_fulfilled' || s === 'not_applicable') {
    return s as ComplianceStatus;
  }
  return 'open';
}

function normalizeRiskLevel(v: unknown): RiskLevel | undefined {
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n as RiskLevel;
  return undefined;
}

function normalizeDocStatus(v: unknown): MatrixStatus {
  const s = String(v ?? '').trim().toLowerCase();
  if (s === 'draft' || s === 'in_review' || s === 'final') return s as MatrixStatus;
  return DEFAULT_DOC_STATUS;
}

function normalizeRiskMode(v: unknown): RiskAggregationMode {
  const s = String(v ?? '').trim().toLowerCase();
  if (s === 'worst_case' || s === 'index') return s as RiskAggregationMode;
  return DEFAULT_RISK_MODE;
}

function normalizeRiskScope(v: unknown): RiskScope {
  const s = String(v ?? '').trim().toLowerCase();
  if (s === 'all' || s === 'non_compliant') return s as RiskScope;
  return DEFAULT_RISK_SCOPE;
}

function normalizeClause(raw: unknown): MatrixClause {
  const r = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};

  const id = asString(r.id, '') || createId('clause');

  const clause: MatrixClause = {
    id,

    refLevel1: asString(r.refLevel1, ''),
    refLevel2: asString(r.refLevel2, ''),
    refLevel3: asString(r.refLevel3, ''),

    titleLevel1: asString(r.titleLevel1, ''),
    titleLevel2: asString(r.titleLevel2, ''),
    titleLevel3: asString(r.titleLevel3, ''),

    requirementText: asString(r.requirementText, ''),
    evidenceNote: asString(r.evidenceNote, ''),
    comment: asString(r.comment, ''),

    status: normalizeComplianceStatus(r.status),

    psoeLevel: (['P', 'S', 'O', 'E'].includes(String(r.psoeLevel ?? '')) ? (r.psoeLevel as PsoeLevel) : undefined),

    riskSeverity: normalizeRiskLevel(r.riskSeverity),
    riskProbability: normalizeRiskLevel(r.riskProbability),

    parentId: (typeof r.parentId === 'string' ? r.parentId : null),

    internalRefs: asArray<InternalManualRef>(r.internalRefs),
    legalRefs: asArray<LegalRef>(r.legalRefs),
    processRefs: asArray<ProcessRef>(r.processRefs),
    formRefs: asArray<FormRef>(r.formRefs),
  };

  return clause;
}

function normalizeDocument(raw: unknown): MatrixDocument | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = asString(r.id, '') || createId('doc');
  const lawId = asString(r.lawId, '').trim();
  if (!lawId) return null;

  const doc: MatrixDocument = {
    id,
    lawId,

    lawKuerzel: typeof r.lawKuerzel === 'string' ? r.lawKuerzel : undefined,
    lawBezeichnung: typeof r.lawBezeichnung === 'string' ? r.lawBezeichnung : undefined,
    lawRechtsart: typeof r.lawRechtsart === 'string' ? r.lawRechtsart : undefined,
    lawThemenfeld: typeof r.lawThemenfeld === 'string' ? r.lawThemenfeld : undefined,

    clauses: asArray<unknown>(r.clauses).map(normalizeClause),
    status: normalizeDocStatus(r.status),

    riskAggregationMode: normalizeRiskMode(r.riskAggregationMode),
    riskScope: normalizeRiskScope(r.riskScope),
  };

  return doc;
}

function normalizeDocs(rawDocs: unknown): MatrixDocument[] {
  const list = Array.isArray(rawDocs) ? rawDocs : [];
  const out: MatrixDocument[] = [];

  for (const item of list) {
    const doc = normalizeDocument(item);
    if (doc) out.push(doc);
  }
  return out;
}

function createDefaultClause(parentId?: string): MatrixClause {
  return normalizeClause({
    id: createId('clause'),
    refLevel1: '',
    refLevel2: '',
    refLevel3: '',
    titleLevel1: '',
    titleLevel2: '',
    titleLevel3: '',
    requirementText: '',
    evidenceNote: '',
    comment: '',
    status: 'open',
    psoeLevel: undefined,
    riskSeverity: undefined,
    riskProbability: undefined,
    parentId: parentId ?? null,
    internalRefs: [],
    legalRefs: [],
    processRefs: [],
    formRefs: [],
  });
}

function readOptionalString(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const rec = obj as Record<string, unknown>;
  const v = rec[key];
  return typeof v === 'string' ? v : undefined;
}

function cascadeRemoveClause(clauses: MatrixClause[], clauseId: string): MatrixClause[] {
  const toRemove = new Set<string>();
  const byParent = new Map<string, string[]>();

  for (const c of clauses) {
    const p = c.parentId ?? null;
    if (!p) continue;
    const arr = byParent.get(p) ?? [];
    arr.push(c.id);
    byParent.set(p, arr);
  }

  const stack: string[] = [clauseId];
  while (stack.length) {
    const id = stack.pop()!;
    if (toRemove.has(id)) continue;
    toRemove.add(id);

    const kids = byParent.get(id);
    if (kids && kids.length) {
      for (const k of kids) stack.push(k);
    }
  }

  return clauses.filter((c) => !toRemove.has(c.id));
}

/* ==================================================================== */

export const useMatrixStore = create<MatrixState>()(
  persist(
    (set, get) => ({
      docs: [],

      createOrGetDocumentForLaw: (law: LawRow) => {
        const state = get();
        const lawId = String(law.id);

        const existing = state.docs.find((d) => d.lawId === lawId);
        if (existing) {
          // Metadaten sanft aktualisieren (ohne Clauses/Status anzutasten)
          const fallbackName = readOptionalString(law, 'name');
          const nextMeta = {
            lawKuerzel: law.kuerzel ?? existing.lawKuerzel ?? '',
            lawBezeichnung: law.bezeichnung ?? fallbackName ?? existing.lawBezeichnung ?? lawId,
            lawRechtsart: (law.dokumentenart ?? law.rechtsart ?? existing.lawRechtsart ?? '') as string,
            lawThemenfeld: law.themenfeld ?? existing.lawThemenfeld ?? '',
          };

          const changed =
            nextMeta.lawKuerzel !== (existing.lawKuerzel ?? '') ||
            nextMeta.lawBezeichnung !== (existing.lawBezeichnung ?? '') ||
            nextMeta.lawRechtsart !== (existing.lawRechtsart ?? '') ||
            nextMeta.lawThemenfeld !== (existing.lawThemenfeld ?? '');

          if (changed) {
            set({
              docs: state.docs.map((d) => (d.id === existing.id ? { ...d, ...nextMeta } : d)),
            });
            // return updated view
            return { ...existing, ...nextMeta };
          }

          return existing;
        }

        const fallbackName = readOptionalString(law, 'name');

        const newDoc: MatrixDocument = {
          id: createId('doc'),
          lawId,
          lawKuerzel: law.kuerzel ?? '',
          lawBezeichnung: law.bezeichnung ?? fallbackName ?? lawId,
          lawRechtsart: (law.dokumentenart ?? law.rechtsart ?? '') as string,
          lawThemenfeld: law.themenfeld ?? '',
          clauses: [],
          status: DEFAULT_DOC_STATUS,
          riskAggregationMode: DEFAULT_RISK_MODE,
          riskScope: DEFAULT_RISK_SCOPE,
        };

        set({ docs: [...state.docs, newDoc] });
        return newDoc;
      },

      addClause: (docId: string, parentId?: string) => {
        set((state) => {
          const docs = state.docs.map((doc) => {
            if (doc.id !== docId) return doc;
            const newClause = createDefaultClause(parentId);
            return { ...doc, clauses: [...(doc.clauses ?? []), newClause] };
          });
          return { docs };
        });
      },

      updateClause: (docId: string, clauseId: string, patch: Partial<MatrixClause>) => {
        set((state) => {
          const docs = state.docs.map((doc) => {
            if (doc.id !== docId) return doc;

            const clauses = (doc.clauses ?? []).map((c) => {
              if (c.id !== clauseId) return c;

              // 1) current normalisieren (für alte Persist-Daten)
              const safeCurrent = normalizeClause(c);

              // 2) patch anwenden
              const merged = { ...safeCurrent, ...patch };

              // 3) Ergebnis normalisieren (Arrays/Status/Risk-Level)
              return normalizeClause(merged);
            });

            return { ...doc, clauses };
          });

          return { docs };
        });
      },

      removeClause: (docId: string, clauseId: string) => {
        set((state) => {
          const docs = state.docs.map((doc) => {
            if (doc.id !== docId) return doc;
            const clauses = cascadeRemoveClause(doc.clauses ?? [], clauseId);
            return { ...doc, clauses };
          });
          return { docs };
        });
      },

      removeDoc: (docId: string) => {
        set((state) => ({ docs: state.docs.filter((d) => d.id !== docId) }));
      },

      updateDocStatus: (docId: string, status: MatrixStatus) => {
        set((state) => {
          const docs = state.docs.map((doc) =>
            doc.id === docId ? { ...doc, status: normalizeDocStatus(status) } : doc
          );
          return { docs };
        });
      },

      updateDocRiskSettings: (docId, patch) => {
        set((state) => {
          const docs = state.docs.map((doc) => {
            if (doc.id !== docId) return doc;

            const nextRiskAggregationMode = normalizeRiskMode(
              patch.riskAggregationMode ?? doc.riskAggregationMode ?? DEFAULT_RISK_MODE
            );
            const nextRiskScope = normalizeRiskScope(
              patch.riskScope ?? doc.riskScope ?? DEFAULT_RISK_SCOPE
            );

            return {
              ...doc,
              riskAggregationMode: nextRiskAggregationMode,
              riskScope: nextRiskScope,
            };
          });
          return { docs };
        });
      },
    }),
    {
      name: 'lextrack_matrix_v4',

      // nur persistieren, was wirklich State ist
      partialize: (s) => ({ docs: s.docs }),

      // Migration/Normalisierung bei Rehydrate – verhindert “Altlasten” dauerhaft
      version: 1,
      migrate: (persisted: any) => {
        const docs = normalizeDocs(persisted?.docs);
        return { docs } as MatrixState;
      },
    }
  )
);