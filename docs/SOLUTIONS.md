# SQL Detective — Solutions and Walkthroughs

**SPOILER FILE.** Every answer to every case is below. It is here so you can demonstrate
the game, answer questions in a viva, and rescue a stuck player at a festival.

Every query in this file has been run against the shipped databases and produces the
output shown. Copy them straight into the terminal in-game.

The five answers at a glance:

| # | Case | Tier | Culprit | Teaches |
|---|------|------|---------|---------|
| 01 | The Locked Office | Beginner | **Daniel Okafor** | `SELECT`, `WHERE`, `LIMIT` |
| 02 | The Dormitory Murder | Easy | **Daniel Reed** | `ORDER BY`, `COUNT`, `GROUP BY` |
| 03 | The Gallery Theft | Intermediate | **Ruben Castellanos** | `GROUP BY`, `BETWEEN`, `LIKE`, `DISTINCT` |
| 04 | The Mansion at Blackwood Hill | Hard | **Marcus Vane** | `JOIN`, `LEFT JOIN`, `HAVING` |
| 05 | The Aurelian Job | Expert | **Renata Silva** | Subqueries, CTEs, date arithmetic |

The one idea that runs through all five: **a statement is what someone says, a log is what
actually happened.** You win by finding the place those two disagree.

---

## Case 01 — The Locked Office (Beginner)

**Answer: Daniel Okafor, Department Administrator.**

Research papers were copied from Professor Collins's locked office. Nothing was forced,
nothing was taken — they were photocopied and put back. Three people, one card-controlled
door, and a photocopier that counts pages.

### The chain

**Step 1 — Who was here?**

```sql
SELECT * FROM suspects;
```

Three people. Marcus Webb has an obvious motive (his funding bid overlaps Collins's
research) and no opportunity — he never goes near the office. Daniel Okafor is also named
on a competing bid. Priya Raman is the cleaner and has no motive at all.

**Step 2 — When could it have happened?**

```sql
SELECT name, statement FROM witnesses;
```

Collins: *"The papers were in the locked drawer when I left at 6:45 PM."* That is the
earliest the theft could have happened. The porter locked up at 7:30 PM. Your window is
**6:45 PM – 7:30 PM**.

**Step 3 — Who opened the door inside that window?**

```sql
SELECT * FROM access_logs
WHERE access_time > '2026-09-15 18:45:00'
ORDER BY access_time;
```

```
Daniel Okafor  Office N-118     18:52
Daniel Okafor  Copy Room N-120  18:57
Marcus Webb    Seminar Room B   19:20
```

Daniel enters the office at 6:52 PM and the copy room five minutes later. Marcus never
leaves Seminar Room B.

**Step 4 — Confirm it.**

```sql
SELECT title, description FROM evidence WHERE title LIKE '%Photocopier%';
```

The machine counted **48 pages** between 6:57 and 7:08 PM. The research file is 48 pages.

### The red herring

Priya Raman holds a master card that opens every office in the wing — but her swipe is at
**6:10 PM**, thirty-five minutes *before* Collins left with the papers still locked away.
She is cleared by the clock alone. Nothing has to be inferred.

### How to explain it in one sentence

> One person's card opened the office after the papers were last seen, then opened the copy
> room, where the machine counted exactly as many pages as the file.

---

## Case 02 — The Dormitory Murder (Easy)

**Answer: Daniel Reed, Lab Technician.**

Professor Ross is stabbed at 10:18 PM during a ten-minute blackout. Five suspects.
This case teaches the idea the whole game rests on: **an absence is evidence.**

### The chain

**Step 1 — Anchor the time.**

```sql
SELECT name, time_of_death, cause_of_death FROM victims;
```

10:18 PM. Every other record gets measured against this.

**Step 2 — Find the window.**

```sql
SELECT event_time, event_type, details FROM security_logs ORDER BY event_time;
```

Lights out 10:13, restored 10:23. The monitor cable is pulled at 10:18 — the moment of
death. A fire alarm is pulled by hand at 10:20, drawing security away.

**Step 3 — Account for everybody. This is the key query.**

