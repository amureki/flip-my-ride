import type { TrolleyRoute } from "./trolley";

import type { VehicleModel } from "./vehicles";

export type Point = readonly [x: number, z: number];
export type Level = {
  name: string;
  hint: string;
  start: Point;
  target: Point;
  cars: readonly (readonly [x: number, z: number, model: VehicleModel])[];
  cones: readonly Point[];
  trolley?: TrolleyRoute;
};

export const levels: readonly Level[] = [
  {
    name: "One Spot Over",
    hint: "One space to the right. Try not to launch into orbit.",
    start: [-6.3, 4.8],
    target: [-3.3, 4.8],
    cars: [
      [-0.3, 4.8, "compact"],
      [2.7, 4.8, "fastback"],
      [5.7, 4.8, "suv"],
      [-6.3, -4.9, "compact"],
      [-0.3, -4.9, "fastback"],
      [5.7, -4.9, "suv"],
    ],
    cones: [],
  },
  {
    name: "Full Lot",
    hint: "One free space. Getting there without a claim is the hard part.",
    start: [-6.3, 0],
    target: [2.7, -4.9],
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
    cones: [],
  },
  {
    name: "Unexpected Item",
    trolley: { from: [0.8, -3.7], to: [6.4, -3.7] },
    hint: "The trolley has right of way. Your insurance recommends respecting it.",
    start: [-5.5, 4.8],
    target: [4.2, -3.7],
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
    name: "Last Space",
    trolley: { from: [6, -5.4], to: [6, -1.8] },
    hint: "The last space. Can you reach it without flattening the lot?",
    start: [-6, 5],
    target: [6, -5],
    cars: [
      [-6, -5, "compact"], [-3, -5, "fastback"], [3, -5, "suv"],
      [-3, 0, "compact"], [0, 0, "fastback"], [3, 0, "suv"], [6, 1.3, "compact"],
      [-3, 5, "fastback"], [0, 5, "suv"], [3, 5, "compact"], [6, 5, "fastback"],
    ],
    cones: [],
  },
];
