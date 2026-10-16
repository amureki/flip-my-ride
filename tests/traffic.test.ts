import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as THREE from "three";
import { levels } from "../src/levels.ts";
import { advanceTraffic, driverTimeAfter, trafficPosition, orientedVehicleHeight, makeTrafficSignals } from "../src/traffic.ts";
import { vehicleLandingHeight, vehicleShapes } from "../src/vehicles.ts";
import { hitsTrolley, trolleyPosition } from "../src/trolley.ts";

const source = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const route = levels[4].traffic![0];

function advanceDriver(state, route, dt, player) {
  const body = vehicleShapes[route.model].body, heading = trafficPosition(0, route).heading;
  const bodies = [{state, at: time => trafficPosition(time, route),
    halfX: (Math.abs(Math.cos(heading))*body.width+Math.abs(Math.sin(heading))*body.length)/2,
    halfZ: (Math.abs(Math.sin(heading))*body.width+Math.abs(Math.cos(heading))*body.length)/2}];
  if (player) bodies.unshift({state:{time:0,speed:0,waiting:0,brake:0},at:()=>player,halfX:0.75,halfZ:1.3,fixed:true});
  advanceTraffic(bodies,dt);
}


test("drivers pause in spaces, warn before reversing, and repeat predictably", () => {
  const start = trafficPosition(0, route);
  assert.deepEqual([start.x, start.z], route.from);
  assert.equal(start.reversing, false);
  const warning = trafficPosition(route.pause - 0.5, route);
  assert.equal(warning.reversing, true);
  assert.deepEqual([warning.x, warning.z], route.from);
  const aisle = trafficPosition(route.period / 2, route);
  assert.ok(Math.hypot(aisle.x - route.to[0], aisle.z - route.to[1]) < 1e-9);
  assert.equal(aisle.reversing, false);
  assert.deepEqual(trafficPosition(route.period, route), start);
  const returning = trafficPosition(route.period - 1, route);
  assert.ok(returning.z < route.to[1] && returning.z > route.from[1]);
  assert.equal(returning.reversing, false);
});

test("a target-space driver creates both occupied and clean landing windows", () => {
  for (const level of levels.slice(4)) {
    let clear = 0, blocked = 0;
    for (let time = 0; time < 40; time += 0.05) {
      const occupied = level.traffic!.some(route => {
        const p = trafficPosition(time, route);
        return orientedVehicleHeight(route.model, level.target[0] - p.x, level.target[1] - p.z, p.heading) > 0;
      }) || !!level.trolley && hitsTrolley(...level.target, time, level.trolley);
      if (occupied) blocked++; else clear++;
    }
    assert.ok(clear > 80 && blocked > 80, `${level.name}: needs real timing windows`);
  }
});

test("sideways cars use their rotated footprint for landing and roof support", () => {
  assert.equal(orientedVehicleHeight("fastback", 2, 0, 0), 0);
  assert.ok(orientedVehicleHeight("fastback", 2, 0, Math.PI / 2) > 0);
  for (const x of [-2, -1, 0, 1, 2]) for (const z of [-3, -1, 0, 1, 3])
    assert.equal(orientedVehicleHeight("suv", x, z, 0), vehicleLandingHeight("suv", x, z));
});

test("all seven lots keep reachable signs and traffic stays within the lot", () => {
  assert.equal(levels.length, 7);
  assert.deepEqual(levels.slice(0, 3).map(level => level.name), ["One Spot Over", "Full Lot", "Unexpected Item"]);
  assert.deepEqual(levels.slice(3).map(level => level.traffic!.length), [1, 1, 2, 3]);
  assert.equal(new Set(levels.map(level => level.signReply)).size, 7);
  for (const level of levels) {
    assert.ok(level.cones.length > 0);
    for (const route of level.traffic ?? []) for (let time = 0; time < route.period; time += 0.1) {
      const p = trafficPosition(time, route);
      const body = vehicleShapes[route.model].body;
      const halfX = Math.abs(Math.cos(p.heading)) * body.width / 2 + Math.abs(Math.sin(p.heading)) * body.length / 2;
      const halfZ = Math.abs(Math.sin(p.heading)) * body.width / 2 + Math.abs(Math.cos(p.heading)) * body.length / 2;
      assert.ok(Math.abs(p.x) + halfX < 8.5 && Math.abs(p.z) + halfZ < 7, level.name);
      assert.equal(orientedVehicleHeight(route.model, -7.6 - p.x, level.sign[1] - p.z, p.heading), 0, level.name);
    }
  }
});

