import { Matrix } from "mathjs";
import { Entity } from "../components/entity";
import { createRenderGraphics } from "../components/renderGraphics";
import { MissingComponentError } from "../errors";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import "@pixi/graphics-extras";

export const sectorComponents = [
  "hecsPosition",
  "name",
  "renderGraphics",
] as const;

// Ugly hack to transform sectorComponents array type to string union
const widenType = [...sectorComponents][0];
export type SectorComponent = typeof widenType;
export type Sector = RequireComponent<SectorComponent>;

export const sectorSize = 500;
export function sector(entity: Entity): Sector {
  if (!entity.hasComponents(sectorComponents)) {
    throw new MissingComponentError(entity, sectorComponents);
  }

  return entity as Sector;
}

export interface InitialSectorInput {
  position: Matrix;
  name: string;
}

export function createSector(sim: Sim, { position, name }: InitialSectorInput) {
  const entity = new Entity(sim);

  entity
    .addComponent({
      name: "hecsPosition",
      value: position,
    })
    .addComponent({
      name: "name",
      value: name,
    })
    .addComponent(
      createRenderGraphics("sector", {
        position,
        name,
      })
    );

  return entity as Sector;
}
