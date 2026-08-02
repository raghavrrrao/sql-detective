import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { audio, installAudioUnlock } from '../audio/audioManager';
import { useGameMode } from '../state/gameMode';

const SoundContext = createContext(null);

/**
 * Audio for the whole game.
 *
 * This used to be a pair of switches with nothing behind them. It now drives a
 * real mixer: two master switches (music, effects), a separable ambience
 * toggle, and three volume levels, all persisted with the machine's other
 * settings so a festival laptop keeps its mix across every participant.
 *
 * The provider owns exactly one side effect — pushing settings into the audio
 * manager, plus the one-time gesture listener that satisfies browser autoplay
 * policy. Nothing here ever calls `play()` on mount.
 */
export function SoundProvider({ children }) {
  const {
    music, soundEffects, ambient, masterVolume, musicVolume, sfxVolume,
    setMusic, setSoundEffects, setAmbient, setMasterVolume, setMusicVolume, setSfxVolume,
  } = useGameMode();

  // Autoplay policy: the first pointer or key press is what makes any of this
  // audible. Before that the manager only remembers what was asked for.
  useEffect(() => installAudioUnlock(), []);

  useEffect(() => {
    audio.applySettings({
      master: masterVolume,
      music: musicVolume,
      sfx: sfxVolume,
      musicEnabled: music,
      ambientEnabled: ambient,
      sfxEnabled: soundEffects,
    });
  }, [music, soundEffects, ambient, masterVolume, musicVolume, sfxVolume]);

  const playSfx = useCallback((name) => audio.playSfx(name), []);
  const playMusic = useCallback((id) => audio.playMusic(id), []);
  const stopMusic = useCallback((options) => audio.stopMusic(options), []);

  const value = useMemo(() => ({
    music,
    soundEffects,
    ambient,
    masterVolume,
    musicVolume,
    sfxVolume,
    setMusic,
    setSoundEffects,
    setAmbient,
    setMasterVolume,
    setMusicVolume,
    setSfxVolume,
    playSfx,
    playMusic,
    stopMusic,
    // The header toggle has always controlled effects specifically.
    isSoundEnabled: soundEffects,
    toggleSound: () => setSoundEffects(!soundEffects),
  }), [
    music, soundEffects, ambient, masterVolume, musicVolume, sfxVolume,
    setMusic, setSoundEffects, setAmbient, setMasterVolume, setMusicVolume, setSfxVolume,
    playSfx, playMusic, stopMusic,
  ]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within SoundProvider.');
  return context;
}

/**
 * Effects only. Components that just want to make a noise on click subscribe
 * here rather than to the whole mixer.
 */
export function useSfx() {
  const { playSfx } = useSound();
  return playSfx;
}
