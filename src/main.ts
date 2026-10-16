import * as THREE from "three";
import { makeRoadster } from "./roadster";
import { shareContent, socialLinks } from "./sharing";
const shareButtons = document.querySelectorAll<HTMLButtonElement>(
  "[data-native-share]",
);
const shareStatus = document.querySelector<HTMLElement>("#share-status")!;
const shareLink = document.querySelector<HTMLInputElement>("#share-link")!;
let shareVersion = 0;
let sharing = false;

const stage = document.querySelector<HTMLDivElement>("#stage")!;
const message = document.querySelector<HTMLDivElement>("#message")!;
const flipsLabel = document.querySelector<HTMLSpanElement>("#flips")!;
const powerFill = document.querySelector<HTMLElement>("#power-fill")!;
const result = document.querySelector<HTMLDivElement>("#result")!;
const start = new THREE.Vector3(-5.5, 0, 4.8);
const target = new THREE.Vector3(4.2, 0, -3.7);
const bounds = { x: 8.5, z: 7 };
let renderer: THREE.WebGLRenderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch {
  document.querySelector<HTMLElement>("#error")!.hidden = false;
  throw new Error("WebGL unavailable");
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0xd5d8dc);
stage.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera();
camera.position.set(14, 20, 22);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x687381, 2.6));
const sun = new THREE.DirectionalLight(0xffffff, 3.2);
sun.position.set(-8, 18, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {
  left: -18,
  right: 18,
  top: 18,
  bottom: -18,
  near: 1,
  far: 60,
});
sun.shadow.normalBias = 0.035;
scene.add(sun);
const materials = new Map<number, THREE.MeshStandardMaterial>();
function mat(color: number) {
  if (!materials.has(color))
    materials.set(
      color,
      new THREE.MeshStandardMaterial({ color, roughness: 0.78 }),
    );
  return materials.get(color)!;
}
function box(
  w: number,
  h: number,
  d: number,
  color: number,
  x: number,
  y: number,
  z: number,
  parent: THREE.Object3D = scene,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
box(22, 0.5, 20, 0xa8b1a5, 0, -0.6, 0);
box(18.8, 0.3, 16, 0xc8cbce, 0, -0.28, 0);
box(18, 0.1, 15, 0x737b83, 0, -0.08, 0);
// Parking markings are flat geometry so the lot needs no external textures.
for (const z of [-6.4, 6.4]) {
  for (let x = -7.8; x < 9; x += 3)
    box(0.06, 0.012, 2.8, 0xe9ecef, x, 0.002, z > 0 ? z - 0.9 : z + 0.9);
  box(15, 0.012, 0.06, 0xe9ecef, -0.3, 0.002, z);
}
for (let z = -2; z <= 2; z += 1.5) box(0.09, 0.015, 0.6, 0xbfc4b1, 0, 0.006, z);
box(2.7, 0.018, 4.1, 0x96bb69, target.x, 0.012, target.z);
for (const x of [-1.35, 1.35])
  box(0.08, 0.025, 4.1, 0xeaffc6, target.x + x, 0.025, target.z);
for (const z of [-2.05, 2.05])
  box(2.7, 0.025, 0.08, 0xeaffc6, target.x, 0.025, target.z + z);
const textCanvas = document.createElement("canvas");
textCanvas.width = 128;
textCanvas.height = 128;
const ctx = textCanvas.getContext("2d")!;
ctx.fillStyle = "#edffd1";
ctx.font = "bold 100px sans-serif";
ctx.textAlign = "center";
ctx.fillText("P", 64, 101);
const p = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(textCanvas),
    transparent: true,
    depthWrite: false,
  }),
);
p.rotation.x = -Math.PI / 2;
p.position.set(target.x, 0.04, target.z);
scene.add(p);
const signCanvas = document.createElement("canvas");
signCanvas.width = 512;
signCanvas.height = 256;
const signContext = signCanvas.getContext("2d")!;
signContext.fillStyle = "#ffffff";
signContext.fillRect(0, 0, 512, 256);
signContext.strokeStyle = "#b52c28";
signContext.lineWidth = 16;
signContext.strokeRect(8, 8, 496, 240);
signContext.fillStyle = "#16191d";
signContext.font = "bold 64px Arial";
signContext.textAlign = "center";
signContext.fillText("NO", 256, 99);
signContext.fillText("KICKFLIPS", 256, 185);
const signTexture = new THREE.CanvasTexture(signCanvas);
signTexture.colorSpace = THREE.SRGBColorSpace;
const sign = new THREE.Mesh(
  new THREE.PlaneGeometry(3.6, 1.8),
  new THREE.MeshBasicMaterial({ map: signTexture, side: THREE.DoubleSide }),
);
sign.position.set(target.x, 2.7, -6.9);
sign.rotation.y = Math.atan2(camera.position.x, camera.position.z);
box(0.12, 1.8, 0.12, 0x535c67, target.x, 0.9, -6.95);
scene.add(sign);
function makeCar(color: number) {
  const root = new THREE.Group();
  box(1.45, 0.38, 2.65, color, 0, 0.44, 0, root);
  const hood = box(1.36, 0.22, 0.92, color, 0, 0.69, -0.73, root);
  hood.rotation.x = -0.09;
  box(1.14, 0.38, 1.15, 0x283e3e, 0, 0.82, 0.12, root);
  box(1.18, 0.1, 0.86, color, 0, 1.04, 0.24, root);
  box(1.4, 0.14, 0.53, color, 0, 0.7, 1.02, root);
  for (const x of [-0.75, 0.75])
    for (const z of [-0.83, 0.85]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.31, 0.31, 0.19, 16),
        mat(0x252b28),
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.32, z);
      wheel.castShadow = true;
      root.add(wheel);
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.2, 12),
        mat(0x9ba69d),
      );
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      root.add(hub);
    }
  box(1.13, 0.07, 0.03, 0xf9f7d8, 0, 0.55, -1.34, root);
  box(1.12, 0.06, 0.03, 0xc74930, 0, 0.55, 1.34, root);
  return root;
}
const parkedCars: THREE.Group[] = [];
for (const [x, z, color] of [
  [-6.3, -4.9, 0xc78051],
  [-3.3, -4.9, 0x5b7970],
  [6.2, 5, 0xe1b75f],
]) {
  const car = makeCar(color);
  car.position.set(x, 0, z);
  scene.add(car);
  parkedCars.push(car);
}
const { car, jets } = makeRoadster();
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const stunt = document.querySelector<HTMLElement>("#stunt")!;
let touchdown = 1;
const shockwave = new THREE.Mesh(
  new THREE.RingGeometry(0.85, 1, 48),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  }),
);
shockwave.rotation.x = -Math.PI / 2;
scene.add(shockwave);
scene.add(car);
const pivot = new THREE.Group();
scene.remove(car);
pivot.add(car);
scene.add(pivot);
car.position.y = -0.5;
const cones: { mesh: THREE.Group; hit: boolean }[] = [];
for (const [x, z] of [
  [-2, 1.4],
  [1.4, -0.8],
  [6.5, -1.5],
  [-6.8, 1],
]) {
  const cone = new THREE.Group();
  box(0.52, 0.07, 0.52, 0x514d3a, 0, 0.04, 0, cone);
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.65, 12),
    mat(0xd06a33),
  );
  body.position.y = 0.39;
  body.castShadow = true;
  cone.add(body);
  const stripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.14, 0.12, 12),
    mat(0xfff2ce),
  );
  stripe.position.y = 0.4;
  cone.add(stripe);
  cone.position.set(x, 0, z);
  cone.userData.origin = cone.position.clone();
  scene.add(cone);
  cones.push({ mesh: cone, hit: false });
}
for (const [x, z] of [
  [-9.7, -7.5],
  [9.7, 6.3],
  [-9.5, 7.5],
  [8.9, -8.6],
]) {
  box(0.23, 1.25, 0.23, 0x7a6950, x, 0.35, z);
  const tree = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.2, 1),
    mat(0x607748),
  );
  tree.scale.set(0.85, 1.25, 0.85);
  tree.position.set(x, 1.5, z);
  tree.castShadow = true;
  scene.add(tree);
}
// A world-space landing ring makes touch and mouse aiming use the same geometry.
const aim = new THREE.Group();
scene.add(aim);
aim.visible = false;
const ring = new THREE.Mesh(
  new THREE.RingGeometry(0.68, 0.76, 48),
  new THREE.MeshBasicMaterial({ color: 0xfff5ce, side: THREE.DoubleSide }),
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.07;
aim.add(ring);
const aimLine = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: 0xfff5ce }),
);
scene.add(aimLine);
aimLine.visible = false;
const particles: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] =
  [];
