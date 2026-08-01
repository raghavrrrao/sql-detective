import { motion } from 'framer-motion';
import { ArrowRight, Fingerprint, PlayCircle, SlidersHorizontal } from 'lucide-react';
import { ActionButton } from './ActionButton';
import { displayCases } from '../catalog/caseCatalog';

const rise = {
  hidden: { opacity: 0, y: 26 },
  visible: (delay) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] } }),
};

const stats = [
  { value: String(displayCases.length).padStart(2, '0'), label: 'Case files' },
  { value: '16', label: 'Evidence tables' },
  { value: '318', label: 'Case records' },
];

export function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-center px-6 pb-24 pt-32 sm:px-10 lg:px-16">
      {/* Classified stamp watermark */}
      <div aria-hidden="true" className="pointer-events-none absolute right-4 top-28 hidden select-none lg:block">
        <div className="rotate-[9deg] border-[3px] border-crimson/25 px-8 py-3">
          <p className="font-display text-4xl font-bold uppercase tracking-[0.3em] text-crimson/20">Classified</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl">
        <motion.div initial="hidden" animate="visible" className="max-w-4xl">
          <motion.div variants={rise} custom={0.05} className="mb-8 flex items-center gap-4">
            <span className="h-px w-12 bg-crimson" />
            <p className="flex items-center gap-2.5 font-mono text-sm font-medium uppercase tracking-[0.24em] text-crimson-glow">
              <Fingerprint size={16} strokeWidth={2.2} /> Case files now open
            </p>
          </motion.div>

          <motion.h1 variants={rise} custom={0.12} className="text-balance font-display text-6xl font-bold uppercase leading-[0.92] tracking-tight text-bone sm:text-8xl lg:text-[7rem]">
            SQL Detective
          </motion.h1>
          <motion.p variants={rise} custom={0.18} className="mt-4 font-display text-xl font-medium uppercase tracking-[0.34em] text-gold-bright sm:text-3xl">
            Countdown to Justice
          </motion.p>

          <motion.p variants={rise} custom={0.26} className="mt-9 max-w-2xl text-balance text-lg leading-8 text-bone-muted sm:text-xl">
            One interrogation tool and a career of sealed case files. Query the evidence database, break every alibi, and close each investigation before the clock runs out.
          </motion.p>

          <motion.div variants={rise} custom={0.34} className="mt-11 flex flex-col gap-4 sm:flex-row">
            <ActionButton as="link" to="/difficulty" variant="primary" size="lg" iconRight={ArrowRight}>
              Start Investigation
            </ActionButton>
            <ActionButton as="a" href="#how-it-works" variant="ghost" size="lg" icon={PlayCircle}>
              How to Play
            </ActionButton>
            <ActionButton as="link" to="/settings" variant="ghost" size="lg" icon={SlidersHorizontal}>
              Settings
            </ActionButton>
          </motion.div>

          <motion.dl variants={rise} custom={0.44} className="mt-16 flex flex-wrap gap-x-12 gap-y-6 border-t border-white/10 pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-4xl font-bold text-bone">{stat.value}</dt>
                <dd className="mt-1 text-sm uppercase tracking-[0.2em] text-bone-dim">{stat.label}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </div>
    </section>
  );
}
