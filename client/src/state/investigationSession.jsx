import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { executeCaseQuery } from '../services/caseService';
import { assessReadiness, evaluateAccusation } from '../utils/accusation';
import { getSolution } from '../utils/caseSolution';
import { markCaseSolved, recordQueryRun } from '../utils/caseProgress';
import { computeScore, starsFor } from '../utils/scoring';
import { getCase, getCaseThresholds, getCaseWording } from '../catalog/caseCatalog';
import { extractDiscoveries, mergeDiscoveries } from '../utils/discovery';
import { buildInsights } from '../utils/insights';
import { buildProgressLedger } from '../utils/investigationProgress';
import { buildTimeline } from '../utils/investigationTimeline';
import { buildCategoryProgress, computeInvestigationPercent, countByTable } from '../utils/investigationCategories';
import { hintBudget, nextHint } from '../utils/hints';
import { evaluateObjectives, objectiveTally } from '../utils/objectives';
import { describeResult, nounFor } from '../utils/queryFeedback';
import { applyDiscoveriesToFiles, buildSuspectIntel } from '../utils/suspectIntel';
import { inspectStatement } from '../utils/sqlInsights';
import { readJson, writeJson } from '../utils/storage';

/*
 * 5 — discoveries now carry the columns they were recovered with, the notebook
 * renders from them rather than from a pre-filled briefing, and hints are
 * chosen contextually and stored as text rather than counted against a fixed
 * ladder. A v4 session has none of that, so it is discarded on load. Solved
 * cases, reports, best scores and the leaderboard live in a different store
 * and are untouched by this.
 */
const SESSION_VERSION = 5;
const HISTORY_LIMIT = 50;
const JOURNAL_LIMIT = 200;
const PERSIST_DELAY = 350;
/** Identical statements fired inside this window are treated as a double-click. */
const REPEAT_GUARD_MS = 400;
/** Row scanning is capped so a huge result set never blocks paint. */
const SCAN_ROW_LIMIT = 250;

/**
 * Three contexts, on purpose. The editor text changes on every keystroke, so it
 * lives apart from the rest of the session — otherwise typing a query would
 * re-render the notebook, the suspect roster and the case board as well.
 */
const SessionDataContext = createContext(null);
const SessionActionsContext = createContext(null);
const SqlDraftContext = createContext(null);
// The clock ticks once a second. It gets its own context so the notebook, the
// roster and the case board are not re-rendered sixty times a minute.
const SessionTimerContext = createContext(null);

const emptyReach = () => ({ tables: [], features: [], successes: 0, failures: 0 });

const emptyResult = { columns: [], rows: [], rowCount: 0, executionTime: null, isLoading: false, error: null, hasRun: false, summary: null };

const uniqueMerge = (current, additions) => {
  if (additions.length === 0) return current;
  const next = new Set(current);
  additions.forEach((value) => next.add(value));
  return next.size === current.length ? current : [...next];
};

const asArray = (value) => (Array.isArray(value) ? value : []);
const asString = (value, fallback = '') => (typeof value === 'string' ? value : fallback);
const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

let journalSequence = 0;
const journalEntry = (at, type, title, detail = null) => ({
  id: `${at}-${(journalSequence += 1)}`,
  at,
  type,
  title,
  detail,
});

/** Newest-first, capped. */
const pushJournal = (journal, entries) => (entries.length === 0 ? journal : [...entries.reverse(), ...journal].slice(0, JOURNAL_LIMIT));

/**
 * A single unfiltered read of one table tells us how many rows that table
 * holds, which is the only honest way to show a denominator without asking the
 * server for one.
 */
function fullScanTotal(insights, rowCount) {
  if (insights.tables.length !== 1) return null;
  const narrowing = ['where', 'limit', 'group_by', 'having', 'join', 'distinct', 'subquery', 'cte'];
  if (narrowing.some((feature) => insights.features.includes(feature))) return null;
  if (insights.features.includes('aggregate')) return null;
  return { table: insights.tables[0], total: rowCount };
}

/**
 * The state an objective is measured against. Objectives count real recovered
 * records now, so they need the category ledger rather than just which tables
 * were touched.
 */
