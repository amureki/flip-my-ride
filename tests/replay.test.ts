import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";
import * as THREE from "three";
import { makeTrolley } from "../src/trolley.ts";
import { makeDamage } from "../src/damage.ts";

const source = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const playback = source.slice(source.indexOf("  if (replay && !flight)"), source.indexOf("  if (flight) {", source.indexOf("  if (replay && !flight)")));

function replayFixture() {
  const trolley = makeTrolley();
  const trolleyDamage = makeDamage(trolley.root, "trolley");
  const context = vm.createContext({ THREE, trolley, trolleyDamage });
  vm.runInContext(`
    let replay = { index: 0, endHold: 0, moves: [
      { time: 3, x: 2, z: 1, levelTime: 3 },
      { time: 6, x: 4, z: 2, levelTime: 6 }
    ] };
    let flight = null, roundTime = 0, levelTime = 0, ended = false;
    const landing = new THREE.Vector3();
    const reducedMotion = { matches: false };
    const levels = [{ trolley: { from: [-4, 0], to: [4, 0] } }], levelIndex = 0;
    const cartDriver = {time:0,speed:1,waiting:0,brake:0};
    function trafficSnapshot() {return [...parkedVehicles.map(({driver})=>({...driver})), {...cartDriver}] }
    function updateTraffic() {}
    function launch(move) { flight = move; }
    function endReplay() { ended = true; replay = null; }
    function tick(dt) { ${ts.transpile(playback)} }
  `, context);
  return { context, trolley, trolleyDamage };
}

test("replay keeps a crushed trolley at its impact position on later jumps", () => {
  const { context, trolley, trolleyDamage } = replayFixture();
  vm.runInContext("roundTime = 3; tick(0.02)", context);
  trolleyDamage.crush(true);
  const impactPosition = trolley.root.position.clone();
  const impactRotation = trolley.root.rotation.clone();
  vm.runInContext("flight = null; roundTime = 6; tick(0.02)", context);
  assert.deepEqual(trolley.root.position, impactPosition);
  assert.deepEqual(trolley.root.rotation.toArray(), impactRotation.toArray());
  assert.equal(vm.runInContext("flight.x", context), 4);
});

test("replay waits for recorded pauses and holds the final landing for two seconds", () => {
  const { context } = replayFixture();
  vm.runInContext("roundTime = 2; tick(0.02)", context);
  assert.equal(vm.runInContext("flight", context), null);
  vm.runInContext("roundTime = 3; tick(0.02)", context);
  assert.equal(vm.runInContext("flight.x", context), 2);
  vm.runInContext("flight = null; roundTime = 5; tick(0.02)", context);
  assert.equal(vm.runInContext("flight", context), null);
  vm.runInContext("roundTime = 6; tick(0.02); tick(2)", context);
  assert.equal(vm.runInContext("ended", context), false);
  vm.runInContext("flight = null; tick(1.9)", context);
  assert.equal(vm.runInContext("ended", context), false);
  vm.runInContext("tick(0.11)", context);
  assert.equal(vm.runInContext("ended", context), true);
});

