import { motion } from 'framer-motion';
import { ArrowRight, Database, Gavel, Target, TerminalSquare } from 'lucide-react';
import { ActionButton } from './ActionButton';

const steps = [
  { title: 'Open the case', icon: Target, detail: 'Read the briefing, the case file, and the first set of leads.' },
  { title: 'Read the board', icon: Database, detail: 'Sixteen linked tables hold every statement, log, and forensic report.' },
  { title: 'Query the evidence', icon: TerminalSquare, detail: 'Write real SQL to break alibis and place people at the scene.' },
  { title: 'Make the accusation', icon: Gavel, detail: 'One person will have no record where they claim to have been. Prove it, then name them.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 flex items-center gap-3 font-mono text-sm font-medium uppercase tracking-[0.24em] text-crimson-glow">
              <span className="h-px w-8 bg-crimson" /> Method
            </p>
            <h2 className="font-display text-4xl font-medium uppercase text-bone sm:text-5xl">Follow the evidence</h2>
          </div>
          <div className="max-w-md">
            <p className="typo-body text-base text-bone-muted">
              Four steps, repeated until the board is clear. Every case teaches the SQL you need for the next one.
            </p>
            <div className="mt-5">
              <ActionButton as="link" to="/how-to-play" variant="ghost" iconRight={ArrowRight}>
                Never written SQL? Start here
              </ActionButton>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ title, icon: Icon, detail }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1, duration: 0.45 }}
              className="clip-corner relative panel-surface p-7"
            >
              <span className="font-mono text-sm font-medium tracking-[0.2em] text-crimson-glow">0{index + 1}</span>
              <Icon className="mt-7 text-gold-bright" size={28} strokeWidth={1.7} />
              <h3 className="mt-7 font-display text-xl font-medium uppercase tracking-wide text-bone">{title}</h3>
              <p className="mt-3 typo-body text-base text-bone-muted">{detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
