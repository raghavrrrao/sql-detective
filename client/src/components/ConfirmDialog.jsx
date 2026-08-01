import { AlertTriangle } from 'lucide-react';
import { ReusableModal } from './ReusableModal';

/**
 * The gate in front of anything that destroys data. Every caller states what
 * will go and what will survive, so nobody clears a leaderboard mid-festival
 * because a button was next to another button.
 */
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, description, keeps, confirmLabel = 'Confirm' }) {
  return (
    <ReusableModal isOpen={isOpen} onClose={onClose} title={title} icon={AlertTriangle} size="md">
      <p className="typo-body text-base text-bone-muted">{description}</p>

      {keeps && (
        <p className="clip-corner-sm mt-4 border border-white/10 bg-white/[0.03] p-3.5 typo-body-secondary text-sm text-bone-dim">
          This keeps: {keeps}
        </p>
      )}

      <p className="clip-corner-sm mt-4 border border-verdict-alert/40 bg-verdict-alert/10 p-3.5 font-display text-sm font-medium uppercase tracking-[0.14em] text-verdict-alert">
        This action cannot be undone.
      </p>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="clip-corner-sm border border-white/12 bg-white/[0.04] px-5 py-3 font-display text-sm font-medium uppercase tracking-[0.16em] text-bone transition-colors hover:border-white/30"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => { onConfirm(); onClose(); }}
          className="clip-corner-sm border border-verdict-alert/60 bg-verdict-alert/15 px-5 py-3 font-display text-sm font-medium uppercase tracking-[0.16em] text-verdict-alert transition-colors hover:bg-verdict-alert/25"
        >
          {confirmLabel}
        </button>
      </div>
    </ReusableModal>
  );
}
