/**
 * The audio manifest.
 *
 * Every file under `src/audio` is resolved to a hashed URL at build time, so
 * adding a sound is a matter of dropping the file in the right folder — no
 * import line, no registration. The URLs are strings; the audio itself is only
 * fetched when something actually asks to play it.
 *
 * A key is the path without the extension: `ui/button-click`, `ambience/main-menu`.
 */
const files = import.meta.glob('./**/*.mp3', { eager: true, query: '?url', import: 'default' });

export const audioUrls = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.replace(/^\.\//, '').replace(/\.mp3$/, ''), url]),
);

export const hasAudio = (key) => Boolean(audioUrls[key]);

/**
 * Music beds. `volume` is the track's own level before the player's music and
 * master sliders are applied — the mix, not the setting.
 */
export const MUSIC = {
  menu: { key: 'ambience/main-menu', volume: 0.20, loop: true },
  briefing: { key: 'ambience/briefing', volume: 0.18, loop: true },
  investigation: { key: 'ambience/investigation', volume: 0.15, loop: true },
  tutorial: { key: 'ambience/tutorial', volume: 0.15, loop: true },
  solved: { key: 'gameplay/case-solved', volume: 0.30, loop: false },
  splash: { key: 'gameplay/splash', volume: 0.28, loop: false },
};

/**
 * Effects, with the shortest sensible gap between repeats. A click can fire
 * ten times a second and should; a cinematic sting must not stack on itself.
 */
export const SFX = {
  click: { key: 'ui/button-click', volume: 0.5, throttle: 40 },
  hover: { key: 'ui/button-hover', volume: 0.22, throttle: 90 },
  modalOpen: { key: 'ui/modal-open', volume: 0.45, throttle: 200 },
  modalClose: { key: 'ui/modal-close', volume: 0.4, throttle: 200 },
  notification: { key: 'ui/notification', volume: 0.45, throttle: 300 },

  execute: { key: 'terminal/execute', volume: 0.5, throttle: 120 },
  querySuccess: { key: 'terminal/query-success', volume: 0.4, throttle: 250 },
  queryError: { key: 'terminal/query-error', volume: 0.45, throttle: 250 },
  typing: { key: 'terminal/typing', volume: 0.18, throttle: 700 },

  notebookOpen: { key: 'notebook/notebook-open', volume: 0.45, throttle: 250 },
  notebookClose: { key: 'notebook/notebook-close', volume: 0.4, throttle: 250 },
  pageTurn: { key: 'notebook/page-turn', volume: 0.35, throttle: 120 },
  paperSlide: { key: 'notebook/paper-slide', volume: 0.3, throttle: 150 },

  discovery: { key: 'discoveries/discovery', volume: 0.42, throttle: 350 },
  evidenceFound: { key: 'discoveries/evidence-found', volume: 0.45, throttle: 350 },
  objectiveComplete: { key: 'discoveries/objective-complete', volume: 0.45, throttle: 400 },
  investigationProgress: { key: 'discoveries/investigation-progress', volume: 0.35, throttle: 400 },
  hint: { key: 'discoveries/hint', volume: 0.45, throttle: 400 },

  accuse: { key: 'gameplay/accuse', volume: 0.5, throttle: 800 },
  wrongAccusation: { key: 'gameplay/wrong-accusation', volume: 0.5, throttle: 800 },
  unlock: { key: 'gameplay/unlock', volume: 0.5, throttle: 600 },
  stars: { key: 'gameplay/stars', volume: 0.5, throttle: 600 },
};
