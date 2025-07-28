import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import { CrossGeometry } from "@ogl-engine/engine/CrossGeometry";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import type { OnBeforeRenderTask } from "@ogl-engine/engine/task";
import { LaserMaterial } from "@ogl-engine/materials/laser/laser";
import { LaserImpactMaterial } from "@ogl-engine/materials/laserImpact/laserImpact";
import type { Destroyable } from "@ogl-engine/types";
import { createTimeline } from "@ogl-engine/utils/timeline";
import { Mat4, Sphere, Transform, Vec3 } from "ogl";

const tempMat4 = new Mat4();
const tempWorldMatrix = new Mat4();

interface LaserWeaponOpts {
  color: string;
  width: number;
}

const timeline = createTimeline([
  [0, 0],
  [0.2, 0.01],
  [0.35, 1],
  [0.55, 1],
  [0.85, 0.1],
  [1, 0],
]);

const tempVec3 = new Vec3();
const defaultTarget = new Vec3();

class Beam extends BaseMesh<LaserMaterial> {
  name = "Beam";

  constructor(engine: Engine3D, opts: LaserWeaponOpts) {
    super(engine, {
      geometry: new CrossGeometry(engine.gl),
      material: new LaserMaterial(engine, opts),
    });
    this.material.uniforms.uIntensity.value = 0;
    this.position.z += 0.5;
    this.rotation.x -= Math.PI / 2;
  }
}

// class Impact extends BaseMesh<LaserMaterial> {
//   name = "Impact";

//   constructor(engine: Engine3D, opts: LaserWeaponOpts) {
//     super(engine, {
//       geometry: new CrossGeometry(engine.gl),
//       material: new LaserMaterial(engine, opts),
//     });
//     this.material.uniforms.uIntensity.value = 0;
//     this.position.z += 0.5;
//     this.rotation.x -= Math.PI / 2;
//   }
// }

class Exhaust extends BaseMesh<LaserImpactMaterial> {
  name = "Exhaust";

  constructor(engine: Engine3D, opts: LaserWeaponOpts) {
    super(engine, {
      geometry: new Sphere(engine.gl),
      material: new LaserImpactMaterial(engine, opts),
    });
    this.material.uniforms.uIntensity.value = 0;
    // this.rotation.x -= Math.PI / 2;
  }
}

export class LaserWeaponEffect extends Transform implements Destroyable {
  startedAt: number;
  task: OnBeforeRenderTask;
  duration = 2.5; // seconds
  width: number;
  beam: Beam;
  exhaust: Exhaust;
  engine: Engine3D;
  name = "LaserWeaponEffect";
  target = defaultTarget;

  constructor(engine: Engine3D, opts: LaserWeaponOpts) {
    super();
    this.engine = engine;
    this.startedAt = engine.uniforms.uTime.value;
    this.width = opts.width;
    this.beam = new Beam(engine, opts);
    this.beam.setParent(this);
    this.exhaust = new Exhaust(engine, opts);
    this.exhaust.setParent(this);

    this.task = engine.addOnBeforeRenderTask(() => {
      const t = (engine.uniforms.uTime.value - this.startedAt) / this.duration;
      const p = timeline(t);
      this.beam.material.uniforms.uIntensity.value = p;
      this.exhaust.material.uniforms.uIntensity.value = p;

      this.lookAt(this.target, false, true);
      const worldPosition = tempVec3;
      this.worldMatrix.getTranslation(worldPosition);
      this.scale.set(
        this.width,
        this.width,
        worldPosition.distance(this.target)
      );
      this.beam.material.uniforms.uAspectRatio.value =
        this.scale.z / this.width;

      const exhaustSize =
        4 *
        this.width *
        (1 + Math.sin(engine.uniforms.uTime.value * 80) * 0.025 * p);
      this.exhaust.scale.set(
        exhaustSize,
        exhaustSize,
        (this.width / worldPosition.distance(this.target)) * exhaustSize * 1.2
      );
    });
  }

  restart() {
    this.startedAt = this.engine.uniforms.uTime.value;
  }

  setTarget(target: Vec3) {
    this.target = target;
  }

  destroy(): void {
    this.task.cancel();
  }

  override lookAt(target: Vec3, invert = false, useWorldMatrix = false) {
    super.lookAt(target, invert);
    if (useWorldMatrix) {
      if (invert) this.matrix.lookAt(this.position, target, this.up);
      else this.matrix.lookAt(target, this.position, this.up);

      // Extract world-space rotation
      // @ts-expect-error
      // eslint-disable-next-line no-underscore-dangle
      this.matrix.getRotation(this.quaternion._target);

      // Convert world rotation to local using inverse of parent world matrix
      const invParentWorld = tempWorldMatrix
        .copy(this.parent!.worldMatrix)
        .inverse();
      const worldRotation = tempMat4.fromQuaternion(this.quaternion);
      worldRotation.multiply(invParentWorld);
      // @ts-expect-error
      // eslint-disable-next-line no-underscore-dangle
      worldRotation.getRotation(this.quaternion._target);

      this.rotation.fromQuaternion(this.quaternion);
    }
  }
}
