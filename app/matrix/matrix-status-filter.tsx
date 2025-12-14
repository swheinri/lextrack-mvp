// app/matrix/matrix-status-filter.tsx
'use client';

import React from 'react';
import type { ComplianceStatus } from './matrixstore';

type Props = {
  value: ComplianceStatus | 'all';
  onChange: (v: ComplianceStatus | 'all') => void;
  isDe: boolean;
};

function statusLabel(status: ComplianceStatus, isDe: boolean): string {
  if (isDe) {
    switch (status) {
      case 'not_applicable':
        return 'Nicht zutreffend';
      case 'not_fulfilled':
        return 'Nicht erfüllt';
      case 'compliant':
        return 'Compliance';
    }
  } else {
    switch (status) {
      case 'not_applicable':
        return 'Not applicable';
      case 'not_fulfilled':
        return 'Not fulfilled';
      case 'compliant':
        return 'Compliant';
    }
  }
}

export default function MatrixStatusFilter({
  value,
  onChange,
  isDe,
}: Props) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 text-[11px]">
      <span className="text-slate-500 font-medium uppercase tracking-wide mr-1">
        {isDe ? 'Filter Status' : 'Filter status'}
      </span>
      {(
        ['all', 'compliant', 'not_fulfilled', 'not_applicable'] as const
      ).map((s) => {
        const active = value === s;
        const label =
          s === 'all'
            ? isDe
              ? 'Alle'
              : 'All'
            : statusLabel(s as ComplianceStatus, isDe);

        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s as any)}
            className={[
              'rounded-full border px-2.5 py-1',
              active
                ? 'border-[#009A93] bg-[#009A93] text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
