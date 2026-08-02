# LexTrack - Phase 1: Feldmapping fuer DB-Datenmodell

Stand: 2026-08-02
Branch: feature/location-assessments-phase0

---

## 1. Ziel

Diese Datei definiert, wie die bestehenden LocalStorage-Datenstrukturen aus Register und Compliance Matrix in das kuenftige Prisma-Datenmodell ueberfuehrt werden sollen.

Aktueller Zustand:

```txt
Register:
LawRow[] in localStorage
Key: lextrack_register_rows_v1

Compliance Matrix:
MatrixDocument[] in zustand persist
Key: lextrack_matrix_v4
```

Zielzustand:

```txt
RegisterDocument
DocumentLocationAssignment
LocationAssessment
ComplianceMatrix
ComplianceMatrixClause
UserLocationAccess
```

---

## 2. Grundsatzentscheidung

Die bestehende Logik:

```txt
MatrixDocument.lawId -> LawRow.id
```

wird abgeloest durch:

```txt
ComplianceMatrix.assignmentId -> DocumentLocationAssignment.id
```

Damit gehoert eine Compliance Matrix kuenftig nicht mehr global zu einem Dokument, sondern zu einer konkreten Standort-Zuweisung.

---

## 3. Mapping: LawRow -> RegisterDocument

Diese Felder gehoeren zum zentralen Katasterdokument:

```txt
LawRow.id                -> RegisterDocument.id
LawRow.dokumentenart     -> RegisterDocument.dokumentenart
LawRow.vertragsumfeld    -> RegisterDocument.vertragsumfeld
LawRow.rechtsart         -> RegisterDocument.rechtsart
LawRow.normFamily        -> RegisterDocument.normFamily

LawRow.kuerzel           -> RegisterDocument.kuerzel
LawRow.bezeichnung       -> RegisterDocument.bezeichnung
LawRow.themenfeld        -> RegisterDocument.themenfeld

LawRow.publiziert        -> RegisterDocument.publiziert
LawRow.frist             -> RegisterDocument.frist
LawRow.relevanz          -> RegisterDocument.relevanz

LawRow.status            -> RegisterDocument.status

LawRow.herausgeber       -> RegisterDocument.herausgeber
LawRow.gueltigSeit       -> RegisterDocument.gueltigSeit
LawRow.gueltigBis        -> RegisterDocument.gueltigBis

LawRow.dokumentUrl       -> RegisterDocument.dokumentUrl
LawRow.quelleUrl         -> RegisterDocument.quelleUrl
LawRow.dokumentFileName  -> RegisterDocument.dokumentFileName
LawRow.dokumentFileHref  -> RegisterDocument.dokumentFileHref
LawRow.dokumentName      -> RegisterDocument.dokumentName

LawRow.zustaendigkeit    -> RegisterDocument.zustaendigkeit
LawRow.kategorie         -> RegisterDocument.kategorie
LawRow.abgeloestDurch    -> RegisterDocument.abgeloestDurch

LawRow.erfasserVorname   -> RegisterDocument.erfasserVorname
LawRow.erfasserNachname  -> RegisterDocument.erfasserNachname
LawRow.erfasserAbteilung -> RegisterDocument.erfasserAbteilung

LawRow.createdAt         -> RegisterDocument.createdAt
LawRow.obsoletedAt       -> RegisterDocument.obsoletedAt
LawRow.archivedAt        -> RegisterDocument.archivedAt
LawRow.retentionUntil    -> RegisterDocument.retentionUntil
```

Hinweis:

```txt
frist bleibt zunaechst am RegisterDocument erhalten.
Spaeter kann zusaetzlich eine standortbezogene dueDate an DocumentLocationAssignment genutzt werden.
```

---

## 4. Mapping: LawRow -> LocationAssessment

Diese Felder duerfen kuenftig nicht mehr global am Dokument haengen, weil Bewertung und Umsetzung je Standort unterschiedlich sein koennen.

Sie gehoeren daher zur Standortbewertung:

```txt
LawRow.riskMode              -> LocationAssessment.riskMode
LawRow.bewertungErgebnis     -> LocationAssessment.bewertungErgebnis
LawRow.evaluationNote        -> LocationAssessment.evaluationNote

LawRow.evaluationLikelihood  -> LocationAssessment.evaluationLikelihood
LawRow.evaluationImpact      -> LocationAssessment.evaluationImpact
LawRow.evaluationScore       -> LocationAssessment.evaluationScore
LawRow.evaluationLevel       -> LocationAssessment.evaluationLevel
LawRow.evaluatedAt           -> LocationAssessment.evaluatedAt
LawRow.evaluatedBy           -> LocationAssessment.evaluatedBy

LawRow.mitigationPlanned     -> LocationAssessment.mitigationPlanned
LawRow.mitigationAt          -> LocationAssessment.mitigationAt

LawRow.projekt               -> LocationAssessment.projektJson
```

Fachlicher Grund:

```txt
FRA kann ein Dokument als relevant mit Massnahme bewerten.
MUC kann dasselbe Dokument als nicht relevant bewerten.
Daher darf diese Bewertung nicht global am RegisterDocument haengen.
```

---

## 5. Alte Governance-Felder aus LawRow

Diese Felder sind aktuell global vorhanden:

