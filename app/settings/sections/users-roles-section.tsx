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

type OrgFunction = 'MEMBER' | 'LEAD' | 'DEPUTY';

type AdminTab = 'organization' | 'users' | 'invites' | 'roles';

type StructureCreateMode = 'location' | 'department' | 'team' | 'user' | null;

type OrganisationViewMode = 'structure' | 'chart';

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
    team: {
      id: string;
      name: string;
      kuerzel: string | null;
      departmentId: string;
    } | null;
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
  orgFunction?: OrgFunction | null;
  firstName: string;
  lastName: string | null;
  email: string;
  status: string;
  departmentId: string | null;
  teamId: string | null;
  roleId: string | null;
};

type LeadPerson = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
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
    visibleTeams,
    visiblePeople,
    selectedLocationId: storeSelectedLocationId,
    selectedDepartmentId: storeSelectedDepartmentId,
    selectedTeamId: storeSelectedTeamId,
    addLocation,
    removeLocation,
    addDepartment,
    removeDepartment,
    addTeam,
    removeTeam,
    removePerson,
    locationById,
    departmentById,
    teamById,
    teamsByDepartmentId,
  } = useDirectoryStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('organization');
  const [organisationViewMode, setOrganisationViewMode] = useState<OrganisationViewMode>('structure');
  const [createMode, setCreateMode] = useState<StructureCreateMode>(null);
  const [departmentLeadById, setDepartmentLeadById] = useState<Record<string, LeadPerson | null>>({});
  const [isDepartmentLeadOpen, setIsDepartmentLeadOpen] = useState(false);
  const [departmentLeadPersonId, setDepartmentLeadPersonId] = useState('');
  const [isSavingDepartmentLead, setIsSavingDepartmentLead] = useState(false);
  const [isTeamLeadOpen, setIsTeamLeadOpen] = useState(false);
  const [teamLeadPersonId, setTeamLeadPersonId] = useState('');
  const [isSavingTeamLead, setIsSavingTeamLead] = useState(false);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    storeSelectedLocationId ?? null
  );

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(
    storeSelectedDepartmentId ?? null
  );

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    storeSelectedTeamId ?? null
  );

  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);

  const [locName, setLocName] = useState('');
  const [locKuerzel, setLocKuerzel] = useState('');
  const [depName, setDepName] = useState('');
  const [depKuerzel, setDepKuerzel] = useState('');
  const [depLocationId, setDepLocationId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamKuerzel, setTeamKuerzel] = useState('');
  const [teamDepartmentId, setTeamDepartmentId] = useState('');

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
  const [editTeamId, setEditTeamId] = useState('');
  const [editOrgFunction, setEditOrgFunction] = useState<OrgFunction>('MEMBER');
  const [editRoleCode, setEditRoleCode] = useState('VIEWER');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [editLocationId, setEditLocationId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [isAssigningUser, setIsAssigningUser] = useState(false);

  const [uiError, setUiError] = useState<string | null>(null);
  const [uiMessage, setUiMessage] = useState<string | null>(null);

  const selectedLocation = selectedLocationId
    ? locationById.get(selectedLocationId) ?? null
    : null;

  const selectedDepartment = selectedDepartmentId
    ? departmentById.get(selectedDepartmentId) ?? null
    : null;

  const selectedTeam = selectedTeamId
    ? teamById.get(selectedTeamId) ?? null
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

  const selectedDepartmentTeams = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return teamsByDepartmentId.get(selectedDepartmentId) ?? [];
  }, [selectedDepartmentId, teamsByDepartmentId]);

  const teamFilterOptions = useMemo(() => {
    let list = visibleTeams.slice();

    if (selectedDepartmentId) {
      list = list.filter((team) => team.departmentId === selectedDepartmentId);
    } else if (selectedLocationId) {
      list = list.filter((team) => {
        const department = departmentById.get(team.departmentId);
        return department?.locationId === selectedLocationId;
      });
    }

    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [visibleTeams, selectedDepartmentId, selectedLocationId, departmentById]);

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

const editTeamOptions = useMemo(() => {
  const list = editDepartmentId
    ? (teamsByDepartmentId.get(editDepartmentId) ?? []).slice()
    : [];

  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}, [editDepartmentId, teamsByDepartmentId]);

useEffect(() => {
  if (!editTeamId) return;

  const team = teamById.get(editTeamId);

  if (!team || team.departmentId !== editDepartmentId) {
    setEditTeamId('');
  }
}, [editTeamId, editDepartmentId, teamById]);

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
        teamId: user.person?.team?.id ?? null,
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
      teamId: (person as { teamId?: string | null }).teamId ?? null,
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

    if (selectedTeamId) {
      people = people.filter((person) => person.teamId === selectedTeamId);
    }

    people.sort((a, b) => {
      const aName = [a.firstName, a.lastName, a.email].filter(Boolean).join(' ');
      const bName = [b.firstName, b.lastName, b.email].filter(Boolean).join(' ');
      return aName.localeCompare(bName);
    });

    return people;
  }, [userRowsForTable, selectedLocationId, selectedDepartmentId, selectedTeamId, departmentById]);

  const filteredPeople = useMemo<UserTableRow[]>(() => {
    return peopleInContext.filter((person) => {
      const status = String(person.status ?? '').toUpperCase();

      if (userStatusFilter === 'active') return status === 'ACTIVE';
      if (userStatusFilter === 'inactive') return status === 'INACTIVE';

      return true;
    });
  }, [peopleInContext, userStatusFilter]);

  const usersAssignedToSelectedDepartment = useMemo(() => {
  if (!selectedDepartmentId) return [];

  return adminUsers.filter(
    (user) => user.person?.department?.id === selectedDepartmentId
  );
}, [adminUsers, selectedDepartmentId]);

