/**
 * MMR (Matchmaking Rating) Calculator
 * Elo-inspired competitive ranking for racing
 */

const DEFAULT_K_FACTOR = 32;

/**
 * Calculate expected score between two players
 */
function expectedScore(playerMMR, opponentMMR) {
  return 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));
}

/**
 * Calculate MMR changes for all pilots after a race
 * @param {Array} results - [{ pilotId, mmr, position }] sorted by position
 * @returns {Array} [{ pilotId, mmrChange, newMmr, oldMmr }]
 */
export function calculateMMRChanges(results, kFactor = DEFAULT_K_FACTOR) {
  const n = results.length;
  if (n < 2) {
    return results.map(r => ({
      pilotId: r.pilotId,
      mmrChange: 0,
      newMmr: r.mmr,
      oldMmr: r.mmr,
    }));
  }

  const changes = [];

  for (const pilot of results) {
    // Average expected score against all opponents
    let totalExpected = 0;
    for (const opponent of results) {
      if (opponent.pilotId === pilot.pilotId) continue;
      totalExpected += expectedScore(pilot.mmr, opponent.mmr);
    }
    const avgExpected = totalExpected / (n - 1);

    // Actual score: 1st = 1.0, last = 0.0
    const actualScore = 1 - (pilot.position - 1) / (n - 1);

    // Scale K by participant count
    const scaledK = kFactor * Math.sqrt(n / 2);

    let mmrChange = Math.round(scaledK * (actualScore - avgExpected));

    // Winner bonus against higher-rated field
    if (pilot.position === 1) {
      const avgOppMMR = results
        .filter(r => r.pilotId !== pilot.pilotId)
        .reduce((s, r) => s + r.mmr, 0) / (n - 1);
      if (avgOppMMR > pilot.mmr) {
        mmrChange = Math.round(mmrChange * 1.25);
      }
    }

    const newMmr = Math.max(0, pilot.mmr + mmrChange);

    changes.push({
      pilotId: pilot.pilotId,
      mmrChange: newMmr - pilot.mmr,
      newMmr,
      oldMmr: pilot.mmr,
    });
  }

  return changes;
}
