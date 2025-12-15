'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Shell from './components/shell'; // Pfad ggf. anpassen

// Alle Routen, auf denen KEIN Shell gezeigt werden soll
const NO_SHELL_PATHS = ['/login'];

export function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideShell = NO_SHELL_PATHS.some((base) =>
    pathname?.startsWith(base),
  );

  if (hideShell) {
    // z.B. Login, Onboarding, Public Landing Pages …
    return <>{children}</>;
  }

  // Normale App-Ansichten mit Sidebar + Header
  return <Shell>{children}</Shell>;
}
