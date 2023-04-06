import { stopCruise } from "@core/components/drive";
import { changeHp } from "@core/components/hitpoints";
import settings from "@core/settings";
import type { Sim } from "@core/sim";
import type { RequireComponent } from "@core/tsHelpers";
import { findInAncestors } from "@core/utils/findInAncestors";
import { distance } from "mathjs";
import type { DockSize } from "@core/components/dockable";
import { regenCooldown } from "./hitpointsRegenerating";
import { Query } from "./utils/query";
import { System } from "./system";

const sizeMultipliers: Record<DockSize, [number, number, number]> = {
  large: [0.1, -5, 10],
  medium: [0.5, -1, 25],
  small: [0.05, -10, 45],
};
export function getEvasionChance(speed: number, size: DockSize): number {
  const [a, b, c] = sizeMultipliers[size];
  return Math.max(0, ((b / speed) * 10 * a + c) / 100);
}

export function isInDistance(
  entity: RequireComponent<"damage">,
  target: RequireComponent<"position">
): boolean {
  return (
    distance(
      findInAncestors(entity, "position").cp.position.coord,
      target.cp.position.coord
    ) <= entity.cp.damage.range
  );
}

function shouldAttackBack(
  attacker: RequireComponent<"damage" | "position">,
  target: RequireComponent<"position">
): boolean {
  return (
    !!target.cp.damage &&
    target.tags.has("role:military") &&
    (target.cp.orders?.value[0]?.type !== "attack" ||
      (target.cp.orders.value[0].targetId !== attacker.id &&
        !attacker.sim
          .getOrThrow(target.cp.orders.value[0].targetId)
          .tags.has("role:military") &&
        isInDistance(target.requireComponents(["damage"]), attacker)))
  );
}

const cdKey = "attack";

export class AttackingSystem extends System {
  query: Query<"damage" | "position">;

  apply = (sim: Sim) => {
    super.apply(sim);

    this.query = new Query(sim, ["damage", "position"]);

    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };

  exec = (): void => {
    if (this.sim.getTime() < settings.bootTime) return;

    this.query.get().forEach((entity) => {
      if (entity.cp.damage.targetId && entity.cooldowns.canUse(cdKey)) {
        if (!this.sim.entities.has(entity.cp.damage.targetId)) {
          entity.cp.damage.targetId = null;
          return;
        }

        const target = this.sim
          .getOrThrow(entity.cp.damage.targetId)
          .requireComponents(["position", "hitpoints"]);

        if (isInDistance(entity, target)) {
          entity.cooldowns.use(cdKey, entity.cp.damage.cooldown);
          if (
            !target.cp.drive ||
            !target.cp.dockable ||
            Math.random() >
              getEvasionChance(
                target.cp.drive.currentSpeed,
                target.cp.dockable.size
              )
          ) {
            changeHp(target, entity.cp.damage.value);

            if (target.cp.drive) {
              stopCruise(target.cp.drive);
            }
            if (shouldAttackBack(entity, target)) {
              if (target.cp.orders) {
                if (target.cp.orders.value[0]) {
                  target.cp.orders.value[0].interrupt = true;
                }
                target.cp.orders.value.splice(1, 0, {
                  type: "attack",
                  actions: [],
                  followOutsideSector: false,
                  ordersForSector: 0,
                  origin: "auto",
                  targetId: findInAncestors(entity, "position").id,
                });
              }
            } else if (target.cp.damage && !target.tags.has("role:military")) {
              target.cp.damage.targetId = findInAncestors(
                entity,
                "position"
              ).id;
            }
          }

          target.cooldowns.use(regenCooldown, 3);
        }
      }
    });
  };
}
