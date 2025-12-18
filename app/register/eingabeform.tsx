// app/register/eingabeform.tsx
'use client';

import React, { useRef, useState } from 'react';
import {
  useRegisterStore,
  Relevanz,
  makeId,
  Dokumentenart,
  Vertragsumfeld,
  LawRow,
} from './registerstore';
import { useLanguage } from '../components/i18n/language';

/* --------------------------------------------------
   Kopfbereich-Texte (für Überschrift & Subline)
   -------------------------------------------------- */
export const FORM_TEXT = {
  de: {
    heading: 'Datenerfassung',
    subline:
      'Erfasse hier neue Gesetze, Richtlinien oder interne Vorgaben für das Register.',
  },
  en: {
    heading: 'Data entry',
    subline:
      'Use this form to record new laws, guidelines or internal requirements for the register.',
  },
} as const;

/* --------------------------------------------------
   Feldtexte & Buttontexte
   -------------------------------------------------- */
const FIELD_TEXT = {
  de: {
    docTypeLabel: 'Dokumentenart',
    docTypePlaceholder: '— Dokumentenart wählen —',

    contractEnvLabel: 'Vertragsumfeld',
    contractEnvPlaceholder: '— Vertragsumfeld wählen —',
    contractEnvB2B: 'B2B – Geschäftskunden',
    contractEnvB2C: 'B2C – Privatkunden',
    contractEnvB2G: 'B2G – öffentliche Hand',
    contractEnvInternal: 'Intern – konzernintern',

    refLabel: 'Kürzel',
    refPlaceholder: '2014/95/EU …',

    titleLabel: 'Bezeichnung',
    titlePlaceholder: 'Kurztitel',

    topicLabel: 'Themenfeld',
    topicPlaceholder: '— Themenfeld wählen —',
    topicSafety: 'Sicherheit und Arbeitsschutz',
    topicInfoSec: 'Daten- und Informationssicherheit',
    topicEnv: 'Umweltschutz',
    topicEnergy: 'Energiemanagement',
    topicCert: 'Zertifizierung',

    firstNameLabel: 'Vorname',
    firstNamePlaceholder: 'Vorname',
    lastNameLabel: 'Nachname',
    lastNamePlaceholder: 'Nachname',
    deptLabel: 'Abteilung',
    deptPlaceholder: 'Team / Abteilung …',

    relevanzLabel: 'Relevanz',
    relevanzPlaceholder: '— Relevanz wählen —',
    relLow: 'Niedrig',
    relMedium: 'Mittel',
    relHigh: 'Hoch',

    docLabel: 'Dokument',
    docPlaceholder: 'URL oder Quelle',
    publishedLabel: 'Publiziert',
    dueLabel: 'Frist',

    attachButton: 'Rechtsdokument anfügen',
    attachHint: 'PDF optional, max. 2 MB.',
    submitButton: 'Ins Register übernehmen',
  },
  en: {
    docTypeLabel: 'Document type',
    docTypePlaceholder: '— Select document type —',

    contractEnvLabel: 'Contract context',
    contractEnvPlaceholder: '— Select contract context —',
    contractEnvB2B: 'B2B – business customers',
    contractEnvB2C: 'B2C – consumers',
    contractEnvB2G: 'B2G – public sector',
    contractEnvInternal: 'Internal – intra-group',

    refLabel: 'Reference',
    refPlaceholder: '2014/95/EU …',

    titleLabel: 'Title',
    titlePlaceholder: 'Short title',

    topicLabel: 'Topic area',
    topicPlaceholder: '— Select topic —',
    topicSafety: 'Safety and occupational health',
    topicInfoSec: 'Data and information security',
    topicEnv: 'Environmental protection',
    topicEnergy: 'Energy management',
    topicCert: 'Certification',

    firstNameLabel: 'First name',
    firstNamePlaceholder: 'First name',
    lastNameLabel: 'Last name',
    lastNamePlaceholder: 'Last name',
    deptLabel: 'Department / team',
    deptPlaceholder: 'Team / department …',

    relevanzLabel: 'Relevance',
    relevanzPlaceholder: '— Select relevance —',
    relLow: 'Low',
    relMedium: 'Medium',
    relHigh: 'High',

    docLabel: 'Document',
    docPlaceholder: 'URL or source',
    publishedLabel: 'Published',
    dueLabel: 'Due date',

    attachButton: 'Attach legal document',
    attachHint: 'PDF optional, max. 2 MB.',
    submitButton: 'Add to register',
  },
} as const;

