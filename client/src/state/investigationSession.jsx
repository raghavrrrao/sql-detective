import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { executeCaseQuery } from '../services/caseService';
import { recordQueryRun } from '../utils/caseProgress';
import { extractDiscoveries, mergeDiscoveries } from '../utils/discovery';
import { buildInsights } from '../utils/insights';
import { buildProgressLedger } from '../utils/investigationProgress';
import { buildTimeline } from '../utils/investigationTimeline';
import { evaluateObjectives, objectiveTally } from '../utils/objectives';
import { describeResult, nounFor } from '../utils/queryFeedback';
import { applyDiscoveriesToFiles, buildSuspectIntel } from '../utils/suspectIntel';
import { inspectStatement } from '../utils/sqlInsights';
import { readJson, writeJson } from '../utils/storage';

const SESSION_VERSION = 2;
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
      const before = evaluateObjectives(state.reach);
      const after = evaluateObjectives(reach);
      after.forEach((objective, index) => {
        if (objective.isDone && !before[index].isDone) {
          entries.push(journalEntry(startedAt, 'objective', `Objective complete — ${objective.label}`));
        }
      });

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

    default:
      return state;
  }
}

/** Rehydrates a saved session, discarding anything that no longer matches the shape. */
function initialise({ difficulty, starterSql, defaultFolder }) {
  const fresh = {
    version: SESSION_VERSION,
    sql: starterSql,
    history: [],
    journal: [],
    discoveries: [],
    suspectFiles: {},
    tableTotals: {},
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
    discoveries: discoveries.map((record) => ({ ...record, suspects: asArray(record.suspects) })),
    suspectFiles: asObject(stored.suspectFiles),
    tableTotals: asObject(stored.tableTotals),
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
  };
}

export function InvestigationSessionProvider({ difficulty, briefing, starterSql, children }) {
  const defaultFolder = briefing.notebook[0]?.id ?? 'evidence';
  const [state, dispatch] = useReducer(reducer, { difficulty, starterSql, defaultFolder }, initialise);

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
    }),
    [
      state.sql, state.history, state.journal, state.discoveries, state.suspectFiles,
      state.tableTotals, state.cleared, state.primeSuspect, state.notes, state.evidenceNotes,
      state.bookmarks, state.leadsDone, state.notebookSection, state.boardFolder,
      state.expanded, state.scrollPositions, state.reach,
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
  useEffect(() => {
    const flush = () => writeJson(storageKey, snapshotRef.current);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [storageKey]);

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

  /* ---------------------------------------------------------------- actions */

  const actions = useMemo(() => ({
    setSql: (sql) => dispatch({ type: 'setSql', sql }),
    resetSql: () => dispatch({ type: 'setSql', sql: starterSql }),
    clearSql: () => dispatch({ type: 'setSql', sql: '' }),
    runQuery,
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
  }), [runQuery, starterSql]);

  /* -------------------------------------------------------------- selectors */

  const objectives = useMemo(() => evaluateObjectives(state.reach), [state.reach]);
  const tally = useMemo(() => objectiveTally(objectives), [objectives]);
  const timeline = useMemo(() => buildTimeline(state.discoveries), [state.discoveries]);
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
    }),
    [state.discoveries, state.tableTotals, timeline.length, intel],
  );
  const insights = useMemo(
    () => buildInsights({ tables: state.reach.tables, discoveries: state.discoveries, timeline, intel, primeSuspect: state.primeSuspect }),
    [state.reach.tables, state.discoveries, timeline, intel, state.primeSuspect],
  );

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
    objectives,
    tally,
    timeline,
    intel,
    ledger,
    insights,
    starterSql,
  }), [
    state.result, state.history, state.journal, state.discoveries, state.tableTotals,
    state.primeSuspect, state.cleared, state.notes, state.evidenceNotes, state.bookmarks,
    state.leadsDone, state.notebookSection, state.boardFolder, state.expanded,
    state.scrollPositions, state.reach,
    objectives, tally, timeline, intel, ledger, insights, starterSql,
  ]);

  const sqlDraft = useMemo(() => ({ sql: state.sql, isDirty: state.sql !== starterSql }), [state.sql, starterSql]);

  return (
    <SessionActionsContext.Provider value={actions}>
      <SessionDataContext.Provider value={data}>
        <SqlDraftContext.Provider value={sqlDraft}>{children}</SqlDraftContext.Provider>
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
