// app/settings/components/upcoming-card.tsx
'use client';

import React from 'react';

export function UpcomingCard({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <p className="text-xs text-slate-600">{subtitle}</p>
    </div>
  );
}