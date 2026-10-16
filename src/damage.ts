import * as THREE from "three";

export function makeDamage(root: THREE.Group, kind: "car" | "trolley", roofHeight = 1.05, roofZ = 0) {
  const parts = root.children.map((mesh) => ({
    mesh, position: mesh.position.clone(), scale: mesh.scale.clone(), rotation: mesh.rotation.clone(),
  }));
  const deformable = kind === "car" ? parts.flatMap(({ mesh, position }) => {
    if (!(mesh instanceof THREE.Mesh) || mesh.geometry instanceof THREE.CylinderGeometry) return [];
    mesh.geometry.computeBoundingBox();
    if (position.y + mesh.geometry.boundingBox!.max.y * mesh.scale.y < roofHeight - 0.1) return [];
    mesh.geometry = mesh.geometry.clone();
    const vertices = mesh.geometry.getAttribute("position");
    return [{ mesh, vertices, original: Float32Array.from(vertices.array) }];
  }) : [];
  function dent(x: number, y: number, z: number) {
    const height = THREE.MathUtils.smoothstep(y, roofHeight - 0.45, roofHeight - 0.05);
    const hollow = Math.exp(-((x - 0.1) ** 2 / 0.2 + (z - roofZ - 0.1) ** 2 / 0.32));
    return height * (0.12 + hollow * 0.1);
  }
  const scuffPoints: THREE.Vector3[] = [];
  root.updateWorldMatrix(true, true);
  const ray = new THREE.Raycaster();
  if (kind === "car") {
    for (const [x, z, length] of [[-0.22, 0.04, 0.26], [-0.16, 0.11, 0.18], [0.17, 0.25, 0.15]]) {
      for (let i = 0; i < 8; i++) {
        for (const t of [i / 8, (i + 1) / 8]) {
          const px = x + t * length;
          const pz = roofZ + z + t * 0.045;
          ray.set(root.localToWorld(new THREE.Vector3(px, roofHeight + 1, pz)), new THREE.Vector3(0, -1, 0));
          const hit = ray.intersectObjects(deformable.map(({ mesh }) => mesh), false)[0];
          const y = hit ? root.worldToLocal(hit.point).y : roofHeight;
          scuffPoints.push(new THREE.Vector3(px, y + 0.005 - dent(px, y, pz), pz));
        }
      }
    }
  }
  const scuffs = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(scuffPoints),
    new THREE.LineBasicMaterial({ color: 0x41464a, transparent: true, opacity: 0.5, depthWrite: false }));
  scuffs.visible = false;
  if (kind === "car") root.add(scuffs);
  let elapsed = 0;
  let damaged = false;
  let progress = 0;
  function render() {
    for (const { mesh, position, scale, rotation } of parts) {
      mesh.position.copy(position);
      mesh.scale.copy(scale);
      mesh.rotation.copy(rotation);
      if (kind === "car") {
        const wheel = mesh instanceof THREE.Mesh && mesh.geometry instanceof THREE.CylinderGeometry;
        if (!wheel) {
          mesh.position.y -= progress * 0.025;
        }
        continue;
      }
      const wheel = mesh instanceof THREE.Mesh && mesh.geometry instanceof THREE.CylinderGeometry;
      mesh.position.y *= 1 - progress * 0.88;
      mesh.scale.y *= 1 - progress * 0.86;
      if (wheel) {
        mesh.position.x *= 1 + progress * 0.3;
        mesh.position.z *= 1 + progress * 0.18;
        mesh.rotation.z += Math.sign(position.x) * progress * 0.8;
      } else {
        mesh.scale.x *= 1 + progress * 0.12;
        mesh.rotation.z += Math.sign(position.x || 1) * progress * 0.15;
      }
    }
    for (const { mesh, vertices, original } of deformable) {
      for (let i = 0; i < vertices.count; i++) {
        const x = original[i * 3];
        const y = original[i * 3 + 1];
        const z = original[i * 3 + 2];
        vertices.setXYZ(i, x, y - progress * dent(x + mesh.position.x, y + mesh.position.y + progress * 0.025, z + mesh.position.z), z);
      }
      vertices.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
    }
    scuffs.visible = kind === "car" && damaged && elapsed >= 0.45;
    scuffs.position.y = -progress * 0.025;
  }
  return {
    get damaged() { return damaged; },
    get roofDrop() { return kind === "car" ? progress * 0.145 : 0; },
    get bodyDrop() { return kind === "car" ? progress * 0.025 : 0; },
    crush(reducedMotion: boolean) {
      if (damaged) return false;
      damaged = true;
      elapsed = reducedMotion ? 0.65 : 0;
      progress = reducedMotion ? 1 : 0;
      render();
      return true;
    },
    restore(value: boolean) {
      damaged = value;
      elapsed = value ? 0.65 : 0;
      progress = value ? 1 : 0;
      render();
    },
    update(dt: number, reducedMotion: boolean) {
      if (!damaged || elapsed >= 0.65) return;
      elapsed = reducedMotion ? 0.65 : Math.min(0.65, elapsed + dt);
      if (kind === "car") {
        const attack = Math.min(1, elapsed / 0.12);
        const settle = Math.max(0, (elapsed - 0.12) / 0.53);
        progress = elapsed < 0.12 ? 1.12 * (1 - (1 - attack) ** 3)
          : 1 + 0.12 * Math.cos(settle * Math.PI * 2) * (1 - settle) ** 2;
      } else progress = Math.min(1, elapsed * 7);
      render();
    },
  };
}
