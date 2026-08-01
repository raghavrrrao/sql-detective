import { createContext, useContext, useMemo } from 'react';
import { useGameMode } from '../state/gameMode';

const SoundContext = createContext(null);

/**
 * Audio preferences.
 *
 * Music and effects are tracked separately and saved with the machine's other
 * settings, so a festival laptop keeps its choice across every participant.
 * Nothing plays yet — these are the switches a later release will read once
 * licensed audio ships.
 */
export function SoundProvider({ children }) {
  const { music, soundEffects, setMusic, setSoundEffects } = useGameMode();

  const value = useMemo(() => ({
    music,
    soundEffects,
    setMusic,
    setSoundEffects,
    // Kept for the header toggle, which controls effects.
    isSoundEnabled: soundEffects,
    toggleSound: () => setSoundEffects(!soundEffects),
  }), [music, soundEffects, setMusic, setSoundEffects]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within SoundProvider.');
  return context;
}
