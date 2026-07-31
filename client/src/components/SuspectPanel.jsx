import { useState } from 'react';
import { UsersRound } from 'lucide-react';
import { Panel } from './Panel';
import { SuspectCard } from './SuspectCard';

/**
 * The suspect roster. Motive and alibi deliberately stay out of this panel —
 * they are what the player is meant to dig out with SQL, so each card offers a
 * one-click profile query instead of handing the answer over.
 */
export function SuspectPanel({ suspects, onInspectSuspect }) {
  const [primeSuspects, setPrimeSuspects] = useState(() => new Set());

  const togglePrime = (name) =>
    setPrimeSuspects((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

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
          isPrime={primeSuspects.has(suspect.name)}
          onTogglePrime={() => togglePrime(suspect.name)}
          onInspect={() => onInspectSuspect(suspect)}
        />
      ))}
    </Panel>
  );
}
