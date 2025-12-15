// app/datenschutz/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { LegalFooter } from '../components/legal-footer';

export default function DatenschutzPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-900">
      {/* Hintergrundbild */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/login-mountains.jpg')" }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-950/55" />

      {/* Content */}
      <div className="relative flex min-h-screen items-start justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-3xl bg-white/95 px-8 py-8 text-sm leading-relaxed text-slate-800 shadow-2xl ring-1 ring-slate-900/10 backdrop-blur">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold tracking-wide text-slate-900">
              Datenschutzerklärung
            </h1>
            <Link
              href="/login"
              className="text-xs font-medium text-teal-700 hover:text-teal-900"
            >
              Zurück zum Login
            </Link>
          </div>

          <section className="space-y-2">
            <p>
              Der Schutz deiner personenbezogenen Daten ist mir wichtig. Diese
              Website befindet sich in Entwicklung und wird derzeit ausschließlich
              zu Test- und Demonstrationszwecken genutzt.
            </p>
            <p>
              Personenbezogene Daten (z.&nbsp;B. Name, E-Mail-Adresse) werden nur
              verarbeitet, soweit dies für den technischen Betrieb oder zur
              Kontaktaufnahme erforderlich ist. Eine Weitergabe an Dritte findet
              nicht statt, außer wenn dies zur Bereitstellung des Hosting-Angebots
              (z.&nbsp;B. Vercel) technisch notwendig ist.
            </p>
          </section>

          <section className="mt-6 space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Server-Logfiles / technische Daten
            </h2>
            <p>
              Beim Aufruf dieser Website können durch den Hoster automatisch
              bestimmte technische Informationen (z.&nbsp;B. IP-Adresse in
              gekürzter Form, Browsertyp, Zugriffszeit) in sogenannten
              Server-Logfiles gespeichert werden. Diese Daten werden ausschließlich
              zur Sicherstellung des technischen Betriebs und zur Fehleranalyse
              genutzt und nicht dazu verwendet, dich als Person zu identifizieren.
            </p>
          </section>

          <section className="mt-6 space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Kontaktaufnahme
            </h2>
            <p>
              Wenn du mich per E-Mail kontaktierst, werden deine Angaben aus der
              Anfrage zwecks Bearbeitung der Anfrage und für den Fall von
              Anschlussfragen gespeichert. Diese Daten gebe ich nicht ohne deine
              Einwilligung weiter.
            </p>
          </section>

          <section className="mt-6 space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Deine Rechte
            </h2>
            <p>
              Du hast – im Rahmen der gesetzlichen Vorgaben – das Recht auf
              Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung
              deiner gespeicherten personenbezogenen Daten.
            </p>
          </section>

          <section className="mt-6 space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Verantwortlicher
            </h2>
            <p>Swen Heinrich</p>
            <p>Nibelungenstr.33</p>
            <p>65795 Hattersheim am Main, Deutschland</p>
            <p>
              E-Mail:{' '}
              <a
                href="mailto:[deine-email]@[deinedomain].de"
                className="text-teal-700 underline-offset-2 hover:underline"
              >
                Swen-Heinrich@outlook.de
              </a>
            </p>
          </section>
        </div>
      </div>

      <LegalFooter />
    </div>
  );
}
