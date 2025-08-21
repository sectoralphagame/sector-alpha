import type { Sim } from "@core/sim";
import { Entity } from "@core/entity";
import type { Transform } from "@core/components/transform";
import { attach } from "@core/components/children";
import { MissingComponentError } from "../errors";
import type { RequireComponent } from "../tsHelpers";

export const turretComponents = [
  "damage",
  "color",
  "transform",
  "parent",
] as const;

export type TurretComponent = (typeof turretComponents)[number];
export type Turret = RequireComponent<TurretComponent>;

export function turret(entity: Entity): Turret {
  if (!entity.hasComponents(turretComponents)) {
    throw new MissingComponentError(entity, turretComponents);
  }

  return entity as Turret;
}

export interface TurretInput {
  angle: number;
  parentId: number;
  transform: Omit<Transform, "name">;
  slot: string;
  damage: {
    cooldown: number;
    value: number;
    range: number;
    angle: number;
    type: "kinetic" | "laser"; // Cosmetic for now
  };
  color: string;
}

export function createTurret(sim: Sim, input: TurretInput) {
  const entity = new Entity(sim) as Turret;
  const parent = sim
    .getOrThrow(input.parentId)
    .requireComponents(["position", "children"]);

  entity
    .addComponent({
      ...input.damage,
      name: "damage",
      targetId: null,
      output: {
        base: input.damage.value,
        current: input.damage.value,
      },
      modifiers: {},
      type: input.damage.type,
    })
    .addComponent({
      name: "color",
      value: input.color,
    })
    .addComponent({
      name: "transform",
      angle: input.angle,
      coord: input.transform.coord,
      world: {
        angle: input.angle,
        coord: input.transform.coord.clone(),
      },
    });

  attach(entity, parent, input.slot, "turret");

  return entity as Turret;
}
