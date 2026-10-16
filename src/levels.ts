import type { TrolleyRoute } from "./trolley";

export type Point = readonly [x: number, z: number];
export type Level = {
  name: string;
  hint: string;
  start: Point;
  target: Point;
  cars: readonly Point[];
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
      [-0.3, 4.8],
      [2.7, 4.8],
      [5.7, 4.8],
      [-6.3, -4.9],
      [-0.3, -4.9],
      [5.7, -4.9],
    ],
    cones: [],
  },
  {
    name: "Full Lot",
    hint: "One free space. The cars are obstacles, not stepping stones.",
    start: [-6.3, 0],
    target: [2.7, -4.9],
    cars: [
      [-6.3, -4.9],
      [-3.3, -4.9],
      [-0.3, -4.9],
      [5.7, -4.9],
      [-6.3, 4.8],
      [-3.3, 4.8],
      [-0.3, 4.8],
      [2.7, 4.8],
      [5.7, 4.8],
      [-3.3, 0],
      [2.7, 0],
      [5.7, 0],
    ],
    cones: [],
  },
  {
    name: "Unexpected Item",
    trolley: { from: [0.8, -3.7], to: [6.4, -3.7] },
    hint: "Wait for a clear landing. The trolley has right of way. Apparently.",
    start: [-5.5, 4.8],
    target: [4.2, -3.7],
    cars: [
      [-6.3, -4.9],
      [-3.3, -4.9],
      [6.2, 5],
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
    hint: "Find the gaps. Then time the last landing. The trolley wants a rematch.",
    start: [-6, 5],
    target: [6, -5],
    cars: [
      [-6, -5], [-3, -5], [3, -5],
      [-3, 0], [0, 0], [3, 0], [6, 1.3],
      [-3, 5], [0, 5], [3, 5], [6, 5],
    ],
    cones: [],
  },
];
