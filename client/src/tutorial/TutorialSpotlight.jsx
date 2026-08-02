import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Fingerprint, SkipForward } from 'lucide-react';

/**
 * The training spotlight.
 *
 * Everything except one component is dimmed and made unclickable, and a dossier
 * card explains that one thing. The dimming is four panels laid around the
 * highlighted rectangle rather than a mask, because the gap between them is a
 * genuine hole: clicks pass straight through to the real control underneath, so
 * the recruit operates the actual editor rather than a mock of it.
 *
 * No coordinate is ever hardcoded. Each step names a `data-tutorial` attribute,
 * the element is measured where the layout actually put it, and the measurement
 * is redone on resize, scroll and any change to the element's own box.
 *
 * The card has two genuinely different layouts rather than one that shrinks:
 *
 *   Desktop (>= 1024px) floats it beside the highlight, as it always has.
 *   Below that it becomes a bottom sheet — full width, docked, capped height,
 *   its own scroll, and its controls pinned inside it. A floating side panel
 *   squeezed onto a phone is how you get a two-word-per-line column and a
 *   Continue button under the fold.
 */

const PAD = 8;
/** Below this the card is a sheet, not a floating panel. */
const SHEET_BREAKPOINT = 1024;

function useIsCompact() {
  const [compact, setCompact] = useState(
    () => (typeof window === 'undefined' ? false : window.innerWidth < SHEET_BREAKPOINT),
  );
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${SHEET_BREAKPOINT - 1}px)`);
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return compact;
}

function useAnchorRect(anchorName, stepIndex, isCompact) {
  const [rect, setRect] = useState(null);

  const measure = useCallback(() => {
    if (!anchorName) { setRect(null); return; }
    const node = document.querySelector(`[data-tutorial="${anchorName}"]`);
    if (!node) { setRect(null); return; }
    const box = node.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) { setRect(null); return; }
    setRect({
      top: Math.max(0, box.top - PAD),
      left: Math.max(0, box.left - PAD),
      width: box.width + PAD * 2,
      height: box.height + PAD * 2,
      bottom: box.bottom + PAD,
      right: box.right + PAD,
    });
  }, [anchorName]);

  useLayoutEffect(() => {
    if (!anchorName) { setRect(null); return undefined; }
    const node = document.querySelector(`[data-tutorial="${anchorName}"]`);

    /*
     * Where the highlight should sit depends on where the card will be. On a
     * phone the sheet owns the bottom half, so centring the anchor in the
     * viewport would park it behind the card; it is aimed at the middle of the
     * free space above the sheet instead. On desktop the card is beside the
     * highlight, so plain centring is right.
     */
    if (node) {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (isCompact) {
        window.requestAnimationFrame(() => {
          const box = node.getBoundingClientRect();
          // Measure the sheet itself rather than assume a fraction of the
          // viewport: the card's height varies with its copy, and on a short
          // screen the difference is the whole margin of error.
          const sheet = document.querySelector('[role="dialog"][aria-label^="Detective training"] section');
          const limit = sheet ? sheet.getBoundingClientRect().top : window.innerHeight * 0.52;

          // The spotlight ring sits PAD outside the element on every side, so
          // it is the ring — not the element — that has to clear the sheet.
          const ringHeight = box.height + PAD * 2;
          const floor = PAD + 4;
          const highest = Math.max(floor, limit - 10 - PAD - box.height);
          const centred = (limit - ringHeight) / 2 + PAD;
          const wanted = Math.min(Math.max(floor, centred), highest);

          const drift = box.top - wanted;
          if (Math.abs(drift) > 6) window.scrollBy({ top: drift, behavior: 'smooth' });
        });
      }
    }

    const frame = window.requestAnimationFrame(measure);
    const settle = window.setTimeout(measure, 420);

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (node && observer) observer.observe(node);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchorName, stepIndex, isCompact, measure]);

  return rect;
}

/**
 * Where the floating desktop card goes. Returns styles for a *wrapper*, never
 * for the animated element itself — Framer Motion writes `transform` inline to
 * animate the card, which silently overrides any CSS translate used for
 * centring. That is what previously left the card hanging off the right edge
 * at every width: `left-1/2` applied, `-translate-x-1/2` did not.
 */
function floatPosition(rect, cardWidth) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bounded = { maxHeight: `${Math.max(240, vh - 32)}px` };

  if (!rect) {
    return { left: Math.round((vw - cardWidth) / 2), top: Math.round(vh * 0.5 - 150), width: cardWidth, ...bounded };
  }

  const top = Math.min(Math.max(16, rect.top), Math.max(16, vh - 300));
  if (vw - rect.right > cardWidth + 24) return { left: rect.right + 20, top, width: cardWidth, ...bounded };
  if (rect.left > cardWidth + 24) return { left: rect.left - cardWidth - 20, top, width: cardWidth, ...bounded };

  const clampedLeft = Math.min(Math.max(16, rect.left), vw - cardWidth - 16);
  return vh - rect.bottom > 300
    ? { left: clampedLeft, top: rect.bottom + 16, width: cardWidth, ...bounded }
    : { left: clampedLeft, top: Math.max(16, rect.top - 316), width: cardWidth, ...bounded };
}

export function TutorialSpotlight({
  step, index, total, canAdvance, waitingFor,
  onNext, onPrevious, onSkip, onFinish,
}) {
  const isCompact = useIsCompact();
  const rect = useAnchorRect(step.anchor, index, isCompact);
  const cardRef = useRef(null);
  const isLast = index === total - 1;

  /*
   * Focus moves to the card as each step mounts, via a callback ref rather
   * than an effect: AnimatePresence runs in `wait` mode, so at the moment the
   * step index changes the new card does not exist yet and an effect would
   * focus nothing at all.
   */
  const focusedFor = useRef(null);
  const setCardRef = useCallback((node) => {
    cardRef.current = node;
    if (node && focusedFor.current !== step.id) {
      focusedFor.current = step.id;
      node.focus({ preventScroll: true });
    }
  }, [step.id]);

  const handleKeyDown = useCallback((event) => {
    // The recruit is expected to click into the terminal, so focus does not
    // stay on the card. Arrow keys belong to whatever they are editing.
    if (event.target?.closest?.('input, textarea, .monaco-editor, [contenteditable="true"]')) return;
    if (event.key === 'Escape') { event.preventDefault(); onSkip(); return; }
    if (event.key === 'ArrowLeft') { event.preventDefault(); if (index > 0) onPrevious(); return; }
    if (event.key === 'ArrowRight' || event.key === 'Enter') {
      // Enter must not fire twice when the focus is already on a button.
      if (event.key === 'Enter' && event.target.tagName === 'BUTTON') return;
      event.preventDefault();
      if (!canAdvance) return;
      (isLast ? onFinish : onNext)();
    }
  }, [index, canAdvance, isLast, onNext, onPrevious, onSkip, onFinish]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // `pointer-events-auto` is what makes the dimmed area block interaction
  // while the un-covered gap stays live.
  const dim = 'pointer-events-auto fixed bg-ink/85 backdrop-blur-[2px]';
  const cardWidth = typeof window === 'undefined' ? 400 : Math.min(400, window.innerWidth - 32);
  const wrapperStyle = isCompact ? undefined : floatPosition(rect, cardWidth);

  const skipButton = (
    <button
      type="button"
      onClick={onSkip}
      data-tutorial-control="skip"
      className="clip-corner-sm inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border border-bone/15 bg-bone/[0.05] px-2.5 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-bone-dim transition-colors hover:border-gold/45 hover:text-gold-bright"
    >
      <SkipForward size={13} strokeWidth={2.2} aria-hidden="true" /> Skip
    </button>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detective training, step ${index + 1} of ${total}`}
      /* The container must not capture anything: the gap between the dim
         panels below is the hole, and a full-screen catcher would close it. */
      className="pointer-events-none fixed inset-0 z-[80]"
    >
      {/* Four panels around the highlight. The gap between them is the hole —
          it has no element in it, so the real control stays clickable. */}
      {rect ? (
        <>
          <div className={dim} style={{ top: 0, left: 0, right: 0, height: rect.top }} />
          <div className={dim} style={{ top: rect.bottom, left: 0, right: 0, bottom: 0 }} />
          <div className={dim} style={{ top: rect.top, left: 0, width: rect.left, height: rect.height }} />
          <div className={dim} style={{ top: rect.top, left: rect.right, right: 0, height: rect.height }} />

          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none fixed border-2 border-gold-bright/80 shadow-[0_0_0_1px_rgba(217,180,95,0.25),0_0_40px_rgba(217,180,95,0.18)]"
            style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          >
            <span className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-gold-bright" />
            <span className="absolute -right-px -top-px h-3 w-3 border-r-2 border-t-2 border-gold-bright" />
            <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-gold-bright" />
            <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-gold-bright" />
            <span className="absolute inset-0 animate-pulse border border-gold/30" />
          </motion.div>
        </>
      ) : (
        <div className={`${dim} inset-0`} />
      )}

      {/* On desktop Skip floats clear of the card. On a sheet it belongs in the
          card's own header, where every other control for this step lives. */}
      {!isCompact && (
        <div className="pointer-events-auto fixed right-6 top-6 z-10">{skipButton}</div>
      )}

      {/*
        The wrapper owns placement; the animated card inside owns transform.
        Keeping those separate is the whole fix — Motion cannot clobber a
        translate it does not control.
      */}
      <div
        className={`pointer-events-auto fixed z-10 ${isCompact ? 'inset-x-0 bottom-0' : ''}`}
        style={wrapperStyle}
      >
        <AnimatePresence mode="wait">
          <motion.section
            key={step.id}
            ref={setCardRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: isCompact ? 24 : 14, scale: isCompact ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isCompact ? 16 : -8, scale: isCompact ? 1 : 0.99 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            aria-live="polite"
            className={`dossier-surface relative flex w-full flex-col outline-none ${
              isCompact
                ? 'max-h-[48dvh] rounded-t-2xl border-t border-gold/30 shadow-[0_-18px_44px_-20px_rgba(0,0,0,0.9)]'
                : 'clip-corner max-h-[inherit] shadow-panel'
            }`}
            style={isCompact
              ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)', maxHeight: 'min(48dvh, 26rem)' }
              : undefined}
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 paper-texture opacity-[0.05]" />

            {/* Header — never scrolls away. */}
            <div className={`relative flex shrink-0 items-center gap-2.5 ${isCompact ? 'px-4 pb-2 pt-4' : 'px-6 pb-2 pt-6'}`}>
              {isCompact && (
                <span aria-hidden="true" className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-bone/20" />
              )}
              <Fingerprint size={15} className="shrink-0 text-crimson-glow" strokeWidth={2.2} aria-hidden="true" />
              <p className="min-w-0 truncate font-mono text-xs uppercase tracking-[0.22em] text-crimson-glow">{step.eyebrow}</p>
              <p className="ml-auto shrink-0 font-mono text-xs text-bone-dim">{index + 1} / {total}</p>
              {isCompact && skipButton}
            </div>

            {/* Body — the only part allowed to scroll. */}
            <div className={`relative min-h-0 flex-1 overflow-y-auto ${isCompact ? 'px-4' : 'px-6'}`}>
              <h2 className="typo-heading text-[1.3rem] leading-tight text-bone sm:text-2xl lg:text-[1.75rem]">
                {step.title}
              </h2>

              <div className="mt-2.5 space-y-1.5">
                {step.lines.map((line) => (
                  <p key={line} className="typo-document text-[0.95rem] leading-relaxed text-bone-muted">{line}</p>
                ))}
              </div>

              {step.checklist && (
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-bone/10 pt-4">
                  {step.checklist.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-bone-muted">
                      <Check size={13} className="shrink-0 text-verdict-clear" strokeWidth={3} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {!canAdvance && waitingFor && (
                <p className="clip-corner-sm mt-4 flex items-center gap-2 border border-gold/35 bg-gold/[0.08] px-3 py-2 text-xs font-medium text-gold-bright">
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-gold-bright" />
                  {waitingFor}
                </p>
              )}
            </div>

            {/* Controls — pinned, and never allowed to wrap or scroll away. */}
            <div className={`relative mt-4 flex shrink-0 items-center gap-2.5 border-t border-bone/10 pt-3 ${isCompact ? 'px-4 pb-4' : 'px-6 pb-6'}`}>
              <button
                type="button"
                onClick={onPrevious}
                disabled={index === 0}
                className="clip-corner-sm inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border border-bone/12 bg-bone/[0.04] px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-bone-muted transition-colors hover:border-bone/30 hover:text-bone disabled:cursor-not-allowed disabled:text-bone-dim/50"
              >
                <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" /> Back
              </button>

              <button
                type="button"
                onClick={isLast ? onFinish : onNext}
                disabled={!canAdvance}
                className={`clip-corner-sm ml-auto inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                  isLast
                    ? 'border border-verdict-clear/60 bg-verdict-clear/15 text-verdict-clear hover:bg-verdict-clear/25'
                    : 'border border-gold-bright/70 bg-gold text-ink hover:bg-gold-bright'
                } disabled:cursor-not-allowed disabled:border-bone/12 disabled:bg-charcoal-light disabled:text-bone-dim`}
              >
                {isLast ? <><BadgeCheck size={14} strokeWidth={2.4} aria-hidden="true" /> Start Case 01</> : <>Continue <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" /></>}
              </button>
            </div>
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  );
}
