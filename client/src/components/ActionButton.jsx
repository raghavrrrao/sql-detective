import { Link } from 'react-router-dom';
import { audio } from '../audio/audioManager';

/*
 * Each variant carries its own inset top-light so the face is never flat, and
 * a hover/press pair so the control answers back. `active:` beats `hover:` in
 * Tailwind's variant order, which is what lets the press actually land.
 */
const variants = {
  primary:
    'bg-crimson text-bone border border-crimson-bright/60 shadow-crimson hover:bg-crimson-bright disabled:bg-charcoal-light disabled:text-bone-dim disabled:border-white/10 disabled:shadow-none',
  gold:
    'bg-gold text-ink border border-gold-bright/70 shadow-glow hover:bg-gold-bright disabled:bg-charcoal-light disabled:text-bone-dim disabled:border-white/10 disabled:shadow-none',
  ghost:
    'bg-white/[0.05] text-bone border border-bone/12 hover:border-gold/50 hover:bg-white/[0.09] hover:text-bone disabled:text-bone-dim disabled:hover:border-bone/12',
};

/** Lift on hover, sink on press. Disabled controls do neither. */
const TACTILE =
  'hover:-translate-y-px hover:shadow-lift active:translate-y-px active:shadow-press '
  + 'disabled:transform-none disabled:hover:translate-y-0';

const sizes = {
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-4 text-base',
};

/**
 * One button surface for the whole game: clipped corners, a light sweep on
 * hover, and identical geometry whether it renders a <button>, an <a>, or a
 * router <Link>.
 */
export function ActionButton({ as = 'button', to, href, variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, children, className = '', onClick, ...rest }) {
  // Every primary control in the game routes through this component, so the
  // click lives here rather than being repeated at ~40 call sites.
  const handleClick = (event) => {
    audio.playSfx('click');
    onClick?.(event);
  };
  const classes = `group clip-corner-sm relative inline-flex items-center justify-center gap-2.5 overflow-hidden font-display font-medium uppercase tracking-[0.16em] disabled:cursor-not-allowed ${TACTILE} ${variants[variant]} ${sizes[size]} ${className}`;

  const inner = (
    <>
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bone/25 to-transparent" />
      <span aria-hidden="true" className="absolute inset-y-0 -left-full w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-bone/18 to-transparent transition-transform duration-[650ms] ease-out group-hover:translate-x-[400%]" />
      <span className="relative flex items-center gap-2.5">
        {Icon && <Icon size={size === 'lg' ? 19 : 17} strokeWidth={2.1} />}
        {children}
        {IconRight && <IconRight size={size === 'lg' ? 19 : 17} strokeWidth={2.1} />}
      </span>
    </>
  );

  if (as === 'link') return <Link to={to} className={classes} onClick={handleClick} {...rest}>{inner}</Link>;
  if (as === 'a') return <a href={href} className={classes} onClick={handleClick} {...rest}>{inner}</a>;
  return <button type="button" className={classes} onClick={handleClick} {...rest}>{inner}</button>;
}
