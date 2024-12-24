import type { DockSize } from "@core/components/dockable";
import type { RequireComponent } from "@core/tsHelpers";
import type { ParticleGeneratorInput } from "@ogl-engine/AssetLoader";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { SelectionRing } from "@ogl-engine/materials/ring/ring";
import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import { SimplePbrMaterial } from "@ogl-engine/materials/simplePbr/simplePbr";
import type { EngineParticleGenerator } from "@ogl-engine/particles";
import { getParticleType, particleGenerator } from "@ogl-engine/particles";
import { Light } from "@ogl-engine/engine/Light";
import Color from "color";
import { Plane, Vec3 } from "ogl";
import { ship } from "@core/archetypes/ship";
import { EntityIndicatorMaterial } from "@ogl-engine/materials/entityIndicator/entityIndicator";
import type { Engine3D } from "@ogl-engine/engine/engine3d";

export const entityScale = 1 / 220;
// FIXME: Remove after distance rebalancing
const scale = 2;

export class EntityIndicator extends BaseMesh<EntityIndicatorMaterial> {
  name = "EntityIndicator";
  parent: EntityMesh;

  constructor(engine: Engine3D) {
    super(engine, {
      geometry: new Plane(engine.gl),
    });
    this.applyMaterial(new EntityIndicatorMaterial(engine));
    this.frustumCulled = false;
  }

  override setParent(parent: EntityMesh) {
    super.setParent(parent);
  }
}

export class EntityMesh extends BaseMesh {
  engine: Engine3D;
  entityId: number;
  entity: RequireComponent<"render" | "position">;
  name = "EntityMesh";
  ring: SelectionRing | null = null;
  selected = false;
  indicator: EntityIndicator;

  constructor(
    engine: Engine3D,
    entity: RequireComponent<"render" | "position">
  ) {
    const gltf = assetLoader.model(entity.cp.render.model);

    super(engine, {
      geometry: gltf.geometry,
    });
    this.applyMaterial(new SimplePbrMaterial(engine, gltf.material));

    this.engine = engine;
    this.scale.set(entityScale);
    this.position.y = Math.random() * 5;
    this.entityId = entity.id;
    this.entity = entity;
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

    this.updatePosition();

    if (entity.tags.has("selection")) {
      this.addRing(entity.cp.render.color, entity.cp.dockable?.size ?? "large");
    }

    this.indicator = new EntityIndicator(engine);
    this.indicator.setParent(this);
    this.indicator.material.setColor(entity.cp.render.color);
    this.indicator.material.setSize(entity.cp.dockable?.size ?? "large");
  }

  updatePosition() {
    this.position.set(
      this.entity.cp.position.coord[0] * scale,
      0,
      this.entity.cp.position.coord[1] * scale
    );
    this.rotation.y = -this.entity.cp.position.angle;
    this.visible = !this.entity.cp.render.hidden;
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

    const onUpdate = (delta: number) => {
      generator.update(delta);

      if (type === "engine") {
        const gen = generator as any as EngineParticleGenerator;
        const e = ship(window.sim.getOrThrow(this.entityId));

        gen.setIntensity(e.cp.movable.velocity / e.cp.drive.maneuver);
      }
    };
    this.engine.hooks.onUpdate.subscribe(this.name, onUpdate);
    this.onDestroyCallbacks.push(() => {
      this.engine.hooks.onUpdate.unsubscribe(onUpdate);
    });
  }

  setSelected = (selected: boolean) => {
    this.selected = selected;
    this.ring?.setSelected(selected);
  };
}
