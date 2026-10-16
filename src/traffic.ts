import * as THREE from "three";
import { vehicleLandingHeight, vehicleShapes, type VehicleModel } from "./vehicles.ts";

export type TrafficRoute = {
  model: VehicleModel;
  bay: readonly [number, number];
  parkFor: number;
  maneuver?: number;
  speed: number;
  gap: number;
  phase?: number;
  arrivesAfter?: number;
  once?: boolean;
};

export function trafficDuration(route: TrafficRoute) {
  return route.parkFor + 2 * (route.maneuver ?? 5) + 28 / route.speed + route.gap;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

export function trafficPosition(time: number, route: TrafficRoute) {
  const [x, z] = route.bay;
  const maneuver = route.maneuver ?? 5;
  const turnX = x - 3;
  const exitDuration = (14 - turnX) / route.speed;
  const entryDuration = (turnX + 14) / route.speed;
  const period = route.parkFor + 2 * maneuver + exitDuration + entryDuration + route.gap;
  const departureEnd = route.parkFor + maneuver + exitDuration;
  const point = {x, z, heading: 0, reversing: false, turning: false, active: true, bay: route.bay, arriving: false};
  if (route.arrivesAfter !== undefined && time < route.arrivesAfter)
    return {...point, x:-14, z:0, heading:-Math.PI / 2, active:false};
  const total = route.arrivesAfter === undefined ? Math.max(0, time + (route.phase ?? 0))
    : time - route.arrivesAfter + departureEnd + route.gap;
  let age = total % period;
  if (route.once && total >= departureEnd) return {...point, x:14, z:0, active:false};
  if (age < route.parkFor) return {...point, reversing: age >= route.parkFor - 0.75};
  age -= route.parkFor;
  let reverse = true;
  if (age >= maneuver) {
    age -= maneuver;
    if (age < exitDuration) return {...point, x:turnX + smoothstep(age / exitDuration) * (14 - turnX), z:0, heading:-Math.PI / 2};
    age -= exitDuration;
    if (age < route.gap - 1e-9) return {...point, x:14, z:0, active:false};
    age = Math.max(0, age - route.gap);
    if (age < entryDuration) return {...point, x:-14 + smoothstep(age / entryDuration) * (turnX + 14), z:0, heading:-Math.PI / 2, arriving:true};
    age -= entryDuration;
    reverse = false;
  }
  // The same curved parking maneuver runs backward on departure and forward on arrival.
  const u = reverse ? 1 - age / maneuver : age / maneuver;
  const t = smoothstep(Math.max(0, Math.min(1, u))), v = 1 - t;
  const px = v*v*v*turnX + 3*v*v*t*x + 3*v*t*t*x + t*t*t*x;
  const pz = 3*v*t*t*(z * 0.4) + t*t*t*z;
  const dx = 3*v*v*(x-turnX);
  const dz = 6*v*t*(z*0.4) + 3*t*t*(z*0.6);
  return {...point, x:px, z:pz, heading:Math.atan2(-dx,-dz), reversing:reverse, turning:true, arriving:!reverse};
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
  const indicators = new THREE.Group();
  for (const z of [-body.length / 2 - 0.03, body.length / 2 + 0.03]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.09, 0.03), new THREE.MeshBasicMaterial({color:0xffb640}));
    light.position.set(-body.width * 0.4, body.height - 0.08, z);
    indicators.add(light);
  }
  car.add(indicators);
  return { reverseLights, indicators };
}

export type DriverState = { time: number; speed: number; waiting: number; brake: number };

export function driverTimeAfter(state: DriverState, seconds: number) {
  const ramp = Math.min(seconds, (1 - state.speed) / 2);
  return state.time + state.speed * ramp + ramp * ramp + seconds - ramp;
}

export type TrafficPose = {x: number; z: number; heading?: number; active?: boolean; turning?: boolean; bay?: readonly [number, number]; arriving?: boolean};

export function trafficOverlap(a: TrafficPose, b: TrafficPose, first: {halfX:number; halfZ:number}, second: {halfX:number; halfZ:number}, margin = 0) {
  if (a.active === false || b.active === false) return false;
  const ah = a.heading ?? 0, bh = b.heading ?? 0;
  const axes = [ah, ah + Math.PI / 2, bh, bh + Math.PI / 2];
  return axes.every(axis => {
    const separation = Math.abs((a.x-b.x)*Math.cos(axis) - (a.z-b.z)*Math.sin(axis));
    const radiusA = first.halfX*Math.abs(Math.cos(axis-ah)) + first.halfZ*Math.abs(Math.sin(axis-ah));
    const radiusB = second.halfX*Math.abs(Math.cos(axis-bh)) + second.halfZ*Math.abs(Math.sin(axis-bh));
    return separation < radiusA + radiusB + margin;
  });
}

