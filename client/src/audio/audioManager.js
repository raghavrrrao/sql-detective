import { MUSIC, SFX, audioUrls, hasAudio } from './manifest';

/**
 * The audio manager.
 *
 * One module-level instance owns every sound in the game. It is deliberately
 * built on plain `<audio>` elements rather than WebAudio: the game needs
 * lazy loading, a handful of simultaneous voices and linear fades, and an
 * AudioContext buys none of that while adding a second thing that has to be
 * unlocked by a gesture.
 *
 * Four rules govern everything here:
 *
 *  1. Nothing is fetched until it is asked for. Elements are created with
 *     `preload="none"` and cached after first use, so the landing page costs
 *     zero audio bytes until the player does something.
 *
 *  2. Nothing plays before the browser allows it. Autoplay policy rejects
 *     playback that has no user gesture behind it, so the first requested
 *     track is *remembered* rather than forced, and starts on the first real
 *     interaction. `play()` rejections are swallowed, never logged as errors.
 *
 *  3. Music never stops abruptly. Every change is a crossfade; the outgoing
 *     track is faded and only then paused.
 *
 *  4. A missing or unplayable file is silence, not a crash. Every entry point
 *     checks the manifest first and every DOM call is guarded.
 */

const FADE_MS = 750;
const FADE_STEP_MS = 50;
/** How many copies of one effect may overlap before the oldest is reused. */
const VOICES = 3;

const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));

class AudioManager {
  constructor() {
    this.settings = {
      master: 0.8,
      music: 0.7,
      sfx: 0.8,
      musicEnabled: true,
      ambientEnabled: true,
      sfxEnabled: true,
    };
    /** key -> { voices: HTMLAudioElement[], next: number } */
    this.sfxPool = new Map();
    this.lastPlayed = new Map();
    this.current = null;          // { id, el, fade }
    this.pendingTrack = null;     // requested before the browser would allow it
    this.unlocked = false;
    this.available = typeof window !== 'undefined' && typeof Audio !== 'undefined';
  }

  /* ------------------------------------------------------------ settings */

  applySettings(next) {
    this.settings = { ...this.settings, ...next };
    // A live track follows the sliders without restarting.
    if (this.current?.el && !this.current.fade) {
      this.current.el.volume = this.musicVolumeFor(this.current.id);
    }
    if (!this.musicAllowed() && this.current) this.stopMusic({ fade: 400 });
    else if (this.musicAllowed() && !this.current && this.pendingTrack) {
      this.playMusic(this.pendingTrack);
    }
  }

  musicAllowed() {
    return this.settings.musicEnabled && this.settings.ambientEnabled;
  }

  musicVolumeFor(id) {
    const track = MUSIC[id];
    if (!track) return 0;
    return clamp(track.volume * this.settings.music * this.settings.master);
  }

  /* -------------------------------------------------------------- unlock */

