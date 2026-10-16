import type { TrafficRoute } from "./traffic";
import type { TrolleyRoute } from "./trolley";

import type { VehicleModel } from "./vehicles";

export type Point = readonly [x: number, z: number];
export type Level = {
  name: string;
  par: number;
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
    par: 1,
    parkedReply: "One small flip. One giant parking achievement.",
    hint: "One space to the right. Try not to launch into orbit.",
    start: [-6.3, 4.8],
    target: [-3.3, 4.8],
    sign: [-9.15, 4.5],
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
    par: 3,
    parkedReply: "Full lot. Empty claims folder.",
    hint: "One free space. Getting there without a claim is the hard part.",
    start: [-6.3, 0],
    target: [2.7, -4.9],
    sign: [-9.15, 4.5],
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
    par: 3,
    parkedReply: "Self-checkout complete. Please take your vehicle.",
    trolley: { from: [0.8, -3.7], to: [6.4, -3.7] },
    hint: "The trolley has right of way. Your insurance recommends respecting it.",
    start: [-5.5, 4.8],
    target: [4.2, -3.7],
    sign: [-9.15, 4.5],
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
    par: 3,
    parkedReply: "Objects in the mirror are worse at parking.",
    hint: "That car is leaving. Watch it reverse, turn, and take the exit.",
    start: [-6, 4.8], target: [3, -4.9],
    sign: [-9.15, 4.5], signText: ["BACK IT", "UP"], signReply: "Uno reverse.",
    traffic: [{ model: "compact", bay: [0, -4.9], parkFor: 3, speed: 2.2, gap: 5, once: true }],
    cars: [[-6.3, -4.9, "fastback"], [6, -4.9, "suv"], [0, 4.8, "compact"], [5.7, 4.8, "suv"]],
    cones: [[-5, 2], [-2, 1.8]],
  },
  {
    name: "Space Invaders",
    par: 4,
    parkedReply: "Space secured. Personal space not included.",
    hint: "New arrivals want your space. Park before the next one turns in.",
    start: [-6, 4.8], target: [5.7, -4.8],
    sign: [-9.15, 4.5], signText: ["SPACE", "INVADERS"], signReply: "You snooze.",
    traffic: [
      { model: "fastback", bay: [5.7, -4.8], parkFor: 4, maneuver: 3, speed: 3.6, gap: 1 },
      { model: "fastback", bay: [5.7, -4.8], parkFor: 4, maneuver: 3, speed: 3.6, gap: 1, arrivesAfter: 0 },
    ],
    cars: [[-6.3, -4.9, "compact"], [-3, 4.8, "compact"], [-3.3, -4.9, "compact"], [0, -4.9, "suv"], [0, 4.8, "fastback"], [5.7, 4.8, "suv"]],
    cones: [[-5, 2], [1.4, 1.8], [-1.8, -2]],
  },
  {
    name: "After You. No, You.",
    par: 4,
    parkedReply: "Right of way? Wrong of everyone.",
    hint: "Less room. More arrivals. Find a clean landing, then steal the space.",
    start: [-6, 4.8], target: [5.7, -4.8],
    sign: [-9.15, 4.5], signText: ["YOU", "FIRST"], signReply: "Trust issues.",
    traffic: [
      { model: "compact", bay: [5.7, -4.8], parkFor: 4, maneuver: 2.5, speed: 4, gap: 0.8 },
      { model: "compact", bay: [5.7, -4.8], parkFor: 4, maneuver: 2.5, speed: 4, gap: 0.8, arrivesAfter: 4 },
      { model: "compact", bay: [5.7, -4.8], parkFor: 4, maneuver: 2.5, speed: 4, gap: 0.8, arrivesAfter: 0 },
    ],
    cars: [[-3.8, -4.9, "compact"], [-6.5, -4.9, "compact"], [1.2, -4.9, "compact"],
      [-3, 4.8, "compact"], [0, 4.8, "suv"], [3, 4.8, "fastback"], [6, 4.8, "compact"]],
    cones: [[-5, 2], [-0.5, 1.9], [3, 1.9]],
  },
  {
    name: "Final Boss: Parking",
    par: 4,
    parkedReply: "Boss defeated. Parking privileges acquired.",
    hint: "Three drivers. One runaway cart. One space. This is fine.",
    start: [-6, 5], target: [6, -4.8],
    sign: [-9.15, 4.5], signText: ["FINAL", "BOSS"], signReply: "Skill issue.",
    traffic: [
      { model: "compact", bay: [6, -4.8], parkFor: 3, maneuver: 1.8, speed: 4.4, gap: 0.6 },
      { model: "compact", bay: [6, -4.8], parkFor: 3, maneuver: 1.8, speed: 4.4, gap: 0.6, arrivesAfter: 3 },
      { model: "compact", bay: [6, -4.8], parkFor: 3, maneuver: 1.8, speed: 4.4, gap: 0.6, arrivesAfter: 0 },
    ],
    trolley: { from: [8, -3.2], to: [8, 3.2] },
    cars: [[-6.3, -4.9, "compact"], [-3.3, -4.9, "fastback"], [0, -4.9, "suv"], [-3, 5, "fastback"], [0, 5, "suv"], [3, 5, "compact"], [6, 5, "fastback"]],
    cones: [[-5, 2], [3, 1.5], [-0.5, 1.9]],
  },
];
