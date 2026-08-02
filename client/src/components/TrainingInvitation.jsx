import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, PlayCircle } from 'lucide-react';
import { getCaseRoutePath } from '../catalog/caseCatalog';
import { markTrainingComplete } from '../utils/tutorialProgress';

/**
 * The festival welcome.
 *
 * Personal Mode can assume the person at the keyboard is the same one as last
 * time, so it runs training once and never asks again. A festival machine
 * cannot assume that at all — the next detective is a different human being
 * who may never have seen a SELECT statement, or may have queued twice. So it
 * asks, once per detective session, and the answer dies with the session.
 *
 * Both answers are recorded straight away. Somebody who starts the tutorial and
 * wanders off is not trapped in this dialog forever; they can pick it up again
 * from Settings.
 */
export function TrainingInvitation() {
  const navigate = useNavigate();
  const firstRef = useRef(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => firstRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const choose = (wantsTraining) => {
    markTrainingComplete(wantsTraining ? 'chose-training' : 'skipped');
    navigate(wantsTraining ? '/training' : getCaseRoutePath('beginner', 'case'), { replace: true });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Have you played SQL Detective before?"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/97 px-6 py-12 backdrop-blur-xl"
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 board-grid-fine opacity-30" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 vignette" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-3xl"
      >
        <p className="text-center font-mono text-sm uppercase tracking-[0.3em] text-crimson-glow">Welcome, Detective</p>
        <h1 className="mt-5 text-center typo-heading text-3xl leading-tight text-bone sm:text-5xl">
          Have you played SQL Detective before?
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-center typo-body text-base text-bone-muted">
          Training takes about three minutes and teaches the whole loop. You can leave it at any point.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <button
            ref={firstRef}
            type="button"
            onClick={() => choose(true)}
            className="clip-corner group flex flex-col p-7 text-left panel-surface shadow-panel transition-colors duration-200 hover:border-gold/45"
          >
            <GraduationCap size={30} className="text-gold-bright" strokeWidth={1.8} aria-hidden="true" />
            <h2 className="mt-5 font-display text-2xl font-medium uppercase leading-tight text-bone">Detective Training</h2>
            <p className="mt-1.5 font-mono text-xs uppercase tracking-[0.16em] text-crimson-glow">First time here</p>
            <p className="mt-4 flex-1 typo-body text-base text-bone-muted">
              A short training file that teaches you to question a database, one step at a time. No SQL needed to start.
            </p>
            <span className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 font-display text-sm font-medium uppercase tracking-[0.16em] text-bone transition-colors group-hover:text-gold-bright">
              Begin training <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => choose(false)}
            className="clip-corner group flex flex-col p-7 text-left panel-surface shadow-panel transition-colors duration-200 hover:border-gold/45"
          >
            <PlayCircle size={30} className="text-bone-muted" strokeWidth={1.8} aria-hidden="true" />
            <h2 className="mt-5 font-display text-2xl font-medium uppercase leading-tight text-bone">Skip Training</h2>
            <p className="mt-1.5 font-mono text-xs uppercase tracking-[0.16em] text-bone-dim">I have played before</p>
            <p className="mt-4 flex-1 typo-body text-base text-bone-muted">
              Straight to Case 01. Training is still there in Settings if you change your mind.
            </p>
            <span className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 font-display text-sm font-medium uppercase tracking-[0.16em] text-bone transition-colors group-hover:text-gold-bright">
              Start Case 01 <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
