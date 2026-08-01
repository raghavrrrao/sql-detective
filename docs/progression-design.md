# SQL Detective — Progression Design

**Status:** design milestone. Nothing in this document has been implemented.
**Scope:** progression architecture only. Databases, stories, backend, SQL engine and Sprint 1–3 functionality are untouched.

---

## 0. Where the game actually is today

Measured from the live databases, not estimated:

| | Easy · Dormitory | Medium · Blackwood | Expert · Aurelian |
|---|---|---|---|
| Total rows | **79** | **103** | **136** |
| Suspects | 5 | 7 | 9 |
| Witnesses | 6 | 9 | 10 |
| Evidence | 6 | 8 | 12 |
| Declared time | 20 min | 35 min | 60 min |
| Declared concepts | SELECT, WHERE, ORDER BY, LIMIT, COUNT | JOIN, LEFT JOIN, GROUP BY, HAVING, BETWEEN | Multi-JOIN, subqueries, CTEs, date arithmetic |

The problem is real and it is at the front: **the first case a student meets is 79 rows across 16 tables and asks them to reason about an absence** (who is *not* on camera). Negative evidence is a sophisticated detective move. There is no rung below it.

The three existing cases are individually good. The curve is missing its bottom two steps.

---

## 1. Recommended five-case progression

| Tier | Case | Source | Work required |
|---|---|---|---|
| 1 · Beginner | **The Locked Office** *(new)* | Author fresh | New case, ~20 rows |
| 2 · Easy | **The Dormitory Murder** | Exists (79 rows) | Trim to ~55 rows |
| 3 · Intermediate | **The Gallery Theft** *(new)* | Author fresh | New case, ~80 rows |
| 4 · Hard | **The Mansion at Blackwood Hill** | Exists (103 rows) | **None — already fits** |
| 5 · Expert | **The Aurelian Job** | Exists (136 rows) | Grow to ~150 rows, add a `CASE` step |

**Two new cases to author, one to trim, one to extend, one untouched.**

### Why this order

**Blackwood → Hard is a precise fit and should not move.** 103 rows against a 100–130 target, 7 suspects against 6–7, and its existing SQL set (JOIN, LEFT JOIN, GROUP BY, HAVING, BETWEEN) is the Hard teaching set almost verbatim. This is the single luckiest alignment in the redesign — take it.

**Aurelian → Expert, with growth.** 136 rows against a 140–180 target and 9 suspects against 8–10. It already teaches CTEs, subqueries and date arithmetic. It is missing only `CASE`, and the clock-tampering twist is a natural place for one (`CASE WHEN reader_id = 'DECK7' THEN datetime(access_time,'-12 minutes') ELSE access_time END`). Add ~15 rows of corroboration rather than new plot.

**Dormitory stays at Easy and is trimmed.** There is a genuine tension here worth stating: by *size* (79 rows, 5 suspects) Dormitory sits in the Intermediate band; by *SQL taught* (SELECT/WHERE/ORDER BY/COUNT) it is squarely Easy. I recommend resolving it downward — trim to ~55 rows and 4 suspects — for three reasons:

1. The entire point of this milestone is that the early curve is too steep. Leaving a 79-row case at position 2 of 5 works against the goal.
2. Its deduction — *four people are on camera, one is not* — is the cleanest teachable detective idea in the project. It belongs early.
3. Trimming rows is far cheaper than authoring a replacement, and the story survives it: "four people were in North Hall" reads as well as five.

The cost is that Daniel Reed's supporting material thins out. Mitigation is in §8.

---

## 2. Difficulty comparison

