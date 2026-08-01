import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, House, Music, ShieldAlert, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { SectionHeading } from '../components/SectionHeading';
import { GAME_MODES } from '../utils/gameSettings';
import { useGameMode } from '../state/gameMode';

function Row({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-5 last:border-0">
      <div className="min-w-[14rem] flex-1">
        <p className="text-base font-semibold text-bone">{title}</p>
        {description && <p className="mt-1 text-sm leading-6 text-bone-dim">{description}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2.5">{children}</div>
    </div>
  );
}

function Toggle({ label, isOn, onChange, icon: Icon }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={() => onChange(!isOn)}
      className={`clip-corner-sm inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition-colors ${
        isOn
          ? 'border-verdict-clear/50 bg-verdict-clear/12 text-verdict-clear'
          : 'border-white/12 bg-white/[0.04] text-bone-dim hover:border-white/30'
      }`}
    >
      <Icon size={15} strokeWidth={2.2} aria-hidden="true" /> {label}: {isOn ? 'On' : 'Off'}
    </button>
  );
}

const danger = 'clip-corner-sm inline-flex items-center gap-2 border border-verdict-alert/45 bg-verdict-alert/10 px-4 py-2.5 text-sm font-semibold text-verdict-alert transition-colors hover:bg-verdict-alert/20';
const neutral = 'clip-corner-sm inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-bone-muted transition-colors hover:border-gold/45 hover:text-gold-bright';

export function SettingsPage() {
  const {
    mode, isFestival, detectiveName, music, soundEffects, appVersion,
    chooseMode, clearCurrentSession, resetPersonalProgress, clearLeaderboard, setMusic, setSoundEffects,
  } = useGameMode();

  // Every destructive action goes through the same confirmation.
  const [pending, setPending] = useState(null);
  const close = () => setPending(null);

  const confirmations = {
    festival: {
      title: 'Switch to Festival Mode',
      description: 'Festival Mode runs temporary sessions for a shared machine. Any festival investigation currently in progress is cleared so the next participant starts clean.',
      keeps: 'the leaderboard, your settings, and everything saved in Personal Mode.',
      confirmLabel: 'Switch to Festival',
      run: () => chooseMode(GAME_MODES.festival),
    },
    personal: {
      title: 'Switch to Personal Mode',
      description: 'Personal Mode saves your progress on this machine. Your saved cases and reports are exactly as you left them.',
      keeps: 'the leaderboard, your settings, and every case you have already solved.',
      confirmLabel: 'Switch to Personal',
      run: () => chooseMode(GAME_MODES.personal),
    },
    session: {
      title: 'Clear the current session',
      description: 'Clears the investigation in progress — notebook, discoveries, timeline, query history and editor — for every case in this mode.',
      keeps: 'the leaderboard, your settings, and solved-case reports in Personal Mode.',
      confirmLabel: 'Clear session',
      run: clearCurrentSession,
    },
    leaderboard: {
      title: 'Clear the leaderboard',
      description: 'Removes every result recorded on this machine, for every participant.',
      keeps: 'your settings and all investigation progress.',
      confirmLabel: 'Clear leaderboard',
      run: clearLeaderboard,
    },
    progress: {
      title: 'Reset personal progress',
      description: 'Removes every solved case, report, notebook and investigation saved in Personal Mode on this machine.',
      keeps: 'the leaderboard and your settings.',
      confirmLabel: 'Reset progress',
      run: resetPersonalProgress,
    },
  };

  const active = pending ? confirmations[pending] : null;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen overflow-hidden px-6 py-16 sm:px-10 lg:px-16 lg:py-24"
    >
      <AnimatedBackground />
      <div className="relative z-10 mx-auto max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 font-display text-sm font-semibold uppercase tracking-[0.18em] text-bone-dim transition-colors hover:text-gold-bright"
        >
          <ArrowLeft size={16} strokeWidth={2.2} /> Return to briefing
        </Link>

        <div className="pt-16">
          <SectionHeading
            eyebrow="Game settings"
            title="Settings"
            description="How this machine behaves, and the controls for handing it between participants."
          />
        </div>

        <section className="clip-corner panel-surface p-7 shadow-panel">
          <h2 className="font-display text-lg font-semibold uppercase tracking-[0.16em] text-bone">Mode</h2>
          <p className="mt-2 text-sm leading-6 text-bone-dim">
            Currently running in <span className="font-semibold text-bone">{isFestival ? 'Festival Mode' : 'Personal Mode'}</span>
            {isFestival && detectiveName ? ` · Detective ${detectiveName}` : ''}.
          </p>

          <div className="mt-4">
            <Row
              title="Festival Mode"
              description="Shared computer. Temporary sessions, leaderboard only, and a clean slate for each participant."
            >
              <button type="button" onClick={() => setPending('festival')} disabled={isFestival} className={`${neutral} disabled:cursor-not-allowed disabled:opacity-50`}>
                <GraduationCap size={15} strokeWidth={2.2} aria-hidden="true" /> {isFestival ? 'Active' : 'Switch'}
              </button>
            </Row>
            <Row
              title="Personal Mode"
              description="Saves progress, solved cases, notebooks and reports between sessions."
            >
              <button type="button" onClick={() => setPending('personal')} disabled={mode === GAME_MODES.personal} className={`${neutral} disabled:cursor-not-allowed disabled:opacity-50`}>
                <House size={15} strokeWidth={2.2} aria-hidden="true" /> {mode === GAME_MODES.personal ? 'Active' : 'Switch'}
              </button>
            </Row>
          </div>
        </section>

        <section className="clip-corner mt-6 panel-surface p-7 shadow-panel">
          <h2 className="font-display text-lg font-semibold uppercase tracking-[0.16em] text-bone">Audio</h2>
          <p className="mt-2 text-sm leading-6 text-bone-dim">
            These switches are saved now and take effect once the audio pack ships. Nothing plays yet.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Toggle label="Music" icon={Music} isOn={music} onChange={setMusic} />
            <Toggle label="Sound effects" icon={Volume2} isOn={soundEffects} onChange={setSoundEffects} />
          </div>
        </section>

        <LeaderboardPanel className="mt-6" />

        <section className="clip-corner mt-6 border border-verdict-alert/30 panel-surface p-7 shadow-panel">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-[0.16em] text-verdict-alert">
            <ShieldAlert size={18} strokeWidth={2.2} aria-hidden="true" /> Admin
          </h2>
          <p className="mt-2 text-sm leading-6 text-bone-dim">
            Everything here destroys data and asks first. Each one states exactly what survives.
          </p>

          <div className="mt-4">
            <Row title="Clear current session" description="Wipes the investigation in progress for this mode.">
              <button type="button" onClick={() => setPending('session')} className={neutral}>Clear session</button>
            </Row>
            <Row title="Clear leaderboard" description="Removes every recorded result on this machine.">
              <button type="button" onClick={() => setPending('leaderboard')} className={danger}>Clear leaderboard</button>
            </Row>
            <Row title="Reset personal progress" description="Removes every solved case and report saved in Personal Mode.">
              <button type="button" onClick={() => setPending('progress')} className={danger}>Reset progress</button>
            </Row>
          </div>
        </section>

        <p className="mt-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-bone-dim">
          SQL Detective · version {appVersion}
        </p>
      </div>

      <ConfirmDialog
        isOpen={Boolean(active)}
        onClose={close}
        onConfirm={() => active?.run()}
        title={active?.title ?? ''}
        description={active?.description ?? ''}
        keeps={active?.keeps}
        confirmLabel={active?.confirmLabel ?? 'Confirm'}
      />
    </motion.main>
  );
}
