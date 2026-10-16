import * as THREE from "three";
import { mergeGeometries, toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

function loft(rings: number[][][], material: THREE.Material) {
  const count = rings[0].length;
  const vertices = rings.flat(2);
  const indices: number[] = [];
  for (let row = 0; row < rings.length - 1; row++) {
    for (let edge = 0; edge < count; edge++) {
      const a = row * count + edge;
      const b = row * count + (edge + 1) % count;
      indices.push(a, b, b + count, a, b + count, a + count);
    }
  }
  for (let i = 1; i < count - 1; i++) {
    indices.push(0, i + 1, i);
    const end = (rings.length - 1) * count;
    indices.push(end, end + i, end + i + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const surface = toCreasedNormals(geometry, 0.35);
  geometry.dispose();
  const mesh = new THREE.Mesh(surface, material);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

export function makeRoadster() {
  const car = new THREE.Group();
  const suspension = new THREE.Group();
  const wheels = new Set<THREE.Object3D>();
  car.scale.x = 0.88;
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0xf0f1f3, roughness: 0.34, metalness: 0.16,
    clearcoat: 0.55, clearcoatRoughness: 0.3,
  });
  const black = new THREE.MeshStandardMaterial({ color: 0x11151a, roughness: 0.52 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x302b27, roughness: 0.3, metalness: 0.22,
    clearcoat: 0.65, clearcoatRoughness: 0.28,
  });
  const silver = new THREE.MeshStandardMaterial({ color: 0xb3b9c0, metalness: 0.8, roughness: 0.3 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x16191d, roughness: 0.95 });
  const addBox = (size: number[], position: number[], material: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size as [number, number, number]), material);
    mesh.position.set(...position as [number, number, number]);
    mesh.castShadow = mesh.receiveShadow = true;
    car.add(mesh);
    return mesh;
  };

  // The outer lower edge rises over each tire; the central floor stays closed.
  const profiles = [
    [-1.34, 0.65, 0.43, 0.48], [-1.18, 0.74, 0.55, 0.57],
    [-0.85, 0.8, 0.66, 0.65], [-0.45, 0.77, 0.64, 0.65],
    [0.2, 0.77, 0.63, 0.66], [0.85, 0.81, 0.68, 0.69],
    [1.18, 0.78, 0.64, 0.67], [1.31, 0.76, 0.61, 0.65],
  ];
  const bodyRings: number[][][] = [];
  for (let i = 0; i <= 100; i++) {
    const z = -1.34 + 2.65 * i / 100;
    let segment = 0;
    while (segment < profiles.length - 2 && z > profiles[segment + 1][0]) segment++;
    const a = profiles[segment], b = profiles[segment + 1];
    const t = (z - a[0]) / (b[0] - a[0]);
    const width = THREE.MathUtils.lerp(a[1], b[1], t);
    const shoulder = THREE.MathUtils.lerp(a[2], b[2], t);
    const top = THREE.MathUtils.lerp(a[3], b[3], t);
    let lower = 0.19;
    for (const wheelZ of [-0.85, 0.85]) {
      const distance = Math.abs(z - wheelZ);
      if (distance < 0.335) lower = Math.max(lower, 0.31 + Math.sqrt(0.335 ** 2 - distance ** 2));
    }
    bodyRings.push([
      [-0.48, 0.19, z], [0.48, 0.19, z],
      [width, lower, z], [width, Math.max(shoulder, lower + 0.016), z],
      [width * 0.81, top, z], [-width * 0.81, top, z],
      [-width, Math.max(shoulder, lower + 0.016), z], [-width, lower, z],
    ]);
  }
  car.add(loft(bodyRings, paint));

  // One continuous glazed canopy, broad at the windshield and tapered at the tail.
  const canopy = [
    [-1.02, 0.55, 0.6, 0.615], [-0.65, 0.6, 0.65, 0.84],
    [-0.25, 0.57, 0.66, 0.94], [0.2, 0.53, 0.67, 0.945],
    [0.65, 0.43, 0.69, 0.85], [1.11, 0.28, 0.68, 0.7],
  ];
  const canopyCurve = new THREE.CatmullRomCurve3(
    canopy.map(([z, width, , top]) => new THREE.Vector3(width, top, z)),
  );
  const canopyRings = Array.from({ length: 61 }, (_, index) => {
    const { x: width, y: top, z } = canopyCurve.getPoint(index / 60);
    const base = THREE.MathUtils.lerp(0.6, 0.68, index / 60);
    const ring = [[-width, base, z], [width, base, z]];
    for (let cross = 1; cross < 20; cross++) {
      const angle = cross / 20 * Math.PI;
      ring.push([width * Math.cos(angle), base + (top - base) * Math.sin(angle) ** 0.45, z]);
    }
    return ring;
  });
  car.add(loft(canopyRings, glass));

  for (const side of [-1, 1]) {
    addBox([0.055, 0.06, 1.05], [side * 0.754, 0.19, 0], black);
    const seam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(side * 0.776, 0.62, 0.3),
      new THREE.Vector3(side * 0.778, 0.25, 0.27),
      new THREE.Vector3(side * 0.778, 0.22, -0.46),
    ]), new THREE.LineBasicMaterial({ color: 0x73777d, transparent: true, opacity: 0.45 }));
    car.add(seam);
  }
  addBox([1.29, 0.055, 0.1], [0, 0.22, -1.3], black);
  addBox([1.43, 0.21, 0.065], [0, 0.48, 1.315], black);
  addBox([1.16, 0.19, 0.2], [0, 0.265, 1.24], black);
  for (const x of [-0.48, -0.24, 0, 0.24, 0.48])
    addBox([0.025, 0.18, 0.24], [x, 0.24, 1.2], black);
  // Lowered active spoiler follows the deck instead of standing on exposed supports.
  addBox([1.48, 0.025, 0.13], [0, 0.665, 1.245], paint);
  addBox([1.46, 0.012, 0.025], [0, 0.668, 1.309], black);
  const brakeLight = new THREE.MeshStandardMaterial({ color: 0x9c1626, emissive: 0xff1734, emissiveIntensity: 0.35, roughness: 0.35 });
  for (const [z, y, width, color] of [
    [-1.347, 0.435, 1.27, 0xeaf5ff], [1.351, 0.604, 1.42, 0xff1734],
  ]) {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.018, 0.012),
      z > 0 ? brakeLight : new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, roughness: 0.3 }),
    );
    light.position.set(0, y, z);
    car.add(light);
  }
  const rearPortGeometry = new THREE.TorusGeometry(0.032, 0.006, 6, 16);
  for (const x of [-0.3, -0.1, 0.1, 0.3]) {
    const port = new THREE.Mesh(rearPortGeometry, silver);
    port.position.set(x, 0.38, 1.35);
    car.add(port);
  }

  const tireGeometry = new THREE.CylinderGeometry(0.31, 0.31, 0.18, 32);
  const barrelGeometry = new THREE.CircleGeometry(0.255, 32);
  const lipGeometry = new THREE.TorusGeometry(0.248, 0.009, 6, 32);
  const hubGeometry = new THREE.CircleGeometry(0.047, 16);
  const blades = Array.from({ length: 5 }, (_, index) => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.025, 0.04);
    shape.lineTo(-0.065, 0.22);
    shape.lineTo(0.018, 0.247);
    shape.lineTo(0.065, 0.2);
    shape.lineTo(0.035, 0.065);
    shape.closePath();
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateZ(index * Math.PI * 2 / 5);
    return geometry;
  });
  const spokeGeometry = mergeGeometries(blades);
  blades.forEach((geometry) => geometry.dispose());
  for (const side of [-1, 1])
    for (const z of [-0.85, 0.85]) {
      const tire = new THREE.Mesh(tireGeometry, rubber);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(side * 0.69, 0.31, z);
      tire.castShadow = tire.receiveShadow = true;
      car.add(tire);
      wheels.add(tire);
      const wheel = new THREE.Group();
      wheel.position.set(side * 0.783, 0.31, z);
      wheel.rotation.y = side * Math.PI / 2;
      const barrel = new THREE.Mesh(barrelGeometry, black);
      const lip = new THREE.Mesh(lipGeometry, silver);
      const spokes = new THREE.Mesh(spokeGeometry, silver);
      const hub = new THREE.Mesh(hubGeometry, silver);
      lip.position.z = 0.005;
      spokes.position.z = 0.009;
      hub.position.z = 0.012;
      wheel.add(barrel, lip, spokes, hub);
      car.add(wheel);
      wheels.add(wheel);
    }
  const jets = new THREE.Group();
  const exhausts: THREE.Object3D[] = [];
  const sideJets = new THREE.Group();
  for (const x of [-0.53, 0.53])
    for (const z of [-0.85, 0.85]) {
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.12, 12), black);
      nozzle.position.set(x, 0.16, z);
      car.add(nozzle);
      const outlet = new THREE.Object3D();
      outlet.position.set(x, 0.1, z);
      outlet.rotation.z = Math.PI;
      jets.add(outlet);
      exhausts.push(outlet);
    }
  for (const side of [-1, 1])
    for (const z of [-0.42, 0.42]) {
      const outlet = new THREE.Group();
      outlet.position.set(side * 0.78, 0.43, z);
      outlet.rotation.z = -side * Math.PI / 2;
      sideJets.add(outlet);
      exhausts.push(outlet);
    }
  sideJets.visible = jets.visible = false;
  car.add(sideJets, jets);
  for (const part of [...car.children])
    if (!wheels.has(part)) suspension.add(part);
  car.add(suspension);
  return { car, jets, sideJets, exhausts, suspension, brakeLight };
}
