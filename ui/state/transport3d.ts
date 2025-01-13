import type { RequirePureComponent } from "@core/tsHelpers";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { ExplosionParticleGenerator } from "@ogl-engine/particles/explosion";
import { KineticGunParticleGenerator } from "@ogl-engine/particles/kineticGun";
import { entityScale } from "@ui/components/TacticalMap/EntityMesh";

class Transport3D {
  engine?: Engine3D;

  assign(engine: Engine3D) {
    this.engine = engine;
  }

  unassign() {
    this.engine = undefined;
  }

  shoot(entity: RequirePureComponent<"position" | "damage">) {
    if (!this.engine) return;

    const shooter = this.engine!.getByEntityId(entity.id);

    if (shooter) {
      const generator = new KineticGunParticleGenerator(this.engine);
      generator.mesh.onBeforeRender(() => {
        const target = this.engine!.getByEntityId(entity.cp.damage.targetId!);

        if (!target) {
          return;
        }

        generator.lookAt(target.position);
        generator.rotation.x -= shooter.rotation.x;
        generator.rotation.y -= shooter.rotation.y;
        generator.rotation.z -= shooter.rotation.z;
        generator.updateMatrix();
      });
      generator.setParent(shooter);
    }
  }

  explode(entity: RequirePureComponent<"position">) {
    if (!this.engine) return;

    const mesh = this.engine.getByEntityId(entity.id);
    if (mesh) {
      const explosion = new ExplosionParticleGenerator(this.engine!);
      explosion.scale.set(
        mesh.geometry.bounds.max.sub(mesh.geometry.bounds.min).len() *
          entityScale *
          1.5
      );
      explosion.setParent(this.engine.scene);
      explosion.position.copy(mesh.position);
    }
  }
}

export const transport3D = new Transport3D();
