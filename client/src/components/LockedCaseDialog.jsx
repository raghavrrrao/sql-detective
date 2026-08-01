import { Clock3, Database, Fingerprint, Lock } from 'lucide-react';
import { ReusableModal } from './ReusableModal';
import { DifficultyBadge } from './DifficultyBadge';

function Skills({ icon: Icon, label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-bone-dim">
        <Icon size={13} className="text-gold-bright" strokeWidth={2.2} aria-hidden="true" /> {label}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="clip-corner-sm border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-bone">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * What a locked case shows when it is clicked. A sealed file should read as a
 * deliberate part of the career rather than a dead card, so it lists what the
 * case will ask of the player and exactly what opens it.
 */
export function LockedCaseDialog({ isOpen, onClose, caseData, requirement }) {
  if (!caseData) return null;

  return (
    <ReusableModal isOpen={isOpen} onClose={onClose} title="Case file classified" icon={Lock} size="md">
      <div className="flex items-center justify-between gap-4">
        <DifficultyBadge difficulty={caseData.tier} rank={caseData.tierRank} />
        <span className="font-mono text-sm text-bone-dim">{caseData.caseNumber}</span>
      </div>

      <h3 className="mt-5 font-display text-3xl font-medium uppercase leading-tight text-bone">{caseData.title}</h3>

      <dl className="mt-6 space-y-5 border-y border-white/10 py-6">
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.18em] text-bone-dim">Status</dt>
          <dd className="mt-1.5 flex items-center gap-2 font-display text-base font-semibold uppercase tracking-[0.16em] text-crimson-glow">
            <Lock size={15} strokeWidth={2.4} aria-hidden="true" /> Locked
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.18em] text-bone-dim">Unlock requirement</dt>
          <dd className="mt-1.5 typo-body text-base text-bone">
            {requirement
              ? `Close ${requirement.caseNumber} — ${requirement.title} — to open this file.`
              : 'This file is sealed until its investigation is prepared.'}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-bone-dim">
            <Clock3 size={13} className="text-gold-bright" strokeWidth={2.2} aria-hidden="true" /> Estimated time
          </dt>
          <dd className="mt-1.5 text-base text-bone">{caseData.estimatedTime}</dd>
        </div>
      </dl>

      <div className="mt-6 space-y-6">
        <Skills icon={Database} label="SQL skills" items={caseData.sqlConcepts} />
        <Skills icon={Fingerprint} label="Detective skills" items={caseData.detectiveSkills} />
      </div>

      <p className="mt-6 typo-body-secondary text-sm text-bone-dim">{caseData.preview}</p>
    </ReusableModal>
  );
}
