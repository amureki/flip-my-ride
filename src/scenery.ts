import * as THREE from "three";
import { vehicleShapes, type VehicleModel } from "./vehicles.ts";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export function makeLotBase() {
  const root = new THREE.Group();
  for (const [width, height, depth, y, color, radius] of [
    [22, 0.5, 20, -0.6, 0xa8b1a5, 0.12],
    [18.8, 0.3, 16, -0.28, 0xb9bec0, 0.08],
    [18, 0.1, 15, -0.08, 0x737b83, 0.025],
  ]) {
    const slab = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 2, radius),
      new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
    slab.position.y = y;
    slab.receiveShadow = true;
    root.add(slab);
  }
  const seams: THREE.Vector3[] = [];
  for (let x = -8; x <= 8; x += 2)
    for (const side of [-1, 1]) seams.push(new THREE.Vector3(x, -0.124, side * 7.56), new THREE.Vector3(x, -0.124, side * 7.9));
  for (let z = -6; z <= 6; z += 2)
    for (const side of [-1, 1]) seams.push(new THREE.Vector3(side * 9.06, -0.124, z), new THREE.Vector3(side * 9.3, -0.124, z));
  root.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seams),
    new THREE.LineBasicMaterial({ color: 0x929b9d, transparent: true, opacity: 0.45 })));
  return root;
}

export function makeParkedCar(color: number, model: VehicleModel = "compact") {
  const { body, roof, wheel: radius, axles } = vehicleShapes[model];
  const root = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.12 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x22343e, roughness: 0.25, metalness: 0.3 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x242a2e, roughness: 0.85 });
  const silver = new THREE.MeshStandardMaterial({ color: 0x9ca6af, roughness: 0.4, metalness: 0.65 });
  for (const [w, h, d, y, z, material] of [
    [body.width, body.height - radius, body.length, (body.height + radius) / 2, 0, paint],
    [roof.width, roof.height - body.height - 0.08, roof.length, (roof.height + body.height - 0.08) / 2, roof.z, glass],
    [roof.width * 0.92, 0.08, roof.length * (model === "fastback" ? 0.55 : model === "compact" ? 0.72 : 0.88), roof.height - 0.04, roof.z, paint],
    [body.width * 0.92, 0.08, 0.5, body.height - 0.04, -body.length / 2 + 0.26, paint],
    [body.width * 0.92, 0.07, 0.4, body.height - 0.035, body.length / 2 - 0.21, paint],
    [body.width * 0.92, 0.065, 0.08, radius, -body.length / 2, trim],
    [body.width * 0.92, 0.065, 0.08, radius, body.length / 2, trim],
  ] as [number, number, number, number, number, THREE.Material][]) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(h / 3, 0.07)), material);
    if (material === glass) {
      const vertices = mesh.geometry.getAttribute("position");
      for (let i = 0; i < vertices.count; i++) {
        const rise = (vertices.getY(i) + h / 2) / h;
        const taper = model === "fastback" ? 0.45 : model === "compact" ? 0.28 : 0.12;
        vertices.setZ(i, vertices.getZ(i) * (1 - rise * taper));
        vertices.setX(i, vertices.getX(i) * (1 - rise * 0.08));
      }
      mesh.geometry.computeVertexNormals();
    }
    mesh.position.set(0, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
  }
  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.35, 0.065), trim);
    pillar.scale.y = (roof.height - body.height) / 0.4;
    pillar.position.set(side * (roof.width / 2 + 0.008), (roof.height + body.height) / 2, roof.z);
    root.add(pillar);
    for (const z of axles) {
      for (const [wheelRadius, depth, x, material] of [
        [radius, 0.18, body.width / 2 - 0.09, trim], [radius * 0.68, 0.185, body.width / 2 - 0.09, silver],
        [radius * 0.53, 0.188, body.width / 2 - 0.09, trim], [radius * 0.25, 0.19, body.width / 2 - 0.09, silver],
      ] as [number, number, number, THREE.Material][]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, depth, 24), material);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * x, radius, z);
        wheel.castShadow = true;
        root.add(wheel);
      }
    }
    for (const [z, color] of [[-body.length / 2 - 0.009, 0xe4ebdf], [body.length / 2 + 0.009, 0xb44b40]]) {
      const light = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.018), new THREE.MeshBasicMaterial({ color }));
      light.position.set(side * body.width * 0.3, body.height - 0.1, z);
      root.add(light);
    }
  }
  if (model === "semi") {
    const cab = new THREE.Mesh(new RoundedBoxGeometry(roof.width, 0.9, roof.length, 2, 0.06), paint);
    cab.position.set(0, body.height + 0.45, roof.z);
    cab.castShadow = cab.receiveShadow = true;
    root.add(cab);
    const hitch = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16), trim);
    hitch.position.set(0, body.height + 0.05, 1.1);
    root.add(hitch);
    for (const side of [-1, 1]) {
      const step = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.12, 0.65, 2, 0.03), silver);
      step.position.set(side * (body.width / 2 - 0.09), 0.35, -0.8);
      root.add(step);
    }
  }
  return root;
}

export function makeTree(index: number) {
  const root = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 1.6, 7),
    new THREE.MeshStandardMaterial({ color: 0x7a705e, roughness: 1 }));
  trunk.position.y = 0.5;
  trunk.castShadow = true;
  root.add(trunk);
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  for (const [x, y, z, scale, color] of [
    [0, 1.85, 0, 1, 0x6b7b59], [-0.42, 1.45, 0.12, 0.65, 0x627451],
    [0.34, 1.6, -0.18, 0.7, 0x748361],
  ]) {
    const crown = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }));
    crown.position.set(x, y, z);
    crown.scale.set(scale * 0.85, scale * 1.05, scale * 0.85);
    crown.castShadow = crown.receiveShadow = true;
    root.add(crown);
  }
  root.rotation.y = index * 1.7;
  return root;
}

export function makeTrafficAccess() {
  const root = new THREE.Group();
  for (const side of [-1, 1]) {
    const apron = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.375, 4.6),
      new THREE.MeshStandardMaterial({color:0x737b83, roughness:0.9}));
    apron.position.set(side * 9.9, -0.1625, 0);
    apron.receiveShadow = true;
    root.add(apron);
    for (const z of [-2.4, 2.4]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 0.2),
        new THREE.MeshStandardMaterial({color:0xb9bec0, roughness:0.9}));
      curb.position.set(side * 9.9, -0.04, z);
      root.add(curb);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.13,0.65,8),
        new THREE.MeshStandardMaterial({color:0xe1b75f, roughness:0.8}));
      post.position.set(side*9.5,0.25,z);
      root.add(post);
    }
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 256;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#eeeede";
    context.font = "bold 64px sans-serif";
    context.textAlign = "center";
    context.fillText(side < 0 ? "IN" : "EXIT",128,100);
    context.lineWidth = 12;
    context.strokeStyle = "#eeeede";
    context.beginPath();context.moveTo(60,165);context.lineTo(195,165);
    context.moveTo(155,130);context.lineTo(195,165);context.lineTo(155,200);context.stroke();
    const marker = new THREE.Mesh(new THREE.PlaneGeometry(1.6,2.2),
      new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false}));
    marker.rotation.x = -Math.PI/2;
    marker.position.set(side*9.9,0.035,0);
    root.add(marker);
  }
  return root;
}
