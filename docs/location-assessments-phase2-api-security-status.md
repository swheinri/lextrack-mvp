# LexTrack - Phase 2: API-Schutz und Standortzugriff - Zwischenstand

Stand: 2026-08-03
Branch: feature/location-assessments-phase0

---

## 1. Ziel von Phase 2

Phase 2 fuehrt die serverseitige Zugriffskontrolle fuer standortbezogene Daten ein.

Grundregel:

```txt
Zentrale Rollen sehen standortuebergreifend.
Standortrollen sehen nur freigegebene Standorte.
Schreibrechte richten sich nach dem Access Level.
```

---

## 2. Umgesetzte Bausteine

### 2.1 Zentrale Zugriffshilfe

Datei:

```txt
app/lib/location-access.ts
```

Umgesetzt:

```txt
- getAuthenticatedUser
- requireAuthenticatedUser
- isCentralRole
- getUserLocationAccess
- getAllowedLocationIds
- canAccessLocation
- requireLocationAccess
```

Zentrale Rollen:

```txt
ADMIN
SYSTEM_ADMIN
CENTRAL_COMPLIANCE
CENTRAL_GOVERNANCE
GOVERNANCE
COMPLIANCE
```

Access Level:

```txt
READ
CONTRIBUTE
RESPONSIBLE
ADMIN
```

---

## 3. Umgesetzte APIs

### 3.1 Aktueller User / Standortzugriff

```txt
GET /api/location-access/me
```

Ergebnis:

```txt
ADMIN:
- accessScope = ALL
- allowedLocationIds = null
- sieht alle aktiven Standorte

REQUIREMENT_ENGINEER:
- accessScope = LIMITED
- allowedLocationIds = FRA + MUC
- sieht nur freigegebene Standorte
```

### 3.2 Standortzugriffe eines Users verwalten

```txt
GET /api/location-access/users/[userId]
PUT /api/location-access/users/[userId]
```

Schutz:

```txt
Nur zentrale Rollen duerfen UserLocationAccess lesen oder setzen.
```

Teststand:

```txt
REQUIREMENT_ENGINEER:
- FRA = RESPONSIBLE
- MUC = READ
```

### 3.3 Zentrale RegisterDocuments API

```txt
GET /api/register-documents
POST /api/register-documents
```

Schutz:

```txt
Nur zentrale Rollen duerfen das globale Kataster lesen oder zentrale Dokumente anlegen.
```

Testergebnis:

```txt
ADMIN:
- darf Testdokument TEST-PHASE2-001 anlegen
- darf zentrale RegisterDocuments lesen

REQUIREMENT_ENGINEER:
- bekommt Forbidden
```

### 3.4 DocumentLocationAssignments API

```txt
GET /api/document-location-assignments
POST /api/document-location-assignments
```

Schutz:

```txt
POST:
- nur zentrale Rollen duerfen Dokumente Standorten zuweisen

GET:
- zentrale Rollen sehen alle Zuweisungen
- Standortrollen sehen nur Zuweisungen fuer erlaubte locationIds
```

Testergebnis:

```txt
TEST-PHASE2-001 wurde FRA und MUC zugewiesen.

ADMIN:
- accessScope = ALL
- sieht FRA + MUC Zuweisung

REQUIREMENT_ENGINEER:
- accessScope = LIMITED
- sieht nur FRA + MUC, weil nur diese Standorte freigegeben sind
```

### 3.5 LocationAssessments API

```txt
GET /api/location-assessments
POST /api/location-assessments
```

Schutz:

```txt
GET:
- READ reicht zum Lesen

POST:
- mindestens CONTRIBUTE erforderlich
```

Testergebnis:

```txt
REQUIREMENT_ENGINEER:
- FRA = RESPONSIBLE
- MUC = READ

FRA Bewertung schreiben:
- erlaubt
- HTTP 200
- Assessment wurde gespeichert

MUC Bewertung schreiben:
- verboten
- HTTP 403
- Assessment wurde nicht gespeichert
```

Datenbankcheck:

```txt
Nur ein LocationAssessment vorhanden:
TEST-PHASE2-001 -> FRA

Kein MUC Assessment wurde angelegt.
```

---

## 4. Nachgewiesene Sicherheitsregeln

```txt
1. ADMIN wird als zentrale Rolle erkannt.
2. ADMIN sieht alle aktiven Standorte.
3. Standortrolle sieht nur UserLocationAccess-Standorte.
4. Zentrale RegisterDocument API ist fuer Standortrollen gesperrt.
5. Zentrale Rollen koennen Dokumente Standorten zuweisen.
6. Standortrollen sehen nur ihre Standort-Zuweisungen.
7. READ darf lesen, aber nicht schreiben.
8. RESPONSIBLE darf schreiben.
9. Schreibschutz wird serverseitig ueber assignment.locationId geprueft.
```

---

## 5. Aktueller Phase-2-Status

```txt
Phase 2 Fortschritt: ca. 70 %

Erledigt:
- Standortzugriffsdatenmodell aktiv
- UserLocationAccess aktiv
- zentrale Zugriffshilfe
- User-Zugriffs-API
- zentrale RegisterDocument API
- Assignment API
- Assessment API
- zentrale und standortbezogene Zugriffstests bestanden

Noch offen:
- ComplianceMatrix API
- Clause API / Matrix-Inhalte
- ggf. API-Tests fuer Fremdstandorte ohne Zugriff
- UI-Anbindung
- spaeter AuditLog / Traceability
```

---

## 6. Naechster Schritt

Naechster Backend-Baustein:

```txt
/api/compliance-matrices
```

Ziel:

