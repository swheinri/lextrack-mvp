// app/register/ui.tsx
'use client';

import * as React from 'react';

/* ---------- Feld-Wrapper ---------- */
export function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

/* ---------- Akkordeon-Header ---------- */
export function AccordionHeader({
  title,
  isOpen,
  onToggle,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left px-4 py-2 bg-[#14295f] text-white font-semibold rounded-md flex items-center justify-between"
    >
      <span>{title}</span>
      <span className="ml-4 text-white/80">{isOpen ? '–' : '+'}</span>
    </button>
  );
}