```sql
SELECT subject, COUNT(*) AS sightings
FROM cctv_logs
WHERE observed_at < '2026-10-14 22:18:00'
GROUP BY subject
ORDER BY sightings DESC;
```

```
Elena Morales        3
Dr. Maya Patel       2
Victor Shaw          1
Unidentified person  1
Nora Fields          1
```

Four of the five suspects are on camera before the murder. **Daniel Reed is not on the list
at all.** That is the whole case.

**Step 4 — Prove the gap is real.**

```sql
SELECT person_name, access_point, access_time
FROM access_logs WHERE person_name = 'Daniel Reed'
ORDER BY access_time;
```

He badges out of the lab at **10:12** and doesn't appear anywhere again until the generator
room at **10:21** — three minutes *after* the death. Nine unaccounted minutes, exactly
covering the murder. His statement claims he was in the generator room the whole time.

**Step 5 — Close it with forensics.**

```sql
SELECT print_label, matched_to, match_confidence FROM fingerprints;
```

His print is on the window frame he swears he never touched, and his DNA is in the lining
of the bloodied gloves.

### The teaching point

Everyone else is *proven present somewhere else*. Daniel is proven nowhere. Students
instinctively look for evidence *of* guilt; this case teaches them to look for the hole.

### How to explain it in one sentence

> Four suspects are on camera during the blackout. The fifth has a nine-minute hole in his
> own badge trail, and it lines up exactly with the time of death.

---

## Case 03 — The Gallery Theft (Intermediate)

**Answer: Ruben Castellanos, Conservator.**

A painting is swapped for a forgery overnight. Six people hold after-hours cards.
This case exists to teach one lesson: **an unfiltered aggregate lies to you.**

### The chain

**Step 1 — Establish the window.**

```sql
SELECT name, statement FROM witnesses
WHERE statement LIKE '%eleven%' OR statement LIKE '%twenty to eight%';
```

The curator saw the real painting at 11:00 PM. The morning porter found the copy at
7:40 AM. That is your window.

**Step 2 — The trap. Count the whole night.**

```sql
SELECT person_name, COUNT(*) AS events
FROM access_logs
GROUP BY person_name
ORDER BY events DESC;
```

```
Peter Halloran      8   <-- the night guard
Ruben Castellanos   5
...
```

Peter Halloran tops it by a mile. **He is innocent.** He is the night security officer — of
course he opens the most doors. Most students accuse him here, and that is the point of the
case.

**Step 3 — Narrow it. This is the lesson.**

```sql
SELECT person_name, COUNT(*) AS events
FROM access_logs
WHERE access_point = 'Loading Bay'
  AND access_time BETWEEN '2026-06-10 23:00:00' AND '2026-06-11 07:40:00'
GROUP BY person_name
ORDER BY events DESC;
```

```
Ruben Castellanos   3
Colin Beaumont      2
Ivy Zhang           1
```

Same table, same aggregate — one `WHERE` clause, completely different answer. Ruben is on
the loading bay three times in the small hours. Halloran isn't there at all; he's in the
east wing, the far end of the building.

**Step 4 — The cameras corroborate without naming.**

```sql
SELECT DISTINCT subject FROM cctv_logs WHERE camera_id LIKE 'BAY%';
```

Colin, Tomas, Ivy — and an **Unidentified person** for the clips at 01:31, 02:12 and 02:38.
The camera never sees the thief's face. Only the door log places him.

**Step 5 — Motive and means.**

```sql
SELECT title, summary FROM documents WHERE summary LIKE '%eleven weeks%';
SELECT print_label, matched_to FROM fingerprints;
```

Eleven weeks of pigment and canvas signed out against no catalogued job — he was *painting
the forgery*. His prints are on the crate's false base and on the Room 3 hanging wire.

### The two other red herrings

- **Ivy Zhang** is on the bay at 1:12 AM — a legitimate crate return, corroborated by the
  courier, and her crate has a standard base with nothing concealed.
- **Marta Lindqvist** is the outsider who knows what the painting is worth, but she left the
  building at 8:40 PM and never came back.

### How to explain it in one sentence

> Counting the whole night makes the night guard look guilty; counting only the theft window
> at the loading bay puts the conservator there three times, and he'd been signing out
> canvas for eleven weeks.

