import * as THREE from "three";

export function makeContactShadow(scene: THREE.Scene, receivers: THREE.Group[]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(20,27,35,0.65)");
  gradient.addColorStop(0.45, "rgba(20,27,35,0.28)");
  gradient.addColorStop(1, "rgba(20,27,35,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  const patches = [
    [0, 0, 1.9, 2.85, 0.3],
    [-0.61, -0.85, 0.38, 0.54, 0.62],
    [0.61, -0.85, 0.38, 0.54, 0.62],
    [-0.61, 0.85, 0.38, 0.54, 0.62],
    [0.61, 0.85, 0.38, 0.54, 0.62],
  ].map(([x, z, width, length, opacity]) => {
    const geometry = new THREE.PlaneGeometry(width, length, 4, 4);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(x, 0, z);
    const original = Float32Array.from(geometry.getAttribute("position").array);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true,
      opacity, depthWrite: false, toneMapped: false, polygonOffset: true,
      polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return { mesh, original, opacity, indices: Array.from(geometry.index!.array) };
  });
  const ray = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  let previous = "";
  return {
    update(pivot: THREE.Group, supportHeight: number) {
      const signature = [...pivot.position.toArray(), pivot.rotation.y, supportHeight,
        ...receivers.map((car) => Number(car.visible))].join();
      if (signature === previous) return;
      previous = signature;
      const height = Math.max(0, pivot.position.y - 0.5);
      const nearby = receivers.filter((car) => car.visible &&
        Math.abs(car.position.x - pivot.position.x) < 3 && Math.abs(car.position.z - pivot.position.z) < 4);
      nearby.forEach((car) => car.updateWorldMatrix(true, true));
      const c = Math.cos(pivot.rotation.y), s = Math.sin(pivot.rotation.y);
      for (const { mesh, original, opacity, indices } of patches) {
        const vertices = mesh.geometry.getAttribute("position");
        const spread = 1 + Math.min(height, 2) * 0.08;
        for (let i = 0; i < vertices.count; i++) {
          const x = original[i * 3] * spread, z = original[i * 3 + 2] * spread;
          const wx = pivot.position.x + x * c + z * s;
          const wz = pivot.position.z - x * s + z * c;
          ray.set(new THREE.Vector3(wx, height + 0.3, wz), down);
          const hit = nearby.length ? ray.intersectObjects(nearby, true)[0] : undefined;
          vertices.setXYZ(i, wx, Math.max(0.025, (hit?.point.y ?? 0) + 0.008), wz);
        }
        // Do not bridge a roof edge with a dark vertical sheet.
        const surfaceTriangles: number[] = [];
        for (let i = 0; i < indices.length; i += 3) {
          const triangle = indices.slice(i, i + 3);
          const ys = triangle.map((index) => vertices.getY(index));
          if (Math.max(...ys) - Math.min(...ys) < 0.22) surfaceTriangles.push(...triangle);
        }
        mesh.geometry.setIndex(surfaceTriangles);
        vertices.needsUpdate = true;
        mesh.geometry.computeBoundingSphere();
        mesh.material.opacity = opacity * Math.exp(-Math.max(0, height - supportHeight) * 2.5);
        mesh.visible = mesh.material.opacity > 0.01;
      }
    },
  };
}