| | Beginner | Easy | Intermediate | Hard | Expert |
|---|---|---|---|---|---|
| **Story complexity** | One room, one hour, no subplot | One building, one blackout window | Two locations, one timeframe | One estate, competing interests | One ship, layered access + tampering |
| **Suspects** | 3 | 4 | 5–6 | 6–7 | 8–10 |
| **Evidence items** | 3–4 | 5–6 | 8–10 | 8–10 | 12–14 |
| **Witnesses** | 2–3 | 4–5 | 6–7 | 8–9 | 9–10 |
| **Database size** | 15–25 rows | 40–60 rows | 70–90 rows | 100–130 rows | 140–180 rows |
| **Tables populated** | 5–6 | 8–9 | 11–12 | 14–16 | 16 |
| **Completion time** | 5–10 min | 10–15 min | 20–25 min | 30–40 min | 45–60 min |
| **Red herrings** | 0 | 1 (obvious) | 2 | 3 | 4 + one structural |
| **Expected queries** | 6–8 | 10–14 | 18–25 | 25–35 | 35–50 |
| **Recommended experience** | Never written SQL | Knows SELECT | Comfortable filtering | Comfortable joining | Confident across joins |

**Tables populated** is a deliberate design lever and a new one. Beginner should not present sixteen tables of which ten are empty; a short case that uses six tables *well* reads as complete, while a short case scattered across sixteen reads as broken.

---

## 3. SQL learning progression

Each tier introduces new constructs and **re-uses every earlier one**. Nothing is taught once and abandoned.

| Tier | Introduced | Reinforced | Deliberately absent |
|---|---|---|---|
| Beginner | `SELECT *`, `SELECT col`, `FROM`, `LIMIT`, `WHERE =` | — | JOIN, aggregates, ORDER BY |
| Easy | `WHERE` with `AND`/`OR`/`<`/`>`, `ORDER BY`, `COUNT(*)` | SELECT, LIMIT, WHERE | JOIN, GROUP BY |
| Intermediate | `GROUP BY`, `LIKE`, `BETWEEN`, `DISTINCT`, `IN` | WHERE, ORDER BY, COUNT | JOIN |
| Hard | `INNER JOIN`, `LEFT JOIN`, `HAVING`, `SUM`/`MIN`/`MAX`/`AVG` | GROUP BY, BETWEEN, LIKE | CTEs, subqueries |
| Expert | Subqueries, CTEs (`WITH`), `CASE`, `datetime()` arithmetic, 3+ table JOIN chains | everything | — |

**The one hard rule: JOIN does not appear until Hard.** Today it arrives at case 2 of 3. Under the new curve a student writes filters, sorts and aggregates across three whole cases before they are asked to relate two tables. That single deferral is the largest difficulty reduction available, and it costs nothing but ordering.

`LEFT JOIN` earns its place at Hard because Blackwood's central move — *find the person with no matching record* — is exactly what a `LEFT JOIN ... WHERE x IS NULL` expresses. The story and the construct teach each other.

---

## 4. Detective learning progression

SQL is the tool; these are the *reasoning* skills, and they need their own ladder. Today the game jumps straight to the hardest one.

| Tier | Detective concept introduced | The move the player learns |
|---|---|---|
| Beginner | **Reading a record** | A table row is a fact. Facts have sources. |
| Easy | **Absence as evidence** | Four people are accounted for; one is not. |
| Intermediate | **Corroboration** | Two independent sources agreeing is stronger than one. |
| Hard | **Contradiction** | A person's claim and a machine's log disagree. One is wrong. |
| Expert | **Tampering** | The record itself was altered. Ask who could alter it. |

This ladder matters more than the SQL one. A student can be fluent in `JOIN` and still not know what to *do* with two tables. Each tier should make its detective concept explicit in the objective wording, not just in the story.

Note the current Easy case teaches **absence** — correctly placed. Beginner must sit below it and teach only *reading*, or the ladder still starts on its second rung.

---

## 5. Recommended story order

```
1  Beginner      The Locked Office          NEW
2  Easy          The Dormitory Murder       existing, trimmed 79 → ~55
3  Intermediate  The Gallery Theft          NEW
4  Hard          The Mansion at Blackwood   existing, unchanged
5  Expert        The Aurelian Job           existing, grown ~136 → ~150
```

### Brief for **The Locked Office** (Beginner)

