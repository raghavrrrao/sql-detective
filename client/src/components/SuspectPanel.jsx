import { useCallback } from 'react';
import { UsersRound } from 'lucide-react';
import { Panel } from './Panel';
import { SuspectCard } from './SuspectCard';
import { useInvestigationSession } from '../state/investigationSession';

/**
 * The suspect roster. Every profile starts at Unknown and moves only as the
 * player's own records accumulate — the case's status column never reaches
 * this panel, and neither do motive or alibi.
 */
export function SuspectPanel({ onInspectSuspect }) {
  const { intel, setPrimeSuspect } = useInvestigationSession();

  const handleTogglePrime = useCallback((name) => setPrimeSuspect(name), [setPrimeSuspect]);
  const known = intel.filter((profile) => profile.status !== 'unknown').length;

  return (
    <Panel
      icon={UsersRound}
      title="Suspects"
      meta={<span className="font-mono">{known} / {intel.length} investigated</span>}
      bodyClassName="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-1"
    >
      {intel.map((profile, index) => (
        <SuspectCard
          key={profile.name}
          profile={profile}
          index={index}
          onTogglePrime={handleTogglePrime}
          onInspect={onInspectSuspect}
        />
      ))}
    </Panel>
  );
}
