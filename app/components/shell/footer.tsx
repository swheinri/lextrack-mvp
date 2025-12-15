// app/components/shell/footer.tsx
'use client';

import React from 'react';
import { APP_VERSION } from '../../config/app-version';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="
        bg-gradient-to-r from-[#021633] to-[#009A93]
        text-[11px] text-slate-100
        px-6 py-2
      "
    >
      <div className="w-full flex items-center">
        {/* linke „leere“ Spalte als Ausgleich */}
        <div className="flex-1" />

        {/* mittig zentrierter Claim */}
        <div className="flex-1 text-center">
          Compliance Software as a Service · LexTrack © {year} made by Swen Heinrich
        </div>

        {/* Version ganz rechts im Footer */}
        <div className="flex-1 text-right">
          Version v{APP_VERSION}
        </div>
      </div>
    </footer>
  );
}
