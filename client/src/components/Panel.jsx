/**
 * The standard investigation panel: clipped corners, a titled header rail with
 * an icon, and an optional right-hand meta slot. Used by every workspace
 * module so the board reads as one system.
 */
export function Panel({ icon: Icon, title, meta, accent = 'crimson', children, className = '', bodyClassName = '', headerClassName = '' }) {
  const accents = {
    crimson: 'text-crimson-glow',
    gold: 'text-gold-bright',
    bone: 'text-bone-muted',
  };

  return (
    <section className={`clip-corner panel-surface shadow-panel backdrop-blur-xl ${className}`}>
      <header className={`flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4 ${headerClassName}`}>
        {Icon && <Icon size={18} strokeWidth={2} className={accents[accent]} />}
        <h2 className="font-display text-base font-semibold uppercase tracking-[0.18em] text-bone">{title}</h2>
        {meta && <div className="ml-auto flex items-center gap-2 text-xs font-medium text-bone-dim">{meta}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
