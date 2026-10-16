import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { vehicleShapes, vehicleLandingHeight, type VehicleModel } from "../src/vehicles.ts";
import { makeParkedCar } from "../src/scenery.ts";
import { makeDamage } from "../src/damage.ts";
import { levels } from "../src/levels.ts";

for (const model of Object.keys(vehicleShapes) as VehicleModel[]) {
  test(`${model}: mesh dimensions, landing surfaces, and damage restoration agree`, () => {
    const { body, roof } = vehicleShapes[model];
    const root = makeParkedCar(0x8899aa, model);
    const bounds = new THREE.Box3().setFromObject(root);
    assert.ok(Math.abs(bounds.max.y - roof.height) < 0.001);
    assert.equal(vehicleLandingHeight(model, 0, roof.z), roof.height);
    assert.equal(vehicleLandingHeight(model, body.width / 2 + 0.76, 0), 0);
    assert.equal(vehicleLandingHeight(model, 0, body.length / 2 + 1.31), 0);
    const mesh = root.children[2] as THREE.Mesh;
    const original = Float32Array.from(mesh.geometry.getAttribute("position").array);
    const damage = makeDamage(root, "car", roof.height, roof.z);
    damage.crush(true);
    assert.ok(mesh.geometry.getAttribute("position").array.some((v, i) => i % 3 === 1 && v < original[i]));
    damage.restore(false);
    assert.deepEqual(Float32Array.from(mesh.geometry.getAttribute("position").array), original);
  });
}
test("Semi rear chassis stays below its cab, and only appears in a later lot", () => {
  assert.equal(vehicleLandingHeight("semi", 0, 2), vehicleShapes.semi.body.height);
  assert.ok(levels.slice(0, 2).every(level => level.cars.every(car => car[2] !== "semi")));
  assert.ok(levels[2].cars.some(car => car[2] === "semi"));
});
test("every lot keeps its start and target clear of all vehicle footprints", () => {
  for (const level of levels) for (const [x, z, model] of level.cars) {
    for (const point of [level.start, level.target])
      assert.equal(vehicleLandingHeight(model, point[0] - x, point[1] - z), 0, level.name);
  }
});
