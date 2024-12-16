import type { Engine } from "@ogl-engine/engine/engine";
import { ParticleGenerator } from "@ogl-engine/ParticleGenerator";
import { Vec3, Vec4 } from "ogl";
import { random } from "mathjs";
import { loopToZero } from "@ogl-engine/easing";
import { OrbMaterial } from "@ogl-engine/materials/orb/orb";
import Color from "color";

const particleSize = 0.2;
const particleLife = 0.8;

export class EngineParticleGenerator extends ParticleGenerator {
  constructor(engine: Engine) {
    super(
      engine,
      (particle) => {
        particle.position = new Vec3(random(-1, 1), 0, random(-1, 1)).divide(
          90
        );
        particle.acceleration = new Vec3(0, random(60, 100), 0).divide(100);
        particle.velocity = new Vec3(0, random(3, 5), 0).divide(10);
        particle.life = particleLife;
        particle.scale.set(1);
      },
      100
    );

    this.spawnRate = 100;

    this.onParticleUpdate = (particle) => {
      particle.t = particle.life / particleLife;
      const size =
        (loopToZero(particle.life / particleLife) * particleSize) / 2;
      particle.scale.set(size, size, size);
    };

    const material = new OrbMaterial(
      engine,
      new Vec4(...Color("#1ff4ff").alpha(0.3).array()),
      new Vec4(...Color("#ffffff").alpha(1).array())
    );
    material.uniforms.fEmissive.value = 1;
    this.mesh.applyMaterial(material);
  }
}
