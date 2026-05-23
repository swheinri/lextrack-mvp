// app/settings/sections/users-roles-section.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Building2, UserPlus, Trash2 } from 'lucide-react';

type Department = {
  id: string;
  name: string;
  code?: string;
};

type Person = {
  id: string;
  name: string;
  email?: string;
  departmentId?: string;
};

type StoreShape = {
  departments: Department[];
  people: Person[];
};

const LS_KEY = 'lextrack_users_roles_v1';

function createId(prefix: string) {
  const c = typeof globalThis !== 'undefined' ? (globalThis.crypto as any) : undefined;
  if (c?.randomUUID) return `${prefix}_${c.randomUUID()}`;
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeParse(raw: string | null): StoreShape | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== 'object') return null;

    const departments = Array.isArray((v as any).departments) ? (v as any).departments : [];
    const people = Array.isArray((v as any).people) ? (v as any).people : [];

    return { departments, people } as StoreShape;
  } catch {
    return null;
  }
}

export default function UsersRolesSection({ isDe }: { isDe: boolean }) {
  const [loaded, setLoaded] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  const [personName, setPersonName] = useState('');
  const [personEmail, setPersonEmail] = useState('');
  const [personDeptId, setPersonDeptId] = useState<string>('');

  // 1) Load once
  useEffect(() => {
    const data = safeParse(typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null);
    if (data) {
      setDepartments(
        (data.departments ?? []).filter((d: any) => d && typeof d.id === 'string' && typeof d.name === 'string')
      );
      setPeople(
        (data.people ?? []).filter((p: any) => p && typeof p.id === 'string' && typeof p.name === 'string')
      );
    } else {
      // minimaler Startzustand (optional)
      setDepartments([]);
      setPeople([]);
    }
    setLoaded(true);
  }, []);

  // 2) Persist on change (after load)
  useEffect(() => {
    if (!loaded) return;
    try {
      const payload: StoreShape = { departments, people };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [loaded, departments, people]);

  const deptById = useMemo(() => {
    const m = new Map<string, Department>();
    departments.forEach((d) => m.set(d.id, d));
    return m;
  }, [departments]);

  const addDepartment = () => {
    const name = deptName.trim();
    const code = deptCode.trim();
    if (!name) return;

    const next: Department = { id: createId('dept'), name, code: code || undefined };
    setDepartments((prev) => [next, ...prev]);
    setDeptName('');
    setDeptCode('');
  };

  const removeDepartment = (id: string) => {
    // People, die dran hängen, behalten wir — aber DepartmentId wird geleert
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    setPeople((prev) => prev.map((p) => (p.departmentId === id ? { ...p, departmentId: undefined } : p)));
  };

  const addPerson = () => {
    const name = personName.trim();
    const email = personEmail.trim();
    if (!name) return;

    const next: Person = {
      id: createId('person'),
      name,
      email: email || undefined,
      departmentId: personDeptId || undefined,
    };

    setPeople((prev) => [next, ...prev]);
    setPersonName('');
    setPersonEmail('');
    setPersonDeptId('');
  };

  const removePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Headline-Band */}
      <div className="rounded-xl bg-[#041225] text-white px-4 py-3 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold">
          {isDe ? 'Benutzer & Rollen' : 'Users & roles'}
        </h2>
        <p className="mt-1 text-xs text-white/80">
          {isDe
            ? 'Lege Abteilungen und Personen an. Diese Einträge werden lokal gespeichert und später bei der Zuteilung im Kataster (assignedTo / reviewedBy) auswählbar.'
            : 'Create departments and people. These entries are stored locally and will later be selectable when assigning documents (assignedTo / reviewedBy).'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Departments */}
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">
              {isDe ? 'Abteilungen' : 'Departments'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              className="sm:col-span-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={isDe ? 'Abteilungsname (z. B. IT Security)' : 'Department name'}
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={isDe ? 'Kürzel (optional)' : 'Code (optional)'}
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={addDepartment}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#009A93] px-4 py-2 text-xs font-medium text-white shadow-sm hover:brightness-110"
          >
            <Building2 className="h-4 w-4" />
            {isDe ? 'Abteilung hinzufügen' : 'Add department'}
          </button>

          <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {departments.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500">
                {isDe ? 'Noch keine Abteilungen angelegt.' : 'No departments yet.'}
              </div>
            ) : (
              departments.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800">{d.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {d.code ? (isDe ? `Kürzel: ${d.code}` : `Code: ${d.code}`) : isDe ? 'Kein Kürzel' : 'No code'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDepartment(d.id)}
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    title={isDe ? 'Abteilung löschen' : 'Delete department'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* People */}
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">
              {isDe ? 'Personen' : 'People'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={isDe ? 'Name (z. B. Max Mustermann)' : 'Name'}
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={isDe ? 'E-Mail (optional)' : 'Email (optional)'}
              value={personEmail}
              onChange={(e) => setPersonEmail(e.target.value)}
            />
          </div>

          <div className="mt-2">
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={personDeptId}
              onChange={(e) => setPersonDeptId(e.target.value)}
            >
              <option value="">
                {isDe ? '— Abteilung (optional) —' : '— Department (optional) —'}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code ? `${d.code} – ${d.name}` : d.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={addPerson}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#009A93] px-4 py-2 text-xs font-medium text-white shadow-sm hover:brightness-110"
          >
            <UserPlus className="h-4 w-4" />
            {isDe ? 'Person hinzufügen' : 'Add person'}
          </button>

          <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {people.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500">
                {isDe ? 'Noch keine Personen angelegt.' : 'No people yet.'}
              </div>
            ) : (
              people.map((p) => {
                const dept = p.departmentId ? deptById.get(p.departmentId) : undefined;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.email ? p.email : isDe ? 'keine E-Mail' : 'no email'}
                        {dept ? ` · ${dept.name}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePerson(p.id)}
                      className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      title={isDe ? 'Person löschen' : 'Delete person'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            {isDe
              ? 'Hinweis: Im MVP speichern wir lokal. Später kann das in Prisma/DB überführt werden (RBAC + Audit-Log).'
              : 'Note: In the MVP we store locally. Later we can move this to Prisma/DB (RBAC + audit log).'}
          </p>
        </section>
      </div>
    </div>
  );
}