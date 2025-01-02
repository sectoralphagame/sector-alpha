import { Transform } from "ogl";
import type { Skybox } from "@ogl-engine/materials/skybox/skybox";
import type { Engine } from "./engine";
import type { BaseMesh2D } from "./BaseMesh2D";

export class Scene extends Transform {
  engine: Engine<any>;
  name = "Scene";

  constructor(engine: Engine<any>) {
    super();

    this.engine = engine;
  }
}

export class TacticalMapScene extends Scene {
  entities: Transform & { children: BaseMesh2D[] };
  props: Transform;
  ui: Transform;
  skybox: Skybox;

  constructor(engine: Engine<TacticalMapScene>) {
    super(engine);

    this.entities = new Transform() as Omit<Transform, "children"> & {
      children: BaseMesh2D[];
    };
    this.entities.name = "Entities";
    this.entities.setParent(this);

    this.props = new Transform();
    this.props.name = "Props";
    this.props.setParent(this);

    this.ui = new Transform();
    this.ui.name = "UI";
    this.ui.setParent(this);
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
}

export class StrategicMapScene extends Transform {
  engine: Engine<StrategicMapScene>;
  name = "Scene";

  entities: Transform & { children: BaseMesh2D[] };
  sectors: Transform;

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

  getEntity(id: number) {
    return this.entities.children.find(
      (entity) => entity.name === `Entity:${id}`
    );
  }
}
