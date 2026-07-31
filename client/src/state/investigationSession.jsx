import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { executeCaseQuery } from '../services/caseService';
import { recordQueryRun } from '../utils/caseProgress';
import { evaluateObjectives, objectiveTally, summariseInvestigation } from '../utils/objectives';
import { inspectStatement } from '../utils/sqlInsights';
import { readJson, writeJson } from '../utils/storage';

const SESSION_VERSION = 1;
const HISTORY_LIMIT = 50;
const PERSIST_DELAY = 350;
/** Identical statements fired inside this window are treated as a double-click. */
const REPEAT_GUARD_MS = 400;
/** Row scanning for discovery is capped so a huge result set never blocks paint. */
const SCAN_ROW_LIMIT = 250;

/**
 * Three contexts, on purpose. The editor text changes on every keystroke, so it
 * lives apart from the rest of the session — otherwise typing a query would
 * re-render the notebook, the suspect roster and the case board as well.
 */
const SessionDataContext = createContext(null);
const SessionActionsContext = createContext(null);
const SqlDraftContext = createContext(null);

const emptyDiscovery = () => ({ tables: [], features: [], suspectsSeen: [], evidenceSeen: [], successes: 0, failures: 0 });

const emptyResult = { columns: [], rows: [], rowCount: 0, executionTime: null, isLoading: false, error: null, hasRun: false };

const uniqueMerge = (current, additions) => {
  if (additions.length === 0) return current;
  const next = new Set(current);
  additions.forEach((value) => next.add(value));
  return next.size === current.length ? current : [...next];
};

const asArray = (value) => (Array.isArray(value) ? value : []);
const asString = (value, fallback = '') => (typeof value === 'string' ? value : fallback);

/** Finds which roster names and exhibit titles actually appeared in a result set. */
function scanRows(rows, catalog, suspectsSeen, evidenceSeen) {
  const limit = Math.min(rows.length, SCAN_ROW_LIMIT);
  for (let index = 0; index < limit; index += 1) {
    const blob = Object.values(rows[index])
      .filter((value) => typeof value === 'string' && value !== '')
      .join(' | ');
    if (blob === '') continue;
    for (const name of catalog.suspects) if (blob.includes(name)) suspectsSeen.add(name);
    for (const title of catalog.evidence) if (blob.includes(title)) evidenceSeen.add(title);
  }
}

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

