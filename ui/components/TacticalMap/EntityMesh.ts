import type { DockSize } from "@core/components/dockable";
import type { RequireComponent } from "@core/tsHelpers";
import { assetLoader } from "@ogl-engine/AssetLoader";
import type { Engine } from "@ogl-engine/engine/engine";
import { SelectionRing } from "@ogl-engine/materials/ring/ring";
import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import { SimplePbrMaterial } from "@ogl-engine/materials/simplePbr/simplePbr";

export class EntityMesh extends BaseMesh {
  engine: Engine;
  entityId: number;
  ring: SelectionRing | null = null;
  selected = false;

  constructor(engine: Engine, entity: RequireComponent<"render">) {
    super(engine, {
      geometry: assetLoader.model(entity.cp.render.model).geometry,
    });
    this.applyMaterial(
      new SimplePbrMaterial(
        engine,
        assetLoader.model(entity.cp.render.model).material
      )
    );

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
