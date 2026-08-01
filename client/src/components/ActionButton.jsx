import { Link } from 'react-router-dom';

const variants = {
  primary:
    'bg-crimson text-bone border border-crimson-bright/60 hover:bg-crimson-bright shadow-crimson disabled:bg-charcoal-light disabled:text-bone-dim disabled:border-white/10 disabled:shadow-none',
  gold:
    'bg-gold text-ink border border-gold-bright/70 hover:bg-gold-bright shadow-glow disabled:bg-charcoal-light disabled:text-bone-dim disabled:border-white/10 disabled:shadow-none',
  ghost:
    'bg-white/[0.04] text-bone border border-white/12 hover:border-gold/50 hover:bg-white/[0.08] hover:text-bone disabled:text-bone-dim disabled:hover:border-white/12',
};

const sizes = {
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-4 text-base',
};

/**
 * One button surface for the whole game: clipped corners, a light sweep on
 * hover, and identical geometry whether it renders a <button>, an <a>, or a
 * router <Link>.
 */
export function ActionButton({ as = 'button', to, href, variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, children, className = '', ...rest }) {
  const classes = `group clip-corner-sm relative inline-flex items-center justify-center gap-2.5 overflow-hidden font-display font-medium uppercase tracking-[0.16em] transition-colors duration-200 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`;

  const inner = (
    <>
      <span aria-hidden="true" className="absolute inset-y-0 -left-full w-1/3 skew-x-[-20deg] bg-white/20 transition-transform duration-500 group-hover:translate-x-[400%]" />
      <span className="relative flex items-center gap-2.5">
        {Icon && <Icon size={size === 'lg' ? 19 : 17} strokeWidth={2.1} />}
        {children}
        {IconRight && <IconRight size={size === 'lg' ? 19 : 17} strokeWidth={2.1} />}
      </span>
    </>
  );

  if (as === 'link') return <Link to={to} className={classes} {...rest}>{inner}</Link>;
  if (as === 'a') return <a href={href} className={classes} {...rest}>{inner}</a>;
  return <button type="button" className={classes} {...rest}>{inner}</button>;
}
