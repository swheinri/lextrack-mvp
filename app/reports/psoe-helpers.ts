// app/reports/psoe-helpers.ts
import type { LawRow } from '../register/registerstore';

/**
 * Punkt für das Radar-Chart:
 * label = Norm-Familie / Kategorie, value = Reifegrad 0..4
 */
export type NormRadarPoint = {
  label: string;
  value: number;
};

/**
 * Baut einfache PSOE-Reifegrad-Werte je Kategorie.
 * Aktuelle Logik: Anteil "aktiv" an (aktiv + erfasst), skaliert auf 0..4.
 * Das ist ein Platzhalter, bis wir echte PSOE-Scores je Paragraphen haben.
 */
export function buildNormRadarData(rows: LawRow[]): NormRadarPoint[] {
  const buckets = new Map<string, { aktiv: number; erfasst: number }>();

  for (const row of rows) {
    const status = row.status;
    if (status !== 'aktiv' && status !== 'erfasst') continue;

    const key = row.kategorie?.trim() || 'Unkategorisiert';
    const bucket = buckets.get(key) ?? { aktiv: 0, erfasst: 0 };

    if (status === 'aktiv') bucket.aktiv += 1;
    else bucket.erfasst += 1;

    buckets.set(key, bucket);
  }

  const points: NormRadarPoint[] = [];

  for (const [label, { aktiv, erfasst }] of buckets) {
    const total = aktiv + erfasst;
    if (!total) continue;

    const share = aktiv / total; // 0..1
    const value = parseFloat((share * 4).toFixed(1)); // 0..4
    points.push({ label, value });
  }

  // Sortiert nach Label, damit es stabil aussieht
  points.sort((a, b) => a.label.localeCompare(b.label));

  return points;
}