import type { TrafficRoute } from "./traffic";
import type { TrolleyRoute } from "./trolley";

import type { VehicleModel } from "./vehicles";

export type Point = readonly [x: number, z: number];
export type Level = {
  name: string;
  hint: string;
  parkedReply: string;
  start: Point;
  target: Point;
  sign: Point;
  signText: readonly [string, string];
  signReply: string;
  cars: readonly (readonly [x: number, z: number, model: VehicleModel])[];
  cones: readonly Point[];
  trolley?: TrolleyRoute;
  traffic?: readonly TrafficRoute[];
};

export const levels: readonly Level[] = [
  {
    name: "One Spot Over",
    parkedReply: "One small flip. One giant parking achievement.",
    hint: "One space to the right. Try not to launch into orbit.",
    start: [-6.3, 4.8],
    target: [-3.3, 4.8],
    sign: [-9.15, 0],
    signText: ["NO", "KICKFLIPS"],
    signReply: "Please don’t.",
    cars: [
      [-0.3, 4.8, "compact"],
      [2.7, 4.8, "fastback"],
      [5.7, 4.8, "suv"],
      [-6.3, -4.9, "compact"],
      [-0.3, -4.9, "fastback"],
      [5.7, -4.9, "suv"],
    ],
    cones: [[-6.8, 1.8]],
  },
  {
    name: "Full Lot",
    parkedReply: "Full lot. Empty claims folder.",
    hint: "One free space. Getting there without a claim is the hard part.",
    start: [-6.3, 0],
    target: [2.7, -4.9],
    sign: [-9.15, 0],
    signText: ["LOT", "FULL"],
    signReply: "Full of it.",
    cars: [
      [-6.3, -4.9, "compact"],
      [-3.3, -4.9, "fastback"],
      [-0.3, -4.9, "suv"],
      [5.7, -4.9, "compact"],
      [-6.3, 4.8, "fastback"],
      [-3.3, 4.8, "suv"],
      [-0.3, 4.8, "compact"],
      [2.7, 4.8, "fastback"],
      [5.7, 4.8, "suv"],
      [-3.3, 0, "compact"],
      [2.7, 0, "fastback"],
      [5.7, 0, "suv"],
    ],
    cones: [[-6.8, 1.8]],
  },
  {
    name: "Unexpected Item",
    parkedReply: "Self-checkout complete. Please take your vehicle.",
    trolley: { from: [0.8, -3.7], to: [6.4, -3.7] },
    hint: "The trolley has right of way. Your insurance recommends respecting it.",
    start: [-5.5, 4.8],
    target: [4.2, -3.7],
    sign: [-9.15, 2.9],
    signText: ["CART", "BLANCHE"],
    signReply: "Cart-astrophe.",
    cars: [
      [-6.3, -3.9, "semi"],
      [-3.3, -4.9, "fastback"],
      [6.2, 5, "suv"],
    ],
    cones: [
      [-2, 1.4],
      [1.4, -0.8],
      [6.5, -1.5],
      [-6.8, 1],
    ],
  },
  {
    name: "Reverse Psychology",
    parkedReply: "Objects in the mirror are worse at parking.",
    hint: "That car is backing out. White reverse lights give you a heads-up.",
    start: [-6, 4.8], target: [3, -4.9],
    sign: [-9.15, 1], signText: ["BACK IT", "UP"], signReply: "Uno reverse.",
    traffic: [{ model: "compact", from: [0, -4.9], to: [0, 0.6], period: 12, pause: 2 }],
    cars: [[-3.3, -4.9, "fastback"], [6, -4.9, "suv"], [0, 4.8, "compact"], [5.7, 4.8, "suv"]],
    cones: [[-6.8, 3], [-2, 1.8]],
  },
  {
    name: "Space Invaders",
    parkedReply: "Space secured. Personal space not included.",
    hint: "Someone keeps taking your space. Catch the green bay while it is empty.",
    start: [-6, 4.8], target: [5.7, -4.8],
    sign: [-9.15, 1], signText: ["SPACE", "INVADERS"], signReply: "You snooze.",
    traffic: [{ model: "fastback", from: [5.7, -4.8], to: [5.7, 0.6], period: 11, pause: 1.8 }],
    cars: [[-3.3, -4.9, "compact"], [0, -4.9, "suv"], [2.7, -4.9, "compact"],
      [-3, 0, "fastback"], [0, 4.8, "fastback"], [5.7, 4.8, "suv"]],
    cones: [[-6.8, 3], [1.4, 1.8]],
  },
  {
    name: "After You. No, You.",
    parkedReply: "Right of way? Wrong of everyone.",
    hint: "Two indecisive drivers. Watch their moves and choose your moment.",
    start: [-6, 4.8], target: [5.7, -4.8],
    sign: [-9.15, 1], signText: ["YOU", "FIRST"], signReply: "Trust issues.",
    traffic: [
      { model: "compact", from: [5.7, -4.8], to: [5.7, -0.2], period: 10, pause: 1.5 },
      { model: "fastback", from: [-3, 0.3], to: [1.5, 0.3], period: 9, pause: 1.5, phase: 3 },
    ],
    cars: [[-6, -4.9, "suv"], [-3, -4.9, "fastback"], [0, -4.9, "compact"], [2.7, -4.9, "suv"],
      [-3, 4.8, "compact"], [0, 4.8, "suv"], [3, 4.8, "fastback"], [6, 4.8, "compact"]],
    cones: [[-6.8, 3]],
  },
  {
    name: "Final Boss: Parking",
    parkedReply: "Boss defeated. Parking privileges acquired.",
    hint: "Three drivers. One runaway cart. One space. This is fine.",
    start: [-6, 5], target: [6, -4.8],
    sign: [-9.15, 1], signText: ["FINAL", "BOSS"], signReply: "Skill issue.",
    traffic: [
      { model: "compact", from: [6, -4.8], to: [6, 0.6], period: 8.4, pause: 1.2 },
      { model: "fastback", from: [-3, -4.9], to: [-3, 0.6], period: 9, pause: 1.2, phase: 3 },
      { model: "suv", from: [0, -4.9], to: [0, 0.6], period: 11, pause: 1.5, phase: 6 },
    ],
    trolley: { from: [2.7, -2], to: [6.4, -2] },
    cars: [[-6, -5, "compact"], [3, -5, "suv"],
      [-3, 5, "fastback"], [0, 5, "suv"], [3, 5, "compact"], [6, 5, "fastback"]],
    cones: [[-6.8, 3], [3, 1.5]],
  },
];
