import test from "node:test";
import assert from "node:assert/strict";
import { runTotal, licenceVerdict, meetsCleanPar } from "../src/receipt.ts";

test("retry replaces a round without counting its previous result", () => {
  const rounds = [{ flips: 1, hits: 0, cars: 0, trolleys: 0, cones: 0 }, { flips: 5, hits: 2, cars: 1, trolleys: 1, cones: 0 }];
  rounds.length = 1;
  rounds[1] = { flips: 3, hits: 0, cars: 0, trolleys: 0, cones: 0 };
  assert.deepEqual(runTotal(rounds), { flips: 4, hits: 0, cars: 0, trolleys: 0, cones: 0 });
  rounds.length = 0;
  assert.deepEqual(runTotal(rounds), { flips: 0, hits: 0, cars: 0, trolleys: 0, cones: 0 });
});

test("licence verdict reflects total claims", () => {
  assert.equal(licenceVerdict(0), "Reckless. Somehow spotless.");
  assert.equal(licenceVerdict(3), "Passed. Insurer appealed.");
  assert.equal(licenceVerdict(4), "Licensed by a technicality.");
});

test("damage totals exclude boundary claims and include every object type", () => {
  const total = runTotal([
    { flips: 3, hits: 4, cars: 2, trolleys: 1, cones: 0 },
    { flips: 2, hits: 3, cars: 0, trolleys: 0, cones: 3 },
  ]);
  assert.deepEqual(total, { flips: 5, hits: 7, cars: 2, trolleys: 1, cones: 3 });
  assert.equal(total.hits - total.cars - total.trolleys - total.cones, 1);
});

test("clean par requires zero claims and respects the flip budget", () => {
  assert.equal(meetsCleanPar({flips: 3, hits: 0}, 3), true);
  assert.equal(meetsCleanPar({flips: 2, hits: 0}, 3), true);
  assert.equal(meetsCleanPar({flips: 4, hits: 0}, 3), false);
  assert.equal(meetsCleanPar({flips: 2, hits: 1}, 3), false);
});

test("level retries keep the best score, preferring clean parking over fewer flips", async () => {
  const { bestRound } = await import('../src/receipt.ts');
  const clean = {flips:4,hits:0,cars:0,trolleys:0,cones:0};
  const crash = {flips:2,hits:1,cars:1,trolleys:0,cones:0};
  assert.equal(bestRound(clean, crash), clean);
  assert.equal(bestRound(crash, clean), clean);
  const improved = {...clean, flips:3};
  assert.equal(bestRound(clean, improved), improved);
  assert.equal(bestRound(improved, clean), improved);
  const rounds = Array.from({length:7}, () => clean);
  rounds[2] = bestRound(rounds[2], improved);
  assert.equal(runTotal(rounds).flips, 27);
  assert.ok(rounds.every((round,i) => round === (i === 2 ? improved : clean)));
});
