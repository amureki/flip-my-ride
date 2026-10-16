import { trackEvent } from "./analytics";
import * as THREE from "three";
import { makeLotBase, makeParkedCar, makeTree } from "./scenery";
import { makeDamage } from "./damage";
import { makeAsphalt } from "./ground";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { makeContactShadow } from "./contact-shadow";
import { makeExhaust } from "./exhaust";
import { makeRoadster } from "./roadster";
import { levels } from "./levels";
import { makeTrolley, hitsTrolley } from "./trolley";
import { runTotal, licenceVerdict, type RoundScore } from "./receipt";
import { shareContent, socialLinks } from "./sharing";
type ReplayMove = {
  time: number;
  x: number;
  z: number;
  trolleyTime: number;
  duration: number;
  anticipation: number;
};
const shareButtons = document.querySelectorAll<HTMLButtonElement>(
  "[data-native-share]",
);
const shareStatus = document.querySelector<HTMLElement>("#share-status")!;
const shareLink = document.querySelector<HTMLInputElement>("#share-link")!;
let shareVersion = 0;
let sharing = false;
const replayPanel = document.querySelector<HTMLElement>("#replay-panel")!;
const watchReplay = document.querySelector<HTMLButtonElement>("#watch-replay")!;
const stopReplay = document.querySelector<HTMLButtonElement>("#stop-replay")!;
let moves: ReplayMove[] = [];
let roundTime = 0;
type ReplaySession = {
  moves: ReplayMove[];
  index: number;
  endHold: number;
  completed: { carDamage: boolean[]; trolleyDamage: boolean; trolleyPosition: THREE.Vector3; trolleyRotation: THREE.Euler; trolleyTime: number; position: THREE.Vector3; flips: number; hits: number; message: string; cones: { position: THREE.Vector3; rotation: THREE.Euler; hit: boolean }[] };
};
let replay: ReplaySession | null = null;

