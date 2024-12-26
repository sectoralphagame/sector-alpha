import { Transform } from "ogl";
import type { Engine } from "./engine";

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

  sectors: Transform;

  constructor(engine: Engine) {
    super();

    this.engine = engine;
    this.sectors = new Transform();
    this.sectors.name = "Sectors";
    this.sectors.setParent(this);
  }

  getSector(id: number) {
    return this.sectors.children.find(
      (sector) => sector.name === `Sector:${id}`
    );
  }
}
