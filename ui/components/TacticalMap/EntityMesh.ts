import type { DockSize } from "@core/components/dockable";
import type { RequireComponent } from "@core/tsHelpers";
import type { ParticleGeneratorInput } from "@ogl-engine/AssetLoader";
import { assetLoader } from "@ogl-engine/AssetLoader";
import type { Engine } from "@ogl-engine/engine/engine";
import { SelectionRing } from "@ogl-engine/materials/ring/ring";
import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import { SimplePbrMaterial } from "@ogl-engine/materials/simplePbr/simplePbr";
import type { EngineParticleGenerator } from "@ogl-engine/particles";
import { getParticleType, particleGenerator } from "@ogl-engine/particles";
import { Light } from "@ogl-engine/engine/Light";
import Color from "color";
import { Vec3 } from "ogl";
import { ship } from "@core/archetypes/ship";

export const entityScale = 1 / 220;

export class EntityMesh extends BaseMesh {
  engine: Engine;
  entityId: number;
  name = "EntityMesh";
  ring: SelectionRing | null = null;
  selected = false;

  constructor(engine: Engine, entity: RequireComponent<"render">) {
    const gltf = assetLoader.model(entity.cp.render.model);

    super(engine, {
      geometry: gltf.geometry,
    });
    this.applyMaterial(new SimplePbrMaterial(engine, gltf.material));

    this.engine = engine;
    this.scale.set(entityScale);
    this.position.y = Math.random() * 5;
    this.entityId = entity.id;
    this.name = `EntityMesh:${entity.id}`;

    if (gltf.particles) {
      for (const input of gltf.particles) {
        this.addParticleGenerator(input);

        // FIXME: add this as a child after light refactor
        if (input.name.includes("hyperslingshot")) {
          const light = new Light(
            new Vec3(...Color("#fffd8c").array()),
            0.1,
            false
          );
          this.addChild(light);
          this.engine.addLight(light);
        }
      }
    }

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

  addParticleGenerator(input: ParticleGeneratorInput) {
    const type = getParticleType(input.name)!;
    const PGen = particleGenerator[type];
    const generator = new PGen(this.engine);
    generator.position.copy(input.position);
    generator.rotation.copy(input.rotation);
    generator.scale.copy(input.scale).multiply(1 / entityScale);
    generator.setParent(this);
    generator.updateMatrixWorld();

    this.onBeforeRender(() => {
      generator.update(this.engine.delta);

      if (type === "engine") {
        const gen = generator as any as EngineParticleGenerator;
        const e = ship(window.sim.getOrThrow(this.entityId));

        gen.setIntensity(e.cp.movable.velocity / e.cp.drive.maneuver);
      }
    });
  }

  setSelected = (selected: boolean) => {
    this.selected = selected;
    this.ring?.setSelected(selected);
  };
}
