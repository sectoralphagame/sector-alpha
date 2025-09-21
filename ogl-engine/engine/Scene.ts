import { Plane, Transform } from "ogl";
import type { Skybox } from "@ogl-engine/materials/skybox/skybox";
import type { EntityMesh } from "@ui/components/TacticalMap/EntityMesh";
import type { FolderApi } from "tweakpane";
import { getPane } from "@ui/context/Pane";
import type { Destroyable } from "@ogl-engine/types";
import { GridMaterial } from "@ogl-engine/materials/Grid/Grid";
import type { Engine } from "./engine";
import type { BaseMesh2D } from "./BaseMesh2D";
import type { Engine3D } from "./engine3d";
import { BaseMesh } from "./BaseMesh";

function isDestroyable(mesh: Transform): mesh is Transform & Destroyable {
  return !!(mesh as any).destroy;
}

export class Scene extends Transform {
  engine: Engine<any>;
  name = "Scene";

  constructor(engine: Engine<any>) {
    super();

    this.engine = engine;
  }
}

export class TacticalMapScene extends Scene {
  engine: Engine3D;
  entities: Transform & { children: EntityMesh[] };
  props: Transform;
  ui: Transform;
  skybox: Skybox;

  pane: FolderApi;

  constructor(engine: Engine<TacticalMapScene>) {
    super(engine);

    this.entities = new Transform() as Omit<Transform, "children"> & {
      children: EntityMesh[];
    };
    this.entities.name = "Entities";
    this.entities.setParent(this);

    this.props = new Transform();
    this.props.name = "Props";
    this.props.setParent(this);

    this.ui = new Transform();
    this.ui.name = "UI";
    this.ui.setParent(this);

    this.initPane();
  }

  getEntity(id: number) {
    return this.entities.children.find(
      (entity) => entity.name === `Entity:${id}`
    );
  }

  getProp(name: string) {
    return this.props.children.find((prop) => prop.name === name);
  }

  addSkybox(skybox: Skybox) {
    this.skybox = skybox;
    this.skybox.setParent(this);
  }

  addGrid() {
    const grid = new BaseMesh(this.engine, {
      geometry: new Plane(this.engine.gl),
      material: new GridMaterial(this.engine),
    });
    grid.name = "Grid";
    grid.scale.set(1000);
    grid.rotation.x = -Math.PI / 2;
    this.ui.addChild(grid);
  }

  initPane() {
    this.pane = getPane().addOrReplaceFolder({
      title: "Post Processing",
    });
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.godrays.uWeight,
      "value",
      {
        label: "God Rays Weight",
      }
    );
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.godrays.uDensity,
      "value",
      {
        label: "God Rays Density",
      }
    );
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.godrays.uDecay,
      "value",
      {
        label: "God Rays Decay",
        max: 1,
        min: 0.2,
      }
    );
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.godrays.uExposure,
      "value",
      {
        label: "God Rays Exposure",
      }
    );
    this.pane.addBinding(this.engine.kawase, "iterations", {
      label: "Bloom Iterations",
      min: 2,
      max: 5,
      step: 1,
    });
    this.pane.addBinding(this.engine.kawase, "samplePosMult", {
      label: "Bloom Spread",
      min: 0,
      max: 5,
    });
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.bloom.uGain,
      "value",
      {
        label: "Bloom Strength",
      }
    );
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.vignette.uStrength,
      "value",
      {
        label: "Vignette Strength",
      }
    );
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.vignette.uSmoothness,
      "value",
      {
        label: "Vignette Smoothness",
      }
    );
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.vignette.uOffset,
      "value",
      {
        label: "Vignette Offset",
      }
    );
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.tonemapping.uGamma,
      "value",
      {
        label: "Gamma",
        min: 0.5,
        max: 2.2,
      }
    );
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.tonemapping.uContrast,
      "value",
      {
        label: "Contrast",
        min: 0.5,
        max: 2,
      }
    );
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.tonemapping.uSaturation,
      "value",
      {
        label: "Saturation",
        min: 0.5,
        max: 2,
      }
    );
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.tonemapping.uExposure,
      "value",
      {
        label: "Exposure",
        min: 0.5,
        max: 2.5,
      }
    );
    this.pane.addBinding(
      this.engine.uniforms.env.postProcessing.tonemapping.uMap,
      "value",
      {
        label: "Tonemapping Enabled",
        min: 0,
        max: 1,
      }
    );
  }

  destroy() {
    this.pane.dispose();
    this.engine.clearLights();
    this.traverse((mesh) => {
      if (mesh === this) return;

      if (isDestroyable(mesh)) {
        mesh.destroy();
      }
    });
  }
}

export class StrategicMapScene extends Transform {
  engine: Engine<StrategicMapScene>;
  name = "Scene";

  entities: Transform & { children: BaseMesh2D[] };
  sectors: Transform;

  private entityMap = new Map<number, BaseMesh2D>();

  constructor(engine: Engine<StrategicMapScene>) {
    super();

    this.engine = engine;
    this.sectors = new Transform();
    this.sectors.name = "Sectors";
    this.sectors.setParent(this);

    this.entities = new Transform() as Omit<Transform, "children"> & {
      children: BaseMesh2D[];
    };
    this.entities.name = "Entities";
    this.entities.setParent(this);
  }

  getSector(id: number) {
    return this.sectors.children.find(
      (sector) => sector.name === `Sector:${id}`
    );
  }

  addEntity(entity: BaseMesh2D, id: number) {
    this.entities.addChild(entity);
    this.entityMap[id] = entity;
  }

  removeEntity(id: number) {
    const mesh = this.getEntity(id);
    if (mesh) {
      mesh.setParent(null);
    }
    this.entityMap.delete(id);
  }

  getEntity(id: number) {
    return this.entityMap[id];
  }
}
