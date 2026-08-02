import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardCheck, FileSearch, Gavel, Gauge, Lightbulb } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { CaseTablesPanel } from '../components/CaseTablesPanel';
import { Panel } from '../components/Panel';
import { QueryResultsTable } from '../components/QueryResultsTable';
import { SQLEditor } from '../components/SQLEditor';
import { TutorialSpotlight } from '../tutorial/TutorialSpotlight';
import { GATES, trainingSteps, stepCount } from '../tutorial/trainingSteps';
import { runTrainingQuery, trainingTables } from '../tutorial/trainingCase';
import { markTrainingComplete } from '../utils/tutorialProgress';
import { getCaseRoutePath } from '../catalog/caseCatalog';

const TOTAL_ROWS = trainingTables.reduce((sum, table) => sum + table.rowCount, 0);

/** Which gate, if any, this statement satisfies. */
function gateFor(step, sql, result) {
  if (!step.requires) return null;
  const text = String(sql).toLowerCase();
  if (step.requires === GATES.ranWhere && !/\bwhere\b/.test(text)) return null;
  if (step.requires === GATES.ranOrderBy && !/\border\s+by\b/.test(text)) return null;
  if (step.requires === GATES.ranSuspects && !/\bsuspects\b/.test(text)) return null;
  return result.rowCount > 0 ? step.requires : null;
}

function TrainingObjective({ label, recovered, total }) {
  const done = recovered >= total;
  return (
    <li className="clip-corner-sm border border-white/10 bg-white/[0.035] px-3.5 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-sm font-medium ${done ? 'text-verdict-clear' : 'text-bone'}`}>{label}</span>
        <span className={`font-mono text-xs ${done ? 'text-verdict-clear' : 'text-gold-bright'}`}>{recovered} / {total}</span>
      </div>
      <div aria-hidden="true" className="mt-2 h-1 w-full overflow-hidden bg-white/10">
        <span
          className={`block h-full transition-[width] duration-500 ${done ? 'bg-verdict-clear' : 'bg-gold'}`}
          style={{ width: `${Math.round((recovered / total) * 100)}%` }}
        />
      </div>
    </li>
  );
}

/**
 * Detective Training.
 *
 * A recruit's first shift, not a manual. It is the real terminal, the real
 * results table and the real evidence-tables panel wired to a three-table
 * fictional file, with a spotlight walking through one mechanic at a time and
 * refusing to move on until the recruit has actually run the query.
 *
 * Nothing here touches a real case: no catalog entry, no case database, no
 * progression, and no request ever leaves the browser.
 */
