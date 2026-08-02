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

  // A hairline of the panel's own accent under the header rail — the tape
  // colour on a filing drawer. Purely decorative, and no layout cost.
  const rails = {
    crimson: 'shadow-[inset_0_-1px_0_rgba(169,29,43,0.55)]',
    gold: 'shadow-[inset_0_-1px_0_rgba(184,146,66,0.5)]',
    bone: 'shadow-[inset_0_-1px_0_rgba(207,201,188,0.28)]',
  };

  return (
    <section className={`clip-corner panel-surface shadow-panel backdrop-blur-xl ${className}`}>
      <header className={`flex items-center gap-3 border-b border-bone/10 bg-gradient-to-b from-bone/[0.055] to-transparent px-5 py-4 ${rails[accent] ?? rails.crimson} ${headerClassName}`}>
        {Icon && <Icon size={18} strokeWidth={2} className={accents[accent]} aria-hidden="true" />}
        <h2 className="font-display text-base font-medium uppercase tracking-[0.18em] text-bone">{title}</h2>
        {meta && <div className="ml-auto flex items-center gap-2 text-xs font-medium text-bone-dim">{meta}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
