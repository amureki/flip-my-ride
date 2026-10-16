import * as THREE from "three";

export function makeDamage(root: THREE.Group, kind: "car" | "trolley") {
  const parts = root.children.map((mesh) => ({
    mesh, position: mesh.position.clone(), scale: mesh.scale.clone(), rotation: mesh.rotation.clone(),
  }));
  let damaged = false;
  let progress = 0;
  function render() {
    for (const { mesh, position, scale, rotation } of parts) {
      mesh.position.copy(position);
      mesh.scale.copy(scale);
      mesh.rotation.copy(rotation);
      const wheel = mesh instanceof THREE.Mesh && mesh.geometry instanceof THREE.CylinderGeometry;
      mesh.position.y *= 1 - progress * 0.88;
      mesh.scale.y *= 1 - progress * 0.86;
      if (wheel) {
        mesh.position.x *= 1 + progress * 0.3;
        mesh.position.z *= 1 + progress * 0.18;
        mesh.rotation.z += Math.sign(position.x) * progress * 0.8;
      } else {
        mesh.scale.x *= 1 + progress * 0.12;
        mesh.rotation.z += Math.sign(position.x || 1) * progress * (kind === "trolley" ? 0.15 : 0.045);
      }
    }
  }
  return {
    get damaged() { return damaged; },
    crush(reducedMotion: boolean) {
      if (damaged) return false;
      damaged = true;
      progress = reducedMotion ? 1 : 0;
      render();
      return true;
    },
    restore(value: boolean) {
      damaged = value;
      progress = value ? 1 : 0;
      render();
    },
    update(dt: number, reducedMotion: boolean) {
      if (!damaged || progress === 1) return;
      progress = reducedMotion ? 1 : Math.min(1, progress + dt * 7);
      render();
    },
  };
}
