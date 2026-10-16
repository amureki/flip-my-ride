import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { levels } from "../src/levels.ts";
import { vehicleLandingHeight } from "../src/vehicles.ts";
import { makeEasterEggs } from "../src/easter-eggs.ts";

test("discoveries deduplicate, queue, reset and restore without changing gameplay objects", () => {
  const banner = { textContent: "", hidden: true };
  const context = { fillStyle: "", textAlign: "", font: "", fillRect() {}, fillText() {}, beginPath() {}, roundRect() {}, moveTo() {}, lineTo() {}, fill() {} };
  const previous = globalThis.document;
  globalThis.document = { hidden: false, querySelector: (id: string) => id === "#discovery" ? banner : null,
    createElement: () => ({ getContext: () => context }) } as unknown as Document;
  try {
    const scene = new THREE.Scene(), sign = new THREE.Group(), car = new THREE.Group();
    sign.position.set(4.2, 0, -5.9);
    scene.add(sign);
    const eggs = makeEasterEggs(sign, car, new THREE.Group(), [new THREE.Group()]);
    eggs.reset(true, "Please don’t.");
    eggs.land(4.2, -4.5, [0], true, false);
    eggs.update(0.01, false);
    assert.match(banner.textContent, /Sign language/);
    const bubbles = scene.children.filter((child) => child instanceof THREE.Sprite);
    assert.equal(bubbles[0].visible, true);
    assert.equal(bubbles[1].visible, false);
    eggs.update(0.85, false);
    assert.equal(bubbles[0].visible, false);
    assert.equal(bubbles[1].visible, true);
    assert.equal(sign.rotation.x, -Math.PI / 2);
    assert.equal(car.children[0].visible, true);
    eggs.update(3.6, false);
    assert.match(banner.textContent, /flip of the hat/);
    eggs.update(3.6, false);
    assert.match(banner.textContent, /Beep!/);
    eggs.land(0, 0, [0], false, false);
    eggs.update(3.6, false);
    assert.match(banner.textContent, /Car-ma/);
    assert.ok(bubbles.every((bubble) => !bubble.visible));
    const saved = eggs.snapshot();
    eggs.reset(false, "Please don’t.");
    assert.equal(sign.rotation.x, 0);
    assert.ok(bubbles.every((bubble) => !bubble.visible));
    assert.equal(car.children[0].visible, false);
    eggs.land(4.2, -4.5, [0], true, false);
    eggs.update(0.1, false);
    assert.equal(banner.hidden, true);
    eggs.reset(false, "Please don’t.");
    eggs.restore(saved);
    assert.deepEqual(eggs.snapshot(), saved);
    assert.equal(car.children[0].visible, true);
    eggs.reset(true, "Please don’t.");
    eggs.land(4.2, -4.5, [], true, true);
    eggs.update(0.1, false);
    assert.equal(banner.hidden, true);
    assert.equal(car.children[0].visible, true);
    eggs.reset(true, "Please don’t.");
    eggs.land(4.2, -4.5, [], false, false);
    eggs.update(0.1, false);
    assert.equal(banner.hidden, false);
  } finally { globalThis.document = previous; }
});


test("each curbside sign is reachable from a clear in-bounds landing away from the goal", () => {
  for (const level of levels) {
    assert.ok(level.sign[0] <= -9 && level.sign[0] >= -9.4, level.name);
    const [x, z] = [-7.6, level.sign[1]];
    assert.ok(Math.abs(x - level.sign[0]) < 2.1, level.name);
    assert.ok(Math.abs(x) <= 7.7 && Math.abs(z) <= 5.7, level.name);
    assert.ok(Math.hypot(x - level.start[0], z - level.start[1]) <= 9, level.name);
    assert.ok(Math.hypot(x - level.target[0], z - level.target[1]) > 4, level.name);
    for (const [cx, cz, model] of level.cars)
      assert.equal(vehicleLandingHeight(model, x - cx, z - cz), 0, level.name);
    for (const [cx, cz] of level.cones)
      assert.ok(Math.abs(x - cx) >= 1.05 || Math.abs(z - cz) >= 1.6, level.name);
  }
});
