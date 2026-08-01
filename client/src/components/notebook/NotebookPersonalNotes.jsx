import { Save } from 'lucide-react';
import { useDebouncedField } from '../../hooks/useDebouncedField';
import { useInvestigationSession } from '../../state/investigationSession';

/** Personal Notes: a free page. Autosaved — there is no save button anywhere. */
export function NotebookPersonalNotes() {
  const { notes, setNotes } = useInvestigationSession();
  const [draft, setDraft, flush] = useDebouncedField(notes, setNotes);

  const words = draft.trim() === '' ? 0 : draft.trim().split(/\s+/).length;

  return (
    <div>
      <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">Working theory</h3>
      <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">
        Who cannot account for themselves, and what proves it? Write it out — the argument is usually where the hole shows up.
      </p>

      <label className="mt-4 block">
        <span className="sr-only">Personal case notes</span>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={flush}
          placeholder={'22:13 — lights go out\n22:14 — ?\n\nWho is missing from the cameras?'}
          className="clip-corner-sm min-h-[18rem] w-full resize-y border border-white/10 bg-black/40 p-4 typo-body text-base text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
        />
      </label>

      <p className="mt-2.5 flex items-center gap-2 text-sm text-bone-dim">
        <Save size={14} strokeWidth={2.2} aria-hidden="true" />
        Saved automatically in this browser · {words} {words === 1 ? 'word' : 'words'}
      </p>
    </div>
  );
}
