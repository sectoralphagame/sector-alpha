import { Transform } from "ogl";
import type { Engine } from "./engine";
import type { BaseMesh2D } from "./BaseMesh2D";

export class Scene extends Transform {
  engine: Engine;
  name = "Scene";

  constructor(engine: Engine) {
    super();

    this.engine = engine;
  }
}

export class StrategicMapScene extends Transform {
  engine: Engine;
  name = "Scene";

  entities: Transform & { children: BaseMesh2D[] };
  sectors: Transform;

  constructor(engine: Engine) {
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