```txt
assignedTo
reviewedBy
approvedBy
reviewerNote
approverNote
workflowState
evaluationStatus
history
```

Empfehlung fuer Phase 1:

```txt
Nicht sofort vollstaendig modellieren.
Zunaechst als optionale Legacy-/Notizfelder oder spaeter als AuditLog/WorkflowLog abbilden.
```

---

## 6. Mapping: MatrixDocument -> ComplianceMatrix

Aktuell:

```txt
MatrixDocument.id
MatrixDocument.lawId
MatrixDocument.lawKuerzel
MatrixDocument.lawBezeichnung
MatrixDocument.lawRechtsart
MatrixDocument.lawThemenfeld
MatrixDocument.clauses
MatrixDocument.status
MatrixDocument.riskAggregationMode
MatrixDocument.riskScope
```

Kuenftig:

```txt
MatrixDocument.id                  -> ComplianceMatrix.id
MatrixDocument.lawId               -> ENTFALLT, ersetzt durch assignmentId
MatrixDocument.status              -> ComplianceMatrix.status
MatrixDocument.riskAggregationMode -> ComplianceMatrix.riskAggregationMode
MatrixDocument.riskScope           -> ComplianceMatrix.riskScope
MatrixDocument.clauses             -> ComplianceMatrixClause[]
```

Diese Felder sind kuenftig nicht mehr erforderlich, weil sie ueber RegisterDocument erreichbar sind:

```txt
lawKuerzel
lawBezeichnung
lawRechtsart
lawThemenfeld
```

---

## 7. Mapping: MatrixClause -> ComplianceMatrixClause

Diese Felder werden uebernommen:

```txt
MatrixClause.id              -> ComplianceMatrixClause.id

refLevel1                    -> refLevel1
refLevel2                    -> refLevel2
refLevel3                    -> refLevel3

titleLevel1                  -> titleLevel1
titleLevel2                  -> titleLevel2
titleLevel3                  -> titleLevel3

requirementText              -> requirementText
evidenceNote                 -> evidenceNote
comment                      -> comment
status                       -> status

psoeLevel                    -> psoeLevel
riskSeverity                 -> riskSeverity
riskProbability              -> riskProbability

parentId                     -> parentId
```

Diese Referenzfelder werden in Phase 1 als Json-Felder uebernommen:

```txt
internalRefs                 -> internalRefsJson
legalRefs                    -> legalRefsJson
processRefs                  -> processRefsJson
formRefs                     -> formRefsJson
```

Begruendung:

```txt
Separate Tabellen fuer interne Referenzen, LegalRefs, Prozesse und Formulare koennen spaeter gebaut werden.
Fuer Phase 1 ist Json ausreichend und risikoaermer.
```

---

## 8. Neue Modelle ohne LocalStorage-Vorgaenger

### 8.1 DocumentLocationAssignment

Dieses Modell ist neu und bildet die Standort-Zuweisung ab.

```txt
documentId
locationId
status
dueDate
assignedByUserId
assignedAt
```

Wichtige Regel:

```txt
Pro Dokument und Standort darf es nur eine aktive Zuweisung geben.
```

Technisch:

```txt
@@unique([documentId, locationId])
```

### 8.2 UserLocationAccess

Dieses Modell ist neu und bildet fachliche Standortberechtigungen ab.

```txt
userId
locationId
accessLevel
```

Wichtige Regel:

```txt
Organisatorische Heimat ist nicht gleich fachlicher Zugriff.
```

---

## 9. Enums fuer Phase 1

Vorgeschlagene Enums:

```txt
RegisterDocumentStatus:
CAPTURED
ASSIGNED
IN_REVIEW
REJECTED
ACTIVE
OBSOLETE
ARCHIVED

AssignmentStatus:
ASSIGNED
IN_REVIEW
COMPLETED

AssessmentRelevance:
UNASSESSED
RELEVANT
NOT_RELEVANT
ACTION_REQUIRED

MatrixStatus:
DRAFT
IN_REVIEW
FINAL

ComplianceClauseStatus:
OPEN
COMPLIANT
NOT_FULFILLED
NOT_APPLICABLE

LocationAccessLevel:
READ
CONTRIBUTE
RESPONSIBLE
ADMIN

RiskAggregationMode:
WORST_CASE
INDEX

RiskScope:
ALL
NON_COMPLIANT

PsoeLevel:
P
S
O
E
```

---

## 10. Technische Leitentscheidung fuer Phase 1

Phase 1 soll zunaechst nur das Datenmodell einfuehren.

Noch nicht Bestandteil von Phase 1:

```txt
- vollstaendige UI-Umstellung
- vollstaendige Migration bestehender LocalStorage-Daten
- Dashboard 2.0
- AuditLog
- Rollenverwaltung fuer UserLocationAccess im Frontend
```

Bestandteil von Phase 1:

```txt
- Prisma-Modelle
- Enums
- Relationen
- Migration
- Prisma generate
- Build pruefen
```

---

## 11. Naechster Schritt

Nach Freigabe dieses Feldmappings wird prisma/schema.prisma kontrolliert erweitert.

Vorher Pflicht:

```txt
- Backup von prisma/schema.prisma
- Keine untracked Dateien versehentlich committen
- Build nach Schemaaenderung
- Migration lokal pruefen
```
