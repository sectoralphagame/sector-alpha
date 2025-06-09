import type { Vec2 } from "ogl";
import { Euler, Geometry, Mat3, Mat4, Quat, Transform, Vec3 } from "ogl";
import type { ModelName } from "@ogl-engine/AssetLoader";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { entityScale } from "@ui/components/TacticalMap/EntityMesh";
import { random } from "mathjs";
import type { OnBeforeRenderTask } from "@ogl-engine/engine/task";
import { AsteroidNewMaterial } from "@ogl-engine/materials/AsteroidNew/AsteroidNew";
import { lerp } from "@core/utils/misc";
import { pickRandom } from "@core/utils/generators";
import { fieldColors } from "@core/archetypes/asteroidField";
import type { MineableCommodity } from "@core/economy/commodity";
import { map, pipe, sum } from "@fxts/core";
import { AsteroidRockMaterial } from "@ogl-engine/materials/AsteroidRock/AsteroidRock";
import type { Engine3D } from "../engine/engine3d";
import { BaseMesh } from "../engine/BaseMesh";

const axis = new Vec3();
const tempMat4 = new Mat4();
const tempMat3 = new Mat3();
const tempTrs = new Mat4();
const tempQuat = new Quat();
const tempEuler = new Euler();
const tempTranslate = new Vec3();

export class Asteroids extends Transform {
  name = "Asteroids";
  size: number;
  density: number;
  engine: Engine3D;
  tasks: OnBeforeRenderTask[] = [];
  resources: MineableCommodity[];

  constructor(
    engine: Engine3D,
    size: number,
    density: number,
    fPoints: [Vec2, number][],
    resources: MineableCommodity[]
  ) {
    super();

    this.engine = engine;
    this.size = size;
    this.density = density;
    this.resources = resources;

    this.visible = false;

    this.createAsteroids(fPoints);
    this.createDebris(fPoints);
  }

  static getScale() {
    const t = Math.random();

    if (t < 0.8) return random(15, 23);
    if (t < 0.99) return random(45, 90);

    return random(100, 200);
  }

  private async createDebris(fPoints: [Vec2, number][]) {
    await assetLoader.load(this.engine.gl);

    const debrisModels: ModelName[] = [
      "world/asteroidSmall1",
      "world/asteroidSmall2",
      "world/asteroidSmall3",
      "world/asteroidSmall4",
    ];

    const getDebrisNumber = (radius: number) =>
      Math.ceil(radius ** 2 * this.density);

    const numObjects =
      pipe(
        fPoints,
        map(([, radius]) => getDebrisNumber(radius)),
        sum
      ) * debrisModels.length;

    for (const model of debrisModels) {
      const gltf = assetLoader.model(model);
      const material = new AsteroidRockMaterial(this.engine, {
        instanced: true,
      });

      const asteroid = new BaseMesh(this.engine, {
        geometry: new Geometry(this.engine.gl, { ...gltf.geometry.attributes }),
        material,
        frustumCulled: false,
      });

      const instanceMatrix = new Float32Array(numObjects * 16);
      const instanceNormalMatrix = new Float32Array(numObjects * 9);

      let i = 0;
      for (const [offset, radius] of fPoints) {
        for (let j = 0; j < getDebrisNumber(radius); j++) {
          let x = 0;
          let y = 0;
          do {
            x = random(-radius, radius);
            y = random(-radius, radius);
          } while (x ** 2 + y ** 2 > (radius * 1.4) ** 2);

          const trs = tempTrs.identity();
          const translate = tempTranslate.set(
            x + offset.x,
            random(-1, 1),
            y + offset.y
          );
          trs.translate(translate);

          const rot = tempMat4.fromQuaternion(
            tempQuat.fromEuler(
              tempEuler.set(
                random(0, Math.PI * 2),
                random(0, Math.PI * 2),
                random(0, Math.PI * 2)
              )
            )
          );
          trs.multiply(rot);
          trs.scale(entityScale * random(1.5, 3.5));
          trs.toArray(instanceMatrix, i * 16);

          const normalMatrix = new Mat3().getNormalMatrix(trs);
          instanceNormalMatrix.set(normalMatrix, i * 9);

          i++;
        }

        asteroid.geometry.addAttribute("instanceMatrix", {
          instanced: true,
          size: 16,
          data: instanceMatrix,
          needsUpdate: true,
        });
        asteroid.geometry.addAttribute("instanceNormalMatrix", {
          instanced: true,
          size: 9,
          data: instanceNormalMatrix,
          needsUpdate: true,
        });
      }

      asteroid.setParent(this);
    }
  }

