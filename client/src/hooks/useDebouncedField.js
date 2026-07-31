import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Keeps a text field responsive while still autosaving it.
 *
 * The field renders from local state so every keystroke is instant, and the
 * value is pushed into the session once typing pauses (or on blur). Without
 * this, each character would dispatch through the reducer and re-render every
 * notebook section.
 */
export function useDebouncedField(value, commit, delay = 400) {
  const [draft, setDraft] = useState(value);
  const commitRef = useRef(commit);
  commitRef.current = commit;
  // Tracks the value the session already knows about, so an external change
  // (a restored session, a reset) can be told apart from local typing.
  const committedRef = useRef(value);

  useEffect(() => {
    if (value !== committedRef.current) {
      committedRef.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    if (draft === committedRef.current) return undefined;
    const timer = window.setTimeout(() => {
      committedRef.current = draft;
      commitRef.current(draft);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [draft, delay]);

  const flush = useCallback(() => {
    if (draft === committedRef.current) return;
    committedRef.current = draft;
    commitRef.current(draft);
  }, [draft]);

  // Closing the notebook with Escape unmounts the field without blurring it, so
  // the last few keystrokes have to be committed on the way out.
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => () => flushRef.current(), []);

  return [draft, setDraft, flush];
}
