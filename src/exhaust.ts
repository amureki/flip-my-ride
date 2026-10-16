import * as THREE from "three";

export function makeExhaust(scene: THREE.Scene, outlets: THREE.Object3D[]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,0.85)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.5)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  const particles = Array.from({ length: 160 }, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture, color: 0xf5f8fc, transparent: true, depthWrite: false,
    }));
    sprite.visible = false;
    scene.add(sprite);
    return { sprite, velocity: new THREE.Vector3(), life: 0 };
  });
  const rotation = new THREE.Quaternion();
  let cursor = 0;
  let elapsed = 0;
  return {
    clear() {
      elapsed = 0;
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
      elapsed += dt;
      // A fixed emission rate and reusable pool keep the cost bounded on mobile.
      if (elapsed >= 1 / 30) {
        elapsed %= 1 / 30;
        for (const outlet of outlets) {
          if (!outlet.visible || !outlet.parent?.visible) continue;
          const particle = particles[cursor];
          cursor = (cursor + 1) % particles.length;
          outlet.getWorldPosition(particle.sprite.position);
          outlet.getWorldQuaternion(rotation);
          particle.velocity.set(
            (Math.random() - 0.5) * 0.8, 3.5, (Math.random() - 0.5) * 0.8,
          ).applyQuaternion(rotation);
          particle.life = 1;
          particle.sprite.material.rotation = Math.random() * Math.PI;
          particle.sprite.visible = true;
        }
      }
      for (const particle of particles) {
        if (particle.life <= 0) continue;
        particle.life = Math.max(0, particle.life - dt / 0.9);
        particle.sprite.position.addScaledVector(particle.velocity, dt);
        particle.velocity.multiplyScalar(Math.exp(-dt * 2));
        particle.velocity.y += dt * 0.6;
        particle.sprite.scale.setScalar(0.24 + (1 - particle.life) * 1.65);
        particle.sprite.material.opacity = particle.life * 0.7;
        particle.sprite.visible = particle.life > 0;
      }
    },
  };
}
