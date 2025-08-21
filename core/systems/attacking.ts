import { dealDamageToEntity } from "@core/components/hitpoints";
import settings from "@core/settings";
import type { Sim } from "@core/sim";
import type { RequireComponent } from "@core/tsHelpers";
import { findInAncestors } from "@core/utils/findInAncestors";
import type { DockSize } from "@core/components/dockable";
import type { Entity } from "@core/entity";
import { stopCruise } from "@core/utils/moving";
import { Vec2 } from "ogl";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import type { TransformData } from "@core/components/transform";
import { filter, map, pipe, some } from "@fxts/core";
import type { Turret } from "@core/archetypes/turret";
import type { AttackOrder } from "@core/components/orders";
import { regenCooldown } from "./hitpointsRegenerating";
import { System } from "./system";
import { transport3D } from "./transport3d";

const tempVec2 = new Vec2();

const sizeMultipliers: Record<DockSize, [number, number, number]> = {
  large: [0.1, -5, 10],
  medium: [0.5, -1, 25],
  small: [0.05, -10, 45],
};
export function getEvasionChance(speed: number, size: DockSize): number {
  const [a, b, c] = sizeMultipliers[size];
  return Math.max(0, ((b / speed) * 10 * a + c) / 100);
}

/**
 *
 * @param angle Angle in radians
 * @returns Normalized angle in the range of -π to π
 */
function normalizeAngle(angle: number): number {
  let out = angle;

  while (out > Math.PI) {
    out -= 2 * Math.PI;
  }
  while (out < -Math.PI) {
    out += 2 * Math.PI;
  }
  return out;
}

function attack(attacker: RequireComponent<"orders">, target: Entity) {
  const order: AttackOrder = {
    type: "attack",
    actions: [],
    followOutsideSector: false,
    ordersForSector: 0,
    origin: "auto",
    targetId: findInAncestors(target, "position").id,
  };

  if (attacker.cp.orders.value[0]) {
    if (
      attacker.cp.orders.value[0]?.origin === "auto" &&
      attacker.cp.orders.value[0].type === "attack"
    ) {
      attacker.cp.orders.value[0] = order;
      return;
    }

    attacker.cp.orders.value[0].interrupt = true;
  }
  attacker.cp.orders.value.splice(1, 0, order);
}

const cdKey = "attack";

export class AttackingSystem extends System {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (): void => {
    if (this.sim.getTime() < settings.bootTime) return;

    for (const entity of entityIndexer.search(["damage"])) {
      if (!(entity.cp.damage.targetId && entity.cooldowns.canUse(cdKey)))
        continue;

      if (!this.sim.entities.has(entity.cp.damage.targetId)) {
        entity.cp.damage.targetId = null;
        continue;
      }

      if (entity.cp.drive?.state === "cruise") {
        continue;
      }

      const target = this.sim
        .getOrThrow(entity.cp.damage.targetId)
        .requireComponents(["position", "hitpoints"]);
      const parentEntity = findInAncestors(entity, "position");
      const entityTransform: TransformData = (entity.cp.transform?.world ??
        entity.cp.position)!;

      if (
        !AttackingSystem.isInShootingRange(
          entityTransform.coord,
          entityTransform.angle,
          target.cp.position.coord,
          entity.cp.damage.range,
          entity.cp.damage.angle
        )
      )
        continue;

      entity.cooldowns.use(cdKey, entity.cp.damage.cooldown);
      if (
        !target.cp.movable ||
        !target.cp.dockable ||
        Math.random() >
          getEvasionChance(
            target.cp.movable.velocity.len(),
            target.cp.dockable.size
          )
      ) {
        dealDamageToEntity(target, entity.cp.damage.output.current, entity.id);
        if (entity.hasComponents(["transform"])) {
          transport3D.publish({
            type: "shoot",
            entity,
          });
        }

        if (target.hasComponents(["drive", "movable"])) {
          stopCruise(target);
        }
        if (
          AttackingSystem.shouldPursueAttacker(parentEntity, target) &&
          target.cp.orders
        ) {
          attack(target.requireComponents(["orders"]), parentEntity);
        } else if (
          target.hasComponents(["children"]) &&
          AttackingSystem.shouldAttackAttacker(parentEntity, target)
        ) {
          for (const child of target.cp.children.entities) {
            if (child.role !== "turret") continue;

            const turret = this.sim.getOrThrow<Turret>(child.id);
            if (
              AttackingSystem.isInShootingRange(
                turret.cp.transform.world.coord,
                turret.cp.transform.world.angle,
                entityTransform.coord,
                turret.cp.damage.range,
                turret.cp.damage.angle
              )
            ) {
              turret.cp.damage.targetId = parentEntity.id;
            }
          }
        }
        target.cp.subordinates?.ids.forEach((subordinateId) => {
          const subordinate = this.sim
            .getOrThrow(subordinateId)
            .requireComponents(["orders"]);

          if (subordinate.cp.orders.value[0]?.type === "escort") {
            attack(subordinate, parentEntity);
          }
        });
      }

      target.cooldowns.use(regenCooldown, 2);
    }
  };

  static isInShootingRange(
    originPosition: Vec2,
    originAngle: number,
    targetPosition: Vec2,
    range: number,
    arc: number
  ): boolean {
    const targetVector = tempVec2.copy(targetPosition).sub(originPosition);
    const angle = normalizeAngle(
      Math.atan2(targetVector[1], targetVector[0]) - originAngle
    );

    return targetVector.len() <= range && Math.abs(angle) <= arc / 2;
  }

  static isInTurretShootingRange(
    entity: RequireComponent<"position" | "children">,
    targetPosition: Vec2
  ): boolean {
    return pipe(
      entity.cp.children.entities ?? [],
      filter((c) => c.role === "turret"),
      map((c) => entity.sim.getOrThrow<Turret>(c.id)),
      some((t) =>
        AttackingSystem.isInShootingRange(
          t.cp.transform.world.coord,
          t.cp.transform.world.angle,
          targetPosition,
          t.cp.damage.range,
          t.cp.damage.angle
        )
      )
    );
  }

  static shouldPursueAttacker(
    attacker: Entity,
    target: RequireComponent<"position">
  ): boolean {
    return (
      target.tags.has("role:military") &&
      target.cp.orders?.value[0]?.type !== "attack" &&
      (!(
        attacker.cp.dockable?.size === "small" &&
        target.cp.dockable?.size !== "small"
      ) ||
        attacker.cp.dockable?.size !== "small")
    );
  }

  static shouldAttackAttacker(
    _attacker: Entity,
    _target: RequireComponent<"position">
  ): boolean {
    return true;
  }
}

export const attackingSystem = new AttackingSystem();
