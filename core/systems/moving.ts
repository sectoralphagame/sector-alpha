import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { Vec2 } from "ogl";
import type { TransformData } from "@core/components/transform";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { System } from "./system";

const baseMaxSpeed = 8;

type Movable = RequireComponent<"movable" | "position">;

function applyToDocked(entity: RequireComponent<"position" | "movable">) {
  if (!entity.cp.docks) return;

  for (const dockedId of entity.cp.docks.docked) {
    const docked = entity.sim
      .getOrThrow(dockedId)
      .requireComponents(["position"]);

    if (docked.hasComponents(["movable"])) {
      docked.cp.movable.velocity.copy(entity.cp.movable.velocity);
    }
    docked.cp.position.coord.copy(entity.cp.position.coord);
    docked.cp.position.angle = entity.cp.position.angle;
  }
}

export function applyParentTransform(
  entity: RequireComponent<"transform">,
  transform: TransformData
): void {
  entity.cp.transform.world.coord
    .copy(transform.coord)
    .add(entity.cp.transform.coord);
  entity.cp.transform.world.angle = transform.angle + entity.cp.transform.angle;
}

export function applyPositionToChildren(
  entity:
    | RequireComponent<"children" | "position">
    | RequireComponent<"children" | "transform">
): void {
  const worldTransform = (entity.cp.position ?? entity.cp.transform?.world)!;
  for (const { id } of entity.cp.children.entities) {
    const child = entity.sim.getOrThrow(id);
    if (child.hasComponents(["transform"])) {
      applyParentTransform(child, worldTransform);

      if (child.hasComponents(["children"])) {
        applyPositionToChildren(child);
      }
    }
  }
}

const tempDrag = new Vec2();
const tempAcceleration = new Vec2();
const tempVelocity = new Vec2();
export const dragCoeff = 0.01;

export class MovingSystem extends System {
  entities: Movable[];

  apply = (sim: Sim): void => {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(
      this.constructor.name,
      this.exec.bind(this)
    );
  };

  // eslint-disable-next-line class-methods-use-this
  exec(delta: number): void {
    if (delta > 0) {
      for (const entity of entityIndexer.search(["movable", "position"])) {
        if (!entity.cp.dockable?.dockedIn || entity.cp.dockable?.undocking) {
          this.move(entity, delta);
        }
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  move(entity: Movable, delta: number) {
    const velocity = entity.cp.movable.velocity;
    const acceleration = entity.cp.movable.acceleration;

    const dPos = tempVelocity
      .copy(velocity)
      .multiply(delta)
      .add(tempAcceleration.copy(acceleration).multiply(delta ** 2 / 2));
    const dAngle = entity.cp.movable.rotary;
    MovingSystem.changeEntityPosition(entity, dPos, dAngle);
    const dVel = tempAcceleration
      .copy(acceleration)
      .sub(tempDrag.copy(velocity).multiply(dragCoeff + entity.cp.movable.drag))
      .multiply(delta);
    velocity.add(dVel);

    const speed = velocity.len();
    const maxSpeed = entity.hasComponents(["drive"])
      ? entity.cp.drive.state === "cruise"
        ? entity.cp.drive.cruise
        : entity.cp.drive.maneuver
      : baseMaxSpeed;
    if (speed > 0) {
      entity.cp.movable.velocity.scale(Math.min(speed, maxSpeed) / speed);
    }
  }

  static changeEntityPosition(
    entity: RequireComponent<"position" | "movable">,
    dPos: Vec2,
    dAngle: number
  ) {
    entity.cp.position.coord.add(dPos);
    entity.cp.position.angle =
      (entity.cp.position.angle + dAngle) % (2 * Math.PI);

    if (entity.hasComponents(["children"])) {
      applyPositionToChildren(entity);
    }
    applyToDocked(entity);
  }
}

export const movingSystem = new MovingSystem();
