import type { Entity } from "@core/entity";
import type { RequireComponent } from "@core/tsHelpers";
import { cleanupOrders } from "@core/systems/orderExecuting/orderExecuting";
import type { BaseComponent } from "./component";

export interface Subordinates extends BaseComponent<"subordinates"> {
  ids: number[];
}

function checkCyclicCommandChain(entity: Entity, commanderId: number): void {
  if (entity.id === commanderId) throw new Error("Cyclic chain of command");

  if (entity.hasComponents(["subordinates"])) {
    for (const subordinateId of entity.cp.subordinates.ids) {
      checkCyclicCommandChain(
        entity.sim.getOrThrow(subordinateId),
        commanderId
      );
    }
  }
}

export function addSubordinate(
  entity: RequireComponent<"subordinates">,
  subordinate: Entity
) {
  checkCyclicCommandChain(subordinate, entity.id);
  if (!entity.cp.subordinates.ids.includes(subordinate.id)) {
    entity.cp.subordinates.ids.push(subordinate.id);
  }
  if (!subordinate.cp.commander) {
    subordinate.addComponent({ name: "commander", id: entity.id });
  } else {
    subordinate.cp.commander.id = entity.id;
  }
}

export function removeSubordinate(
  entity: RequireComponent<"subordinates">,
  subordinate: RequireComponent<"commander" | "orders">
) {
  entity.cp.subordinates.ids = entity.cp.subordinates.ids.filter(
    (id) => id !== subordinate.id
  );
  subordinate.removeComponent("commander");
  cleanupOrders(subordinate);
}
