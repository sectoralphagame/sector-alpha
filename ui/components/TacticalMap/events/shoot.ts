import type { RequirePureComponent } from "@core/tsHelpers";
import type { ObserverFn } from "@core/utils/observer";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { KineticGunParticleGenerator } from "@ogl-engine/particles/kineticGun";

export function createShootHandler(
  engine: Engine3D
): ObserverFn<RequirePureComponent<"position" | "damage">> {
  return (entity) => {
    const shooter = engine!.getByEntityId(entity.id);

    if (shooter) {
      const generator = new KineticGunParticleGenerator(engine);
      generator.setParent(shooter);
    }
  };
}
