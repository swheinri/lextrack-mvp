// app/components/ui/sectionheader.tsx
'use client';

import React from 'react';

type Tab = {
  id: string;
  label: string;
};

type SectionHeaderProps = {
  /** Hauptüberschrift, z.B. "Register 2.0 – Interaktive Ansicht" */
  title: string;
  /** Untertitel / Beschreibung unter der Überschrift */
  subtitle?: string;
  /** Optional: Tabs rechts unter der Überschrift */
  tabs?: Tab[];
  /** Aktiver Tab */
  activeTabId?: string;
  /** Wird aufgerufen, wenn ein Tab geklickt wird */
  onTabChange?: (id: string) => void;
  /** Optional: Elemente ganz rechts (z.B. Icons, Buttons) */
  rightContent?: React.ReactNode;
};

export default function SectionHeader({
  title,
  subtitle,
  tabs,
  activeTabId,
  onTabChange,
  rightContent,
}: SectionHeaderProps) {
  return (
    <section className="rounded-xl bg-slate-50 border border-slate-200 shadow-sm px-4 py-3 sm:px-6 sm:py-4 mb-3">
      <div className="flex items-start justify-between gap-4">
        {/* Titel + Untertitel */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              {subtitle}
            </p>
          )}

          {/* Tabs unterhalb der Überschrift (links) */}
          {tabs && tabs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const active = tab.id === activeTabId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange?.(tab.id)}
                    className={`rounded-full border px-3 py-1 text-xs sm:text-[13px] transition
                      ${
                        active
                          ? 'bg-[#009A93] border-[#009A93] text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Rechte Seite: z.B. Drucker-Icon, Info-Icon usw. */}
        {rightContent && (
          <div className="flex items-center gap-2 shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    </section>
  );
}
