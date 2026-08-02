import { readGlobalJson, SCOPES, setStorageScope, writeGlobalJson } from './storage';

/**
 * Machine settings: which mode this laptop is running in, who is currently at
 * the keyboard, and the audio switches. These live outside the storage scope
 * so that handing the machine to the next participant never loses them.
 */
const SETTINGS_KEY = 'settings';
const SETTINGS_VERSION = 1;

export const APP_VERSION = '1.0.0';

export const GAME_MODES = { personal: 'personal', festival: 'festival' };

export const NAME_MAX_LENGTH = 20;

const defaults = {
  version: SETTINGS_VERSION,
  // null means the player has not chosen yet, which is what shows the welcome.
  mode: null,
  detectiveName: '',
  // `music` and `soundEffects` predate the mixer and are kept as the two
  // master switches so existing saves keep working untouched.
  music: true,
  soundEffects: true,
  // The mixer. Stored 0–1; the UI shows whole percentages.
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  // Ambience is separable from music: a stand may want the beds off while
  // keeping the stings that confirm an action.
  ambient: true,
};

export function readSettings() {
  const stored = readGlobalJson(SETTINGS_KEY, null);
  if (!stored || typeof stored !== 'object') return { ...defaults };
  return {
    ...defaults,
    ...stored,
    mode: stored.mode === GAME_MODES.personal || stored.mode === GAME_MODES.festival ? stored.mode : null,
    detectiveName: typeof stored.detectiveName === 'string' ? stored.detectiveName.slice(0, NAME_MAX_LENGTH) : '',
    music: stored.music !== false,
    soundEffects: stored.soundEffects !== false,
    ambient: stored.ambient !== false,
    masterVolume: level(stored.masterVolume, defaults.masterVolume),
    musicVolume: level(stored.musicVolume, defaults.musicVolume),
    sfxVolume: level(stored.sfxVolume, defaults.sfxVolume),
    version: SETTINGS_VERSION,
  };
}

/** A stored volume is only trusted if it is a real number inside 0–1. */
function level(value, fallback) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
}

export function writeSettings(changes) {
  const next = { ...readSettings(), ...changes, version: SETTINGS_VERSION };
  writeGlobalJson(SETTINGS_KEY, next);
  return next;
}

/** Points every scoped read and write at the storage belonging to this mode. */
export function applyScopeForMode(mode) {
  setStorageScope(mode === GAME_MODES.festival ? SCOPES.festival : SCOPES.personal);
}

/** Trims and validates a detective name. @returns {string} '' when unusable */
export function normaliseDetectiveName(raw) {
  return String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX_LENGTH);
}
