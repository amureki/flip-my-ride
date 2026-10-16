import * as THREE from "three";

export function makeExhaust(scene: THREE.Scene, outlets: THREE.Object3D[]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d")!;
  // Overlapping soft lobes give each rotating puff an uneven smoke silhouette.
  for (const [x, y, radius] of [
    [64, 64, 54], [44, 54, 34], [79, 45, 33], [83, 77, 35], [48, 83, 31],
  ]) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(255,255,255,0.6)");
    gradient.addColorStop(0.4, "rgba(244,247,250,0.32)");
    gradient.addColorStop(1, "rgba(232,237,243,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture, color: 0xf5f8fc, transparent: true, depthWrite: false,
  });
  const emitters = outlets.map((outlet) => {
    const core = new THREE.Sprite(material.clone());
    core.position.y = 0.12;
    core.visible = false;
    outlet.add(core);
    return { outlet, core, age: 0 };
  });
  const particles = Array.from({ length: 160 }, () => {
    const sprite = new THREE.Sprite(material.clone());
    sprite.visible = false;
    scene.add(sprite);
    return {
      sprite, velocity: new THREE.Vector3(), life: 0,
      duration: 1, size: 1, spread: 1, spin: 0,
    };
  });
  material.dispose();
  const rotation = new THREE.Quaternion();
  let cursor = 0;
  let elapsed = 0;
  return {
    clear() {
      elapsed = 0;
      for (const emitter of emitters) {
        emitter.age = 0;
        emitter.core.visible = false;
      }
      for (const particle of particles) {
        particle.life = 0;
        particle.sprite.visible = false;
      }
    },
    update(dt: number, enabled: boolean) {
      if (!enabled) {
        this.clear();
        return;
      }
      for (const emitter of emitters) {
        const active = emitter.outlet.visible && !!emitter.outlet.parent?.visible;
        emitter.core.visible = active;
        emitter.age = active ? emitter.age + dt : 0;
        if (!active) continue;
        const burst = Math.exp(-emitter.age * 16);
        const pulse = Math.sin(emitter.age * 38) * 0.035;
        emitter.core.scale.setScalar(0.55 + burst * 0.25 + pulse);
        emitter.core.material.opacity = 0.75 + burst * 0.2;
      }
      // Catch up bounded frame delays without changing density with frame rate.
      elapsed += Math.min(dt, 0.1);
      while (elapsed >= 1 / 24) {
        elapsed -= 1 / 24;
        for (const { outlet, core, age } of emitters) {
          if (!core.visible) continue;
          const particle = particles[cursor];
          cursor = (cursor + 1) % particles.length;
          outlet.getWorldPosition(particle.sprite.position);
          outlet.getWorldQuaternion(rotation);
          particle.velocity.set(
            (Math.random() - 0.5) * 1.2,
            2.1 + Math.random() * 1.1,
            (Math.random() - 0.5) * 1.2,
          ).applyQuaternion(rotation);
          particle.duration = 0.85 + Math.random() * 0.2;
          particle.size = 0.38 + Math.random() * 0.2 + Math.exp(-age * 16) * 0.12;
          particle.spread = 1.9 + Math.random() * 0.8;
          particle.spin = (Math.random() - 0.5) * 0.8;
          particle.life = 1;
          particle.sprite.material.rotation = Math.random() * Math.PI;
          particle.sprite.visible = true;
        }
      }
      for (const particle of particles) {
        if (particle.life <= 0) continue;
        particle.life = Math.max(0, particle.life - dt / particle.duration);
        particle.sprite.position.addScaledVector(particle.velocity, dt);
        particle.velocity.multiplyScalar(Math.exp(-dt * 2.8));
        particle.velocity.y += dt * 0.7;
        const age = 1 - particle.life;
        particle.sprite.scale.setScalar(particle.size + age * particle.spread);
        particle.sprite.material.opacity = 0.8 * particle.life ** 1.5;
        particle.sprite.material.rotation += particle.spin * dt;
        particle.sprite.visible = particle.life > 0;
      }
    },
  };
}
