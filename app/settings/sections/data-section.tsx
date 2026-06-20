// app/settings/sections/data-section.tsx
'use client';

import React from 'react';
import { Database, FileText } from 'lucide-react';
import { APP_VERSION, APP_BUILD_DATE } from '@/app/config/app-meta';

type DataTexts = {
  dataHeading: string;

  versionCardTitle: string;
  versionLabel: string;
  versionBuildLabel: string;

  backupCardTitle: string;
  backupCardSubtitle: string;
};

export default function DataSection({
  t,
  isDe,
}: {
  t: DataTexts;
  isDe: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Headline-Band */}
      <div className="rounded-xl bg-[#00559F] text-white px-4 py-3 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold">{t.dataHeading}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Anwendungsversion */}
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">{t.versionCardTitle}</h3>
          </div>

          <div className="mt-1 text-xs text-slate-600 space-y-1">
            <p>
              <span className="font-medium">{t.versionLabel}:</span>{' '}
              <span className="font-mono">{APP_VERSION}</span>
            </p>
            <p>
              <span className="font-medium">{t.versionBuildLabel}:</span>{' '}
              <span className="font-mono">{APP_BUILD_DATE}</span>
            </p>
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            {isDe
              ? 'Diese Informationen helfen dir bei Rückfragen an den Support oder in Audits, den Stand der Anwendung zu dokumentieren.'
              : 'Use this information for support requests or audits to document the current application state.'}
          </p>
        </section>

        {/* Backups & Exporte – Platzhalter */}
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">{t.backupCardTitle}</h3>
          </div>

          <p className="text-xs text-slate-600">{t.backupCardSubtitle}</p>

          <ul className="mt-1 text-[11px] text-slate-500 list-disc list-inside space-y-1">
            <li>
              {isDe
                ? 'Geplant: manueller Export von Konfigurationsdaten (Register, Matrizen, Rollen).'
                : 'Planned: manual export of configuration data (registers, matrices, roles).'}
            </li>
            <li>
              {isDe
                ? 'Geplant: Snapshots für revisionssichere Stände.'
                : 'Planned: snapshots for revision-proof states.'}
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}