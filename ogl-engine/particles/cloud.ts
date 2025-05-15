import { ParticleGenerator } from "@ogl-engine/ParticleGenerator";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { random } from "mathjs";
import { ParticleCloudMaterial } from "@ogl-engine/materials/particleCloud/particleCloud";

const particleLife = 10;

export class CloudParticleGenerator extends ParticleGenerator {
  constructor(engine: Engine3D) {
    super(
      engine,
      (particle) => {
        particle.position
          .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
          .multiply(0.2);
        particle.acceleration.set(0);
        particle.velocity
          .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
          .divide(100);
        particle.life = particleLife;
        particle.scale.set(random(0.5, 5));
      },
      undefined,
      100
    );

    this.spawnRate = 10;

    this.onParticleUpdate = (particle) => {
      particle.t = 1 - particle.life / particleLife;
    };

    const material = new ParticleCloudMaterial(engine, "prop/smoke", {
      color: "#ffffff",
      alpha: 0.1,
      emissive: 0,
    });

    this.mesh.applyMaterial(material);
  }
}
