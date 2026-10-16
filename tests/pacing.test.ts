import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/levels.ts';
import { advanceTraffic, trafficPosition, orientedVehicleHeight } from '../src/traffic.ts';
import { vehicleShapes, vehicleLandingHeight } from '../src/vehicles.ts';
import { trolleyPosition, hitsTrolley } from '../src/trolley.ts';

function lotSimulation(level) {
  const bodies = [{ state: { time: 0, speed: 0, waiting: 0, brake: 0 }, at: () => ({ x: level.start[0], z: level.start[1] }), halfX: .75, halfZ: 1.3, fixed: true }];
  let cart;
  if (level.trolley) {
      const vertical = level.trolley.from[0] === level.trolley.to[0];
      cart = { state: { time: 0, speed: 1, waiting: 0, brake: 0 }, at: t => trolleyPosition(t, level.trolley), halfX: vertical ? .55 : 1.1, halfZ: vertical ? 1.1 : .55 };
      bodies.push(cart);
  }
  const cars = (level.traffic ?? []).map(route => { const shape = vehicleShapes[route.model].body; const b = { route, state: { time: 0, speed: 1, waiting: 0, brake: 0 }, at: t => trafficPosition(t, route), halfX: shape.width / 2, halfZ: shape.length / 2 }; bodies.push(b); return b; });
  for (const [x, z, model] of level.cars) {
      const shape = vehicleShapes[model].body;
      bodies.push({ state: { time: 0, speed: 0, waiting: 0, brake: 0 }, at: () => ({ x, z }), halfX: shape.width / 2, halfZ: shape.length / 2, fixed: true });
  }
  const stages = [];
  for (let x = -7.6; x <= 7.6; x += .4)
      for (let z = -5.6; z <= 5.6; z += .4)
          if (Math.hypot(x - level.start[0], z - level.start[1]) <= 9 && Math.hypot(x - level.target[0], z - level.target[1]) <= 9)
              stages.push([x, z]);
  const staticallyClear = (x, z) => !level.cars.some(([cx, cz, m]) => vehicleLandingHeight(m, x - cx, z - cz) > 0) && !level.cones.some(([cx, cz]) => Math.abs(x - cx) < 1.05 && Math.abs(z - cz) < 1.6);
  const clear = (x, z) => staticallyClear(x, z) && !cars.some(b => { const p = b.at(b.state.time); return p.active && orientedVehicleHeight(b.route.model, x - p.x, z - p.z, p.heading) > 0; }) && !(cart && hitsTrolley(x, z, cart.state.time, level.trolley));
  return {bodies, stages, clear};
}

test('later lots retain repeated clear windows with progressively less time and staging space', () => {
    let previousWindow = 5.7, previousStaging = 1;
    for (const [index, level] of levels.entries()) {
        if (index < 4)
            continue;
        const {bodies, stages, clear} = lotSimulation(level);
        let bayClear = 0, stagingClear = 0, run = 0, longest = 0, transitions = 0, wasClear = false;
        for (let i = 0; i < 3000; i++) {
            advanceTraffic(bodies, .1);
            let free = clear(...level.target);
            if (free) {
                bayClear++;
                run += .1;
                longest = Math.max(longest, run);
                if (!wasClear)
                    transitions++;
            }
            else
                run = 0;
            wasClear = free;
            stagingClear += stages.filter(([x, z]) => clear(x, z)).length / stages.length;
        }
        assert.ok(transitions >= 15, level.name + ': arrivals must keep cycling');
        assert.ok(longest > 2.5 && longest < previousWindow - 0.5, level.name + ': clear windows must tighten without becoming impossible');
        assert.ok(stagingClear / 3000 < previousStaging - 0.02, level.name + ': clean staging space must decrease');
        assert.ok(bayClear / 3000 > 0.3, level.name + ': preserve frequent clean openings');
        previousWindow = longest;
        previousStaging = stagingClear / 3000;
    }
});


test('later lots each retain a four-flip clean route with real yielding', () => {
  const routes = [
    {stage: [-2, -0.4], wait: 1.75},
    {stage: [-2.8, -2], wait: 1.5},
    {stage: [-2.4, -2], wait: 0},
  ];
  for (const [index, route] of routes.entries()) {
    const level = levels[index + 4];
    const {bodies, clear} = lotSimulation(level);
    let position = level.start, flips = 0;
    for (const destination of [route.stage, level.target]) {
      const distance = Math.hypot(destination[0]-position[0], destination[1]-position[1]);
      assert.ok(distance <= 9, level.name + ': jump is reachable');
      flips += distance > 5.5 ? 2 : 1;
      bodies[0].at = () => ({x: position[0], z: position[1]});
      advanceTraffic(bodies, 0.27);
      bodies[0].at = () => ({x: 0, z: 0, active: false});
      advanceTraffic(bodies, 1 + distance * 0.075);
      assert.ok(clear(...destination), level.name + ': landing stays claim-free');
      position = destination;
      bodies[0].at = () => ({x: position[0], z: position[1]});
      if (destination === route.stage) advanceTraffic(bodies, route.wait);
    }
    assert.ok(flips <= level.par, level.name + ': clean par is attainable');
  }
});
