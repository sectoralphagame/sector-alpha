import { ParticleGenerator } from "@ogl-engine/ParticleGenerator";
import { Vec4 } from "ogl";
import { random } from "mathjs";
import { easeInOutSine } from "@ogl-engine/easing";
import { OrbMaterial } from "@ogl-engine/materials/orb/orb";
import Color from "color";
import type { Engine3D } from "@ogl-engine/engine/engine3d";

const particleSize = 0.2;
const particleLife = 1.5;

export class SmokeParticleGenerator extends ParticleGenerator {
  constructor(engine: Engine3D) {
    super(
      engine,
      (particle) => {
        particle.acceleration
          .set(random(-8, 8), random(-150, -80), random(-8, 8))
          .divide(1000);
        particle.velocity
          .set(random(-0.8, 0.8), random(2, 3), random(-0.8, 0.8))
          .divide(10);
        particle.life = particleLife;
        particle.scale.set(1);
      },
      undefined,
      300
    );

    this.spawnRate = 15;

    this.onParticleUpdate = (particle) => {
      particle.t = particle.life / particleLife;
      const size =
        easeInOutSine(1 - particle.life / particleLife) * particleSize;
      particle.scale.set(size, size, size);
    };

    const material = new OrbMaterial(
      engine,
      new Vec4(...Color("#1f1f1f").array(), 255),
      new Vec4(...Color("#a4a4a4").array(), 0)
    );

    material.uniforms.fEmissive.value = 1;
    this.mesh.applyMaterial(material);
  }
}
