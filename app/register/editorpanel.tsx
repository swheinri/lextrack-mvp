// app/register/editorpanel.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  LawRow,
  useRegisterStore,
  Dokumentenart,
  Vertragsumfeld,
  Relevanz,
  Status,
} from './registerstore';
import { useLanguage } from '../components/i18n/language';

/* ---------- Hilfs-UI ---------- */

const sectionHeader =
  'rounded-t-xl bg-[#0b2855] px-4 py-2 text-xs font-semibold text-white';
const sectionBody =
  'grid grid-cols-1 gap-3 rounded-b-xl border border-t-0 border-slate-200 bg-white px-4 py-3 md:grid-cols-12';
const labelCls =
  'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500';
const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#009A93] focus:ring-4 focus:ring-[#009A93]/20';

function Field({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

/* ---------- Props ---------- */

type Props = {
  row: LawRow | null;
  onClose: () => void;

  // ✅ NEU: damit page.tsx <EditorPanel onSave={...} /> keine TS-Fehler wirft
  onSave: (id: string, patch: Partial<LawRow>) => void;
};

export default function EditorPanel({ row, onClose, onSave }: Props) {
  // update bleibt drin, falls du es noch an anderen Stellen brauchst.
  // Speichern läuft jetzt aber bewusst über onSave (damit History etc. zentral in page.tsx passiert).
  const { update } = useRegisterStore();
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [draft, setDraft] = useState<LawRow | null>(row);

  useEffect(() => {
    setDraft(row);
  }, [row]);

  if (!row || !draft) return null;

  const setField = <K extends keyof LawRow>(key: K, value: LawRow[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = () => {
    if (!draft) return;

    const { id, ...patch } = draft;

    // ✅ ZENTRAL speichern (inkl. History-Logik aus page.tsx)
    onSave(id, patch);

    // (optional) falls du trotz Zentralisierung zusätzlich lokal updaten willst:
    // update(id, patch);
  };

  const handleSaveAndClose = () => {
    handleSave();
    onClose();
  };

  /* ---------- Optionen ---------- */

  const dokumentenarten: Dokumentenart[] = [
    'Verordnung',
    'Gesetz',
    'Norm',
    'Vorschrift',
    'Vertrag',
    'Richtlinie',
    'Sonstige',
  ];

  const themenfelderOptions: string[] = [
    'Sicherheit und Arbeitsschutz',
    'Daten- und Informationssicherheit',
    'Umweltschutz',
    'Energiemanagement',
    'Zertifizierung',
  ];

  const vertragsumfelder: Vertragsumfeld[] = ['B2B', 'B2C', 'B2G', 'Intern'];

  const relevanzOptions: Relevanz[] = ['Niedrig', 'Mittel', 'Hoch'];
  const statusOptions: Status[] = ['offen', 'aktiv', 'obsolet', 'archiviert'];

  /* ---------- Render ---------- */

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40">
      <div className="mt-6 mb-10 w-full max-w-5xl rounded-2xl bg-slate-50 shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-800">
            {isDe ? 'Datensatz bearbeiten' : 'Edit record'}
          </h2>
          <button
            type="button"
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* ---------- Abschnitt: Allgemein ---------- */}
          <section>
            <div className={sectionHeader}>{isDe ? 'Allgemein' : 'General'}</div>
            <div className={sectionBody}>
              {/* Dokumentenart (statt Typ) */}
              <Field
                label={isDe ? 'Dokumentenart' : 'Document type'}
                className="md:col-span-3"
              >
                <select
                  className={inputCls}
                  value={draft.dokumentenart ?? ''}
                  onChange={(e) =>
                    setField(
                      'dokumentenart',
                      (e.target.value || undefined) as Dokumentenart | undefined,
                    )
                  }
                >
                  <option value="">
                    {isDe
                      ? '— Dokumentenart wählen —'
                      : '— Select document type —'}
                  </option>
                  {dokumentenarten.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Kürzel */}
              <Field label={isDe ? 'Kürzel' : 'Reference'} className="md:col-span-3">
                <input
                  className={inputCls}
                  value={draft.kuerzel}
                  onChange={(e) => setField('kuerzel', e.target.value)}
                />
              </Field>

              {/* Bezeichnung */}
              <Field label={isDe ? 'Bezeichnung' : 'Title'} className="md:col-span-3">
                <input
                  className={inputCls}
                  value={draft.bezeichnung}
                  onChange={(e) => setField('bezeichnung', e.target.value)}
                />
              </Field>

              {/* Themenfeld – Dropdown */}
              <Field label={isDe ? 'Themenfeld' : 'Topic area'} className="md:col-span-3">
                <select
                  className={inputCls}
                  value={draft.themenfeld ?? ''}
                  onChange={(e) => setField('themenfeld', e.target.value || '')}
                >
                  <option value="">
                    {isDe ? '— Themenfeld wählen —' : '— Select topic area —'}
                  </option>
                  {themenfelderOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Vertragsumfeld – neues Feld */}
              <Field label={isDe ? 'Vertragsumfeld' : 'Contract context'} className="md:col-span-3">
                <select
                  className={inputCls}
                  value={draft.vertragsumfeld ?? ''}
                  onChange={(e) =>
                    setField(
                      'vertragsumfeld',
                      (e.target.value || undefined) as Vertragsumfeld | undefined,
                    )
                  }
                >
                  <option value="">
                    {isDe ? '— Vertragsumfeld wählen —' : '— Select context —'}
                  </option>
                  {vertragsumfelder.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isDe
                    ? 'Optional, besonders relevant bei Dokumentenart „Vertrag“.'
                    : 'Optional, mainly relevant when type is “Contract”.'}
                </p>
              </Field>

              {/* Erfassung durch (readonly) */}
              <Field label={isDe ? 'Erfassung durch' : 'Captured by'} className="md:col-span-3">
                <input
                  className={inputCls}
                  value={
                    [draft.erfasserVorname ?? '', draft.erfasserNachname ?? '']
                      .filter(Boolean)
                      .join(' ') || ''
                  }
                  onChange={() => {
                    /* readOnly */
                  }}
                  readOnly
                />
              </Field>

              {/* Publiziert am */}
              <Field label={isDe ? 'Publiziert am' : 'Published'} className="md:col-span-3">
                <input
                  type="date"
                  className={inputCls}
                  value={draft.publiziert ?? ''}
                  onChange={(e) => setField('publiziert', e.target.value || '')}
                />
              </Field>

              {/* Gültig ab */}
              <Field label={isDe ? 'Gültig ab' : 'Valid from'} className="md:col-span-3">
                <input
                  type="date"
                  className={inputCls}
                  value={draft.gueltigSeit ?? ''}
                  onChange={(e) => setField('gueltigSeit', e.target.value || '')}
                />
              </Field>

              {/* Gültig bis */}
              <Field label={isDe ? 'Gültig bis' : 'Valid to'} className="md:col-span-3">
                <input
                  type="date"
                  className={inputCls}
                  value={draft.gueltigBis ?? ''}
                  onChange={(e) => setField('gueltigBis', e.target.value || '')}
                />
              </Field>
            </div>
          </section>

          {/* ---------- Abschnitt: Organisation & Status ---------- */}
          <section>
            <div className={sectionHeader}>
              {isDe ? 'Organisation & Status' : 'Organisation & status'}
            </div>
            <div className={sectionBody}>
              <Field
                label={isDe ? 'Zuständigkeit (Kürzel/Name)' : 'Responsibility'}
                className="md:col-span-6"
              >
                <input
                  className={inputCls}
                  value={draft.zustaendigkeit ?? ''}
                  onChange={(e) => setField('zustaendigkeit', e.target.value || '')}
                />
              </Field>

              <Field label={isDe ? 'Herausgeber' : 'Issuing body'} className="md:col-span-6">
                <input
                  className={inputCls}
                  value={draft.herausgeber ?? ''}
                  onChange={(e) => setField('herausgeber', e.target.value || '')}
                />
              </Field>

              <Field label={isDe ? 'Relevanz' : 'Relevance'} className="md:col-span-3">
                <select
                  className={inputCls}
                  value={draft.relevanz ?? ''}
                  onChange={(e) =>
                    setField(
                      'relevanz',
                      (e.target.value || undefined) as Relevanz | undefined,
                    )
                  }
                >
                  <option value="">
                    {isDe ? '— Relevanz wählen —' : '— Select relevance —'}
                  </option>
                  {relevanzOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={isDe ? 'Status' : 'Status'} className="md:col-span-3">
                <select
                  className={inputCls}
                  value={draft.status ?? ''}
                  onChange={(e) =>
                    setField('status', (e.target.value || undefined) as Status | undefined)
                  }
                >
                  <option value="">
                    {isDe ? '— Status wählen —' : '— Select status —'}
                  </option>
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {/* ---------- Abschnitt: Verknüpfte Dokumente & Quellen ---------- */}
          <section>
            <div className={sectionHeader}>
              {isDe ? 'Verknüpfte Dokumente & Quellen' : 'Linked documents & sources'}
            </div>
            <div className={sectionBody}>
              <Field label={isDe ? 'Verlinkung Quelle (URL)' : 'Source URL'} className="md:col-span-6">
                <input
                  className={inputCls}
                  value={draft.dokumentUrl ?? ''}
                  onChange={(e) => setField('dokumentUrl', e.target.value || '')}
                />
              </Field>

              <Field
                label={isDe ? 'Dokument (Anzeigename/Link)' : 'Document display name'}
                className="md:col-span-6"
              >
                <input
                  className={inputCls}
                  value={draft.dokumentName ?? ''}
                  onChange={(e) => setField('dokumentName', e.target.value || '')}
                />
              </Field>
            </div>
          </section>

          {/* ---------- Abschnitt: Historie (read-only) ---------- */}
          <section>
            <div className={sectionHeader}>{isDe ? 'Historie' : 'History'}</div>
            <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white px-4 py-2 text-sm">
              {draft.history && draft.history.length > 0 ? (
                <ul className="space-y-1 text-xs text-slate-700">
                  {draft.history
                    .slice()
                    .reverse()
                    .map((h, idx) => (
                      <li key={idx} className="flex justify-between gap-3">
                        <span>
                          {h.text}{' '}
                          {h.user ? (
                            <span className="text-slate-400">· {h.user}</span>
                          ) : null}
                        </span>
                        <span className="whitespace-nowrap text-slate-400">{h.date}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">
                  {isDe ? 'Keine Historie vorhanden.' : 'No history entries.'}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            onClick={onClose}
          >
            {isDe ? 'Abbrechen' : 'Cancel'}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              onClick={handleSave}
            >
              {isDe ? 'Speichern' : 'Save'}
            </button>
            <button
              type="button"
              className="rounded-lg bg-[#009A93] px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
              onClick={handleSaveAndClose}
            >
              {isDe ? 'Speichern & Schließen' : 'Save & close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