const puffGeo = new THREE.IcosahedronGeometry(0.16, 0);
function burst(position: THREE.Vector3, count = 14) {
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      puffGeo,
      new THREE.MeshBasicMaterial({ color: 0xf4f1dc, transparent: true }),
    );
    mesh.position.copy(position);
    mesh.position.y = 0.3;
    scene.add(mesh);
    particles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 2,
        (Math.random() - 0.5) * 3,
      ),
      life: 1,
    });
  }
}
let position = start.clone();
let flips = 0,
  hits = 0,
  won = false;
let flight: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  time: number;
  duration: number;
  height: number;
  heading: number;
  rolls: number;
  clearedCar: boolean;
} | null = null;
let pointer: number | null = null;
let dragStart = new THREE.Vector2();
let landing = position.clone();
const aimKeys = new Set<string>();
let keyboardAiming = false;
const raycaster = new THREE.Raycaster();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function worldAt(x: number, y: number) {
  const rect = stage.getBoundingClientRect();
  raycaster.setFromCamera(
    new THREE.Vector2(
      ((x - rect.left) / rect.width) * 2 - 1,
      (-(y - rect.top) / rect.height) * 2 + 1,
    ),
    camera,
  );
  const out = new THREE.Vector3();
  raycaster.ray.intersectPlane(ground, out);
  return out;
}
function showAim(delta: THREE.Vector3) {
  delta.clampLength(0, 9);
  landing.copy(position).add(delta);
  if (position.distanceTo(landing) < 0.3) {
    clearAim();
    message.textContent = keyboardAiming ? "Move the marker farther to flip." : "Drag farther to flip.";
    return;
  }
  aim.position.copy(landing);
  aim.visible = true;
  aimLine.geometry.dispose();
  aimLine.geometry = new THREE.BufferGeometry().setFromPoints([
    position.clone().setY(0.08),
    landing.clone().setY(0.08),
  ]);
  aimLine.visible = true;
  powerFill.style.width = `${(delta.length() / 9) * 100}%`;
  const outside =
    Math.abs(landing.x) > bounds.x - 0.8 ||
    Math.abs(landing.z) > bounds.z - 1.3;
  (ring.material as THREE.MeshBasicMaterial).color.set(
    outside ? 0xdc6839 : 0xfff5ce,
  );
  message.textContent = outside
    ? "That is technically outside the parking lot."
    : keyboardAiming
      ? "Press Space to flip."
      : "Release to commit to this engineering decision.";
}
function clearAim() {
  aim.visible = false;
  aimLine.visible = false;
  powerFill.style.width = "0";
}
function launch() {
  aimKeys.clear();
  keyboardAiming = false;
  const distance = position.distanceTo(landing);
  clearAim();
  if (distance < 0.3 || won || flight) return;
  flips += distance > 5.5 ? 2 : 1;
  flipsLabel.textContent = String(flips);
  flight = {
    from: position.clone(),
    to: landing.clone(),
    time: 0,
    duration: reducedMotion.matches ? 0.8 : 1.15 + distance * 0.075,
    height: reducedMotion.matches ? 1 : 2.6 + distance * 0.38,
    rolls: distance > 5.5 ? 2 : 1,
    clearedCar: false,
    heading: Math.atan2(-(landing.x - position.x), -(landing.z - position.z)),
  };
  touchdown = 1;
  shockwave.material.opacity = 0;
  pivot.scale.set(1, 1, 1);
  stunt.textContent =
    distance >= 8.9
      ? "CLEARED FOR PARKING."
      : distance > 5.5
      ? "DOUBLE FLIP. SINGLE PARKING SPACE."
      : "NORMAL CAR BEHAVIOR.";
  stunt.hidden = false;
  burst(position, reducedMotion.matches ? 6 : 22);
  message.textContent = distance >= 8.9
    ? "You are cleared for parking."
    : distance > 5.5
      ? "Two flips. The sign said zero."
      : "The sign is more of a suggestion.";
}
function reset() {
  if (pointer !== null && stage.hasPointerCapture(pointer))
    stage.releasePointerCapture(pointer);
  pointer = null;
  aimKeys.clear();
  keyboardAiming = false;
  flight = null;
  touchdown = 1;
  jets.visible = false;
  stunt.hidden = true;
  shockwave.material.opacity = 0;
  pivot.scale.set(1, 1, 1);
  position.copy(start);
  pivot.position.copy(position).y = 0.5;
  pivot.rotation.set(0, 0, 0);
  flips = 0;
  hits = 0;
  won = false;
  flipsLabel.textContent = "0";
  result.hidden = true;
  clearAim();
  shareVersion++;
  sharing = false;
  shareButtons.forEach((button) => {
    button.disabled = false;
  });
  shareStatus.textContent = "";
  shareLink.hidden = true;
  updateShareLinks();
  message.textContent = "Land in the green parking space.";
  for (const cone of cones) {
    cone.hit = false;
    cone.mesh.position.copy(cone.mesh.userData.origin);
    cone.mesh.rotation.set(0, 0, 0);
  }
  for (const particle of particles) {
    scene.remove(particle.mesh);
    (particle.mesh.material as THREE.Material).dispose();
  }
  particles.length = 0;
}
function finishFlight() {
  if (!flight) return;
  position.copy(flight.to);
  const oldPosition = flight.from;
  const clearedCar = flight.clearedCar;
  const previousHits = hits;
  flight = null;
  pivot.rotation.set(0, 0, 0);
  if (
    Math.abs(position.x) > bounds.x - 0.8 ||
    Math.abs(position.z) > bounds.z - 1.3
  ) {
    position.copy(oldPosition);
    hits++;
    message.textContent =
      "Out of bounds. Returned to your last questionable decision.";
  } else {
    const collided = parkedCars.some(
      (other) =>
        Math.abs(position.x - other.position.x) < 1.5 &&
        Math.abs(position.z - other.position.z) < 2.65,
    );
    if (collided) {
      position.copy(oldPosition);
      hits++;
      message.textContent = "Car hit. Your insurer has left the chat. Try another landing.";
    }
    for (const cone of cones)
      if (
        !cone.hit &&
        Math.abs(position.x - cone.mesh.position.x) < 1.05 &&
        Math.abs(position.z - cone.mesh.position.z) < 1.6
      ) {
        cone.hit = true;
        hits++;
        cone.mesh.rotation.z = 1.4;
        cone.mesh.position.x += 0.6;
        message.textContent = "That cone had a family.";
      }
  }
  pivot.position.copy(position).y = 0.5;
  touchdown = 0;
  jets.visible = false;
  shockwave.position.copy(position).y = 0.05;
  stunt.textContent = hits > previousHits
    ? "CLAIM FILED."
    : clearedCar
      ? "WHAT A PARK!"
      : "LANDING: MOSTLY INTENTIONAL.";
  if (hits === previousHits)
    message.textContent = clearedCar
      ? "Traffic avoided. Parking still required."
      : "Landed. The sign still says no.";
  burst(position, reducedMotion.matches ? 6 : 26);
  // Require the complete upright car footprint to fit inside the parking bay.
  if (
    Math.abs(position.x - target.x) <= 0.51 &&
    Math.abs(position.z - target.z) <= 0.68
  ) {
    won = true;
    document.querySelector("#receipt-claims")!.textContent = String(hits);
    document.querySelector("#receipt-insurance")!.textContent = hits ? "Pending" : "No claim";
    result.hidden = false;
    document.querySelector("#result-title")!.textContent = hits
      ? "Close enough."
      : "Nailed it.";
    document.querySelector("#result-detail")!.textContent =
      `${flips} ${flips === 1 ? "flip" : "flips"}. ${hits} insurance ${hits === 1 ? "claim" : "claims"}. Zero normal driving.`;
    message.textContent = "The future of parallel parking.";
    updateShareLinks();
    document
      .querySelector<HTMLButtonElement>("#again")!
      .focus({ preventScroll: true });
  }
}
stage.addEventListener("pointerdown", (event) => {
  if (
    (event.target as HTMLElement).closest("button, input") ||
    flight ||
    won ||
    pointer !== null ||
    (event.pointerType === "mouse" && event.button !== 0)
  )
    return;
  aimKeys.clear();
  keyboardAiming = false;
  pointer = event.pointerId;
  dragStart.set(event.clientX, event.clientY);
  stage.setPointerCapture(pointer);
  stage.focus({ preventScroll: true });
});
stage.addEventListener("pointermove", (event) => {
  if (event.pointerId !== pointer) return;
  showAim(
    worldAt(event.clientX, event.clientY).sub(
      worldAt(dragStart.x, dragStart.y),
    ),
  );
});
stage.addEventListener("pointerup", (event) => {
  if (event.pointerId !== pointer) return;
  showAim(
    worldAt(event.clientX, event.clientY).sub(
      worldAt(dragStart.x, dragStart.y),
    ),
  );
  stage.releasePointerCapture(event.pointerId);
  pointer = null;
  launch();
});
function cancelInput() {
  pointer = null;
  aimKeys.clear();
  keyboardAiming = false;
  clearAim();
}
stage.addEventListener("pointercancel", cancelInput);
stage.addEventListener("lostpointercapture", () => {
  if (pointer !== null) cancelInput();
});
window.addEventListener("blur", cancelInput);
window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;
  if (event.key.toLowerCase() === "r") {
    reset();
    stage.focus({ preventScroll: true });
    return;
  }
  if (event.target instanceof Element && event.target.closest("button, a"))
    return;
  if (flight || won || pointer !== null) return;
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(event.key.toLowerCase())) {
    event.preventDefault();
    if (!keyboardAiming) {
      if (!aim.visible) landing.copy(position);
      keyboardAiming = true;
    }
    aimKeys.add(event.key.toLowerCase());
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat && keyboardAiming) launch();
  }
});
window.addEventListener("keyup", (event) => {
  aimKeys.delete(event.key.toLowerCase());
});
stage.addEventListener("focusout", cancelInput);
function updateKeyboardAim(dt: number) {
  if (!keyboardAiming || flight || won || pointer !== null || !aimKeys.size) return;
  const x = Number(aimKeys.has("arrowright") || aimKeys.has("d")) -
    Number(aimKeys.has("arrowleft") || aimKeys.has("a"));
  const y = Number(aimKeys.has("arrowdown") || aimKeys.has("s")) -
    Number(aimKeys.has("arrowup") || aimKeys.has("w"));
  if (!x && !y) return;
  const rect = stage.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const movement = worldAt(centerX + x * 50, centerY + y * 50)
    .sub(worldAt(centerX, centerY))
    .normalize()
    .multiplyScalar(dt * 6);
  showAim(landing.clone().sub(position).add(movement));
}
document.querySelector("#reset")!.addEventListener("click", () => {
  reset();
  stage.focus({ preventScroll: true });
});
document.querySelector("#again")!.addEventListener("click", () => {
  reset();
  stage.focus({ preventScroll: true });
});
function updateShareLinks() {
  shareVersion++;
  const content = shareContent(
    location.href,
    won ? { flips, hits } : undefined,
  );
  const links = socialLinks(content);
  for (const link of document.querySelectorAll<HTMLAnchorElement>(
    "[data-social]",
  )) {
    link.href = links[link.dataset.social as keyof typeof links];
  }
  shareLink.value = content.url;
  shareButtons.forEach((button) => {
    const label =
      typeof navigator.share === "function"
        ? "More sharing options"
        : "Copy game link";
    button.setAttribute("aria-label", label);
    button.title = label;
  });
}
async function copyLink(version: number) {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    if (version === shareVersion) shareStatus.textContent = "Link copied.";
  } catch {
    if (version !== shareVersion) return;
    shareLink.hidden = false;
    shareLink.focus();
    shareLink.select();
    shareStatus.textContent = "Select and copy the link.";
  }
}
for (const button of shareButtons)
  button.addEventListener("click", async () => {
    cancelInput();
    if (sharing) return;
    const version = shareVersion;
    if (!navigator.share) {
      await copyLink(version);
      return;
    }
    sharing = true;
    shareButtons.forEach((button) => {
      button.disabled = true;
    });
    try {
      await navigator.share(
        shareContent(location.href, won ? { flips, hits } : undefined),
      );
    } catch (error) {
      if (
        version === shareVersion &&
        !(error instanceof DOMException && error.name === "AbortError")
      )
        await copyLink(version);
    } finally {
      sharing = false;
      shareButtons.forEach((button) => {
        button.disabled = false;
      });
    }
  });
