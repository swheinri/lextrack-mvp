// app/settings/users/directory-store.ts
'use client';

import * as React from 'react';

/* =========================================================
   Types (UI aligned to DB/API)
========================================================= */

export type PersonStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE';

export type LocationType =
  | 'HQ'
  | 'OFFICE'
  | 'WAREHOUSE'
  | 'MAINTENANCE_BASE'
  | 'TRAINING_CENTER'
  | 'BRANCH'
  | 'OTHER';

export type LocationAddress = {
  id: string;
  locationId: string;

  label: string | null;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;

  latitude: number | null;
  longitude: number | null;

  isPrimary: boolean;

  createdAt: string;
  updatedAt: string;
};

export type Location = {
  id: string;
  name: string;
  kuerzel: string | null;
  type: LocationType;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // optional relations, wenn API sie mitsendet
  addresses?: LocationAddress[];
};

export type Department = {
  id: string;
  name: string;
  kuerzel: string | null;
  description: string | null;
  isActive: boolean;
  locationId: string;
  createdAt: string;
  updatedAt: string;

  // optional relation, wenn API sie mitsendet
  location?: Location;
};

export type Team = {
  id: string;
  name: string;
  kuerzel: string | null;
  description: string | null;
  isActive: boolean;
  departmentId: string;
  createdAt: string;
  updatedAt: string;

  // optional relation, wenn API sie mitsendet
  department?: Department & { location?: Location };
};

export type Role = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Person = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  status: PersonStatus;

  // Legacy-/Fallback-Zuordnung
  departmentId: string | null;

  // Neue Ziel-Zuordnung
  teamId: string | null;

  roleId: string;

  userId: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  lastInvitedAt: string | null;

  createdAt: string;
  updatedAt: string;

  // optional relations, wenn API sie mitsendet
  department?: Department & { location?: Location };
  team?: Team & { department?: Department & { location?: Location } };
  role?: Role;

  // UI helper
  displayName: string;
};

export type DirectorySnapshot = {
  locations: Location[];
  departments: Department[];
  teams: Team[];
  people: Person[];
  roles: Role[];

  selectedLocationId: string | null;
  selectedDepartmentId: string | null;
  selectedTeamId: string | null;
};

type Store = {
  getSnapshot(): DirectorySnapshot;
  subscribe(cb: () => void): () => void;

  // selection (Master/Detail)
  selectLocation(id: string | null): void;
  selectDepartment(id: string | null): void;
  selectTeam(id: string | null): void;

  // refresh
  refreshDirectory(): void;

  // locations
  addLocation(input: {
    name: string;
    kuerzel?: string;
    type?: LocationType;
    description?: string | null;
  }): void;

  updateLocation(
    id: string,
    patch: Partial<Pick<Location, 'name' | 'kuerzel' | 'type' | 'description' | 'isActive'>>
  ): void;

  removeLocation(id: string): void;

  // departments
  addDepartment(input: {
    name: string;
    kuerzel?: string;
    description?: string | null;
    locationId: string;
  }): void;

  updateDepartment(
    id: string,
    patch: Partial<Pick<Department, 'name' | 'kuerzel' | 'description' | 'isActive' | 'locationId'>>
  ): void;

  removeDepartment(id: string): void;

  // teams
  addTeam(input: {
    name: string;
    kuerzel?: string;
    description?: string | null;
    departmentId: string;
  }): void;

  updateTeam(
    id: string,
    patch: Partial<Pick<Team, 'name' | 'kuerzel' | 'description' | 'isActive' | 'departmentId'>>
  ): void;

  removeTeam(id: string): void;

  // people
  addPerson(input: {
    email: string;
    roleId: string;
    departmentId?: string | null;
    teamId?: string | null;
    status?: PersonStatus;

    // convenience
    firstName?: string;
    lastName?: string | null;
    displayName?: string;
  }): void;

  updatePerson(
    id: string,
    patch: Partial<{
      email: string | null;
      roleId: string;
      departmentId: string | null;
      teamId: string | null;
      status: PersonStatus;
      firstName: string;
      lastName: string | null;
      displayName: string;
    }>
  ): void;

  removePerson(id: string): void;

  // UI only
  clearDirectory(): void;

  // legacy alias
  clearAll(): void;
};

