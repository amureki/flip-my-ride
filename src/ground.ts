import * as THREE from "three";

export function makeAsphalt(anisotropy: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext("2d")!;
  // Fixed seed keeps surface wear identical across retries and replays.
  let seed = 731;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const pixels = context.createImageData(1024, 1024);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grain = (random() - 0.5) * 13;
    pixels.data[i] = 115 + grain;
    pixels.data[i + 1] = 123 + grain;
    pixels.data[i + 2] = 131 + grain;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  context.save();
  context.scale(1024 / 18, 1024 / 15);
  context.translate(9, 7.5);
  context.lineCap = "round";
  // A few old paired tracks, kept away from the central aiming lane.
  for (const [x, z, bend, length] of [
    [-4.6, 3.8, 0.5, 2.1], [3.1, -4.4, -0.45, 2.3], [5.7, 2.2, 0.25, 1.6],
  ]) {
    for (const offset of [-0.5, 0.5]) {
      context.strokeStyle = "rgba(35,42,49,0.09)";
      context.lineWidth = 0.095;
      context.beginPath();
      context.moveTo(x + offset, z);
      context.quadraticCurveTo(x + offset, z + length * 0.55, x + offset + bend, z + length);
      context.stroke();
    }
  }
  context.restore();

  const paint = document.createElement("canvas");
  paint.width = paint.height = 1024;
  const lines = paint.getContext("2d")!;
  lines.save();
  lines.scale(1024 / 18, 1024 / 15);
  lines.translate(9, 7.5);
  lines.fillStyle = "rgba(233,236,239,0.9)";
  for (const z of [-6.4, 6.4]) {
    for (let x = -7.8; x < 9; x += 3)
      lines.fillRect(x - 0.03, (z > 0 ? z - 0.9 : z + 0.9) - 1.4, 0.06, 2.8);
    lines.fillRect(-7.8, z - 0.03, 15, 0.06);
  }
  lines.fillStyle = "rgba(191,196,177,0.9)";
  for (let z = -2; z <= 2; z += 1.5) lines.fillRect(-0.045, z - 0.3, 0.09, 0.6);
  lines.restore();
  lines.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 18000; i++) {
    lines.fillStyle = `rgba(0,0,0,${0.15 + random() * 0.45})`;
    lines.fillRect(random() * 1024, random() * 1024, 0.5 + random() * 1.5, 0.5 + random() * 2.5);
  }
  context.drawImage(paint, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(anisotropy, 8);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 15),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.96 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.028;
  ground.receiveShadow = true;
  return ground;
}

export function makeRoadInstructions(anisotropy: number, mobile: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 640;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#e9ecef";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "bold 78px Arial";
  context.fillText(mobile ? "DRAG TO AIM · RELEASE TO FLIP" : "CLICK TO FLIP · HOLD TO AIM", 1024, 245);
  context.font = "bold 64px Arial";
  context.fillText(mobile ? "SLIDE BACK TO CANCEL" : "ARROWS / WASD AIM · SPACE FLIPS · ESC CANCELS", 1024, 395);
  // Small gaps give the lettering the same worn paint finish as the bay lines.
  context.globalCompositeOperation = "destination-out";
  let seed = 417;
  for (let i = 0; i < 14000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const x = seed % 2048;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    context.fillRect(x, seed % 640, 2, 3);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(anisotropy, 8);
  const markings = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 3.75),
    new THREE.MeshStandardMaterial({
      map: texture, transparent: true, depthWrite: false, roughness: 0.96,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }),
  );
  markings.rotation.x = -Math.PI / 2;
  markings.position.set(0, -0.025, 0);
  markings.receiveShadow = true;
  return markings;
}
