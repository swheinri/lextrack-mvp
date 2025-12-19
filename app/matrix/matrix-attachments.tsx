// app/matrix/matrix-attachments.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  clauseId: string;
  isDe: boolean;
  onChangeCount?: (count: number) => void; // Anzahl Dateien nach oben melden
};

type UploadItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // Object URL für Download / Ansicht
  uploadedAt: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export default function MatrixAttachments({ clauseId, isDe, onChangeCount }: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);

  // ✅ Lint-safe: Callback in Ref spiegeln, damit effect NICHT von der Funktions-Identität abhängt
  const onChangeCountRef = useRef<Props['onChangeCount']>(onChangeCount);

  useEffect(() => {
    onChangeCountRef.current = onChangeCount;
  }, [onChangeCount]);

  // Nur reagieren, wenn sich die Anzahl der Items ändert
  useEffect(() => {
    onChangeCountRef.current?.(items.length);
  }, [items.length]);

  // Optional, aber sauber: ObjectURLs beim Unmount aufräumen
  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.url));
    };
    // bewusst leer: Cleanup nur beim Unmount; URLs werden zusätzlich beim Remove revoked
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const now = new Date().toISOString();
    const newItems: UploadItem[] = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file);
      return {
        id: `${clauseId}_${file.name}_${file.lastModified}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url,
        uploadedAt: now,
      };
    });

    setItems((prev) => [...prev, ...newItems]);

    // Input zurücksetzen, damit derselbe Dateiname erneut gewählt werden kann
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const toRemove = prev.find((it) => it.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.url);
      return prev.filter((it) => it.id !== id);
    });
  };

  if (!clauseId) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {isDe ? 'Dokumente / Anhänge' : 'Documents / attachments'}
        </label>

        <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 shadow-sm hover:bg-slate-50">
          <span className="mr-1 text-base leading-none">＋</span>
          {isDe ? 'Datei hinzufügen' : 'Add file'}
          <input type="file" className="hidden" multiple onChange={handleFileChange} />
        </label>
      </div>

      {items.length === 0 ? (
        <p className="mt-2 text-[11px] text-slate-400">
          {isDe
            ? 'Noch keine Dateien hochgeladen (MVP: Dateien sind nur in dieser Sitzung verfügbar).'
            : 'No files uploaded yet (MVP: files are only available in this session).'}
        </p>
      ) : (
        <ul className="mt-2 space-y-1 text-[11px] text-slate-700">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{it.name}</div>
                <div className="text-[10px] text-slate-500">
                  {formatSize(it.size)} · {it.type || 'file'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={it.url}
                  download={it.name}
                  className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100"
                >
                  Download
                </a>

                <button
                  type="button"
                  onClick={() => handleRemove(it.id)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-red-200 text-[11px] text-red-500 hover:bg-red-50"
                  title={isDe ? 'Anhang entfernen' : 'Remove attachment'}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
