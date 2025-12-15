// app/components/legal-footer.tsx
import Link from 'next/link';
import React from 'react';

export function LegalFooter() {
  return (
    <footer className="pointer-events-auto fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4">
      <div className="inline-flex items-center gap-3 rounded-full bg-slate-950/85 px-4 py-2 text-[11px] text-slate-100 shadow-lg ring-1 ring-slate-700/70 backdrop-blur">
        <span>LexTrack © 2025 · made by Swen Heinrich</span>

        <span className="h-3 w-px bg-slate-600" />

        <Link href="/impressum" className="hover:text-teal-300">
          Impressum
        </Link>

        <span className="h-3 w-px bg-slate-600" />

        <Link href="/datenschutz" className="hover:text-teal-300">
          Datenschutz
        </Link>
      </div>
    </footer>
  );
}
