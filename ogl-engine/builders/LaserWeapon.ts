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
const tempScale = new Vec3();

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
    this.rotation.x = Math.PI / 2;
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
  id: number;
  startedAt: number;
  task: OnBeforeRenderTask | null = null;
  duration = 0.5; // seconds
  width: number;
  beam: Beam;
  exhaust: Exhaust;
  engine: Engine3D;
  name = "LaserWeaponEffect";
  target = defaultTarget;

  constructor(engine: Engine3D, opts: LaserWeaponOpts & { id: number }) {
    super();
    this.engine = engine;
    this.id = opts.id;
    this.startedAt = engine.uniforms.uTime.value;
    this.width = opts.width;
    this.beam = new Beam(engine, opts);
    this.beam.setParent(this);
    this.exhaust = new Exhaust(engine, opts);
    this.exhaust.setParent(this);
  }

  fire() {
    if (this.task) return;

    this.startedAt = this.engine.uniforms.uTime.value;

    this.task = this.engine.addOnBeforeRenderTask(() => {
      const t =
        (this.engine.uniforms.uTime.value - this.startedAt) / this.duration;
      const p = timeline(t);
      this.beam.material.uniforms.uIntensity.value = p;
      this.exhaust.material.uniforms.uIntensity.value = p;

      this.lookAt(this.target, false, true);
      const worldPosition = tempVec3;
      const scale = tempScale;
      this.worldMatrix.getTranslation(worldPosition);
      this.parent!.worldMatrix.getScaling(scale);
      this.scale.set(
        this.width,
        this.width,
        worldPosition.distance(this.target) / scale.z
      );
      this.beam.material.uniforms.uAspectRatio.value =
        this.scale.z / this.width;

      const exhaustSize =
        (this.width *
          (1 + Math.sin(this.engine.uniforms.uTime.value * 80) * 0.025 * p)) /
        4;
      this.exhaust.scale.set(
        exhaustSize,
        exhaustSize,
        (exhaustSize / this.scale.z) * this.width
      );

      if (t >= 1) {
        this.task!.cancel();
        this.task = null;
      }
    });
  }

  setTarget(target: Vec3) {
    this.target = target;
  }

  destroy(): void {
    this.task?.cancel();
  }

  override lookAt(target: Vec3, invert = false, useWorldMatrix = false) {
    if (useWorldMatrix) {
      const invWorldMatrix = tempMat4.copy(this.parent!.worldMatrix).inverse();
      const locaTarget = tempVec3.copy(target).applyMatrix4(invWorldMatrix);

      super.lookAt(locaTarget, invert);
    } else {
      super.lookAt(target, invert);
    }
  }
}
