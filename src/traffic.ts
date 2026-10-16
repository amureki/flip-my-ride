import * as THREE from "three";
import { vehicleLandingHeight, vehicleShapes, type VehicleModel } from "./vehicles.ts";

export type TrafficRoute = {
  model: VehicleModel;
  from: readonly [number, number];
  to: readonly [number, number];
  period: number;
  pause: number;
  phase?: number;
};

export function trafficPosition(time: number, route: TrafficRoute) {
  const age = ((time + (route.phase ?? 0)) % route.period + route.period) % route.period;
  const travel = (route.period - 2 * route.pause) / 2;
  let progress = 0;
  if (age >= route.pause && age < route.pause + travel) progress = (age - route.pause) / travel;
  else if (age >= route.pause + travel && age < 2 * route.pause + travel) progress = 1;
  else if (age >= 2 * route.pause + travel) progress = 1 - (age - 2 * route.pause - travel) / travel;
  const eased = progress * progress * (3 - 2 * progress);
  return {
    x: route.from[0] + (route.to[0] - route.from[0]) * eased,
    z: route.from[1] + (route.to[1] - route.from[1]) * eased,
    heading: Math.atan2(route.to[0] - route.from[0], route.to[1] - route.from[1]),
    reversing: age >= route.pause - 0.75 && age < route.pause + travel,
  };
}

export function orientedVehicleHeight(model: VehicleModel, dx: number, dz: number, heading: number,
  halfWidth = 0.75, halfLength = 1.3, roofDrop = 0, bodyDrop = 0) {
  const cos = Math.cos(heading), sin = Math.sin(heading);
  return vehicleLandingHeight(model, cos * dx - sin * dz, sin * dx + cos * dz,
    Math.abs(cos) * halfWidth + Math.abs(sin) * halfLength,
    Math.abs(sin) * halfWidth + Math.abs(cos) * halfLength, roofDrop, bodyDrop);
}

export function makeTrafficSignals(model: VehicleModel, car: THREE.Group) {
  const { body } = vehicleShapes[model];
  const reverseLights = new THREE.Group();
  for (const side of [-1, 1]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.09, 0.025),
      new THREE.MeshBasicMaterial({ color: 0xffffed }));
    light.position.set(side * body.width * 0.3, body.height + 0.02, body.length / 2 + 0.02);
    reverseLights.add(light);
  }
  car.add(reverseLights);
  return { reverseLights };
}

export type DriverState = { time: number; speed: number; waiting: number; brake: number };

export function driverTimeAfter(state: DriverState, seconds: number) {
  const ramp = Math.min(seconds, (1 - state.speed) / 2);
  return state.time + state.speed * ramp + ramp * ramp + seconds - ramp;
}

export type TrafficBody = {
  state: DriverState;
  at: (time: number) => { x: number; z: number };
  halfX: number;
  halfZ: number;
  fixed?: boolean;
};

export function advanceTraffic(bodies: TrafficBody[], seconds: number) {
  for (let elapsed = 0; elapsed < seconds - 1e-9;) {
    const dt = Math.min(1 / 120, seconds - elapsed);
    elapsed += dt;
    const current = bodies.map(b => b.at(b.state.time));
    const probe = bodies.map(b => b.at(b.state.time + 0.15));
    const blocked = bodies.map(b => !!b.fixed);
    const overlaps = (a: {x: number; z: number}, b: {x: number; z: number}, i: number, j: number) =>
      Math.abs(a.x - b.x) < bodies[i].halfX + bodies[j].halfX + 0.15 &&
      Math.abs(a.z - b.z) < bodies[i].halfZ + bodies[j].halfZ + 0.15;
    // Resolve against stopped bodies again after each decision. Earlier bodies have priority.
    for (let pass = 0; pass < bodies.length; pass++) {
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        if (blocked[i] && blocked[j]) continue;
        const a = blocked[i] ? current[i] : probe[i];
        const b = blocked[j] ? current[j] : probe[j];
        if (!overlaps(a, b, i, j)) continue;
        const approaching = (index: number, other: number) =>
          Math.hypot(probe[index].x - current[other].x, probe[index].z - current[other].z) <
          Math.hypot(current[index].x - current[other].x, current[index].z - current[other].z) - 1e-10;
        if (!blocked[j] && approaching(j, i)) blocked[j] = true;
        if (!blocked[i] && approaching(i, j) && overlaps(probe[i], current[j], i, j)) blocked[i] = true;
      }
    }
    // If two drivers meet at a crossing, the later driver backs off to clear it.
    const retreat = bodies.map((body, j) => {
      if (body.fixed || !blocked[j] || body.state.waiting < 0.3) return false;
      const back = body.at(body.state.time - dt * 0.5);
      const clearsPriority = bodies.some((other, i) => i < j && !other.fixed && blocked[i] && other.state.waiting >= 0.3 &&
        overlaps(probe[i], current[j], i, j) &&
        Math.hypot(back.x-current[i].x, back.z-current[i].z) > Math.hypot(current[j].x-current[i].x, current[j].z-current[i].z) + 1e-10);
      return clearsPriority && bodies.every((other, i) => i === j || !overlaps(back, current[i], j, i));
    });
    bodies.forEach((body, i) => {
      if (body.fixed) return;
      const state = body.state;
      state.brake = Math.max(0, state.brake - dt);
      if (blocked[i]) {
        if (!state.waiting) state.brake = 0.35;
        state.waiting += dt;
        if (retreat[i]) state.time -= dt * 0.5;
        state.speed = 0;
      } else {
        state.time = driverTimeAfter(state, dt);
        state.speed = Math.min(1, state.speed + dt * 2);
        state.waiting = 0;
      }
    });
  }
}
