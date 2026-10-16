import * as THREE from "three";

export type EggState = { sign: boolean; hat: boolean; contacts: number[] };

export function makeEasterEggs(sign: THREE.Group, car: THREE.Group, cone: THREE.Group, parkedCars: THREE.Group[]) {
  const banner = document.querySelector<HTMLElement>("#discovery")!;
  let state: EggState = { sign: false, hat: false, contacts: [] };
  const discovered = new Set<string>();
  const queue: string[] = [];
  let remaining = 0;
  const hat = cone.clone();
  hat.position.set(0, 1.15, 0);
  hat.visible = false;
  car.add(hat);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d")!;
  let signReply = "";
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const hiddenSign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9),
    new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide }));
  hiddenSign.position.copy(sign.position).add(new THREE.Vector3(0, 0.65, 0));
  hiddenSign.rotation.y = sign.rotation.y;
  hiddenSign.visible = false;
  sign.parent!.add(hiddenSign);
  const bubbleCanvas = document.createElement("canvas");
  bubbleCanvas.width = 256;
  bubbleCanvas.height = 160;
  const bubbleContext = bubbleCanvas.getContext("2d")!;
  bubbleContext.fillStyle = "#f8f7f1";
  bubbleContext.beginPath();
  bubbleContext.roundRect(4, 4, 248, 120, 28);
  bubbleContext.moveTo(105, 120);
  bubbleContext.lineTo(128, 156);
  bubbleContext.lineTo(151, 120);
  bubbleContext.fill();
  bubbleContext.fillStyle = "#20252c";
  bubbleContext.textAlign = "center";
  bubbleContext.font = "bold 64px Arial";
  bubbleContext.fillText("beep!", 128, 87);
  const bubbleTexture = new THREE.CanvasTexture(bubbleCanvas);
  bubbleTexture.colorSpace = THREE.SRGBColorSpace;
  const bubbles = Array.from({ length: 2 }, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTexture, depthTest: false, depthWrite: false }));
    sprite.scale.set(1.8, 1.125, 1);
    sprite.visible = false;
    sprite.renderOrder = 20;
    sign.parent!.add(sprite);
    return sprite;
  });
  let exchange: { other: THREE.Group; elapsed: number; turns: number } | null = null;
  function discover(id: string, text: string) {
    if (discovered.has(id)) return;
    discovered.add(id);
    queue.push(text);
  }
  function restore(saved: EggState) {
    state = { ...saved, contacts: [...saved.contacts] };
    sign.rotation.x = state.sign ? -Math.PI / 2 : 0;
    hiddenSign.position.copy(sign.position).add(new THREE.Vector3(0, 0.65, 0));
    hiddenSign.visible = state.sign;
    hat.visible = state.hat;
  }
  return {
    snapshot: (): EggState => ({ ...state, contacts: [...state.contacts] }),
    restore,
    reset(newRun: boolean, reply: string) {
      signReply = reply;
      context.fillStyle = "#f8f7f1";
      context.fillRect(0, 0, 512, 256);
      context.fillStyle = "#20252c";
      context.textAlign = "center";
      context.font = "bold 65px Arial";
      context.fillText(reply, 256, 150, 460);
      texture.needsUpdate = true;
      restore({ sign: false, hat: false, contacts: [] });
      exchange = null;
      bubbles.forEach((bubble) => { bubble.visible = false; });
      queue.length = 0;
      remaining = 0;
      banner.textContent = "";
      banner.hidden = true;
      if (newRun) discovered.clear();
    },
    land(x: number, z: number, cars: number[], hitCone: boolean, replay: boolean) {
      if (!state.sign && Math.abs(x - sign.position.x) < 2.1 && Math.abs(z - sign.position.z) < 1.7) {
        state.sign = true;
        if (!replay) discover(`sign:${signReply}`, `Sign language · ${signReply}`);
      }
      if (hitCone && !state.hat) {
        state.hat = true;
        if (!replay) discover("hat", "A flip of the hat · Cone couture.");
      }
      for (const index of cars) {
        state.contacts[index] = (state.contacts[index] ?? 0) + 1;
        if (!replay && state.contacts[index] <= 2) {
          const duet = state.contacts[index] === 2;
          exchange = { other: parkedCars[index], elapsed: 0, turns: duet ? 4 : 2 };
          discover(duet ? "duet" : "horn", duet ? "Car-ma · Beep beep. Beep beep!" : "Beep! · That car has something to say.");
        }
      }
      restore(state);
    },
    update(dt: number, blocked: boolean) {
      if (document.hidden) return;
      bubbles.forEach((bubble) => { bubble.visible = false; });
      if (blocked) exchange = null;
      if (exchange) {
        exchange.elapsed += dt;
        const turn = Math.floor(exchange.elapsed / 0.85);
        if (turn >= exchange.turns) exchange = null;
        else if (exchange.elapsed % 0.85 < 0.7) {
          const speaker = turn % 2;
          const bubble = bubbles[speaker];
          const source = speaker ? car : exchange.other;
          source.getWorldPosition(bubble.position);
          bubble.position.y += speaker ? 2.1 : 2.7;
          bubble.visible = true;
        }
      }
      remaining = Math.max(0, remaining - dt);
      if (blocked) { banner.hidden = true; return; }
      if (!remaining && queue.length) {
        banner.textContent = queue.shift()!;
        remaining = 3.5;
      }
      banner.hidden = remaining === 0;
    },
  };
}
