import { useCallback } from 'react';
import { UsersRound } from 'lucide-react';
import { Panel } from './Panel';
import { SuspectCard } from './SuspectCard';
import { useInvestigationSession } from '../state/investigationSession';

/**
 * The suspect roster. Motive and alibi deliberately stay out of this panel —
 * they are what the player is meant to dig out with SQL, so each card offers a
 * one-click profile query instead of handing the answer over.
 *
 * Exactly one name can carry the prime-suspect pin, and the choice is saved.
 */
export function SuspectPanel({ suspects, onInspectSuspect }) {
  const { primeSuspect, setPrimeSuspect } = useInvestigationSession();

  const handleTogglePrime = useCallback((name) => setPrimeSuspect(name), [setPrimeSuspect]);

  return (
    <Panel
      icon={UsersRound}
      title="Suspects"
      meta={<span className="font-mono">{suspects.length} on file</span>}
      bodyClassName="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-1"
    >
      {suspects.map((suspect, index) => (
        <SuspectCard
          key={suspect.name}
          suspect={suspect}
          index={index}
          isPrime={primeSuspect === suspect.name}
          onTogglePrime={handleTogglePrime}
          onInspect={onInspectSuspect}
        />
      ))}
    </Panel>
  );
}
