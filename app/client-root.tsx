// app/client-root.tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

// ⬇️ Falls du hier deine Shell importierst, lass das wie es ist.
// import ShellWrapper from '@/app/components/shell/shell-wrapper';

const NO_SHELL_PATHS = [
  '/login',
  '/forgot-password',
  '/set-password',
  '/impressum',
  '/datenschutz',
];

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideShell =
    !!pathname &&
    NO_SHELL_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // ✅ Auth-/Public-Seiten ohne Sidebar/Header
  if (hideShell) {
    return <>{children}</>;
  }

  // ✅ Rest der App wie gehabt MIT Shell
  // ⬇️ HIER lässt du deine bestehende Shell-Struktur unverändert
  return (
    <>
      {/* Beispiel:
      <ShellWrapper>
        {children}
      </ShellWrapper>
      */}

      {children /* <- ERSETZEN durch deine bestehende Shell-Wrapper Struktur */}
    </>
  );
}
