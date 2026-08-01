import { useMemo } from 'react';
import { FileText, Printer } from 'lucide-react';
import { formatClock } from '../utils/clock';
import { ReusableModal } from './ReusableModal';

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString([], { dateStyle: 'long', timeStyle: 'short' });
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.16em] text-bone-dim">{label}</dt>
      <dd className="mt-1.5 typo-document text-base text-bone">{value ?? '—'}</dd>
    </div>
  );
}

function Section({ title, count, children }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <h3 className="flex items-baseline justify-between gap-3 border-b border-white/15 pb-2 font-display text-sm font-medium uppercase tracking-[0.18em] text-gold-bright">
        {title}
        {count !== undefined && <span className="font-mono text-xs text-bone-dim">{count}</span>}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * The complete investigation report, unlocked by a proven verdict. Rendered
 * from the snapshot taken at the moment the case closed, so replaying the
 * investigation never rewrites the record of how it was solved.
 */
export function CaseDebrief({ isOpen, onClose, report }) {
  const witnesses = useMemo(
    () => (report?.discoveries ?? []).filter((record) => record.table === 'witnesses'),
    [report],
  );
  const evidenceRecords = useMemo(
    () => (report?.discoveries ?? []).filter((record) => ['evidence', 'weapons', 'fingerprints'].includes(record.table)),
    [report],
  );

  if (!report) return null;

  return (
    <ReusableModal isOpen={isOpen} onClose={onClose} title="Investigation report" icon={FileText} size="full">
      <div className="mb-5 flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="clip-corner-sm inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-bone-muted transition-colors hover:border-gold/45 hover:text-gold-bright"
        >
          <Printer size={15} strokeWidth={2.2} aria-hidden="true" /> Print or save as PDF
        </button>
      </div>

      <article className="print-report">
        <header className="border-b-2 border-crimson/50 pb-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-crimson-glow">{report.caseNumber} · Closed</p>
          <h2 className="mt-2 font-display text-2xl font-medium uppercase leading-tight text-bone sm:text-4xl">{report.title}</h2>
        </header>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Difficulty" value={report.difficulty} />
          <Field label="Date solved" value={formatDate(report.solvedAt)} />
          <Field label={report.subjectLabel ?? 'Victim'} value={report.victim} />
          <Field label="Your prime suspect" value={report.primeSuspect ?? 'None flagged'} />
          <Field label="Accused" value={report.accused} />
          <Field label="Responsible" value={report.reveal?.killer?.name ?? report.accused} />
          <Field label="Formal accusations filed" value={report.attempts} />
          <Field label="Records recovered" value={report.coverage?.discoveries} />
          <Field label="Queries executed" value={report.coverage?.queries} />
          <Field label="Time taken" value={report.elapsedMs === undefined ? '—' : formatClock(report.elapsedMs)} />
          <Field label="Hints taken" value={report.hintsUsed ?? 0} />
          <Field label="Objectives" value={report.objectives ? `${report.objectives.done} / ${report.objectives.total}` : '—'} />
          <Field label="Final score" value={report.score ?? '—'} />
        </dl>

        {report.reveal?.killer && (
          <Section title="Findings">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label="Method" value={report.reveal.victim?.cause_of_death} />
              <Field label="Motive" value={report.reveal.killer.motive} />
              <Field label="Concealed" value={report.reveal.killer.hidden_secret} />
              <Field label="Movements" value={report.reveal.killer.timeline} />
            </dl>
          </Section>
        )}

        <Section title="Investigation coverage">
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {(report.ledger ?? []).map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 typo-body text-base text-bone-muted">
                <span>{row.label}</span>
                <span className="font-mono text-sm text-bone">{row.value}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Evidence cited in the accusation" count={report.citedEvidence?.length ?? 0}>
          {report.citedEvidence?.length ? (
            <ol className="space-y-2.5">
              {report.citedEvidence.map((record) => (
                <li key={record.key} className="border-l-2 border-gold/50 pl-3.5">
                  <p className="typo-body text-base text-bone">{record.title}</p>
                  <p className="mt-0.5 font-mono text-xs text-bone-dim">
                    {record.table.replace(/_/g, ' ')}
                    {record.occurredAt ? ` · ${record.occurredAt}` : ''}
                    {record.location ? ` · ${record.location}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-base text-bone-dim">No records were cited.</p>
          )}
        </Section>

        <Section title="Your reasoning">
          {report.reasoning?.trim() ? (
            <p className="whitespace-pre-wrap typo-document text-base text-bone-muted">{report.reasoning}</p>
          ) : (
            <p className="text-base text-bone-dim">No reasoning was entered.</p>
          )}
        </Section>

        <Section title="Timeline reconstructed" count={report.timeline?.length ?? 0}>
          {report.timeline?.length ? (
            <ol className="space-y-1.5">
              {report.timeline.map((event) => (
                <li key={event.id} className="flex gap-3 typo-body text-base text-bone-muted">
                  <span className="w-14 shrink-0 font-mono text-sm text-gold-bright">{event.clock}</span>
                  <span className="typo-body">{event.title}{event.location ? ` · ${event.location}` : ''}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-base text-bone-dim">No dated records were recovered.</p>
          )}
        </Section>

        <Section title="Witness statements recovered" count={witnesses.length}>
          {witnesses.length ? (
            <ul className="space-y-1.5">
              {witnesses.map((record) => (
                <li key={record.key} className="typo-body text-base text-bone-muted">{record.title}</li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-bone-dim">None.</p>
          )}
        </Section>

        <Section title="Physical and forensic evidence recovered" count={evidenceRecords.length}>
          {evidenceRecords.length ? (
            <ul className="space-y-1.5">
              {evidenceRecords.map((record) => (
                <li key={record.key} className="typo-body text-base text-bone-muted">{record.title}</li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-bone-dim">None.</p>
          )}
        </Section>

        <Section title="Suspect roster at close" count={report.suspects?.length ?? 0}>
          <ul className="space-y-1.5">
            {(report.suspects ?? []).map((profile) => (
              <li key={profile.name} className="flex flex-wrap items-baseline gap-x-3 typo-body text-base text-bone-muted">
                <span className="font-medium text-bone">{profile.name}</span>
                <span className="typo-body text-sm">{profile.occupation}</span>
                <span className="font-mono text-xs text-bone-dim">{profile.recordCount} records</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Queries executed" count={report.queries?.length ?? 0}>
          <ol className="space-y-1.5">
            {(report.queries ?? []).map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="font-mono text-xs leading-6 text-bone-dim">
                <span className={entry.ok ? 'text-verdict-clear' : 'text-verdict-alert'}>{entry.ok ? '✓' : '✕'}</span>{' '}
                {entry.sql.replace(/\s+/g, ' ')}
              </li>
            ))}
          </ol>
        </Section>
      </article>
    </ReusableModal>
  );
}
