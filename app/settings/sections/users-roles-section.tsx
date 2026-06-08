// app/settings/sections/users-roles-section.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Clock3,
  Download,
  Mail,
  MoreHorizontal,
  Plus,
  Printer,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';

import {
  useDirectoryStore,
  type PersonStatus,
} from '../users/directory-store';

type AdminTab = 'organization' | 'users' | 'invites' | 'roles';

type PendingInviteStatus = 'pending' | 'expired' | 'accepted';

type PendingInvite = {
  id: string;
  email: string;
  roleId: string;
  departmentId: string | null;
  createdAt: string;
  status: PendingInviteStatus;
};

type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: {
    code: string;
    name: string;
  };
  person: {
    id: string;
    firstName: string;
    lastName: string | null;
    status: 'INVITED' | 'ACTIVE' | 'INACTIVE';
    invitedAt: string | null;
    acceptedAt: string | null;
    lastInvitedAt: string | null;
    department: {
      id: string;
      name: string;
      kuerzel: string | null;
      location: {
        id: string;
        name: string;
        kuerzel: string | null;
      };
    } | null;
  } | null;
};

type UserTableRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  status: string;
  departmentId: string | null;
  roleId: string | null;
};

type InvitationTableRow = {
  id: string;
  email: string;
  roleId: string;
  departmentId: string | null;
  createdAt: string;
  status: PendingInviteStatus;
  isLocal: boolean;
};

const INVITES_STORAGE_KEY = 'lextrack_pending_invites_v1';

const ROLE_OPTIONS = [
  {
    id: 'admin',
    labelDe: 'Admin',
    labelEn: 'Admin',
    descriptionDe: 'Vollzugriff auf Einstellungen, Organisation und Rollen.',
    descriptionEn: 'Full access to settings, organisation and roles.',
  },
  {
    id: 'compliance_manager',
    labelDe: 'Compliance Manager',
    labelEn: 'Compliance Manager',
    descriptionDe: 'Verantwortlich für Compliance-Bewertung und Freigaben.',
    descriptionEn: 'Responsible for compliance assessment and approvals.',
  },
  {
    id: 'requirement_engineer',
    labelDe: 'Requirement Engineer',
    labelEn: 'Requirement Engineer',
    descriptionDe: 'Bearbeitet Anforderungen, Nachweise und fachliche Bewertungen.',
    descriptionEn: 'Works on requirements, evidence and technical assessments.',
  },
  {
    id: 'auditor',
    labelDe: 'Auditor',
    labelEn: 'Auditor',
    descriptionDe: 'Prüft Anforderungen, Nachweise und Umsetzung nachvollziehbar.',
    descriptionEn: 'Reviews requirements, evidence and implementation.',
  },
  {
    id: 'viewer',
    labelDe: 'Viewer',
    labelEn: 'Viewer',
    descriptionDe: 'Lesender Zugriff ohne Bearbeitungsrechte.',
    descriptionEn: 'Read-only access without editing rights.',
  },
  {
    id: 'external',
    labelDe: 'Externer Nutzer',
    labelEn: 'External user',
    descriptionDe: 'Eingeschränkter Zugriff für externe Partner oder Lieferanten.',
    descriptionEn: 'Restricted access for external partners or suppliers.',
  },
] as const;

const panelCls = 'rounded-xl border border-slate-200 bg-white shadow-sm';

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#009A93] focus:ring-4 focus:ring-[#009A93]/15';

const labelCls = 'text-xs font-semibold text-slate-700';

function isBlank(value: unknown): boolean {
  return !String(value ?? '').trim();
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `invite-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadPendingInvites(): PendingInvite[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(INVITES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is PendingInvite => {
      return (
        item &&
        typeof item.id === 'string' &&
        typeof item.email === 'string' &&
        typeof item.roleId === 'string' &&
        typeof item.createdAt === 'string' &&
        (item.departmentId === null || typeof item.departmentId === 'string') &&
        (item.status === 'pending' || item.status === 'expired' || item.status === 'accepted')
      );
    });
  } catch {
    return [];
  }
}

function savePendingInvites(invites: PendingInvite[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(invites));
  } catch {
    // localStorage may be unavailable.
  }
}

function escapeCsv(value: unknown): string {
  const raw = String(value ?? '');
  return `"${raw.replaceAll('"', '""')}"`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function mapInviteRoleToRoleCode(roleId: string): string {
  switch (roleId) {
    case 'admin':
      return 'ADMIN';
    case 'compliance_manager':
      return 'COMPLIANCE_MANAGER';
    case 'requirement_engineer':
      return 'REQUIREMENT_ENGINEER';
    case 'auditor':
      return 'AUDITOR';
    case 'viewer':
      return 'VIEWER';
    case 'external':
      return 'EXTERNAL';
    default:
      return 'USER';
  }
}

function normalizeRoleLabel(roleId: string | null | undefined, isDe: boolean): string {
  const id = String(roleId ?? '').trim();

  if (!id) {
    return isDe ? 'Nicht zugewiesen' : 'Not assigned';
  }

  const role = ROLE_OPTIONS.find((r) => r.id === id);

  if (role) {
    return isDe ? role.labelDe : role.labelEn;
  }

  switch (id.toUpperCase()) {
    case 'ADMIN':
      return 'Admin';
    case 'COMPLIANCE_MANAGER':
      return 'Compliance Manager';
    case 'REQUIREMENT_ENGINEER':
      return 'Requirement Engineer';
    case 'AUDITOR':
      return 'Auditor';
    case 'VIEWER':
      return 'Viewer';
    case 'EXTERNAL':
      return isDe ? 'Externer Nutzer' : 'External user';
    default:
      return id.replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }
}

function statusLabel(status: PersonStatus | string | undefined, isDe: boolean): string {
  const value = String(status ?? '').toUpperCase();

  if (value === 'INVITED') {
    return isDe ? 'Eingeladen' : 'Invited';
  }

  if (value === 'INACTIVE') {
    return isDe ? 'Inaktiv' : 'Inactive';
  }

  return isDe ? 'Aktiviert' : 'Activated';
}

function statusPillCls(status: PersonStatus | string | undefined): string {
  const value = String(status ?? '').toUpperCase();

  if (value === 'INVITED') {
    return 'bg-sky-50 text-sky-700 ring-sky-200';
  }

  if (value === 'INACTIVE') {
    return 'bg-slate-100 text-slate-700 ring-slate-200';
  }

  return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
}

function inviteStatusLabel(status: PendingInviteStatus, isDe: boolean): string {
  if (status === 'accepted') {
    return isDe ? 'Aktiviert' : 'Activated';
  }

  if (status === 'expired') {
    return isDe ? 'Abgelaufen' : 'Expired';
  }

  return isDe ? 'Ausstehend' : 'Pending';
}