function objectiveStateOf({ discoveries, tableTotals, reach, isSolved }) {
  return {
    ...reach,
    isSolved,
    tableTotals,
    categories: buildCategoryProgress({ discoveries, tableTotals }),
    recoveredByTable: countByTable(discoveries),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'setSql':
      return state.sql === action.sql ? state : { ...state, sql: action.sql };

    case 'queryStart':
      return { ...state, result: { ...state.result, isLoading: true, error: null } };

    case 'querySuccess': {
      const { statement, result, insights, rosterNames, startedAt } = action;
      const rows = result.rows ?? [];
      const rowCount = result.rowCount ?? rows.length;

      // --- discovery engine -------------------------------------------------
      const incoming = extractDiscoveries({
        sql: statement,
        tables: insights.tables,
        rows: rows.slice(0, SCAN_ROW_LIMIT),
        rosterNames,
        at: startedAt,
      });
      const { discoveries, added } = mergeDiscoveries(state.discoveries, incoming);
      const suspectFiles = applyDiscoveriesToFiles(state.suspectFiles, added);

      const reach = {
        tables: uniqueMerge(state.reach.tables, insights.tables),
        features: uniqueMerge(state.reach.features, insights.features),
        successes: state.reach.successes + 1,
        failures: state.reach.failures,
      };

      const scan = fullScanTotal(insights, rowCount);
      const tableTotals = scan && state.tableTotals[scan.table] !== scan.total
        ? { ...state.tableTotals, [scan.table]: scan.total }
        : state.tableTotals;

      // --- journal ----------------------------------------------------------
      const entries = [];
      if (added.length > 0) {
        const byTable = added.reduce((totals, record) => {
          totals[record.table] = (totals[record.table] ?? 0) + 1;
          return totals;
        }, {});
        const breakdown = Object.entries(byTable)
          .map(([table, count]) => `${count} ${nounFor(table, count)}`)
          .join(', ');
        entries.push(journalEntry(startedAt, 'discovery', `Recovered ${breakdown}`, statement));
      }

      // A table opened for the first time is worth marking in its own right.
      const freshTables = insights.tables.filter((table) => !state.reach.tables.includes(table));
      freshTables.forEach((table) => {
        entries.push(journalEntry(startedAt, 'source', `Opened ${table.replace(/_/g, ' ')} for the first time`));
      });

      // Objectives tick off gameplay, so the log has to be written where they change.
      const isSolved = state.verdict?.proven === true;
      const beforeState = objectiveStateOf({ discoveries: state.discoveries, tableTotals: state.tableTotals, reach: state.reach, isSolved });
      const afterState = objectiveStateOf({ discoveries, tableTotals, reach, isSolved });
      const before = evaluateObjectives(state.caseId, beforeState);
      const after = evaluateObjectives(state.caseId, afterState);

      const wasDone = new Set(before.filter((objective) => objective.isDone).map((objective) => objective.id));
      const completedNow = after.filter((objective) => objective.isDone && !wasDone.has(objective.id));
      completedNow.forEach((objective) => {
        entries.push(journalEntry(startedAt, 'objective', `Objective complete — ${objective.label}`));
      });

      // What this one query changed, for the notice under the results panel.
      // Everything in here is derived from the player's own file, so it can be
      // shown immediately without giving anything away.
      const openedCategories = afterState.categories.filter((category) => {
        const previous = beforeState.categories.find((entry) => entry.id === category.id);
        return category.isUnlocked && !previous?.isUnlocked;
      });
      const investigationBefore = computeInvestigationPercent(beforeState.categories);
      const investigationAfter = computeInvestigationPercent(afterState.categories);

      // Someone crossing into a substantial file is a milestone for the player.
      added.forEach((record) => {
        record.suspects.forEach((name) => {
          const wasKnown = Boolean(state.suspectFiles[name]);
          if (!wasKnown) entries.push(journalEntry(startedAt, 'suspect', `${name} now has a file`));
        });
      });

      return {
        ...state,
        result: {
          columns: result.columns ?? [],
          rows,
          rowCount,
          executionTime: result.executionTime ?? null,
          isLoading: false,
          error: null,
          hasRun: true,
          summary: describeResult({ tables: insights.tables, rowCount, executionTime: result.executionTime ?? null }),
        },
        discoveries,
        suspectFiles,
        reach,
        tableTotals,
        lastDiscovery: {
          at: startedAt,
          added: added.length,
          openedCategories: openedCategories.map((category) => category.label),
          completedObjectives: completedNow.map((objective) => objective.label),
          investigationDelta: investigationAfter - investigationBefore,
          investigation: investigationAfter,
        },
        journal: pushJournal(state.journal, entries),
        history: [
          { id: `${startedAt}-${state.reach.successes + state.reach.failures}`, sql: statement, at: startedAt, ok: true, rowCount, executionTime: result.executionTime ?? null, error: null },
          ...state.history,
        ].slice(0, HISTORY_LIMIT),
      };
    }

    case 'queryFailure': {
      const { statement, message, startedAt } = action;
      return {
        ...state,
        result: { ...state.result, isLoading: false, error: message, hasRun: true, summary: null },
        // A rejected query discovered nothing; the previous notice must not
        // linger under an error as though it had.
        lastDiscovery: null,
        reach: { ...state.reach, failures: state.reach.failures + 1 },
        history: [
          { id: `${startedAt}-${state.reach.successes + state.reach.failures}`, sql: statement, at: startedAt, ok: false, rowCount: 0, executionTime: null, error: message },
          ...state.history,
        ].slice(0, HISTORY_LIMIT),
      };
    }

    // A problem caught before anything was sent: worth showing, not worth logging.
    case 'localFailure':
      return { ...state, result: { ...state.result, isLoading: false, error: action.message, summary: null } };

    case 'deleteHistoryEntry':
      return { ...state, history: state.history.filter((entry) => entry.id !== action.id) };

    case 'clearHistory':
      return state.history.length === 0 ? state : { ...state, history: [] };

    // Only one suspect can carry the pin; re-selecting the current one clears it.
    case 'setPrimeSuspect': {
      const primeSuspect = state.primeSuspect === action.name ? null : action.name;
      return {
        ...state,
        primeSuspect,
        // The pin and a clearance are opposite judgements about the same person.
        cleared: primeSuspect ? state.cleared.filter((name) => name !== primeSuspect) : state.cleared,
        journal: primeSuspect
          ? pushJournal(state.journal, [journalEntry(action.at, 'prime', `Flagged ${primeSuspect} as prime suspect`)])
          : state.journal,
      };
    }

    case 'toggleCleared': {
      const isCleared = state.cleared.includes(action.name);
      return {
        ...state,
        cleared: toggleInList(state.cleared, action.name),
        primeSuspect: !isCleared && state.primeSuspect === action.name ? null : state.primeSuspect,
        journal: isCleared
          ? state.journal
          : pushJournal(state.journal, [journalEntry(action.at, 'cleared', `Marked ${action.name} as accounted for`)]),
      };
    }

    case 'setNotes':
      return state.notes === action.notes ? state : { ...state, notes: action.notes };

    case 'setEvidenceNote':
      return { ...state, evidenceNotes: { ...state.evidenceNotes, [action.key]: action.note } };

    case 'toggleBookmark':
      return { ...state, bookmarks: toggleInList(state.bookmarks, action.value) };

    case 'toggleLead':
      return { ...state, leadsDone: toggleInList(state.leadsDone, action.value) };

    case 'setNotebookSection':
      return state.notebookSection === action.section ? state : { ...state, notebookSection: action.section };

    case 'setBoardFolder':
      return state.boardFolder === action.folder ? state : { ...state, boardFolder: action.folder };

    case 'toggleExpanded':
      return { ...state, expanded: { ...state.expanded, [action.key]: !state.expanded[action.key] } };

    case 'rememberScroll':
      return state.scrollPositions[action.key] === action.offset
        ? state
        : { ...state, scrollPositions: { ...state.scrollPositions, [action.key]: action.offset } };

    case 'startTimer':
      return state.runningSince !== null ? state : { ...state, runningSince: action.at };

    case 'pauseTimer': {
      if (state.runningSince === null) return state;
      return {
        ...state,
        elapsedMs: state.elapsedMs + Math.max(0, action.at - state.runningSince),
        runningSince: null,
      };
    }

    /*
     * The hint is chosen here, at the moment it is taken, against the file as
     * it stands right now — which is what stops a hint pointing somewhere the
     * player has already been. Once chosen it is stored as text, so a hint
     * that has been paid for never changes afterwards.
     */
    case 'revealHint': {
      const authored = getCase(state.caseId)?.hints ?? [];
      if (state.hintsTaken.length >= hintBudget(authored)) return state;

      const hint = nextHint({
        authored,
        categories: buildCategoryProgress({ discoveries: state.discoveries, tableTotals: state.tableTotals }),
        features: state.reach.features,
        taken: state.hintsTaken,
      });
      if (!hint) return state;

      return {
        ...state,
        hintsTaken: [...state.hintsTaken, hint],
        journal: pushJournal(state.journal, [
          journalEntry(action.at, 'hint', `Took hint ${state.hintsTaken.length + 1}`),
        ]),
      };
    }

    case 'setReasoning':
      return state.reasoning === action.reasoning ? state : { ...state, reasoning: action.reasoning };

    case 'recordAccusation': {
      const { at, suspect, evidenceKeys, reasoning, proven } = action;
      const settled = proven && state.runningSince !== null
        ? state.elapsedMs + Math.max(0, at - state.runningSince)
        : state.elapsedMs;

      return {
        ...state,
        elapsedMs: settled,
        runningSince: proven ? null : state.runningSince,
        completionMs: proven ? settled : state.completionMs,
        accusations: [{ id: `${at}`, at, suspect, evidenceKeys, reasoning, proven }, ...state.accusations],
        verdict: { proven, at, suspect, evidenceKeys, reasoning },
        // A fresh accusation needs fresh evidence, so remember where the file
        // stood when this one was made.
        lastAccusationDiscoveryCount: proven ? null : state.discoveries.length,
        journal: pushJournal(state.journal, [
          journalEntry(at, proven ? 'verdict' : 'accusation',
            proven ? `Case proven against ${suspect}` : `Accusation against ${suspect} was not proven`),
        ]),
      };
    }

    // The reveal is fetched from the case database only after a proven verdict.
    case 'setReveal':
      return { ...state, reveal: action.reveal };

    default:
      return state;
  }
}

