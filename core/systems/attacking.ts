import { stopCruise } from "@core/components/drive";
import { changeHp } from "@core/components/hitpoints";
import settings from "@core/settings";
import type { Sim } from "@core/sim";
import type { RequireComponent } from "@core/tsHelpers";
import { Cooldowns } from "@core/utils/cooldowns";
import { findInAncestors } from "@core/utils/findInAncestors";
import { distance } from "mathjs";
import { regenCooldown } from "./hitpointsRegenerating";
import { Query } from "./utils/query";
import { System } from "./system";

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

export class AttackingSystem extends System {
  cooldowns: Cooldowns<"exec">;
  query: Query<"damage" | "position">;

  constructor(sim: Sim) {
    super(sim);
    this.query = new Query(sim, ["damage", "position"]);
    this.cooldowns = new Cooldowns("exec");
  }

  exec = (delta: number): void => {
    if (this.sim.getTime() < settings.bootTime) return;
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", 1);

      this.query.get().forEach((entity) => {
        if (entity.cp.damage.targetId) {
          if (!this.sim.entities.has(entity.cp.damage.targetId)) {
            entity.cp.damage.targetId = null;
            return;
          }

          const target = this.sim
            .getOrThrow(entity.cp.damage.targetId)
            .requireComponents(["position", "hitpoints"]);

          if (isInDistance(entity, target)) {
            changeHp(target, entity.cp.damage.value);
            target.cooldowns.use(regenCooldown, 3);
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
        }
      });
    }
  };
}
