import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AccuseButton } from './AccuseButton';
import { AccuseModal } from './AccuseModal';
import { AnimatedBackground } from './AnimatedBackground';
import { CaseClosedScreen } from './CaseClosedScreen';
import { CaseDebrief } from './CaseDebrief';
import { FestivalScoreSummary } from './FestivalScoreSummary';
import { GlobalSearchModal } from './GlobalSearchModal';
import { HeaderBar } from './HeaderBar';
import { CaseTablesPanel } from './CaseTablesPanel';
import { NotebookModal } from './NotebookModal';
import { QueryResultsTable } from './QueryResultsTable';
import { Sidebar } from './Sidebar';
import { SQLEditor } from './SQLEditor';
import { SuspectPanel } from './SuspectPanel';
import {
  InvestigationSessionProvider,
  useInvestigationActions,
  useInvestigationSession,
  useSqlDraft,
} from '../state/investigationSession';
import { getCase, getStarterQuery } from '../catalog/caseCatalog';
import { getCaseReport } from '../utils/caseProgress';
import { useGameMode } from '../state/gameMode';

/**
 * The terminal is deliberately its own component: it subscribes to the editor
 * text, which changes on every keystroke, so nothing else on the board has to.
 */
function TerminalPanel({ onEditorReady }) {
  const { sql, isDirty } = useSqlDraft();
  const { setSql, resetSql, clearSql, runQuery } = useInvestigationActions();
  const { result } = useInvestigationSession();

  return (
    <SQLEditor
      sql={sql}
      onSqlChange={setSql}
      onRun={runQuery}
      onReset={resetSql}
      onClear={clearSql}
      canReset={isDirty}
      isRunning={result.isLoading}
      onEditorReady={onEditorReady}
    />
  );
}

function ResultsPanel() {
  const { result, lastDiscovery } = useInvestigationSession();
  return <QueryResultsTable {...result} lastDiscovery={lastDiscovery} />;
}