function inviteStatusPillCls(status: PendingInviteStatus): string {
  if (status === 'accepted') {
    return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
  }

  if (status === 'expired') {
    return 'bg-amber-50 text-amber-800 ring-amber-200';
  }

  return 'bg-sky-50 text-sky-800 ring-sky-200';
}

function formatRelativeDate(isoDate: string, isDe: boolean): string {
  const created = new Date(isoDate).getTime();

  if (Number.isNaN(created)) {
    return isDe ? 'unbekannt' : 'unknown';
  }

  const diffMs = Date.now() - created;
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return isDe ? 'heute' : 'today';
  if (diffDays === 1) return isDe ? 'vor 1 Tag' : '1 day ago';

  return isDe ? `vor ${diffDays} Tagen` : `${diffDays} days ago`;
}

export default function UsersRolesSection({ isDe = true }: { isDe?: boolean }) {
  const {
    locations,
    visibleDepartments,
    visiblePeople,
    selectedLocationId: storeSelectedLocationId,
    selectedDepartmentId: storeSelectedDepartmentId,
    addLocation,
    removeLocation,
    addDepartment,
    removeDepartment,
    removePerson,
    locationById,
    departmentById,
  } = useDirectoryStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('organization');

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    storeSelectedLocationId ?? null
  );

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(
    storeSelectedDepartmentId ?? null
  );

  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddDepartment, setShowAddDepartment] = useState(false);

  const [locName, setLocName] = useState('');
  const [locKuerzel, setLocKuerzel] = useState('');
  const [depName, setDepName] = useState('');
  const [depKuerzel, setDepKuerzel] = useState('');

  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState<string>('auditor');
  const [inviteDepartmentId, setInviteDepartmentId] = useState<string>('');

  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>(loadPendingInvites);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState(false);
  const [isDeletingUserId, setIsDeletingUserId] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editRoleCode, setEditRoleCode] = useState('VIEWER');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [editLocationId, setEditLocationId] = useState('');

  const [uiError, setUiError] = useState<string | null>(null);
  const [uiMessage, setUiMessage] = useState<string | null>(null);

  const selectedLocation = selectedLocationId
    ? locationById.get(selectedLocationId) ?? null
    : null;

  const selectedDepartment = selectedDepartmentId
    ? departmentById.get(selectedDepartmentId) ?? null
    : null;

  const selectedLocationDepartmentCount = selectedLocationId
    ? visibleDepartments.filter((department) => department.locationId === selectedLocationId).length
    : 0;

  const locationOptions = useMemo(() => {
    const list = locations.slice();
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [locations]);

  const departmentOptions = useMemo(() => {
    const list = selectedLocationId
      ? visibleDepartments.filter((department) => department.locationId === selectedLocationId)
      : visibleDepartments.slice();

    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [visibleDepartments, selectedLocationId]);

  const allDepartmentOptions = useMemo(() => {
    const list = visibleDepartments.slice();
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [visibleDepartments]);

  const effectiveEditLocationId = useMemo(() => {
  if (editLocationId) return editLocationId;

  if (editDepartmentId) {
    const department = departmentById.get(editDepartmentId);
    if (department?.locationId) return department.locationId;
  }

  return editingUser?.person?.department?.location?.id ?? '';
}, [editLocationId, editDepartmentId, departmentById, editingUser]);

const editDepartmentOptions = useMemo(() => {
  const list = effectiveEditLocationId
    ? allDepartmentOptions.filter((department) => department.locationId === effectiveEditLocationId)
    : allDepartmentOptions.slice();

  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}, [allDepartmentOptions, editLocationId]);

useEffect(() => {
  if (!editingUser) return;
  if (!editDepartmentId) return;

  const department = departmentById.get(editDepartmentId);
  if (!department?.locationId) return;

  if (editLocationId !== department.locationId) {
    setEditLocationId(department.locationId);
  }
}, [editingUser, editDepartmentId, editLocationId, departmentById]);

  const adminUserById = useMemo(() => {
    return new Map(adminUsers.map((user) => [user.id, user]));
  }, [adminUsers]);

  const adminUserByEmail = useMemo(() => {
    return new Map(adminUsers.map((user) => [user.email.toLowerCase(), user]));
  }, [adminUsers]);

  const invitationRows = useMemo<InvitationTableRow[]>(() => {
    const rows: InvitationTableRow[] = [];
    const seenEmails = new Set<string>();

    pendingInvites.forEach((invite) => {
      const key = invite.email.toLowerCase();
      const adminUser = adminUserByEmail.get(key);
      const personStatus = String(adminUser?.person?.status ?? '').toUpperCase();

      const status: PendingInviteStatus =
        personStatus === 'ACTIVE'
          ? 'accepted'
          : personStatus === 'INVITED'
            ? 'pending'
            : invite.status;

      rows.push({
        id: invite.id,
        email: invite.email,
        roleId: adminUser?.role?.code ?? invite.roleId,
        departmentId: adminUser?.person?.department?.id ?? invite.departmentId,
        createdAt:
          adminUser?.person?.lastInvitedAt ??
          adminUser?.person?.invitedAt ??
          adminUser?.createdAt ??
          invite.createdAt,
        status,
        isLocal: true,
      });

      seenEmails.add(key);
    });

    adminUsers.forEach((user) => {
      const key = user.email.toLowerCase();
      if (seenEmails.has(key)) return;

      const person = user.person;
      if (!person?.invitedAt && !person?.lastInvitedAt && !person?.acceptedAt) return;

      const personStatus = String(person.status ?? '').toUpperCase();
      const status: PendingInviteStatus =
        personStatus === 'ACTIVE'
          ? 'accepted'
          : personStatus === 'INVITED'
            ? 'pending'
            : 'expired';

      rows.push({
        id: `db-${user.id}`,
        email: user.email,
        roleId: user.role?.code ?? 'USER',
        departmentId: person.department?.id ?? null,
        createdAt: person.lastInvitedAt ?? person.invitedAt ?? person.acceptedAt ?? user.createdAt,
        status,
        isLocal: false,
      });
    });

    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return rows;
  }, [pendingInvites, adminUsers, adminUserByEmail]);

  const openInviteCount = invitationRows.filter((invite) => invite.status === 'pending').length;

  const userRowsForTable = useMemo<UserTableRow[]>(() => {
    if (adminUsers.length > 0) {
      return adminUsers.map((user) => ({
        id: user.id,
        firstName: user.name || user.email,
        lastName: null,
        email: user.email,
        status: user.person?.status ?? (user.isActive ? 'ACTIVE' : 'INACTIVE'),
        departmentId: user.person?.department?.id ?? null,
        roleId: user.role?.code ?? null,
      }));
    }

    return visiblePeople.map((person) => ({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName ?? null,
      email: person.email ?? '',
      status: String(person.status ?? 'INACTIVE'),
      departmentId: person.departmentId ?? null,
      roleId: person.roleId ?? null,
    }));
  }, [adminUsers, visiblePeople]);

  const peopleInContext = useMemo<UserTableRow[]>(() => {
    let people = userRowsForTable.slice();

    if (selectedLocationId) {
      people = people.filter((person) => {
        if (!person.departmentId) return false;

        const department = departmentById.get(person.departmentId);
        return department?.locationId === selectedLocationId;
      });
    }

    if (selectedDepartmentId) {
      people = people.filter((person) => person.departmentId === selectedDepartmentId);
    }

    people.sort((a, b) => {
      const aName = [a.firstName, a.lastName, a.email].filter(Boolean).join(' ');
      const bName = [b.firstName, b.lastName, b.email].filter(Boolean).join(' ');
      return aName.localeCompare(bName);
    });

    return people;
  }, [userRowsForTable, selectedLocationId, selectedDepartmentId, departmentById]);

  const filteredPeople = useMemo<UserTableRow[]>(() => {
    return peopleInContext.filter((person) => {
      const status = String(person.status ?? '').toUpperCase();

      if (userStatusFilter === 'active') return status === 'ACTIVE';
      if (userStatusFilter === 'inactive') return status === 'INACTIVE';

      return true;
    });
  }, [peopleInContext, userStatusFilter]);

  const activePeopleCount = userRowsForTable.filter(
    (person) => String(person.status ?? '').toUpperCase() === 'ACTIVE'
  ).length;

  const inactivePeopleCount = userRowsForTable.filter(
    (person) => String(person.status ?? '').toUpperCase() === 'INACTIVE'
  ).length;

  const kpiDepartmentCount = selectedLocationId ? departmentOptions.length : visibleDepartments.length;
  const effectiveInviteDepartmentId = inviteDepartmentId || selectedDepartmentId || '';

  const tabs: {
    id: AdminTab;
    labelDe: string;
    labelEn: string;
    descriptionDe: string;
    descriptionEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'organization',
      labelDe: 'Organisation',
      labelEn: 'Organisation',
      descriptionDe: 'Standorte und Abteilungen verwalten.',
      descriptionEn: 'Manage locations and departments.',
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      id: 'users',
      labelDe: 'Benutzer',
      labelEn: 'Users',
      descriptionDe: 'Benutzerübersicht, Rollen und Status.',
      descriptionEn: 'Overview of users, roles and status.',
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: 'invites',
      labelDe: 'Einladungen',
      labelEn: 'Invitations',
      descriptionDe: 'Einladungen senden und nachverfolgen.',
      descriptionEn: 'Send and track invitations.',
      icon: <Mail className="h-5 w-5" />,
    },
    {
      id: 'roles',
      labelDe: 'Rollen & Rechte',
      labelEn: 'Roles & permissions',
      descriptionDe: 'Rollenprofile und Berechtigungen einsehen.',
      descriptionEn: 'View role profiles and permissions.',
      icon: <ShieldCheck className="h-5 w-5" />,
    },
  ];

  const updatePendingInvites = (next: PendingInvite[]) => {
    setPendingInvites(next);
    savePendingInvites(next);
  };

  const loadAdminUsers = async () => {
    setIsLoadingAdminUsers(true);
    setUiError(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ??
            (isDe ? 'Benutzer konnten nicht geladen werden.' : 'Users could not be loaded.')
        );
      }

      setAdminUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (error) {
      setUiError(
        error instanceof Error
          ? error.message
          : isDe
            ? 'Benutzer konnten nicht geladen werden.'
            : 'Users could not be loaded.'
      );
    } finally {
      setIsLoadingAdminUsers(false);
    }
  };

  useEffect(() => {
    void loadAdminUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'invites' || activeTab === 'organization') {
      void loadAdminUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const deleteAdminUser = async (user: AdminUserRow) => {
    const confirmed = confirm(
      isDe
        ? `Benutzer ${user.email} wirklich löschen? Die E-Mail-Adresse wird danach wieder für Einladungen frei.`
        : `Delete user ${user.email}? The email address will be available for invitations again.`
    );

    if (!confirmed) return;

    setUiError(null);
    setUiMessage(null);
    setIsDeletingUserId(user.id);

    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id }),
      });