const usersAssignableToSelectedDepartment = useMemo(() => {
  if (!selectedDepartmentId) return [];

  return adminUsers.filter(
    (user) => user.person?.department?.id !== selectedDepartmentId
  );
}, [adminUsers, selectedDepartmentId]);

  const activePeopleCount = userRowsForTable.filter(
    (person) => String(person.status ?? '').toUpperCase() === 'ACTIVE'
  ).length;

  const inactivePeopleCount = userRowsForTable.filter(
    (person) => String(person.status ?? '').toUpperCase() === 'INACTIVE'
  ).length;

  const kpiDepartmentCount = selectedLocationId ? departmentOptions.length : visibleDepartments.length;
  const effectiveInviteDepartmentId = inviteDepartmentId || selectedDepartmentId || '';
  const effectiveDepartmentLocationId = depLocationId || selectedLocationId || '';
  const effectiveTeamDepartmentId = teamDepartmentId || selectedDepartmentId || '';

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
      labelDe: 'Organisationsstruktur',
      labelEn: 'Organisationsstruktur',
      descriptionDe: 'Standorte, Abteilungen und Teams verwalten.',
      descriptionEn: 'Manage locations, departments and teams.',
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
  setEditLocationId(adminUser.person?.department?.location?.id ?? selectedLocationId ?? '');
  setEditDepartmentId(adminUser.person?.team?.departmentId ?? adminUser.person?.department?.id ?? selectedDepartmentId ?? '');
  setEditTeamId(adminUser.person?.team?.id ?? selectedTeamId ?? '');
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
        teamId: editTeamId || null,
        orgFunction: editOrgFunction,
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
    setCreateMode(null);
    setUiMessage(isDe ? 'Standort wurde angelegt.' : 'Location has been created.');
  };

  const onAddDepartment = () => {
  setUiError(null);
  setUiMessage(null);

  if (!effectiveDepartmentLocationId) {
    setUiError(
      isDe
        ? 'Bitte einen Standort für die Abteilung auswählen.'
        : 'Please select a location for the department.'
    );
    return;
  }

  if (isBlank(depName)) {
    setUiError(
      isDe
        ? 'Bitte Abteilungsname ausfüllen.'
        : 'Please enter a department name.'
    );
    return;
  }

  addDepartment({
    name: depName.trim(),
    kuerzel: depKuerzel.trim() || undefined,
    locationId: effectiveDepartmentLocationId,
  });

  setSelectedLocationId(effectiveDepartmentLocationId);
  setSelectedDepartmentId(null);

  setDepName('');
  setDepKuerzel('');
  setDepLocationId('');
  setShowAddDepartment(false);
  setCreateMode(null);

  setUiMessage(
    isDe
      ? 'Abteilung wurde angelegt und dem Standort zugeordnet.'
      : 'Department has been created and assigned to the location.'
  );
};

  const onAddTeam = () => {
    setUiError(null);
    setUiMessage(null);

    if (!effectiveTeamDepartmentId) {
      setUiError(
        isDe
          ? 'Bitte zuerst eine Abteilung ausw\u00e4hlen.'
          : 'Please select a department first.'
      );
      return;
    }

    if (isBlank(teamName)) {
      setUiError(
        isDe
          ? 'Bitte Teamnamen ausf\u00fcllen.'
          : 'Please enter a team name.'
      );
      return;
    }

    addTeam({
      name: teamName.trim(),
      kuerzel: teamKuerzel.trim() || undefined,
      departmentId: effectiveTeamDepartmentId,
    });

    setSelectedDepartmentId(effectiveTeamDepartmentId);
    setSelectedTeamId(null);

    setTeamName('');
    setTeamKuerzel('');
    setTeamDepartmentId('');
    setShowAddTeam(false);
    setCreateMode(null);

    setUiMessage(
      isDe
        ? 'Team wurde angelegt und der Abteilung zugeordnet.'
        : 'Team has been created and assigned to the department.'
    );
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
      setSelectedTeamId(null);
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

  const orgLeadUserDisplayName = (user: any) => {
    if (!user) return isDe ? 'Noch nicht zugewiesen' : 'Not assigned yet';

    const person = user.person ?? {};

    const isEmailLike = (value: unknown) => {
      return String(value ?? '').includes('@');
    };

    const clean = (value: unknown) => {
      const textValue = String(value ?? '').trim();
      return textValue && !isEmailLike(textValue) ? textValue : '';
    };

    const personName = [person.firstName, person.lastName]
      .map(clean)
      .filter(Boolean)
      .join(' ');

    const userName = [user.firstName, user.lastName]
      .map(clean)
      .filter(Boolean)
      .join(' ');

    const displayName = clean(user.name);

    const email = String(person.email ?? user.email ?? '').trim();

    const nameFromEmail = email
      ? email
          .split('@')[0]
          .split(/[._-]+/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ')
      : '';

    return personName || userName || displayName || nameFromEmail || '?';
  };

  const findOrgLeadUser = (
    departmentId: string | null,
    teamId: string | null
  ) => {
    return adminUsers.find((user) => {
      const person = (user as any).person;
      if (!person) return false;
      if (person.orgFunction !== 'LEAD') return false;

      if (teamId) {
        return person.team?.id === teamId;
      }

      return person.department?.id === departmentId && !person.team?.id;
    });
  };

  const departmentDisplayName = (departmentId: string | null | undefined) => {
    if (!departmentId) return isDe ? 'Keine Abteilung' : 'No department';

    const department = departmentById.get(departmentId);
    if (!department) return isDe ? 'Unbekannte Abteilung' : 'Unknown department';

    return department.kuerzel ? `${department.kuerzel} — ${department.name}` : department.name;
  };

  const teamDisplayName = (teamId: string | null | undefined) => {
    if (!teamId) return isDe ? 'Kein Team' : 'No team';

    const team = teamById.get(teamId);
    if (!team) return isDe ? 'Unbekanntes Team' : 'Unknown team';

    return team.kuerzel
      ? team.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + team.name
      : team.name;
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
    <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="space-y-1">
        <div className={labelCls}>{isDe ? 'Standort' : 'Location'}</div>
        <select
          className={inputCls}
          value={selectedLocationId ?? ''}
          onChange={(event) => {
            const nextLocationId = event.target.value || null;
            setSelectedLocationId(nextLocationId);
            setSelectedDepartmentId(null);
            setSelectedTeamId(null);
            setInviteDepartmentId('');
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
            setSelectedTeamId(null);
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
        <div className={labelCls}>Team</div>
        <select
          className={inputCls}
          value={selectedTeamId ?? ''}
          onChange={(event) => {
            const nextTeamId = event.target.value || null;
            const team = nextTeamId ? teamById.get(nextTeamId) ?? null : null;

            setSelectedTeamId(nextTeamId);

            if (team) {
              const department = departmentById.get(team.departmentId);
              setSelectedDepartmentId(team.departmentId);

              if (department?.locationId) {
                setSelectedLocationId(department.locationId);
              }

              setInviteDepartmentId(team.departmentId);
            }
          }}
          disabled={teamFilterOptions.length === 0}
        >
          <option value="">{isDe ? 'Alle Teams' : 'All teams'}</option>
          {teamFilterOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.kuerzel
                ? team.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + team.name
                : team.name}
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

    const departmentEmployeeCount = (departmentId: string) => {
    return userRowsForTable.filter((person) => person.departmentId === departmentId).length;
  };

  const teamEmployeeCount = (teamId: string) => {
    return userRowsForTable.filter((person) => person.teamId === teamId).length;
  };

  const locationEmployeeCount = (locationId: string) => {
    return userRowsForTable.filter((person) => {
      if (!person.departmentId) return false;

      const department = departmentById.get(person.departmentId);
      return department?.locationId === locationId;
    }).length;
  };

const renderOrganisationPanel = () => {
    const structureIsEmpty = locationOptions.length === 0;

    return (
      <aside className={panelCls + ' overflow-hidden'}>
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-slate-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {isDe ? 'Strukturbaum' : 'Structure tree'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {isDe
                  ? 'Standort, Abteilung und Team nach gleicher Logik auswaehlen.'
                  : 'Select location, department and team with the same logic.'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              data-testid="add-location-tree"
              onClick={() => {
                setSelectedLocationId(null);
                setSelectedDepartmentId(null);
                setSelectedTeamId(null);
                setOrganisationViewMode('structure');
                setShowAddLocation(true);
                setShowAddDepartment(false);
                setShowAddTeam(false);
                setDepLocationId('');
                setTeamDepartmentId('');
                setInviteDepartmentId('');
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#009A93] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            >
              <span aria-hidden="true">+</span>
              <span>{isDe ? 'Standort hinzuf' + String.fromCharCode(0x00fc) + 'gen' : 'Add location'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          {structureIsEmpty ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              {isDe
                ? 'Noch keine Standorte angelegt. Lege rechts im Detailpanel den ersten Standort an.'
                : 'No locations created yet. Create the first location in the detail panel on the right.'}
            </div>
          ) : (
            locationOptions.map((location) => {
              const locationDepartments = Array.from(departmentById.values())
                .filter((department) => department.locationId === location.id)
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name));

              const isLocationActive = selectedLocationId === location.id;
              const isLocationOnlySelected =
                isLocationActive && !selectedDepartmentId && !selectedTeamId;

              const locationTeamCount = locationDepartments.reduce((sum, department) => {
                return sum + (teamsByDepartmentId.get(department.id)?.length ?? 0);
              }, 0);

              return (
                <div key={location.id} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocationId(location.id);
setDepLocationId(location.id);
                                            setSelectedDepartmentId(null);
                      setSelectedTeamId(null);
                      setDepLocationId(location.id);
                      setTeamDepartmentId('');
                      setShowAddLocation(false);
                      setShowAddDepartment(false);
                      setShowAddTeam(false);
                      setInviteDepartmentId('');
                    }}
                    className={[
                      'w-full rounded-xl border px-4 py-3 text-left transition',
                      isLocationOnlySelected
                        ? 'border-[#00559F] bg-[#00559F]/10 shadow-sm'
                        : isLocationActive
                          ? 'border-[#00559F]/50 bg-white'
                          : 'border-slate-200 bg-white hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {isDe ? 'Standort' : 'Location'}
                        </div>

                        <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                          {location.kuerzel
                            ? location.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + location.name
                            : location.name}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {locationDepartments.length} {isDe ? 'Abt.' : 'depts'}
                        </span>
                        <span>
                          {locationTeamCount} {isDe ? 'Teams' : 'teams'}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isLocationActive && (
                    <div className="ml-3 space-y-3 border-l border-slate-200 pl-3">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <span>{isDe ? 'Abteilungen' : 'Departments'}</span>
                        <span>{locationDepartments.length}</span>
                      </div>

                      {locationDepartments.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                          {isDe
                            ? 'Fuer diesen Standort sind noch keine Abteilungen angelegt.'
                            : 'No departments have been created for this location yet.'}
                        </div>
                      ) : (
                        locationDepartments.map((department) => {
                          const departmentTeams = teamsByDepartmentId.get(department.id) ?? [];
                          const isDepartmentActive = selectedDepartmentId === department.id;
                          const isDepartmentOnlySelected = isDepartmentActive && !selectedTeamId;

                          return (
                            <div key={department.id} className="space-y-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLocationId(location.id);
setDepLocationId(location.id);
                                                                    setSelectedDepartmentId(department.id);
setTeamDepartmentId(department.id);
setInviteDepartmentId(department.id);
                                  setSelectedTeamId(null);
                                  setDepLocationId(location.id);
                                  setTeamDepartmentId(department.id);
                                  setShowAddLocation(false);
                                  setShowAddDepartment(false);
                                  setShowAddTeam(false);
                                  setInviteDepartmentId(department.id);
                                }}
                                className={[
                                  'w-full rounded-xl border px-3 py-3 text-left transition',
                                  isDepartmentOnlySelected
                                    ? 'border-[#009A93] bg-[#009A93]/10 shadow-sm'
                                    : isDepartmentActive
                                      ? 'border-[#009A93]/50 bg-white'
                                      : 'border-slate-200 bg-slate-50 hover:bg-white',
                                ].join(' ')}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                      {isDe ? 'Abteilung' : 'Department'}
                                    </div>

                                    <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                                      {department.kuerzel
                                        ? department.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + department.name
                                        : department.name}
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 flex-col items-end gap-1">
                                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                      {departmentTeams.length} {isDe ? 'Teams' : 'teams'}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                      {departmentEmployeeCount(department.id)} {isDe ? 'MA' : 'users'}
                                    </span>
                                  </div>
                                </div>
                              </button>

                              {isDepartmentActive && (
                                <div className="ml-3 space-y-2 border-l border-slate-200 pl-3">
                                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    <span>{isDe ? 'Teams' : 'Teams'}</span>
                                    <span>{departmentTeams.length}</span>
                                  </div>

                                  {departmentTeams.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-xs text-slate-500">
                                      {isDe
                                        ? 'Noch keine Teams angelegt. Nutze rechts die Aktion Team hinzufuegen.'
                                        : 'No teams created yet. Use the action Add team on the right.'}
                                    </div>
                                  ) : (
                                    departmentTeams.map((team) => {
                                      const isTeamActive = selectedTeamId === team.id;

                                      return (
                                        <button
                                          key={team.id}
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setSelectedLocationId(location.id);
setDepLocationId(location.id);
                                            setSelectedDepartmentId(department.id);
setTeamDepartmentId(department.id);
setInviteDepartmentId(department.id);
                                            setSelectedTeamId(team.id);
                                            setTeamDepartmentId(department.id);
                                            setShowAddLocation(false);
                                            setShowAddDepartment(false);
                                            setShowAddTeam(false);
                                            setInviteDepartmentId(department.id);
                                          }}
                                          className={[
                                            'flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition',
                                            isTeamActive
                                              ? 'border-[#00559F] bg-[#00559F]/10 shadow-sm'
                                              : 'border-slate-200 bg-white hover:bg-slate-50',
                                          ].join(' ')}
                                        >
                                          <span className="flex min-w-0 items-center gap-3">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                              <Users className="h-3.5 w-3.5" />
                                            </span>

                                            <span className="min-w-0">
                                              <span className="block truncate text-sm font-semibold text-slate-900">
                                                {team.kuerzel
                                                  ? team.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + team.name
                                                  : team.name}
                                              </span>

                                              <span className="mt-0.5 block text-xs text-slate-500">
                                                {teamEmployeeCount(team.id)} {isDe ? 'MA' : 'users'}{' '}
                                                {String.fromCharCode(0x00b7)}{' '}
                                                {isDe ? 'Operatives Team' : 'Operational team'}
                                              </span>
                                            </span>
                                          </span>

                                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                            {isDe ? 'Team' : 'Team'}
                                          </span>
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    );
  };

const renderTeamsPanel = () => {
  const teamDepartment = selectedTeam ? departmentById.get(selectedTeam.departmentId) ?? null : null;
  const teamLocation = teamDepartment?.locationId
    ? locationById.get(teamDepartment.locationId) ?? null
    : null;

  const activeDepartment = selectedTeam ? teamDepartment : selectedDepartment;

  const activeLocation = selectedTeam
    ? teamLocation
    : activeDepartment?.locationId
      ? locationById.get(activeDepartment.locationId) ?? null
      : selectedLocation;

  const activeDepartmentTeams = activeDepartment
    ? teamsByDepartmentId.get(activeDepartment.id) ?? []
    : [];

  const activeLocationDepartments = activeLocation
    ? visibleDepartments.filter((department) => department.locationId === activeLocation.id)
    : [];

  const activeLocationTeamCount = activeLocationDepartments.reduce((sum, department) => {
    return sum + (teamsByDepartmentId.get(department.id)?.length ?? 0);
  }, 0);

  const selectedTeamDescription =
    selectedTeam && 'description' in selectedTeam
      ? String((selectedTeam as { description?: string | null }).description ?? '').trim()
      : '';

  const currentOrgLeadUser = findOrgLeadUser(
    activeDepartment?.id ?? null,
    selectedTeam?.id ?? null
  );

  const activeDepartmentUserCount = activeDepartment
    ? userRowsForTable.filter((person) => person.departmentId === activeDepartment.id).length
    : 0;

  const activeLocationUserCount = activeLocation
    ? userRowsForTable.filter((person) => {
        if (!person.departmentId) return false;

        const department = departmentById.get(person.departmentId);
        return department?.locationId === activeLocation.id;
      }).length
    : 0;

  const responsibleLabel = selectedTeam
    ? isDe
      ? 'Team Lead'
      : 'Team lead'
    : activeDepartment
      ? isDe
        ? 'Abteilungslead'
        : 'Department lead'
      : activeLocation
        ? isDe
          ? 'Standort Lead'
          : 'Location lead'
        : isDe
          ? 'Verantwortliche Person'
          : 'Responsible person';

  const responsibleActionLabel = selectedTeam
    ? isDe
      ? 'Team Lead festlegen'
      : 'Set team lead'
    : activeDepartment
      ? isDe
        ? 'Abteilungslead festlegen'
        : 'Set department lead'
      : activeLocation
        ? isDe
          ? 'Standort Lead festlegen'
          : 'Set location lead'
        : isDe
          ? 'Lead festlegen'
          : 'Set lead';

  const userCountLabel = selectedTeam
    ? isDe
      ? 'Benutzer im Team'
      : 'Users in team'
    : activeDepartment
      ? isDe
        ? 'Benutzer in Abteilung'
        : 'Users in department'
      : activeLocation
        ? isDe
          ? 'Benutzer am Standort'
          : 'Users at location'
        : isDe
          ? 'Benutzer'
          : 'Users';

  const userCountValue = selectedTeam
    ? teamEmployeeCount(selectedTeam.id)
    : activeDepartment
      ? departmentEmployeeCount(activeDepartment.id)
      : activeLocation
        ? locationEmployeeCount(activeLocation.id)
        : 0;

  const userCountHint = selectedTeam
    ? isDe
      ? 'Benutzer, die diesem Team direkt zugeordnet sind.'
      : 'Users directly assigned to this team.'
    : activeDepartment
      ? isDe
        ? 'Grundlage fuer den spaeteren Abteilungslead.'
        : 'Basis for the later department lead.'
      : activeLocation
        ? isDe
          ? 'Grundlage fuer den spaeteren Standort Lead.'
          : 'Basis for the later location lead.'
        : '';

  const openDepartmentLeadDialog = (departmentId: string) => {
    const currentLead = departmentLeadById[departmentId] ?? null;

    setDepartmentLeadPersonId(currentLead?.id ?? '');
    setIsDepartmentLeadOpen(true);
    setUiError(null);
    setUiMessage(null);
  };

  const openTeamLeadDialog = () => {
    if (!selectedTeam) {
      setUiError(isDe ? 'Bitte zuerst ein Team ausw?hlen.' : 'Please select a team first.');
      return;
    }

    const currentLeadUser = adminUsers.find((user) => {
      const person = (user as any).person;
      return person?.team?.id === selectedTeam.id && person?.orgFunction === 'LEAD';
    });

    setTeamLeadPersonId(String((currentLeadUser as any)?.person?.id ?? ''));
    setIsTeamLeadOpen(true);
    setUiError(null);
    setUiMessage(null);
  };

  const saveTeamLead = async () => {
    if (!selectedTeam) {
      setUiError(isDe ? 'Bitte zuerst ein Team ausw?hlen.' : 'Please select a team first.');
      return;
    }

    setUiError(null);
    setUiMessage(null);
    setIsSavingTeamLead(true);

    try {
      const response = await fetch('/api/directory/teams/' + selectedTeam.id + '/lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: teamLeadPersonId || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message ?? 'Team Lead konnte nicht gespeichert werden.');
      }

      setIsTeamLeadOpen(false);
      setTeamLeadPersonId('');

      await loadAdminUsers();

      setUiMessage(
        data?.message ??
          (isDe ? 'Team Lead wurde gespeichert.' : 'Team lead has been saved.')
      );
    } catch (error) {
      setUiError(
        error instanceof Error
          ? error.message
          : isDe
            ? 'Team Lead konnte nicht gespeichert werden.'
            : 'Team lead could not be saved.'
      );
    } finally {
      setIsSavingTeamLead(false);
    }
  };

  const openLeadAssignmentHint = () => {
    if (selectedTeam) {
      openTeamLeadDialog();
      return;
    }

    if (activeDepartment && !selectedTeam) {
      openDepartmentLeadDialog(activeDepartment.id);
      return;
    }

    setUiError(null);
    setUiMessage(
      activeLocation
        ? isDe
          ? 'Standort Lead-Zuordnung wird umgesetzt, sobald Benutzer dem Standortkontext zugeordnet sind.'
          : 'Location lead assignment will be implemented once users are assigned to the location context.'
        : isDe
          ? 'Bitte zuerst einen Strukturknoten ausw?hlen.'
          : 'Please select a structure node first.'
    );
  };

  const formatLocation = (location: typeof selectedLocation) => {
    if (!location) return isDe ? 'Kein Standort ausgewaehlt' : 'No location selected';
    return location.kuerzel ? location.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + location.name : location.name;
  };

  const formatDepartment = (department: typeof selectedDepartment) => {
    if (!department) return isDe ? 'Keine Abteilung ausgewaehlt' : 'No department selected';
    return department.kuerzel ? department.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + department.name : department.name;
  };

  const formatTeam = (team: typeof selectedTeam) => {
    if (!team) return isDe ? 'Kein Team ausgewaehlt' : 'No team selected';
    return team.kuerzel ? team.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + team.name : team.name;
  };

  const detailTitle = selectedTeam
    ? formatTeam(selectedTeam)
    : activeDepartment
      ? formatDepartment(activeDepartment)
      : activeLocation
        ? formatLocation(activeLocation)
        : isDe
          ? 'Keine Struktur ausgewaehlt'
          : 'No structure selected';

  const detailType = selectedTeam
    ? 'Team'
    : activeDepartment
      ? isDe
        ? 'Abteilung'
        : 'Department'
      : activeLocation
        ? isDe
          ? 'Standort'
          : 'Location'
        : isDe
          ? 'Struktur'
          : 'Structure';

  const pathParts = [
    activeLocation ? formatLocation(activeLocation) : null,
    activeDepartment ? formatDepartment(activeDepartment) : null,
    selectedTeam ? formatTeam(selectedTeam) : null,
  ].filter(Boolean) as string[];

  const pathText =
    pathParts.length > 0
      ? pathParts.join(' ' + String.fromCharCode(0x2192) + ' ')
      : isDe
        ? 'Noch kein Strukturknoten ausgewaehlt.'
        : 'No structure node selected yet.';

  const openCreateLocation = () => {
    setCreateMode('location');
    setShowAddLocation(false);
    setShowAddDepartment(false);
    setShowAddTeam(false);
  };

  const openCreateDepartment = () => {
    setDepLocationId(activeLocation?.id ?? selectedLocationId ?? '');
    setCreateMode('department');
    setShowAddLocation(false);
    setShowAddDepartment(false);
    setShowAddTeam(false);
  };

  const openCreateTeam = () => {
    setTeamDepartmentId(activeDepartment?.id ?? selectedDepartmentId ?? '');
    setCreateMode('team');
    setShowAddLocation(false);
    setShowAddDepartment(false);
    setShowAddTeam(false);
  };

  const openCreateUser = () => {
    setAssignUserId('');
    setCreateMode('user');
    setShowAddLocation(false);
    setShowAddDepartment(false);
    setShowAddTeam(false);
  };

  const primaryCreateLabel = selectedTeam
    ? isDe
      ? 'Benutzer hinzufuegen'
      : 'Add user'
    : activeDepartment
      ? isDe
        ? 'Team hinzufuegen'
        : 'Add team'
      : activeLocation
        ? isDe
          ? 'Abteilung hinzufuegen'
          : 'Add department'
        : isDe
          ? 'Standort hinzufuegen'
          : 'Add location';

  const openPrimaryCreateAction = () => {
    if (selectedTeam) {
      openCreateUser();
      return;
    }

    if (activeDepartment) {
      openCreateTeam();
      return;
    }

    if (activeLocation) {
      openCreateDepartment();
      return;
    }

    openCreateLocation();
  };

  const deleteActiveDepartment = () => {
    if (!activeDepartment) return;

    if (confirm(isDe ? 'Abteilung wirklich loeschen?' : 'Delete department?')) {
      removeDepartment(activeDepartment.id);
      setSelectedDepartmentId(null);
      setSelectedTeamId(null);
      setTeamDepartmentId('');
      setInviteDepartmentId('');
    }
  };

  const deleteActiveTeam = () => {
    if (!selectedTeam) return;

    if (confirm(isDe ? 'Team wirklich loeschen?' : 'Delete team?')) {
      removeTeam(selectedTeam.id);
      setSelectedTeamId(null);
    }
  };

  return (
    <section className={panelCls + ' overflow-hidden'}>
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isDe ? 'Stammdaten' : 'Master data'}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {isDe
                ? 'Ausgewaehlten Strukturknoten pruefen, Stammdaten pflegen und die naechste Ebene hinzufuegen.'
                : 'Review the selected structure node, maintain master data and add the next level.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {detailType}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {detailType}
          </div>

          <div className="mt-1 text-xl font-semibold text-slate-900">
            {detailTitle}
          </div>

          <div className="mt-2 text-sm text-slate-600">
            {activeLocation
              ? isDe
                ? 'Grunddaten und Verantwortlichkeiten des ausgewaehlten Strukturknotens.'
                : 'Master data and responsibilities of the selected structure node.'
              : isDe
                ? 'Keinen Strukturknoten ausgewaehlt. Bitte links einen Standort, eine Abteilung oder ein Team auswaehlen.'
                : 'No structure node selected. Please select a location, department or team on the left.'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {isDe ? 'Standort' : 'Location'}
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-900">
              {activeLocation ? formatLocation(activeLocation) : '?'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {isDe ? 'Abteilung' : 'Department'}
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-900">
              {activeDepartment ? formatDepartment(activeDepartment) : '?'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {isDe ? 'Teams' : 'Teams'}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {selectedTeam ? 1 : activeDepartment ? activeDepartmentTeams.length : activeLocationTeamCount}
            </div>
          </div>
        </div>

        {activeLocation && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {responsibleLabel}
                  </div>

                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {currentOrgLeadUser
                      ? orgLeadUserDisplayName(currentOrgLeadUser)
                      : selectedTeam
                        ? isDe
                          ? 'Noch nicht zugewiesen'
                          : 'Not assigned yet'
                        : activeDepartment
                          ? isDe
                            ? 'Noch nicht zugewiesen'
                            : 'Not assigned yet'
                          : isDe
                            ? 'Noch nicht zugewiesen'
                            : 'Not assigned yet'}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {isDe
                      ? ''
                      : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openLeadAssignmentHint}
                  className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {currentOrgLeadUser ? (isDe ? 'Lead ändern' : 'Change lead') : responsibleActionLabel}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {userCountLabel}
              </div>

              <div className="mt-1 text-sm font-semibold text-slate-900">
                {userCountValue}
              </div>

              {userCountHint && (
                <div className="mt-1 text-xs text-slate-500">
                  {userCountHint}
                </div>
              )}
            </div>

            {selectedTeam && (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 md:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {isDe ? 'Beschreibung' : 'Description'}
                </div>

                <div className="mt-1 text-sm text-slate-700">
                  {selectedTeamDescription ||
                    (isDe ? 'Keine Beschreibung hinterlegt.' : 'No description available.')}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                {isDe ? 'Aktionen' : 'Actions'}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                {isDe
                  ? 'Aktionen zur Pflege der Organisationsstruktur und der naechsten Ebene.'
                  : 'Actions for maintaining the organisation structure and the next level.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!activeLocation && (
                <button
                  type="button"
                  onClick={openCreateLocation}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#009A93] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                  {isDe ? 'Standort hinzufuegen' : 'Add location'}
                </button>
              )}

              {activeLocation && !activeDepartment && (
                <>
                  <button
                    type="button"
                    onClick={openCreateDepartment}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#009A93] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                  >
                    <Plus className="h-4 w-4" />
                    {isDe ? 'Abteilung hinzufuegen' : 'Add department'}
                  </button>

                  <button
                    type="button"
                    onClick={onDeleteSelectedLocation}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDe ? 'Standort loeschen' : 'Delete location'}
                  </button>
                </>
              )}

              {activeDepartment && !selectedTeam && (
                <>
                  <button
                    type="button"
                    onClick={openCreateTeam}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#009A93] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                  >
                    <Plus className="h-4 w-4" />
                    {isDe ? 'Team hinzufuegen' : 'Add team'}
                  </button>

                  <button
                    type="button"
                    onClick={deleteActiveDepartment}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDe ? 'Abteilung loeschen' : 'Delete department'}
                  </button>
                </>
              )}

              {selectedTeam && (
                <>
                  <button
                    type="button"
                    onClick={openCreateUser}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#009A93] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                  >
                    <Plus className="h-4 w-4" />
                    {isDe ? 'Benutzer hinzuf' + String.fromCharCode(0x00fc) + 'gen' : 'Add user'}
                  </button>

                  <button
                    type="button"
                    onClick={deleteActiveTeam}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDe ? 'Team loeschen' : 'Delete team'}
                  </button>
                </>
              )}
            </div>
          </div>

          {showAddLocation && !activeLocation && (
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[minmax(0,1fr)_160px_auto]">
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
                <div className={labelCls}>{isDe ? 'Kuerzel' : 'Code'}</div>
                <input
                  className={inputCls}
                  value={locKuerzel}
                  onChange={(event) => setLocKuerzel(event.target.value)}
                  placeholder="FRA"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={onAddLocation}
                  className="w-full rounded-lg bg-[#009A93] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                >
                  {isDe ? 'Anlegen' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {showAddDepartment && activeLocation && !activeDepartment && (
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[minmax(0,1fr)_160px_auto]">
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
                <div className={labelCls}>{isDe ? 'Kuerzel' : 'Code'}</div>
                <input
                  className={inputCls}
                  value={depKuerzel}
                  onChange={(event) => setDepKuerzel(event.target.value)}
                  placeholder="ITSEC"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={onAddDepartment}
                  className="w-full rounded-lg bg-[#009A93] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                >
                  {isDe ? 'Anlegen' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {showAddTeam && activeDepartment && !selectedTeam && (
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[minmax(0,1fr)_160px_auto]">
              <div className="space-y-1">
                <div className={labelCls}>{isDe ? 'Teamname' : 'Team name'}</div>
                <input
                  className={inputCls}
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder={isDe ? 'z. B. Security Operations' : 'e.g. Security Operations'}
                />
              </div>

              <div className="space-y-1">
                <div className={labelCls}>{isDe ? 'Kuerzel' : 'Code'}</div>
                <input
                  className={inputCls}
                  value={teamKuerzel}
                  onChange={(event) => setTeamKuerzel(event.target.value)}
                  placeholder="SECOPS"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={onAddTeam}
                  className="w-full rounded-lg bg-[#009A93] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                >
                  {isDe ? 'Anlegen' : 'Create'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const renderDepartmentAssignmentPanel = () => {
  if (!selectedDepartment) return null;

  const handleAssignUserToSelectedDepartment = async () => {
    if (!selectedDepartmentId) {
      setUiError(
        isDe
          ? 'Bitte zuerst eine Abteilung auswaehlen.'
          : 'Please select a department first.'
      );
      return;
    }

    if (!assignUserId) {
      setUiError(
        isDe
          ? 'Bitte einen Benutzer auswaehlen.'
          : 'Please select a user.'
      );
      return;
    }

    const user = adminUsers.find((item) => item.id === assignUserId);

    if (!user) {
      setUiError(
        isDe
          ? 'Benutzer wurde nicht gefunden.'
          : 'User was not found.'
      );
      return;
    }

    setUiError(null);
    setUiMessage(null);
    setIsAssigningUser(true);

    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          roleCode: user.role?.code ?? 'VIEWER',
          departmentId: selectedDepartmentId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ??
            (isDe
              ? 'Benutzer konnte der Abteilung nicht zugeordnet werden.'
              : 'User could not be assigned to the department.')
        );
      }

      setAssignUserId('');

      setUiMessage(
        isDe
          ? 'Benutzer wurde der Abteilung zugeordnet.'
          : 'User has been assigned to the department.'
      );

      await loadAdminUsers();
    } catch (error) {
      setUiError(
        error instanceof Error
          ? error.message
          : isDe
            ? 'Benutzer konnte der Abteilung nicht zugeordnet werden.'
            : 'User could not be assigned to the department.'
      );
    } finally {
      setIsAssigningUser(false);
    }
  };

  return (
    <section className={`${panelCls} overflow-hidden`}>
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {isDe ? 'Benutzer zuordnen' : 'Assign users'}
          </h3>

          <p className="text-xs text-slate-500">
            {isDe
              ? `Ordne bestehende Benutzer der Abteilung ${selectedDepartment.name} zu.`
              : `Assign existing users to the department ${selectedDepartment.name}.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-1">
          <div className={labelCls}>{isDe ? 'Benutzer' : 'User'}</div>

          <select
            className={inputCls}
            value={assignUserId}
            onChange={(event) => setAssignUserId(event.target.value)}
          >
            <option value="">
              {isDe ? 'Benutzer auswählen' : 'Select user'}
            </option>

            {usersAssignableToSelectedDepartment.map((user) => {
              const currentDepartment = user.person?.department;
              const currentLabel = currentDepartment
                ? currentDepartment.kuerzel
                  ? `${currentDepartment.kuerzel} — ${currentDepartment.name}`
                  : currentDepartment.name
                : isDe
                  ? 'Keine Abteilung'
                  : 'No department';

              return (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} · {user.email} · {currentLabel}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAssignUserToSelectedDepartment}
            disabled={isAssigningUser || !assignUserId}
            className={[
              'inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm lg:w-auto',
              isAssigningUser || !assignUserId
                ? 'cursor-not-allowed bg-slate-400'
                : 'bg-[#00559F] hover:brightness-110',
            ].join(' ')}
          >
            {isAssigningUser
              ? isDe
                ? 'Zuordnung läuft ...'
                : 'Assigning ...'
              : isDe
                ? 'Der Abteilung zuordnen'
                : 'Assign to department'}
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <div className="mb-3 text-sm font-semibold text-slate-900">
          {isDe ? 'Bereits zugeordnet' : 'Already assigned'}
        </div>

        {usersAssignedToSelectedDepartment.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            {isDe
              ? 'Dieser Abteilung sind noch keine Benutzer zugeordnet.'
              : 'No users are assigned to this department yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {usersAssignedToSelectedDepartment.map((user) => (
              <div
                key={user.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <div className="font-semibold text-slate-900">
                  {user.name || user.email}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {user.email}
                </div>
                <div className="mt-2 text-xs font-medium text-slate-700">
                  {normalizeRoleLabel(user.role?.code, isDe)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

  const renderUsersTable = () => (
    <section className={`${panelCls} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {isDe ? 'Benutzer' : 'Users'}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {selectedTeam
              ? isDe
                ? `Gefiltert nach Team: ${selectedTeam.name}`
                : `Filtered by team: ${selectedTeam.name}`
              : selectedDepartment
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
              <th className="px-5 py-3">Team</th>
              <th className="px-5 py-3">{isDe ? 'Status' : 'Status'}</th>
              <th className="px-5 py-3 text-right">{isDe ? 'Aktion' : 'Action'}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {isLoadingAdminUsers && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">
                  {isDe ? 'Benutzer werden geladen ...' : 'Loading users ...'}
                </td>
              </tr>
            )}

            {!isLoadingAdminUsers && filteredPeople.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">
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

                  <td className="px-5 py-4 text-slate-600">
                    {teamDisplayName(person.teamId)}
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
      ? [locationName, departmentName].join(' ' + String.fromCharCode(0x2192) + ' ')
      : locationName;

    const contextByTab: Record<
      AdminTab,
      { titleDe: string; titleEn: string; descriptionDe: string; descriptionEn: string; metricDe: string; metricEn: string }
    > = {
      organization: {
        titleDe: 'Organisationspfad',
        titleEn: 'Organisation path',
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

    if (activeTab === 'organization') {
      const dashChar = ' ' + String.fromCharCode(0x2014) + ' ';
      const arrowChar = ' ' + String.fromCharCode(0x2192) + ' ';

      const locationLabel = selectedLocation
        ? selectedLocation.kuerzel
          ? selectedLocation.kuerzel + dashChar + selectedLocation.name
          : selectedLocation.name
        : null;

      const departmentLabel = selectedDepartment
        ? selectedDepartment.kuerzel
          ? selectedDepartment.kuerzel + dashChar + selectedDepartment.name
          : selectedDepartment.name
        : null;

      const teamLabel = selectedTeam
        ? selectedTeam.kuerzel
          ? selectedTeam.kuerzel + dashChar + selectedTeam.name
          : selectedTeam.name
        : null;

      const organisationPath = [locationLabel, departmentLabel, teamLabel]
        .filter(Boolean)
        .join(arrowChar);

      return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm">
          <div className="text-sm font-semibold">
            {isDe ? 'Organisationspfad' : 'Organisation path'}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {isDe ? 'Pfad:' : 'Path:'}
            </span>{' '}
            <span>
              {organisationPath || (isDe ? 'Kein Strukturknoten ausgew?hlt.' : 'No structure node selected.')}
            </span>
          </div>
        </div>
      );
    }

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

const renderTeamLeadModal = () => {
  if (!isTeamLeadOpen || !selectedTeam) return null;

  const displayTeamLeadUserName = (user: any) => {
    const person = user.person ?? {};

    const clean = (value: unknown) => {
      const textValue = String(value ?? '').trim();
      if (!textValue) return '';
      if (textValue.includes('@')) return '';
      return textValue;
    };

    const personName = [person.firstName, person.lastName]
      .map(clean)
      .filter(Boolean)
      .join(' ');

    const userName = [user.firstName, user.lastName]
      .map(clean)
      .filter(Boolean)
      .join(' ');

    const displayName = clean(user.name);

    const email = String(person.email ?? user.email ?? '').trim();

    const nameFromEmail = email
      ? email
          .split('@')[0]
          .split(/[._-]+/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ')
      : '';

    return personName || userName || displayName || nameFromEmail || '?';
  };

  const usersInTeam = adminUsers
    .filter((user) => (user as any).person?.team?.id === selectedTeam.id)
    .slice()
    .sort((a, b) => displayTeamLeadUserName(a).localeCompare(displayTeamLeadUserName(b)));

  const selectedTeamLabel = selectedTeam.kuerzel
    ? selectedTeam.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + selectedTeam.name
    : selectedTeam.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isDe ? 'Team Lead festlegen' : 'Set team lead'}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {selectedTeamLabel}
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="space-y-1">
            <div className={labelCls}>
              {isDe ? 'Benutzer aus diesem Team' : 'Users from this team'}
            </div>

            <select
              className={inputCls}
              value={teamLeadPersonId}
              onChange={(event) => setTeamLeadPersonId(event.target.value)}
            >
              <option value="">
                {isDe ? 'Kein Team Lead' : 'No team lead'}
              </option>

              {usersInTeam.map((user) => (
                <option key={(user as any).person?.id ?? user.id} value={(user as any).person?.id ?? ''}>
                  {displayTeamLeadUserName(user)}
                </option>
              ))}
            </select>

            {usersInTeam.length === 0 && (
              <p className="text-xs text-amber-700">
                {isDe
                  ? 'Diesem Team sind noch keine Benutzer zugeordnet.'
                  : 'No users are assigned to this team yet.'}
              </p>
            )}

            <p className="text-xs text-slate-500">
              {isDe
                ? 'Beim Speichern wird der bisherige Team Lead automatisch abgeloest.'
                : 'Saving will automatically replace the current team lead.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              setIsTeamLeadOpen(false);
              setTeamLeadPersonId('');
            }}
            disabled={isSavingTeamLead}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDe ? 'Abbrechen' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!selectedTeam) {
                setUiError(isDe ? 'Bitte zuerst ein Team auswaehlen.' : 'Please select a team first.');
                return;
              }

              setUiError(null);
              setUiMessage(null);
              setIsSavingTeamLead(true);

              try {
                const response = await fetch('/api/directory/teams/' + selectedTeam.id + '/lead', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    personId: teamLeadPersonId || null,
                  }),
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok || data?.success === false) {
                  throw new Error(data?.message ?? 'Team Lead konnte nicht gespeichert werden.');
                }

                setIsTeamLeadOpen(false);
                setTeamLeadPersonId('');

                await loadAdminUsers();

                setUiMessage(
                  data?.message ??
                    (isDe ? 'Team Lead wurde gespeichert.' : 'Team lead has been saved.')
                );
              } catch (error) {
                setUiError(
                  error instanceof Error
                    ? error.message
                    : isDe
                      ? 'Team Lead konnte nicht gespeichert werden.'
                      : 'Team lead could not be saved.'
                );
              } finally {
                setIsSavingTeamLead(false);
              }
            }}
            disabled={isSavingTeamLead}
            className={[
              'rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm',
              isSavingTeamLead ? 'cursor-wait bg-slate-400' : 'bg-[#009A93] hover:brightness-110',
            ].join(' ')}
          >
            {isSavingTeamLead
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

const renderStructureCreateSlideOver = () => {
  if (!createMode) return null;

  const teamDepartment = selectedTeam ? departmentById.get(selectedTeam.departmentId) ?? null : null;
  const teamLocation = teamDepartment?.locationId ? locationById.get(teamDepartment.locationId) ?? null : null;

  const activeDepartment = selectedTeam ? teamDepartment : selectedDepartment;
  const activeLocation = selectedTeam
    ? teamLocation
    : activeDepartment?.locationId
      ? locationById.get(activeDepartment.locationId) ?? null
      : selectedLocation;

  const title =
    createMode === 'location'
      ? isDe
        ? 'Standort hinzufuegen'
        : 'Add location'
      : createMode === 'department'
        ? isDe
          ? 'Abteilung hinzufuegen'
          : 'Add department'
        : createMode === 'team'
          ? isDe
            ? 'Team hinzufuegen'
            : 'Add team'
          : isDe
            ? 'Benutzer hinzufuegen'
            : 'Add user';

  const description =
    createMode === 'location'
      ? isDe
        ? 'Lege einen neuen Standort als oberste Organisationsebene an.'
        : 'Create a new location as the top organisation level.'
      : createMode === 'department'
        ? isDe
          ? 'Lege eine Abteilung unter dem ausgewaehlten Standort an.'
          : 'Create a department below the selected location.'
        : createMode === 'team'
          ? isDe
            ? 'Lege ein Team unter der ausgewaehlten Abteilung an.'
            : 'Create a team below the selected department.'
          : isDe
            ? 'Ordne einen bestehenden Benutzer dem ausgewaehlten Team zu.'
            : 'Assign an existing user to the selected team.';

  const closeSlideOver = () => {
    setCreateMode(null);
    setAssignUserId('');
  };

  const assignUserToSelectedTeam = async () => {
    if (!selectedTeam) {
      setUiError(isDe ? 'Bitte zuerst ein Team auswaehlen.' : 'Please select a team first.');
      return;
    }

    if (!assignUserId) {
      setUiError(isDe ? 'Bitte einen Benutzer auswaehlen.' : 'Please select a user.');
      return;
    }

    const user = adminUsers.find((item) => item.id === assignUserId);

    if (!user) {
      setUiError(isDe ? 'Benutzer wurde nicht gefunden.' : 'User was not found.');
      return;
    }

    setUiError(null);
    setUiMessage(null);
    setIsAssigningUser(true);

    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          roleCode: user.role?.code ?? 'VIEWER',
          departmentId: selectedTeam.departmentId,
          teamId: selectedTeam.id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ??
            (isDe
              ? 'Benutzer konnte dem Team nicht zugeordnet werden.'
              : 'User could not be assigned to the team.')
        );
      }

      setAssignUserId('');
      setCreateMode(null);

      setUiMessage(
        isDe
          ? 'Benutzer wurde dem Team zugeordnet.'
          : 'User has been assigned to the team.'
      );

      await loadAdminUsers();
    } catch (error) {
      setUiError(
        error instanceof Error
          ? error.message
          : isDe
            ? 'Benutzer konnte dem Team nicht zugeordnet werden.'
            : 'User could not be assigned to the team.'
      );
    } finally {
      setIsAssigningUser(false);
    }
  };

  const assignableUsersForTeam = selectedTeam
    ? adminUsers
        .filter((user) => user.person?.team?.id !== selectedTeam.id)
        .slice()
        .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/35">
      <button
        type="button"
        aria-label={isDe ? 'Schliessen' : 'Close'}
        className="h-full flex-1 cursor-default"
        onClick={closeSlideOver}
      />

      <aside className="flex h-full w-full max-w-[480px] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
            </div>

            <button
              type="button"
              onClick={closeSlideOver}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              x
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {(createMode === 'location' || createMode === 'department' || createMode === 'team') && (
            <section className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {isDe ? 'Allgemein' : 'General'}
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  {isDe ? 'Name und Code fuer die neue Struktur.' : 'Name and code for the new structure.'}
                </p>
              </div>

              {createMode === 'location' && (
                <>
                  <div className="space-y-1">
                    <div className={labelCls}>{isDe ? 'Name' : 'Name'}</div>
                    <input
                      className={inputCls}
                      value={locName}
                      onChange={(event) => setLocName(event.target.value)}
                      placeholder={isDe ? 'z. B. Frankfurt' : 'e.g. Frankfurt'}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className={labelCls}>{isDe ? 'Code' : 'Code'}</div>
                    <input
                      className={inputCls}
                      value={locKuerzel}
                      onChange={(event) => setLocKuerzel(event.target.value)}
                      placeholder="FRA"
                    />
                  </div>
                </>
              )}

              {createMode === 'department' && (
                <>
                  <div className="space-y-1">
                    <div className={labelCls}>{isDe ? 'Name' : 'Name'}</div>
                    <input
                      className={inputCls}
                      value={depName}
                      onChange={(event) => setDepName(event.target.value)}
                      placeholder={isDe ? 'z. B. Planning' : 'e.g. Planning'}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className={labelCls}>{isDe ? 'Code' : 'Code'}</div>
                    <input
                      className={inputCls}
                      value={depKuerzel}
                      onChange={(event) => setDepKuerzel(event.target.value)}
                      placeholder="PLA"
                    />
                  </div>
                </>
              )}

              {createMode === 'team' && (
                <>
                  <div className="space-y-1">
                    <div className={labelCls}>{isDe ? 'Name' : 'Name'}</div>
                    <input
                      className={inputCls}
                      value={teamName}
                      onChange={(event) => setTeamName(event.target.value)}
                      placeholder={isDe ? 'z. B. Short Term Planning' : 'e.g. Short Term Planning'}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className={labelCls}>{isDe ? 'Code' : 'Code'}</div>
                    <input
                      className={inputCls}
                      value={teamKuerzel}
                      onChange={(event) => setTeamKuerzel(event.target.value)}
                      placeholder="STP"
                    />
                  </div>
                </>
              )}
            </section>
          )}

          {(createMode === 'department' || createMode === 'team' || createMode === 'user') && (
            <section className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {isDe ? 'Zuordnung' : 'Assignment'}
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  {isDe ? 'Der Kontext wird aus der ausgewaehlten Struktur abgeleitet.' : 'The context is derived from the selected structure.'}
                </p>
              </div>

              {(createMode === 'department' || createMode === 'team' || createMode === 'user') && (
                <div className="space-y-1">
                  <div className={labelCls}>{isDe ? 'Standort' : 'Location'}</div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                    {activeLocation
                      ? activeLocation.kuerzel
                        ? activeLocation.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + activeLocation.name
                        : activeLocation.name
                      : isDe
                        ? 'Kein Standort ausgewaehlt'
                        : 'No location selected'}
                  </div>
                </div>
              )}

              {(createMode === 'team' || createMode === 'user') && (
                <div className="space-y-1">
                  <div className={labelCls}>{isDe ? 'Abteilung' : 'Department'}</div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                    {activeDepartment
                      ? activeDepartment.kuerzel
                        ? activeDepartment.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + activeDepartment.name
                        : activeDepartment.name
                      : isDe
                        ? 'Keine Abteilung ausgewaehlt'
                        : 'No department selected'}
                  </div>
                </div>
              )}

              {createMode === 'user' && selectedTeam && (
                <div className="space-y-1">
                  <div className={labelCls}>Team</div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                    {selectedTeam.kuerzel
                      ? selectedTeam.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + selectedTeam.name
                      : selectedTeam.name}
                  </div>
                </div>
              )}
            </section>
          )}

          {createMode === 'user' && (
            <section className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {isDe ? 'Benutzer' : 'User'}
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  {isDe
                    ? 'Waehle einen bestehenden Benutzer aus, der diesem Team zugeordnet werden soll.'
                    : 'Select an existing user to assign to this team.'}
                </p>
              </div>

              <div className="space-y-1">
                <div className={labelCls}>{isDe ? 'Benutzer auswaehlen' : 'Select user'}</div>
                <select
                  className={inputCls}
                  value={assignUserId}
                  onChange={(event) => setAssignUserId(event.target.value)}
                >
                  <option value="">
                    {isDe ? 'Benutzer auswaehlen' : 'Select user'}
                  </option>

                  {assignableUsersForTeam.map((user) => (
                    <option key={user.id} value={user.id}>
                      {(user.name || user.email) + ' ? ' + user.email}
                    </option>
                  ))}
                </select>
              </div>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={closeSlideOver}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {isDe ? 'Abbrechen' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={
              createMode === 'location'
                ? onAddLocation
                : createMode === 'department'
                  ? onAddDepartment
                  : createMode === 'team'
                    ? onAddTeam
                    : assignUserToSelectedTeam
            }
            disabled={
              (createMode === 'department' && !activeLocation) ||
              (createMode === 'team' && !activeDepartment) ||
              (createMode === 'user' && (!selectedTeam || !assignUserId || isAssigningUser))
            }
            className={[
              'rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm',
              (createMode === 'department' && !activeLocation) ||
              (createMode === 'team' && !activeDepartment) ||
              (createMode === 'user' && (!selectedTeam || !assignUserId || isAssigningUser))
                ? 'cursor-not-allowed bg-slate-400'
                : 'bg-[#009A93] hover:brightness-110',
            ].join(' ')}
          >
            {createMode === 'user'
              ? isAssigningUser
                ? isDe
                  ? 'Zuordnung laeuft ...'
                  : 'Assigning ...'
                : isDe
                  ? 'Zuordnen'
                  : 'Assign'
              : isDe
                ? 'Speichern'
                : 'Save'}
          </button>
        </div>
      </aside>
    </div>
  );
};

const normalizeOrgFunction = (value: unknown): OrgFunction => {
  return value === 'LEAD' || value === 'DEPUTY' || value === 'MEMBER' ? value : 'MEMBER';
};

const orgFunctionLabel = (value: OrgFunction) => {
  if (value === 'LEAD') return 'Lead';
  if (value === 'DEPUTY') return 'Deputy';
  return isDe ? 'Mitarbeiter' : 'Member';
};

const findExistingLeadUser = (
  departmentId: string | null,
  teamId: string | null,
  currentUserId?: string
) => {
  return adminUsers.find((user) => {
    const person = user.person as any;
    if (!person) return false;
    if (user.id === currentUserId) return false;
    if (person.orgFunction !== 'LEAD') return false;

    if (teamId) {
      return person.team?.id === teamId;
    }

    return person.department?.id === departmentId && !person.team?.id;
  });
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
    onChange={(event) => {
      setEditDepartmentId(event.target.value);
      setEditTeamId('');
    }}
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

<div className="space-y-1">
  <div className={labelCls}>{isDe ? 'Team' : 'Team'}</div>
  <select
    className={inputCls}
    value={editTeamId}
    onChange={(event) => setEditTeamId(event.target.value)}
    disabled={!editDepartmentId || editTeamOptions.length === 0}
  >
    <option value="">
      {!editDepartmentId
        ? isDe
          ? 'Bitte zuerst Abteilung auswaehlen'
          : 'Please select department first'
        : editTeamOptions.length === 0
          ? isDe
            ? 'Keine Teams in dieser Abteilung'
            : 'No teams in this department'
          : isDe
            ? 'Kein Team'
            : 'No team'}
    </option>

    {editTeamOptions.map((team) => (
      <option key={team.id} value={team.id}>
        {team.kuerzel
          ? team.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + team.name
          : team.name}
      </option>
    ))}
  </select>

  <p className="text-xs text-slate-500">
    {isDe
      ? 'Optional: Ein Benutzer kann direkt einem Team innerhalb der gewaehlten Abteilung zugeordnet werden.'
      : 'Optional: A user can be assigned directly to a team within the selected department.'}
  </p>

          {(() => {
            const existingLeadUser = findExistingLeadUser(
              editDepartmentId || null,
              editTeamId || null,
              undefined
            );

            const leadBlocked = Boolean(existingLeadUser);

            return (
              <div className="space-y-1">
                <label className={labelCls}>
                  {isDe ? 'Organisationsfunktion' : 'Organizational function'}
                </label>

                <select
                  className={inputCls}
                  value={editOrgFunction}
                  onChange={(event) => setEditOrgFunction(normalizeOrgFunction(event.target.value))}
                >
                  <option value="MEMBER">{orgFunctionLabel('MEMBER')}</option>
                  <option value="LEAD" disabled={leadBlocked}>
                    {leadBlocked
                      ? 'Lead - bereits vergeben'
                      : 'Lead'}
                  </option>
                  <option value="DEPUTY">{orgFunctionLabel('DEPUTY')}</option>
                </select>

                <p className="text-xs text-slate-500">
                  {leadBlocked
                    ? isDe
                      ? 'Lead ist in dieser Abteilung bzw. diesem Team bereits vergeben. Fuer weitere Benutzer kann Deputy oder Mitarbeiter gewaehlt werden.'
                      : 'Lead is already assigned in this department or team. Select Deputy or Member for additional users.'
                    : isDe
                      ? 'Lead kann je Abteilung bzw. Team nur einmal vergeben werden. Deputy kann mehrfach vergeben werden.'
                      : 'Lead can only be assigned once per department or team. Deputy can be assigned multiple times.'}
                </p>
              </div>
            );
          })()}
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

  const renderOrganisationViewSwitch = () => (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-sm font-semibold text-slate-900">
          {isDe ? 'Organisationsansicht' : 'Organisation view'}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {isDe
            ? 'Wechsle zwischen Pflege der Struktur und visueller Darstellung.'
            : 'Switch between maintaining the structure and visual representation.'}
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setOrganisationViewMode('structure')}
          className={[
            'rounded-md px-3 py-1.5 text-sm font-semibold transition',
            organisationViewMode === 'structure'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900',
          ].join(' ')}
        >
          {isDe ? 'Struktur bearbeiten' : 'Edit structure'}
        </button>

        <button
          type="button"
          onClick={() => setOrganisationViewMode('chart')}
          className={[
            'rounded-md px-3 py-1.5 text-sm font-semibold transition',
            organisationViewMode === 'chart'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900',
          ].join(' ')}
        >
          Organigramm
        </button>
      </div>
    </div>
  );

  const renderOrgChartPanel = () => {
    const locationsForChart = selectedLocationId
      ? locationOptions.filter((location) => location.id === selectedLocationId)
      : locationOptions;

    const connectorColor = '#CBD5E1';
    const dash = String.fromCharCode(0x2014);
    const dot = String.fromCharCode(0x00b7);

    const displayUserName = (user: any) => {
      const person = user?.person ?? {};

      const clean = (value: unknown) => {
        const textValue = String(value ?? '').trim();
        if (!textValue) return '';
        if (textValue.includes('@')) return '';
        return textValue;
      };

      const personName = [person.firstName, person.lastName]
        .map(clean)
        .filter(Boolean)
        .join(' ');

      const userName = [user?.firstName, user?.lastName]
        .map(clean)
        .filter(Boolean)
        .join(' ');

      const displayName = clean(user?.name);
      const email = String(person.email ?? user?.email ?? '').trim();

      const nameFromEmail = email
        ? email
            .split('@')[0]
            .split(/[._-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ')
        : '';

      return personName || userName || displayName || nameFromEmail || dash;
    };

    const usersForTeam = (teamId: string) => {
      return adminUsers
        .filter((user) => (user as any).person?.team?.id === teamId)
        .slice()
        .sort((a, b) => displayUserName(a).localeCompare(displayUserName(b)));
    };

    const leadForTeam = (teamId: string) => {
      return adminUsers.find((user) => {
        const person = (user as any).person;
        return person?.team?.id === teamId && person?.orgFunction === 'LEAD';
      });
    };

    const deputyCountForTeam = (teamId: string) => {
      return adminUsers.filter((user) => {
        const person = (user as any).person;
        return person?.team?.id === teamId && person?.orgFunction === 'DEPUTY';
      }).length;
    };

    const departmentLead = (departmentId: string) => {
      return adminUsers.find((user) => {
        const person = (user as any).person;
        return (
          person?.department?.id === departmentId &&
          !person?.team?.id &&
          person?.orgFunction === 'LEAD'
        );
      });
    };

    const orgNode = ({
      eyebrow,
      title,
      subtitle,
      variant = 'team',
      compact = false,
    }: {
      eyebrow?: string;
      title: string;
      subtitle?: string;
      variant?: 'root' | 'department' | 'team';
      compact?: boolean;
    }) => {
      const variantClass =
        variant === 'root'
          ? 'border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50'
          : variant === 'department'
            ? 'border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50'
            : 'border-slate-200 bg-white';

      return (
        <div
          className={[
            'relative z-10 rounded-2xl border shadow-sm',
            variantClass,
            compact ? 'w-[300px] px-4 py-3' : 'w-[300px] px-5 py-4',
          ].join(' ')}
        >
          {eyebrow && (
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {eyebrow}
            </div>
          )}

          <div className={compact ? 'text-sm font-semibold text-slate-900' : 'text-xl font-bold text-slate-900'}>
            {title}
          </div>

          {subtitle && (
            <div className="mt-2 text-xs text-slate-500">
              {subtitle}
            </div>
          )}
        </div>
      );
    };

    return (
      <section className={panelCls + ' overflow-hidden'}>
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Organigramm
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {isDe
                  ? 'Klassische Box-Linien-Darstellung der aktuellen Organisationsstruktur im LexTrack-Design.'
                  : 'Classic box-line representation of the current organisation structure in LexTrack design.'}
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {locationsForChart.length} {isDe ? 'Standorte' : 'locations'}
            </span>
          </div>
        </div>

        <div className="space-y-8 overflow-x-auto bg-slate-50 px-5 py-6">
          {locationsForChart.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
              {isDe
                ? 'Noch keine Organisationsstruktur vorhanden.'
                : 'No organisation structure available yet.'}
            </div>
          )}

          {locationsForChart.map((location) => {
            const locationDepartments = visibleDepartments
              .filter((department) => department.locationId === location.id)
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name));

            const locationLabel = location.kuerzel
              ? location.kuerzel + ' ' + dash + ' ' + location.name
              : location.name;

            const departmentCount = Math.max(locationDepartments.length, 1);
            const firstDepartmentX = 50 / departmentCount;
            const lastDepartmentX = 100 - 50 / departmentCount;

            return (
              <div
                key={location.id}
                className="min-w-[1120px] rounded-2xl border border-slate-200 bg-white px-8 py-8 shadow-sm"
              >
                <div className="flex justify-center">
                  <div
                    role="button"
                    tabIndex={0}
                    className="inline-block cursor-pointer rounded-2xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#009A93]/40"
                    onClick={() => {
                      setSelectedLocationId(location.id);
setDepLocationId(location.id);
                      setSelectedDepartmentId(null);
                      setSelectedTeamId(null);
                      setOrganisationViewMode('structure');
setShowAddLocation(false);
setShowAddDepartment(false);
setShowAddTeam(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      event.preventDefault();
                      setSelectedLocationId(location.id);
setDepLocationId(location.id);
                      setSelectedDepartmentId(null);
                      setSelectedTeamId(null);
                      setOrganisationViewMode('structure');
setShowAddLocation(false);
setShowAddDepartment(false);
setShowAddTeam(false);
                    }}
                  >
                    {orgNode({
                    eyebrow: isDe ? 'Standort' : 'Location',
                    title: locationLabel,
                    subtitle:
                    locationEmployeeCount(location.id) +
                    ' ' +
                    (isDe ? 'Benutzer' : 'users'),
                    variant: 'root',
                    })}
                  </div>
                </div>

                {locationDepartments.length === 0 ? (
                  <div className="mt-6 flex justify-center">
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      {isDe ? 'Noch keine Abteilungen angelegt.' : 'No departments created yet.'}
                    </div>
                  </div>
                ) : (
                  <>
                    <svg
                      className="block h-16 w-full overflow-visible"
                      viewBox="0 0 100 64"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <line
                        x1="50"
                        y1="-2"
                        x2="50"
                        y2="26"
                        stroke={connectorColor}
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="butt"
                      />

                      {locationDepartments.length > 1 && (
                        <line
                          x1={String(firstDepartmentX)}
                          y1="26"
                          x2={String(lastDepartmentX)}
                          y2="26"
                          stroke={connectorColor}
                          strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                          strokeLinecap="butt"
                        />
                      )}

                      {locationDepartments.map((department, index) => {
                        const x = ((index + 0.5) / departmentCount) * 100;

                        return (
                          <line
                            key={department.id}
                            x1={String(x)}
                            y1="26"
                            x2={String(x)}
                            y2="66"
                            stroke={connectorColor}
                            strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                            strokeLinecap="butt"
                          />
                        );
                      })}
                    </svg>

                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: 'repeat(' + departmentCount + ', minmax(300px, 1fr))',
                      }}
                    >
                      {locationDepartments.map((department) => {
                        const teams = (teamsByDepartmentId.get(department.id) ?? [])
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name));

                        const departmentLabel = department.kuerzel
                          ? department.kuerzel + ' ' + dash + ' ' + department.name
                          : department.name;

                        const depLead = departmentLead(department.id);

                        return (
                          <div key={department.id} className="flex flex-col items-center px-4">
                            <div
                              role="button"
                              tabIndex={0}
                              className="inline-block cursor-pointer rounded-2xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#009A93]/40"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedLocationId(location.id);
setDepLocationId(location.id);
                                setSelectedDepartmentId(department.id);
setTeamDepartmentId(department.id);
setInviteDepartmentId(department.id);
                                setSelectedTeamId(null);
                                setOrganisationViewMode('structure');
setShowAddLocation(false);
setShowAddDepartment(false);
setShowAddTeam(false);
                              }}
                              onKeyDown={(event) => {
                                if (event.key !== 'Enter' && event.key !== ' ') return;
                                event.preventDefault();
                                event.stopPropagation();
                                setSelectedLocationId(location.id);
setDepLocationId(location.id);
                                setSelectedDepartmentId(department.id);
setTeamDepartmentId(department.id);
setInviteDepartmentId(department.id);
                                setSelectedTeamId(null);
                                setOrganisationViewMode('structure');
setShowAddLocation(false);
setShowAddDepartment(false);
setShowAddTeam(false);
                              }}
                            >
                              {orgNode({
                              eyebrow: isDe ? 'Abteilung' : 'Department',
                              title: departmentLabel,
                              subtitle: depLead
                              ? 'Lead: ' + displayUserName(depLead)
                              : 'Lead: ' + dash,
                              variant: 'department',
                              })}
                            </div>

                            {teams.length > 0 ? (
                              <div className="flex flex-col items-center">
                                <div className="h-8 w-[3px] bg-[#CBD5E1]" />

                                <div className="flex flex-col items-center">
                                  {teams.map((team, index) => {
                                    const teamLabel = team.kuerzel
                                      ? team.kuerzel + ' ' + dash + ' ' + team.name
                                      : team.name;

                                    const teamLead = leadForTeam(team.id);
                                    const deputyCount = deputyCountForTeam(team.id);
                                    const teamUsers = usersForTeam(team.id);

                                    const subtitleParts = [
                                      teamLead
                                        ? 'Lead: ' + displayUserName(teamLead)
                                        : 'Lead: ' + dash,
                                      deputyCount > 0
                                        ? 'Deputy: ' + deputyCount
                                        : null,
                                      teamUsers.length + ' ' + (isDe ? 'Benutzer' : 'users'),
                                    ].filter(Boolean);

                                    return (
                                      <React.Fragment key={team.id}>
                                        {index > 0 && (
                                          <div className="h-5 w-[3px] bg-[#CBD5E1]" />
                                        )}

                                        <div
                                          role="button"
                                          tabIndex={0}
                                          className="inline-block cursor-pointer rounded-2xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#009A93]/40"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setSelectedLocationId(location.id);
setDepLocationId(location.id);
                                            setSelectedDepartmentId(department.id);
setTeamDepartmentId(department.id);
setInviteDepartmentId(department.id);
                                            setSelectedTeamId(team.id);
                                            setOrganisationViewMode('structure');
setShowAddLocation(false);
setShowAddDepartment(false);
setShowAddTeam(false);
                                          }}
                                          onKeyDown={(event) => {
                                            if (event.key !== 'Enter' && event.key !== ' ') return;
                                            event.preventDefault();
                                            event.stopPropagation();
                                            setSelectedLocationId(location.id);
setDepLocationId(location.id);
                                            setSelectedDepartmentId(department.id);
setTeamDepartmentId(department.id);
setInviteDepartmentId(department.id);
                                            setSelectedTeamId(team.id);
                                            setOrganisationViewMode('structure');
setShowAddLocation(false);
setShowAddDepartment(false);
setShowAddTeam(false);
                                          }}
                                        >
                                          {orgNode({
                                          eyebrow: 'Team',
                                          title: teamLabel,
                                          subtitle: subtitleParts.join(' ' + dot + ' '),
                                          variant: 'team',
                                          compact: true,
                                          })}
                                        </div>
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="h-8 w-[3px] bg-[#CBD5E1]" />

                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                  {isDe ? 'Noch keine Teams' : 'No teams yet'}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
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
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.7fr)]">
          {renderContextPanel()}
          {renderOrganisationViewSwitch()}
        </div>

        {organisationViewMode === 'chart' ? (
          renderOrgChartPanel()
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            {renderOrganisationPanel()}
            {renderTeamsPanel()}
          </div>
        )}
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

      {activeTab !== 'organization' && renderContextPanel()}
      {renderMainContent()}
      {renderStructureCreateSlideOver()}
      {renderTeamLeadModal()}
      {renderEditUserModal()}
    </div>
  );
}
