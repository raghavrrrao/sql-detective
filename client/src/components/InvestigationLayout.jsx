import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { AnimatedBackground } from './AnimatedBackground';
import { HeaderBar } from './HeaderBar';
import { InventoryPanel } from './InventoryPanel';
import { NotebookModal } from './NotebookModal';
import { QueryResultsTable } from './QueryResultsTable';
import { Sidebar } from './Sidebar';
import { SQLEditor, defaultQuery } from './SQLEditor';
import { SuspectPanel } from './SuspectPanel';
import { executeCaseQuery } from '../services/caseService';
import { recordQueryRun } from '../utils/caseProgress';

const emptyQueryState = { columns: [], rows: [], executionTime: null, rowCount: 0, isLoading: false, error: null };

export function InvestigationLayout({ caseData, briefing, difficulty }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState(briefing.notebook[0]?.id ?? 'evidence');
  const [sql, setSql] = useState(defaultQuery);
  const [queryState, setQueryState] = useState(emptyQueryState);
  const editorRef = useRef(null);
  // Monaco captures its command callback once, so route through a ref to
  // avoid running a stale copy of the query.
  const runQueryRef = useRef(null);

  const leads = briefing.notebook.find((section) => section.id === 'notes')?.entries ?? [];

  const runQuery = useCallback(async () => {
    setQueryState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const result = await executeCaseQuery(difficulty, sql);
      setQueryState({ ...result, isLoading: false, error: null });
      recordQueryRun(difficulty);
    } catch (error) {
      setQueryState((current) => ({ ...current, isLoading: false, error: error.message }));
    }
  }, [difficulty, sql]);

  runQueryRef.current = runQuery;

  // Loads a starter query for a suspect instead of revealing their file for free.
  const inspectSuspect = useCallback((suspect) => {
    const statement = `SELECT * FROM suspects WHERE name = '${suspect.name.replace(/'/g, "''")}';`;
    setSql(statement);
    editorRef.current?.focus();
  }, []);

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    // Ctrl/Cmd + Enter runs the query, as a terminal should.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runQueryRef.current?.());
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden text-bone">
      <AnimatedBackground variant="board" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <HeaderBar
          caseData={caseData}
          difficulty={difficulty}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenNotebook={() => setIsNotebookOpen(true)}
        />

        <div className="relative flex min-h-0 flex-1">
          <Sidebar
            sections={briefing.notebook}
            evidence={briefing.evidence}
            activeFolder={activeFolder}
            onSelectFolder={setActiveFolder}
            isDrawerOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {isSidebarOpen && (
            <button
              type="button"
              aria-label="Close case board"
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm xl:hidden"
            />
          )}

          <main className="grid min-w-0 flex-1 gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="grid min-w-0 content-start gap-5"
            >
              <SQLEditor
                sql={sql}
                onSqlChange={setSql}
                onRun={runQuery}
                onReset={() => setSql(defaultQuery)}
                onClear={() => setSql('')}
                canReset={sql !== defaultQuery}
                isRunning={queryState.isLoading}
                onEditorMount={handleEditorMount}
              />
              <QueryResultsTable {...queryState} />
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="grid content-start gap-5"
            >
              <SuspectPanel suspects={briefing.suspects} onInspectSuspect={inspectSuspect} />
              <InventoryPanel items={briefing.inventory} />
            </motion.aside>
          </main>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsNotebookOpen(true)}
        className="clip-corner-sm fixed bottom-6 right-6 z-20 inline-flex items-center gap-2.5 border border-crimson-bright/60 bg-crimson px-5 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-crimson transition-transform hover:-translate-y-0.5"
      >
        <BookOpen size={17} strokeWidth={2.2} /> Notebook
      </button>

      <NotebookModal isOpen={isNotebookOpen} onClose={() => setIsNotebookOpen(false)} leads={leads} />
    </div>
  );
}
