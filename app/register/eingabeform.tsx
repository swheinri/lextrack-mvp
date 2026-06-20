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

    requiredPrefix: 'Bitte fülle die Pflichtfelder aus:',
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

    requiredPrefix: 'Please fill the required fields:',
  },
} as const;

const label = 'text-xs font-semibold text-slate-700 mb-1';
const inputBase =
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

type MissingMap = {
  dokumentenart: boolean;
  kuerzel: boolean;
  bezeichnung: boolean;
  themenfeld: boolean;
};

function isBlank(v: unknown) {
  return !String(v ?? '').trim();
}

export default React.memo(function Eingabeform() {
  const { add } = useRegisterStore();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // refs für Auto-Scroll/Focus
  const docTypeRef = useRef<HTMLSelectElement>(null);
  const kuerzelRef = useRef<HTMLInputElement>(null);
  const bezeichnungRef = useRef<HTMLInputElement>(null);
  const themenfeldRef = useRef<HTMLSelectElement>(null);

  const { language } = useLanguage();
  const t = FIELD_TEXT[language];

  // controlled states (für präzise Validierung + Reset)
  const [docType, setDocType] = useState<Dokumentenart | ''>('');
  const [contractEnv, setContractEnv] = useState<Vertragsumfeld | ''>('');
  const [kuerzel, setKuerzel] = useState('');
  const [bezeichnung, setBezeichnung] = useState('');
  const [themenfeld, setThemenfeld] = useState('');

  const [missing, setMissing] = useState<MissingMap>({
    dokumentenart: false,
    kuerzel: false,
    bezeichnung: false,
    themenfeld: false,
  });
  const [errorText, setErrorText] = useState<string | null>(null);

  const pickPdf = () => fileRef.current?.click();

  const inputInvalid = (flag: boolean) =>
    [inputBase, flag ? 'border-rose-300 ring-4 ring-rose-200/40' : ''].join(' ');

  const focusFirstMissing = (m: MissingMap) => {
    const first =
      (m.dokumentenart && docTypeRef.current) ||
      (m.kuerzel && kuerzelRef.current) ||
      (m.bezeichnung && bezeichnungRef.current) ||
      (m.themenfeld && themenfeldRef.current);

    if (!first) return;

    // erst scrollen, dann fokussieren (verhindert „springt weg“-Gefühl)
    requestAnimationFrame(() => {
      try {
        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        // ignore
      }
      try {
        (first as any).focus?.();
      } catch {
        // ignore
      }
    });
  };

  const requiredLabels =
    language === 'de'
      ? {
          dokumentenart: 'Dokumentenart',
          kuerzel: 'Kürzel',
          bezeichnung: 'Bezeichnung',
          themenfeld: 'Themenfeld',
        }
      : {
          dokumentenart: 'Document type',
          kuerzel: 'Reference',
          bezeichnung: 'Title',
          themenfeld: 'Topic area',
        };

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    // Pflichtfelder prüfen (genau!)
    const nextMissing: MissingMap = {
      dokumentenart: isBlank(docType),
      kuerzel: isBlank(kuerzel),
      bezeichnung: isBlank(bezeichnung),
      themenfeld: isBlank(themenfeld),
    };

    const hasMissing = Object.values(nextMissing).some(Boolean);
    if (hasMissing) {
      setMissing(nextMissing);

      const list = (Object.keys(nextMissing) as Array<keyof MissingMap>)
        .filter((k) => nextMissing[k])
        .map((k) => requiredLabels[k]);

      setErrorText(`${t.requiredPrefix} ${list.join(', ')}.`);
      focusFirstMissing(nextMissing);
      return;
    }

    // ok → Fehler zurücksetzen
    setMissing({
      dokumentenart: false,
      kuerzel: false,
      bezeichnung: false,
      themenfeld: false,
    });
    setErrorText(null);

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

    const row: LawRow = {
      id: makeId(),

      dokumentenart: docType || undefined,
      vertragsumfeld: contractEnv || undefined,

      // legacy
      rechtsart: docType || undefined,

      kuerzel: kuerzel.trim(),
      bezeichnung: bezeichnung.trim(),
      themenfeld: themenfeld.trim(),

      publiziert: get('publiziert'),
      frist: get('frist'),
      relevanz: (get('relevanz') || undefined) as Relevanz | undefined,

      erfasserVorname,
      erfasserNachname,
      erfasserAbteilung,

      dokumentUrl: get('dokumentUrl') || undefined,

      // ✅ Status beim Anlegen immer "erfasst"
      status: 'erfasst',

      createdAt,
      history: [{ date: createdAt, user: creator, text: 'Angelegt' }],
    };

    if (pdf && pdf.size > 0) {
      row.dokumentFileName = pdf.name;
      try {
        row.dokumentFileHref = URL.createObjectURL(pdf);
      } catch {
        // noop
      }
    }

    add(row);

    // Reset
    e.currentTarget.reset();
    if (fileRef.current) fileRef.current.value = '';
    setDocType('');
    setContractEnv('');
    setKuerzel('');
    setBezeichnung('');
    setThemenfeld('');
  };

  return (
    <form ref={formRef} onSubmit={submit} className={`${box} p-4 sm:p-5`}>
      {/* Reihe 1 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <Field labelText={t.docTypeLabel} className="md:col-span-3">
          <select
            ref={docTypeRef}
            name="dokumentenart"
            className={inputInvalid(missing.dokumentenart)}
            value={docType}
            aria-invalid={missing.dokumentenart}
            onChange={(e) => {
              const v = e.target.value as Dokumentenart | '';
              setDocType(v);
              if (missing.dokumentenart && !isBlank(v)) {
                setMissing((p) => ({ ...p, dokumentenart: false }));
              }
            }}
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
          <input
            ref={kuerzelRef}
            name="kuerzel"
            className={inputInvalid(missing.kuerzel)}
            placeholder={t.refPlaceholder}
            value={kuerzel}
            aria-invalid={missing.kuerzel}
            onChange={(e) => {
              const v = e.target.value;
              setKuerzel(v);
              if (missing.kuerzel && !isBlank(v)) {
                setMissing((p) => ({ ...p, kuerzel: false }));
              }
            }}
          />
        </Field>

        <Field labelText={t.titleLabel} className="md:col-span-4">
          <input
            ref={bezeichnungRef}
            name="bezeichnung"
            className={inputInvalid(missing.bezeichnung)}
            placeholder={t.titlePlaceholder}
            value={bezeichnung}
            aria-invalid={missing.bezeichnung}
            onChange={(e) => {
              const v = e.target.value;
              setBezeichnung(v);
              if (missing.bezeichnung && !isBlank(v)) {
                setMissing((p) => ({ ...p, bezeichnung: false }));
              }
            }}
          />
        </Field>

        <Field labelText={t.topicLabel} className="md:col-span-2">
          <select
            ref={themenfeldRef}
            name="themenfeld"
            className={inputInvalid(missing.themenfeld)}
            value={themenfeld}
            aria-invalid={missing.themenfeld}
            onChange={(e) => {
              const v = e.target.value;
              setThemenfeld(v);
              if (missing.themenfeld && !isBlank(v)) {
                setMissing((p) => ({ ...p, themenfeld: false }));
              }
            }}
          >
            <option value="">{t.topicPlaceholder}</option>
            <option value="Sicherheit und Arbeitsschutz">{t.topicSafety}</option>
            <option value="Daten- und Informationssicherheit">{t.topicInfoSec}</option>
            <option value="Umweltschutz">{t.topicEnv}</option>
            <option value="Energiemanagement">{t.topicEnergy}</option>
            <option value="Zertifizierung">{t.topicCert}</option>
          </select>
        </Field>
      </div>

      {/* Reihe 2 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
        <Field labelText={t.firstNameLabel} className="md:col-span-2">
          <input name="vorname" className={inputBase} placeholder={t.firstNamePlaceholder} />
        </Field>

        <Field labelText={t.lastNameLabel} className="md:col-span-2">
          <input name="nachname" className={inputBase} placeholder={t.lastNamePlaceholder} />
        </Field>

        <Field labelText={t.deptLabel} className="md:col-span-3">
          <input name="abteilung" className={inputBase} placeholder={t.deptPlaceholder} />
        </Field>

        <Field labelText={t.contractEnvLabel} className="md:col-span-3">
          <select
            name="vertragsumfeld"
            className={inputBase}
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
          <select name="relevanz" className={inputBase} defaultValue="">
            <option value="">{t.relevanzPlaceholder}</option>
            <option value="Niedrig">{t.relLow}</option>
            <option value="Mittel">{t.relMedium}</option>
            <option value="Hoch">{t.relHigh}</option>
          </select>
        </Field>
      </div>

      {/* Reihe 3 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
        <Field labelText={t.docLabel} className="md:col-span-6">
          <input name="dokumentUrl" className={inputBase} placeholder={t.docPlaceholder} />
        </Field>

        <Field labelText={t.publishedLabel} className="md:col-span-3">
          <input type="date" name="publiziert" className={inputBase} />
        </Field>

        <Field labelText={t.dueLabel} className="md:col-span-3">
          <input type="date" name="frist" className={inputBase} />
        </Field>
      </div>

      {/* Fehlerbox */}
      {errorText && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {errorText}
        </div>
      )}

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