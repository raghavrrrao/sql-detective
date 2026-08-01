import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clock, Gavel, MapPin, Search, UserRound } from 'lucide-react';
import { ReusableModal } from './ReusableModal';
import { useDebouncedField } from '../hooks/useDebouncedField';
import { NOT_PROVEN_MESSAGE } from '../utils/accusation';
import { useInvestigationSession } from '../state/investigationSession';

const steps = [
  { id: 'suspect', label: 'Name the accused' },
  { id: 'evidence', label: 'Cite your evidence' },
  { id: 'reasoning', label: 'State your case' },
];

function StepRail({ current }) {
  const index = steps.findIndex((step) => step.id === current);
  return (
    <ol className="mb-6 flex flex-wrap gap-2" aria-label="Accusation steps">
      {steps.map((step, position) => {
        const state = position < index ? 'done' : position === index ? 'active' : 'todo';
        return (
          <li
            key={step.id}
            aria-current={state === 'active' ? 'step' : undefined}
            className={`clip-corner-sm flex items-center gap-2 border px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] ${
              state === 'active'
                ? 'border-gold/55 bg-gold/12 text-gold-bright'
                : state === 'done'
                  ? 'border-verdict-clear/40 bg-verdict-clear/10 text-verdict-clear'
                  : 'border-white/10 bg-white/[0.03] text-bone-dim'
            }`}
          >
            {state === 'done' ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : <span aria-hidden="true">{position + 1}</span>}
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The formal accusation.
 *
 * Only people already encountered can be named, and only records already
 * recovered can be cited — the workflow cannot show the player anything the
 * investigation has not already turned up.
 */
export function AccuseModal({ isOpen, onClose, onProven }) {
  const { intel, discoveries, primeSuspect, reasoning, setReasoning, submitAccusation } = useInvestigationSession();

  const [step, setStep] = useState('suspect');
  const [suspect, setSuspect] = useState(primeSuspect ?? null);
  const [cited, setCited] = useState(() => new Set());
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notProven, setNotProven] = useState(false);

  const [draft, setDraft, flushDraft] = useDebouncedField(reasoning, setReasoning);

  // Opening the workflow starts it at the top, seeded with whoever the player
  // has been building a case against.
  useEffect(() => {
    if (!isOpen) return;
    setStep('suspect');
    setNotProven(false);
    setIsSubmitting(false);
    setSuspect((current) => current ?? primeSuspect ?? null);
  }, [isOpen, primeSuspect]);

  // A person can only be accused once they have turned up in the investigation.
  const encountered = useMemo(() => intel.filter((profile) => profile.status !== 'unknown'), [intel]);

  const visibleEvidence = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term === '') return discoveries;
    return discoveries.filter((record) =>
      `${record.title} ${record.table} ${record.location ?? ''} ${record.suspects.join(' ')}`.toLowerCase().includes(term));
  }, [discoveries, search]);

  const toggleCited = useCallback((key) => {
    setCited((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setStep('suspect');
    setCited(new Set());
    setSearch('');
    setNotProven(false);
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    flushDraft();
    reset();
    onClose();
  }, [flushDraft, reset, onClose]);

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);
    flushDraft();
    const { proven } = await submitAccusation({ suspect, evidenceKeys: [...cited], reasoning: draft });
    setIsSubmitting(false);
    if (proven) {
      reset();
      onClose();
      onProven();
      return;
    }
    setNotProven(true);
  }, [submitAccusation, suspect, cited, draft, flushDraft, reset, onClose, onProven]);

  const isConfirming = step === 'confirm';

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={handleClose}
      title={notProven ? 'Verdict' : 'Formal accusation'}
      icon={Gavel}
      size="full"
      // The confirmation has to be answered, not dismissed.
      dismissible={!isConfirming && !isSubmitting}
    >
      {notProven ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[24rem] flex-col items-center justify-center gap-5 px-6 text-center"
          role="alert"
        >
          <AlertTriangle size={40} className="text-verdict-watch" strokeWidth={1.8} aria-hidden="true" />
          <h3 className="font-display text-3xl font-medium uppercase tracking-[0.14em] text-bone">Case not proven</h3>
          <p className="max-w-xl text-lg leading-8 text-bone-muted">{NOT_PROVEN_MESSAGE}</p>
          <button
            type="button"
            onClick={handleClose}
            className="clip-corner-sm border border-white/12 bg-white/[0.04] px-6 py-3 font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone transition-colors hover:border-gold/45 hover:text-gold-bright"
          >
            Return to the investigation
          </button>
        </motion.div>
      ) : isConfirming ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex min-h-[24rem] flex-col items-center justify-center gap-5 px-6 text-center"
        >
          <Gavel size={40} className="text-crimson-glow" strokeWidth={1.8} aria-hidden="true" />
          <h3 className="font-display text-3xl font-medium uppercase tracking-[0.14em] text-bone">
            You are about to formally accuse
          </h3>
          <p className="font-display text-4xl font-medium uppercase tracking-wide text-crimson-glow">{suspect}</p>
          <p className="max-w-xl text-lg leading-8 text-bone-muted">
            This decision cannot be changed until this investigation ends.
          </p>
          <p className="text-sm text-bone-dim">
            {cited.size} {cited.size === 1 ? 'record' : 'records'} cited in support
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setStep('reasoning')}
              disabled={isSubmitting}
              className="clip-corner-sm border border-white/12 bg-white/[0.04] px-6 py-3 font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone transition-colors hover:border-white/30 disabled:cursor-not-allowed disabled:text-bone-dim"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="clip-corner-sm border border-crimson-bright/60 bg-crimson px-6 py-3 font-display text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-crimson transition-colors hover:bg-crimson-bright disabled:cursor-wait disabled:bg-charcoal-light disabled:text-bone-dim disabled:shadow-none"
            >
              {isSubmitting ? 'Filing…' : 'Confirm accusation'}
            </button>
          </div>
        </motion.div>
      ) : (
        <div>
          <StepRail current={step} />

          {step === 'suspect' && (
            <fieldset>
              <legend className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">Who are you accusing?</legend>
              <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">
                Only people your investigation has actually turned up can be named.
              </p>

              {encountered.length === 0 ? (
                <p className="py-10 text-base text-bone-muted">You have not encountered anyone in the records yet.</p>
              ) : (
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {encountered.map((profile) => (
                    <label
                      key={profile.name}
                      className={`clip-corner-sm flex cursor-pointer items-center gap-3.5 border p-4 transition-colors ${
                        suspect === profile.name
                          ? 'border-crimson-bright/60 bg-crimson/12'
                          : 'border-white/10 bg-white/[0.035] hover:border-gold/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="accused-suspect"
                        value={profile.name}
                        checked={suspect === profile.name}
                        onChange={() => setSuspect(profile.name)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`clip-corner-sm flex h-11 w-11 shrink-0 items-center justify-center border ${
                          suspect === profile.name ? 'border-crimson-bright bg-crimson/25 text-crimson-glow' : 'border-white/15 bg-white/[0.04] text-bone-dim'
                        }`}
                      >
                        <UserRound size={20} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold text-bone">{profile.name}</span>
                        <span className="block truncate text-sm text-bone-muted">{profile.occupation}</span>
                        <span className="mt-1 block font-mono text-xs text-bone-dim">
                          {profile.recordCount} {profile.recordCount === 1 ? 'record' : 'records'} on file
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {step === 'evidence' && (
            <fieldset>
              <legend className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">Cite your evidence</legend>
              <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">
                Pick the records that support the accusation. A case reads more strongly the more independent records stand behind it.
              </p>

              <label className="relative mt-4 block">
                <span className="sr-only">Search your discoveries</span>
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-dim" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search the records you have recovered..."
                  className="clip-corner-sm w-full border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-base text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
                />
              </label>

              <p className="mt-3 text-sm text-bone-dim" role="status" aria-live="polite">
                {cited.size} of {discoveries.length} records cited
              </p>

              <div className="mt-3 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                {visibleEvidence.map((record) => {
                  const isCited = cited.has(record.key);
                  return (
                    <label
                      key={record.key}
                      className={`clip-corner-sm flex cursor-pointer items-start gap-3 border p-3.5 transition-colors ${
                        isCited ? 'border-gold/50 bg-gold/[0.08]' : 'border-white/10 bg-white/[0.035] hover:border-white/25'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isCited}
                        onChange={() => toggleCited(record.key)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`clip-corner-sm mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
                          isCited ? 'border-gold-bright bg-gold/25 text-gold-bright' : 'border-white/25 text-transparent'
                        }`}
                      >
                        <Check size={13} strokeWidth={3} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.95rem] font-semibold leading-6 text-bone">{record.title}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 typo-body-secondary text-xs text-bone-dim">
                          <span className="clip-corner-sm border border-white/12 bg-white/[0.05] px-2 py-0.5 font-mono">
                            {record.table.replace(/_/g, ' ')}
                          </span>
                          {record.occurredAt && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock size={11} strokeWidth={2.2} aria-hidden="true" /> {record.occurredAt}
                            </span>
                          )}
                          {record.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} strokeWidth={2.2} aria-hidden="true" /> {record.location}
                            </span>
                          )}
                        </span>
                      </span>
                    </label>
                  );
                })}
                {visibleEvidence.length === 0 && (
                  <p className="py-6 text-base text-bone-dim">No recovered records match that search.</p>
                )}
              </div>
            </fieldset>
          )}

          {step === 'reasoning' && (
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">State your case</h3>
              <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">
                Set out how the records fit together. This is for the case file — it is not marked, and it is saved as you type.
              </p>
              <label className="mt-4 block">
                <span className="sr-only">Your reasoning</span>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={flushDraft}
                  placeholder={'On the night in question…\n\nThe badge log places them…\n\nNo camera accounts for…'}
                  className="clip-corner-sm min-h-[18rem] w-full resize-y border border-white/10 bg-black/40 p-4 typo-body text-base text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
                />
              </label>
            </div>
          )}

          {/* Step navigation */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={() => setStep(step === 'evidence' ? 'suspect' : 'evidence')}
              disabled={step === 'suspect'}
              className="clip-corner-sm inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-bone-muted transition-colors hover:border-white/30 hover:text-bone disabled:cursor-not-allowed disabled:text-bone-dim"
            >
              <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" /> Back
            </button>

            {step === 'reasoning' ? (
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className="clip-corner-sm inline-flex items-center gap-2 border border-crimson-bright/60 bg-crimson px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-crimson transition-colors hover:bg-crimson-bright"
              >
                <Gavel size={15} strokeWidth={2.2} aria-hidden="true" /> File the accusation
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(step === 'suspect' ? 'evidence' : 'reasoning')}
                disabled={(step === 'suspect' && !suspect) || (step === 'evidence' && cited.size === 0)}
                className="clip-corner-sm inline-flex items-center gap-2 border border-gold-bright/70 bg-gold px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:border-white/12 disabled:bg-charcoal-light disabled:text-bone-dim"
              >
                Continue <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
    </ReusableModal>
  );
}
