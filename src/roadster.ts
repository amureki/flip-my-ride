import * as THREE from "three";

// Cross-sections keep the silhouette angular without loading a model or textures.
function shell(sections: number[][], material: THREE.Material) {
  const vertices: number[] = [];
  for (const [z, width, bottom, top, roofWidth] of sections) {
    vertices.push(
      -width,
      bottom,
      z,
      width,
      bottom,
      z,
      roofWidth,
      top,
      z,
      -roofWidth,
      top,
      z,
    );
  }
  const indices = [0, 2, 1, 0, 3, 2];
  for (let row = 0; row < sections.length - 1; row++) {
    for (let edge = 0; edge < 4; edge++) {
      const a = row * 4 + edge,
        b = row * 4 + ((edge + 1) % 4);
      indices.push(a, b, b + 4, a, b + 4, a + 4);
    }
  }
  const end = (sections.length - 1) * 4;
  indices.push(end, end + 1, end + 2, end, end + 2, end + 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makeRoadster() {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0xf4f5f7,
    roughness: 0.3,
    clearcoat: 0.65,
    clearcoatRoughness: 0.22,
    metalness: 0.25,
    flatShading: true,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x10151c,
    roughness: 0.48,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x172a37,
    roughness: 0.16,
    metalness: 0.5,
  });
  const silver = new THREE.MeshStandardMaterial({
    color: 0x8996a3,
    metalness: 0.7,
    roughness: 0.25,
  });
  car.add(
    shell(
      [
        [-1.34, 0.65, 0.26, 0.35, 0.62],
        [-0.9, 0.79, 0.24, 0.53, 0.68],
        [0.55, 0.8, 0.25, 0.57, 0.68],
        [1.31, 0.74, 0.28, 0.49, 0.7],
      ],
      paint,
    ),
  );
  car.add(
    shell(
      [
        [-0.58, 0.59, 0.5, 0.51, 0.57],
        [-0.1, 0.62, 0.52, 0.85, 0.48],
        [0.48, 0.62, 0.54, 0.85, 0.48],
        [0.91, 0.58, 0.51, 0.56, 0.54],
      ],
      glass,
    ),
  );
  const addBox = (size: number[], pos: number[], material: THREE.Material) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...(size as [number, number, number])),
      material,
    );
    mesh.position.set(...(pos as [number, number, number]));
    mesh.castShadow = true;
    car.add(mesh);
    return mesh;
  };
  addBox([1.34, 0.055, 0.15], [0, 0.25, -1.28], black);
  addBox([1.28, 0.13, 0.25], [0, 0.24, 1.22], black);
  for (const x of [-0.7, 0.7]) {
    addBox([0.08, 0.12, 1.6], [x, 0.25, 0.1], black);
    addBox([0.08, 0.2, 0.1], [x, 0.61, 1.12], black);
  }
  addBox([1.6, 0.06, 0.24], [0, 0.72, 1.12], black);
  const lights = new THREE.MeshBasicMaterial({ color: 0xe5f6ff });
  addBox([1.22, 0.035, 0.035], [0, 0.37, -1.345], lights);
  addBox(
    [1.34, 0.035, 0.035],
    [0, 0.48, 1.315],
    new THREE.MeshBasicMaterial({ color: 0xff263b }),
  );
  for (const x of [-0.74, 0.74])
    for (const z of [-0.85, 0.85]) {
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.29, 0.29, 0.19, 20),
        black,
      );
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, 0.29, z);
      tire.castShadow = true;
      car.add(tire);
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.21, 0.21, 0.195, 10),
        silver,
      );
      rim.rotation.z = Math.PI / 2;
      rim.position.copy(tire.position);
      car.add(rim);
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.2, 10),
        black,
      );
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(tire.position);
      car.add(hub);
    }
  const jets = new THREE.Group();
  const exhausts: THREE.Object3D[] = [];
  const sideJets = new THREE.Group();
  for (const x of [-0.53, 0.53])
    for (const z of [-0.85, 0.85]) {
      const nozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.16, 12),
        black,
      );
      nozzle.position.set(x, 0.18, z);
      car.add(nozzle);
      const outlet = new THREE.Object3D();
      outlet.position.set(x, 0.1, z);
      outlet.rotation.z = Math.PI;
      jets.add(outlet);
      exhausts.push(outlet);
    }
  for (const side of [-1, 1]) {
    for (const z of [-0.42, 0.42]) {
      const outlet = new THREE.Group();
      outlet.position.set(side * 0.8, 0.43, z);
      outlet.rotation.z = -side * Math.PI / 2;
      sideJets.add(outlet);
      exhausts.push(outlet);
    }
  }
  sideJets.visible = false;
  car.add(sideJets);
  jets.visible = false;
  car.add(jets);
  return { car, jets, sideJets, exhausts };
}
