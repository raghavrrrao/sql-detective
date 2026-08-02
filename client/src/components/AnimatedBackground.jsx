/**
 * The shared atmosphere layer: board grid, film grain, drifting haze, dust,
 * red case threads and a vignette. Everything animates on transform/opacity
 * only, so it stays on the compositor and never triggers layout.
 */
const dust = [
  { id: 'd1', left: '12%', size: 2, delay: '0s', duration: '15s' },
  { id: 'd2', left: '27%', size: 3, delay: '2.4s', duration: '18s' },
  { id: 'd3', left: '41%', size: 2, delay: '5.1s', duration: '13s' },
  { id: 'd4', left: '58%', size: 2, delay: '1.2s', duration: '20s' },
  { id: 'd5', left: '69%', size: 3, delay: '7.6s', duration: '16s' },
  { id: 'd6', left: '82%', size: 2, delay: '3.8s', duration: '19s' },
  { id: 'd7', left: '91%', size: 2, delay: '9.2s', duration: '14s' },
];

const threads = [
  { id: 't1', top: '22%', left: '-6%', width: '46%', rotate: '-19deg' },
  { id: 't2', top: '61%', left: '38%', width: '52%', rotate: '13deg' },
  { id: 't3', top: '84%', left: '4%', width: '38%', rotate: '7deg' },
];

export function AnimatedBackground({ variant = 'default' }) {
  const isBoard = variant === 'board';

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-ink" />

      {/* The board is a desk: leather under the grid, and a lamp above it. */}
      {isBoard && <div className="absolute inset-0 desk-surface" />}

      <div className={`absolute inset-0 board-grid ${isBoard ? 'opacity-40' : 'opacity-30'}`} />
      <div className="absolute inset-0 board-grid-fine opacity-20" />

      <div className={`absolute inset-x-0 top-0 h-[36rem] lamp-light ${isBoard ? 'animate-breathe opacity-100' : 'opacity-70'}`} />

      <div className="absolute -left-[22%] -top-[18%] h-[42rem] w-[42rem] animate-drift rounded-full bg-crimson-deep/30 blur-[150px]" />
      <div
        className="absolute -right-[18%] top-[28%] h-[36rem] w-[36rem] animate-drift rounded-full bg-leather/40 blur-[160px]"
        style={{ animationDelay: '-9s', animationDuration: '31s' }}
      />
      <div
        className="absolute bottom-[-18%] left-[22%] h-[26rem] w-[60%] animate-drift rounded-[100%] bg-gold-deep/20 blur-[130px]"
        style={{ animationDelay: '-15s', animationDuration: '38s' }}
      />

      {threads.map((thread) => (
        <span
          key={thread.id}
          className="evidence-thread absolute h-px opacity-20"
          style={{ top: thread.top, left: thread.left, width: thread.width, transform: `rotate(${thread.rotate})` }}
        />
      ))}

      {dust.map((mote) => (
        <span
          key={mote.id}
          className="absolute bottom-[-4%] animate-float rounded-full bg-gold-bright/35"
          style={{
            left: mote.left,
            height: `${mote.size}px`,
            width: `${mote.size}px`,
            animationDelay: mote.delay,
            animationDuration: mote.duration,
          }}
        />
      ))}

      <div className="absolute inset-0 film-grain opacity-[0.035] mix-blend-overlay" />
      <div className="absolute inset-0 vignette" />
    </div>
  );
}
