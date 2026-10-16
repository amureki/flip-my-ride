import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";
import * as THREE from "three";

// Run the real input handlers without creating a WebGL renderer.
const source = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

test("short drags do not promise a flip that release cannot launch", () => {
  const handlers = {};
  const context = vm.createContext({ THREE, handlers });
  const fixture = `
  const position = new THREE.Vector3();
  const landing = position.clone();
  const aim = {visible: false, position: new THREE.Vector3()};
  const aimLine = {visible: false, geometry: new THREE.BufferGeometry()};
  const powerFill = {style: {width: '0'}};
  const message = {textContent: ''};
  const bounds = {x: 8.5, z: 7};
  const ring = {material: {color: new THREE.Color()}};
  let won = false, flight = null, flips = 0, touchdown = 1;
  const flipsLabel = {}, reducedMotion = {matches: false};
  const shockwave = {material: {}}, pivot = {scale: new THREE.Vector3()}, stunt = {};
  function burst() {}
  let pointer = null, chargeStart = null;
  const dragStart = new THREE.Vector2();
  const stage = {addEventListener(name, fn) {handlers[name] = fn}, setPointerCapture() {}, releasePointerCapture() {}, focus() {}};
  const window = {addEventListener() {}};
  function worldAt(x, y) {return new THREE.Vector3(x, 0, y)}
  `;
  const functions = source.slice(source.indexOf('function showAim('), source.indexOf('function reset()'));
  const events = source.slice(source.indexOf('stage.addEventListener("pointerdown"'), source.indexOf('window.addEventListener("keydown"'));
  vm.runInContext(ts.transpile(fixture + functions + events), context);
  const event = {pointerId: 1, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0, target: {closest() {return null}}};
  handlers.pointerdown(event);
  handlers.pointermove({...event, clientX: 0.1});
  const preview = vm.runInContext('({visible: aim.visible, message: message.textContent})', context);
  handlers.pointerup({...event, clientX: 0.1});
  const released = vm.runInContext('({flight: !!flight, message: message.textContent})', context);
  assert.ok(!preview.visible || released.flight, 'Visible landing preview must launch on release');
  assert.doesNotMatch(released.message, /Release to commit/, 'Release must not leave an instruction to release');
  handlers.pointerdown(event);
  handlers.pointermove({...event, clientX: 1});
  handlers.pointerup({...event, clientX: 1});
  assert.equal(vm.runInContext('!!flight', context), true, 'Normal drag must launch');
});