function InvestigationBoard({ caseData, briefing, difficulty }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccuseOpen, setIsAccuseOpen] = useState(false);
  const [isCaseClosedOpen, setIsCaseClosedOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const { isFestival } = useGameMode();
  const { boardFolder, setBoardFolder, setSql, runQuery, clearSql, setNotebookSection, isSolved, pauseTimer, startTimer } = useInvestigationSession();
  const navigate = useNavigate();

  const editorRef = useRef(null);
  const handleEditorReady = useCallback((editor) => { editorRef.current = editor; }, []);

  const leads = briefing.notebook.find((section) => section.id === 'notes')?.entries ?? [];
  const caseFacts = getCase(difficulty);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const openNotebook = useCallback(() => setIsNotebookOpen(true), []);
  const closeNotebook = useCallback(() => setIsNotebookOpen(false), []);
  // Search and the notebook are both modal, so one always replaces the other —
  // two stacked dialogs would mean two focus traps fighting over the keyboard.
  const openSearch = useCallback(() => {
    setIsNotebookOpen(false);
    setIsSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  // Jumping from a search result lands the player on the matching notebook tab.
  const openSection = useCallback((section) => {
    setNotebookSection(section);
    setIsSearchOpen(false);
    setIsNotebookOpen(true);
  }, [setNotebookSection]);

  const openAccuse = useCallback(() => {
    setIsNotebookOpen(false);
    setIsSearchOpen(false);
    setIsAccuseOpen(true);
  }, []);

  // A proven verdict hands straight over to the Case Closed sequence. The
  // clock is already stopped by the verdict itself; this keeps it stopped while
  // the reveal, the score and the leaderboard are on screen.
  const handleProven = useCallback(() => {
    pauseTimer();
    setIsCaseClosedOpen(true);
  }, [pauseTimer]);

  const openReport = useCallback(() => {
    setIsCaseClosedOpen(false);
    setIsReportOpen(true);
  }, []);

  // Festival play continues past the reveal into the score and the leaderboard.
  const openScore = useCallback(() => {
    setIsCaseClosedOpen(false);
    setIsReportOpen(false);
    setIsScoreOpen(true);
  }, []);

  // Writes a plain SELECT for a table the player picked from the board, so a
  // first query never requires knowing the syntax by heart.
  const pickTable = useCallback((table) => {
    setSql(`SELECT * FROM ${table};`);
    editorRef.current?.focus();
  }, [setSql]);

  // Loads a starter query for a suspect instead of revealing their file for free.
  const inspectSuspect = useCallback((suspect) => {
    setSql(`SELECT * FROM suspects WHERE name = '${suspect.name.replace(/'/g, "''")}';`);
    editorRef.current?.focus();
  }, [setSql]);

  // Board-level shortcuts. Monaco marks its own keybindings as handled, so the
  // editor's copies of these win whenever the caret is inside it.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
        return;
      }

      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) return;

      // Search is reachable from anywhere, including from inside the notebook.
      if (event.key === 'k' || event.key === 'K') {
        event.preventDefault();
        setIsSearchOpen((open) => {
          if (!open) setIsNotebookOpen(false);
          return !open;
        });
        return;
      }

      // While a dialog is open it owns the keyboard, and a text field always
      // keeps its own keystrokes — neither should reach the terminal.
      if (document.querySelector('[role="dialog"]')) return;
      if (event.target?.closest?.('input, textarea')) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        runQuery();
      } else if (event.key === 'l' || event.key === 'L') {
        event.preventDefault();
        clearSql();
        editorRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [runQuery, clearSql]);

  return (
    <div className="relative min-h-screen overflow-hidden text-bone">
      <AnimatedBackground variant="board" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <HeaderBar
          caseData={caseData}
          difficulty={difficulty}
          onOpenSidebar={openSidebar}
          onOpenNotebook={openNotebook}
          onOpenSearch={openSearch}
        />

        <div className="relative flex min-h-0 flex-1">
          <Sidebar
            sections={briefing.notebook}
            activeFolder={boardFolder}
            onSelectFolder={setBoardFolder}
            isDrawerOpen={isSidebarOpen}
            onClose={closeSidebar}
          />

          {isSidebarOpen && (
            <button
              type="button"
              aria-label="Close case board"
              onClick={closeSidebar}
              className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm xl:hidden"
            />
          )}

          <main className="grid min-w-0 flex-1 gap-4 p-3 pb-24 sm:gap-5 sm:p-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="grid min-w-0 content-start gap-5"
            >
              <TerminalPanel onEditorReady={handleEditorReady} />
              <ResultsPanel />
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="grid content-start gap-5"
            >
              <SuspectPanel onInspectSuspect={inspectSuspect} />
              <CaseTablesPanel tables={briefing.tables ?? []} onPickTable={pickTable} />
            </motion.aside>
          </main>
        </div>
      </div>

      <button
        type="button"
        onClick={openNotebook}
        className="clip-corner-sm fixed bottom-4 left-4 z-20 inline-flex items-center gap-2.5 border border-crimson-bright/60 bg-crimson px-4 py-3 font-display text-sm font-medium uppercase tracking-[0.16em] text-bone shadow-crimson transition-transform hover:-translate-y-0.5 sm:bottom-6 sm:left-6 sm:px-5 sm:py-3.5 xl:left-auto xl:right-[13rem]"
      >
        <BookOpen size={17} strokeWidth={2.2} aria-hidden="true" /> Notebook
      </button>

      {isSolved ? (
        /*
         * Reopens the verdict screen rather than jumping straight to the
         * report, because that screen is the only route to the score summary —
         * and in Festival Mode the score summary is what files the leaderboard
         * entry. Going directly to the report would strand a player who had
         * dismissed the verdict screen before taking their score.
         */
        <button
          type="button"
          onClick={() => setIsCaseClosedOpen(true)}
          className="clip-corner-sm fixed bottom-4 right-4 z-20 inline-flex items-center gap-2.5 border border-verdict-clear/60 bg-verdict-clear/15 px-4 py-3 font-display text-sm font-medium uppercase tracking-[0.16em] text-verdict-clear transition-transform hover:-translate-y-0.5 sm:bottom-6 sm:right-6 sm:px-5 sm:py-3.5"
        >
          Case closed
        </button>
      ) : (
        <AccuseButton onOpen={openAccuse} />
      )}

      <AccuseModal
        isOpen={isAccuseOpen}
        onClose={() => setIsAccuseOpen(false)}
        onProven={handleProven}
      />

      <CaseClosedScreen
        isOpen={isCaseClosedOpen}
        caseData={caseData}
        onOpenReport={openReport}
        onContinue={isFestival ? openScore : null}
        onLeave={() => { setIsCaseClosedOpen(false); navigate(isFestival ? '/' : '/difficulty'); }}
        onClose={() => setIsCaseClosedOpen(false)}
      />

      {isFestival && (
        <FestivalScoreSummary
          isOpen={isScoreOpen}
          caseData={caseData}
          difficulty={difficulty}
          onOpenReport={() => setIsReportOpen(true)}
          onNextDetective={() => { setIsScoreOpen(false); navigate('/'); }}
          onClose={() => setIsScoreOpen(false)}
        />
      )}

      <CaseDebrief
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={getCaseReport(difficulty)}
      />

      <NotebookModal
        isOpen={isNotebookOpen}
        onClose={closeNotebook}
        caseData={caseData}
        caseFacts={caseFacts}
        briefing={briefing}
        difficulty={difficulty}
        leads={leads}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        briefing={briefing}
        onOpenSection={openSection}
      />
    </div>
  );
}

export function InvestigationLayout({ caseData, briefing, difficulty }) {
  return (
    <InvestigationSessionProvider
      key={difficulty}
      difficulty={difficulty}
      briefing={briefing}
      starterSql={getStarterQuery(difficulty)}
    >
      <InvestigationBoard caseData={caseData} briefing={briefing} difficulty={difficulty} />
    </InvestigationSessionProvider>
  );
}
