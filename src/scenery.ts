import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export function makeLotBase() {
  const root = new THREE.Group();
  for (const [width, height, depth, y, color, radius] of [
    [22, 0.5, 20, -0.6, 0xa8b1a5, 0.12],
    [18.8, 0.3, 16, -0.28, 0xc8cbce, 0.08],
    [18, 0.1, 15, -0.08, 0x737b83, 0.025],
  ]) {
    const slab = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 2, radius),
      new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
    slab.position.y = y;
    slab.receiveShadow = true;
    root.add(slab);
  }
  const seams: THREE.Vector3[] = [];
  for (let x = -8; x <= 8; x += 2)
    for (const side of [-1, 1]) seams.push(new THREE.Vector3(x, -0.124, side * 7.56), new THREE.Vector3(x, -0.124, side * 7.9));
  for (let z = -6; z <= 6; z += 2)
    for (const side of [-1, 1]) seams.push(new THREE.Vector3(side * 9.06, -0.124, z), new THREE.Vector3(side * 9.3, -0.124, z));
  root.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seams),
    new THREE.LineBasicMaterial({ color: 0x929b9d, transparent: true, opacity: 0.45 })));
  return root;
}

export function makeParkedCar(color: number) {
  const root = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.12 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x22343e, roughness: 0.25, metalness: 0.3 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x242a2e, roughness: 0.85 });
  const silver = new THREE.MeshStandardMaterial({ color: 0x9ca6af, roughness: 0.4, metalness: 0.65 });
  for (const [w, h, d, y, z, material] of [
    [1.45, 0.4, 2.65, 0.44, 0, paint],
    [1.12, 0.4, 1.3, 0.8, 0.1, glass],
    [1.14, 0.08, 0.9, 1.01, 0.18, paint],
    [1.34, 0.14, 0.78, 0.64, -0.85, paint],
    [1.35, 0.12, 0.48, 0.65, 1.02, paint],
    [1.35, 0.065, 0.08, 0.3, -1.3, trim],
    [1.35, 0.065, 0.08, 0.3, 1.3, trim],
  ] as [number, number, number, number, number, THREE.Material][]) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(h / 3, 0.07)), material);
    mesh.position.set(0, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
  }
  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.35, 0.065), trim);
    pillar.position.set(side * 0.565, 0.8, 0.12);
    root.add(pillar);
    for (const z of [-0.83, 0.85]) {
      for (const [radius, depth, x, material] of [
        [0.3, 0.18, 0.68, trim], [0.205, 0.185, 0.68, silver],
        [0.16, 0.188, 0.68, trim], [0.075, 0.19, 0.68, silver],
      ] as [number, number, number, THREE.Material][]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 24), material);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * x, 0.3, z);
        wheel.castShadow = true;
        root.add(wheel);
      }
    }
    for (const [z, color] of [[-1.329, 0xe4ebdf], [1.329, 0xb44b40]]) {
      const light = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.018), new THREE.MeshBasicMaterial({ color }));
      light.position.set(side * 0.43, 0.54, z);
      root.add(light);
    }
  }
  return root;
}

export function makeTree(index: number) {
  const root = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 1.6, 7),
    new THREE.MeshStandardMaterial({ color: 0x75664f, roughness: 1 }));
  trunk.position.y = 0.5;
  trunk.castShadow = true;
  root.add(trunk);
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  for (const [x, y, z, scale, color] of [
    [0, 1.85, 0, 1, 0x607748], [-0.42, 1.45, 0.12, 0.65, 0x566e43],
    [0.34, 1.6, -0.18, 0.7, 0x6b8050],
  ]) {
    const crown = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }));
    crown.position.set(x, y, z);
    crown.scale.set(scale * 0.85, scale * 1.05, scale * 0.85);
    crown.castShadow = crown.receiveShadow = true;
    root.add(crown);
  }
  root.rotation.y = index * 1.7;
  return root;
}