export function DetectiveTrainingPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [sql, setSql] = useState('-- Training file · a document is missing from the records room.\nSELECT * FROM suspects;');
  const [result, setResult] = useState({ columns: [], rows: [], rowCount: 0, executionTime: null, isLoading: false, error: null, hasRun: false, summary: null });
  const [lastDiscovery, setLastDiscovery] = useState(null);
  const [gates, setGates] = useState({});
  const [recovered, setRecovered] = useState({});
  const [hintTaken, setHintTaken] = useState(false);
  const editorRef = useRef(null);

  const step = trainingSteps[index];

  const recoveredCount = useCallback((table) => (recovered[table] ?? []).length, [recovered]);
  const totalRecovered = useMemo(
    () => Object.values(recovered).reduce((sum, ids) => sum + ids.length, 0),
    [recovered],
  );
  const progress = Math.round((totalRecovered / TOTAL_ROWS) * 100);

  /** Runs the statement in the sandbox. Never leaves the browser. */
  const handleRun = useCallback(() => {
    setResult((current) => ({ ...current, isLoading: true, error: null }));
    // A frame's delay so the loading state is visible, exactly as a real query reads.
    window.setTimeout(() => {
      try {
        const outcome = runTrainingQuery(sql);
        const table = (sql.match(/from\s+([a-z_][a-z0-9_]*)/i) ?? [])[1]?.toLowerCase();
        let added = 0;

        if (table) {
          setRecovered((current) => {
            const known = new Set(current[table] ?? []);
            const before = known.size;
            // Rows are identified by id so re-running a query enriches rather
            // than inflates — the same rule the real discovery engine uses.
            outcome.rows.forEach((row) => {
              const id = row.id ?? JSON.stringify(row);
              known.add(id);
            });
            added = known.size - before;
            return { ...current, [table]: [...known] };
          });
        }

        setResult({
          ...outcome,
          isLoading: false,
          error: null,
          hasRun: true,
          summary: `Recovered ${outcome.rowCount} ${outcome.rowCount === 1 ? 'record' : 'records'} in ${outcome.executionTime} ms.`,
        });

        window.setTimeout(() => {
          setLastDiscovery(added > 0
            ? { at: Date.now(), added, openedCategories: [], completedObjectives: [], investigationDelta: 0, investigation: 0 }
            : null);
        }, 0);

        const satisfied = gateFor(step, sql, outcome);
        if (satisfied) setGates((current) => ({ ...current, [satisfied]: true }));
      } catch (error) {
        setResult((current) => ({ ...current, isLoading: false, error: error.message, hasRun: true, summary: null }));
        setLastDiscovery(null);
      }
    }, 180);
  }, [sql, step]);

  const canAdvance = !step.requires || Boolean(gates[step.requires]);

  const goTo = useCallback((next) => {
    const target = trainingSteps[next];
    if (!target) return;
    setIndex(next);
    // A step that teaches a statement loads it, so the recruit reads the query
    // before running it rather than typing from dictation.
    if (target.sql) {
      setSql(target.sql);
      window.requestAnimationFrame(() => editorRef.current?.focus());
    }
  }, []);

  const finish = useCallback((how) => {
    markTrainingComplete(how);
    navigate(getCaseRoutePath('beginner', 'case'));
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden text-bone">
      <AnimatedBackground variant="board" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex min-h-[4.5rem] flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 bg-ink/85 px-4 py-3 backdrop-blur-xl sm:px-6">
          <FileSearch size={19} className="shrink-0 text-crimson-glow" strokeWidth={2} aria-hidden="true" />
          <div className="min-w-0">
            <p className="typo-heading text-sm leading-tight text-bone sm:text-lg">Detective Training</p>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-bone-dim">Training file · the missing document</p>
          </div>
          <p className="ml-auto font-mono text-xs text-bone-dim">Step {index + 1} of {stepCount}</p>
        </header>

        <main className="grid min-w-0 flex-1 gap-4 p-3 pb-24 sm:gap-5 sm:p-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="grid min-w-0 content-start gap-4 sm:gap-5"
          >
            {/*
              `grid` rather than a plain block: Monaco sizes itself with
              height:100%, which only resolves against a parent with a definite
              height. A block wrapper here breaks that chain and collapses the
              editor to a single line — which on a tutorial that asks you to
              read the query is fatal.
            */}
            <div data-tutorial="terminal" className="grid">
              <SQLEditor
                sql={sql}
                onSqlChange={setSql}
                onRun={handleRun}
                onReset={() => setSql(step.sql ?? 'SELECT * FROM suspects;')}
                onClear={() => setSql('')}
                canReset={Boolean(step.sql) && sql !== step.sql}
                isRunning={result.isLoading}
                onEditorReady={(editor) => { editorRef.current = editor; }}
              />
            </div>

            <div data-tutorial="results">
              <QueryResultsTable {...result} lastDiscovery={lastDiscovery} />
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="grid content-start gap-4 sm:gap-5"
          >
            <div data-tutorial="tables">
              <CaseTablesPanel
                tables={trainingTables}
                onPickTable={(table) => setSql(`SELECT * FROM ${table};`)}
              />
            </div>

            <div data-tutorial="notebook">
              <Panel icon={BookOpen} title="Notebook" accent="crimson" bodyClassName="p-4" meta={<span className="font-mono">{totalRecovered}</span>}>
                {totalRecovered === 0 ? (
                  <p className="typo-body-secondary text-sm text-bone-dim">
                    Empty. It only ever holds records you recovered yourself.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {trainingTables.filter((table) => recoveredCount(table.name) > 0).map((table) => (
                      <li key={table.name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-mono text-bone-muted">{table.name.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-xs text-gold-bright">{recoveredCount(table.name)} / {table.rowCount}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <div data-tutorial="objectives">
              <Panel icon={ClipboardCheck} title="Objectives" accent="gold" bodyClassName="p-4">
                <ul className="space-y-2">
                  <TrainingObjective label="Identify everyone on file" recovered={recoveredCount('suspects')} total={3} />
                  <TrainingObjective label="Recover the door log" recovered={recoveredCount('access_logs')} total={5} />
                </ul>
              </Panel>
            </div>

            <div data-tutorial="progress">
              <Panel icon={Gauge} title="Investigation" accent="gold" bodyClassName="p-4" meta={<span className="typo-numeric font-semibold text-gold-bright">{progress}%</span>}>
                <div aria-hidden="true" className="h-1.5 w-full overflow-hidden bg-white/10">
                  <span
                    className="block h-full bg-gradient-to-r from-crimson via-gold to-gold-bright transition-[width] duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2.5 typo-body-secondary text-xs text-bone-dim">
                  Rises with evidence recovered, not with queries run.
                </p>
              </Panel>
            </div>

            <div data-tutorial="hints">
              <Panel icon={Lightbulb} title="Hints" accent="gold" bodyClassName="p-4" meta={<span className="font-mono">{hintTaken ? '1' : '0'} / 1</span>}>
                {hintTaken ? (
                  <p className="typo-document text-sm text-bone-muted">
                    Two people used a door after six. Only one of them opened the records room.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setHintTaken(true)}
                    className="clip-corner-sm inline-flex items-center gap-2 border border-gold/45 bg-gold/10 px-3 py-2 text-xs font-medium text-gold-bright transition-colors hover:bg-gold/20"
                  >
                    <Lightbulb size={14} strokeWidth={2.2} aria-hidden="true" /> Take a hint
                  </button>
                )}
              </Panel>
            </div>
          </motion.aside>
        </main>
      </div>

      <div data-tutorial="accuse" className="fixed bottom-4 right-4 z-20 flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6">
        <p className="clip-corner-sm max-w-[10.5rem] border border-white/12 bg-ink/90 px-3 py-2 text-right text-xs leading-5 text-bone-dim sm:max-w-[15rem]">
          Training files are never accused.
        </p>
        <button
          type="button"
          disabled
          className="clip-corner-sm inline-flex cursor-not-allowed items-center gap-2.5 border border-white/12 bg-charcoal-light px-4 py-3 font-display text-sm font-medium uppercase tracking-[0.16em] text-bone-dim sm:px-5 sm:py-3.5"
        >
          <Gavel size={17} strokeWidth={2.2} aria-hidden="true" /> Accuse
        </button>
      </div>

      <TutorialSpotlight
        step={step}
        index={index}
        total={stepCount}
        canAdvance={canAdvance}
        waitingFor={step.waitingFor}
        onNext={() => goTo(index + 1)}
        onPrevious={() => goTo(index - 1)}
        onSkip={() => finish('skipped')}
        onFinish={() => finish('completed')}
      />
    </div>
  );
}
