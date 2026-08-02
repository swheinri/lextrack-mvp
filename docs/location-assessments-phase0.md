# LexTrack - Phase 0: Standortbezogene Bewertung & Compliance Matrix

Stand: 2026-08-02
Branch: feature/location-assessments-phase0

---

## 1. Ziel von Phase 0

Ziel dieser Phase ist die fachliche und technische Grundlage fuer eine standortbezogene Bewertungslogik in LexTrack.

Ein zentral im Kataster erfasstes Dokument soll kuenftig einem oder mehreren Standorten zugewiesen werden koennen. Jeder Standort erhaelt einen eigenen Bearbeitungskontext mit eigener Bewertung und eigener Compliance Matrix.

Die zentrale Leitregel lautet:

> Ein Standort darf nur Dokumente, Bewertungen und Compliance Matrizen sehen oder bearbeiten, die diesem Standort zugewiesen wurden.

Beispiel:

```txt
Dokument CSRD
- Zuweisung FRA
  - Bewertung FRA
  - Compliance Matrix FRA
- Zuweisung MUC
  - Bewertung MUC
  - Compliance Matrix MUC
- Zuweisung BER
  - Bewertung BER
  - Compliance Matrix BER
```

Nicht mehr:

```txt
1 Dokument = 1 globale Compliance Matrix
```

Sondern:

```txt
1 Dokument = mehrere standortbezogene Bearbeitungskontexte
```

---

## 2. Ist-Befund

### 2.1 Prisma / Datenbank

Aktuell existieren in Prisma bereits Organisations- und Benutzerobjekte:

```txt
Location
Department
Team
Person
Role
User
AuthToken
```

Die Organisationsstruktur ist bereits vorbereitet:

```txt
Location
- Department
  - Team
    - Person
      - User
```

Damit kann die organisatorische Heimat einer Person grundsaetzlich ueber diese Kette abgeleitet werden:

```txt
Person -> Team -> Department -> Location
```

### 2.2 Kataster

Der Kataster laeuft aktuell noch nicht ueber Prisma, sondern ueber einen Client-Store mit LocalStorage.

Aktuelle technische Struktur:

```txt
LawRow[]
localStorage key: lextrack_register_rows_v1
useRegisterStore()
```

Die Katasterdaten sind damit aktuell browserlokal und nicht mehrbenutzerfaehig.

### 2.3 Compliance Matrix

Die Compliance Matrix laeuft aktuell ebenfalls ueber einen Client-Store mit Persistenz im Browser.

Aktuelle technische Struktur:

```txt
MatrixDocument[]
localStorage / zustand persist
persist name: lextrack_matrix_v4
```

Die Matrix haengt aktuell direkt am Katastereintrag:

```txt
MatrixDocument.lawId -> LawRow.id
```

Damit gilt aktuell fachlich:

```txt
1 Kataster-Dokument -> 1 globale Compliance Matrix
```

Das ist fuer die kuenftige Standorttrennung nicht ausreichend.

### 2.4 Auth / Session

Die aktuelle Session enthaelt im Wesentlichen:

```txt
uid
email
role
```

Standort, Team, Abteilung oder erlaubte Standort-Scopes sind aktuell nicht Teil des Session Tokens.

Daraus folgt:

```txt
Die Organisation ist im Directory vorhanden.
Die API-Schutzlogik kennt aktuell aber nur User und Rolle.
```

---

## 3. Zielarchitektur

Die Zielarchitektur trennt vier Ebenen:

```txt
RegisterDocument
= zentraler Katastereintrag

DocumentLocationAssignment
= Dokument wurde einem Standort zur Bewertung zugewiesen

LocationAssessment
= Bewertung des Dokuments durch den jeweiligen Standort

ComplianceMatrix
= Compliance Matrix fuer genau diese Standort-Zuweisung
```

Zielmodell:

```txt
RegisterDocument
- DocumentLocationAssignment FRA
  - LocationAssessment FRA
  - ComplianceMatrix FRA

RegisterDocument
- DocumentLocationAssignment MUC
  - LocationAssessment MUC
  - ComplianceMatrix MUC
```

Die Matrix haengt kuenftig nicht mehr direkt an einem Dokument, sondern an einer Standort-Zuweisung:

```txt
ComplianceMatrix.assignmentId -> DocumentLocationAssignment.id
```

Damit ist technisch eindeutig:

```txt
Diese Matrix gehoert zu diesem Dokument fuer diesen Standort.
```

---

## 4. Rollen- und Sichtmodell

### 4.1 Grundrollen

Vorgesehene Rollenlogik:

```txt
System Admin
- sieht alles
- verwaltet Struktur, Personen, Rollen und technische Grundlagen
- darf technische Korrekturen durchfuehren

Central Governance / Compliance
- sieht alle zentralen Kataster-Dokumente
- darf Dokumente Standorten zuweisen
- sieht aggregierte Ruecklaeufe
- darf je nach Berechtigung Detailbewertungen sehen

Location Responsible
- sieht nur Zuweisungen des eigenen Standort-Scopes
- darf eigene Standortbewertungen abschliessen
- darf eigene Compliance Matrizen bearbeiten

Location Contributor
- sieht nur Zuweisungen des eigenen Standort-Scopes
- darf Bewertungen vorbereiten oder kommentieren
- darf Bewertungen nicht abschliessen

Reader
- sieht nur freigegebene Inhalte im eigenen Scope
```

