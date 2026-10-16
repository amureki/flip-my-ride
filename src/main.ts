import * as THREE from "three";
import { makeAsphalt } from "./ground";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { makeContactShadow } from "./contact-shadow";
import { makeExhaust } from "./exhaust";
import { makeRoadster } from "./roadster";
import { levels } from "./levels";
import { makeTrolley, hitsTrolley } from "./trolley";
import { runTotal, licenceVerdict, type RoundScore } from "./receipt";
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
let levelIndex = 0;
const roundScores: RoundScore[] = [];
const start = new THREE.Vector3();
const target = new THREE.Vector3();
const nextButton = document.querySelector<HTMLButtonElement>("#next-lot")!;
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
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setClearColor(0xd5d8dc);
stage.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera();
camera.position.set(14, 20, 22);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xe7f0ff, 0x687381, 1.8));
const sun = new THREE.DirectionalLight(0xfff3df, 2.8);
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
sun.shadow.normalBias = 0.025;
sun.shadow.bias = -0.0001;
sun.shadow.radius = 2.5;
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
scene.add(makeAsphalt(renderer.capabilities.getMaxAnisotropy()));
const parkingBay = new THREE.Group();
scene.add(parkingBay);
box(2.7, 0.018, 4.1, 0x96bb69, 0, 0.012, 0, parkingBay);
for (const x of [-1.35, 1.35])
  box(0.08, 0.025, 4.1, 0xeaffc6, x, 0.025, 0, parkingBay);
for (const z of [-2.05, 2.05])
  box(2.7, 0.025, 0.08, 0xeaffc6, 0, 0.025, z, parkingBay);
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
p.position.set(0, 0.04, 0);
parkingBay.add(p);
const sign = new THREE.Group();
sign.position.set(4.2, 0, -6.9);
sign.rotation.y = 0.2;
const signCanvas = document.createElement("canvas");
signCanvas.width = 768;
signCanvas.height = 640;
const signContext = signCanvas.getContext("2d")!;
signContext.fillStyle = "#f8f7f1";
signContext.beginPath();
signContext.roundRect(0, 0, 768, 640, 40);
signContext.fill();
signContext.strokeStyle = "#b52624";
signContext.lineWidth = 18;
signContext.beginPath();
signContext.roundRect(25, 25, 718, 590, 24);
signContext.stroke();
signContext.textAlign = "center";
signContext.fillStyle = "#b52624";
signContext.font = "bold 184px Arial";
signContext.fillText("NO", 384, 288);
signContext.fillStyle = "#20252c";
signContext.font = "bold 109px Arial";
signContext.fillText("KICKFLIPS", 384, 442);
const signTexture = new THREE.CanvasTexture(signCanvas);
signTexture.colorSpace = THREE.SRGBColorSpace;
signTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
const signOutline = new THREE.Shape();
signOutline.moveTo(-1.2, -1.15);
signOutline.lineTo(1.2, -1.15);
signOutline.quadraticCurveTo(1.38, -1.15, 1.38, -0.97);
signOutline.lineTo(1.38, 0.97);
signOutline.quadraticCurveTo(1.38, 1.15, 1.2, 1.15);
signOutline.lineTo(-1.2, 1.15);
signOutline.quadraticCurveTo(-1.38, 1.15, -1.38, 0.97);
signOutline.lineTo(-1.38, -0.97);
signOutline.quadraticCurveTo(-1.38, -1.15, -1.2, -1.15);
const signMetal = new THREE.MeshStandardMaterial({
  color: 0xabb3b9, metalness: 0.65, roughness: 0.42,
});
const signPlate = new THREE.Mesh(
  new THREE.ExtrudeGeometry(signOutline, { depth: 0.055, bevelEnabled: false, curveSegments: 6 }),
  signMetal,
);
signPlate.position.set(0, 2.85, -0.03);
signPlate.castShadow = true;
sign.add(signPlate);
const signFace = new THREE.Mesh(
  new THREE.PlaneGeometry(2.76, 2.3),
  new THREE.MeshStandardMaterial({ map: signTexture, transparent: true, roughness: 0.65, metalness: 0.05 }),
);
signFace.position.set(0, 2.85, 0.028);
sign.add(signFace);
const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 3.65, 12), signMetal);
signPost.position.set(0, 1.825, -0.12);
signPost.castShadow = true;
sign.add(signPost);
for (const y of [1.92, 3.78]) {
  const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), signMetal);
  bolt.scale.z = 0.4;
  bolt.position.set(0, y, 0.04);
  sign.add(bolt);
}
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
const trolley = makeTrolley();
scene.add(trolley.root);
let trolleyTime = 0;
const parkedCars: THREE.Group[] = [];
// Reuse scene objects across lots and retries instead of allocating new meshes.
const carColors = [0xc78051, 0x5b7970, 0xe1b75f, 0x6383a3, 0xa66c70];
for (
  let i = 0;
  i < Math.max(...levels.map((level) => level.cars.length));
  i++
) {
  const parked = makeCar(carColors[i % carColors.length]);
  scene.add(parked);
  parkedCars.push(parked);
}
const { car, jets, sideJets, exhausts, suspension } = makeRoadster();
const exhaust = makeExhaust(scene, exhausts);
const contactShadow = makeContactShadow(scene);
const environment = new RoomEnvironment();
const pmrem = new THREE.PMREMGenerator(renderer);
const reflections = pmrem.fromScene(environment, 0.04);
car.traverse((object) => {
  if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
    object.material.envMap = reflections.texture;
    object.material.envMapIntensity = 0.45;
  }
});
environment.dispose();
pmrem.dispose();
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let touchdown = 1;
let landingStrength = 0;
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
const particles: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; size: number; opacity: number }[] =
  [];
