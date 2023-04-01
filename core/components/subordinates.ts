import type { Entity } from "@core/entity";
import type { RequireComponent } from "@core/tsHelpers";
import type { BaseComponent } from "./component";

export interface Subordinates extends BaseComponent<"subordinates"> {
  ids: number[];
}

export function addSubordinate(
  entity: RequireComponent<"subordinates">,
  subordinate: Entity
) {
  entity.cp.subordinates.ids.push(subordinate.id);
  if (!subordinate.cp.commander) {
    subordinate.addComponent({ name: "commander", id: entity.id });
  } else {
    subordinate.cp.commander.id = entity.id;
  }
}

export function removeSubordinate(
  entity: RequireComponent<"subordinates">,
  subordinate: RequireComponent<"commander">
) {
  entity.cp.subordinates.ids = entity.cp.subordinates.ids.filter(
    (id) => id !== subordinate.id
  );
  subordinate.removeComponent("commander");
}