### 4.2 Zentrale Schutzregel

```txt
FRA darf keine MUC-Bewertung lesen, bearbeiten oder ueber API abrufen.
```

Diese Trennung darf nicht nur im Frontend erfolgen. Sie muss in Backend, API und Datenmodell abgesichert werden.

---

## 5. Standortberechtigungen

Die organisatorische Heimat einer Person reicht fuer Zugriffsschutz nicht aus.

Beispiel:

```txt
Eine Person kann organisatorisch in FRA sitzen,
aber fachlich auch MUC oder BER betreuen.
```

Daher wird zusaetzlich ein explizites Standort-Berechtigungsmodell benoetigt.

Vorgeschlagenes Modell:

```txt
UserLocationAccess
- userId
- locationId
- accessLevel
```

Moegliche accessLevel:

```txt
READ
- Standortdaten lesen

CONTRIBUTE
- Bewertungen vorbereiten / kommentieren

RESPONSIBLE
- Bewertungen abschliessen
- Standort-Matrix bearbeiten

ADMIN
- Standortzugriff verwalten / Sonderfaelle
```

Trennung:

```txt
Organisatorische Heimat
= wo gehoert die Person strukturell hin?

Fachlicher Zugriff
= welche Standorte darf der User sehen oder bearbeiten?
```

---

## 6. Backend- und API-Regeln

### 6.1 Allgemeine Regel

Jede API, die Dokumente, Standortbewertungen oder Matrizen liefert, muss serverseitig pruefen:

```txt
Darf dieser User diese locationId sehen?
Darf dieser User diese assignmentId bearbeiten?
Darf dieser User diese Matrix oeffnen?
```

### 6.2 Zugriffsmuster

```txt
Wenn Rolle zentral:
  Zugriff auf alle Standorte moeglich

Wenn Rolle standortbezogen:
  Zugriff nur auf locationIds aus UserLocationAccess

Wenn kein Zugriff:
  403 Forbidden
```

### 6.3 API-Zielstruktur

Vorgesehene API-Gruppen:

```txt
/api/register-documents
- zentrale Kataster-Dokumente verwalten

/api/document-location-assignments
- Dokumente Standorten zuweisen
- Zuweisungen je Standort laden

/api/location-assessments
- Standortbewertungen lesen / bearbeiten / abschliessen

/api/compliance-matrices
- Matrix fuer eine konkrete Assignment erstellen / bearbeiten

/api/dashboard
- zentrale oder standortbezogene KPIs liefern
```

---

## 7. Frontend-Zielbild

### 7.1 Kataster

Im Kataster soll kuenftig je Dokument sichtbar sein:

```txt
- welchen Standorten wurde das Dokument zugewiesen?
- welcher Standort ist offen?
- welcher Standort ist in Bewertung?
- welcher Standort hat abgeschlossen?
- wo ist die Frist ueberschritten?
```

Neue Aktion:

```txt
Standorte zuweisen
```

### 7.2 Standort-Arbeitskorb

Standortnutzer erhalten eine eigene Sicht:

```txt
Meine Standortbewertungen
- offen
- in Bearbeitung
- ueberfaellig
- abgeschlossen
- Massnahmen erforderlich
```

### 7.3 Compliance Matrix

Die Seite "Compliance Matrix" darf kuenftig nicht mehr alle Kataster-Dokumente anbieten.

Stattdessen:

```txt
Standortnutzer FRA:
- sieht nur Dokument-Zuweisungen fuer FRA
- kann nur FRA-Matrizen erstellen oder bearbeiten

Standortnutzer MUC:
- sieht nur Dokument-Zuweisungen fuer MUC
- kann nur MUC-Matrizen erstellen oder bearbeiten

Zentrale Rolle:
- sieht Dokument-Zuweisungs-Kombinationen, z. B.
  CSRD - FRA
  CSRD - MUC
  CSRD - BER
```

---

## 8. Dashboard-Zielbild

### 8.1 Zentrale Sicht

```txt
Dokumente gesamt
Dokumente ohne Standortzuweisung
Zugewiesene Standortbewertungen
Offene Bewertungen
In Bewertung
Abgeschlossene Bewertungen
Ueberfaellige Bewertungen
Massnahmen erforderlich

Ruecklauf nach Standort:
FRA  4 offen / 12 abgeschlossen / 1 ueberfaellig
MUC  8 offen / 9 abgeschlossen / 3 ueberfaellig
BER  2 offen / 6 abgeschlossen / 0 ueberfaellig
```

### 8.2 Standortsicht

```txt
Meine offenen Bewertungen
Meine ueberfaelligen Bewertungen
Meine abgeschlossenen Bewertungen
Meine Massnahmen
Meine Compliance Matrizen
```

