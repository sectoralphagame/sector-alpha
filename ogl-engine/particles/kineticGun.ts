import { OneShotParticleGenerator } from "@ogl-engine/ParticleGenerator";
import { random } from "mathjs";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { KineticGunMaterial } from "@ogl-engine/materials/kineticGun/kineticGun";
import { RosetteGeometry } from "./rosette";

const spread = 0.025;

export class KineticGunParticleGenerator extends OneShotParticleGenerator {
  scaleForces = false;
  speed = 25;
  size = 0.14;
  life = 6;

  constructor(engine: Engine3D) {
    super(
      engine,
      (particle) => {
        particle.acceleration.set(0, 0, -0.1);
        particle.velocity.set(
          random(-spread, spread),
          random(-spread, spread),
          random(this.speed, this.speed * 1.1)
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
    };

    const material = new KineticGunMaterial(engine, {
      color: "rgb(255, 57, 57)",
    });
    this.mesh.applyMaterial(material);
  }
}
