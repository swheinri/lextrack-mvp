export type LocationOption = {
  id: string;
  name: string;
  kuerzel?: string | null;
  type?: string | null;
  isActive?: boolean;
};

export type DocumentLocationAssignmentApiItem = {
  id: string;
  documentId: string;
  locationId: string;
  status: string;
  dueDate?: string | null;
  assignedAt?: string | null;
  document?: {
    id: string;
    kuerzel: string;
    bezeichnung: string;
  };
  location?: LocationOption;
  assessment?: unknown | null;
  matrix?: unknown | null;
};

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' ? (value as AnyRecord) : {};
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeLocation(raw: unknown): LocationOption | null {
  const item = asRecord(raw);

  const id = typeof item.id === 'string' ? item.id : '';
  const name = typeof item.name === 'string' ? item.name : '';

  if (!id || !name) return null;

  return {
    id,
    name,
    kuerzel: typeof item.kuerzel === 'string' ? item.kuerzel : null,
    type: typeof item.type === 'string' ? item.type : null,
    isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
  };
}

function extractLocations(data: unknown): LocationOption[] {
  const record = asRecord(data);

  const locations = readArray(record.locations);
  const dataArray = readArray(record.data);

  const candidates = locations.length
    ? locations
    : dataArray.length
      ? dataArray
      : readArray(data);

  return candidates
    .map(normalizeLocation)
    .filter((location): location is LocationOption => Boolean(location))
    .filter((location) => location.isActive !== false)
    .sort((a, b) => {
      const left = a.kuerzel || a.name;
      const right = b.kuerzel || b.name;
      return left.localeCompare(right, 'de');
    });
}

function extractAssignments(data: unknown): DocumentLocationAssignmentApiItem[] {
  const record = asRecord(data);

  const assignments = readArray(record.assignments);
  const dataArray = readArray(record.data);

  const candidates = assignments.length
    ? assignments
    : dataArray.length
      ? dataArray
      : readArray(data);

  return candidates.filter((item): item is DocumentLocationAssignmentApiItem => {
    const recordItem = asRecord(item);
    return (
      typeof recordItem.id === 'string' &&
      typeof recordItem.locationId === 'string'
    );
  });
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function fetchLocationOptions(): Promise<LocationOption[]> {
  const response = await fetch('/api/directory/locations', {
    credentials: 'include',
  });

  const data = await readJsonResponse(response);
  const record = asRecord(data);

  if (!response.ok || record.success === false) {
    throw new Error(
      typeof record.message === 'string'
        ? record.message
        : 'Standorte konnten nicht geladen werden.'
    );
  }

  return extractLocations(data);
}

export async function fetchDocumentLocationAssignments(
  documentId?: string
): Promise<DocumentLocationAssignmentApiItem[]> {
  const params = new URLSearchParams();

  if (documentId) {
    params.set('documentId', documentId);
  }

  const query = params.toString();
  const url = query
    ? '/api/document-location-assignments?' + query
    : '/api/document-location-assignments';

  const response = await fetch(url, {
    credentials: 'include',
  });

  const data = await readJsonResponse(response);
  const record = asRecord(data);

  if (!response.ok || record.success === false) {
    throw new Error(
      typeof record.message === 'string'
        ? record.message
        : 'Standortzuweisungen konnten nicht geladen werden.'
    );
  }

  return extractAssignments(data);
}

export async function saveDocumentLocationAssignments(input: {
  documentId: string;
  locationIds: string[];
  dueDate?: string | null;
}): Promise<DocumentLocationAssignmentApiItem[]> {
  const response = await fetch('/api/document-location-assignments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      documentId: input.documentId,
      locationIds: input.locationIds,
      dueDate: input.dueDate || null,
    }),
  });

  const data = await readJsonResponse(response);
  const record = asRecord(data);

  if (!response.ok || record.success === false) {
    throw new Error(
      typeof record.message === 'string'
        ? record.message
        : 'Standortzuweisungen konnten nicht gespeichert werden.'
    );
  }

  return extractAssignments(data);
}