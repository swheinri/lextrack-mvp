// app/infocenter.tsx

'use client';

import React from 'react';
import { Info, AlertTriangle, Bell } from 'lucide-react';
import { useInfoCenter, InfoData, InfoCenterProvider } from './infocenter-context';

type InfoCenterProps = {
  /** Optional: explizite Daten übergeben. Wenn nicht gesetzt, werden Context-Daten genutzt. */
  data?: InfoData | null;
};

export const InfoCenter: React.FC<InfoCenterProps> = ({ data: propData }) => {
  const { data: ctxData } = useInfoCenter();
  const data = propData ?? ctxData;

  const [open, setOpen] = React.useState(false);

  if (!data) return null;

  // einfache Logik für Icon / Farbcode
  let Icon = Info;
  let badgeClass = 'bg-sky-100 text-sky-700';
  if (data.severity === 'warning') {
    Icon = AlertTriangle;
    badgeClass = 'bg-amber-100 text-amber-700';
  } else if (data.severity === 'alert') {
    Icon = Bell;
    badgeClass = 'bg-red-100 text-red-700';
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 hover:bg-white/20"
        onClick={() => setOpen(o => !o)}
        title={data.title}
      >
        <Icon size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-sm rounded-xl border border-slate-200 bg-white text-slate-800 shadow-lg z-50">
          <div className="flex items-start gap-2 border-b border-slate-100 px-4 py-3">
            <div
              className={[
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                badgeClass,
              ].join(' ')}
            >
              {data.version ? `Version ${data.version}` : 'Info'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{data.title}</div>
              {data.lastUpdated && (
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Zuletzt aktualisiert: {data.lastUpdated}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 px-4 py-3 text-sm">
            {data.description && <p className="text-slate-700">{data.description}</p>}
            {data.bullets && data.bullets.length > 0 && (
              <ul className="list-inside list-disc space-y-1 text-[13px] text-slate-700">
                {data.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 👉 damit du weiterhin alles aus *einem* Modul importieren kannst:
export { InfoCenterProvider, useInfoCenter } from './infocenter-context';
export type { InfoData } from './infocenter-context';
