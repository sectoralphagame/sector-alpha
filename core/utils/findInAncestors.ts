import type { CoreComponents } from "../components/component";
import type { Entity } from "../entity";
import { MissingComponentError } from "../errors";
import type { RequireComponent } from "../tsHelpers";

export function findInAncestors<T extends keyof CoreComponents>(
  entity: Entity,
  component: T,
  visited: number[] = []
): RequireComponent<T> {
  if (visited.includes(entity.id)) {
    throw new Error("Cyclic ancestry detected");
  }
  if (entity.hasComponents([component])) {
    return entity.requireComponents([component]);
  }

  if (entity.hasComponents(["parent"])) {
    return findInAncestors(
      entity.sim.getOrThrow(entity.requireComponents(["parent"]).cp.parent.id),
      component,
      [...visited, entity.id]
    );
  }

  throw new MissingComponentError(entity, [component]);
}
