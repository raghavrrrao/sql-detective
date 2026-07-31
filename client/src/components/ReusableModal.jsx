import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export function ReusableModal({ isOpen, onClose, title, icon: Icon, size = 'md', children }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const widths = { md: 'max-w-xl', lg: 'max-w-3xl' };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end bg-black/78 p-4 backdrop-blur-md sm:items-center sm:justify-center"
          onMouseDown={onClose}
        >
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={`clip-corner flex max-h-[88vh] w-full flex-col panel-surface shadow-panel ${widths[size]}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-6 py-4">
              {Icon && <Icon size={19} className="text-gold-bright" strokeWidth={2} />}
              <h2 id="modal-title" className="font-display text-xl font-semibold uppercase tracking-[0.16em] text-bone">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="ml-auto p-2 text-bone-dim transition-colors hover:text-bone"
              >
                <X size={19} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