function reducer(state, action) {
  switch (action.type) {
    case 'setSql':
      return state.sql === action.sql ? state : { ...state, sql: action.sql };

    case 'queryStart':
      return { ...state, result: { ...state.result, isLoading: true, error: null } };

    case 'querySuccess': {
      const { statement, result, insights, catalog, startedAt } = action;
      const rows = result.rows ?? [];
      const suspectsSeen = new Set(state.discovery.suspectsSeen);
      const evidenceSeen = new Set(state.discovery.evidenceSeen);
      scanRows(rows, catalog, suspectsSeen, evidenceSeen);
      const rowCount = result.rowCount ?? rows.length;

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
        },
        discovery: {
          tables: uniqueMerge(state.discovery.tables, insights.tables),
          features: uniqueMerge(state.discovery.features, insights.features),
          suspectsSeen: [...suspectsSeen],
          evidenceSeen: [...evidenceSeen],
          successes: state.discovery.successes + 1,
          failures: state.discovery.failures,
        },
        history: [
          { id: `${startedAt}-${state.discovery.successes + state.discovery.failures}`, sql: statement, at: startedAt, ok: true, rowCount, executionTime: result.executionTime ?? null, error: null },
          ...state.history,
        ].slice(0, HISTORY_LIMIT),
      };
    }

    case 'queryFailure': {
      const { statement, message, startedAt } = action;
      return {
        ...state,
        result: { ...state.result, isLoading: false, error: message, hasRun: true },
        discovery: { ...state.discovery, failures: state.discovery.failures + 1 },
        history: [
          { id: `${startedAt}-${state.discovery.successes + state.discovery.failures}`, sql: statement, at: startedAt, ok: false, rowCount: 0, executionTime: null, error: message },
          ...state.history,
        ].slice(0, HISTORY_LIMIT),
      };
    }

    // A problem caught before anything was sent: worth showing, not worth logging.
    case 'localFailure':
      return { ...state, result: { ...state.result, isLoading: false, error: action.message } };

    case 'deleteHistoryEntry':
      return { ...state, history: state.history.filter((entry) => entry.id !== action.id) };

    case 'clearHistory':
      return state.history.length === 0 ? state : { ...state, history: [] };

    // Only one suspect can carry the pin; re-selecting the current one clears it.
    case 'setPrimeSuspect':
      return { ...state, primeSuspect: state.primeSuspect === action.name ? null : action.name };

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
    primeSuspect: null,
    notes: '',
    evidenceNotes: {},
    bookmarks: [],
    leadsDone: [],
    notebookSection: 'overview',
    boardFolder: defaultFolder,
    expanded: {},
    scrollPositions: {},
    discovery: emptyDiscovery(),
    result: emptyResult,
  };

  const stored = readJson(`session:${difficulty}`, null);
  if (!stored || stored.version !== SESSION_VERSION) return fresh;

  const discovery = stored.discovery ?? {};
  return {
    ...fresh,
    sql: asString(stored.sql, starterSql),
    history: asArray(stored.history).filter((entry) => entry && typeof entry.sql === 'string').slice(0, HISTORY_LIMIT),
    primeSuspect: typeof stored.primeSuspect === 'string' ? stored.primeSuspect : null,
    notes: asString(stored.notes),
    evidenceNotes: stored.evidenceNotes && typeof stored.evidenceNotes === 'object' ? stored.evidenceNotes : {},
    bookmarks: asArray(stored.bookmarks).filter((value) => typeof value === 'string'),
    leadsDone: asArray(stored.leadsDone).filter((value) => typeof value === 'string'),
    notebookSection: asString(stored.notebookSection, 'overview'),
    boardFolder: asString(stored.boardFolder, defaultFolder),
    expanded: stored.expanded && typeof stored.expanded === 'object' ? stored.expanded : {},
    scrollPositions: stored.scrollPositions && typeof stored.scrollPositions === 'object' ? stored.scrollPositions : {},
    discovery: {
      tables: asArray(discovery.tables),
      features: asArray(discovery.features),
      suspectsSeen: asArray(discovery.suspectsSeen),
      evidenceSeen: asArray(discovery.evidenceSeen),
      successes: Number.isFinite(discovery.successes) ? discovery.successes : 0,
      failures: Number.isFinite(discovery.failures) ? discovery.failures : 0,
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

  const catalog = useMemo(
    () => ({
      suspects: briefing.suspects.map((suspect) => suspect.name),
      evidence: briefing.evidence.map((item) => item.title),
    }),
    [briefing.suspects, briefing.evidence],
  );

  /* ---------------------------------------------------------------- autosave */

  const snapshot = useMemo(
    () => ({
      version: SESSION_VERSION,
      sql: state.sql,
      history: state.history,
      primeSuspect: state.primeSuspect,
      notes: state.notes,
      evidenceNotes: state.evidenceNotes,
      bookmarks: state.bookmarks,
      leadsDone: state.leadsDone,
      notebookSection: state.notebookSection,
      boardFolder: state.boardFolder,
      expanded: state.expanded,
      scrollPositions: state.scrollPositions,
      discovery: state.discovery,
    }),
    [
      state.sql, state.history, state.primeSuspect, state.notes, state.evidenceNotes,
      state.bookmarks, state.leadsDone, state.notebookSection, state.boardFolder,
      state.expanded, state.scrollPositions, state.discovery,
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
      dispatch({ type: 'querySuccess', statement, result, insights: inspectStatement(statement), catalog, startedAt: now });
      recordQueryRun(difficulty);
    } catch (error) {
      dispatch({ type: 'queryFailure', statement, message: error.message, startedAt: now });
    } finally {
      inFlightRef.current = false;
      lastRunRef.current = { sql: statement, at: Date.now() };
    }
  }, [catalog, difficulty]);

  /* ---------------------------------------------------------------- actions */

  const actions = useMemo(() => ({
    setSql: (sql) => dispatch({ type: 'setSql', sql }),
    resetSql: () => dispatch({ type: 'setSql', sql: starterSql }),
    clearSql: () => dispatch({ type: 'setSql', sql: '' }),
    runQuery,
    deleteHistoryEntry: (id) => dispatch({ type: 'deleteHistoryEntry', id }),
    clearHistory: () => dispatch({ type: 'clearHistory' }),
    setPrimeSuspect: (name) => dispatch({ type: 'setPrimeSuspect', name }),
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

  const objectives = useMemo(() => evaluateObjectives(state.discovery), [state.discovery]);
  const tally = useMemo(() => objectiveTally(objectives), [objectives]);
  const ledger = useMemo(
    () => summariseInvestigation(state.discovery, { suspects: briefing.suspects.length, evidence: briefing.evidence.length }),
    [state.discovery, briefing.suspects.length, briefing.evidence.length],
  );

  const data = useMemo(() => ({
    result: state.result,
    history: state.history,
    primeSuspect: state.primeSuspect,
    notes: state.notes,
    evidenceNotes: state.evidenceNotes,
    bookmarks: state.bookmarks,
    leadsDone: state.leadsDone,
    notebookSection: state.notebookSection,
    boardFolder: state.boardFolder,
    expanded: state.expanded,
    scrollPositions: state.scrollPositions,
    discovery: state.discovery,
    objectives,
    tally,
    ledger,
    starterSql,
  }), [
    state.result, state.history, state.primeSuspect, state.notes, state.evidenceNotes,
    state.bookmarks, state.leadsDone, state.notebookSection, state.boardFolder,
    state.expanded, state.scrollPositions, state.discovery, objectives, tally, ledger, starterSql,
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
