import { random } from "mathjs";
import { fromPolar } from "@core/utils/misc";
import type { MineableCommodity } from "../economy/commodity";
import { createAsteroidField } from "../archetypes/asteroidField";
import type { Sim } from "../sim";
import type { Sector } from "../archetypes/sector";
import { sectorSize } from "../archetypes/sector";

export function spawnAsteroidField(
  sim: Sim,
  resources: Record<MineableCommodity, number>,
  size: number,
  sector: Sector
) {
  const maxR = (sectorSize / 20) * Math.sqrt(3);
  const position = fromPolar(
    random(-Math.PI, Math.PI),
    random(0, maxR - size - 0.5)
  );

  createAsteroidField(sim, position, sector, {
    density: random(0.5, 2),
    size,
    resources,
  });
}
