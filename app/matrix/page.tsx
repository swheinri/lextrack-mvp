// app/matrix/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import MatrixDocSelector from './matrix-doc-selector';
import MatrixDocList from './matrix-doc-list';
import MatrixDetail from './matrix-detail';

import { useRegisterStore, type LawRow } from '../register/registerstore';
import { useMatrixStore } from './matrixstore';
import { useLanguage } from '../components/i18n/language';
import { Info, PlusCircle, X } from 'lucide-react';

type Modal = 'none' | 'info' | 'link';

export default function MatrixPage() {
  const { rows } = useRegisterStore();
  const { docs, createOrGetDocumentForLaw } = useMatrixStore();
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [selectedLawId, setSelectedLawId] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>('none');

  const closeModal = useCallback(() => setModal('none'), []);

  // ✅ Wenn der ausgewählte Doc nicht mehr existiert → Auswahl zurücksetzen
  useEffect(() => {
    if (!selectedDocId) return;
    const exists = docs?.some((d: any) => d?.id === selectedDocId);
    if (!exists) setSelectedDocId(null);
  }, [docs, selectedDocId]);

  // ✅ Wenn es Docs gibt und noch keiner ausgewählt ist → ersten wählen (besseres UX)
  useEffect(() => {
    if (selectedDocId) return;
    if (docs?.length) setSelectedDocId(docs[0]?.id ?? null);
  }, [docs, selectedDocId]);

  // ✅ ESC schließt Modals
  useEffect(() => {
    if (modal === 'none') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal, closeModal]);

  const selectedLaw: LawRow | undefined = useMemo(() => {
    if (!selectedLawId) return undefined;
    return rows.find((r) => r.id === selectedLawId);
  }, [rows, selectedLawId]);

  const handleCreateFromLaw = useCallback(() => {
    if (!selectedLaw) return;

    const doc = createOrGetDocumentForLaw(selectedLaw);
    setSelectedDocId(doc.id);

    // Auswahl-Modal schließen, wenn eine Matrix angelegt/gefunden wurde
    setModal('none');
  }, [createOrGetDocumentForLaw, selectedLaw]);

  const handleSelectDoc = useCallback((docId: string) => {
    setSelectedDocId(docId);
  }, []);

  return (
    <>
      <div className="space-y-6">
        {/* Kopfbereich – Cockpit-Optik */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                {isDe ? 'Compliance Matrix' : 'Compliance matrix'}
              </h1>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                {isDe
                  ? 'Lege für ausgewählte Regelwerke eine Paragraphenstruktur an und hinterlege Nachweise und Referenzen zur Erfüllung.'
                  : 'Create a clause structure for selected regulations and link evidence and references for fulfilment.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModal('link')}
                className="inline-flex items-center gap-1 rounded-full bg-[#009A93] px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-[#007e78]"
              >
                <PlusCircle className="h-3 w-3" />
                <span>{isDe ? 'Regelwerk verbinden' : 'Link regulation'}</span>
              </button>

              <button
                type="button"
                onClick={() => setModal('info')}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-700 shadow-sm hover:bg-slate-100"
              >
                <Info className="h-3 w-3" />
                <span>{isDe ? 'Info' : 'Info'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bereich 2: vorhandene Matrizen */}
        <section className="space-y-3">
          <MatrixDocList
            docs={docs}
            selectedDocId={selectedDocId}
            onSelectDoc={handleSelectDoc}
          />
        </section>

        {/* Bereich 3: Detail-Editor */}
        {selectedDocId && <MatrixDetail selectedDocId={selectedDocId} />}
      </div>

      {/* Info-Modal */}
      {modal === 'info' && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            // Klick auf Backdrop schließt, Klick im Dialog nicht
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-4 text-xs shadow-xl">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">
                {isDe ? 'Compliance Matrix – Info' : 'Compliance matrix – info'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 bg-slate-50 p-1 hover:bg-slate-100"
                aria-label={isDe ? 'Schließen' : 'Close'}
              >
                <X className="h-3 w-3 text-slate-600" />
              </button>
            </div>

            <p className="mb-2 text-slate-700">
              {isDe ? (
                <>
                  In der Compliance Matrix legst du Paragraphen/Anforderungen aus einem Regelwerk an,
                  bewertest den Erfüllungsstatus und verknüpfst Evidence (Nachweise, Prozesse,
                  interne Dokumente).
                </>
              ) : (
                <>
                  In the compliance matrix you create clauses/requirements from a regulation,
                  assess their status and link evidence (processes, internal documents, etc.).
                </>
              )}
            </p>

            <p className="mb-3 text-slate-700">
              {isDe ? (
                <>
                  Später kann dieser Bereich um weitere Auswertungen und KI-Funktionen erweitert
                  werden (z.&nbsp;B. automatische Bewertungsvorschläge, Reifegrad-Scoring usw.).
                </>
              ) : (
                <>
                  Later this area can be extended with more analytics and AI features (e.g.
                  automatic suggestions, maturity scoring, etc.).
                </>
              )}
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
              >
                {isDe ? 'Schließen' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Regelwerk aus Register auswählen */}
      {modal === 'link' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-4xl rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                {isDe ? 'Regelwerk aus dem Register auswählen' : 'Select regulation from register'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-300 bg-slate-50 p-1 hover:bg-slate-100"
                aria-label={isDe ? 'Schließen' : 'Close'}
              >
                <X className="h-3 w-3 text-slate-600" />
              </button>
            </div>

            <MatrixDocSelector
              selectedLawId={selectedLawId}
              onSelectedLawIdChange={setSelectedLawId}
              onCreateFromLaw={handleCreateFromLaw}
            />
          </div>
        </div>
      )}
    </>
  );
}