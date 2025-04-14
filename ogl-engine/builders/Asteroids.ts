import type { Vec2 } from "ogl";
import { Euler, Geometry, Mat3, Mat4, Quat, Transform, Vec3 } from "ogl";
import type { ModelName } from "@ogl-engine/AssetLoader";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { entityScale } from "@ui/components/TacticalMap/EntityMesh";
import { random } from "mathjs";
import { InstancedPbrMaterial } from "@ogl-engine/materials/instancedPbr/instancedPbr";
import { BaseMesh } from "../engine/BaseMesh";
import type { Engine3D } from "../engine/engine3d";

const axis = new Vec3();
const tempMat4 = new Mat4();
const tempMat3 = new Mat3();
const tempTrs = new Mat4();
const tempQuat = new Quat();
const tempEuler = new Euler();

export class Asteroids extends Transform {
  name = "Asteroids";
  size: number;
  density: number;
  engine: Engine3D;

  constructor(
    engine: Engine3D,
    size: number,
    density: number,
    fPoints: [Vec2, number][]
  ) {
    super();

    this.engine = engine;
    this.size = size;
    this.density = density;

    this.visible = false;
    for (const [offset, radius] of fPoints) {
      this.createAsteroids(offset, radius);
    }
  }

  static getScale() {
    const t = Math.random();

    if (t < 0.8) return random(9, 15);
    if (t < 0.99) return random(20, 50);

    return random(50, 100);
  }

  private async createAsteroids(offset: Vec2, radius: number) {
    const numAsteroids = Math.ceil((radius ** 2 * this.density) / 10);

    await assetLoader.load(this.engine.gl);
    const asteroidModels: ModelName[] = [
      "world/asteroid1",
      "world/asteroid2",
      "world/asteroid3",
      "world/asteroid4",
    ];

    for (const model of asteroidModels) {
      const gltf = assetLoader.model(model);

      const asteroid = new BaseMesh(this.engine, {
        geometry: new Geometry(this.engine.gl, { ...gltf.geometry.attributes }),
      });
      asteroid.applyMaterial(
        new InstancedPbrMaterial(this.engine, gltf.material)
      );
      asteroid.position.set(offset.x, 0, offset.y);

      const instanceMatrix = new Float32Array(numAsteroids * 16);
      const instanceNormalMatrix = new Float32Array(numAsteroids * 9);

      for (let i = 0; i < numAsteroids; i++) {
        let x = 0;
        let y = 0;
        do {
          x = random(-radius, radius);
          y = random(-radius, radius);
        } while (x ** 2 + y ** 2 > radius ** 2);

        const trs = tempTrs.identity();
        trs[12] = x;
        trs[13] = random(-radius / 10, radius / 10);
        trs[14] = y;

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

        const s = tempMat4
          .identity()
          .multiply(entityScale * Asteroids.getScale());
        s[15] = 1;
        trs.multiply(s);

        trs.toArray(instanceMatrix, i * 16);

        const normalMatrix = new Mat3().getNormalMatrix(trs);
        instanceNormalMatrix.set(normalMatrix, i * 9);
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

      asteroid.frustumCulled = false;
      asteroid.setParent(this);

      asteroid.onBeforeRender(() => {
        for (let i = 0; i < numAsteroids; i++) {
          const trs = tempMat4.fromArray(
            asteroid.geometry.attributes.instanceMatrix.data!.slice(
              16 * i,
              16 * i + 16
            )
          );
          axis.set(Math.sin(i), Math.cos(i), Math.sin(-i)).normalize();
          trs.rotate(this.engine.delta * 0.02 * ((i % 15) + 1), axis);
          trs.toArray(asteroid.geometry.attributes.instanceMatrix.data, i * 16);

          const normalMatrix = tempMat3.getNormalMatrix(trs);
          instanceNormalMatrix.set(normalMatrix, i * 9);
        }

        asteroid.geometry.attributes.instanceMatrix.needsUpdate = true;
        asteroid.geometry.attributes.instanceNormalMatrix.needsUpdate = true;
      });
    }

    this.visible = true;
  }
}
