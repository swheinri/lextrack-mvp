// dashboard/settings-dialog.tsx
'use client';

import React from 'react';

export type DashboardCardKey =
  | 'all'
  | 'active'
  | 'obsolete'
  | 'archived'
  | 'dueSoon';

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  value: DashboardCardKey[];
  onChange: (next: DashboardCardKey[]) => void;
};

const OPTIONS: { key: DashboardCardKey; label: string; helper: string }[] = [
  {
    key: 'all',
    label: 'Alle Dokumente',
    helper: 'Gesamtzahl aller im Kataster erfassten Einträge.',
  },
  {
    key: 'active',
    label: 'Aktive Dokumente',
    helper: 'Dokumente mit Status „aktiv“.',
  },
  {
    key: 'obsolete',
    label: 'Obsolete Dokumente',
    helper: 'Außer Kraft gesetzte bzw. ersetzte Vorgaben.',
  },
  {
    key: 'archived',
    label: 'Archivierte Dokumente',
    helper: 'Abgelegte Vorgaben, die nur noch historisch relevant sind.',
  },
  {
    key: 'dueSoon',
    label: 'Anstehende Fristen (30 Tage)',
    helper: 'Dokumente mit fälligen Terminen in den nächsten 30 Tagen.',
  },
];

export function DashboardSettingsDialog({
  open,
  onClose,
  value,
  onChange,
}: SettingsDialogProps) {
  if (!open) return null;

  const toggle = (key: DashboardCardKey) => {
    const exists = value.includes(key);
    if (exists) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  };

  const handleSave = () => {
    // später z.B. localStorage / API speichern
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-black/40 sm:items-center">
      {/* Overlay: Klick schließt Dialog */}
      <button
        type="button"
        aria-label="Einstellungen schließen"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      {/* Panel rechts / zentriert */}
      <div className="relative m-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl sm:m-8 dark:border-slate-700 dark:bg-slate-900/95">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Dashboard anpassen
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Wähle, welche Kennzahlen-Kacheln auf deiner Übersichtsseite
              angezeigt werden.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Schließen
          </button>
        </div>

        {/* Optionen */}
        <div className="mb-4 space-y-2">
          {OPTIONS.map((opt) => {
            const checked = value.includes(opt.key);
            return (
              <label
                key={opt.key}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-xs
                  ${
                    checked
                      ? 'border-[#009A93] bg-[#009A93]/5'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.key)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#009A93] focus:ring-[#009A93] dark:border-slate-600"
                />
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {opt.helper}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {/* Footer-Buttons */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-[#009A93] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#00847f]"
          >
            Einstellungen speichern
          </button>
        </div>
      </div>
    </div>
  );
}
