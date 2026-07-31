import { useEffect, useState } from 'react';
import { fetchCaseBriefing } from '../services/caseService';

export function useInvestigationCase(difficulty) {
  const [state, setState] = useState({ briefing: null, isLoading: true, error: null });

  useEffect(() => {
    let isCurrent = true;
    setState({ briefing: null, isLoading: true, error: null });
    fetchCaseBriefing(difficulty)
      .then((briefing) => isCurrent && setState({ briefing, isLoading: false, error: null }))
      .catch((error) => isCurrent && setState({ briefing: null, isLoading: false, error: error.message }));
    return () => { isCurrent = false; };
  }, [difficulty]);

  return state;
}
