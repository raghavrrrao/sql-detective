import { useCallback, useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * `dismissible: false` removes every casual way out — Escape, the overlay and
 * the close button — for the one dialog that must be answered rather than
 * waved away: the final accusation confirmation.
 */
export function ReusableModal({ isOpen, onClose, title, icon: Icon, size = 'md', dismissible = true, bodyRef, children }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  // Whatever opened the dialog gets the caret back when it closes.
  const restoreFocusRef = useRef(null);

  /**
   * Anything focused inside the dialog gets a chance to blur first. Text fields
   * commit their value on blur, so this is what stops a note typed a moment
   * before Escape from disappearing with the dialog.
   */
  const requestClose = useCallback(() => {
    if (!dismissible) return;
    const active = document.activeElement;
    if (active && typeof active.blur === 'function' && dialogRef.current?.contains(active)) active.blur();
    onClose();
  }, [onClose, dismissible]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      requestClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) ?? [])]
      .filter((node) => node.offsetParent !== null || node === document.activeElement);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, [requestClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    restoreFocusRef.current = document.activeElement;
    const frame = window.requestAnimationFrame(() => {
      const target = dialogRef.current?.querySelector(FOCUSABLE);
      (target ?? dialogRef.current)?.focus();
    });

    // A dialog over a scrollable board should not let the page scroll behind it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      const restoreTo = restoreFocusRef.current;
      if (restoreTo && typeof restoreTo.focus === 'function' && document.contains(restoreTo)) restoreTo.focus();
    };
  }, [isOpen]);

  const widths = { md: 'max-w-xl', lg: 'max-w-3xl', full: 'max-w-6xl h-[92dvh]' };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end bg-black/78 p-2 backdrop-blur-md sm:items-center sm:justify-center sm:p-4"
          onMouseDown={requestClose}
        >
          <motion.section
            ref={dialogRef}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className={`clip-corner flex max-h-[92dvh] w-full flex-col panel-surface shadow-panel outline-none sm:max-h-[88vh] ${widths[size]}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex items-center gap-2.5 border-b border-white/10 bg-white/[0.03] px-4 py-3.5 sm:gap-3 sm:px-6 sm:py-4">
              {Icon && <Icon size={19} className="shrink-0 text-gold-bright" strokeWidth={2} aria-hidden="true" />}
              <h2 id={titleId} className="min-w-0 truncate font-display text-base font-medium uppercase tracking-[0.12em] text-bone sm:text-xl sm:tracking-[0.16em]">{title}</h2>
              {dismissible && (
                <button
                  type="button"
                  onClick={requestClose}
                  aria-label={`Close ${title}`}
                  className="clip-corner-sm ml-auto shrink-0 p-2 text-bone-dim transition-colors hover:text-bone"
                >
                  <X size={19} aria-hidden="true" />
                </button>
              )}
            </header>
            <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