const stage = document.querySelector<HTMLDivElement>("#stage")!;
const thumbPad = document.querySelector<HTMLDivElement>("#thumb-pad")!;
const mobileControls = matchMedia("(pointer: coarse)");
let pointerSurface: HTMLElement = stage;
const message = document.querySelector<HTMLDivElement>("#message")!;
const flipsLabel = document.querySelector<HTMLSpanElement>("#flips")!;
const result = document.querySelector<HTMLDivElement>("#result")!;
let levelIndex = 0;
let attempt = 0;
let attemptStarted = false;
let attemptSeconds = 0;
let gameStarted = false;
let gameCompleted = false;
function levelEvent(name: string, extra: Record<string, string | number | boolean> = {}) {
  trackEvent(name, {
    level: levelIndex + 1, level_name: levels[levelIndex].name,
    attempt, flips, claims: hits,
    duration_seconds: Math.round(attemptSeconds),
    ...extra,
  });
}
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
  trackEvent("game_error", { reason: "webgl_unavailable" });
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
scene.add(makeLotBase());
scene.add(makeAsphalt(renderer.capabilities.getMaxAnisotropy()));
const parkingBay = new THREE.Group();
scene.add(parkingBay);
box(2.7, 0.018, 4.1, 0x809b69, 0, 0.012, 0, parkingBay);
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
const trolley = makeTrolley();
scene.add(trolley.root);
const trolleyDamage = makeDamage(trolley.root, "trolley");
let trolleyTime = 0;
const parkedCars: THREE.Group[] = [];
// Reuse scene objects across lots and retries instead of allocating new meshes.
const carColors = [0xc78051, 0x5b7970, 0xe1b75f, 0x6383a3, 0xa66c70];
for (
  let i = 0;
  i < Math.max(...levels.map((level) => level.cars.length));
  i++
) {
  const parked = makeParkedCar(carColors[i % carColors.length]);
  scene.add(parked);
  parkedCars.push(parked);
}
const carDamage = parkedCars.map((parked) => makeDamage(parked, "car"));
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
for (const [index, [x, z]] of [
  [-9.7, -7.5], [9.7, 6.3], [-9.5, 7.5], [8.9, -8.6],
].entries()) {
  const tree = makeTree(index);
  tree.position.set(x, 0, z);
  scene.add(tree);
}
// A world-space landing ring makes touch and mouse aiming use the same geometry.
const aim = new THREE.Group();
scene.add(aim);
aim.visible = false;
const ring = new THREE.Mesh(
  new THREE.RingGeometry(0.7, 0.745, 48),
  new THREE.MeshBasicMaterial({ color: 0xfff5ce, side: THREE.DoubleSide, depthTest: false, depthWrite: false }),
);
ring.renderOrder = 10;
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.07;
aim.add(ring);
const aimSymbols = [
  [[-0.24, 0], [-0.06, -0.18], [-0.06, -0.18], [0.26, 0.23]],
  [[0, 0.27], [0, -0.08], [0, -0.2], [0, -0.27]],
  [[-0.22, -0.22], [0.22, 0.22], [-0.22, 0.22], [0.22, -0.22]],
].map((points) => {
  const symbol = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(
    points.map(([x, z]) => new THREE.Vector3(x, 0.075, -z)),
  ), new THREE.LineBasicMaterial({ color: 0xfff5ce, depthTest: false, depthWrite: false }));
  symbol.renderOrder = 11;
  aim.add(symbol);
  return symbol;
});
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
  anticipation: number;
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
  updateAimFeedback();
}
function updateAimFeedback() {
  const outside =
    Math.abs(landing.x) > bounds.x - 0.8 ||
    Math.abs(landing.z) > bounds.z - 1.3;
  const obstacle = parkedCars.some((other, index) => other.visible && !carDamage[index].damaged &&
    Math.abs(landing.x - other.position.x) < 1.5 && Math.abs(landing.z - other.position.z) < 2.65) ||
    cones.some((cone) => cone.mesh.visible && !cone.hit && Math.abs(landing.x - cone.mesh.position.x) < 1.05 && Math.abs(landing.z - cone.mesh.position.z) < 1.6) ||
    (!trolleyDamage.damaged && !!levels[levelIndex].trolley && hitsTrolley(landing.x, landing.z,
      trolleyTime + (reducedMotion.matches ? 0.8 : 1.27 + position.distanceTo(landing) * 0.075), levels[levelIndex].trolley!));
  const state = outside ? 2 : obstacle ? 1 : 0;
  const color = [0xfff5ce, 0xe9b657, 0xdc6839][state];
  (ring.material as THREE.MeshBasicMaterial).color.set(color);
  aimSymbols.forEach((symbol, index) => {
    symbol.visible = index === state;
    symbol.material.color.set(color);
  });
  message.textContent = outside
    ? "That is technically outside the parking lot."
    : obstacle
      ? "Collision risk. Landing here may add a claim."
      : keyboardAiming
      ? "Press Space to flip."
      : "Release to commit to this engineering decision.";
}
function clearAim() {
  aim.visible = false;
  aimLine.visible = false;
}
function launch(replayMove?: ReplayMove) {
  aimKeys.clear();
  keyboardAiming = false;
  const distance = position.distanceTo(landing);
  clearAim();
  if (distance < 0.3 || won || flight) return;
  if (!replay && !attemptStarted) {
    attemptStarted = true;
    attempt++;
    attemptSeconds = 0;
    if (!gameStarted) {
      trackEvent("game_started");
      gameStarted = true;
    }
    levelEvent("level_started");
  }
  flips += distance > 5.5 ? 2 : 1;
  flipsLabel.textContent = String(flips);
  flight = {
    from: position.clone(),
    to: landing.clone(),
    time: 0,
    duration: replayMove?.duration ?? (reducedMotion.matches ? 0.8 : 1.15 + distance * 0.075),
    anticipation: replayMove?.anticipation ?? (reducedMotion.matches ? 0 : 0.12),
    height: reducedMotion.matches ? 1 : 2.6 + distance * 0.38,
    rolls: distance > 5.5 ? 2 : 1,
    clearedCar: false,
    trolleyTime,
    heading: Math.atan2(-(landing.x - position.x), -(landing.z - position.z)),
  };
  if (!replay) moves.push({ time: roundTime, x: landing.x, z: landing.z, trolleyTime, duration: flight.duration, anticipation: flight.anticipation });
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
function reset(reason: "retry" | "next" | "replay" | "initial" = "retry") {
  if (reason === "retry" && attemptStarted) levelEvent("level_retried", { completed: won });
  if (reason !== "replay") attemptStarted = false;
  if (reason === "next") attempt = 0;
  roundTime = 0;
  moves = [];
  cancelInput();
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
  trolleyDamage.restore(false);
  carDamage.forEach((damage) => damage.restore(false));
  trolley.root.visible = !!level.trolley;
  if (levels[levelIndex].trolley && !trolleyDamage.damaged) trolley.update(trolleyTime, reducedMotion.matches, levels[levelIndex].trolley!);
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
    cone.mesh.scale.setScalar(1);
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
  const impactTime = flight.trolleyTime + flight.duration + flight.anticipation;
  const trolleyHit = !trolleyDamage.damaged && !!levels[levelIndex].trolley && hitsTrolley(position.x, position.z, flight.trolleyTime + flight.duration + flight.anticipation, levels[levelIndex].trolley!);
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
    let crushed = false;
    parkedCars.forEach((other, index) => {
      if (other.visible && Math.abs(position.x - other.position.x) < 1.5 &&
          Math.abs(position.z - other.position.z) < 2.65 && carDamage[index].crush(reducedMotion.matches)) {
        hits++;
        crushed = true;
      }
    });
    if (crushed) message.textContent = "Roof lowered. Resale value also lowered.";
    if (trolleyHit) {
      trolley.update(impactTime, reducedMotion.matches, levels[levelIndex].trolley!);
      trolleyDamage.crush(reducedMotion.matches);
      hits++;
      message.textContent = "Unexpected item: one trolley pancake.";
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
        cone.mesh.scale.set(1.3, 0.12, 1.3);
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
    if (replay) return;
    roundScores[levelIndex] = {
      flips, hits,
      cars: carDamage.filter((damage, index) => parkedCars[index].visible && damage.damaged).length,
      trolleys: trolleyDamage.damaged ? 1 : 0,
      cones: cones.filter((cone) => cone.mesh.visible && cone.hit).length,
    };
    const final = levelIndex === levels.length - 1;
    levelEvent("level_completed", roundScores[levelIndex]);
    if (final && !gameCompleted) {
      trackEvent("game_completed", { ...runTotal(roundScores), levels: levels.length });
      gameCompleted = true;
    }
    const score = final ? runTotal(roundScores) : roundScores[levelIndex];
    document.querySelector("#receipt-progress")!.textContent = final ? `${levels.length}/${levels.length} lots cleared` : levels[levelIndex].name;
    document.querySelector("#receipt-flips")!.textContent = String(score.flips);
    document.querySelector("#receipt-claims")!.textContent = String(score.hits);
    document.querySelector("#receipt-heading")!.textContent = final ? "Final receipt" : "Parking receipt";
    document.querySelector("#receipt-repairs")!.textContent = score.cars + score.trolleys + score.cones ? "We’ll be in touch." : "€0. Somehow.";
    result.hidden = false;
    document.querySelector("#result-title")!.textContent = final ? "Licence to Flip" : hits ? "Crash landing. Still parking." : "Parkour. But parked.";
    document.querySelector("#result-detail")!.textContent = final ? licenceVerdict(score.hits)
      : score.cars ? "Cars flattened. Now that’s compact parking."
      : score.trolleys ? "Off your trolley. Into your spot."
      : score.cones ? "Cone-gratulations. You made an impression."
      : score.hits ? "A few claims to fame."
      : "No claims. All bragging rights.";
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
for (const surface of [stage, thumbPad]) {
  surface.addEventListener("pointerdown", (event) => {
    if (
      (event.target as HTMLElement).closest("button, input") ||
      (surface === stage && mobileControls.matches && event.pointerType !== "mouse") ||
      replay ||
      flight ||
      won ||
      pointer !== null ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    aimKeys.clear();
    keyboardAiming = false;
    pointerSurface = surface;
    pointer = event.pointerId;
    clearAim();
    landing.copy(position);
    thumbPad.style.setProperty("--thumb-x", "0px");
    thumbPad.style.setProperty("--thumb-y", "0px");
    thumbPad.classList.toggle("aiming", surface === thumbPad);
    dragStart.set(event.clientX, event.clientY);
    surface.setPointerCapture(pointer);
    stage.focus({ preventScroll: true });
  });
  surface.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointer) return;
    updatePointerAim(event);
  });
  surface.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointer) return;
    updatePointerAim(event);
    pointer = null;
    surface.releasePointerCapture(event.pointerId);
    thumbPad.classList.remove("aiming");
    launch();
  });
  surface.addEventListener("pointercancel", cancelInput);
  surface.addEventListener("lostpointercapture", () => {
    if (pointer !== null) cancelInput();
  });
}
function updatePointerAim(event: PointerEvent) {
  const dx = event.clientX - dragStart.x;
  const dy = event.clientY - dragStart.y;
  const delta = worldAt(event.clientX, event.clientY).sub(worldAt(dragStart.x, dragStart.y));
  if (pointerSurface === thumbPad) {
    const radius = Math.min(thumbPad.clientWidth, thumbPad.clientHeight) / 2 - 16;
    const distance = Math.hypot(dx, dy);
    // Pad coordinates can lie beyond the camera's ground projection.
    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    delta.copy(worldAt(centerX + dx / (distance || 1), centerY + dy / (distance || 1)))
      .sub(worldAt(centerX, centerY))
      .normalize().multiplyScalar(Math.min(distance / (radius * 1.5), 1) ** 1.5 * 9);
    const scale = distance > radius ? radius / distance : 1;
    thumbPad.style.setProperty("--thumb-x", `${dx * scale}px`);
    thumbPad.style.setProperty("--thumb-y", `${dy * scale}px`);
  }
  showAim(delta);
}
function cancelInput() {
  const captured = pointer;
  pointer = null;
  if (captured !== null && pointerSurface.hasPointerCapture(captured))
    pointerSurface.releasePointerCapture(captured);
  thumbPad.classList.remove("aiming");
  aimKeys.clear();
  keyboardAiming = false;
  clearAim();
}
mobileControls.addEventListener("change", cancelInput);
window.addEventListener("resize", cancelInput);
window.addEventListener("blur", cancelInput);
window.addEventListener("keydown", (event) => {
  if (replay) {
    if (event.key === "Escape") endReplay();
    return;
  }
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
  if (levelIndex === 0) {
    roundScores.length = 0;
    gameStarted = false;
    gameCompleted = false;
  }
  reset("next");
  stage.focus({ preventScroll: true });
});
function currentShareContent() {
  const score = !won ? undefined
    : levelIndex === levels.length - 1
      ? { ...runTotal(roundScores), completedLots: levels.length }
      : { flips, hits, lot: levels[levelIndex].name };
  return shareContent(location.href, score);
}
function updateShareLinks() {
  shareVersion++;
  const content = currentShareContent();
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
    levelEvent("share_result", { method: "clipboard", outcome: "copied" });
    if (version === shareVersion) shareStatus.textContent = "Link copied.";
  } catch {
    if (version !== shareVersion) return;
    levelEvent("share_result", { method: "clipboard", outcome: "manual_copy_required" });
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
    levelEvent("share_clicked", { method: typeof navigator.share === "function" ? "native" : "clipboard", placement: button.closest("#result") ? "result" : "header", completed: won });
    if (!navigator.share) {
      await copyLink(version);
      return;
    }
    sharing = true;
    shareButtons.forEach((button) => {
      button.disabled = true;
    });
    try {
      await navigator.share(currentShareContent());
      levelEvent("share_result", { method: "native", outcome: "resolved" });
    } catch (error) {
      levelEvent("share_result", { method: "native", outcome: error instanceof DOMException && error.name === "AbortError" ? "cancelled" : "failed" });
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
function endReplay() {
  if (!replay) return;
  const current = replay;
  replay = null;
  reset("replay");
  moves = current.moves;
  trolleyTime = current.completed.trolleyTime;
  if (levels[levelIndex].trolley) trolley.update(trolleyTime, reducedMotion.matches, levels[levelIndex].trolley!);
  carDamage.forEach((damage, index) => damage.restore(current.completed.carDamage[index]));
  trolleyDamage.restore(current.completed.trolleyDamage);
  trolley.root.position.copy(current.completed.trolleyPosition);
  trolley.root.rotation.copy(current.completed.trolleyRotation);
  position.copy(current.completed.position);
  pivot.position.copy(position).y = 0.5;
  flips = current.completed.flips;
  hits = current.completed.hits;
  won = true;
  flipsLabel.textContent = String(flips);
  message.textContent = current.completed.message;
  cones.forEach((cone, index) => {
    cone.mesh.position.copy(current.completed.cones[index].position);
    cone.mesh.rotation.copy(current.completed.cones[index].rotation);
    cone.hit = current.completed.cones[index].hit;
    cone.mesh.scale.set(cone.hit ? 1.3 : 1, cone.hit ? 0.12 : 1, cone.hit ? 1.3 : 1);
  });
  result.hidden = false;
  replayPanel.hidden = true;
  document.querySelector("#app")!.classList.remove("replaying");
  for (const child of document.querySelector("#app")!.children)
    if (child instanceof HTMLElement) child.inert = false;
  updateShareLinks();
  watchReplay.focus({ preventScroll: true });
}

function beginReplay() {
  if (!won || replay || !moves.length) return;
  const current: ReplaySession = {
    moves: moves.slice(), index: 0, endHold: 0,
    completed: { carDamage: carDamage.map((damage) => damage.damaged), trolleyDamage: trolleyDamage.damaged, trolleyPosition: trolley.root.position.clone(), trolleyRotation: trolley.root.rotation.clone(), trolleyTime, position: position.clone(), flips, hits, message: message.textContent ?? "",
      cones: cones.map((cone) => ({ position: cone.mesh.position.clone(), rotation: cone.mesh.rotation.clone(), hit: cone.hit })) },
  };
  levelEvent("replay_started");
  reset("replay");
  replay = current;
  replayPanel.hidden = false;
  document.querySelector("#app")!.classList.add("replaying");
  for (const child of document.querySelector("#app")!.children)
    if (child instanceof HTMLElement && child !== replayPanel) child.inert = true;
  stopReplay.focus({ preventScroll: true });
}
watchReplay.addEventListener("click", beginReplay);
stopReplay.addEventListener("click", () => endReplay());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && replay) endReplay();
});

