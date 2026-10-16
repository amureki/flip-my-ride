export type RoundScore = { flips: number; hits: number };

export function runTotal(rounds: readonly RoundScore[]): RoundScore {
  return rounds.reduce((total, round) => ({
    flips: total.flips + round.flips,
    hits: total.hits + round.hits,
  }), { flips: 0, hits: 0 });
}

export function licenceVerdict(hits: number) {
  return hits === 0 ? "Reckless. Somehow spotless."
    : hits <= 3 ? "Passed. Insurer appealed."
    : "Licensed by a technicality.";
}