  /**
   * Called from the first real user gesture. Everything before this point is
   * remembered rather than played, which is what keeps the console free of
   * autoplay rejections.
   */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.pendingTrack) this.playMusic(this.pendingTrack);
  }

  /* ----------------------------------------------------------------- sfx */

  /** @param {keyof typeof SFX} name */
  playSfx(name) {
    if (!this.available || !this.unlocked) return;
    if (!this.settings.sfxEnabled) return;

    const spec = SFX[name];
    if (!spec || !hasAudio(spec.key)) return;   // unknown or missing: silence

    const now = Date.now();
    const last = this.lastPlayed.get(name) ?? 0;
    if (now - last < (spec.throttle ?? 60)) return;   // spam guard
    this.lastPlayed.set(name, now);

    try {
      let pool = this.sfxPool.get(name);
      if (!pool) {
        pool = { voices: [], next: 0 };
        this.sfxPool.set(name, pool);
      }
      // Voices are created lazily and then reused, so a click that fires a
      // thousand times allocates three elements in total.
      let el = pool.voices[pool.next];
      if (!el) {
        el = new Audio(audioUrls[spec.key]);
        el.preload = 'auto';
        pool.voices[pool.next] = el;
      }
      pool.next = (pool.next + 1) % VOICES;

      el.currentTime = 0;
      el.volume = clamp(spec.volume * this.settings.sfx * this.settings.master);
      const played = el.play();
      if (played?.catch) played.catch(() => {});
    } catch {
      /* A device that cannot play this sound simply does not. */
    }
  }

  /* --------------------------------------------------------------- music */

  /** @param {keyof typeof MUSIC} id */
  playMusic(id) {
    if (!this.available) return;
    const track = MUSIC[id];
    if (!track || !hasAudio(track.key)) return;

    // Already the current bed: leave it alone rather than restarting it.
    if (this.current?.id === id) return;

    if (!this.unlocked || !this.musicAllowed()) {
      // Remember the intent; the gesture (or the setting) will start it.
      this.pendingTrack = this.musicAllowed() ? id : this.pendingTrack;
      return;
    }
    this.pendingTrack = id;

    try {
      const el = new Audio(audioUrls[track.key]);
      el.preload = 'auto';
      el.loop = Boolean(track.loop);
      el.volume = 0;

      const outgoing = this.current;
      this.current = { id, el, fade: true };

      const played = el.play();
      if (played?.catch) played.catch(() => { this.current = null; });

      this.crossfade(outgoing, { el, target: this.musicVolumeFor(id) });
    } catch {
      this.current = null;
    }
  }

  /** Ramps one track down and the next up over the same window. */
  crossfade(outgoing, incoming) {
    const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP_MS));
    let step = 0;
    const from = outgoing?.el?.volume ?? 0;

    if (outgoing?.fadeTimer) window.clearInterval(outgoing.fadeTimer);

    const timer = window.setInterval(() => {
      step += 1;
      const t = step / steps;
      try {
        if (incoming?.el) incoming.el.volume = clamp(incoming.target * t);
        if (outgoing?.el) outgoing.el.volume = clamp(from * (1 - t));
      } catch { /* element torn down mid-fade */ }

      if (step >= steps) {
        window.clearInterval(timer);
        if (outgoing?.el) {
          try { outgoing.el.pause(); outgoing.el.src = ''; } catch { /* already gone */ }
        }
        if (this.current?.el === incoming?.el) this.current.fade = false;
      }
    }, FADE_STEP_MS);

    if (this.current) this.current.fadeTimer = timer;
  }

  stopMusic({ fade = FADE_MS } = {}) {
    const outgoing = this.current;
    this.current = null;
    if (!outgoing?.el) return;

    if (fade <= 0) {
      try { outgoing.el.pause(); outgoing.el.src = ''; } catch { /* already gone */ }
      return;
    }
    const steps = Math.max(1, Math.round(fade / FADE_STEP_MS));
    const from = outgoing.el.volume;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      try { outgoing.el.volume = clamp(from * (1 - step / steps)); } catch { /* gone */ }
      if (step >= steps) {
        window.clearInterval(timer);
        try { outgoing.el.pause(); outgoing.el.src = ''; } catch { /* gone */ }
      }
    }, FADE_STEP_MS);
  }

  /** The track currently playing, for tests and for the settings screen. */
  nowPlaying() {
    return this.current?.id ?? null;
  }
}

export const audio = new AudioManager();

/**
 * Installs the one-time gesture listener that satisfies autoplay policy.
 * Returns a teardown function.
 */
export function installAudioUnlock() {
  if (typeof window === 'undefined') return () => {};
  const unlock = () => audio.unlock();
  const events = ['pointerdown', 'keydown', 'touchstart'];
  events.forEach((type) => window.addEventListener(type, unlock, { once: true, passive: true }));
  return () => events.forEach((type) => window.removeEventListener(type, unlock));
}
