// app/matrix/matrix-header.tsx
'use client';

import React, { useState } from 'react';
import { useLanguage } from '../components/i18n/language';
import { Info } from 'lucide-react';

export default function MatrixHeader() {
  const { language } = useLanguage();
  const isDe = language === 'de';
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      {/* Header-Karte im gleichen Stil wie "Register / Kataster" */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
              {isDe ? 'Compliance Matrix' : 'Compliance matrix'}
            </h1>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              {isDe
                ? 'Lege für ausgewählte Regelwerke eine Paragraphenstruktur an und hinterlege Nachweise und Referenzen zur Erfüllung.'
                : 'Create a clause structure for selected regulations and document evidence and references for compliance.'}
            </p>
          </div>

          {/* Info-Button rechts */}
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-700 shadow-sm hover:bg-slate-100"
          >
            <Info className="h-3 w-3" />
            <span>{isDe ? 'Info' : 'Info'}</span>
          </button>
        </div>
      </div>

      {/* Info-Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
          <div className="w-full max-w-md rounded-xl bg-white p-4 text-xs shadow-xl">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              {isDe ? 'Compliance Matrix – Info' : 'Compliance matrix – info'}
            </h2>
            <p className="mb-2 text-slate-700">
              {isDe ? (
                <>
                  In der Compliance Matrix legst du Paragraphen/Anforderungen aus
                  einem Regelwerk an, bewertest den Erfüllungsstatus und
                  verknüpfst Evidence (Nachweise, Prozesse, interne Dokumente).
                </>
              ) : (
                <>
                  In the compliance matrix you create clauses/requirements from a
                  regulation, assess their compliance status and link evidence
                  (proof, processes, internal documents).
                </>
              )}
            </p>
            <p className="mb-3 text-slate-700">
              {isDe ? (
                <>
                  Später kann dieser Bereich um weitere Auswertungen und
                  KI-Funktionen erweitert werden (z. B. automatische
                  Vorschlagsbewertung, Reifegrad-Scoring, etc.).
                </>
              ) : (
                <>
                  Later this area can be extended with more analytics and AI
                  features (e.g. automatic suggestion of statuses, maturity
                  scoring, etc.).
                </>
              )}
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
              >
                {isDe ? 'Schließen' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
