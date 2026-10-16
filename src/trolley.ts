import * as THREE from "three";

export type TrolleyRoute = { from: readonly [number, number]; to: readonly [number, number] };

export function trolleyPosition(time: number, route: TrolleyRoute) {
  const progress = (1 + Math.sin(time * Math.PI / 4)) / 2;
  return {
    x: route.from[0] + (route.to[0] - route.from[0]) * progress,
    z: route.from[1] + (route.to[1] - route.from[1]) * progress,
  };
}

export function hitsTrolley(x: number, z: number, time: number, route: TrolleyRoute) {
  const trolley = trolleyPosition(time, route);
  const vertical = route.from[0] === route.to[0];
  return Math.abs(x - trolley.x) < (vertical ? 1.3 : 1.65)
    && Math.abs(z - trolley.z) < (vertical ? 2.35 : 1.95);
}

export function makeTrolley() {
  const root = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8c6cc, metalness: 0.7, roughness: 0.35 });
  const plastic = new THREE.MeshStandardMaterial({ color: 0xd95035, roughness: 0.7 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x262b30 });
  function bar(x: number, y: number, z: number, w: number, h: number, d: number, material = metal) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    root.add(mesh);
    return mesh;
  }
  // An open wire basket, not a solid box: keep the silhouette readable from above.
  for (const y of [0.65, 0.95, 1.25]) {
    for (const z of [-0.42, 0.42]) bar(0, y, z, 1.5, 0.045, 0.045);
    for (const x of [-0.75, 0.75]) bar(x, y, 0, 0.045, 0.045, 0.84);
  }
  for (let x = -0.75; x <= 0.76; x += 0.25) {
    for (const z of [-0.42, 0.42]) bar(x, 0.95, z, 0.035, 0.6, 0.035);
    bar(x, 0.65, 0, 0.035, 0.035, 0.84);
  }
  for (const z of [-0.42, 0.42]) {
    bar(-0.75, 0.72, z, 0.06, 1.12, 0.06);
    bar(0, 0.26, z, 1.5, 0.06, 0.06);
    bar(-0.9, 1.35, z, 0.35, 0.06, 0.06);
  }
  bar(-1.05, 1.35, 0, 0.1, 0.1, 1, plastic);
  const wheels: THREE.Mesh[] = [];
  for (const x of [-0.62, 0.62]) for (const z of [-0.42, 0.42]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10), rubber);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.14, z);
    root.add(wheel);
    wheels.push(wheel);
  }
  // One lonely grocery item accompanies the runaway trolley.
  bar(0.25, 0.88, 0, 0.32, 0.42, 0.28, plastic);
  return { root, update(time: number, reducedMotion: boolean, route: TrolleyRoute) {
    const point = trolleyPosition(time, route);
    root.position.set(point.x, 0, point.z);
    root.rotation.y = Math.atan2(-(route.to[1] - route.from[1]), route.to[0] - route.from[0]);
    root.rotation.z = reducedMotion ? 0 : Math.sin(time * 18) * 0.025;
    wheels[0].rotation.y = reducedMotion ? 0 : Math.sin(time * 22) * 0.4;
  } };
}
