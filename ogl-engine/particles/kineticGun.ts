import { OneShotParticleGenerator } from "@ogl-engine/ParticleGenerator";
import { random } from "mathjs";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { KineticGunMaterial } from "@ogl-engine/materials/kineticGun/kineticGun";
import { Vec3 } from "ogl";
import { RosetteGeometry } from "./rosette";

const spread = 0.25;
const tempTranslation = new Vec3();
const tempMin = new Vec3();
const tempMax = new Vec3();

export class KineticGunParticleGenerator extends OneShotParticleGenerator {
  scaleForces = false;
  speed = 3;
  size = 0.3;
  life = 2;
  targetId: number | null = null;
  cached = 0;

  constructor(engine: Engine3D, color: string) {
    super(
      engine,
      (particle) => {
        particle.acceleration.set(0, 0, -0.1);
        particle.velocity.set(
          random(-spread, spread),
          random(-spread, spread),
          random(this.speed, this.speed * 1.2)
        );
        particle.life = this.life;
        this.worldMatrix.getRotation(particle.rotation);
        particle.rotation.rotateX(Math.PI / 2);
      },
      (e) => new RosetteGeometry(e.gl),
      9
    );

    this.spawnRate = 12;

    this.onParticleUpdate = (particle) => {
      particle.t = particle.life / this.life;
      particle.scale.set(this.size, this.size * 9, this.size);

      if (this.targetId) {
        const target = engine.getByEntityId(this.targetId);
        if (target) {
          // Check if particle.position is in target.geometry.bounds
          if (target.geometry?.bounds) {
            const min = tempMin;
            const max = tempMax;

            if (this.cached !== this.engine.uniforms.uTime.value) {
              this.cached = this.engine.uniforms.uTime.value;
              target.worldMatrix.getTranslation(tempTranslation);
              min.copy(target.geometry.bounds.min).add(tempTranslation);
              max.copy(target.geometry.bounds.max).add(tempTranslation);
            }

            if (
              particle.position.x >= min.x &&
              particle.position.x <= max.x &&
              particle.position.y >= min.y &&
              particle.position.y <= max.y &&
              particle.position.z >= min.z &&
              particle.position.z <= max.z
            ) {
              particle.life = 0;
            }
          }
        }
      }
    };

    const material = new KineticGunMaterial(engine, {
      color,
    });
    this.mesh.applyMaterial(material);
  }
}
