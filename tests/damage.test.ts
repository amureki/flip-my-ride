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
