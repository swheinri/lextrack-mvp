// app/components/shell/index.tsx
'use client';

import React from 'react';
import Sidebar from './sidebar';
import Header from './header';
import Footer from './footer';
import { InfoCenterProvider } from '../../infocenter';
import { LanguageProvider } from '../i18n/language';
import { useTheme } from '../themecontext';

type ShellProps = {
  children: React.ReactNode;
};

export default function Shell({ children }: ShellProps) {
  const { theme } = useTheme();
  const isHighContrast = theme === 'high-contrast';

  return (
    <InfoCenterProvider>
      <LanguageProvider>
        {/* Outer Shell – bleibt im Corporate Design, kein High-Contrast hier */}
        <div className="flex h-screen w-full overflow-hidden bg-[#021633]">
          {/* Sidebar bleibt fix im Corporate Design */}
          <Sidebar />

          {/* Hauptbereich */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Kopfzeile */}
            <Header />

            {/* Content-Bereich: hier greift High-Contrast */}
            <main
              className={[
                'flex-1 overflow-y-auto p-4 sm:p-6 shadow-inner rounded-tl-2xl',
                isHighContrast
                  ? 'bg-black text-white'
                  : 'bg-slate-50 text-slate-800',
              ].join(' ')}
              data-lextrack-theme="content"
            >
              {children}
            </main>

            {/* Footer bleibt im Corporate Design */}
            <Footer />
          </div>
        </div>
      </LanguageProvider>
    </InfoCenterProvider>
  );
}
