import { ship } from "@core/archetypes/ship";
import type { Entity } from "@core/entity";
import type { RequireComponent } from "@core/tsHelpers";

export function isOwnedByPlayer(entity: Entity): boolean {
  return entity!.cp.owner?.id === entity.sim.queries.player.get()[0].id;
}

export function getSubordinates(entity: RequireComponent<"subordinates">) {
  return entity.cp.subordinates.ids.map((id) =>
    ship(entity.sim.getOrThrow(id))
  );
}