---

## Case 04 — The Mansion at Blackwood Hill (Hard)

**Answer: Marcus Vane, the family solicitor.**

Arthur Blackwood announces a new will at dinner and is dead within the hour. The study door
log names his estate manager — **and that is the twist**: she lent her fob to Vane at 9:35
in front of two witnesses.

### The chain

**Step 1 — Who can't be placed? This is the `LEFT JOIN`.**

```sql
SELECT s.name, s.occupation
FROM suspects s
LEFT JOIN cctv_logs c ON c.subject = s.name
WHERE c.id IS NULL;
```

```
Marcus Vane    Family Solicitor
Edmund Rooke   Butler
```

Two people appear on no camera. A `LEFT JOIN` keeps every row from the left table and fills
nulls where the right has no match — filtering on `IS NULL` is how you ask "who has
nothing?"

**Step 2 — Eliminate the butler.** He isn't on camera because the pantry has none, but the
housekeeper places him there at 9:45 and the dumbwaiter service log records the car being
worked at 9:46 — and its gate has to be held by hand, so somebody was physically there.
That leaves Vane.

**Step 3 — The door log, and the trap in it.**

```sql
SELECT person_name, access_time FROM access_logs
WHERE access_point = 'Study door' ORDER BY access_time;
```

```
Estate fob 7 (Sofia Marín)   21:44
Estate fob 7 (Sofia Marín)   21:49
```

The study is opened at 9:44 and 9:49 — the clock stopped at 9:47 — on **Sofia Marín's fob**.
But Sofia is on the garage camera 9:43–9:56 with two ground staff. She cannot have been in
both places.

**Step 4 — A fob names a card, not a hand.**

```sql
SELECT name, statement FROM witnesses WHERE statement LIKE '%fob%';
```

The cook saw Sofia hand her fob to Vane in the hall. Sofia says the same. The main hall
camera recorded it at 9:35 — she walks to the garage, he walks toward the east corridor.

**Step 5 — Compare every alibi at once with a `JOIN`.**

```sql
SELECT s.name, w.reliability, w.statement
FROM suspects s JOIN witnesses w ON w.name = s.name;
```

Every statement comes back marked `High` except one: **Vane, `Disputed`.** He claims the
library from 9:30 — no camera, no badge, no witness. And a ground-staff witness saw him
reach the drawing room at 9:50 red-faced and out of breath, with no overcoat, having worn
it all evening.

**Step 6 — Motive, in the paperwork.**

```sql
SELECT title, summary FROM documents WHERE summary LIKE '%page three%';
SELECT print_label, matched_to FROM fingerprints WHERE matched_to <> 'Unmatched';
```

Page three of the new will — the one appointing Vane executor on a 15% fee — is printed on
different paper from the rest, and the firm's own system recorded no such clause on
28 October. His prints are on that page and on fob 7. Arthur's unsent message read
*"Marcus is here about page three. If anything hap"*.

### The camera gap

`EAST-CORR-01` drops off the recorder from 9:36 to 9:58 — and the recorder cabinet stands
in the study lobby. Convenient.

### How to explain it in one sentence

> The door log names the estate manager, but she's on the garage camera at the time — she
> lent her fob to the solicitor in front of two witnesses, and he'd forged himself a 15%
> executor's fee into page three of the will.

---

## Case 05 — The Aurelian Job (Expert)

**Answer: Renata Silva, Systems Engineer.**

A CEO is killed at 1:07 AM aboard a ship nobody left. Nine suspects. The twist is not a lie
told by a person — **it is a lie told by a machine.** Renata put the Deck 7 badge reader
twelve minutes fast at 11:41 PM so her own record would fall clear of the murder.

### The chain

**Step 1 — Find the offset.** Three people appear on both the Deck 7 badge log and the
Deck 7 camera. Join them and look at the gaps.

```sql
SELECT a.person_name,
       c.observed_at AS camera,
       a.access_time AS badge,
       ROUND((julianday(a.access_time) - julianday(c.observed_at)) * 1440) AS minutes_apart
FROM access_logs a
JOIN cctv_logs c
  ON c.subject = a.person_name
 AND c.camera_id = 'DECK7-AFT'
 AND ABS(julianday(a.access_time) - julianday(c.observed_at)) * 1440 < 30
WHERE a.access_point = 'Deck 7 corridor door'
ORDER BY c.observed_at;
```

