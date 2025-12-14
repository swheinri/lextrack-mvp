// app/register/register-stats.ts
import type { LawRow, Status } from './registerstore';

export type StatusCounts = {
  gesamt: number;
  offen: number;
  aktiv: number;
  obsolet: number;
  archiviert: number;
  ohneStatus: number;
};

/**
 * Hilfsfunktion: robustes Parsen eines Datumsstrings.
 * Gibt ein auf 00:00 Uhr gesetztes Date-Objekt zurück oder null.
 */
export function parseDate(value?: string | null): Date | null {
  if (!value) return null;

  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  // nur Datum vergleichen, Zeit auf Mitternacht setzen
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Zählt die Dokumente nach Status durch.
 * Nutzt die Status-Typdefinition aus dem Registerstore.
 */
export function computeStatusCounts(rows: LawRow[]): StatusCounts {
  let offen = 0;
  let aktiv = 0;
  let obsolet = 0;
  let archiviert = 0;
  let ohneStatus = 0;

  for (const r of rows) {
    const s = r.status as Status | undefined;

    switch (s) {
      case 'offen':
        offen++;
        break;
      case 'aktiv':
        aktiv++;
        break;
      case 'obsolet':
        obsolet++;
        break;
      case 'archiviert':
        archiviert++;
        break;
      default:
        // alles, was keinen gültigen Status hat
        ohneStatus++;
        break;
    }
  }

  return {
    gesamt: rows.length,
    offen,
    aktiv,
    obsolet,
    archiviert,
    ohneStatus,
  };
}

export type DeadlineStats = {
  mitFrist: number;
  faelligIn30Tagen: number;
  ueberfaellig: number;
};

/**
 * Ermittelt Frist-Kennzahlen:
 *  - wie viele Einträge haben überhaupt eine Frist,
 *  - wie viele sind in den nächsten 30 Tagen fällig,
 *  - wie viele sind bereits überfällig.
 */
export function computeDeadlineStats(rows: LawRow[]): DeadlineStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);

  let mitFrist = 0;
  let faelligIn30Tagen = 0;
  let ueberfaellig = 0;

  for (const r of rows) {
    const d = parseDate(r.frist);
    if (!d) continue;

    mitFrist++;

    if (d < today) {
      ueberfaellig++;
    } else if (d <= in30) {
      faelligIn30Tagen++;
    }
  }

  return { mitFrist, faelligIn30Tagen, ueberfaellig };
}
