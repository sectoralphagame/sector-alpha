import { BaseInstancedMesh } from "@ogl-engine/engine/BaseInstancedMesh";
import { BoundingBox } from "@ogl-engine/engine/BoundingBox";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { AsteroidDustMaterial } from "@ogl-engine/materials/asteroidDust/asteroidDust";
import { getPane } from "@ui/context/Pane";
import { Mat4, Plane, Quat, Vec3 } from "ogl";
import type { FolderApi } from "tweakpane";

const emptyQuat = new Quat();

export class DustCloud extends BaseInstancedMesh<AsteroidDustMaterial> {
  name = "DustCloud";
  size: number;
  density: number;

  paneFolder: FolderApi;

  constructor(engine: Engine3D, size: number, density: number) {
    super(engine, {
      geometry: new Plane(engine.gl),
      material: new AsteroidDustMaterial(engine, "prop/smoke", {
        color: "#ffffff",
        emissive: 0,
        alpha: 0.3,
      }),
    });

    this.engine = engine;
    this.size = size;
    this.density = density;

    const planes = Math.floor(size ** 2 * 2 * this.density);
    this.geometry.setInstancedCount(planes);
    this.geometry.isInstanced = true;
    this.geometry.addAttribute("instanceMatrix", {
      instanced: true,
      size: 16,
      data: new Float32Array(planes * 16),
      usage: this.engine.gl.DYNAMIC_DRAW,
    });
    this.geometry.addAttribute("instanceIndex", {
      instanced: true,
      size: 1,
      data: new Uint16Array(planes).map((_, i) => i),
    });
    this.frustumCulled = false;

    const pos = new Vec3();
    const scale = new Vec3();
    const trs = new Mat4();

    for (let i = 0; i < planes; i++) {
      do {
        pos.x = Math.random() * this.size * 2 - this.size;
        pos.y = (Math.random() * this.size * 2 - this.size) / this.size;
        pos.z = Math.random() * this.size * 2 - this.size;
      } while (pos.x ** 2 + pos.z ** 2 > this.size ** 2);

      const factor = Math.random() > 0.7 ? 12 : 5;
      scale.set(
        (Math.random() * 0.5 + 0.5) * factor * (Math.random() > 0.5 ? 1 : -1),
        (Math.random() * 0.5 + 0.5) * factor * (Math.random() > 0.5 ? 1 : -1),
        (Math.random() * 0.5 + 0.5) * factor * (Math.random() > 0.5 ? 1 : -1)
      );

      trs
        .compose(emptyQuat, pos, scale)
        .toArray(this.geometry.attributes.instanceMatrix.data!, i * 16);
    }
    this.geometry.attributes.instanceMatrix.needsUpdate = true;
    this.setParent(this);
  }

  createPaneFolder() {
    this.paneFolder = getPane().addOrReplaceFolder({
      title: this.name,
    });

    this.material.createPaneSettings(this.paneFolder);

    this.onDestroyCallbacks.push(() => {
      this.paneFolder.dispose();
    });
  }

  override updateMatrixWorld(force: boolean) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.worldMatrixNeedsUpdate || force) {
      if (this.parent === null) this.worldMatrix.copy(this.matrix);
      else {
        const translation = new Vec3();
        this.parent.worldMatrix.getTranslation(translation);
        const scale = new Vec3();
        this.parent.worldMatrix.getScaling(scale);

        this.worldMatrix
          .compose(emptyQuat, translation, scale)
          .multiply(this.matrix);
      }
      this.worldMatrixNeedsUpdate = false;
      force = true;
    }

    for (let i = 0, l = this.children.length; i < l; i++) {
      this.children[i].updateMatrixWorld(force);
    }
  }

  addBoundingBox() {
    if (this.children.some((child) => child instanceof BoundingBox)) return;

    if (!this.geometry.bounds) {
      if (!this.geometry.bounds) {
        this.geometry.bounds = {
          min: new Vec3(-this.size, -1, -this.size),
          max: new Vec3(this.size, 1, this.size),
          center: new Vec3(),
          scale: new Vec3(),
          radius: Infinity,
        };
      }

      const min = this.geometry.bounds.min;
      const max = this.geometry.bounds.max;
      const center = this.geometry.bounds.center;
      const scale = this.geometry.bounds.scale;

      scale.sub(max, min);
      center.add(min, max).divide(2);

      const bbox = new BoundingBox(this.gl, this.geometry.bounds);

      bbox.setParent(this);
    }
  }
}
