export type RoundScore = { flips: number; hits: number; cars: number; trolleys: number; cones: number };

export function runTotal(rounds: readonly RoundScore[]): RoundScore {
  return rounds.reduce((total, round) => ({
    flips: total.flips + round.flips,
    hits: total.hits + round.hits,
    cars: total.cars + round.cars,
    trolleys: total.trolleys + round.trolleys,
    cones: total.cones + round.cones,
  }), { flips: 0, hits: 0, cars: 0, trolleys: 0, cones: 0 });
}

export function licenceVerdict(hits: number) {
  return hits === 0 ? "Reckless. Somehow spotless."
    : hits <= 3 ? "Passed. Insurer appealed."
    : "Licensed by a technicality.";
}
