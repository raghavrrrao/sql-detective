import { motion } from 'framer-motion';

export function FeatureCard({ icon: Icon, title, description, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="clip-corner group relative panel-surface p-7 shadow-panel transition-colors duration-300 hover:border-crimson/40"
    >
      <span aria-hidden="true" className="absolute left-0 top-0 h-full w-[3px] bg-crimson/50 transition-colors duration-300 group-hover:bg-crimson-bright" />
      <div className="mb-8 flex h-14 w-14 items-center justify-center border border-crimson/30 bg-crimson-deep/25 text-crimson-glow transition-colors duration-300 group-hover:border-crimson-bright/60 group-hover:bg-crimson-deep/45">
        <Icon size={24} strokeWidth={1.8} />
      </div>
      <h3 className="font-display text-2xl font-semibold uppercase tracking-wide text-bone">{title}</h3>
      <p className="mt-4 text-base leading-7 text-bone-muted">{description}</p>
    </motion.article>
  );
}
