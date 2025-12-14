// app/infocenter-context.tsx

'use client';

import React from 'react';

/** Struktur der Inhalte, die im InfoCenter angezeigt werden können */
export type InfoData = {
  context: string; // z.B. 'register'
  title: string;
  description?: string;
  bullets?: string[];
  version?: string;       // z.B. '0.3.1'
  lastUpdated?: string;   // z.B. '2025-01-15'
  severity?: 'info' | 'warning' | 'alert';
};

type InfoCenterContextValue = {
  data: InfoData | null;
  setData: (d: InfoData | null) => void;
};

const InfoCenterContext = React.createContext<InfoCenterContextValue | null>(null);

export function InfoCenterProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<InfoData | null>(null);

  const value = React.useMemo(
    () => ({ data, setData }),
    [data]
  );

  return (
    <InfoCenterContext.Provider value={value}>
      {children}
    </InfoCenterContext.Provider>
  );
}

export function useInfoCenter() {
  const ctx = React.useContext(InfoCenterContext);
  if (!ctx) {
    throw new Error('useInfoCenter must be used within <InfoCenterProvider>');
  }
  return ctx;
}
