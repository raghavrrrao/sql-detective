import { Outlet } from 'react-router-dom';
import { ModeSelectionGate } from '../components/ModeSelectionGate';
import { SoundProvider } from '../context/SoundContext';
import { GameModeProvider, useGameMode } from '../state/gameMode';

/**
 * Keying the outlet on the session nonce is what lets the app reset itself
 * without anyone touching the browser: clearing a session or switching modes
 * bumps the nonce, every screen unmounts, and the next render reads storage
 * from scratch.
 */
function Routes() {
  const { sessionNonce, hasChosenMode, needsDetectiveName } = useGameMode();
  const isReady = hasChosenMode && !needsDetectiveName;

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
