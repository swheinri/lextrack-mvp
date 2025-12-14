// app/register/evaluationwizard.tsx
'use client';

import React, { useState } from 'react';
import type { LawRow, RiskMode } from './registerstore';

type Ergebnis = 'muss' | 'kann' | 'nicht_relevant';

export default function EvaluationWizard({
  mode,
  onCancel,
  onSubmit,
}: {
  mode: RiskMode;
  onCancel: () => void;
  onSubmit: (patch: Partial<LawRow>) => void;
}) {
  // gemeinsame Felder
  const [bewertungNotiz, setNotiz] = useState('');

  // Qualitativ (Matrix)
  const [pQual, setPQual] = useState(3);
  const [iQual, setIQual] = useState(3);

  // EMV
  const [pEmv, setPEmv] = useState(0.3);   // 0..1
  const [impactEmv, setImpactEmv] = useState(10000); // €
  const emv = Math.round(pEmv * impactEmv);

  // FMEA
  const [sev, setSev] = useState(5);
  const [occ, setOcc] = useState(5);
  const [det, setDet] = useState(5);
  const rpn = sev * occ * det;

  // BIA
  const [rto, setRto] = useState(24); // Stunden
  const [biaImpact, setBiaImpact] = useState<'niedrig'|'mittel'|'hoch'>('mittel');

  function autoResult(): Ergebnis {
    switch (mode) {
      case 'qualitativ': {
        const score = pQual * iQual;         // 1..25
        if (score >= 16) return 'muss';
        if (score >= 9)  return 'kann';
        return 'nicht_relevant';
      }
      case 'emv': {
        if (emv >= 20000) return 'muss';
        if (emv >= 5000)  return 'kann';
        return 'nicht_relevant';
      }
      case 'fmea': {
        if (rpn >= 200) return 'muss';
        if (rpn >= 100) return 'kann';
        return 'nicht_relevant';
      }
      case 'bia': {
        if (rto <= 8 || biaImpact === 'hoch') return 'muss';
        if (rto <= 24 || biaImpact === 'mittel') return 'kann';
        return 'nicht_relevant';
      }
      default:
        return 'kann';
    }
  }

  const bewertungErgebnis: Ergebnis = autoResult();

  function submit() {
    const patch: Partial<LawRow> = {
      workflowState: 'bewertet',
      bewertungErgebnis,
      // frei benennbare Notiz
      // (Feldname unten muss auch in registerstore.ts existieren)
      // wir nennen es "bewertungNotiz"
      // @ts-ignore - Feld ist in LawRow ergänzt
      bewertungNotiz,
      // optionale Resultate pro Engine
      ...(mode === 'qualitativ' && { riskMatrix: { p: pQual, i: iQual, score: pQual * iQual } }),
      ...(mode === 'emv'        && { emv: { p: pEmv, impact: impactEmv, emv } }),
      ...(mode === 'fmea'       && { fmea: { sev, occ, det, rpn } }),
      ...(mode === 'bia'        && { bia: { rto, impact: biaImpact } }),
    };
    onSubmit(patch);
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Bewertung – {mode.toUpperCase()}</h3>

          {mode === 'qualitativ' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">Wahrscheinlichkeit (1–5)
                <input type="number" min={1} max={5} value={pQual} onChange={(e)=>setPQual(+e.target.value)} className="mt-1 w-full border rounded p-2"/>
              </label>
              <label className="text-sm">Auswirkung (1–5)
                <input type="number" min={1} max={5} value={iQual} onChange={(e)=>setIQual(+e.target.value)} className="mt-1 w-full border rounded p-2"/>
              </label>
              <div className="col-span-2 text-sm text-slate-600">Score: {pQual * iQual}</div>
            </div>
          )}

          {mode === 'emv' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">Wahrscheinlichkeit (0–1)
                <input type="number" step="0.01" min={0} max={1} value={pEmv} onChange={(e)=>setPEmv(+e.target.value)} className="mt-1 w-full border rounded p-2"/>
              </label>
              <label className="text-sm">Finanzielle Auswirkung (€)
                <input type="number" step="100" value={impactEmv} onChange={(e)=>setImpactEmv(+e.target.value)} className="mt-1 w-full border rounded p-2"/>
              </label>
              <div className="col-span-2 text-sm text-slate-600">EMV: {emv.toLocaleString('de-DE')}</div>
            </div>
          )}

          {mode === 'fmea' && (
            <div className="grid grid-cols-3 gap-3">
              <label className="text-sm">Severity (1–10)
                <input type="number" min={1} max={10} value={sev} onChange={(e)=>setSev(+e.target.value)} className="mt-1 w-full border rounded p-2"/>
              </label>
              <label className="text-sm">Occurrence (1–10)
                <input type="number" min={1} max={10} value={occ} onChange={(e)=>setOcc(+e.target.value)} className="mt-1 w-full border rounded p-2"/>
              </label>
              <label className="text-sm">Detection (1–10)
                <input type="number" min={1} max={10} value={det} onChange={(e)=>setDet(+e.target.value)} className="mt-1 w-full border rounded p-2"/>
              </label>
              <div className="col-span-3 text-sm text-slate-600">RPN: {rpn}</div>
            </div>
          )}

          {mode === 'bia' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">RTO (Stunden)
                <input type="number" min={1} value={rto} onChange={(e)=>setRto(+e.target.value)} className="mt-1 w-full border rounded p-2"/>
              </label>
              <label className="text-sm">Impact
                <select value={biaImpact} onChange={(e)=>setBiaImpact(e.target.value as any)} className="mt-1 w-full border rounded p-2">
                  <option value="niedrig">niedrig</option>
                  <option value="mittel">mittel</option>
                  <option value="hoch">hoch</option>
                </select>
              </label>
            </div>
          )}

          <div className="mt-4">
            <label className="text-sm">Notiz
              <textarea value={bewertungNotiz} onChange={(e)=>setNotiz(e.target.value)} className="mt-1 w-full border rounded p-2" rows={3}/>
            </label>
          </div>

          <div className="mt-4 text-sm">
            Automatisches Ergebnis: <span className="font-medium">{bewertungErgebnis}</span>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button onClick={onCancel} className="rounded border px-4 py-2">Abbrechen</button>
            <button onClick={submit} className="rounded bg-[#009A93] text-white px-4 py-2">Bewertung speichern</button>
          </div>
        </div>
      </div>
    </div>
  );
}
