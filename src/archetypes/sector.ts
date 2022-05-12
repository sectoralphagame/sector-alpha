import { Matrix } from "mathjs";
import { CoreComponents, Entity } from "../components/entity";
import { HECSPosition } from "../components/hecsPosition";
import { Name } from "../components/name";
import { RenderGraphics } from "../components/render";
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

export const sectorSize = 500;

export function createSector(sim: Sim, { position, name }: InitialSectorInput) {
  const entity = new Entity(sim);

  const components: Pick<CoreComponents, SectorComponent> = {
    hecsPosition: new HECSPosition(position),
    name: new Name(name),
    renderGraphics: new RenderGraphics((g) => {
      const pos = entity.cp.hecsPosition!.toCartesian(sectorSize);
      g.drawRegularPolygon!(
        pos.get([0]),
        pos.get([1]),
        sectorSize,
        6,
        Math.PI / 6
      );
    }),
  };
  entity.components = components;

  return entity as Sector;
}
