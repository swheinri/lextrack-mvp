// app/components/shell/footer.tsx
'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer
      className="
        bg-gradient-to-r from-[#021633] to-[#009A93]
        text-[11px] text-slate-100
        px-6 py-2
        flex justify-center
      "
    >
      <div className="w-full max-w-7xl flex justify-center">
        <span>Compliance Software as a Service · LexTrack © 2025 made by Swen Heinrich</span>
        
      </div>
    </footer>
  );
}
