import type { RequireComponent } from "@core/tsHelpers";
import type { BaseComponent } from "./component";
import { addSubordinate, removeSubordinate } from "./subordinates";

export interface Commander extends BaseComponent<"commander"> {
  id: number;
}

export function removeCommander(
  entity: RequireComponent<"commander" | "orders">
) {
  removeSubordinate(
    entity.sim.getOrThrow<RequireComponent<"subordinates">>(
      entity.cp.commander.id
    ),
    entity
  );
}

export function changeCommander(
  entity: RequireComponent<"commander" | "orders">,
  commander: RequireComponent<"subordinates">
) {
  removeCommander(entity);
  addSubordinate(commander, entity);
}
