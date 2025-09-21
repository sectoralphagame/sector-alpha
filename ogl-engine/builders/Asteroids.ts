import type { Vec2 } from "ogl";
import { Euler, Geometry, Mat4, Plane, Quat, Transform, Vec3 } from "ogl";
import type { ModelName } from "@ogl-engine/AssetLoader";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { random } from "mathjs";
import type { OnBeforeRenderTask } from "@ogl-engine/engine/task";
import { AsteroidNewMaterial } from "@ogl-engine/materials/AsteroidNew/AsteroidNew";
import { lerp } from "@core/utils/misc";
import { pickRandom } from "@core/utils/generators";
import { fieldColors } from "@core/archetypes/asteroidField";
import type { MineableCommodity } from "@core/economy/commodity";
import { map, pipe, range, sum } from "@fxts/core";
import { AsteroidRockMaterial } from "@ogl-engine/materials/AsteroidRock/AsteroidRock";
import { AsteroidDustMaterial } from "@ogl-engine/materials/asteroidDust/asteroidDust";
import { BaseInstancedMesh } from "@ogl-engine/engine/BaseInstancedMesh";
import { Probability2D } from "@core/utils/rng";
import { createNoise2D } from "simplex-noise";
import Alea from "alea";
import { toArray } from "lodash";
import { distanceScale } from "@ui/components/TacticalMap/EntityMesh";
import type { Engine3D } from "../engine/engine3d";

const axis = new Vec3();
const tempMat4 = new Mat4();
const tempTrs = new Mat4();
const tempQuat = new Quat();
const tempEuler = new Euler();
const tempTranslate = new Vec3();
const emptyQuat = new Quat();

const noiseRes = 1;
const noiseScale = 10;
const noiseThreshold = 0.55;

export class Asteroids extends Transform {
  name = "Asteroids";
  size: number;
  density: number;
  engine: Engine3D;
  tasks: OnBeforeRenderTask[] = [];
  resources: MineableCommodity[];
  prng: Probability2D;
  noiseRng: (_x: number, _y: number) => number;

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

    const noise = createNoise2D(
      Alea(
        fPoints
          .map(([v, r]) => [v.x.toFixed(0), v.y.toFixed(0), r].join(","))
          .join(":")
      )
    );
    this.noiseRng = (x, y) => noise(x / noiseScale, y / noiseScale) * 0.5 + 0.5;
    const startX = Math.min(...fPoints.map(([v, r]) => v.x - r));
    const endX = Math.max(...fPoints.map(([v, r]) => v.x + r));
    const startY = Math.min(...fPoints.map(([v, r]) => v.y - r));
    const endY = Math.max(...fPoints.map(([v, r]) => v.y + r));
    this.prng = new Probability2D(
      pipe(
        range(startY, endY, noiseRes),
        map((y) =>
          pipe(
            range(startX, endX, noiseRes),
            map((x) => {
              const v = this.noiseRng(x, y);
              const inFPoint = fPoints.some(
                ([offset, r]) =>
                  (x - offset.x) ** 2 + (y - offset.y) ** 2 <= r ** 2
              )
                ? 1
                : 0;

              return v * inFPoint < noiseThreshold ? 0 : v;
            }),
            toArray
          )
        ),
        toArray
      ),
      [startX, startY]
    );

    this.createAsteroids(fPoints);
    this.createDebris(fPoints);
    this.createDust(fPoints);
  }

  static getScale() {
    const t = Math.random();

    if (t < 0.8) return random(15, 23);
    if (t < 0.99) return random(45, 90);

    return random(100, 200);
  }

  private async createDust(fPoints: [Vec2, number][]) {
    await assetLoader.load(this.engine.gl);

    const getDustNumber = (radius: number) =>
      Math.ceil(radius ** 2 * this.density * 5);

    const numObjects = pipe(
      fPoints,
      map(([, radius]) => getDustNumber(radius)),
      sum
    );

    const material = new AsteroidDustMaterial(this.engine, "prop/smoke", {
      alpha: 0.14,
      color: "#ffffff",
      emissive: 0.0,
    });

    const dust = new BaseInstancedMesh(this.engine, {
      geometry: new Plane(this.engine.gl),
      material,
      frustumCulled: false,
      instances: numObjects,
    });

    const pos = new Vec3();
    const scale = new Vec3();

    for (let i = 0; i < numObjects; i++) {
      const [x, z] = this.prng.sample();
      pos.set(
        x + random(-noiseRes / 2, noiseRes / 2),
        random(-1, 1),
        z + random(-noiseRes / 2, noiseRes / 2)
      );
      pos.scale(noiseRes).scale(distanceScale);

      const factor = Math.random() > 0.7 ? 1.7 : 0.5;
      scale
        .set(
          (Math.random() * 0.5 + 0.5) * factor * (Math.random() > 0.5 ? 1 : -1),
          (Math.random() * 0.5 + 0.5) * factor * (Math.random() > 0.5 ? 1 : -1),
          (Math.random() * 0.5 + 0.5) * factor * (Math.random() > 0.5 ? 1 : -1)
        )
        .scale(distanceScale);

      const trs = tempTrs.compose(emptyQuat, pos, scale);
      dust.updateInstanceTrs(trs, i);
    }

    dust.setParent(this);
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
      Math.ceil(radius ** 2 * this.density * 2);

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

      const asteroid = new BaseInstancedMesh(this.engine, {
        geometry: new Geometry(this.engine.gl, { ...gltf.geometry.attributes }),
        material,
        frustumCulled: false,
        instances: numObjects,
        normalMatrix: true,
      });

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
          const translate = tempTranslate
            .set(x + offset.x, random(-1, 1), y + offset.y)
            .scale(distanceScale);
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
          trs.scale(random(1.5, 3.5));
          asteroid.updateInstanceTrs(trs, i);

          i++;
        }
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
      Math.ceil((radius ** 2 * this.density) / 100);

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
      const asteroid = new BaseInstancedMesh(this.engine, {
        geometry: new Geometry(this.engine.gl, { ...gltf.geometry.attributes }),
        material,
        frustumCulled: false,
        instances: numObjects,
        normalMatrix: true,
      });

      for (let i = 0; i < numObjects; i++) {
        let [x, z] = this.prng.sample();
        x += random(-noiseRes / 2, noiseRes / 2);
        z += random(-noiseRes / 2, noiseRes / 2);

        const trs = tempTrs.identity();
        const h = this.noiseRng(x, z) ** 2 * 2;
        const translate = tempTranslate
          .set(x, random(-h, h), z)
          .scale(distanceScale);
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
        trs.scale(Asteroids.getScale());
        asteroid.updateInstanceTrs(trs, i);
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
            asteroid.updateInstanceTrs(trs, i);
          }
        })
      );

      asteroid.setParent(this);
    }

    this.visible = true;
  }

  destroy() {
    this.tasks.forEach((task) => task.cancel());
  }
}
