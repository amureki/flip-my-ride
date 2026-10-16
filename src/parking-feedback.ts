import * as THREE from "three";

export function fitsParkingBay(x: number, z: number, targetX: number, targetZ: number) {
  return Math.abs(x - targetX) <= 0.51 && Math.abs(z - targetZ) <= 0.68;
}

export function makeParkingFeedback(bay: THREE.Group, borders: THREE.Mesh[]) {
  const borderMaterial = new THREE.MeshStandardMaterial({ color: 0xeaffc6, roughness: 0.85,
    emissive: 0xb9d69b, emissiveIntensity: 0 });
  for (const border of borders) {
    (border.material as THREE.Material).dispose();
    border.material = borderMaterial;
  }
  const pulse = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-1.4, 0.065, -2.1), new THREE.Vector3(1.4, 0.065, -2.1),
    new THREE.Vector3(1.4, 0.065, 2.1), new THREE.Vector3(-1.4, 0.065, 2.1),
  ]), new THREE.LineBasicMaterial({ color: 0xdcecc9, transparent: true, opacity: 0, depthWrite: false }));
  bay.add(pulse);
  let brightness = 0, age = 1, wasWon = false;
  return {
    update(dt: number, fits: boolean, won: boolean, reducedMotion: boolean) {
      if (won && !wasWon) age = 0;
      if (!won) age = 1;
      wasWon = won;
      age = Math.min(1, age + dt / 0.85);
      const target = fits && !won ? 0.22 : won ? 0.16 * (1 - age) : 0;
      brightness = reducedMotion ? target : THREE.MathUtils.damp(brightness, target, 12, dt);
      borderMaterial.emissiveIntensity = brightness;
      pulse.visible = won && age < 1 && !reducedMotion;
      pulse.material.opacity = 0.32 * Math.sin(Math.PI * age) * (1 - age);
      pulse.scale.setScalar(1 + age * 0.035);
    },
  };
}
