import type { OGLRenderingContext } from "ogl";
import { Geometry, Vec3 } from "ogl";
import { BaseMesh } from "./engine/BaseMesh";
import { EngineTrailMaterial } from "./materials/engineTrail/engineTrail";
import type { OnBeforeRenderTask } from "./engine/task";

const tempVec3 = new Vec3();
const tempVec32 = new Vec3();
const tempDir = new Vec3();
const tempNormal = new Vec3();

export class RibbonGeometry extends Geometry {
  readonly maxSegments: number;

  constructor(
    gl: OGLRenderingContext,
    maxSegments: number,
    segments?: Float32Array,
    width = 0.3
  ) {
    const position = new Float32Array((maxSegments - 1) * 4 * 3);
    const uv = new Float32Array((maxSegments - 1) * 4 * 2);
    const index = new Uint16Array((maxSegments - 1) * 6);

    if (segments) {
      RibbonGeometry.build(segments, position, new Vec3(0, 1, 0), width);
    }

    for (let i = 0; i < maxSegments - 1; i++) {
      index.set(
        [i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 2, i * 4 + 3, i * 4 + 1],
        i * 6
      );

      const uvOffset = i * 2 * 4;
      const xStart = i / (maxSegments - 1);
      const xEnd = (i + 1) / (maxSegments - 1);

      uv[uvOffset] = xStart;
      uv[uvOffset + 1] = 0;
      uv[uvOffset + 2] = xStart;
      uv[uvOffset + 3] = 1;
      uv[uvOffset + 4] = xEnd;
      uv[uvOffset + 5] = 0;
      uv[uvOffset + 6] = xEnd;
      uv[uvOffset + 7] = 1;
    }

    super(gl, {
      position: {
        data: position,
        size: 3,
        usage: gl.DYNAMIC_DRAW,
      },
      uv: {
        data: uv,
        size: 2,
      },
      index: {
        data: index,
        size: 1,
      },
    });

    this.maxSegments = maxSegments;
  }

  static build(
    segments: Float32Array,
    position: Float32Array,
    cameraDirection: Vec3,
    width: number
  ) {
    const length = segments.length / 4;
    for (let i = 0; i < length - 1; i++) {
      const segment = segments.subarray(i * 4, i * 4 + 4);
      const nextSegment = segments.subarray((i + 1) * 4, (i + 1) * 4 + 4);

      const dir = tempDir
        .fromArray(nextSegment)
        .sub(tempVec32.set(segment[0], segment[1], segment[2]))
        .normalize();
      const normal = tempNormal
        .cross(dir, cameraDirection)
        .normalize()
        .multiply(width);

      const vertOffset = i * 3 * 4;
      position.set(tempVec3.set(tempVec32).add(normal), vertOffset);
      position.set(tempVec3.set(tempVec32).sub(normal), vertOffset + 3);
      position.set(tempVec3.fromArray(nextSegment).add(normal), vertOffset + 6);
      position.set(tempVec3.fromArray(nextSegment).sub(normal), vertOffset + 9);
    }
  }
}

export class RibbonEmitter extends BaseMesh<EngineTrailMaterial> {
  trackedEntity: BaseMesh;
  segments: Float32Array;
  offset: Vec3;
  width = 0.3;
  maxSegments = 25;
  initialised = false;
  task: OnBeforeRenderTask;

  constructor(
    trackedEntity: BaseMesh,
    offset: Vec3,
    width: number,
    maxSegments: number
  ) {
    super(trackedEntity.engine, {
      frustumCulled: false,
      name: "RibbonEmitter",
      geometry: new RibbonGeometry(trackedEntity.engine.gl, maxSegments),
      material: new EngineTrailMaterial(trackedEntity.engine, "#ff00ff"),
      calculateTangents: false,
    });
    this.maxSegments = maxSegments;
    this.width = width;
    this.trackedEntity = trackedEntity;
    this.offset = offset || new Vec3();
    this.engine = trackedEntity.engine;
    this.segments = new Float32Array(maxSegments * 4);

    this.task = this.engine.addOnBeforeRenderTask(() => {
      this.update(this.engine.delta);
    });
  }

  update(delta: number) {
    this.setVisibility(this.trackedEntity.visible);
    if (!this.initialised) {
      for (let i = 0; i < this.maxSegments; i++) {
        this.spawnSegment();
      }
      this.initialised = true;
    } else if (delta) {
      this.spawnSegment();
    }

    if (this.trackedEntity.visible) this.updateGeometry();
  }

  spawnSegment() {
    this.segments.set(this.segments.subarray(0, (this.maxSegments - 1) * 4), 4);
    const position = tempVec3
      .copy(this.offset)
      .applyMatrix4(this.trackedEntity.worldMatrix);

    this.segments.set(
      [position.x, position.y, position.z, this.engine.uniforms.uTime.value],
      0
    );
  }

  updateGeometry() {
    if (this.segments.length < 2) return;

    RibbonGeometry.build(
      this.segments,
      this.geometry.attributes.position.data! as Float32Array,
      tempVec3
        .copy(this.trackedEntity.position)
        .sub(this.engine.camera.position)
        .normalize(),
      this.width * this.trackedEntity.scale.x
    );

    this.geometry.attributes.position.needsUpdate = true;
  }

  destroy() {
    this.task.cancel();
  }
}