A department office, a stolen exam paper, three people with keys. **Not a murder** — the tutorial should not also be asking the player to absorb a death. One hour, one room, one obvious answer sitting in a `WHERE` clause. Every objective is satisfiable by a single query. Target 20 rows across `suspects`, `victims`(→ rename usage: the wronged party), `witnesses`, `evidence`, `access_logs`, `locations`.

The player should finish thinking *"that was easy"* — that is the design goal, not a failure of it.

### Brief for **The Gallery Theft** (Intermediate)

A gallery, an overnight swap of a painting for a forgery, five or six staff. Two locations (gallery floor + loading bay) so `LIKE` and `GROUP BY` have something real to do: *which door saw the most traffic between 1am and 3am?* Corroboration is the lesson — no single record answers it, but two counted together do. Target 80 rows.

---

## 6. Suggested database sizes

Per-table budgets, so authoring is a filling-in exercise rather than a guess:

| Table | Beginner | Easy | Intermediate | Hard | Expert |
|---|---|---|---|---|---|
| suspects | 3 | 4 | 6 | 7 | 9 |
| victims | 1 | 1 | 1 | 1 | 1 |
| witnesses | 3 | 5 | 7 | 9 | 10 |
| evidence | 4 | 6 | 9 | 8 | 13 |
| locations | 2 | 4 | 5 | 6 | 8 |
| access_logs | 6 | 8 | 12 | 10 | 16 |
| cctv_logs | — | 8 | 12 | 13 | 16 |
| phone_logs | — | 5 | 7 | 7 | 10 |
| crime_scene | 3 | 4 | 5 | 5 | 6 |
| security_logs | — | 4 | 6 | 7 | 11 |
| documents | — | — | 5 | 5 | 11 |
| emails | — | — | 5 | 8 | 10 |
| fingerprints | — | 4 | 4 | 4 | 7 |
| weapons | — | 2 | 1 | 1 | 2 |
| employees | — | — | — | 5 | 9 |
| vehicles | — | — | — | 7 | 6 |
| **Total** | **22** | **55** | **85** | **103** | **151** |

Hard is the current Blackwood database exactly. Expert is Aurelian plus ~15 rows.

**Empty tables are a design decision, not an oversight.** A Beginner querying `cctv_logs` and getting zero rows learns the wrong lesson. Either the tier's unused tables should be absent from the schema for that case, or the case board should state which sources exist — see §10.

---

## 7. Expected completion times

| Tier | Target | Composition |
|---|---|---|
| Beginner | 5–10 min | 6–8 queries, no dead ends, one accusation |
| Easy | 10–15 min | 10–14 queries, one wrong lead worth ~2 min |
| Intermediate | 20–25 min | 18–25 queries, two leads worth ~5 min |
| Hard | 30–40 min | 25–35 queries, three leads worth ~10 min |
| Expert | 45–60 min | 35–50 queries, four leads plus a structural trap |

Total first-playthrough arc: **~2 to 2.5 hours**, which suits a festival where students drop in for one or two cases and a determined few finish the set.

---

## 8. Red herring strategy

A red herring should cost time, never trust. The player must be able to look back and see it was *fair*.

| Tier | Count | Kind |
|---|---|---|
| Beginner | 0 | None. Nothing should mislead a first-timer. |
| Easy | 1 | **Signposted.** Someone behaves suspiciously and is cleared by one query. |
| Intermediate | 2 | **Coincidental.** Two people were legitimately somewhere odd. |
| Hard | 3 | **Motivated.** Three people had reason to want it. Records separate them. |
| Expert | 4 + 1 structural | Motivated, plus one where **the record itself lies.** |

Three rules for authoring:

1. **Every herring must be dismissible by a query the player already knows how to write.** A herring that needs a construct from the *next* tier is a wall, not a herring.
2. **No herring may depend on the player mis-reading.** Ambiguous phrasing is not a red herring, it is a bug.
3. **Structural herrings (tampered records) appear only at Expert**, where the player has been taught that records have provenance.