/** Rehydrates a saved session, discarding anything that no longer matches the shape. */
function initialise({ difficulty, starterSql, defaultFolder, tableTotals }) {
  const fresh = {
    version: SESSION_VERSION,
    // Kept in state so the reducer can resolve catalog-driven objectives
    // without every action having to carry the case id.
    caseId: difficulty,
    // When this investigation was first opened. Used only to report how long a
    // case took; there is no countdown and nothing expires.
    startedAt: Date.now(),
    // The clock. `runningSince` is null whenever it is paused, and is never
    // restored from storage — a session reopened after a crash resumes from the
    // accumulated total rather than counting the hours in between.
    elapsedMs: 0,
    runningSince: null,
    completionMs: null,
    // Hint *text*, in the order it was taken. See the revealHint reducer case.
    hintsTaken: [],
    sql: starterSql,
    history: [],
    journal: [],
    discoveries: [],
    suspectFiles: {},
    // Seeded from the row counts the briefing sent, so every category can show
    // a denominator ("3 / 8 recovered") from the first moment rather than only
    // after a table has happened to be read in full.
    tableTotals: { ...tableTotals },
    lastDiscovery: null,
    cleared: [],
    primeSuspect: null,
    notes: '',
    evidenceNotes: {},
    bookmarks: [],
    leadsDone: [],
    notebookSection: 'overview',
    boardFolder: defaultFolder,
    expanded: {},
    scrollPositions: {},
    reach: emptyReach(),
    result: emptyResult,
    accusations: [],
    verdict: null,
    reveal: null,
    reasoning: '',
    lastAccusationDiscoveryCount: null,
  };

  const stored = readJson(`session:${difficulty}`, null);
  if (!stored || stored.version !== SESSION_VERSION) return fresh;

  const reach = asObject(stored.reach);
  const discoveries = asArray(stored.discoveries).filter((record) => record && typeof record.key === 'string');
  // Journal ids must keep climbing past whatever was restored.
  journalSequence = Math.max(journalSequence, asArray(stored.journal).length);

  return {
    ...fresh,
    sql: asString(stored.sql, starterSql),
    history: asArray(stored.history).filter((entry) => entry && typeof entry.sql === 'string').slice(0, HISTORY_LIMIT),
    journal: asArray(stored.journal).filter((entry) => entry && typeof entry.title === 'string').slice(0, JOURNAL_LIMIT),
    discoveries: discoveries.map((record) => ({ ...record, suspects: asArray(record.suspects), fields: asObject(record.fields) })),
    suspectFiles: asObject(stored.suspectFiles),
    // Briefing counts are the floor; a stored full-table scan can only confirm
    // the same number, never contradict it.
    tableTotals: { ...tableTotals, ...asObject(stored.tableTotals) },
    cleared: asArray(stored.cleared).filter((value) => typeof value === 'string'),
    primeSuspect: typeof stored.primeSuspect === 'string' ? stored.primeSuspect : null,
    notes: asString(stored.notes),
    evidenceNotes: asObject(stored.evidenceNotes),
    bookmarks: asArray(stored.bookmarks).filter((value) => typeof value === 'string'),
    leadsDone: asArray(stored.leadsDone).filter((value) => typeof value === 'string'),
    notebookSection: asString(stored.notebookSection, 'overview'),
    boardFolder: asString(stored.boardFolder, defaultFolder),
    expanded: asObject(stored.expanded),
    scrollPositions: asObject(stored.scrollPositions),
    reach: {
      tables: asArray(reach.tables),
      features: asArray(reach.features),
      successes: Number.isFinite(reach.successes) ? reach.successes : 0,
      failures: Number.isFinite(reach.failures) ? reach.failures : 0,
    },
    startedAt: Number.isFinite(stored.startedAt) ? stored.startedAt : fresh.startedAt,
    elapsedMs: Number.isFinite(stored.elapsedMs) ? stored.elapsedMs : 0,
    completionMs: Number.isFinite(stored.completionMs) ? stored.completionMs : null,
    hintsTaken: asArray(stored.hintsTaken).filter((entry) => typeof entry === 'string'),
    accusations: asArray(stored.accusations).filter((entry) => entry && typeof entry.suspect === 'string'),
    verdict: stored.verdict && typeof stored.verdict.suspect === 'string' ? stored.verdict : null,
    reveal: stored.reveal && typeof stored.reveal === 'object' ? stored.reveal : null,
    reasoning: asString(stored.reasoning),
    lastAccusationDiscoveryCount: Number.isFinite(stored.lastAccusationDiscoveryCount)
      ? stored.lastAccusationDiscoveryCount
      : null,
  };
}

