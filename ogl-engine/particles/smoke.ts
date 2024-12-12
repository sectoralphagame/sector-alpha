import type { Engine } from "@ogl-engine/engine/engine";
import { SpritesheetMaterial } from "@ogl-engine/materials/spritesheet/spritesheet";
import { ParticleGenerator } from "@ogl-engine/ParticleGenerator";
import type { Billboard } from "@ogl-engine/utils/billboard";
import { Texture, Vec3 } from "ogl";
import { random } from "mathjs";
import { easeInOutSine } from "@ogl-engine/easing";
import { assetLoader } from "@ogl-engine/AssetLoader";

const particleSize = 0.4;
const particleLife = 2;

export class SmokeParticleGenerator extends ParticleGenerator {
  constructor(engine: Engine) {
    super(engine, (particle) => {
      particle.mesh.applyMaterial(
        new SpritesheetMaterial(
          engine,
          new Texture(engine.gl, {
            image: assetLoader.textures["particle/smoke"],
          }),
          4,
          Math.floor(Math.random() * 16)
        )
      );

      particle.acceleration = new Vec3(
        random(-0.01, 0.01),
        random(0.09, 0.1),
        random(-0.01, 0.01)
      );
      particle.velocity = new Vec3(
        random(-0.03, 0.03),
        random(0.2, 0.3),
        random(-0.03, 0.03)
      );
      particle.angularVelocity = random(-9, 9);
      particle.life = particleLife;
    });

    this.spawnRate = 15;
    this.max = 1000;
    this.onParticleUpdate = (particle) => {
      particle.mesh.scale.set(
        easeInOutSine(1 - particle.life / particleLife) * particleSize
      );
      (
        particle.mesh as Billboard<SpritesheetMaterial>
      ).material.uniforms.fAlpha.value = easeInOutSine(
        particle.life / particleLife
      );
    };
  }
}
