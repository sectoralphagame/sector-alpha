import type { Sim } from "@core/sim";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { recalculate as recalculateDamage } from "@core/components/damage";
import { recalculate as recalculateHitpoints } from "@core/components/hitpoints";
import { System } from "./system";

export class ModifierRecalculatingSystem extends System {
  apply(sim: Sim) {
    sim.hooks.phase.start.subscribe(
      this.constructor.name,
      this.recalculateModifiers.bind(this)
    );
  }

  // eslint-disable-next-line class-methods-use-this
  recalculateModifiers(): void {
    for (const entity of entityIndexer.search([], ["recalculate:modifiers"])) {
      if (entity.hasComponents(["damage"])) {
        recalculateDamage(entity.cp.damage);
      }
      if (entity.hasComponents(["hitpoints"])) {
        recalculateHitpoints(entity.cp.hitpoints);
      }
      entity.removeTag("recalculate:modifiers");
    }
  }
}

export const modifierRecalculatingSystem = new ModifierRecalculatingSystem();
