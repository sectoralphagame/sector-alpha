import { Sector } from "@core/archetypes/sector";
import { worldToHecs } from "@core/components/hecsPosition";
import { RequireComponent } from "@core/tsHelpers";
import { Cooldowns } from "@core/utils/cooldowns";
import { deepEqual } from "mathjs";
import { System } from "../system";

export class OutOfBoundsCheckingSystem extends System {
  cooldowns = new Cooldowns("exec");

  exec = (delta: number): void => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", this.sim.speed);
      const outOfBoundsEntities = this.sim.queries.renderable
        .get()
        .reduce((acc, entity) => {
          const sector = this.sim.getOrThrow<Sector>(entity.cp.position.sector);

          if (
            !deepEqual(
              worldToHecs(entity.cp.position.coord.toArray() as number[]),
              sector.cp.hecsPosition.value
            )
          ) {
            acc.push(entity);
          }

          return acc;
        }, [] as RequireComponent<"position">[]);

      if (outOfBoundsEntities.length > 0) {
        console.warn(`${outOfBoundsEntities.length} entities out of bounds`);
        console.log(outOfBoundsEntities);
      }
    }
  };
}
