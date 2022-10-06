import { BaseComponent } from "./component";
import { Entity } from "./entity";

export interface Player extends BaseComponent<"player"> {}

export function isOwnedByPlayer(entity: Entity): boolean {
  return entity!.cp.owner?.id === entity.sim.queries.player.get()[0].id;
}
