import { motion } from 'framer-motion';
import { Eye, FileWarning, MapPin, Users } from 'lucide-react';

const entriesFor = (subjectLabel) => [
  { key: 'victim', label: subjectLabel, icon: Eye },
  { key: 'crimeScene', label: 'Crime scene', icon: MapPin },
  { key: 'witnesses', label: 'Persons of interest', icon: Users },
  { key: 'evidence', label: 'Initial evidence', icon: FileWarning },
];

export function CaseFile({ caseData }) {
  const entries = entriesFor(caseData.subjectLabel ?? 'Victim');
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="clip-corner relative dossier-surface p-7 shadow-panel sm:p-9"
    >
      <div className="absolute inset-0 paper-texture pointer-events-none opacity-[0.05]" />

      <div className="relative flex flex-wrap items-center gap-3 border-b border-gold/20 pb-5">
        <FileWarning size={20} className="text-gold-bright" strokeWidth={2} />
        <h2 className="font-display text-2xl font-medium uppercase tracking-wide text-bone">Classified case file</h2>
        <span className="clip-tag ml-auto border border-crimson/40 bg-crimson-deep/30 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-crimson-glow">
          Eyes only
        </span>
      </div>

      <dl className="relative mt-8 grid gap-8 sm:grid-cols-2">
        {entries.map(({ key, label, icon: Icon }) => (
          <div key={key}>
            <dt className="flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.2em] text-gold">
              <Icon size={15} strokeWidth={2.2} /> {label}
            </dt>
            <dd className="mt-3 typo-document text-base text-bone-muted">{caseData[key]}</dd>
          </div>
        ))}
      </dl>
    </motion.section>
  );
}
