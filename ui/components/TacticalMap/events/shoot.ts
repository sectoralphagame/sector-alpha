import type { Sim } from "@core/sim";
import type { RequirePureComponent } from "@core/tsHelpers";
import type { ObserverFn } from "@core/utils/observer";
import { LaserWeaponEffect } from "@ogl-engine/builders/LaserWeapon";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { taskPriority } from "@ogl-engine/engine/task";
import { KineticGunParticleGenerator } from "@ogl-engine/particles/kineticGun";

export function createShootHandler(
  engine: Engine3D,
  sim: Sim
): ObserverFn<RequirePureComponent<"position" | "damage">> {
  return (entity) => {
    const shooter = engine.getByEntityId(entity.id);
    const target = engine.getByEntityId(entity.cp.damage.targetId!);
    const targetEntity = sim.get(entity.cp.damage.targetId!);

    if (!(shooter && target && targetEntity)) return;

    if (entity.cp.dockable?.size === "small") {
      const generator = new KineticGunParticleGenerator(engine);
      generator.setParent(shooter);
      generator.lookAt(target.position);
      generator.speed = 200;

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
        (c) => c instanceof LaserWeaponEffect
      ) as LaserWeaponEffect | undefined;
      if (weapon) {
        weapon.setTarget(target.position);
        weapon.fire();
      }
    }
  };
}
