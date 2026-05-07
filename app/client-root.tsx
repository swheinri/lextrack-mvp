// app/client-root.tsx
'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Shell from '@/app/components/shell';

const NO_SHELL_PATHS = [
  '/login',
  '/forgot-password',
  '/set-password',
  '/impressum',
  '/datenschutz',
];

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';

  const hideShell = useMemo(() => {
    return NO_SHELL_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }, [pathname]);

  if (hideShell) return <>{children}</>;
  return <Shell>{children}</Shell>;
}