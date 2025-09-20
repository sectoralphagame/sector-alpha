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
import { filter, flatMap, map, pipe, some } from "@fxts/core";
import type { Turret } from "@core/archetypes/turret";
import type { AttackOrder } from "@core/components/orders";
import { normalizeAngle } from "@core/utils/misc";
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

    sim.hooks.subscribe("phase", ({ phase }) => {
      if (phase === "update") {
        this.exec();
      }
    });
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
        } else if (AttackingSystem.shouldRetribute(parentEntity, target)) {
          this.retribute(target, entityTransform.coord, parentEntity.id);
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

  retribute(
    target: RequireComponent<"hitpoints" | "position">,
    attackerPosition: Vec2,
    attackerId: number
  ) {
    let iterator: Iterable<number>;

    if (target.hasComponents(["children"])) {
      iterator = pipe(
        target.cp.children.entities,
        filter((c) => c.role === "turret"),
        map((c) => c.id)
      );
    } else if (target.hasComponents(["modules"])) {
      iterator = pipe(
        target.cp.modules.ids,
        map((m) => this.sim.getOrThrow(m)),
        filter((m) => m.hasComponents(["children"])),
        flatMap((m) => m.cp.children.entities),
        filter((c) => c.role === "turret"),
        map((c) => c.id)
      );
    } else {
      throw new Error("This entity has no components to support turrets");
    }

    for (const turretId of iterator) {
      const turret = this.sim.getOrThrow<Turret>(turretId);
      if (
        AttackingSystem.isInShootingRange(
          turret.cp.transform.world.coord,
          turret.cp.transform.world.angle,
          attackerPosition,
          turret.cp.damage.range,
          turret.cp.damage.angle
        )
      ) {
        turret.cp.damage.targetId = attackerId;
      }
    }
  }

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

  static shouldRetribute(
    _attacker: Entity,
    target: RequireComponent<"position">
  ): boolean {
    return (
      target.hasComponents(["children"]) || target.hasComponents(["modules"])
    );
  }
}

export const attackingSystem = new AttackingSystem();
