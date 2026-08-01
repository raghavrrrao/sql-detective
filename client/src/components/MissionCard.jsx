import { motion } from 'framer-motion';
import { Crosshair } from 'lucide-react';

export function MissionCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.9 }}
      className="clip-corner relative overflow-hidden border border-crimson/35 bg-crimson-deep/18 p-5 backdrop-blur-xl sm:p-9"
    >
      <div aria-hidden="true" className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-crimson/12 blur-3xl" />
      <div className="relative flex gap-4 sm:gap-5">
        <Crosshair className="mt-1 shrink-0 text-crimson-glow" size={26} strokeWidth={2} />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-crimson-glow">Your objective</p>
          <p className="mt-4 max-w-2xl font-display text-xl font-normal leading-8 text-bone typo-body sm:text-2xl">
            Query the evidence database, break every alibi, and prove which suspect had no record where they claim to have been.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