/* =========================================================
   Helpers
========================================================= */

const listeners = new Set<() => void>();

const stateRef: { current: DirectorySnapshot } = {
  current: {
    locations: [],
    departments: [],
    teams: [],
    people: [],
    roles: [],
    selectedLocationId: null,
    selectedDepartmentId: null,
    selectedTeamId: null,
  },
};

const serverSnapshot: DirectorySnapshot = {
  locations: [],
  departments: [],
  teams: [],
  people: [],
  roles: [],
  selectedLocationId: null,
  selectedDepartmentId: null,
  selectedTeamId: null,
};

function emit() {
  listeners.forEach((l) => l());
}

function isBlank(v: unknown): boolean {
  return !String(v ?? '').trim();
}

function s(v: unknown): string | null {
  if (v === null) return null;
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}

function sU(v: unknown): string | undefined {
  const t = s(v);
  return t ?? undefined;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function iso(v: unknown): string {
  const t = sU(v);
  return t ?? new Date().toISOString();
}

function isoN(v: unknown): string | null {
  const t = s(v);
  return t ?? null;
}

function numN(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isPersonStatus(v: unknown): v is PersonStatus {
  return v === 'INVITED' || v === 'ACTIVE' || v === 'INACTIVE';
}

function isLocationType(v: unknown): v is LocationType {
  return (
    v === 'HQ' ||
    v === 'OFFICE' ||
    v === 'WAREHOUSE' ||
    v === 'MAINTENANCE_BASE' ||
    v === 'TRAINING_CENTER' ||
    v === 'BRANCH' ||
    v === 'OTHER'
  );
}

function displayNameFrom(firstName: string, lastName: string | null): string {
  return [firstName, lastName ?? ''].filter(Boolean).join(' ').trim();
}

function splitDisplayName(displayName: string): { firstName: string; lastName: string | null } {
  const parts = String(displayName ?? '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
  return { firstName, lastName };
}

/* ------------ Normalizer (API -> UI Types) ------------ */

function normalizeLocationAddress(raw: any): LocationAddress | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = sU(raw.id);
  const locationId = sU(raw.locationId) ?? sU(raw.location?.id);

  if (!id || !locationId) return null;

  return {
    id,
    locationId,

    label: s(raw.label),
    street: s(raw.street),
    houseNumber: s(raw.houseNumber),
    postalCode: s(raw.postalCode),
    city: s(raw.city),
    state: s(raw.state),
    country: s(raw.country),

    latitude: numN(raw.latitude),
    longitude: numN(raw.longitude),

    isPrimary: bool(raw.isPrimary, false),

    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),
  };
}

function normalizeLocation(raw: any): Location | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = sU(raw.id);
  const name = sU(raw.name);

  if (!id || !name) return null;

  const typeRaw = raw.type;
  const type: LocationType = isLocationType(typeRaw) ? typeRaw : 'OFFICE';

  const location: Location = {
    id,
    name,
    kuerzel: s(raw.kuerzel),
    type,
    description: raw.description === undefined ? null : typeof raw.description === 'string' ? s(raw.description) : null,
    isActive: bool(raw.isActive, true),
    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),
  };

  if (Array.isArray(raw.addresses)) {
    location.addresses = raw.addresses.map(normalizeLocationAddress).filter(Boolean) as LocationAddress[];
  }

  return location;
}

function normalizeDepartment(raw: any): Department | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = sU(raw.id);
  const name = sU(raw.name);
  const locationId = sU(raw.locationId) ?? sU(raw.location?.id);

  if (!id || !name || !locationId) return null;

  const department: Department = {
    id,
    name,
    kuerzel: s(raw.kuerzel),
    description: raw.description === undefined ? null : typeof raw.description === 'string' ? s(raw.description) : null,
    isActive: bool(raw.isActive, true),
    locationId,
    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),
  };

  const loc = normalizeLocation(raw.location);
  if (loc) department.location = loc;

  return department;
}