test("collision uses arrival time and damaged traffic stays at its impact position", () => {
  const root = new THREE.Group();
  const signals = makeTrafficSignals(route.model, root);
  const carDamage = [{damaged: false, roofDrop: 0, bodyDrop: 0}];
  const context = vm.createContext({ THREE, route, advanceTraffic, vehicleShapes, levels: [{}], levelIndex: 0, cartDriver: {time:0,speed:1,waiting:0,brake:0}, advanceDriver, driverTimeAfter, trafficPosition, orientedVehicleHeight,
    parkedVehicles: [{root, route, model: route.model, signals, driver: {time: 0, speed: 1, waiting: 0, brake: 0}}], carDamage, levelTime: 0, flight: null, replay: null, reducedMotion: {matches: false}, position: {x: -7, z: 5}, easterEggs: {waitForPlayer() {}, discover() {}} });
  const code = source.slice(source.indexOf("function simulateTraffic("), source.indexOf("const carDamage ="));
  vm.runInContext(ts.transpile(code), context);
  vm.runInContext("updateTraffic(0)", context);
  assert.ok(vm.runInContext("obstacleHeight(5.7, -4.8)", context) > 0);
  assert.equal(vm.runInContext("obstacleHeight(5.7, -4.8, 0.75, 1.3, route.period / 2)", context), 0);
  vm.runInContext("updateTraffic(3, 3)", context);
  const impact = root.position.clone();
  carDamage[0].damaged = true;
  vm.runInContext("updateTraffic(8)", context);
  assert.deepEqual(root.position, impact);
  assert.equal(signals.reverseLights.visible, false);
  vm.runInContext("updateTraffic(0)", context);
  assert.deepEqual(root.position, impact);
  carDamage[0].damaged = false;
  vm.runInContext("Object.assign(parkedVehicles[0].driver, {time: 0, speed: 1, waiting: 0, brake: 0})", context);
  vm.runInContext("updateTraffic(0)", context);
  assert.deepEqual([root.position.x, root.position.z], route.from);
});

test("drivers stop short of a grounded player, wait indefinitely, and resume without jumping", () => {
  for (const moving of [route, levels[5].traffic![1]]) {
    const player = trafficPosition(moving.period / 2 - (moving.phase ?? 0), moving);
    const state = {time: -(moving.phase ?? 0), speed: 1, waiting: 0, brake: 0};
    for (let i = 0; i < 1800; i++) {
      advanceDriver(state, moving, 1 / 60, player);
      const p = trafficPosition(state.time, moving);
      assert.equal(orientedVehicleHeight(moving.model, player.x - p.x, player.z - p.z, p.heading), 0);
    }
    assert.ok(state.waiting > 5);
    assert.equal(state.speed, 0);
    const stopped = state.time;
    advanceDriver(state, moving, 10, player);
    assert.equal(state.time, stopped);
    advanceDriver(state, moving, 1 / 60, null);
    assert.ok(state.time > stopped && state.time - stopped < 0.001);
    assert.equal(state.waiting, 0);
    advanceDriver(state, moving, 1, null);
    assert.equal(state.speed, 1);
  }
});

test("a driver can move away when the player lands close, and ramp prediction matches movement", () => {
  const state = {time: route.period / 2 + route.pause, speed: 0, waiting: 2, brake: 0};
  const player = {x: route.to[0], z: route.to[1] + 2.5};
  const expected = driverTimeAfter(state, 0.8);
  advanceDriver(state, route, 0.8, player);
  assert.equal(state.waiting, 0);
  assert.ok(Math.abs(state.time - expected) < 1e-9);
});