**On trimming Dormitory:** cutting 79 → 55 rows will thin the material that currently supports its single herring (the fingerprint on the window that one suspect denies touching). Keep that herring and cut elsewhere — it is the case's best teaching moment about *not* trusting the first suspicious thing.

---

## 9. Unlock progression

```
Beginner ──solved──▶ Easy ──solved──▶ Intermediate ──solved──▶ Hard ──solved──▶ Expert
```

### What exists

`utils/caseProgress.js` already has ordering (`caseOrder`), a persisted per-case record, `getCaseStatus` returning `solved`, an `isCaseLocked` gate, and the `ENFORCE_PROGRESSION` escape hatch for festival walk-ups. Sprint 3 added `solved`, `solvedAt` and the stored report.

### What must change

**Unlock on *solved*, not on *opened*.** `isCaseLocked` currently checks whether the previous case's briefing was *read*:

```js
return !progress[caseOrder[index - 1]]?.opened;   // today
return !progress[caseOrder[index - 1]]?.solved;   // proposed
```

One line, but it is a real behaviour change to shipped Sprint 1 functionality — flagged here, not applied.

**Keep `ENFORCE_PROGRESSION`.** With five cases a festival visitor with fifteen minutes cannot reach Expert legitimately. The flag stays as the event-day override.

**A five-case chain is long.** Consider allowing the *next* case to unlock on solve while leaving all previously unlocked cases open, which is already the behaviour — no change, just confirming it is correct.

---

## 10. Architectural findings — read this before authoring anything

Four issues in the shipped code will block or distort the five-case curve. None are urgent bugs today; all become blocking the moment a Beginner case exists.

### 10.1 The accusation gate cannot be satisfied by a 20-row case — **blocking**

Sprint 3's thresholds in `utils/accusation.js` are absolute:

| Gate | Requirement |
|---|---|
| Readiness | victim identified · 3 suspects investigated · **≥15 discoveries** · **≥4 source tables** |
| Verdict | **≥3 citations** · **≥20 discoveries** · **≥5 source tables** · **≥6 timeline events** |

A Beginner case of 22 rows across 6 tables would have to be recovered almost in full to clear a 20-discovery bar, and a case with no `cctv_logs`/`phone_logs` may never reach 6 timeline events at all. **The Beginner case would be unwinnable.**

These thresholds must become per-tier before any small case is authored. Suggested shape:

| Tier | Discoveries | Sources | Timeline | Citations |
|---|---|---|---|---|
| Beginner | 8 | 3 | 2 | 1 |
| Easy | 15 | 4 | 4 | 2 |
| Intermediate | 22 | 5 | 6 | 3 |
| Hard | 28 | 6 | 8 | 3 |
| Expert | 35 | 7 | 10 | 4 |

### 10.2 The difficulty key is scattered across fifteen files — **high**

`easy | medium | expert` is hardcoded in `caseMetadata.js`, `caseDatabase.js`, three seed scripts, three `.db` filenames, `cases.js`, `caseProgress.js`, `caseSolution.js` and `SQLEditor.jsx`. Adding two tiers touches all of them, and **renaming `medium` → `hard` orphans every saved game** — `session:medium` and the `medium` progress key would no longer be read, silently wiping solved state and reports.

Recommendation: **keep `medium` as Blackwood's internal id** and introduce a single `caseCatalog` module as the source of truth:

```js
{ id: 'medium', order: 4, tier: 'Hard', slug: 'blackwood-hill', db: 'medium.db', ... }
```

Display tier comes from the catalog; storage keys never move. Zero migration risk, and the next progression change edits one file instead of fifteen. The id/tier mismatch is a small readability cost, paid once, in a place with a comment explaining it.

### 10.3 The case board silently truncates — **medium**

`getCaseBriefing` caps witnesses at 8; Expert has 10. Two witness statements never appear on the case board, though they remain findable by SQL. That is defensible — the board is a briefing, not the database — but it is currently accidental rather than designed. Decide explicitly, and note that the caps (evidence 12, witnesses 8, crime_scene 6, timeline 8) will need revisiting for a 180-row Expert case.