```txt
- Matrix pro DocumentLocationAssignment erstellen
- READ darf Matrix lesen
- CONTRIBUTOR / RESPONSIBLE / ADMIN darf Matrix bearbeiten
- Matrix darf nicht mehr global an lawId haengen
- Matrix muss an assignmentId haengen
```


---

## 8. Nachtrag: Compliance Matrix und Clauses

Stand: 2026-08-03

Nach der Zwischendokumentation wurden zwei weitere API-Bausteine umgesetzt und getestet.

### 8.1 Compliance Matrix API

Datei:

```txt
app/api/compliance-matrices/route.ts
```

Umgesetzt:

```txt
GET  /api/compliance-matrices
POST /api/compliance-matrices
```

Sicherheitslogik:

```txt
- Matrix haengt an DocumentLocationAssignment.assignmentId.
- Zugriff wird ueber assignment.locationId geprueft.
- READ darf Matrix lesen.
- Access Level CONTRIBUTE, RESPONSIBLE und zentrale Rollen duerfen Matrix erstellen/bearbeiten.
- Standortrollen koennen keine Matrix fuer fremde oder nur lesbare Standorte schreiben.
```

Nachgewiesener Testfall:

```txt
REQUIREMENT_ENGINEER:
FRA = RESPONSIBLE -> Matrix erstellen erlaubt
MUC = READ        -> Matrix erstellen verboten
```

Testergebnis:

```txt
FRA matrix write result: 200 / success true
MUC matrix write result: 403 / Forbidden / requiredAccess CONTRIBUTE
```

Datenbankpruefung:

```txt
TEST-PHASE2-001 -> FRA -> ComplianceMatrix vorhanden
TEST-PHASE2-001 -> MUC -> keine durch REQUIREMENT_ENGINEER geschriebene Matrix
```

### 8.2 Compliance Matrix Clauses API

Datei:

```txt
app/api/compliance-matrix-clauses/route.ts
```

Umgesetzt:

```txt
GET  /api/compliance-matrix-clauses
POST /api/compliance-matrix-clauses
```

Sicherheitslogik:

```txt
- Clause haengt an ComplianceMatrix.
- ComplianceMatrix haengt an DocumentLocationAssignment.
- Zugriff wird ueber matrix.assignment.locationId geprueft.
- READ darf Clauses lesen.
- Access Level CONTRIBUTE, RESPONSIBLE und zentrale Rollen duerfen Clauses anlegen/bearbeiten.
- Parent-Clauses muessen zur selben Matrix gehoeren.
```

Nachgewiesener Testfall:

```txt
REQUIREMENT_ENGINEER:
FRA = RESPONSIBLE -> Clause anlegen erlaubt
MUC = READ        -> Clause anlegen verboten
```

Testergebnis:

```txt
FRA clause write result: 200 / success true
MUC clause write result: 403 / Forbidden / requiredAccess CONTRIBUTE
```

Datenbankpruefung:

```txt
Eine Clause vorhanden:
TEST-PHASE2-001 -> FRA -> Testanforderung FRA

Keine Clause fuer MUC.
```

### 8.3 Aktueller Phase-2-Status

Phase 2 ist fachlich weitgehend umgesetzt.

Erledigt:

```txt
- Standortzugriff serverseitig
- zentrale Rollenlogik
- UserLocationAccess
- RegisterDocument API
- DocumentLocationAssignment API
- LocationAssessment API
- ComplianceMatrix API
- ComplianceMatrixClause API
- Schreibschutz READ vs RESPONSIBLE nachgewiesen
- Datenbankpruefung fuer Matrix und Clauses nachgewiesen
```

Bewertung:

```txt
Phase 2 Status: ca. 90-95 %
```

Noch offen fuer einen vollstaendigen Abschluss:

```txt
- finaler Lesetest fuer Matrix und Clauses aus Standortrollensicht
- optional: DELETE/Archivierungslogik fuer Clauses spaeter bewusst entscheiden
- Abschlussdokumentation nach finalem Lesetest aktualisieren
```


---

## 9. Finaler Lesetest und Abschluss Phase 2

Stand: 2026-08-03

Nach Umsetzung der Matrix- und Clause-APIs wurde ein finaler Lesetest aus Sicht einer Standortrolle durchgefuehrt.

Testrolle:

```txt
REQUIREMENT_ENGINEER
FRA = RESPONSIBLE
MUC = READ
```

Getestete Endpunkte:

```txt
GET /api/compliance-matrices
GET /api/compliance-matrix-clauses
```

Testergebnis:

```txt
Matrices read status: 200
Clauses read status: 200
accessScope: LIMITED
allowedLocationIds: FRA + MUC
Relevant matrices: 2
Relevant clauses: 1
```

Bewertung:

```txt
- Standortrolle kann Matrizen fuer freigegebene Standorte lesen.
- Standortrolle kann Clauses fuer freigegebene Standorte lesen.
- MUC ist lesbar, weil READ vorhanden ist.
- Schreiben bleibt durch requiredAccess CONTRIBUTE geschuetzt.
- FRA RESPONSIBLE darf schreiben.
- MUC READ darf nicht schreiben.
```

Phase-2-Abschluss:

```txt
Phase 2 ist fuer den Backend-/API-Schutz fachlich abgeschlossen.

Die zentrale Sicherheitsregel ist umgesetzt und nachgewiesen:

Ein Standort darf nur fuer die Dokumente eine Compliance Matrix anlegen oder bearbeiten,
die diesem Standort zur Bewertung zugewiesen wurden und fuer die der Nutzer ausreichende
Schreibrechte besitzt.
```

Naechster Schritt:

```txt
Phase 3: Kataster UI / Standort-Zuweisung
```
