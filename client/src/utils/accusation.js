import { getCaseThresholds } from '../catalog/caseCatalog';
import { isAccused } from './caseSolution';

/**
 * The accusation gate and the verdict engine.
 *
 * Two rules govern everything here:
 *
 *  1. Readiness is measured against the player's own file — how much they have
 *     recovered and how widely — never against the solution. The player is
 *     told how close they are, never what the conditions are.
 *
 *  2. A verdict that is not proven returns exactly one message. It never
 *     distinguishes "wrong person" from "thin file", because a player who
 *     could tell those apart could brute-force the roster.
 *
 * Both gates read their numbers from the case catalog, so a twenty-row
 * tutorial and a hundred-and-eighty-row expert case can use the same code
 * without one of them becoming unwinnable.
 */

/** What the file has to look like before a formal accusation is allowed. */
function readinessChecks(limits) {
  return [
    { id: 'victim', test: ({ reach }) => !limits.requireVictim || reach.tables.includes('victims') },
    { id: 'suspects', test: ({ intel }) => intel.filter((profile) => profile.status !== 'unknown').length >= limits.suspects },
    { id: 'volume', test: ({ discoveries }) => discoveries.length >= limits.discoveries },
    { id: 'breadth', test: ({ reach }) => reach.tables.length >= limits.sources },
  ];
}

/** What a proven case needs on top of naming the right person. */
function corroborationChecks(limits) {
  return [
    { id: 'citations', test: ({ evidenceKeys }) => evidenceKeys.length >= limits.citations },
    { id: 'volume', test: ({ discoveries }) => discoveries.length >= limits.discoveries },
    { id: 'breadth', test: ({ reach }) => reach.tables.length >= limits.sources },
    { id: 'timeline', test: ({ timeline }) => timeline.length >= limits.timeline },
  ];
}

const readinessMessages = [
  'There is almost nothing on file yet.',
  'The file is thin. Keep pulling records.',
  'The file is taking shape.',
  'You are close to having a case.',
];

export const READY_MESSAGE = 'You have enough on file to make a formal accusation.';

/** The one thing a failed accusation is ever allowed to say. */
export const NOT_PROVEN_MESSAGE = 'Your accusation is not sufficiently supported by the evidence you have collected. Continue investigating.';

/**
 * @returns {{isReady: boolean, progress: number, message: string, needsNewEvidence: boolean}}
 */
export function assessReadiness(state) {
  const checks = readinessChecks(getCaseThresholds(state.caseId).readiness);
  const passed = checks.filter((check) => check.test(state)).length;
  const progress = passed / checks.length;
  const isReady = passed === checks.length;

  // After a failed accusation the player has to turn something new up before
  // trying again — otherwise the roster can simply be worked through in order.
  const needsNewEvidence = Boolean(
    state.lastAccusationDiscoveryCount !== null
    && state.lastAccusationDiscoveryCount !== undefined
    && state.discoveries.length <= state.lastAccusationDiscoveryCount,
  );

  if (isReady && needsNewEvidence) {
    return {
      isReady: false,
      progress,
      needsNewEvidence: true,
      message: 'Nothing new has come in since your last accusation.',
    };
  }

  return {
    isReady,
    progress,
    needsNewEvidence: false,
    message: isReady
      ? READY_MESSAGE
      : readinessMessages[Math.min(passed, readinessMessages.length - 1)],
  };
}

/**
 * Grades an accusation.
 *
 * Free-text reasoning is deliberately not an input — it is immersion, not an
 * answer field.
 *
 * @returns {{proven: boolean, coverage: object}}
 */
export function evaluateAccusation({ difficulty, suspect, evidenceKeys, discoveries, reach, timeline }) {
  const context = { evidenceKeys, discoveries, reach, timeline };
  const corroborated = corroborationChecks(getCaseThresholds(difficulty).verdict)
    .every((check) => check.test(context));
  const namedCorrectly = isAccused(difficulty, suspect);

  return {
    proven: namedCorrectly && corroborated,
    // Coverage is the player's own file measured back to them, so it carries
    // nothing they did not already have. It is shown on a win only.
    coverage: {
      citations: evidenceKeys.length,
      discoveries: discoveries.length,
      sources: reach.tables.length,
      timeline: timeline.length,
      queries: reach.successes + reach.failures,
    },
  };
}