function resize() {
  const { width, height } = stage.getBoundingClientRect();
  const aspect = width / height;
  // Keep the entire playable lot in view in portrait and landscape.
  const halfHeight = Math.max(12, 15 / aspect);
  camera.left = -halfHeight * aspect;
  camera.right = halfHeight * aspect;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.near = 0.1;
  camera.far = 100;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
new ResizeObserver(resize).observe(stage);
resize();
reset();
let last = performance.now();
renderer.setAnimationLoop((now: number) => {
  const dt = Math.min((now - last) / 1000, 0.04);
  last = now;
  updateKeyboardAim(dt);
  if (flight) {
    flight.time += dt;
    const anticipation = reducedMotion.matches ? 0 : 0.12;
    const t = THREE.MathUtils.clamp(
      (flight.time - anticipation) / flight.duration,
      0,
      1,
    );
    const windup = anticipation ? Math.min(flight.time / anticipation, 1) : 1;
    pivot.scale.set(
      1 + Math.sin(windup * Math.PI) * 0.1,
      1 - Math.sin(windup * Math.PI) * 0.2,
      1,
    );
    pivot.position.lerpVectors(flight.from, flight.to, t);
    pivot.position.y =
      0.5 + Math.pow(Math.sin(t * Math.PI), 0.8) * flight.height;
    if (!flight.clearedCar && pivot.position.y > 2)
      flight.clearedCar = parkedCars.some(
        (other) =>
          Math.abs(pivot.position.x - other.position.x) < 0.75 &&
          Math.abs(pivot.position.z - other.position.z) < 1.35,
      );
    const rotationProgress = THREE.MathUtils.smootherstep(t, 0.07, 0.93);
    pivot.rotation.set(
      reducedMotion.matches ? 0 : Math.sin(t * Math.PI) * 0.65,
      reducedMotion.matches ? 0 : flight.heading * Math.sin(Math.PI * t),
      reducedMotion.matches
        ? 0
        : -Math.PI * 2 * flight.rolls * rotationProgress,
    );
    jets.visible = !reducedMotion.matches && t > 0 && t < 0.86;
    jets.scale.y = 0.8 + Math.sin(flight.time * 48) * 0.2;
    if (t === 1) finishFlight();
  } else if (touchdown < 1) {
    touchdown = Math.min(1, touchdown + dt * 1.8);
    const bounce = reducedMotion.matches
      ? 0
      : Math.sin(touchdown * Math.PI * 3) * (1 - touchdown);
    pivot.position.y = 0.5 + Math.abs(bounce) * 0.32;
    pivot.rotation.z = bounce * 0.12;
    pivot.scale.set(1 + bounce * 0.12, 1 - bounce * 0.22, 1 + bounce * 0.06);
    shockwave.scale.setScalar(1 + touchdown * 3.5);
    shockwave.material.opacity = reducedMotion.matches
      ? 0
      : (1 - touchdown) * 0.45;
    if (touchdown === 1) {
      pivot.rotation.set(0, 0, 0);
      pivot.scale.set(1, 1, 1);
      stunt.hidden = true;
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.life -= dt * 1.5;
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    particle.mesh.scale.setScalar(1 + (1 - particle.life) * 2);
    (particle.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(
      0,
      particle.life * 0.65,
    );
    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      (particle.mesh.material as THREE.Material).dispose();
      particles.splice(i, 1);
    }
  }
  renderer.render(scene, camera);
});