test("waiting emits one horn exchange and one long-wait discovery, without moving the player", () => {
  const root = new THREE.Group(), signals = makeTrafficSignals(route.model, root);
  const player = new THREE.Vector3(...[route.to[0], 0, route.to[1]]);
  const driver = {time: 0, speed: 1, waiting: 0, brake: 0};
  const events: string[] = [];
  const context = vm.createContext({advanceTraffic, vehicleShapes, levels: [{}], levelIndex: 0, cartDriver: {time:0,speed:1,waiting:0,brake:0}, trafficPosition, orientedVehicleHeight, advanceDriver, driverTimeAfter,
    parkedVehicles: [{root, signals, route, model: route.model, driver}],
    carDamage: [{damaged: false}], position: player, flight: null, replay: null,
    reducedMotion: {matches: false},
    easterEggs: {waitForPlayer() {events.push('honk')}, discover(id: string) {events.push(id)}}});
  const code = source.slice(source.indexOf("function simulateTraffic("), source.indexOf("const carDamage ="));
  vm.runInContext(ts.transpile(code), context);
  vm.runInContext('for(let i=0;i<900;i++) updateTraffic(i/60,1/60)', context);
  assert.deepEqual(events, ['honk','cant-park']);
  assert.deepEqual(player.toArray(), [route.to[0],0,route.to[1]]);
  const held = root.position.clone();
  vm.runInContext('updateTraffic(20, 1)', context);
  assert.deepEqual(root.position, held);
  // A recorded launch owns the route timing, independently of replay frame size.
  context.flight = {drivers: [{...driver}, {time:0,speed:1,waiting:0,brake:0}], from: player, levelTime: 20, anticipation: 0.12};
  vm.runInContext('updateTraffic(20.2)', context);
  assert.deepEqual(root.position, held);
  vm.runInContext('updateTraffic(20.3)', context);
  assert.ok(root.position.distanceTo(held) > 0 && root.position.distanceTo(held) < 0.01);
  const expected = trafficPosition(driverTimeAfter(context.flight.drivers[0], 1.5 - 0.12 - 0.15), route);
  vm.runInContext('updateTraffic(21.5)', context);
  assert.ok(Math.hypot(root.position.x - expected.x, root.position.z - expected.z) < 1e-9);
});

test("all traffic and cart routes remain collision-free and keep making progress", () => {
  for (const level of levels.slice(3)) {
    const bodies = [];
    if (level.trolley) bodies.push({state: {time:0,speed:1,waiting:0,brake:0}, at: (t: number) => trolleyPosition(t, level.trolley!), halfX:1.1, halfZ:0.55});
    for (const route of level.traffic!) {
      const shape = vehicleShapes[route.model].body, heading = trafficPosition(0,route).heading;
      bodies.push({state:{time:0,speed:1,waiting:0,brake:0},at:(t: number)=>trafficPosition(t,route),
        halfX:(Math.abs(Math.cos(heading))*shape.width+Math.abs(Math.sin(heading))*shape.length)/2,
        halfZ:(Math.abs(Math.sin(heading))*shape.width+Math.abs(Math.cos(heading))*shape.length)/2});
    }
    for (const [x,z,model] of level.cars) {
      const shape=vehicleShapes[model].body;
      bodies.push({state:{time:0,speed:0,waiting:0,brake:0},at:()=>({x,z}),halfX:shape.width/2,halfZ:shape.length/2,fixed:true});
    }
    let recentTimes = [];
    for(let frame=0;frame<7200;frame++) {
      if (frame === 6000) recentTimes = bodies.map(b=>b.state.time);
      advanceTraffic(bodies,1/60);
      for(let i=0;i<bodies.length;i++) for(let j=i+1;j<bodies.length;j++) {
        const a=bodies[i],b=bodies[j],p=a.at(a.state.time),q=b.at(b.state.time);
        assert.ok(Math.abs(p.x-q.x)>=a.halfX+b.halfX || Math.abs(p.z-q.z)>=a.halfZ+b.halfZ, `${level.name}: overlap ${i}/${j} at ${frame/60}`);
      }
    }
    bodies.forEach((body,i)=>{if(!body.fixed) assert.ok(body.state.time-recentTimes[i]>1, `${level.name}: stopped making progress at ${body.state.time}`)});
  }
});