const label = 'text-xs font-semibold text-slate-700 mb-1';
const input =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 outline-none transition duration-200 hover:border-slate-300 focus:border-[#009A93] focus:ring-4 focus:ring-[#009A93]/20';
const box = 'bg-white rounded-xl shadow-sm ring-1 ring-slate-200';
const btn =
  'inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition';
const btnPrimary = `${btn} bg-[#14295f] text-white hover:brightness-110`;
const btnAttach = `${btn} bg-[#009A93] text-white hover:brightness-110`;

function Field({
  labelText,
  children,
  className = '',
}: {
  labelText: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className={label}>{labelText}</label>
      {children}
    </div>
  );
}

export default React.memo(function Eingabeform() {
  const { add } = useRegisterStore();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const t = FIELD_TEXT[language];

  const [docType, setDocType] = useState<Dokumentenart | ''>('');
  const [contractEnv, setContractEnv] = useState<Vertragsumfeld | ''>('');

  const pickPdf = () => fileRef.current?.click();

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (name: string) => (fd.get(name)?.toString().trim() ?? '');

    const pdf = fd.get('pdfFile') as File | null;

    const createdAt = new Date().toISOString();
    const erfasserVorname = get('vorname') || undefined;
    const erfasserNachname = get('nachname') || undefined;
    const erfasserAbteilung = get('abteilung') || undefined;

    const creator =
      [erfasserVorname ?? '', erfasserNachname ?? '']
        .filter(Boolean)
        .join(' ') || 'System';

    const dokumentenart = (get('dokumentenart') ||
      undefined) as Dokumentenart | undefined;
    const vertragsumfeld = (get('vertragsumfeld') ||
      undefined) as Vertragsumfeld | undefined;

    const row: LawRow = {
      id: makeId(),
      dokumentenart,
      vertragsumfeld,

      kuerzel: get('kuerzel'),
      bezeichnung: get('bezeichnung'),
      themenfeld: get('themenfeld'),

      publiziert: get('publiziert'),
      frist: get('frist'),
      relevanz: (get('relevanz') || undefined) as Relevanz | undefined,

      // Erfassung durch
      erfasserVorname,
      erfasserNachname,
      erfasserAbteilung,

      // Quelle / URL
      dokumentUrl: get('dokumentUrl') || undefined,

      // Zeitstempel + Historie
      createdAt,
      history: [
        {
          date: createdAt,
          user: creator,
          text: 'Angelegt',
        },
      ],
    };

    // PDF anhängen
    if (pdf && pdf.size > 0) {
      row.dokumentFileName = pdf.name;
      try {
        row.dokumentFileHref = URL.createObjectURL(pdf);
      } catch {
        // noop
      }
    }

    // Minimalbedingung: irgendein Basisfeld gesetzt
    if (row.dokumentenart || row.kuerzel || row.bezeichnung || row.themenfeld) {
      add(row);
      e.currentTarget.reset();
      if (fileRef.current) fileRef.current.value = '';
      setDocType('');
      setContractEnv('');
    }
  };

  return (
    <form ref={formRef} onSubmit={submit} className={`${box} p-4 sm:p-5`}>
      {/* Reihe 1: Dokumentenart, Kürzel, Bezeichnung, Themenfeld */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <Field labelText={t.docTypeLabel} className="md:col-span-3">
          <select
            name="dokumentenart"
            className={input}
            value={docType}
            onChange={(e) => setDocType(e.target.value as Dokumentenart | '')}
          >
            <option value="">{t.docTypePlaceholder}</option>
            <option value="Verordnung">Verordnung</option>
            <option value="Gesetz">Gesetz</option>
            <option value="Norm">Norm</option>
            <option value="Vorschrift">Vorschrift</option>
            <option value="Vertrag">Vertrag</option>
            <option value="Richtlinie">Richtlinie</option>
            <option value="Sonstige">Sonstige</option>
          </select>
        </Field>

        <Field labelText={t.refLabel} className="md:col-span-3">
          <input name="kuerzel" className={input} placeholder={t.refPlaceholder} />
        </Field>

        <Field labelText={t.titleLabel} className="md:col-span-4">
          <input
            name="bezeichnung"
            className={input}
            placeholder={t.titlePlaceholder}
          />
        </Field>

        <Field labelText={t.topicLabel} className="md:col-span-2">
          <select name="themenfeld" className={input} defaultValue="">
            <option value="">{t.topicPlaceholder}</option>
            <option value="Sicherheit und Arbeitsschutz">{t.topicSafety}</option>
            <option value="Daten- und Informationssicherheit">{t.topicInfoSec}</option>
            <option value="Umweltschutz">{t.topicEnv}</option>
            <option value="Energiemanagement">{t.topicEnergy}</option>
            <option value="Zertifizierung">{t.topicCert}</option>
          </select>
        </Field>
      </div>

      {/* Reihe 2: Person, Abteilung, Vertragsumfeld, Relevanz */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
        <Field labelText={t.firstNameLabel} className="md:col-span-2">
          <input
            name="vorname"
            className={input}
            placeholder={t.firstNamePlaceholder}
          />
        </Field>

        <Field labelText={t.lastNameLabel} className="md:col-span-2">
          <input
            name="nachname"
            className={input}
            placeholder={t.lastNamePlaceholder}
          />
        </Field>

        <Field labelText={t.deptLabel} className="md:col-span-3">
          <input
            name="abteilung"
            className={input}
            placeholder={t.deptPlaceholder}
          />
        </Field>

        <Field labelText={t.contractEnvLabel} className="md:col-span-3">
          <select
            name="vertragsumfeld"
            className={input}
            value={contractEnv}
            onChange={(e) => setContractEnv(e.target.value as Vertragsumfeld | '')}
          >
            <option value="">{t.contractEnvPlaceholder}</option>
            <option value="B2B">{t.contractEnvB2B}</option>
            <option value="B2C">{t.contractEnvB2C}</option>
            <option value="B2G">{t.contractEnvB2G}</option>
            <option value="Intern">{t.contractEnvInternal}</option>
          </select>
        </Field>

        <Field labelText={t.relevanzLabel} className="md:col-span-2">
          <select name="relevanz" className={input} defaultValue="">
            <option value="">{t.relevanzPlaceholder}</option>
            <option value="Niedrig">{t.relLow}</option>
            <option value="Mittel">{t.relMedium}</option>
            <option value="Hoch">{t.relHigh}</option>
          </select>
        </Field>
      </div>

      {/* Reihe 3: Dokument / Publiziert / Frist */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
        <Field labelText={t.docLabel} className="md:col-span-6">
          <input name="dokumentUrl" className={input} placeholder={t.docPlaceholder} />
        </Field>

        <Field labelText={t.publishedLabel} className="md:col-span-3">
          <input type="date" name="publiziert" className={input} />
        </Field>

        <Field labelText={t.dueLabel} className="md:col-span-3">
          <input type="date" name="frist" className={input} />
        </Field>
      </div>

      {/* Aktionen */}
      <div className="flex items-end gap-4 mt-4">
        <div className="relative">
          <button type="button" className={btnAttach} onClick={pickPdf}>
            {t.attachButton}
          </button>
          <span className="absolute left-0 top-full mt-1 text-xs text-slate-500">
            {t.attachHint}
          </span>
        </div>

        <button type="submit" className={btnPrimary}>
          {t.submitButton}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        name="pdfFile"
      />
    </form>
  );
});
