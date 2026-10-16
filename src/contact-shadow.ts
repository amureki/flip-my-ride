import * as THREE from "three";

export function makeContactShadow(scene: THREE.Scene) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(20,27,35,0.7)");
  gradient.addColorStop(0.4, "rgba(20,27,35,0.4)");
  gradient.addColorStop(1, "rgba(20,27,35,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const material = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const shadow = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(1, 1);
  for (const [x, z, width, length] of [
    [0, 0, 2.2, 3.2],
    [-0.74, -0.85, 0.55, 0.7],
    [0.74, -0.85, 0.55, 0.7],
    [-0.74, 0.85, 0.55, 0.7],
    [0.74, 0.85, 0.55, 0.7],
  ]) {
    const patch = new THREE.Mesh(geometry, material);
    patch.rotation.x = -Math.PI / 2;
    patch.scale.set(width, length, 1);
    patch.position.set(x, 0, z);
    shadow.add(patch);
  }
  scene.add(shadow);
  return {
    update(pivot: THREE.Group) {
      const height = Math.max(0, pivot.position.y - 0.5);
      shadow.position.set(pivot.position.x, 0.045, pivot.position.z);
      shadow.rotation.y = pivot.rotation.y;
      shadow.scale.setScalar(1 + height * 0.18);
      material.opacity = 0.65 * Math.exp(-height * 2.5);
      shadow.visible = material.opacity > 0.01;
    },
  };
}
