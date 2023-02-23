import Color from "color";
import { Entity } from "../entity";
import { MissingComponentError } from "../errors";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { createBudget } from "../components/budget";

export const factionComponents = [
  "color",
  "blueprints",
  "budget",
  "name",
  "relations",
] as const;

export type FactionComponent = (typeof factionComponents)[number];
export type Faction = RequireComponent<FactionComponent>;

export function faction(entity: Entity): Faction {
  if (!entity.hasComponents(factionComponents)) {
    throw new MissingComponentError(entity, factionComponents);
  }

  return entity as Faction;
}

export function createFaction(name: string, sim: Sim) {
  const entity = new Entity(sim);
  entity
    .addComponent({
      name: "color",
      value: Color.rgb(151, 255, 125).toString(),
    })
    .addComponent(createBudget())
    .addComponent({ name: "name", value: name })
    .addComponent({ name: "blueprints", ships: [], facilityModules: [] })
    .addComponent({ name: "relations", values: {} });

  return entity as Faction;
}
