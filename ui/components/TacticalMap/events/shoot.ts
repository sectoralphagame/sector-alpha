import type { Sim } from "@core/sim";
import type { ShootEvent } from "@core/systems/transport3d";
import type { EventHandler } from "@core/utils/pubsub";
import { LaserWeaponEffect } from "@ogl-engine/builders/LaserWeapon";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { taskPriority } from "@ogl-engine/engine/task";
import { KineticGunParticleGenerator } from "@ogl-engine/particles/kineticGun";
import { Vec3 } from "ogl";
import { findInAncestors } from "@core/utils/findInAncestors";
import { distanceScale } from "../EntityMesh";

const tempVec3 = new Vec3();

export function createShootHandler(
  engine: Engine3D,
  sim: Sim
): EventHandler<ShootEvent> {
  return ({ entity: turret }) => {
    const entity = findInAncestors(turret, "position");
    const shooter = engine.getByEntityId(entity.id);
    const target = engine.getByEntityId(turret.cp.damage.targetId!);
    const targetEntity = sim.get(turret.cp.damage.targetId!);

    if (!(shooter && target && targetEntity)) return;

    if (turret.cp.damage.type === "kinetic") {
      const generator = new KineticGunParticleGenerator(engine);
      generator.setColor(turret.cp.color?.value ?? "#ffffff");
      generator.targetId = turret.cp.damage.targetId;
      generator.setParent(shooter);
      generator.position.set(
        turret.cp.transform.coord.x * distanceScale,
        0,
        turret.cp.transform.coord.y * distanceScale
      );

      tempVec3.copy(target.position);
      tempVec3.x += targetEntity.cp.movable?.velocity.x || 0;
      tempVec3.z += targetEntity.cp.movable?.velocity.y || 0;
      generator.lookAt(tempVec3.scale(distanceScale));

      generator.speed = distanceScale * 0.95;

      const task = engine.addOnBeforeRenderTask(() => {
        if (
          !entity ||
          entity.cp.hitpoints!.hp.value <= 0 ||
          !target ||
          !target.isMounted()
        ) {
          task.cancel();
          return;
        }

        generator.lookAt(target.position);
      }, taskPriority.low);
    } else {
      const weapon = shooter.children.find(
        (c) => c instanceof LaserWeaponEffect && c.id === turret.id
      ) as LaserWeaponEffect | undefined;
      if (weapon) {
        weapon.setTarget(target.position);
        weapon.fire();
      }
    }
  };
}
