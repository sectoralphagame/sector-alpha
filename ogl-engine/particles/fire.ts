import type { Engine } from "@ogl-engine/engine/engine";
import { ParticleGenerator } from "@ogl-engine/ParticleGenerator";
import { Vec3, Vec4 } from "ogl";
import { random } from "mathjs";
import { easeInOutSine, loopToZero } from "@ogl-engine/easing";
import { OrbMaterial } from "@ogl-engine/materials/orb/orb";
import Color from "color";

const particleSize = 0.1;
const particleLife = 1.5;

export class FireParticleGenerator extends ParticleGenerator {
  constructor(engine: Engine) {
    super(engine, (particle) => {
      const material =
        particle.mesh?.material instanceof OrbMaterial
          ? particle.mesh.material
          : new OrbMaterial(
              engine,
              new Vec4(...Color("#ff250b").alpha(0.3).array()),
              new Vec4(...Color("#fffd8c").alpha(1).array())
            );
      material.uniforms.fEmissive.value = 1;
      particle.mesh.applyMaterial(material);
      particle.acceleration = new Vec3(
        random(-5, 5),
        random(80, 100),
        random(-5, 5)
      ).divide(1000);
      particle.velocity = new Vec3(
        random(-1, 1),
        random(2, 3),
        random(-1, 1)
      ).divide(10);
      particle.life = particleLife;
    });

    this.spawnRate = 15;
    this.max = 1000;
    this.onParticleUpdate = (particle) => {
      const size = loopToZero(particle.life / particleLife) * particleSize;
      particle.mesh.scale.set(size, size * 30, size).divide(10);
      const material: OrbMaterial = particle.mesh.material;

      material.uniforms.uT.value = easeInOutSine(particle.life / particleLife);
    };
  }
}
