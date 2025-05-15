import type { Sim } from "@core/sim";
import type { RequirePureComponent } from "@core/tsHelpers";
import type { ObserverFn } from "@core/utils/observer";
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

    const generator = new KineticGunParticleGenerator(engine);
    generator.setParent(shooter);
    generator.rotation.y = Math.PI / 2;

    const task = engine.addOnBeforeRenderTask(() => {
      if (!entity || entity.cp.hitpoints!.hp.value <= 0) {
        task.cancel();
      }
    }, taskPriority.low);
  };
}