test("crossing cars yield without contact and a stopped wreck stays solid", () => {
  const bodies = [
    {state:{time:0,speed:1,waiting:0,brake:0},at:(time:number)=>({x: -6+time,z:0}),halfX:1,halfZ:2},
    {state:{time:0,speed:1,waiting:0,brake:0},at:(time:number)=>({x:0,z:-6+time}),halfX:1,halfZ:2},
  ];
  let waited = false;
  for(let i=0;i<1500;i++) {
    advanceTraffic(bodies,1/60);
    waited ||= bodies.some(b=>b.state.waiting>0);
    const a=bodies[0].at(bodies[0].state.time),b=bodies[1].at(bodies[1].state.time);
    assert.ok(Math.abs(a.x-b.x)>=2 || Math.abs(a.z-b.z)>=4);
  }
  assert.ok(waited);
  assert.ok(bodies.every(b=>b.state.time>12));
  const wreck={state:{time:0,speed:0,waiting:0,brake:0},at:()=>({x:0,z:0}),halfX:1,halfZ:2,fixed:true};
  const car={...bodies[0],state:{time:0,speed:1,waiting:0,brake:0}};
  advanceTraffic([wreck,car],20);
  assert.ok(car.state.waiting>5);
  assert.ok(car.at(car.state.time).x < -2);
});

test("landing forecasts and replay use the same yielding simulation, including the cart", () => {
  const level = levels[6];
  const parkedVehicles = [
    ...level.cars.map(([x,z,model])=>({model, route: undefined, x,z})),
    ...level.traffic!.map(route=>({model:route.model, route, ...trafficPosition(0,route)})),
  ].map(({model,route,x,z})=>{
    const root=new THREE.Group();root.position.set(x,0,z);
    if(route)root.rotation.y=trafficPosition(0,route).heading;
    return {root,model,route,signals:route?makeTrafficSignals(model,root):undefined,driver:{time:0,speed:1,waiting:0,brake:0}};
  });
  const context=vm.createContext({THREE, advanceTraffic, trafficPosition, trolleyPosition, orientedVehicleHeight, vehicleShapes,
    parkedVehicles, levels:[level], levelIndex:0, levelTime:0, flight:null,replay:null,position:new THREE.Vector3(-6,0,5),
    carDamage:parkedVehicles.map(()=>({damaged:false})), cartDriver:{time:0,speed:1,waiting:0,brake:0},
    trolleyDamage:{damaged:false}, trolley:{root:new THREE.Group(),update(){}},reducedMotion:{matches:false},easterEggs:{waitForPlayer(){},discover(){}}});
  vm.runInContext(ts.transpile(source.slice(source.indexOf('function simulateTraffic('),source.indexOf('const carDamage ='))),context);
  vm.runInContext('for(let i=0;i<360;i++) updateTraffic(i/60,1/60); levelTime=6;',context);
  const expected=vm.runInContext('obstacleHeight(6,-4.8,0.75,1.3,8,0.27)',context);
  vm.runInContext('flight={drivers:trafficSnapshot(),from:position.clone(),levelTime:6,anticipation:0.12}; updateTraffic(8)',context);
  assert.equal(vm.runInContext('obstacleHeight(6,-4.8)',context),expected);
  const direct=vm.runInContext('JSON.stringify(trafficSnapshot())',context);
  vm.runInContext('for(let i=1;i<=120;i++) updateTraffic(6+i/60)',context);
  assert.equal(vm.runInContext('JSON.stringify(trafficSnapshot())',context),direct);
});
