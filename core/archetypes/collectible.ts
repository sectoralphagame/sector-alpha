import type { Position } from "@core/components/position";
import { createRender } from "@core/components/render";
import type { SimpleCommodityStorage } from "@core/components/storage";
import { Entity } from "../entity";
import { MissingComponentError } from "../errors";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";

export const collectibleComponents = [
  "creationDate",
  "position",
  "render",
  "simpleCommodityStorage",
] as const;

// Ugly hack to transform collectibleComponents array type to string union
export type CollectibleComponent = (typeof collectibleComponents)[number];
export type Collectible = RequireComponent<CollectibleComponent>;

export function collectible(entity: Entity): Collectible {
  if (!entity.hasComponents(collectibleComponents)) {
    throw new MissingComponentError(entity, collectibleComponents);
  }

  return entity as Collectible;
}

interface CollectibleInput {
  storage: Omit<SimpleCommodityStorage, "name">;
  position: Pick<Position, "coord" | "sector">;
}

export function createCollectible(
  sim: Sim,
  { position, storage }: CollectibleInput
) {
  const entity = new Entity(sim);

  entity
    .addComponent({ name: "position", angle: 0, moved: true, ...position })
    .addComponent({ ...storage, name: "simpleCommodityStorage" })
    .addComponent(
      createRender({
        color: 0xffffff,
        defaultScale: 0.32,
        texture: "box",
        layer: "collectible",
      })
    )
    .addComponent({
      name: "creationDate",
      date: sim.getTime(),
    })
    .addTag("collectible")
    .addTag("selection");

  entity.cp.render!.static = true;

  return entity as Collectible;
}
