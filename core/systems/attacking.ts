import { stopCruise } from "@core/components/drive";
import { changeHp } from "@core/components/hitpoints";
import type { Sim } from "@core/sim";
import type { RequireComponent } from "@core/tsHelpers";
import { Cooldowns } from "@core/utils/cooldowns";
import { distance } from "mathjs";
import { regenCooldown } from "./hitpointsRegenerating";
import { Query } from "./query";
import { System } from "./system";

export function isInDistance(
  entity: RequireComponent<"damage" | "position">,
  target: RequireComponent<"position">
): boolean {
  return (
    distance(entity.cp.position.coord, target.cp.position.coord) <=
    entity.cp.damage.range
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
            if (
              target.tags.has("role:military") &&
              target.cp.orders?.value[0]?.type !== "attack"
            ) {
              target.cp.orders?.value.unshift({
                type: "attack",
                actions: [],
                followOutsideSector: false,
                ordersForSector: 0,
                origin: "auto",
                targetId: entity.id,
              });
            }
          }
        }
      });
    }
  };
}
