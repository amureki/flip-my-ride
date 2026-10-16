import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { fitsParkingBay, makeParkingFeedback } from '../src/parking-feedback.ts';

test('fit feedback uses the full-car parking limits', () => {
  assert.equal(fitsParkingBay(0.51, 0.68, 0, 0), true);
  assert.equal(fitsParkingBay(0.511, 0, 0, 0), false);
  assert.equal(fitsParkingBay(0, -0.681, 0, 0), false);
});

test('success pulses once, resets, and respects reduced motion', () => {
  const bay = new THREE.Group();
  const border = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  const feedback = makeParkingFeedback(bay, [border]);
  const pulse = bay.children[0] as THREE.LineLoop;
  feedback.update(0.2, true, false, false);
  assert.ok(border.material.emissiveIntensity > 0);
  feedback.update(0.1, false, true, false);
  assert.equal(pulse.visible, true);
  feedback.update(1, false, true, false);
  assert.equal(pulse.visible, false);
  feedback.update(0.1, false, true, false);
  assert.equal(pulse.visible, false);
  feedback.update(0.1, false, false, false);
  feedback.update(0.1, false, true, true);
  assert.equal(pulse.visible, false);
});
