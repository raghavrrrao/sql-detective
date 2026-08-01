/**
 * The scoring engine.
 *
 * One engine for both modes: a personal player and a festival competitor are
 * graded identically, so a leaderboard entry means the same thing as a solved
 * case. Every input is something the game already records.
 *
 * The shape is a base value per case, scaled by how the investigation was run.
 * Accuracy and hints can only take away; coverage, efficiency, objectives and
 * speed can only add. Nobody is punished for being thorough or careful.
 */

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

/** Weightings. They add to 1 so the bonus band is easy to reason about. */
const WEIGHTS = { coverage: 0.34, objectives: 0.26, efficiency: 0.2, speed: 0.2 };

/** The most a perfect run can add on top of the base value. */
const MAX_BONUS = 0.5;

/** A wrong accusation costs a fifth, down to a floor. */
const WRONG_ACCUSATION_COST = 0.2;
const ACCURACY_FLOOR = 0.4;

/** Each hint costs a twelfth of the case, capped so hints stay usable. */
const HINT_COST = 1 / 12;
const MAX_HINT_COST = 0.4;

/** "35 Minutes" / "25–30 Minutes" → milliseconds, from the lower bound. */
export function parseEstimate(estimate) {
  const match = String(estimate ?? '').match(/(\d+)/);
  return match ? Number(match[1]) * 60_000 : null;
}

/**
 * @param {object} input
 * @param {number} input.baseScore        the case's own maximum, before bonuses
 * @param {number} input.attempts         formal accusations filed, including the winning one
 * @param {number} input.hintsUsed
 * @param {number} input.elapsedMs
 * @param {string} input.estimate         the case's target time
 * @param {object} input.coverage         { discoveries, sources, timeline, queries }
 * @param {object} input.thresholds       the case's verdict thresholds
 * @param {object} input.objectives       { done, total }
 * @returns {{score: number, breakdown: object}}
 */
export function computeScore({
  baseScore = 1000,
  attempts = 1,
  hintsUsed = 0,
  elapsedMs = 0,
  estimate = null,
  coverage = {},
  thresholds = {},
  objectives = { done: 0, total: 0 },
}) {
  const required = {
    discoveries: thresholds.discoveries ?? 20,
    sources: thresholds.sources ?? 5,
    timeline: thresholds.timeline ?? 6,
  };

  // --- coverage: how far past the minimum the file was taken ---------------
  const coverageParts = [
    (coverage.discoveries ?? 0) / required.discoveries,
    (coverage.sources ?? 0) / required.sources,
    (coverage.timeline ?? 0) / required.timeline,
  ].map((ratio) => clamp(ratio - 1, 0, 1));
  const coverageShare = coverageParts.reduce((sum, value) => sum + value, 0) / coverageParts.length;

  // --- objectives: how much of the case's own checklist was worked ---------
  const objectiveShare = objectives.total > 0 ? clamp(objectives.done / objectives.total, 0, 1) : 0;

  // --- efficiency: reaching the answer without brute-forcing the schema ----
  // Par is one query per required source plus a working margin. Going far over
  // is not punished, it simply stops earning.
  const par = required.sources * 3;
  const queries = coverage.queries ?? 0;
  const efficiencyShare = queries > 0 ? clamp(1 - Math.max(0, queries - par) / (par * 2), 0, 1) : 0;

  // --- speed: a bonus only, never a penalty --------------------------------
  const target = parseEstimate(estimate);
  const speedShare = target && elapsedMs > 0 ? clamp(1 - elapsedMs / target, 0, 1) : 0;

  const bonus = MAX_BONUS * (
    coverageShare * WEIGHTS.coverage
    + objectiveShare * WEIGHTS.objectives
    + efficiencyShare * WEIGHTS.efficiency
    + speedShare * WEIGHTS.speed
  );

  const wrongAccusations = Math.max(0, attempts - 1);
  const accuracy = clamp(1 - wrongAccusations * WRONG_ACCUSATION_COST, ACCURACY_FLOOR, 1);
  const hintCost = clamp(hintsUsed * HINT_COST, 0, MAX_HINT_COST);

  const multiplier = Math.max(0, accuracy * (1 + bonus) - hintCost);
  const score = Math.max(0, Math.round((baseScore * multiplier) / 10) * 10);

  return {
    score,
    breakdown: {
      baseScore,
      accuracy: Math.round(accuracy * 100),
      wrongAccusations,
      hintsUsed,
      hintPenalty: Math.round(hintCost * 100),
      coverageBonus: Math.round(coverageShare * WEIGHTS.coverage * MAX_BONUS * 100),
      objectiveBonus: Math.round(objectiveShare * WEIGHTS.objectives * MAX_BONUS * 100),
      efficiencyBonus: Math.round(efficiencyShare * WEIGHTS.efficiency * MAX_BONUS * 100),
      speedBonus: Math.round(speedShare * WEIGHTS.speed * MAX_BONUS * 100),
      totalBonus: Math.round(bonus * 100),
    },
  };
}
