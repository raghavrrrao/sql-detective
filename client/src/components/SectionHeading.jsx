import { motion } from 'framer-motion';

export function SectionHeading({ eyebrow, title, description, align = 'center' }) {
  const isCentered = align === 'center';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55 }}
      className={`mb-14 max-w-3xl ${isCentered ? 'mx-auto text-center' : ''}`}
    >
      <p className={`mb-4 flex items-center gap-3 font-mono text-sm font-medium uppercase tracking-[0.24em] text-crimson-glow ${isCentered ? 'justify-center' : ''}`}>
        <span className="h-px w-8 bg-crimson" />
        {eyebrow}
        {isCentered && <span className="h-px w-8 bg-crimson" />}
      </p>
      <h2 className="text-balance font-display text-4xl font-bold uppercase leading-tight tracking-tight text-bone sm:text-5xl">{title}</h2>
      {description && <p className="mt-5 text-lg leading-8 text-bone-muted">{description}</p>}
    </motion.div>
  );
}
