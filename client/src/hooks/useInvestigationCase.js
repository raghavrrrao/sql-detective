import { useCallback, useEffect, useState } from 'react';
import { fetchCaseBriefing } from '../services/caseService';

export function useInvestigationCase(difficulty) {
  const [state, setState] = useState({ briefing: null, isLoading: true, error: null });
  // Bumping this re-runs the fetch, which is how the error screen retries.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setState({ briefing: null, isLoading: true, error: null });
    fetchCaseBriefing(difficulty)
      .then((briefing) => isCurrent && setState({ briefing, isLoading: false, error: null }))
      .catch((error) => isCurrent && setState({ briefing: null, isLoading: false, error: error.message }));
    return () => { isCurrent = false; };
  }, [difficulty, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { ...state, retry };
}