const openEditUser = (person: UserTableRow) => {
  const adminUser = adminUserById.get(person.id);

  if (!adminUser) {
    setUiError(
      isDe
        ? 'Dieser Eintrag ist kein Login-Benutzer und kann hier nicht bearbeitet werden.'
        : 'This entry is not a login user and cannot be edited here.'
    );
    return;
  }

  const currentDepartmentId = person.departmentId ?? '';
  const currentDepartment = currentDepartmentId
    ? departmentById.get(currentDepartmentId)
    : null;

  const currentLocationId = currentDepartment?.locationId ?? '';

  setUiError(null);
  setUiMessage(null);
  setEditingUser(adminUser);
  setEditDepartmentId(currentDepartmentId);
  setEditLocationId(currentLocationId);
  setEditRoleCode(adminUser.role?.code ?? person.roleId ?? 'VIEWER');
};

const saveUserAssignment = async () => {
  if (!editingUser) return;

  setUiError(null);
  setUiMessage(null);
  setIsSavingUser(true);

  try {
    const response = await fetch('/api/admin/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingUser.id,
        roleCode: editRoleCode,
        departmentId: editDepartmentId || null,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.message ??
          (isDe
            ? 'Benutzer konnte nicht aktualisiert werden.'
            : 'User could not be updated.')
      );
    }

    setUiMessage(
      data?.message ??
        (isDe ? 'Benutzer wurde aktualisiert.' : 'User has been updated.')
    );

    setEditingUser(null);
    await loadAdminUsers();
  } catch (error) {
    setUiError(
      error instanceof Error
        ? error.message
        : isDe
          ? 'Benutzer konnte nicht aktualisiert werden.'
          : 'User could not be updated.'
    );
  } finally {
    setIsSavingUser(false);
  }
};

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ??
            (isDe ? 'Benutzer konnte nicht gelöscht werden.' : 'User could not be deleted.')
        );
      }

      const nextInvites = pendingInvites.filter(
        (invite) => invite.email.toLowerCase() !== user.email.toLowerCase()
      );

      updatePendingInvites(nextInvites);

      setUiMessage(
        data?.message ??
          (isDe
            ? 'Benutzer wurde gelöscht. Die E-Mail-Adresse ist wieder frei.'
            : 'User has been deleted. The email address is available again.')
      );

      await loadAdminUsers();
    } catch (error) {
      setUiError(
        error instanceof Error
          ? error.message
          : isDe
            ? 'Benutzer konnte nicht gelöscht werden.'
            : 'User could not be deleted.'
      );
    } finally {
      setIsDeletingUserId(null);
    }
  };

