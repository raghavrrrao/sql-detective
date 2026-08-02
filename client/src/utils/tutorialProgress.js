import { readJson, writeJson } from './storage';

/**
 * Whether the detective at the keyboard has been through training.
 *
 * Deliberately *scoped*, not machine-wide, and that single choice is what
 * produces the two different behaviours the two modes need:
 *
 *   Personal — the scope is the player's own, and nothing routinely clears it,
 *   so training runs automatically the first time and never again.
 *
 *   Festival — the scope is wiped by "next detective", so the record dies with
 *   the session it belonged to. The next participant is asked afresh, which is
 *   correct: they are a different person, and a queue of students cannot
 *   inherit an answer given by whoever sat down before them.
 *
 * `completed` means *answered*, not *finished*. Skipping counts, because the
 * question a mode asks is only ever "does this person still need offering the
 * tutorial", and somebody who declined it has answered that.
 */
const KEY = 'training';
const TRAINING_VERSION = 1;

export function hasCompletedTraining() {
  const stored = readJson(KEY, null);
  return Boolean(stored && stored.version === TRAINING_VERSION && stored.completed);
}

/** @param {'completed'|'skipped'} how */
export function markTrainingComplete(how = 'completed') {
  writeJson(KEY, { version: TRAINING_VERSION, completed: true, how, at: new Date().toISOString() });
}

/** Clears the record so training is offered again. */
export function resetTraining() {
  writeJson(KEY, { version: TRAINING_VERSION, completed: false });
}

export function getTrainingRecord() {
  return readJson(KEY, null);
}

/** The storage key, so a scope wipe can deliberately preserve it. */
export const TRAINING_KEY = KEY;
