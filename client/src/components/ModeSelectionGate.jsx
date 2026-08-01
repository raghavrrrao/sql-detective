import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, House, UserRound } from 'lucide-react';
import { NAME_MAX_LENGTH, GAME_MODES } from '../utils/gameSettings';
import { useGameMode } from '../state/gameMode';

const modes = [
  {
    id: GAME_MODES.festival,
    icon: GraduationCap,
    label: 'Festival Mode',
    strapline: 'Shared computer',
    detail: 'Perfect for demonstrations and competitions. Nothing is saved between participants, and every result goes on the leaderboard.',
  },
  {
    id: GAME_MODES.personal,
    icon: House,
    label: 'Personal Mode',
    strapline: 'This is my machine',
    detail: 'Save progress between sessions. Solved cases, notebooks and reports are kept until you clear them yourself.',
  },
];

/**
 * The first thing anyone sees, and the only time they see it. It blocks the app
 * until the machine knows which mode it is running in — and, in Festival Mode,
 * who is currently at the keyboard.
 */
export function ModeSelectionGate() {
  const { hasChosenMode, needsDetectiveName, chooseMode, registerDetective } = useGameMode();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const askingForName = hasChosenMode && needsDetectiveName;

  useEffect(() => {
    if (!askingForName) return undefined;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [askingForName]);

  if (hasChosenMode && !needsDetectiveName) return null;

  const submitName = () => {
    if (registerDetective(name)) return;
    setError('Enter a name so your result can go on the board.');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={askingForName ? 'Detective registration' : 'Choose how you want to play'}
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/97 px-6 py-12 backdrop-blur-xl"
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 board-grid-fine opacity-30" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 vignette" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-3xl"
      >
        {askingForName ? (
          <>
            <p className="text-center font-mono text-sm uppercase tracking-[0.3em] text-crimson-glow">Festival Mode</p>
            <h1 className="mt-5 text-center font-display text-5xl font-medium uppercase leading-none text-bone sm:text-6xl">
              Enter detective name
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-center typo-body text-base text-bone-muted">
              This is the name that appears on the leaderboard when you close a case.
            </p>

            <form
              className="mx-auto mt-9 max-w-md"
              onSubmit={(event) => { event.preventDefault(); submitName(); }}
            >
              <label className="block">
                <span className="sr-only">Detective name</span>
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(event) => { setName(event.target.value); setError(''); }}
                  maxLength={NAME_MAX_LENGTH}
                  placeholder="Your name"
                  aria-invalid={error !== ''}
                  aria-describedby="detective-name-help"
                  className="clip-corner-sm w-full border border-white/15 bg-black/45 px-5 py-4 text-center font-display text-2xl uppercase tracking-[0.14em] text-bone outline-none transition-colors placeholder:text-bone-dim placeholder:tracking-normal focus:border-gold/60"
                />
              </label>
              <p id="detective-name-help" className={`mt-3 text-center text-sm ${error ? 'text-verdict-alert' : 'text-bone-dim'}`}>
                {error || `Up to ${NAME_MAX_LENGTH} characters. Press Enter when you are ready.`}
              </p>

              <button
                type="submit"
                className="clip-corner-sm mt-7 inline-flex w-full items-center justify-center gap-2.5 border border-crimson-bright/60 bg-crimson px-6 py-4 font-display text-base font-semibold uppercase tracking-[0.16em] text-white shadow-crimson transition-colors hover:bg-crimson-bright"
              >
                <UserRound size={18} strokeWidth={2.2} aria-hidden="true" /> Begin investigation
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-center font-mono text-sm uppercase tracking-[0.3em] text-crimson-glow">Welcome detective</p>
            <h1 className="mt-5 text-center font-display text-5xl font-medium uppercase leading-none text-bone sm:text-6xl">
              Choose how you want to play
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-center typo-body text-base text-bone-muted">
              You will only be asked once. It can be changed at any time from Settings.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => chooseMode(mode.id)}
                    className="clip-corner group flex flex-col p-7 text-left panel-surface shadow-panel transition-colors duration-200 hover:border-gold/45"
                  >
                    <Icon size={30} className="text-gold-bright" strokeWidth={1.8} aria-hidden="true" />
                    <h2 className="mt-5 font-display text-2xl font-medium uppercase leading-tight text-bone">{mode.label}</h2>
                    <p className="mt-1.5 font-mono text-xs uppercase tracking-[0.16em] text-crimson-glow">{mode.strapline}</p>
                    <p className="mt-4 flex-1 typo-body text-base text-bone-muted">{mode.detail}</p>
                    <span className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone transition-colors group-hover:text-gold-bright">
                      Select <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
