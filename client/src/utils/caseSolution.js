/**
 * The only place in the client that knows who did it.
 *
 * Nothing else may import the killer's name, and nothing may read it before a
 * verdict has been proven. Everything else the Case Closed screen shows —
 * motive, method, the killer's own timeline, the hidden secret — is fetched
 * from the case database at reveal time through the ordinary read-only query
 * API, so this file stays as small as it possibly can be.
 *
 * CAVEAT, stated plainly: these three names ship inside the JavaScript bundle,
 * so anyone who opens developer tools can read them. Grading a verdict without
 * that exposure needs a server endpoint that checks the accusation, and the
 * backend is out of scope for this sprint. Treat the accusation as an honour
 * system, exactly as it would be on paper.
 */
const solutions = {
  // `killer` is the field name the verdict engine has always used. In a theft
  // case it means the person responsible; the UI never prints the field name.
  beginner: { killer: 'Daniel Okafor' },
  easy: { killer: 'Daniel Reed' },
  intermediate: { killer: 'Ruben Castellanos' },
  medium: { killer: 'Marcus Vane' },
  expert: { killer: 'Renata Silva' },
};

/** @returns {{killer: string}|null} */
export function getSolution(difficulty) {
  return solutions[difficulty] ?? null;
}

/**
 * The single question the verdict engine is allowed to ask. Returns a plain
 * boolean so no caller ever ends up holding the name by accident.
 */
export function isAccused(difficulty, suspectName) {
  const solution = solutions[difficulty];
  return Boolean(solution) && solution.killer === suspectName;
}