test("exiting replay restores the completed score, damage, controls and replay history", () => {
  class HTMLElement {
    inert = false;
    hidden = false;
    focused = false;
    children: HTMLElement[] = [];
    classList = { add() {}, remove() {} };
    focus() { this.focused = true; }
  }
  const app = new HTMLElement();
  const replayPanel = new HTMLElement();
  app.children = [new HTMLElement(), replayPanel, new HTMLElement()];
  const trolley = makeTrolley();
  const trolleyDamage = makeDamage(trolley.root, "trolley");
  const carDamage = [makeDamage(new THREE.Group(), "car")];
  const context = vm.createContext({ THREE, HTMLElement, trolley, trolleyDamage, carDamage,
    replayPanel, document: { querySelector: () => app } });
  const functions = source.slice(source.indexOf("function endReplay()"), source.indexOf('watchReplay.addEventListener("click"'));
  vm.runInContext(ts.transpile(`
    let replay = null, won = true, moves = [{time: 3, x: 2, z: 1}], flips = 4, hits = 3, levelTime = 7;
    const levels = [{trolley: {from: [-4, 0], to: [4, 0]}}], levelIndex = 0;
    const reducedMotion = {matches: false}, position = new THREE.Vector3(3, 0, 2);
    const parkedCars = [new THREE.Group()];
    const parkedVehicles = [{driver: {time: 3, speed: 0, waiting: 6, brake: 0}}];
    const cartDriver = {time:0,speed:1,waiting:0,brake:0};
    function trafficSnapshot() {return [...parkedVehicles.map(({driver})=>({...driver})), {...cartDriver}] }
    function updateTraffic() {}
    const pivot = new THREE.Group(), cones = [{mesh: new THREE.Group(), hit: true}];
    const flipsLabel = {}, message = {textContent: 'Parked.'};
    const result = new HTMLElement(), watchReplay = new HTMLElement(), stopReplay = new HTMLElement();
    const easterEggs = { snapshot: () => ({sign: true, hat: true, contacts: [2]}), restore(saved) { this.restored = saved; } };
    function updateShareLinks() {}
    function levelEvent() {}
    function reset() {
      Object.assign(parkedVehicles[0].driver, {time: 0, speed: 1, waiting: 0, brake: 0});
      Object.assign(cartDriver, {time:0,speed:1,waiting:0,brake:0});
      moves = []; won = false; flips = hits = levelTime = 0;
      position.set(0, 0, 0); message.textContent = ''; result.hidden = true;
      trolleyDamage.restore(false); carDamage[0].restore(false); cones[0].hit = false;
    }
    ${functions}
    trolleyDamage.crush(true); carDamage[0].crush(true); parkedCars[0].position.set(4, 0, 1);
    trolley.root.position.set(1, 0, 2); trolley.root.rotation.z = 0.02;
    Object.assign(cartDriver, {time:4,speed:0,waiting:3,brake:0});
    beginReplay();
  `), context);
  assert.ok(app.children.filter(child => child !== replayPanel).every(child => child.inert));
  assert.equal(trolleyDamage.damaged, false);
  vm.runInContext("trolley.root.position.set(8, 0, 8); endReplay()", context);
  assert.equal(vm.runInContext("won && flips === 4 && hits === 3 && moves.length === 1 && position.x === 3 && message.textContent === 'Parked.'", context), true);
  assert.equal(vm.runInContext("easterEggs.restored.sign && easterEggs.restored.hat && easterEggs.restored.contacts[0] === 2", context), true);
  assert.equal(vm.runInContext("parkedCars[0].position.x === 4 && parkedCars[0].position.z === 1", context), true);
  assert.equal(vm.runInContext("parkedVehicles[0].driver.time === 3 && parkedVehicles[0].driver.waiting === 6", context), true);
  assert.equal(vm.runInContext("cartDriver.time === 4 && cartDriver.waiting === 3 && cartDriver.speed === 0", context), true);
  assert.equal(trolleyDamage.damaged, true);
  assert.equal(carDamage[0].damaged, true);
  assert.deepEqual(trolley.root.position.toArray(), [1, 0, 2]);
  assert.equal(trolley.root.rotation.z, 0.02);
  assert.equal(vm.runInContext("cones[0].hit && cones[0].mesh.scale.y === 0.12 && !result.hidden && watchReplay.focused", context), true);
  assert.ok(app.children.every(child => !child.inert));
  assert.equal(replayPanel.hidden, true);
  vm.runInContext("beginReplay()", context);
  assert.equal(vm.runInContext("replay.moves.length", context), 1);
});


test("a crushed trolley does not freeze traffic", () => {
  const start = source.indexOf("  if (!won) {\n    levelTime += dt;");
  const end = source.indexOf("  updateKeyboardAim(dt);", start);
  assert.ok(start > 0 && end > start);
  const context = vm.createContext({});
  vm.runInContext(`
    let levelTime = 2, won = false, trafficTime = 0;
    const dt = 0.04;
    const trolley = {root: {visible: true}, update() {throw new Error('Crushed cart moved')}};
    const trolleyDamage = {damaged: true};
    function updateTraffic(time) {trafficTime = time;}
    ${ts.transpile(source.slice(start, end))}
  `, context);
  assert.equal(vm.runInContext("levelTime", context), 2.04);
  assert.equal(vm.runInContext("trafficTime", context), 2.04);
});
