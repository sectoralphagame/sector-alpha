import type { OGLRenderingContext } from "ogl";
import { Geometry, Vec3 } from "ogl";
import { triangle } from "@core/utils/misc";
import { BaseMesh } from "./engine/BaseMesh";
import { EngineTrailMaterial } from "./materials/engineTrail/engineTrail";

const tempVec3 = new Vec3();
const tempVec32 = new Vec3();
const tempVec33 = new Vec3();
const tempVec34 = new Vec3();
const tempDir = new Vec3();
const tempNormalForward = new Vec3();
const tempNormalBackward = new Vec3();
const up = new Vec3(0, 1, 0);

export class RibbonGeometry extends Geometry {
  readonly maxSegments: number;

  constructor(
    gl: OGLRenderingContext,
    maxSegments: number,
    segments?: Float32Array,
    width = 0.3
  ) {
    const position = new Float32Array(maxSegments * 2 * 3 * 2);
    const uv = new Float32Array(maxSegments * 2 * 2 * 2);
    const index = new Uint16Array(position.length / 3);

    if (segments) {
      RibbonGeometry.build(segments, position, width);
    }

    for (let i = 0; i < index.length; i++) {
      index[i] = i;
    }

    for (let i = 0; i < maxSegments * 2; i++) {
      const uvOffset = i * 2 * 2;
      const xStart = triangle(i / maxSegments);
      const xEnd = triangle((i + 1) / maxSegments);

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
    width: number,
    lengthOverride?: number
  ) {
    for (let i = 0; i < (lengthOverride ?? segments.length / 4); i++) {
      const segment = tempVec32.fromArray(
        segments.subarray(i * 4, (i + 1) * 4)
      );
      const prevSegment = tempVec33.fromArray(
        segments.subarray((i - 1) * 4, i * 4)
      );
      const nextSegment = tempVec34.fromArray(
        segments.subarray((i + 1) * 4, (i + 2) * 4)
      );

      const dir = tempDir.copy(nextSegment).sub(segment).normalize();
      const normalForward = tempNormalForward.cross(dir, up).normalize();
      const dirBackward = tempDir.copy(segment).sub(prevSegment).normalize();
      const normalBackward = tempNormalBackward
        .cross(dirBackward, up)
        .normalize();

      let normal = normalForward;
      if (i === segments.length / 4 - 1) {
        normal = normalBackward;
      } else if (i > 0) {
        normal = normalForward.add(normalBackward).scale(0.5).normalize();
      }
      normal.multiply(width);

      const vertOffset = i * 3 * 2;
      position.set(tempVec3.copy(segment).add(normal), vertOffset);
      position.set(tempVec3.copy(segment).sub(normal), vertOffset + 3);

      normal.copy(up).scale(width);

      position.set(
        tempVec3.copy(segment).add(normal),
        position.length - 3 - vertOffset
      );
      position.set(
        tempVec3.copy(segment).sub(normal),
        position.length - 3 - (vertOffset + 3)
      );
    }
  }

  static addSegment(
    segments: Float32Array,
    position: Float32Array,
    width: number
  ) {
    position.set(position.subarray(0, position.length / 2 - 3 * 4), 3 * 4);
    position.set(
      position.subarray(position.length / 2 + 3 * 4),
      position.length / 2
    );
    RibbonGeometry.build(segments, position, width, 3);
  }
}

export class RibbonEmitter extends BaseMesh<EngineTrailMaterial> {
  trackedEntity: BaseMesh;
  segments: Float32Array;
  offset: Vec3;
  width = 0.3;
  maxSegments = 25;
  initialised = false;

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
      mode: trackedEntity.engine.gl.TRIANGLE_STRIP,
    });
    this.maxSegments = maxSegments;
    this.width = width;
    this.trackedEntity = trackedEntity;
    this.offset = offset || new Vec3();
    this.engine = trackedEntity.engine;
    this.segments = new Float32Array(maxSegments * 4);
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

    RibbonGeometry.addSegment(
      this.segments,
      this.geometry.attributes.position.data! as Float32Array,
      this.width * this.trackedEntity.scale.x
    );

    this.geometry.attributes.position.needsUpdate = true;
  }
}
