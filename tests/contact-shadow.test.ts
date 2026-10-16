import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { makeContactShadow } from '../src/contact-shadow.ts';

test('contact shadows follow roof geometry, fade in flight, and return to ground', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    createElement: () => ({ getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }) }),
  } });
  try {
    const scene = new THREE.Scene();
    const roof = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, 2.6));
    body.position.y = 0.5;
    roof.add(body);
    scene.add(roof);
    const shadow = makeContactShadow(scene, [roof]);
    const pivot = new THREE.Group();
    pivot.position.y = 1.5;
    shadow.update(pivot, 1);
    const patch = scene.children[1] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    assert.ok(Math.abs(patch.geometry.getAttribute('position').getY(12) - 1.008) < 1e-6);
    assert.equal(patch.material.opacity, 0.3);
    pivot.position.y = 4;
    shadow.update(pivot, 1);
    assert.ok(patch.material.opacity < 0.01);
    roof.visible = false;
    pivot.position.y = 0.5;
    shadow.update(pivot, 0);
    assert.ok(Math.abs(patch.geometry.getAttribute('position').getY(12) - 0.025) < 1e-6);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});
