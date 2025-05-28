import type { RequireComponent } from "@core/tsHelpers";
import type { ParticleGeneratorInput } from "@ogl-engine/AssetLoader";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import { PbrMaterial } from "@ogl-engine/materials/pbr/pbr";
import { getParticleType, particleGenerator } from "@ogl-engine/particles";
import { Light } from "@ogl-engine/engine/Light";
import { Geometry, Plane, Text, Texture, Vec3 } from "ogl";
import { EntityIndicatorMaterial } from "@ogl-engine/materials/entityIndicator/entityIndicator";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { RibbonEmitter } from "@ogl-engine/RibbonEmitter";
import type { Faction } from "@core/archetypes/faction";
import font from "@assets/fonts/FiraSans/FiraSans-Light.json";
import { EntityNameMaterial } from "@ogl-engine/materials/entityName/entityName";
import type { DockSize } from "@core/components/dockable";
import { taskPriority, type OnBeforeRenderTask } from "@ogl-engine/engine/task";

export const entityScale = 1 / 220;
// FIXME: Remove after distance rebalancing
const scale = 2;

const tempVec3 = new Vec3();

export class EntityIndicator extends BaseMesh<EntityIndicatorMaterial> {
  name = "EntityIndicator";
  parent: EntityMesh;
  nameMesh: BaseMesh<EntityNameMaterial> | null = null;
  private task: OnBeforeRenderTask;

  constructor(engine: Engine3D) {
    super(engine, {
      geometry: new Plane(engine.gl),
      material: new EntityIndicatorMaterial(engine),
      frustumCulled: false,
    });
  }

  override setParent(parent: EntityMesh) {
    super.setParent(parent);
    if (parent.entity?.cp.name)
      this.createNameMesh(parent.entity.cp.name.value);
  }

  setSize(size: DockSize) {
    this.material.setSize(size);
    this.nameMesh?.material.setOffset(size);
  }

  createNameMesh(name: string) {
    const text = new Text({
      font,
      text: name,
      // width: 13,
      align: "center",
      letterSpacing: 0.1,
      size: 1,
      lineHeight: 1.1,
    });

    this.nameMesh = new BaseMesh<EntityNameMaterial>(this.engine, {
      geometry: new Geometry(this.engine.gl, {
        position: {
          size: 3,
          data: text.buffers.position,
        },
        uv: { size: 2, data: text.buffers.uv },
        id: { size: 1, data: text.buffers.id },
        index: { data: text.buffers.index },
      }),
      frustumCulled: false,
    });
    const texture = new Texture(this.engine.gl, {
      generateMipmaps: false,
    });
    assetLoader.loadTexture("font/firaSans").then((img) => {
      texture.image = img;
    });
    this.nameMesh.applyMaterial(new EntityNameMaterial(this.engine, texture));
    this.task = this.engine.addOnBeforeRenderTask(() => {
      this.nameMesh?.setVisibility(
        !!(
          this.material.uniforms.uHovered.value +
          this.material.uniforms.uSelected.value
        ) ||
          this.engine.camera.position.distance(
            tempVec3.copy(this.position).applyMatrix4(this.worldMatrix)
          ) < 10
      );
    });
    this.nameMesh.setParent(this);
  }

  destroy(): void {
    super.destroy();
    this.task.cancel();
  }
}

export class EntityMesh extends BaseMesh {
  engine: Engine3D;
  entityId: number;
  entity: RequireComponent<"render" | "position">;
  name = "EntityMesh";
  selected = false;
  hovered = false;
  indicator: EntityIndicator;
  tasks: OnBeforeRenderTask[] = [];

  constructor(
    engine: Engine3D,
    entity: RequireComponent<"render" | "position">
  ) {
    const gltf = assetLoader.model(entity.cp.render.model);

    super(engine, {
      geometry: gltf.geometry,
    });
    this.applyMaterial(new PbrMaterial(engine, gltf.material));

    this.engine = engine;
    this.scale.set(entityScale);
    this.position.y = Math.random() * 5;
    this.entityId = entity.id;
    this.entity = entity;
    this.name = `EntityMesh:${entity.id}`;

    this.tasks.push(
      this.engine.addOnBeforeRenderTask(
        this.updatePosition.bind(this),
        taskPriority.high
      )
    );

    if (gltf.particles) {
      for (const input of gltf.particles) {
        // FIXME: add this as a child after light refactor
        if (input.name.includes("hyperslingshot")) {
          this.addParticleGenerator(input);
          const light = new Light(2, false);
          light.setColor("#fffd8c");
          this.addChild(light);
          this.engine.addLight(light);
        }

        if (input.name.includes("engine")) {
          const emitter = new RibbonEmitter(
            this,
            input.position,
            input.scale.x * 4,
            { small: 50, medium: 15, large: 10 }[
              entity.cp.dockable?.size ?? "large"
            ]
          );
          const color = entity.cp.owner
            ? entity.sim.getOrThrow<Faction>(entity.cp.owner.id).cp.color.value
            : "#ffffff";
          emitter.material.setColor(color);
          emitter.setParent(this);

          this.onDestroyCallbacks.push(() => {
            emitter.destroy();
            emitter.setParent(null);
          });
        }
      }
    }

    if (entity.tags.has("selection")) {
      this.indicator = new EntityIndicator(engine);
      this.tasks.push(
        this.engine.addOnBeforeRenderTask(() => {
          if (!this.entity.cp.hitpoints) return;

          this.indicator.material.uniforms.uHp.value =
            this.entity.cp.hitpoints.hp.value / this.entity.cp.hitpoints.hp.max;

          if (this.entity.cp.hitpoints.shield) {
            this.indicator.material.uniforms.uShield.value =
              this.entity.cp.hitpoints.shield.value /
              this.entity.cp.hitpoints.shield.max;
          }
        })
      );

      this.indicator.setParent(this);
      this.indicator.material.setColor(entity.cp.render.color);
      this.indicator.setSize(entity.cp.dockable?.size ?? "large");
    }
  }

  updatePosition() {
    this.position.set(
      this.entity.cp.position.coord[0] * scale,
      0,
      this.entity.cp.position.coord[1] * scale
    );
    this.rotation.y = -this.entity.cp.position.angle;
    this.setVisibility(!this.entity.cp.render.hidden);
    this.updateMatrixWorld();
  }

  addParticleGenerator(input: ParticleGeneratorInput) {
    const type = getParticleType(input.name)!;
    const PGen = particleGenerator[type];
    const generator = new PGen(this.engine);
    generator.position.copy(input.position);
    generator.rotation.copy(input.rotation);
    generator.scale.copy(input.scale).multiply(1 / entityScale);
    generator.setParent(this);
    generator.updateMatrixWorld();
  }

  setSelected(selected: boolean) {
    this.selected = selected;
    this.indicator?.material.setSelected(selected);
  }

  setHovered(hovered: boolean) {
    this.hovered = hovered;
    this.indicator?.material.setHovered(hovered);
  }

  destroy(): void {
    super.destroy();
    for (const task of this.tasks) {
      task.cancel();
    }
  }
}
