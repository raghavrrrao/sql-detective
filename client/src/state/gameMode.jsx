import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { clearLeaderboard as wipeLeaderboard } from '../utils/leaderboard';
import { SCOPES, clearScope } from '../utils/storage';
import { TRAINING_KEY } from '../utils/tutorialProgress';
import {
  APP_VERSION,
  GAME_MODES,
  applyScopeForMode,
  normaliseDetectiveName,
  readSettings,
  writeSettings,
} from '../utils/gameSettings';

const GameModeContext = createContext(null);

/**
 * Which mode this machine is running in, and who is currently at the keyboard.
 *
 * The storage scope is pointed at the right place *before* any child renders,
 * so every existing store — progress, sessions, reports — lands in the right
 * bucket without knowing that modes exist.
 *
 * `sessionNonce` is how the app avoids ever asking anyone to refresh the
 * browser: bumping it remounts the route tree, so every screen re-reads
 * storage from scratch.
 */
export function GameModeProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const initial = readSettings();
    applyScopeForMode(initial.mode);
    return initial;
  });
  const [sessionNonce, setSessionNonce] = useState(0);

  const apply = useCallback((changes, { remount = false } = {}) => {
    const next = writeSettings(changes);
    applyScopeForMode(next.mode);
    setSettings(next);
    if (remount) setSessionNonce((value) => value + 1);
    return next;
  }, []);

  /** First launch, or a deliberate switch from Settings. */
  const chooseMode = useCallback((mode, { detectiveName = '' } = {}) => {
    // Switching modes must never carry one participant's work into the other.
    if (mode === GAME_MODES.festival) clearScope(SCOPES.festival);
    return apply({ mode, detectiveName: normaliseDetectiveName(detectiveName) }, { remount: true });
  }, [apply]);

  const registerDetective = useCallback((name) => {
    const clean = normaliseDetectiveName(name);
    if (clean === '') return null;
    return apply({ detectiveName: clean }, { remount: true });
  }, [apply]);

  /**
   * Hands the machine to the next participant: every scrap of the finished
   * investigation goes, the leaderboard and the machine's settings stay.
   */
  const startNextDetective = useCallback(() => {
    clearScope(SCOPES.festival);
    return apply({ detectiveName: '' }, { remount: true });
  }, [apply]);

  /**
   * Clears the current investigation but keeps the detective at the keyboard —
   * and keeps their training record, because wiping a session is not a reason
   * to put somebody back through the tutorial.
   */
  const clearCurrentSession = useCallback(() => {
    clearScope(
      settings.mode === GAME_MODES.festival ? SCOPES.festival : SCOPES.personal,
      { keep: [TRAINING_KEY] },
    );
    setSessionNonce((value) => value + 1);
  }, [settings.mode]);

  const resetPersonalProgress = useCallback(() => {
    clearScope(SCOPES.personal);
    setSessionNonce((value) => value + 1);
  }, []);

  const clearLeaderboard = useCallback(() => {
    wipeLeaderboard();
    setSessionNonce((value) => value + 1);
  }, []);

  const setMusic = useCallback((music) => apply({ music }), [apply]);
  const setSoundEffects = useCallback((soundEffects) => apply({ soundEffects }), [apply]);

  const value = useMemo(() => ({
    ...settings,
    appVersion: APP_VERSION,
    isFestival: settings.mode === GAME_MODES.festival,
    isPersonal: settings.mode === GAME_MODES.personal,
    hasChosenMode: settings.mode !== null,
    needsDetectiveName: settings.mode === GAME_MODES.festival && settings.detectiveName === '',
    sessionNonce,
    chooseMode,
    registerDetective,
    startNextDetective,
    clearCurrentSession,
    resetPersonalProgress,
    clearLeaderboard,
    setMusic,
    setSoundEffects,
  }), [
    settings, sessionNonce, chooseMode, registerDetective, startNextDetective,
    clearCurrentSession, resetPersonalProgress, clearLeaderboard, setMusic, setSoundEffects,
  ]);

  return <GameModeContext.Provider value={value}>{children}</GameModeContext.Provider>;
}

export function useGameMode() {
  const context = useContext(GameModeContext);
  if (!context) throw new Error('useGameMode must be used inside GameModeProvider.');
  return context;
}