### 10.4 The solution set grows with the roster — **known, unchanged**

`caseSolution.js` will hold five names instead of three, all shipped in the JS bundle. Same honour-system caveat as Sprint 3. Five cases makes a server-side verdict endpoint more attractive, but that is a backend change and out of scope.

### 10.5 The objective ladder is global, not per-case — **high**

`utils/objectives.js` defines one eight-objective list keyed off the shared schema. It works because all three cases share sixteen tables. A Beginner case with six populated tables would show objectives it cannot complete (*"Review the badge and access logs"* is fine; *"Put the movements in order"* needs `cctv_logs` or `security_logs`). Objectives must become per-tier before the Beginner case exists.

---

## 11. Tutorial design — the Beginner case

**No overlays, no coach marks, no modal walkthrough.** The teaching systems already shipped; the Beginner case just has to be small enough that they *are* the tutorial.

| What must be taught | System that already teaches it | Change needed |
|---|---|---|
| How to run SQL | Starter query is pre-loaded; Run button and Ctrl+Enter are labelled | none |
| How to read a table | Results panel names what came back — *"Recovered 3 suspect files"* | none |
| How evidence works | Discovery engine files each row; Discoveries tab shows source + timestamp | none |
| How the notebook works | Objectives tick themselves as real queries land | **surface it** |
| How accusations work | Accuse caption moves from *"almost nothing on file"* to *"enough on file"* | per-tier thresholds (§10.1) |

Two changes carry the whole tutorial:

**1. Surface the current objective on the board.** Objectives live behind the Notebook button today. A first-timer may never press it. For Beginner only, show the single next incomplete objective as one line above the terminal. Not a tutorial overlay — one sentence that changes as they work.

**2. Give Beginner a four-objective ladder**, each satisfiable by one query:

```
□ Look at who was in the building        SELECT * FROM suspects;
□ Find out what was taken                SELECT * FROM evidence;
□ Read what people said                  SELECT * FROM witnesses;
□ Check who opened the door              SELECT * FROM access_logs;
```

Four queries, four ticks, four small wins. The fifth action is the accusation. A student who finishes has executed real SQL, read real results, watched a notebook fill itself and closed a case — without reading a single paragraph of instruction.

**The Beginner case should be winnable by accident.** That is the point.

---

## 12. Future roadmap

| Phase | Work | Depends on |
|---|---|---|
| **A — Foundations** | Per-tier accusation thresholds (§10.1) · per-tier objectives (§10.5) · `caseCatalog` module (§10.2) | nothing |
| **B — Authoring** | The Locked Office (~22 rows) · The Gallery Theft (~85 rows) · trim Dormitory to ~55 · grow Aurelian to ~151 + `CASE` | Phase A |
| **C — Progression** | Unlock on *solved* · case-selection card fields (§13) · Beginner objective line | Phase B |
| **D — Sprint 4** | Timer · hints · scoring · achievements | Phase C |

**Phase A must come first.** Authoring a Beginner case against today's absolute thresholds produces a case that cannot be won, and that will not be obvious until someone plays it end to end.

---

## 13. Case-selection UI

No redesign. The card already shows difficulty, estimated time, SQL concepts, completion status and locked state. Two fields are missing from the spec:

- **Recommended experience** — one line per tier, from the §2 table (*"Never written SQL"* … *"Confident across joins"*).
- **Completion** — currently a `Solved` badge. With five cases, showing *"Solved · 3 of 5"* somewhere on the selection screen gives the set a shape.

Both are additive to `cases.js` and `CaseSelectionCard.jsx`. No layout change.

---

## Recommendation

Build **Phase A** before anything else, and before Sprint 4. It is three focused changes to shipped code — per-tier thresholds, per-tier objectives, and a case catalog — and every one of them is cheap now and expensive after two more cases exist.

The single most valuable outcome of this milestone is not the two new cases. It is deferring `JOIN` from case 2 to case 4.
