// app/register/editorpanel.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { LawRow, Relevanz, Status } from './registerstore';
import { X, Check } from 'lucide-react';
import { Field, AccordionHeader } from './ui';

const input =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#009A93] focus:ring-2 focus:ring-[#009A93]/20';

export default function EditorPanel({
  row,
  onClose,
  onSaveStay,
}: {
  row: LawRow;
  onClose: () => void;
  onSaveStay: (id: string, patch: Partial<LawRow>) => void;
}) {
  const [draft, setDraft] = useState<LawRow>({ ...row });
  const ch = (k: keyof LawRow, v: any) =>
    setDraft((p) => ({ ...p, [k]: v }));

  // Akkordeon-Bereiche
  const [open, setOpen] = useState<Record<string, boolean>>({
    allg: true,
    org: true,
    links: true,
    hist: true,
  });
  const toggle = (k: string) =>
    setOpen((p) => ({ ...p, [k]: !p[k] }));

  // Bei Wechsel des Datensatzes Draft neu befüllen
  useEffect(() => {
    setDraft({ ...row });
  }, [row]);

  // --- Button-Handler explizit definieren ---
  const handleSaveOnly = () => {
    onSaveStay(row.id, draft); // Speichern, Maske bleibt offen
  };

  const handleSaveAndClose = () => {
    onSaveStay(row.id, draft); // Speichern
    onClose();                 // und schließen
  };

  /* ---- Render ---- */
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative mx-auto my-6 flex h-full max-h-[92vh] w-full max-w-6xl items-center justify-center px-4">
        <div className="relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-[#14295f] to-[#009A93] px-6 py-4">
            <h3 className="text-xl font-semibold text-white">
              Datensatz bearbeiten
            </h3>
          </div>

          {/* Content */}
          <div className="scrollbar-thin grow overflow-auto px-6 py-6">
            <div className="grid grid-cols-12 gap-6">
              {/* ALLGEMEIN */}
              <section className="col-span-12">
                <AccordionHeader
                  title="Allgemein"
                  isOpen={open.allg}
                  onToggle={() => toggle('allg')}
                />
                {open.allg && (
                  <div className="mt-3 grid grid-cols-12 gap-3">
                    <Field label="Typ" className="col-span-12 sm:col-span-3">
                      <input
                        className={input}
                        value={draft.rechtsart ?? ''}
                        onChange={(e) =>
                          ch('rechtsart', e.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Kürzel"
                      className="col-span-12 sm:col-span-3"
                    >
                      <input
                        className={input}
                        value={draft.kuerzel ?? ''}
                        onChange={(e) =>
                          ch('kuerzel', e.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Bezeichnung"
                      className="col-span-12 sm:col-span-3"
                    >
                      <input
                        className={input}
                        value={draft.bezeichnung ?? ''}
                        onChange={(e) =>
                          ch('bezeichnung', e.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Themenfeld"
                      className="col-span-12 sm:col-span-3"
                    >
                      <input
                        className={input}
                        value={draft.themenfeld ?? ''}
                        onChange={(e) =>
                          ch('themenfeld', e.target.value)
                        }
                      />
                    </Field>

                    <Field
                      label="Erfassung durch"
                      className="col-span-12 sm:col-span-4"
                    >
                      <input
                        className={input}
                        value={
                          [draft.erfasserVorname ?? '', draft.erfasserNachname ?? '']
                            .filter(Boolean)
                            .join(' ') +
                          (draft.erfasserAbteilung
                            ? (draft.erfasserVorname || draft.erfasserNachname
                                ? ', '
                                : '') + draft.erfasserAbteilung
                            : '')
                        }
                        readOnly
                      />
                    </Field>
                    <Field
                      label="Publiziert am"
                      className="col-span-12 sm:col-span-4"
                    >
                      <input
                        type="date"
                        className={input}
                        value={draft.publiziert ?? ''}
                        onChange={(e) =>
                          ch('publiziert', e.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Gültig ab"
                      className="col-span-6 sm:col-span-2"
                    >
                      <input
                        type="date"
                        className={input}
                        value={draft.gueltigSeit ?? ''}
                        onChange={(e) =>
                          ch('gueltigSeit', e.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Gültig bis"
                      className="col-span-6 sm:col-span-2"
                    >
                      <input
                        type="date"
                        className={input}
                        value={draft.gueltigBis ?? ''}
                        onChange={(e) =>
                          ch('gueltigBis', e.target.value)
                        }
                      />
                    </Field>
                  </div>
                )}
              </section>

              {/* ORGANISATION & STATUS */}
              <section className="col-span-12">
                <AccordionHeader
                  title="Organisation & Status"
                  isOpen={open.org}
                  onToggle={() => toggle('org')}
                />
                {open.org && (
                  <div className="mt-3 grid grid-cols-12 gap-3">
                    <Field
                      label="Zuständigkeit (Kürzel/Name)"
                      className="col-span-12 sm:col-span-4"
                    >
                      <input
                        className={input}
                        value={draft.zustaendigkeit ?? ''}
                        onChange={(e) =>
                          ch('zustaendigkeit', e.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Herausgeber"
                      className="col-span-12 sm:col-span-4"
                    >
                      <input
                        className={input}
                        value={draft.herausgeber ?? ''}
                        onChange={(e) =>
                          ch('herausgeber', e.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Relevanz"
                      className="col-span-12 sm:col-span-2"
                    >
                      <select
                        className={input}
                        value={draft.relevanz ?? ''}
                        onChange={(e) =>
                          ch('relevanz', e.target.value as Relevanz)
                        }
                      >
                        <option value="">—</option>
                        <option value="Niedrig">Niedrig</option>
                        <option value="Mittel">Mittel</option>
                        <option value="Hoch">Hoch</option>
                      </select>
                    </Field>
                    <Field
                      label="Status"
                      className="col-span-12 sm:col-span-2"
                    >
                      <select
                        className={input}
                        value={draft.status ?? ''}
                        onChange={(e) =>
                          ch('status', e.target.value as Status)
                        }
                      >
                        <option value="">—</option>
                        <option value="offen">offen</option>
                        <option value="aktiv">aktiv</option>
                        <option value="obsolet">obsolet</option>
                        <option value="archiviert">archiviert</option>
                      </select>
                    </Field>
                  </div>
                )}
              </section>

              {/* VERKNÜPFTE DOKUMENTE & QUELLEN */}
              <section className="col-span-12">
                <AccordionHeader
                  title="Verknüpfte Dokumente & Quellen"
                  isOpen={open.links}
                  onToggle={() => toggle('links')}
                />
                {open.links && (
                  <div className="mt-3 grid grid-cols-12 gap-3">
                    <Field
                      label="Verlinkung Quelle (URL)"
                      className="col-span-12 sm:col-span-6"
                    >
                      <input
                        className={input}
                        placeholder="https://…"
                        value={draft.dokumentUrl ?? draft.quelleUrl ?? ''}
                        onChange={(e) =>
                          ch('dokumentUrl', e.target.value)
                        }
                      />
                      {(draft.dokumentUrl ?? draft.quelleUrl) ? (
                        <a
                          href={draft.dokumentUrl ?? draft.quelleUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs text-[#14295f] underline"
                        >
                          Quelle öffnen
                        </a>
                      ) : null}
                    </Field>

                    <Field
                      label="Dokument (Anzeigename/Link)"
                      className="col-span-12 sm:col-span-6"
                    >
                      <input
                        className={input}
                        placeholder="z. B. OJ_L_202501044_DE_TXT.pdf"
                        value={
                          draft.dokumentName ?? draft.dokumentFileName ?? ''
                        }
                        onChange={(e) =>
                          ch('dokumentName', e.target.value)
                        }
                      />
                      {draft.dokumentFileHref ? (
                        <a
                          href={draft.dokumentFileHref}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs text-[#14295f] underline"
                        >
                          {draft.dokumentFileName ||
                            'Hochgeladene Datei öffnen'}
                        </a>
                      ) : null}
                    </Field>
                  </div>
                )}
              </section>

              {/* HISTORIE */}
              <section className="col-span-12">
                <AccordionHeader
                  title="Historie"
                  isOpen={open.hist}
                  onToggle={() => toggle('hist')}
                />
                {open.hist && (
                  <div className="mt-3 rounded-lg border border-slate-200">
                    {(draft.history ?? []).length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        Noch keine Historie vorhanden.
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-200">
                        {(draft.history ?? [])
                          .slice()
                          .reverse()
                          .map((h: any, i: number) => (
                            <li
                              key={i}
                              className="flex items-center justify-between px-4 py-2 text-sm"
                            >
                              <div className="whitespace-pre-line text-slate-700">
                                {h.text}
                              </div>
                              <div className="text-slate-500">
                                {new Date(h.date).toLocaleString('de-DE', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                {h.user ? `· ${h.user}` : ''}
                              </div>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Footer-Aktionen */}
            <div className="sticky bottom-0 -mx-6 mt-6 border-t bg-white px-6 py-3">
              <div className="flex flex-wrap gap-3">
                {/* Speichern (bleibt offen) */}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#14295f] px-4 py-2 text-white hover:brightness-110"
                  onClick={handleSaveOnly}
                >
                  <Check size={16} /> Speichern
                </button>

                {/* Speichern & Schließen */}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#009A93] px-4 py-2 text-white hover:brightness-110"
                  onClick={handleSaveAndClose}
                >
                  <Check size={16} /> Speichern &amp; Schließen
                </button>

                {/* Abbrechen */}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={onClose}
                >
                  <X size={16} /> Abbrechen
                </button>
              </div>
            </div>
          </div>
          {/* /Content */}
        </div>
      </div>
    </div>
  );
}
