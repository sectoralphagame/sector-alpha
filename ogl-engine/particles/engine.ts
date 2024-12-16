import type { Engine } from "@ogl-engine/engine/engine";
import { ParticleGenerator } from "@ogl-engine/ParticleGenerator";
import { Vec3, Vec4 } from "ogl";
import { random } from "mathjs";
import { loopToZero } from "@ogl-engine/easing";
import { OrbMaterial } from "@ogl-engine/materials/orb/orb";
import Color from "color";

const particleLife = 0.15;
const baseSpawn = 600;

export class EngineParticleGenerator extends ParticleGenerator {
  particleSize = 0.08;

  constructor(engine: Engine) {
    super(
      engine,
      (particle) => {
        particle.position = new Vec3(
          random(-1, 1),
          random(-0.4, 0.4),
          random(-1, 1)
        ).divide(90);
        particle.acceleration = new Vec3(0, random(30, 60), 0).divide(100);
        particle.velocity = new Vec3(0, random(1, 2.5), 0).divide(10);
        particle.life = particleLife;
        particle.scale.set(1);
      },
      100
    );

    this.spawnRate = baseSpawn;
    this.setIntensity(1);

    this.onParticleUpdate = (particle) => {
      particle.t = particle.life / particleLife;
      const size =
        (loopToZero(particle.life / particleLife) * this.particleSize) / 2;
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

  setIntensity(intensity: number) {
    const i = intensity === 0 ? 0 : Math.min(Math.max(intensity, 0.3), 1.2);
    this.spawnRate = baseSpawn * i;
    this.particleSize = 0.08 * i;
  }
}