function normalizeTeam(raw: any): Team | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = sU(raw.id);
  const name = sU(raw.name);
  const departmentId = sU(raw.departmentId) ?? sU(raw.department?.id);

  if (!id || !name || !departmentId) return null;

  const team: Team = {
    id,
    name,
    kuerzel: s(raw.kuerzel),
    description: raw.description === undefined ? null : typeof raw.description === 'string' ? s(raw.description) : null,
    isActive: bool(raw.isActive, true),
    departmentId,
    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),
  };

  const dep = normalizeDepartment(raw.department);
  if (dep) {
    const loc = normalizeLocation(raw.department?.location);
    team.department = loc ? { ...dep, location: loc } : dep;
  }

  return team;
}

function normalizeRole(raw: any): Role | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = sU(raw.id);
  const code = sU(raw.code);
  const name = sU(raw.name);

  if (!id || !code || !name) return null;

  return {
    id,
    code,
    name,
    description: raw.description === undefined ? null : typeof raw.description === 'string' ? s(raw.description) : null,
    isActive: bool(raw.isActive, true),
    isSystem: bool(raw.isSystem, false),
    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),
  };
}

function normalizePerson(raw: any): Person | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = sU(raw.id);
  const firstName = sU(raw.firstName);
  const email = sU(raw.email);
  const roleId = sU(raw.roleId) ?? sU(raw.role?.id);

  if (!id || !firstName || !email || !roleId) return null;

  const lastName = s(raw.lastName);
  const statusRaw = raw.status;
  const status: PersonStatus = isPersonStatus(statusRaw) ? statusRaw : 'ACTIVE';

  const teamId = s(raw.teamId) ?? s(raw.team?.id);

  const departmentId =
    s(raw.departmentId) ??
    s(raw.department?.id) ??
    s(raw.team?.departmentId) ??
    s(raw.team?.department?.id);

  const userId = s(raw.userId);

  const person: Person = {
    id,
    firstName,
    lastName,
    email,
    status,

    departmentId,
    teamId,
    roleId,

    userId,
    invitedAt: isoN(raw.invitedAt),
    acceptedAt: isoN(raw.acceptedAt),
    lastInvitedAt: isoN(raw.lastInvitedAt),

    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),

    displayName: displayNameFrom(firstName, lastName),
  };

  const dep = normalizeDepartment(raw.department);
  if (dep) {
    const loc = normalizeLocation(raw.department?.location);
    person.department = loc ? { ...dep, location: loc } : dep;
  }

  const team = normalizeTeam(raw.team);
  if (team) {
    person.team = team;
  }

  const role = normalizeRole(raw.role);
  if (role) person.role = role;

  return person;
}

/* ------------ API helper ------------ */

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init?.headers ?? {}),
  };

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data as any)?.message ?? res.statusText ?? 'Request failed';
    const err = new Error(msg) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

function fireAndForget(fn: () => Promise<void>) {
  void fn().catch((e) => console.error('[directory-store]', e));
}

/* =========================================================
   Store implementation (DB-backed)
========================================================= */

let didHydrate = false;

async function fetchAllAndSet() {
  const [locRes, depRes, pplRes] = await Promise.all([
    apiJson<{ success: true; locations: any[] }>('/api/directory/locations'),
    apiJson<{ success: true; departments: any[] }>('/api/directory/departments'),
    apiJson<{ success: true; people: any[] }>('/api/directory/people'),
  ]);

  let teams: Team[] = [];
  try {
    const teamRes = await apiJson<{ success: true; teams: any[] }>('/api/directory/teams');
    teams = (teamRes.teams ?? []).map(normalizeTeam).filter(Boolean) as Team[];
  } catch {
    teams = [];
  }

  let roles: Role[] = [];
  try {
    const roleRes = await apiJson<{ success: true; roles: any[] }>('/api/directory/roles');
    roles = (roleRes.roles ?? []).map(normalizeRole).filter(Boolean) as Role[];
  } catch {
    roles = [];
  }

  const locations = (locRes.locations ?? []).map(normalizeLocation).filter(Boolean) as Location[];
  const departments = (depRes.departments ?? []).map(normalizeDepartment).filter(Boolean) as Department[];
  const people = (pplRes.people ?? []).map(normalizePerson).filter(Boolean) as Person[];

  const locSet = new Set(locations.map((l) => l.id));
  const depSet = new Set(departments.map((d) => d.id));
  const teamSet = new Set(teams.map((t) => t.id));

  const snap = stateRef.current;

  const selectedLocationId =
    snap.selectedLocationId && locSet.has(snap.selectedLocationId) ? snap.selectedLocationId : null;

  const selectedDepartmentId =
    snap.selectedDepartmentId && depSet.has(snap.selectedDepartmentId) ? snap.selectedDepartmentId : null;

  const selectedTeamId = snap.selectedTeamId && teamSet.has(snap.selectedTeamId) ? snap.selectedTeamId : null;

  stateRef.current = {
    locations,
    departments,
    teams,
    people,
    roles,
    selectedLocationId,
    selectedDepartmentId,
    selectedTeamId,
  };

  emit();
}

