import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { makeDamage } from "../src/damage.ts";
import { makeTrolley } from "../src/trolley.ts";

test("damage counts once, stays flattened, and restores original parts", () => {
  const { root } = makeTrolley();
  const original = root.children.map((part) => part.matrix.clone());
  root.children.forEach((part, i) => { part.updateMatrix(); original[i].copy(part.matrix); });
  const damage = makeDamage(root, "trolley");
  assert.equal(damage.crush(false), true);
  damage.update(1, false);
  assert.equal(damage.crush(false), false);
  assert.ok(root.children[0].position.y < 0.1);
  damage.restore(false);
  root.children.forEach((part, i) => { part.updateMatrix(); assert.deepEqual(part.matrix, original[i]); });
  assert.equal(damage.crush(true), true);
  assert.ok(root.children[0].position.y < 0.1);
});

test("replay restoration reproduces the final wreck without replaying animation", () => {
  const root = new THREE.Group();
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1));
  roof.position.y = 1;
  root.add(roof);
  const damage = makeDamage(root, "car");
  damage.crush(false);
  damage.update(1, false);
  roof.updateMatrix();
  const wreck = roof.matrix.clone();
  damage.restore(false);
  damage.restore(true);
  roof.updateMatrix();
  assert.deepEqual(roof.matrix, wreck);
  assert.equal(damage.crush(true), false);
});

test("car dents preserve wheels and chassis and reset roof vertices", async () => {
  const { makeParkedCar } = await import("../src/scenery.ts");
  const root = makeParkedCar(0x8899aa);
  const chassis = root.children[0] as THREE.Mesh;
  const roof = root.children[2] as THREE.Mesh;
  const wheel = root.children.find((part) => part instanceof THREE.Mesh && part.geometry instanceof THREE.CylinderGeometry)!;
  wheel.updateMatrix();
  const wheelMatrix = wheel.matrix.clone();
  const original = Float32Array.from(roof.geometry.getAttribute("position").array);
  const damage = makeDamage(root, "car");
  damage.crush(false);
  damage.update(0.12, false);
  const compressed = Float32Array.from(roof.geometry.getAttribute("position").array);
  damage.update(0.53, false);
  const settled = Float32Array.from(roof.geometry.getAttribute("position").array);
  assert.ok(settled.some((value, i) => i % 3 === 1 && value < original[i] - 0.05));
  assert.ok(settled.some((value, i) => i % 3 === 1 && value > compressed[i]));
  assert.deepEqual(chassis.scale.toArray(), [1, 1, 1]);
  wheel.updateMatrix();
  assert.deepEqual(wheel.matrix, wheelMatrix);
  assert.equal(root.children.at(-1)!.visible, true);
  damage.restore(false);
  assert.deepEqual(Float32Array.from(roof.geometry.getAttribute("position").array), original);
  assert.equal(root.children.at(-1)!.visible, false);
  damage.restore(true);
  assert.deepEqual(Float32Array.from(roof.geometry.getAttribute("position").array), settled);
});

test("landing support follows roof compression and restores with the damage state", async () => {
  const { makeParkedCar } = await import("../src/scenery.ts");
  const { vehicleLandingHeight, vehicleShapes } = await import("../src/vehicles.ts");
  for (const model of ["compact", "fastback", "suv", "semi"] as const) {
    const { roof } = vehicleShapes[model];
    const damage = makeDamage(makeParkedCar(0x8899aa, model), "car", roof.height, roof.z);
    damage.crush(true);
    const support = vehicleLandingHeight(model, 0, roof.z, 0.75, 1.3, damage.roofDrop, damage.bodyDrop);
    assert.ok(Math.abs(support - (roof.height - 0.145)) < 1e-10);
    damage.restore(false);
    assert.equal(damage.roofDrop, 0);
    assert.equal(damage.bodyDrop, 0);
  }
});
