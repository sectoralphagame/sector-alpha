import type { Sector } from "@core/archetypes/sector";
import { worldToHecs } from "@core/components/hecsPosition";
import type { Sim } from "@core/sim";
import type { RequireComponent } from "@core/tsHelpers";
import { deepEqual } from "mathjs";
import { System } from "../system";

export class OutOfBoundsCheckingSystem extends System<"exec"> {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.start.tap(this.constructor.name, this.exec);
  };
  exec = (): void => {
    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", this.sim.speed);
      const outOfBoundsEntities = this.sim.queries.renderable
        .get()
        .reduce((acc, entity) => {
          const sector = this.sim.getOrThrow<Sector>(entity.cp.position.sector);
          const hecsCoors = worldToHecs(
            entity.cp.position.coord.toArray() as number[]
          );

          if (!deepEqual(hecsCoors, sector.cp.hecsPosition.value)) {
            acc.push(entity);
          }

          return acc;
        }, [] as RequireComponent<"position">[]);

      if (outOfBoundsEntities.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(`${outOfBoundsEntities.length} entities out of bounds`);
        // eslint-disable-next-line no-console
        console.log(outOfBoundsEntities);
      }
    }
  };
}