export function InvestigationSessionProvider({ difficulty, briefing, starterSql, children }) {
  const defaultFolder = briefing.notebook[0]?.id ?? 'evidence';
  // The briefing's row counts are the denominators for every "3 / 8 recovered"
  // in the game. They say how big each table is and nothing whatever about
  // what is in it.
  const briefingTotals = useMemo(
    () => Object.fromEntries((briefing.tables ?? []).map((table) => [table.name, table.rowCount])),
    [briefing.tables],
  );
  const [state, dispatch] = useReducer(
    reducer,
    { difficulty, starterSql, defaultFolder, tableTotals: briefingTotals },
    initialise,
  );

  // The query runner reads live state without being rebuilt on every keystroke.
  const stateRef = useRef(state);
  stateRef.current = state;
  const inFlightRef = useRef(false);
  const lastRunRef = useRef({ sql: '', at: 0 });

  const rosterNames = useMemo(() => briefing.suspects.map((suspect) => suspect.name), [briefing.suspects]);

  /* ---------------------------------------------------------------- autosave */

  const snapshot = useMemo(
    () => ({
      version: SESSION_VERSION,
      sql: state.sql,
      history: state.history,
      journal: state.journal,
      discoveries: state.discoveries,
      suspectFiles: state.suspectFiles,
      tableTotals: state.tableTotals,
      cleared: state.cleared,
      primeSuspect: state.primeSuspect,
      notes: state.notes,
      evidenceNotes: state.evidenceNotes,
      bookmarks: state.bookmarks,
      leadsDone: state.leadsDone,
      notebookSection: state.notebookSection,
      boardFolder: state.boardFolder,
      expanded: state.expanded,
      scrollPositions: state.scrollPositions,
      reach: state.reach,
      startedAt: state.startedAt,
      elapsedMs: state.elapsedMs,
      completionMs: state.completionMs,
      hintsTaken: state.hintsTaken,
      accusations: state.accusations,
      verdict: state.verdict,
      reveal: state.reveal,
      reasoning: state.reasoning,
      lastAccusationDiscoveryCount: state.lastAccusationDiscoveryCount,
    }),
    [
      state.sql, state.history, state.journal, state.discoveries, state.suspectFiles,
      state.tableTotals, state.cleared, state.primeSuspect, state.notes, state.evidenceNotes,
      state.bookmarks, state.leadsDone, state.notebookSection, state.boardFolder,
      state.expanded, state.scrollPositions, state.reach, state.startedAt,
      state.elapsedMs, state.completionMs, state.hintsTaken, state.accusations, state.verdict, state.reveal, state.reasoning, state.lastAccusationDiscoveryCount,
    ],
  );

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const storageKey = `session:${difficulty}`;

  // Typing in the editor must not hit localStorage on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => writeJson(storageKey, snapshotRef.current), PERSIST_DELAY);
    return () => window.clearTimeout(timer);
  }, [snapshot, storageKey]);

  // A tab closed or navigated away mid-debounce must still keep the last edit.
  //
  // Both exits carry the same guard: if the stored session has gone while this
  // board was mounted, something deliberately cleared it — a replay, a mode
  // switch, a reset — and writing the in-memory copy back would silently undo
  // that. The first debounced write lands 350ms after mount, so the only thing
  // this can cost is a session too new to contain anything.
  useEffect(() => {
    const flush = () => {
      if (readJson(storageKey, null) === null) return;
      writeJson(storageKey, snapshotRef.current);
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [storageKey]);

  /* ------------------------------------------------------------------ timer */

  // The clock runs while the board is mounted and the case is unsolved. It is
  // banked on unmount so navigating away — to Settings, or anywhere else —
  // stops it rather than losing the time.
  const isTimerRunning = state.runningSince !== null;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isTimerRunning) return undefined;
    const id = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [isTimerRunning]);

  useEffect(() => {
    if (stateRef.current.verdict?.proven) return undefined;
    dispatch({ type: 'startTimer', at: Date.now() });
    return () => dispatch({ type: 'pauseTimer', at: Date.now() });
  }, []);

  const liveElapsedMs = state.elapsedMs + (state.runningSince === null ? 0 : Date.now() - state.runningSince);
  const timerValue = useMemo(
    () => ({ elapsedMs: liveElapsedMs, isRunning: isTimerRunning, completionMs: state.completionMs }),
    // `tick` is the heartbeat: it is what makes the displayed value advance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick, isTimerRunning, state.elapsedMs, state.completionMs],
  );

  /* ----------------------------------------------------------- query running */

  const runQuery = useCallback(async (override) => {
    const statement = (typeof override === 'string' ? override : stateRef.current.sql).trim();

    if (statement === '') {
      dispatch({ type: 'localFailure', message: 'The terminal is empty. Write a query, then run it.' });
      return;
    }
    // A request is already out; drop the extra clicks rather than queueing them.
    if (inFlightRef.current) return;

    const now = Date.now();
    const { sql: lastSql, at: lastAt } = lastRunRef.current;
    if (statement === lastSql && now - lastAt < REPEAT_GUARD_MS) return;
    lastRunRef.current = { sql: statement, at: now };

    inFlightRef.current = true;
    dispatch({ type: 'queryStart' });

    try {
      const result = await executeCaseQuery(difficulty, statement);
      dispatch({ type: 'querySuccess', statement, result, insights: inspectStatement(statement), rosterNames, startedAt: now });
      recordQueryRun(difficulty);
    } catch (error) {
      dispatch({ type: 'queryFailure', statement, message: error.message, startedAt: now });
    } finally {
      inFlightRef.current = false;
      lastRunRef.current = { sql: statement, at: Date.now() };
    }
  }, [difficulty, rosterNames]);

  /* -------------------------------------------------------------- selectors */

  const isSolved = state.verdict?.proven === true;

  // The category ledger is the spine of the investigation loop: the notebook
  // renders from it, objectives count against it, the accusation gate reads it
  // and the debrief reports it back.
  const categories = useMemo(
    () => buildCategoryProgress({ discoveries: state.discoveries, tableTotals: state.tableTotals }),
    [state.discoveries, state.tableTotals],
  );
  const investigation = useMemo(() => computeInvestigationPercent(categories), [categories]);
  const recoveredByTable = useMemo(() => countByTable(state.discoveries), [state.discoveries]);

  const objectives = useMemo(
    () => evaluateObjectives(difficulty, {
      ...state.reach, isSolved, categories, recoveredByTable, tableTotals: state.tableTotals,
    }),
    [difficulty, state.reach, isSolved, categories, recoveredByTable, state.tableTotals],
  );
  const tally = useMemo(() => objectiveTally(objectives), [objectives]);
  const timeline = useMemo(() => buildTimeline(state.discoveries), [state.discoveries]);
  // A theft case carries no victim record; the ledger and the observations
  // must not ask the player to go and find one.
  const hasVictim = !getCaseWording(difficulty).isTheft;
  const intel = useMemo(
    () => buildSuspectIntel({
      suspects: briefing.suspects,
      suspectFiles: state.suspectFiles,
      primeSuspect: state.primeSuspect,
      cleared: state.cleared,
    }),
    [briefing.suspects, state.suspectFiles, state.primeSuspect, state.cleared],
  );
  const ledger = useMemo(
    () => buildProgressLedger({
      discoveries: state.discoveries,
      tableTotals: state.tableTotals,
      timelineCount: timeline.length,
      intel,
      hasVictim,
    }),
    [state.discoveries, state.tableTotals, timeline.length, intel, hasVictim],
  );
  const insights = useMemo(
    () => buildInsights({ tables: state.reach.tables, discoveries: state.discoveries, timeline, intel, primeSuspect: state.primeSuspect, hasVictim }),
    [state.reach.tables, state.discoveries, timeline, intel, state.primeSuspect, hasVictim],
  );

  const readiness = useMemo(
    () => assessReadiness({
      caseId: difficulty,
      discoveries: state.discoveries,
      reach: state.reach,
      intel,
      categories,
      investigation,
      tally,
      lastAccusationDiscoveryCount: state.lastAccusationDiscoveryCount,
    }),
    [difficulty, state.discoveries, state.reach, intel, categories, investigation, tally, state.lastAccusationDiscoveryCount],
  );

  /* ------------------------------------------------------------- accusation */

  const selectorsRef = useRef({ timeline, intel, ledger, tally, categories, investigation });
  selectorsRef.current = { timeline, intel, ledger, tally, categories, investigation };

  /**
   * Grades an accusation and, only when it is proven, pulls the reveal out of
   * the case database through the ordinary read-only API and files the report.
   */
  const submitAccusation = useCallback(async ({ suspect, evidenceKeys, reasoning }) => {
    const current = stateRef.current;
    const {
      timeline: currentTimeline, intel: currentIntel, ledger: currentLedger,
      tally: currentTally, categories: currentCategories, investigation: currentInvestigation,
    } = selectorsRef.current;
    const at = Date.now();

    const { proven, coverage } = evaluateAccusation({
      difficulty,
      suspect,
      evidenceKeys,
      discoveries: current.discoveries,
      reach: current.reach,
      timeline: currentTimeline,
    });

    dispatch({ type: 'recordAccusation', at, suspect, evidenceKeys, reasoning, proven });
    if (!proven) return { proven: false };

    // Everything below this line runs only once the case is proven.
    const killer = getSolution(difficulty)?.killer ?? suspect;
    const quoted = killer.replace(/'/g, "''");
    let reveal = null;
    try {
      const [killerRows, victimRows] = await Promise.all([
        executeCaseQuery(difficulty, `SELECT name, occupation, relationship_to_victim, motive, hidden_secret, timeline FROM suspects WHERE name = '${quoted}';`),
        executeCaseQuery(difficulty, 'SELECT name, occupation, age, cause_of_death, date_of_death, time_of_death FROM victims;'),
      ]);
      reveal = { killer: killerRows.rows?.[0] ?? null, victim: victimRows.rows?.[0] ?? null };
      dispatch({ type: 'setReveal', reveal });
    } catch {
      // The verdict stands even if the reveal cannot be fetched; the screen
      // simply shows what the player already holds.
      reveal = null;
    }

    // One engine grades both modes, so a solved case and a leaderboard entry
    // mean the same thing. The clock is already banked by the reducer.
    const elapsedMs = current.runningSince === null
      ? current.elapsedMs
      : current.elapsedMs + Math.max(0, at - current.runningSince);
    const { score, breakdown } = computeScore({
      baseScore: briefing.case.score ?? 1000,
      attempts: current.accusations.length + 1,
      hintsUsed: current.hintsTaken.length,
      elapsedMs,
      estimate: getCase(difficulty)?.estimatedTime,
      coverage: { ...coverage, queries: current.reach.successes + current.reach.failures },
      thresholds: getCaseThresholds(difficulty).verdict,
      objectives: currentTally,
      investigation: currentInvestigation,
    });

    const cited = current.discoveries.filter((record) => evidenceKeys.includes(record.key));
    markCaseSolved(difficulty, {
      caseNumber: briefing.case.caseNumber,
      title: briefing.case.title,
      difficulty: briefing.case.difficulty,
      victim: briefing.case.victim,
      subjectLabel: getCaseWording(difficulty).subject,
      solvedAt: new Date(at).toISOString(),
      accused: suspect,
      primeSuspect: current.primeSuspect,
      attempts: current.accusations.length + 1,
      reasoning,
      coverage,
      elapsedMs,
      hintsUsed: current.hintsTaken.length,
      score,
      scoreBreakdown: breakdown,
      stars: starsFor({
        investigation: currentInvestigation,
        objectives: currentTally,
        hintsUsed: current.hintsTaken.length,
        wrongAccusations: current.accusations.length,
      }),
      objectives: currentTally,
      // What was recovered against what was there, so the debrief can show the
      // player exactly what they left behind — which is the whole replay hook.
      investigation: currentInvestigation,
      categories: currentCategories.map(({ id, label, recovered, total, target, isComplete }) => ({ id, label, recovered, total, target, isComplete })),
      ledger: currentLedger,
      citedEvidence: cited.map(({ key, title, table, occurredAt, location, confidence, sql }) => ({ key, title, table, occurredAt, location, confidence, sql })),
      discoveries: current.discoveries.map(({ key, title, table, occurredAt, location, confidence }) => ({ key, title, table, occurredAt, location, confidence })),
      timeline: currentTimeline.map(({ id, clock, title, source, location }) => ({ id, clock, title, source, location })),
      suspects: currentIntel.map(({ name, occupation, status, recordCount, sources }) => ({ name, occupation, status, recordCount, sources })),
      queries: current.history.map(({ sql, at: ranAt, ok, rowCount }) => ({ sql, at: ranAt, ok, rowCount })),
      reveal,
    });

    return { proven: true };
  }, [briefing.case, difficulty]);

  /* ---------------------------------------------------------------- actions */

  const actions = useMemo(() => ({
    setSql: (sql) => dispatch({ type: 'setSql', sql }),
    resetSql: () => dispatch({ type: 'setSql', sql: starterSql }),
    clearSql: () => dispatch({ type: 'setSql', sql: '' }),
    runQuery,
    submitAccusation,
    setReasoning: (reasoning) => dispatch({ type: 'setReasoning', reasoning }),
    startTimer: () => dispatch({ type: 'startTimer', at: Date.now() }),
    pauseTimer: () => dispatch({ type: 'pauseTimer', at: Date.now() }),
    revealHint: () => dispatch({ type: 'revealHint', at: Date.now() }),
    deleteHistoryEntry: (id) => dispatch({ type: 'deleteHistoryEntry', id }),
    clearHistory: () => dispatch({ type: 'clearHistory' }),
    setPrimeSuspect: (name) => dispatch({ type: 'setPrimeSuspect', name, at: Date.now() }),
    toggleCleared: (name) => dispatch({ type: 'toggleCleared', name, at: Date.now() }),
    setNotes: (notes) => dispatch({ type: 'setNotes', notes }),
    setEvidenceNote: (key, note) => dispatch({ type: 'setEvidenceNote', key, note }),
    toggleBookmark: (value) => dispatch({ type: 'toggleBookmark', value }),
    toggleLead: (value) => dispatch({ type: 'toggleLead', value }),
    setNotebookSection: (section) => dispatch({ type: 'setNotebookSection', section }),
    setBoardFolder: (folder) => dispatch({ type: 'setBoardFolder', folder }),
    toggleExpanded: (key) => dispatch({ type: 'toggleExpanded', key }),
    rememberScroll: (key, offset) => dispatch({ type: 'rememberScroll', key, offset }),
  }), [runQuery, submitAccusation, starterSql]);

  const data = useMemo(() => ({
    result: state.result,
    history: state.history,
    journal: state.journal,
    discoveries: state.discoveries,
    tableTotals: state.tableTotals,
    primeSuspect: state.primeSuspect,
    cleared: state.cleared,
    notes: state.notes,
    evidenceNotes: state.evidenceNotes,
    bookmarks: state.bookmarks,
    leadsDone: state.leadsDone,
    notebookSection: state.notebookSection,
    boardFolder: state.boardFolder,
    expanded: state.expanded,
    scrollPositions: state.scrollPositions,
    reach: state.reach,
    startedAt: state.startedAt,
    elapsedMs: state.elapsedMs,
    runningSince: state.runningSince,
    completionMs: state.completionMs,
    hintsTaken: state.hintsTaken,
    hintsRevealed: state.hintsTaken.length,
    accusations: state.accusations,
    verdict: state.verdict,
    reveal: state.reveal,
    reasoning: state.reasoning,
    isSolved,
    objectives,
    tally,
    timeline,
    intel,
    ledger,
    insights,
    readiness,
    categories,
    investigation,
    lastDiscovery: state.lastDiscovery,
    starterSql,
  }), [
    state.result, state.history, state.journal, state.discoveries, state.tableTotals,
    state.primeSuspect, state.cleared, state.notes, state.evidenceNotes, state.bookmarks,
    state.leadsDone, state.notebookSection, state.boardFolder, state.expanded,
    state.scrollPositions, state.reach, state.startedAt,
    state.elapsedMs, state.runningSince, state.completionMs, state.hintsTaken,
    state.accusations, state.verdict, state.reveal, state.reasoning,
    objectives, tally, timeline, intel, ledger, insights, readiness,
    categories, investigation, state.lastDiscovery, starterSql,
  ]);

  const sqlDraft = useMemo(() => ({ sql: state.sql, isDirty: state.sql !== starterSql }), [state.sql, starterSql]);

  return (
    <SessionActionsContext.Provider value={actions}>
      <SessionDataContext.Provider value={data}>
        <SqlDraftContext.Provider value={sqlDraft}>
          <SessionTimerContext.Provider value={timerValue}>{children}</SessionTimerContext.Provider>
        </SqlDraftContext.Provider>
      </SessionDataContext.Provider>
    </SessionActionsContext.Provider>
  );
}

function useRequiredContext(context, name) {
  const value = useContext(context);
  if (!value) throw new Error(`${name} must be used inside InvestigationSessionProvider.`);
  return value;
}

/** Everything except the editor text, plus the actions. */
export function useInvestigationSession() {
  const data = useRequiredContext(SessionDataContext, 'useInvestigationSession');
  const actions = useRequiredContext(SessionActionsContext, 'useInvestigationSession');
  return useMemo(() => ({ ...data, ...actions }), [data, actions]);
}

/** Actions only — subscribing to this never causes a re-render. */
export function useInvestigationActions() {
  return useRequiredContext(SessionActionsContext, 'useInvestigationActions');
}

/** The editor text. Only the terminal should subscribe here. */
export function useSqlDraft() {
  return useRequiredContext(SqlDraftContext, 'useSqlDraft');
}

/** The running clock. Only the header should subscribe here. */
export function useInvestigationTimer() {
  return useRequiredContext(SessionTimerContext, 'useInvestigationTimer');
}
