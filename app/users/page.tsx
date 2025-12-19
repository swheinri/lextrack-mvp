// app/users/page.tsx
'use client';
import { UserPlus, Shield } from 'lucide-react';

export default function UsersSettings() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1e3354]">Benutzer & Rollen</h2>
      <p className="text-sm text-slate-600">
        Verwalte hier Nutzerkonten, Rollen und Zugriffsrechte.
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex justify-between items-center mb-3">
          <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-[#009A93] text-white hover:brightness-110">
            <UserPlus size={16} /> Neuer Benutzer
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300">
            <Shield size={16} /> Rollen verwalten
          </button>
        </div>
        {/* Tabelle / Liste folgt */}
        <div className="text-sm text-slate-500 italic">
          (Benutzerliste folgt in Kürze...)
        </div>
      </div>
    </div>
  );
}
