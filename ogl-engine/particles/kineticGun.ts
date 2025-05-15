import { OneShotParticleGenerator } from "@ogl-engine/ParticleGenerator";
import { random } from "mathjs";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { KineticGunMaterial } from "@ogl-engine/materials/kineticGun/kineticGun";
import { RosetteGeometry } from "./rosette";

const particleSize = 1.4;
const particleLife = 6;
const spread = 0.025;

export class KineticGunParticleGenerator extends OneShotParticleGenerator {
  scaleForces = false;

  constructor(engine: Engine3D) {
    super(
      engine,
      (particle) => {
        particle.acceleration.set(0, 0, -0.1);
        particle.velocity.set(
          random(-spread, spread),
          random(-spread, spread),
          random(2.5, 2.9)
        );
        particle.life = particleLife;
        this.worldMatrix.getRotation(particle.rotation);
        particle.rotation.rotateX(Math.PI / 2);
      },
      (e) => new RosetteGeometry(e.gl),
      9
    );

    this.spawnRate = 8;

    this.onParticleUpdate = (particle) => {
      particle.t = particle.life / particleLife;
      particle.scale.set(particleSize, particleSize * 9, particleSize);
    };

    const material = new KineticGunMaterial(engine, {
      color: "rgb(255, 57, 57)",
    });
    this.mesh.applyMaterial(material);
  }
}