export type TrafficBody = {
  state: DriverState;
  at: (time: number) => TrafficPose;
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
    const bayWaiting = bodies.map((body,i) => !!current[i].arriving && bodies.some((other,j) => {
      const bay = current[i].bay, occupied = current[j];
      if (i === j || !bay || !occupied.bay || occupied.active === false || (!occupied.turning && occupied.z >= -0.1)) return false;
      if (bay[0] !== occupied.bay[0] || bay[1] !== occupied.bay[1]) return false;
      // Wait upstream so the current occupant has room to reverse into the aisle.
      return probe[i].x > bay[0] - 3 - body.halfZ - other.halfZ - 0.3;
    }));
    const blocked = bodies.map((body,i) => !!body.fixed || bayWaiting[i]);
    const overlaps = (a: TrafficPose, b: TrafficPose, i: number, j: number) => trafficOverlap(a,b,bodies[i],bodies[j],0.15);
    const hasPriority = (a: number, b: number) => {
      const first = current[a], second = current[b];
      if (first.bay && second.bay && first.bay[0] === second.bay[0] && first.bay[1] === second.bay[1] && first.arriving !== second.arriving)
        return !first.arriving;
      if (bayWaiting[a] !== bayWaiting[b]) return !bayWaiting[a];
      return !!first.turning !== !!second.turning ? !first.turning : a < b;
    };
    // Cars already in the aisle pass before cars entering it from a parking space.
    for (let pass = 0; pass < bodies.length; pass++) {
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        if (blocked[i] && blocked[j]) continue;
        const a = blocked[i] ? current[i] : probe[i];
        const b = blocked[j] ? current[j] : probe[j];
        if (!overlaps(a, b, i, j)) continue;
        if (current[i].active === false) { blocked[i] = true; continue; }
        if (current[j].active === false) { blocked[j] = true; continue; }
        const approaching = (index: number, other: number) =>
          Math.hypot(probe[index].x - current[other].x, probe[index].z - current[other].z) <
          Math.hypot(current[index].x - current[other].x, current[index].z - current[other].z) - 1e-10;
        const obstructedI = approaching(i,j) && overlaps(probe[i],current[j],i,j);
        const obstructedJ = approaching(j,i) && overlaps(probe[j],current[i],j,i);
        if (obstructedI || obstructedJ) {
          if (obstructedI) blocked[i] = true;
          if (obstructedJ) blocked[j] = true;
          continue;
        }
        const high = hasPriority(i,j) ? i : j, low = high === i ? j : i;
        if (!blocked[low] && approaching(low, high)) blocked[low] = true;
      }
    }
    // The yielding driver can back off to clear a crossing, if there is room.
    const retreat = bodies.map((body, j) => {
      if (body.fixed || current[j].active === false) return false;
      const back = body.at(body.state.time - dt * 0.5);
      const clearsPriority = bodies.some((other, i) => i !== j && hasPriority(i,j) && !other.fixed && (blocked[i] || other.state.speed < 1) &&
        overlaps(other.at(other.state.time + 0.6), current[j], i, j) &&
        Math.hypot(back.x-current[i].x, back.z-current[i].z) > Math.hypot(current[j].x-current[i].x, current[j].z-current[i].z) + 1e-10);
      return clearsPriority && bodies.every((other, i) => i === j || !overlaps(back, current[i], j, i));
    });
    // Check the actual small step too: a turning bumper can approach while its centre moves away.
    const proposed = bodies.map((body,i) => body.at(retreat[i] ? body.state.time-dt*0.5 : blocked[i] ? body.state.time : driverTimeAfter(body.state,dt)));
    for (let pass=0;pass<bodies.length;pass++) {
      for (let i=0;i<bodies.length;i++) for (let j=i+1;j<bodies.length;j++) {
        if (!trafficOverlap(proposed[i],proposed[j],bodies[i],bodies[j]) || trafficOverlap(current[i],current[j],bodies[i],bodies[j])) continue;
        blocked[i]=blocked[j]=true;
        retreat[i]=retreat[j]=false;
        proposed[i]=current[i];proposed[j]=current[j];
      }
    }
    bodies.forEach((body, i) => {
      if (body.fixed) return;
      const state = body.state;
      state.brake = Math.max(0, state.brake - dt);
      if (blocked[i] || retreat[i]) {
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
