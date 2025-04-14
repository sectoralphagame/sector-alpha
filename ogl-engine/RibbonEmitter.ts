import type { OGLRenderingContext } from "ogl";
import { Geometry, Vec3 } from "ogl";
import { BaseMesh } from "./engine/BaseMesh";
import type { Engine3D } from "./engine/engine3d";
import type { Destroyable } from "./types";
import { EngineTrailMaterial } from "./materials/engineTrail/engineTrail";

const tempVec3 = new Vec3();
const tempVec32 = new Vec3();

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
    const normal = new Float32Array((maxSegments - 1) * 4 * 3);

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
      normal: {
        data: normal,
        size: 3,
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

      const dir = new Vec3()
        .fromArray(nextSegment)
        .sub(tempVec32.set(segment[0], segment[1], segment[2]))
        .normalize();
      const normal = new Vec3()
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

export class RibbonEmitter implements Destroyable {
  engine: Engine3D;
  parent: BaseMesh;
  segments: Float32Array;
  readonly maxSegments: number = 25;
  offset: Vec3;
  mesh: BaseMesh<EngineTrailMaterial>;
  onDestroyCallbacks: (() => void)[] = [];

  constructor(parent: BaseMesh, offset?: Vec3) {
    this.parent = parent;
    this.offset = offset || new Vec3();
    this.engine = parent.engine;
    this.mesh = new BaseMesh(this.engine, {
      frustumCulled: false,
      name: "RibbonEmitter",
      geometry: new RibbonGeometry(this.engine.gl, this.maxSegments),
      material: new EngineTrailMaterial(this.engine, "#ff00ff"),
      calculateTangents: false,
    });
    this.segments = new Float32Array(this.maxSegments * 4);

    this.mesh.setParent(this.engine.scene);
    this.mesh.onBeforeRender(() => {
      this.update(this.engine.delta);
    });

    const updateFn = this.update.bind(this);
    this.engine.hooks.onUpdate.subscribe("RibbonEmitter", updateFn);
    this.onDestroyCallbacks.push(() => {
      this.engine.hooks.onUpdate.unsubscribe(updateFn);
      this.mesh.destroy();
      this.mesh.setParent(null);
    });
  }

  update(delta: number) {
    if (delta) {
      if (this.segments.length > 0) {
        this.spawnSegment();
      } else {
        for (let i = 0; i < this.maxSegments; i++) {
          this.spawnSegment();
        }
      }
    }

    this.updateGeometry();
  }

  spawnSegment() {
    this.segments.set(this.segments.subarray(0, (this.maxSegments - 1) * 4), 4);
    const position = tempVec3
      .copy(this.offset)
      .applyMatrix4(this.parent.worldMatrix);

    this.segments.set(
      [position.x, position.y, position.z, this.engine.uniforms.uTime.value],
      0
    );
  }

  updateGeometry() {
    if (this.segments.length < 2) return;

    RibbonGeometry.build(
      this.segments,
      this.mesh.geometry.attributes.position.data! as Float32Array,
      this.parent.position.clone().sub(this.engine.camera.position).normalize(),
      0.3 * this.parent.scale.x
    );

    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  destroy() {
    for (const cb of this.onDestroyCallbacks) {
      cb();
    }
  }
}
