import { filter, map, pipe, toArray } from "@fxts/core";
import type { FacilityModule } from "@core/archetypes/facilityModule";
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

export function findModules<T extends keyof CoreComponents>(
  entity: RequireComponent<"modules">,
  component: T
): RequireComponent<T>[] {
  return pipe(
    entity.cp.modules.ids,
    map(entity.sim.getOrThrow<FacilityModule>),
    filter((m) => m.hasComponents([component])),
    map((m) => m.requireComponents([component])),
    toArray
  );
}
