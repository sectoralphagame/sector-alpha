import type { Sim } from "@core/sim";
import { Entity } from "@core/entity";
import type { Transform } from "@core/components/transform";
import { attach } from "@core/components/children";
import { getTurretBySlug } from "@core/world/turrets";
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
  slug: string;
  damage: {
    angle: number;
  };
}

export function createTurret(sim: Sim, input: TurretInput) {
  const entity = new Entity(sim) as Turret;
  const parent = sim.getOrThrow(input.parentId).requireComponents(["children"]);
  const turretInfo = getTurretBySlug(input.slug)!;

  entity
    .addComponent({
      angle: input.damage.angle,
      cooldown: turretInfo.cooldown,
      range: turretInfo.range,
      name: "damage",
      targetId: null,
      output: {
        base: turretInfo.damage,
        current: turretInfo.damage,
      },
      modifiers: {},
      type: turretInfo.type,
    })
    .addComponent({
      name: "color",
      value: turretInfo.color,
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
