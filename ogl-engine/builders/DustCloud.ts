import { BaseInstancedMesh } from "@ogl-engine/engine/BaseInstancedMesh";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { AsteroidDustMaterial } from "@ogl-engine/materials/asteroidDust/asteroidDust";
import { getPane } from "@ui/context/Pane";
import { Plane } from "ogl";
import type { FolderApi } from "tweakpane";

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
    this.geometry.addAttribute("offset", {
      instanced: true,
      size: 3,
      data: new Float32Array(planes * 3),
    });
    this.geometry.addAttribute("scale", {
      instanced: true,
      size: 3,
      data: new Float32Array(planes * 3),
    });
    this.geometry.addAttribute("instanceIndex", {
      instanced: true,
      size: 1,
      data: new Uint16Array(planes).map((_, i) => i),
    });
    this.frustumCulled = false;

    for (let i = 0; i < planes; i++) {
      let x: number;
      let y: number;
      let z: number;

      do {
        x = Math.random() * this.size * 2 - this.size;
        y = Math.random() * this.size * 2 - this.size;
        z = Math.random() * this.size * 2 - this.size;
      } while (x ** 2 + z ** 2 > this.size ** 2);

      this.geometry.attributes.offset.data!.set([x, y / this.size, z], i * 3);

      const factor = Math.random() > 0.7 ? 12 : 5;
      this.geometry.attributes.scale.data!.set(
        [
          (Math.random() * 0.5 + 0.5) * factor * (Math.random() > 0.5 ? 1 : -1),
          (Math.random() * 0.5 + 0.5) * factor * (Math.random() > 0.5 ? 1 : -1),
          (Math.random() * 0.5 + 0.5) * factor * (Math.random() > 0.5 ? 1 : -1),
        ],
        i * 3
      );
    }
    this.geometry.attributes.offset.needsUpdate = true;
    this.geometry.attributes.scale.needsUpdate = true;
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
}
