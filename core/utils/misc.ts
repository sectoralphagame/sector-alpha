import type { Entity } from "@core/entity";

export function isOwnedByPlayer(entity: Entity): boolean {
  return entity!.cp.owner?.id === entity.sim.queries.player.get()[0].id;
}