const puffGeo = new THREE.IcosahedronGeometry(0.16, 0);
function burst(position: THREE.Vector3, count = 14, strength = 1) {
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      puffGeo,
      new THREE.MeshBasicMaterial({ color: 0xd9d7cf, transparent: true, depthWrite: false }),
    );
    mesh.position.copy(position);
    mesh.position.x += (i % 2 ? 1 : -1) * 0.61;
    mesh.position.z += (i % 4 < 2 ? 1 : -1) * 0.85;
    mesh.position.y = 0.12;
    scene.add(mesh);
    particles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2.4 * strength,
        Math.random() * 0.7 * strength,
        (Math.random() - 0.5) * 2.4 * strength,
      ),
      life: 1,
      size: 0.35 + strength * 0.4,
      opacity: 0.2 + strength * 0.25,
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
  trolleyTime: number;
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
    trolleyTime,
    heading: Math.atan2(-(landing.x - position.x), -(landing.z - position.z)),
  };
  touchdown = 1;
  suspension.position.y = 0;
  shockwave.material.opacity = 0;
  pivot.scale.set(1, 1, 1);
  burst(position, reducedMotion.matches ? 6 : 22);
  message.textContent =
    distance >= 8.9
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
  suspension.position.y = 0;
  jets.visible = false;
  sideJets.visible = false;
  shockwave.material.opacity = 0;
  pivot.scale.set(1, 1, 1);
  const level = levels[levelIndex];
  trolleyTime = 0;
  trolley.root.visible = !!level.trolley;
  if (levels[levelIndex].trolley) trolley.update(trolleyTime, reducedMotion.matches, levels[levelIndex].trolley!);
  start.set(level.start[0], 0, level.start[1]);
  target.set(level.target[0], 0, level.target[1]);
  parkingBay.position.copy(target);
  parkedCars.forEach((parked, i) => {
    const point = level.cars[i];
    parked.visible = !!point;
    if (point) parked.position.set(point[0], 0, point[1]);
  });
  document.querySelector("#lot-label")!.textContent =
    `${levelIndex + 1} / ${levels.length} · ${level.name}`;
  const completedLastLot = levelIndex === levels.length - 1;
  nextButton.textContent = completedLastLot ? "Play again" : "Next lot";
  nextButton.classList.toggle("secondary", completedLastLot);
  result.classList.toggle("final-lot", completedLastLot);
  document.querySelector<HTMLElement>("#share-score-label")!.hidden = !completedLastLot;
  position.copy(start);
  landing.copy(start);
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
  message.textContent = level.hint;
  cones.forEach((cone, i) => {
    cone.hit = false;
    const point = level.cones[i];
    cone.mesh.visible = !!point;
    if (point) cone.mesh.position.set(point[0], 0, point[1]);
    cone.mesh.rotation.set(0, 0, 0);
  });
  for (const particle of particles) {
    scene.remove(particle.mesh);
    (particle.mesh.material as THREE.Material).dispose();
  }
  particles.length = 0;
  exhaust.clear();
}
function finishFlight() {
  if (!flight) return;
  landingStrength = THREE.MathUtils.clamp(flight.from.distanceTo(flight.to) / 9, 0, 1);
  position.copy(flight.to);
  const oldPosition = flight.from;
  const clearedCar = flight.clearedCar;
  const previousHits = hits;
  const trolleyHit = !!levels[levelIndex].trolley && hitsTrolley(position.x, position.z, flight.trolleyTime + flight.duration + (reducedMotion.matches ? 0 : 0.12), levels[levelIndex].trolley!);
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
        other.visible &&
        Math.abs(position.x - other.position.x) < 1.5 &&
        Math.abs(position.z - other.position.z) < 2.65,
    );
    if (collided || trolleyHit) {
      position.copy(oldPosition);
      hits++;
      message.textContent =
        trolleyHit ? "Unexpected item in the parking area. Claim filed." : "Car hit. Your insurer has left the chat. Try another landing.";
    }
    for (const cone of cones)
      if (
        cone.mesh.visible &&
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
  sideJets.visible = false;
  shockwave.position.copy(position).y = 0.05;
  if (hits === previousHits)
    message.textContent = clearedCar
      ? "Traffic avoided. Parking still required."
      : "Landed. The sign still says no.";
  burst(position, reducedMotion.matches ? 4 : Math.round(8 + landingStrength * 10),
    reducedMotion.matches ? 0.25 : 0.35 + landingStrength * 0.5);
  // Require the complete upright car footprint to fit inside the parking bay.
  if (
    Math.abs(position.x - target.x) <= 0.51 &&
    Math.abs(position.z - target.z) <= 0.68
  ) {
    won = true;
    roundScores[levelIndex] = { flips, hits };
    const final = levelIndex === levels.length - 1;
    const score = final ? runTotal(roundScores) : { flips, hits };
    document.querySelector("#receipt-heading")!.textContent = final ? "Licence to Flip" : "Parking citation";
    document.querySelector("#receipt-progress")!.textContent = final ? `${levels.length}/${levels.length} lots cleared` : levels[levelIndex].name;
    document.querySelector("#receipt-flips")!.textContent = String(score.flips);
    document.querySelector("#receipt-claims")!.textContent = String(score.hits);
    document.querySelector("#receipt-insurance")!.textContent = score.hits ? "Please stop calling" : "Suspiciously intact";
    document.querySelector("#receipt-stamp")!.textContent = final ? "UNFIT FOR NORMAL ROADS" : ["NEIGHBOURHOOD AIR TRAFFIC", "OVERBOOKED. OVERFLIPPED.", "UNEXPECTED ITEM: YOUR CAR"][levelIndex];
    result.hidden = false;
    document.querySelector("#result-title")!.textContent = final ? "You passed. Somehow." : hits ? "Bumper-to-bumper flight." : "Parkour. But parked.";
    document.querySelector("#result-detail")!.textContent = final ? licenceVerdict(score.hits) : "Parking method: unnecessarily airborne.";
    message.textContent =
      levelIndex === levels.length - 1
        ? `All ${levels.length} lots parked. You earned that licence. Somehow.`
        : "The future of parallel parking.";
    updateShareLinks();
    const primaryAction = levelIndex === levels.length - 1
      ? result.querySelector<HTMLAnchorElement>("[data-social]")!
      : nextButton;
    primaryAction.focus({ preventScroll: true });
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
nextButton.addEventListener("click", () => {
  if (!won) return;
  levelIndex = (levelIndex + 1) % levels.length;
  if (levelIndex === 0) roundScores.length = 0;
  reset();
  stage.focus({ preventScroll: true });
});
function updateShareLinks() {
  shareVersion++;
  const content = shareContent(
    location.href,
    won ? (levelIndex === levels.length - 1 ? { ...runTotal(roundScores), completedLots: levels.length } : { flips, hits, lot: levels[levelIndex].name }) : undefined,
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
        shareContent(
          location.href,
          won ? (levelIndex === levels.length - 1 ? { ...runTotal(roundScores), completedLots: levels.length } : { flips, hits, lot: levels[levelIndex].name }) : undefined,
        ),
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
  if (trolley.root.visible && !won) {
    trolleyTime += dt;
    if (levels[levelIndex].trolley) trolley.update(trolleyTime, reducedMotion.matches, levels[levelIndex].trolley!);
  }
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
          other.visible &&
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
    sideJets.visible = !reducedMotion.matches && t > 0.07 && t < 0.93;
    sideJets.children.forEach((outlet, index) => {
      // Opposite sides fire during spin-up and braking.
      outlet.visible = t < 0.5 ? index < 2 : index >= 2;
      outlet.scale.y = 0.85 + Math.sin(now / 1000 * 42) * 0.15;
    });
    if (t === 1) finishFlight();
  } else if (touchdown < 1) {
    touchdown = Math.min(1, touchdown + dt / (0.3 + landingStrength * 0.15));
    const compression = touchdown < 0.28
      ? Math.sin(touchdown / 0.28 * Math.PI) * (0.008 + landingStrength * 0.016)
      : -Math.sin((touchdown - 0.28) / 0.72 * Math.PI) * (1 - touchdown) * (0.008 + landingStrength * 0.012);
    suspension.position.y = reducedMotion.matches ? 0 : -compression;
    shockwave.scale.setScalar(1 + touchdown * (0.5 + landingStrength * 1.1));
    shockwave.material.opacity = reducedMotion.matches
      ? 0
      : (1 - touchdown) ** 2 * (0.06 + landingStrength * 0.1);
    if (touchdown === 1) suspension.position.y = 0;
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.life -= dt * 1.5;
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    particle.mesh.scale.setScalar(particle.size * (1 + (1 - particle.life) * 2));
    (particle.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(
      0,
      particle.life * particle.opacity,
    );
    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      (particle.mesh.material as THREE.Material).dispose();
      particles.splice(i, 1);
    }
  }
  contactShadow.update(pivot);
  exhaust.update(dt, !reducedMotion.matches);
  renderer.render(scene, camera);
});
