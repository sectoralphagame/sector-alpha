import type { DockSize } from "@core/components/dockable";
import type { RequireComponent } from "@core/tsHelpers";
import { assetLoader } from "@ogl-engine/AssetLoader";
import type { Engine } from "@ogl-engine/engine/engine";
import { createBasicProgram } from "@ogl-engine/loaders/basic/basic";
import { SelectionRing } from "@ogl-engine/loaders/ring/ring";
import { Mesh } from "ogl";

export class EntityMesh extends Mesh {
  engine: Engine;
  entityId: number;
  ring: SelectionRing | null = null;
  selected = false;

  constructor(engine: Engine, entity: RequireComponent<"render">) {
    super(engine.gl, {
      geometry: assetLoader.model(entity.cp.render.model).geometry,
      program: createBasicProgram(
        engine,
        assetLoader.model(entity.cp.render.model).material
      ),
    });

    this.engine = engine;
    this.scale.set(1 / 220);
    this.position.y = Math.random() * 5;
    this.entityId = entity.id;

    if (entity.tags.has("selection")) {
      this.addRing(entity.cp.render.color, entity.cp.dockable?.size ?? "large");
    }
  }

  addRing = (color: number, size: DockSize) => {
    this.ring = new SelectionRing(
      this.engine,
      color,
      Math.max(...this.geometry.bounds.max) * 1.8,
      size
    );
    this.ring.position.set(this.geometry.bounds.center);
    this.ring.position.y -= 10;
    this.addChild(this.ring);
  };

  setSelected = (selected: boolean) => {
    this.selected = selected;
    this.ring?.setSelected(selected);
  };
}
