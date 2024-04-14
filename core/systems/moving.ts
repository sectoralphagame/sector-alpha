import { normalizeAngle } from "@core/utils/misc";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { Index } from "./utils/entityIndex";
import { System } from "./system";

type Driveable = RequireComponent<"drive" | "position">;

function move(entity: Driveable, delta: number) {
  if (!entity.cp.drive.active) return;

  const entityPosition = entity.cp.position;
  const drive = entity.cp.drive;

  const entityAngle = normalizeAngle(
    // Offsetting so sprite (facing upwards) matches coords (facing rightwards)
    entityPosition.angle - Math.PI / 2
  );
  const moveVec = [Math.cos(entityAngle), Math.sin(entityAngle)];
  const dPos = [
    moveVec[0] * drive.currentSpeed * delta,
    moveVec[1] * drive.currentSpeed * delta,
  ];
  const dAngle = drive.currentRotary;

  entityPosition.coord[0] += dPos[0];
  entityPosition.coord[1] += dPos[1];
  entityPosition.angle += dAngle;
  entityPosition.moved = true;

  entity.cp.docks?.docked.forEach((docked) => {
    const dockedPosition = entity.sim.entities
      .get(docked)!
      .requireComponents(["position"]).cp.position;

    dockedPosition.coord = [...entityPosition.coord];
    dockedPosition.angle += dAngle;
  });

  if (entity.hasTags(["facility"])) {
    throw new Error("wtf");
  }
}

export class MovingSystem extends System {
  entities: Driveable[];
  index: Index<"drive" | "position">;

  apply = (sim: Sim): void => {
    super.apply(sim);

    this.index = new Index(sim, ["drive", "position"]);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    if (delta > 0) {
      for (const entity of this.index.getIt()) {
        move(entity, delta);
      }
    }
  };
}
