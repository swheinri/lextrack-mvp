// app/client-root.tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Shell from './components/shell';

const PUBLIC_ROUTES = ['/login', '/impressum', '/datenschutz'];

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublic = pathname && PUBLIC_ROUTES.includes(pathname);

  // Auf Login / Impressum / Datenschutz: KEINE Shell
  // Auf allen anderen Routen: Shell anzeigen
  return isPublic ? <>{children}</> : <Shell>{children}</Shell>;
}
