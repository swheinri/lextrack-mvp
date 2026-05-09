// app/set-password/page.tsx
import React, { Suspense } from 'react';
import SetPasswordClient from './set-password-client';

export const dynamic = 'force-dynamic';

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/95 text-slate-900 p-6 shadow-2xl">
        <Suspense
          fallback={
            <div className="text-sm text-slate-600">Lade Passwort-Reset…</div>
          }
        >
          <SetPasswordClient />
        </Suspense>
      </div>
    </div>
  );
}