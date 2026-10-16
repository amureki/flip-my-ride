export type VehicleModel = "compact" | "fastback" | "suv" | "semi";
export type VehicleSurface = { width: number; length: number; height: number; z: number };

// Shared by the procedural meshes and landing checks; dimensions are game units.
export const vehicleShapes: Record<VehicleModel, { body: VehicleSurface; roof: VehicleSurface; wheel: number; axles: number[] }> = {
  compact: { body: { width: 1.45, length: 2.65, height: 0.65, z: 0 }, roof: { width: 1.12, length: 1.3, height: 1.05, z: 0.1 }, wheel: 0.3, axles: [-0.83, 0.85] },
  fastback: { body: { width: 1.6, length: 3.05, height: 0.62, z: 0 }, roof: { width: 1.24, length: 1.65, height: 0.96, z: 0.06 }, wheel: 0.3, axles: [-1, 1] },
  suv: { body: { width: 1.68, length: 2.95, height: 0.84, z: 0 }, roof: { width: 1.38, length: 1.8, height: 1.46, z: 0.12 }, wheel: 0.36, axles: [-0.96, 0.98] },
  semi: { body: { width: 1.95, length: 4.8, height: 0.85, z: 0 }, roof: { width: 1.8, length: 1.65, height: 2.5, z: -1.4 }, wheel: 0.43, axles: [-1.6, 0.9, 1.8] },
};

export function vehicleLandingHeight(model: VehicleModel, x: number, z: number, halfWidth = 0.75, halfLength = 1.3, roofDrop = 0, bodyDrop = 0) {
  const { body, roof } = vehicleShapes[model];
  let height = 0;
  for (const surface of [body, roof]) {
    if (Math.abs(x) < surface.width / 2 + halfWidth && Math.abs(z - surface.z) < surface.length / 2 + halfLength)
      height = Math.max(height, surface.height - (surface === roof ? roofDrop : bodyDrop));
  }
  return height;
}
