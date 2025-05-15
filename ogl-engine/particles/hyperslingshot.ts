import { ParticleGenerator } from "@ogl-engine/ParticleGenerator";
import { Vec4 } from "ogl";
import { random } from "mathjs";
import { OrbMaterial } from "@ogl-engine/materials/orb/orb";
import Color from "color";
import { loopToZero } from "@ogl-engine/easing";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import clamp from "lodash/clamp";
import { RosetteGeometry } from "./rosette";

const particleSize = 0.4;
const particleLife = 1.5;
const maxRadius = 0.8;
const spawnRate = 800;

export class HyperSlingshotParticleGenerator extends ParticleGenerator {
  constructor(engine: Engine3D) {
    super(
      engine,
      (particle) => {
        const angle = random(0, Math.PI * 2);
        const radius = random(0, maxRadius);
        particle.position.set(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
        this.worldMatrix.getRotation(particle.rotation);
        particle.acceleration.set(0, random(0.5, 0.8), 0);
        particle.velocity.set(0, random(0.3, 0.5), 0);
        particle.life = clamp(
          (particleLife *
            random(0.8, 1) *
            Math.max(
              0.5,
              Math.cos(((maxRadius - radius) / maxRadius) * 2 * Math.PI)
            ) *
            (maxRadius - radius)) /
            maxRadius,
          0,
          1
        );
      },
      (e) => new RosetteGeometry(e.gl),
      spawnRate * particleLife
    );

    this.spawnRate = spawnRate;

    this.onParticleUpdate = (particle) => {
      particle.t = particle.life / particleLife;
      const size = loopToZero(1 - particle.life / particleLife) * particleSize;
      particle.scale.set(size / 20, size, size / 20);
    };

    const material = new OrbMaterial(
      engine,
      new Vec4(...Color("#ff1f7c").alpha(0.3).array()),
      new Vec4(...Color("#ffa71d").alpha(1).array())
    );
    material.setEmissive(1);
    this.mesh.applyMaterial(material);
  }
}
