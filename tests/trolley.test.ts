import test from "node:test";
import assert from "node:assert/strict";
import { trolleyPosition, hitsTrolley } from "../src/trolley.ts";

test("the bay alternates between blocked and clear on a repeatable cycle", () => {
  assert.equal(hitsTrolley(4.2, -3.7, 0), true);
  assert.equal(hitsTrolley(4.2, -3.7, 6), false);
  assert.ok(Math.abs(trolleyPosition(8).x - trolleyPosition(0).x) < 1e-10);
});

test("collision includes the car footprint but excludes a clear landing", () => {
  const point = trolleyPosition(2);
  assert.equal(hitsTrolley(point.x + 1.64, point.z, 2), true);
  assert.equal(hitsTrolley(point.x + 1.66, point.z, 2), false);
  assert.equal(hitsTrolley(point.x, point.z + 1.96, 2), false);
  assert.equal(hitsTrolley(-5.5, 4.8, 2), false);
});
