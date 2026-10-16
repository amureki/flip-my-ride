import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";
import * as THREE from "three";

// Run the real input handlers without creating a WebGL renderer.
const source = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

function inputFixture() {
  const handlers = {};
  const keys = {};
  const padHandlers = {};
  const context = vm.createContext({ THREE, handlers, padHandlers, keys, HTMLInputElement: class {}, Element: class {} });
  const fixture = `
  const position = new THREE.Vector3();
  const landing = position.clone();
  const aim = {visible: false, position: new THREE.Vector3()};
  const aimLine = {visible: false, geometry: new THREE.BufferGeometry()};
  const message = {textContent: ''};
  const bounds = {x: 8.5, z: 7};
  const ring = {material: {color: new THREE.Color()}};
  const parkedCars = [], carDamage = [], cones = [];
  const trolleyDamage = {damaged: false}, levels = [{}], levelIndex = 0;
  const aimSymbols = Array.from({length: 3}, () => ({visible: false, material: {color: new THREE.Color()}}));
  let won = false, flight = null, flips = 0, touchdown = 1, replay = null;
  const moves = [];
  let roundTime = 0;
  let attemptStarted = false, attempt = 0, attemptSeconds = 0, gameStarted = false;
  function trackEvent() {}
  function levelEvent() {}
  const trolleyTime = 0;
  const flipsLabel = {}, reducedMotion = {matches: false};
  const suspension = {position: new THREE.Vector3()};
  const shockwave = {material: {}}, pivot = {scale: new THREE.Vector3()}, stunt = {};
  function burst() {}
  let pointer = null, keyboardAiming = false;
  const aimKeys = new Set();
  const dragStart = new THREE.Vector2();
  const stage = {addEventListener(name, fn) {handlers[name] = fn}, setPointerCapture() {}, hasPointerCapture() {return true}, releasePointerCapture() {}, focus() {}, getBoundingClientRect() {return {left: 0, top: 0, width: 800, height: 600}}};
  const thumbPad = {clientWidth: 128, clientHeight: 128, style: {setProperty() {}}, classList: {toggle() {}, remove() {}}, addEventListener(name, fn) {padHandlers[name] = fn}, setPointerCapture() {}, hasPointerCapture() {return true}, releasePointerCapture() {}};
  let pointerSurface = stage;
  const mobileControls = {matches: false, addEventListener() {}};
  const window = {addEventListener(name, fn) {keys[name] = fn}};
  function reset() {position.set(0, 0, 0); landing.copy(position); flight = null; cancelInput()}
  function worldAt(x, y) {return y > 600 ? new THREE.Vector3() : new THREE.Vector3(x, 0, y)}
  `;
  const functions = source.slice(source.indexOf('function showAim('), source.indexOf('function reset('));
  const events = source.slice(source.indexOf('for (const surface of [stage, thumbPad])'), source.indexOf('document.querySelector("#reset")'));
  vm.runInContext(ts.transpile(fixture + functions + events), context);
  return {handlers, padHandlers, keys, context};
}

