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
 * is redone on resize, scroll and any change to the element's own box — which
 * is what keeps the spotlight correct on a phone, a tablet and a desktop
 * without three sets of numbers.
 */

const PAD = 8;

function useAnchorRect(anchorName, stepIndex) {
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
    // Centre rather than 'nearest': the accuse widget is pinned to the bottom
    // of the viewport, so an element scrolled just barely into view can end up
    // underneath it. Centring keeps the spotlight clear of both edges.
    node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const frame = window.requestAnimationFrame(measure);
    const settle = window.setTimeout(measure, 340);

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
  }, [anchorName, stepIndex, measure]);

  return rect;
}

/** Places the card beside the highlight, flipping so it can never fall off screen. */
function cardPosition(rect) {
  if (!rect) return { centred: true };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const CARD_W = Math.min(400, vw - 32);
  const GUESS_H = 260;

  // On a narrow screen there is no room beside anything, and guessing the
  // card's height is how it ends up half off the bottom. Dock it and let it
  // scroll instead of predicting how tall the copy will be.
  if (vw < 900) {
    return { bottom: 16, left: 16, width: vw - 32, maxHeight: '58vh', overflowY: 'auto' };
  }

  const rightRoom = vw - rect.right;
  const leftRoom = rect.left;
  const top = Math.min(Math.max(16, rect.top), Math.max(16, vh - GUESS_H - 16));

  const bounded = { maxHeight: `${Math.max(220, vh - 32)}px`, overflowY: 'auto' };
  if (rightRoom > CARD_W + 24) return { top, left: rect.right + 20, width: CARD_W, ...bounded };
  if (leftRoom > CARD_W + 24) return { top, left: rect.left - CARD_W - 20, width: CARD_W, ...bounded };
  // Neither side fits — sit under it, or over it if there is no room under.
  return vh - rect.bottom > GUESS_H + 24
    ? { top: rect.bottom + 16, left: Math.min(Math.max(16, rect.left), vw - CARD_W - 16), width: CARD_W, ...bounded }
    : { bottom: vh - rect.top + 16, left: Math.min(Math.max(16, rect.left), vw - CARD_W - 16), width: CARD_W, ...bounded };
}

export function TutorialSpotlight({
  step, index, total, canAdvance, waitingFor,
  onNext, onPrevious, onSkip, onFinish,
}) {
  const rect = useAnchorRect(step.anchor, index);
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

  const position = cardPosition(rect);
  // `pointer-events-auto` is what makes the dimmed area block interaction
  // while the un-covered gap stays live.
  const dim = 'pointer-events-auto fixed bg-ink/85 backdrop-blur-[2px]';

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
            className="pointer-events-none fixed border-2 border-gold-bright/80 shadow-[0_0_0_1px_rgba(232,199,102,0.25),0_0_40px_rgba(232,199,102,0.18)]"
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

      {/* Skip is always reachable, and never inside the dimmed region. */}
      <button
        type="button"
        onClick={onSkip}
        data-tutorial-control="skip"
        className="pointer-events-auto clip-corner-sm fixed right-4 top-4 z-10 inline-flex items-center gap-2 border border-white/15 bg-ink/90 px-3.5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-bone-dim transition-colors hover:border-gold/45 hover:text-gold-bright sm:right-6 sm:top-6"
      >
        <SkipForward size={14} strokeWidth={2.2} aria-hidden="true" /> Skip training
      </button>

      <AnimatePresence mode="wait">
        <motion.section
          key={step.id}
          ref={setCardRef}
          tabIndex={-1}
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.99 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          aria-live="polite"
          className={`pointer-events-auto clip-corner dossier-surface fixed z-10 p-6 shadow-panel outline-none ${position.centred ? 'left-1/2 top-1/2 w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2' : ''}`}
          style={position.centred ? undefined : position}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 paper-texture opacity-[0.05]" />

          <div className="relative">
            <div className="flex items-center gap-2.5">
              <Fingerprint size={15} className="shrink-0 text-crimson-glow" strokeWidth={2.2} aria-hidden="true" />
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-crimson-glow">{step.eyebrow}</p>
              <p className="ml-auto font-mono text-xs text-bone-dim">{index + 1} / {total}</p>
            </div>

            <h2 className="mt-3 typo-heading text-xl leading-tight text-bone">{step.title}</h2>

            <div className="mt-3 space-y-1.5">
              {step.lines.map((line) => (
                <p key={line} className="typo-document text-[0.95rem] leading-relaxed text-bone-muted">{line}</p>
              ))}
            </div>

            {step.checklist && (
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/10 pt-4">
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

            <div className="mt-5 flex items-center gap-2.5 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={onPrevious}
                disabled={index === 0}
                className="clip-corner-sm inline-flex items-center gap-1.5 border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-bone-muted transition-colors hover:border-white/30 hover:text-bone disabled:cursor-not-allowed disabled:text-bone-dim/50"
              >
                <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" /> Back
              </button>

              <button
                type="button"
                onClick={isLast ? onFinish : onNext}
                disabled={!canAdvance}
                className={`clip-corner-sm ml-auto inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                  isLast
                    ? 'border border-verdict-clear/60 bg-verdict-clear/15 text-verdict-clear hover:bg-verdict-clear/25'
                    : 'border border-gold-bright/70 bg-gold text-ink hover:bg-gold-bright'
                } disabled:cursor-not-allowed disabled:border-white/12 disabled:bg-charcoal-light disabled:text-bone-dim`}
              >
                {isLast ? <><BadgeCheck size={14} strokeWidth={2.4} aria-hidden="true" /> Start Case 01</> : <>Continue <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" /></>}
              </button>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
