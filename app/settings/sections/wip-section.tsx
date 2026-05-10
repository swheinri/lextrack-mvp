// app/settings/sections/wip-section.tsx
'use client';

import React from 'react';

type WipTexts = {
  wipTitle: string;
  wipText: string;
};

export default function WipSection({ t }: { t: WipTexts }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-800 mb-2">
        {t.wipTitle}
      </h2>
      <p className="text-sm text-slate-600">{t.wipText}</p>
    </div>
  );
}