  private async createAsteroids(fPoints: [Vec2, number][]) {
    await assetLoader.load(this.engine.gl);

    const asteroidModels: ModelName[] = [
      "world/asteroid1",
      "world/asteroid2",
      "world/asteroid3",
      "world/asteroid4",
      "world/asteroid5",
      "world/asteroid6",
    ];

    const getAsteroidsNumber = (radius: number) =>
      Math.ceil((radius ** 2 * this.density) / 20);

    const numObjects =
      pipe(
        fPoints,
        map(([, radius]) => getAsteroidsNumber(radius)),
        sum
      ) * asteroidModels.length;

    for (const model of asteroidModels) {
      const gltf = assetLoader.model(model);

      const material = new AsteroidNewMaterial(this.engine, {
        color: fieldColors[pickRandom(this.resources)],
        instanced: true,
      });
      material.uniforms.uMask.value = lerp(
        0.0,
        0.11,
        lerp(0.5, 2, this.density)
      );
      const asteroid = new BaseMesh(this.engine, {
        geometry: new Geometry(this.engine.gl, { ...gltf.geometry.attributes }),
        material,
        frustumCulled: false,
      });

      const instanceMatrix = new Float32Array(numObjects * 16);
      const instanceNormalMatrix = new Float32Array(numObjects * 9);

      let counter = 0;
      for (const [offset, radius] of fPoints) {
        for (let j = 0; j < getAsteroidsNumber(radius); j++) {
          let x = 0;
          let y = 0;
          do {
            x = random(-radius, radius);
            y = random(-radius, radius);
          } while (x ** 2 + y ** 2 > radius ** 2);

          const trs = tempTrs.identity();
          const translate = tempTranslate.set(
            x + offset.x,
            random(-radius / 10, radius / 10),
            y + offset.y
          );
          trs.translate(translate);

          const rot = tempMat4.fromQuaternion(
            tempQuat.fromEuler(
              tempEuler.set(
                random(0, Math.PI * 2),
                random(0, Math.PI * 2),
                random(0, Math.PI * 2)
              )
            )
          );
          trs.multiply(rot);
          trs.scale(entityScale * Asteroids.getScale());
          trs.toArray(instanceMatrix, counter * 16);

          const normalMatrix = new Mat3().getNormalMatrix(trs);
          instanceNormalMatrix.set(normalMatrix, counter * 9);

          counter++;
        }
      }

      this.tasks.push(
        this.engine.addOnBeforeRenderTask(() => {
          for (let i = 0; i < numObjects; i++) {
            const trs = tempMat4.fromArray(
              asteroid.geometry.attributes.instanceMatrix.data!.slice(
                16 * i,
                16 * i + 16
              )
            );
            axis.set(Math.sin(i), Math.cos(i), Math.sin(-i)).normalize();
            trs.rotate(this.engine.delta * 0.02 * ((i % 15) + 1), axis);
            trs.toArray(
              asteroid.geometry.attributes.instanceMatrix.data,
              i * 16
            );

            const normalMatrix = tempMat3.getNormalMatrix(trs);
            instanceNormalMatrix.set(normalMatrix, i * 9);
          }

          asteroid.geometry.attributes.instanceMatrix.needsUpdate = true;
          asteroid.geometry.attributes.instanceNormalMatrix.needsUpdate = true;
        })
      );

      asteroid.geometry.addAttribute("instanceMatrix", {
        instanced: true,
        size: 16,
        data: instanceMatrix,
        usage: this.engine.gl.DYNAMIC_DRAW,
        needsUpdate: true,
      });
      asteroid.geometry.addAttribute("instanceNormalMatrix", {
        instanced: true,
        size: 9,
        data: instanceNormalMatrix,
        usage: this.engine.gl.DYNAMIC_DRAW,
        needsUpdate: true,
      });

      asteroid.setParent(this);
    }

    this.visible = true;
  }

  destroy() {
    this.tasks.forEach((task) => task.cancel());
  }
}
