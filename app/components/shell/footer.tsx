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
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
        {/* Links */}
        <div className="min-w-0 flex-1" />

        {/* Mitte */}
        <div className="min-w-0 flex-1 text-center">
          <span className="block truncate">
            Compliance Software as a Service · LexTrack © {year} · made by Swen Heinrich
          </span>
        </div>

        {/* Rechts */}
        <div className="min-w-0 flex-1 text-right">
          <span className="hidden sm:inline">Version v{APP_VERSION}</span>
          <span className="sm:hidden">v{APP_VERSION}</span>
        </div>
      </div>
    </footer>
  );
}