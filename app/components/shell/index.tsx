// app/components/shell/index.tsx
'use client';

import React from 'react';
import Sidebar from './sidebar';
import Header from './header';
import Footer from './footer';
import { InfoCenterProvider } from '../../infocenter';
import { LanguageProvider } from '../i18n/language';
import { useTheme } from '../themecontext';

type ShellProps = { children: React.ReactNode };

export default function Shell({ children }: ShellProps) {
  const { theme } = useTheme();
  const isHighContrast = theme === 'high-contrast';

  return (
    <InfoCenterProvider>
      <LanguageProvider>
        <div className="flex min-h-screen w-full overflow-hidden bg-[#021633]">
          <Sidebar />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0">
              <Header />
            </div>

            <main
              className={[
                'min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 shadow-inner rounded-tl-2xl',
                isHighContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-800',
              ].join(' ')}
              data-lextrack-theme="content"
            >
              {children}
            </main>

            <div className="shrink-0">
              <Footer />
            </div>
          </div>
        </div>
      </LanguageProvider>
    </InfoCenterProvider>
  );
}