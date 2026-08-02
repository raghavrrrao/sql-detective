# SQL Detective — Engineering Handover

This document explains the actual, current implementation of SQL Detective, file by file and
decision by decision. It is written for an engineer who did not write this code and has to be
productive in it immediately — for a viva, an interview, a tech-fest demo, or a maintenance
pass six months from now.

Every claim in this document was verified against the code in this repository while writing
it. Where the implementation is inconsistent, stale, or incomplete, that is stated explicitly
rather than smoothed over — see **§0 Known Issues** for the full list, referenced again inline
where relevant.

---

## §0. Known Issues (read this first)

Four things in the codebase are not what a first read of the file names would suggest. None of
them are bugs that break gameplay — they are traps for the next engineer.

1. **`server/src/database/connection.js` and `database/sql-detective.sqlite` are dead weight.**
   `getDatabase()` opens a top-level database file that is 0 bytes and never seeded. It exists
   for exactly one purpose: `/api/health` runs `SELECT 1` against it to prove SQLite itself
   works. **No game data ever lives in this file.** The five real case databases
   (`beginner.db` … `expert.db`) are opened separately, per request, by
   `server/src/database/caseDatabase.js`. If you see `sql-detective.sqlite` and assume it's the
   game database, you will waste an hour. See §7.

2. **`docs/architecture.md` and `docs/investigation-api.md` are stale**, written before the
   game was built out. `architecture.md` still says "No game routes or gameplay behavior are
   included yet" — false, there are two full game routes. `investigation-api.md` describes
   only `easy`/`medium`/`expert` databases, from before `beginner` and `intermediate` existed,
   and calls `medium.db` "Medium" when the catalog now presents that exact case as **"Hard"**
   to the player (see #3). Do not trust either file for current behavior; this document
   supersedes both.

3. **The internal case id and the displayed difficulty name diverge on purpose, for one case.**
   `medium.db` / id `'medium'` is presented to players as **"Hard"** (tier rank 4 of 5). The
   catalog comment at `caseCatalog.js:11-14` explains why: ids are load-bearing (API parameter,
   database filename, localStorage key) and can never change without orphaning saves, while
   `tier` is purely a display label. Renaming the id to match the display tier was rejected
   specifically to avoid a migration. See §9.

4. **Audio is wired up but produces no sound.** `SoundContext.jsx`, `SoundToggle.jsx`, and the
   `music`/`soundEffects` fields in settings are fully implemented and persisted, but the
   comment in `SoundContext.jsx:11-13` says it outright: *"Nothing plays yet — these are the
   switches a later release will read once licensed audio ships."* If a professor asks you to
   turn the sound on, the honest answer is that there is no audio asset in the project at all.

One more thing that is not a defect but will look like one until you've read §15: **the
correct answer to every case ships inside the JavaScript bundle**, in plain text, in
`client/src/utils/caseSolution.js`. This is a deliberate, documented tradeoff, not an oversight
— see §15 for why, and what it would take to close it.

---

## §1. Project Overview

**SQL Detective** is a browser-based educational game that teaches SQL by having the player
solve murder mysteries and thefts entirely through `SELECT` queries against a real SQLite
database. There is no multiple choice, no fill-in-the-blank, and no simulated query result —
every fact the player learns about a case comes from a query they wrote themselves, executed
against real data, returning real rows.

**The educational objective** is to teach *detective reasoning through SQL*, not SQL syntax in
isolation. A tutorial that says "here is what `WHERE` does" produces a student who can
recite the syntax and cannot use it. SQL Detective instead gives the player a reason to
want `WHERE` — *"four suspects are on camera during the blackout, find the fifth"* — and the
query becomes the tool that answers a question the player already has. This is why every case
in the catalog carries a `detectiveConcept` field (`caseCatalog.js`) alongside its
`sqlConcepts` field: the SQL is taught in service of a reasoning skill (see §9), not the other
way around.

**Why it exists**: it was built as an MCA (Master of Computer Applications) project intended
to demonstrate database literacy, full-stack engineering, and — through the detective framing
— a design sensibility beyond "CRUD app with a login page." It is meant to be genuinely played,
not just graded: it is deployed publicly (Render), demonstrated at a technical festival, and
walked through in a viva.

**Target audience**: two audiences the project has to satisfy simultaneously, and both are
visible in the code. First, **complete SQL beginners** — the Beginner case (`caseCatalog.js`,
id `beginner`) is built to be solvable by someone who has genuinely never written a query, using
only `SELECT`, `WHERE`, and `LIMIT`, in three deliberate steps (see the solution comment in
`server/scripts/seedBeginnerDatabase.js:4-31`). Second, **evaluators** — professors, judges,
interviewers — who will read the architecture, not just play the game. The five-tier
progression from Beginner through Expert (§9) exists to demonstrate a full SQL curriculum
(`SELECT`/`WHERE`/`LIMIT` → `JOIN`/`GROUP BY`/`HAVING` → CTEs/subqueries/date arithmetic) inside
one coherent product, which is itself part of the pitch.

**Why detective stories specifically**: a detective investigation and a `SELECT` query solve the
same *shape* of problem — you have partial information, and you narrow it down by asking
increasingly specific questions of a fixed set of facts. `WHERE` *is* "which of these fit the
alibi." `GROUP BY` *is* "who was at this door the most." A `LEFT JOIN … WHERE right.id IS NULL`
*is* "who has no alibi on record at all." The mapping is not decorative — every SQL concept
each case teaches was chosen because it is also the natural next question a detective would ask
(see the `hints` array on any case entry in `caseCatalog.js`, which are phrased as detective
reasoning, never as SQL syntax reference).

**Overall architecture, in one paragraph**: a React single-page app (Vite-built, served as
static files) talks to a small stateless Express API over two endpoints — one that returns a
case briefing, one that runs a single read-only SQL statement against that case's own SQLite
file and returns the rows. All game state — progress, notebook, discoveries, timer, score,
leaderboard — lives entirely in the browser's `localStorage`; the server holds no session,
no player identity, and no game logic beyond "is this SQL safe to run against this file." This
split is deliberate and is explained in full in §2 and §11.

---

## §2. Tech Stack

Every choice below is evaluated against what this specific project needed, not in the
abstract. Where a mainstream alternative would have been the "expected" choice, that is named.

### Why React
The UI has substantial client-side state that must survive without a server round-trip on
every interaction — an open notebook tab, a timer that must keep running while a modal opens,
a SQL draft that must not be lost when the results panel updates. React's component model plus
`useReducer` (used for the entire investigation session, see §11) fits an app that is
fundamentally "one page with many overlapping panels of live state" better than a
multi-page-navigation framework would. **Tradeoff**: a heavier initial bundle than a
server-rendered alternative; accepted because the app is a single long-lived session per case,
not a content site optimizing first paint.

### Why Node / Express
The backend's entire job is: validate a SQL string, run it against a `sqlite3` file, return
JSON. Express was chosen because that job needs almost no framework — five routes, four
middleware functions (`server/src/app.js`). A heavier framework (NestJS, for instance) would
add structure this API doesn't need. Node was chosen over a different backend language mainly
for **team velocity and one runtime for both halves of the stack** — sharing `npm`, one
`package.json` workspace root (`package.json:6` — `"workspaces": ["client", "server"]`), one
install step, one deploy target.

### Why Express specifically over Fastify/Koa
No specific advantage was exploited (no plugin ecosystem, no schema validation library is
used) — Express was chosen for its ubiquity and the fact that every piece of documentation and
troubleshooting resource assumes it. For a project this size the choice is close to
interchangeable; this is the least defensible "why" in the stack and the honest answer is
familiarity.

### Why SQLite (and not MySQL/PostgreSQL)
This is the most consequential infrastructure decision in the project, and it is correct for
what the game actually needs:

- **A case database is read-only, single-file, and fully determined at authoring time.** There
  are no writes to game data at runtime — the player's SQL is `SELECT`-only (§8) and nothing a
  player does ever mutates a case database. A client/server RDBMS (Postgres/MySQL) is built to
  arbitrate concurrent writers; this project has zero writers per case database at runtime.
  Paying for that machinery buys nothing here.
- **A `.db` file is the natural unit of "one case."** SQLite's whole database is one file on
  disk, which lets "add a case" mean "add a file" (§7, §17) with no server-side schema
  migration, no new tenant, no new connection pool entry.
  `server/src/database/caseDatabase.js:6` is a five-line static map from a difficulty id to a
  filename — that is the entire multi-tenancy story.
- **Deployment simplicity.** Render's free tier is a single container with an ephemeral
  filesystem for anything not explicitly a managed add-on. A Postgres instance is another
  service to provision, another set of credentials to rotate, another point of failure between
  "the code deployed" and "the game is playable." SQLite needs nothing but the file being
  present, which `server/scripts/ensureProductionDatabase.js` verifies at boot and refuses to
  start without (§16).
- **Offline play.** The game is explicitly designed to run on a laptop with no internet at a
  tech fest (`npm start`, `localhost:10000`) — see the deployment conversation history and
  `render.yaml`. A Postgres dependency would make that impossible without also shipping and
  running a database server locally.

**What this costs**: no concurrent-write safety net (irrelevant, see above), no built-in
full-text search or advanced query planner tuning (irrelevant at this data volume — the
largest case, `expert.db`, is 136 authored rows), and no horizontal read scaling story if this
ever needed to serve thousands of simultaneous players (a real limitation if the deployment
target ever changes — see §14).

### Why a separate SQLite database per case, instead of one database with a `case_id` column
Two enforcement layers stack, and one of them is only available because the databases are
separate files:

1. **Structural spoiler prevention.** A case's own file only contains that case's evidence. If
   all cases lived in one database, one careless `SELECT * FROM suspects` (no `WHERE case_id =
   ?`) would leak every case's suspects — including cases the player has not unlocked yet, or
   has not even seen the briefing for. With five separate files, `openReadOnlyCaseDatabase()`
   (`caseDatabase.js:15-22`) opens *only* the file for the difficulty in the request; a query
   against `beginner.db` cannot see a single row of `easy.db` even if the SQL tried to, because
   there is no cross-database join possible through this connection.
2. **The player's own exploration boundary matches the database boundary.** Every table the
   player can query (`sqlite_master` enumeration in `caseController.js:22`) belongs to the one
   case in front of them. There is no `WHERE case_id = 5` for the player to accidentally omit
   and no risk of a schema design mistake elsewhere leaking a `case_id`-less table.
3. It also means **adding a case never touches an existing case's schema, data, or risk
   surface** — see §17. `createCaseDatabase()` (`seedHelpers.js:14-21`) drops and rebuilds one
   file from `case-schema.sql`; the other four files are untouched by construction, not by
   discipline.

**Tradeoff acknowledged**: the same 16-table schema is duplicated five times
(`database/case-schema.sql`), so a schema change (a new column, say) means re-running five seed
scripts rather than one migration. For five cases authored by one team, this is a good trade;
it would not scale to fifty cases without tooling.

### Why Tailwind CSS
Utility classes were chosen over a component library (MUI, Chakra) because the visual identity
— a "noir detective board" aesthetic with hand-tuned clip-path corners, film grain textures,
and a specific colour palette (`tailwind.config.js:11-18`) — has no off-the-shelf component
library that produces it. Tailwind gives full control at the utility level without hand-writing
a CSS file per component. The custom typography tokens layered on top
(`client/src/styles/index.css`, `.typo-body`, `.typo-heading`, etc.) exist because raw
utility classes alone produced dozens of near-duplicate weight/line-height/letter-spacing
combinations across the app — the tokens are the project's own small design system built on
top of Tailwind's utilities, not a replacement for them.

### Why Vite
Vite was chosen over Create React App (deprecated by the time this project started) or webpack
directly, for fast dev-server cold start and instant HMR on a codebase with ~2,300 lines of
state-layer JS alone plus ~50 components. `client/vite.config.js` proxies `/api` to
`localhost:4000` in development so the client and server can run on separate ports
(`npm run dev`, root `package.json:8`, uses `concurrently`) while looking same-origin to the
browser — in production this proxy is unnecessary because Express serves the built client
directly (`app.js:28-35`).

### Why Render
Render was chosen for **zero-config Node deployment from a Git push**, a free tier sufficient
for a low-traffic educational demo, and — critically — **a normal writable-filesystem Linux
container**, which SQLite needs (see §2's SQLite section and §16). Vercel was explicitly
considered and rejected: Vercel's serverless functions have a read-only filesystem outside
`/tmp`, and `connection.js:11` calls `fs.mkdirSync` on the database directory at runtime, which
would throw `EROFS` on Vercel. Render runs the app as a conventional long-lived process, which
is what this codebase assumes throughout.

---

## §3. Folder Structure

```
sqlgame/
├── client/                    Vite + React SPA
│   ├── public/fonts/          Self-hosted webfonts (see below)
│   ├── src/
│   │   ├── pages/             One component per route
│   │   ├── layouts/           RootLayout — the one persistent shell
│   │   ├── components/        Everything reusable; components/notebook/ for notebook tabs
│   │   ├── state/              investigationSession.jsx, gameMode.jsx — the two React contexts
│   │   ├── context/            SoundContext.jsx
│   │   ├── catalog/            caseCatalog.js — the single source of truth for every case
│   │   ├── utils/               Pure functions: scoring, discovery, objectives, accusation, storage…
│   │   ├── hooks/               useInvestigationCase, useDebouncedField
│   │   ├── services/            api.js (axios instance), caseService.js (typed API calls)
│   │   ├── images/              Five case artwork PNGs
│   │   ├── styles/index.css     Tailwind layers + font-face + typography tokens
│   │   └── router.jsx           createBrowserRouter — every route in one file
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/
│   ├── src/
│   │   ├── routes/              Thin — one line per route, no logic
│   │   ├── controllers/         Request/response glue only
│   │   ├── services/            queryService.js — the actual query execution engine
│   │   ├── middleware/          errorHandler.js, notFound.js
│   │   ├── database/            connection.js (unused health-check db), caseDatabase.js (real per-case open/close)
│   │   ├── config/               env.js (validated env vars), caseMetadata.js (per-case display strings)
│   │   ├── utils/                AppError.js, sqlPolicy.js (the security-critical file)
│   │   ├── app.js               Express app assembly — middleware order lives here
│   │   └── server.js            Process entry point — listen + graceful shutdown
│   └── scripts/                 seedBeginnerDatabase.js … seedExpertDatabase.js, ensureProductionDatabase.js
├── database/
│   ├── case-schema.sql          The one schema every case database is built from
│   ├── schema.sql               Empty/unused — predates the case-database architecture
│   ├── beginner.db … expert.db  Five self-contained SQLite files, committed to the repo
│   └── sql-detective.sqlite     0-byte, health-check only — see §0
├── docs/                        This file, plus three stale/narrower prior docs
├── render.yaml                  Render deploy config
└── package.json                 Workspace root — dev/build/seed/start orchestration
```

**What belongs where, and why:**

- **`catalog/`** is deliberately singular — one file, `caseCatalog.js`. Every other part of the
  client (progression, accusation thresholds, starter queries, card copy, route slugs) reads
  from this file rather than hardcoding case-specific values. This is what makes §17 ("add a
  case") a one-file-plus-one-database change instead of a search-and-replace across dozens of
  components.
- **`state/`** holds exactly two files because there are exactly two pieces of global,
  cross-route state: the investigation session (one case's live progress) and the game mode
  (which machine-wide mode is active). Everything else is either server data fetched per
  screen (`hooks/useInvestigationCase.js`) or local component state.
- **`utils/`** is pure, synchronous, framework-free logic — no React imports anywhere in this
  folder. This is intentional: the scoring formula, the discovery engine, and the accusation
  grader are all things you would want to unit-test or reason about without a browser, and
  keeping them free of React means they *can* be.
- **Backend `routes/` vs `controllers/` vs `services/`** is a strict three-layer split: routes
  declare URLs only, controllers translate HTTP↔domain calls and handle nothing else,
  services hold actual logic. `queryController.js` (14 lines) does no SQL work itself — it
  calls `executeInvestigationQuery` in `services/queryService.js`, which is where the real
  engine lives (§8).

---

## §4. Application Flow

Tracing one real playthrough end to end, file by file.

**1. Opening the website** → `client/index.html` loads `main.jsx`, which mounts
`RouterProvider` with the router from `router.jsx`. `RootLayout` (`layouts/RootLayout.jsx`)
wraps everything in `GameModeProvider` and `SoundProvider`, then renders `ModeSelectionGate`
unconditionally and the actual route only if a mode has already been chosen
(`hasChosenMode && !needsDetectiveName`).

**2. Mode gate** → If this is the first visit on this machine (`readSettings().mode === null`,
`gameSettings.js:20`), `ModeSelectionGate.jsx` blocks everything behind a full-screen dialog:
Festival Mode or Personal Mode. Choosing Festival additionally asks for a detective name before
unblocking. This is the *only* place this question is asked — it is stored in
machine-wide, unscoped `localStorage` (`gameSettings.js`, `storage.js:79-83`) and re-used on
every future visit unless changed from Settings.

**3. Home** (`pages/HomePage.jsx`) → the landing page: hero, the five difficulty cards
(`DifficultyCard.jsx`, reading from `displayCases` in the catalog), "How it works." No API call
yet — everything here is static catalog data plus whatever's in `localStorage` progress.

**4. Case selection** (`pages/DifficultyPage.jsx`) → renders one `CaseSelectionCard` per catalog
entry, each showing status (`new` / `opened` / `in-progress` / `solved` / `sealed`) computed by
`getCaseStatus()` in `caseProgress.js:141-146`, purely from the localStorage progress store.
Locked cards (per `isCaseLocked()`, `caseProgress.js:121-134`) open `LockedCaseDialog` instead
of navigating.

**5. Briefing** (`pages/CaseIntroPage.jsx`) → the first network call of the session. On mount,
if the case is unlocked, `markCaseOpened(difficulty)` fires (recording `opened: true` in
progress — this **does not** unlock the next case; only *solving* does, see §9). The page
itself is populated entirely from static catalog fields (`victim`, `date`, `time`, `location`,
etc. on the `CaseEntry` — no fetch is needed here because the briefing page's static facts
duplicate what's already in `caseCatalog.js`).

**6. Investigation** (`pages/InvestigationLoadingPage.jsx` → `InvestigationLayout.jsx`) → *this*
is where the real API call happens: `useInvestigationCase(difficulty)`
(`hooks/useInvestigationCase.js`) calls `fetchCaseBriefing()` →
`GET /api/case/:difficulty` → `caseController.getCaseBriefing` (§6), which opens the case's
SQLite file **read-only**, runs seven small `SELECT`s to build the initial notebook payload
(evidence, suspects sans `status`, witnesses, crime scene, timeline, table list with row
counts), and returns it as one JSON object. Once loaded, `InvestigationLayout` mounts
`InvestigationSessionProvider` (§11), which is the reducer that owns everything from this
point on.

**7. SQL query** → the player types in `SQLEditor` (Monaco), presses **Ctrl+Enter** or the Run
button, which calls `runQuery()` from `useInvestigationActions()`
(`investigationSession.jsx:506-534`). This dispatches `queryStart`, then awaits
`executeCaseQuery(difficulty, statement)` (`services/caseService.js`).

**8. Backend** → `POST /api/query` → `queryController.runQuery` → `executeInvestigationQuery`
(`services/queryService.js:69-78`), which first validates the SQL through
`validateReadOnlySql()` (§8, the security-critical function), then opens the same case file
read-only again (a fresh connection per request — no pooling) and steps the prepared statement
row by row, capped at `QUERY_ROW_LIMIT` (200 default) and `QUERY_TIMEOUT_MS` (2000ms default).

**9. SQLite** → executes the player's statement verbatim, unmodified, unwrapped — column names
in the response are exactly what SQLite itself produced, including for `JOIN`s and computed
expressions.

**10. Results** → the response `{ columns, rows, rowCount, executionTime }` returns to the
client, which dispatches `querySuccess`. This single action is where nearly all of the game's
"intelligence" actually happens (`investigationSession.jsx:91-178`): it runs
`extractDiscoveries()` to turn the raw rows into discovery records, merges them into the
player's cumulative discovery list, updates the per-suspect intel files, recomputes objective
completion, and writes journal entries for anything new. `QueryResultsTable.jsx` then renders
the raw rows in a table.

**11. Notebook** (`NotebookModal.jsx`) → a ten-tab modal (`Overview`, `Objectives`, `Journal`,
`Discoveries`, `Timeline`, `Suspects`, `Hints`, `Case file`, `History`, `Notes`), all reading
from the same session state that step 10 just updated. Nothing here re-queries the server —
the notebook is a *view* over accumulated client state, never a new fetch.

**12. Accusation** (`AccuseButton` → `AccuseModal.jsx`) → gated by `readiness` from
`assessReadiness()` (§10). Filing an accusation calls `submitAccusation()`
(`investigationSession.jsx:592-670`), which grades locally via `evaluateAccusation()` — the
comparison against the actual solution (`isAccused()`, `caseSolution.js`) happens **entirely
client-side**; nothing is sent to the server to be checked (§15 covers what this costs).

**13. Case Closed** (`CaseClosedScreen.jsx`) → only reachable on a proven verdict. On proof, the
session additionally fires two more read-only queries against the case database — the killer's
full suspect row and the victim's row — purely to *display* the reveal
(`investigationSession.jsx:613-618`); this is not part of grading, grading already happened.
`markCaseSolved()` writes the permanent report into `caseProgress.js`'s progress store,
independent of the (now-disposable) investigation session.

**14. Leaderboard** (Festival Mode only, `FestivalScoreSummary.jsx` → `LeaderboardPanel.jsx`) →
`recordResult()` (`leaderboard.js:37-65`) files the score into a machine-wide,
unscoped leaderboard list, sorted by score then by time.

**15. Progression** → back on `DifficultyPage`, `getCompletion()` and `isCaseLocked()`
(`caseProgress.js`) now read the freshly-written `solved: true` entry and unlock the next case
in `order`.

---

## §5. Frontend

### Routing
`router.jsx` uses `createBrowserRouter` with a single flat route tree under one `RootLayout`
element — six routes total: `/`, `/difficulty`, `/how-to-play`, `/settings`, `/case/:difficulty`,
`/investigation/:difficulty`. There is no nested route beyond this one level and no lazy
route-level code splitting (see §14 for the bundle-size consequence of that).

Case URLs use a **route slug**, not the internal id, resolved through
`resolveCaseRouteParam()` (`caseCatalog.js:338-344`) — this is the mechanism by which
`medium.db` (internal id) is reachable at `/case/hard` (public URL), keeping §0's id/tier split
invisible to players and to anyone reading the URL bar.

### State management
Two React Context pairs carry all cross-component state (§11 for full detail on the session
one):

- **`gameMode.jsx`** — one context, `GameModeProvider`, holding which mode is active, the
  detective's name, audio toggles, and a `sessionNonce` used to force-remount the entire route
  tree (`RootLayout.jsx:19`, `<Outlet key={sessionNonce} />`) whenever storage is wiped out from
  under the running app (mode switch, "next detective," "clear progress"). This is the
  mechanism that lets the app fully reset itself **without ever asking the player to refresh
  the browser** — a hard requirement for festival deployment on a shared machine.
- **`investigationSession.jsx`** — deliberately split into **four separate contexts**
  (`SessionDataContext`, `SessionActionsContext`, `SqlDraftContext`, `SessionTimerContext`,
  lines 32-37) rather than one. The reasoning is stated directly in the source comment: the SQL
  editor's draft text changes on every keystroke and the timer ticks every second: subscribing
  either of those to the same context as "everything else" would re-render the notebook, the
  suspect roster, and the case board on every keystroke and every second. Splitting means a
  component that only reads `useInvestigationTimer()` re-renders once a second; a component
  that only reads `useSqlDraft()` re-renders on keystrokes; neither re-renders the other's
  triggers.

### Components — page hierarchy
```
RootLayout
 └─ ModeSelectionGate (blocking, conditional)
 └─ Outlet
     ├─ HomePage           → Hero, DifficultyCard×5, HowItWorks
     ├─ DifficultyPage     → CaseSelectionCard×5, DetectiveCareer/CareerSummary, LeaderboardPanel (festival)
     ├─ HowToPlayPage      → static onboarding (see §13)
     ├─ SettingsPage       → mode/audio toggles, danger-zone resets
     ├─ CaseIntroPage      → static briefing facts, CaseHeader
     └─ InvestigationLoadingPage → (on success) InvestigationLayout
          └─ InvestigationSessionProvider
              └─ InvestigationBoard
                  ├─ HeaderBar (case title, timer, score, notebook/search buttons)
                  ├─ Sidebar (case-file folders — evidence, witnesses, crime scene, timeline, notes)
                  ├─ TerminalPanel → SQLEditor (Monaco) + QueryToolbar
                  ├─ ResultsPanel → QueryResultsTable
                  ├─ SuspectPanel → SuspectCard×N
                  ├─ CaseTablesPanel (clickable table list → writes a starter SELECT)
                  ├─ AccuseButton → AccuseModal
                  ├─ NotebookModal (10 tabs, see §10)
                  ├─ GlobalSearchModal (Ctrl+K)
                  ├─ CaseClosedScreen → CaseDebrief, FestivalScoreSummary
```

### Reusable components worth knowing
- **`ReusableModal.jsx`** is the single dialog primitive every modal in the app is built on
  (`NotebookModal`, `AccuseModal`, `GlobalSearchModal`, `CaseDebrief`, `FestivalScoreSummary`
  all wrap it). It owns focus trapping, `Escape`-to-close, restoring focus to whatever opened
  it, and locking body scroll while open — implemented once, correctly, rather than five times.
  `dismissible={false}` exists for exactly one dialog: the final accusation confirmation, which
  must be answered, not dismissed.
- **`ActionButton.jsx`** and **`SectionHeading.jsx`** are the two small "make every screen look
  the same" primitives — a button variant map and a title/eyebrow/description heading pattern
  used on nearly every page.

### Styling system
Tailwind utility classes plus a small custom token layer in `client/src/styles/index.css`
(`@layer utilities`). The tokens (`.typo-body`, `.typo-body-secondary`, `.typo-document`,
`.typo-heading`, `.typo-logo`, `.typo-meta`, `.typo-button`) exist specifically to prevent the
app from accumulating dozens of near-duplicate `font-weight`/`line-height`/`letter-spacing`
combinations across components — see §13 for the full typography rationale, which was a
deliberate multi-pass design decision (not an accident of Tailwind defaults).

### Typography — five fonts, five distinct jobs
This is a genuinely non-obvious part of the codebase and worth understanding precisely, because
it went through several iterations and the final state is intentional:

| Font | Role | Why |
|---|---|---|
| **IM Fell English SC** | Wordmark, landing title, major splash screens only | A small-caps serif reserved for "this is a title screen," used nowhere else |
| **Rubik Dirt** | Case titles, difficulty titles, verdict screens, career ranks | Used *sparingly* — 10 call sites total — so it reads as an event, not wallpaper |
| **Special Elite** | Case descriptions, witness statements, notebook prose, debrief text | A typewriter face for anything that reads as "a document from the case file" |
| **Rajdhani** | Buttons, menus, settings, general UI | The interface face — never decorative |
| **Oxanium** | Timer, score, leaderboard numbers | `font-variant-numeric: tabular-nums` so digits don't jitter as they change |
| **JetBrains Mono** | SQL editor, SQL results, terminal output | Monospace, unrelated to the above five |

All five webfonts are **self-hosted** (`client/public/fonts/`, `@font-face` in `index.css`) —
not loaded from Google Fonts at runtime — specifically because the game has to run offline on a
festival laptop with no internet. Rubik Dirt is further **subsetted to uppercase glyphs only**
(its grunge-outline glyphs cost 302 KB unsubsetted for ten headings; the subset is 156 KB), which
is *why* `.typo-heading` hardcodes `text-transform: uppercase` in the token itself rather than
leaving it to call sites — the subset font has no lowercase glyphs to fall back to.

### Responsive design
No responsive framework beyond Tailwind's breakpoint prefixes. The app was explicitly audited
and hardened at 320/375/390/414/768px (see the mobile-polish work: modal sizing uses `dvh` not
`vh` so mobile browser chrome collapse doesn't clip a dialog; the notebook's ten tabs collapse
from an 8-row wrapped grid into one horizontally-scrolling row below `sm`; the SQL results table
scrolls horizontally inside its own container rather than pushing the page wider). Desktop
layout and spacing were explicitly preserved during that pass — see the earlier typography/
mobile conversation history for the itemized before/after.

---

## §6. Backend

### Express structure
`app.js` is the entire wiring in one file, 39 lines:
```js
app.use(cors({ origin: env.clientOrigin === '*' ? true : env.clientOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRouter);
app.use('/api/case', caseRouter);
app.use('/api/query', queryRouter);
if (fs.existsSync(clientBuildDirectory)) { /* serve client/dist as static + SPA fallback */ }
app.use(notFound);
app.use(errorHandler);
```
Middleware order matters here in two specific ways worth knowing: the static-file block is
conditional on `client/dist` existing, so `npm run dev:server` alone (without a client build)
still boots correctly and just serves API routes; and `notFound`/`errorHandler` are last,
Express convention, so any unmatched route or thrown error is guaranteed to hit them rather
than hang.

### Routes → Controllers → Services (strict separation)
Every route file is one line of actual logic:
```js
// caseRoutes.js
caseRouter.get('/:difficulty', getCaseBriefing);
// queryRoutes.js
queryRouter.post('/', runQuery);
```
Controllers do request/response translation and nothing else. `queryController.runQuery`
(14 lines total) validates that the difficulty exists, delegates to
`executeInvestigationQuery()`, and either responds with JSON or forwards the error to
`next()`. All actual logic — SQL validation, statement execution, row streaming, timeout
handling — lives in `services/queryService.js`.

### Case loading (`caseController.getCaseBriefing`)
Runs seven queries in parallel (`Promise.all`) against the case's own read-only connection:
evidence (12 rows max), suspects **excluding `status`** (10 max — the comment at
`caseController.js:15-16` is explicit: `status` is a case-authoring column, deliberately never
sent to the client, so nothing in the briefing payload can leak alibi state), witnesses (8),
crime scene (6), security logs / timeline (8), a document count, and every table name in the
schema. It then counts rows in **every** table and filters to only the ones with `rowCount >
0` — this is how a theft case (with zero rows in `victims`) never shows a `victims` table on
the board, without any per-case special-casing in this controller.

### Query execution — the two-request lifecycle
Every `/api/query` call opens a **fresh** SQLite connection
(`openReadOnlyCaseDatabase`) and closes it in a `finally` block after the query settles
(`queryService.js:73-77`). There is no connection pool. For a project at this scale (a handful
of concurrent players, queries that finish in single-digit milliseconds against a
sub-200-row database) this is the right tradeoff — pooling would add complexity to solve a
problem that doesn't exist at this load. It would need revisiting before any large-scale
concurrent deployment (§14).

### Validation
Covered fully in §8 — `sqlPolicy.js`'s `validateReadOnlySql()` is the single security gate every
query passes through before it ever reaches SQLite.

### Accusation flow (server's role: none)
Worth stating plainly because it surprises people: **the server has no accusation endpoint.**
There is no `POST /api/accuse`. Grading a verdict is entirely a client-side computation
(`evaluateAccusation()` in `utils/accusation.js`, called from
`investigationSession.jsx:592-670`) that compares the player's chosen suspect name against a
name baked into the client bundle (`caseSolution.js`). The server is used *after* a proven
verdict only, to fetch two more rows for the reveal screen — that fetch has no bearing on
whether the verdict was correct. See §15 for the security implications of this design.

### Security
Covered in full in §15.

---

## §7. Database

### Why every case has its own SQLite database
Answered in depth in §2. Summarizing the mechanism: `server/src/database/caseDatabase.js:6`
holds a static, frozen map:
```js
const caseFiles = Object.freeze({
  beginner: 'beginner.db', easy: 'easy.db', intermediate: 'intermediate.db',
  medium: 'medium.db', expert: 'expert.db',
});
```
`resolveCaseDatabase(difficulty)` looks up the filename, joins it against
`env.caseDatabaseDirectory` (resolved from `DATABASE_PATH`/repo layout in `config/env.js`), and
returns `null` if the file doesn't exist on disk — which is how a not-yet-authored case (like
`intermediate` was, for a period — see the "Five-Case Progression" milestone in project history)
degrades to a 404 rather than a crash, and how `getUnlockGate()` in the catalog
(`caseCatalog.js:399-407`) can treat an unauthored slot as transparent to the progression
chain.

### The five files, and what distinguishes them mechanically
All five share **exactly the same 16-table schema** (`database/case-schema.sql`) — `suspects`,
`victims`, `evidence`, `crime_scene`, `witnesses`, `phone_logs`, `cctv_logs`, `access_logs`,
`locations`, `vehicles`, `employees`, `fingerprints`, `weapons`, `documents`, `emails`,
`security_logs`. What differs case to case is **only data**: how many rows each table holds,
whether `victims` has any rows at all (theft cases have zero — `beginner.db` and
`intermediate.db` are both thefts, `crimeType: 'theft'` in the catalog), and which SQL features
are *required* to separate signal from noise in that data (this is a data-design decision, not
a schema one — see the seed-file solution comments, e.g.
`seedBeginnerDatabase.js:9-11`: *"solvable with SELECT, WHERE and LIMIT. No ORDER BY, no
aggregate and no JOIN is required at any point"*).

| id | file | rows (approx, per seed console output) | crimeType |
|---|---|---|---|
| `beginner` | `beginner.db` | 27 | theft |
| `easy` | `easy.db` | 79 | homicide |
| `intermediate` | `intermediate.db` | 87 | theft |
| `medium` | `medium.db` | 99 | homicide (displays as **"Hard"**, §0) |
| `expert` | `expert.db` | 136 | homicide |

### How a case is loaded
Two separate, independent paths hit the database, and it's worth keeping them distinct in your
head:
1. **Briefing load** (`GET /api/case/:difficulty`) — server-side, opens the file, runs seven
   fixed `SELECT`s that the *game* wrote, returns a curated JSON payload. The player never sees
   raw SQL here.
2. **Player query** (`POST /api/query`) — opens the same file again, runs whatever `SELECT` the
   *player* wrote, after validation (§8).

Both paths open **read-only** (`sqlite3.OPEN_READONLY`, `caseDatabase.js:19`) — this is a second,
independent enforcement layer on top of the SQL-keyword validation: even if a malicious
statement somehow slipped the keyword filter, the OS-level file mode means SQLite itself
refuses the write.

### Why this architecture was chosen (recap, mechanistic view)
The choice pays for itself specifically in three places you can point to in the code:
`caseDatabase.js`'s five-line file map (adding a case is one new line + one new file, §17);
`caseCatalog.js`'s `status: 'available'` field plus `getUnlockGate()`'s skip-unauthored-slots
logic (a case can be *announced* in the catalog with a "Coming soon" card before its database
exists, with zero risk of the missing file crashing anything — `resolveCaseDatabase` returns
`null`, `openReadOnlyCaseDatabase` returns `null`, both controllers turn that into a clean 404);
and the read-only open mode, which is only meaningfully enforceable per-file — a shared
multi-tenant database would need per-query authorization logic to achieve the same guarantee
that a one-line `OPEN_READONLY` flag gives here for free.

---

## §8. SQL Engine

This is the most carefully engineered part of the codebase, and it's worth reading
`server/src/utils/sqlPolicy.js` directly rather than trusting a summary. What follows is exact.

### How SQL is executed
`queryService.js`'s `runQuery()` (lines 20-67) does not use `database.all()` (which buffers
every row in memory before returning). It uses `database.prepare()` + a manual `step()` loop
calling `.get()` repeatedly, so it can **stop stepping the instant the row cap is hit**
(`env.queryRowLimit`, default 200) rather than fetching everything and truncating afterward.
The statement is run **verbatim, never wrapped** in an outer `SELECT` — the comment at line
17 explains why: wrapping would rename or collide `JOIN` result columns, and the player needs
to see exactly the column names SQLite itself produced.

A `setTimeout` (line 43) calls `database.interrupt()` if the query hasn't settled within
`QUERY_TIMEOUT_MS` (default 2000ms), turning a runaway query into a clean, friendly 408 rather
than a hung connection.

### Why only SELECT (and WITH, and read-only EXPLAIN) is allowed
`validateReadOnlySql()` (`sqlPolicy.js:75-97`) runs a sequence of checks, in order:
1. **Not empty**, under 10,000 characters.
2. **Scrub literals and comments** (`scrubLiteralsAndComments`, lines 19-68) — this is the
   subtle, important part. It walks the SQL character-by-character and blanks out (replaces
   with spaces, preserving length and every character offset) the *contents* of `--` line
   comments, `/* */` block comments, and anything inside `'…'`, `"…"`, `` `…` ``, or `[…]`
   quoting — including correctly handling a doubled quote (`''`) as an escaped quote rather
   than a terminator. **Why this matters**: without it, a player writing
   `SELECT * FROM suspects WHERE name = 'DROP TABLE'` would trip a naive keyword filter on the
   literal string `DROP TABLE`, even though it's just a string value, not a statement. After
   scrubbing, keyword and statement-boundary checks run only over actual SQL *structure*, never
   over player-supplied text.
3. **One statement only** — a semicolon is only allowed to be the very end; anything with
   non-whitespace content after it throws. Multiple stacked statements
   (`SELECT 1; DROP TABLE x;`) are rejected here, before the forbidden-keyword check even runs,
   because SQLite's `prepare()` would otherwise silently execute the first and ignore the rest,
   giving a false sense of safety.
4. **Forbidden keyword scan** — a regex blocklist: `alter|analyze|attach|begin|commit|create|
   delete|detach|drop|insert|into|pragma|reindex|release|rollback|savepoint|truncate|update|
   vacuum`. The comment at line 5 explicitly notes `end`, `replace`, and `case` are *excluded*
   from this list on purpose, because they are legal inside a plain `SELECT` (`CASE … END`,
   the `replace()` string function) and blocking them would break legitimate queries.
5. **Must start with `SELECT`, `WITH`, or `EXPLAIN [QUERY PLAN] SELECT/WITH`** — a positive
   allowlist, not just a negative blocklist. This is what actually enforces "read-only" as a
   design rather than as a list of banned words: nothing that *isn't* one of these three
   leading forms can execute at all, regardless of what mutation keywords it might or might not
   contain.

### The second enforcement layer
Even if a statement somehow passed all of the above, the database connection itself is opened
`sqlite3.OPEN_READONLY` (`caseDatabase.js:19`). A write attempt would be rejected by SQLite at
the OS/file level, independent of the application-level keyword check. **Defense in depth,
not defense in one place.**

### How errors are handled
`friendlyError()` (`queryService.js:9-13`) strips SQLite's internal `SQLITE_XXXX:` error code
prefix and returns the remaining human-readable text as a `400 AppError`. A specific
`SQLITE_INTERRUPT` (from the timeout) becomes a distinct, friendlier 408 message
("Your query took too long to run. Try narrowing the result set.") rather than a raw SQLite
error string. On the client, `QueryResultsTable.jsx`'s `hintFor()` goes one step further and
maps common error substrings (`"no such table"`, `"no such column"`, `"read-only"`, `"syntax
error"`, `"one sql statement"`, `"cannot reach"`) to an actionable, beginner-friendly next step
— this is a second, purely presentational layer on top of the server's already-friendly
message.

### How query results return, and what the client does with them
The raw `{ columns, rows, rowCount, executionTime }` is rendered directly in
`QueryResultsTable.jsx`. But the *side effects* of a successful query are where the real game
logic lives — see §10 (Discovery Engine) for what happens to those rows after they land.

---

## §9. Case System

### Case catalog (`client/src/catalog/caseCatalog.js`)
Already covered mechanically in §3 and §5; the key structural idea is `defineCase()`
(lines 80-90), which merges every entry over a shared `defaults` object so that a new case only
has to state what's *different* from the norm — `objectives`, `thresholds`, `theme`, etc. all
fall back to sane defaults if omitted. Five exported entries currently exist, each built with
`defineCase({...})`.

### Metadata that lives server-side vs client-side (a real split, worth knowing)
There are **two** separate per-case metadata sources, and they are not merged automatically —
this is a place a future engineer could introduce a bug by editing one and forgetting the
other:
- `client/src/catalog/caseCatalog.js` — everything the *UI* needs: title, tier, hints,
  thresholds, starter query, theme, route slug.
- `server/src/config/caseMetadata.js` — a much smaller, separate object keyed the same way,
  holding only `caseNumber`, `title`, `difficulty`, `timer`, `score`, `victim`, and
  `initialNotebook` (an array of plain-English lead sentences shown in the notebook's "Notes"
  folder). This is what `caseController.getCaseBriefing` merges into the briefing response as
  `case: metadata`.

**Why two files instead of one shared one**: the server metadata is deliberately small and
contains nothing that would be a spoiler risk to import into a client bundle unreviewed, and
the client catalog contains UI concerns (icon names, theme colors, route slugs) the server has
no reason to know about. In practice this means **titles and victim names are duplicated in
two places** — if you rename a case, you must edit both `caseCatalog.js` and
`caseMetadata.js`, or the briefing screen and the investigation header will disagree. This is
explicitly called out again in §17's checklist.

### Objectives
Defined once as a *library* (`utils/objectives.js:22-65`, 8 possible objectives: `victim`,
`suspects`, `witnesses`, `evidence`, `access`, `timeline`, `contradiction`, `accusation`), each
with an `isComplete(state)` predicate that reads only from *investigation signals* — which
tables were successfully queried (`reach.tables`), which SQL features were used
(`reach.features`), and whether the case is solved. **Every objective is measured, never
manually checked off by the player** — there is no "mark objective complete" button anywhere.
Each case in the catalog then lists a *subset* of these ids in its `objectives` array — the
tutorial case uses five, an expert case can use all eight — and `evaluateObjectives()`
(`objectives.js:72-85`) resolves that per-case list against the shared library. Adding a new
kind of objective means adding one entry to the library; every case can then opt in by listing
its id.

### Difficulty
A **display-only** five-tier scale (`tier` + `tierRank`, 1–5: Beginner, Easy, Intermediate,
Hard, Expert), entirely separate from the internal id (§0/§3). Difficulty is expressed almost
entirely through **what SQL is required to separate signal from noise in the data**, not
through plot complexity or vocabulary — see the seed-file solution comments cited throughout
this document, each of which explicitly states which SQL constructs are and are not required.

### Case loading (client-side)
`useInvestigationCase(difficulty)` (`hooks/useInvestigationCase.js`) is a small, self-contained
fetch hook: loading/error/data state, plus a `retry()` that just bumps a counter to re-run the
effect — this is what powers the "Try again" button on `InvestigationLoadingPage`'s error
screen.

### Unlock progression
Fully implemented in `utils/caseProgress.js`, and it is more careful than it first appears:

- **A case unlocks only once the one before it is *solved*, never merely opened.**
  `isCaseLocked()` (lines 121-134) checks `!progress[gate.id]?.solved`.
- **Festival Mode bypasses progression entirely** (line 126) — a participant with ten minutes
  should be able to jump straight to the tutorial, and a confident one should be able to jump
  straight to Expert, on a shared demo machine. This is a deliberate UX decision for the
  festival context, not a bug.
- **A versioned migration exists** (`readStore()`, lines 38-61) for a *prior* progression rule
  that unlocked on "briefing opened" rather than "solved" — the migration grandfathers anyone
  who had already reached a case under the old rule (`unlockedLegacy: true`) rather than
  silently re-locking content they'd already been given access to. This is a real,
  already-shipped example of "never silently erase progress," a constraint explicitly placed on
  an earlier milestone of this project.

### Placeholder / sealed cases
`getUnlockGate()` (`caseCatalog.js:399-407`) is the mechanism that lets an announced-but-
unauthored case sit in the catalog as a locked "Coming soon" card without breaking the unlock
chain for the cases after it: it walks backward from a case's `order` and returns the nearest
**playable** (`status === 'available'`) predecessor, skipping any sealed slot in between. This
is exactly what let `intermediate` exist as an announced, locked placeholder for a period
without permanently locking `medium`/Hard behind content that didn't exist yet — a real
design problem that was solved with a five-line function rather than special-casing.

### How a new case is added
Full checklist in §17.

---

## §10. Gameplay

### Notebook
`NotebookModal.jsx` — ten tabs (`Overview`, `Objectives`, `Journal`, `Discoveries`, `Timeline`,
`Suspects`, `Hints`, `Case file`, `History`, `Notes`), each a separate component under
`components/notebook/`. State (active tab, per-tab scroll position) is persisted in the session
so reopening the notebook returns you exactly where you left it (`scrollPositions`,
`investigationSession.jsx:250-253`). Below `sm` breakpoint the tab strip becomes a single
horizontally-scrolling row rather than an 8-row wrapped grid (§5).

### Objectives (gameplay-facing)
Rendered from `evaluateObjectives()` output (§9); each shows its `hint` text when incomplete.

### Hints
Each case's `hints` array in the catalog (typically 4 entries) is revealed progressively —
`revealHint(total)` (`investigationSession.jsx:267-276`) increments `hintsRevealed`, capped at
the array length, and logs a journal entry. Hints are **written to never reveal the answer**
— every hint in every case file is phrased as a next investigative move ("Sort the camera
entries by time and read them in order"), never as a fact about who did it. Hints cost score
(§10 Scoring, `HINT_COST` in `scoring.js`).

### Timer
Lives inside the investigation session (not a separate system) — `runningSince` /
`elapsedMs` in the reducer state, ticked by a `setInterval` **only while a component is
subscribed to `useInvestigationTimer()`** (its own context, §5) so nothing else re-renders
every second. The clock **pauses on unmount** (leaving the investigation screen for Settings,
for instance) and **resumes on remount**, banking accumulated time rather than losing it or
continuing to run in the background (`investigationSession.jsx:490-494`). It **stops
permanently the moment a verdict is proven** (`recordAccusation` reducer case, lines 281-302)
— `completionMs` is fixed at that instant and never advances again, even if the Case Closed
screen stays open for ten minutes.

### Scoring
`utils/scoring.js`'s `computeScore()` — a documented, additive-bonus formula:
```
multiplier = accuracy × (1 + bonus) − hintCost
score = round(baseScore × multiplier / 10) × 10
```
where `bonus` (max +50% of base) is a weighted sum of four **0–1** shares — coverage
(34%), objectives (26%), efficiency (20%), speed (20%) — and `accuracy` starts at 1.0 and
drops 20% per wrong accusation attempt, floored at 40%. The explicit design principle, stated
in the file's own header comment: *"Accuracy and hints can only take away; coverage,
efficiency, objectives and speed can only add. Nobody is punished for being thorough or
careful."* Efficiency is measured against a **par** (required sources × 3 queries) rather than
an absolute query count, so a harder case with more required sources gets a proportionally
larger query budget before efficiency bonus starts decaying. Speed is a bonus-only comparison
against the case's stated `estimatedTime`, never a penalty for running over.

### Evidence
`EvidenceCard.jsx` renders the case-file evidence list from the briefing payload; per-item
personal notes are stored separately (`evidenceNotes`, keyed by evidence id) and are the
player's own annotations, never graded.

### Witnesses
`WitnessReport.jsx` renders witness statements from the briefing. These are also queryable
directly (`SELECT * FROM witnesses`) — the case-file panel and the SQL table expose the exact
same underlying data through two different interaction modes, by design (a beginner can read
the panel; the point is to eventually make them query the table instead).

### Accusation
Two-stage gate, both entirely covered in §8/§11: `assessReadiness()` decides whether the
**Accuse** button is even clickable (based on the player's own file — discovery count, table
breadth, suspects investigated — never on the solution), and `evaluateAccusation()` grades a
submitted accusation once filed. A failed accusation returns **exactly one message**
(`NOT_PROVEN_MESSAGE`, `accusation.js:52`) regardless of whether the named suspect was wrong or
the evidence file was merely thin — the file's own header comment explains why: *"a player who
could tell those apart could brute-force the roster."*

### Festival Mode
Covered in §11 (state) and §2 (why it exists as a concept). Gameplay-relevant specifics: no
progression gate (§9), name entry required at mode selection, every solved case posts to a
shared machine-wide leaderboard, and "Next Detective" (`gameMode.jsx:59-62`) wipes the festival
storage scope in one call so the next participant starts from zero without anyone touching
`localStorage` manually or refreshing the page.

### Personal Mode
The default, non-shared-machine experience: progress and reports persist indefinitely across
sessions, no name is required, and nothing is posted to any leaderboard.

### Leaderboard
`utils/leaderboard.js` — machine-wide, unscoped (`readGlobalJson`/`writeGlobalJson`, §11),
sorted by score descending then time ascending (`compare()`, lines 17-20), capped at 200 stored
entries. Only cleared by an explicit "Clear leaderboard" action in Settings — it deliberately
survives every mode switch and every "next detective" reset, because it belongs to the machine
hosting the demo, not to any one participant.

### Career progression
Purely cosmetic — `getRank(solvedCount)` (`caseProgress.js:167-169`) maps solved-case count to
one of five titles (`Cadet Detective` → `Master Detective`). `DetectiveCareer.jsx` /
`CareerSummary.jsx` render this alongside `getCompletion()`'s solved/total count. None of this
feeds back into scoring or unlocking — it is presentation only.

---

## §11. State Management

### Where progress is stored
`localStorage`, under the namespace prefix `sql-detective:` (`utils/storage.js:1`). Every read
and write in the app funnels through `storage.js`'s handful of functions — there is no direct
`localStorage.getItem` call anywhere else in the codebase (verified). This single choke point
is what makes the entire scoping system (below) possible without every call site needing to
know about it.

### Scoping — the mechanism behind Festival vs Personal isolation
This is the single cleverest piece of state design in the project, and it's worth
understanding exactly. `storage.js` holds one module-level variable, `activeScope`, set by
`setStorageScope()`. Every *scoped* key (`readJson`/`writeJson`/`removeKey`) is silently
prefixed with the active scope before hitting `localStorage`:
```js
const fullKey = (key, global) => `${NAMESPACE}:${global ? '' : activeScope}${key}`;
```
`SCOPES = { personal: '', festival: 'festival:' }` — Personal Mode's scope is literally the
empty string, so its keys are exactly what they always were (no migration needed when this
system was introduced). Festival Mode's keys all live under a `festival:` sub-namespace. A
handful of keys — `settings` and `leaderboard` — bypass scoping entirely via
`readGlobalJson`/`writeGlobalJson`, because they belong to the *machine*, not to whichever
mode or participant is currently active, and must survive every scope wipe.

This means **isolation is structural, not a matter of remembering to clean up**: a Festival
session physically cannot read a Personal save (different key prefix, full stop), and
`clearScope('festival:')` (`storage.js:98-123`) can wipe every festival key in one call without
any risk of also deleting a personal key, because it explicitly excludes every *other* known
scope's prefix while iterating (`foreignPrefixes`, line 103) — this guards specifically against
the trap that Personal's empty-string prefix would otherwise make every other scope's keys
"start with" the personal scope too.

### Where festival sessions are stored
Same `localStorage`, same `session:<caseId>` key shape as Personal, just prefixed
`sql-detective:festival:session:<caseId>` instead of `sql-detective:session:<caseId>` — the
session reducer itself (`investigationSession.jsx`) has no idea scoping exists; it just calls
`readJson`/`writeJson` and the active scope silently determines where those land.

### How persistence works (the investigation session specifically)
The reducer's full state is **not** written to storage on every dispatch — that would mean a
`localStorage.setItem` call on every single keystroke in the SQL editor. Instead, a debounced
effect (`investigationSession.jsx:459-462`) waits `PERSIST_DELAY` (350ms) of quiet after the
last state change before writing. Two safety nets sit around this: a `pagehide` listener
flushes the latest snapshot immediately if the tab closes or navigates away mid-debounce
(lines 465-474), and that same handler is careful **not** to resurrect a session that was
explicitly cleared while the component was still mounted — it checks `readJson(storageKey,
null) !== null` before writing, so a replay's `resetInvestigation()` (which removes the key)
can't be silently undone by this unmount-time flush.

### How replay works
`resetInvestigation(caseKey)` (`caseProgress.js:112-114`) does exactly one thing:
`removeKey('session:' + caseKey')`. It **does not** touch the case's `solved`/`report`/
`bestScore` entry in the progress store — the solved record and the debrief report the player
already earned survive a replay. This split (session vs. progress, two entirely separate
storage keys) is what makes "replay a solved case without losing your prior best score or your
earned report" possible with a one-line function.

### How reset works — three distinct scopes of "reset," not one
This is worth being precise about, because the app exposes three different reset actions in
Settings/gameplay that are easy to conflate:
1. **Replay one case** (`resetInvestigation`) — clears that case's session only.
2. **Clear current session** (`gameMode.jsx:65-68`, `clearCurrentSession`) — wipes the *entire
   active scope* (every case's session, everything), used from Settings' danger zone.
3. **Reset personal progress** (`resetPersonalProgress`, lines 70-73) — wipes the entire
   personal scope, including solved/report history, not just sessions.
4. **Next Detective** (`startNextDetective`, lines 59-62) — wipes the entire festival scope and
   clears the current name, for handing off the machine.

Every one of these calls `setSessionNonce()` afterward, which — via `RootLayout.jsx`'s
`<Outlet key={sessionNonce}>` — remounts the entire route tree so every screen re-reads
whatever storage state remains from scratch. This is the mechanism, referenced in §4, that lets
every one of these resets happen **without ever asking the player to refresh the browser**.

---

## §12. Story System

### How stories are represented
Two layers, deliberately separate: **narrative facts** live as plain fields on the catalog
entry (`victim`, `date`, `time`, `location`, `witnesses`, `crimeScene`, `evidence`, `preview` —
all in `caseCatalog.js`, used for the static briefing screen), and **investigable facts** live
entirely as rows in the case's SQLite database (`case-schema.sql`'s 16 tables). The briefing
screen's prose and the database's data are hand-authored to agree with each other, but there is
**no code-level link** between them — a future engineer editing a case's story must manually
keep the catalog's prose fields and the seed script's row data consistent. This is a real
maintenance risk worth flagging: nothing enforces that `caseCatalog.js`'s `time: '10:18 PM'` for
the Easy case matches `victims.time_of_death` in `easy.db`. It currently does, by discipline,
not by construction.

### How objectives connect to SQL
Answered mechanistically in §9 — every objective's `isComplete()` predicate reads
`reach.tables`/`reach.features`, which are populated by `inspectStatement()`
(`utils/sqlInsights.js:86-101`) parsing **every successfully-run query** for which tables it
referenced (a regex over `from`/`join` clauses, scrubbed of comments and string contents first
— a second, independent, lighter-weight implementation of the same scrub-then-parse pattern
`sqlPolicy.js` uses for security, see §0's inconsistency note #7) and which SQL features it
used (`join`, `where`, `order_by`, `group_by`, `having`, `limit`, `distinct`, `like`,
`between`, `in_list`, `cte`, `aggregate`, `subquery`, `date_math` — 14 tracked features).

### How evidence is structured
Each `evidence` row (`id, title, category, description, location_found, discovered_at`) is
both a static "case file" item (shown in `EvidenceCard.jsx` from the briefing payload) and a
queryable row (`SELECT * FROM evidence`) — the same underlying fact, exposed both ways.

### How accusation validation works
Fully covered in §8 (server has no role) and §11 (grading logic). One more detail worth adding
here: **evidence citation is required for a verdict to be proven** — `evaluateAccusation()`
requires `evidenceKeys.length >= thresholds.verdict.citations` (2–4 depending on case
difficulty), where `evidenceKeys` are discovery records the player explicitly selected in
`AccuseModal` as "supporting" their accusation. This means naming the right person is
*necessary but not sufficient* — the player must also point at specific discoveries in their
own file as the basis for the accusation, which is what stops "just guess every name in turn"
from working even against a thin file.

### How solutions are stored
`client/src/utils/caseSolution.js` — five plain `{ killer: 'Name' }` entries, one per case id.
This file's own header comment states the tradeoff outright (quoted in full because it matters
for §15): the client bundle ships these names in plain text, readable by anyone who opens
developer tools; a truly secure implementation would need a server-side grading endpoint, which
was explicitly out of scope for the sprint that built this system. `isAccused()` is the single
function every other part of the app is allowed to call — it returns a boolean, never the name
itself, specifically so no caller can accidentally end up holding (and, say, logging, or
displaying) the solution.

---

## §13. UI System

### Design philosophy
"A classified detective dossier, not a movie poster" — the explicit brief from an earlier
design pass. Concretely: body text is weight 400–500 (never bold-by-default), headings stay
strong but are now `font-medium` rather than heavier, and a small set of reusable typography
tokens (§5) replaced what had been dozens of ad-hoc weight/line-height combinations across the
app. Colour is a dark, desaturated "investigation board" palette (`tailwind.config.js:11-18`:
`ink`, `charcoal`, `crimson`, `gold`, `bone`, `verdict`) plus texture layers (`board-grid`,
`film-grain`, `scanlines`, `vignette` utilities in `index.css`) that appear behind panels, not
on top of text — so decoration never fights legibility.

### Typography hierarchy
Fully detailed in §5.

### Animation system
Framer Motion throughout — page-level fades on route mount, staggered reveal on card grids
(`whileInView`, `viewport: { once: true }` so animations don't re-fire on scroll-back), and
modal enter/exit via `AnimatePresence`. One specific, hard-won detail worth preserving in
institutional memory: the query-results panel deliberately does **not** use
`AnimatePresence mode="wait"` — a local SQLite query returns in single-digit milliseconds, so
the panel can go empty→loading→rows inside one animation frame; a "wait" mode would still be
playing the previous exit transition while the new content (and its own success message) is
already supposed to be visible, producing a blank panel under a footer that says "Recovered 5
records." Each state (`loading`/`error`/`rows`) animates in independently instead
(`QueryResultsTable.jsx`).

### Image system
Five static PNGs (`client/src/images/case1.png` … `case5.png`), imported directly as ES
modules (Vite handles hashing/optimization at build time) and attached to catalog entries as
`previewImage`. No CDN, no lazy `<img loading>` strategy currently applied to these — see §14.

### Responsive system
Detailed in §5.

### Reusable cards
`CaseSelectionCard`, `DifficultyCard`, `FeatureCard`, `MissionCard` — each a single component
used once per catalog entry, reading from the same `CaseEntry` shape so a sixth case (§17)
requires no new card component.

### Modals
All built on `ReusableModal` (§5). `dismissible={false}` is used exactly once (the accusation
confirmation step, inside `AccuseModal`), everywhere else Escape/overlay-click/close-button all
work identically because they're the same fifteen lines of focus-trap logic, not five separate
implementations.

### Dialogs
`ConfirmDialog.jsx` — a smaller, lighter-weight confirmation primitive than a full
`ReusableModal`, used for "are you sure" moments that don't need tabs, scroll restoration, or a
body ref (e.g., the "replay a solved case" confirmation on `CaseSelectionCard`).

### Loading screens
`InvestigationLoadingPage.jsx` — a three-state page (`isLoading`/`error`/success), where success
hands off entirely to `InvestigationLayout`. The loading state uses `role="status"
aria-live="polite"` so a screen reader announces it once, and a `prefers-reduced-motion`-aware
animation set (global `@media (prefers-reduced-motion: reduce)` block in `index.css:187-195`
collapses every animation/transition duration to near-zero site-wide, not just here).

---

## §14. Performance

### Lazy loading
**None currently implemented.** There is no `React.lazy()`/route-level code splitting anywhere
in `router.jsx` — every page component is a static top-level import. For an app with six
routes and a moderate component count this has not yet produced a problem worth solving, but
it is the most likely first target if bundle size becomes a real complaint (see below).

### Image loading
The five case-preview PNGs are bundled as static Vite assets with no explicit lazy-loading
attribute (`loading="lazy"`) applied at the `<img>` level currently — a one-line fix if it ever
matters, not currently a measured problem given there are only five images total, one per
difficulty card, all above the fold on the difficulty screen.

### Font loading
Covered in §5 — self-hosted, `font-display: swap`, the two above-the-fold faces
(`IM Fell English SC`, `Rajdhani`) preloaded via `<link rel="preload">` in `index.html`, every
other face loads with the stylesheet. Total font payload across all five typefaces (nine files,
counting Rajdhani's three static weights) is under 400 KB — deliberately subsetted (Rubik Dirt
specifically, from 302 KB to 156 KB) because it is played on a festival laptop where "just
download more of the internet" is not a fallback.

### State optimization
The single biggest performance-relevant decision in the codebase: the **four-context split**
in `investigationSession.jsx` (§5, §11) exists purely to prevent unnecessary re-renders — a
keystroke in the SQL editor or a timer tick would otherwise re-render the notebook, the suspect
roster, and the case board sixty times a minute. Beyond that: `useMemo`/`useCallback` are used
consistently throughout the reducer's action bindings and derived selectors (`objectives`,
`timeline`, `intel`, `ledger`, `insights`, `readiness` are all memoized off the specific state
slices they depend on, not off the whole reducer state) so a change in, say, `notes` does not
recompute the discovery timeline.

### React rendering
`QueryResultsTable.jsx`'s row component is wrapped in `React.memo`, and only the first 30 rows
of a result set get a Framer Motion stagger-in animation (`ANIMATED_ROW_LIMIT`) — a large
result set (up to the 200-row server cap) renders the remaining rows with no per-row animation
overhead at all, which is a deliberate, measured tradeoff between polish and not janking on a
200-row table.

### Bundle size
**This is the one flagged, unresolved warning in the project.** The production build currently
emits: *"Some chunks are larger than 500 kB after minification"* (visible in every `npm run
build` output). The largest chunk is one JS bundle around 690 KB (207 KB gzipped) — Monaco
Editor (`@monaco-editor/react`) is almost certainly the largest single contributor, and it is
currently imported eagerly on every route rather than only when the investigation screen
mounts. **This is the single most valuable, lowest-risk performance improvement available**:
lazy-loading `SQLEditor.jsx` (or the whole `InvestigationLayout` route) via `React.lazy()` would
keep Monaco's weight off every screen that isn't the investigation board — home, difficulty
select, settings, how-to-play would all load faster with zero functional change.

### Potential bottlenecks
- **No connection pooling on the backend** (§6) — fine at current scale, a real limit under
  concurrent load.
- **No CDN / cache headers configured explicitly** beyond whatever Express's static middleware
  defaults to — a fast win if traffic ever grows.
- **The debounced `localStorage` write** (350ms, §11) is the one place a very fast typist
  hammering the SQL editor could theoretically build up a large in-memory session object
  before it's persisted — not a measured problem at current session sizes (`HISTORY_LIMIT`=50,
  `JOURNAL_LIMIT`=200 caps prevent unbounded growth), but worth knowing the cap exists and why.

---

## §15. Security

### How SQL injection is prevented
Two ways, and it's worth being precise about which threat model each one addresses, because
they are solving *different* problems:
1. **Player queries are never parameterized against anything, because they don't need to be —
   the player's SQL *is* the entire statement**, run verbatim. There is no template string
   anywhere concatenating a player-supplied value into a *larger* server-authored query for the
   `/api/query` path, so "injection into a bigger query" is not a risk that exists on this
   endpoint at all — the whole endpoint's job is "run this exact statement, safely."
2. Where the server **does** build SQL around a value it received — the post-verdict reveal
   fetch (`investigationSession.jsx:611`, `WHERE name = '${quoted}'`) — the value is a suspect
   *name already validated against the known solution* (`getSolution(difficulty)?.killer`, a
   hardcoded string from `caseSolution.js`, not raw user input) and is additionally escaped
   (`.replace(/'/g, "''")`) before interpolation. This is a narrow, low-risk case (the value
   never came from a request body), but it is string interpolation into SQL, and it is worth
   flagging explicitly as the one place in the codebase that isn't parameterized-query-clean by
   construction — a defensible risk given the input's provenance, not a zero-risk one.

### How arbitrary queries are blocked
`validateReadOnlySql()`, covered exhaustively in §8 — scrub literals/comments, reject multiple
statements, blocklist mutation/DDL/transaction keywords, and require the statement to *start*
with `SELECT`/`WITH`/read-only `EXPLAIN`. This is a real, carefully-written parser-adjacent
security control, not a naive `sql.includes('DROP')` check — the scrubbing step specifically
exists to defeat the naive-check failure mode (a keyword inside a string literal falsely
tripping the filter, or a keyword hidden inside a comment falsely passing it).

### How databases remain read-only
Two independent layers, deliberately redundant (§7, §8): the application-level keyword
allowlist/blocklist, and the OS-level `sqlite3.OPEN_READONLY` flag on every connection the
server opens to a case file. Either one failing does not compromise the other.

### Rate limiting / abuse
**Not implemented.** There is no `express-rate-limit` or equivalent anywhere in the middleware
stack (`app.js`). The client-side `caseService.js` does map a `429` status to a friendly
message (*"Too many queries at once"*), but nothing on the server actually produces a 429 —
that client-side handling is currently unreachable dead code, present for a rate limit that
does not yet exist. This is a real, honest gap for a public deployment: nothing currently stops
a scripted client from hammering `/api/query` in a loop.

### CORS
`app.js:22` — `cors({ origin: env.clientOrigin === '*' ? true : env.clientOrigin })`. In
development `CLIENT_ORIGIN` is unset, so `env.clientOrigin` defaults to `'*'`
(`config/env.js:35`) and CORS is fully open. **In production this should be set to the actual
deployed origin** (documented in the deployment conversation as a follow-up step) — since the
API and the client are served from the same Express process/origin in production (`app.js:28-
35`), CORS is largely academic there anyway (no cross-origin request is actually being made by
the shipped client), but locking it down is still the correct, defensible answer if asked in a
review.

### The honest, headline security limitation: solution exposure
Covered in §12 and worth restating here as *the* answer to "what's the biggest security
weakness in this project": **every case's solution ships in plaintext inside the JavaScript
bundle** (`caseSolution.js`). Anyone can open browser dev tools, find this file in the bundle,
and read every answer without playing a single query. The codebase is explicit and
self-aware about this — the file's own header comment states it as a stated, deliberate
tradeoff (quoted in §12), and explains exactly what closing it would require: a server-side
`POST /api/accuse` endpoint that receives the accused name plus supporting evidence and grades
it *server-side*, returning only `{ proven: boolean }` — never sending the solution to the
client at all. That endpoint does not currently exist. **If asked "how would you fix this,"**
the correct answer is exactly that endpoint, plus moving `evaluateAccusation()`'s corroboration-
threshold logic server-side alongside it, since the thresholds themselves are not sensitive but
the comparison against `killer` must not happen anywhere the result can be inspected before
it's returned.

### Error message leakage
`errorHandler.js:9-11` explicitly suppresses internal error detail in production for any
`5xx` (`"An unexpected server error occurred."` replaces the real message when
`env.nodeEnv === 'production'`), while still returning full detail in development. `4xx`
errors (validation, SQL errors) always return their real, friendly message regardless of
environment, because those are meant to be actionable for the player, not internal failures.

---

## §16. Deployment

### How Render deployment works
`render.yaml` defines one `web` service, Node environment, free plan:
```yaml
buildCommand: npm install && npm run seed && npm run build
startCommand: npm start
healthCheckPath: /api/health
autoDeploy: true
```
The build command does three things in sequence: install all workspace dependencies, **re-seed
every case database from the committed seed scripts** (so the deployed data can never silently
drift from source — even though the `.db` files are also committed to the repo, the build
always regenerates them fresh rather than trusting the committed binary), then build the client
to `client/dist`. `npm start` runs `npm run start --workspace server`, which itself has a
`prestart` hook (`server/package.json:9`) that runs `ensureProductionDatabase.js` **before**
`node src/server.js` — this script (§7) checks all five `.db` files exist on disk and calls
`process.exit(1)` with a clear error if any are missing, so a broken deploy fails loudly and
immediately rather than booting into a half-working state.

### Environment variables
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 4000 | Render injects its own value; app must not hardcode a port |
| `NODE_ENV` | `development` | Gates error-detail suppression (§15) |
| `CLIENT_ORIGIN` | `*` | CORS allow-origin — should be the real deployed URL in production |
| `DATABASE_PATH` | `../database/sql-detective.sqlite` | The unused health-check DB path (§0) — **not** the case databases, which are resolved separately via `caseDatabaseDirectory` |
| `QUERY_TIMEOUT_MS` | 2000 | Validated to 100–10,000ms at boot (`env.js:24-26`) — an invalid value throws immediately, before the server ever listens |
| `QUERY_ROW_LIMIT` | 200 | Validated to 1–5,000 at boot |

All five are validated in `config/env.js` with hard `throw new Error(...)` on invalid values —
**a misconfigured env var fails the deploy at boot, not silently at request time.**

### Production build
`npm run build` (root) → `vite build --workspace client` → static assets in `client/dist`,
picked up by `app.js:28` if the directory exists, served via `express.static` plus a catch-all
`GET *` SPA fallback that excludes `/api/*` paths and any path containing a `.` (so a request
for `/fonts/rubikdirt.woff2` correctly 404s as a missing static file rather than being served
the SPA's `index.html`).

### Static assets
Fonts (`client/public/fonts/`) and images (bundled via Vite import, hashed into
`client/dist/assets/`) both ship as part of the same static build directory Express serves.

### SQLite deployment
The five case `.db` files are **committed to the git repository** (`database/*.db`) *and*
regenerated at every build via `npm run seed` — belt and suspenders: even if a seed script had
a bug that silently produced an empty file, the committed files would still be present as a
fallback in a fresh clone; even if a stale committed file drifted from the current seed script
source, the build-time reseed guarantees production always runs on freshly-generated,
source-of-truth data. Render's filesystem is otherwise ephemeral between deploys, which is
irrelevant here because the seed step always regenerates from source on every single deploy —
nothing depends on state surviving between deploys.

### How updates are deployed
`autoDeploy: true` — a push to the connected branch triggers Render's build pipeline
automatically; no manual deploy step is required for normal changes. A schema change to
`case-schema.sql` requires no separate migration step because the seed scripts always
`DROP`-and-recreate each database file from that schema on every build (`createCaseDatabase()`,
`seedHelpers.js:14-21`) — there is no persistent production database state to migrate, which is
a direct consequence of §2/§7's "read-only, fully determined at authoring time" database design.

---

## §17. Adding a New Case (Case 06, from scratch)

Every file that must change, in the order you'd actually touch them.

**1. Database — write the seed script.**
Create `server/scripts/seedCase06Database.js`, modeled on any existing seed file (e.g.
`seedBeginnerDatabase.js`). It must:
- Call `createCaseDatabase('case06.db')` (or whatever filename you choose) — this drops and
  rebuilds the file from `database/case-schema.sql`, so you do **not** write any `CREATE TABLE`
  statements yourself.
- Insert rows via `insert(database, table, columns, rows)` for whichever of the 16 shared
  tables this case uses. A theft case can leave `victims` empty entirely (§7).
- **Write the solution as a header comment**, exactly like every existing seed file does — this
  is the project's convention for "where the answer lives during authoring," separate from
  where it lives at runtime (step 4).
- Wrap all inserts in `BEGIN TRANSACTION` / `COMMIT`.

**2. Register the seed script.**
In `server/scripts/seedCaseDatabases.js`, import and call `seedCase06Database()` alongside the
existing five.

**3. Register the database filename.**
In `server/src/database/caseDatabase.js:6`, add `case06: 'case06.db'` to the `caseFiles` map.

**4. Register the solution.**
In `client/src/utils/caseSolution.js`, add `case06: { killer: 'Full Name' }` to the `solutions`
object — this must exactly match the `name` column value in the `suspects` table for the row
you intend to be correct.

**5. Register server-side display metadata.**
In `server/src/config/caseMetadata.js`, add an entry keyed `case06` with `caseNumber`, `title`,
`difficulty`, `timer`, `score`, `victim`, and `initialNotebook` (the array of lead sentences for
the Notes folder). **Remember §9's warning**: this duplicates fields that also live in the
client catalog (step 6) — keep the two in sync manually, there is no shared source.

**6. Register the client catalog entry — the big one.**
In `client/src/catalog/caseCatalog.js`, add a new `defineCase({...})` entry to the exported
`caseCatalog` array, with (at minimum): `id: 'case06'`, `order: 6`, `slug`, `routeSlug`, `tier`
+ `tierRank`, `caseNumber`, `title`, `database: 'case06.db'`, `sqlConcepts`,
`detectiveConcept`, `learningGoals`, `preview`, `victim`/`date`/`time`/`location`/`witnesses`/
`crimeScene`/`evidence` (the static briefing prose — see §12's warning that this must be kept
consistent with the actual database rows by discipline, not by code), `objectives` (a subset
of the eight ids in `utils/objectives.js`), `hints` (4 progressive, spoiler-free), `starterQuery`,
`theme`, and `thresholds.readiness`/`thresholds.verdict` (tune these relative to the case's
data volume — see the existing five entries for how the numbers scale with row count and
suspect count).

**7. Add case artwork.**
Drop a PNG into `client/src/images/`, import it in `caseCatalog.js`, and set `previewImage` on
the new entry.

**8. Run the seed script locally and verify.**
`npm run seed --workspace server` should print `Seeded case06.db with N authored investigation
records.` Then start the dev servers (`npm run dev`) and play the case yourself end to end:
briefing loads, every table listed on the board actually has rows, every objective can
genuinely be completed, hints don't spoil, and the accusation gate can actually be reached and
proven against the suspect named in step 4.

**Nothing else needs to change.** `caseOrder`, `availableCases`, `getUnlockGate()`,
`isCaseLocked()`, every page component, every card component, the router — all of them derive
entirely from the catalog array (§3's stated design goal) and require zero edits for a sixth
entry to appear, unlock in order, and play correctly.

---

## §18. MCA Viva Questions

**Architecture & Design**

1. **Why does each case have its own database file instead of one shared database?**
   Structural spoiler isolation (opening `beginner.db` makes every other case's data
   physically unreachable through that connection, not just logically filtered out), simpler
   multi-tenancy (`caseDatabase.js`'s five-line file map is the entire routing story), and a
   deployment story that needs nothing but files being present on disk. See §2, §7.

2. **Why SQLite instead of PostgreSQL or MySQL?**
   Case databases are read-only and fully determined at authoring time — there is no
   concurrent-write problem to solve. A single-file database matches "one case, one file"
   exactly, needs no separate provisioned service, and lets the game run fully offline on a
   laptop with no network. See §2.

3. **What would you have to change to support 50 cases instead of 5?**
   The schema duplication (§2's stated tradeoff) becomes the bottleneck — five hand-run seed
   scripts is fine, fifty would need a shared schema-migration tool. The catalog array and
   unlock-chain logic (§9) already scale to any number with zero code change; it's authoring
   tooling, not architecture, that would need to grow.

4. **Why is the frontend a single-page app rather than server-rendered?**
   The investigation screen holds substantial live client state (timer, editor draft, notebook)
   that must survive across many interactions without a server round trip; a component
   framework with local state management fits that better than page-by-page server rendering.
   See §2.

5. **Why does the server have almost no business logic?**
   By design — the server's only real job is "validate this SQL is read-only, then run it
   against the right file." Grading, scoring, progression, and unlock logic all live
   client-side because they operate entirely on data the client already holds (§6, §11).

6. **What's the biggest architectural weakness in this project, honestly?**
   The solution names shipping in the client bundle (§15) — an intentional, documented
   tradeoff for this sprint, but the correct thing to name unprompted if asked to critique your
   own work.

**Database**

7. **Walk me through what happens in SQLite when I submit a query.**
   §4 steps 7-10, and §8 in full detail — validated, opened read-only, prepared and stepped row
   by row with a timeout and a row cap, never wrapped in an outer SELECT.

8. **Why isn't the player's query parameterized?**
   Because it isn't being inserted into a larger server-authored query — the player's SQL *is*
   the entire statement executed. Parameterization solves a different problem (untrusted values
   inside trusted structure) that doesn't apply here. See §15.

9. **How do you prevent a player from running DROP TABLE?**
   Two independent layers: an application-level keyword blocklist plus positive
   SELECT/WITH/EXPLAIN-only allowlist (`sqlPolicy.js`), and the database connection itself
   being opened `OPEN_READONLY` at the OS/file level. See §8.

10. **What happens if a query never finishes?**
    A `setTimeout` calls `database.interrupt()` after `QUERY_TIMEOUT_MS` (2s default),
    producing a clean 408 rather than a hung connection. See §8.

11. **How do you stop a `SELECT *` on a huge table from crashing the browser?**
    The server stops *stepping* the prepared statement the instant `QUERY_ROW_LIMIT` (200
    default) rows are collected — it never fetches more than that from SQLite in the first
    place. See §8.

12. **Why are comments and string literals scrubbed before the security scan runs?**
    So a legitimate query like `WHERE name = 'DROP TABLE'` (a string value) isn't falsely
    rejected by a keyword scan, and so a mutation keyword hidden inside a `--` comment can't
    slip past a naive text-search filter. See §8.

13. **What's the schema every case database shares?**
    16 tables — `suspects`, `victims`, `evidence`, `crime_scene`, `witnesses`, `phone_logs`,
    `cctv_logs`, `access_logs`, `locations`, `vehicles`, `employees`, `fingerprints`,
    `weapons`, `documents`, `emails`, `security_logs`. See §7.

14. **Why does a theft case have zero rows in the `victims` table instead of just omitting the
    table?** Because the schema is shared and fixed across every case (§2's stated tradeoff) —
    omitting a table per-case would mean each case needs its own schema file. Zero rows plus
    the briefing controller's `rowCount > 0` filter (§6) achieves the same player-facing result
    (no `victims` folder shown) without a per-case schema.

**Security**

15. **How do you know a player can't inject SQL?** §8/§15 — validated keyword policy plus
    read-only file mode, defense in depth.

16. **What's the single biggest security gap in this project?** Solutions shipping in the
    client bundle (§15). Correct follow-up: name the fix (a server-side grading endpoint) even
    though it isn't built.

17. **Is there rate limiting?** No — an honest, stated gap. See §15.

18. **How is CORS configured?** Open (`*`) by default; should be locked to the real deployed
    origin in production, though the shipped app is same-origin anyway so it's largely
    academic there. See §15.

19. **What happens to error messages in production vs development?** 5xx errors are replaced
    with a generic message in production; 4xx (validation/SQL) errors always show real,
    actionable detail regardless of environment. See §15.

**Progression / Gameplay**

20. **How does case unlocking work?** A case unlocks once the one before it is *solved*
    (never merely opened), computed purely client-side from localStorage. See §9.

21. **Why does Festival Mode bypass progression?** A demo participant with limited time should
    be able to jump straight to any difficulty rather than be forced through the chain. See §9,
    §10.

22. **How is scoring calculated?** An additive-bonus formula off a per-case base score:
    accuracy (accusation attempts) and hints can only subtract; coverage, objectives,
    efficiency, and speed can only add, capped at +50%. See §10.

23. **Can a player brute-force the suspect roster?** No two safeguards: a failed accusation
    returns one message regardless of why it failed (right person / thin file are
    indistinguishable), and after a failed attempt the player must surface *new* evidence
    before trying again (except the tutorial case, which explicitly opts out because its small
    database makes that requirement unwinnable). See §10, §11.

24. **What stops a player from just guessing every name until one works?** The
    `needsNewEvidence` gate (§11) plus the evidence-citation requirement (naming the right
    person is necessary but not sufficient — you must also cite discoveries as support). See
    §12.

25. **How does the discovery engine decide what counts as "found"?** Only rows a query
    genuinely returned — nothing is seeded, inferred, or awarded for reading static briefing
    text. See §10 (Discovery Engine referenced), §11's `extractDiscoveries`.

26. **Why do objectives track SQL features used, not button clicks?** So an objective can only
    complete by actually doing the SQL work it names — `inspectStatement()` parses the
    statement itself. See §9, §12.

27. **What's the "person of interest" status based on?** A volume-and-breadth threshold (5+
    records from 3+ different tables) computed automatically from the player's own file — never
    from anything the solution knows. See §10 (Suspect Intelligence).

**State / Persistence**

28. **Where does game state live?** Entirely in the browser's localStorage — the server holds
    no session at all. See §11.

29. **How does Festival Mode keep two players' saves from mixing?** A key-prefix scoping system
    — every scoped storage call is silently prefixed with the active mode's namespace before it
    ever reaches localStorage. See §11.

30. **How do you reset the app without asking someone to refresh the browser?** A
    `sessionNonce` that remounts the entire route tree via a keyed `<Outlet>` whenever storage
    is deliberately wiped. See §4, §11.

31. **Does replaying a solved case lose your best score?** No — the session and the permanent
    progress/report record are two entirely separate storage keys; replay clears only the
    session. See §11.

32. **How often does the game write to localStorage while you're playing?** Debounced to at
    most once per 350ms of inactivity, with a `pagehide` flush as a safety net for
    closed/navigated-away tabs mid-debounce. See §11.

**Frontend Engineering**

33. **Why does the investigation session use four separate React contexts instead of one?**
    To stop a keystroke or a timer tick from re-rendering the entire investigation board — each
    context isolates a different change frequency. See §5, §11, §14.

34. **What's the largest unresolved performance issue in the project?** Bundle size — Monaco
    Editor is loaded eagerly on every route; lazy-loading the investigation screen is the
    highest-value, lowest-risk fix available. See §14.

35. **Why five separate webfonts, and why self-hosted?** Each has one distinct role (wordmark,
    headings, document prose, UI, numbers) and self-hosting means the game keeps its
    typography with zero network dependency, since it's played offline at events. See §5, §13.

36. **Why is Monaco used for the SQL editor instead of a plain textarea?** Syntax highlighting,
    keyboard shortcuts (Ctrl+Enter to run, Ctrl+L to clear bound directly to Monaco commands),
    and a genuinely code-editor-grade typing experience for a game whose entire mechanic is
    writing SQL.

**Deployment**

37. **How does the build guarantee the deployed data is never stale?** The build command always
    re-runs `npm run seed`, regenerating every `.db` file from the committed seed scripts on
    every single deploy — nothing depends on a previously-deployed file surviving. See §16.

38. **What happens if a case database is missing at boot?** `prestart` runs
    `ensureProductionDatabase.js`, which checks all five files exist and exits with code 1 (a
    loud, immediate failure) if any are missing — the process never starts serving with a
    silently broken case. See §7, §16.

39. **Why Render over Vercel?** Vercel's serverless functions have a read-only filesystem
    outside `/tmp`; this app's SQLite connection code calls `fs.mkdirSync` at runtime, which
    would throw on Vercel. Render runs a conventional writable-filesystem process. See §2.

40. **What environment variables does the app require, and what happens if one is
    misconfigured?** `PORT`, `NODE_ENV`, `CLIENT_ORIGIN`, `DATABASE_PATH`,
    `QUERY_TIMEOUT_MS`, `QUERY_ROW_LIMIT` — all validated at boot with hard throws on invalid
    values, so a bad config fails the deploy immediately rather than at first request. See §16.

**Educational Design**

41. **Why detective stories specifically, rather than any other framing for teaching SQL?**
    Detective reasoning and SQL querying solve the same *shape* of problem — narrowing a fixed
    set of facts through increasingly specific questions. Every SQL concept a case teaches maps
    to a natural detective question (`WHERE` is "which of these fit the alibi"). See §1.

42. **How do you know the Beginner case is actually solvable by someone who's never written
    SQL?** It's authored to require only `SELECT`, `WHERE`, and `LIMIT` in a deliberate
    three-step chain, documented explicitly in the seed script's own header comment. See §1,
    §9.

43. **What SQL concept does each difficulty tier specifically teach?** Beginner:
    SELECT/WHERE/LIMIT. Easy: adds ORDER BY/COUNT. Intermediate: GROUP BY/LIKE/BETWEEN/
    DISTINCT. Hard: JOIN/LEFT JOIN/HAVING. Expert: subqueries/CTEs/date arithmetic. See §7, §9.

44. **Why do hints never reveal the answer?** Every hint is phrased as a next investigative
    move, never a fact about the solution — verified against every hint array in the catalog.
    See §10.

45. **How does the game teach reasoning rather than just SQL syntax?** Every case's catalog
    entry carries a `detectiveConcept` (e.g. "Absence as evidence," "Corroboration",
    "Tampering") alongside its `sqlConcepts` — the SQL is taught in service of that reasoning
    skill, not as an isolated syntax lesson. See §1, §9.

**Scaling / Future**

46. **How would you scale this to thousands of concurrent players?** Add connection pooling
    (currently one fresh SQLite connection per request, fine at current load, a real limit
    otherwise), add rate limiting (currently absent), and consider a CDN in front of the static
    build. See §6, §14, §15.

47. **What's the first change you'd make before a large public launch?** Close the solution-
    exposure gap with a server-side grading endpoint (§15) — it's the one gap that's actually
    exploitable by a motivated player, not just theoretical.

48. **Is the scoring formula tunable without code changes?** Partially — thresholds
    (`thresholds.verdict`/`thresholds.readiness`) are per-case catalog data, but the weighting
    formula itself (`WEIGHTS` in `scoring.js`) is a code constant, not configuration.

**General**

49. **What was the hardest engineering problem in this project?** Defensible answers grounded
    in real code: the debounced-persistence race condition around tab close/navigate (§11's
    `pagehide` handling), or correctly scoping localStorage for Festival Mode without a single
    key ever leaking between participants (§11).

50. **If you inherited this codebase today with no prior context, what would you read first?**
    `caseCatalog.js` (§9) to understand what a case *is*, then `investigationSession.jsx`
    (§11) to understand what happens when a query runs, then `sqlPolicy.js` (§8) to understand
    what's actually stopping a player from breaking something.

---

## §19. Interview Questions (Product Engineer / Full Stack)

**Q: Walk me through the request lifecycle when a player runs a query, end to end.**
A: Keystroke lands in Monaco → `runQuery()` dispatches `queryStart` → `executeCaseQuery()`
(axios) → `POST /api/query` → `queryController.runQuery` → `validateReadOnlySql()` (scrub,
single-statement check, keyword blocklist, leading-keyword allowlist) → if valid,
`openReadOnlyCaseDatabase(difficulty)` opens a fresh, read-only SQLite connection to that
case's file → `prepare()` + manual `step()` loop, capped at `QUERY_ROW_LIMIT`, guarded by a
`QUERY_TIMEOUT_MS` interrupt timer → response JSON → `querySuccess` dispatch, which runs
`extractDiscoveries()`, merges into cumulative state, recomputes objectives, writes journal
entries → `QueryResultsTable` re-renders with the raw rows. Full detail in §4 and §8.

**Q: This is a client-heavy architecture with almost no server-side game logic. What's the
tradeoff you're making, and would you make it again?**
A: The tradeoff is that the accusation solution ships in the client bundle (§15) — genuinely
exploitable, and I'd flag it unprompted. I'd make the same call for this scope (a demo/
educational project, not a competitive product with real stakes on cheating), but the fix is
well-understood and small: one server endpoint that receives the accusation and grades it
without ever sending the solution to the client.

**Q: How do you keep two players from seeing each other's saved progress on a shared festival
laptop?**
A: A single storage module (`storage.js`) that every read/write in the app funnels through,
with a module-level "active scope" that silently prefixes every key. Festival and Personal
modes are structurally different key namespaces, not a filter applied after the fact — a
Festival session cannot read a Personal key because the key literally doesn't exist under that
prefix. See §11.

**Q: What would you change about the state management if this needed to support real-time
multiplayer (e.g., a live head-to-head mode)?**
A: The entire session currently assumes single-player, localStorage-only state with no server
awareness beyond query execution. Multiplayer would need the reducer's state (or at least the
subset relevant to a shared race — timer, solved status) to move server-side, likely behind a
WebSocket, while keeping the notebook/discovery/journal state client-local since that's
genuinely per-player. I'd keep the four-context split's *principle* (isolate by change
frequency) even if the underlying transport changed.

**Q: The bundle-size warning shows up on every build. How would you actually fix it, in
priority order?**
A: First, `React.lazy()` the investigation route specifically — Monaco is almost certainly the
single largest dependency and it's currently loaded on every page, not just the one that needs
it. Second, check whether Framer Motion's full API surface is needed or whether a lighter
subset/alternative would do. Third, only after measuring the actual post-split bundle would I
look at `manualChunks` tuning — premature chunk configuration without first removing the
biggest unnecessary eager import is solving the wrong problem.

**Q: How would you add server-side rate limiting to `/api/query`?**
A: `express-rate-limit` (or equivalent) as middleware ahead of `queryRouter` in `app.js`,
keyed by IP (or, better, by a lightweight session token if one existed — none does currently).
Worth noting the client already has dead-code handling for a 429 response
(`services/caseService.js`) that was clearly written in anticipation of this — implementing the
limiter would make that code path live rather than unreachable.

**Q: Why is there a completely separate, unused SQLite connection module
(`database/connection.js`) alongside the real one (`database/caseDatabase.js`)?**
A: It predates the per-case-database architecture — `connection.js` was the original single
shared connection, kept alive only because `/api/health` still uses it to verify SQLite itself
boots correctly, independent of any specific case file being present. I'd flag this as the kind
of thing a fresh pair of eyes catches immediately and a team that's been in the codebase for
months stops noticing — see §0.

**Q: If you had one week to harden this for a real public launch, what would you actually do?**
A: In order: (1) the server-side accusation-grading endpoint (§15, closes the one genuinely
exploitable gap), (2) rate limiting on `/api/query`, (3) lock `CLIENT_ORIGIN` down for real in
the production env config, (4) lazy-load the investigation route to fix the bundle-size
warning, (5) update the two stale docs (`architecture.md`, `investigation-api.md`) so the next
engineer doesn't get misled by them (§0).

**Q: How do you know the game can't be trivially finished by brute-forcing every suspect
name?**
A: Traced it in the actual grading code, not assumed: a failed accusation returns one
undifferentiated message (§10/§11), requires *new* evidence since the last attempt before
trying again, and even a correctly-named suspect fails the verdict without enough cited
evidence and a broad enough investigated file. I'd cite `accusation.js`'s own header comment,
which states this design principle explicitly.

---

## §20. Code Walkthrough (execution order)

**Boot.** `server/src/server.js` calls `getDatabase()` (the unused health-check DB, §0) before
`app.listen()`, specifically so a broken SQLite install fails immediately at startup rather
than on the first request. `app.js` assembles CORS → JSON body parsing → three route mounts →
conditional static-file serving → 404 handler → error handler, in that fixed order. On the
client, `main.jsx` mounts `RouterProvider`; `RootLayout` wraps every route in
`GameModeProvider` (reads `localStorage` settings synchronously on first render, §11) and
`SoundProvider`, and blocks the actual route behind `ModeSelectionGate` until a mode is chosen.

**A request flows: `GET /api/case/beginner`.** `caseRouter` → `getCaseBriefing`
(`caseController.js`) → `getCaseMetadata('beginner')` (a plain object lookup,
`caseMetadata.js`) → if found, `openReadOnlyCaseDatabase('beginner')`
(`caseDatabase.js:15-22`, resolves `beginner.db`'s path, opens `OPEN_READONLY`) → seven
parallel `SELECT`s (evidence, suspects-without-status, witnesses, crime scene, timeline,
document count, table names) → row-count every table, filter to non-empty → assemble one JSON
object (`case`, `evidence`, `suspects`, `notebook`, `tables`, `documentCount`,
`initialNotebook`, `timer`) → `closeDatabase()` in a `finally` block → `response.json(...)`.

**How a query reaches SQLite.** `POST /api/query` → `runQuery` (`queryController.js`, 14
lines) → `executeInvestigationQuery(difficulty, sql)` (`queryService.js:69-78`) → first line:
`validateReadOnlySql(sql)` (§8's five-step gate; throws an `AppError` immediately on any
violation, which `queryController`'s `catch` forwards to Express's `next()`) → if the
statement survives validation, `openReadOnlyCaseDatabase(difficulty)` → the manual
`prepare()`/`step()` loop (`runQuery` inner function, lines 20-67) with a parallel
`setTimeout` interrupt guard → resolves `{ columns, rows, rowCount, executionTime }` → the
connection is closed in a `finally` regardless of success or failure.

**How the answer returns to the UI.** The controller's `response.json(result)` is received by
`caseService.js`'s `executeCaseQuery()` (axios `POST`, error-message translation on failure),
which is awaited inside `runQuery()` in `investigationSession.jsx:506-534`. On success,
`dispatch({ type: 'querySuccess', ... })` fires the reducer case at lines 91-178 — this single
action: extracts discoveries from the raw rows (`extractDiscoveries`, §10), merges them into
cumulative state (`mergeDiscoveries`), updates per-suspect files
(`applyDiscoveriesToFiles`), recomputes which tables/features have now been reached, checks
whether any objective just flipped to complete (comparing `evaluateObjectives()` before/after
this action), and writes journal entries for every new discovery, newly-opened table, newly-
completed objective, and newly-filed suspect. `QueryResultsTable` re-renders off the updated
`result` slice of context; the notebook, suspect panel, and objective list re-render off the
other slices — all from the same one dispatch.

**How an accusation is validated.** `AccuseModal`'s submit handler calls `submitAccusation()`
(`investigationSession.jsx:592-670`) → `evaluateAccusation({ difficulty, suspect,
evidenceKeys, discoveries, reach, timeline })` (`utils/accusation.js:104-122`) → this checks
two independent things and ANDs them: `corroborationChecks()` against the case's
`thresholds.verdict` (citations/discoveries/sources/timeline counts, all measured against the
player's own file) AND `isAccused(difficulty, suspect)` (a straight string comparison against
`caseSolution.js`'s hardcoded name, entirely client-side, §15) → `dispatch({ type:
'recordAccusation', ..., proven })` always fires (recording the attempt either way) → **only if
proven**, the function continues: fetches the killer's full suspect row and the victim's row
from the case database (display only, not part of grading, §4 step 13), computes the final
score via `computeScore()` (§10), and calls `markCaseSolved()` (`caseProgress.js:96-105`),
which writes a permanent report into the progress store — separate from the (now disposable)
investigation session (§11).

**How progression is saved.** `markCaseSolved(caseKey, report)` reads the existing progress
entry, computes a `bestTimeMs` (only improves, never regresses) and `bestScore` (only
increases), and writes `{ opened: true, solved: true, solvedAt, report, bestTimeMs, bestScore
}` back into the `progress` localStorage key under the currently-active storage scope
(§11). The next time `DifficultyPage` renders, `isCaseLocked()` re-reads this exact store and
the following case in `order` unlocks — no explicit "unlock" call exists anywhere; unlocking
is simply what `isCaseLocked()` computes from a fresh read of `solved: true`, every single
render.
