import type { LawRow, Status } from './registerstore';

export type RegisterDocumentApiStatus =
  | 'CAPTURED'
  | 'ASSIGNED'
  | 'IN_REVIEW'
  | 'REJECTED'
  | 'ACTIVE'
  | 'OBSOLETE'
  | 'ARCHIVED';

export type RegisterDocumentApiItem = {
  id: string;
  kuerzel: string;
  bezeichnung: string;
  themenfeld?: string | null;
  rechtsart?: string | null;
  relevanz?: string | null;
  status: RegisterDocumentApiStatus;
  herausgeber?: string | null;
  gueltigSeit?: string | null;
  gueltigBis?: string | null;
  publiziert?: string | null;
  frist?: string | null;
  dokumentUrl?: string | null;
  quelleUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  assignments?: unknown[];
};

export type RegisterDocumentsApiResponse = {
  success: boolean;
  message?: string;
  documents?: RegisterDocumentApiItem[];
};

export function apiStatusToUiStatus(status: RegisterDocumentApiStatus | string | null | undefined): Status {
  switch (status) {
    case 'CAPTURED':
      return 'erfasst';
    case 'ASSIGNED':
      return 'zugeteilt';
    case 'IN_REVIEW':
      return 'in_pruefung';
    case 'REJECTED':
      return 'zurueckgewiesen';
    case 'ACTIVE':
      return 'aktiv';
    case 'OBSOLETE':
      return 'obsolet';
    case 'ARCHIVED':
      return 'archiviert';
    default:
      return 'erfasst';
  }
}

export function uiStatusToApiStatus(status: Status | string | null | undefined): RegisterDocumentApiStatus {
  switch (status) {
    case 'erfasst':
      return 'CAPTURED';
    case 'zugeteilt':
      return 'ASSIGNED';
    case 'in_pruefung':
      return 'IN_REVIEW';
    case 'zurueckgewiesen':
      return 'REJECTED';
    case 'freigegeben':
      return 'ACTIVE';
    case 'aktiv':
      return 'ACTIVE';
    case 'obsolet':
      return 'OBSOLETE';
    case 'archiviert':
      return 'ARCHIVED';
    default:
      return 'CAPTURED';
  }
}

export function apiDocumentToLawRow(document: RegisterDocumentApiItem): LawRow {
  return {
    id: document.id,
    kuerzel: document.kuerzel,
    bezeichnung: document.bezeichnung,
    themenfeld: document.themenfeld ?? '',
    rechtsart: document.rechtsart ?? undefined,
    relevanz: document.relevanz === 'Niedrig' || document.relevanz === 'Mittel' || document.relevanz === 'Hoch'
      ? document.relevanz
      : undefined,
    status: apiStatusToUiStatus(document.status),
    herausgeber: document.herausgeber ?? undefined,
    gueltigSeit: document.gueltigSeit ?? undefined,
    gueltigBis: document.gueltigBis ?? undefined,
    publiziert: document.publiziert ?? undefined,
    frist: document.frist ?? undefined,
    dokumentUrl: document.dokumentUrl ?? undefined,
    quelleUrl: document.quelleUrl ?? undefined,
    createdAt: document.createdAt,
  };
}

export function lawRowToCreatePayload(row: LawRow) {
  return {
    kuerzel: row.kuerzel,
    bezeichnung: row.bezeichnung,
    themenfeld: row.themenfeld,
    rechtsart: row.rechtsart ?? row.dokumentenart,
    relevanz: row.relevanz,
    status: uiStatusToApiStatus(row.status),
    herausgeber: row.herausgeber,
    gueltigSeit: row.gueltigSeit,
    gueltigBis: row.gueltigBis,
    publiziert: row.publiziert,
    frist: row.frist,
    dokumentUrl: row.dokumentUrl,
    quelleUrl: row.quelleUrl,
  };
}

export function lawRowToUpdatePayload(row: Partial<LawRow>) {
  const payload: Record<string, unknown> = {};

  if (row.kuerzel !== undefined) payload.kuerzel = row.kuerzel;
  if (row.bezeichnung !== undefined) payload.bezeichnung = row.bezeichnung;
  if (row.themenfeld !== undefined) payload.themenfeld = row.themenfeld;
  if (row.rechtsart !== undefined || row.dokumentenart !== undefined) {
    payload.rechtsart = row.rechtsart ?? row.dokumentenart;
  }
  if (row.relevanz !== undefined) payload.relevanz = row.relevanz;
  if (row.status !== undefined) payload.status = uiStatusToApiStatus(row.status);
  if (row.herausgeber !== undefined) payload.herausgeber = row.herausgeber;
  if (row.gueltigSeit !== undefined) payload.gueltigSeit = row.gueltigSeit;
  if (row.gueltigBis !== undefined) payload.gueltigBis = row.gueltigBis;
  if (row.publiziert !== undefined) payload.publiziert = row.publiziert;
  if (row.frist !== undefined) payload.frist = row.frist;
  if (row.dokumentUrl !== undefined) payload.dokumentUrl = row.dokumentUrl;
  if (row.quelleUrl !== undefined) payload.quelleUrl = row.quelleUrl;

  return payload;
}

export async function fetchRegisterDocuments(): Promise<LawRow[]> {
  const response = await fetch('/api/register-documents', {
    credentials: 'include',
  });

  const data = (await response.json()) as RegisterDocumentsApiResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? 'Registerdokumente konnten nicht geladen werden.');
  }

  return (data.documents ?? []).map(apiDocumentToLawRow);
}

export async function createRegisterDocument(row: LawRow): Promise<LawRow> {
  const response = await fetch('/api/register-documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(lawRowToCreatePayload(row)),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? 'Registerdokument konnte nicht angelegt werden.');
  }

  return apiDocumentToLawRow(data.document);
}


export async function updateRegisterDocument(id: string, patch: Partial<LawRow>): Promise<LawRow> {
  const response = await fetch(`/api/register-documents/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(lawRowToUpdatePayload(patch)),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? 'Registerdokument konnte nicht aktualisiert werden.');
  }

  return apiDocumentToLawRow(data.document);
}