const store: Store = {
  getSnapshot: () => stateRef.current,

  subscribe: (cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  refreshDirectory: () => {
    fireAndForget(fetchAllAndSet);
  },

  selectLocation: (id) => {
    const snap = stateRef.current;
    const next: DirectorySnapshot = { ...snap, selectedLocationId: id };

    if (id) {
      const dep = snap.departments.find((d) => d.id === snap.selectedDepartmentId);

      if (dep && dep.locationId !== id) {
        next.selectedDepartmentId = null;
        next.selectedTeamId = null;
      }

      const team = snap.teams.find((t) => t.id === snap.selectedTeamId);
      const teamDep = team ? snap.departments.find((d) => d.id === team.departmentId) : null;

      if (teamDep && teamDep.locationId !== id) {
        next.selectedTeamId = null;
      }
    } else {
      next.selectedDepartmentId = null;
      next.selectedTeamId = null;
    }

    stateRef.current = next;
    emit();
  },

  selectDepartment: (id) => {
    const snap = stateRef.current;
    const next: DirectorySnapshot = { ...snap, selectedDepartmentId: id };

    if (id) {
      const dep = snap.departments.find((d) => d.id === id);
      if (dep) next.selectedLocationId = dep.locationId;

      const team = snap.teams.find((t) => t.id === snap.selectedTeamId);
      if (team && team.departmentId !== id) {
        next.selectedTeamId = null;
      }
    } else {
      next.selectedTeamId = null;
    }

    stateRef.current = next;
    emit();
  },

  selectTeam: (id) => {
    const snap = stateRef.current;

    if (!id) {
      stateRef.current = { ...snap, selectedTeamId: null };
      emit();
      return;
    }

    const team = snap.teams.find((t) => t.id === id);
    const dep = team ? snap.departments.find((d) => d.id === team.departmentId) : null;

    stateRef.current = {
      ...snap,
      selectedTeamId: id,
      selectedDepartmentId: team?.departmentId ?? snap.selectedDepartmentId,
      selectedLocationId: dep?.locationId ?? snap.selectedLocationId,
    };

    emit();
  },

  /* ---------------- Locations ---------------- */

  addLocation: (input) => {
    const name = String(input.name ?? '').trim();
    if (!name) return;

    fireAndForget(async () => {
      const body = {
        name,
        kuerzel: sU(input.kuerzel) ?? null,
        type: input.type ?? 'OFFICE',
        description:
          input.description === undefined
            ? null
            : typeof input.description === 'string'
              ? s(input.description)
              : null,
      };

      const res = await apiJson<{ success: true; location: any }>('/api/directory/locations', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const loc = normalizeLocation(res.location);
      if (!loc) return;

      const snap = stateRef.current;

      stateRef.current = {
        ...snap,
        locations: [loc, ...snap.locations],
        selectedLocationId: loc.id,
        selectedDepartmentId: null,
        selectedTeamId: null,
      };

      emit();
    });
  },

  updateLocation: (id, patch) => {
    if (isBlank(id)) return;

    fireAndForget(async () => {
      const body: any = {};

      if ('name' in patch) body.name = sU(patch.name);
      if ('kuerzel' in patch) body.kuerzel = patch.kuerzel === undefined ? undefined : (patch.kuerzel ?? null);
      if ('type' in patch) body.type = patch.type;
      if ('description' in patch) body.description = patch.description === undefined ? undefined : (patch.description ?? null);
      if ('isActive' in patch) body.isActive = patch.isActive;

      const res = await apiJson<{ success: true; location: any }>(`/api/directory/locations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      const loc = normalizeLocation(res.location);
      if (!loc) return;

      const snap = stateRef.current;
      stateRef.current = { ...snap, locations: snap.locations.map((l) => (l.id === id ? loc : l)) };

      emit();
    });
  },

  removeLocation: (id) => {
    if (isBlank(id)) return;

    fireAndForget(async () => {
      await apiJson<{ success: true }>(`/api/directory/locations/${id}`, { method: 'DELETE' });

      const snap = stateRef.current;

      const deptIdsToRemove = snap.departments.filter((d) => d.locationId === id).map((d) => d.id);
      const deptSet = new Set(deptIdsToRemove);

      const teamIdsToRemove = snap.teams.filter((t) => deptSet.has(t.departmentId)).map((t) => t.id);
      const teamSet = new Set(teamIdsToRemove);

      const locations = snap.locations.filter((l) => l.id !== id);
      const departments = snap.departments.filter((d) => d.locationId !== id);
      const teams = snap.teams.filter((t) => !teamSet.has(t.id));

      const people = snap.people.map((p) => {
        const removeDepartment = p.departmentId ? deptSet.has(p.departmentId) : false;
        const removeTeam = p.teamId ? teamSet.has(p.teamId) : false;

        if (!removeDepartment && !removeTeam) return p;

        return {
          ...p,
          departmentId: removeDepartment ? null : p.departmentId,
          teamId: removeTeam ? null : p.teamId,
          department: undefined,
          team: undefined,
        };
      });

      stateRef.current = {
        ...snap,
        locations,
        departments,
        teams,
        people,
        selectedLocationId: snap.selectedLocationId === id ? null : snap.selectedLocationId,
        selectedDepartmentId:
          snap.selectedDepartmentId && deptSet.has(snap.selectedDepartmentId) ? null : snap.selectedDepartmentId,
        selectedTeamId: snap.selectedTeamId && teamSet.has(snap.selectedTeamId) ? null : snap.selectedTeamId,
      };

      emit();
    });
  },

  /* ---------------- Departments ---------------- */

  addDepartment: (input) => {
    const name = String(input.name ?? '').trim();
    if (!name) return;
    if (isBlank(input.locationId)) return;

    fireAndForget(async () => {
      const body = {
        name,
        kuerzel: sU(input.kuerzel) ?? null,
        description:
          input.description === undefined
            ? null
            : typeof input.description === 'string'
              ? s(input.description)
              : null,
        locationId: input.locationId,
      };

      const res = await apiJson<{ success: true; department: any }>('/api/directory/departments', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const dep = normalizeDepartment(res.department);
      if (!dep) return;

      const snap = stateRef.current;

      stateRef.current = {
        ...snap,
        departments: [dep, ...snap.departments],
        selectedLocationId: dep.locationId,
        selectedDepartmentId: dep.id,
        selectedTeamId: null,
      };

      emit();
    });
  },

  updateDepartment: (id, patch) => {
    if (isBlank(id)) return;

    fireAndForget(async () => {
      const body: any = {};

      if ('name' in patch) body.name = sU(patch.name);
      if ('kuerzel' in patch) body.kuerzel = patch.kuerzel === undefined ? undefined : (patch.kuerzel ?? null);
      if ('description' in patch) body.description = patch.description === undefined ? undefined : (patch.description ?? null);
      if ('isActive' in patch) body.isActive = patch.isActive;
      if ('locationId' in patch) body.locationId = patch.locationId === undefined ? undefined : patch.locationId;

      const res = await apiJson<{ success: true; department: any }>(`/api/directory/departments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      const dep = normalizeDepartment(res.department);
      if (!dep) return;

      const snap = stateRef.current;

      stateRef.current = {
        ...snap,
        departments: snap.departments.map((d) => (d.id === id ? dep : d)),
      };

      emit();
    });
  },

  removeDepartment: (id) => {
    if (isBlank(id)) return;

    fireAndForget(async () => {
      await apiJson<{ success: true }>(`/api/directory/departments/${id}`, { method: 'DELETE' });

      const snap = stateRef.current;

      const teamIdsToRemove = snap.teams.filter((t) => t.departmentId === id).map((t) => t.id);
      const teamSet = new Set(teamIdsToRemove);

      const departments = snap.departments.filter((d) => d.id !== id);
      const teams = snap.teams.filter((t) => t.departmentId !== id);

      const people = snap.people.map((p) => {
        const removeDepartment = p.departmentId === id;
        const removeTeam = p.teamId ? teamSet.has(p.teamId) : false;

        if (!removeDepartment && !removeTeam) return p;

        return {
          ...p,
          departmentId: removeDepartment ? null : p.departmentId,
          teamId: removeTeam ? null : p.teamId,
          department: undefined,
          team: undefined,
        };
      });

      stateRef.current = {
        ...snap,
        departments,
        teams,
        people,
        selectedDepartmentId: snap.selectedDepartmentId === id ? null : snap.selectedDepartmentId,
        selectedTeamId: snap.selectedTeamId && teamSet.has(snap.selectedTeamId) ? null : snap.selectedTeamId,
      };

      emit();
    });
  },

  /* ---------------- Teams ---------------- */

  addTeam: (input) => {
    const name = String(input.name ?? '').trim();
    if (!name) return;
    if (isBlank(input.departmentId)) return;

    fireAndForget(async () => {
      const body = {
        name,
        kuerzel: sU(input.kuerzel) ?? null,
        description:
          input.description === undefined
            ? null
            : typeof input.description === 'string'
              ? s(input.description)
              : null,
        departmentId: input.departmentId,
      };

      const res = await apiJson<{ success: true; team: any }>('/api/directory/teams', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const team = normalizeTeam(res.team);
      if (!team) return;

      const snap = stateRef.current;
      const dep = snap.departments.find((d) => d.id === team.departmentId);

      stateRef.current = {
        ...snap,
        teams: [team, ...snap.teams],
        selectedLocationId: dep?.locationId ?? snap.selectedLocationId,
        selectedDepartmentId: team.departmentId,
        selectedTeamId: team.id,
      };

      emit();
    });
  },

  updateTeam: (id, patch) => {
    if (isBlank(id)) return;

    fireAndForget(async () => {
      const body: any = {};

      if ('name' in patch) body.name = sU(patch.name);
      if ('kuerzel' in patch) body.kuerzel = patch.kuerzel === undefined ? undefined : (patch.kuerzel ?? null);
      if ('description' in patch) body.description = patch.description === undefined ? undefined : (patch.description ?? null);
      if ('isActive' in patch) body.isActive = patch.isActive;
      if ('departmentId' in patch) body.departmentId = patch.departmentId === undefined ? undefined : patch.departmentId;

      const res = await apiJson<{ success: true; team: any }>(`/api/directory/teams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      const team = normalizeTeam(res.team);
      if (!team) return;

      const snap = stateRef.current;

      stateRef.current = {
        ...snap,
        teams: snap.teams.map((t) => (t.id === id ? team : t)),
      };

      emit();
    });
  },

  removeTeam: (id) => {
    if (isBlank(id)) return;

    fireAndForget(async () => {
      await apiJson<{ success: true }>(`/api/directory/teams/${id}`, { method: 'DELETE' });

      const snap = stateRef.current;
      const teams = snap.teams.filter((t) => t.id !== id);

      const people = snap.people.map((p) =>
        p.teamId === id
          ? {
              ...p,
              teamId: null,
              team: undefined,
            }
          : p
      );

      stateRef.current = {
        ...snap,
        teams,
        people,
        selectedTeamId: snap.selectedTeamId === id ? null : snap.selectedTeamId,
      };

      emit();
    });
  },

  /* ---------------- People ---------------- */

  addPerson: (input) => {
    const email = String(input.email ?? '').trim();
    if (!email) return;

    const roleId = String(input.roleId ?? '').trim();
    if (!roleId) return;

    let firstName = String(input.firstName ?? '').trim();

    let lastName: string | null =
      input.lastName === undefined
        ? null
        : typeof input.lastName === 'string'
          ? input.lastName.trim() || null
          : null;

    if (!firstName) {
      const dn = String(input.displayName ?? '').trim();
      if (!dn) return;

      const split = splitDisplayName(dn);
      firstName = split.firstName;
      lastName = split.lastName;
    }

    const status: PersonStatus = input.status ?? 'ACTIVE';

    const teamId =
      input.teamId === undefined
        ? null
        : String(input.teamId ?? '').trim() || null;

    const derivedDepartmentId =
      teamId ? stateRef.current.teams.find((t) => t.id === teamId)?.departmentId ?? null : null;

    const departmentId =
      input.departmentId === undefined
        ? derivedDepartmentId
        : String(input.departmentId ?? '').trim() || derivedDepartmentId;

    fireAndForget(async () => {
      const body: any = {
        firstName,
        lastName,
        email,
        status,
        roleId,
        departmentId,
      };

      if (input.teamId !== undefined) {
        body.teamId = teamId;
      }

      const res = await apiJson<{ success: true; person: any }>('/api/directory/people', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const person = normalizePerson(res.person);
      if (!person) return;

      const snap = stateRef.current;
      stateRef.current = { ...snap, people: [person, ...snap.people] };

      emit();
    });
  },

  updatePerson: (id, patch) => {
    if (isBlank(id)) return;

    fireAndForget(async () => {
      const body: any = {};

      if ('displayName' in patch && typeof patch.displayName === 'string') {
        const dn = patch.displayName.trim();

        if (dn) {
          const split = splitDisplayName(dn);
          body.firstName = split.firstName;
          body.lastName = split.lastName;
        }
      }

      if ('firstName' in patch) body.firstName = sU(patch.firstName);

      if ('lastName' in patch) {
        body.lastName =
          patch.lastName === undefined
            ? undefined
            : typeof patch.lastName === 'string'
              ? s(patch.lastName)
              : null;
      }

      if ('email' in patch) {
        body.email =
          patch.email === undefined
            ? undefined
            : typeof patch.email === 'string'
              ? sU(patch.email)
              : null;
      }

      if ('status' in patch) body.status = patch.status;
      if ('roleId' in patch) body.roleId = sU(patch.roleId);

      if ('teamId' in patch) {
        const teamId = patch.teamId === undefined ? undefined : String(patch.teamId ?? '').trim() || null;
        body.teamId = teamId;

        if (!('departmentId' in patch) && teamId) {
          const team = stateRef.current.teams.find((t) => t.id === teamId);
          if (team) body.departmentId = team.departmentId;
        }
      }

      if ('departmentId' in patch) {
        body.departmentId =
          patch.departmentId === undefined
            ? undefined
            : String(patch.departmentId ?? '').trim() || null;
      }

      const res = await apiJson<{ success: true; person: any }>(`/api/directory/people/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      const person = normalizePerson(res.person);
      if (!person) return;

      const snap = stateRef.current;
      stateRef.current = { ...snap, people: snap.people.map((p) => (p.id === id ? person : p)) };

      emit();
    });
  },

  removePerson: (id) => {
    if (isBlank(id)) return;

    fireAndForget(async () => {
      await apiJson<{ success: true }>(`/api/directory/people/${id}`, { method: 'DELETE' });

      const snap = stateRef.current;
      stateRef.current = { ...snap, people: snap.people.filter((p) => p.id !== id) };

      emit();
    });
  },

  clearDirectory: () => {
    stateRef.current = {
      locations: [],
      departments: [],
      teams: [],
      people: [],
      roles: [],
      selectedLocationId: null,
      selectedDepartmentId: null,
      selectedTeamId: null,
    };

    emit();
  },

  clearAll: () => {
    store.clearDirectory();
  },
};

/* =========================================================
   Public hook (derived maps) + initial hydrate
========================================================= */

export function useDirectoryStore() {
  const snap = React.useSyncExternalStore(store.subscribe, store.getSnapshot, () => serverSnapshot);

  React.useEffect(() => {
    if (didHydrate) return;

    didHydrate = true;
    store.refreshDirectory();
  }, []);

  const locationById = React.useMemo(
    () => new Map(snap.locations.map((l) => [l.id, l] as const)),
    [snap.locations]
  );

  const departmentById = React.useMemo(
    () => new Map(snap.departments.map((d) => [d.id, d] as const)),
    [snap.departments]
  );

  const teamById = React.useMemo(
    () => new Map(snap.teams.map((t) => [t.id, t] as const)),
    [snap.teams]
  );

  const roleById = React.useMemo(
    () => new Map(snap.roles.map((r) => [r.id, r] as const)),
    [snap.roles]
  );

  const departmentsByLocationId = React.useMemo(() => {
    const m = new Map<string, Department[]>();

    for (const d of snap.departments) {
      const arr = m.get(d.locationId) ?? [];
      arr.push(d);
      m.set(d.locationId, arr);
    }

    for (const [k, arr] of m) {
      arr.sort((a, b) => a.name.localeCompare(b.name));
      m.set(k, arr);
    }

    return m;
  }, [snap.departments]);

  const teamsByDepartmentId = React.useMemo(() => {
    const m = new Map<string, Team[]>();

    for (const t of snap.teams) {
      const arr = m.get(t.departmentId) ?? [];
      arr.push(t);
      m.set(t.departmentId, arr);
    }

    for (const [k, arr] of m) {
      arr.sort((a, b) => a.name.localeCompare(b.name));
      m.set(k, arr);
    }

    return m;
  }, [snap.teams]);

  const peopleByTeamId = React.useMemo(() => {
    const m = new Map<string, Person[]>();

    for (const p of snap.people) {
      const key = p.teamId ?? '';
      if (!key) continue;

      const arr = m.get(key) ?? [];
      arr.push(p);
      m.set(key, arr);
    }

    for (const [k, arr] of m) {
      arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
      m.set(k, arr);
    }

    return m;
  }, [snap.people]);

  const peopleByDepartmentId = React.useMemo(() => {
    const m = new Map<string, Person[]>();

    for (const p of snap.people) {
      const team = p.teamId ? teamById.get(p.teamId) : null;
      const key = p.departmentId ?? team?.departmentId ?? '';

      if (!key) continue;

      const arr = m.get(key) ?? [];
      arr.push(p);
      m.set(key, arr);
    }

    for (const [k, arr] of m) {
      arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
      m.set(k, arr);
    }

    return m;
  }, [snap.people, teamById]);

  const selectedLocation = snap.selectedLocationId ? locationById.get(snap.selectedLocationId) ?? null : null;
  const selectedDepartment = snap.selectedDepartmentId ? departmentById.get(snap.selectedDepartmentId) ?? null : null;
  const selectedTeam = snap.selectedTeamId ? teamById.get(snap.selectedTeamId) ?? null : null;

  const visibleDepartments =
    snap.selectedLocationId ? departmentsByLocationId.get(snap.selectedLocationId) ?? [] : snap.departments;

  const visibleTeams =
    snap.selectedDepartmentId ? teamsByDepartmentId.get(snap.selectedDepartmentId) ?? [] : snap.teams;

  const visiblePeople =
    snap.selectedTeamId
      ? peopleByTeamId.get(snap.selectedTeamId) ?? []
      : snap.selectedDepartmentId
        ? peopleByDepartmentId.get(snap.selectedDepartmentId) ?? []
        : snap.people;

  return {
    ...snap,

    // derived
    locationById,
    departmentById,
    teamById,
    roleById,

    departmentsByLocationId,
    teamsByDepartmentId,
    peopleByDepartmentId,
    peopleByTeamId,

    selectedLocation,
    selectedDepartment,
    selectedTeam,

    visibleDepartments,
    visibleTeams,
    visiblePeople,

    // actions
    refreshDirectory: store.refreshDirectory,

    selectLocation: store.selectLocation,
    selectDepartment: store.selectDepartment,
    selectTeam: store.selectTeam,

    addLocation: store.addLocation,
    updateLocation: store.updateLocation,
    removeLocation: store.removeLocation,

    addDepartment: store.addDepartment,
    updateDepartment: store.updateDepartment,
    removeDepartment: store.removeDepartment,

    addTeam: store.addTeam,
    updateTeam: store.updateTeam,
    removeTeam: store.removeTeam,

    addPerson: store.addPerson,
    updatePerson: store.updatePerson,
    removePerson: store.removePerson,

    clearDirectory: store.clearDirectory,
    clearAll: store.clearAll,
  };
}