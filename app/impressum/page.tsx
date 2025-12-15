// app/impressum/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { LegalFooter } from '../components/legal-footer';

export default function ImpressumPage() {
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
          {/* Headerzeile mit Zurück-Link */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold tracking-wide text-slate-900">
              Impressum
            </h1>
            <Link
              href="/login"
              className="text-xs font-medium text-teal-700 hover:text-teal-900"
            >
              Zurück zum Login
            </Link>
          </div>

          {/* Angaben gemäß § 5 TMG */}
          <section className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Angaben gemäß § 5 TMG
            </h2>
            <p>LexTrack – Compliance Suite (nicht öffentlich, Projekt in Entwicklung)</p>
            <p>Swen Heinrich</p>
            <p>Nibelungenstr.33</p>
            <p>65795, Hattersheim am Main, Deutschland</p>
          </section>

          {/* Kontakt */}
          <section className="mt-6 space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">Kontakt</h2>
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

          {/* Verantwortlich nach § 18 Abs. 2 MStV */}
          <section className="mt-6 space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>Swen Heinrich</p>
            <p>Nibelungenstr.33</p>
            <p>65795, Hattersheim am Main, Deutschland</p>
          </section>

          {/* Hosting */}
          <section className="mt-6 space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">Hosting</h2>
            <p>
              Diese Website wird technisch durch einen externen Dienstleister bereitgestellt
              (aktuell: Vercel Inc.). Die Verarbeitung personenbezogener Daten auf den
              Servern des Hosters erfolgt auf Grundlage eines Auftragsverarbeitungsvertrags
              und gemäß Art. 6 Abs. 1 lit. f DSGVO (betrieblich notwendige, sichere
              Bereitstellung des Online-Angebots).
            </p>
          </section>

          {/* Haftung für Inhalte */}
          <section className="mt-6 space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Haftung für Inhalte
            </h2>
            <p>
              Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Dennoch kann
              ich keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der
              Inhalte übernehmen. Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für
              eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
              Nach §§ 8 bis 10 TMG bin ich jedoch nicht verpflichtet, übermittelte oder
              gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
              forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
          </section>

          {/* Haftung für Links */}
          <section className="mt-6 space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Haftung für Links
            </h2>
            <p>
              Diese Website kann Links zu externen Websites Dritter enthalten, auf deren
              Inhalte ich keinen Einfluss habe. Für diese fremden Inhalte übernehme ich
              keine Gewähr. Für die Inhalte der verlinkten Seiten ist ausschließlich der
              jeweilige Anbieter oder Betreiber verantwortlich.
            </p>
          </section>

          {/* Urheberrecht */}
          <section className="mt-6 space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Urheberrecht
            </h2>
            <p>
              Die auf dieser Website erstellten Inhalte und Werke unterliegen dem deutschen
              Urheberrecht. Downloads und Kopien dieser Seite sind nur für den privaten,
              nicht kommerziellen Gebrauch gestattet. Eine weitergehende Nutzung bedarf der
              vorherigen schriftlichen Zustimmung des Rechteinhabers.
            </p>
          </section>
        </div>
      </div>

      {/* Footer-Navigation */}
      <LegalFooter />
    </div>
  );
}
