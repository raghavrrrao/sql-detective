import { createContext, useContext, useMemo, useState } from 'react';

const SoundContext = createContext(null);

/**
 * Sound state is deliberately UI-only until a future release provides licensed
 * audio assets and playback controls.
 */
export function SoundProvider({ children }) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const value = useMemo(() => ({
    isSoundEnabled,
    toggleSound: () => setIsSoundEnabled((enabled) => !enabled),
  }), [isSoundEnabled]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within SoundProvider.');
  return context;
}