function resize() {
  const { width, height } = stage.getBoundingClientRect();
  const aspect = width / height;
  // Preserve the diagonal view while trimming mobile framing to the lot edges.
  // Framing depends only on viewport size, so aiming and flight never move it.
  camera.position.set(14, 20, 22);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const halfHeight = mobileControls.matches
    ? Math.max(8, 11.1 / aspect)
    : Math.max(12, 15 / aspect);
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
mobileControls.addEventListener("change", resize);
resize();
reset("initial");
let last = performance.now();
renderer.setAnimationLoop((now: number) => {
  const dt = Math.min((now - last) / 1000, 0.04);
  last = now;
  if (!won) roundTime += dt;
  if (attemptStarted && !won && !replay && !document.hidden) attemptSeconds += dt;
  updateKeyboardAim(dt);
  if (aim.visible && !flight && !won) updateAimFeedback();
  if (trolley.root.visible && !won && !trolleyDamage.damaged) {
    trolleyTime += dt;
    if (levels[levelIndex].trolley) trolley.update(trolleyTime, reducedMotion.matches, levels[levelIndex].trolley!);
  }
  if (replay && !flight) {
    if (replay.index < replay.moves.length && roundTime >= replay.moves[replay.index].time) {
      const move = replay.moves[replay.index++];
      landing.set(move.x, 0, move.z);
      trolleyTime = move.trolleyTime;
      if (levels[levelIndex].trolley && !trolleyDamage.damaged) trolley.update(trolleyTime, reducedMotion.matches, levels[levelIndex].trolley!);
      launch(move);
    } else if (replay.index === replay.moves.length && (replay.endHold += dt) >= 2) {
      endReplay();
    }
  }
  if (flight) {
    flight.time += dt;
    const anticipation = flight.anticipation;
    const t = THREE.MathUtils.clamp(
      (flight.time - anticipation) / flight.duration,
      0,
      1,
    );
    const windup = !reducedMotion.matches && anticipation ? Math.min(flight.time / anticipation, 1) : 1;
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
  carDamage.forEach((damage) => damage.update(dt, reducedMotion.matches));
  trolleyDamage.update(dt, reducedMotion.matches);
  contactShadow.update(pivot);
  exhaust.update(dt, !reducedMotion.matches);
  renderer.render(scene, camera);

});

for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-social]")) {
  link.addEventListener("click", () => levelEvent("share_clicked", {
    method: link.dataset.social!,
    placement: link.closest("#result") ? "result" : "header",
    completed: won,
  }));
}
window.addEventListener("pagehide", () => {
  if (attemptStarted && !won && !replay) levelEvent("level_exit");
});
