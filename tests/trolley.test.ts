import test from "node:test";
import { levels } from "../src/levels.ts";
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

test("the final trolley crosses the exit aisle and leaves the target and staging areas clear", () => {
  const finalRoute = levels[6].trolley!;
  assert.equal(hitsTrolley(8,0,0,finalRoute),true);
  assert.equal(hitsTrolley(8,0,2,finalRoute),false);
  for(let time=0;time<8;time+=0.1) {
    assert.equal(hitsTrolley(...levels[6].target,time,finalRoute),false);
    assert.equal(hitsTrolley(...levels[6].start,time,finalRoute),false);
  }
});