test("short drags do not promise a flip that release cannot launch", () => {
  const {handlers, context} = inputFixture();
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


test("keyboard marker supports diagonals, persists on release, and Space launches once", () => {
  const {keys, context} = inputFixture();
  const key = (name, repeat = false) => ({key: name, code: name, repeat, preventDefault() {}});
  keys.keydown(key('ArrowRight'));
  keys.keydown(key('ArrowUp'));
  vm.runInContext('updateKeyboardAim(0.5)', context);
  assert.ok(vm.runInContext('landing.x > 0 && landing.z < 0', context));
  assert.ok(Math.abs(vm.runInContext('landing.length()', context) - 3) < 1e-10);
  keys.keyup(key('ArrowRight'));
  keys.keyup(key('ArrowUp'));
  const before = vm.runInContext('landing.toArray().join()', context);
  vm.runInContext('updateKeyboardAim(0.5)', context);
  assert.equal(vm.runInContext('landing.toArray().join()', context), before);
  assert.equal(vm.runInContext('message.textContent', context), 'Press Space to flip.');
  keys.keydown(key('Space'));
  assert.equal(vm.runInContext('flight.to.toArray().join()', context), before);
  keys.keydown(key('Space', true));
  assert.equal(vm.runInContext('flips', context), 1);
  keys.keydown(key('r'));
  assert.equal(vm.runInContext('flight === null && !keyboardAiming && aimKeys.size === 0', context), true);
});

test("keyboard aim is capped and focus loss cancels held keys", () => {
  const {keys, handlers, context} = inputFixture();
  keys.keydown({key: 'ArrowRight', preventDefault() {}});
  vm.runInContext('updateKeyboardAim(10)', context);
  assert.equal(vm.runInContext('landing.length()', context), 9);
  handlers.focusout();
  assert.equal(vm.runInContext('aimKeys.size === 0 && !keyboardAiming && !aim.visible', context), true);
});


test("WASD and arrows combine without doubling speed or releasing another held key", () => {
  const {keys, context} = inputFixture();
  const key = (name) => ({key: name, preventDefault() {}});
  keys.keydown(key('D'));
  keys.keydown(key('ArrowRight'));
  vm.runInContext('updateKeyboardAim(0.25)', context);
  assert.equal(vm.runInContext('landing.x', context), 1.5);
  keys.keyup(key('ArrowRight'));
  keys.keydown(key('w'));
  vm.runInContext('updateKeyboardAim(0.25)', context);
  assert.ok(vm.runInContext('landing.x > 1.5 && landing.z < 0', context));
  keys.keyup(key('d'));
  keys.keyup(key('W'));
  assert.equal(vm.runInContext('aimKeys.size', context), 0);
});

test("replay blocks player input and retry shortcuts", () => {
  const {handlers, keys, context} = inputFixture();
  vm.runInContext('replay = {}; position.set(2, 0, 1)', context);
  keys.keydown({key: 'r', preventDefault() {}});
  keys.keydown({key: 'ArrowRight', preventDefault() {}});
  handlers.pointerdown({pointerId: 1, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0, target: {closest() {return null}}});
  assert.equal(vm.runInContext('position.x === 2 && pointer === null && aimKeys.size === 0', context), true);
});

test("replay preserves flight timing when reduced-motion preferences change", () => {
  const {context} = inputFixture();
  vm.runInContext('landing.set(3, 0, 0); launch();', context);
  const duration = vm.runInContext('flight.duration', context);
  const anticipation = vm.runInContext('flight.anticipation', context);
  vm.runInContext('flight = null; replay = {}; reducedMotion.matches = true; launch(moves[0]);', context);
  assert.equal(vm.runInContext('flight.duration', context), duration);
  assert.equal(vm.runInContext('flight.anticipation', context), anticipation);
  assert.equal(vm.runInContext('moves.length', context), 1);
});

 test("landing marker distinguishes clear, collision-risk, damaged, and outside destinations", () => {
  const {context} = inputFixture();
  vm.runInContext('showAim(new THREE.Vector3(2, 0, 0))', context);
  assert.equal(vm.runInContext('aimSymbols[0].visible', context), true);
  vm.runInContext('parkedCars.push({visible: true, position: new THREE.Vector3(2,0,0)}); carDamage.push({damaged: false}); updateAimFeedback()', context);
  assert.equal(vm.runInContext('aimSymbols[1].visible', context), true);
  assert.match(vm.runInContext('message.textContent', context), /Collision risk/);
  vm.runInContext('carDamage[0].damaged = true; updateAimFeedback()', context);
  assert.equal(vm.runInContext('aimSymbols[0].visible', context), true);
  vm.runInContext('showAim(new THREE.Vector3(9,0,0))', context);
  assert.equal(vm.runInContext('aimSymbols[2].visible', context), true);
});


test("mobile pad below the camera projection reaches full power and ignores touches on the lot", () => {
  const {handlers, padHandlers, context} = inputFixture();
  vm.runInContext('mobileControls.matches = true', context);
  const event = {pointerId: 1, pointerType: 'touch', clientX: 160, clientY: 700, target: {closest() {return null}}};
  handlers.pointerdown(event);
  assert.equal(vm.runInContext('pointer', context), null);
  padHandlers.pointerdown(event);
  padHandlers.pointermove({...event, clientX: 184});
  assert.ok(vm.runInContext('landing.x > 1 && landing.x < 2', context), 'Small drags must allow fine aiming');
  padHandlers.pointermove({...event, clientX: 196});
  assert.ok(Math.abs(vm.runInContext('landing.x', context) - 9 * 0.5 ** 1.5) < 1e-10);
  padHandlers.pointermove({...event, clientX: 232});
  assert.equal(vm.runInContext('landing.x', context), 9);
  padHandlers.pointerup({...event, clientX: 232});
  assert.equal(vm.runInContext('flight.to.x', context), 9);
});

test("pad cancellation, retry and resize cannot launch a pending gesture", () => {
  for (const cancel of ['pointercancel', 'lostpointercapture', 'reset', 'resize']) {
    const {padHandlers, keys, context} = inputFixture();
    const event = {pointerId: 1, pointerType: 'touch', clientX: 160, clientY: 80, target: {closest() {return null}}};
    padHandlers.pointerdown(event);
    padHandlers.pointermove({...event, clientY: 48});
    if (cancel === 'reset') vm.runInContext('reset()', context);
    else if (cancel === 'resize') keys.resize();
    else padHandlers[cancel]();
    padHandlers.pointerup({...event, clientY: 48});
    assert.equal(vm.runInContext('flight === null && !aim.visible && pointer === null', context), true, cancel);
  }
});
