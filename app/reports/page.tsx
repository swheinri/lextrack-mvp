// app/components/reports/page.tsx
'use client';

import { BarChart2 } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        Hier entstehen demnächst Auswertungen & Berichte.
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-slate-100 p-3">
            <BarChart2 size={24} className="text-slate-700" />
          </div>
          <div>
            <div className="text-base font-semibold text-slate-800">Berichte</div>
            <div className="text-sm text-slate-500">Platzhalter – UI folgt.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