The true pairs are all **exactly 12 minutes apart** — Bennet 00:32/00:44, Kade 00:57/01:09
and 01:02/01:14, Holt 01:22/01:34. Two records of the same moment disagree by a constant,
so one of them was altered.

**Step 2 — Confirm it and ask who could have done it.**

```sql
SELECT title, summary FROM documents
WHERE summary LIKE '%offset%' OR summary LIKE '%accounts%';
```

The change log shows two writes to the Deck 7 reader at 11:40 and 11:41 PM from
`eng-rsilva`, and only three accounts on the whole ship can write a clock offset. The
security log confirms no other reader was touched.

**Step 3 — Correct the clock. This is the CTE.**

```sql
WITH corrected AS (
  SELECT person_name,
         access_time AS stamped,
         datetime(access_time, '-12 minutes') AS actual
  FROM access_logs
  WHERE access_point = 'Deck 7 corridor door'
)
SELECT * FROM corrected
WHERE actual BETWEEN '2026-12-19 01:00:00' AND '2026-12-19 01:15:00'
ORDER BY actual;
```

```
Naomi Kade     stamped 01:14   actual 01:02
Renata Silva   stamped 01:17   actual 01:05
Renata Silva   stamped 01:24   actual 01:12
```

Applying the correction does two things at once. It moves **Naomi Kade out** of the window —
her badge said 1:09, she was actually there at 12:57 and gone by 1:02, exactly as she
insisted. And it moves **Renata in**: on Deck 7 at 1:05, two minutes before the blow, and
again at 1:12, matching the suite's second door-sensor event.

**Step 4 — She is on no camera at all.**

```sql
SELECT DISTINCT person_name FROM access_logs
WHERE access_point = 'Deck 7 corridor door'
  AND person_name NOT IN (SELECT subject FROM cctv_logs WHERE camera_id = 'DECK7-AFT');
```

Only the corrected badge log places her there — she used the forward stair, which the camera
doesn't cover.

**Step 5 — Means and motive.**

```sql
SELECT print_label, matched_to FROM fingerprints WHERE matched_to <> 'Unmatched';
```

Her prints are on the controller panel cover and on a discarded engineering keycard sleeve
in the lobby bin. Citrus hand-cleaner and blue nitrile polymer — both issued to engineering
only — are on the suite door handle and the murder weapon. The leak audit traced the stolen
prototype exports to workstation ENG-04, assigned to her alone, and Celia was going to name
the leaker at the 9 AM board session.

### Why Naomi Kade is the perfect red herring

Her badge record is *the most incriminating in the case* — stamped 1:09 AM, two minutes
after the death — and she insists *"my badge says nine past, but I know what time I went."*
She is telling the truth. The record is wrong. A student who trusts the machine over the
witness accuses the wrong person.

### How to explain it in one sentence

> One badge reader was running twelve minutes fast because the engineer set it that way;
> correcting it clears the head of security and puts the engineer outside the suite two
> minutes before the blow.

---

## Fastest possible demo

If you have two minutes and need to show the game working end to end, play **Case 01**:

```sql
SELECT * FROM suspects;
SELECT name, statement FROM witnesses;
SELECT * FROM access_logs WHERE access_time > '2026-09-15 18:45:00' ORDER BY access_time;
```

Three queries, and the accusation gate opens. Accuse **Daniel Okafor**, cite the door log
and the photocopier, and the case closes.

## Rescuing a stuck player at a festival

Don't give the name. Ask one of these instead — each is the exact question the case wants:

| Case | Ask them |
|------|----------|
| 01 | "What time did Professor Collins say she left? Now look at the door log after that." |
| 02 | "Everyone else is on a camera during the blackout. Who isn't?" |
| 03 | "Why would a night guard open the most doors? Try counting only the loading bay." |
| 04 | "The fob belongs to Sofia — but where is Sofia at 9:44? Who did she hand it to?" |
| 05 | "Compare the badge time and the camera time for the same person. What's the gap?" |
