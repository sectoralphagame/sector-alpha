import { ship } from "@core/archetypes/ship";
import type { Entity } from "@core/entity";

export function isOwnedByPlayer(entity: Entity): boolean {
  return entity!.cp.owner?.id === entity.sim.queries.player.get()[0].id;
}

export function getSubordinates(entity: Entity) {
  return entity.sim.queries.commendables
    .get()
    .filter((e) => e?.cp.commander?.id === entity.id)
    .map(ship);
}