const openEditUser = (person: UserTableRow) => {
  const adminUser = adminUserById.get(person.id);

  if (!adminUser) {
    setUiError(
      isDe
        ? 'Dieser Eintrag ist kein Login-Benutzer und kann hier nicht bearbeitet werden.'
        : 'This entry is not a login user and cannot be edited here.'
    );
    return;
  }

  setUiError(null);
  setUiMessage(null);
  setEditingUser(adminUser);
  setEditDepartmentId(adminUser.person?.department?.id ?? '');
  setEditRoleCode(adminUser.role?.code ?? 'VIEWER');
};

const saveUserAssignment = async () => {
  if (!editingUser) return;

  setUiError(null);
  setUiMessage(null);

  if (editLocationId && !editDepartmentId) {
    setUiError(
      isDe
        ? 'Bitte eine Abteilung für den ausgewählten Standort auswählen. Der Standort wird über die Abteilung gespeichert.'
        : 'Please select a department for the selected location. The location is stored via the department.'
    );
    return;
  }

  setIsSavingUser(true);

  try {
    const response = await fetch('/api/admin/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingUser.id,
        roleCode: editRoleCode,
        departmentId: editDepartmentId || null,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.message ??
          (isDe
            ? 'Benutzer konnte nicht aktualisiert werden.'
            : 'User could not be updated.')
      );
    }

    setUiMessage(
      data?.message ??
        (isDe ? 'Benutzer wurde aktualisiert.' : 'User has been updated.')
    );

    setEditingUser(null);
    await loadAdminUsers();
  } catch (error) {
    setUiError(
      error instanceof Error
        ? error.message
        : isDe
          ? 'Benutzer konnte nicht aktualisiert werden.'
          : 'User could not be updated.'
    );
  } finally {
    setIsSavingUser(false);
  }
};

  const onAddLocation = () => {
    setUiError(null);
    setUiMessage(null);

    if (isBlank(locName)) {
      setUiError(isDe ? 'Bitte Standortname ausfüllen.' : 'Please enter a location name.');
      return;
    }

    addLocation({
      name: locName.trim(),
      kuerzel: locKuerzel.trim() || undefined,
    });

    setLocName('');
    setLocKuerzel('');
    setShowAddLocation(false);
    setUiMessage(isDe ? 'Standort wurde angelegt.' : 'Location has been created.');
  };

  const onAddDepartment = () => {
    setUiError(null);
    setUiMessage(null);

    if (!selectedLocationId) {
      setUiError(isDe ? 'Bitte zuerst einen Standort auswählen.' : 'Please select a location first.');
      return;
    }

    if (isBlank(depName)) {
      setUiError(isDe ? 'Bitte Abteilungsname ausfüllen.' : 'Please enter a department name.');
      return;
    }

    addDepartment({
      name: depName.trim(),
      kuerzel: depKuerzel.trim() || undefined,
      locationId: selectedLocationId,
    });

    setDepName('');
    setDepKuerzel('');
    setShowAddDepartment(false);
    setUiMessage(isDe ? 'Abteilung wurde angelegt.' : 'Department has been created.');
  };

  const onDeleteSelectedLocation = () => {
    setUiError(null);
    setUiMessage(null);

    if (!selectedLocation) return;

    if (selectedLocationDepartmentCount > 0) {
      setUiError(
        isDe
          ? 'Der Standort kann nicht gelöscht werden, solange ihm noch Abteilungen zugeordnet sind. Bitte zuerst die Abteilungen löschen oder verschieben.'
          : 'The location cannot be deleted while departments are still assigned to it. Please delete or move the departments first.'
      );
      return;
    }

    if (confirm(isDe ? 'Standort wirklich löschen?' : 'Delete location?')) {
      removeLocation(selectedLocation.id);
      setSelectedLocationId(null);
      setSelectedDepartmentId(null);
      setInviteDepartmentId('');
    }
  };

  const onSendInvite = async () => {
    setUiError(null);
    setUiMessage(null);

    const email = inviteEmail.trim();

    if (!email) {
      setUiError(isDe ? 'Bitte E-Mail-Adresse ausfüllen.' : 'Please enter an email address.');
      return;
    }

    if (!email.includes('@')) {
      setUiError(isDe ? 'E-Mail-Adresse wirkt ungültig.' : 'Email address looks invalid.');
      return;
    }

    if (!inviteRoleId) {
      setUiError(isDe ? 'Bitte Rolle auswählen.' : 'Please select a role.');
      return;
    }

    if (!effectiveInviteDepartmentId) {
      setUiError(isDe ? 'Bitte Abteilung auswählen.' : 'Please select a department.');
      return;
    }

    try {
      setIsSendingInvite(true);

      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email,
          roleCode: mapInviteRoleToRoleCode(inviteRoleId),
          departmentId: effectiveInviteDepartmentId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ??
            (isDe ? 'Einladung konnte nicht gesendet werden.' : 'Invitation could not be sent.')
        );
      }

      const nextInvite: PendingInvite = {
        id: makeId(),
        email,
        roleId: inviteRoleId,
        departmentId: effectiveInviteDepartmentId,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      updatePendingInvites([nextInvite, ...pendingInvites]);
      setInviteEmail('');
      setUiMessage(isDe ? 'Einladung wurde per E-Mail gesendet.' : 'Invitation has been sent by email.');
      await loadAdminUsers();
    } catch (error) {
      setUiError(
        error instanceof Error
          ? error.message
          : isDe
            ? 'Einladung konnte nicht gesendet werden.'
            : 'Invitation could not be sent.'
      );
    } finally {
      setIsSendingInvite(false);
    }
  };

  const onResendInvite = (inviteId: string) => {
    setUiError(null);
    setUiMessage(null);

    const next = pendingInvites.map((invite) =>
      invite.id === inviteId
        ? { ...invite, createdAt: new Date().toISOString(), status: 'pending' as PendingInviteStatus }
        : invite
    );

    updatePendingInvites(next);
    setUiMessage(isDe ? 'Einladung wurde erneut vorbereitet.' : 'Invitation has been prepared again.');
  };

  const onDeleteInvite = (inviteId: string) => {
    const next = pendingInvites.filter((invite) => invite.id !== inviteId);
    updatePendingInvites(next);
  };

  const userDisplayName = (person: UserTableRow) => {
    return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.email || '—';
  };

  const departmentDisplayName = (departmentId: string | null | undefined) => {
    if (!departmentId) return isDe ? 'Keine Abteilung' : 'No department';

    const department = departmentById.get(departmentId);
    if (!department) return isDe ? 'Unbekannte Abteilung' : 'Unknown department';

    return department.kuerzel ? `${department.kuerzel} — ${department.name}` : department.name;
  };

  const locationDisplayName = (departmentId: string | null | undefined) => {
  if (!departmentId) return isDe ? 'Kein Standort' : 'No location';

  const department = departmentById.get(departmentId);
  if (!department?.locationId) return isDe ? 'Kein Standort' : 'No location';

  const location = locationById.get(department.locationId);
  if (!location) return isDe ? 'Unbekannter Standort' : 'Unknown location';

  return location.kuerzel ? `${location.kuerzel} — ${location.name}` : location.name;
};

  const statusFilterLabel = () => {
    if (userStatusFilter === 'active') return isDe ? 'Aktiv' : 'Active';
    if (userStatusFilter === 'inactive') return isDe ? 'Inaktiv' : 'Inactive';
    return isDe ? 'Alle' : 'All';
  };

  const exportFilteredUsersCsv = () => {
    setUiError(null);
    setUiMessage(null);

    const header = [
      isDe ? 'Name' : 'Name',
      'E-Mail',
      isDe ? 'Rolle' : 'Role',
      isDe ? 'Standort' : 'Location',
      isDe ? 'Abteilung' : 'Department',
      isDe ? 'Status' : 'Status',
    ];

    const rows = filteredPeople.map((person) => {
      const department = person.departmentId ? departmentById.get(person.departmentId) : null;
      const location = department?.locationId ? locationById.get(department.locationId) : null;

      return [
        userDisplayName(person),
        person.email ?? '',
        normalizeRoleLabel(person.roleId, isDe),
        location?.name ?? '',
        departmentDisplayName(person.departmentId),
        statusLabel(person.status, isDe),
      ];
    });

    const csvRows = [header, ...rows].map((row) => row.map(escapeCsv).join(';'));
    const csv = String.fromCharCode(0xfeff) + csvRows.join(String.fromCharCode(10));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `lextrack-users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setUiMessage(
      isDe
        ? 'Benutzerliste wurde als Excel-kompatible CSV-Datei exportiert.'
        : 'User list has been exported as an Excel-compatible CSV file.'
    );
  };

  const printFilteredUsers = () => {
    setUiError(null);
    setUiMessage(null);

    const printWindow = window.open('', '_blank', 'width=1100,height=800');

    if (!printWindow) {
      setUiError(
        isDe
          ? 'Druckfenster konnte nicht geöffnet werden. Bitte Popup-Blocker prüfen.'
          : 'Print window could not be opened. Please check your popup blocker.'
      );
      return;
    }

    const locationLabel = selectedLocation?.name ?? (isDe ? 'Alle Standorte' : 'All locations');
    const departmentLabel = selectedDepartment?.name ?? (isDe ? 'Alle Abteilungen' : 'All departments');

    const tableRows = filteredPeople
      .map((person) => {
        const department = person.departmentId ? departmentById.get(person.departmentId) : null;
        const location = department?.locationId ? locationById.get(department.locationId) : null;

        return `
          <tr>
            <td>${escapeHtml(userDisplayName(person))}</td>
            <td>${escapeHtml(person.email ?? '')}</td>
            <td>${escapeHtml(normalizeRoleLabel(person.roleId, isDe))}</td>
            <td>${escapeHtml(location?.name ?? '')}</td>
            <td>${escapeHtml(departmentDisplayName(person.departmentId))}</td>
            <td>${escapeHtml(statusLabel(person.status, isDe))}</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(isDe ? 'LexTrack Benutzerliste' : 'LexTrack user list')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
            h1 { font-size: 22px; margin: 0 0 8px; }
            .meta { font-size: 12px; color: #475569; margin-bottom: 20px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; background: #f1f5f9; color: #334155; border-bottom: 1px solid #cbd5e1; padding: 8px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(isDe ? 'LexTrack Benutzerliste' : 'LexTrack user list')}</h1>
          <div class="meta">
            ${escapeHtml(isDe ? 'Standort' : 'Location')}: ${escapeHtml(locationLabel)}<br />
            ${escapeHtml(isDe ? 'Abteilung' : 'Department')}: ${escapeHtml(departmentLabel)}<br />
            ${escapeHtml(isDe ? 'Status' : 'Status')}: ${escapeHtml(statusFilterLabel())}<br />
            ${escapeHtml(isDe ? 'Exportiert am' : 'Exported on')}: ${escapeHtml(new Date().toLocaleString(isDe ? 'de-DE' : 'en-US'))}
          </div>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(isDe ? 'Name' : 'Name')}</th>
                <th>E-Mail</th>
                <th>${escapeHtml(isDe ? 'Rolle' : 'Role')}</th>
                <th>${escapeHtml(isDe ? 'Standort' : 'Location')}</th>
                <th>${escapeHtml(isDe ? 'Abteilung' : 'Department')}</th>
                <th>${escapeHtml(isDe ? 'Status' : 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || `<tr><td colspan="6">${escapeHtml(isDe ? 'Keine Benutzer im aktuellen Filter gefunden.' : 'No users found for the current filter.')}</td></tr>`}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const renderUserFilterControls = () => (
    <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1">
        <div className={labelCls}>{isDe ? 'Standort' : 'Location'}</div>
        <select
          className={inputCls}
          value={selectedLocationId ?? ''}
          onChange={(event) => {
  const nextLocationId = event.target.value;
  setEditLocationId(nextLocationId);

  const departmentsForLocation = nextLocationId
    ? allDepartmentOptions.filter((department) => department.locationId === nextLocationId)
    : [];

  if (departmentsForLocation.length === 1) {
    setEditDepartmentId(departmentsForLocation[0].id);
  } else {
    setEditDepartmentId('');
  }
}}
        >
          <option value="">{isDe ? 'Alle Standorte' : 'All locations'}</option>
          {locationOptions.map((location) => (
            <option key={location.id} value={location.id}>
              {location.kuerzel ? `${location.kuerzel} — ${location.name}` : location.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <div className={labelCls}>{isDe ? 'Abteilung' : 'Department'}</div>
        <select
          className={inputCls}
          value={selectedDepartmentId ?? ''}
          onChange={(event) => {
            const nextDepartmentId = event.target.value || null;
            setSelectedDepartmentId(nextDepartmentId);
            setInviteDepartmentId(nextDepartmentId ?? '');
          }}
        >
          <option value="">{isDe ? 'Alle Abteilungen' : 'All departments'}</option>
          {departmentOptions.map((department) => (
            <option key={department.id} value={department.id}>
              {department.kuerzel ? `${department.kuerzel} — ${department.name}` : department.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <div className={labelCls}>{isDe ? 'Status' : 'Status'}</div>
        <select
          className={inputCls}
          value={userStatusFilter}
          onChange={(event) => setUserStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
        >
          <option value="all">{isDe ? 'Alle' : 'All'}</option>
          <option value="active">{isDe ? 'Aktiv' : 'Active'}</option>
          <option value="inactive">{isDe ? 'Inaktiv' : 'Inactive'}</option>
        </select>
      </div>

      <div className="flex items-end">
        <button
          type="button"
          onClick={exportFilteredUsersCsv}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Excel
        </button>
      </div>

      <div className="flex items-end">
        <button
          type="button"
          onClick={printFilteredUsers}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Printer className="h-4 w-4" />
          {isDe ? 'Drucken' : 'Print'}
        </button>
      </div>
    </div>
  );

  const renderKpis = () => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-semibold text-slate-800">{activePeopleCount}</div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              {isDe ? 'Aktive Nutzer' : 'Active users'}
            </div>
          </div>
          <Users className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-orange-50/50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-semibold text-slate-800">{kpiDepartmentCount}</div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              {isDe ? 'Abteilungen' : 'Departments'}
            </div>
          </div>
          <Building2 className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-emerald-50/50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-semibold text-slate-800">{openInviteCount}</div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              {isDe ? 'Offene Einladungen' : 'Open invitations'}
            </div>
          </div>
          <Mail className="h-5 w-5 text-slate-400" />
        </div>
      </div>
    </div>
  );

  const renderOrganisationPanel = () => (
    <aside className={`${panelCls} overflow-hidden`}>
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            {isDe ? 'Organisation' : 'Organisation'}
          </h3>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="space-y-2">
          <div className={labelCls}>{isDe ? 'Standort' : 'Location'}</div>

          <select
            className={inputCls}
            value={selectedLocationId ?? ''}
            onChange={(event) => {
              const nextLocationId = event.target.value || null;
              setSelectedLocationId(nextLocationId);
              setSelectedDepartmentId(null);
              setInviteDepartmentId('');
            }}
          >
            <option value="">{isDe ? 'Standort auswählen' : 'Select location'}</option>
            {locationOptions.map((location) => (
              <option key={location.id} value={location.id}>
                {location.kuerzel ? `${location.kuerzel} — ${location.name}` : location.name}
              </option>
            ))}
          </select>

          {selectedLocation && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {isDe ? 'Aktueller Standort:' : 'Current location:'}{' '}
                <span className="font-medium text-slate-700">{selectedLocation.name}</span>
              </p>

              <button
                type="button"
                onClick={onDeleteSelectedLocation}
                className={[
                  'text-xs font-medium',
                  selectedLocationDepartmentCount > 0
                    ? 'text-slate-400'
                    : 'text-slate-500 hover:text-rose-700',
                ].join(' ')}
                title={
                  selectedLocationDepartmentCount > 0
                    ? isDe
                      ? 'Standort enthält noch Abteilungen'
                      : 'Location still contains departments'
                    : isDe
                      ? 'Standort löschen'
                      : 'Delete location'
                }
              >
                {isDe ? 'Löschen' : 'Delete'}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAddLocation((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            {isDe ? 'Standort hinzufügen' : 'Add location'}
          </button>

          {showAddLocation && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="space-y-1">
                <div className={labelCls}>{isDe ? 'Standortname' : 'Location name'}</div>
                <input
                  className={inputCls}
                  value={locName}
                  onChange={(event) => setLocName(event.target.value)}
                  placeholder={isDe ? 'z. B. Frankfurt' : 'e.g. Frankfurt'}
                />
              </div>

              <div className="space-y-1">
                <div className={labelCls}>{isDe ? 'Kürzel' : 'Code'}</div>
                <input
                  className={inputCls}
                  value={locKuerzel}
                  onChange={(event) => setLocKuerzel(event.target.value)}
                  placeholder="FRA"
                />
              </div>

              <button
                type="button"
                onClick={onAddLocation}
                className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {isDe ? 'Standort anlegen' : 'Create location'}
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">
              {isDe ? 'Abteilungen' : 'Departments'}
            </h4>

            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {departmentOptions.length}
            </span>
          </div>

          <div className="space-y-2">
            {departmentOptions.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                {selectedLocation
                  ? isDe
                    ? 'Für diesen Standort sind noch keine Abteilungen angelegt.'
                    : 'No departments have been created for this location yet.'
                  : isDe
                    ? 'Bitte zuerst einen Standort auswählen.'
                    : 'Please select a location first.'}
              </div>
            )}

            {departmentOptions.map((department) => {
              const isSelected = selectedDepartmentId === department.id;

              return (
                <button
                  key={department.id}
                  type="button"
                  onClick={() => {
                    setSelectedDepartmentId(department.id);
                    setInviteDepartmentId(department.id);
                  }}
                  className={[
                    'flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition',
                    isSelected
                      ? 'border-[#009A93] bg-[#009A93]/10 text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white',
                  ].join(' ')}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-sky-600 text-white">
                      <Building2 className="h-3.5 w-3.5" />
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {department.kuerzel
                          ? `${department.kuerzel} — ${department.name}`
                          : department.name}
                      </span>
                    </span>
                  </span>

                  <span
                    onClick={(event) => {
                      event.stopPropagation();

                      if (confirm(isDe ? 'Abteilung wirklich löschen?' : 'Delete department?')) {
                        removeDepartment(department.id);

                        if (selectedDepartmentId === department.id) {
                          setSelectedDepartmentId(null);
                        }

                        if (inviteDepartmentId === department.id) {
                          setInviteDepartmentId('');
                        }
                      }
                    }}
                    className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-rose-700"
                    title={isDe ? 'Abteilung löschen' : 'Delete department'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowAddDepartment((value) => !value)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            disabled={!selectedLocationId}
            title={!selectedLocationId ? (isDe ? 'Bitte Standort auswählen' : 'Please select a location') : ''}
          >
            <Plus className="h-4 w-4" />
            {isDe ? 'Abteilung hinzufügen' : 'Add department'}
          </button>

          {showAddDepartment && (
            <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="space-y-1">
                <div className={labelCls}>{isDe ? 'Abteilungsname' : 'Department name'}</div>
                <input
                  className={inputCls}
                  value={depName}
                  onChange={(event) => setDepName(event.target.value)}
                  placeholder={isDe ? 'z. B. IT Security' : 'e.g. IT Security'}
                />
              </div>

              <div className="space-y-1">
                <div className={labelCls}>{isDe ? 'Kürzel' : 'Code'}</div>
                <input
                  className={inputCls}
                  value={depKuerzel}
                  onChange={(event) => setDepKuerzel(event.target.value)}
                  placeholder="ITSEC"
                />
              </div>

              <button
                type="button"
                onClick={onAddDepartment}
                className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {isDe ? 'Abteilung anlegen' : 'Create department'}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  const renderUsersTable = () => (
    <section className={`${panelCls} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {isDe ? 'Benutzer' : 'Users'}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {selectedDepartment
              ? isDe
                ? `Gefiltert nach Abteilung: ${selectedDepartment.name}`
                : `Filtered by department: ${selectedDepartment.name}`
              : selectedLocation
                ? isDe
                  ? `Gefiltert nach Standort: ${selectedLocation.name}`
                  : `Filtered by location: ${selectedLocation.name}`
                : isDe
                  ? 'Alle Benutzer anzeigen oder über die Kontextzeile filtern.'
                  : 'Show all users or filter via the context line.'}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">{isDe ? 'Name' : 'Name'}</th>
              <th className="px-5 py-3">{isDe ? 'Rolle' : 'Role'}</th>
              <th className="px-5 py-3">{isDe ? 'Standort' : 'Location'}</th>
              <th className="px-5 py-3">{isDe ? 'Abteilung' : 'Department'}</th>
              <th className="px-5 py-3">{isDe ? 'Status' : 'Status'}</th>
              <th className="px-5 py-3 text-right">{isDe ? 'Aktion' : 'Action'}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {isLoadingAdminUsers && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                  {isDe ? 'Benutzer werden geladen ...' : 'Loading users ...'}
                </td>
              </tr>
            )}

            {!isLoadingAdminUsers && filteredPeople.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                  {isDe
                    ? 'Keine Benutzer im aktuellen Filter gefunden.'
                    : 'No users found for the current filter.'}
                </td>
              </tr>
            )}

            {!isLoadingAdminUsers &&
              filteredPeople.map((person) => (
                <tr key={person.id} className="bg-white hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {userDisplayName(person).slice(0, 1).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">
                          {userDisplayName(person)}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {person.email ?? '—'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {normalizeRoleLabel(person.roleId, isDe)}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {locationDisplayName(person.departmentId)}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {departmentDisplayName(person.departmentId)}
                  </td>

                  <td className="px-5 py-4">


                    <span
                      className={[
                        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1',
                        statusPillCls(person.status),
                      ].join(' ')}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {statusLabel(person.status, isDe)}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditUser(person)}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title={isDe ? 'Benutzer bearbeiten' : 'Edit user'}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const adminUser = adminUserById.get(person.id);

                          if (adminUser) {
                            void deleteAdminUser(adminUser);
                            return;
                          }

                          if (confirm(isDe ? 'Benutzer wirklich löschen?' : 'Delete user?')) {
                            removePerson(person.id);
                          }
                        }}
                        disabled={isDeletingUserId === person.id}
                        className={[
                          'rounded-md p-2',
                          isDeletingUserId === person.id
                            ? 'cursor-wait text-slate-300'
                            : 'text-slate-500 hover:bg-rose-50 hover:text-rose-700',
                        ].join(' ')}
                        title={
                          isDeletingUserId === person.id
                            ? isDe
                              ? 'Benutzer wird gelöscht ...'
                              : 'Deleting user ...'
                            : isDe
                              ? 'Benutzer löschen'
                              : 'Delete user'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderInviteForm = () => (
    <section className={`${panelCls} overflow-hidden`}>
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {isDe ? 'Einladung senden' : 'Send invitation'}
          </h3>

          <Send className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="space-y-1">
          <div className={labelCls}>{isDe ? 'E-Mail-Adresse' : 'Email address'}</div>
          <input
            className={inputCls}
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="user@example.com"
          />
        </div>

        <div className="space-y-1">
          <div className={labelCls}>{isDe ? 'Rolle auswählen' : 'Select role'}</div>
          <select
            className={inputCls}
            value={inviteRoleId}
            onChange={(event) => setInviteRoleId(event.target.value)}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.id} value={role.id}>
                {isDe ? role.labelDe : role.labelEn}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className={labelCls}>{isDe ? 'Abteilung auswählen' : 'Select department'}</div>
          <select
            className={inputCls}
            value={effectiveInviteDepartmentId}
            onChange={(event) => setInviteDepartmentId(event.target.value)}
          >
            <option value="">{isDe ? 'Abteilung auswählen' : 'Select department'}</option>
            {allDepartmentOptions.map((department) => (
              <option key={department.id} value={department.id}>
                {department.kuerzel ? `${department.kuerzel} — ${department.name}` : department.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onSendInvite}
          disabled={isSendingInvite}
          className={[
            'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm',
            isSendingInvite ? 'cursor-wait bg-slate-400' : 'bg-[#00559F] hover:brightness-110',
          ].join(' ')}
        >
          <Send className="h-4 w-4" />
          {isSendingInvite
            ? isDe
              ? 'Einladung wird gesendet ...'
              : 'Sending invitation ...'
            : isDe
              ? 'Einladung senden'
              : 'Send invitation'}
        </button>

        <p className="text-xs leading-relaxed text-slate-500">
          {isDe
            ? 'Die Einladung erzeugt einen Aktivierungslink zum Passwortsetzen.'
            : 'The invitation creates an activation link for setting a password.'}
        </p>
      </div>
    </section>
  );

  const renderPendingInvites = () => (
    <section className={`${panelCls} overflow-hidden`}>
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {isDe ? 'Einladungsverlauf' : 'Invitation history'}
          </h3>

          <Clock3 className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">E-Mail</th>
              <th className="px-4 py-3">{isDe ? 'Rolle' : 'Role'}</th>
              <th className="px-4 py-3">{isDe ? 'Abteilung' : 'Department'}</th>
              <th className="px-4 py-3">{isDe ? 'Gesendet' : 'Sent'}</th>
              <th className="px-4 py-3">{isDe ? 'Status' : 'Status'}</th>
              <th className="px-4 py-3 text-right">{isDe ? 'Aktion' : 'Action'}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {invitationRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                  {isDe ? 'Keine Einladungen vorhanden.' : 'No invitations available.'}
                </td>
              </tr>
            )}

            {invitationRows.map((invite) => (
              <tr key={invite.id} className="bg-white hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{invite.email}</td>
                <td className="px-4 py-3 text-slate-700">
                  {normalizeRoleLabel(invite.roleId, isDe)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {departmentDisplayName(invite.departmentId)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatRelativeDate(invite.createdAt, isDe)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      'inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1',
                      inviteStatusPillCls(invite.status),
                    ].join(' ')}
                  >
                    {inviteStatusLabel(invite.status, isDe)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    {invite.isLocal && invite.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => onResendInvite(invite.id)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {isDe ? 'Erneut senden' : 'Resend'}
                      </button>
                    )}

                    {invite.isLocal ? (
                      <button
                        type="button"
                        onClick={() => onDeleteInvite(invite.id)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                      >
                        {isDe ? 'Löschen' : 'Delete'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderRolesPanel = () => (
    <section className={`${panelCls} overflow-hidden`}>
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-slate-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isDe ? 'Rollen & Rechte' : 'Roles & permissions'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {isDe
                ? 'Vorbereitete Rollenprofile für den späteren Berechtigungsaufbau.'
                : 'Prepared role profiles for the later permission model.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
        {ROLE_OPTIONS.map((role) => (
          <div key={role.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-900">
                  {isDe ? role.labelDe : role.labelEn}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {isDe ? role.descriptionDe : role.descriptionEn}
                </p>
              </div>

              <ShieldCheck className="h-5 w-5 shrink-0 text-slate-400" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderContextPanel = () => {
    const locationName = selectedLocation
      ? selectedLocation.name
      : isDe
        ? 'Kein Standort ausgewählt'
        : 'No location selected';

    const departmentName = selectedDepartment
      ? selectedDepartment.name
      : isDe
        ? 'Keine Abteilung ausgewählt'
        : 'No department selected';

    const contextPath = selectedDepartment
      ? `${locationName} → ${departmentName}`
      : locationName;

    const contextByTab: Record<
      AdminTab,
      { titleDe: string; titleEn: string; descriptionDe: string; descriptionEn: string; metricDe: string; metricEn: string }
    > = {
      organization: {
        titleDe: 'Organisationskontext',
        titleEn: 'Organisation context',
        descriptionDe: 'Der ausgewählte Standort steuert, welche Abteilungen und Benutzer angezeigt werden.',
        descriptionEn: 'The selected location controls which departments and users are shown.',
        metricDe: `${selectedLocationDepartmentCount} Abteilungen`,
        metricEn: `${selectedLocationDepartmentCount} departments`,
      },
      users: {
        titleDe: 'Benutzerkontext',
        titleEn: 'User context',
        descriptionDe: 'Die Benutzerliste wird anhand des ausgewählten Standorts und der ausgewählten Abteilung gefiltert.',
        descriptionEn: 'The user list is filtered by the selected location and department.',
        metricDe: `${filteredPeople.length} Benutzer im Filter`,
        metricEn: `${filteredPeople.length} users in filter`,
      },
      invites: {
        titleDe: 'Einladungskontext',
        titleEn: 'Invitation context',
        descriptionDe: 'Einladungen erhalten Rolle und Abteilung aus dem Formular; der Kontext dient als Orientierung.',
        descriptionEn: 'Invitations receive role and department from the form; the context is used for orientation.',
        metricDe: `${openInviteCount} offene Einladungen`,
        metricEn: `${openInviteCount} open invitations`,
      },
      roles: {
        titleDe: 'Rollen- und Rechtekontext',
        titleEn: 'Roles and permissions context',
        descriptionDe: 'Rollenprofile sind systemweit vorbereitet und werden später mit konkreten Berechtigungen verknüpft.',
        descriptionEn: 'Role profiles are prepared system-wide and will later be linked to concrete permissions.',
        metricDe: `${ROLE_OPTIONS.length} Rollenprofile`,
        metricEn: `${ROLE_OPTIONS.length} role profiles`,
      },
    };

    const context = contextByTab[activeTab];

    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold">
              {isDe ? context.titleDe : context.titleEn}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{contextPath}</span>
              <span className="mx-2 text-slate-300">·</span>
              <span>{isDe ? context.descriptionDe : context.descriptionEn}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
              {isDe ? context.metricDe : context.metricEn}
            </span>
            <span>
              {isDe ? 'Inaktive Nutzer:' : 'Inactive users:'} {inactivePeopleCount}
            </span>
          </div>
        </div>

        {activeTab === 'users' && renderUserFilterControls()}
      </div>
    );
  };

const renderEditUserModal = () => {
  if (!editingUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isDe ? 'Benutzer bearbeiten' : 'Edit user'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {editingUser.email}
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="space-y-1">
            <div className={labelCls}>{isDe ? 'Rolle' : 'Role'}</div>
            <select
              className={inputCls}
              value={editRoleCode}
              onChange={(event) => setEditRoleCode(event.target.value)}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.id} value={mapInviteRoleToRoleCode(role.id)}>
                  {isDe ? role.labelDe : role.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
  <div className={labelCls}>{isDe ? 'Standort' : 'Location'}</div>
  <select
    className={inputCls}
    value={effectiveEditLocationId}
    onChange={(event) => {
      const nextLocationId = event.target.value;
      setEditLocationId(nextLocationId);
      setEditDepartmentId('');
    }}
  >
    <option value="">
      {isDe ? 'Kein Standort / alle Standorte' : 'No location / all locations'}
    </option>

    {locationOptions.map((location) => (
      <option key={location.id} value={location.id}>
        {location.kuerzel ? `${location.kuerzel} — ${location.name}` : location.name}
      </option>
    ))}
  </select>
</div>

<div className="space-y-1">
  <div className={labelCls}>{isDe ? 'Abteilung' : 'Department'}</div>
  <select
    className={inputCls}
    value={editDepartmentId}
    onChange={(event) => setEditDepartmentId(event.target.value)}
  >
    <option value="">
  {editLocationId
    ? isDe
      ? 'Abteilung auswählen'
      : 'Select department'
    : isDe
      ? 'Keine Abteilung'
      : 'No department'}
</option>

    {editDepartmentOptions.map((department) => (
      <option key={department.id} value={department.id}>
        {department.kuerzel
          ? `${department.kuerzel} — ${department.name}`
          : department.name}
      </option>
    ))}
  </select>
</div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={() => setEditingUser(null)}
            disabled={isSavingUser}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDe ? 'Abbrechen' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={saveUserAssignment}
            disabled={isSavingUser || Boolean(editLocationId && !editDepartmentId)}
            className={[
              'rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm',
              isSavingUser ? 'cursor-wait bg-slate-400' : 'bg-[#00559F] hover:brightness-110',
            ].join(' ')}
          >
            {isSavingUser
              ? isDe
                ? 'Speichern ...'
                : 'Saving ...'
              : isDe
                ? 'Speichern'
                : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

  const renderMainContent = () => {
    if (activeTab === 'roles') {
      return <div className="grid grid-cols-1 gap-5">{renderRolesPanel()}</div>;
    }

    if (activeTab === 'invites') {
      return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          {renderInviteForm()}
          {renderPendingInvites()}
        </div>
      );
    }

    if (activeTab === 'users') {
      return (
        <div className="space-y-5">
          {renderKpis()}
          {renderUsersTable()}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        {renderOrganisationPanel()}

        <div className="space-y-5">
          {renderKpis()}
          {renderUsersTable()}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-none space-y-5">
      <header className="space-y-4">
        <div className="rounded-xl bg-[#041225] px-4 py-3 text-white shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">
            {isDe ? 'Benutzer & Rollen' : 'Users & roles'}
          </h2>

          <p className="mt-1 text-xs text-white/80">
            {isDe
              ? 'Verwalte Organisationsstruktur, Benutzerzugänge und Rollenprofile.'
              : 'Manage organisation structure, user access and role profiles.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'rounded-xl border bg-white px-4 py-4 text-left shadow-sm transition',
                  isActive
                    ? 'border-[#00559F] ring-2 ring-[#00559F]/15'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      'mt-0.5 rounded-lg p-2',
                      isActive ? 'bg-[#00559F] text-white' : 'bg-slate-100 text-slate-600',
                    ].join(' ')}
                  >
                    {tab.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {isDe ? tab.labelDe : tab.labelEn}
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {isDe ? tab.descriptionDe : tab.descriptionEn}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {(uiError || uiMessage) && (
        <div
          className={[
            'rounded-xl border px-4 py-3 text-sm',
            uiError
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800',
          ].join(' ')}
        >
          {uiError || uiMessage}
        </div>
      )}

      {renderContextPanel()}
      {renderMainContent()}
      {renderEditUserModal()}
    </div>
  );
}