---

## 9. Migrationsstrategie

### 9.1 Grundsatz

Bestehende LocalStorage-Daten werden nicht blind automatisch in alle Standorte verteilt.

Grund:

```txt
Eine automatische Verteilung wuerde sofort kuenstliche offene Aufgaben erzeugen.
```

### 9.2 Empfohlene Strategie

```txt
1. Neue Prisma-Modelle einfuehren.
2. Neue API-Schicht bauen.
3. Neue Standortbewertungslogik parallel vorbereiten.
4. Bestehende LocalStorage-Logik zunaechst nicht zerstoeren.
5. Spaeter kontrollierten Import / Migration anbieten.
```

### 9.3 Bestehende Matrizen

Empfohlene Entscheidung:

```txt
Wenn bisher keine produktiv relevanten Matrizen online genutzt werden:
  sauber neu mit assignmentId starten.

Wenn produktive Matrizen existieren:
  Legacy-Matrizen markieren und spaeter manuell zuordnen.
```

---

## 10. Vorgeschlagene Prisma-Zielmodelle

Erster fachlicher Entwurf, noch nicht final:

```prisma
model RegisterDocument {
  id            String @id @default(cuid())
  kuerzel       String?
  bezeichnung   String
  dokumentenart String?
  themenfeld    String?
  status        RegisterDocumentStatus @default(CAPTURED)

  assignments DocumentLocationAssignment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([kuerzel])
}

model DocumentLocationAssignment {
  id String @id @default(cuid())

  documentId String
  document   RegisterDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  locationId String
  location   Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  status AssignmentStatus @default(ASSIGNED)
  dueDate DateTime?

  assignedByUserId String?
  assignedByUser   User? @relation(fields: [assignedByUserId], references: [id], onDelete: SetNull)

  assessment LocationAssessment?
  matrix     ComplianceMatrix?

  assignedAt DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([documentId, locationId])
  @@index([locationId, status])
  @@index([documentId])
}

model LocationAssessment {
  id String @id @default(cuid())

  assignmentId String @unique
  assignment   DocumentLocationAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  relevance AssessmentRelevance @default(UNASSESSED)
  comment String?
  actionRequired Boolean @default(false)
  actionSummary String?

  assessedByUserId String?
  assessedByUser   User? @relation(fields: [assessedByUserId], references: [id], onDelete: SetNull)

  assessedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ComplianceMatrix {
  id String @id @default(cuid())

  assignmentId String @unique
  assignment   DocumentLocationAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  status MatrixStatus @default(DRAFT)

  clauses ComplianceMatrixClause[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ComplianceMatrixClause {
  id String @id @default(cuid())

  matrixId String
  matrix   ComplianceMatrix @relation(fields: [matrixId], references: [id], onDelete: Cascade)

  refLevel1 String?
  refLevel2 String?
  refLevel3 String?
  titleLevel1 String?
  titleLevel2 String?
  titleLevel3 String?
  requirementText String?
  evidenceNote String?
  comment String?
  status ComplianceClauseStatus @default(OPEN)

  parentId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([matrixId])
}

model UserLocationAccess {
  id String @id @default(cuid())

  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  locationId String
  location   Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  accessLevel LocationAccessLevel @default(READ)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, locationId])
  @@index([locationId])
}
```

---

## 11. Offene Entscheidungen

Vor Phase 1 zu entscheiden:

```txt
1. Welche bestehenden Registerfelder aus LawRow werden direkt in RegisterDocument uebernommen?
2. Gibt es zentrale Dokumente ohne Standortzuweisung?
3. Welche Rollen gelten als zentrale Rollen?
4. Darf Central Governance Detailbewertungen sehen oder nur aggregiert?
5. Soll UserLocationAccess automatisch aus Person -> Team -> Department -> Location vorbelegt werden?
6. Wie gehen wir mit bestehenden LocalStorage-Daten um?
7. Soll es einen Import-Assistenten geben?
8. Welche Matrixfelder aus matrixstore.ts werden in Phase 1 direkt uebernommen?
9. Brauchen wir AuditLog sofort oder erst in Phase 7?
10. Welche Phase soll zuerst online deployed werden?
```

---

## 12. Empfehlung

Empfohlene Umsetzung:

```txt
Phase 0:
Dokumentation und Zielmodell festlegen

Phase 1:
Prisma-Datenmodell einfuehren

Phase 2:
API-Schicht mit serverseitiger Zugriffskontrolle bauen

Phase 3:
Kataster schrittweise DB-basiert machen

Phase 4:
Standort-Zuweisung und Standortbewertung einfuehren

Phase 5:
Compliance Matrix auf assignmentId umstellen

Phase 6:
Dashboard 2.0 ergaenzen

Phase 7:
Rollen, Rechte, Audit und Traceability ausbauen
```

Kernaussage:

> LexTrack wird damit von einem lokalen MVP-Kataster zu einer mehrbenutzerfaehigen Governance-Plattform mit sauberer Standorttrennung.
