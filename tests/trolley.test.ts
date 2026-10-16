import test from "node:test";
import assert from "node:assert/strict";
import { trolleyPosition, hitsTrolley } from "../src/trolley.ts";

const route = { from: [0.8, -3.7], to: [6.4, -3.7] } as const;

test("the bay alternates between blocked and clear on a repeatable cycle", () => {
  assert.equal(hitsTrolley(4.2, -3.7, 0, route), true);
  assert.equal(hitsTrolley(4.2, -3.7, 6, route), false);
  assert.ok(Math.abs(trolleyPosition(8, route).x - trolleyPosition(0, route).x) < 1e-10);
});

test("collision includes the car footprint but excludes a clear landing", () => {
  const point = trolleyPosition(2, route);
  assert.equal(hitsTrolley(point.x + 1.64, point.z, 2, route), true);
  assert.equal(hitsTrolley(point.x + 1.66, point.z, 2, route), false);
  assert.equal(hitsTrolley(point.x, point.z + 1.96, 2, route), false);
  assert.equal(hitsTrolley(-5.5, 4.8, 2, route), false);
});

test("final trolley leaves a safe landing window and clear staging gaps", () => {
  const finalRoute = { from: [6, -5.4], to: [6, -1.8] } as const;
  assert.equal(hitsTrolley(6, -5, 6, finalRoute), true);
  assert.equal(hitsTrolley(6, -5, 2, finalRoute), false);
  for (let time = 0; time < 8; time += 0.1) {
    assert.equal(hitsTrolley(0, -5, time, finalRoute), false);
    assert.equal(hitsTrolley(-6, 0, time, finalRoute), false);
  }
});
