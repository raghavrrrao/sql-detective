import { useCallback, useEffect, useRef } from 'react';
import { BookOpen, ClipboardCheck, Clock, FileText, History, NotebookPen, ScrollText, Telescope, UsersRound } from 'lucide-react';
import { ReusableModal } from './ReusableModal';
import { NotebookDiscoveries } from './notebook/NotebookDiscoveries';
import { NotebookEvidenceNotes } from './notebook/NotebookEvidenceNotes';
import { NotebookJournal } from './notebook/NotebookJournal';
import { NotebookObjectives } from './notebook/NotebookObjectives';
import { NotebookOverview } from './notebook/NotebookOverview';
import { NotebookPersonalNotes } from './notebook/NotebookPersonalNotes';
import { NotebookQueryHistory } from './notebook/NotebookQueryHistory';
import { NotebookSuspects } from './notebook/NotebookSuspects';
import { NotebookTimeline } from './notebook/NotebookTimeline';
import { useInvestigationSession } from '../state/investigationSession';

const sections = [
  { id: 'overview', label: 'Overview', icon: ScrollText },
  { id: 'objectives', label: 'Objectives', icon: ClipboardCheck },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'discoveries', label: 'Discoveries', icon: Telescope },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'suspects', label: 'Suspects', icon: UsersRound },
  { id: 'evidence', label: 'Case file', icon: FileText },
  { id: 'history', label: 'History', icon: History },
  { id: 'notes', label: 'Notes', icon: NotebookPen },
];

export const notebookSections = sections;

/**
 * The detective notebook: the player's companion across the whole case. Which
 * section is open, how far each one was scrolled, which panels were expanded
 * and everything typed into it all survive a refresh.
 */
export function NotebookModal({ isOpen, onClose, caseData, caseFacts, briefing, leads = [] }) {
  const {
    notebookSection, setNotebookSection, scrollPositions, rememberScroll,
    tally, discoveries, timeline, journal,
  } = useInvestigationSession();

  const bodyRef = useRef(null);
  // Scroll offset is tracked in a ref and only committed when the section
  // changes or the notebook closes — dispatching per scroll frame would
  // re-render every section on the way past.
  const offsetRef = useRef(0);
  const sectionRef = useRef(notebookSection);
  sectionRef.current = notebookSection;

  const active = sections.find((section) => section.id === notebookSection) ?? sections[0];

  const counts = {
    objectives: `${tally.done}/${tally.total}`,
    discoveries: discoveries.length || null,
    timeline: timeline.length || null,
    journal: journal.length || null,
  };

  const commitScroll = useCallback(() => {
    rememberScroll(sectionRef.current, offsetRef.current);
  }, [rememberScroll]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const node = bodyRef.current;
    if (!node) return undefined;
    const onScroll = () => { offsetRef.current = node.scrollTop; };
    node.addEventListener('scroll', onScroll, { passive: true });
    return () => node.removeEventListener('scroll', onScroll);
  }, [isOpen]);

  // Restore where this section was left, once the panel has rendered.
  useEffect(() => {
    if (!isOpen) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const node = bodyRef.current;
      if (!node) return;
      const offset = scrollPositions[active.id] ?? 0;
      node.scrollTop = offset;
      offsetRef.current = offset;
    });
    return () => window.cancelAnimationFrame(frame);
    // scrollPositions is intentionally excluded: it is a restore source, not a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, active.id]);

  const selectSection = useCallback((id) => {
    commitScroll();
    setNotebookSection(id);
  }, [commitScroll, setNotebookSection]);

  const handleClose = useCallback(() => {
    commitScroll();
    onClose();
  }, [commitScroll, onClose]);

  // Arrow keys move along the tab strip, as a tablist should.
  const handleTabKeys = useCallback((event) => {
    const offsets = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
    const move = offsets[event.key];
    if (move === undefined) return;
    event.preventDefault();
    const index = sections.findIndex((section) => section.id === sectionRef.current);
    const nextIndex = move === 'first' ? 0
      : move === 'last' ? sections.length - 1
        : (index + move + sections.length) % sections.length;
    selectSection(sections[nextIndex].id);
    event.currentTarget.querySelector(`#notebook-tab-${sections[nextIndex].id}`)?.focus();
  }, [selectSection]);

  return (
    <ReusableModal isOpen={isOpen} onClose={handleClose} title="Detective notebook" icon={BookOpen} size="lg" bodyRef={bodyRef}>
      <div
        role="tablist"
        aria-label="Notebook sections"
        onKeyDown={handleTabKeys}
        className="-mt-1 mb-6 flex flex-wrap gap-1.5"
      >
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === active.id;
          const count = counts[section.id];
          return (
            <button
              key={section.id}
              id={`notebook-tab-${section.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`notebook-panel-${section.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectSection(section.id)}
              className={`clip-corner-sm inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                isActive
                  ? 'border-gold/55 bg-gold/12 text-gold-bright'
                  : 'border-white/10 bg-white/[0.03] text-bone-dim hover:border-white/25 hover:text-bone'
              }`}
            >
              <Icon size={13} strokeWidth={2.2} aria-hidden="true" /> {section.label}
              {count && <span className="font-mono text-xs text-bone-muted">{count}</span>}
            </button>
          );
        })}
      </div>

      <div id={`notebook-panel-${active.id}`} role="tabpanel" aria-labelledby={`notebook-tab-${active.id}`} tabIndex={-1} className="outline-none">
        {active.id === 'overview' && <NotebookOverview caseData={caseData} caseFacts={caseFacts} />}
        {active.id === 'objectives' && <NotebookObjectives leads={leads} />}
        {active.id === 'journal' && <NotebookJournal />}
        {active.id === 'discoveries' && <NotebookDiscoveries />}
        {active.id === 'timeline' && <NotebookTimeline />}
        {active.id === 'suspects' && <NotebookSuspects />}
        {active.id === 'evidence' && <NotebookEvidenceNotes evidence={briefing.evidence} />}
        {active.id === 'history' && <NotebookQueryHistory onClose={handleClose} />}
        {active.id === 'notes' && <NotebookPersonalNotes />}
      </div>
    </ReusableModal>
  );
}
