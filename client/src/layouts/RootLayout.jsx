import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ModeSelectionGate } from '../components/ModeSelectionGate';
import { TrainingInvitation } from '../components/TrainingInvitation';
import { SoundProvider } from '../context/SoundContext';
import { GameModeProvider, useGameMode } from '../state/gameMode';
import { hasCompletedTraining } from '../utils/tutorialProgress';
import { useRouteMusic } from '../audio/useRouteMusic';

/**
 * Keying the outlet on the session nonce is what lets the app reset itself
 * without anyone touching the browser: clearing a session or switching modes
 * bumps the nonce, every screen unmounts, and the next render reads storage
 * from scratch.
 */
function Routes() {
  const { sessionNonce, hasChosenMode, needsDetectiveName, isFestival } = useGameMode();
  const location = useLocation();
  // The bed follows navigation; it never restarts for a route that shares one.
  useRouteMusic();
  const isReady = hasChosenMode && !needsDetectiveName;

  /*
   * The training record is read live rather than captured: answering it writes
   * the flag and then navigates, and a captured value would send the recruit
   * straight back into the tutorial they just answered for.
   *
   * The record is stored in the active scope, which is what makes the two
   * modes behave differently without either of them knowing about the other.
   * A festival scope is wiped by "next detective", so the question returns for
   * each new participant; a personal scope is not, so it is asked once.
   */
  const needsTraining = isReady && !hasCompletedTraining();

  /*
   * Festival asks rather than assumes. The machine is shared, the next person
   * in the queue is a stranger, and sending an experienced player through a
   * three-minute tutorial they did not ask for is how a stand loses its queue.
   */
  if (needsTraining && isFestival) {
    return <TrainingInvitation />;
  }

  // Personal has only ever had one player, so the first launch just starts.
  if (needsTraining && location.pathname !== '/training') {
    return <Navigate to="/training" replace />;
  }

  return (
    <>
      <ModeSelectionGate />
      {isReady && <Outlet key={sessionNonce} />}
    </>
  );
}

/** Owns the persistent providers shared by every route. */
export function RootLayout() {
  return (
    <GameModeProvider>
      <SoundProvider>
        <Routes />
      </SoundProvider>
    </GameModeProvider>
  );
}
